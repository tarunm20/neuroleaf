'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Search, Plus } from 'lucide-react';

import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { Skeleton } from '@kit/ui/skeleton';
import { EmptyState, EmptyStateHeading, EmptyStateText, EmptyStateButton } from '@kit/ui/empty-state';

import { DeckCard } from './deck-card';
import { CreateDeckDialog } from './create-deck-dialog';
import { DeckWithStats, DeckFilters } from '../schemas/deck.schema';
import { TextExtractionResult } from '@kit/flashcards/components';
import { useDecks } from '../hooks/use-decks';

interface SimpleDecksGridProps {
  accountId: string; // Required for client-side search
  onCreateDeck: (data: any) => Promise<{ id: string } | void>;
  onDeckCreated?: (deckId: string) => void;
  onEditDeck?: (deck: DeckWithStats) => void;
  onDuplicateDeck?: (deck: DeckWithStats) => void;
  onDeleteDeck?: (deck: DeckWithStats) => void;
  filters?: Partial<DeckFilters>;
  onFiltersChange?: (filters: Partial<DeckFilters>) => void;
  showCreateButton?: boolean;
  extractTextAction: (formData: globalThis.FormData) => Promise<TextExtractionResult>;
  onCreateDeckClick?: () => boolean; // Return true to allow opening dialog, false to prevent
}

export function SimpleDecksGrid({
  accountId,
  onCreateDeck,
  onDeckCreated,
  onEditDeck,
  onDuplicateDeck,
  onDeleteDeck,
  filters,
  onFiltersChange,
  showCreateButton = true,
  extractTextAction,
  onCreateDeckClick,
}: SimpleDecksGridProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState(filters?.search || '');

  // Use the working useDecks hook
  const { data: decksData, isLoading } = useDecks(accountId, {
    sortBy: 'updated_at',
    sortOrder: 'desc',
    limit: 100,
    offset: 0,
  });

  // Client-side filtering for search
  const filteredDecks = useMemo(() => {
    if (!decksData?.decks) return [];
    
    if (!localSearchTerm.trim()) {
      return decksData.decks;
    }
    
    const search = localSearchTerm.toLowerCase();
    return decksData.decks.filter(deck => 
      deck.name.toLowerCase().includes(search) ||
      deck.description?.toLowerCase().includes(search) ||
      deck.tags.some(tag => tag.toLowerCase().includes(search))
    );
  }, [decksData?.decks, localSearchTerm]);

  // Handle search with immediate client-side filtering (no API calls)
  const handleSearchChange = useCallback((search: string) => {
    setLocalSearchTerm(search);
    
    // Update filters for other components that might need it
    onFiltersChange?.({
      ...filters,
      search: search,
      offset: 0,
    });
  }, [filters, onFiltersChange]);

  const handleCreateButtonClick = () => {
    if (onCreateDeckClick) {
      const canProceed = onCreateDeckClick();
      if (canProceed) {
        setShowCreateDialog(true);
      }
    } else {
      setShowCreateDialog(true);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 flex-1 max-w-sm" />
          <Skeleton className="h-10 w-32" />
        </div>

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

  const isEmpty = filteredDecks.length === 0;

  return (
    <div className="space-y-6">
      {/* Simple Search and Create */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search decks..."
            value={localSearchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {showCreateButton && (
          <>
            <Button onClick={handleCreateButtonClick}>
              <Plus className="h-4 w-4 mr-2" />
              Create Deck
            </Button>
            <CreateDeckDialog 
              open={showCreateDialog}
              onOpenChange={setShowCreateDialog}
              onSubmit={onCreateDeck}
              onDeckCreated={onDeckCreated}
              extractTextAction={extractTextAction}
            />
          </>
        )}
      </div>

      {/* Decks Grid */}
      {isEmpty ? (
        <EmptyState>
          <EmptyStateHeading>
            {localSearchTerm ? 'No decks found' : 'No flashcard decks yet'}
          </EmptyStateHeading>
          <EmptyStateText>
            {localSearchTerm 
              ? `No decks match "${localSearchTerm}". Try a different search term.`
              : 'Create your first deck to start learning with spaced repetition.'
            }
          </EmptyStateText>
          {!localSearchTerm && showCreateButton && (
            <EmptyStateButton size="lg" onClick={handleCreateButtonClick}>
              Create Your First Deck
            </EmptyStateButton>
          )}
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDecks.map((deck) => (
            <DeckCard
              key={deck.id}
              deck={deck}
              onEdit={onEditDeck}
              onDuplicate={onDuplicateDeck}
              onDelete={onDeleteDeck}
            />
          ))}
        </div>
      )}

      {/* Show deck count */}
      {!isEmpty && (
        <div className="text-center text-sm text-muted-foreground">
          {localSearchTerm && decksData && (
            <>Showing {filteredDecks.length} of {decksData.total} decks</>
          )}
          {!localSearchTerm && (
            <>Showing {filteredDecks.length} deck{filteredDecks.length !== 1 ? 's' : ''}</>
          )}
        </div>
      )}
    </div>
  );
}