'use client';

import { Plus, Play, Sparkles, Upload, Globe, Brain } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@kit/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kit/ui/card';

interface QuickActionsProps {
  cardsDue: number;
  onCreateDeck: () => void;
  onGenerateAI: () => void;
  onImport: () => void;
}

export function QuickActions({ cardsDue, onCreateDeck, onGenerateAI, onImport }: QuickActionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Quick Actions
        </CardTitle>
        <CardDescription>
          Get started with your learning journey
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Continue Learning - Only show if cards are due */}
          {cardsDue > 0 && (
            <Link href="/home/study">
              <Button className="w-full h-auto p-4 flex flex-col items-center gap-2" size="lg">
                <Play className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-semibold">Continue Learning</div>
                  <div className="text-sm opacity-90">{cardsDue} cards due</div>
                </div>
              </Button>
            </Link>
          )}

          {/* Create New Deck */}
          <Button 
            variant="outline" 
            className="w-full h-auto p-4 flex flex-col items-center gap-2"
            onClick={onCreateDeck}
          >
            <Plus className="h-6 w-6" />
            <div className="text-center">
              <div className="font-semibold">Create Deck</div>
              <div className="text-sm text-muted-foreground">Start from scratch</div>
            </div>
          </Button>

          {/* Generate with AI */}
          <Button 
            variant="outline" 
            className="w-full h-auto p-4 flex flex-col items-center gap-2"
            onClick={onGenerateAI}
          >
            <Brain className="h-6 w-6 text-purple-500" />
            <div className="text-center">
              <div className="font-semibold">AI Generate</div>
              <div className="text-sm text-muted-foreground">Smart flashcards</div>
            </div>
          </Button>

          {/* Import Content */}
          <Button 
            variant="outline" 
            className="w-full h-auto p-4 flex flex-col items-center gap-2"
            onClick={onImport}
          >
            <Upload className="h-6 w-6 text-blue-500" />
            <div className="text-center">
              <div className="font-semibold">Import</div>
              <div className="text-sm text-muted-foreground">From file or text</div>
            </div>
          </Button>

          {/* Browse Public Decks */}
          <Link href="/home/browse">
            <Button 
              variant="outline" 
              className="w-full h-auto p-4 flex flex-col items-center gap-2"
            >
              <Globe className="h-6 w-6 text-green-500" />
              <div className="text-center">
                <div className="font-semibold">Browse Public</div>
                <div className="text-sm text-muted-foreground">Community decks</div>
              </div>
            </Button>
          </Link>

          {/* My Decks */}
          <Link href="/home/decks">
            <Button 
              variant="outline" 
              className="w-full h-auto p-4 flex flex-col items-center gap-2"
            >
              <Play className="h-6 w-6 text-orange-500" />
              <div className="text-center">
                <div className="font-semibold">My Decks</div>
                <div className="text-sm text-muted-foreground">Manage collection</div>
              </div>
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}