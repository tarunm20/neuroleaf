'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';
import { Progress } from '@kit/ui/progress';
import { TestTube, Target, Clock, TrendingUp, BookOpen, Brain } from 'lucide-react';
interface TestPerformanceAnalyticsProps {
  userId: string;
  deckId?: string;
}

// Mock data for MVP demonstration
const mockPerformance: {
  total_sessions: number;
  total_questions_answered: number;
  average_score: number;
  total_time_spent_minutes: number;
  sessions_last_7_days: number;
  improvement_trend: 'needs_improvement' | 'improving' | 'stable';
} = {
  total_sessions: 0,
  total_questions_answered: 0,
  average_score: 0,
  total_time_spent_minutes: 0,
  sessions_last_7_days: 0,
  improvement_trend: 'needs_improvement',
};

export function TestPerformanceAnalytics({ userId, deckId }: TestPerformanceAnalyticsProps) {
  // For MVP, use mock data. In production, this would fetch real analytics
  const { data: performance, isLoading } = useQuery({
    queryKey: ['test-performance', userId, deckId],
    queryFn: async () => {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockPerformance;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!performance) {
    return (
      <Card className="col-span-full">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <TestTube className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Test Performance Data</h3>
          <p className="text-muted-foreground text-center max-w-md">
            Start taking AI-powered tests to see your performance analytics here.
          </p>
        </CardContent>
      </Card>
    );
  }

  const improvementColor = performance.improvement_trend === 'improving' ? 'text-green-600' : 'text-orange-600';
  const improvementIcon = performance.improvement_trend === 'improving' ? TrendingUp : Target;
  const ImprovementIcon = improvementIcon;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Test Performance Analytics</h2>
        <p className="text-muted-foreground">
          Track your AI-powered test performance and learning progress
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Sessions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Test Sessions</CardTitle>
            <TestTube className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performance.total_sessions}</div>
            <p className="text-xs text-muted-foreground">
              {performance.sessions_last_7_days} in the last 7 days
            </p>
          </CardContent>
        </Card>

        {/* Average Score */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(performance.average_score || 0)}%</div>
            <Progress 
              value={performance.average_score || 0} 
              className="mt-2" 
            />
            <p className="text-xs text-muted-foreground mt-1">
              <Badge 
                variant={performance.average_score >= 70 ? "default" : "secondary"} 
                className="text-xs"
              >
                {performance.average_score >= 90 ? "Excellent" : 
                 performance.average_score >= 80 ? "Very Good" :
                 performance.average_score >= 70 ? "Good" :
                 performance.average_score >= 60 ? "Fair" : "Needs Improvement"}
              </Badge>
            </p>
          </CardContent>
        </Card>

        {/* Questions Answered */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Questions Answered</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performance.total_questions_answered}</div>
            <p className="text-xs text-muted-foreground">
              Across all test sessions
            </p>
          </CardContent>
        </Card>

        {/* Study Time */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Study Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performance.total_time_spent_minutes}m</div>
            <p className="text-xs text-muted-foreground">
              Total time spent testing
            </p>
          </CardContent>
        </Card>

        {/* Improvement Trend */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress Trend</CardTitle>
            <ImprovementIcon className={`h-4 w-4 ${improvementColor}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${improvementColor}`}>
              {performance.improvement_trend === 'improving' ? 'Improving' : 'Needs Focus'}
            </div>
            <p className="text-xs text-muted-foreground">
              Based on recent performance
            </p>
          </CardContent>
        </Card>

        {/* AI Powered Badge */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI-Powered Testing</CardTitle>
            <Brain className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">Active</div>
            <p className="text-xs text-muted-foreground">
              Smart analysis & feedback
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      {performance.total_sessions > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Performance Insights
            </CardTitle>
            <CardDescription>
              AI-generated insights based on your test performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {performance.average_score >= 80 && (
                <div className="flex items-center gap-2 text-green-600">
                  <div className="w-2 h-2 bg-green-600 rounded-full" />
                  <span className="text-sm">Excellent performance! You&apos;re mastering the material.</span>
                </div>
              )}
              
              {performance.sessions_last_7_days >= 3 && (
                <div className="flex items-center gap-2 text-blue-600">
                  <div className="w-2 h-2 bg-blue-600 rounded-full" />
                  <span className="text-sm">Great consistency! You&apos;ve taken {performance.sessions_last_7_days} tests this week.</span>
                </div>
              )}
              
              {performance.total_questions_answered >= 50 && (
                <div className="flex items-center gap-2 text-purple-600">
                  <div className="w-2 h-2 bg-purple-600 rounded-full" />
                  <span className="text-sm">Impressive dedication! You&apos;ve answered {performance.total_questions_answered} questions.</span>
                </div>
              )}
              
              {performance.average_score < 70 && performance.total_sessions >= 3 && (
                <div className="flex items-center gap-2 text-orange-600">
                  <div className="w-2 h-2 bg-orange-600 rounded-full" />
                  <span className="text-sm">Consider reviewing the material and taking more practice tests to improve your scores.</span>
                </div>
              )}
              
              {performance.total_sessions < 3 && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full" />
                  <span className="text-sm">Take more tests to get detailed performance insights and personalized recommendations.</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}