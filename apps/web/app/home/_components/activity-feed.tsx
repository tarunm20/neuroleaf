'use client';

import { formatDistanceToNow } from 'date-fns';
import { BookOpen, Trophy, Plus, Target, Clock } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';

interface ActivityItem {
  id: string;
  type: 'study_session' | 'deck_created' | 'achievement' | 'milestone';
  title: string;
  description: string;
  timestamp: Date;
  metadata?: {
    deckName?: string;
    cardsStudied?: number;
    accuracy?: number;
    achievementLevel?: string;
    sessionDuration?: number; // in seconds
  };
}

interface ActivityFeedProps {
  activities: ActivityItem[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'study_session':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'deck_created':
        return <Plus className="h-4 w-4 text-green-500" />;
      case 'achievement':
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 'milestone':
        return <Target className="h-4 w-4 text-purple-500" />;
      default:
        return <BookOpen className="h-4 w-4 text-gray-500" />;
    }
  };

  const getBadgeVariant = (type: ActivityItem['type']) => {
    switch (type) {
      case 'study_session':
        return 'secondary';
      case 'deck_created':
        return 'secondary';
      case 'achievement':
        return 'default';
      case 'milestone':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Your learning journey will appear here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No activity yet</p>
            <Link href="/home/decks">
              <Button>Create Your First Deck</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Activity
        </CardTitle>
        <CardDescription>
          Your recent learning progress
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.slice(0, 10).map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:border-border transition-colors"
            >
              <div className="flex-shrink-0 mt-0.5">
                {getIcon(activity.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-sm">{activity.title}</h4>
                  <Badge variant={getBadgeVariant(activity.type)} className="text-xs">
                    {activity.type.replace('_', ' ')}
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground mb-2">
                  {activity.description}
                </p>

                {/* Metadata display */}
                {activity.metadata && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {activity.metadata.deckName && (
                      <Badge variant="outline" className="text-xs">
                        <BookOpen className="h-3 w-3 mr-1" />
                        {activity.metadata.deckName}
                      </Badge>
                    )}
                    {activity.metadata.cardsStudied && (
                      <Badge variant="outline" className="text-xs">
                        {activity.metadata.cardsStudied} cards
                      </Badge>
                    )}
                    {activity.metadata.accuracy && (
                      <Badge variant="outline" className="text-xs">
                        {activity.metadata.accuracy}% accuracy
                      </Badge>
                    )}
                    {activity.metadata.sessionDuration && (
                      <Badge variant="outline" className="text-xs">
                        {formatDuration(activity.metadata.sessionDuration)}
                      </Badge>
                    )}
                  </div>
                )}
                
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>

        {activities.length > 10 && (
          <div className="mt-4 text-center">
            <Button variant="ghost" size="sm">
              View All Activity
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}