'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';
import { Clock, Target, TrendingUp, Calendar } from 'lucide-react';

interface SessionQualityWidgetProps {
  qualityStats?: {
    averageSessionQuality: number;
    optimalStudyTime: {
      hour: number;
      dayOfWeek: number;
    };
    sessionStreaks: {
      current: number;
      longest: number;
    };
    performanceInsights: {
      bestTimeSlot: string;
      averageSessionLength: number;
      consistencyScore: number;
    };
  };
  isLoading?: boolean;
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function SessionQualityWidget({ qualityStats, isLoading }: SessionQualityWidgetProps) {
  if (isLoading) {
    return (
      <Card className="neuroleaf-card border-emerald-100/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-emerald-600" />
            Session Quality
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!qualityStats) {
    return (
      <Card className="neuroleaf-card border-emerald-100/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-emerald-600" />
            Session Quality
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Complete some study sessions to see quality insights
          </p>
        </CardContent>
      </Card>
    );
  }

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getQualityLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Work';
  };

  const formatTime = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  return (
    <Card className="neuroleaf-card border-emerald-100/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5 text-emerald-600" />
          Session Quality
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Quality Score */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Overall Quality</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`${getQualityColor(qualityStats.averageSessionQuality)} border-0`}>
              {qualityStats.averageSessionQuality}/100
            </Badge>
            <span className="text-xs text-muted-foreground">
              {getQualityLabel(qualityStats.averageSessionQuality)}
            </span>
          </div>
        </div>

        {/* Optimal Study Time */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Best Time</span>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">
              {formatTime(qualityStats.optimalStudyTime.hour)}
            </div>
            <div className="text-xs text-muted-foreground">
              {qualityStats.performanceInsights.bestTimeSlot} • {dayNames[qualityStats.optimalStudyTime.dayOfWeek]}
            </div>
          </div>
        </div>

        {/* Session Streak */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Quality Streak</span>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">
              {qualityStats.sessionStreaks.current} days
            </div>
            <div className="text-xs text-muted-foreground">
              Best: {qualityStats.sessionStreaks.longest} days
            </div>
          </div>
        </div>

        {/* Performance Insights */}
        <div className="pt-2 border-t border-muted-foreground/10">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="text-muted-foreground">Avg Session</div>
              <div className="font-medium">{qualityStats.performanceInsights.averageSessionLength}min</div>
            </div>
            <div>
              <div className="text-muted-foreground">Consistency</div>
              <div className="font-medium">{Math.round(qualityStats.performanceInsights.consistencyScore)}%</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}