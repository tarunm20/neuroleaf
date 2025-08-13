'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  TestTube, 
  Trophy,
  Clock,
  CheckCircle,
  Loader2,
  BookOpen,
  Zap
} from 'lucide-react';

// UI Components
import { Button } from '@kit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Progress } from '@kit/ui/progress';
import { Badge } from '@kit/ui/badge';
import { Textarea } from '@kit/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@kit/ui/tabs';

// Feature Components
import { useDeck } from '@kit/decks/hooks';
import { useFlashcards } from '@kit/flashcards/hooks';
import { useUser } from '@kit/supabase/hooks/use-user';
import { useSubscription } from '@kit/subscription/hooks';
import { generateQuestionsAction, gradeAnswersAction, gradeTestComprehensiveAction, createTestSessionAction } from '@kit/test-mode/server';

interface TestModePageProps {
  deckId: string;
  userId: string;
}

interface Question {
  id: string;
  question: string;
  flashcardId: string;
  expectedAnswer: string;
}

interface Answer {
  questionId: string;
  userAnswer: string;
  score?: number;
  feedback?: string;
  isCorrect?: boolean;
}

interface ComprehensiveTestResults {
  overall_analysis: {
    overall_grade: 'A' | 'B' | 'C' | 'D' | 'F';
    overall_percentage: number;
    grade_explanation: string;
    topic_breakdown: Array<{
      topic: string;
      performance: 'excellent' | 'good' | 'fair' | 'poor';
      understanding_level: number;
      specific_gaps: string[];
      strengths: string[];
    }>;
    strengths_summary: string[];
    weaknesses_summary: string[];
    priority_study_areas: string[];
    improvement_recommendations: string[];
    study_plan_suggestions: string[];
    confidence_assessment: number;
  };
  individual_questions: Array<{
    question_id: string;
    question_text: string;
    user_answer: string;
    expected_answer: string;
    individual_score: number;
    individual_grade: 'A' | 'B' | 'C' | 'D' | 'F';
    detailed_feedback: string;
    topic_areas: string[];
    specific_mistakes: string[];
    what_went_well: string[];
    improvement_tips: string[];
    confidence_level: number;
  }>;
  time_spent_minutes: number;
  completion_date: string;
  test_session_id: string;
  feedback_hierarchy?: {
    primary: {
      grade: 'A' | 'B' | 'C' | 'D' | 'F';
      percentage: number;
      key_insight: string;
      celebration_message: string;
    };
    at_glance: {
      performance_summary: string;
      primary_strength: string;
      primary_improvement: string;
      quick_stats: {
        strong_answers: number;
        total_questions: number;
        confidence_level: number;
      };
    };
    topics: {
      main_topics: Array<{
        topic: string;
        performance: 'excellent' | 'good' | 'fair' | 'poor';
        understanding_level: number;
        specific_gaps: string[];
        strengths: string[];
      }>;
      topic_summary: string;
    };
    growth_plan: {
      priority_areas: string[];
      action_steps: string[];
      study_tips: string[];
    };
    question_details: Array<{
      question_id: string;
      question_text: string;
      user_answer: string;
      expected_answer: string;
      individual_score: number;
      individual_grade: 'A' | 'B' | 'C' | 'D' | 'F';
      detailed_feedback: string;
      topic_areas: string[];
      specific_mistakes: string[];
      what_went_well: string[];
      improvement_tips: string[];
      confidence_level: number;
    }>;
  };
}

