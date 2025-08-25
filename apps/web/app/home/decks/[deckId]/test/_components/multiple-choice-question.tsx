'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Button } from '@kit/ui/button';
import { Badge } from '@kit/ui/badge';
import { CheckCircle, Circle, Clock } from 'lucide-react';
import { MathContent } from '@kit/ui/math-content';
import type { MultipleChoiceQuestion } from '@kit/test-mode/schemas';

interface MultipleChoiceQuestionProps {
  question: MultipleChoiceQuestion;
  questionNumber: number;
  selectedAnswer: number | null;
  onAnswerSelect: (answerIndex: number) => void;
  onSubmit: () => void;
  showExplanation?: boolean;
  isCorrect?: boolean;
  isSubmitting?: boolean;
  disabled?: boolean;
}

export function MultipleChoiceQuestionComponent({
  question,
  questionNumber,
  selectedAnswer,
  onAnswerSelect,
  onSubmit,
  showExplanation = false,
  isCorrect,
  isSubmitting = false,
  disabled = false,
}: MultipleChoiceQuestionProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const handleOptionClick = (index: number) => {
    if (disabled || showExplanation) return;
    onAnswerSelect(index);
  };

  const getOptionStyle = (index: number) => {
    if (showExplanation) {
      // Show results state
      if (index === question.correct_answer) {
        return 'border-green-500 bg-green-50 text-green-900';
      }
      if (index === selectedAnswer && index !== question.correct_answer) {
        return 'border-red-500 bg-red-50 text-red-900';
      }
      return 'border-muted bg-muted/30 text-muted-foreground';
    }

    // Interactive state
    if (selectedAnswer === index) {
      return 'border-primary bg-primary/10 text-primary';
    }
    if (hoveredIndex === index && !disabled) {
      return 'border-primary/50 bg-primary/5';
    }
    return 'border-border hover:border-muted-foreground/50';
  };

  const getOptionIcon = (index: number) => {
    if (showExplanation) {
      if (index === question.correct_answer) {
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      }
      if (index === selectedAnswer && index !== question.correct_answer) {
        return <Circle className="h-5 w-5 text-red-600" />;
      }
      return <Circle className="h-5 w-5 text-muted-foreground" />;
    }

    return selectedAnswer === index ? (
      <CheckCircle className="h-5 w-5 text-primary" />
    ) : (
      <Circle className="h-5 w-5 text-muted-foreground" />
    );
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Question {questionNumber}
          <Badge variant="outline" className="ml-2">
            Multiple Choice
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
        {/* Question */}
        <div className="text-lg font-medium leading-relaxed">
          <MathContent>{question.question}</MathContent>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {question.options.map((option, index) => (
            <div
              key={index}
              className={`
                p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 
                flex items-center gap-3 ${getOptionStyle(index)}
                ${disabled || showExplanation ? 'cursor-default' : 'cursor-pointer'}
              `}
              onClick={() => handleOptionClick(index)}
              onMouseEnter={() => !disabled && !showExplanation && setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {getOptionIcon(index)}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  <span className="text-sm">
                    <MathContent>{option}</MathContent>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Correct Answer Display (shown after submission) */}
        {showExplanation && (
          <div className="mt-6 space-y-4">
            {/* Correct Answer Box */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Correct Answer:
              </h4>
              <p className="text-sm text-green-700 leading-relaxed font-medium">
                {String.fromCharCode(65 + question.correct_answer)}. {question.options[question.correct_answer]}
              </p>
            </div>

            {/* Explanation */}
            {question.explanation && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">
                  Explanation:
                </h4>
                <p className="text-sm text-blue-700 leading-relaxed">
                  <MathContent>{question.explanation}</MathContent>
                </p>
              </div>
            )}
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
            Select one answer and click Submit to continue
          </p>
        )}
      </CardContent>
    </Card>
  );
}