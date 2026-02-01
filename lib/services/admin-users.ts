import { adminSupabase } from "@/lib/supabase/admin";
import { getCandidatesByInterview } from "./candidates";

export interface AdminUserRecord {
  id: string;
  name: string;
  usn: string;
  email: string | null;
  batch: string | null;
  dept: string | null;
  interviewIds: string[];
  interviewTitle: string | null;
  hasAuthUser: boolean;
  role: string | null;
}

export interface CreatedAuthUser {
  candidateId: string;
  userId: string;
  email: string;
  tempPassword: string;
}

export interface CreateAuthUsersResult {
  created: CreatedAuthUser[];
  skipped: { candidateId: string; reason: string }[];
}

// List all unique "users" (students) by deduplicating candidates based on USN.
export async function listAdminUsers(): Promise<AdminUserRecord[]> {
  console.log("listAdminUsers called");

  if (!adminSupabase) {
    console.error("Admin Supabase client is not configured on the server.");
    throw new Error("Admin Supabase client is not configured on the server.");
  }

  console.log("adminSupabase client:", !!adminSupabase);
  console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);

  try {
    // Fetch candidates
    const { data: candidates, error: candidatesError } = await adminSupabase
      .from("candidates")
      .select("id, name, usn, email, batch, dept, interview_ids, created_at")
      .order("created_at", { ascending: false });

    // console.log("Candidates query result:", {
    //   candidates,
    //   error: candidatesError,
    // });

    if (candidatesError) {
      console.error(
        "Error fetching candidates for admin users:",
        candidatesError,
      );
      throw candidatesError;
    }

    if (!candidates || candidates.length === 0) {
      console.log("No candidates found, returning empty array");
      return [];
    }

    // Fetch IDs of candidates that are linked to a user_profile (legacy check)
    // BUT what we really care about is if the USN is linked.
    // Let's fetch all user_profiles to map USN -> hasAccount
    const { data: profiles, error: profilesError } = await adminSupabase
      .from("user_profiles")
      .select("usn,role, candidate_id");

    console.log("Profiles query result:", { profiles, error: profilesError });

    if (profilesError) {
      console.error("Error fetching user_profiles:", profilesError);
      throw profilesError;
    }

    const registeredUSNs = new Set<string>();
    const linkedCandidateIds = new Set<string>();
    const usnToRoleMap = new Map<string, string>();

    (profiles || []).forEach((p: any) => {
      if (p.usn) {
        registeredUSNs.add(p.usn);
        if (p.role) usnToRoleMap.set(p.usn, p.role);
      }
      if (p.candidate_id) linkedCandidateIds.add(p.candidate_id);
    });

    // Deduplicate candidates by USN
    const uniqueUsersMap = new Map<string, AdminUserRecord>();

    for (const c of candidates) {
      const usn = c.usn;
      if (!usn) continue;

      // We want the most recent info, and candidates are ordered by created_at desc.
      // So the first time we see a USN, that's the latest one.
      if (!uniqueUsersMap.has(usn)) {
        uniqueUsersMap.set(usn, {
          id: c.id, // ID of the latest candidate record
          name: c.name,
          usn: c.usn,
          email: c.email ?? null,
          batch: c.batch ?? null,
          dept: c.dept ?? null,
          interviewIds: c.interview_ids ?? [],
          interviewTitle: null, // Title logic is tricky with deduplication, maybe omit or join
          hasAuthUser: registeredUSNs.has(usn) || linkedCandidateIds.has(c.id),
          role: usnToRoleMap.get(usn) || null,
        });
      } else {
        // Optional: If the existing entry has missing details (like null batch) but this older one has it, fill it in?
        const existing = uniqueUsersMap.get(usn)!;
        if (!existing.batch && c.batch) existing.batch = c.batch;
        if (!existing.dept && c.dept) existing.dept = c.dept;
        // We don't overwrite name/email from older records usually
      }
    }

    // Convert map to array
    const uniqueUsers = Array.from(uniqueUsersMap.values());

    // If we really need interview titles, we'd have to decide WHICH interview to show.
    // For a "User Management" view, interview specific info is less important than User info.
    // We can leave interviewTitle null or 'Multiple'

    console.log("Returning users:", uniqueUsers.length);
    return uniqueUsers;
  } catch (error) {
    console.error("Unexpected error in listAdminUsers:", error);
    throw error;
  }
}

