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

export async function createCandidate(data: {
  name: string;
  usn: string;
  email?: string;
  interview_ids: string[]; // Changed from single interview_id to array
  status?: "Promoted" | "Not Promoted" | "Pending";
}) {
  const client = adminSupabase || supabase;
  const usn = data.usn.trim();

  // 1) Check if ANY record exists for this USN
  const { data: existing } = await client
    .from("candidates")
    .select(CANDIDATE_COLUMNS)
    .eq("usn", usn)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    // Update existing record
    const existingRecord = existing as any;
    const { data: updated, error } = await client
      .from("candidates")
      .update({
        name: data.name,
        email: data.email,
        interview_ids: data.interview_ids,
        status: data.status || "Pending",
        resume_status: "Pending",
        interview_status: "Not Started",
      })
      .eq("id", existingRecord.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating candidate:", error);
      throw error;
    }
    return updated;
  }

  // 2) Create new record
  const { data: candidate, error } = await client
    .from("candidates")
    .insert([
      {
        name: data.name,
        usn: usn,
        email: data.email,
        interview_ids: data.interview_ids,
        status: data.status || "Pending",
        resume_status: "Pending",
        interview_status: "Not Started",
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error creating candidate:", error);
    throw error;
  }

  return candidate;
}

/**
 * Create or update candidates for an interview in bulk.
 *
 * We intentionally avoid creating duplicate rows for the same USN.
 * If a candidate already exists with the same USN, we REUSE that row
 * and update its interview_id / basic fields instead of inserting a new one.
 */
export async function createCandidatesBulk(
  candidates: Array<{
    name: string;
    usn: string;
    email?: string;
    batch?: string;
    dept?: string;
    interview_id: string; // Single interview ID to add to the array
  }>,
) {
  const createdOrUpdated: any[] = [];
  const skipped: Array<{ usn: string; reason: string }> = [];

  // 0) Get all registered USNs first to check existence efficiently
  const client = adminSupabase || supabase;
  const { data: registeredProfiles } = await client
    .from("user_profiles")
    .select("usn");

  const registeredUSNs = new Set((registeredProfiles || []).map((p) => p.usn));

  for (const candidate of candidates) {
    const usn = candidate.usn.trim();
    
    // CRITICAL: Only process candidates who have a user_profile (exist in database)
    if (!registeredUSNs.has(usn)) {
      skipped.push({
        usn,
        reason: "Student not found in database. Admin must add them first.",
      });
      continue; // Skip this candidate entirely
    }

    let candidateRecord: any = null;

    // 1) Check if candidate record exists for this USN
    const { data: existingCandidate, error: existingError } = await client
      .from("candidates")
      .select(CANDIDATE_COLUMNS)
      .eq("usn", usn)
      .maybeSingle();

    if (existingError) {
      console.error(
        "Error checking for existing candidate:",
        existingError,
      );
      throw existingError;
    }

    if (existingCandidate) {
      // 2a) Candidate exists - append interview_id to interview_ids array
      const candidate: any = existingCandidate;
      const currentInterviewIds = candidate.interview_ids || [];
      
      // Check if this interview is already in the array
      if (currentInterviewIds.includes(candidate.interview_id)) {
        // Interview already assigned, just update basic info
        const { data, error } = await client
          .from("candidates")
          .update({
            name: candidate.name,
            email: candidate.email,
            batch: candidate.batch || candidate.batch,
            dept: candidate.dept || candidate.dept,
          })
          .eq("id", candidate.id)
          .select()
          .single();

        if (error) {
          console.error("Error updating existing candidate:", error);
          throw error;
        }
        candidateRecord = data;
      } else {
        // Add new interview_id to the array
        const updatedInterviewIds = [...currentInterviewIds, candidate.interview_id];
        
        const { data, error } = await client
          .from("candidates")
          .update({
            name: candidate.name,
            email: candidate.email,
            batch: candidate.batch || candidate.batch,
            dept: candidate.dept || candidate.dept,
            interview_ids: updatedInterviewIds,
          })
          .eq("id", candidate.id)
          .select()
          .single();

        if (error) {
          console.error("Error adding interview to candidate:", error);
          throw error;
        }
        candidateRecord = data;
      }
    } else {
      // 2b) No existing candidate - create new record with interview_ids array
      const { data, error } = await client
        .from("candidates")
        .insert([
          {
            name: candidate.name,
            usn,
            email: candidate.email,
            batch: candidate.batch,
            dept: candidate.dept,
            interview_ids: [candidate.interview_id], // Array column
            status: "Pending",
            resume_status: "Pending",
            interview_status: "Not Started",
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Error creating new candidate:", error);
        throw error;
      }
      candidateRecord = data;
    }

    if (candidateRecord) {
      // 3) Create/Update candidate_interviews record (Relation Table)
      const { error: joinError } = await client
        .from("candidate_interviews")
        .upsert(
          {
            candidate_id: candidateRecord.id,
            interview_id: candidate.interview_id,
            status: "Pending",
            resume_status: "Pending",
            interview_status: "Not Started",
          },
          { onConflict: "candidate_id, interview_id" }
        );

      if (joinError) {
        console.error("Error creating candidate_interview relation:", joinError);
        // We don't throw here to avoid failing the whole batch, but we log it
      } else {
        createdOrUpdated.push(candidateRecord);
      }
    }
  }

  return { createdOrUpdated, skipped };
}

export async function searchRegisteredUsers(
  query: string,
  interviewId: string,
) {
  const lowerQuery = query.toLowerCase();

  // 1) Get all candidates already in this interview
  const { data: existingCandidates } = await supabase
    .from("candidates")
    .select("usn")
    .contains("interview_ids", [interviewId]);

  const existingUSNs = new Set((existingCandidates || []).map((c) => c.usn));

  // 2) Get registered users matching query
  // Since user_profiles might not have 'name', we should ideally join with candidates or auth?
  // Let's assume we want to search in users we already know about.
  // Actually, listAdminUsers in admin-users.ts does exactly what we want (unique users).
  // But we need to use 'supabase' client here.

  // We'll search in candidates table for unique USNs that have a profile.
  const { data: candidatesWithProfiles } = await supabase
    .from("candidates")
    .select("name, usn, email, batch, dept")
    .order("created_at", { ascending: false });

  if (!candidatesWithProfiles) return [];

  const client = adminSupabase || supabase;
  const { data: profiles } = await client.from("user_profiles").select("usn");
  const profileUSNs = new Set((profiles || []).map((p) => p.usn));

  const uniqueUsers = new Map<string, any>();
  for (const c of candidatesWithProfiles) {
    if (
      profileUSNs.has(c.usn) &&
      !existingUSNs.has(c.usn) &&
      !uniqueUsers.has(c.usn)
    ) {
      if (
        c.name.toLowerCase().includes(lowerQuery) ||
        c.usn.toLowerCase().includes(lowerQuery)
      ) {
        uniqueUsers.set(c.usn, c);
      }
    }
  }

  return Array.from(uniqueUsers.values()).slice(0, 10);
}

export async function addCandidateToInterview(
  usn: string,
  interviewId: string,
): Promise<any> {
  const client = adminSupabase || supabase;
  const trimmedUsn = usn.trim();

  // 1) Check if candidate exists for this USN
  const { data: existingCandidate } = await client
    .from("candidates")
    .select(CANDIDATE_COLUMNS)
    .eq("usn", trimmedUsn)
    .maybeSingle();

  if (!existingCandidate) {
    throw new Error(
      `No registration found for USN ${trimmedUsn}. The student must sign up first.`,
    );
  }

  // 2) Add to candidate_interviews table
  const candidateRecord = existingCandidate as any;
  const { data, error } = await client
    .from("candidate_interviews")
    .upsert(
      {
        candidate_id: candidateRecord.id,
        interview_id: interviewId,
        status: "Pending",
        resume_status: "Pending",
        interview_status: "Not Started",
      },
      { onConflict: "candidate_id, interview_id" }
    )
    .select()
    .single();

  if (error) {
    console.error("Error adding interview to candidate (candidate_interviews):", error);
    throw new Error(`Failed to assign interview: ${error.message}`);
  }

  // 3) legacy support: Update interview_ids array on main candidate object if needed
  // We can keep this for now to avoid breaking other parts that might strictly read 'interview_ids'
  const currentInterviewIds = candidateRecord.interview_ids || [];
  if (!currentInterviewIds.includes(interviewId)) {
    await client
     .from("candidates")
     .update({ interview_ids: [...currentInterviewIds, interviewId] })
     .eq("id", candidateRecord.id);
  }

  return existingCandidate;
}

export async function getCandidatesByInterview(
  interviewId: string,
): Promise<Candidate[]> {
  const { data, error } = await supabase
    .from("candidate_interviews")
    .select(`
      *,
      candidate:candidates (
        id, name, usn, email, batch, dept, 
        risk_score, risk_level, proctoring_summary, 
        malpractice, malpractice_score, malpractice_details,
        created_at
      )
    `)
    .eq("interview_id", interviewId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching candidates:", error);
    throw error;
  }

  return (data || []).map((row: any) => ({
    // Base candidate info
    id: row.candidate.id,
    name: row.candidate.name,
    usn: row.candidate.usn,
    email: row.candidate.email,
    created_at: row.candidate.created_at,
    
    // Application specific info (overrides global)
    resume_score: row.resume_score,
    resume_url: row.resume_url,
    resume_text: null, // text might not be strictly needed in list view, or fetch if needed
    resume_analysis: row.resume_analysis,
    status: row.status,
    resume_status: row.resume_status,
    interview_status: row.interview_status,
    manually_promoted: row.manually_promoted,
    override_by_admin: row.override_by_admin,
    manual_interview_deadline: row.manual_interview_deadline,
    
    interview_ids: [row.interview_id], // Represent context as this interview

    // Proctoring & Malpractice (usually global, but malpractice can be per interview logic if desired)
    // For now assuming proctoring is stored on candidate. 
    // TODO: Move proctoring to candidate_interviews if it's per-interview.
    malpractice: row.candidate.malpractice,
    malpractice_score: row.candidate.malpractice_score,
    malpractice_details: row.candidate.malpractice_details,
    risk_score: row.candidate.risk_score,
    risk_level: row.candidate.risk_level,
    proctoring_summary: row.candidate.proctoring_summary,
  }));
}

export async function updateCandidateResume(
  candidateId: string,
  resumeUrl: string,
  resumeScore: number,
  resumeText: string | null = null,
  resumeAnalysis: any = null,
  interviewId: string | null = null, // New optional parameter
): Promise<void> {
  // 1. Get the USN of the candidate to ensure we have the correct candidate record
  const { data: candidate, error: fetchError } = await supabase
    .from("candidates")
    .select("id, usn")
    .eq("id", candidateId)
    .single();

  if (fetchError || !candidate) {
    console.error(`Error fetching candidate for resume update (candidateId: ${candidateId}):`, fetchError);
    throw fetchError || new Error("Candidate not found");
  }

  // 2. Identify which interview(s) to update.
  // If interviewId is provided, update strictly that application.
  // If not provided (legacy/fallback), we might need to find which one?
  // Ideally, the caller MUST provide interviewId now.

  if (!interviewId) {
    console.warn("updateCandidateResume called without interviewId. Updating GLOBAL candidate record (Deprecated) and ALL assigned interviews.");
    // Fallback: This preserves old behavior but might spread the resume to all interviews if we sync them.
    // For now, let's just log a warning and try to find *an* interview or update all?
    // Let's update ALL entries in candidate_interviews for this candidate.
      const threshold = 70; // Global fallback
      const { error } = await supabase
        .from("candidate_interviews")
        .update({
          resume_url: resumeUrl,
          resume_score: resumeScore,
          resume_analysis: resumeAnalysis,
          status: resumeScore >= threshold ? "Promoted" : "Not Promoted",
          resume_status: resumeScore >= threshold ? "Passed" : "Failed",
        })
        .eq("candidate_id", candidate.id);
      
     if (error) console.error("Error batch updating candidate interviews:", error);
     return;
  }

  // 3. Fetch interview threshold to avoid "flip-flop"
  const { data: interview } = await supabase
    .from("interviews")
    .select("min_resume_score")
    .eq("id", interviewId)
    .single();

  const threshold = interview?.min_resume_score ?? 70;

  // 4. Update specific application in candidate_interviews
  const { error } = await supabase
    .from("candidate_interviews")
    .update({
      resume_url: resumeUrl,
      resume_score: resumeScore,
      resume_analysis: resumeAnalysis,
      status: resumeScore >= threshold ? "Promoted" : "Not Promoted",
      resume_status: resumeScore >= threshold ? "Passed" : "Failed",
    })
    .eq("candidate_id", candidate.id)
    .eq("interview_id", interviewId);

  if (error) {
    console.error("Error updating candidate resume application:", error);
    throw error;
  }
}

export async function updateCandidateStatus(
  candidateId: string,
  status: "Promoted" | "Not Promoted" | "Pending",
): Promise<void> {
  const { error } = await supabase
    .from("candidates")
    .update({ status })
    .eq("id", candidateId);

  if (error) {
    console.error("Error updating candidate status:", error);
    throw error;
  }
}

export async function markMalpractice(candidateId: string): Promise<void> {
  const { error } = await supabase
    .from("candidates")
    .update({
      malpractice: true,
      status: "Not Promoted",
      interview_status: "Locked",
    })
    .eq("id", candidateId);

  if (error) {
    console.error("Error marking malpractice:", error);
    throw error;
  }
}

/**
 * Automatically syncs candidate status based on thresholds
 */
export async function syncCandidateStatus(
  candidateId: string,
  interviewId: string
): Promise<void> {
  const { data: app } = await supabase
    .from("candidate_interviews")
    .select("resume_score, interview_status, interviews(min_resume_score)")
    .eq("candidate_id", candidateId)
    .eq("interview_id", interviewId)
    .single();

  if (!app) return;

  const threshold = (app as any).interviews?.min_resume_score ?? 70;
  const isEligible = (app.resume_score || 0) >= threshold;

  await supabase
    .from("candidate_interviews")
    .update({
      status: isEligible ? "Promoted" : "Not Promoted",
      resume_status: isEligible ? "Passed" : "Failed",
    })
    .eq("candidate_id", candidateId)
    .eq("interview_id", interviewId);
}

export async function getCandidateById(id: string): Promise<Candidate | null> {
  try {
    const { data, error } = await supabase
      .from("candidates")
      .select(CANDIDATE_COLUMNS)
      .eq("id", id)
      .maybeSingle(); // Use maybeSingle() to handle no results gracefully

    if (error) {
      console.error("Error fetching candidate:", error);
      return null;
    }

    if (!data) {
      return null;
    }

      const candidate = data as any;
      return {
        id: candidate.id,
        name: candidate.name,
        usn: candidate.usn,
        email: candidate.email,
        resume_score: candidate.resume_score,
        resume_url: candidate.resume_url,
        resume_text: candidate.resume_text,
        resume_analysis: candidate.resume_analysis,
        status: candidate.status,
        interview_ids: candidate.interview_ids,
        resume_status: candidate.resume_status,
        interview_status: candidate.interview_status,
        manually_promoted: candidate.manually_promoted,
        override_by_admin: candidate.override_by_admin,
        manual_interview_deadline: candidate.manual_interview_deadline,
        created_at: candidate.created_at,
      };
  } catch (error: any) {
    console.error("Error in getCandidateById:", error);
    return null;
  }
}



export async function getCandidateByUSN(usn: string): Promise<Candidate | null> {
  const client = adminSupabase || supabase;
  try {
    const { data, error } = await client
      .from("candidates")
      .select(CANDIDATE_COLUMNS)
      .eq("usn", usn)
      .order("created_at", { ascending: false })
      .limit(1);

    if (!error && data && data.length > 0) {
      const candidate = data[0] as any;
      return {
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
      };
    }
    return null;
  } catch (error) {
    console.error("Error in getCandidateByUSN:", error);
    return null;
  }
}

export async function getCandidateByUserId(
  userId: string,
): Promise<Candidate | null> {
  const client = adminSupabase || supabase;
  try {
    // First get the user profile to find USN (and candidate_id if needed)
    const { data: profile, error: profileError } = await client
      .from("user_profiles")
      .select("candidate_id, usn")
      .eq("id", userId)
      .maybeSingle();

    if (profileError || !profile) {
      if (profileError) {
        console.error("Error fetching user profile:", profileError);
      } else {
        console.warn("User profile not found for ID:", userId);
      }
      return null;
    }

    // Prefer looking up by USN so that a candidate can have multiple interview rows.
    if (profile.usn) {
      try {
        const { data, error } = await client
          .from("candidates")
          .select(CANDIDATE_COLUMNS)
          .eq("usn", profile.usn)
          .order("created_at", { ascending: false })
          .limit(1);

        if (!error && data && data.length > 0) {
          const candidate = data[0] as any;
          return {
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
          };
        }
      } catch (err) {
        console.error(
          "Error fetching candidate by USN from user profile:",
          err,
        );
      }
    }

    // Fallback: use candidate_id if present
    if (profile.candidate_id) {
      // Use client (adminSupabase) for getCandidateById as well
      const { data, error: candidateError } = await client
        .from("candidates")
        .select(CANDIDATE_COLUMNS)
        .eq("id", profile.candidate_id)
        .maybeSingle();

      if (candidateError || !data) {
        return null;
      }

      const candidate = data as any;
      return {
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
      };
    }

    return null;
  } catch (error: any) {
    console.error("Error in getCandidateByUserId:", error);
    return null;
  }
}

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

export async function getInterviewsForUSN(usn: string): Promise<any[]> {
  try {
    const client = adminSupabase || supabase;
    
    // 1) Get the candidate ID for this USN
    const { data: candidate, error: candidateError } = await client
      .from("candidates")
      .select("id, name, usn, email")
      .eq("usn", usn.trim())
      .maybeSingle();

    if (candidateError || !candidate) {
      console.error("Error fetching candidate:", candidateError);
      return [];
    }

    // 2) Get applications from candidate_interviews
    const { data: applications, error: appError } = await client
      .from("candidate_interviews")
      .select(`
        *,
        interview:interviews(*)
      `)
      .eq("candidate_id", candidate.id);

    if (appError) {
      console.error("Error fetching candidate interviews:", appError);
      return [];
    }

    // 3) Map to expected format
    return (applications || []).map((app: any) => ({
      // Candidate fields (merged from profile + app state)
      id: candidate.id,
      name: candidate.name,
      usn: candidate.usn,
      email: candidate.email,
      
      // App-specific state
      status: app.status,
      resume_score: app.resume_score,
      resume_status: app.resume_status,
      interview_status: app.interview_status,
      manually_promoted: app.manually_promoted,
      
      // Interview details
      interviews: {
        id: app.interview.id,
        title: app.interview.title,
        jd_name: app.interview.jd_name,
        jd_text: app.interview.jd_text,
        jd_file_url: app.interview.jd_file_url,
        interview_type: app.interview.interview_type,
        duration: app.interview.duration,
        min_resume_score: app.interview.min_resume_score,
        status: app.interview.status,
        created_at: app.interview.created_at,
      },
    }));
  } catch (error: any) {
    console.error("Error in getInterviewsForUSN:", error);
    return [];
  }
}
