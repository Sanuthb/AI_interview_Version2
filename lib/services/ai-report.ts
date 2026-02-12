
import { AIService } from '../services/ai-service';
import { Candidate, Interview } from '@/lib/types';

export interface AIReportData {
  // Scorecard
  strengths: string[];
  weaknesses: string[];
  hiringRecommendation: "Strong Hire" | "Hire" | "Weak Hire" | "No Hire";
  riskFlags: string[];
  finalScore: number;
  communicationScore: number;
  skillsScore: number;
  knowledgeScore: number;
  placementReadinessScore: number;
  radarData: {
    Technical: number;
    Communication: number;
    Logic: number;
    Confidence: number;
    JDAlignment: number;
  };
  summary: string;

  // AI Coaching (Deep Dive)
  performance_metrics?: Array<{ metric: string; score: number; description: string }>;
  resume_vs_reality?: {
    verified_claims: string[];
    exaggerated_claims: string[];
    missing_skills: string[];
  };
  strategic_recommendations?: {
    resume_edits: string[];
    study_focus: string[];
  };
  communication_coaching?: {
    verbal_delivery: string[];
    structuring_answers: string[];
  };
}

export async function generateFinalReport(
  candidate: Candidate,
  interview: Interview,
  resumeText: string,
  interviewTranscript: string
): Promise<AIReportData> {
  try {
    const prompt = `
      You are an expert HR Interviewer and Career Coach. Generate a comprehensive "Intelligence Report" for a candidate based on their interview.
      This report will be used for BOTH hiring decisions and candidate career coaching.

      **Job Position/Description:**
      ${interview.title}
      ${interview.jd_text || interview.jd_name}

      **Candidate Resume Info:**
      ${resumeText.substring(0, 3000) || "Resume text not available"}

      **Interview Transcript:**
      ${interviewTranscript.substring(0, 5000)}

      **Task:**
      Analyze the candidate deeply based on the JD, Resume, and Interview performance. 
      **STRICT REQUIREMENT: EVIDENCE-BASED FEEDBACK.** 
      Do NOT provide generic tips like "Improve communication". Instead, provide quantifiable or citeable evidence (e.g., "Candidate used 'um' 12 times in the intro" or "Strong evidence provided for React hooks implementation in Project Alpha, but failed to explain the Virtual DOM concept when challenged").

      **Output Format (JSON Only):**
      {
        "strengths": [".. (with specific session evidence)", ".."],
        "weaknesses": [".. (with specific session evidence)", ".."],
        "hiringRecommendation": "Strong Hire" | "Hire" | "Weak Hire" | "No Hire",
        "riskFlags": [".. (e.g., 'Generic answer used for behavioral prompt')"],
        "finalScore": 0-100,
        "communicationScore": 0-100,
        "skillsScore": 0-100,
        "knowledgeScore": 0-100,
        "placementReadinessScore": 0-100,
        "radarData": {
          "Technical": 0-100,
          "Communication": 0-100,
          "Logic": 0-100,
          "Confidence": 0-100,
          "JDAlignment": 0-100
        },
        "summary": "Deep-dive summary citing specific performance highlights.",
        "communication_coaching": {
          "verbal_delivery": ["Evidence-based tip (e.g., 'Watch filler words in technical explanations')"],
          "structuring_answers": ["Evidence-based tip (e.g., 'Use STAR method more clearly for the conflict prompt')"]
        },
        "resume_vs_reality": {
          "verified_claims": ["Citations of verified resume claims from session"],
          "exaggerated_claims": ["Citations of claims candidate couldn't justify"],
          "missing_skills": ["JD requirements candidate lacked evidence for"]
        },
        "strategic_recommendations": {
          "resume_edits": ["Specific resume changes based on this interview's gaps"],
          "study_focus": ["High-priority technical topics to brush up on"]
        }
      }
    `;

    const response = await AIService.generateJson<AIReportData>(prompt, null, { jsonMode: true });

    if (!response.success) {
      throw new Error(response.error);
    }

    return response.data;
  } catch (error) {
    console.error("Error generating AI report:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to generate report: ${errorMessage}`);
  }
}
