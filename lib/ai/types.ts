
export interface AIServiceResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  providerUsed?: 'groq' | 'gemini';
}

export interface GenerateContentOptions {
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

export interface AIProvider {
  generateContent(prompt: string, options?: GenerateContentOptions): Promise<string>;
  generateJson<T>(prompt: string, schema?: any, options?: GenerateContentOptions): Promise<T>;
}
