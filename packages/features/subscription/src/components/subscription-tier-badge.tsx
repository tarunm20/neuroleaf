import { Badge } from '@kit/ui/badge';
import type { SubscriptionTier } from '../types';
import { getTierConfig } from '../config';

interface SubscriptionTierBadgeProps {
  tier: SubscriptionTier;
}

export function SubscriptionTierBadge({ tier }: SubscriptionTierBadgeProps) {
  const config = getTierConfig(tier);
  
  const badgeVariant = tier === 'free' ? 'secondary' : tier === 'pro' ? 'default' : 'destructive';
  
  return (
    <Badge variant={badgeVariant} className="text-xs">
      {config?.name || tier}
    </Badge>
  );
}