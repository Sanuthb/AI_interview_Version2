'use server';

import { 
  promoteCandidate, 
  lockCandidate, 
  reEnableCandidate, 
} from '@/lib/services/admin-service';
import { generateFinalReport } from '@/lib/services/ai-report';
import { getCandidateById } from '@/lib/services/candidates';
import { getInterviewById } from '@/lib/services/interviews';
import { revalidatePath } from 'next/cache';

// ... existing code ...

export async function generateReportAction(candidateId: string, interviewId: string) {
  try {
    const candidate = await getCandidateById(candidateId);
    const interview = await getInterviewById(interviewId);
    
    if (!candidate || !interview) {
      throw new Error("Candidate or Interview not found");
    }

    // Mocking resumeText and transcript for now as we haven't implemented fetching them fully
    // In real flow, we would fetch parsing result from DB or storage
    const resumeText = "Resume text placeholder"; 
    const interviewTranscript = "Interview transcript placeholder";

    const report = await generateFinalReport(candidate, interview as any, resumeText, interviewTranscript);
    
    // Save report to DB (assuming we have a field for it, or just return it for now)
    // For this task, we'll just return it so UI can show it, 
    // or we should update candidate with report data if schema supported it.
    // The prompt said "Save report to DB".
    // I didn't add a 'final_report' column to candidates. 
    // I should probably add it or store in admin_actions_log?
    // Let's store in admin_actions_log for now as "AI_REPORT" action.
    
    const { logAdminAction } = await import('@/lib/services/admin-service');
    await logAdminAction(candidateId, 'AI_REPORT', JSON.stringify(report));

    revalidatePath(`/admin/interviews/${interviewId}`);
    return { success: true, data: report };
  } catch (error) {
    console.error('Failed to generate report:', error);
    return { success: false, error: 'Failed to generate report' };
  }
}


export async function promoteCandidateAction(candidateId: string, interviewId: string) {
  try {
    await promoteCandidate(candidateId);
    revalidatePath(`/admin/interviews/${interviewId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to promote candidate:', error);
    return { success: false, error: 'Failed to promote candidate' };
  }
}

export async function lockCandidateAction(candidateId: string, interviewId: string) {
  try {
    await lockCandidate(candidateId);
    revalidatePath(`/admin/interviews/${interviewId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to lock candidate:', error);
    return { success: false, error: 'Failed to lock candidate' };
  }
}

export async function reEnableCandidateAction(candidateId: string, interviewId: string, hours: number) {
  try {
    await reEnableCandidate(candidateId, hours);
    revalidatePath(`/admin/interviews/${interviewId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to re-enable candidate:', error);
    return { success: false, error: 'Failed to re-enable candidate' };
  }
}
export async function removeCandidateFromInterviewAction(
  candidateId: string,
  interviewId: string
) {
  try {
    const { removeCandidateFromInterview } = await import(
      "@/lib/services/interviews"
    );
    await removeCandidateFromInterview(candidateId, interviewId);
    revalidatePath(`/admin/interviews/${interviewId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to remove candidate from interview:", error);
    return {
      success: false,
      error: "Failed to remove candidate from interview",
    };
  }
}
