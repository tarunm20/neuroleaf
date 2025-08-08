'use server';

import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { requireUser } from '@kit/supabase/require-user';
import { 
  createCheckoutSession, 
  createBillingPortalSession,
  getSubscriptionInfo 
} from '../billing/stripe-server';

export async function createCheckoutAction(formData: FormData) {
  const priceId = formData.get('priceId') as string;
  
  if (!priceId) {
    throw new Error('Price ID is required');
  }

  const supabase = getSupabaseServerClient();
  const { data: user } = await requireUser(supabase);

  if (!user) {
    redirect('/auth/sign-in');
  }

  let session;
  
  try {
    session = await createCheckoutSession({
      priceId,
      userId: user.id,
      successUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing`,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    throw new Error('Failed to create checkout session');
  }

  if (!session?.url) {
    throw new Error('No checkout URL received');
  }

  // Redirect outside try-catch to avoid catching Next.js redirect errors
  redirect(session.url);
}

export async function manageBillingAction() {
  const supabase = getSupabaseServerClient();
  const { data: user } = await requireUser(supabase);

  if (!user) {
    redirect('/auth/sign-in');
  }

  try {
    const session = await createBillingPortalSession({
      userId: user.id,
      returnUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/home/billing`,
    });

    redirect(session.url);
  } catch (error) {
    console.error('Billing portal error:', error);
    throw new Error('Failed to access billing portal');
  }
}

export async function getSubscriptionInfoAction() {
  const supabase = getSupabaseServerClient();
  const { data: user } = await requireUser(supabase);

  if (!user) {
    return {
      tier: 'free',
      status: null,
      expiresAt: null,
      subscriptionId: null,
    };
  }

  try {
    return await getSubscriptionInfo(user.id);
  } catch (error) {
    console.error('Get subscription info error:', error);
    return {
      tier: 'free',
      status: null,
      expiresAt: null,
      subscriptionId: null,
    };
  }
}

