import { supabase } from '@/lib/supabase/client';
import { adminSupabase } from '@/lib/supabase/admin';
import { Interview } from '@/lib/types';

export async function createInterview(data: {
  title: string;
  jd_name: string;
  jd_text?: string;
  jd_file_url?: string;
  interview_type?: string;
  duration?: number;
  min_resume_score?: number;
  start_time?: string;
  end_time?: string;
  status?: "Active" | "Closed";
}) {
  const { data: interview, error } = await supabase
    .from('interviews')
    .insert([{
      title: data.title,
      jd_name: data.jd_name,
      jd_text: data.jd_text,
      jd_file_url: data.jd_file_url,
      interview_type: data.interview_type,
      duration: data.duration,
      min_resume_score: data.min_resume_score ?? 70,
      start_time: data.start_time,
      end_time: data.end_time,
      status: data.status || 'Active',
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating interview:', error);
    throw error;
  }

  return interview;
}

export async function getInterviews(): Promise<Interview[]> {
  const { data, error } = await supabase
    .from('interviews')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching interviews:', error);
    throw error;
  }

  // Get candidate counts for each interview
  const interviewsWithCounts = await Promise.all(
    data.map(async (interview: any) => {
      const { count } = await supabase
        .from('candidates')
        .select('*', { count: 'exact', head: true })
        .contains('interview_ids', [interview.id]);

      return {
        id: interview.id,
        title: interview.title,
        jd_name: interview.jd_name,
        jd_text: interview.jd_text,
        jd_file_url: interview.jd_file_url,
        created_at: interview.created_at,
        status: interview.status,
        start_time: interview.start_time,
        end_time: interview.end_time,
        interview_type: interview.interview_type,
        duration: interview.duration,
        min_resume_score: interview.min_resume_score,
        candidate_count: count || 0,
      };
    })
  );

  return interviewsWithCounts;
}

export async function getInterviewById(id: string): Promise<Interview | null> {
  const client = adminSupabase || supabase;
  const { data, error } = await client
    .from('interviews')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching interview (ID: ${id}):`, JSON.stringify(error, null, 2));
    return null;
  }

  return {
    id: data.id,
    title: data.title,
    jd_name: data.jd_name,
    jd_text: data.jd_text,
    jd_file_url: data.jd_file_url,
    created_at: data.created_at,
    status: data.status,
    start_time: data.start_time,
    end_time: data.end_time,
    interview_type: data.interview_type,
    duration: data.duration,
    min_resume_score: data.min_resume_score,
  };
}

export async function updateInterview(
  id: string,
  updates: {
    title?: string;
    jd_name?: string;
    jd_text?: string;
    jd_file_url?: string;
    interview_type?: string;
    duration?: number;
    min_resume_score?: number;
    start_time?: string;
    end_time?: string;
    status?: "Active" | "Closed";
  }
): Promise<void> {
  const { error } = await supabase
    .from('interviews')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Error updating interview:', error);
    throw error;
  }
}

export async function updateInterviewStatus(
  id: string,
  status: "Active" | "Closed"
): Promise<void> {
  await updateInterview(id, { status });
}

export async function removeCandidateFromInterview(
  candidateId: string,
  interviewId: string
): Promise<void> {
  // Get current candidate interview_ids
  const { data: candidate, error: fetchError } = await supabase
    .from("candidates")
    .select("interview_ids")
    .eq("id", candidateId)
    .single();

  if (fetchError) throw fetchError;

  const updatedIds = (candidate.interview_ids || []).filter(
    (id: string) => id !== interviewId
  );

  const { error: updateError } = await supabase
    .from("candidates")
    .update({ interview_ids: updatedIds })
    .eq("id", candidateId);

  if (updateError) throw updateError;
}

export async function deleteInterview(id: string): Promise<void> {
  // 1. Remove this interview ID from all candidates' interview_ids arrays
  // Using PostgreSQL's array_remove function
  const { error: candidatesError } = await supabase.rpc(
    "remove_interview_from_candidates",
    { interview_id_to_remove: id }
  );

  // If RPC doesn't exist, fall back to manual update
  if (candidatesError) {
    console.log("RPC not available, using manual array update");

    const { data: candidates } = await supabase
      .from("candidates")
      .select("id, interview_ids")
      .contains("interview_ids", [id]);

    if (candidates && candidates.length > 0) {
      for (const candidate of candidates) {
        const updatedIds = (candidate.interview_ids || []).filter(
          (iid: string) => iid !== id
        );

        await supabase
          .from("candidates")
          .update({
            interview_ids: updatedIds,
          })
          .eq("id", candidate.id);
      }
    }
  }

  // 2. Cascading cleanup of associated data to avoid foreign key errors
  // We perform these separately to minimize impact and allow the parent deletion to attempt success via DB cascade if configured
  const cleanupTasks = [
    { name: "interview_results", table: "interview_results" },
    { name: "proctoring_events", table: "proctoring_events" },
    { name: "recording_metadata", table: "recording_metadata" },
    { name: "candidate_interviews", table: "candidate_interviews" },
  ];

  for (const task of cleanupTasks) {
    const { error: cleanupError } = await supabase
      .from(task.table)
      .delete()
      .eq("interview_id", id);
      
    if (cleanupError) {
      console.warn(`Note: Manual cleanup of ${task.name} skipped or failed:`, cleanupError.message);
    }
  }

  // 3. Now delete the interview itself
  const { error } = await supabase.from("interviews").delete().eq("id", id);

  if (error) {
    console.error("Critical error deleting interview parent record:", error);
    throw new Error(`Failed to delete interview: ${error.message}`);
  }
}

