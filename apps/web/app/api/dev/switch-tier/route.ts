import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { SubscriptionService } from '@kit/subscription/server';
import { shouldEnableTierSwitcher } from '../../../../config/dev.config';

export async function POST(request: NextRequest) {
  // Only allow in development with tier switcher enabled
  if (!shouldEnableTierSwitcher()) {
    return NextResponse.json(
      { error: 'Tier switching not available' },
      { status: 403 }
    );
  }

  try {
    const { accountId, tier } = await request.json();

    if (!accountId || !tier) {
      return NextResponse.json(
        { error: 'Missing accountId or tier' },
        { status: 400 }
      );
    }

    if (!['free', 'pro', 'premium'].includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid tier' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();
    const subscriptionService = new SubscriptionService(supabase);

    // Update the subscription tier
    const success = await subscriptionService.updateSubscriptionTier(accountId, tier);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update subscription tier' },
        { status: 500 }
      );
    }

    console.log(`🔧 DEV: Switched account ${accountId} to ${tier} tier`);

    return NextResponse.json({ 
      success: true, 
      tier,
      message: `Successfully switched to ${tier} tier` 
    });

  } catch (error) {
    console.error('Error switching tier:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}