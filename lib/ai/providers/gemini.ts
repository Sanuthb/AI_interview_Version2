
import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseAIProvider } from './base';
import { GenerateContentOptions } from '../types';
import { AI_CONFIG } from '../config';

export class GeminiProvider extends BaseAIProvider {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    super();
    this.genAI = new GoogleGenerativeAI(AI_CONFIG.gemini.apiKey);
    this.model = this.genAI.getGenerativeModel({ model: AI_CONFIG.gemini.defaultModel });
  }

  async generateContent(prompt: string, options?: GenerateContentOptions): Promise<string> {
    let finalPrompt = prompt;
    
    if (options?.systemPrompt) {
        finalPrompt = `System: ${options.systemPrompt}\n\nUser: ${prompt}`;
    }

    let parts: any[] = [{ text: finalPrompt }];

    if (options?.inlineData) {
        parts = [
            {
                inlineData: {
                    mimeType: options.inlineData.mimeType,
                    data: options.inlineData.data
                }
            },
            { text: finalPrompt }
        ];
    }

    const result = await this.model.generateContent(parts);
    const response = await result.response;
    return response.text();
  }

  async generateJson<T>(prompt: string, schema?: any, options?: GenerateContentOptions): Promise<T> {
     // Gemini's robust JSON handling often requires explicit prompt engineering if not using constrained decoding (which we aren't here yet)
     // But we can depend on the prompt asking for JSON.
     const content = await this.generateContent(prompt, options);
     try {
         // Clean potential markdown blocks
         const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
         return JSON.parse(cleanContent);
     } catch (e) {
         console.error('Failed to parse Gemini JSON:', content);
         throw new Error('Failed to parse JSON response from Gemini');
     }
  }
}
