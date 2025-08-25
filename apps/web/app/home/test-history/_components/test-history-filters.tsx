'use client';

import { useState } from 'react';
import { Card, CardContent } from '@kit/ui/card';
import { Button } from '@kit/ui/button';
import { Badge } from '@kit/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';
import { Filter, X } from 'lucide-react';
import type { TestHistoryEntry } from './test-history-page-container';

interface TestHistoryFiltersProps {
  selectedDeck: string | null;
  onDeckChange: (deckId: string | null) => void;
  testHistory: TestHistoryEntry[];
}

export function TestHistoryFilters({
  selectedDeck,
  onDeckChange,
  testHistory,
}: TestHistoryFiltersProps) {
  // Extract unique decks from test history
  const uniqueDecks = testHistory.reduce((acc, test) => {
    if (!acc.find(deck => deck.id === test.deck_id)) {
      acc.push({
        id: test.deck_id,
        name: test.deck_name,
      });
    }
    return acc;
  }, [] as Array<{ id: string; name: string }>);

  const selectedDeckName = uniqueDecks.find(deck => deck.id === selectedDeck)?.name;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters:</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center w-full sm:w-auto">
            {/* Deck Filter */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Deck:</span>
              <Select
                value={selectedDeck || 'all'}
                onValueChange={(value) => onDeckChange(value === 'all' ? null : value)}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Select deck" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Decks</SelectItem>
                  {uniqueDecks.map((deck) => (
                    <SelectItem key={deck.id} value={deck.id}>
                      {deck.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Active Filters Display */}
            {selectedDeck && (
              <div className="flex flex-wrap gap-1">
                <Badge 
                  variant="secondary" 
                  className="flex items-center gap-1"
                >
                  <span className="text-xs">Deck: {selectedDeckName}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 w-4 h-4 hover:bg-transparent"
                    onClick={() => onDeckChange(null)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              </div>
            )}

            {/* Clear All Filters */}
            {selectedDeck && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDeckChange(null)}
                className="whitespace-nowrap"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Filter Summary */}
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            {selectedDeck
              ? `Showing tests from "${selectedDeckName}" deck`
              : `Showing all tests from ${uniqueDecks.length} deck${uniqueDecks.length !== 1 ? 's' : ''}`
            }
            {testHistory.length > 0 && (
              <span> • {testHistory.length} test session{testHistory.length !== 1 ? 's' : ''} found</span>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}