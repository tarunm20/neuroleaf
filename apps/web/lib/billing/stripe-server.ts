import Stripe from 'stripe';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';
import { requireUser } from '@kit/supabase/require-user';

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
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  if (error || !account?.stripe_customer_id) {
    throw new Error('No billing account found');
  }

  // Create billing portal session
  const session = await stripe.billingPortal.sessions.create({
    customer: account.stripe_customer_id,
    return_url: returnUrl,
  });

  return session;
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