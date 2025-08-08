import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@kit/supabase/database';
import type {
  CreateTestSessionData,
  TestSession,
  CreateTestResponseData,
  TestResponse,
  PerformanceAnalytics,
  CompleteTestResults,
  OverallTestAnalysis,
  QuestionAnalysis,
  TopicPerformance,
} from '../schemas';
import { AIGradingService, ComprehensiveGradingResponse } from '../services/ai-grading.service';
import { AIQuestionsService } from '../services/ai-questions.service';

type Client = SupabaseClient<Database>;

export class TestSessionService {
  constructor(
    private readonly supabase: Client,
    private readonly aiGrading = new AIGradingService(),
    private readonly aiQuestions = new AIQuestionsService(),
  ) {}

  /**
   * Create a new test session
   */
  async createTestSession(
    data: CreateTestSessionData,
    userId: string,
  ): Promise<TestSession> {
    const { data: session, error } = await this.supabase
      .from('test_sessions')
      .insert({
        user_id: userId,
        deck_id: data.deck_id,
        test_mode: data.test_mode,
        total_questions: data.total_questions,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating test session:', error);
      throw new Error(`Failed to create test session: ${error.message}`);
    }

    return session as TestSession;
  }

  /**
   * Get test session by ID
   */
  async getTestSession(sessionId: string, userId: string): Promise<TestSession | null> {
    const { data: session, error } = await this.supabase
      .from('test_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching test session:', error);
      return null;
    }

    return session as TestSession;
  }

  /**
   * Update test session (completion, score, etc.)
   */
  async updateTestSession(
    sessionId: string,
    userId: string,
    updates: Partial<{
      questions_completed: number;
      average_score: number;
      time_spent_seconds: number;
      status: 'active' | 'completed' | 'abandoned';
      completed_at: string;
    }>,
  ): Promise<TestSession> {
    const { data: session, error } = await this.supabase
      .from('test_sessions')
      .update(updates)
      .eq('id', sessionId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating test session:', error);
      throw new Error(`Failed to update test session: ${error.message}`);
    }

    return session as TestSession;
  }

  /**
   * Submit a test response with AI grading
   */
  async submitTestResponse(
    data: CreateTestResponseData,
    userId: string,
  ): Promise<TestResponse> {
    // Get the test session to verify ownership
    const session = await this.getTestSession(data.test_session_id, userId);
    if (!session) {
      throw new Error('Test session not found or access denied');
    }

    // Grade the response using AI
    const grading = await this.aiGrading.gradeResponse({
      question: data.question_text,
      expectedAnswer: data.expected_answer,
      userResponse: data.user_response,
    });

    // Insert the test response
    const { data: response, error } = await this.supabase
      .from('test_responses')
      .insert({
        test_session_id: data.test_session_id,
        flashcard_id: data.flashcard_id || null,
        question_text: data.question_text,
        expected_answer: data.expected_answer || null,
        user_response: data.user_response,
        ai_score: grading.score,
        ai_feedback: grading.feedback,
        ai_model_used: grading.model_used,
        response_time_seconds: data.response_time_seconds || null,
        is_correct: grading.is_correct,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating test response:', error);
      throw new Error(`Failed to save test response: ${error.message}`);
    }

    // Update session progress
    await this.updateSessionProgress(data.test_session_id, userId);

    return response as TestResponse;
  }

  /**
   * Get test responses for a session
   */
  async getTestResponses(sessionId: string, userId: string): Promise<TestResponse[]> {
    // Verify session ownership
    const session = await this.getTestSession(sessionId, userId);
    if (!session) {
      throw new Error('Test session not found or access denied');
    }

    const { data: responses, error } = await this.supabase
      .from('test_responses')
      .select('*')
      .eq('test_session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching test responses:', error);
      throw new Error(`Failed to fetch test responses: ${error.message}`);
    }

    return (responses || []) as TestResponse[];
  }

