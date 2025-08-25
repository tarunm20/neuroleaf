'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

import { useSupabase } from '@kit/supabase/hooks/use-supabase';
import { useUser } from '@kit/supabase/hooks/use-user';
import { useSubscription } from '@kit/subscription/hooks';
import { usePersonalAccountData } from '@kit/accounts/hooks/use-personal-account-data';
import { useCreateDeck, useDeleteDeck } from '@kit/decks/hooks';
import { generateFlashcardsWithAIAction } from '@kit/flashcards/server';
import { CreateDeckData, DeckWithStats } from '@kit/decks/schemas';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@kit/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@kit/ui/alert-dialog';
import { Button } from '@kit/ui/button';

import { PrimaryActionHero } from './primary-action-hero';
import { StudyStatusCard } from './study-status-card';
import { CoreStatsGrid } from './core-stats-grid';
import { DeckDisplaySection } from './deck-display-section';
import { TokenUsageCard } from './token-usage-card';
import { LearningStatsService } from '~/lib/services/learning-stats.service';
import { DevTierSwitcher } from '~/components/dev-tier-switcher';
import { extractTextFromFileAction } from '../../../lib/server-actions/file-upload-actions';
import { getCurrentUsageAction } from '@kit/test-mode/server';
import { toast } from 'sonner';

