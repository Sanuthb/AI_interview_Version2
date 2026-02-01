
import { GroqProvider } from '../ai/providers/groq';
import { GeminiProvider } from '../ai/providers/gemini';
import { AIServiceResponse, GenerateContentOptions } from '../ai/types';

export class AIService {
  private static groqProvider = new GroqProvider();
  private static geminiProvider = new GeminiProvider();

  static async generateContent(prompt: string, options?: GenerateContentOptions): Promise<AIServiceResponse<string>> {
    // Try Groq first
    try {
      console.log('Attempting to generate content with Groq...');
      const data = await this.groqProvider.generateContent(prompt, options);
      return { success: true, data, providerUsed: 'groq' };
    } catch (error) {
      console.warn('Groq failed, falling back to Gemini:', error);
      // Fallback to Gemini
      try {
        console.log('Attempting to generate content with Gemini...');
        const data = await this.geminiProvider.generateContent(prompt, options);
        return { success: true, data, providerUsed: 'gemini' };
      } catch (geminiError: any) {
        console.error('Gemini also failed:', geminiError);
        return { 
            success: false, 
            data: '', 
            error: geminiError.message || 'Both AI providers failed',
            providerUsed: 'gemini' 
        };
      }
    }
  }

  static async generateJson<T>(prompt: string, schema?: any, options?: GenerateContentOptions): Promise<AIServiceResponse<T>> {
      // Try Groq first
      try {
        console.log('Attempting to generate JSON with Groq...');
        const data = await this.groqProvider.generateJson<T>(prompt, schema, options);
        return { success: true, data, providerUsed: 'groq' };
      } catch (error) {
        console.warn('Groq JSON failed, falling back to Gemini:', error);
        // Fallback to Gemini
        try {
          console.log('Attempting to generate JSON with Gemini...');
          const data = await this.geminiProvider.generateJson<T>(prompt, schema, options);
          return { success: true, data, providerUsed: 'gemini' };
        } catch (geminiError: any) {
          console.error('Gemini JSON also failed:', geminiError);
           // We can't type check error return easily here without casting, so we return a rejected promise or null
           // But for robustness, let's return a failure object casted to any
           return {
               success: false,
               data: {} as T, // Return empty object or null as appropriate
               error: geminiError.message || 'Both AI providers failed',
               providerUsed: 'gemini'
           };
        }
      }
  }
}
