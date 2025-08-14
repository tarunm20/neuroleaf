import { z } from 'zod';

// Question type enum (needs to be defined early as it's used in other schemas)
export const QuestionTypeSchema = z.enum(['open_ended', 'multiple_choice', 'true_false']);
export type QuestionType = z.infer<typeof QuestionTypeSchema>;

// Test mode enum
export const TestModeSchema = z.enum(['flashcard', 'ai_questions']);
export type TestMode = z.infer<typeof TestModeSchema>;

// Test session status
export const TestSessionStatusSchema = z.enum(['active', 'completed', 'abandoned']);
export type TestSessionStatus = z.infer<typeof TestSessionStatusSchema>;

// Create test session schema
export const CreateTestSessionSchema = z.object({
  deck_id: z.string().uuid(),
  test_mode: TestModeSchema,
  total_questions: z.number().min(1).max(100),
});
export type CreateTestSessionData = z.infer<typeof CreateTestSessionSchema>;

// Test session schema
export const TestSessionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  deck_id: z.string().uuid(),
  test_mode: TestModeSchema,
  total_questions: z.number(),
  questions_completed: z.number(),
  average_score: z.number().nullable(),
  time_spent_seconds: z.number(),
  status: TestSessionStatusSchema,
  started_at: z.string(),
  completed_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type TestSession = z.infer<typeof TestSessionSchema>;

// Test response schema
export const TestResponseSchema = z.object({
  id: z.string().uuid(),
  test_session_id: z.string().uuid(),
  flashcard_id: z.string().uuid().nullable(),
  question_text: z.string(),
  question_type: QuestionTypeSchema,
  question_data: z.record(z.any()).optional(), // Stores MCQ options, T/F statement, etc.
  expected_answer: z.string().nullable(),
  user_response: z.string(),
  user_answer_index: z.number().nullable(), // For MCQ answers
  user_answer_boolean: z.boolean().nullable(), // For T/F answers
  ai_score: z.number().min(0).max(100),
  ai_feedback: z.string(),
  ai_model_used: z.string().nullable(),
  response_time_seconds: z.number().nullable(),
  is_correct: z.boolean().nullable(),
  created_at: z.string(),
});
export type TestResponse = z.infer<typeof TestResponseSchema>;

// Create test response schema
export const CreateTestResponseSchema = z.object({
  test_session_id: z.string().uuid(),
  flashcard_id: z.string().uuid().optional(),
  question_text: z.string().min(1),
  question_type: QuestionTypeSchema,
  question_data: z.record(z.any()).optional(),
  expected_answer: z.string().optional(),
  user_response: z.string().min(1),
  user_answer_index: z.number().optional(),
  user_answer_boolean: z.boolean().optional(),
  response_time_seconds: z.number().optional(),
});
export type CreateTestResponseData = z.infer<typeof CreateTestResponseSchema>;

// Performance analytics schema
export const PerformanceAnalyticsSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  flashcard_id: z.string().uuid(),
  total_attempts: z.number(),
  correct_attempts: z.number(),
  average_score: z.number().nullable(),
  best_score: z.number().nullable(),
  latest_score: z.number().nullable(),
  mastery_level: z.number().min(0).max(100),
  is_mastered: z.boolean(),
  mastered_at: z.string().nullable(),
  first_attempt_at: z.string().nullable(),
  last_attempt_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type PerformanceAnalytics = z.infer<typeof PerformanceAnalyticsSchema>;

// AI grading response schema
export const AIGradingResponseSchema = z.object({
  score: z.number().min(0).max(100),
  feedback: z.string(),
  is_correct: z.boolean(),
  model_used: z.string(),
});
export type AIGradingResponse = z.infer<typeof AIGradingResponseSchema>;

