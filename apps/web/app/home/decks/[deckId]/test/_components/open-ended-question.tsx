'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Button } from '@kit/ui/button';
import { Badge } from '@kit/ui/badge';
import { Textarea } from '@kit/ui/textarea';
import { Clock, MessageSquare, CheckCircle, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import { MathContent } from '@kit/ui/math-content';
import type { OpenEndedQuestion } from '@kit/test-mode/schemas';

interface OpenEndedQuestionProps {
  question: OpenEndedQuestion;
  questionNumber: number;
  userAnswer: string;
  onAnswerChange: (answer: string) => void;
  onSubmit: () => void;
  showFeedback?: boolean;
  score?: number;
  feedback?: string;
  isSubmitting?: boolean;
  disabled?: boolean;
  expectedAnswer?: string;
}

export function OpenEndedQuestionComponent({
  question,
  questionNumber,
  userAnswer,
  onAnswerChange,
  onSubmit,
  showFeedback = false,
  score,
  feedback,
  isSubmitting = false,
  disabled = false,
  expectedAnswer,
}: OpenEndedQuestionProps) {
  const [showHint, setShowHint] = useState(false);

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default'; // Green
    if (score >= 60) return 'secondary'; // Blue
    return 'destructive'; // Red
  };

  const getScoreGrade = (score: number) => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Question {questionNumber}
          <Badge variant="outline" className="ml-2">
            Open Ended
          </Badge>
          {showFeedback && score !== undefined && (
            <Badge 
              variant={getScoreBadgeVariant(score)} 
              className="ml-2"
            >
              {getScoreGrade(score)} ({score}%)
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Question */}
        <div className="text-lg font-medium leading-relaxed">
          <MathContent>{question.question}</MathContent>
        </div>

        {/* Answer Textarea */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Your Answer:</span>
          </div>
          <Textarea
            value={userAnswer}
            onChange={(e) => onAnswerChange(e.target.value)}
            placeholder="Type your answer here..."
            rows={6}
            className="resize-none"
            disabled={disabled || showFeedback}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{userAnswer.length} characters</span>
            {!showFeedback && (
              <span>Write a detailed response for better scoring</span>
            )}
          </div>
        </div>

        {/* Optional Hint (shown before submission if available) */}
        {!showFeedback && question.suggested_answer && (
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHint(!showHint)}
              className="w-auto px-3 py-1 h-8 text-muted-foreground hover:text-amber-700 border border-amber-200 hover:border-amber-300 hover:bg-amber-50 dark:border-amber-800 dark:hover:border-amber-700 dark:hover:bg-amber-950"
            >
              <Lightbulb className="h-3 w-3 mr-1" />
              {showHint ? 'Hide Hint' : 'Show Hint'}
              {showHint ? (
                <ChevronUp className="h-3 w-3 ml-1" />
              ) : (
                <ChevronDown className="h-3 w-3 ml-1" />
              )}
            </Button>
            
            {showHint && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg dark:bg-amber-950 dark:border-amber-800">
                <h5 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1 flex items-center gap-1">
                  <Lightbulb className="h-3 w-3" />
                  Thinking Direction:
                </h5>
                <div className="text-sm text-amber-700 dark:text-amber-300">
                  <MathContent>{question.suggested_answer}</MathContent>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Results Display (shown after submission) */}
        {showFeedback && (
          <div className="space-y-4">
            {/* Sample Answer (always show for educational value) */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-950 dark:border-green-800">
              <h4 className="font-medium text-green-800 dark:text-green-200 mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Sample Answer:
              </h4>
              <div className="text-sm text-green-700 dark:text-green-300 leading-relaxed">
                {expectedAnswer ? (
                  <MathContent>{expectedAnswer}</MathContent>
                ) : (
                  question.suggested_answer ? (
                    <MathContent>{question.suggested_answer}</MathContent>
                  ) : (
                    <div className="space-y-2">
                      <p>A comprehensive answer should address the following key aspects:</p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Define or explain the main concepts mentioned in the question</li>
                        <li>Provide specific examples or evidence to support your points</li>
                        <li>Analyze relationships between different ideas</li>
                        <li>Draw clear conclusions based on your analysis</li>
                      </ul>
                      <p className="text-xs italic mt-2">
                        Note: This is a general template. A good answer would provide specific details relevant to the question topic.
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* AI Feedback */}
            {feedback && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950 dark:border-blue-800">
                <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  AI Feedback on Your Answer:
                </h4>
                <div className="text-sm text-blue-700 leading-relaxed">
                  <MathContent>{feedback}</MathContent>
                </div>
              </div>
            )}

            {/* Performance Summary */}
            {score !== undefined && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-800">Your Performance:</h4>
                  <Badge variant={score >= 80 ? 'default' : score >= 60 ? 'secondary' : 'destructive'}>
                    {score}% ({score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F'})
                  </Badge>
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  {score >= 80 
                    ? "Excellent work! Your answer demonstrates strong understanding."
                    : score >= 60 
                    ? "Good effort. Review the sample answer to see how you can improve."
                    : "Keep practicing. Compare your answer with the sample to identify areas for improvement."
                  }
                </div>
              </div>
            )}
          </div>
        )}

        {/* Submit Button (only show when not in feedback mode) */}
        {!showFeedback && (
          <div className="flex gap-3 pt-2">
            <Button
              onClick={onSubmit}
              disabled={!userAnswer.trim() || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent" />
                  Submitting...
                </>
              ) : (
                'Submit Answer'
              )}
            </Button>
          </div>
        )}

        {/* Instructions */}
        {!showFeedback && (
          <p className="text-xs text-muted-foreground text-center">
            Provide a detailed answer to earn a higher score
          </p>
        )}
      </CardContent>
    </Card>
  );
}