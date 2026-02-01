
import Groq from 'groq-sdk';
import { BaseAIProvider } from './base';
import { GenerateContentOptions } from '../types';
import { AI_CONFIG } from '../config';

export class GroqProvider extends BaseAIProvider {
  private client: Groq;

  constructor() {
    super();
    this.client = new Groq({
      apiKey: AI_CONFIG.groq.apiKey || 'dummy_key', // Prevent crash if key missing, handled at runtime
      dangerouslyAllowBrowser: true, // If used on client side, though strict server side is preferred
    });
  }

  async generateContent(prompt: string, options?: GenerateContentOptions): Promise<string> {
    if (options?.inlineData) {
        throw new Error("GroqProvider does not support inlineData/files.");
    }

    const response = await this.client.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: options?.systemPrompt || 'You are a helpful AI assistant.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: AI_CONFIG.groq.defaultModel,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens,
      response_format: options?.jsonMode ? { type: 'json_object' } : undefined,
    });

    return response.choices[0]?.message?.content || '';
  }

  async generateJson<T>(prompt: string, schema?: any, options?: GenerateContentOptions): Promise<T> {
    const jsonOptions = { ...options, jsonMode: true };
    const content = await this.generateContent(prompt, jsonOptions);
    try {
      return JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse Groq JSON:', content);
      throw new Error('Failed to parse JSON response from Groq');
    }
  }
}
