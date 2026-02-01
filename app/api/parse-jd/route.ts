
import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/lib/services/ai-service';
import { GenerateContentOptions } from '@/lib/ai/types';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const jdText = formData.get('text') as string | null;

    if (!file && !jdText) {
      return NextResponse.json(
        { error: 'No file or text provided' },
        { status: 400 }
      );
    }

    let prompt = '';
    let options: GenerateContentOptions = { jsonMode: true };

    if (jdText) {
      // Text-based parsing
      prompt = `Analyze the following job description and extract the following information in JSON format:
{
  "title": "Job title/position name (e.g., 'Software Engineer - Google')",
  "jdName": "Short name for this job description (e.g., 'Google SWE JD 2024')",
  "interviewType": "Type of interview - one of: Technical, HR, Mixed, Coding Round (or null if not clear)",
  "duration": "Interview duration in minutes (as a number, or null if not mentioned)",
  "skills": ["array", "of", "key", "skills", "mentioned"],
  "summary": "Brief 2-3 sentence summary of the role"
}

Job Description:
${jdText}

Return ONLY valid JSON, no additional text or markdown formatting.`;
    } else if (file) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64Data = buffer.toString('base64');
      
      // Determine MIME type
      let mimeType = file.type;
      if (!mimeType) {
        if (file.name.endsWith('.pdf')) mimeType = 'application/pdf';
        else if (file.name.endsWith('.txt')) mimeType = 'text/plain';
        else if (file.name.endsWith('.doc')) mimeType = 'application/msword';
        else if (file.name.endsWith('.docx')) mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        else mimeType = 'application/octet-stream';
      }

      // For text files, read directly
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        const textContent = buffer.toString('utf-8');
        prompt = `Analyze the following job description and extract the following information in JSON format:
{
  "title": "Job title/position name (e.g., 'Software Engineer - Google')",
  "jdName": "Short name for this job description (e.g., 'Google SWE JD 2024')",
  "interviewType": "Type of interview - one of: Technical, HR, Mixed, Coding Round (or null if not clear)",
  "duration": "Interview duration in minutes (as a number, or null if not mentioned)",
  "skills": ["array", "of", "key", "skills", "mentioned"],
  "summary": "Brief 2-3 sentence summary of the role"
}

Job Description:
${textContent}

Return ONLY valid JSON, no additional text or markdown formatting.`;
      } else {
        // For binaries, use inline data
        prompt = `Extract and analyze the Job Description from this file.

Extract the following information in JSON format:
{
  "title": "Job title/position name (e.g., 'Software Engineer - Google')",
  "jdName": "Short name for this job description (e.g., 'Google SWE JD 2024')",
  "interviewType": "Type of interview - one of: Technical, HR, Mixed, Coding Round (or null if not clear)",
  "duration": "Interview duration in minutes (as a number, or null if not mentioned)",
  "skills": ["array", "of", "key", "skills", "mentioned"],
  "summary": "Brief 2-3 sentence summary of the role"
}

Return ONLY valid JSON, no additional text or markdown formatting.`;

        options.inlineData = {
          mimeType: mimeType,
          data: base64Data
        };
      }
    }

    // Call AIService
    // Note: We use any for the response schema type here as we handle validation manually/informally
    const response = await AIService.generateJson<any>(prompt, null, options);

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
        provider: response.providerUsed // Optional: useful for debugging
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
