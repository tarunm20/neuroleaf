/**
 * Objective Grading Service
 * Handles direct grading for MCQ and T/F questions without LLM calls
 * Provides instant, accurate, and cost-free grading for objective question types
 */

import type { AIGradingResponse } from '../schemas';

export interface ObjectiveGradingRequest {
  question: string;
  user_answer: string;
  question_type: 'multiple_choice' | 'true_false';
  correct_answer: number | boolean;
  options?: string[]; // For MCQ questions
  explanation?: string; // Optional explanation from question generation
}

export class ObjectiveGradingService {
  /**
   * Grade a multiple choice question objectively
   */
  gradeMultipleChoice({
    question,
    user_answer,
    correct_answer,
    options = [],
    explanation
  }: ObjectiveGradingRequest & { correct_answer: number }): AIGradingResponse {
    // Handle both numeric and letter format answers
    let userIndex: number;
    if (/^[A-Z]$/.test(user_answer)) {
      // Convert letter (A, B, C, D) to numeric index (0, 1, 2, 3)
      userIndex = user_answer.charCodeAt(0) - 65;
    } else {
      // Parse numeric string
      userIndex = parseInt(user_answer);
    }
    
    // Handle invalid user input
    if (isNaN(userIndex) || userIndex < 0) {
      return {
        score: 0,
        feedback: `Invalid answer format. Please select a valid option.`,
        is_correct: false,
        model_used: 'objective_grading_v1'
      };
    }
    
    const isCorrect = userIndex === correct_answer;
    const correctOption = options[correct_answer] || `Option ${correct_answer + 1}`;
    const userOption = (userIndex >= 0 && userIndex < options.length) 
      ? options[userIndex] 
      : `Option ${userIndex + 1}`;

    let feedback: string;
    if (isCorrect) {
      feedback = `Correct! You selected "${userOption}".`;
      if (explanation) {
        feedback += ` ${explanation}`;
      }
    } else {
      feedback = `Incorrect. You selected "${userOption}" but the correct answer is "${correctOption}".`;
      if (explanation) {
        feedback += ` ${explanation}`;
      }
    }

    return {
      score: isCorrect ? 100 : 0,
      feedback,
      is_correct: isCorrect,
      model_used: 'objective_grading_v1'
    };
  }

  /**
   * Grade a true/false question objectively
   */
  gradeTrueFalse({
    question,
    user_answer,
    correct_answer,
    explanation
  }: ObjectiveGradingRequest & { correct_answer: boolean }): AIGradingResponse {
    // Handle various true/false formats
    const normalizedAnswer = user_answer.toLowerCase().trim();
    let userBoolean: boolean;
    
    if (['true', 't', '1', 'yes', 'y'].includes(normalizedAnswer)) {
      userBoolean = true;
    } else if (['false', 'f', '0', 'no', 'n'].includes(normalizedAnswer)) {
      userBoolean = false;
    } else {
      return {
        score: 0,
        feedback: `Invalid answer format. Please answer with 'true' or 'false'.`,
        is_correct: false,
        model_used: 'objective_grading_v1'
      };
    }
    
    const isCorrect = userBoolean === correct_answer;

    let feedback: string;
    if (isCorrect) {
      feedback = `Correct! The statement is ${correct_answer ? 'true' : 'false'}.`;
      if (explanation) {
        feedback += ` ${explanation}`;
      }
    } else {
      feedback = `Incorrect. The statement is ${correct_answer ? 'true' : 'false'}, not ${userBoolean ? 'true' : 'false'}.`;
      if (explanation) {
        feedback += ` ${explanation}`;
      }
    }

    return {
      score: isCorrect ? 100 : 0,
      feedback,
      is_correct: isCorrect,
      model_used: 'objective_grading_v1'
    };
  }

  /**
   * Grade any objective question (routes to appropriate method)
   */
  gradeObjectiveQuestion(request: ObjectiveGradingRequest): AIGradingResponse {
    if (request.question_type === 'multiple_choice') {
      return this.gradeMultipleChoice(request as ObjectiveGradingRequest & { correct_answer: number });
    } else if (request.question_type === 'true_false') {
      return this.gradeTrueFalse(request as ObjectiveGradingRequest & { correct_answer: boolean });
    }
    
    throw new Error(`Unsupported question type for objective grading: ${request.question_type}`);
  }

  /**
   * Check if a question can be graded objectively
   */
  canGradeObjectively(questionData: {
    question_type?: string;
    correct_answer?: number | boolean;
  }): boolean {
    return (
      (questionData.question_type === 'multiple_choice' && typeof questionData.correct_answer === 'number') ||
      (questionData.question_type === 'true_false' && typeof questionData.correct_answer === 'boolean')
    );
  }

  /**
   * Generate performance summary for objective questions
   */
  generateObjectivePerformanceSummary(results: AIGradingResponse[]): {
    correctCount: number;
    totalCount: number;
    percentage: number;
    averageScore: number;
  } {
    const correctCount = results.filter(r => r.is_correct).length;
    const totalCount = results.length;
    const percentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
    const averageScore = totalCount > 0 
      ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / totalCount) 
      : 0;

    return {
      correctCount,
      totalCount,
      percentage,
      averageScore
    };
  }
}