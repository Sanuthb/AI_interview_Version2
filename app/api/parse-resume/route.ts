import { NextRequest, NextResponse } from "next/server";
import { AIService } from '@/lib/services/ai-service';
import { DocumentParser } from "@/lib/services/document-parser";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No resume file provided" },
        { status: 400 }
      );
    }

    // Use centralized DocumentParser to extract text
    let resumeText = "";
    try {
      resumeText = await DocumentParser.extractText(file);
    } catch (parseError: any) {
      console.error("Error extracting text from resume:", parseError);
      return NextResponse.json(
        { error: "Could not extract text from resume. Please upload a clear PDF or text-based file." },
        { status: 400 }
      );
    }

    if (!resumeText.trim()) {
      return NextResponse.json(
        { error: "Could not extract text from resume. Please upload a clear PDF or text-based file." },
        { status: 400 }
      );
    }

    const jdText = formData.get("jd_text") as string | null;
    const candidateName = formData.get("candidate_name") as string | null;

    const prompt = `You are evaluating a candidate's resume for a specific job description and verifying their identity.

    **Logged-in Candidate Name:**
    ${candidateName || "Not provided"}

    **Job Description:**
    ${jdText || "No specific job description provided. Evaluate based on general software engineering standards."}

    **Candidate Resume Content:**
    ${resumeText.substring(0, 10000)}

    **Task:**
    1. **Identity Check**: Extract the name from the resume. Compare it strictly with the "Logged-in Candidate Name" (${candidateName}). 
       - If the names are significantly different, mark "isCandidateMatch" as false.
       - Allow for minor variations (e.g., "John Doe" vs "John D").
       - If no name is found in the resume, mark "isCandidateMatch" as false.
    2. **Resume Validation**: Verify if the content is actually a professional resume/CV.
    3. **JD Match**: Analyze the resume specifically against the provided Job Description.

    **Evaluation Guidelines:**
    - **Context Awareness**: If the resume suggests the candidate is a student (e.g., mention of MCA, BCA, Internships), evaluate them as an entry-level candidate.
    - **Scoring Nuance**: Do not penalize students heavily for "limited professional experience" if their technical skills and project relevance are strong. 
    - **Balanced Weighting**: For students, weigh "Skills Match" and "Project Relevance" more heavily than "Experience Suitability".
    - **Encouragement**: Strengths and weaknesses should be constructive. A score of 7 should represent a "Good" candidate for entry-level roles.
    - **JSON Structure**: Ensure scores are integers from 0 to 10. (The frontend will scale these).

    Return JSON in the following structure:
    {
      "isCandidateMatch": boolean,
      "isResume": boolean,
      "validationReason": "String explaining mismatch or invalid resume",
      "extractedName": "String",
      "skillsMatchScore": 0, // 0-10
      "projectRelevanceScore": 0, // 0-10
      "experienceSuitabilityScore": 0, // 0-10
      "overallScore": 0, // 0-10
      "overallRating": "Poor | Average | Good | Great",
      "strengths": ["bullet", "bullet"],
      "weaknesses": ["bullet", "bullet"]
    }
    
    Return ONLY valid JSON.`;

    const response = await AIService.generateJson<any>(prompt, null, { jsonMode: true });

    if (!response.success) {
        return NextResponse.json(
        { error: response.error || "Failed to analyze resume" },
        { status: 500 }
      );
    }

    const parsed = response.data;

    // Validation checks
    if (!parsed.isResume) {
      return NextResponse.json(
        { error: parsed.validationReason || "The uploaded file does not appear to be a valid resume." },
        { status: 400 }
      );
    }

    if (!parsed.isCandidateMatch) {
      return NextResponse.json(
        { error: parsed.validationReason || `Identity mismatch: This resume appears to belong to someone else (${parsed.extractedName}).` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        skillsMatchScore: (parsed.skillsMatchScore ?? 0) * 10,
        projectRelevanceScore: (parsed.projectRelevanceScore ?? 0) * 10,
        experienceSuitabilityScore: (parsed.experienceSuitabilityScore ?? 0) * 10,
        overallScore: (parsed.overallScore ?? 0) * 10,
        overallRating: parsed.overallRating ?? "Average",
        strengths: parsed.strengths ?? [],
        weaknesses: parsed.weaknesses ?? [],
        resumeText, // Return the extracted text so frontend can save it
        provider: response.providerUsed
      },
    });
  } catch (error: any) {
    console.error("Error parsing resume:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze resume" },
      { status: 500 }
    );
  }
}
