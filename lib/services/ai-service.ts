
import { GroqProvider } from '../ai/providers/groq';
import { GeminiProvider } from '../ai/providers/gemini';
import { AIServiceResponse, GenerateContentOptions } from '../ai/types';

export class AIService {
  private static groqProvider = new GroqProvider();
  private static geminiProvider = new GeminiProvider();

  static async generateContent(prompt: string, options?: GenerateContentOptions): Promise<AIServiceResponse<string>> {
    // Try Groq as the primary provider (per user preference)
    try {
      console.log('Generating content with Groq...');
      const data = await this.groqProvider.generateContent(prompt, options);
      return { success: true, data, providerUsed: 'groq' };
    } catch (error: any) {
      console.warn('Groq failed:', error.message);
      
      // If user explicitly doesn't want Gemini or it's not configured, don't fallback
      if (process.env.STOP_GEMINI_FALLBACK === 'true' || !process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
        return { success: false, data: '', error: `Groq failed: ${error.message}`, providerUsed: 'groq' };
      }

      // Fallback to Gemini only as a last resort
      try {
        console.log('Falling back to Gemini...');
        const data = await this.geminiProvider.generateContent(prompt, options);
        return { success: true, data, providerUsed: 'gemini' };
      } catch (geminiError: any) {
        console.error('Gemini fallback also failed:', geminiError.message);
        return { 
            success: false, 
            data: '', 
            error: `Both providers failed. Groq: ${error.message}. Gemini: ${geminiError.message}`,
            providerUsed: 'gemini' 
        };
      }
    }
  }

  static async generateJson<T>(prompt: string, schema?: any, options?: GenerateContentOptions): Promise<AIServiceResponse<T>> {
      try {
        console.log('Generating JSON with Groq...');
        const data = await this.groqProvider.generateJson<T>(prompt, schema, options);
        return { success: true, data, providerUsed: 'groq' };
      } catch (error: any) {
        console.warn('Groq JSON failed:', error.message);

        // Don't fallback if Gemini is likely to fail (403 from logs indicates it's broken)
        if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
           return { success: false, data: {} as T, error: `Groq failed: ${error.message}`, providerUsed: 'groq' };
        }

        try {
          console.log('Falling back to Gemini JSON...');
          const data = await this.geminiProvider.generateJson<T>(prompt, schema, options);
          return { success: true, data, providerUsed: 'gemini' };
        } catch (geminiError: any) {
          console.error('Gemini JSON fallback failed:', geminiError.message);
          return {
              success: false,
              data: {} as T,
              error: `Both providers failed. Groq: ${error.message}. Gemini: ${geminiError.message}`,
              providerUsed: 'gemini'
          };
        }
      }
  }
}
