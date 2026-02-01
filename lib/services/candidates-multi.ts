import { supabase } from "@/lib/supabase/client";
import { adminSupabase } from "@/lib/supabase/admin";
import { Candidate } from "@/lib/types";

// Explicit column list to avoid SELECT * after interview_id column was dropped
const CANDIDATE_COLUMNS = `
  id, name, usn, email, batch, dept, resume_score, resume_url, status,
  resume_status, interview_status, manually_promoted, override_by_admin,
  manual_interview_deadline, created_at, updated_at, risk_score, risk_level,
  proctoring_summary, resume_text, resume_analysis, malpractice,
  malpractice_score, malpractice_details, interview_ids
`.trim();

// New function to get ALL candidate records (interviews) for a USN
export async function getCandidatesByUSN(
  usn: string,
): Promise<Candidate[]> {
  try {
    const client = adminSupabase || supabase;
    const { data, error } = await client
      .from("candidates")
      .select(CANDIDATE_COLUMNS)
      .eq("usn", usn.trim())
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching candidates by USN:", error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map((candidate: any) => ({
      id: candidate.id,
      name: candidate.name,
      usn: candidate.usn,
      email: candidate.email,
      resume_score: candidate.resume_score,
      resume_url: candidate.resume_url,
      resume_text: candidate.resume_text,
      status: candidate.status,
      interview_ids: candidate.interview_ids,
      resume_status: candidate.resume_status,
      interview_status: candidate.interview_status,
      manually_promoted: candidate.manually_promoted,
      override_by_admin: candidate.override_by_admin,
      manual_interview_deadline: candidate.manual_interview_deadline,
      created_at: candidate.created_at,
    }));
  } catch (error: any) {
    console.error("Error in getCandidatesByUSN:", error);
    return [];
  }
}

// This function is deprecated - use getInterviewsForUSN from candidates.ts instead
// which properly handles the interview_ids array
export async function getInterviewsForUSNLegacy(usn: string): Promise<any[]> {
  console.warn('getInterviewsForUSN in candidates-multi.ts is deprecated');
  return [];
}
