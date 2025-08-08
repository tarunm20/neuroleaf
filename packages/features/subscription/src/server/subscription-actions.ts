'use server';

import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { SubscriptionService } from './subscription-service';
import type { UpdateSubscriptionTierInput } from '../schemas';
import type { SubscriptionInfo, DeckCardLimitInfo } from '../types';

export async function getSubscriptionInfoAction(accountId: string): Promise<SubscriptionInfo | null> {
  const client = getSupabaseServerClient();
  const service = new SubscriptionService(client);
  
  return service.getSubscriptionInfo(accountId);
}

export async function canCreateDeckAction(accountId: string): Promise<boolean> {
  const client = getSupabaseServerClient();
  const service = new SubscriptionService(client);
  
  return service.canCreateDeck(accountId);
}

export async function updateSubscriptionTierAction(input: UpdateSubscriptionTierInput): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getSupabaseServerClient();
    const service = new SubscriptionService(client);
    
    const success = await service.updateSubscriptionTier(input.accountId, input.tier);
    
    if (!success) {
      return { success: false, error: 'Failed to update subscription tier' };
    }
    
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

export async function getDeckCardLimitInfoAction(accountId: string, deckId: string): Promise<DeckCardLimitInfo | null> {
  const client = getSupabaseServerClient();
  const service = new SubscriptionService(client);
  
  return service.getDeckCardLimitInfo(accountId, deckId);
}

export async function canCreateCardsAction(accountId: string, deckId: string, requestedCount: number): Promise<{ canCreate: boolean; maxAllowed: number; reason?: string }> {
  const client = getSupabaseServerClient();
  const service = new SubscriptionService(client);
  
  return service.canCreateCards(accountId, deckId, requestedCount);
}

export async function canAccessDeckAction(accountId: string, deckId: string): Promise<{ canAccess: boolean; reason?: string }> {
  const client = getSupabaseServerClient();
  const service = new SubscriptionService(client);
  
  return service.canAccessDeck(accountId, deckId);
}