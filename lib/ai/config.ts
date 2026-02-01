
export const AI_CONFIG = {
  groq: {
    apiKey: process.env.GROQ_API_KEY || '', // Ensure this is set in .env
    defaultModel: 'llama-3.3-70b-versatile',
  },
  gemini: {
    apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',
    defaultModel: 'gemini-1.5-flash',
  },
};
