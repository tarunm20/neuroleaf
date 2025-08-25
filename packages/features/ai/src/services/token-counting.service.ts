// import { VertexAI } from '@google-cloud/vertexai'; // Temporarily disabled for development

export interface TokenCountResult {
  tokenCount: number;
  characterCount: number;
  method: 'accurate' | 'estimated';
}

export class TokenCountingService {
  // private vertexAI: VertexAI | null = null; // Temporarily disabled for development

  constructor() {
    // Temporarily using estimation only for development
    // Initialize Vertex AI if environment variables are available
    // try {
    //   if (process.env.GOOGLE_CLOUD_PROJECT && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    //     this.vertexAI = new VertexAI({
    //       project: process.env.GOOGLE_CLOUD_PROJECT,
    //       location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
    //     });
    //   }
    // } catch (error) {
    //   console.warn('Could not initialize Vertex AI for token counting:', error);
    //   this.vertexAI = null;
    // }
  }

  /**
   * Count tokens in text using Google Gemini's tokenization
   * Falls back to estimation if API is not available
   */
  async countTokens(text: string, model: string = 'gemini-1.5-flash'): Promise<TokenCountResult> {
    const characterCount = text.length;

    // Try accurate counting first if Vertex AI is available
    // Temporarily disabled for development
    // if (this.vertexAI) {
    //   try {
    //     const generativeModel = this.vertexAI.getGenerativeModel({
    //       model: model,
    //     });

    //     const countResult = await generativeModel.countTokens(text);
        
    //     return {
    //       tokenCount: countResult.totalTokens || this.estimateTokens(text),
    //       characterCount,
    //       method: 'accurate'
    //     };
    //   } catch (error) {
    //     console.warn('Accurate token counting failed, falling back to estimation:', error);
    //   }
    // }

    // Fall back to estimation
    return {
      tokenCount: this.estimateTokens(text),
      characterCount,
      method: 'estimated'
    };
  }

  /**
   * Estimate tokens using the standard 4 characters = 1 token rule
   * This is based on Google Gemini documentation
   */
  private estimateTokens(text: string): number {
    if (!text || text.trim().length === 0) return 0;
    
    // Google Gemini: ~4 characters = 1 token
    return Math.ceil(text.length / 4);
  }

  /**
   * Count tokens for multiple texts and return combined result
   */
  async countTokensForMultipleTexts(texts: string[], model: string = 'gemini-1.5-flash'): Promise<TokenCountResult> {
    const combinedText = texts.join('\n\n');
    return await this.countTokens(combinedText, model);
  }

  /**
   * Format token count for display (e.g., "1.2k tokens")
   */
  formatTokenCount(tokenCount: number): string {
    if (tokenCount >= 1000000) {
      return `${(tokenCount / 1000000).toFixed(1)}M tokens`;
    } else if (tokenCount >= 1000) {
      return `${(tokenCount / 1000).toFixed(1)}k tokens`;
    }
    return `${tokenCount} tokens`;
  }

  /**
   * Get quick estimation without API call (for UI feedback)
   * This is useful for real-time updates as user types
   */
  quickEstimate(text: string): number {
    return this.estimateTokens(text);
  }
}

// Singleton instance
export const tokenCountingService = new TokenCountingService();