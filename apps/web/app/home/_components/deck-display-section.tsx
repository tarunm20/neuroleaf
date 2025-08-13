'use client';

import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@kit/ui/input';
import { Skeleton } from '@kit/ui/skeleton';
import { EmptyState, EmptyStateHeading, EmptyStateText } from '@kit/ui/empty-state';
import { DeckCard } from '@kit/decks/components';
import { useDecks } from '@kit/decks/hooks';
import { useSubscription } from '@kit/subscription/hooks';
import { DeckWithStats } from '@kit/decks/schemas';

interface DeckDisplaySectionProps {
  accountId: string;
  onDeleteDeck?: (deck: DeckWithStats) => void;
}

export function DeckDisplaySection({
  accountId,
  onDeleteDeck,
}: DeckDisplaySectionProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Use the existing, working useDecks hook - same as other pages
  const { data: decksData, isLoading } = useDecks(accountId, {
    sortBy: 'updated_at',
    sortOrder: 'desc',
    limit: 100, // Get a reasonable number of decks
    offset: 0,
  });

  // Get subscription info to check for locked decks
  const { data: subscriptionInfo } = useSubscription(accountId);

  // Enhanced filtering with deck access control
  const { filteredDecks, accessibleDecks, lockedDecks } = useMemo(() => {
    if (!decksData?.decks) return { filteredDecks: [], accessibleDecks: [], lockedDecks: [] };
    
    const accessibleDeckIds = subscriptionInfo?.accessibleDeckIds;
    let accessible: DeckWithStats[] = [];
    let locked: DeckWithStats[] = [];
    
    // If there are access restrictions, separate accessible and locked decks
    if (accessibleDeckIds) {
      accessible = decksData.decks.filter(deck => accessibleDeckIds.includes(deck.id));
      locked = decksData.decks.filter(deck => !accessibleDeckIds.includes(deck.id));
    } else {
      // No restrictions, all decks are accessible
      accessible = decksData.decks;
    }
    
    // Apply search filtering
    const filterBySearch = (decks: DeckWithStats[]) => {
      if (!searchTerm.trim()) return decks;
      
      const search = searchTerm.toLowerCase();
      return decks.filter(deck => 
        deck.name.toLowerCase().includes(search) ||
        deck.description?.toLowerCase().includes(search) ||
        deck.tags.some(tag => tag.toLowerCase().includes(search))
      );
    };
    
    const filteredAccessible = filterBySearch(accessible);
    const filteredLocked = filterBySearch(locked);
    
    return {
      filteredDecks: [...filteredAccessible, ...filteredLocked],
      accessibleDecks: filteredAccessible,
      lockedDecks: filteredLocked
    };
  }, [decksData?.decks, searchTerm, subscriptionInfo?.accessibleDeckIds]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Search skeleton */}
        <div className="flex justify-center">
          <Skeleton className="h-10 w-full max-w-sm" />
        </div>

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
        
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading your decks...</p>
        </div>
      </div>
    );
  }

  const isEmpty = !filteredDecks || filteredDecks.length === 0;
  const hasDecks = decksData?.decks && decksData.decks.length > 0;

  return (
    <div className="space-y-6">
      {/* Search - only show if user has decks */}
      {hasDecks && (
        <div className="flex justify-center">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search your decks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-emerald-200 focus:border-emerald-300 focus:ring-emerald-200"
            />
          </div>
        </div>
      )}

      {/* Decks Grid or Empty State */}
      {isEmpty ? (
        <EmptyState>
          <EmptyStateHeading>
            {searchTerm ? 'No decks found' : 'No flashcard decks yet'}
          </EmptyStateHeading>
          <EmptyStateText>
            {searchTerm 
              ? `No decks match "${searchTerm}". Try a different search term.`
              : 'Create your first deck using the button above to get started.'
            }
          </EmptyStateText>
        </EmptyState>
      ) : (
        <div className="space-y-8">
          {/* Accessible Decks */}
          {accessibleDecks.length > 0 && (
            <div className="space-y-4">
              {lockedDecks.length > 0 && (
                <h3 className="text-lg font-semibold text-foreground">
                  Available Decks ({accessibleDecks.length})
                </h3>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {accessibleDecks.map((deck) => (
                  <DeckCard
                    key={deck.id}
                    deck={deck}
                    onDelete={onDeleteDeck}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Locked Decks */}
          {lockedDecks.length > 0 && (
            <div className="space-y-4">
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                  Locked Decks ({lockedDecks.length})
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upgrade to access these decks. Your {subscriptionInfo?.deckLimit} oldest decks remain available.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {lockedDecks.map((deck) => (
                    <DeckCard
                      key={deck.id}
                      deck={deck}
                      isLocked={true}
                      onDelete={onDeleteDeck} // Allow deletion to free up slots
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Deck count - only show if not empty and not searching */}
      {!isEmpty && !searchTerm && (
        <div className="text-center text-sm text-muted-foreground">
          Showing {filteredDecks.length} deck{filteredDecks.length !== 1 ? 's' : ''}
        </div>
      )}

      {/* Search results count */}
      {!isEmpty && searchTerm && (
        <div className="text-center text-sm text-muted-foreground">
          Found {filteredDecks.length} of {decksData?.decks?.length || 0} decks
        </div>
      )}
    </div>
  );
}