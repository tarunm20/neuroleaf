'use client';

import { useState } from 'react';
import { Search, Filter, Grid, List } from 'lucide-react';

import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';
import { Skeleton } from '@kit/ui/skeleton';
import { EmptyState, EmptyStateHeading, EmptyStateText, EmptyStateButton } from '@kit/ui/empty-state';

import { DeckCard } from './deck-card';
import { CreateDeckDialog } from './create-deck-dialog';
import { DeckWithStats, DeckFilters } from '../schemas/deck.schema';
import { TextExtractionResult } from '@kit/flashcards/components';

interface DecksGridProps {
  decks: DeckWithStats[];
  isLoading?: boolean;
  onCreateDeck: (data: any) => Promise<void>;
  onCreateWithContent?: (deck: any) => void;
  onEditDeck?: (deck: DeckWithStats) => void;
  onDuplicateDeck?: (deck: DeckWithStats) => void;
  onDeleteDeck?: (deck: DeckWithStats) => void;
  filters?: Partial<DeckFilters>;
  onFiltersChange?: (filters: Partial<DeckFilters>) => void;
  showCreateButton?: boolean;
  extractTextAction: (formData: globalThis.FormData) => Promise<TextExtractionResult>;
}

export function DecksGrid({
  decks,
  isLoading,
  onCreateDeck,
  onCreateWithContent,
  onEditDeck,
  onDuplicateDeck,
  onDeleteDeck,
  filters,
  onFiltersChange,
  showCreateButton = true,
  extractTextAction,
}: DecksGridProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const handleSearchChange = (search: string) => {
    onFiltersChange?.({
      ...filters,
      search,
      offset: 0, // Reset to first page when searching
      sortBy: filters?.sortBy || 'updated_at',
      sortOrder: filters?.sortOrder || 'desc',
      limit: filters?.limit || 20,
    });
  };

  const handleSortChange = (sortBy: string) => {
    const [field, order] = sortBy.split('-');
    onFiltersChange?.({
      ...filters,
      sortBy: field as 'name' | 'created_at' | 'updated_at' | 'total_cards',
      sortOrder: order as 'asc' | 'desc',
      offset: 0,
      limit: filters?.limit || 20,
    });
  };

  const handleVisibilityChange = (visibility: string) => {
    onFiltersChange?.({
      ...filters,
      visibility: visibility === 'all' ? undefined : (visibility as 'private' | 'public' | 'shared'),
      offset: 0,
      sortBy: filters?.sortBy || 'updated_at',
      sortOrder: filters?.sortOrder || 'desc',
      limit: filters?.limit || 20,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const isEmpty = !decks || decks.length === 0;

  return (
    <div className="space-y-6">
      {/* Filters and Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search decks..."
              value={filters?.search || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Visibility Filter */}
          <Select 
            value={filters?.visibility || 'all'} 
            onValueChange={handleVisibilityChange}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Decks</SelectItem>
              <SelectItem value="private">Private</SelectItem>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="shared">Shared</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select 
            value={`${filters?.sortBy || 'updated_at'}-${filters?.sortOrder || 'desc'}`}
            onValueChange={handleSortChange}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated_at-desc">Recently Updated</SelectItem>
              <SelectItem value="created_at-desc">Recently Created</SelectItem>
              <SelectItem value="name-asc">Name A-Z</SelectItem>
              <SelectItem value="name-desc">Name Z-A</SelectItem>
              <SelectItem value="total_cards-desc">Most Cards</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {showCreateButton && (
            <CreateDeckDialog 
              onSubmit={onCreateDeck}
              extractTextAction={extractTextAction}
            />
          )}
        </div>
      </div>

      {/* Decks Grid/List */}
      {isEmpty ? (
        <EmptyState>
          <EmptyStateHeading>No flashcard decks yet</EmptyStateHeading>
          <EmptyStateText>Create your first deck to start learning with spaced repetition.</EmptyStateText>
          {showCreateButton && (
            <CreateDeckDialog 
              onSubmit={onCreateDeck}
              extractTextAction={extractTextAction}
              trigger={
                <EmptyStateButton size="lg">
                  Create Your First Deck
                </EmptyStateButton>
              }
            />
          )}
        </EmptyState>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
        }>
          {decks.map((deck) => (
            <DeckCard
              key={deck.id}
              deck={deck}
              onEdit={onEditDeck}
              onDuplicate={onDuplicateDeck}
              onDelete={onDeleteDeck}
              className={viewMode === 'list' ? 'max-w-none' : undefined}
            />
          ))}
        </div>
      )}

      {/* Show deck count */}
      {!isEmpty && (
        <div className="text-center text-sm text-muted-foreground">
          Showing {decks.length} deck{decks.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}