  /**
   * Generate AI questions for a deck
   */
  async generateQuestionsForDeck(
    deckId: string,
    userId: string,
    questionCount: number = 10,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  ) {
    // Get flashcards for the deck
    const { data: flashcards, error } = await this.supabase
      .from('flashcards')
      .select('id, front_content, back_content')
      .eq('deck_id', deckId)
      .order('position');

    if (error) {
      console.error('Error fetching flashcards:', error);
      throw new Error(`Failed to fetch flashcards: ${error.message}`);
    }

    if (!flashcards || flashcards.length === 0) {
      throw new Error('No flashcards found in this deck');
    }

    // Generate AI questions
    const questions = await this.aiQuestions.generateQuestions({
      flashcards,
      question_count: Math.min(questionCount, flashcards.length * 2),
      difficulty,
    });

    return questions;
  }

  /**
   * Get user performance analytics for a deck
   */
  async getUserPerformanceAnalyticsOld(
    userId: string,
    deckId?: string,
  ): Promise<PerformanceAnalytics[]> {
    let query = this.supabase
      .from('performance_analytics')
      .select(`
        *,
        flashcards!inner(deck_id, front_content)
      `)
      .eq('user_id', userId);

    if (deckId) {
      query = query.eq('flashcards.deck_id', deckId);
    }

    const { data: analytics, error } = await query.order('mastery_level', { ascending: true });

    if (error) {
      console.error('Error fetching performance analytics:', error);
      throw new Error(`Failed to fetch performance analytics: ${error.message}`);
    }

    return (analytics || []) as PerformanceAnalytics[];
  }

  /**
   * Get user test sessions
   */
  async getUserTestSessions(
    userId: string,
    limit: number = 20,
  ): Promise<TestSession[]> {
    const { data: sessions, error } = await this.supabase
      .from('test_sessions')
      .select(`
        *,
        decks(name)
      `)
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching user test sessions:', error);
      throw new Error(`Failed to fetch test sessions: ${error.message}`);
    }

