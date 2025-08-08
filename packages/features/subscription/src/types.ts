export type SubscriptionTier = 'free' | 'pro';

export interface TierConfig {
  name: string;
  deckLimit: number;
  flashcardLimitPerDeck: number;
  description: string;
  features: string[];
}

export interface TierLimits {
  [key: string]: TierConfig;
}

export interface SubscriptionInfo {
  tier: SubscriptionTier;
  deckLimit: number;
  flashcardLimitPerDeck: number;
  currentDeckCount: number;
  canCreateDeck: boolean;
  remainingDecks: number;
  accessibleDeckIds?: string[]; // IDs of decks user can access (for downgraded accounts)
}

export interface DeckCardLimitInfo {
  deckId: string;
  currentCardCount: number;
  cardLimit: number;
  canCreateCards: boolean;
  remainingCards: number;
}