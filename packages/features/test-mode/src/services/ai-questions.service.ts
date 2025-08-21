import { createGeminiClient } from '@kit/ai/gemini';
import type { 
  AIQuestion, 
  GenerateQuestionsData, 
  QuestionDistribution,
  MultipleChoiceQuestion,
  TrueFalseQuestion,
  OpenEndedQuestion,
  QuestionType
} from '../schemas';

export class AIQuestionsService {
  private ai: ReturnType<typeof createGeminiClient>;

  constructor() {
    this.ai = createGeminiClient();
  }

  /**
   * Generate mixed questions from flashcards with smart distribution
   */
  async generateQuestions({
    flashcards,
    question_count,
    difficulty = 'medium',
    distribution,
  }: GenerateQuestionsData): Promise<AIQuestion[]> {
    try {
      // Calculate question distribution
      const questionDistribution = distribution || this.calculateDefaultDistribution(question_count);
      
      // Generate questions by type
      const questions: AIQuestion[] = [];
      
      if (questionDistribution.multiple_choice > 0) {
        const mcqQuestions = await this.generateMCQQuestions({
          flashcards,
          question_count: questionDistribution.multiple_choice,
          difficulty,
        });
        questions.push(...mcqQuestions);
      }
      
      if (questionDistribution.true_false > 0) {
        const tfQuestions = await this.generateTrueFalseQuestions({
          flashcards,
          question_count: questionDistribution.true_false,
          difficulty,
        });
        questions.push(...tfQuestions);
      }
      
      if (questionDistribution.open_ended > 0) {
        const openQuestions = await this.generateOpenEndedQuestions({
          flashcards,
          question_count: questionDistribution.open_ended,
          difficulty,
        });
        questions.push(...openQuestions);
      }

      // Shuffle questions for variety
      return this.shuffleArray(questions);
    } catch (error) {
      console.error('AI question generation error:', error);
      return this.getFallbackQuestions(flashcards, question_count);
    }
  }

  /**
   * Calculate default question distribution
   */
  private calculateDefaultDistribution(totalQuestions: number): QuestionDistribution {
    const mcqCount = Math.floor(totalQuestions * 0.4); // 40% MCQ
    const tfCount = Math.floor(totalQuestions * 0.3);  // 30% True/False
    const openCount = totalQuestions - mcqCount - tfCount; // Remaining open-ended
    
    return {
      multiple_choice: mcqCount,
      true_false: tfCount,
      open_ended: Math.max(openCount, 1), // Ensure at least 1 open-ended
    };
  }

  /**
   * Generate Multiple Choice Questions
   */
  private async generateMCQQuestions({
    flashcards,
    question_count,
    difficulty,
  }: Pick<GenerateQuestionsData, 'flashcards' | 'question_count' | 'difficulty'>): Promise<MultipleChoiceQuestion[]> {
    const prompt = this.buildMCQPrompt(flashcards, question_count, difficulty);
    const response = await this.ai.generateContent(prompt);
    return this.parseMCQResponse(response.text, question_count);
  }

  /**
   * Generate True/False Questions
   */
  private async generateTrueFalseQuestions({
    flashcards,
    question_count,
    difficulty,
  }: Pick<GenerateQuestionsData, 'flashcards' | 'question_count' | 'difficulty'>): Promise<TrueFalseQuestion[]> {
    const prompt = this.buildTrueFalsePrompt(flashcards, question_count, difficulty);
    const response = await this.ai.generateContent(prompt);
    return this.parseTrueFalseResponse(response.text, question_count);
  }

  /**
   * Generate Open-Ended Questions (existing logic)
   */
  private async generateOpenEndedQuestions({
    flashcards,
    question_count,
    difficulty,
  }: Pick<GenerateQuestionsData, 'flashcards' | 'question_count' | 'difficulty'>): Promise<OpenEndedQuestion[]> {
    const prompt = this.buildQuestionGenerationPrompt({
      flashcards,
      question_count,
      difficulty,
    });
    const response = await this.ai.generateContent(prompt);
    const questions = this.parseQuestionsResponse(response.text, question_count);
    
    // Convert to OpenEndedQuestion format
    return questions.map(q => ({
      type: 'open_ended' as const,
      question: q.question,
      suggested_answer: q.type === 'open_ended' ? q.suggested_answer || 'No suggested answer provided' : 'No suggested answer provided',
      difficulty: q.difficulty || difficulty,
    }));
  }

