import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useSupabase } from '@kit/supabase/hooks/use-supabase';
import { DeckService } from '../server/deck-service';
import { CreateDeckData, UpdateDeckData, DeckFilters } from '../schemas/deck.schema';
import { toast } from 'sonner';

export function useDecks(accountId: string, filters?: Partial<DeckFilters>) {
  const supabase = useSupabase();
  const deckService = new DeckService(supabase);

  return useQuery({
    queryKey: ['decks', accountId, filters],
    queryFn: () => deckService.getUserDecks(accountId, filters),
    enabled: !!accountId,
    placeholderData: keepPreviousData,
    staleTime: 30000, // 30 seconds - reduce refetches for recently fetched data
    gcTime: 300000, // 5 minutes - keep data in cache longer
  });
}

export function useDeck(deckId: string) {
  const supabase = useSupabase();
  const deckService = new DeckService(supabase);

  return useQuery({
    queryKey: ['deck', deckId],
    queryFn: () => deckService.getDeck(deckId),
    enabled: !!deckId,
  });
}

export function useDeckStats(deckId: string, userId: string) {
  const supabase = useSupabase();
  const deckService = new DeckService(supabase);

  return useQuery({
    queryKey: ['deck-stats', deckId, userId],
    queryFn: () => deckService.getDeckStats(deckId, userId),
    enabled: !!deckId && !!userId,
  });
}

export function usePublicDecks(filters?: Partial<DeckFilters>) {
  const supabase = useSupabase();
  const deckService = new DeckService(supabase);

  return useQuery({
    queryKey: ['public-decks', filters],
    queryFn: () => deckService.getPublicDecks(filters),
  });
}

export function useCreateDeck() {
  const queryClient = useQueryClient();
  const supabase = useSupabase();
  const deckService = new DeckService(supabase);

  return useMutation({
    mutationFn: async ({ 
      data, 
      accountId, 
      userId 
    }: { 
      data: CreateDeckData; 
      accountId: string; 
      userId: string; 
    }) => {
      return deckService.createDeck(data, accountId, userId);
    },
    onSuccess: (deck, variables) => {
      // Invalidate and refetch decks - both old and new query keys
      queryClient.invalidateQueries({ queryKey: ['decks', variables.accountId] });
      queryClient.invalidateQueries({ queryKey: ['all-decks', variables.accountId] });
      
      // Don't show toast here - handled by the calling component
    },
    onError: (error) => {
      toast.error(`Failed to create deck: ${error.message}`);
    },
  });
}

export function useUpdateDeck() {
  const queryClient = useQueryClient();
  const supabase = useSupabase();
  const deckService = new DeckService(supabase);

  return useMutation({
    mutationFn: async ({ 
      data, 
      userId 
    }: { 
      data: UpdateDeckData; 
      userId: string; 
    }) => {
      return deckService.updateDeck(data, userId);
    },
    onSuccess: (deck, variables) => {
      // Update specific deck query
      queryClient.setQueryData(['deck', deck.id], deck);
      
      // Invalidate decks list - both old and new query keys
      queryClient.invalidateQueries({ queryKey: ['decks'] });
      queryClient.invalidateQueries({ queryKey: ['all-decks'] });
      
      toast.success('Deck updated successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to update deck: ${error.message}`);
    },
  });
}

export function useDeleteDeck() {
  const queryClient = useQueryClient();
  const supabase = useSupabase();
  const deckService = new DeckService(supabase);

  return useMutation({
    mutationFn: async (deckId: string) => {
      return deckService.deleteDeck(deckId);
    },
    onSuccess: (_, deckId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['deck', deckId] });
      queryClient.removeQueries({ queryKey: ['deck-stats', deckId] });
      
      // Invalidate decks list - both old and new query keys
      queryClient.invalidateQueries({ queryKey: ['decks'] });
      queryClient.invalidateQueries({ queryKey: ['all-decks'] });
      
      toast.success('Deck deleted successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to delete deck: ${error.message}`);
    },
  });
}

export function useDuplicateDeck() {
  const queryClient = useQueryClient();
  const supabase = useSupabase();
  const deckService = new DeckService(supabase);

  return useMutation({
    mutationFn: async ({ 
      deckId, 
      accountId, 
      userId, 
      newName 
    }: { 
      deckId: string; 
      accountId: string; 
      userId: string; 
      newName?: string; 
    }) => {
      return deckService.duplicateDeck(deckId, accountId, userId, newName);
    },
    onSuccess: (deck, variables) => {
      // Invalidate decks list - both old and new query keys
      queryClient.invalidateQueries({ queryKey: ['decks', variables.accountId] });
      queryClient.invalidateQueries({ queryKey: ['all-decks', variables.accountId] });
      
      toast.success('Deck duplicated successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to duplicate deck: ${error.message}`);
    },
  });
}