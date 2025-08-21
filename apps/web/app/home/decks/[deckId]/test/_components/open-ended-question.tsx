'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Button } from '@kit/ui/button';
import { Badge } from '@kit/ui/badge';
import { Textarea } from '@kit/ui/textarea';
import { Clock, MessageSquare } from 'lucide-react';
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

        {/* Suggested Answer Hint (shown before submission if available) */}
        {!showFeedback && question.suggested_answer && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <h5 className="text-sm font-medium text-amber-800 mb-1">
              💡 Hint for a good answer:
            </h5>
            <p className="text-xs text-amber-700">
              <MathContent>{question.suggested_answer}</MathContent>
            </p>
          </div>
        )}

        {/* AI Feedback (shown after submission) */}
        {showFeedback && feedback && (
          <div className="space-y-4">
            {/* AI Feedback */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                AI Feedback:
              </h4>
              <p className="text-sm text-blue-700 leading-relaxed">
                <MathContent>{feedback}</MathContent>
              </p>
            </div>

            {/* Expected Answer Reference (if available) */}
            {expectedAnswer && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">
                  Reference Answer:
                </h4>
                <p className="text-sm text-green-700 leading-relaxed">
                  <MathContent>{expectedAnswer}</MathContent>
                </p>
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