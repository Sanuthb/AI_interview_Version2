import { adminSupabase } from "@/lib/supabase/admin";
import { inngest } from "./client";
import { generatefeedbackanalysis } from "@/lib/services/ai-feedbackanalysis";
import { generateFinalReport } from "@/lib/services/ai-report";
import { getCandidateById } from "@/lib/services/candidates";
import { getInterviewById } from "@/lib/services/interviews";

// Type definitions for event data
interface AnalysisEvent {
  data: {
    resumeData: any;
    feedbackData: any;
    candidateId: string;
    interviewId: string;
    conversation: any;
  };
}

export const analysisFunction = inngest.createFunction(
  { id: "analysis-function" },
  { event: "userDetails/analysis.function" },
  async ({ event, step }: { event: AnalysisEvent; step: any }) => {
    console.log({
      "data=": event.data,
    });

    try {
      await step.run("generate-feedback", async () => {
        const { conversation, candidateId, interviewId } = event.data;

        const [candidate, interview] = await Promise.all([
          getCandidateById(candidateId),
          getInterviewById(String(interviewId)),
        ]);

        if (!candidate || !interview) {
          throw new Error("Candidate or Interview not found");
        }

        // 1. Detect Early Exit (Empty or very short conversation)
        const isEarlyExit = !conversation || (Array.isArray(conversation) && conversation.length < 3);
        
        let report;
        if (isEarlyExit) {
          console.log(`Early exit detected for candidate ${candidateId}. Bypassing AI generation.`);
          report = {
            strengths: [],
            weaknesses: [],
            hiringRecommendation: "No Hire",
            riskFlags: ["Early Exit / Incomplete"],
            finalScore: 0,
            communicationScore: 0,
            skillsScore: 0,
            knowledgeScore: 0,
            summary: "Exited in middle of interview (No conversation data available).",
            communication_coaching: { verbal_delivery: [], structuring_answers: [] },
            resume_vs_reality: { verified_claims: [], exaggerated_claims: [], missing_skills: [] },
            strategic_recommendations: { resume_edits: [], study_focus: [] }
          };
        } else {
          report = await generateFinalReport(
            candidate,
            interview,
            candidate.resume_text || "Resume text not available",
            JSON.stringify(conversation),
          );
        }

        if (!adminSupabase) {
          throw new Error("adminSupabase is not configured");
        }

        const { data: resultData, error: resultError } = await adminSupabase
          .from("interview_results")
          .insert([
            {
              candidate_id: candidateId,
              interview_id: String(interviewId),
              transcript: conversation,
              report: report,
              communication_score: report.communicationScore || 0,
              skills_score: report.skillsScore || 0,
              knowledge_score: report.knowledgeScore || 0,
              summary: report.summary,
            },
          ])
          .select()
          .single();

        if (resultError) throw resultError;

        // Update interview status in candidates table
        const { error: candidateUpdateError } = await adminSupabase
          .from("candidates")
          .update({
            interview_status: "Completed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", candidateId);

        if (candidateUpdateError) {
          console.error(
            "Failed to update candidate interview status:",
            candidateUpdateError,
          );
          throw new Error(
            `Failed to update candidate status: ${candidateUpdateError.message}`,
          );
        }

        // Also update candidate_interviews table if record exists
        const { error: interviewUpdateError } = await adminSupabase
          .from("candidate_interviews")
          .update({
            interview_status: "Completed",
            updated_at: new Date().toISOString(),
          })
          .eq("candidate_id", candidateId)
          .eq("interview_id", interviewId);

        if (interviewUpdateError) {
          console.warn(
            "Failed to update candidate_interviews status (table might not exist):",
            interviewUpdateError,
          );
          // Don't throw error here as candidate_interviews might not exist
        }

        console.log(
          `Successfully updated interview status to 'Completed' for candidate ${candidateId}`,
        );

        return resultData;
      });

      // Save the rich analysis to feedback_analysis table for compatibility
      await step.run("save-rich-analysis", async () => {
        if (!adminSupabase) return;
        
        // Fetch the report we just saved in the previous step
        const { data: result } = await adminSupabase
          .from("interview_results")
          .select("report, candidate_id")
          .eq("candidate_id", event.data.candidateId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (result?.report) {
          await adminSupabase
            .from("feedback_analysis")
            .insert({
              candidate_id: result.candidate_id,
              analysis: result.report
            });
        }
      });
    } catch (error) {
      console.error("Error in analysis function:", error);
      await step.run("handle-error", () => {
        return {
          error: "Failed to generate analysis report",
          details: error instanceof Error ? error.message : "Unknown error",
        };
      });
      throw error;
    }
  },
);

// npx --ignore-scripts=false inngest-cli@latest dev
