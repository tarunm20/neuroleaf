'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { DeckDisplaySection } from '~/home/_components/deck-display-section';
import { DeckWithStats } from '@kit/decks/schemas';
import { useUser } from '@kit/supabase/hooks/use-user';
import { useSubscription } from '@kit/subscription/hooks';
import { useDuplicateDeck, useDeleteDeck } from '@kit/decks/hooks';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@kit/ui/alert-dialog';

interface DecksPageClientProps {
  accountId: string;
}

export function DecksPageClient({ accountId }: DecksPageClientProps) {
  const _router = useRouter();
  const user = useUser();
  const { data: subscriptionInfo } = useSubscription(user?.data?.id || '');
  const duplicateDeckMutation = useDuplicateDeck();
  const deleteDeckMutation = useDeleteDeck();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deckToDelete, setDeckToDelete] = useState<DeckWithStats | null>(null);

  const handleEditDeck = useCallback((_deck: DeckWithStats) => {
    toast.info('Edit functionality coming soon!');
  }, []);

  const handleDuplicateDeck = useCallback(async (deck: DeckWithStats) => {
    try {
      // Check subscription limits before duplicating deck
      if (subscriptionInfo && !subscriptionInfo.canCreateDeck) {
        const tierName = subscriptionInfo.tier === 'free' ? 'Free' : 
                         subscriptionInfo.tier === 'pro' ? 'Pro' : 'Premium';
        toast.error(`You've reached your deck limit of ${subscriptionInfo.deckLimit} for the ${tierName} plan. Please upgrade to create more decks.`);
        return;
      }

      await duplicateDeckMutation.mutateAsync({
        deckId: deck.id,
        accountId: accountId,
        userId: accountId,
        newName: `${deck.name} (Copy)`,
      });
      
      toast.success(`Successfully duplicated "${deck.name}"`);
    } catch (error) {
      console.error('Failed to duplicate deck:', error);
      toast.error('Failed to duplicate deck');
    }
  }, [subscriptionInfo, duplicateDeckMutation, accountId]);

  const handleDeleteDeck = useCallback(async (deck: DeckWithStats) => {
    setDeckToDelete(deck);
    setShowDeleteDialog(true);
  }, []);

  const confirmDeleteDeck = useCallback(async () => {
    if (!deckToDelete) return;
    
    try {
      await deleteDeckMutation.mutateAsync(deckToDelete.id);
      toast.success(`Successfully deleted "${deckToDelete.name}"`);
    } catch (error) {
      console.error('Failed to delete deck:', error);
      toast.error('Failed to delete deck');
    } finally {
      setShowDeleteDialog(false);
      setDeckToDelete(null);
    }
  }, [deckToDelete, deleteDeckMutation]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">My Flashcard Decks</h1>
        <p className="text-muted-foreground">
          Create, organize, and study your flashcard collections
        </p>
      </div>
      
      <DeckDisplaySection
        accountId={accountId}
        onDeleteDeck={handleDeleteDeck}
      />

      {/* Delete Deck Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Deck</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deckToDelete?.name}"? This action cannot be undone and will permanently remove all flashcards in this deck.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteDeck}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete Deck
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}