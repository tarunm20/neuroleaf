import Stripe from 'stripe';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

function getStripeInstance() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!stripeSecretKey) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not set');
  }

  return new Stripe(stripeSecretKey, {
    apiVersion: '2025-07-30.basil',
  });
}

export async function createCheckoutSession({
  priceId,
  userId,
  successUrl,
  cancelUrl,
}: {
  priceId: string;
  userId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const stripe = getStripeInstance();
  const supabase = getSupabaseServerAdminClient();
  
  // Get user account
  const { data: account, error } = await supabase
    .from('accounts')
    .select('id, email, stripe_customer_id')
    .eq('id', userId)
    .single();

  if (error || !account) {
    throw new Error('Account not found');
  }

  let customerId = account.stripe_customer_id;

  // Create Stripe customer if doesn't exist
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: account.email || undefined,
      metadata: {
        userId: account.id,
      },
    });

    customerId = customer.id;

    // Update account with customer ID
    await supabase
      .from('accounts')
      .update({ stripe_customer_id: customerId })
      .eq('id', account.id);
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      metadata: {
        userId: account.id,
      },
    },
  });

  return session;
}

export async function createBillingPortalSession({
  userId,
  returnUrl,
}: {
  userId: string;
  returnUrl: string;
}) {
  const stripe = getStripeInstance();
  const supabase = getSupabaseServerAdminClient();
  
  // Get user account
  const { data: account, error } = await supabase
    .from('accounts')
    .select('stripe_customer_id, subscription_tier')
    .eq('id', userId)
    .single();

  if (error) {
    throw new Error('Account not found');
  }

  if (!account?.stripe_customer_id) {
    throw new Error('No Stripe customer found. Please contact support.');
  }

  if (account.subscription_tier === 'free') {
    throw new Error('No active subscription to manage');
  }

  // Create billing portal session
  const session = await stripe.billingPortal.sessions.create({
    customer: account.stripe_customer_id,
    return_url: returnUrl,
  });

  return session;
}

export async function cancelSubscription(userId: string) {
  const stripe = getStripeInstance();
  const supabase = getSupabaseServerAdminClient();
  
  // Get user account with subscription details
  const { data: account, error } = await supabase
    .from('accounts')
    .select('stripe_subscription_id, subscription_tier, subscription_status')
    .eq('id', userId)
    .single();

  if (error) {
    throw new Error('Account not found');
  }

  if (account.subscription_tier === 'free') {
    throw new Error('No active subscription to cancel');
  }

  if (!account.stripe_subscription_id) {
    // Handle case where user is Pro but has no Stripe subscription ID
    // This might happen with legacy data or manual upgrades
    console.warn(`User ${userId} has Pro tier but no Stripe subscription ID`);
    
    // Just downgrade to free tier in database
    await supabase
      .from('accounts')
      .update({ 
        subscription_tier: 'free',
        subscription_status: 'canceled',
        subscription_expires_at: null,
      })
      .eq('id', userId);
    
    return true;
  }

  try {
    // Cancel subscription at period end in Stripe
    const canceledSubscription = await stripe.subscriptions.update(account.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    // Update local database - keep Pro tier until period ends
    const expiresAt = (canceledSubscription as any).current_period_end 
      ? new Date((canceledSubscription as any).current_period_end * 1000).toISOString()
      : null;
      
    await supabase
      .from('accounts')
      .update({ 
        subscription_status: 'canceled',
        subscription_expires_at: expiresAt,
      })
      .eq('id', userId);

    return true;
  } catch (stripeError) {
    console.error('Stripe cancellation error:', stripeError);
    
    // If Stripe fails but we have a subscription ID, still update our database
    // This handles cases where subscription might already be canceled in Stripe
    await supabase
      .from('accounts')
      .update({ 
        subscription_tier: 'free',
        subscription_status: 'canceled',
        subscription_expires_at: null,
      })
      .eq('id', userId);
    
    return true;
  }
}

export async function reactivateSubscription(userId: string) {
  const stripe = getStripeInstance();
  const supabase = getSupabaseServerAdminClient();
  
  // Get user account with subscription details
  const { data: account, error } = await supabase
    .from('accounts')
    .select(`
      stripe_subscription_id, 
      subscription_tier, 
      subscription_status,
      subscription_expires_at
    `)
    .eq('id', userId)
    .single();

  if (error) {
    throw new Error('Account not found');
  }

  if (account.subscription_tier === 'free') {
    throw new Error('No subscription to reactivate');
  }

  if (!account.stripe_subscription_id) {
    throw new Error('No Stripe subscription found');
  }

  try {
    // Get the current subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(account.stripe_subscription_id);
    
    // Check if subscription can be reactivated
    if (subscription.cancel_at_period_end && subscription.status === 'active') {
      // Reactivate by removing the cancellation
      const reactivatedSubscription = await stripe.subscriptions.update(account.stripe_subscription_id, {
        cancel_at_period_end: false,
      });

      // Update local database
      const expiresAt = (reactivatedSubscription as any).current_period_end 
        ? new Date((reactivatedSubscription as any).current_period_end * 1000).toISOString()
        : null;
        
      await supabase
        .from('accounts')
        .update({ 
          subscription_status: 'active',
          subscription_expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      return { success: true, type: 'reactivated' };
    } else if (subscription.status === 'canceled') {
      // Subscription already ended - cannot reactivate, need new subscription
      return { success: false, type: 'expired', message: 'Subscription has expired. Please create a new subscription.' };
    } else {
      // Subscription is already active
      return { success: false, type: 'already_active', message: 'Subscription is already active.' };
    }
  } catch (stripeError) {
    console.error('Stripe reactivation error:', stripeError);
    throw new Error('Failed to reactivate subscription. Please try again or contact support.');
  }
}

export async function getSubscriptionInfo(userId: string) {
  const supabase = getSupabaseServerAdminClient();
  
  const { data: account, error } = await supabase
    .from('accounts')
    .select(`
      subscription_tier,
      subscription_status,
      subscription_expires_at,
      stripe_subscription_id
    `)
    .eq('id', userId)
    .single();

  if (error || !account) {
    return {
      tier: 'free',
      status: null,
      expiresAt: null,
      subscriptionId: null,
    };
  }

  return {
    tier: account.subscription_tier || 'free',
    status: account.subscription_status,
    expiresAt: account.subscription_expires_at,
    subscriptionId: account.stripe_subscription_id,
  };
}