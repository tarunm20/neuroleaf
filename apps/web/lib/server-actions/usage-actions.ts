'use server';

import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { requireUser } from '@kit/supabase/require-user';
import { getCurrentUsage } from '@kit/subscription/server';

export async function getUserUsageAction() {
  const supabase = getSupabaseServerClient();
  const { data: user } = await requireUser(supabase);

  if (!user) {
    throw new Error('User not authenticated');
  }

  try {
    const usageData = await getCurrentUsage(user.id);
    return { success: true, data: usageData };
  } catch (error) {
    console.error('Get user usage error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get usage data',
    };
  }
}