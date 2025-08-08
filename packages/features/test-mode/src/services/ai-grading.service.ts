import { createGeminiClient } from '@kit/ai/gemini';
import type { AIGradingResponse, FeedbackHierarchy, CompleteTestResults, OverallTestAnalysis, QuestionAnalysis } from '../schemas';

export interface GradingRequest {
  question: string;
  expectedAnswer?: string;
  userResponse: string;
  context?: string;
}

export interface TopicAnalysis {
  topic: string;
  performance: 'excellent' | 'good' | 'fair' | 'poor';
  understanding_level: number; // 0-100
  specific_gaps: string[];
  strengths: string[];
}

export interface ComprehensiveGradingResponse extends AIGradingResponse {
  topic_analysis: TopicAnalysis[];
  improvement_suggestions: string[];
  reasoning_chain: string[];
  confidence_level: number; // 0-100
}

export class AIGradingService {
  private ai: ReturnType<typeof createGeminiClient>;

  constructor() {
    this.ai = createGeminiClient();
  }

  /**
   * Grade a user's response using AI with comprehensive analysis
   */
  async gradeResponse({
    question,
    expectedAnswer,
    userResponse,
    context,
  }: GradingRequest): Promise<AIGradingResponse> {
    try {
      const prompt = this.buildGradingPrompt({
        question,
        expectedAnswer,
        userResponse,
        context,
      });

      const response = await this.ai.generateContent(prompt);
      const text = response.text;

      // Parse the AI response
      const result = this.parseGradingResponse(text);
      
      return {
        ...result,
        model_used: 'gemini-1.5-pro',
      };
    } catch (error) {
      console.error('AI grading error:', error);
      // Fallback to basic scoring
      return this.getFallbackGrading(expectedAnswer, userResponse);
    }
  }

  /**
   * Grade a user's response with comprehensive analysis using research-based prompts
   */
  async gradeResponseComprehensive({
    question,
    expectedAnswer,
    userResponse,
    context,
  }: GradingRequest): Promise<ComprehensiveGradingResponse> {
    try {
      const prompt = this.buildComprehensiveGradingPrompt({
        question,
        expectedAnswer,
        userResponse,
        context,
      });

      const response = await this.ai.generateContent(prompt);
      const text = response.text;

      // Parse the comprehensive AI response
      const result = this.parseComprehensiveGradingResponse(text);
      
      return {
        ...result,
        model_used: 'gemini-1.5-pro',
      };
    } catch (error) {
      console.error('Comprehensive AI grading error:', error);
      // Fallback to basic grading
      const basicGrading = await this.gradeResponse({
        question,
        expectedAnswer,
        userResponse,
        context,
      });
      
      return {
        ...basicGrading,
        topic_analysis: [{
          topic: 'General Knowledge',
          performance: basicGrading.score >= 80 ? 'good' : basicGrading.score >= 60 ? 'fair' : 'poor',
          understanding_level: basicGrading.score,
          specific_gaps: ['Unable to analyze due to AI service error'],
          strengths: basicGrading.score >= 70 ? ['Shows basic understanding'] : [],
        }],
        improvement_suggestions: ['Review the material and try again'],
        reasoning_chain: ['Fallback analysis due to service error'],
        confidence_level: 50,
      };
    }
  }

  /**
   * Build the prompt for AI grading
   */
  private buildGradingPrompt({
    question,
    expectedAnswer,
    userResponse,
    context,
  }: GradingRequest): string {
    const basePrompt = `You are an expert tutor grading a student's response. Provide a score from 0-100 and constructive feedback.

QUESTION: ${question}

${expectedAnswer ? `EXPECTED ANSWER: ${expectedAnswer}` : ''}

STUDENT'S RESPONSE: ${userResponse}

${context ? `CONTEXT: ${context}` : ''}

Please respond in the following JSON format:
{
  "score": <number 0-100>,
  "feedback": "<constructive feedback explaining the score and how to improve>",
  "is_correct": <boolean>
}

Grading Criteria:
- 90-100: Excellent understanding, complete and accurate
- 80-89: Good understanding, mostly correct with minor issues
- 70-79: Fair understanding, correct main points but missing details
- 60-69: Basic understanding, some correct elements but significant gaps
- 50-59: Limited understanding, major misconceptions
- 0-49: Incorrect or no meaningful understanding

Provide specific, actionable feedback that helps the student improve their understanding.`;

    return basePrompt;
  }

