import { inngest } from "@/inngest/client";
import { adminSupabase } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();


    const { candidateId, conversation, interviewId } = body;


    if (!adminSupabase) {
      console.error(
        "Supabase admin client (adminSupabase) is null. serviceRoleKey might be missing.",
      );
      throw new Error("Supabase admin client is not configured");
    }

    const { data: feedbackData } = await adminSupabase
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
            ),
            transcript
          `,
      )
      .eq("candidate_id", candidateId)
      .order("created_at", { ascending: false });






    const { data: candidateData } = await adminSupabase
      .from("candidates")
      .select("*")
      .eq("id", candidateId)
      .single();


    let interviewsData: any[] = [];
    if (candidateData?.interview_ids && candidateData.interview_ids.length > 0) {
      const { data: interviews } = await adminSupabase
        .from("candidate_interviews")
        .select(`
        resume_analysis
        `)
        .eq("candidate_id", candidateId)
        .in("interview_id", candidateData.interview_ids);
      interviewsData = (interviews || []).map((i: any) => i.resume_analysis);
    }




    const response = await inngest.send({
      name: "userDetails/analysis.function",
      data: {
        resumeData: interviewsData,
        feedbackData,
        candidateId,
        conversation,
        interviewId,
      },
    });

    const runId = response.ids[0];
    return Response.json({ success: true, message: "Analysis job queued", runId });


  } catch (err) {
    console.error(err);
    return new Response("Internal Server Error", { status: 500 });
  }
}

async function getRunStatus(runId: string) {
  const url = `${process.env.INNGEST_SERVER_HOST}/v1/events/${runId}/runs`;

  const response = await fetch(
    `${process.env.INNGEST_SERVER_HOST}/v1/events/${runId}/runs`,
    {
      headers: {
        Authorization: `Bearer ${process.env.INNGEST_SIGNING_KEY}`,
      },
    },
  );

  const json = await response.json();
  return json.data;
}
