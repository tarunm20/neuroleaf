import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@kit/supabase/hooks/use-supabase';
import { FlashcardService } from '../server/flashcard-service';
import { 
  FlashcardFilters
} from '../schemas/flashcard.schema';
import { 
  createFlashcardAction,
  updateFlashcardAction,
  deleteFlashcardAction,
  bulkDeleteFlashcardsAction,
  duplicateFlashcardsAction,
  reorderFlashcardsAction,
  bulkImportFlashcardsAction,
  generateFlashcardsWithAIAction
} from '../server/flashcard-actions';
import { toast } from 'sonner';

// Query hooks
export function useFlashcards(deckId: string, filters?: Partial<FlashcardFilters>) {
  const supabase = useSupabase();
  const flashcardService = new FlashcardService(supabase);

  return useQuery({
    queryKey: ['flashcards', deckId, filters],
    queryFn: () => flashcardService.getFlashcards(deckId, filters),
    enabled: !!deckId,
  });
}

export function useFlashcard(flashcardId: string) {
  const supabase = useSupabase();
  const flashcardService = new FlashcardService(supabase);

  return useQuery({
    queryKey: ['flashcard', flashcardId],
    queryFn: () => flashcardService.getFlashcard(flashcardId),
    enabled: !!flashcardId,
  });
}

export function useDeckFlashcardStats(deckId: string) {
  const supabase = useSupabase();
  const flashcardService = new FlashcardService(supabase);

  return useQuery({
    queryKey: ['deck-flashcard-stats', deckId],
    queryFn: () => flashcardService.getDeckStatistics(deckId),
    enabled: !!deckId,
  });
}

export function useSearchFlashcards(accountId: string, query: string, options?: {
  deckIds?: string[];
  limit?: number;
  offset?: number;
}) {
  const supabase = useSupabase();
  const flashcardService = new FlashcardService(supabase);

  return useQuery({
    queryKey: ['search-flashcards', accountId, query, options],
    queryFn: () => flashcardService.searchFlashcards(accountId, query, options),
    enabled: !!accountId && !!query && query.length >= 2,
  });
}

// Mutation hooks
export function useCreateFlashcard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createFlashcardAction,
    onSuccess: (result, variables) => {
      if (result.success) {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['flashcards', variables.deck_id] });
        queryClient.invalidateQueries({ queryKey: ['deck-flashcard-stats', variables.deck_id] });
        queryClient.invalidateQueries({ queryKey: ['decks'] });
        
        toast.success('Flashcard created successfully!');
      } else {
        toast.error(result.error || 'Failed to create flashcard');
      }
    },
    onError: (error) => {
      toast.error(`Failed to create flashcard: ${error.message}`);
    },
  });
}

export function useUpdateFlashcard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateFlashcardAction,
    onSuccess: (result, variables) => {
      if (result.success) {
        // Update specific flashcard in cache
        queryClient.setQueryData(['flashcard', variables.id], result.flashcard);
        
        // Invalidate flashcards list
        queryClient.invalidateQueries({ queryKey: ['flashcards'] });
        
        toast.success('Flashcard updated successfully!');
      } else {
        toast.error(result.error || 'Failed to update flashcard');
      }
    },
    onError: (error) => {
      toast.error(`Failed to update flashcard: ${error.message}`);
    },
  });
}

export function useDeleteFlashcard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteFlashcardAction,
    onSuccess: (result, flashcardId) => {
      if (result.success) {
        // Remove from cache
        queryClient.removeQueries({ queryKey: ['flashcard', flashcardId] });
        
        // Invalidate flashcards list and deck stats
        queryClient.invalidateQueries({ queryKey: ['flashcards'] });
        queryClient.invalidateQueries({ queryKey: ['deck-flashcard-stats'] });
        queryClient.invalidateQueries({ queryKey: ['decks'] });
        
        toast.success('Flashcard deleted successfully!');
      } else {
        toast.error(result.error || 'Failed to delete flashcard');
      }
    },
    onError: (error) => {
      toast.error(`Failed to delete flashcard: ${error.message}`);
    },
  });
}