  /**
   * Shuffle array utility
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
    }
    return shuffled;
  }

  /**
   * Build prompt for question generation
   */
  private buildQuestionGenerationPrompt({
    flashcards,
    question_count,
    difficulty,
  }: GenerateQuestionsData): string {
    const flashcardContent = flashcards
      .map((card, index) => `${index + 1}. Q: ${card.front_content}\n   A: ${card.back_content}`)
      .join('\n\n');

    const difficultyInstructions = {
      easy: 'Focus on recall and basic understanding. Ask straightforward questions about the main concepts.',
      medium: 'Focus on comprehension and application. Ask questions that require understanding relationships between concepts.',
      hard: 'Focus on analysis and synthesis. Ask questions that require critical thinking, comparison, and deeper analysis.',
    };

    return `You are an expert educator creating ${difficulty} level test questions from flashcard content.

FLASHCARD CONTENT:
${flashcardContent}

INSTRUCTIONS:
- Generate exactly ${question_count} thought-provoking questions
- ${difficultyInstructions[difficulty!]}
- Questions should encourage critical thinking, not just memorization
- Make questions that test understanding of concepts, not exact wording
- Vary question types: analysis, application, comparison, synthesis
- Each question should be clear and specific

DIFFICULTY LEVEL: ${difficulty?.toUpperCase() || 'MEDIUM'}

Please respond in the following JSON format:
{
  "questions": [
    {
      "question": "Your question here",
      "suggested_answer": "Brief guidance on what a good answer should include",
      "difficulty": "${difficulty}"
    }
  ]
}

Generate ${question_count} questions that promote deep understanding of the material.`;
  }

  /**
   * Build MCQ prompt template
   */
  private buildMCQPrompt(flashcards: GenerateQuestionsData['flashcards'], count: number, difficulty?: string): string {
    const flashcardContent = flashcards
      .map((card, index) => `${index + 1}. Q: ${card.front_content}\n   A: ${card.back_content}`)
      .join('\n\n');

    const difficultyInstructions = {
      easy: 'Focus on basic recall and recognition. Create straightforward MCQs testing key terms and definitions.',
      medium: 'Focus on comprehension and application. Create MCQs that test understanding of relationships and concepts.',
      hard: 'Focus on analysis and evaluation. Create MCQs that require critical thinking and comparison of concepts.',
    };

    return `You are an expert test creator. Generate high-quality multiple choice questions from flashcard content.

FLASHCARD CONTENT:
${flashcardContent}

INSTRUCTIONS:
- Generate exactly ${count} multiple choice questions
- Each question has exactly 4 options (A, B, C, D) with exactly 1 correct answer
- ${difficultyInstructions[difficulty as keyof typeof difficultyInstructions] || difficultyInstructions.medium}
- Distractors should be plausible but clearly incorrect to someone who understands the concept
- Avoid "all of the above" or "none of the above" options
- Test conceptual understanding, not memorization of exact wording
- Vary question stems: "Which...", "What is...", "How does...", "Why...", "When..."

DISTRACTOR GUIDELINES:
- Make wrong answers seem reasonable but contain clear errors
- Use common misconceptions as distractors
- Keep all options similar in length and structure
- Mix obvious and subtle incorrect options

DIFFICULTY LEVEL: ${difficulty?.toUpperCase() || 'MEDIUM'}

Respond in this exact JSON format:
{
  "questions": [
    {
      "type": "multiple_choice",
      "question": "Clear, specific question stem",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": 0,
      "explanation": "Brief explanation of why this answer is correct",
      "difficulty": "${difficulty || 'medium'}"
    }
  ]
}

Generate ${count} MCQ questions now.`;
  }

