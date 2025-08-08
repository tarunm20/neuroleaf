'use server';

import { z } from 'zod';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { requireUser } from '@kit/supabase/require-user';
import { AIQuestionsService } from '../services/ai-questions.service';
import { AIGradingService } from '../services/ai-grading.service';

const GenerateQuestionsSchema = z.object({
  flashcards: z.array(z.object({
    id: z.string(),
    front_content: z.string(),
    back_content: z.string(),
  })),
  question_count: z.number().min(1).max(20),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
});

/**
 * Generate AI questions from flashcards
 */
export async function generateQuestionsAction(
  data: z.infer<typeof GenerateQuestionsSchema>,
) {
  const supabase = getSupabaseServerClient();
  const { data: user } = await requireUser(supabase);

  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }

  try {
    const validatedData = GenerateQuestionsSchema.parse(data);
    const questionsService = new AIQuestionsService();
    
    const questions = await questionsService.generateQuestions(validatedData);
    
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
 * Grade answers using AI
 */
export async function gradeAnswersAction(data: {
  answers: Array<{
    question: string;
    user_answer: string;
    expected_answer: string;
  }>;
}) {
  const supabase = getSupabaseServerClient();
  const { data: user } = await requireUser(supabase);

  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }

  try {
    const gradingService = new AIGradingService();
    
    // Grade each answer individually
    const gradingPromises = data.answers.map(answer => 
      gradingService.gradeResponse({
        question: answer.question,
        expectedAnswer: answer.expected_answer,
        userResponse: answer.user_answer,
      })
    );
    
    const results = await Promise.all(gradingPromises);
    
    // Calculate overall feedback
    const avgScore = results.reduce((sum, result) => sum + result.score, 0) / results.length;
    const overallFeedback = avgScore >= 80 
      ? "Excellent work! You demonstrate strong understanding of the concepts."
      : avgScore >= 70
      ? "Good work! You show solid understanding with room for improvement."
      : avgScore >= 60
      ? "Fair performance. Review the material and focus on key concepts."
      : "Keep studying! Focus on understanding the core concepts better.";
    
    return { 
      success: true, 
      data: {
        individual_grades: results.map(result => ({
          score: result.score,
          feedback: result.feedback,
        })),
        overall_feedback: overallFeedback
      }
    };
  } catch (error) {
    console.error('Grade answers error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to grade answers',
    };
  }
}