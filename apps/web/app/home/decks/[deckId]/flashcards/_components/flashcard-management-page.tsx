'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@kit/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';
import { 
  CreateFlashcardButton,
  EditFlashcardButton,
  FlashcardExportDialog
} from '@kit/flashcards/components';
import { useFlashcards, useDeleteFlashcard } from '@kit/flashcards/hooks';
import { useDeck } from '@kit/decks/hooks';
import { 
  Trash2,
  MoreHorizontal,
  BookOpen,
  Brain,
  ArrowLeft,
  Download
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@kit/ui/dropdown-menu';
import { toast } from 'sonner';
import { MathContent } from '@kit/ui/math-content';
import { AIBulkCreationDialog } from './ai-bulk-creation-dialog';

interface FlashcardManagementPageProps {
  deckId: string;
}

// Helper function to filter out section-related tags
const filterSectionTags = (tags: string[]): string[] => {
  const sectionPatterns = [
    /section/i,
    /chapter/i,
    /part\s*\d+/i,
    /unit\s*\d+/i,
    /^sec\s*\d+/i,
    /^ch\s*\d+/i,
  ];
  
  return tags.filter(tag => {
    return !sectionPatterns.some(pattern => pattern.test(tag));
  });
};

interface Flashcard {
  id: string;
  front_content: string;
  back_content: string;
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  deck_id: string;
  position: number;
  created_at: string;
  updated_at: string;
  ai_generated?: boolean;
}

export function FlashcardManagementPage({ deckId }: FlashcardManagementPageProps) {
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [isAIBulkDialogOpen, setIsAIBulkDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  // Fetch deck and flashcards
  const { data: deck, isLoading: deckLoading } = useDeck(deckId);
  const { data: flashcardsData, isLoading: flashcardsLoading, error } = useFlashcards(deckId, {
    difficulty: difficultyFilter !== 'all' ? (difficultyFilter as any) : undefined,
    limit: 1000, // Show all flashcards in the deck
    sortBy: 'position',
    sortOrder: 'asc',
  });
  
  const flashcards = flashcardsData?.flashcards || [];

  const deleteFlashcard = useDeleteFlashcard();

  // Filter flashcards based on current filters
  const filteredFlashcards = React.useMemo(() => {
    return flashcards.filter((card: Flashcard) => {
      const matchesDifficulty = difficultyFilter === 'all' || card.difficulty === difficultyFilter;
      const filteredCardTags = filterSectionTags(card.tags);
      const matchesTag = tagFilter === 'all' || filteredCardTags.includes(tagFilter);
      return matchesDifficulty && matchesTag;
    });
  }, [flashcards, difficultyFilter, tagFilter]);

  // Get all unique tags (excluding section-related tags)
  const allTags = React.useMemo(() => {
    const tags = new Set<string>();
    flashcards.forEach((card: Flashcard) => {
      const filteredTags = filterSectionTags(card.tags);
      filteredTags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [flashcards]);

  const handleDeleteFlashcard = async (flashcardId: string) => {
    if (confirm('Are you sure you want to delete this flashcard?')) {
      try {
        await deleteFlashcard.mutateAsync(flashcardId);
        toast.success('Flashcard deleted successfully');
      } catch {
        toast.error('Failed to delete flashcard');
      }
    }
  };

  const handleFlashcardClick = (flashcard: Flashcard) => {
    // For now, we'll show a simple alert. Later this could open a detailed view
    // TODO: Implement detailed flashcard view
  };

  const getDifficultyStats = () => {
    const stats = flashcards.reduce((acc: Record<string, number>, card: Flashcard) => {
      acc[card.difficulty] = (acc[card.difficulty] || 0) + 1;
      return acc;
    }, {});
    return stats;
  };

  const getAIGeneratedCount = () => {
    return flashcards.filter((card: Flashcard) => card.ai_generated).length;
  };

  if (deckLoading || flashcardsLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4" />
          <div className="h-4 bg-muted rounded w-2/3 mb-8" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load flashcards</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  const difficultyStats = getDifficultyStats();
  const aiGeneratedCount = getAIGeneratedCount();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            asChild
            className="text-muted-foreground hover:text-foreground"
          >
            <Link href={`/home/decks/${deckId}`}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Deck
            </Link>
          </Button>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="h-6 w-6" />
              {deck?.name || 'Flashcards'}
            </h1>
            <p className="text-muted-foreground">
              {flashcards.length} cards • {aiGeneratedCount} AI-generated
            </p>
          </div>
        
          <div className="flex gap-2">
            {flashcards.length > 0 && (
              <Button 
                variant="outline" 
                onClick={() => setIsExportDialogOpen(true)}
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={() => setIsAIBulkDialogOpen(true)}
            >
              <Brain className="mr-2 h-4 w-4" />
              AI Bulk Create
            </Button>
            <CreateFlashcardButton deckId={deckId} />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{flashcards.length}</div>
            <div className="text-sm text-muted-foreground">Total Cards</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{difficultyStats.easy || 0}</div>
            <div className="text-sm text-muted-foreground">Easy</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{difficultyStats.medium || 0}</div>
            <div className="text-sm text-muted-foreground">Medium</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{difficultyStats.hard || 0}</div>
            <div className="text-sm text-muted-foreground">Hard</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            {/* Difficulty Filter */}
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulty</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>

            {/* Tag Filter */}
            {allTags.length > 0 && (
              <Select value={tagFilter} onValueChange={setTagFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Tags" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tags</SelectItem>
                  {allTags.map(tag => (
                    <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Clear Filters */}
            {(difficultyFilter !== 'all' || tagFilter !== 'all') && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setDifficultyFilter('all');
                  setTagFilter('all');
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Flashcards Grid */}
      {filteredFlashcards.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="space-y-4">
              <Brain className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-medium">
                  {flashcards.length === 0 ? 'No flashcards yet' : 'No flashcards match your filters'}
                </h3>
                <p className="text-muted-foreground">
                  {flashcards.length === 0 
                    ? 'Create your first flashcard or import content to get started' 
                    : 'Try adjusting your search or filters'}
                </p>
              </div>
              {flashcards.length === 0 && (
                <div className="flex gap-2 justify-center">
                  <Button asChild variant="outline">
                    <Link href={`/home/decks/${deckId}/ai-convert`}>
                      <Brain className="mr-2 h-4 w-4" />
                      AI Text Converter
                    </Link>
                  </Button>
                  <CreateFlashcardButton deckId={deckId} variant="outline" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredFlashcards.map((flashcard: Flashcard) => (
            <Card key={flashcard.id} className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <Badge 
                    variant="outline" 
                    className={
                      flashcard.difficulty === 'easy' ? 'border-green-300 text-green-700' :
                      flashcard.difficulty === 'medium' ? 'border-yellow-300 text-yellow-700' :
                      'border-red-300 text-red-700'
                    }
                  >
                    {flashcard.difficulty}
                  </Badge>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <EditFlashcardButton 
                        flashcard={flashcard}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                      />
                      <DropdownMenuItem 
                        onClick={() => handleDeleteFlashcard(flashcard.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Front</p>
                  <div 
                    className="text-sm line-clamp-2 cursor-pointer hover:text-primary"
                    onClick={() => handleFlashcardClick(flashcard)}
                  >
                    <MathContent>{flashcard.front_content}</MathContent>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Back</p>
                  <div 
                    className="text-sm line-clamp-2 cursor-pointer hover:text-primary"
                    onClick={() => handleFlashcardClick(flashcard)}
                  >
                    <MathContent>{flashcard.back_content}</MathContent>
                  </div>
                </div>

                {(() => {
                  const displayTags = filterSectionTags(flashcard.tags);
                  return displayTags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {displayTags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {displayTags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{displayTags.length - 3}
                        </Badge>
                      )}
                    </div>
                  );
                })()}

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                  <span>
                    {flashcard.ai_generated && '🤖 '}{new Date(flashcard.created_at).toLocaleDateString()}
                  </span>
                  <span>#{flashcard.position}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* AI Bulk Creation Dialog */}
      <AIBulkCreationDialog
        deckId={deckId}
        open={isAIBulkDialogOpen}
        onOpenChange={setIsAIBulkDialogOpen}
      />

      {/* Export Dialog */}
      {deck && (
        <FlashcardExportDialog
          open={isExportDialogOpen}
          onOpenChange={setIsExportDialogOpen}
          deck={deck}
          flashcards={flashcards}
        />
      )}
    </div>
  );
}