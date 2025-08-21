'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  RotateCcw, 
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Brain,
  BookOpen,
  TestTube
} from 'lucide-react';

// UI Components
import { Button } from '@kit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Progress } from '@kit/ui/progress';
import { Badge } from '@kit/ui/badge';

// Feature Components
import { useDeck } from '@kit/decks/hooks';
import { useFlashcards } from '@kit/flashcards/hooks';
import { useUser } from '@kit/supabase/hooks/use-user';
import { useSubscription } from '@kit/subscription/hooks';
import { MathContent } from '@kit/ui/math-content';

interface StudySessionPageProps {
  deckId: string;
}

export function StudySessionPage({ deckId }: StudySessionPageProps) {
  const router = useRouter();
  const user = useUser();
  const { data: deck } = useDeck(deckId);
  const { data: flashcardsData } = useFlashcards(deckId, {
    sortBy: 'position',
    sortOrder: 'asc',
    limit: 1000,
    offset: 0,
  });
  const { data: subscriptionInfo } = useSubscription(user?.data?.id || '');

  // Study session state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studiedCards, setStudiedCards] = useState<Set<string>>(new Set());
  const [startTime] = useState(Date.now());

  const flashcards = flashcardsData?.flashcards || [];

  // Memoized current card
  const currentCard = useMemo(() => {
    return flashcards[currentIndex] || null;
  }, [flashcards, currentIndex]);

  // Progress calculation
  const progress = flashcards.length > 0 ? ((currentIndex + 1) / flashcards.length) * 100 : 0;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Don't handle keyboard shortcuts if user is typing in an input/textarea
      const target = event.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || 
                       target.tagName === 'TEXTAREA' || 
                       target.contentEditable === 'true' ||
                       target.isContentEditable;
      
      if (isTyping) {
        return; // Let the user type normally
      }

      if (event.code === 'Space') {
        event.preventDefault();
        handleFlipCard();
      } else if (event.code === 'ArrowLeft' && currentIndex > 0) {
        handlePreviousCard();
      } else if (event.code === 'ArrowRight' && currentIndex < flashcards.length - 1) {
        handleNextCard();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, flashcards.length, isFlipped]);

  const handleFlipCard = () => {
    setIsFlipped(prev => !prev);
    if (!isFlipped && currentCard) {
      setStudiedCards(prev => new Set(prev).add(currentCard.id));
    }
  };

  const handleNextCard = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
    }
  };

  const handlePreviousCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsFlipped(false);
    }
  };

  const handleEndSession = () => {
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    const cardsStudied = studiedCards.size;
    
    toast.success(`Study session complete! You studied ${cardsStudied} cards in ${Math.round(timeSpent / 60)} minutes.`);
    router.push(`/home/decks/${deckId}`);
  };

  const handleTestMode = () => {
    router.push(`/home/decks/${deckId}/test`);
  };

  if (!deck || flashcards.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No cards to study</h2>
          <p className="text-muted-foreground mb-6">
            This deck doesn't have any flashcards yet.
          </p>
          <div className="space-x-2">
            <Button asChild variant="outline">
              <Link href={`/home/decks/${deckId}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Deck
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/home/decks/${deckId}/flashcards`}>
                Add Flashcards
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="sm">
            <Link href={`/home/decks/${deckId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Deck
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{deck.name}</h1>
            <p className="text-sm text-muted-foreground">
              Card {currentIndex + 1} of {flashcards.length}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {studiedCards.size} studied
          </Badge>
          <Button onClick={handleEndSession} variant="outline" size="sm">
            End Session
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Progress: {Math.round(progress)}%</span>
          <span>{studiedCards.size} / {flashcards.length} cards studied</span>
        </div>
      </div>

      {/* Flashcard Display */}
      <div className="mb-6">
        <Card 
          className="min-h-[300px] sm:min-h-[400px] cursor-pointer transition-all duration-300 hover:shadow-lg border-primary/20"
          onClick={handleFlipCard}
        >
          <CardContent className="p-4 sm:p-6 lg:p-8 flex flex-col justify-center items-center text-center h-full min-h-[300px] sm:min-h-[400px]">
            {!isFlipped ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <Badge variant="outline">Question</Badge>
                </div>
                <div className="text-lg sm:text-xl font-medium leading-relaxed">
                  <MathContent>{currentCard?.front_content || ''}</MathContent>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-6">
                  Click or press spacebar to reveal answer
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <Badge variant="secondary" className="bg-primary/20 text-primary-foreground">
                    Answer
                  </Badge>
                </div>
                <div className="text-lg sm:text-xl leading-relaxed">
                  <MathContent>{currentCard?.back_content || ''}</MathContent>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-6">
                  Use the navigation buttons or arrow keys to continue
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between mb-6">
        <Button
          onClick={handlePreviousCard}
          disabled={currentIndex === 0}
          variant="outline"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleFlipCard}
            variant={isFlipped ? "secondary" : "default"}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            {isFlipped ? 'Show Question' : 'Show Answer'}
          </Button>
        </div>

        <Button
          onClick={handleNextCard}
          disabled={currentIndex === flashcards.length - 1}
          variant="outline"
        >
          Next
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-primary/20 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Continue Studying
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Keep reviewing cards at your own pace
            </p>
            <div className="text-xs text-muted-foreground">
              <p>• Spacebar: Flip card</p>
              <p>• Left/Right arrows: Navigate</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TestTube className="h-5 w-5 text-primary" />
              Test Your Knowledge
              {subscriptionInfo?.tier === 'free' && (
                <Badge variant="outline" className="text-xs">Pro</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Switch to AI-powered testing mode
            </p>
            <Button 
              onClick={handleTestMode}
              disabled={subscriptionInfo?.tier === 'free'}
              size="sm"
              className="w-full"
              variant={subscriptionInfo?.tier === 'free' ? 'outline' : 'default'}
            >
              <TestTube className="h-4 w-4 mr-2" />
              {subscriptionInfo?.tier === 'free' ? 'Upgrade to Pro' : 'Start Test'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="mt-6 text-center">
        <p className="text-xs text-muted-foreground">
          <strong>Keyboard shortcuts:</strong> Spacebar (flip) • ← → (navigate) • Escape (end session)
        </p>
      </div>
    </div>
  );
}