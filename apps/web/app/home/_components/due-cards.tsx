'use client';

import { Clock, Play, BookOpen, Calendar } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kit/ui/card';
import { Button } from '@kit/ui/button';
import { Badge } from '@kit/ui/badge';
import { Progress } from '@kit/ui/progress';

interface DueCard {
  id: string;
  deckId: string;
  deckName: string;
  frontContent: string;
  difficulty: 'easy' | 'medium' | 'hard';
  nextReviewDate: Date;
  intervalDays: number;
}

interface DueDeck {
  id: string;
  name: string;
  cardsDue: number;
  totalCards: number;
  nextReview: Date;
  averageDifficulty: 'easy' | 'medium' | 'hard';
}

interface DueCardsProps {
  dueCards: DueCard[];
  dueDecks: DueDeck[];
  totalCardsDue: number;
}

export function DueCards({ dueCards, dueDecks, totalCardsDue }: DueCardsProps) {
  const getDifficultyColor = (difficulty: 'easy' | 'medium' | 'hard') => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'hard':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getDifficultyTextColor = (difficulty: 'easy' | 'medium' | 'hard') => {
    switch (difficulty) {
      case 'easy':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'hard':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (totalCardsDue === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Due for Review
          </CardTitle>
          <CardDescription>
            Cards scheduled for spaced repetition
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
            <p className="text-muted-foreground mb-4">
              No cards are due for review right now. Check back later or create new decks.
            </p>
            <div className="flex gap-2 justify-center">
              <Link href="/home/decks">
                <Button variant="outline">Browse My Decks</Button>
              </Link>
              <Link href="/home/browse">
                <Button>Explore Public Decks</Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Due for Review
          </CardTitle>
          <CardDescription>
            {totalCardsDue} cards across {dueDecks.length} decks ready for review
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Link href="/home/study">
                <Button size="lg" className="w-full">
                  <Play className="h-4 w-4 mr-2" />
                  Start Study Session
                </Button>
              </Link>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{totalCardsDue}</div>
              <div className="text-sm text-muted-foreground">cards due</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Due Decks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Decks with Due Cards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dueDecks.map((deck) => {
              const progress = (deck.cardsDue / deck.totalCards) * 100;
              const isOverdue = deck.nextReview < new Date();

              return (
                <div
                  key={deck.id}
                  className="flex items-center justify-between p-4 border border-border/50 rounded-lg hover:border-border transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{deck.name}</h4>
                      <Badge
                        variant="outline"
                        className={`text-xs ${getDifficultyTextColor(deck.averageDifficulty)}`}
                      >
                        {deck.averageDifficulty}
                      </Badge>
                      {isOverdue && (
                        <Badge variant="destructive" className="text-xs">
                          Overdue
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 mb-2">
                      <span className="text-sm">
                        <span className="font-semibold text-primary">{deck.cardsDue}</span>
                        <span className="text-muted-foreground"> of {deck.totalCards} due</span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Next: {formatDistanceToNow(deck.nextReview, { addSuffix: true })}
                      </span>
                    </div>

                    <Progress value={progress} className="h-2" />
                  </div>

                  <div className="ml-4">
                    <Link href={`/home/study/${deck.id}`}>
                      <Button size="sm">
                        <Play className="h-4 w-4 mr-2" />
                        Study
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Preview of Due Cards */}
      {dueCards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Next Cards to Review</CardTitle>
            <CardDescription>
              Preview of upcoming review cards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dueCards.slice(0, 5).map((card) => (
                <div
                  key={card.id}
                  className="flex items-center justify-between p-3 border border-border/50 rounded-md"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {card.deckName}
                      </Badge>
                      <div
                        className={`w-2 h-2 rounded-full ${getDifficultyColor(card.difficulty)}`}
                        title={`${card.difficulty} difficulty`}
                      />
                    </div>
                    <p className="text-sm font-medium truncate">
                      {card.frontContent}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Due {formatDistanceToNow(card.nextReviewDate, { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {dueCards.length > 5 && (
              <div className="mt-4 text-center">
                <Link href="/home/study">
                  <Button variant="ghost" size="sm">
                    View All {dueCards.length} Cards
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}