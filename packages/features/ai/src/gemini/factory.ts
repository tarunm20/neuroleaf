import { GeminiClient } from './client';
import { AIServiceConfig } from '../types';

export function createGeminiClient(): GeminiClient {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is required');
  }

  const config: AIServiceConfig = {
    apiKey,
    model,
    temperature: 0.7,
    topP: 0.95,
    topK: 40,
    maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS || '4096', 10),
  };

  return new GeminiClient(config);
}