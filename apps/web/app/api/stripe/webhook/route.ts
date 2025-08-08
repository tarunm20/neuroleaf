import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

export async function POST(request: NextRequest) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey) {
    console.error('STRIPE_SECRET_KEY environment variable is not set');
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET environment variable is not set');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2025-07-30.basil',
  });

  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    console.error('Missing Stripe signature');
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = getSupabaseServerAdminClient();

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(supabase, subscription);
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCancellation(supabase, subscription);
        break;
      }
      
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSuccess(supabase, invoice);
        break;
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailure(supabase, invoice);
        break;
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleSubscriptionChange(
  supabase: any,
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string;
  
  // Get the user from Stripe customer ID
  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (accountError || !account) {
    console.error('Could not find account for customer:', customerId);
    return;
  }

  // Determine subscription tier based on price ID
  const priceId = subscription.items.data[0]?.price.id;
  let tier = 'free';
  
  // Only Pro tier available
  if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID || 
      priceId === process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID) {
    tier = 'pro';
  }

  // Update account subscription info
  const { error } = await supabase
    .from('accounts')
    .update({
      subscription_tier: tier,
      stripe_subscription_id: subscription.id,
      subscription_status: subscription.status,
      subscription_expires_at: (subscription as any).current_period_end 
        ? new Date((subscription as any).current_period_end * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', account.id);

  if (error) {
    console.error('Error updating account subscription:', error);
    throw error;
  }

  console.log(`Updated subscription for account ${account.id} to ${tier} tier`);
}

async function handleSubscriptionCancellation(
  supabase: any,
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string;
  
  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (accountError || !account) {
    console.error('Could not find account for customer:', customerId);
    return;
  }

  // Downgrade to free tier
  const { error } = await supabase
    .from('accounts')
    .update({
      subscription_tier: 'free',
      stripe_subscription_id: null,
      subscription_status: 'canceled',
      subscription_expires_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', account.id);

  if (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }

  console.log(`Canceled subscription for account ${account.id}`);
}

async function handlePaymentSuccess(
  supabase: any,
  invoice: Stripe.Invoice
) {
  const customerId = invoice.customer as string;
  
  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (accountError || !account) {
    console.error('Could not find account for customer:', customerId);
    return;
  }

  // Update payment status
  const { error } = await supabase
    .from('accounts')
    .update({
      subscription_status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('id', account.id);

  if (error) {
    console.error('Error updating payment status:', error);
    throw error;
  }

  console.log(`Payment succeeded for account ${account.id}`);
}

async function handlePaymentFailure(
  supabase: any,
  invoice: Stripe.Invoice
) {
  const customerId = invoice.customer as string;
  
  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (accountError || !account) {
    console.error('Could not find account for customer:', customerId);
    return;
  }

  // Update payment status to past_due
  const { error } = await supabase
    .from('accounts')
    .update({
      subscription_status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('id', account.id);

  if (error) {
    console.error('Error updating payment failure status:', error);
    throw error;
  }

  console.log(`Payment failed for account ${account.id}`);
}