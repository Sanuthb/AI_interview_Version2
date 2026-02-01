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

export async function promoteCandidate(candidateId: string) {
  const { error } = await supabase
    .from('candidates')
    .update({
      manually_promoted: true,
      interview_status: 'Enabled', // Force enable
      status: 'Promoted'
    })
    .eq('id', candidateId);

  if (error) throw error;
  await logAdminAction(candidateId, 'PROMOTE', 'Manual promotion by admin');
}

export async function lockCandidate(candidateId: string) {
  const { error } = await supabase
    .from('candidates')
    .update({
      interview_status: 'Locked',
      // We don't change 'manually_promoted' here, just lock access
    })
    .eq('id', candidateId);

  if (error) throw error;
  await logAdminAction(candidateId, 'LOCK', 'Manual lock by admin');
}

export async function reEnableCandidate(candidateId: string, hours: number = 24) {
  const deadline = new Date();
  deadline.setHours(deadline.getHours() + hours);

  const { error } = await supabase
    .from('candidates')
    .update({
      override_by_admin: true,
      manual_interview_deadline: deadline.toISOString(),
      interview_status: 'Enabled'
    })
    .eq('id', candidateId);

  if (error) throw error;
  await logAdminAction(candidateId, 'RE_ENABLE', `Re-enabled for ${hours} hours`);
}
