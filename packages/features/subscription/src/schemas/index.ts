import { z } from 'zod';

export const SubscriptionTierSchema = z.enum(['free', 'pro']);

export const UpdateSubscriptionTierSchema = z.object({
  accountId: z.string().uuid(),
  tier: SubscriptionTierSchema,
});

export type UpdateSubscriptionTierInput = z.infer<typeof UpdateSubscriptionTierSchema>;