'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { requireUser } from '@kit/supabase/require-user';
import { TestHistoryService, type SaveTestHistoryData } from '../services/test-history.service';

/**
 * Get paginated test history for the current user
 */
export async function getUserTestHistoryAction(
  limit: number = 20,
  offset: number = 0
) {
  const supabase = getSupabaseServerClient();
  const result = await requireUser(supabase);
  const testHistoryService = new TestHistoryService(supabase);

  if (result.error || !result.data) {
    return { success: false, error: 'User not authenticated' };
  }

  const user = result.data;

  try {
    const history = await testHistoryService.getUserTestHistory(user.id, limit, offset);
    return { success: true, data: history };
  } catch (error) {
    console.error('Get user test history error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch test history',
    };
  }
}

/**
 * Get detailed test session data including all responses
 */
export async function getTestSessionDetailsAction(sessionId: string) {
  const supabase = getSupabaseServerClient();
  const result = await requireUser(supabase);
  const testHistoryService = new TestHistoryService(supabase);

  if (result.error || !result.data) {
    return { success: false, error: 'User not authenticated' };
  }

  const user = result.data;

  try {
    const details = await testHistoryService.getTestSessionDetails(sessionId, user.id);
    return { success: true, data: details };
  } catch (error) {
    console.error('Get test session details error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch test session details',
    };
  }
}

/**
 * Save complete test session with questions, results, and analysis
 */
export async function saveCompleteTestSessionAction(testData: SaveTestHistoryData) {
  const supabase = getSupabaseServerClient();
  const result = await requireUser(supabase);
  const testHistoryService = new TestHistoryService(supabase);

  if (result.error || !result.data) {
    return { success: false, error: 'User not authenticated' };
  }

  const user = result.data;

  try {
    const saved = await testHistoryService.saveCompleteTestSession(user.id, testData);
    
    if (saved) {
      revalidatePath('/home');
      revalidatePath('/home/test-history');
    }
    
    return { success: true, data: saved };
  } catch (error) {
    console.error('Save complete test session error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save test session',
    };
  }
}

/**
 * Get test statistics for dashboard display
 */
export async function getTestStatisticsAction(deckId?: string) {
  const supabase = getSupabaseServerClient();
  const result = await requireUser(supabase);
  const testHistoryService = new TestHistoryService(supabase);

  if (result.error || !result.data) {
    return { success: false, error: 'User not authenticated' };
  }

  const user = result.data;

  try {
    const statistics = await testHistoryService.getTestStatistics(user.id, deckId);
    return { success: true, data: statistics };
  } catch (error) {
    console.error('Get test statistics error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch test statistics',
    };
  }
}

/**
 * Get performance trends over time
 */
export async function getPerformanceTrendsAction(
  deckId?: string,
  daysBack: number = 30
) {
  const supabase = getSupabaseServerClient();
  const result = await requireUser(supabase);
  const testHistoryService = new TestHistoryService(supabase);

  if (result.error || !result.data) {
    return { success: false, error: 'User not authenticated' };
  }

  const user = result.data;

  try {
    const trends = await testHistoryService.getPerformanceTrends(user.id, deckId, daysBack);
    return { success: true, data: trends };
  } catch (error) {
    console.error('Get performance trends error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch performance trends',
    };
  }
}

/**
 * Get test history filtered by deck
 */
export async function getDeckTestHistoryAction(
  deckId: string,
  limit: number = 10
) {
  const supabase = getSupabaseServerClient();
  const result = await requireUser(supabase);
  const testHistoryService = new TestHistoryService(supabase);

  if (result.error || !result.data) {
    return { success: false, error: 'User not authenticated' };
  }

  const user = result.data;

  try {
    const history = await testHistoryService.getDeckTestHistory(user.id, deckId, limit);
    return { success: true, data: history };
  } catch (error) {
    console.error('Get deck test history error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch deck test history',
    };
  }
}

/**
 * Delete a specific test session
 */
export async function deleteTestSessionAction(sessionId: string) {
  const supabase = getSupabaseServerClient();
  const result = await requireUser(supabase);
  const testHistoryService = new TestHistoryService(supabase);

  if (result.error || !result.data) {
    return { success: false, error: 'User not authenticated' };
  }

  const user = result.data;

  try {
    const deleted = await testHistoryService.deleteTestSession(sessionId, user.id);
    
    if (deleted) {
      revalidatePath('/home');
      revalidatePath('/home/test-history');
    }
    
    return { success: true, data: deleted };
  } catch (error) {
    console.error('Delete test session error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete test session',
    };
  }
}