import { supabase } from '@/lib/supabase/client';
import { Candidate, AdminActionLog } from '@/lib/types';

export async function logAdminAction(
  candidateId: string,
  actionType: string,
  details?: string
) {
  const { error } = await supabase
    .from('admin_actions_log')
    .insert([
      {
        candidate_id: candidateId,
        action_type: actionType,
        details: details,
      },
    ]);

  if (error) {
    console.error('Error logging admin action:', error);
  }
}

export async function promoteCandidate(candidateId: string, interviewId?: string) {
  // 1. Update per-interview status if interviewId provided
  if (interviewId) {
    const { error: appError } = await supabase
      .from('candidate_interviews')
      .update({
        manually_promoted: true,
        interview_status: 'Enabled',
        status: 'Promoted'
      })
      .eq('candidate_id', candidateId)
      .eq('interview_id', interviewId);
    
    if (appError) throw appError;
  }

  // 2. Update global status for legacy compatibility
  const { error } = await supabase
    .from('candidates')
    .update({
      manually_promoted: true,
      interview_status: 'Enabled', // Force enable
      status: 'Promoted'
    })
    .eq('id', candidateId);

  if (error) throw error;
  await logAdminAction(candidateId, 'PROMOTE', `Promoted${interviewId ? ` for interview ${interviewId}` : ''}`);
}

export async function lockCandidate(candidateId: string, interviewId?: string) {
  // 1. Update per-interview status if interviewId provided
  if (interviewId) {
    const { error: appError } = await supabase
      .from('candidate_interviews')
      .update({
        interview_status: 'Locked'
      })
      .eq('candidate_id', candidateId)
      .eq('interview_id', interviewId);
    
    if (appError) throw appError;
  }

  // 2. Update global status
  const { error } = await supabase
    .from('candidates')
    .update({
      interview_status: 'Locked',
    })
    .eq('id', candidateId);

  if (error) throw error;
  await logAdminAction(candidateId, 'LOCK', `Locked${interviewId ? ` for interview ${interviewId}` : ''}`);
}

export async function reEnableCandidate(candidateId: string, hours: number = 24, interviewId?: string) {
  const deadline = new Date();
  deadline.setHours(deadline.getHours() + hours);

  // 1. Update per-interview status if interviewId provided
  if (interviewId) {
    const { error: appError } = await supabase
      .from('candidate_interviews')
      .update({
        override_by_admin: true,
        manual_interview_deadline: deadline.toISOString(),
        interview_status: 'Enabled'
      })
      .eq('candidate_id', candidateId)
      .eq('interview_id', interviewId);
    
    if (appError) throw appError;
  }

  // 2. Update global status
  const { error } = await supabase
    .from('candidates')
    .update({
      override_by_admin: true,
      manual_interview_deadline: deadline.toISOString(),
      interview_status: 'Enabled'
    })
    .eq('id', candidateId);

  if (error) throw error;
  await logAdminAction(candidateId, 'RE_ENABLE', `Re-enabled for ${hours}h${interviewId ? ` for interview ${interviewId}` : ''}`);
}