// Create a candidate and user profile record (NO Supabase auth)
export async function createAdminUser(input: {
  name: string;
  usn: string;
  email: string;
  batch?: string;
  dept?: string;
}): Promise<{ user: AdminUserRecord; auth: CreatedAuthUser }> {
  if (!adminSupabase) {
    throw new Error("Admin Supabase client is not configured on the server.");
  }

  const { name, usn, email, batch, dept } = input;

  // 0) Check if a user with this USN already exists in user_profiles
  const { data: existingProfile } = await adminSupabase
    .from("user_profiles")
    .select("id")
    .eq("usn", usn)
    .maybeSingle();

  if (existingProfile) {
    throw new Error(`A user account already exists for USN ${usn}`);
  }

  // 1) Reuse existing candidate if one already exists for this USN
  const { data: existingCandidate, error: existingError } = await adminSupabase
    .from("candidates")
    .select("id, name, usn, email, batch, dept, interview_ids, created_at")
    .eq("usn", usn)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    console.error("Error checking for existing candidate:", existingError);
    throw existingError;
  }

  // Check if this specific candidate row is already linked
  if (existingCandidate) {
    const { data: linkedProfile } = await adminSupabase
      .from("user_profiles")
      .select("id")
      .eq("candidate_id", existingCandidate.id)
      .maybeSingle();

    if (linkedProfile) {
      throw new Error(`This candidate is already linked to a user account.`);
    }
  }

  let candidate = existingCandidate;

  // If no candidate exists for this USN, create a new base candidate record
  if (!candidate) {
    const { data: created, error: candidateError } = await adminSupabase
      .from("candidates")
      .insert([
        {
          name,
          usn,
          email,
          batch: batch ?? null,
          dept: dept ?? null,
          status: "Pending",
        },
      ])
      .select("id, name, usn, email, batch, dept, interview_ids, created_at")
      .single();

    if (candidateError || !created) {
      console.error(
        "Error creating candidate in admin user creation:",
        candidateError,
      );
      throw candidateError;
    }

    candidate = created;
  }

  // 2) Generate a unique ID for the user profile (since we're NOT using Supabase auth)
  const userProfileId = crypto.randomUUID();

  // 3) Create user_profile record
  const { error: linkError } = await adminSupabase
    .from("user_profiles")
    .insert({
      id: userProfileId,
      candidate_id: candidate.id,
      usn,
      email: email,
      created_at: new Date().toISOString(),
    });

  if (linkError) {
    console.error(
      "Error creating user_profile for candidate:",
      candidate.id,
      linkError,
    );
    throw new Error(`Failed to create user profile: ${linkError.message}`);
  }

  const tempPassword = `${usn}@123`;

  // We return a structure compatible with the frontend/API response,
  // but "auth" here is just placeholder data since no real Auth User exists.
  const auth: CreatedAuthUser = {
    candidateId: candidate.id,
    userId: userProfileId,
    email,
    tempPassword,
  };

  const user: AdminUserRecord = {
    id: candidate.id,
    name: candidate.name,
    usn: candidate.usn,
    email: candidate.email ?? null,
    batch: candidate.batch ?? null,
    dept: candidate.dept ?? null,
    interviewIds: candidate.interview_ids ?? [],
    interviewTitle: null,
    hasAuthUser: true,
    role: null,
  };

  return { user, auth };
}

export async function deleteAdminUser(usn: string): Promise<void> {
  if (!adminSupabase) {
    throw new Error("Admin Supabase client is not configured on the server.");
  }

  // 1) Delete user_profile record
  const { error: profileError } = await adminSupabase
    .from("user_profiles")
    .delete()
    .eq("usn", usn);

  if (profileError) {
    console.error("Error deleting user profile:", profileError);
    throw profileError;
  }

  // 2) Delete all candidate records for this USN
  const { error: candidateError } = await adminSupabase
    .from("candidates")
    .delete()
    .eq("usn", usn);

  if (candidateError) {
    console.error("Error deleting candidates:", candidateError);
    throw candidateError;
  }
}

export async function updateAdminUser(
  usn: string,
  updates: {
    name?: string;
    email?: string;
    batch?: string;
    dept?: string;
  },
): Promise<void> {
  if (!adminSupabase) {
    throw new Error("Admin Supabase client is not configured on the server.");
  }

  // Update candidates table (all rows for this USN)
  const { error: candidateError } = await adminSupabase
    .from("candidates")
    .update({
      ...(updates.name && { name: updates.name }),
      ...(updates.email && { email: updates.email }),
      ...(updates.batch && { batch: updates.batch }),
      ...(updates.dept && { dept: updates.dept }),
    })
    .eq("usn", usn);

  if (candidateError) {
    console.error("Error updating candidates:", candidateError);
    throw candidateError;
  }

  // Update user_profiles table if email changed
  if (updates.email) {
    const { error: profileError } = await adminSupabase
      .from("user_profiles")
      .update({
        email: updates.email,
      })
      .eq("usn", usn);

    if (profileError) {
      console.error("Error updating user_profiles:", profileError);
      throw profileError;
    }
  }
}

export async function createAuthUsersForInterview(
  interviewId: string,
): Promise<CreateAuthUsersResult> {
  console.log("createAuthUsersForInterview called for:", interviewId);
  const candidates = await getCandidatesByInterview(interviewId);
  const result: CreateAuthUsersResult = { created: [], skipped: [] };

  for (const candidate of candidates) {
    if (!candidate.email) {
       result.skipped.push({ candidateId: candidate.id, reason: "No email provided" });
       continue;
    }

    try {
      const { auth } = await createAdminUser({
        name: candidate.name,
        usn: candidate.usn,
        email: candidate.email,
        batch: (candidate as any).batch,
        dept: (candidate as any).dept,
      });
      result.created.push(auth);
    } catch (e: any) {
      result.skipped.push({ candidateId: candidate.id, reason: e.message });
    }
  }
  return result;
}
