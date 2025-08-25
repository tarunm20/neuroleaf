'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { requireUser } from '@kit/supabase/require-user';
import { checkTestSessionLimit, checkAIGenerationLimit } from '@kit/subscription/server';
import { TestSessionService } from './test-session.service';
import { AIGradingService } from '../services/ai-grading.service';
import { TestHistoryService } from '../services/test-history.service';
import {
  CreateTestSessionSchema,
  CreateTestResponseSchema,
  GenerateQuestionsSchema,
} from '../schemas';

/**
 * Create a new test session
 */
export async function createTestSessionAction(
  data: z.infer<typeof CreateTestSessionSchema>,
) {
  const supabase = getSupabaseServerClient();
  const result = await requireUser(supabase);
  const testSessionService = new TestSessionService(supabase);

  if (result.error || !result.data) {
    return { success: false, error: 'User not authenticated' };
  }

  const user = result.data;

  // Check test session limit before creating
  const testLimitCheck = await checkTestSessionLimit(user.id);
  if (!testLimitCheck.canStart) {
    return { 
      success: false, 
      error: `Test session limit reached (${testLimitCheck.current}/${testLimitCheck.limit}). Please upgrade to Pro for unlimited test sessions.`,
      limitReached: true,
      usage: { current: testLimitCheck.current, limit: testLimitCheck.limit }
    };
  }

  try {
    const validatedData = CreateTestSessionSchema.parse(data);
    const session = await testSessionService.createTestSession(validatedData, user.id);

    revalidatePath('/home');
    return { success: true, session };
  } catch (error) {
    console.error('Create test session error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create test session',
    };
  }
}

/**
 * Submit a test response with AI grading
 */
export async function submitTestResponseAction(
  data: z.infer<typeof CreateTestResponseSchema>,
) {
  const supabase = getSupabaseServerClient();
  const result = await requireUser(supabase);
  const testSessionService = new TestSessionService(supabase);

  if (result.error || !result.data) {
    return { success: false, error: 'User not authenticated' };
  }

  const user = result.data;

  try {
    const validatedData = CreateTestResponseSchema.parse(data);
    const response = await testSessionService.createTestResponse(validatedData, user.id);

    revalidatePath('/home');
    return { success: true, response };
  } catch (error) {
    console.error('Submit test response error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit test response',
    };
  }
}

/**
 * Generate AI questions from flashcards
 */
export async function generateQuestionsAction(
  data: z.infer<typeof GenerateQuestionsSchema>,
) {
  const supabase = getSupabaseServerClient();
  const result = await requireUser(supabase);
  const testSessionService = new TestSessionService(supabase);

  if (result.error || !result.data) {
    return { success: false, error: 'User not authenticated' };
  }

  const user = result.data;

  // Check AI generation limit before generating questions
  const aiLimitCheck = await checkAIGenerationLimit(user.id);
  if (!aiLimitCheck.canGenerate) {
    return { 
      success: false, 
      error: `AI generation limit reached (${aiLimitCheck.current}/${aiLimitCheck.limit}). Please upgrade to Pro for more AI generations.`,
      limitReached: true,
      usage: { current: aiLimitCheck.current, limit: aiLimitCheck.limit }
    };
  }

  try {
    const validatedData = GenerateQuestionsSchema.parse(data);
    const { flashcards, question_count: questionCount, difficulty } = validatedData;

    const questions = await testSessionService.generateQuestionsFromFlashcards(
      flashcards,
      questionCount,
      difficulty,
    );

    return { success: true, data: questions };
  } catch (error) {
    console.error('Generate questions error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate questions',
    };
  }
}

/**
 * Grade answers using optimized grading (objective for MCQ/T-F, AI for open-ended)
 */
