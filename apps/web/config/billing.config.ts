/**
 * Billing Configuration for Neuroleaf Pricing Plans
 */

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: {
    monthly: number;
    yearly?: number;
  };
  stripePriceId: {
    monthly: string;
    yearly?: string;
  };
  features: string[];
  limits: {
    decks: number | 'unlimited';
    cardsPerDeck: number | 'unlimited';
    aiGenerations?: number | 'unlimited';
    aiTestsPerMonth?: number | 'unlimited';
    aiQuestionsPerMonth?: number | 'unlimited';
    collaborators?: number | 'unlimited';
    fileUploads?: number | 'unlimited';
    maxFilesPerDeck?: number | 'unlimited';
    maxSizePerDeck?: number | 'unlimited';
    totalStorageLimit?: number | 'unlimited';
  };
  popular?: boolean;
}

export const pricingPlans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for getting started',
    price: {
      monthly: 0,
    },
    stripePriceId: {
      monthly: '', // No Stripe price for free plan
    },
    features: [
      '3 flashcard decks',
      '75 cards per deck',
      '100 AI questions per month (~10 tests)',
      'Multiple file uploads (3 per deck)',
      'Rich text editing',
      'AI-powered test mode',
      'Basic progress tracking',
    ],
    limits: {
      decks: 3,
      cardsPerDeck: 75,
      aiQuestionsPerMonth: 100,
      maxFilesPerDeck: 3,
      maxSizePerDeck: 25 * 1024 * 1024, // 25MB
      totalStorageLimit: 100 * 1024 * 1024, // 100MB
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'AI-powered testing and unlimited learning',
    price: {
      monthly: 9.99,
    },
    stripePriceId: {
      monthly: process.env.STRIPE_PRICE_ID || process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID || '',
    },
    features: [
      'Unlimited decks & cards',
      'Unlimited AI questions',
      'Multiple file uploads per deck',
      'Multi-file bulk creation (up to 20 files)',
      'Advanced analytics & insights',
      'Rich text editing',
      'Priority support',
    ],
    limits: {
      decks: 'unlimited',
      cardsPerDeck: 'unlimited',
      aiQuestionsPerMonth: 'unlimited',
      maxFilesPerDeck: 20,
      maxSizePerDeck: 200 * 1024 * 1024, // 200MB
      totalStorageLimit: 'unlimited',
      fileUploads: 'unlimited',
    },
    popular: true,
  },
];

export const billingConfig = {
  // Stripe configuration
  stripe: {
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },
  
  // Plan limits
  planLimits: {
    free: {
      decks: 3,
      cardsPerDeck: 75,
      hasFileUpload: true,
      hasMultiFileUpload: true,
      hasRichTextEditor: true,
      hasAdvancedStudy: false,
      hasTestMode: true,
      hasAdvancedAnalytics: false,
      aiQuestionsPerMonth: 100,
      maxFilesPerDeck: 3,
      maxSizePerDeck: 25 * 1024 * 1024, // 25MB
      totalStorageLimit: 100 * 1024 * 1024, // 100MB
    },
    pro: {
      decks: -1, // unlimited
      cardsPerDeck: -1, // unlimited
      hasFileUpload: true,
      hasMultiFileUpload: true,
      hasRichTextEditor: true,
      hasAdvancedStudy: true,
      hasTestMode: true,
      hasAdvancedAnalytics: true,
      aiQuestionsPerMonth: -1, // unlimited
      maxFilesPerDeck: 20,
      maxSizePerDeck: 200 * 1024 * 1024, // 200MB
      totalStorageLimit: -1, // unlimited
    },
  },

  // Feature flags
  features: {
    enableYearlyDiscount: true,
    enableStudentDiscount: false, // not implemented yet
    studentDiscountPercent: 50,
  },
} as const;

// Helper functions
export function getPlanById(planId: string): PricingPlan | undefined {
  return pricingPlans.find(plan => plan.id === planId);
}

export function getPlanLimits(planId: string) {
  return billingConfig.planLimits[planId as keyof typeof billingConfig.planLimits] || billingConfig.planLimits.free;
}

export function getPlanFeatures(planId: string) {
  const plan = getPlanById(planId);
  return plan?.features || [];
}

export function canAccessFeature(userPlan: string, feature: keyof typeof billingConfig.planLimits.free): boolean {
  const limits = getPlanLimits(userPlan);
  return Boolean(limits[feature]);
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(price);
}

export function calculateYearlyDiscount(monthlyPrice: number, yearlyPrice: number): number {
  const yearlyEquivalent = monthlyPrice * 12;
  const discount = yearlyEquivalent - yearlyPrice;
  return Math.round((discount / yearlyEquivalent) * 100);
}