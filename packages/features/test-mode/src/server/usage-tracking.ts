'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { requireUser } from '@kit/supabase/require-user';
import { usageTrackingService } from '../services/usage-tracking.service';

// Conversion factor: approximate tokens per question for display purposes
const TOKENS_PER_QUESTION = 25;

/**
 * Get current usage data for the authenticated user
 */
export async function getCurrentUsageAction(): Promise<{
  currentUsage: number;
  limit: number;
  canConsumeQuestions: boolean;
  remainingQuestions: number;
  isProTier: boolean;
  percentage: number;
  daysUntilReset: number;
}> {
  const client = getSupabaseServerClient();
  const { data: user } = await requireUser(client);

  if (!user) {
    throw new Error('User not authenticated');
  }
  
  // Get user's subscription tier
  const { data: account } = await client
    .from('accounts')
    .select('subscription_tier')
    .eq('id', user.id)
    .single();

  const userTier = (account?.subscription_tier || 'free') as 'free' | 'pro';
  
  const questionLimit = userTier === 'pro' ? -1 : 100; // 100 questions per month for free users
  const tokenLimit = userTier === 'pro' ? -1 : questionLimit * TOKENS_PER_QUESTION; // Convert to token equivalent
  
  const [usageData, usageStats] = await Promise.all([
    usageTrackingService.getUsageData(user.id, userTier, tokenLimit),
    usageTrackingService.getUsageStats(user.id, userTier, tokenLimit),
  ]);
  
  // Convert token-based data to question-based for display
  const currentUsageQuestions = userTier === 'pro' ? 0 : Math.floor(usageData.currentUsage / TOKENS_PER_QUESTION);
  const _remainingQuestions = userTier === 'pro' ? -1 : Math.max(0, questionLimit - currentUsageQuestions);

  return {
    currentUsage: currentUsageQuestions,
    limit: questionLimit,
    canConsumeQuestions: usageData.canConsumeTokens,
    remainingQuestions: _remainingQuestions,
    isProTier: usageData.isProTier,
    percentage: userTier === 'pro' ? 0 : Math.round((currentUsageQuestions / questionLimit) * 100),
    daysUntilReset: usageStats.daysUntilReset,
  };
}

/**
 * Check if user can generate a test and increment usage if allowed
 */
export async function checkAndIncrementUsageAction(questionCount: number = 10): Promise<{
  allowed: boolean;
  reason?: string;
  newUsage?: number;
  questionsUsed?: number;
}> {
  const client = getSupabaseServerClient();
  const { data: user } = await requireUser(client);

  if (!user) {
    throw new Error('User not authenticated');
  }
  
  // Get user's subscription tier
  const { data: account } = await client
    .from('accounts')
    .select('subscription_tier')
    .eq('id', user.id)
    .single();

  const userTier = (account?.subscription_tier || 'free') as 'free' | 'pro';
  const questionLimit = userTier === 'pro' ? -1 : 100; // 100 questions per month for free users
  const tokenLimit = userTier === 'pro' ? -1 : questionLimit * TOKENS_PER_QUESTION;
  const tokenEquivalent = questionCount * TOKENS_PER_QUESTION; // Convert questions to token equivalent
  
  // Check if user can generate test with specified number of questions (converted to tokens)
  const canGenerate = await usageTrackingService.canUserConsumeTokens(user.id, tokenEquivalent, userTier, tokenLimit);
  
  if (!canGenerate.allowed) {
    return {
      allowed: false,
      reason: canGenerate.reason,
    };
  }

  // If allowed, increment usage (except for Pro users)
  let newUsage = 0;
  if (userTier !== 'pro') {
    newUsage = await usageTrackingService.incrementUsage(user.id, tokenEquivalent);
  }

  // Revalidate relevant paths
  revalidatePath('/home/decks/[deckId]/test');
  revalidatePath('/home');

  return {
    allowed: true,
    newUsage,
    questionsUsed: questionCount,
  };
}

/**
 * Get usage statistics for display
 */
export async function getUsageStatsAction(): Promise<{
  currentUsage: number;
  limit: number;
  percentage: number;
  isProTier: boolean;
  daysUntilReset: number;
}> {
  const client = getSupabaseServerClient();
  const { data: user } = await requireUser(client);

  if (!user) {
    throw new Error('User not authenticated');
  }
  
  // Get user's subscription tier
  const { data: account } = await client
    .from('accounts')
    .select('subscription_tier')
    .eq('id', user.id)
    .single();

  const userTier = (account?.subscription_tier || 'free') as 'free' | 'pro';
  const questionLimit = userTier === 'pro' ? -1 : 100; // 100 questions per month for free users
  const tokenLimit = userTier === 'pro' ? -1 : questionLimit * TOKENS_PER_QUESTION;
  
  const tokenStats = await usageTrackingService.getUsageStats(user.id, userTier, tokenLimit);
  
  // Convert to question-based stats
  const currentUsageQuestions = userTier === 'pro' ? 0 : Math.floor(tokenStats.currentUsage / TOKENS_PER_QUESTION);
  const _remainingQuestions = userTier === 'pro' ? -1 : Math.max(0, questionLimit - currentUsageQuestions);
  
  return {
    currentUsage: currentUsageQuestions,
    limit: questionLimit,
    percentage: userTier === 'pro' ? 0 : Math.round((currentUsageQuestions / questionLimit) * 100),
    isProTier: tokenStats.isProTier,
    daysUntilReset: tokenStats.daysUntilReset,
  };
}

/**
 * Admin function to clean up old usage records
 */
export async function cleanupOldUsageRecordsAction(): Promise<{
  success: boolean;
  recordsDeleted: number;
}> {
  try {
    const recordsDeleted = await usageTrackingService.cleanupOldRecords();
    
    return {
      success: true,
      recordsDeleted,
    };
  } catch (error) {
    console.error('Error cleaning up usage records:', error);
    return {
      success: false,
      recordsDeleted: 0,
    };
  }
}