'use client';

import { Calendar, Target, TrendingUp, Clock, Award, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';

interface LearningStatsProps {
  stats: {
    cardsDue: number;
    totalDecks: number;
    studyStreak: number;
    weeklyStudyTime: number; // in minutes
    accuracyRate: number; // percentage
    cardsMastered: number;
    cardsLearning: number;
  };
}

export function LearningStats({ stats }: LearningStatsProps) {
  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes > 0 ? `${remainingMinutes}m` : ''}`;
  };

  const getStreakBadge = (streak: number) => {
    if (streak >= 30) return { color: 'bg-purple-500', label: 'Legendary' };
    if (streak >= 14) return { color: 'bg-yellow-500', label: 'On Fire' };
    if (streak >= 7) return { color: 'bg-green-500', label: 'Great' };
    if (streak >= 3) return { color: 'bg-blue-500', label: 'Building' };
    return { color: 'bg-gray-500', label: 'Getting Started' };
  };

  const streakBadge = getStreakBadge(stats.studyStreak);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Cards Due Today */}
      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Due Today</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">{stats.cardsDue}</div>
          <p className="text-xs text-muted-foreground">
            cards ready for review
          </p>
        </CardContent>
        {stats.cardsDue > 0 && (
          <div className="absolute top-0 right-0 w-1 h-full bg-primary" />
        )}
      </Card>

      {/* Study Streak */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Study Streak</CardTitle>
          <Award className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold">{stats.studyStreak}</div>
            <Badge variant="secondary" className={`${streakBadge.color} text-white`}>
              {streakBadge.label}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            days in a row
          </p>
        </CardContent>
      </Card>

      {/* Weekly Study Time */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">This Week</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatTime(stats.weeklyStudyTime)}</div>
          <p className="text-xs text-muted-foreground">
            total study time
          </p>
        </CardContent>
      </Card>

      {/* Accuracy Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.accuracyRate}%</div>
          <p className="text-xs text-muted-foreground">
            overall success rate
          </p>
        </CardContent>
      </Card>

      {/* Total Decks */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">My Decks</CardTitle>
          <BookOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalDecks}</div>
          <p className="text-xs text-muted-foreground">
            flashcard collections
          </p>
        </CardContent>
      </Card>

      {/* Learning Progress */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Progress</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="text-lg font-semibold text-green-600">0</div>
            <span className="text-sm text-muted-foreground">tests completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-lg font-semibold text-blue-600">0</div>
            <span className="text-sm text-muted-foreground">avg score</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}