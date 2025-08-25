'use client';

import { Card, CardContent } from '@kit/ui/card';
import { Button } from '@kit/ui/button';
import { Badge } from '@kit/ui/badge';
import { 
  Clock, 
  BookOpen, 
  Target, 
  Calendar,
  ArrowRight,
  CheckCircle,
  XCircle
} from 'lucide-react';
import type { TestHistoryEntry } from './test-history-page-container';

interface TestHistoryListProps {
  testHistory: TestHistoryEntry[];
  onSessionSelect: (sessionId: string) => void;
}

export function TestHistoryList({ testHistory, onSessionSelect }: TestHistoryListProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-muted-foreground';
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getTestModeLabel = (mode: string) => {
    if (mode === 'ai_questions') return 'AI Test';
    return 'Test';
  };

  const getCompletionStatus = (test: TestHistoryEntry) => {
    if (!test.completed_at) {
      return {
        icon: <XCircle className="w-4 h-4 text-orange-500" />,
        label: 'Incomplete',
        variant: 'secondary' as const,
      };
    }

    const completedQuestions = test.questions_completed || 0;
    const totalQuestions = test.total_questions || 0;
    const isComplete = completedQuestions >= totalQuestions;

    return {
      icon: <CheckCircle className={`w-4 h-4 ${isComplete ? 'text-green-500' : 'text-yellow-500'}`} />,
      label: isComplete ? 'Completed' : 'Partial',
      variant: isComplete ? 'default' as const : 'secondary' as const,
    };
  };


  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recent Test Sessions</h2>
        <Badge variant="outline" className="text-xs">
          {testHistory.length} session{testHistory.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="grid gap-4">
        {testHistory.map((test) => {
          const completionStatus = getCompletionStatus(test);

          return (
            <Card key={test.session_id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Section - Main Info */}
                  <div className="flex-1 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{test.deck_name}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{getTestModeLabel(test.test_mode)}</span>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {test.completed_at ? formatDate(test.completed_at) : formatDate(test.started_at)}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Status Badge */}
                      <div className="flex items-center gap-1">
                        {completionStatus.icon}
                        <Badge variant={completionStatus.variant} className="text-xs">
                          {completionStatus.label}
                        </Badge>
                      </div>
                    </div>

                    {/* Stats Row */}
                    <div className="flex flex-wrap gap-4 text-sm">
                      {/* Score */}
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Score:</span>
                        {test.average_score !== null ? (
                          <span className={`font-medium ${getScoreColor(test.average_score)}`}>
                            {test.average_score}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Not graded</span>
                        )}
                      </div>

                      {/* Questions */}
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Questions:</span>
                        <span className="font-medium">
                          {test.questions_completed || 0}/{test.total_questions}
                        </span>
                      </div>

                      {/* Time */}
                      {test.time_spent_seconds && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Time:</span>
                          <span className="font-medium">
                            {formatTime(test.time_spent_seconds)}
                          </span>
                        </div>
                      )}

                    </div>
                  </div>

                  {/* Right Section - Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSessionSelect(test.session_id)}
                      className="whitespace-nowrap"
                    >
                      View Details
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}