export async function gradeAnswersOptimizedAction(data: {
  answers: Array<{
    question: string;
    user_answer: string;
    expected_answer: string;
    question_type?: 'multiple_choice' | 'true_false' | 'open_ended';
    correct_answer?: number | boolean;
    options?: string[];
    explanation?: string;
  }>;
}) {
  const supabase = getSupabaseServerClient();
  const result = await requireUser(supabase);
  const testSessionService = new TestSessionService(supabase);

  if (result.error || !result.data) {
    return { success: false, error: 'User not authenticated' };
  }

  const user = result.data;

  // Only check AI generation limit for questions that will use AI grading
  const aiQuestionsCount = data.answers.filter(answer => 
    !(answer.question_type === 'multiple_choice' && typeof answer.correct_answer === 'number') &&
    !(answer.question_type === 'true_false' && typeof answer.correct_answer === 'boolean')
  ).length;

  if (aiQuestionsCount > 0) {
    const aiLimitCheck = await checkAIGenerationLimit(user.id);
    if (!aiLimitCheck.canGenerate) {
      return { 
        success: false, 
        error: `AI grading limit reached (${aiLimitCheck.current}/${aiLimitCheck.limit}). Please upgrade to Pro for more AI-powered features.`,
        limitReached: true,
        usage: { current: aiLimitCheck.current, limit: aiLimitCheck.limit }
      };
    }
  }

  try {
    const results = await testSessionService.gradeAnswersOptimized(data.answers);
    
    return { 
      success: true, 
      data: [
        ...results.individual_grades.map((grade) => ({
          score: grade.score,
          feedback: grade.feedback,
        })),
        {
          score: 0,
          feedback: results.overall_feedback
        }
      ],
      // Include metadata about grading efficiency
      metadata: results.grading_metadata
    };
  } catch (error) {
    console.error('Grade answers optimized error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to grade answers',
    };
  }
}

/**
 * Grade answers using AI (legacy method for backward compatibility)
 */
export async function gradeAnswersAction(data: {
  answers: Array<{
    question: string;
    user_answer: string;
    expected_answer: string;
  }>;
}) {
  const supabase = getSupabaseServerClient();
  const result = await requireUser(supabase);
  const testSessionService = new TestSessionService(supabase);

  if (result.error || !result.data) {
    return { success: false, error: 'User not authenticated' };
  }

  const user = result.data;

  // Check AI generation limit before grading
  const aiLimitCheck = await checkAIGenerationLimit(user.id);
  if (!aiLimitCheck.canGenerate) {
    return { 
      success: false, 
      error: `AI generation limit reached (${aiLimitCheck.current}/${aiLimitCheck.limit}). Please upgrade to Pro for more AI generations.`,
      limitReached: true,
      usage: { current: aiLimitCheck.current, limit: aiLimitCheck.limit }
    };
  }

  try {
    const results = await testSessionService.gradeAnswers(data.answers);
    
    return { 
      success: true, 
      data: [
        ...results.individual_grades.map((grade: any) => ({
          score: grade.score,
          feedback: grade.feedback,
        })),
        {
          score: 0,
          feedback: results.overall_feedback
        }
      ]
    };
  } catch (error) {
    console.error('Grade answers error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to grade answers',
    };
  }
}

/**
 * Grade test comprehensively with detailed analysis and topic performance
 */