// Base AI question schema
export const BaseAIQuestionSchema = z.object({
  question: z.string(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  type: QuestionTypeSchema,
});

// Multiple choice question schema
export const MultipleChoiceQuestionSchema = BaseAIQuestionSchema.extend({
  type: z.literal('multiple_choice'),
  options: z.array(z.string()).length(4),
  correct_answer: z.number().min(0).max(3),
  explanation: z.string(),
});
export type MultipleChoiceQuestion = z.infer<typeof MultipleChoiceQuestionSchema>;

// True/False question schema
export const TrueFalseQuestionSchema = BaseAIQuestionSchema.extend({
  type: z.literal('true_false'),
  statement: z.string(),
  correct_answer: z.boolean(),
  explanation: z.string(),
});
export type TrueFalseQuestion = z.infer<typeof TrueFalseQuestionSchema>;

// Open-ended question schema (existing)
export const OpenEndedQuestionSchema = BaseAIQuestionSchema.extend({
  type: z.literal('open_ended'),
  suggested_answer: z.string().optional(),
});
export type OpenEndedQuestion = z.infer<typeof OpenEndedQuestionSchema>;

// Union of all question types
export const AIQuestionSchema = z.discriminatedUnion('type', [
  OpenEndedQuestionSchema,
  MultipleChoiceQuestionSchema,
  TrueFalseQuestionSchema,
]);
export type AIQuestion = z.infer<typeof AIQuestionSchema>;

// Question distribution schema
export const QuestionDistributionSchema = z.object({
  multiple_choice: z.number().min(0),
  true_false: z.number().min(0),
  open_ended: z.number().min(0),
});
export type QuestionDistribution = z.infer<typeof QuestionDistributionSchema>;

// Generate questions request schema
export const GenerateQuestionsSchema = z.object({
  flashcards: z.array(z.object({
    id: z.string().uuid(),
    front_content: z.string(),
    back_content: z.string(),
  })),
  question_count: z.number().min(1).max(50),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  distribution: QuestionDistributionSchema.optional(),
});
export type GenerateQuestionsData = z.infer<typeof GenerateQuestionsSchema>;

// Topic performance analysis schema
export const TopicPerformanceSchema = z.object({
  topic: z.string(),
  performance: z.enum(['excellent', 'good', 'fair', 'poor']),
  understanding_level: z.number().min(0).max(100),
  specific_gaps: z.array(z.string()),
  strengths: z.array(z.string()),
});
export type TopicPerformance = z.infer<typeof TopicPerformanceSchema>;

// Comprehensive grading response schema
export const ComprehensiveGradingResponseSchema = z.object({
  score: z.number().min(0).max(100),
  feedback: z.string(),
  is_correct: z.boolean(),
  model_used: z.string(),
  topic_analysis: z.array(TopicPerformanceSchema),
  improvement_suggestions: z.array(z.string()),
  reasoning_chain: z.array(z.string()),
  confidence_level: z.number().min(0).max(100),
});
export type ComprehensiveGradingResponse = z.infer<typeof ComprehensiveGradingResponseSchema>;

// Overall test analysis schema
export const OverallTestAnalysisSchema = z.object({
  overall_grade: z.enum(['A', 'B', 'C', 'D', 'F']),
  overall_percentage: z.number().min(0).max(100),
  grade_explanation: z.string(),
  topic_breakdown: z.array(TopicPerformanceSchema),
  strengths_summary: z.array(z.string()),
  weaknesses_summary: z.array(z.string()),
  priority_study_areas: z.array(z.string()),
  improvement_recommendations: z.array(z.string()),
  study_plan_suggestions: z.array(z.string()),
  confidence_assessment: z.number().min(0).max(100),
});
export type OverallTestAnalysis = z.infer<typeof OverallTestAnalysisSchema>;

// Individual question analysis schema
export const QuestionAnalysisSchema = z.object({
  question_id: z.string(),
  question_text: z.string(),
  user_answer: z.string(),
  expected_answer: z.string().optional(),
  individual_score: z.number().min(0).max(100),
  individual_grade: z.enum(['A', 'B', 'C', 'D', 'F']),
  detailed_feedback: z.string(),
  topic_areas: z.array(z.string()),
  specific_mistakes: z.array(z.string()),
  what_went_well: z.array(z.string()),
  improvement_tips: z.array(z.string()),
  confidence_level: z.number().min(0).max(100),
});
export type QuestionAnalysis = z.infer<typeof QuestionAnalysisSchema>;

// Progressive disclosure feedback hierarchy schema
export const FeedbackHierarchySchema = z.object({
  // Primary: Hero section with key insight (always visible)
  primary: z.object({
    grade: z.enum(['A', 'B', 'C', 'D', 'F']),
    percentage: z.number().min(0).max(100),
    key_insight: z.string(), // Single most important takeaway
    celebration_message: z.string(), // Motivation-first positive message
  }),
  
  // Secondary: At-a-glance summary (tab 1 - default view)
  at_glance: z.object({
    performance_summary: z.string(),
    primary_strength: z.string(),
    primary_improvement: z.string(),
    quick_stats: z.object({
      strong_answers: z.number(),
      total_questions: z.number(),
      confidence_level: z.number().min(0).max(100),
    }),
  }),
  
  // Tertiary: Topic breakdown (tab 2 - expandable)
  topics: z.object({
    main_topics: z.array(TopicPerformanceSchema).max(5), // Limit to 5 topics max
    topic_summary: z.string(),
  }),
  
  // Quaternary: Growth plan (tab 3 - actionable)
  growth_plan: z.object({
    priority_areas: z.array(z.string()).max(3), // Max 3 priority areas
    action_steps: z.array(z.string()).max(4), // Max 4 action steps
    study_tips: z.array(z.string()).max(3), // Max 3 study tips
  }),
  
  // Advanced: Question details (tab 4 - progressive disclosure)
  question_details: z.array(QuestionAnalysisSchema),
});
export type FeedbackHierarchy = z.infer<typeof FeedbackHierarchySchema>;

// Complete test results schema with progressive disclosure support
export const CompleteTestResultsSchema = z.object({
  overall_analysis: OverallTestAnalysisSchema,
  individual_questions: z.array(QuestionAnalysisSchema),
  time_spent_minutes: z.number(),
  completion_date: z.string(),
  test_session_id: z.string().uuid(),
  
  // New progressive disclosure structure
  feedback_hierarchy: FeedbackHierarchySchema.optional(),
});
export type CompleteTestResults = z.infer<typeof CompleteTestResultsSchema>;