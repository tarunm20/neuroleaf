import { GeminiClient } from '../gemini/client';
import {
  ContentEnhancementRequest,
  ContentEnhancementResponse,
  ContentEnhancementRequestSchema,
} from '../types';

export class ContentEnhancer {
  constructor(private client: GeminiClient) {}

  async enhanceContent(
    request: ContentEnhancementRequest
  ): Promise<ContentEnhancementResponse> {
    // Validate request
    const validatedRequest = ContentEnhancementRequestSchema.parse(request);

    const prompt = this.buildEnhancementPrompt(validatedRequest);
    const startTime = Date.now();

    try {
      const result = await this.client.generateContent(prompt);
      const processingTime = Date.now() - startTime;

      return {
        enhancedContent: this.cleanEnhancedContent(result.text),
        metadata: {
          tokensUsed: result.tokensUsed,
          estimatedCost: result.estimatedCost,
          processingTime,
          model: 'gemini',
        },
      };
    } catch (error) {
      throw error;
    }
  }

  private buildEnhancementPrompt(request: ContentEnhancementRequest): string {
    const {
      content,
      enhancementType,
      targetAudience,
      language,
    } = request;

    const audienceText = targetAudience
      ? ` for a ${targetAudience} audience`
      : '';

    let instruction = '';
    switch (enhancementType) {
      case 'explanation':
        instruction = `Provide a clear, comprehensive explanation of the following content${audienceText}. Break down complex concepts and ensure understanding.`;
        break;
      case 'examples':
        instruction = `Enhance the following content by adding relevant, practical examples and analogies${audienceText}. Make abstract concepts concrete and relatable.`;
        break;
      case 'simplify':
        instruction = `Simplify the following content${audienceText}. Use plain language, shorter sentences, and avoid jargon while preserving the key information.`;
        break;
      case 'elaborate':
        instruction = `Elaborate on the following content${audienceText}. Add depth, context, and additional relevant information while maintaining clarity.`;
        break;
    }

    return `
${instruction}

ORIGINAL CONTENT:
${content}

REQUIREMENTS:
- Maintain accuracy and factual correctness
- Preserve the core meaning and intent
- Use clear, engaging language
- Structure the content logically
${language !== 'en' ? `- Respond in ${language}` : ''}
${targetAudience ? `- Tailor complexity for ${targetAudience} level` : ''}

Please provide the enhanced content:`.trim();
  }

  private cleanEnhancedContent(content: string): string {
    return content
      .replace(/^(Here's|Here is).*?:\s*/i, '') // Remove introductory phrases
      .replace(/^Enhanced content:\s*/i, '') // Remove "Enhanced content:" prefix
      .replace(/^\*\*.*?\*\*:\s*/i, '') // Remove bold headers
      .trim();
  }

  // Specialized methods for different types of content enhancement

  async explainConcept(
    concept: string,
    targetAudience: 'beginner' | 'intermediate' | 'advanced' = 'intermediate',
    language: string = 'en'
  ): Promise<ContentEnhancementResponse> {
    return this.enhanceContent({
      content: concept,
      enhancementType: 'explanation',
      targetAudience,
      language,
    });
  }

  async addExamples(
    content: string,
    targetAudience: 'beginner' | 'intermediate' | 'advanced' = 'intermediate',
    language: string = 'en'
  ): Promise<ContentEnhancementResponse> {
    return this.enhanceContent({
      content,
      enhancementType: 'examples',
      targetAudience,
      language,
    });
  }

  async simplifyText(
    content: string,
    language: string = 'en'
  ): Promise<ContentEnhancementResponse> {
    return this.enhanceContent({
      content,
      enhancementType: 'simplify',
      targetAudience: 'beginner',
      language,
    });
  }

  async elaborateContent(
    content: string,
    targetAudience: 'beginner' | 'intermediate' | 'advanced' = 'advanced',
    language: string = 'en'
  ): Promise<ContentEnhancementResponse> {
    return this.enhanceContent({
      content,
      enhancementType: 'elaborate',
      targetAudience,
      language,
    });
  }
}