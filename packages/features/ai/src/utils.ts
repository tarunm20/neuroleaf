/**
 * Utility functions for AI services
 */

// Cost calculation utilities
export const GEMINI_PRICING = {
  PRO: {
    INPUT_COST_PER_1K: 0.00025,
    OUTPUT_COST_PER_1K: 0.00075,
  },
  FLASH: {
    INPUT_COST_PER_1K: 0.000075,
    OUTPUT_COST_PER_1K: 0.0003,
  },
} as const;

export function estimateGeminiCost(
  inputTokens: number,
  outputTokens: number,
  model: 'gemini-1.5-pro' | 'gemini-1.5-flash' = 'gemini-1.5-flash'
): number {
  const pricing = model.includes('pro') ? GEMINI_PRICING.PRO : GEMINI_PRICING.FLASH;
  
  const inputCost = (inputTokens / 1000) * pricing.INPUT_COST_PER_1K;
  const outputCost = (outputTokens / 1000) * pricing.OUTPUT_COST_PER_1K;
  
  return inputCost + outputCost;
}

// Token estimation utilities
export function estimateTokens(text: string): number {
  // Rough estimation: ~4 characters per token for English
  // More accurate for actual implementation would use tiktoken or similar
  return Math.ceil(text.length / 4);
}

export function estimateInputOutputTokens(prompt: string, response: string): {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
} {
  const inputTokens = estimateTokens(prompt);
  const outputTokens = estimateTokens(response);
  
  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
  };
}

// Content processing utilities
export function sanitizeContent(content: string): string {
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]+>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

export function truncateContent(content: string, maxLength: number = 10000): string {
  if (content.length <= maxLength) {
    return content;
  }
  
  // Try to cut at a sentence boundary
  const truncated = content.substring(0, maxLength);
  const lastSentence = truncated.lastIndexOf('.');
  
  if (lastSentence > maxLength * 0.8) {
    return truncated.substring(0, lastSentence + 1);
  }
  
  return truncated + '...';
}

// Rate limiting utilities
export class RateLimiter {
  private requests: number[] = [];
  
  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}
  
  canMakeRequest(): boolean {
    const now = Date.now();
    
    // Remove old requests outside the window
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    return this.requests.length < this.maxRequests;
  }
  
  recordRequest(): void {
    this.requests.push(Date.now());
  }
  
  getTimeUntilReset(): number {
    if (this.requests.length < this.maxRequests) {
      return 0;
    }
    
    const oldestRequest = Math.min(...this.requests);
    return this.windowMs - (Date.now() - oldestRequest);
  }
}

// Validation utilities
export function validateFlashcardContent(front: string, back: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!front || front.trim().length === 0) {
    errors.push('Front content is required');
  } else if (front.length > 500) {
    errors.push('Front content is too long (max 500 characters)');
  }
  
  if (!back || back.trim().length === 0) {
    errors.push('Back content is required');
  } else if (back.length > 2000) {
    errors.push('Back content is too long (max 2000 characters)');
  }
  
  // Check for similarity (very basic check)
  if (front && back && front.toLowerCase() === back.toLowerCase()) {
    errors.push('Front and back content should be different');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Retry utilities
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxAttempts) {
        break;
      }
      
      // Exponential backoff
      const waitTime = delay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw lastError!;
}

// Content analysis utilities
export function analyzeContent(content: string): {
  wordCount: number;
  estimatedReadingTime: number; // in minutes
  complexity: 'simple' | 'moderate' | 'complex';
  topics: string[];
} {
  const words = content.split(/\s+/).filter(word => word.length > 0);
  const wordCount = words.length;
  
  // Average reading speed: 200-250 words per minute
  const estimatedReadingTime = Math.ceil(wordCount / 225);
  
  // Simple complexity analysis based on word length and sentence length
  const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / wordCount;
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgSentenceLength = wordCount / sentences.length;
  
  let complexity: 'simple' | 'moderate' | 'complex';
  if (avgWordLength < 5 && avgSentenceLength < 15) {
    complexity = 'simple';
  } else if (avgWordLength < 7 && avgSentenceLength < 25) {
    complexity = 'moderate';
  } else {
    complexity = 'complex';
  }
  
  // Extract potential topics (very basic - could be improved with NLP)
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those']);
  
  const topics = words
    .map(word => word.toLowerCase().replace(/[^a-z]/g, ''))
    .filter(word => word.length > 3 && !commonWords.has(word))
    .reduce((acc: { [key: string]: number }, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {});
  
  const sortedTopics = Object.entries(topics)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);
  
  return {
    wordCount,
    estimatedReadingTime,
    complexity,
    topics: sortedTopics,
  };
}