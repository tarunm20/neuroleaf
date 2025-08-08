'use client';

import React from 'react';
import { Card } from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import { RichTextEditor } from './rich-text-editor';
import { cn } from '@kit/ui/utils';
import { RotateCcw, Tag, Calendar, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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
}

interface FlashcardPreviewProps {
  flashcard: Flashcard;
  showFlipped?: boolean;
  onFlip?: () => void;
  interactive?: boolean;
  showMetadata?: boolean;
  className?: string;
}

const difficultyColors = {
  easy: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  hard: 'bg-red-100 text-red-800 border-red-200',
};

const difficultyIndicators = {
  easy: '●',
  medium: '●●',
  hard: '●●●',
};

export function FlashcardPreview({
  flashcard,
  showFlipped = false,
  onFlip,
  interactive = false,
  showMetadata = true,
  className,
}: FlashcardPreviewProps) {
  const [isFlipped, setIsFlipped] = React.useState(showFlipped);

  const handleFlip = () => {
    if (interactive) {
      setIsFlipped(!isFlipped);
      onFlip?.();
    }
  };

  const currentContent = isFlipped ? flashcard.back_content : flashcard.front_content;
  const currentSide = isFlipped ? 'Back' : 'Front';

  return (
    <div className={cn('space-y-4', className)}>
      {/* Flashcard Content */}
      <Card 
        className={cn(
          'relative min-h-[200px] transition-all duration-200',
          interactive && 'cursor-pointer hover:shadow-md',
          isFlipped && 'bg-muted/20'
        )}
        onClick={handleFlip}
      >
        <div className="p-6">
          {/* Header with side indicator and flip button */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                {currentSide}
              </span>
              {isFlipped && (
                <Badge variant="outline" className="text-xs">
                  Answer
                </Badge>
              )}
            </div>
            
            {interactive && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFlip();
                }}
                className="hover:bg-muted"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Content */}
          <div className="min-h-[120px]">
            <RichTextEditor
              content={currentContent}
              editable={false}
              className="border-none"
            />
          </div>

          {/* Interactive hint */}
          {interactive && !isFlipped && (
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Click to reveal answer
              </p>
            </div>
          )}
        </div>

        {/* Difficulty indicator */}
        <div className="absolute top-3 right-3">
          <span 
            className={cn(
              'text-xs px-2 py-1 rounded-full font-medium',
              difficultyColors[flashcard.difficulty]
            )}
          >
            {difficultyIndicators[flashcard.difficulty]}
          </span>
        </div>
      </Card>

      {/* Metadata */}
      {showMetadata && (
        <div className="space-y-3">
          {/* Tags */}
          {flashcard.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-wrap gap-1">
                {flashcard.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Difficulty */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Difficulty:</span>
            <Badge 
              variant="outline" 
              className={cn(
                'text-xs capitalize',
                flashcard.difficulty === 'easy' && 'border-green-300 text-green-700',
                flashcard.difficulty === 'medium' && 'border-yellow-300 text-yellow-700',
                flashcard.difficulty === 'hard' && 'border-red-300 text-red-700'
              )}
            >
              {flashcard.difficulty}
            </Badge>
          </div>

          {/* Timestamps */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Created {formatDistanceToNow(new Date(flashcard.created_at), { addSuffix: true })}</span>
            </div>
            {flashcard.updated_at !== flashcard.created_at && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Updated {formatDistanceToNow(new Date(flashcard.updated_at), { addSuffix: true })}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface FlashcardGridProps {
  flashcards: Flashcard[];
  onFlashcardClick?: (flashcard: Flashcard) => void;
  className?: string;
}

export function FlashcardGrid({
  flashcards,
  onFlashcardClick,
  className,
}: FlashcardGridProps) {
  return (
    <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-3', className)}>
      {flashcards.map((flashcard) => (
        <div key={flashcard.id} onClick={() => onFlashcardClick?.(flashcard)}>
          <FlashcardPreview
            flashcard={flashcard}
            interactive={!!onFlashcardClick}
            showMetadata={false}
            className="h-full"
          />
        </div>
      ))}
    </div>
  );
}