export async function gradeTestComprehensiveAction(data: {
  test_session_id: string;
  answers: Array<{
    question_id: string;
    question: string;
    user_answer: string;
    expected_answer: string;
    question_type?: 'multiple_choice' | 'true_false' | 'open_ended';
    correct_answer?: number | boolean;
    options?: string[];
    explanation?: string;
  }>;
  time_spent_minutes: number;
}) {
  const supabase = getSupabaseServerClient();
  const result = await requireUser(supabase);
  const testSessionService = new TestSessionService(supabase);

  if (result.error || !result.data) {
    return { success: false, error: 'User not authenticated' };
  }

  const user = result.data;

  // Check AI generation limit before comprehensive grading
  const aiLimitCheck = await checkAIGenerationLimit(user.id);
  if (!aiLimitCheck.canGenerate) {
    return { 
      success: false, 
      error: `AI generation limit reached (${aiLimitCheck.current}/${aiLimitCheck.limit}). Please upgrade to Pro for comprehensive analysis.`,
      limitReached: true,
      usage: { current: aiLimitCheck.current, limit: aiLimitCheck.limit }
    };
  }

  try {
    // Perform comprehensive grading with multi-step analysis
    const comprehensiveResults = await testSessionService.gradeTestComprehensive(data.answers);
    
    // Update the results with session info
    comprehensiveResults.test_session_id = data.test_session_id;
    comprehensiveResults.time_spent_minutes = data.time_spent_minutes;
    comprehensiveResults.completion_date = new Date().toISOString();
    
    // Transform results into progressive disclosure hierarchy for cognitive load reduction
    const aiGradingService = new AIGradingService();
    const transformedResults = aiGradingService.transformToProgressiveDisclosure(comprehensiveResults);
    
    // Save test history to database
    try {
      const testHistoryService = new TestHistoryService(supabase);
      
      // Prepare questions data for history
      const questionsForHistory = data.answers.map(answer => ({
        question: answer.question,
        question_type: answer.question_type || 'open_ended' as const,
        options: answer.options,
        correct_answer: answer.correct_answer,
        explanation: answer.explanation,
      }));
      
      // Prepare results data for history
      const resultsForHistory = {
        individual_grades: comprehensiveResults.individual_questions.map((q, index) => {
          const answer = data.answers[index];
          return {
            id: `response-${index}`,
            question_text: answer?.question || 'Unknown question',
            user_response: answer?.user_answer || '',
            ai_score: q.individual_score,
            ai_feedback: q.detailed_feedback,
            is_correct: q.individual_score >= 60,
            question_type: answer?.question_type || 'open_ended',
            question_options: answer?.options || [],
            correct_answer: answer?.correct_answer,
            expected_answer: answer?.expected_answer || '',
            grading_method: answer?.question_type === 'multiple_choice' || answer?.question_type === 'true_false' 
              ? 'objective_grading_v1' 
              : 'ai_grading',
            response_time_seconds: null,
            created_at: new Date().toISOString(),
          };
        }),
        overall_feedback: comprehensiveResults.overall_analysis.grade_explanation || 'Test completed successfully',
        average_score: comprehensiveResults.overall_analysis.overall_percentage,
      };
      
      // Save to database
      await testHistoryService.saveCompleteTestSession(user.id, {
        session_id: data.test_session_id,
        questions: questionsForHistory,
        results: resultsForHistory,
        overall_analysis: comprehensiveResults.overall_analysis,
        grading_metadata: {
          grading_method: 'comprehensive_with_optimized',
          model_version: 'gemini_v1',
          total_questions: data.answers.length,
          objective_questions: data.answers.filter(a => 
            (a.question_type === 'multiple_choice' && typeof a.correct_answer === 'number') ||
            (a.question_type === 'true_false' && typeof a.correct_answer === 'boolean')
          ).length,
          ai_graded_questions: data.answers.filter(a => 
            !(a.question_type === 'multiple_choice' && typeof a.correct_answer === 'number') &&
            !(a.question_type === 'true_false' && typeof a.correct_answer === 'boolean')
          ).length,
          processing_time_ms: Date.now() // This would be better calculated properly
        },
      });
      
      console.log('✅ Test history saved successfully');
    } catch (historyError) {
      console.error('Failed to save test history:', historyError);
      // Don't fail the whole request if history saving fails
    }
    
    return { 
      success: true, 
      data: transformedResults
    };
  } catch (error) {
    console.error('Comprehensive grade test error:', error);
    
    // Fallback to basic grading if comprehensive fails
    try {
      console.log('Falling back to basic grading...');
      const basicAnswers = data.answers.map(a => ({
        question: a.question,
        user_answer: a.user_answer,
        expected_answer: a.expected_answer,
      }));
      
      const basicResults = await testSessionService.gradeAnswers(basicAnswers);
      
      return {
        success: true,
        data: {
          overall_analysis: {
            overall_grade: 'C' as const,
            overall_percentage: Math.round(basicResults.individual_grades.reduce((sum: number, grade: any) => sum + grade.score, 0) / basicResults.individual_grades.length),
            grade_explanation: 'Basic grading completed. Detailed analysis unavailable.',
            topic_breakdown: [],
            strengths_summary: ['Completed the test'],
            weaknesses_summary: ['Detailed analysis unavailable'],
            priority_study_areas: ['Review all material'],
            improvement_recommendations: ['Practice more questions', 'Study regularly'],
            study_plan_suggestions: ['Review course materials', 'Take practice tests'],
            confidence_assessment: 50,
          },
          individual_questions: data.answers.map((answer, index) => ({
            question_id: answer.question_id,
            question_text: answer.question,
            user_answer: answer.user_answer,
            expected_answer: answer.expected_answer,
            individual_score: basicResults.individual_grades[index]?.score || 0,
            individual_grade: (basicResults.individual_grades[index]?.score || 0) >= 80 ? 'B' : 
                            (basicResults.individual_grades[index]?.score || 0) >= 70 ? 'C' :
                            (basicResults.individual_grades[index]?.score || 0) >= 60 ? 'D' : 'F',
            detailed_feedback: basicResults.individual_grades[index]?.feedback || 'Feedback unavailable',
            topic_areas: ['General'],
            specific_mistakes: ['Analysis unavailable'],
            what_went_well: ['Provided an answer'],
            improvement_tips: ['Study more', 'Practice similar questions'],
            confidence_level: 50,
          })),
          time_spent_minutes: data.time_spent_minutes,
          completion_date: new Date().toISOString(),
          test_session_id: data.test_session_id,
        },
        fallback: true
      };
    } catch (fallbackError) {
      console.error('Fallback grading also failed:', fallbackError);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to grade test comprehensively',
      };
    }
  }
}