export function TestModePage({ deckId, userId }: TestModePageProps) {
  const router = useRouter();
  const _user = useUser();
  const { data: deck } = useDeck(deckId);
  const { data: flashcardsData } = useFlashcards(deckId, {
    sortBy: 'position',
    sortOrder: 'asc',
    limit: 1000,
    offset: 0,
  });
  const { data: subscriptionInfo } = useSubscription(userId);

  // Test state
  const [testState, setTestState] = useState<'setup' | 'active' | 'completed'>('setup');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  
  // Update current answer when question changes (for navigation)
  useEffect(() => {
    if (testState === 'active' && questions.length > 0) {
      const currentQuestionId = questions[currentQuestionIndex]?.id;
      const existingAnswer = answers.find(a => a.questionId === currentQuestionId);
      setCurrentAnswer(existingAnswer?.userAnswer || '');
    }
  }, [currentQuestionIndex, questions, answers, testState]);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [testResults, setTestResults] = useState<{
    score: number;
    totalQuestions: number;
    feedback: string;
    correctAnswers: number;
  } | null>(null);
  const [comprehensiveResults, setComprehensiveResults] = useState<ComprehensiveTestResults | null>(null);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [currentTestSessionId, setCurrentTestSessionId] = useState<string | null>(null);

  const flashcards = flashcardsData?.flashcards || [];
  const currentQuestion = questions[currentQuestionIndex];

  // Check if user has Pro access or remaining test sessions
  const hasProAccess = subscriptionInfo?.tier === 'pro';

  const generateQuestions = async () => {
    if (flashcards.length === 0) {
      toast.error('No flashcards available for testing');
      return;
    }

    setIsGeneratingQuestions(true);
    
    try {
      // First, create a test session - this will enforce the limit
      const sessionResult = await createTestSessionAction({
        deck_id: deckId,
        test_mode: 'ai_questions',
        total_questions: Math.min(10, flashcards.length),
      });

      if (!sessionResult.success) {
        // Handle specific limit errors with better messaging
        if (sessionResult.limitReached) {
          toast.error(sessionResult.error || 'Test session limit reached');
        } else {
          toast.error(sessionResult.error || 'Failed to create test session');
        }
        return;
      }

      // Store the session ID for later use
      const testSessionId = sessionResult.session?.id;
      if (!testSessionId) {
        toast.error('Failed to create test session');
        return;
      }
      setCurrentTestSessionId(testSessionId);
      const questionCount = Math.min(10, flashcards.length);
      const result = await generateQuestionsAction({
        flashcards: flashcards.map(card => ({
          id: card.id,
          front_content: card.front_content,
          back_content: card.back_content,
        })),
        question_count: questionCount,
        difficulty: 'medium',
      });

      if (result.success && result.data) {
        const generatedQuestions: Question[] = result.data.map((aiQuestion, index) => ({
          id: `q-${index}`,
          question: aiQuestion.question,
          flashcardId: flashcards[index % flashcards.length]?.id || '',
          expectedAnswer: aiQuestion.suggested_answer || flashcards[index % flashcards.length]?.back_content || ''
        }));

        setQuestions(generatedQuestions);
        setTestState('active');
        setStartTime(Date.now());
        setCurrentQuestionIndex(0);
        setAnswers([]);
        setCurrentAnswer('');
        
        toast.success(`Generated ${generatedQuestions.length} AI questions`);
      } else {
        // Handle specific limit errors with better messaging
        if ('limitReached' in result && result.limitReached) {
          toast.error(result.error || 'Usage limit reached');
        } else {
          toast.error(result.error || 'Failed to generate questions');
        }
        return;
      }
    } catch (error) {
      console.error('Failed to generate questions:', error);
      toast.error('Failed to generate test questions');
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const submitAnswer = async () => {
    if (!currentAnswer.trim()) {
      toast.error('Please provide an answer');
      return;
    }

    setIsSubmittingAnswer(true);

    try {
      if (!currentQuestion) return;
      
      const answer: Answer = {
        questionId: currentQuestion.id,
        userAnswer: currentAnswer
      };

      setAnswers(prev => {
        const existingIndex = prev.findIndex(a => a.questionId === currentQuestion?.id);
        if (existingIndex >= 0) {
          // Update existing answer
          const updated = [...prev];
          updated[existingIndex] = answer;
          return updated;
        } else {
          // Add new answer
          return [...prev, answer];
        }
      });
      
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setCurrentAnswer('');
      } else {
        // All questions answered, grade the test
        await gradeTest([...answers, answer]);
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
      toast.error('Failed to submit answer');
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  const gradeTest = async (allAnswers: Answer[]) => {
    setIsGrading(true);
    
    try {
      // Prepare answers for comprehensive grading
      const comprehensiveAnswers = allAnswers.map((answer) => {
        const question = questions.find(q => q.id === answer.questionId);
        return {
          question_id: answer.questionId,
          question: question?.question || 'Unknown question',
          user_answer: answer.userAnswer,
          expected_answer: question?.expectedAnswer || 'No expected answer',
        };
      });

      const timeSpentMinutes = Math.round((Date.now() - startTime) / 60000);

      // Use comprehensive grading
      const result = await gradeTestComprehensiveAction({
        test_session_id: currentTestSessionId || 'fallback-session-id',
        answers: comprehensiveAnswers,
        time_spent_minutes: timeSpentMinutes,
      });

      if (result.success && result.data) {
        // Set comprehensive results for detailed display
        setComprehensiveResults(result.data as any);

        // Also set legacy test results for backward compatibility
        const overallScore = result.data.overall_analysis.overall_percentage;
        const correctAnswers = result.data.individual_questions.filter(q => q.individual_score >= 60).length;

        setTestResults({
          score: overallScore,
          totalQuestions: questions.length,
          correctAnswers,
          feedback: result.data.overall_analysis.grade_explanation
        });

        // Update answers with detailed feedback
        const gradedAnswers = allAnswers.map((answer, index) => {
          const questionResult = result.data.individual_questions[index];
          return {
            ...answer,
            score: questionResult?.individual_score || 0,
            feedback: questionResult?.detailed_feedback || 'No feedback available',
            isCorrect: (questionResult?.individual_score || 0) >= 60,
          };
        });

        setAnswers(gradedAnswers);
        setTestState('completed');
        
        toast.success(`Test graded! You earned a ${result.data.overall_analysis.overall_grade} (${overallScore}%)`);
      } else {
        throw new Error(result.error || 'Failed to grade test comprehensively');
      }
    } catch (error) {
      console.error('Failed to grade test comprehensively:', error);
      toast.error('AI grading failed, using basic assessment');
      
      // Fallback to simple grading
      try {
        const basicAnswers = allAnswers.map((answer) => {
          const question = questions.find(q => q.id === answer.questionId);
          return {
            question: question?.question || 'Unknown question',
            user_answer: answer.userAnswer,
            expected_answer: question?.expectedAnswer || 'No expected answer',
          };
        });

        const basicResult = await gradeAnswersAction({
          answers: basicAnswers,
        });

        if (basicResult.success && basicResult.data) {
          const gradedAnswers = allAnswers.map((answer, index) => ({
            ...answer,
            score: basicResult.data![index]?.score || 0,
            feedback: basicResult.data![index]?.feedback || 'Basic feedback available',
            isCorrect: (basicResult.data![index]?.score || 0) >= 60,
          }));

          const totalScore = gradedAnswers.reduce((sum, answer) => sum + (answer.score || 0), 0);
          const averageScore = Math.round(totalScore / gradedAnswers.length);
          const correctAnswers = gradedAnswers.filter(answer => (answer.score || 0) >= 60).length;
          const timeSpent = Math.round((Date.now() - startTime) / 1000);

          setTestResults({
            score: averageScore,
            totalQuestions: questions.length,
            correctAnswers,
            feedback: `You completed the test in ${Math.round(timeSpent / 60)} minutes with an average score of ${averageScore}%. AI analysis temporarily unavailable.`
          });

          setAnswers(gradedAnswers);
          setTestState('completed');
        } else {
          throw new Error('Both comprehensive and basic grading failed');
        }
      } catch (fallbackError) {
        console.error('Fallback grading also failed:', fallbackError);
        
        // Ultimate fallback
        const fallbackAnswers = allAnswers.map(answer => ({
          ...answer,
          score: 75,
          feedback: 'Answer received. Grading temporarily unavailable.',
          isCorrect: true
        }));
        
        setAnswers(fallbackAnswers);
        setTestResults({
          score: 75,
          totalQuestions: questions.length,
          correctAnswers: questions.length,
          feedback: 'Test completed. Grading temporarily unavailable.'
        });
        setTestState('completed');
      }
    } finally {
      setIsGrading(false);
    }
  };

  const restartTest = () => {
    setTestState('setup');
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setCurrentAnswer('');
    setTestResults(null);
    setComprehensiveResults(null);
    setSelectedQuestionIndex(null);
  };

  const exitTest = () => {
    router.push(`/home/decks/${deckId}`);
  };

  // Remove the Pro gate - let the component handle limits through server actions

  if (testState === 'setup') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button asChild variant="outline" size="sm">
            <Link href={`/home/decks/${deckId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Deck
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">AI Test Mode</h1>
            <p className="text-muted-foreground">{deck?.name}</p>
          </div>
        </div>

        {/* Setup Card */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mb-4">
              <TestTube className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Ready to Test Your Knowledge?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">
                AI will generate critical thinking questions based on your flashcards
              </p>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                {Math.min(10, flashcards.length)} questions available
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="space-y-2">
                <div className="mx-auto w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Zap className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-sm">
                  <div className="font-medium">AI Generated</div>
                  <div className="text-muted-foreground">Smart questions</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="mx-auto w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-purple-600" />
                </div>
                <div className="text-sm">
                  <div className="font-medium">Instant Grading</div>
                  <div className="text-muted-foreground">AI feedback</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="mx-auto w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-orange-600" />
                </div>
                <div className="text-sm">
                  <div className="font-medium">Deep Learning</div>
                  <div className="text-muted-foreground">Critical thinking</div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={generateQuestions}
                disabled={isGeneratingQuestions || flashcards.length === 0}
                className="flex-1"
                size="lg"
              >
                {isGeneratingQuestions ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Questions...
                  </>
                ) : (
                  <>
                    <TestTube className="mr-2 h-4 w-4" />
                    Start Test
                  </>
                )}
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href={`/home/decks/${deckId}/study`}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Study First
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (testState === 'active') {
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <TestTube className="h-6 w-6 text-emerald-600" />
              <h1 className="text-2xl font-bold">Test Mode</h1>
            </div>
            <Badge variant="outline">
              Question {currentQuestionIndex + 1} of {questions.length}
            </Badge>
          </div>
          <Button onClick={exitTest} variant="outline" size="sm">
            Exit Test
          </Button>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-sm text-muted-foreground mt-1">
            <span>Progress: {Math.round(progress)}%</span>
            <span>{currentQuestionIndex + 1} / {questions.length}</span>
          </div>
        </div>

        {/* Question Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-emerald-600" />
              Question {currentQuestionIndex + 1}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium leading-relaxed mb-6">
              {currentQuestion?.question}
            </div>
            
            <div className="space-y-4">
              <Textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Type your answer here..."
                rows={6}
                className="resize-none"
              />
              
              <div className="flex gap-3">
                <Button
                  onClick={submitAnswer}
                  disabled={isSubmittingAnswer || !currentAnswer.trim()}
                  className="flex-1"
                >
                  {isSubmittingAnswer ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : currentQuestionIndex < questions.length - 1 ? (
                    'Next Question'
                  ) : (
                    'Complete Test'
                  )}
                </Button>
                {currentQuestionIndex > 0 && (
                  <Button
                    onClick={() => {
                      const prevIndex = currentQuestionIndex - 1;
                      const prevQuestionId = questions[prevIndex]?.id;
                      const existingAnswer = answers.find(a => a.questionId === prevQuestionId);
                      
                      setCurrentQuestionIndex(prevIndex);
                      setCurrentAnswer(existingAnswer?.userAnswer || '');
                    }}
                    variant="outline"
                    disabled={isSubmittingAnswer}
                  >
                    Previous
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grading State */}
        {isGrading && (
          <Card>
            <CardContent className="py-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-emerald-600" />
              <h3 className="text-lg font-medium mb-2">Grading Your Test</h3>
              <p className="text-muted-foreground">
                AI is analyzing your answers and providing feedback...
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  if (testState === 'completed' && (testResults || comprehensiveResults)) {
    const _results = comprehensiveResults || testResults;
    const hasComprehensiveResults = !!comprehensiveResults;
    const hierarchy = comprehensiveResults?.feedback_hierarchy;

    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Hero Section - Primary feedback (always visible) */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mb-4 animate-pulse">
            <div className="text-2xl font-bold text-white">
              {hierarchy?.primary.grade || (hasComprehensiveResults ? comprehensiveResults.overall_analysis.overall_grade : 'A')}
            </div>
          </div>
          
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-emerald-900 mb-2">
              {hierarchy?.primary.celebration_message || 'Test Complete!'}
            </h1>
            <div className="text-3xl font-bold text-emerald-600 mb-2">
              {hierarchy?.primary.percentage || (hasComprehensiveResults ? comprehensiveResults.overall_analysis.overall_percentage : testResults!.score)}%
            </div>
          </div>
          
          <p className="text-lg text-emerald-700 max-w-2xl mx-auto leading-relaxed">
            {hierarchy?.primary.key_insight || 'Great effort completing the assessment!'}
          </p>
        </div>

        {/* Progressive Disclosure Tabs */}
        <Tabs defaultValue="glance" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="glance">At a Glance</TabsTrigger>
            <TabsTrigger value="topics">Topics</TabsTrigger>
            <TabsTrigger value="growth">Growth Plan</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
          </TabsList>

          {/* Tab 1: At a Glance - Key metrics and primary insight */}
          <TabsContent value="glance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-emerald-600" />
                  Performance Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-6 text-center mb-6">
                  <div>
                    <div className="text-2xl font-bold text-emerald-600">
                      {hierarchy?.at_glance.quick_stats.strong_answers || (hasComprehensiveResults ? comprehensiveResults.individual_questions.filter(q => q.individual_score >= 80).length : testResults!.correctAnswers)}
                    </div>
                    <div className="text-sm text-muted-foreground">Strong Answers</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {hierarchy?.at_glance.quick_stats.total_questions || (hasComprehensiveResults ? comprehensiveResults.individual_questions.length : testResults!.totalQuestions)}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Questions</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {hierarchy?.at_glance.quick_stats.confidence_level || (hasComprehensiveResults ? comprehensiveResults.overall_analysis.confidence_assessment : 75)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Confidence</div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Key Strength
                    </h4>
                    <p className="text-sm text-green-700">
                      {hierarchy?.at_glance.primary_strength || (hasComprehensiveResults ? comprehensiveResults.overall_analysis.strengths_summary[0] : 'Completed the assessment successfully')}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Focus Area
                    </h4>
                    <p className="text-sm text-blue-700">
                      {hierarchy?.at_glance.primary_improvement || (hasComprehensiveResults ? comprehensiveResults.overall_analysis.weaknesses_summary[0] : 'Continue practicing to improve')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Topics - Performance breakdown by subject area */}
          <TabsContent value="topics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  Topic Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {hierarchy?.topics.topic_summary || 'Here\'s how you performed across different topics:'}
                </p>
                
                <div className="space-y-3">
                  {(hierarchy?.topics.main_topics || (hasComprehensiveResults ? comprehensiveResults.overall_analysis.topic_breakdown.slice(0, 5) : [])).map((topic, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          topic.performance === 'excellent' ? 'bg-green-500' :
                          topic.performance === 'good' ? 'bg-blue-500' :
                          topic.performance === 'fair' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <span className="font-medium">{topic.topic}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{topic.understanding_level}%</div>
                        <div className="text-xs text-muted-foreground capitalize">{topic.performance}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Growth Plan - Actionable recommendations */}
          <TabsContent value="growth" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-600" />
                  Your Learning Path
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    Priority Areas
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {(hierarchy?.growth_plan.priority_areas || (hasComprehensiveResults ? comprehensiveResults.overall_analysis.priority_study_areas.slice(0, 3) : ['Review material'])).map((area, index) => (
                      <Badge key={index} variant="destructive" className="text-xs">{area}</Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    Action Steps
                  </h4>
                  <ul className="space-y-2">
                    {(hierarchy?.growth_plan.action_steps || (hasComprehensiveResults ? comprehensiveResults.overall_analysis.improvement_recommendations.slice(0, 4) : ['Review the material'])).map((step, index) => (
                      <li key={index} className="text-sm flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mt-0.5 flex-shrink-0">
                          <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                        </div>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    Study Tips
                  </h4>
                  <ul className="space-y-2">
                    {(hierarchy?.growth_plan.study_tips || (hasComprehensiveResults ? comprehensiveResults.overall_analysis.study_plan_suggestions.slice(0, 3) : ['Practice regularly'])).map((tip, index) => (
                      <li key={index} className="text-sm flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 4: Questions - Individual question analysis */}
          <TabsContent value="questions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="h-5 w-5 text-purple-600" />
                  Question Review
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(hierarchy?.question_details || (hasComprehensiveResults ? comprehensiveResults.individual_questions : [])).map((question, index) => (
                    <div 
                      key={question.question_id || `question-${index}`}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedQuestionIndex === index ? 'border-primary bg-primary/10' : 'border-border hover:border-muted-foreground/30'
                      }`}
                      onClick={() => setSelectedQuestionIndex(selectedQuestionIndex === index ? null : index)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">Question {index + 1}</span>
                          <Badge variant={question.individual_score >= 80 ? 'default' : question.individual_score >= 60 ? 'secondary' : 'destructive'}>
                            {question.individual_grade} ({question.individual_score}%)
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {selectedQuestionIndex === index ? 'Click to collapse' : 'Click to expand'}
                        </div>
                      </div>
                      
                      {selectedQuestionIndex === index && (
                        <div className="mt-4 space-y-4 border-t pt-4">
                          <div>
                            <h5 className="font-medium mb-1">Question:</h5>
                            <p className="text-sm text-muted-foreground">{question.question_text}</p>
                          </div>
                          
                          <div>
                            <h5 className="font-medium mb-1">Your Answer:</h5>
                            <p className="text-sm">{question.user_answer}</p>
                          </div>
                          
                          <div>
                            <h5 className="font-medium mb-1">Feedback:</h5>
                            <p className="text-sm">{question.detailed_feedback}</p>
                          </div>
                          
                          {question.improvement_tips.length > 0 && (
                            <div>
                              <h5 className="font-medium mb-1 text-blue-600">Tips for improvement:</h5>
                              <ul className="text-sm space-y-1">
                                {question.improvement_tips.slice(0, 2).map((tip, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <Zap className="h-3 w-3 text-blue-500 mt-1 flex-shrink-0" />
                                    {tip}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button onClick={restartTest} variant="outline">
            <TestTube className="h-4 w-4 mr-2" />
            Retake Test
          </Button>
          <Button asChild variant="outline">
            <Link href={`/home/decks/${deckId}/study`}>
              <BookOpen className="h-4 w-4 mr-2" />
              Study Mode
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/home/decks/${deckId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Deck
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return null;
}