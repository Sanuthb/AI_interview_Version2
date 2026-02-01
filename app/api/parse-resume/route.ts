
import { NextRequest, NextResponse } from "next/server";
import { AIService } from '@/lib/services/ai-service';

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

    // Use LangChain PDF loader when the file is a PDF
    let resumeText = "";

    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      // Create a Blob from the file
      const blob = new Blob([await file.arrayBuffer()], { type: "application/pdf" });
      const { parseResume } = await import("@/lib/services/resume-parser");
      resumeText = await parseResume(blob);
    } else {
      // Fallback: read as text for DOC/DOCX or other text-like formats
      const arrayBuffer = await file.arrayBuffer();
      resumeText = Buffer.from(arrayBuffer).toString("utf-8");
    }

    if (!resumeText.trim()) {
      return NextResponse.json(
        { error: "Could not extract text from resume. Please upload a clear PDF or text-based file." },
        { status: 400 }
      );
    }

    const jdText = formData.get("jd_text") as string | null;

    const prompt = `You are evaluating a candidate's resume for a specific job description.

    **Job Description:**
    ${jdText || "No specific job description provided. Evaluate based on general software engineering standards."}

    **Candidate Resume:**
    ${resumeText.substring(0, 10000)}

    **Task:**
    Analyze the resume specifically against the provided Job Description. 
    - strict matching of skills and experience to the JD.
    - If the JD mentions specific technologies, prioritize them heavily.
    
    Return a JSON object with scores (0-100).
    
    Return JSON in the following structure:
    {
      "skillsMatchScore": 0,
      "projectRelevanceScore": 0,
      "experienceSuitabilityScore": 0,
      "overallScore": 0,
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

    return NextResponse.json({
      success: true,
      data: {
        skillsMatchScore: parsed.skillsMatchScore ?? 0,
        projectRelevanceScore: parsed.projectRelevanceScore ?? 0,
        experienceSuitabilityScore: parsed.experienceSuitabilityScore ?? 0,
        overallScore: parsed.overallScore ?? 0,
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
