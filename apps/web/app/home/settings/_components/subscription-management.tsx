'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Crown, TrendingUp } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kit/ui/card';
import { Button } from '@kit/ui/button';
import { Badge } from '@kit/ui/badge';
import { useSubscription } from '@kit/subscription/hooks';

interface SubscriptionManagementProps {
  userId: string;
}

export function SubscriptionManagement({ userId }: SubscriptionManagementProps) {
  const router = useRouter();
  const { data: subscriptionInfo, isLoading } = useSubscription(userId);

  const handleUpgrade = () => {
    router.push('/pricing');
  };

  const handleManageBilling = () => {
    // This would redirect to Stripe billing portal when implemented
    console.log('Redirect to billing portal');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>Loading subscription information...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse h-20 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const currentTier = subscriptionInfo?.tier || 'free';
  const tierNames = { free: 'Free', pro: 'Pro', premium: 'Premium' };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription</CardTitle>
        <CardDescription>
          Manage your subscription plan
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current Plan */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div>
            <h3 className="font-semibold">Current Plan</h3>
            <p className="text-sm text-muted-foreground">
              {tierNames[currentTier]} tier
            </p>
          </div>
          <Badge variant={currentTier === 'free' ? 'secondary' : 'default'}>
            {currentTier === 'free' ? (
              'Free'
            ) : (
              <>
                <Crown className="h-3 w-3 mr-1" />
                {tierNames[currentTier]}
              </>
            )}
          </Badge>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {currentTier === 'free' ? (
            <Button onClick={handleUpgrade} className="flex-1">
              <Crown className="h-4 w-4 mr-2" />
              Upgrade Plan
            </Button>
          ) : (
            <>
              <Button onClick={handleManageBilling} className="flex-1">
                <TrendingUp className="h-4 w-4 mr-2" />
                Manage Billing
              </Button>
              {currentTier === 'pro' && (
                <Button onClick={handleUpgrade} variant="outline">
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}