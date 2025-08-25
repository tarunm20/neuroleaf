'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Button } from '@kit/ui/button';
import { Badge } from '@kit/ui/badge';
import { 
  ArrowLeft, 
  Clock, 
  Target, 
  BookOpen, 
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Zap,
  Brain,
  RefreshCw,
  Trophy,
  TrendingUp
} from 'lucide-react';
import { getTestSessionDetailsAction } from '@kit/test-mode/server';
import type { DetailedTestHistory } from '@kit/test-mode';

interface TestSessionDetailsProps {
  sessionId: string;
  onBack: () => void;
}


export function TestSessionDetails({ sessionId, onBack }: TestSessionDetailsProps) {
  const [testDetails, setTestDetails] = useState<DetailedTestHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTestDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await getTestSessionDetailsAction(sessionId);
      
      if (result.success && result.data) {
        setTestDetails(result.data);
      } else {
        setError(result.error || 'Failed to load test details');
      }
    } catch (err) {
      console.error('Error loading test details:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTestDetails();
  }, [sessionId]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatTime = (seconds: number | null) => {
    if (!seconds) return '0 min';
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-gray-500';
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 80) return 'text-blue-600 dark:text-blue-400';
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 60) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getGradingMethodBadge = (method: string) => {
    if (method === 'objective_grading_v1') {
      return <Badge variant="outline" className="text-xs bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300">Instant</Badge>;
    }
    return <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">AI Graded</Badge>;
  };

  const getQuestionIcon = (isCorrect: boolean) => {
    return isCorrect 
      ? <CheckCircle className="w-4 h-4 text-green-500" />
      : <XCircle className="w-4 h-4 text-red-500" />;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading test details...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !testDetails) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to History
          </Button>
        </div>

        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Error loading test details:</span>
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const gradingStats = testDetails.grading_metadata || {};
  const objectiveQuestions = gradingStats.objective_questions || 0;
  const aiGradedQuestions = gradingStats.ai_graded_questions || 0;
  const totalQuestions = gradingStats.total_questions || testDetails.responses.length;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to History
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{testDetails.deck_name}</h1>
            <p className="text-muted-foreground">
              Test Session Details
            </p>
          </div>
        </div>
      </div>

      {/* Session Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Final Score</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(testDetails.average_score)}`}>
              {testDetails.average_score ?? 0}%
            </div>
            <p className="text-xs text-muted-foreground">Overall performance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Questions</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {testDetails.questions_completed}/{testDetails.total_questions}
            </div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatTime(testDetails.time_spent_seconds)}
            </div>
            <p className="text-xs text-muted-foreground">Total time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {formatDate(testDetails.completed_at)}
            </div>
            <p className="text-xs text-muted-foreground">Finish time</p>
          </CardContent>
        </Card>
      </div>

      {/* Grading Efficiency */}
      {(objectiveQuestions > 0 || aiGradedQuestions > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="w-5 h-5" />
              Grading Efficiency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {objectiveQuestions}
                </div>
                <p className="text-sm text-muted-foreground">Instantly Graded</p>
                <Badge variant="outline" className="mt-1 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300">
                  MCQ & T/F
                </Badge>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {aiGradedQuestions}
                </div>
                <p className="text-sm text-muted-foreground">AI Graded</p>
                <Badge variant="outline" className="mt-1 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                  Open-ended
                </Badge>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {Math.round((objectiveQuestions / Math.max(totalQuestions, 1)) * 100)}%
                </div>
                <p className="text-sm text-muted-foreground">Cost Efficiency</p>
                <Badge variant="outline" className="mt-1">
                  {objectiveQuestions}/{totalQuestions} instant
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Questions and Answers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="w-5 h-5" />
            Question by Question Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {testDetails.responses.map((response: any, index: number) => (
              <Card key={response.id} className="border-l-4 border-l-transparent hover:border-l-blue-500 transition-colors">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Question Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs">
                          Q{index + 1}
                        </Badge>
                        {getQuestionIcon(response.is_correct)}
                        <span className={`font-medium ${getScoreColor(response.ai_score)}`}>
                          {response.ai_score}%
                        </span>
                      </div>
                      {getGradingMethodBadge(response.grading_method)}
                    </div>

                    {/* Question */}
                    <div>
                      <h4 className="font-medium text-sm mb-2">Question:</h4>
                      <p className="text-sm bg-muted p-3 rounded-lg">
                        {response.question_text}
                      </p>
                    </div>

                    {/* Question Options (for MCQ) */}
                    {response.question_options && response.question_options.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Options:</h4>
                        <div className="space-y-1">
                          {response.question_options.map((option: string, optIndex: number) => (
                            <div key={optIndex} className="text-sm flex items-center gap-2">
                              <Badge variant="outline" className="text-xs w-6 h-6 p-0 flex items-center justify-center">
                                {String.fromCharCode(65 + optIndex)}
                              </Badge>
                              <span>{option}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Your Answer vs Correct Answer */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className={`font-medium text-sm mb-2 flex items-center gap-1 ${
                          response.is_correct ? 'text-green-600' : 'text-red-600'
                        }`}>
                          Your Answer
                          {response.is_correct ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                        </h4>
                        <p className={`text-sm p-3 rounded-lg ${
                          response.is_correct 
                            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                        }`}>
                          {(() => {
                            // Format user response to match correct answer format
                            if (response.question_type === 'multiple_choice' && response.question_options) {
                              // Handle both numeric and letter format answers
                              let userIndex: number;
                              if (/^[A-Z]$/.test(response.user_response)) {
                                // Convert letter (A, B, C, D) to numeric index (0, 1, 2, 3)
                                userIndex = response.user_response.charCodeAt(0) - 65;
                              } else {
                                // Parse numeric string (backward compatibility)
                                userIndex = parseInt(response.user_response);
                              }
                              
                              if (!isNaN(userIndex) && userIndex >= 0 && userIndex < response.question_options.length) {
                                return `${String.fromCharCode(65 + userIndex)}. ${response.question_options[userIndex]}`;
                              }
                            }
                            // For T/F and open-ended, use response as-is (already formatted correctly)
                            return response.user_response;
                          })()}
                        </p>
                      </div>
                      
                      {/* Enhanced correct answer display */}
                      <div>
                        <h4 className="font-medium text-sm mb-2 text-green-600">
                          {response.question_type === 'open_ended' ? 'Sample Answer' : 'Correct Answer'}
                        </h4>
                        <div className="text-sm p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                          {(() => {
                            // For MCQ, show the correct option text
                            if (response.question_type === 'multiple_choice' && response.question_options && response.correct_answer !== undefined) {
                              const correctIndex = response.correct_answer as number;
                              const correctOption = response.question_options[correctIndex];
                              if (correctOption) {
                                return `${String.fromCharCode(65 + correctIndex)}. ${correctOption}`;
                              }
                            }
                            
                            // For T/F, show True/False
                            if (response.question_type === 'true_false' && response.correct_answer !== undefined) {
                              return response.correct_answer ? 'True' : 'False';
                            }
                            
                            // For open-ended, show expected answer or generate sample
                            if (response.question_type === 'open_ended') {
                              if (response.expected_answer) {
                                return response.expected_answer;
                              } else {
                                return "This would be a comprehensive response that addresses the key concepts mentioned in the question with proper explanations and examples.";
                              }
                            }
                            
                            // Fallback to expected_answer
                            return response.expected_answer || 'Answer not available';
                          })()}
                        </div>
                        
                        {/* Show additional context for MCQ/T-F */}
                        {(response.question_type === 'multiple_choice' || response.question_type === 'true_false') && (
                          <div className="mt-2">
                            <Badge variant={response.is_correct ? 'default' : 'destructive'} className="text-xs">
                              {response.is_correct ? '✓ You got this correct' : '✗ Your answer was incorrect'}
                            </Badge>
                          </div>
                        )}
                        
                        {/* For open-ended, show performance indicator */}
                        {response.question_type === 'open_ended' && (
                          <div className="mt-2">
                            <Badge 
                              variant={response.ai_score >= 80 ? 'default' : response.ai_score >= 60 ? 'secondary' : 'destructive'} 
                              className="text-xs"
                            >
                              Your score: {response.ai_score}%
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Feedback */}
                    {response.ai_feedback && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Feedback:</h4>
                        <p className="text-sm p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                          {response.ai_feedback}
                        </p>
                      </div>
                    )}

                    {/* Response Time */}
                    {response.response_time_seconds && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>Answered in {formatTime(response.response_time_seconds)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}