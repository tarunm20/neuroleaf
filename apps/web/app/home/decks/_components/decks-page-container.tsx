'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDecks, useCreateDeck, useUpdateDeck, useDeleteDeck, useDuplicateDeck } from '@kit/decks/hooks';
import { generateFlashcardsWithAIAction } from '@kit/flashcards/server';
import { SimpleDecksGrid } from '@kit/decks/components';
import { CreateDeckData, DeckFilters, DeckWithStats } from '@kit/decks/schemas';
import { useSubscription } from '@kit/subscription/hooks';
import { DeckLimitIndicator, UpgradePrompt } from '@kit/subscription/components';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@kit/ui/dialog';
import { Button } from '@kit/ui/button';
import { toast } from 'sonner';
import { extractTextFromFileAction } from '../../../../lib/server-actions/file-upload-actions';

interface DecksPageContainerProps {
  userId: string;
}

export function DecksPageContainer({ userId }: DecksPageContainerProps) {
  const router = useRouter();
  const [filters, setFilters] = useState<DeckFilters>({
    search: '',
    sortBy: 'updated_at',
    sortOrder: 'desc',
    limit: 20,
    offset: 0,
  });
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [upgradeDialogInfo, setUpgradeDialogInfo] = useState<{ tierName: string; deckLimit: number } | null>(null);

  const { data: _decksData, isLoading: _isLoading } = useDecks(userId, filters);
  const { data: subscriptionInfo } = useSubscription(userId);
  const createDeckMutation = useCreateDeck();
  const _updateDeckMutation = useUpdateDeck();
  const deleteDeckMutation = useDeleteDeck();
  const duplicateDeckMutation = useDuplicateDeck();

  const handleCreateDeck = async (
    data: CreateDeckData & { 
      content?: string; 
    }
  ): Promise<{ id: string }> => {
    try {
      // First create the deck using the working hook
      const newDeck = await createDeckMutation.mutateAsync({
        data: {
          name: data.name,
          description: data.description,
          visibility: data.visibility,
          tags: data.tags,
        },
        accountId: userId,
        userId,
      });
      
      // Then generate flashcards if content is provided
      if (data.content && data.content.trim().length > 0) {
        try {
          toast.info('Analyzing content and generating flashcards with AI...', {
            duration: 3000,
          });
          
          const aiResult = await generateFlashcardsWithAIAction({
            deck_id: newDeck.id,
            content: data.content,
            number_of_cards: 10, // This will be ignored by AI, content analysis will determine count
            card_type: 'basic',
            language: 'en',
            subject: undefined,
          });
          
          if (!aiResult.success) {
            toast.warning(`Deck created successfully, but flashcard generation failed: ${aiResult.error}`);
          } else {
            const cardCount = aiResult.flashcards?.length || 0;
            toast.success(`Deck created with ${cardCount} AI-generated flashcards!`);
          }
        } catch (aiError) {
          console.error('AI generation error:', aiError);
          toast.warning('Deck created successfully, but flashcard generation failed. You can add cards manually.');
        }
      } else {
        toast.success('Deck created successfully!');
      }
      
      return { id: newDeck.id };
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create deck');
      throw error;
    }
  };

  const handleDeckCreated = (deckId: string) => {
    // Redirect to deck flashcards page after creation
    router.push(`/home/decks/${deckId}/flashcards`);
  };

  const handleEditDeck = (_deck: DeckWithStats) => {
    // For now, just show a toast. In the future, this could open an edit dialog
    toast.info('Edit functionality coming soon!');
  };

  const handleDuplicateDeck = async (deck: DeckWithStats) => {
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
        accountId: userId,
        userId,
        newName: `${deck.name} (Copy)`,
      });
    } catch (error) {
      console.error('Failed to duplicate deck:', error);
    }
  };

  const handleDeleteDeck = async (deck: DeckWithStats) => {
    if (window.confirm(`Are you sure you want to delete "${deck.name}"? This action cannot be undone.`)) {
      try {
        await deleteDeckMutation.mutateAsync(deck.id);
      } catch (error) {
        console.error('Failed to delete deck:', error);
      }
    }
  };


  const handleUpgradeClick = () => {
    toast.info('Upgrade functionality coming soon! For now, this would redirect to the billing page.');
  };

  const handleCreateDeckClick = () => {
    // Check subscription limits before opening dialog
    if (subscriptionInfo && !subscriptionInfo.canCreateDeck) {
      const tierName = subscriptionInfo.tier === 'free' ? 'Free' : 
                       subscriptionInfo.tier === 'pro' ? 'Pro' : 'Premium';
      
      // Show upgrade dialog instead of allowing deck creation
      setUpgradeDialogInfo({ tierName, deckLimit: subscriptionInfo.deckLimit });
      setShowUpgradeDialog(true);
      
      return false; // Don't open the create deck dialog
    }
    
    return true; // Allow opening the create deck dialog
  };

  return (
    <div className="space-y-6">
      {subscriptionInfo && (
        <div className="grid gap-4 md:grid-cols-2">
          <DeckLimitIndicator subscriptionInfo={subscriptionInfo} />
          {!subscriptionInfo.canCreateDeck && (
            <UpgradePrompt 
              type="deck"
              current={subscriptionInfo.currentDeckCount}
              limit={subscriptionInfo.deckLimit}
            />
          )}
        </div>
      )}
      
      <SimpleDecksGrid
        accountId={userId}
        onCreateDeck={handleCreateDeck}
        onDeckCreated={handleDeckCreated}
        onDeleteDeck={handleDeleteDeck}
        filters={filters}
        onFiltersChange={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))}
        extractTextAction={extractTextFromFileAction}
        onCreateDeckClick={handleCreateDeckClick}
      />

      {/* Upgrade Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Deck Limit Reached</DialogTitle>
            <DialogDescription>
              {upgradeDialogInfo && (
                <>
                  You've reached your deck limit of {upgradeDialogInfo.deckLimit} for the {upgradeDialogInfo.tierName} plan.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Upgrade to a higher tier to create more decks and unlock additional features.
            </p>
          </div>
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowUpgradeDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                setShowUpgradeDialog(false);
                handleUpgradeClick();
              }}
            >
              Upgrade Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}