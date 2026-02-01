/**
 * Service to parse job descriptions using Gemini AI
 */

export interface ParsedJD {
  title: string;
  jdName: string;
  interviewType: string | null;
  duration: string | null;
  skills: string[];
  summary: string;
}

export async function parseJobDescription(
  file: File | null,
  text: string | null
): Promise<ParsedJD> {
  const formData = new FormData();
  
  if (file) {
    formData.append('file', file);
  } else if (text) {
    formData.append('text', text);
  } else {
    throw new Error('Either file or text must be provided');
  }

  const response = await fetch('/api/parse-jd', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to parse job description');
  }

  const result = await response.json();
  return result.data;
}

