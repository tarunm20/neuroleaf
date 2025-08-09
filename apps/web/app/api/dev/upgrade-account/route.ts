'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';
import { requireUser } from '@kit/supabase/require-user';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

/**
 * Development-only endpoint to manually upgrade accounts to Pro
 * This bypasses the Stripe webhook for local development testing
 */
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    const supabase = getSupabaseServerClient();
    const { data: user, error: userError } = await requireUser(supabase);
    
    if (userError || !user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const adminSupabase = getSupabaseServerAdminClient();
    
    // Upgrade user to Pro tier
    const { error: updateError } = await adminSupabase
      .from('accounts')
      .update({
        subscription_tier: 'pro',
        subscription_status: 'active',
        subscription_expires_at: null, // Set to null for active subscriptions
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to upgrade account:', updateError);
      return NextResponse.json({ error: 'Failed to upgrade account' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Account upgraded to Pro successfully',
      userId: user.id
    });

  } catch (error) {
    console.error('Manual upgrade error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

/**
 * Development-only endpoint to manually downgrade accounts to Free
 */
export async function DELETE(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    const supabase = getSupabaseServerClient();
    const { data: user, error: userError } = await requireUser(supabase);
    
    if (userError || !user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const adminSupabase = getSupabaseServerAdminClient();
    
    // Downgrade user to Free tier
    const { error: updateError } = await adminSupabase
      .from('accounts')
      .update({
        subscription_tier: 'free',
        subscription_status: 'canceled',
        subscription_expires_at: null,
        stripe_subscription_id: null,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to downgrade account:', updateError);
      return NextResponse.json({ error: 'Failed to downgrade account' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Account downgraded to Free successfully',
      userId: user.id
    });

  } catch (error) {
    console.error('Manual downgrade error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}