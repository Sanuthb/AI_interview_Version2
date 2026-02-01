import { NextRequest, NextResponse } from "next/server";
import { generateFinalReport } from "@/lib/services/ai-report";
import { getCandidateById } from "@/lib/services/candidates";
import { getInterviewById } from "@/lib/services/interviews";
import { adminSupabase } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    // Debugging checks
    if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      console.warn("Warning: NEXT_PUBLIC_GEMINI_API_KEY is missing in server environment");
    }

    if (!adminSupabase) {
      console.error("Supabase admin client (adminSupabase) is null. serviceRoleKey might be missing.");
      throw new Error("Supabase admin client is not configured");
    }

    const { conversation, candidateId, interviewId } = await req.json();

    if (!conversation || !candidateId || !interviewId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const [candidate, interview] = await Promise.all([
      getCandidateById(candidateId),
      getInterviewById(String(interviewId)), // Ensure string
    ]);

    if (!candidate || !interview) {
      return NextResponse.json(
        { error: "Candidate or Interview not found" },
        { status: 404 }
      );
    }

    // Generate the report using the existing service
    const report = await generateFinalReport(
      candidate,
      interview,
      candidate.resume_text || "Resume text not available",
      JSON.stringify(conversation)
    );

    // Save to interview_results
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

    // Update candidate interview status
    await adminSupabase
      .from("candidates")
      .update({ interview_status: "Completed" })
      .eq("id", candidateId);

    return NextResponse.json({ success: true, data: resultData });
  } catch (error: any) {
    console.error("Error in ai-feedback API:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
