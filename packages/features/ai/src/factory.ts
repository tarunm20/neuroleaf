import { createGeminiClient } from './gemini';
import { FlashcardGenerator } from './services/flashcard-generator';
import { ContentEnhancer } from './services/content-enhancer';

export interface AIServices {
  flashcardGenerator: FlashcardGenerator;
  contentEnhancer: ContentEnhancer;
}

/**
 * Factory function to create all AI services with a shared Gemini client
 */
export function createAIServices(): AIServices {
  const geminiClient = createGeminiClient();
  
  return {
    flashcardGenerator: new FlashcardGenerator(geminiClient),
    contentEnhancer: new ContentEnhancer(geminiClient),
  };
}

/**
 * Singleton instance for server-side usage
 */
let aiServicesInstance: AIServices | null = null;

export function getAIServices(): AIServices {
  if (!aiServicesInstance) {
    aiServicesInstance = createAIServices();
  }
  return aiServicesInstance;
}