import { getSupabaseServerClient } from '@kit/supabase/server-client';

export interface TokenUsageData {
  currentUsage: number;
  limit: number;
  canConsumeTokens: boolean;
  isProTier: boolean;
}

export class TokenUsageTrackingService {
  private getSupabaseClient() {
    return getSupabaseServerClient();
  }

  /**
   * Get current month's token usage for a user
   */
  async getCurrentMonthUsage(userId: string): Promise<number> {
    const supabase = this.getSupabaseClient();
    const { data, error } = await supabase.rpc('get_current_month_token_usage', {
      p_user_id: userId
    });

    if (error) {
      console.error('Error fetching token usage:', error);
      return 0;
    }

    return data || 0;
  }

  /**
   * Increment token usage for a user
   */
  async incrementUsage(userId: string, tokensUsed: number): Promise<number> {
    const supabase = this.getSupabaseClient();
    const { data, error } = await supabase.rpc('increment_token_usage', {
      p_user_id: userId,
      p_tokens_used: tokensUsed
    });

    if (error) {
      console.error('Error incrementing token usage:', error);
      throw new Error('Failed to increment token usage');
    }

    return data || tokensUsed;
  }

  /**
   * Get comprehensive usage data for a user including limits
   */
  async getUsageData(userId: string, userTier: 'free' | 'pro' = 'free', aiTokensPerMonth: number = 10000): Promise<TokenUsageData> {
    const isProTier = userTier === 'pro';
    const limit = aiTokensPerMonth;
    
    // Pro users have unlimited usage
    if (isProTier || limit === -1) {
      return {
        currentUsage: 0, // Not relevant for Pro users
        limit: -1,
        canConsumeTokens: true,
        isProTier: true,
      };
    }

    const currentUsage = await this.getCurrentMonthUsage(userId);
    
    return {
      currentUsage,
      limit,
      canConsumeTokens: currentUsage < limit,
      isProTier: false,
    };
  }

  /**
   * Check if user can consume tokens (middleware function)
   */
  async canUserConsumeTokens(
    userId: string, 
    tokensRequested: number, 
    userTier: 'free' | 'pro' = 'free',
    aiTokensPerMonth: number = 10000
  ): Promise<{
    allowed: boolean;
    reason?: string;
    currentUsage?: number;
    limit?: number;
    remainingTokens?: number;
  }> {
    const usageData = await this.getUsageData(userId, userTier, aiTokensPerMonth);
    
    if (usageData.isProTier) {
      return { allowed: true };
    }

    const wouldExceedLimit = (usageData.currentUsage + tokensRequested) > usageData.limit;
    const remainingTokens = usageData.limit - usageData.currentUsage;

    if (wouldExceedLimit) {
      return {
        allowed: false,
        reason: `This would exceed your monthly limit of ${usageData.limit.toLocaleString()} tokens. You have ${remainingTokens.toLocaleString()} tokens remaining this month.`,
        currentUsage: usageData.currentUsage,
        limit: usageData.limit,
        remainingTokens,
      };
    }

    return {
      allowed: true,
      currentUsage: usageData.currentUsage,
      limit: usageData.limit,
      remainingTokens,
    };
  }

  /**
   * Get usage statistics for display
   */
  async getUsageStats(userId: string, userTier: 'free' | 'pro' = 'free', aiTokensPerMonth: number = 10000): Promise<{
    currentUsage: number;
    limit: number;
    percentage: number;
    remainingTokens: number;
    isProTier: boolean;
    daysUntilReset: number;
  }> {
    const usageData = await this.getUsageData(userId, userTier, aiTokensPerMonth);
    
    // Calculate days until month reset
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const daysUntilReset = Math.ceil((nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (usageData.isProTier) {
      return {
        currentUsage: 0,
        limit: -1,
        percentage: 0,
        remainingTokens: -1, // Unlimited
        isProTier: true,
        daysUntilReset,
      };
    }

    const percentage = (usageData.currentUsage / usageData.limit) * 100;
    const remainingTokens = Math.max(0, usageData.limit - usageData.currentUsage);

    return {
      currentUsage: usageData.currentUsage,
      limit: usageData.limit,
      percentage: Math.round(percentage),
      remainingTokens,
      isProTier: false,
      daysUntilReset,
    };
  }

  /**
   * Estimate token usage for text content
   * Simple approximation: ~4 characters per token for English text
   */
  estimateTokensFromText(text: string): number {
    if (!text || text.trim().length === 0) return 0;
    
    // Simple estimation: divide character count by 4
    // This is a rough approximation for English text
    const estimatedTokens = Math.ceil(text.length / 4);
    
    // Add some overhead for AI processing (input + output tokens)
    // Assume output is typically 10-20% of input for flashcard generation
    const withOverhead = Math.ceil(estimatedTokens * 1.2);
    
    return withOverhead;
  }

  /**
   * Estimate token usage for question generation
   * Based on content length and number of questions
   */
  estimateTokensForQuestionGeneration(
    contentLength: number, 
    numQuestions: number = 10
  ): number {
    // Base tokens for content processing
    const baseTokens = Math.ceil(contentLength / 4);
    
    // Additional tokens per question (prompt + response)
    const tokensPerQuestion = 50; // Rough estimate
    const questionTokens = numQuestions * tokensPerQuestion;
    
    return baseTokens + questionTokens;
  }

  /**
   * Clean up old usage records (can be called via cron job)
   */
  async cleanupOldRecords(): Promise<number> {
    const supabase = this.getSupabaseClient();
    const { data, error } = await supabase.rpc('reset_old_token_usage');

    if (error) {
      console.error('Error cleaning up old token records:', error);
      return 0;
    }

    return data || 0;
  }
}

// Singleton instance
export const tokenUsageTrackingService = new TokenUsageTrackingService();