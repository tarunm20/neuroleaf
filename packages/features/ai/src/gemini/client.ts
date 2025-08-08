import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { 
  AIServiceConfig, 
  AIServiceError, 
  QuotaExceededError, 
  ModelUnavailableError,
  InvalidRequestError 
} from '../types';

export class GeminiClient {
  private client: GoogleGenerativeAI;
  private model: GenerativeModel;
  private config: AIServiceConfig;

  constructor(config: AIServiceConfig) {
    this.config = config;
    this.client = new GoogleGenerativeAI(config.apiKey);
    this.model = this.client.getGenerativeModel({ 
      model: config.model,
      generationConfig: {
        temperature: config.temperature ?? 0.7,
        topP: config.topP ?? 0.95,
        topK: config.topK ?? 40,
        maxOutputTokens: config.maxTokens ?? 2048,
      },
    });
  }

  async generateContent(prompt: string): Promise<{
    text: string;
    tokensUsed: number;
    estimatedCost: number;
  }> {
    return this.generateContentWithTokenLimit(prompt, this.config.maxTokens);
  }

  async generateContentWithTokenLimit(prompt: string, maxTokens?: number): Promise<{
    text: string;
    tokensUsed: number;
    estimatedCost: number;
  }> {
    return this.withRetry(async () => {
      const startTime = Date.now();
      
      // Validate prompt
      if (!prompt || prompt.trim().length === 0) {
        throw new InvalidRequestError('Prompt cannot be empty');
      }

      if (prompt.length > 100000) {
        throw new InvalidRequestError('Prompt is too long. Maximum 100,000 characters allowed.');
      }

      // Create a temporary model with custom token limit if provided
      const modelToUse = maxTokens && maxTokens !== this.config.maxTokens 
        ? this.client.getGenerativeModel({ 
            model: this.config.model,
            generationConfig: {
              temperature: this.config.temperature ?? 0.7,
              topP: this.config.topP ?? 0.95,
              topK: this.config.topK ?? 40,
              maxOutputTokens: maxTokens,
            },
          })
        : this.model;
      
      const result = await modelToUse.generateContent(prompt);
      const response = await result.response;
      
      if (!response) {
        throw new AIServiceError('No response from Gemini API', 'NO_RESPONSE');
      }

      const text = response.text();
      
      if (!text || text.trim().length === 0) {
        throw new AIServiceError('Empty response from Gemini API', 'EMPTY_RESPONSE');
      }

      const processingTime = Date.now() - startTime;

      // Estimate token usage (Gemini doesn't provide exact counts)
      const tokensUsed = this.estimateTokenUsage(prompt, text);
      const estimatedCost = this.calculateCost(tokensUsed);

      console.log(`[GeminiClient] Generated content with ${maxTokens || this.config.maxTokens} max tokens, estimated ${tokensUsed} tokens used`);

      return {
        text,
        tokensUsed,
        estimatedCost,
      };
    });
  }

  async generateContentStream(prompt: string) {
    return this.withRetry(async () => {
      const result = await this.model.generateContentStream(prompt);
      return result.stream;
    });
  }

  private estimateTokenUsage(prompt: string, response: string): number {
    // Rough estimation: ~4 characters per token for English
    const promptTokens = Math.ceil(prompt.length / 4);
    const responseTokens = Math.ceil(response.length / 4);
    return promptTokens + responseTokens;
  }

  private calculateCost(tokens: number): number {
    // Gemini Pro pricing (as of 2024): $0.00025 per 1K tokens for input, $0.00075 per 1K tokens for output
    // This is a simplified calculation - you should update with actual pricing
    const costPer1KTokens = 0.0005; // Average cost
    return (tokens / 1000) * costPer1KTokens;
  }

  private async withRetry<T>(operation: () => Promise<T>, maxRetries: number = 3): Promise<T> {
    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Only retry on quota exceeded, rate limit, or service unavailable errors
        const shouldRetry = this.shouldRetryError(error) && attempt < maxRetries;
        
        if (!shouldRetry) {
          throw this.handleError(error);
        }
        
        // Exponential backoff: 1s, 2s, 4s, 8s...
        const delayMs = Math.min(1000 * Math.pow(2, attempt), 10000); // Cap at 10 seconds
        
        console.log(`[GeminiClient] Attempt ${attempt + 1} failed, retrying in ${delayMs}ms...`, {
          error: (error as any)?.message || 'Unknown error',
          attempt: attempt + 1,
          maxRetries: maxRetries + 1,
        });
        
        await this.delay(delayMs);
      }
    }
    
    throw this.handleError(lastError);
  }

  private shouldRetryError(error: any): boolean {
    const message = error?.message?.toLowerCase() || '';
    const status = error?.status;
    
    // Retry on quota exceeded, rate limits, and temporary service issues
    return (
      message.includes('quota') || 
      message.includes('quota_exceeded') ||
      message.includes('rate limit') ||
      status === 429 || // Rate limit
      status === 503 || // Service unavailable
      status === 500 || // Internal server error (temporary)
      (message.includes('network') && !message.includes('api key')) // Network issues but not auth
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private handleError(error: any): AIServiceError {
    if (error instanceof AIServiceError) {
      return error;
    }

    const message = error?.message || 'Unknown AI service error';
    
    // Handle specific Gemini API errors
    if (message.includes('API key not valid') || message.includes('API_KEY_INVALID')) {
      return new InvalidRequestError('Invalid Gemini API key. Please check your configuration.');
    }
    
    if (message.includes('quota') || message.includes('QUOTA_EXCEEDED')) {
      return new QuotaExceededError('Gemini API quota exceeded. Please try again later.');
    }
    
    if (message.includes('model') && message.includes('not found')) {
      return new ModelUnavailableError('Gemini model not available');
    }
    
    if (message.includes('invalid') || message.includes('bad request') || message.includes('INVALID_ARGUMENT')) {
      return new InvalidRequestError('Invalid request to Gemini API');
    }

    if (message.includes('safety') || message.includes('SAFETY')) {
      return new InvalidRequestError('Content was blocked by safety filters. Please try different content.');
    }

    if (message.includes('RECITATION')) {
      return new InvalidRequestError('Content blocked due to recitation concerns. Please try different content.');
    }

    if (error?.status === 400) {
      return new InvalidRequestError('Bad request to Gemini API');
    }

    if (error?.status === 401 || error?.status === 403) {
      return new InvalidRequestError('Authentication failed. Please check your API key.');
    }

    if (error?.status === 429) {
      return new QuotaExceededError('Rate limit exceeded. Please try again later.');
    }

    if (error?.status === 503 || error?.status === 500) {
      return new ModelUnavailableError('Gemini service temporarily unavailable');
    }

    // Network errors
    if (message.includes('fetch') || message.includes('network') || error?.code === 'ENOTFOUND') {
      return new AIServiceError('Network error connecting to Gemini API', 'NETWORK_ERROR');
    }

    return new AIServiceError(message, 'GEMINI_ERROR', error?.status);
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.generateContent('Test');
      return result.text.length > 0;
    } catch {
      return false;
    }
  }
}