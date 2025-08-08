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
    collaborators?: number | 'unlimited';
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
      '50 cards per deck',
      'Manual card creation',
      'Basic study mode',
      'Basic progress tracking',
    ],
    limits: {
      decks: 3,
      cardsPerDeck: 50,
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
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID || '',
    },
    features: [
      'Unlimited decks & cards',
      'File upload (PDF, DOCX, TXT)',
      'Rich text editing',
      'Advanced study features',
      'Priority support',
    ],
    limits: {
      decks: 'unlimited',
      cardsPerDeck: 'unlimited',
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
      cardsPerDeck: 50,
      hasFileUpload: false,
      hasRichTextEditor: false,
      hasAdvancedStudy: false,
    },
    pro: {
      decks: -1, // unlimited
      cardsPerDeck: -1, // unlimited
      hasFileUpload: true,
      hasRichTextEditor: true,
      hasAdvancedStudy: true,
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