'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Brain, BookOpen, TestTube, Clock } from 'lucide-react';

// UI Components
import { Button } from '@kit/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';

// Feature Components
import { useDecks } from '@kit/decks/hooks';
import { useSubscription } from '@kit/subscription/hooks';

interface StudyPageProps {
  userId: string;
}

export function StudyPage({ userId }: StudyPageProps) {
  const router = useRouter();
  const { data: decksData, isLoading } = useDecks(userId, {
    sortBy: 'updated_at',
    sortOrder: 'desc',
    limit: 50,
    offset: 0,
  });

  // Get subscription info for test mode access
  const { data: subscriptionInfo } = useSubscription(userId);

  const decks = decksData?.decks || [];
  const decksWithCards = decks.filter(deck => deck.total_cards > 0);

  const handleStudyDeck = (deckId: string) => {
    router.push(`/home/decks/${deckId}/study`);
  };

  const handleTestDeck = (deckId: string) => {
    router.push(`/home/decks/${deckId}/test`);
  };

  if (isLoading) {
    return (
      <div className="space-y-8 py-8">
        <div className="text-center">
          <div className="h-8 bg-gradient-to-br from-emerald-50 to-emerald-100 animate-pulse rounded mx-auto w-48 mb-2 border border-emerald-100" />
          <div className="h-4 bg-gradient-to-br from-emerald-50 to-emerald-100 animate-pulse rounded mx-auto w-64 border border-emerald-100" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 bg-gradient-to-br from-emerald-50 to-emerald-100 animate-pulse rounded-lg border border-emerald-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Brain className="h-8 w-8 text-emerald-600" />
          <h1 className="text-3xl font-bold text-emerald-900">Study Your Decks</h1>
        </div>
        <p className="text-emerald-700">
          Choose a deck to start learning with study mode or test your knowledge with AI-powered tests
        </p>
      </div>

      {/* Learning Modes Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="border-emerald-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-900">
              <BookOpen className="h-5 w-5" />
              Study Mode
            </CardTitle>
            <CardDescription>
              Flip through your flashcards at your own pace. Perfect for review and learning new material.
            </CardDescription>
          </CardHeader>
        </Card>
        
        <Card className="border-emerald-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-900">
              <TestTube className="h-5 w-5" />
              Test Mode
              {subscriptionInfo?.tier === 'free' && (
                <Badge variant="outline" className="text-xs">Pro Feature</Badge>
              )}
            </CardTitle>
            <CardDescription>
              AI-powered testing with grading and feedback. Test your understanding with intelligent questions.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Study Decks */}
      {decksWithCards.length === 0 ? (
        <div className="text-center py-12">
          <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No decks ready to study</h2>
          <p className="text-muted-foreground mb-6">
            Create some decks and add flashcards to start studying.
          </p>
          <Button onClick={() => router.push('/home/decks')}>
            Browse My Decks
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {decksWithCards.map((deck) => (
            <Card key={deck.id} className="border-emerald-100/50 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg font-semibold line-clamp-2">
                      {deck.name}
                    </CardTitle>
                    {deck.description && (
                      <CardDescription className="line-clamp-2 mt-1">
                        {deck.description}
                      </CardDescription>
                    )}
                  </div>
                  <Badge variant={deck.visibility === 'public' ? 'default' : 'secondary'}>
                    {deck.visibility}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Brain className="h-4 w-4" />
                    <span>{deck.total_cards} cards</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>
                      {deck.updated_at 
                        ? new Date(deck.updated_at).toLocaleDateString()
                        : 'Recently'
                      }
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button 
                    onClick={() => handleStudyDeck(deck.id)} 
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    size="sm"
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Study Cards
                  </Button>
                  
                  <Button 
                    onClick={() => handleTestDeck(deck.id)} 
                    variant="secondary"
                    className="w-full"
                    size="sm"
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    Test Knowledge
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Study Tips */}
      <div className="bg-muted/50 rounded-lg p-6">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Brain className="h-4 w-4" />
          Learning Tips
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium mb-1">Study Mode</h4>
            <ul className="text-muted-foreground space-y-1">
              <li>• Use spacebar to flip cards</li>
              <li>• Review regularly for best retention</li>
              <li>• Focus on understanding concepts</li>
              <li>• Take breaks between sessions</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-1">Test Mode (Pro)</h4>
            <ul className="text-muted-foreground space-y-1">
              <li>• AI grades your responses with feedback</li>
              <li>• Choose between flashcard or critical thinking questions</li>
              <li>• Track your mastery and improvement areas</li>
              <li>• Get personalized recommendations</li>
            </ul>
          </div>
        </div>
        {subscriptionInfo?.tier === 'free' && (
          <div className="mt-4 pt-4 border-t border-muted-foreground/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Unlock AI-Powered Testing</p>
                <p className="text-xs text-muted-foreground">
                  Get intelligent grading, feedback, and performance analytics
                </p>
              </div>
              <Button size="sm" onClick={() => router.push('/pricing')}>
                <TestTube className="h-3 w-3 mr-1" />
                Upgrade to Pro
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}