    return (sessions || []) as TestSession[];
  }

  /**
   * Update session progress after each response
   */
  private async updateSessionProgress(sessionId: string, userId: string): Promise<void> {
    // Get current responses for this session
    const { data: responses, error: responsesError } = await this.supabase
      .from('test_responses')
      .select('ai_score')
      .eq('test_session_id', sessionId);

    if (responsesError || !responses) {
      console.error('Error fetching responses for progress update:', responsesError);
      return;
    }

    const questionsCompleted = responses.length;
    const averageScore = responses.length > 0
      ? responses.reduce((sum: number, r: any) => sum + (r.ai_score || 0), 0) / responses.length
      : null;

    // Get session to check if it's complete
    const { data: session, error: sessionError } = await this.supabase
      .from('test_sessions')
      .select('total_questions')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      console.error('Error fetching session for progress update:', sessionError);
      return;
    }

    const isComplete = questionsCompleted >= session.total_questions;

    await this.updateTestSession(sessionId, userId, {
      questions_completed: questionsCompleted,
      average_score: averageScore || undefined,
      status: isComplete ? 'completed' : 'active',
      completed_at: isComplete ? new Date().toISOString() : undefined,
    });
  }

  /**
   * Create a test response (alias for submitTestResponse for compatibility)
   */
  async createTestResponse(data: CreateTestResponseData, userId: string): Promise<TestResponse> {
    return this.submitTestResponse(data, userId);
  }

  /**
   * Generate questions from flashcards using AI
   */
  async generateQuestionsFromFlashcards(
    flashcards: Array<{ id: string; front_content: string; back_content: string }>,
    questionCount: number,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium'
  ) {
    return this.aiQuestions.generateQuestions({
      flashcards,
      question_count: questionCount,
      difficulty,
    });
  }

  /**
   * Grade answers using AI (legacy method for backward compatibility)
   */
  async gradeAnswers(answers: Array<{
    question: string;
    user_answer: string;
    expected_answer: string;
  }>) {
    const gradingPromises = answers.map(answer => 
      this.aiGrading.gradeResponse({
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
      individual_grades: results,
      overall_feedback: overallFeedback
    };
  }

  /**
   * Comprehensive test grading with detailed analysis using multi-step chain-of-thought reasoning
   */
  async gradeTestComprehensive(answers: Array<{
    question_id: string;
    question: string;
    user_answer: string;
    expected_answer: string;
  }>): Promise<CompleteTestResults> {
    
    // Step 1: Grade individual questions with comprehensive analysis
    console.log('Step 1: Grading individual questions with comprehensive analysis...');
    const individualAnalyses = await this.gradeIndividualQuestions(answers);
    
    // Step 2: Perform cross-question topic analysis
    console.log('Step 2: Performing cross-question topic analysis...');
    const topicAnalysis = await this.performTopicAnalysis(individualAnalyses);
    
    // Step 3: Generate overall assessment and recommendations
    console.log('Step 3: Generating overall assessment and recommendations...');
    const overallAnalysis = await this.generateOverallAnalysis(individualAnalyses, topicAnalysis);
    
    // Step 4: Compile complete test results
    console.log('Step 4: Compiling complete test results...');
    return {
      overall_analysis: overallAnalysis,
      individual_questions: individualAnalyses,
      time_spent_minutes: 0, // This will be set by the calling function
      completion_date: new Date().toISOString(),
      test_session_id: '', // This will be set by the calling function
    };
  }

  /**
   * Step 1: Grade individual questions with comprehensive analysis
   */
  private async gradeIndividualQuestions(answers: Array<{
    question_id: string;
    question: string;
    user_answer: string;
    expected_answer: string;
  }>): Promise<QuestionAnalysis[]> {
    
    const gradingPromises = answers.map(async (answer) => {
      const comprehensiveGrading = await this.aiGrading.gradeResponseComprehensive({
        question: answer.question,
        expectedAnswer: answer.expected_answer,
        userResponse: answer.user_answer,
      });

      // Convert comprehensive grading to question analysis format
      return this.convertToQuestionAnalysis(answer, comprehensiveGrading);
    });

    return Promise.all(gradingPromises);
  }

  /**
   * Step 2: Perform cross-question topic analysis
   */
  private async performTopicAnalysis(individualAnalyses: QuestionAnalysis[]): Promise<TopicPerformance[]> {
    const topicMap = new Map<string, {
      scores: number[];
      gaps: string[];
      strengths: string[];
    }>();

    // Aggregate topic data from individual questions
    individualAnalyses.forEach(analysis => {
      analysis.topic_areas.forEach(topic => {
        if (!topicMap.has(topic)) {
          topicMap.set(topic, { scores: [], gaps: [], strengths: [] });
        }
        
        const topicData = topicMap.get(topic)!;
        topicData.scores.push(analysis.individual_score);
        topicData.gaps.push(...analysis.specific_mistakes);
        topicData.strengths.push(...analysis.what_went_well);
      });
    });

    // Convert to TopicPerformance array
    return Array.from(topicMap.entries()).map(([topic, data]) => {
      const avgScore = data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length;
      const performance: 'excellent' | 'good' | 'fair' | 'poor' = 
        avgScore >= 90 ? 'excellent' :
        avgScore >= 80 ? 'good' :
        avgScore >= 60 ? 'fair' : 'poor';

      return {
        topic,
        performance,
        understanding_level: Math.round(avgScore),
        specific_gaps: [...new Set(data.gaps)], // Remove duplicates
        strengths: [...new Set(data.strengths)], // Remove duplicates
      };
    });
  }

  /**
   * Step 3: Generate overall assessment and recommendations
   */
  private async generateOverallAnalysis(
    individualAnalyses: QuestionAnalysis[], 
    topicAnalysis: TopicPerformance[]
  ): Promise<OverallTestAnalysis> {
    
    // Calculate overall statistics
    const totalScore = individualAnalyses.reduce((sum, q) => sum + q.individual_score, 0);
    const averageScore = Math.round(totalScore / individualAnalyses.length);
    
    // Determine letter grade
    const letterGrade: 'A' | 'B' | 'C' | 'D' | 'F' = 
      averageScore >= 90 ? 'A' :
      averageScore >= 80 ? 'B' :
      averageScore >= 70 ? 'C' :
      averageScore >= 60 ? 'D' : 'F';

    // Generate grade explanation
    const gradeExplanation = this.generateGradeExplanation(letterGrade, averageScore, individualAnalyses.length);

    // Identify strengths and weaknesses
    const strongTopics = topicAnalysis.filter(t => t.performance === 'excellent' || t.performance === 'good');
    const weakTopics = topicAnalysis.filter(t => t.performance === 'poor' || t.performance === 'fair');

    const strengthsSummary = strongTopics.length > 0 
      ? strongTopics.map(t => `Strong understanding of ${t.topic}`)
      : ['Shows effort and engagement with the material'];

    const weaknessesSummary = weakTopics.length > 0
      ? weakTopics.map(t => `Needs improvement in ${t.topic}`)
      : ['Continue practicing to maintain strong performance'];

    // Priority study areas (worst performing topics)
    const priorityStudyAreas = topicAnalysis
      .sort((a, b) => a.understanding_level - b.understanding_level)
      .slice(0, 3)
      .map(t => t.topic);

    // Generate improvement recommendations
    const improvementRecommendations = this.generateImprovementRecommendations(weakTopics, averageScore);

    // Generate study plan suggestions
    const studyPlanSuggestions = this.generateStudyPlanSuggestions(topicAnalysis, averageScore);

    // Assess confidence (based on consistency of performance)
    const scoreVariance = this.calculateScoreVariance(individualAnalyses.map(q => q.individual_score));
    const confidenceAssessment = Math.max(50, 100 - scoreVariance);

    return {
      overall_grade: letterGrade,
      overall_percentage: averageScore,
      grade_explanation: gradeExplanation,
      topic_breakdown: topicAnalysis,
      strengths_summary: strengthsSummary,
      weaknesses_summary: weaknessesSummary,
      priority_study_areas: priorityStudyAreas,
      improvement_recommendations: improvementRecommendations,
      study_plan_suggestions: studyPlanSuggestions,
      confidence_assessment: Math.round(confidenceAssessment),
    };
  }

  /**
   * Helper: Convert comprehensive grading to question analysis format
   */
  private convertToQuestionAnalysis(
    answer: { question_id: string; question: string; user_answer: string; expected_answer: string },
    grading: ComprehensiveGradingResponse
  ): QuestionAnalysis {
    const letterGrade: 'A' | 'B' | 'C' | 'D' | 'F' = 
      grading.score >= 90 ? 'A' :
      grading.score >= 80 ? 'B' :
      grading.score >= 70 ? 'C' :
      grading.score >= 60 ? 'D' : 'F';

    return {
      question_id: answer.question_id,
      question_text: answer.question,
      user_answer: answer.user_answer,
      expected_answer: answer.expected_answer,
      individual_score: grading.score,
      individual_grade: letterGrade,
      detailed_feedback: grading.feedback,
      topic_areas: grading.topic_analysis.map(t => t.topic),
      specific_mistakes: grading.topic_analysis.flatMap(t => t.specific_gaps),
      what_went_well: grading.topic_analysis.flatMap(t => t.strengths),
      improvement_tips: grading.improvement_suggestions,
      confidence_level: grading.confidence_level,
    };
  }

  /**
   * Helper: Generate grade explanation
   */
  private generateGradeExplanation(grade: string, percentage: number, questionCount: number): string {
    const performanceLevel = 
      grade === 'A' ? 'excellent' :
      grade === 'B' ? 'good' :
      grade === 'C' ? 'fair' :
      grade === 'D' ? 'poor' : 'very poor';

    return `You achieved a ${grade} grade (${percentage}%) on this ${questionCount}-question test, demonstrating ${performanceLevel} understanding of the material.`;
  }

  /**
   * Helper: Generate improvement recommendations
   */
  private generateImprovementRecommendations(weakTopics: TopicPerformance[], averageScore: number): string[] {
    const recommendations: string[] = [];

    if (weakTopics.length > 0) {
      recommendations.push(`Focus on improving your understanding of: ${weakTopics.map(t => t.topic).join(', ')}`);
      
      const mostProblematicTopic = weakTopics.sort((a, b) => a.understanding_level - b.understanding_level)[0];
      if (mostProblematicTopic) {
        recommendations.push(`Priority: Review ${mostProblematicTopic.topic} - consider seeking additional help or resources`);
      }
    }

    if (averageScore < 70) {
      recommendations.push('Schedule regular study sessions and practice with similar questions');
      recommendations.push('Consider forming a study group or working with a tutor');
    } else if (averageScore < 85) {
      recommendations.push('Practice more challenging questions to deepen your understanding');
    }

    return recommendations.length > 0 ? recommendations : ['Continue your excellent work and maintain consistent study habits'];
  }

  /**
   * Helper: Generate study plan suggestions
   */
  private generateStudyPlanSuggestions(topicAnalysis: TopicPerformance[], averageScore: number): string[] {
    const suggestions: string[] = [];

    // Weekly study recommendations based on performance
    if (averageScore < 60) {
      suggestions.push('Dedicate 1-2 hours daily to reviewing fundamental concepts');
    } else if (averageScore < 80) {
      suggestions.push('Study 30-45 minutes daily focusing on weaker topic areas');
    } else {
      suggestions.push('Maintain current study routine with 15-30 minutes daily review');
    }

    // Topic-specific recommendations
    const weakTopics = topicAnalysis.filter(t => t.understanding_level < 70);
    if (weakTopics.length > 0) {
      suggestions.push(`Create flashcards or notes for: ${weakTopics.map(t => t.topic).join(', ')}`);
      suggestions.push('Take practice quizzes on your weakest topics weekly');
    }

    // Practice recommendations
    suggestions.push('Retake this test in 1-2 weeks to measure improvement');
    suggestions.push('Practice explaining concepts out loud to improve understanding');

    return suggestions;
  }

  /**
   * Helper: Calculate score variance for confidence assessment
   */
  private calculateScoreVariance(scores: number[]): number {
    if (scores.length <= 1) return 0;
    
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    
    return Math.sqrt(variance);
  }

  /**
   * Get performance analytics for a user
   */
  async getUserPerformanceAnalytics(userId: string, deckId?: string): Promise<any> {
    let query = this.supabase
      .from('test_sessions')
      .select(`
        *,
        test_responses(*)
      `)
      .eq('user_id', userId)
      .eq('status', 'completed');

    if (deckId) {
      query = query.eq('deck_id', deckId);
    }

    const { data: sessions, error } = await query;

    if (error) {
      console.error('Error fetching user performance:', error);
      throw new Error(`Failed to fetch performance analytics: ${error.message}`);
    }

    // Calculate analytics
    const totalSessions = sessions?.length || 0;
    const totalQuestions = sessions?.reduce((sum, s) => sum + (s.questions_completed || 0), 0) || 0;
    const averageScore = sessions?.reduce((sum, s) => sum + (s.average_score || 0), 0) / Math.max(totalSessions, 1) || 0;
    const totalTimeSpent = sessions?.reduce((sum, s) => sum + (s.time_spent_seconds || 0), 0) || 0;

    return {
      total_sessions: totalSessions,
      total_questions_answered: totalQuestions,
      average_score: averageScore,
      total_time_spent_minutes: Math.round(totalTimeSpent / 60),
      sessions_last_7_days: sessions?.filter(s => 
        s.created_at && new Date(s.created_at) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length || 0,
      improvement_trend: averageScore >= 70 ? 'improving' : 'needs_improvement'
    };
  }

  /**
   * Get test session analytics for a deck
   */
  async getTestSessionAnalytics(deckId: string, userId: string) {
    const { data: sessions, error } = await this.supabase
      .from('test_sessions')
      .select(`
        *,
        test_responses(*)
      `)
      .eq('deck_id', deckId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching test session analytics:', error);
      throw new Error(`Failed to fetch analytics: ${error.message}`);
    }

    return {
      total_sessions: sessions?.length || 0,
      recent_sessions: sessions?.slice(0, 5) || [],
      average_score: sessions?.reduce((sum, s) => sum + (s.average_score || 0), 0) / Math.max(sessions?.length || 1, 1) || 0,
      completion_rate: sessions?.filter(s => s.status === 'completed').length / Math.max(sessions?.length || 1, 1) * 100 || 0
    };
  }
}