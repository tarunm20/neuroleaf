import type { TierLimits } from './types';

export const TIER_CONFIGS: TierLimits = {
  free: {
    name: 'Free',
    deckLimit: 3,
    flashcardLimitPerDeck: 50,
    description: 'Perfect for getting started',
    features: [
      'Up to 3 decks',
      '50 cards per deck',
      'AI-powered card generation',
      'Basic flashcard creation',
      'Study progress tracking'
    ]
  },
  pro: {
    name: 'Pro',
    deckLimit: -1, // -1 represents unlimited
    flashcardLimitPerDeck: -1, // -1 represents unlimited
    description: 'For serious learners',
    features: [
      'Unlimited decks',
      'Unlimited cards per deck',
      'Advanced study features', 
      'File upload support',
      'AI test mode',
      'Study analytics'
    ]
  }
};

export const getTierConfig = (tier: keyof typeof TIER_CONFIGS) => {
  return TIER_CONFIGS[tier];
};

export const isUnlimited = (deckLimit: number) => {
  return deckLimit === -1;
};