import { getPlanLimits, canAccessFeature, pricingPlans } from '~/config/billing.config';

export type SubscriptionTier = 'free' | 'pro';

/**
 * Check if user can create more decks
 */
export function canCreateDeck(userPlan: SubscriptionTier, currentDeckCount: number): boolean {
  const limits = getPlanLimits(userPlan);
  
  if (limits.decks === -1) return true; // unlimited
  return currentDeckCount < limits.decks;
}

/**
 * Check if user can add more cards to a deck
 */
export function canAddCardToDeck(userPlan: SubscriptionTier, currentCardCount: number): boolean {
  const limits = getPlanLimits(userPlan);
  
  if (limits.cardsPerDeck === -1) return true; // unlimited
  return currentCardCount < limits.cardsPerDeck;
}

/**
 * Check if user can use test mode
 */
export function canUseTestMode(userPlan: SubscriptionTier): boolean {
  return canAccessFeature(userPlan, 'hasTestMode');
}

/**
 * Check if user can use advanced analytics
 */
export function canUseAdvancedAnalytics(userPlan: SubscriptionTier): boolean {
  return canAccessFeature(userPlan, 'hasAdvancedAnalytics');
}


/**
 * Get the user's current plan limits
 */
export function getUserPlanLimits(userPlan: SubscriptionTier) {
  return getPlanLimits(userPlan);
}

/**
 * Get upgrade suggestion based on current usage
 */
export function getUpgradeSuggestion(
  userPlan: SubscriptionTier,
  usage: {
    deckCount: number;
    maxCardsInDeck: number;
    wantsTestMode: boolean;
    wantsAnalytics: boolean;
  }
): { shouldUpgrade: boolean; suggestedPlan?: SubscriptionTier; reason: string } {
  
  if (userPlan === 'pro') {
    return { shouldUpgrade: false, reason: 'Already on highest plan' };
  }

  const limits = getPlanLimits(userPlan);

  // Check deck limit
  if (limits.decks !== -1 && usage.deckCount >= limits.decks) {
    return {
      shouldUpgrade: true,
      suggestedPlan: 'pro',
      reason: 'You\'ve reached your deck limit. Upgrade for unlimited decks!'
    };
  }

  // Check cards per deck limit
  if (limits.cardsPerDeck !== -1 && usage.maxCardsInDeck >= limits.cardsPerDeck) {
    return {
      shouldUpgrade: true,
      suggestedPlan: 'pro',
      reason: 'You\'ve reached the card limit per deck. Upgrade for unlimited cards!'
    };
  }


  // Check feature desires
  if (usage.wantsTestMode && !limits.hasTestMode) {
    return {
      shouldUpgrade: true,
      suggestedPlan: 'pro',
      reason: 'Unlock AI-powered test mode with detailed feedback!'
    };
  }

  if (usage.wantsAnalytics && !limits.hasAdvancedAnalytics) {
    return {
      shouldUpgrade: true,
      suggestedPlan: 'pro',
      reason: 'Get detailed analytics to track your learning progress!'
    };
  }

  return { shouldUpgrade: false, reason: 'Current plan meets your needs' };
}

/**
 * Get plan comparison for upgrade prompts
 */
export function getPlanComparison(currentPlan: SubscriptionTier, targetPlan: SubscriptionTier) {
  const current = getPlanLimits(currentPlan);
  const target = getPlanLimits(targetPlan);
  const targetPlanData = pricingPlans.find(p => p.id === targetPlan);

  return {
    current,
    target,
    targetPlanData,
    improvements: {
      decks: current.decks !== -1 && target.decks === -1,
      cardsPerDeck: current.cardsPerDeck !== -1 && target.cardsPerDeck === -1,
      aiTests: target.aiTestsPerMonth > current.aiTestsPerMonth,
      analytics: !current.hasAdvancedAnalytics && target.hasAdvancedAnalytics,
      testMode: !current.hasTestMode && target.hasTestMode,
    }
  };
}

/**
 * Format usage statistics for display
 */
export function formatUsageStats(
  userPlan: SubscriptionTier,
  usage: {
    deckCount: number;
    totalCards: number;
  }
) {
  const limits = getPlanLimits(userPlan);

  return {
    decks: {
      used: usage.deckCount,
      limit: limits.decks === -1 ? 'Unlimited' : limits.decks,
      percentage: limits.decks === -1 ? 0 : Math.round((usage.deckCount / limits.decks) * 100)
    },
    cards: {
      used: usage.totalCards,
      limit: limits.cardsPerDeck === -1 ? 'Unlimited per deck' : `${limits.cardsPerDeck} per deck`,
    },
  };
}