'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Crown, TrendingUp, X, CreditCard, Settings, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kit/ui/card';
import { Button } from '@kit/ui/button';
import { Badge } from '@kit/ui/badge';
import { Alert, AlertDescription } from '@kit/ui/alert';
import { useSubscription } from '@kit/subscription/hooks';
import { cancelSubscriptionAction, getSubscriptionInfoAction, reactivateSubscriptionAction } from '../../../../lib/server-actions/billing-actions';
import { useQuery } from '@tanstack/react-query';
import { pricingPlans, formatPrice } from '../../../../config/billing.config';
import { CancelSubscriptionDialog } from './cancel-subscription-dialog';

interface SubscriptionManagementProps {
  userId: string;
}

export function SubscriptionManagement({ userId }: SubscriptionManagementProps) {
  const router = useRouter();
  const { data: subscriptionInfo, isLoading } = useSubscription(userId);
  
  // Get detailed billing information
  const { data: billingInfo } = useQuery({
    queryKey: ['billing-subscription', userId],
    queryFn: () => getSubscriptionInfoAction(),
    enabled: !!userId,
  });
  
  const [isCanceling, setIsCanceling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);

  const handleUpgrade = () => {
    router.push('/pricing');
  };

  const handleReactivateSubscription = async () => {
    setIsReactivating(true);
    
    try {
      const result = await reactivateSubscriptionAction();
      
      if (result.success) {
        toast.success('Subscription reactivated!', {
          description: 'Your Pro features are now fully active again.',
          duration: 5000,
        });
        // Refresh the page to update subscription data
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        if (result.type === 'expired') {
          toast.error('Subscription expired', {
            description: 'Please create a new subscription to continue with Pro features.',
          });
          // Redirect to pricing page for expired subscriptions
          setTimeout(() => {
            router.push('/pricing');
          }, 2000);
        } else {
          toast.error('Failed to reactivate subscription', {
            description: result.message || 'Please try again or contact support.',
          });
        }
      }
    } catch (error) {
      console.error('Failed to reactivate subscription:', error);
      toast.error('Failed to reactivate subscription', {
        description: 'Please try again or contact support.',
      });
    } finally {
      setIsReactivating(false);
    }
  };

  const handleCancelClick = () => {
    setShowCancelDialog(true);
  };

  const handleCancelConfirm = async () => {
    setIsCanceling(true);
    
    try {
      const result = await cancelSubscriptionAction();
      
      if (result.success) {
        toast.success('Subscription canceled successfully', {
          description: 'You will retain Pro access until the end of your billing period.',
          duration: 5000,
        });
        setShowCancelDialog(false);
        // Refresh the page to update subscription data
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast.error('Failed to cancel subscription', {
          description: result.message || 'Please try again or contact support.',
        });
      }
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      toast.error('Failed to cancel subscription', {
        description: 'Please try again or contact support.',
      });
    } finally {
      setIsCanceling(false);
    }
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
  const currentPlan = pricingPlans.find(plan => plan.id === currentTier) || pricingPlans[0];
  const isProUser = currentTier === 'pro';
  
  // Check if subscription is canceled but still active
  const subscriptionStatus = billingInfo?.status;
  const isSubscriptionCanceled = subscriptionStatus === 'canceled' && currentTier === 'pro';
  const subscriptionExpiresAt = billingInfo?.expiresAt;

  return (
    <div className="space-y-6">
      {/* Current Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Subscription
          </CardTitle>
          <CardDescription>
            Manage your subscription and billing information
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">

          {/* Current Plan Details */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-semibold">{currentPlan?.name || 'Unknown Plan'}</h3>
                {isProUser && (
                  <Badge className="bg-primary/10 text-primary">Pro</Badge>
                )}
              </div>
              <p className="text-muted-foreground mb-3">{currentPlan?.description || ''}</p>
              <div className="text-2xl font-bold">
                {formatPrice(currentPlan?.price.monthly || 0)}
                {(currentPlan?.price.monthly || 0) > 0 && <span className="text-sm font-normal">/month</span>}
              </div>
            </div>
          </div>

          {/* Subscription Status */}
          {isProUser && (
            <div>
              {isSubscriptionCanceled ? (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <div className="text-sm">
                    <div className="font-medium text-amber-800">
                      Subscription canceled - access until {subscriptionExpiresAt ? new Date(subscriptionExpiresAt).toLocaleDateString() : 'end of billing period'}
                    </div>
                    <div className="text-amber-700 mt-1">
                      Your Pro features remain active until your current billing period ends.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div className="text-sm">
                    <span className="font-medium text-green-800">
                      Pro subscription is active
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {currentTier === 'free' ? (
              <Button onClick={handleUpgrade} className="flex-1">
                <Crown className="h-4 w-4 mr-2" />
                Upgrade to Pro
              </Button>
            ) : (
              <>
                {isSubscriptionCanceled ? (
                  <Button 
                    onClick={handleReactivateSubscription} 
                    disabled={isReactivating}
                    className="flex-1"
                  >
                    {isReactivating ? (
                      <>
                        <TrendingUp className="h-4 w-4 mr-2 animate-spin" />
                        Reactivating...
                      </>
                    ) : (
                      <>
                        <Crown className="h-4 w-4 mr-2" />
                        Reactivate Subscription
                      </>
                    )}
                  </Button>
                ) : (
                  <Button 
                    onClick={handleCancelClick} 
                    disabled={isCanceling}
                    variant="destructive"
                    className="flex-1"
                  >
                    {isCanceling ? (
                      <>
                        <TrendingUp className="h-4 w-4 mr-2 animate-spin" />
                        Opening...
                      </>
                    ) : (
                      <>
                        <X className="h-4 w-4 mr-2" />
                        Cancel Subscription
                      </>
                    )}
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Cancel Description */}
          {isProUser && !isSubscriptionCanceled && (
            <Alert>
              <CreditCard className="h-4 w-4" />
              <AlertDescription>
                Cancel your subscription anytime. You'll continue to have Pro access until the end of your billing period.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Reactivation Description */}
          {isSubscriptionCanceled && (
            <Alert>
              <Crown className="h-4 w-4" />
              <AlertDescription>
                Want to continue with Pro? Reactivate your subscription to ensure uninterrupted access to all Pro features.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Plan Features */}
      <Card>
        <CardHeader>
          <CardTitle>Your Plan Includes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {currentPlan?.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Prompt for Free Users */}
      {currentTier === 'free' && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Upgrade to Pro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Unlock unlimited content, AI-powered features, and advanced analytics
            </p>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {formatPrice(pricingPlans[1]?.price.monthly || 0)}/month
                </div>
                <div className="text-sm text-muted-foreground">
                  Start creating unlimited decks and cards
                </div>
              </div>
              <Button onClick={handleUpgrade}>
                Upgrade Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Cancel Subscription Dialog */}
      <CancelSubscriptionDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={handleCancelConfirm}
        isLoading={isCanceling}
      />
    </div>
  );
}