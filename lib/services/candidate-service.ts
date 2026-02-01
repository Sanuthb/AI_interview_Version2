import { differenceInHours, isAfter, parseISO } from 'date-fns';
import { Candidate, Interview } from '@/lib/types';
import { supabase } from '@/lib/supabase/client';

export type CalculatedStatus = 'ACTIVE' | 'EXPIRED' | 'LOCKED' | 'COMPLETED' | 'NOT_STARTED';

/**
 * Checks the interview status for a candidate based on time and admin overrides.
 */
export async function checkCandidateInterviewStatus(
  candidate: Candidate,
  interview: Interview
): Promise<{ status: CalculatedStatus; reason?: string }> {
  // 1. If manually overridden/promoted by admin, it's ACTIVE (unless completed)
  if (candidate.override_by_admin || candidate.manually_promoted) {
    if (candidate.interview_status === 'Completed') {
      return { status: 'COMPLETED' };
    }
    // Check if manual deadline is set and expired
    if (candidate.manual_interview_deadline) {
      const deadline = new Date(candidate.manual_interview_deadline);
      if (isAfter(new Date(), deadline)) {
        return { status: 'EXPIRED', reason: 'Manual extension expired' };
      }
    }
    return { status: 'ACTIVE', reason: 'Admin override active' };
  }

  // 2. Check if interview is closed globally
  if (interview.status === 'Closed') {
    return { status: 'LOCKED', reason: 'Interview event is closed' };
  }

  // 3. Check Resume Status
  if (candidate.resume_status === 'Failed') {
    return { status: 'LOCKED', reason: 'Resume screening failed' };
  }
  
  if (candidate.resume_status === 'Pending') {
    // If resume is pending but time is up?
    // Usually we wait for resume.
    return { status: 'NOT_STARTED', reason: 'Resume pending' }; 
  }

  // 4. Time-based logic
  // "Interview window" starts when? Usually it's open for 24h from interview start OR from resume upload?
  // User req: "Each interview has start_time, end_time (start + 24 hours)"
  // User req: "Case 1: Candidate within 24 hours ... Case 2: Candidate AFTER 24 hours"
  // So it seems based on Interview Event 24h window, NOT candidate specific start time, UNLESS admin sets a custom expiry.
  
  let endTime = interview.end_time ? new Date(interview.end_time) : null;
  // Fallback: if no end_time but validation required, use created_at + 24h
  if (!endTime && interview.created_at) {
     const createdAt = new Date(interview.created_at);
     createdAt.setHours(createdAt.getHours() + 24);
     endTime = createdAt;
  }

  if (endTime && isAfter(new Date(), endTime)) {
    return { status: 'EXPIRED', reason: 'Interview window closed (24h)' };
  }

  // 5. Default
  if (candidate.interview_status === 'Completed') {
    return { status: 'COMPLETED' };
  }

  return { status: 'ACTIVE' };
}

/**
 * Updates the candidate status in DB if calculated status differs from stored status.
 * Note: We map 'ACTIVE'/'EXPIRED' -> candidate.interview_status enum
 */
export async function syncCandidateStatus(candidate: Candidate, interview: Interview) {
   const { status } = await checkCandidateInterviewStatus(candidate, interview);
   
   let dbStatus: "Not Started" | "Enabled" | "Completed" | "Locked" = 'Not Started';

   switch (status) {
     case 'ACTIVE':
       dbStatus = 'Enabled';
       break;
     case 'EXPIRED':
     case 'LOCKED':
       dbStatus = 'Locked';
       break;
     case 'COMPLETED':
       dbStatus = 'Completed';
       break;
     default: // NOT_STARTED
       dbStatus = 'Not Started';
   }

   if (dbStatus !== candidate.interview_status) {
     await supabase
       .from('candidates')
       .update({ interview_status: dbStatus })
       .eq('id', candidate.id);
     
     return dbStatus;
   }
   return candidate.interview_status;
}