  /**
   * Build comprehensive grading prompt using cognitive load reduction principles
   * Focuses on 3-5 key insights to prevent information overload
   */
  private buildComprehensiveGradingPrompt({
    question,
    expectedAnswer,
    userResponse,
    context,
  }: GradingRequest): string {
    return `You are an expert educator providing focused, learner-friendly assessment feedback.

QUESTION: ${question}
${expectedAnswer ? `EXPECTED RESPONSE: ${expectedAnswer}` : ''}
STUDENT'S ANSWER: ${userResponse}
${context ? `CONTEXT: ${context}` : ''}

ANALYSIS FRAMEWORK:
Apply cognitive load theory - provide clear, chunked feedback focusing on the 3 most important insights.

1. PERFORMANCE ASSESSMENT:
   - Evaluate accuracy and understanding depth
   - Assign score (0-100) with clear reasoning
   - Identify the ONE primary strength
   - Identify the ONE key improvement area

2. TOPIC UNDERSTANDING:
   - Focus on 2-3 main topics maximum (avoid information overload)
   - Rate understanding level for each topic (0-100)
   - Note specific gaps and strengths concisely

3. ACTIONABLE GUIDANCE:
   - Provide exactly 3 improvement suggestions (research shows 3-7 optimal chunk size)
   - Lead with positive feedback (motivation-first design)
   - Focus on next steps, not comprehensive analysis

OUTPUT FORMAT (JSON):
{
  "score": <0-100>,
  "feedback": "<concise, encouraging explanation of performance>",
  "is_correct": <boolean>,
  "topic_analysis": [
    {
      "topic": "<main concept>",
      "performance": "<excellent|good|fair|poor>",
      "understanding_level": <0-100>,
      "specific_gaps": ["<most important gap>"],
      "strengths": ["<key strength>"]
    }
  ],
  "improvement_suggestions": [
    "<actionable tip 1>",
    "<actionable tip 2>", 
    "<actionable tip 3>"
  ],
  "reasoning_chain": [
    "Assessment: <brief reasoning>",
    "Key insight: <main takeaway>",
    "Next step: <priority action>"
  ],
  "confidence_level": <0-100>
}

GRADING SCALE:
90-100: Excellent mastery  |  80-89: Good understanding  |  70-79: Fair grasp
60-69: Basic knowledge     |  50-59: Limited understanding |  0-49: Needs review

FEEDBACK PRINCIPLES:
✓ Start with positive observations (motivation-first)
✓ Use simple, clear language (8th grade level)
✓ Limit to 3-5 key points maximum (cognitive load theory)
✓ Focus on actionable next steps, not exhaustive analysis
✓ Chunk information into digestible segments`;
  }

