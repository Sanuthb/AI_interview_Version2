"use client";

import { useEffect, useRef, useState } from "react";
import { ProctoringUI } from "./ProctoringUI";
import { MediaPipeService } from "@/lib/services/MediaPipeService";
import { logProctoringEvent } from "@/lib/actions/proctoring-actions";
import { toast } from "sonner";

interface ProctoringManagerProps {
    interviewId: string;
    candidateId: string;
    videoRef: React.RefObject<HTMLVideoElement | null>;
    isInterviewStarted: boolean; // Only monitor when active
    onTerminate: () => void;
}

export function ProctoringManager({
    interviewId,
    candidateId,
    videoRef,
    isInterviewStarted,
    onTerminate,
}: ProctoringManagerProps) {
    const [isFullScreen, setIsFullScreen] = useState(true); // Optimistic initially
    const [consentGiven, setConsentGiven] = useState(false);
    const [warnings, setWarnings] = useState<string[]>([]);
    const [cameraPermission, setCameraPermission] = useState(false);
    const [micPermission, setMicPermission] = useState(false);

    const mediaPipeRef = useRef(MediaPipeService.getInstance());
    const loopRef = useRef<number | null>(null);

    // 1. Initial Permission Check
    useEffect(() => {
        checkPermissions();
        // Also poll every few seconds in case they change it
        const pTimer = setInterval(checkPermissions, 3000);
        return () => clearInterval(pTimer);
    }, []);

    const checkPermissions = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });
            setCameraPermission(stream.getVideoTracks().length > 0);
            setMicPermission(stream.getAudioTracks().length > 0);
            // Stop tracks immediately as we just wanted to check permission context (or rely on parent stream)
            if (!videoRef.current?.srcObject) {
                // If parent hasn't set stream, don't stop it here, let parent handle real stream
                stream.getTracks().forEach((t) => t.stop());
            }
        } catch {
            setCameraPermission(false);
            setMicPermission(false);
        }
    };

    // 2. Fullscreen & Tab Switching Logic
    useEffect(() => {
        if (!consentGiven) return;

        const handleFullScreenChange = () => {
            const isFull = !!document.fullscreenElement;
            setIsFullScreen(isFull);
            if (!isFull && isInterviewStarted) {
                logWarning("FULLSCREEN_EXIT", "Exited fullscreen mode");
            }
        };

        const handleVisibilityChange = () => {
            if (document.hidden && isInterviewStarted) {
                logWarning("TAB_SWITCH", "Switched tab or minimized window");
            }
        };

        const handleBlur = () => {
            if (isInterviewStarted) {
                logWarning("TAB_SWITCH", "Window lost focus");
            }
        };

        const handleCopy = (e: ClipboardEvent) => {
            if (isInterviewStarted) {
                e.preventDefault();
                logWarning("COPY_PASTE", "Copy attempt blocked");
                toast.error("Copying is disabled during the interview.");
            }
        }

        const handlePaste = (e: ClipboardEvent) => {
            if (isInterviewStarted) {
                e.preventDefault();
                logWarning("COPY_PASTE", "Paste attempt blocked");
                toast.error("Pasting is disabled during the interview.");
            }
        }

        const handleContextMenu = (e: MouseEvent) => {
            if (isInterviewStarted) {
                e.preventDefault();
            }
        }

        document.addEventListener("fullscreenchange", handleFullScreenChange);
        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("blur", handleBlur);
        document.addEventListener("copy", handleCopy);
        document.addEventListener("paste", handlePaste);
        document.addEventListener("contextmenu", handleContextMenu);

        return () => {
            document.removeEventListener("fullscreenchange", handleFullScreenChange);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("blur", handleBlur);
            document.removeEventListener("copy", handleCopy);
            document.removeEventListener("paste", handlePaste);
            document.removeEventListener("contextmenu", handleContextMenu);
        };
    }, [consentGiven, isInterviewStarted]);

    // 3. MediaPipe Loop
    useEffect(() => {
        if (!consentGiven || !isInterviewStarted || !videoRef.current) {
            if (loopRef.current) {
                cancelAnimationFrame(loopRef.current);
                loopRef.current = null;
            }
            return;
        }

        const initAI = async () => {
            await mediaPipeRef.current.initialize();
            startLoop();
        };

        initAI();

        return () => {
            if (loopRef.current) cancelAnimationFrame(loopRef.current);
        }
    }, [consentGiven, isInterviewStarted]);


    const startLoop = () => {
        let lastProcess = 0;
        const loop = (timestamp: number) => {
            if (!videoRef.current || !isInterviewStarted) return;

            // Throttle to ~2 FPS (every 500ms)
            if (timestamp - lastProcess > 500) {
                lastProcess = timestamp;
                processFrame();
            }

            loopRef.current = requestAnimationFrame(loop);
        }
        loopRef.current = requestAnimationFrame(loop);
    }

    const processFrame = () => {
        if (!videoRef.current) return;
        const detections = mediaPipeRef.current.detect(videoRef.current);

        if (detections.length === 0) {
            logWarning("FACE_MISSING", "No face detected");
        } else if (detections.length > 1) {
            logWarning("MULTIPLE_FACES", "Multiple faces detected");
        } else {
            // Optional: Head pose check logic here if landmarks available
        }
    }

    const logWarning = async (type: string, message: string) => {
        // Frontend UI Update
        setWarnings((prev) => {
            const newW = [...prev, message];
            if (newW.length > 3) newW.shift();
            return newW;
        });

        // Clear toast after 3s
        setTimeout(() => {
            setWarnings((prev) => prev.filter(w => w !== message));
        }, 3000);

        // Backend Log
        await logProctoringEvent(candidateId, interviewId, type, { message });
    };

    const requestFullScreen = () => {
        document.documentElement.requestFullscreen().catch((err) => {
            console.error(err);
            toast.error("Could not enter fullscreen");
        });
    };

    return (
        <ProctoringUI
            isFullScreen={isFullScreen}
            onEnterFullScreen={requestFullScreen}
            messages={warnings}
            consentGiven={consentGiven}
            onConsent={() => {
                requestFullScreen();
                setConsentGiven(true);
            }}
            cameraEnabled={cameraPermission}
            micEnabled={micPermission}
            showOverlay={isInterviewStarted}
        />
    );
}