/**
 * Complete a test session
 */
export async function completeTestSessionAction(
  sessionId: string,
  timeSpentSeconds: number,
) {
  const supabase = getSupabaseServerClient();
  const result = await requireUser(supabase);
  const testSessionService = new TestSessionService(supabase);

  if (result.error || !result.data) {
    return { success: false, error: 'User not authenticated' };
  }

  const user = result.data;

  try {
    const session = await testSessionService.updateTestSession(sessionId, user.id, {
      status: 'completed',
      time_spent_seconds: timeSpentSeconds,
      completed_at: new Date().toISOString(),
    });

    revalidatePath(`/home/decks/${session.deck_id}/analytics`);
    return { success: true, session };
  } catch (error) {
    console.error('Complete test session error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to complete test session',
    };
  }
}

/**
 * Get user performance analytics
 */
export async function getUserPerformanceAction(deckId?: string) {
  const supabase = getSupabaseServerClient();
  const result = await requireUser(supabase);
  const testSessionService = new TestSessionService(supabase);

  if (result.error || !result.data) {
    return { success: false, error: 'User not authenticated' };
  }

  const user = result.data;

  try {
    const analytics = await testSessionService.getUserPerformanceAnalytics(user.id, deckId);
    return { success: true, analytics };
  } catch (error) {
    console.error('Get user performance error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get performance analytics',
    };
  }
}

/**
 * Grade answers with optimized grading and save complete test history
 */
export async function gradeAnswersWithHistoryAction(data: {
  session_id: string;
  answers: Array<{
    question: string;
    user_answer: string;
    expected_answer: string;
    question_type?: 'multiple_choice' | 'true_false' | 'open_ended';
    correct_answer?: number | boolean;
    options?: string[];
    explanation?: string;
  }>;
  analysis?: any;
}) {
  const supabase = getSupabaseServerClient();
  const result = await requireUser(supabase);
  const testSessionService = new TestSessionService(supabase);

  if (result.error || !result.data) {
    return { success: false, error: 'User not authenticated' };
  }

  const user = result.data;

  // Only check AI generation limit for questions that will use AI grading
  const aiQuestionsCount = data.answers.filter(answer => 
    !(answer.question_type === 'multiple_choice' && typeof answer.correct_answer === 'number') &&
    !(answer.question_type === 'true_false' && typeof answer.correct_answer === 'boolean')
  ).length;

  if (aiQuestionsCount > 0) {
    const aiLimitCheck = await checkAIGenerationLimit(user.id);
    if (!aiLimitCheck.canGenerate) {
      return { 
        success: false, 
        error: `AI grading limit reached (${aiLimitCheck.current}/${aiLimitCheck.limit}). Please upgrade to Pro for more AI-powered features.`,
        limitReached: true,
        usage: { current: aiLimitCheck.current, limit: aiLimitCheck.limit }
      };
    }
  }

  try {
    // Grade the answers using optimized method
    const results = await testSessionService.gradeAnswersOptimized(data.answers);
    
    // Prepare questions data for history
    const questionsForHistory = data.answers.map(answer => ({
      question: answer.question,
      question_type: answer.question_type || 'open_ended' as const,
      options: answer.options,
      correct_answer: answer.correct_answer,
      explanation: answer.explanation,
    }));

    // Save test history asynchronously (don't block the response)
    testSessionService.saveTestHistoryOptimized(
      data.session_id,
      user.id,
      questionsForHistory,
      results,
      data.analysis
    ).catch(error => {
      console.error('Failed to save test history (non-blocking):', error);
    });

    return { 
      success: true, 
      data: [
        ...results.individual_grades.map((grade) => ({
          score: grade.score,
          feedback: grade.feedback,
        })),
        {
          score: 0,
          feedback: results.overall_feedback
        }
      ],
      // Include metadata about grading efficiency
      metadata: results.grading_metadata
    };
  } catch (error) {
    console.error('Grade answers with history error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to grade answers',
    };
  }
}

/**
 * Get test session analytics for a deck
 */
export async function getTestSessionAnalyticsAction(deckId: string) {
  const supabase = getSupabaseServerClient();
  const result = await requireUser(supabase);
  const testSessionService = new TestSessionService(supabase);

  if (result.error || !result.data) {
    return { success: false, error: 'User not authenticated' };
  }

  const user = result.data;

  try {
    const analytics = await testSessionService.getTestSessionAnalytics(deckId, user.id);
    return { success: true, analytics };
  } catch (error) {
    console.error('Get test session analytics error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get test session analytics',
    };
  }
}