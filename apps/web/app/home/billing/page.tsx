import { redirect } from 'next/navigation';
import { CreditCard, Crown, Calendar, Settings } from 'lucide-react';

import { Button } from '@kit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';

import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { requireUser } from '@kit/supabase/require-user';
import { getSubscriptionInfoAction, manageBillingAction } from '../../../lib/server-actions/billing-actions';
import { pricingPlans, formatPrice } from '../../../config/billing.config';

export const metadata = {
  title: 'Billing & Subscription - Neuroleaf',
  description: 'Manage your subscription and billing information.',
};

export default async function BillingPage() {
  const supabase = getSupabaseServerClient();
  const { data: user } = await requireUser(supabase);

  if (!user) {
    redirect('/auth/sign-in');
  }

  const subscriptionInfo = await getSubscriptionInfoAction();
  const currentPlan = pricingPlans.find(plan => plan.id === subscriptionInfo?.tier) || pricingPlans[0];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Billing & Subscription</h1>
        <p className="text-muted-foreground">
          Manage your subscription and billing information
        </p>
      </div>

      <div className="grid gap-6">
        {/* Current Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-semibold">{currentPlan?.name || 'Unknown Plan'}</h3>
                  {subscriptionInfo?.tier === 'pro' && (
                    <Badge className="bg-primary/10 text-primary">Pro</Badge>
                  )}
                </div>
                <p className="text-muted-foreground mb-3">{currentPlan?.description || ''}</p>
                <div className="text-2xl font-bold">
                  {formatPrice(currentPlan?.price.monthly || 0)}
                  {(currentPlan?.price.monthly || 0) > 0 && <span className="text-sm font-normal">/month</span>}
                </div>
              </div>
              
              {subscriptionInfo?.tier === 'pro' && (
                <form action={manageBillingAction}>
                  <Button type="submit" variant="outline" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Manage Billing
                  </Button>
                </form>
              )}
            </div>

            {subscriptionInfo?.expiresAt && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {subscriptionInfo?.status === 'active' ? 'Renews' : 'Expires'} on{' '}
                    {new Date(subscriptionInfo.expiresAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
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

        {/* Upgrade/Downgrade Options */}
        {subscriptionInfo?.tier === 'free' && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                Upgrade to Pro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Unlock AI-powered testing, unlimited content, and advanced analytics
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {formatPrice(pricingPlans[1]?.price.monthly || 0)}/month
                  </div>
                  <div className="text-sm text-muted-foreground">
                    7-day free trial included
                  </div>
                </div>
                <Button asChild>
                  <a href="/pricing">Upgrade Now</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Billing History */}
        {subscriptionInfo.tier === 'pro' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Billing Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                To view your billing history, update payment methods, or download invoices, 
                use the billing portal.
              </p>
              <form action={manageBillingAction}>
                <Button type="submit" variant="outline">
                  Open Billing Portal
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Support */}
        <Card>
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              If you have questions about your subscription or billing, we're here to help.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" asChild>
                <a href="/faq">View FAQ</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="mailto:support@neuroleaf.com">Contact Support</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}