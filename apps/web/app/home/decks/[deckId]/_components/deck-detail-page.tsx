'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { 
  BookOpen, 
  Play, 
  Brain, 
  Upload, 
  Calendar,
  TrendingUp,
  Users,
  Eye,
  Lock,
  ArrowLeft,
  BarChart3,
  Trash2,
  MoreHorizontal
} from 'lucide-react';

import { Button } from '@kit/ui/button';
import { Card, CardContent, CardHeader } from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@kit/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@kit/ui/alert-dialog';

import { useDeck } from '@kit/decks/hooks';
import { useFlashcards, useDeleteFlashcard } from '@kit/flashcards/hooks';
import { useUser } from '@kit/supabase/hooks/use-user';
import { useCanAccessDeck } from '@kit/subscription/hooks';
import { CreateFlashcardButton, EditFlashcardButton } from '@kit/flashcards/components';
import { toast } from 'sonner';

interface DeckDetailPageProps {
  deckId: string;
}

const visibilityConfig = {
  private: { icon: Lock, label: 'Private', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  public: { icon: Eye, label: 'Public', color: 'text-green-600', bgColor: 'bg-green-100' },
  shared: { icon: Users, label: 'Shared', color: 'text-blue-600', bgColor: 'bg-blue-100' },
} as const;

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

export function DeckDetailPage({ deckId }: DeckDetailPageProps) {
  const _router = useRouter();
  const user = useUser();
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [flashcardToDelete, setFlashcardToDelete] = useState<string | null>(null);
  
  const { data: deck, isLoading: deckLoading } = useDeck(deckId);
  const { data: flashcardsData, isLoading: flashcardsLoading } = useFlashcards(deckId, {
    difficulty: difficultyFilter !== 'all' ? (difficultyFilter as 'easy' | 'medium' | 'hard') : undefined,
  });
  const deleteFlashcard = useDeleteFlashcard();
  
  // Check if user can access this deck
  const { data: accessCheck, isLoading: accessLoading } = useCanAccessDeck(user?.data?.id || '', deckId);

  const flashcards = flashcardsData?.flashcards || [];
  
  // Calculate statistics
  const totalCards = flashcards.length;
  const difficultyStats = flashcards.reduce((acc: Record<string, number>, card: Flashcard) => {
    acc[card.difficulty] = (acc[card.difficulty] || 0) + 1;
    return acc;
  }, {});
  
  const aiGeneratedCount = flashcards.filter((card: Flashcard) => card.ai_generated).length;

  // Filter flashcards based on current filters
  const filteredFlashcards = flashcards.filter((card: Flashcard) => {
    const matchesDifficulty = difficultyFilter === 'all' || card.difficulty === difficultyFilter;
    const matchesTag = tagFilter === 'all' || card.tags.includes(tagFilter);
    return matchesDifficulty && matchesTag;
  });

  // Get all unique tags
  const allTags = Array.from(new Set(flashcards.flatMap((card: Flashcard) => card.tags))).sort();

  const handleDeleteFlashcard = (flashcardId: string) => {
    setFlashcardToDelete(flashcardId);
  };

  const confirmDeleteFlashcard = async () => {
    if (!flashcardToDelete) return;
    
    try {
      await deleteFlashcard.mutateAsync(flashcardToDelete);
      toast.success('Flashcard deleted successfully');
    } catch {
      toast.error('Failed to delete flashcard');
    } finally {
      setFlashcardToDelete(null);
    }
  };

  if (deckLoading || flashcardsLoading || accessLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded w-1/3" />
        <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Deck not found</h2>
        <p className="text-muted-foreground mb-4">
          This deck might have been deleted or you don't have access to it.
        </p>
        <Button asChild>
          <Link href="/home/decks">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Decks
          </Link>
        </Button>
      </div>
    );
  }

  // Check deck access
  if (accessCheck && !accessCheck.canAccess) {
    return (
      <div className="text-center py-12">
        <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Deck Access Restricted</h2>
        <p className="text-muted-foreground mb-4">
          {accessCheck.reason || 'You need to upgrade your plan to access this deck.'}
        </p>
        <div className="flex gap-2 justify-center">
          <Button asChild>
            <Link href="/pricing">
              Upgrade Plan
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/home/decks">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Decks
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const visibilityInfo = visibilityConfig[deck.visibility];
  const VisibilityIcon = visibilityInfo.icon;

  return (
    <div className="space-y-8">
      {/* Header with basic info and primary actions */}
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <Button 
            variant="ghost" 
            size="sm" 
            asChild
            className="text-muted-foreground hover:text-foreground -ml-2"
          >
            <Link href="/home/decks">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Decks
            </Link>
          </Button>
          
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{deck.name}</h1>
            <Badge 
              variant="secondary" 
              className={`${visibilityInfo.bgColor} ${visibilityInfo.color} border-0`}
            >
              <VisibilityIcon className="h-3 w-3 mr-1" />
              {visibilityInfo.label}
            </Badge>
          </div>
          
          {deck.description && (
            <p className="text-muted-foreground text-lg">{deck.description}</p>
          )}
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Created {format(new Date(deck.created_at), 'MMM dd, yyyy')}
            </span>
            <span>{totalCards} cards</span>
            {aiGeneratedCount > 0 && (
              <span className="flex items-center gap-1">
                <Brain className="h-4 w-4" />
                {aiGeneratedCount} AI-generated
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {totalCards > 0 ? (
            <>
              <Button asChild variant="outline">
                <Link href={`/home/decks/${deckId}/test`}>
                  Test Knowledge
                </Link>
              </Button>
              <Button asChild>
                <Link href={`/home/decks/${deckId}/study`}>
                  <Play className="mr-2 h-4 w-4" />
                  Start Studying
                </Link>
              </Button>
            </>
          ) : (
            <div className="flex gap-2">
              <CreateFlashcardButton deckId={deckId} />
              <Button asChild variant="outline">
                <Link href={`/home/decks/${deckId}/upload`}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload & Generate
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Stats Overview - Single row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{totalCards}</p>
                <p className="text-sm text-muted-foreground">Total Cards</p>
              </div>
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">{difficultyStats.easy || 0}</p>
                <p className="text-sm text-muted-foreground">Easy Cards</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-yellow-600">{difficultyStats.medium || 0}</p>
                <p className="text-sm text-muted-foreground">Medium Cards</p>
              </div>
              <BarChart3 className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-600">{difficultyStats.hard || 0}</p>
                <p className="text-sm text-muted-foreground">Hard Cards</p>
              </div>
              <Brain className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Flashcards Section */}
      {totalCards > 0 ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Flashcards</h2>
            <div className="flex gap-2">
              <CreateFlashcardButton deckId={deckId} />
              <Button asChild variant="outline">
                <Link href={`/home/decks/${deckId}/upload`}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload More
                </Link>
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-4 flex-wrap">
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

          {/* Flashcards Grid */}
          {filteredFlashcards.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No flashcards match your filters</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search or filters
                </p>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setDifficultyFilter('all');
                    setTagFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
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
                        className="text-sm line-clamp-2"
                        dangerouslySetInnerHTML={{ __html: flashcard.front_content }}
                      />
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Back</p>
                      <div 
                        className="text-sm line-clamp-2"
                        dangerouslySetInnerHTML={{ __html: flashcard.back_content }}
                      />
                    </div>

                    {flashcard.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {flashcard.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {flashcard.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{flashcard.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

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
        </div>
      ) : (
        /* Empty State */
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No flashcards yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first flashcard to start learning with this deck.
            </p>
            <div className="flex gap-2 justify-center">
              <CreateFlashcardButton deckId={deckId} />
              <Button asChild variant="outline">
                <Link href={`/home/decks/${deckId}/upload`}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload & Generate
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Flashcard Confirmation Dialog */}
      <AlertDialog open={!!flashcardToDelete} onOpenChange={(open) => !open && setFlashcardToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Flashcard</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this flashcard? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteFlashcard}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete Flashcard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}