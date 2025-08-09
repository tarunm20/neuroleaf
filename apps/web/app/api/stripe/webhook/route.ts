import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

// Helper function to find account by Stripe customer ID or email
async function findOrLinkAccount(supabase: any, stripe: Stripe, customerId: string) {
  // First try to find by stripe_customer_id
  let { data: account, error: accountError } = await supabase
    .from('accounts')
    .select('id, email, subscription_tier')
    .eq('stripe_customer_id', customerId)
    .single();

  if (account) {
    console.log(`Found account by stripe_customer_id: ${account.id}`);
    return account;
  }

  console.log('Account not found by stripe_customer_id, trying to link by email...');
  
  // If not found, try to get customer email from Stripe and link by email
  try {
    const customer = await stripe.customers.retrieve(customerId);
    
    if (customer.deleted) {
      console.error('Stripe customer is deleted:', customerId);
      return null;
    }

    const customerEmail = (customer as any).email;
    console.log(`Stripe customer email: ${customerEmail}`);
    
    if (!customerEmail) {
      console.error('Stripe customer has no email:', customerId);
      return null;
    }

    // Try to find account by email
    const { data: emailAccount, error: emailError } = await supabase
      .from('accounts')
      .select('id, email, subscription_tier')
      .eq('email', customerEmail)
      .single();

    if (emailError || !emailAccount) {
      console.error('No account found with email:', customerEmail, 'Error:', emailError);
      return null;
    }

    // Link the account to the Stripe customer
    console.log(`Linking account ${emailAccount.id} to Stripe customer ${customerId}`);
    const { error: updateError } = await supabase
      .from('accounts')
      .update({ stripe_customer_id: customerId })
      .eq('id', emailAccount.id);

    if (updateError) {
      console.error('Error linking account to Stripe customer:', updateError);
      return null;
    }

    console.log(`Successfully linked account ${emailAccount.id} to customer ${customerId}`);
    return emailAccount;
    
  } catch (stripeError) {
    console.error('Error retrieving Stripe customer:', stripeError);
    return null;
  }
}

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
    console.log(`Processing webhook event: ${event.type} with ID: ${event.id}`);
    
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`Handling subscription ${event.type} for subscription ${subscription.id}`);
        await handleSubscriptionChange(supabase, subscription, stripe);
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`Handling subscription cancellation for subscription ${subscription.id}`);
        await handleSubscriptionCancellation(supabase, subscription);
        break;
      }
      
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`Handling successful payment for invoice ${invoice.id}`);
        await handlePaymentSuccess(supabase, invoice);
        
        // Also handle subscription tier update for the first payment
        if ((invoice as any).subscription) {
          console.log('Payment succeeded - also updating subscription tier');
          const subscription = await stripe.subscriptions.retrieve((invoice as any).subscription as string);
          await handleSubscriptionChange(supabase, subscription, stripe);
        }
        break;
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`Handling failed payment for invoice ${invoice.id}`);
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
  subscription: Stripe.Subscription,
  stripe?: Stripe
) {
  const customerId = subscription.customer as string;
  
  console.log(`Processing subscription change for customer ${customerId}, subscription ${subscription.id}`);
  
  // Get or link the account
  let account;
  if (stripe) {
    account = await findOrLinkAccount(supabase, stripe, customerId);
  } else {
    // Fallback to old method if stripe instance not passed
    const { data: foundAccount, error: accountError } = await supabase
      .from('accounts')
      .select('id, email, subscription_tier')
      .eq('stripe_customer_id', customerId)
      .single();
    account = foundAccount;
  }

  if (!account) {
    console.error('Could not find or link account for customer:', customerId);
    // Log subscription details for debugging
    console.error('Subscription details:', {
      id: subscription.id,
      status: subscription.status,
      priceId: subscription.items.data[0]?.price.id
    });
    return;
  }

  // Determine subscription tier based on price ID
  const priceId = subscription.items.data[0]?.price.id;
  let tier = 'free';
  
  console.log(`Checking price ID: ${priceId}`);
  console.log('Environment variables:', {
    STRIPE_PRICE_ID: process.env.STRIPE_PRICE_ID ? 'set' : 'not set',
    NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID ? 'set' : 'not set',
    NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID ? 'set' : 'not set'
  });
  
  // Check against all possible Pro tier price IDs
  const proPriceIds = [
    process.env.STRIPE_PRICE_ID,
    process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID,
    process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID
  ].filter(Boolean); // Remove undefined/null values
  
  if (proPriceIds.includes(priceId)) {
    tier = 'pro';
  }
  
  console.log(`Price ID ${priceId} mapped to tier: ${tier}`);

  // Update account subscription info
  const updateData = {
    subscription_tier: tier,
    stripe_subscription_id: subscription.id,
    subscription_status: subscription.status,
    subscription_expires_at: (subscription as any).current_period_end 
      ? new Date((subscription as any).current_period_end * 1000).toISOString()
      : null,
    updated_at: new Date().toISOString(),
  };
  
  console.log('Updating account with data:', updateData);
  
  const { error } = await supabase
    .from('accounts')
    .update(updateData)
    .eq('id', account.id);

  if (error) {
    console.error('Error updating account subscription:', error);
    console.error('Account ID:', account.id);
    console.error('Update data:', updateData);
    throw error;
  }

  console.log(`Successfully updated subscription for account ${account.id} (${account.email}) to ${tier} tier`);
  
  // Verify the update worked
  const { data: updatedAccount, error: verifyError } = await supabase
    .from('accounts')
    .select('subscription_tier, stripe_subscription_id, subscription_status')
    .eq('id', account.id)
    .single();
    
  if (verifyError) {
    console.error('Error verifying account update:', verifyError);
  } else {
    console.log('Account after update:', updatedAccount);
  }
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