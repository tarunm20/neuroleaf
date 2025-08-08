'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { 
  BookOpen, 
  Calendar, 
  MoreHorizontal, 
  Eye, 
  Users, 
  Lock,
  Play,
  Edit,
  Copy,
  Trash2,
  Crown
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kit/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@kit/ui/dropdown-menu';
import { Button } from '@kit/ui/button';
import { Badge } from '@kit/ui/badge';
import { cn } from '@kit/ui/utils';

import { DeckWithStats } from '../schemas/deck.schema';

interface DeckCardProps {
  deck: DeckWithStats;
  onEdit?: (deck: DeckWithStats) => void;
  onDuplicate?: (deck: DeckWithStats) => void;
  onDelete?: (deck: DeckWithStats) => void;
  showActions?: boolean;
  className?: string;
  isLocked?: boolean;
}

const visibilityConfig = {
  private: { icon: Lock, label: 'Private', color: 'bg-gray-500' },
  public: { icon: Eye, label: 'Public', color: 'bg-emerald-500' },
  shared: { icon: Users, label: 'Shared', color: 'bg-blue-500' },
} as const;

export function DeckCard({ 
  deck, 
  onEdit, 
  onDuplicate, 
  onDelete,
  showActions = true,
  className,
  isLocked = false
}: DeckCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const visibilityInfo = visibilityConfig[deck.visibility];
  const VisibilityIcon = visibilityInfo.icon;

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit?.(deck);
    setIsMenuOpen(false);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDuplicate?.(deck);
    setIsMenuOpen(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete?.(deck);
    setIsMenuOpen(false);
  };


  return (
    <Card className={cn(
      'group hover:shadow-lg transition-all duration-200 neuroleaf-card',
      isLocked 
        ? 'cursor-not-allowed opacity-60 border-muted-foreground/20 bg-gradient-to-br from-muted/10 via-muted/20 to-muted/30'
        : 'cursor-pointer border-primary/20 hover:border-primary/30 bg-gradient-to-br from-card via-primary/5 to-primary/10',
      className
    )}>
      {isLocked && (
        <div className="absolute inset-0 bg-background/40 backdrop-blur-[1px] rounded-lg z-10 flex items-center justify-center">
          <div className="text-center space-y-2">
            <Crown className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">
              Upgrade to Access
            </p>
          </div>
        </div>
      )}
      <Link href={isLocked ? '#' : `/home/decks/${deck.id}`} className={isLocked ? 'pointer-events-none' : ''}>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0 space-y-2">
              <CardTitle className="text-lg font-semibold text-card-foreground line-clamp-2 leading-tight">
                {deck.name}
              </CardTitle>
              {deck.description && (
                <CardDescription className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                  {deck.description}
                </CardDescription>
              )}
            </div>

            <div className="flex items-start gap-2 flex-shrink-0">
              <div className="flex items-center gap-1">
                <div className={cn('w-2 h-2 rounded-full', visibilityInfo.color)} />
                <VisibilityIcon className="h-3 w-3 text-muted-foreground" />
              </div>

              {showActions && (
                <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {onEdit && !isLocked && (
                      <DropdownMenuItem onClick={handleEdit}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Deck
                      </DropdownMenuItem>
                    )}
                    {onDuplicate && !isLocked && (
                      <DropdownMenuItem onClick={handleDuplicate}>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                    )}
                    {isLocked && (
                      <DropdownMenuItem disabled>
                        <Crown className="mr-2 h-4 w-4" />
                        Upgrade to Access
                      </DropdownMenuItem>
                    )}
                    {(onEdit || onDuplicate) && !isLocked && <DropdownMenuSeparator />}
                    {onDelete && (
                      <DropdownMenuItem 
                        onClick={handleDelete}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {deck.tags && deck.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {deck.tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary-foreground border-primary/30"
                >
                  {tag}
                </Badge>
              ))}
              {deck.tags.length > 3 && (
                <Badge
                  variant="outline"
                  className="text-xs px-2 py-1 rounded-full"
                >
                  +{deck.tags.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent className="pt-0">
          {/* Key Stats */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-primary">
                <BookOpen className="h-4 w-4" />
                <span className="font-medium">{deck.total_cards} cards</span>
              </div>
              {deck.accuracy_rate !== null && (
                <div className="flex items-center gap-2 text-sm text-primary">
                  <span className="font-medium">{Math.round(deck.accuracy_rate)}% accuracy</span>
                </div>
              )}
            </div>
          </div>

          {/* Creation Date */}
          <div className="mb-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Created {format(new Date(deck.created_at), 'MMM d, yyyy')}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              className="flex-1 neuroleaf-button-primary" 
              size="sm"
              disabled={isLocked}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!isLocked) {
                  // Navigate to study mode
                  window.location.href = `/home/decks/${deck.id}/study`;
                }
              }}
            >
              {isLocked ? <Crown className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
              {isLocked ? 'Upgrade' : 'Study'}
            </Button>
            <Button 
              variant="outline"
              size="sm"
              disabled={isLocked}
              className="border-primary/20 text-primary hover:bg-primary/5"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!isLocked) {
                  // Navigate to test mode
                  window.location.href = `/home/decks/${deck.id}/test`;
                }
              }}
            >
              Test
            </Button>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}