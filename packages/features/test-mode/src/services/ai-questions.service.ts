import { createGeminiClient } from '@kit/ai/gemini';
import type { AIQuestion, GenerateQuestionsData } from '../schemas';

export class AIQuestionsService {
  private ai: ReturnType<typeof createGeminiClient>;

  constructor() {
    this.ai = createGeminiClient();
  }

  /**
   * Generate critical thinking questions from flashcards
   */
  async generateQuestions({
    flashcards,
    question_count,
    difficulty = 'medium',
  }: GenerateQuestionsData): Promise<AIQuestion[]> {
    try {
      const prompt = this.buildQuestionGenerationPrompt({
        flashcards,
        question_count,
        difficulty,
      });

      const response = await this.ai.generateContent(prompt);
      const text = response.text;

      return this.parseQuestionsResponse(text, question_count);
    } catch (error) {
      console.error('AI question generation error:', error);
      return this.getFallbackQuestions(flashcards, question_count);
    }
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
   * Parse AI response to extract questions
   */
  private parseQuestionsResponse(aiResponse: string, expectedCount: number): AIQuestion[] {
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.questions && Array.isArray(parsed.questions)) {
          return parsed.questions.slice(0, expectedCount).map((q: any) => ({
            question: q.question || 'Generated question',
            suggested_answer: q.suggested_answer,
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
            question: cleanQuestion,
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
        question: template!.replace('{front}', card!.front_content),
        suggested_answer: `Consider the definition: ${card!.back_content}`,
        difficulty: 'medium',
      });

      usedCards.add(cardIndex * templates.length + templateIndex);
    }

    return questions;
  }
}