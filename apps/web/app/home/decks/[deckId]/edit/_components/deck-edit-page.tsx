'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Upload, Sparkles } from 'lucide-react';

// UI Components
import { Button } from '@kit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';

// Feature Components
import { useDeck } from '@kit/decks/hooks';
import { FlashcardManagementPage } from '../../flashcards/_components/flashcard-management-page';
import Link from 'next/link';
import { useUser } from '@kit/supabase/hooks/use-user';

interface DeckEditPageProps {
  deckId: string;
}

export function DeckEditPage({ deckId }: DeckEditPageProps) {
  const router = useRouter();
  const user = useUser();
  const { data: deck, isLoading, error } = useDeck(deckId);
  
  const handleBack = () => {
    router.push('/home/decks');
  };

  const handleStartStudying = () => {
    router.push(`/home/decks/${deckId}/study`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-6">
          <div className="h-8 bg-muted animate-pulse rounded" />
          <div className="h-32 bg-muted animate-pulse rounded" />
          <div className="h-96 bg-muted animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (error || !deck) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-4">Deck not found</h2>
          <p className="text-muted-foreground mb-6">
            The deck you're looking for doesn't exist or you don't have permission to edit it.
          </p>
          <Button onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Decks
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Decks
              </Button>
              <div className="h-6 w-px bg-border" />
              <div>
                <h1 className="text-2xl font-bold">{deck.name}</h1>
                {deck.description && (
                  <p className="text-muted-foreground">{deck.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={deck.visibility === 'public' ? 'default' : 'secondary'}>
                {deck.visibility}
              </Badge>
            </div>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href={`/home/decks/${deckId}/ai-convert`}>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Upload className="h-4 w-4 text-blue-500" />
                    Add Content
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Upload files or paste text to generate new flashcards with AI
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => {}}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Plus className="h-4 w-4 text-green-500" />
                  Create Card
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Manually create a new flashcard with custom front and back content
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleStartStudying}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  Start Studying
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Begin a study session with spaced repetition and progress tracking
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Flashcard Management */}
          <div className="bg-background rounded-lg border">
            <FlashcardManagementPage deckId={deckId} />
          </div>
        </div>
    </div>
  );
}