  /**
   * Build True/False prompt template
   */
  private buildTrueFalsePrompt(flashcards: GenerateQuestionsData['flashcards'], count: number, difficulty?: string): string {
    const flashcardContent = flashcards
      .map((card, index) => `${index + 1}. Q: ${card.front_content}\n   A: ${card.back_content}`)
      .join('\n\n');

    const difficultyInstructions = {
      easy: 'Create clear, straightforward statements about basic facts and definitions.',
      medium: 'Create statements about relationships, processes, and applications that require understanding.',
      hard: 'Create nuanced statements that test deep understanding of implications and complex relationships.',
    };

    return `You are an expert test creator. Generate high-quality True/False questions from flashcard content.

FLASHCARD CONTENT:
${flashcardContent}

INSTRUCTIONS:
- Generate exactly ${count} true/false questions
- Aim for roughly 50% true statements and 50% false statements
- ${difficultyInstructions[difficulty as keyof typeof difficultyInstructions] || difficultyInstructions.medium}
- False statements should be subtly wrong, not obviously incorrect
- Test understanding of concepts, relationships, and applications
- Avoid trick questions or ambiguous wording
- Each statement should be clear and unambiguous

TRUE STATEMENT GUIDELINES:
- Make accurate statements about concepts, processes, or relationships
- Include important facts that students should know
- Test understanding of cause-and-effect relationships

FALSE STATEMENT GUIDELINES:
- Include common misconceptions or errors
- Slightly modify correct information to make it false
- Test boundary conditions or exceptions
- Avoid obviously false statements

DIFFICULTY LEVEL: ${difficulty?.toUpperCase() || 'MEDIUM'}

Respond in this exact JSON format:
{
  "questions": [
    {
      "type": "true_false",
      "statement": "Clear, testable statement",
      "correct_answer": true,
      "explanation": "Brief explanation of why this statement is true/false",
      "difficulty": "${difficulty || 'medium'}"
    }
  ]
}

Generate ${count} True/False questions now.`;
  }

