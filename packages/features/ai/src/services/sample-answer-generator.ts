import { GeminiClient } from '../gemini/client';

interface SampleAnswerRequest {
  question: string;
  questionContext?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface SampleAnswerResponse {
  sampleAnswer: string;
  keyPoints: string[];
  structure: string;
}

export class SampleAnswerGenerator {
  constructor(private client: GeminiClient) {}

  async generateSampleAnswer(request: SampleAnswerRequest): Promise<SampleAnswerResponse> {
    const { question, questionContext = '', difficulty = 'medium' } = request;

    const prompt = `
As an educational AI assistant, generate a comprehensive sample answer for the following question:

Question: ${question}
${questionContext ? `Context: ${questionContext}` : ''}
Difficulty Level: ${difficulty}

Please provide:
1. A well-structured sample answer that demonstrates what a good response should look like
2. Key points that should be covered in a complete answer
3. The recommended structure for answering this type of question

Requirements:
- The sample answer should be detailed but concise
- Include specific examples where relevant
- Use clear, educational language appropriate for the difficulty level
- Focus on demonstrating proper reasoning and explanation techniques

Format your response as JSON with the following structure:
{
  "sampleAnswer": "The comprehensive sample answer here...",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3", ...],
  "structure": "Recommended structure for answering this question..."
}`;

    try {
      const result = await this.client.generateContent(prompt);
      const parsed = JSON.parse(result.text);
      
      // Validate the response structure
      if (!parsed.sampleAnswer || !parsed.keyPoints || !parsed.structure) {
        throw new Error('Invalid response structure from AI provider');
      }

      return {
        sampleAnswer: parsed.sampleAnswer,
        keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [parsed.keyPoints],
        structure: parsed.structure,
      };
    } catch (error) {
      console.error('Failed to generate sample answer:', error);
      
      // Fallback response
      return {
        sampleAnswer: `A comprehensive answer to this question would address the main concepts presented, provide specific examples to illustrate key points, and demonstrate clear understanding of the topic. The response should be well-organized, starting with an introduction to the topic, followed by detailed explanations of relevant concepts, and concluding with a summary that ties the ideas together.`,
        keyPoints: [
          'Address all main concepts mentioned in the question',
          'Provide specific examples and evidence',
          'Use clear, logical organization',
          'Demonstrate deep understanding of the topic',
          'Connect ideas coherently',
        ],
        structure: 'Introduction → Main Points with Examples → Conclusion',
      };
    }
  }

  async generateBulkSampleAnswers(questions: string[]): Promise<SampleAnswerResponse[]> {
    const results = await Promise.allSettled(
      questions.map(question => 
        this.generateSampleAnswer({ question })
      )
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`Failed to generate sample answer for question ${index}:`, result.reason);
        return {
          sampleAnswer: 'Sample answer generation failed. Please review the question and provide a comprehensive response.',
          keyPoints: ['Address the main topic', 'Provide supporting details', 'Use clear explanations'],
          structure: 'Introduction → Main Content → Conclusion',
        };
      }
    });
  }
}