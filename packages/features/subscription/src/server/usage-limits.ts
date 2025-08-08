import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

export interface UsageLimits {
  maxDecks: number;
  maxFlashcardsPerDeck: number;
  maxAIGenerationsPerMonth: number;
  maxTestSessionsPerMonth: number;
  hasUnlimitedTests: boolean;
}

const TIER_LIMITS = {
  free: {
    maxDecks: 3,
    maxFlashcardsPerDeck: 50,
    maxAIGenerationsPerMonth: 10,
    maxTestSessionsPerMonth: 5,
    hasUnlimitedTests: false,
  },
  pro: {
    maxDecks: -1, // unlimited
    maxFlashcardsPerDeck: -1, // unlimited
    maxAIGenerationsPerMonth: -1, // unlimited
    maxTestSessionsPerMonth: -1, // unlimited
    hasUnlimitedTests: true,
  },
};

export function getTierLimits(tier: string): UsageLimits {
  const limits = TIER_LIMITS[tier as keyof typeof TIER_LIMITS];
  return limits || TIER_LIMITS.free;
}

export async function checkDeckLimit(userId: string): Promise<{ canCreate: boolean; limit: number; current: number }> {
  const supabase = getSupabaseServerAdminClient();
  
  // Get user's subscription tier
  const { data: account } = await supabase
    .from('accounts')
    .select('subscription_tier')
    .eq('id', userId)
    .single();

  const tier = account?.subscription_tier || 'free';
  const limits = getTierLimits(tier);

  // Count current decks
  const { count: currentDecks } = await supabase
    .from('decks')
    .select('*', { count: 'exact', head: true })
    .eq('account_id', userId);

  const current = currentDecks || 0;
  const limit = limits.maxDecks;
  const canCreate = limit === -1 || current < limit;

  return { canCreate, limit, current };
}

export async function checkFlashcardLimit(deckId: string, userId: string): Promise<{ canCreate: boolean; limit: number; current: number }> {
  const supabase = getSupabaseServerAdminClient();
  
  // Get user's subscription tier
  const { data: account } = await supabase
    .from('accounts')
    .select('subscription_tier')
    .eq('id', userId)
    .single();

  const tier = account?.subscription_tier || 'free';
  const limits = getTierLimits(tier);

  // Count current flashcards in deck
  const { count: currentCards } = await supabase
    .from('flashcards')
    .select('*', { count: 'exact', head: true })
    .eq('deck_id', deckId);

  const current = currentCards || 0;
  const limit = limits.maxFlashcardsPerDeck;
  const canCreate = limit === -1 || current < limit;

  return { canCreate, limit, current };
}

export async function checkAIGenerationLimit(userId: string): Promise<{ canGenerate: boolean; limit: number; current: number }> {
  const supabase = getSupabaseServerAdminClient();
  
  // Get user's subscription tier
  const { data: account } = await supabase
    .from('accounts')
    .select('subscription_tier')
    .eq('id', userId)
    .single();

  const tier = account?.subscription_tier || 'free';
  const limits = getTierLimits(tier);

  // Count AI generations this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count: currentGenerations } = await supabase
    .from('ai_generations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString());

  const current = currentGenerations || 0;
  const limit = limits.maxAIGenerationsPerMonth;
  const canGenerate = limit === -1 || current < limit;

  return { canGenerate, limit, current };
}

export async function checkTestSessionLimit(userId: string): Promise<{ canStart: boolean; limit: number; current: number }> {
  const supabase = getSupabaseServerAdminClient();
  
  // Get user's subscription tier
  const { data: account } = await supabase
    .from('accounts')
    .select('subscription_tier')
    .eq('id', userId)
    .single();

  const tier = account?.subscription_tier || 'free';
  const limits = getTierLimits(tier);

  // Count test sessions this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count: currentSessions } = await supabase
    .from('test_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString());

  const current = currentSessions || 0;
  const limit = limits.maxTestSessionsPerMonth;
  const canStart = limit === -1 || current < limit;

  return { canStart, limit, current };
}

export async function incrementAIGeneration(userId: string, generationType: string, deckId?: string, flashcardId?: string) {
  const supabase = getSupabaseServerAdminClient();
  
  await supabase
    .from('ai_generations')
    .insert({
      user_id: userId,
      generation_type: generationType,
      deck_id: deckId,
      flashcard_id: flashcardId,
      prompt: '', // Will be filled by the actual generation service
      generated_content: {},
      model_used: 'gemini-1.5-flash',
    });
}

export async function getCurrentUsage(userId: string) {
  const supabase = getSupabaseServerAdminClient();
  
  // Get user's subscription tier
  const { data: account } = await supabase
    .from('accounts')
    .select('subscription_tier')
    .eq('id', userId)
    .single();

  const tier = account?.subscription_tier || 'free';
  const limits = getTierLimits(tier);

  // Get current month usage
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    { count: deckCount },
    { count: aiGenerationCount },
    { count: testSessionCount }
  ] = await Promise.all([
    supabase.from('decks').select('*', { count: 'exact', head: true }).eq('account_id', userId),
    supabase.from('ai_generations').select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString()),
    supabase.from('test_sessions').select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString()),
  ]);

  return {
    tier,
    limits,
    usage: {
      decks: deckCount || 0,
      aiGenerations: aiGenerationCount || 0,
      testSessions: testSessionCount || 0,
    },
  };
}