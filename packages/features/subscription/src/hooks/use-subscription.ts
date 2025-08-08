import { useQuery } from '@tanstack/react-query';
import { getSubscriptionInfoAction, canAccessDeckAction } from '../server/subscription-actions';
import type { SubscriptionInfo } from '../types';

export function useSubscription(accountId: string) {
  return useQuery<SubscriptionInfo | null>({
    queryKey: ['subscription', accountId],
    queryFn: () => getSubscriptionInfoAction(accountId),
    enabled: !!accountId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCanCreateDeck(accountId: string) {
  const { data: subscriptionInfo, isLoading, error } = useSubscription(accountId);
  
  return {
    canCreate: subscriptionInfo?.canCreateDeck ?? false,
    isLoading,
    error,
    subscriptionInfo
  };
}

export function useCanAccessDeck(accountId: string, deckId: string) {
  return useQuery({
    queryKey: ['deck-access', accountId, deckId],
    queryFn: () => canAccessDeckAction(accountId, deckId),
    enabled: !!accountId && !!deckId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}