  /**
   * Parse the AI response to extract score and feedback
   */
  private parseGradingResponse(aiResponse: string): Omit<AIGradingResponse, 'model_used'> {
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          score: Math.max(0, Math.min(100, parsed.score || 0)),
          feedback: parsed.feedback || 'No feedback provided.',
          is_correct: Boolean(parsed.is_correct),
        };
      }

      // Fallback parsing if JSON is not found
      const scoreMatch = aiResponse.match(/score[\":\s]*(\d+)/i);
      const score = scoreMatch ? parseInt(scoreMatch[1]!, 10) : 0;

      return {
        score: Math.max(0, Math.min(100, score)),
        feedback: aiResponse.length > 0 ? aiResponse : 'Unable to process response.',
        is_correct: score >= 70,
      };
    } catch (error) {
      console.error('Error parsing AI grading response:', error);
      return {
        score: 0,
        feedback: 'Error processing AI response. Please try again.',
        is_correct: false,
      };
    }
  }

  /**
   * Parse comprehensive AI response for detailed analysis
   */
  private parseComprehensiveGradingResponse(aiResponse: string): Omit<ComprehensiveGradingResponse, 'model_used'> {
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Validate and sanitize the parsed response
        const topicAnalysis: TopicAnalysis[] = Array.isArray(parsed.topic_analysis) 
          ? parsed.topic_analysis.map((topic: any) => ({
              topic: topic.topic || 'Unknown Topic',
              performance: ['excellent', 'good', 'fair', 'poor'].includes(topic.performance) 
                ? topic.performance : 'fair',
              understanding_level: Math.max(0, Math.min(100, topic.understanding_level || 0)),
              specific_gaps: Array.isArray(topic.specific_gaps) ? topic.specific_gaps : [],
              strengths: Array.isArray(topic.strengths) ? topic.strengths : [],
            }))
          : [{
              topic: 'General Knowledge',
              performance: parsed.score >= 80 ? 'good' : parsed.score >= 60 ? 'fair' : 'poor',
              understanding_level: parsed.score || 0,
              specific_gaps: ['Analysis unavailable'],
              strengths: parsed.score >= 70 ? ['Shows understanding'] : [],
            }];

        const improvementSuggestions = Array.isArray(parsed.improvement_suggestions) 
          ? parsed.improvement_suggestions 
          : ['Review the material and practice more'];

        const reasoningChain = Array.isArray(parsed.reasoning_chain) 
          ? parsed.reasoning_chain 
          : ['Basic analysis performed'];

        return {
          score: Math.max(0, Math.min(100, parsed.score || 0)),
          feedback: parsed.feedback || 'Comprehensive feedback unavailable.',
          is_correct: Boolean(parsed.is_correct),
          topic_analysis: topicAnalysis,
          improvement_suggestions: improvementSuggestions,
          reasoning_chain: reasoningChain,
          confidence_level: Math.max(0, Math.min(100, parsed.confidence_level || 50)),
        };
      }

      // Fallback if JSON parsing fails
      const scoreMatch = aiResponse.match(/score[\":\s]*(\d+)/i);
      const score = scoreMatch ? parseInt(scoreMatch[1]!, 10) : 0;

      return {
        score: Math.max(0, Math.min(100, score)),
        feedback: aiResponse.length > 0 ? aiResponse : 'Unable to process comprehensive response.',
        is_correct: score >= 70,
        topic_analysis: [{
          topic: 'General Knowledge',
          performance: score >= 80 ? 'good' : score >= 60 ? 'fair' : 'poor',
          understanding_level: score,
          specific_gaps: ['Detailed analysis unavailable'],
          strengths: score >= 70 ? ['Shows basic understanding'] : [],
        }],
        improvement_suggestions: ['Review the material thoroughly', 'Practice similar questions'],
        reasoning_chain: ['Fallback analysis due to parsing error'],
        confidence_level: 30,
      };
    } catch (error) {
      console.error('Error parsing comprehensive AI grading response:', error);
      return {
        score: 0,
        feedback: 'Error processing comprehensive AI response. Please try again.',
        is_correct: false,
        topic_analysis: [{
          topic: 'Error Analysis',
          performance: 'poor',
          understanding_level: 0,
          specific_gaps: ['System error occurred'],
          strengths: [],
        }],
        improvement_suggestions: ['Try again later', 'Contact support if issue persists'],
        reasoning_chain: ['Error in AI response processing'],
        confidence_level: 0,
      };
    }
  }

  /**
   * Fallback grading when AI is not available
   */
  private getFallbackGrading(
    expectedAnswer?: string,
    userResponse?: string,
  ): AIGradingResponse {
    if (!userResponse || userResponse.trim().length === 0) {
      return {
        score: 0,
        feedback: 'No response provided.',
        is_correct: false,
        model_used: 'fallback',
      };
    }

    if (!expectedAnswer) {
      return {
        score: 50,
        feedback: 'Response recorded. Unable to grade automatically without expected answer.',
        is_correct: false,
        model_used: 'fallback',
      };
    }

    // Simple text similarity fallback
    const similarity = this.calculateSimpleSimilarity(
      expectedAnswer.toLowerCase(),
      userResponse.toLowerCase(),
    );

    const score = Math.round(similarity * 100);
    const isCorrect = similarity > 0.6;

    return {
      score,
      feedback: isCorrect
        ? 'Your response shows good understanding of the concept.'
        : 'Your response needs improvement. Review the material and try to be more specific.',
      is_correct: isCorrect,
      model_used: 'fallback',
    };
  }

  /**
   * Transform comprehensive test results into progressive disclosure hierarchy
   * Applies cognitive load reduction by chunking information into digestible segments
   */
  transformToProgressiveDisclosure(results: CompleteTestResults): CompleteTestResults {
    const { overall_analysis, individual_questions, time_spent_minutes, completion_date, test_session_id } = results;
    
    // Create feedback hierarchy with cognitive load principles
    const feedback_hierarchy: FeedbackHierarchy = {
      // Primary: Hero section (always visible)
      primary: {
        grade: overall_analysis.overall_grade,
        percentage: overall_analysis.overall_percentage,
        key_insight: this.extractKeyInsight(overall_analysis),
        celebration_message: this.createCelebrationMessage(overall_analysis),
      },
      
      // Secondary: At-a-glance (default tab)
      at_glance: {
        performance_summary: overall_analysis.grade_explanation,
        primary_strength: overall_analysis.strengths_summary[0] || 'Completed the assessment',
        primary_improvement: overall_analysis.weaknesses_summary[0] || 'Continue practicing',
        quick_stats: {
          strong_answers: individual_questions.filter(q => q.individual_score >= 80).length,
          total_questions: individual_questions.length,
          confidence_level: overall_analysis.confidence_assessment,
        },
      },
      
      // Tertiary: Topic breakdown (limited to 5 topics)
      topics: {
        main_topics: overall_analysis.topic_breakdown.slice(0, 5),
        topic_summary: this.createTopicSummary(overall_analysis.topic_breakdown),
      },
      
      // Quaternary: Growth plan (actionable steps)
      growth_plan: {
        priority_areas: overall_analysis.priority_study_areas.slice(0, 3),
        action_steps: overall_analysis.improvement_recommendations.slice(0, 4),
        study_tips: overall_analysis.study_plan_suggestions.slice(0, 3),
      },
      
      // Advanced: Question details (progressive disclosure)
      question_details: individual_questions,
    };
    
    return {
      ...results,
      feedback_hierarchy,
    };
  }

  /**
   * Extract the single most important insight for the hero section
   */
  private extractKeyInsight(analysis: OverallTestAnalysis): string {
    const { overall_percentage, strengths_summary, weaknesses_summary } = analysis;
    
    if (overall_percentage >= 90) {
      return "Excellent mastery demonstrated across all areas!";
    } else if (overall_percentage >= 80) {
      return `Strong performance with room to excel in ${weaknesses_summary[0] || 'advanced topics'}`;
    } else if (overall_percentage >= 70) {
      return `Good foundation established. Focus on ${weaknesses_summary[0] || 'key concepts'}`;
    } else if (overall_percentage >= 60) {
      return `Basic understanding shown. Strengthen ${weaknesses_summary[0] || 'fundamental concepts'}`;
    } else {
      return `Great effort! Build confidence with ${strengths_summary[0] || 'consistent practice'}`;
    }
  }

  /**
   * Create motivation-first celebration message
   */
  private createCelebrationMessage(analysis: OverallTestAnalysis): string {
    const { overall_percentage, overall_grade } = analysis;
    
    const celebrationMap = {
      'A': ['🎉 Outstanding work!', '⭐ Exceptional performance!', '🏆 Excellence achieved!'],
      'B': ['👏 Great job!', '✨ Well done!', '🎯 Strong performance!'],
      'C': ['💪 Good effort!', '📈 You\'re learning!', '🌟 Keep improving!'],
      'D': ['👍 Nice try!', '🌱 Growing stronger!', '💡 Learning in progress!'],
      'F': ['🚀 Ready to improve!', '💫 Every expert was once a beginner!', '🎓 Learning journey continues!'],
    };
    
    const validGrade = overall_grade || 'C';
    const messages = celebrationMap[validGrade as keyof typeof celebrationMap] || celebrationMap['C'];
    const selectedMessage = messages[Math.floor(Math.random() * messages.length)];
    return selectedMessage || '🎓 Keep learning and growing!';
  }

  /**
   * Create concise topic summary (cognitive load reduction)
   */
  private createTopicSummary(topics: any[]): string {
    if (topics.length === 0) return 'Assessment completed successfully.';
    
    const excellentTopics = topics.filter(t => t.performance === 'excellent').length;
    const goodTopics = topics.filter(t => t.performance === 'good').length;
    const needsWork = topics.filter(t => ['fair', 'poor'].includes(t.performance)).length;
    
    if (excellentTopics > goodTopics + needsWork) {
      return `Excellent understanding in ${excellentTopics} areas. ${needsWork > 0 ? `Focus on ${needsWork} topics for improvement.` : ''}`;
    } else if (goodTopics > 0) {
      return `Good grasp of ${goodTopics} concepts. ${needsWork > 0 ? `${needsWork} areas need attention.` : ''}`;
    } else {
      return `${topics.length} topics reviewed. Focus on strengthening fundamental understanding.`;
    }
  }

  /**
   * Calculate simple text similarity (basic implementation)
   */
  private calculateSimpleSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.split(/\s+/));
    const words2 = new Set(text2.split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }
}