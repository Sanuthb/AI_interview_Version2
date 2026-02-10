
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
      Provide a structured JSON output with evaluation metrics AND coaching insights.

      **Output Format (JSON Only):**
      {
        "strengths": ["..", ".."],
        "weaknesses": ["..", ".."],
        "hiringRecommendation": "Strong Hire" | "Hire" | "Weak Hire" | "No Hire",
        "riskFlags": [".."],
        "finalScore": 0-100,
        "communicationScore": 0-100,
        "skillsScore": 0-100,
        "knowledgeScore": 0-100,
        "summary": "Short paragraph summary focusing on overall fit",
        "communication_coaching": {
          "verbal_delivery": ["tip1", "tip2"],
          "structuring_answers": ["tip1", "tip2"]
        },
        "resume_vs_reality": {
          "verified_claims": ["claim1"],
          "exaggerated_claims": ["claim1"],
          "missing_skills": ["skill1"]
        },
        "strategic_recommendations": {
          "resume_edits": ["edit1"],
          "study_focus": ["topic1"]
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
