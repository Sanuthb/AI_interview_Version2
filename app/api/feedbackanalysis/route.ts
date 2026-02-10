import { adminSupabase } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const { candidateId } = await req.json();
    console.log(candidateId);

    if (!candidateId) {
      return Response.json(
        { success: false, message: "candidateId is required" },
        { status: 400 }
      );
    }

    if (!adminSupabase) {
      console.error(
        "Supabase admin client (adminSupabase) is null. serviceRoleKey might be missing."
      );
      throw new Error("Supabase admin client is not configured");
    }

    const [resultsResponse, analysisResponse] = await Promise.all([
      adminSupabase
        .from("interview_results")
        .select(
          `
          id,
          report,
          created_at,
          interviews (
            id,
            title,
            interview_type
          )
        `
        )
        .eq("candidate_id", candidateId)
        .order("created_at", { ascending: false }),
      adminSupabase
        .from("feedback_analysis")
        .select("*")
        .eq("candidate_id", candidateId)
        .order("created_at", { ascending: false })
    ]);
    
    if (resultsResponse.error) throw resultsResponse.error;
    if (analysisResponse.error) throw analysisResponse.error;

    return Response.json({ 
      success: true, 
      data: resultsResponse.data,
      analysis: analysisResponse.data 
    }, { status: 200 });
  } catch (error) {
    console.error("Server error:", error);
    return Response.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
