import { AIProvider, GenerateContentOptions } from '../types';

export abstract class BaseAIProvider implements AIProvider {
  abstract generateContent(prompt: string, options?: GenerateContentOptions): Promise<string>;
  abstract generateJson<T>(prompt: string, schema?: any, options?: GenerateContentOptions): Promise<T>;
}
