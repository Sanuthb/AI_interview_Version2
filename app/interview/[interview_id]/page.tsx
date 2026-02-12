"use client";

import { useContext, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Vapi from "@vapi-ai/web";
import { toast } from "sonner";
import axios from "axios";
import {
  getCandidateByUserId,
  markMalpractice,
} from "@/lib/services/candidates";
import { getInterviewById } from "@/lib/services/interviews";
import { useAuth } from "@/lib/contexts/auth-context";
import { Candidate, Interview } from "@/lib/types";

import {
  Phone,
  Video,
  VideoOff,
  Mic,
  MicOff,
  BotMessageSquare,
} from "lucide-react";
import AlertConfirmation from "@/components/AlertConfirmation";
import { InterviewContext } from "@/lib/contexts/InterviewContext";
import { ProctoringManager } from "@/components/interview/ProctoringManager";

import { useInterviewRecorder } from "@/hooks/useInterviewRecorder";
import { RecordingConsentModal } from "@/components/interview/RecordingConsentModal";
import { RecordingIndicator } from "@/components/interview/RecordingIndicator";

export default function Page() {
  const { user } = useAuth();
  const interviewContext = useContext(InterviewContext);

  const interviewdata = interviewContext?.interviewdata ?? {
    Username: "",
    jobposition: "",
    questionlist: [],
  };

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const vapiRef = useRef<Vapi | null>(null);
  const timerRef = useRef<number | null>(null);

  const conversationBuffer = useRef<any[] | null>(null);
  const hasEndedRef = useRef<boolean>(false);
  const hasSavedRef = useRef<boolean>(false);
  const hasCallStartedRef = useRef<boolean>(false);

  const { interview_id } = useParams<{ interview_id: string | string[] }>();
  const router = useRouter();

  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [callActive, setCallActive] = useState<boolean>(false); // Used implicitly via interviewStarted
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [callError, setCallError] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [activeUser, setActiveUser] = useState(true);
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState<any[]>([]);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [interview, setInterview] = useState<Interview | null>(null);
  // resumeText state
  const [resumeText, setResumeText] = useState<string>("");

  // Recording State
  const [consentGiven, setConsentGiven] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);

  const { candidateId } = useAuth();

  // Initialize Recorder
  const { startRecording, stopRecording, isRecording, uploadQueue } =
    useInterviewRecorder({
      interviewId: interview?.id || "",
      candidateId: candidate?.id || "",
    });

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id || !interview_id) return;

      const normalizedInterviewId = Array.isArray(interview_id)
        ? interview_id[0]
        : interview_id;

      try {
        const [candData, intData] = await Promise.all([
          getCandidateByUserId(user.id),
          getInterviewById(normalizedInterviewId),
        ]);

        console.log("Candidate data:", candData);
        console.log("Interview data:", intData);

        if (candData) {
          // 1. Global Malpractice/Blocked Check
          if (candData.malpractice === true) {
            toast.error("Account blocked due to malpractice. Please contact administrator.");
            router.push("/candidate/dashboard");
            return;
          }

          setCandidate(candData);
          if (candData.resume_text) {
            setResumeText(candData.resume_text);
          }
        }

        if (intData) setInterview(intData);

        if (candData && (intData || interviewdata)) {
          interviewContext?.setinterviewdata({
            Username: candData.name,
            jobposition: intData?.title || interviewdata.jobposition,
            questionlist: [],
          });
        }
      } catch (err) {
        console.error("Error fetching context data:", err);
      }
    };

    fetchData();
  }, [user?.id, interview_id]);

  // -------------------------------------------
  // 💡 Enable Camera + Mic (like Google Meet)
  // -------------------------------------------
  const enableMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      if (videoRef.current) videoRef.current.srcObject = stream;

      setCameraEnabled(true);
      setMicEnabled(true);

      return true;
    } catch (err) {
      console.error("Media permission error:", err);
      toast.error(
        "Please enable camera and microphone to start the interview.",
      );
      return false;
    }
  };

  // Disable stream
  const disableMedia = () => {
    try {
      const stream = videoRef.current?.srcObject as MediaStream | null;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (videoRef.current) videoRef.current.srcObject = null;

      setCameraEnabled(false);
      setMicEnabled(false);
    } catch (err) {
      console.log("Failed to disable camera/mic:", err);
    }
  };

  const startCall = async () => {
    const vapi = vapiRef.current;
    hasCallStartedRef.current = false;

    // Ensure camera & mic permissions and video stream
    const mediaAllowed = await enableMedia();
    if (!mediaAllowed) {
      toast.error("Camera & Mic are required to start the interview.");
      setInterviewStarted(false);
      return;
    }

    // Dynamic Resume Info: Use text if available, fallback to URL
    const resumeContext = resumeText
      ? `Candidate Resume Content:\n${resumeText.substring(
        0,
        5000,
      )}... (truncated)`
      : candidate?.resume_url
        ? `Available at ${candidate.resume_url}.`
        : "No resume provided.";

const assistantOptions = {
  name: "AI Recruiter",
  firstMessage: `Hi ${interviewdata?.Username}, I'm the AI Recruiter for today. We have a lot to cover for the ${interviewdata?.jobposition} role. Shall we begin?`,
  transcriber: {
    provider: "deepgram",
    model: "nova-2",
    language: "en-US",
  },
  voice: {
    provider: "11labs",
    voiceId: "21m00Tcm4TlvDq8ikWAM", 
  },
  model: {
    provider: "openai",
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: `
You are a Senior Recruiter. Your personality is **Professional, Firm, and Goal-Oriented**, yet maintains a polite "placement-drive" friendliness.

### STRICT OPERATIONAL MODE (MANDATORY)
1. **ONE QUESTION AT A TIME**: Ask exactly one question and stop. Do not group questions.
2. **USER DEVIATION BLOCKER**: If the user asks a question (e.g., "What is your company like?" or "Can you explain this?"), you must NOT answer it. 
   - **Protocol**: Briefly acknowledge ("I understand you're curious"), then immediately say ("However, we must stay focused on the evaluation. Let's get back to..."), and repeat your last question or move to the next.
3. **NO NUMERICAL FEEDBACK**: Do not mention scores, percentages, or grades (e.g., "Communication: 2") during the call.

### INTERVIEW PHASES (ADAPTIVE & SEQUENTIAL)
- **Phase 1: Intro**: Ask for a self-introduction specifically focusing on their relevant background for this role.
- **Phase 2: Project Evidence**: Pick ONE specific project from "${resumeContext}". Ask: "In your project [Project Name], explain a specific technical conflict you had with a teammate and how you resolved it." Wait for answer.
- **Phase 3: Language Preference**: Ask: "Which programming language are you most proficient in?" Once they answer, ask 2 follow-up technical questions specifically for that language, one by one.
- **Phase 4: JD Randomization**: Identify 5 skill categories from the JD: "${interview?.jd_text}". **Randomly select 3**. Ask one question for the first selected category. Wait for answer. Then move to the second. Wait. Then the third.
- **Phase 5: Behavioral**: Ask on question releated to current trend . Wait for answer.

### FINAL FEEDBACK (Last 2 Minutes)
- Provide a **Verbal-Only** summary. 
- Highlight 2 specific strengths observed.
- Highlight 1 specific area to work on (e.g., "Your explanation of system architecture was clear, but try to provide more data-driven results for your projects").
- **STRICTLY NO NUMBERS.**

### CLOSING
- When time is up (${interview?.duration || 15} minutes), say ONLY: "Thank you for your time. Please click the red 'End Interview' button to finish."

---
### CONTEXT
- Candidate: ${candidate?.name || interviewdata?.Username}
- Role: ${interview?.title || interviewdata?.jobposition}
- Resume: ${resumeContext}
`.trim(),
      },
    ],
  },
  maxDurationSeconds: (interview?.duration || 15) * 60 + 300,
  silenceTimeoutSeconds: 60,
  firstMessageMode: "assistant-speaks-first",
};

    try {
      if (!vapi) {
        throw new Error("Vapi client is not initialized.");
      }
      await vapi.start(assistantOptions as any);
    } catch (error) {
      const err = error as { message?: string };
      const msg = `Could not start the interview: ${err.message || "Unknown error"
        }`;
      toast.error(msg);
      setCallError(msg);
      setInterviewStarted(false);
    }
  };

  // Sync refs for event listeners
  const candidateRef = useRef<Candidate | null>(null);
  const interviewStartedRef = useRef<boolean>(false);
  // Ref to hold the latest GenerateFeedback function to avoid stale closures in event listeners
  const generateFeedbackRef = useRef<((data: any) => Promise<void>) | null>(
    null,
  );

  useEffect(() => {
    candidateRef.current = candidate;
  }, [candidate]);

  useEffect(() => {
    interviewStartedRef.current = interviewStarted;
  }, [interviewStarted]);

  useEffect(() => {
    generateFeedbackRef.current = generateFeedback;
  }); // Update on every render

  // Vapi Initialization & Event Listeners (Runs ONCE)
  useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;

    if (!publicKey) {
      console.error("Missing NEXT_PUBLIC_VAPI_PUBLIC_KEY for Vapi client.");
      toast.error("Interview service is not configured correctly.");
      return;
    }

    const vapi = new Vapi(publicKey);
    vapiRef.current = vapi;

    const handleCallStart = () => {
      console.log("Vapi: Call has started.");
      hasCallStartedRef.current = true;
      toast.success("Interview has started.");
      setElapsedTime(0); // reset timer
      timerRef.current = window.setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    };

    const handleSpeechStart = () => setActiveUser(false);
    const handleSpeechEnd = () => setActiveUser(true);

    const handleCallEnd = () => {
      console.log("Vapi: Call has ended.");
      toast("Interview has ended.");
      setInterviewStarted(false); // Update state to trigger re-renders if needed
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
      }

      if (!hasCallStartedRef.current) {
        console.log(
          "Call ended before starting. Proceeding to feedback generation...",
        );
      }

      setTimeout(() => {
        if (hasSavedRef.current) return;

        const runGenerate = (data: unknown) => {
          if (!Array.isArray(data)) return;
          if (!data || hasSavedRef.current) return;
          hasSavedRef.current = true;
          setConversation(data);
          console.log("Conversation saved successfully:", data);

          if (generateFeedbackRef.current) {
            generateFeedbackRef.current(data);
          }
        };

        if (conversationBuffer.current) {
          runGenerate(conversationBuffer.current);
        } else {
          console.warn(
            "Conversation empty, using fallback for immediate exit.",
          );
          runGenerate([]);
        }
      }, 1000);
    };

    const handleMessage = (message: { conversation?: any[] }) => {
      if (message?.conversation) {
        conversationBuffer.current = message.conversation;
      }
    };

    const handleError = (error: any) => {
      if (
        error?.message === "Meeting has ended" ||
        error === "Meeting has ended"
      )
        return;
      console.error("Vapi error:", error);

      const rawMsg =
        error?.error?.msg ||
        error?.error?.message ||
        error?.errorMsg ||
        error?.message ||
        (typeof error === "string" ? error : "") ||
        "An unknown error occurred";

      const lowerMsg = String(rawMsg).toLowerCase();

      if (lowerMsg.includes("ejection") || lowerMsg.includes("kick")) {
        console.warn(
          "Vapi Ejection Detected. This usually means a connection timeout or room expiry.",
        );
      }

      if (lowerMsg.includes("meeting has ended")) {
        if (hasCallStartedRef.current) {
          handleCallEnd();
        } else {
          const msg =
            "Interview connection failed (Meeting ended immediately).";
          setCallError(msg);
          toast.error(msg);
          setInterviewStarted(false);
          if (timerRef.current !== null) {
            clearInterval(timerRef.current);
          }
        }
        return;
      }

      const msg = `Vapi Error: ${rawMsg}`;
      setCallError(msg);
      toast.error(msg);
      setInterviewStarted(false);
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
      }
    };

    vapi.on("call-start", handleCallStart);
    vapi.on("speech-start", handleSpeechStart);
    vapi.on("speech-end", handleSpeechEnd);
    vapi.on("call-end", handleCallEnd);
    vapi.on("message", handleMessage);
    vapi.on("error", handleError);

    return () => {
      vapi.removeAllListeners();
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  console.log("candidate", candidate);

  const generateFeedback = async (conversationData: any) => {
    console.log("Generating feedback with data:", conversationData);
    try {
      const finalConversation =
        conversationData &&
          Array.isArray(conversationData) &&
          conversationData.length > 0
          ? conversationData
          : [
            {
              role: "system",
              content:
                "The candidate ended the interview early or skipped the interview without any conversation. Please evaluate based on this information (likely a rejection or no-show).",
            },
          ];

      if (!finalConversation) {
        toast.error("No conversation data available to generate feedback.");
        return;
      }

      const normalizedInputId = Array.isArray(interview_id)
        ? interview_id[0]
        : interview_id;

      const targetInterviewId = normalizedInputId;

      if (!candidate?.id) {
        toast.error("Candidate information missing. Cannot save feedback.");
        console.error("Missing candidate.id");
        return;
      }

      if (!targetInterviewId) {
        toast.error("Interview ID missing. Cannot save feedback.");
        console.error("Missing interview_id");
        return;
      }

      // const result = await axios.post("/api/ai-feedback", {
      //   conversation: finalConversation,
      //   candidateId: candidate.id,
      //   interviewId: targetInterviewId,
      // });

      // console.log("Feedback result:✅", result.data);

      const result = await axios.post("/api/inngestApis/analysisFunction", {
        candidateId: candidate.id,
        conversation: finalConversation,
        interviewId: targetInterviewId,
      });

      if (result.status === 200 || result.data?.success) {
        toast.success("Interview report is being generated in the background.");
        disableMedia();
        if (timerRef.current !== null) {
          clearInterval(timerRef.current);
        }
        router.push("/candidate/interview-ended");
      } else {
        throw new Error("Failed to queue report generation");
      }
    } catch (err) {
      const e = err as any;
      const errorDetails = {
        message: e.message || "No message",
        serverError: e.response?.data || "No server response data",
        status: e.response?.status || "No status code",
      };
      
      console.error("Error generating feedback (Detailed):", errorDetails);
      
      // Still ensure we clean up media and timer
      disableMedia();
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
      }
      
      // If it failed to queue but the interview ended, we should still move them away
      toast.error(`Feedback queueing failed, but your session has ended.`);
      router.push("/candidate/dashboard");
    }
  };

  const handleStartInterview = async (isConsented: boolean = false) => {
    // 1. Check Consent
    if (!consentGiven && !isConsented) {
      setShowConsentModal(true);
      return;
    }

    if (vapiRef.current) {
      // Enter Full Screen
      const element = document.documentElement;
      if (element.requestFullscreen) {
        element.requestFullscreen().catch((err) => {
          console.error("Fullscreen request failed:", err);
          toast.error("Please enable full-screen to start the interview.");
        });
      }

      interviewContext?.setIsInterviewing(true);
      setInterviewStarted(true);
      setCallError(null);

      // Start Recording
      await startRecording();

      startCall();
    } else {
      const errorMessage =
        "Interview service is not ready. Please refresh the page or try again.";
      toast.error(errorMessage);
      setCallError(errorMessage);
    }
  };

  const handleStopInterview = () => {
    try {
      setLoading(true);
      vapiRef.current?.stop();

      // Stop Recording
      stopRecording();

      setInterviewStarted(false);
      interviewContext?.setIsInterviewing(false);
      setCallError(null);
      disableMedia();
      if (document.fullscreenElement) {
        document.exitFullscreen().catch((err) => console.error(err));
      }
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
      }
    } catch (error: any) {
      const msg = `Error stopping the interview: ${error.message || "Unknown error"
        }`;
      toast.error(msg);
      setCallError(msg);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------
  // UI (Google Meet / Zoom Style)
  // -------------------------------------------
  return (
    <div className="w-full h-screen flex flex-col bg-gray-900 text-white">
      <RecordingConsentModal
        open={showConsentModal}
        onConsent={() => {
          setConsentGiven(true);
          setShowConsentModal(false);
          toast.success("Consent recorded. Starting interview...");
          // Automatically start the interview after consent
          setTimeout(() => {
            handleStartInterview(true);
          }, 500);
        }}
      />

      {/* TOP BAR */}
      <div className="h-14 bg-black/40 flex items-center justify-between px-6 shadow-lg">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">
            AI Interview for{" "}
            {interview?.title ||
              interview?.jd_name ||
              interviewdata?.jobposition ||
              "Loading..."}
          </h2>
          <RecordingIndicator
            isRecording={isRecording}
            uploadQueue={uploadQueue}
          />
        </div>
        {elapsedTime > 0 && (
          <span className="text-red-500 font-mono animate-pulse">
            {new Date(elapsedTime * 1000).toISOString().substr(11, 8)}
          </span>
        )}
      </div>

      {/* MAIN GRID */}
      <div className="flex-1 grid grid-cols-2 gap-6 p-6">
        {/* AI PANEL */}
        <div className="relative bg-gray-800 rounded-xl flex items-center justify-center border border-gray-700">
          <div
            className={`bg-gray-900 p-6 rounded-full shadow-xl transition-all duration-300 ${!activeUser ? "ring-4 ring-amber-400" : ""
              }`}
          >
            <BotMessageSquare size={90} className="text-amber-400" />
          </div>
          <span className="absolute bottom-4 right-4 bg-black/60 px-3 py-1 rounded">
            AI Interviewer
          </span>
        </div>

        {/* VIDEO PANEL */}
        <div className="relative bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            muted
            className="w-full h-full object-cover"
          />
          <span className="absolute bottom-4 right-4 bg-black/60 px-3 py-1 rounded">
            {candidate?.name || interviewdata?.Username || "Candidate"}
          </span>
        </div>
      </div>

      {/* BOTTOM CONTROLS */}
      <div className="h-20 bg-black/40 flex items-center justify-center gap-6">
        {/* MIC TOGGLE */}
        <button
          className={`p-4 rounded-full ${micEnabled ? "bg-gray-700" : "bg-red-600"
            }`}
          onClick={() => {
            setMicEnabled(!micEnabled);
            enableMedia();
          }}
        >
          {micEnabled ? <Mic /> : <MicOff />}
        </button>

        {/* CAMERA TOGGLE */}
        <button
          className={`p-4 rounded-full ${cameraEnabled ? "bg-gray-700" : "bg-red-600"
            }`}
          onClick={() => {
            setCameraEnabled(!cameraEnabled);
            enableMedia();
          }}
        >
          {cameraEnabled ? <Video /> : <VideoOff />}
        </button>

        {!interviewStarted ? (
          <button
            onClick={() => handleStartInterview()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Start Interview
          </button>
        ) : (
          // stop interview
          <AlertConfirmation stopinterview={handleStopInterview}>
            <div className="flex items-center gap-2 px-6 py-3 rounded-full bg-red-600 hover:bg-red-700 cursor-pointer transition-all">
              <Phone size={20} />
              <span className="font-semibold">End Interview</span>
            </div>
          </AlertConfirmation>
        )}
      </div>
      {candidate && interview && (
        <ProctoringManager
          interviewId={interview.id}
          candidateId={candidate.id}
          videoRef={videoRef}
          isInterviewStarted={interviewStarted}
          onTerminate={() => {
            handleStopInterview();
            router.push("/candidate/interview-ended");
          }}
        />
      )}
    </div>
  );
}
