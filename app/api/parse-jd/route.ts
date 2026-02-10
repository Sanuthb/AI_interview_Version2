import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/lib/services/ai-service';
import { DocumentParser } from '@/lib/services/document-parser';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const jdText = formData.get('text') as string | null;

    if (!file && !jdText) {
      return NextResponse.json(
        { error: 'No file or text provided' },
        { status: 400 }
      );
    }

    // Extract text from file or use provided text
    let textToAnalyze = '';
    if (file) {
      textToAnalyze = await DocumentParser.extractText(file);
    } else if (jdText) {
      textToAnalyze = jdText;
    }

    if (!textToAnalyze.trim()) {
      return NextResponse.json(
        { error: 'Could not extract text from the provided source.' },
        { status: 400 }
      );
    }

    const prompt = `Analyze the following job description and extract the following information in JSON format:
{
  "title": "Job title/position name (e.g., 'Software Engineer - Google')",
  "jdName": "Short name for this job description (e.g., 'Google SWE JD 2024')",
  "interviewType": "Type of interview - one of: Technical, HR, Mixed, Coding Round (or null if not clear)",
  "duration": "Interview duration in minutes (as a number, or null if not mentioned)",
  "skills": ["array", "of", "key", "skills", "mentioned"],
  "summary": "Brief 2-3 sentence summary of the role"
}

Job Description:
${textToAnalyze}

Return ONLY valid JSON, no additional text or markdown formatting.`;

    // Call AIService
    // Groq is now prioritized in AIService
    const response = await AIService.generateJson<any>(prompt, null, { jsonMode: true });

    if (!response.success) {
       return NextResponse.json(
        { error: response.error || 'Failed to parse job description' },
        { status: 500 }
      );
    }

    const parsedData = response.data;

    return NextResponse.json({
      success: true,
      data: {
        title: parsedData.title || '',
        jdName: parsedData.jdName || '',
        interviewType: parsedData.interviewType || null,
        duration: parsedData.duration ? String(parsedData.duration) : null,
        skills: parsedData.skills || [],
        summary: parsedData.summary || '',
        provider: response.providerUsed
      },
    });

  } catch (error: any) {
    console.error('Error parsing job description:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to parse job description' },
      { status: 500 }
    );
  }
}
