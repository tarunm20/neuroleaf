import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@kit/supabase/database';
import type { SubscriptionInfo, SubscriptionTier, DeckCardLimitInfo } from '../types';
import { TIER_CONFIGS, getTierConfig, isUnlimited } from '../config';


type Client = SupabaseClient<Database>;

export class SubscriptionService {
  constructor(private readonly client: Client) {}


  async getSubscriptionInfo(accountId: string): Promise<SubscriptionInfo | null> {
    // Get account subscription info
    const { data: account, error: accountError } = await this.client
      .from('accounts')
      .select('subscription_tier, deck_limit, flashcard_limit_per_deck')
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      return null;
    }

    // Get current deck count
    const { count: currentDeckCount, error: deckError } = await this.client
      .from('decks')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', accountId);

    if (deckError) {
      return null;
    }

    const tier = account.subscription_tier as SubscriptionTier;
    const deckLimit = account.deck_limit || 0;
    const flashcardLimitPerDeck = account.flashcard_limit_per_deck || 50;
    const currentCount = currentDeckCount || 0;
    
    // For downgraded accounts, get the accessible deck IDs (oldest X decks)
    let accessibleDeckIds: string[] | undefined;
    
    if (!isUnlimited(deckLimit) && currentCount > deckLimit) {
      // User has more decks than allowed, get the oldest ones they can access
      const { data: oldestDecks, error: oldestDecksError } = await this.client
        .from('decks')
        .select('id')
        .eq('account_id', accountId)
        .order('created_at', { ascending: true })
        .limit(deckLimit);
        
      if (oldestDecksError) {
        return null;
      }
      
      accessibleDeckIds = oldestDecks?.map(deck => deck.id) || [];
    }
    
    const subscriptionInfo: SubscriptionInfo = {
      tier,
      deckLimit,
      flashcardLimitPerDeck,
      currentDeckCount: currentCount,
      canCreateDeck: isUnlimited(deckLimit) || currentCount < deckLimit,
      remainingDecks: isUnlimited(deckLimit) ? -1 : Math.max(0, deckLimit - currentCount),
      accessibleDeckIds
    };

    return subscriptionInfo;
  }

  async canCreateDeck(accountId: string): Promise<boolean> {
    const info = await this.getSubscriptionInfo(accountId);
    return info?.canCreateDeck ?? false;
  }

  async canAccessDeck(accountId: string, deckId: string): Promise<{ canAccess: boolean; reason?: string }> {
    const info = await this.getSubscriptionInfo(accountId);
    
    if (!info) {
      return { canAccess: false, reason: 'Unable to verify subscription info' };
    }

    // If user has unlimited decks or within their limit, they can access all their decks
    if (isUnlimited(info.deckLimit) || !info.accessibleDeckIds) {
      return { canAccess: true };
    }

    // Check if the deck is in the accessible list
    const canAccess = info.accessibleDeckIds.includes(deckId);
    
    if (!canAccess) {
      return { 
        canAccess: false, 
        reason: `Deck access limited to your ${info.deckLimit} oldest decks. Upgrade to access all decks.`
      };
    }

    return { canAccess: true };
  }

  async getDeckCardLimitInfo(accountId: string, deckId: string): Promise<DeckCardLimitInfo | null> {
    // Get account card limit per deck
    const { data: account, error: accountError } = await this.client
      .from('accounts')
      .select('flashcard_limit_per_deck')
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      return null;
    }

    // Get current card count for this deck
    const { count: currentCardCount, error: cardError } = await this.client
      .from('flashcards')
      .select('*', { count: 'exact', head: true })
      .eq('deck_id', deckId);

    if (cardError) {
      return null;
    }

    const cardLimit = account.flashcard_limit_per_deck || 50;
    const currentCount = currentCardCount || 0;

    return {
      deckId,
      currentCardCount: currentCount,
      cardLimit,
      canCreateCards: isUnlimited(cardLimit) || currentCount < cardLimit,
      remainingCards: isUnlimited(cardLimit) ? -1 : Math.max(0, cardLimit - currentCount)
    };
  }

  async canCreateCards(accountId: string, deckId: string, requestedCount: number): Promise<{ canCreate: boolean; maxAllowed: number; reason?: string }> {
    const info = await this.getDeckCardLimitInfo(accountId, deckId);
    
    if (!info) {
      return { canCreate: false, maxAllowed: 0, reason: 'Unable to verify card limits' };
    }

    if (isUnlimited(info.cardLimit)) {
      return { canCreate: true, maxAllowed: requestedCount };
    }

    const availableSlots = info.cardLimit - info.currentCardCount;
    
    if (requestedCount <= availableSlots) {
      return { canCreate: true, maxAllowed: requestedCount };
    }

    return { 
      canCreate: false, 
      maxAllowed: availableSlots,
      reason: `Card limit reached. You can create ${availableSlots} more cards (${info.currentCardCount}/${info.cardLimit} used).`
    };
  }

  async updateSubscriptionTier(accountId: string, tier: SubscriptionTier): Promise<boolean> {
    const tierConfig = getTierConfig(tier);
    if (!tierConfig) {
      return false;
    }

    const { error } = await this.client
      .from('accounts')
      .update({ 
        subscription_tier: tier,
        deck_limit: tierConfig.deckLimit,
        flashcard_limit_per_deck: tierConfig.flashcardLimitPerDeck
      })
      .eq('id', accountId);

    return !error;
  }

  getTierConfig(tier: SubscriptionTier) {
    return getTierConfig(tier);
  }

  getAllTierConfigs() {
    return TIER_CONFIGS;
  }
}