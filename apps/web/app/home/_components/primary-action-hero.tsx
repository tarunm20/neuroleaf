'use client';

import { useState } from 'react';
import { Brain, Sparkles, Library, Plus } from 'lucide-react';
import { Card, CardContent } from '@kit/ui/card';
import { Button } from '@kit/ui/button';
import { Badge } from '@kit/ui/badge';
import { CreateDeckDialog } from '@kit/decks/components';
import { CreateDeckData } from '@kit/decks/schemas';
import { TextExtractionResult } from '@kit/flashcards/components';

interface PrimaryActionHeroProps {
  userName?: string;
  totalDecks: number;
  subscriptionInfo?: {
    tier: 'free' | 'pro' | 'premium';
    canCreateDeck: boolean;
    deckLimit: number;
  };
  onCreateDeck: (data: CreateDeckData & { content?: string }) => Promise<{ id: string }>;
  onDeckCreated?: (deckId: string) => void;
  onCreateDeckClick?: () => boolean;
  extractTextAction: (formData: FormData) => Promise<TextExtractionResult>;
}

export function PrimaryActionHero({
  userName,
  totalDecks,
  subscriptionInfo,
  onCreateDeck,
  onDeckCreated,
  onCreateDeckClick,
  extractTextAction,
}: PrimaryActionHeroProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const handleCreateDeckClick = () => {
    if (onCreateDeckClick) {
      const canProceed = onCreateDeckClick();
      if (canProceed) {
        setShowCreateDialog(true);
      }
    } else {
      setShowCreateDialog(true);
    }
  };

  const getPrimaryActionText = () => {
    if (totalDecks === 0) {
      return "Create Your First Deck";
    }
    return "Create New Deck";
  };

  const getPrimaryActionIcon = () => {
    if (totalDecks === 0) {
      return Sparkles;
    }
    return Plus;
  };

  const getSecondaryActionText = () => {
    if (totalDecks === 0) {
      return "Browse Templates";
    }
    return `Browse My Decks (${totalDecks})`;
  };

  const PrimaryIcon = getPrimaryActionIcon();

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="relative overflow-hidden neuroleaf-card bg-gradient-to-r from-primary/5 via-primary/10 to-primary/15 border-primary/20">
        {/* Decorative background elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-full transform translate-x-16 -translate-y-16" />
        
        <CardContent className="relative p-6 sm:p-8">
          {/* Header with greeting and tier badge */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-10 w-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-lg">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-card-foreground">
                {getGreeting()}{userName ? `, ${userName}` : ''}!
              </h1>
              {subscriptionInfo?.tier && subscriptionInfo.tier !== 'free' && (
                <Badge variant="secondary" className="bg-primary/20 text-primary-foreground border-primary/30">
                  <Brain className="h-3 w-3 mr-1" />
                  {subscriptionInfo.tier === 'premium' ? 'Premium' : 'Pro'}
                </Badge>
              )}
            </div>

            {/* Dynamic subtitle based on deck count */}
            <p className="text-muted-foreground text-lg">
              {totalDecks === 0 
                ? "Ready to start your learning journey?"
                : "Continue building your knowledge base"
              }
            </p>
          </div>

          {/* Primary Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              onClick={handleCreateDeckClick}
              className="neuroleaf-button-primary shadow-lg hover:shadow-xl h-12 px-8"
            >
              <PrimaryIcon className="h-5 w-5 mr-2" />
              {getPrimaryActionText()}
            </Button>

            {totalDecks > 0 && (
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  const deckSection = document.getElementById('deck-management-section');
                  deckSection?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="border-primary/20 text-primary hover:bg-primary/5 hover:border-primary/30 h-12 px-8"
              >
                <Library className="h-5 w-5 mr-2" />
                {getSecondaryActionText()}
              </Button>
            )}
          </div>

          {/* Subscription info for free users */}
          {subscriptionInfo?.tier === 'free' && totalDecks === 0 && (
            <div className="mt-6 p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20">
              <div className="text-center">
                <p className="text-sm font-medium text-card-foreground mb-1">
                  Start with 3 free decks
                </p>
                <p className="text-xs text-muted-foreground">
                  Upgrade anytime for unlimited decks and AI-powered features
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Deck Dialog - Single source of truth */}
      <CreateDeckDialog 
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={onCreateDeck}
        onDeckCreated={onDeckCreated}
        extractTextAction={extractTextAction}
      />
    </div>
  );
}