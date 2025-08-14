'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Button } from '@kit/ui/button';
import { Badge } from '@kit/ui/badge';
import { CheckCircle, XCircle, Circle, Clock } from 'lucide-react';
import type { TrueFalseQuestion } from '@kit/test-mode/schemas';

interface TrueFalseQuestionProps {
  question: TrueFalseQuestion;
  questionNumber: number;
  selectedAnswer: boolean | null;
  onAnswerSelect: (answer: boolean) => void;
  onSubmit: () => void;
  showExplanation?: boolean;
  isCorrect?: boolean;
  isSubmitting?: boolean;
  disabled?: boolean;
}

export function TrueFalseQuestionComponent({
  question,
  questionNumber,
  selectedAnswer,
  onAnswerSelect,
  onSubmit,
  showExplanation = false,
  isCorrect,
  isSubmitting = false,
  disabled = false,
}: TrueFalseQuestionProps) {
  const [hoveredAnswer, setHoveredAnswer] = useState<boolean | null>(null);

  const handleAnswerClick = (answer: boolean) => {
    if (disabled || showExplanation) return;
    onAnswerSelect(answer);
  };

  const getAnswerStyle = (answer: boolean) => {
    if (showExplanation) {
      // Show results state
      if (answer === question.correct_answer) {
        return 'border-green-500 bg-green-50 text-green-900';
      }
      if (answer === selectedAnswer && answer !== question.correct_answer) {
        return 'border-red-500 bg-red-50 text-red-900';
      }
      return 'border-muted bg-muted/30 text-muted-foreground';
    }

    // Interactive state
    if (selectedAnswer === answer) {
      return 'border-primary bg-primary/10 text-primary';
    }
    if (hoveredAnswer === answer && !disabled) {
      return 'border-primary/50 bg-primary/5';
    }
    return 'border-border hover:border-muted-foreground/50';
  };

  const getAnswerIcon = (answer: boolean) => {
    if (showExplanation) {
      if (answer === question.correct_answer) {
        return answer ? (
          <CheckCircle className="h-6 w-6 text-green-600" />
        ) : (
          <XCircle className="h-6 w-6 text-green-600" />
        );
      }
      if (answer === selectedAnswer && answer !== question.correct_answer) {
        return answer ? (
          <CheckCircle className="h-6 w-6 text-red-600" />
        ) : (
          <XCircle className="h-6 w-6 text-red-600" />
        );
      }
      return <Circle className="h-6 w-6 text-muted-foreground" />;
    }

    if (selectedAnswer === answer) {
      return answer ? (
        <CheckCircle className="h-6 w-6 text-primary" />
      ) : (
        <XCircle className="h-6 w-6 text-primary" />
      );
    }

    return answer ? (
      <CheckCircle className="h-6 w-6 text-muted-foreground" />
    ) : (
      <XCircle className="h-6 w-6 text-muted-foreground" />
    );
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Question {questionNumber}
          <Badge variant="outline" className="ml-2">
            True/False
          </Badge>
          {showExplanation && (
            <Badge 
              variant={isCorrect ? "default" : "destructive"} 
              className="ml-2"
            >
              {isCorrect ? "Correct" : "Incorrect"}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Statement */}
        <div className="text-lg font-medium leading-relaxed p-4 bg-muted/30 rounded-lg border">
          {question.statement}
        </div>

        {/* Instruction */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Is this statement true or false?
          </p>
        </div>

        {/* Answer Options */}
        <div className="grid grid-cols-2 gap-4">
          {/* True Option */}
          <div
            className={`
              p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 
              flex flex-col items-center gap-3 ${getAnswerStyle(true)}
              ${disabled || showExplanation ? 'cursor-default' : 'cursor-pointer'}
            `}
            onClick={() => handleAnswerClick(true)}
            onMouseEnter={() => !disabled && !showExplanation && setHoveredAnswer(true)}
            onMouseLeave={() => setHoveredAnswer(null)}
          >
            {getAnswerIcon(true)}
            <span className="font-semibold text-lg">TRUE</span>
          </div>

          {/* False Option */}
          <div
            className={`
              p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 
              flex flex-col items-center gap-3 ${getAnswerStyle(false)}
              ${disabled || showExplanation ? 'cursor-default' : 'cursor-pointer'}
            `}
            onClick={() => handleAnswerClick(false)}
            onMouseEnter={() => !disabled && !showExplanation && setHoveredAnswer(false)}
            onMouseLeave={() => setHoveredAnswer(null)}
          >
            {getAnswerIcon(false)}
            <span className="font-semibold text-lg">FALSE</span>
          </div>
        </div>

        {/* Selected Answer Display */}
        {selectedAnswer !== null && !showExplanation && (
          <div className="text-center">
            <Badge variant="outline" className="text-sm">
              Your answer: {selectedAnswer ? 'TRUE' : 'FALSE'}
            </Badge>
          </div>
        )}

        {/* Explanation (shown after submission) */}
        {showExplanation && question.explanation && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">
              Explanation:
            </h4>
            <p className="text-sm text-blue-700 leading-relaxed">
              {question.explanation}
            </p>
            <div className="mt-3 pt-3 border-t border-blue-200">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-blue-800">
                  Correct answer:
                </span>
                <Badge 
                  variant={question.correct_answer ? "default" : "secondary"}
                  className="text-xs"
                >
                  {question.correct_answer ? 'TRUE' : 'FALSE'}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button (only show when not in explanation mode) */}
        {!showExplanation && (
          <div className="flex gap-3 pt-2">
            <Button
              onClick={onSubmit}
              disabled={selectedAnswer === null || isSubmitting}
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
        {!showExplanation && (
          <p className="text-xs text-muted-foreground text-center">
            Click True or False, then click Submit to continue
          </p>
        )}
      </CardContent>
    </Card>
  );
}