  /**
   * Parse MCQ response
   */
  private parseMCQResponse(aiResponse: string, expectedCount: number): MultipleChoiceQuestion[] {
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.questions && Array.isArray(parsed.questions)) {
          return parsed.questions.slice(0, expectedCount).map((q: any) => ({
            type: 'multiple_choice' as const,
            question: q.question || 'Generated MCQ question',
            options: q.options || ['Option A', 'Option B', 'Option C', 'Option D'],
            correct_answer: typeof q.correct_answer === 'number' ? q.correct_answer : 0,
            explanation: q.explanation || 'No explanation provided',
            difficulty: q.difficulty || 'medium',
          }));
        }
      }
      return this.getFallbackMCQQuestions(expectedCount);
    } catch (error) {
      console.error('Error parsing MCQ response:', error);
      return this.getFallbackMCQQuestions(expectedCount);
    }
  }

  /**
   * Parse True/False response
   */
  private parseTrueFalseResponse(aiResponse: string, expectedCount: number): TrueFalseQuestion[] {
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.questions && Array.isArray(parsed.questions)) {
          return parsed.questions.slice(0, expectedCount).map((q: any) => ({
            type: 'true_false' as const,
            question: q.statement || q.question || 'Generated T/F statement',
            statement: q.statement || q.question || 'Generated T/F statement',
            correct_answer: typeof q.correct_answer === 'boolean' ? q.correct_answer : true,
            explanation: q.explanation || 'No explanation provided',
            difficulty: q.difficulty || 'medium',
          }));
        }
      }
      return this.getFallbackTrueFalseQuestions(expectedCount);
    } catch (error) {
      console.error('Error parsing True/False response:', error);
      return this.getFallbackTrueFalseQuestions(expectedCount);
    }
  }

  /**
   * Parse AI response to extract questions
   */
  private parseQuestionsResponse(aiResponse: string, expectedCount: number): AIQuestion[] {
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.questions && Array.isArray(parsed.questions)) {
          return parsed.questions.slice(0, expectedCount).map((q: any) => ({
            type: 'open_ended' as const,
            question: q.question || 'Generated question',
            suggested_answer: q.suggested_answer || 'No suggested answer provided',
            difficulty: q.difficulty || 'medium',
          }));
        }
      }

      // Fallback: try to extract questions from text
      return this.extractQuestionsFromText(aiResponse, expectedCount);
    } catch (error) {
      console.error('Error parsing AI questions response:', error);
      return [];
    }
  }

  /**
   * Extract questions from plain text response
   */
  private extractQuestionsFromText(text: string, count: number): AIQuestion[] {
    const questions: AIQuestion[] = [];
    const lines = text.split('\n').filter(line => line.trim());

    for (const line of lines) {
      // Look for numbered questions or questions with question marks
      if ((line.match(/^\d+\./) || line.includes('?')) && questions.length < count) {
        const cleanQuestion = line.replace(/^\d+\.\s*/, '').trim();
        if (cleanQuestion.length > 10) {
          questions.push({
            type: 'open_ended' as const,
            question: cleanQuestion,
            suggested_answer: 'No suggested answer provided',
            difficulty: 'medium',
          });
        }
      }
    }

    return questions;
  }

  /**
   * Generate fallback questions when AI is not available
   */
  private getFallbackQuestions(
    flashcards: GenerateQuestionsData['flashcards'],
    count: number,
  ): AIQuestion[] {
    const templates = [
      'Explain the concept of {front} in your own words.',
      'How does {front} relate to other concepts you\'ve learned?',
      'What would happen if {front} was different? Explain your reasoning.',
      'Compare and contrast {front} with similar concepts.',
      'Provide an example of {front} and explain why it fits.',
      'What are the key characteristics of {front}?',
      'Describe a real-world application of {front}.',
      'What questions would you ask to better understand {front}?',
    ];

    const questions: AIQuestion[] = [];
    const usedCards = new Set<number>();

    for (let i = 0; i < count && i < flashcards.length * templates.length; i++) {
      const cardIndex = i % flashcards.length;
      const templateIndex = Math.floor(i / flashcards.length) % templates.length;
      
      if (usedCards.has(cardIndex * templates.length + templateIndex)) {
        continue;
      }

      const card = flashcards[cardIndex];
      const template = templates[templateIndex];
      
      questions.push({
        type: 'open_ended' as const,
        question: template!.replace('{front}', card!.front_content),
        suggested_answer: `Consider the definition: ${card!.back_content}`,
        difficulty: 'medium',
      });

      usedCards.add(cardIndex * templates.length + templateIndex);
    }

    return questions;
  }

  /**
   * Generate fallback MCQ questions when AI is not available
   */
  private getFallbackMCQQuestions(count: number): MultipleChoiceQuestion[] {
    const fallbackQuestions: MultipleChoiceQuestion[] = [];
    
    for (let i = 0; i < count; i++) {
      fallbackQuestions.push({
        type: 'multiple_choice',
        question: `Sample multiple choice question ${i + 1}`,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correct_answer: 0,
        explanation: 'AI generation failed, this is a fallback question.',
        difficulty: 'medium',
      });
    }
    
    return fallbackQuestions;
  }

  /**
   * Generate fallback True/False questions when AI is not available
   */
  private getFallbackTrueFalseQuestions(count: number): TrueFalseQuestion[] {
    const fallbackQuestions: TrueFalseQuestion[] = [];
    
    for (let i = 0; i < count; i++) {
      fallbackQuestions.push({
        type: 'true_false',
        question: `Sample true/false statement ${i + 1}`,
        statement: `Sample true/false statement ${i + 1}`,
        correct_answer: i % 2 === 0, // Alternate true/false
        explanation: 'AI generation failed, this is a fallback question.',
        difficulty: 'medium',
      });
    }
    
    return fallbackQuestions;
  }
}