"use server";

import { createServerClient } from "@/lib/supabase/server";
import { ProctoringEvent, RiskLevel } from "@/lib/types";

export async function logProctoringEvent(
    candidateId: string,
    interviewId: string,
    eventType: string,
    details: any = {}
) {
    const supabase = await createServerClient();

    const { error } = await supabase.from("proctoring_events").insert({
        candidate_id: candidateId,
        interview_id: interviewId,
        event_type: eventType,
        details,
    });

    if (error) {
        console.error("Error logging proctoring event:", error);
        return { success: false, error: error.message };
    }

    // Trigger risk recalculation (could be async/queue-based in larger scale)
    await updateRiskScore(candidateId, interviewId);

    return { success: true };
}

export async function updateRiskScore(candidateId: string, interviewId: string) {
    const supabase = await createServerClient();

    // Fetch all events for this session
    const { data: events, error } = await supabase
        .from("proctoring_events")
        .select("*")
        .eq("candidate_id", candidateId)
        .eq("interview_id", interviewId);

    if (error || !events) {
        console.error("Error fetching proctoring events:", error);
        return;
    }

    // Simple rule-based risk scoring
    let score = 0;
    let summary = {
        tab_switches: 0,
        fullscreen_exits: 0,
        face_missing: 0,
        multiple_faces: 0,
        copy_paste: 0,
    };

    events.forEach((event: any) => {
        switch (event.event_type) {
            case "TAB_SWITCH":
                score += 5;
                summary.tab_switches++;
                break;
            case "FULLSCREEN_EXIT":
                score += 10;
                summary.fullscreen_exits++;
                break;
            case "FACE_MISSING":
                score += 2;
                summary.face_missing++;
                break;
            case "MULTIPLE_FACES":
                score += 20;
                summary.multiple_faces++;
                break;
            case "COPY_PASTE":
                score += 15;
                summary.copy_paste++;
                break;
            case "MIC_MUTED":
                score += 1;
                break;
            case "CAM_OFF":
                score += 5;
                break;
        }
    });

    let riskLevel: RiskLevel = "LOW";
    if (score >= 50) riskLevel = "HIGH";
    else if (score >= 20) riskLevel = "MEDIUM";

    await supabase
        .from("candidates")
        .update({
            risk_score: score,
            risk_level: riskLevel,
            proctoring_summary: summary,
        })
        .eq("id", candidateId);
}
