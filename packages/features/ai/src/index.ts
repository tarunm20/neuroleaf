// Main exports for the AI package
export * from './types';
export * from './utils';
export * from './gemini';
export { FlashcardGenerator } from './services/flashcard-generator';
export { ContentEnhancer } from './services/content-enhancer';

// Factory function for creating AI service instances
export { createAIServices } from './factory';