export function useBulkDeleteFlashcards() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bulkDeleteFlashcardsAction,
    onSuccess: (result, flashcardIds) => {
      if (result.success) {
        // Remove from cache
        flashcardIds.forEach(id => {
          queryClient.removeQueries({ queryKey: ['flashcard', id] });
        });
        
        // Invalidate flashcards list and deck stats
        queryClient.invalidateQueries({ queryKey: ['flashcards'] });
        queryClient.invalidateQueries({ queryKey: ['deck-flashcard-stats'] });
        queryClient.invalidateQueries({ queryKey: ['decks'] });
        
        toast.success(`${flashcardIds.length} flashcards deleted successfully!`);
      } else {
        toast.error(result.error || 'Failed to delete flashcards');
      }
    },
    onError: (error) => {
      toast.error(`Failed to delete flashcards: ${error.message}`);
    },
  });
}

export function useDuplicateFlashcards() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ flashcardIds, targetDeckId }: { 
      flashcardIds: string[]; 
      targetDeckId?: string; 
    }) => duplicateFlashcardsAction(flashcardIds, targetDeckId),
    onSuccess: (result, variables) => {
      if (result.success) {
        // Invalidate flashcards list for target deck
        const deckId = variables.targetDeckId || result.flashcards?.[0]?.deck_id;
        if (deckId) {
          queryClient.invalidateQueries({ queryKey: ['flashcards', deckId] });
          queryClient.invalidateQueries({ queryKey: ['deck-flashcard-stats', deckId] });
          queryClient.invalidateQueries({ queryKey: ['decks'] });
        }
        
        toast.success(`${variables.flashcardIds.length} flashcards duplicated successfully!`);
      } else {
        toast.error(result.error || 'Failed to duplicate flashcards');
      }
    },
    onError: (error) => {
      toast.error(`Failed to duplicate flashcards: ${error.message}`);
    },
  });
}

export function useReorderFlashcards() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reorderFlashcardsAction,
    onSuccess: (result, variables) => {
      if (result.success) {
        // Invalidate flashcards list
        queryClient.invalidateQueries({ queryKey: ['flashcards', variables.deck_id] });
        
        // Don't show toast for reordering as it happens frequently
      } else {
        toast.error(result.error || 'Failed to reorder flashcards');
      }
    },
    onError: (error) => {
      toast.error(`Failed to reorder flashcards: ${error.message}`);
    },
  });
}

export function useBulkImportFlashcards() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bulkImportFlashcardsAction,
    onSuccess: (result, variables) => {
      if (result.success) {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['flashcards', variables.deck_id] });
        queryClient.invalidateQueries({ queryKey: ['deck-flashcard-stats', variables.deck_id] });
        queryClient.invalidateQueries({ queryKey: ['decks'] });
        
        const count = result.flashcards?.length || variables.flashcards.length;
        toast.success(`${count} flashcards imported successfully!`);
      } else {
        toast.error(result.error || 'Failed to import flashcards');
      }
    },
    onError: (error) => {
      toast.error(`Failed to import flashcards: ${error.message}`);
    },
  });
}

export function useGenerateFlashcardsWithAI() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: generateFlashcardsWithAIAction,
    onSuccess: (result, variables) => {
      if (result.success) {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['flashcards', variables.deck_id] });
        queryClient.invalidateQueries({ queryKey: ['deck-flashcard-stats', variables.deck_id] });
        queryClient.invalidateQueries({ queryKey: ['decks'] });
        
        const count = result.flashcards?.length || 0;
        toast.success(`${count} AI-generated flashcards created successfully!`);
      } else {
        toast.error(result.error || 'Failed to generate flashcards');
      }
    },
    onError: (error) => {
      toast.error(`Failed to generate flashcards: ${error.message}`);
    },
  });
}