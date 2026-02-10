
import { AIService } from '../services/ai-service';

export async function generatefeedbackanalysis(
  resumeData: any,
  feedbackData: any,
): Promise<any> {
  try {
    const prompt = `
        You are an expert Interview Analyst and Career Coach Agent. Your task is to perform a deep-dive analysis of a candidate by synthesizing their **Resume Data** and **Interview Feedback**.

       ====================
        RESUME DATA
        ====================
        ${JSON.stringify(resumeData, null, 2)}

        ====================
        INTERVIEW FEEDBACK DATA
        ====================
        ${JSON.stringify(feedbackData, null, 2)}

        Analyze the resume and interview feedback deeply.

        ### INSTRUCTIONS:
        1. Extract core data from the resume.
        2. Analyze the feedback for technical, behavioral, and communication patterns.
        3. Compare the resume claims against the interview reality.
        4. Provide specific coaching on **Communication** (tone, pace, clarity).
        5. Output the result in the strict JSON format below.

        ### OUTPUT FORMAT:
        You must output ONLY valid JSON. Do not include markdown formatting, introductions, or explanations. Use the exact schema below:

        {
        "resume_data_extraction": {
            "candidate_name": "String",
            "years_experience": "Number",
            "education": "String",
            "target_role": "String"
        },
        "performance_metrics": [
            { "metric": "Technical Proficiency", "score": 0-100, "description": "Assessment of core technical skills and knowledge" },
            { "metric": "Behavioral Alignment", "score": 0-100, "description": "Fit with company values and situational responses" },
            { "metric": "Communication Clarity", "score": 0-100, "description": "Effectiveness of verbal delivery and answer structure" },
            { "metric": "Problem Solving", "score": 0-100, "description": "Ability to handle complex questions and logic" },
            { "metric": "Cultural Alignment", "score": 0-100, "description": "Potential impact on team dynamics" }
        ],
        "feedback_analysis": {
            "summary": "String",
            "overall_rating": "String (e.g. Excellent, Good, Average, Poor)",
            "key_observations": ["Array of strings"]
        },
        "overall_assessment": {
            "hiring_status": "String (e.g., Strong Hire, Hire, Weak Hire, No Hire)",
            "match_score": "Number (0-100)",
            "verdict_summary": "String"
        },
        "skill_analysis": {
            "strengths": ["Array of validated skills"],
            "weaknesses": ["Array of struggling areas"],
            "soft_skills": ["Array of communication/culture notes"]
        },
        "resume_vs_reality": {
            "verified_claims": ["Resume points proven true"],
            "exaggerated_claims": ["Resume points proven weak"],
            "missing_skills": ["Skills expected but not found"]
        },
        "strategic_recommendations": {
            "resume_edits": ["Specific changes to the document"],
            "role_fit": ["Better suited job titles"],
            "study_focus": ["High priority topics"]
        },
        "actionable_tips_and_tricks": {
            "immediate_fixes": ["Quick behavioral/technical adjustments"],
            "interview_hacks": ["Psychological tricks to build rapport"]
        },
        "skilltips": {
            "coding_tips": ["Specific advice for their coding style"],
            "system_design_tips": ["Advice for architecture discussions"],
            "behavioral_tips": ["Advice for situational questions"]
        },
        "communication_coaching": {
            "verbal_delivery": ["Tips on tone, pace, volume, and filler words"],
            "structuring_answers": ["Tips on being concise vs detailed (e.g., Bottom Line Up Front)"]
        }
        }
    `;

    const response = await AIService.generateJson<any>(prompt, null, { jsonMode: true });

    if (!response.success) {
        throw new Error(response.error);
    }
    
    return response.data;

  } catch (error) {
    console.error("Error generating AI report:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to generate report: ${errorMessage}`);
  }
}
