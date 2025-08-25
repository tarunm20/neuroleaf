'use client';

import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { TestHistoryList } from './test-history-list';
import { TestHistoryFilters } from './test-history-filters';
import { TestSessionDetails } from './test-session-details';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import { RefreshCw, History, TrendingUp } from 'lucide-react';
import { 
  getUserTestHistoryAction, 
  getDeckTestHistoryAction
} from '@kit/test-mode/server';

export interface TestHistoryEntry {
  session_id: string;
  deck_id: string;
  deck_name: string;
  test_mode: 'flashcard' | 'ai_questions';
  total_questions: number;
  questions_completed: number;
  average_score: number | null;
  time_spent_seconds: number;
  started_at: string;
  completed_at: string;
  test_questions: any[];
  test_results: any;
  overall_analysis: any;
  grading_metadata: any;
}

export interface TestStatistics {
  total_tests: number;
  average_score: number;
  best_score: number;
  total_time_spent: number;
  questions_answered: number;
  recent_tests: TestHistoryEntry[];
}

interface TestHistoryPageContainerProps {
  user: User;
}

export function TestHistoryPageContainer({ user }: TestHistoryPageContainerProps) {
  const [testHistory, setTestHistory] = useState<TestHistoryEntry[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTestHistory = async (deckId?: string) => {
    try {
      setLoading(true);
      setError(null);

      // Load test history
      const historyResult = deckId 
        ? await getDeckTestHistoryAction(deckId, 20)
        : await getUserTestHistoryAction(20, 0);
      
      if (historyResult.success && historyResult.data) {
        setTestHistory(historyResult.data);
      } else {
        setError(historyResult.error || 'Failed to load test history');
      }
    } catch (err) {
      console.error('Error loading test history:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDeckFilter = (deckId: string | null) => {
    setSelectedDeck(deckId);
    setSelectedSession(null); // Clear session selection when changing deck filter
    loadTestHistory(deckId || undefined);
  };

  const handleSessionSelect = (sessionId: string | null) => {
    setSelectedSession(sessionId);
  };

  const handleRefresh = () => {
    loadTestHistory(selectedDeck || undefined);
  };

  // Load initial data
  useEffect(() => {
    loadTestHistory();
  }, []);

  if (selectedSession) {
    return (
      <TestSessionDetails 
        sessionId={selectedSession} 
        onBack={() => setSelectedSession(null)} 
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <History className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Test History</h1>
            <p className="text-muted-foreground">
              Review your past test sessions and performance
            </p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>


      {/* Filters */}
      <TestHistoryFilters
        selectedDeck={selectedDeck}
        onDeckChange={handleDeckFilter}
        testHistory={testHistory}
      />

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <span className="font-medium">Error:</span>
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test History List */}
      {loading ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading test history...</span>
            </div>
          </CardContent>
        </Card>
      ) : testHistory.length > 0 ? (
        <TestHistoryList 
          testHistory={testHistory}
          onSessionSelect={handleSessionSelect}
        />
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-3 bg-muted rounded-full">
                <TrendingUp className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-medium">No test history found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedDeck 
                    ? "No tests found for the selected deck. Try selecting 'All Decks' or take a test first."
                    : "You haven't taken any tests yet. Start by taking a test from one of your decks."
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}