export function UnifiedDashboard() {
  const supabase = useSupabase();
  const user = useUser();
  const router = useRouter();

  // Dashboard state - simplified (no more complex filter state)
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [upgradeDialogInfo, setUpgradeDialogInfo] = useState<{ tierName: string; deckLimit: number } | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deckToDelete, setDeckToDelete] = useState<DeckWithStats | null>(null);

  // Services and hooks
  const learningStatsService = new LearningStatsService(supabase);
  
  // Get subscription info
  const { data: subscriptionInfo } = useSubscription(user?.data?.id || '');
  
  // Get account data including user name
  const { data: accountData } = usePersonalAccountData(user?.data?.id || '');
  

  // Fetch learning statistics
  const { data: learningStats, isLoading: statsLoading } = useQuery({
    queryKey: ['learning-stats', user?.data?.id],
    queryFn: () => learningStatsService.getLearningStats(user?.data?.id || ''),
    enabled: !!user?.data?.id,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Fetch enhanced progress statistics
  const { data: _enhancedStats, isLoading: enhancedStatsLoading } = useQuery({
    queryKey: ['enhanced-progress-stats', user?.data?.id],
    queryFn: () => learningStatsService.getEnhancedProgressStats(user?.data?.id || ''),
    enabled: !!user?.data?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes (these stats are less time-sensitive)
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  // Fetch token usage data
  const { data: tokenUsageData } = useQuery({
    queryKey: ['token-usage', user?.data?.id],
    queryFn: () => getCurrentUsageAction(),
    enabled: !!user?.data?.id,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: true,
  });


  // Deck management hooks  
  const createDeckMutation = useCreateDeck();
  const deleteDeckMutation = useDeleteDeck();

  // Extract user name for personalization
  const userName = accountData?.name || user?.data?.email?.split('@')[0] || undefined;

  // Calculate core metrics (simplified for MVP)
  const cardsDue = learningStats?.cardsDue || 0;
  const studyStreak = learningStats?.studyStreak || 0;
  const totalDecks = learningStats?.totalDecks || 0;

  // Event handlers
  const handleStartStudying = () => {
    if (totalDecks === 0) {
      toast.info('Create your first deck to start studying!');
      return;
    }
    
    toast.info('Navigate to a specific deck to start studying!');
  };

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
        accountId: user?.data?.id || '',
        userId: user?.data?.id || '',
      });
      
      // Then generate flashcards if content is provided
      if (data.content && data.content.trim().length > 0) {
        try {
          toast.info('AI is analyzing your content to determine optimal flashcard count...', {
            duration: 3000,
          });
          
          const aiResult = await generateFlashcardsWithAIAction({
            deck_id: newDeck.id,
            content: data.content,
            number_of_cards: 10, // This will be overridden by AI content analysis
            card_type: 'basic',
            language: 'en',
            subject: undefined,
            is_image: false,
          });
          
          if (!aiResult.success) {
            // Handle different types of AI errors with appropriate messages
            const errorMessage = aiResult.error || 'Unknown error';
            if (errorMessage.includes('quota') || errorMessage.includes('QUOTA_EXCEEDED')) {
              toast.warning('Deck created successfully! AI generation is temporarily at capacity. You can add flashcards manually or try AI generation later.', {
                duration: 6000,
              });
            } else if (errorMessage.includes('limit')) {
              toast.warning('Deck created successfully! You\'ve reached your AI generation limit. Upgrade to Pro for unlimited AI features.', {
                duration: 6000,
              });
            } else {
              toast.warning(`Deck created, but AI generation failed: ${errorMessage}. You can add cards manually.`);
            }
          } else {
            const cardCount = aiResult.flashcards?.length || 0;
            toast.success(`AI analyzed your content and created ${cardCount} optimized flashcards!`);
          }
        } catch (aiError) {
          console.error('AI generation error:', aiError);
          toast.warning('Deck created successfully. AI generation is temporarily unavailable, but you can add cards manually.', {
            duration: 5000,
          });
        }
      }
      
      return { id: newDeck.id };
    } catch (error) {
      console.error('Deck creation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create deck');
      throw error;
    }
  };

  const handleDeckCreated = (deckId: string) => {
    // Show success toast with navigation option
    toast.success('Deck created successfully!', {
      action: {
        label: 'Open Deck',
        onClick: () => router.push(`/home/decks/${deckId}`),
      },
      duration: 5000,
    });
    
    // Auto-navigate after a short delay to let user see the success
    setTimeout(() => {
      router.push(`/home/decks/${deckId}`);
    }, 1500);
  };


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

  const handleUpgradeClick = () => {
    router.push('/pricing');
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

  if (!user?.data) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">Loading your dashboard...</h2>
          <p className="text-muted-foreground">Please wait while we load your learning data.</p>
        </div>
      </div>
    );
  }

  const isLoading = statsLoading || enhancedStatsLoading;

  if (isLoading) {
    return (
      <div className="space-y-8 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="h-32 bg-muted animate-pulse rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-8">
      {/* 1. Primary Action Hero - Single welcome + create action */}
      <PrimaryActionHero
        userName={userName}
        totalDecks={totalDecks}
        subscriptionInfo={subscriptionInfo || undefined}
        onCreateDeck={handleCreateDeck}
        onDeckCreated={handleDeckCreated}
        onCreateDeckClick={handleCreateDeckClick}
        extractTextAction={extractTextFromFileAction}
      />

      {/* 2. Study Status Card - Conditional cards due display */}
      <StudyStatusCard
        cardsDue={cardsDue}
        studyStreak={studyStreak}
        onStartStudying={handleStartStudying}
        subscriptionInfo={subscriptionInfo || undefined}
      />

      {/* 3. Core Stats Grid - Only 3 essential metrics */}
      <CoreStatsGrid
        cardsDue={cardsDue}
        studyStreak={studyStreak}
        totalDecks={totalDecks}
        subscriptionInfo={subscriptionInfo || undefined}
      />

      {/* 4. Token Usage Card - Show usage for all users */}
      {tokenUsageData && (
        <TokenUsageCard
          currentUsage={tokenUsageData.currentUsage}
          limit={tokenUsageData.limit}
          isProTier={tokenUsageData.isProTier}
        />
      )}

      {/* 5. Deck Management Section - Clean, no create buttons */}
      <div id="deck-management-section" className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">My Flashcard Decks</h2>
          {totalDecks > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {totalDecks} deck{totalDecks !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        
        <DeckDisplaySection
          accountId={user.data.id}
          onDeleteDeck={handleDeleteDeck}
        />
      </div>


      {/* Dev Tier Switcher - only shows in development */}
      {/* {subscriptionInfo && user?.data?.id && (
        <DevTierSwitcher
          currentTier={subscriptionInfo.tier}
          accountId={user.data.id}
        />
      )} */}

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
              className="neuroleaf-button-primary"
            >
              Upgrade Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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