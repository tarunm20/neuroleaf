import { z } from 'zod';

// Flashcard generation types
export const FlashcardGenerationSchema = z.object({
  front: z.string().min(1, 'Front content is required'),
  back: z.string().min(1, 'Back content is required'),
  tags: z.array(z.string()).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
});

export type FlashcardGeneration = z.infer<typeof FlashcardGenerationSchema>;

export const GenerateFlashcardsRequestSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  numberOfCards: z.number().min(1).max(1000).default(100),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  language: z.string().default('en'),
  subject: z.string().optional(),
  // Image support
  imageData: z.string().optional(), // base64 encoded image
  isImage: z.boolean().default(false),
});

export type GenerateFlashcardsRequest = z.infer<typeof GenerateFlashcardsRequestSchema>;

// Content analysis types
export interface ContentAnalysis {
  wordCount: number;
  charCount: number;
  sentenceCount: number;
  paragraphCount: number;
  complexity: 'simple' | 'moderate' | 'complex';
  technicalTerms: number;
  numbersAndStats: number;
  lists: number;
  recommendedCardCount: number;
  estimatedDifficulty: 'easy' | 'medium' | 'hard';
  // Advanced semantic analysis
  educationalConcepts: EducationalConcept[];
  contentType: ContentType;
  metadata: ContentMetadata;
}

// Educational concept extraction
export interface EducationalConcept {
  concept: string;
  definition?: string;
  context: string;
  importance: 'high' | 'medium' | 'low';
  type: 'definition' | 'process' | 'relationship' | 'example' | 'principle';
  prerequisites?: string[];
}

// Content type classification
export type ContentType = 
  | 'lecture_slides'
  | 'academic_paper'
  | 'textbook_chapter' 
  | 'notes'
  | 'documentation'
  | 'general_text'
  | 'unknown';

// Content metadata that should NOT become flashcards
export interface ContentMetadata {
  titles: string[];
  headings: string[];
  pageNumbers: string[];
  chapterReferences: string[];
  tableOfContents: string[];
  authorInfo: string[];
  citations: string[];
  navigationElements: string[];
}

export const GenerateFlashcardsResponseSchema = z.object({
  flashcards: z.array(FlashcardGenerationSchema),
  contentAnalysis: z.any().optional(), // ContentAnalysis interface
  metadata: z.object({
    tokensUsed: z.number(),
    estimatedCost: z.number(),
    processingTime: z.number(),
    model: z.string(),
  }),
});

export type GenerateFlashcardsResponse = z.infer<typeof GenerateFlashcardsResponseSchema> & {
  contentAnalysis?: ContentAnalysis;
};

// Content enhancement types
export const ContentEnhancementRequestSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  enhancementType: z.enum(['explanation', 'examples', 'simplify', 'elaborate']),
  targetAudience: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  language: z.string().default('en'),
});

export type ContentEnhancementRequest = z.infer<typeof ContentEnhancementRequestSchema>;

export const ContentEnhancementResponseSchema = z.object({
  enhancedContent: z.string(),
  metadata: z.object({
    tokensUsed: z.number(),
    estimatedCost: z.number(),
    processingTime: z.number(),
    model: z.string(),
  }),
});

export type ContentEnhancementResponse = z.infer<typeof ContentEnhancementResponseSchema>;

// AI service configuration
export interface AIServiceConfig {
  apiKey: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
}

// AI generation tracking
export interface AIGenerationLog {
  userId: string;
  deckId?: string;
  generationType: 'flashcard_creation' | 'content_enhancement' | 'explanation';
  promptText: string;
  responseText: string;
  tokensUsed: number;
  estimatedCost: number;
  modelUsed: string;
  metadata?: Record<string, any>;
}

// Error types
export class AIServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
  ) {
    super(message);
    this.name = 'AIServiceError';
  }
}

export class QuotaExceededError extends AIServiceError {
  constructor(message: string = 'AI quota exceeded') {
    super(message, 'QUOTA_EXCEEDED', 429);
  }
}

export class InvalidRequestError extends AIServiceError {
  constructor(message: string = 'Invalid request') {
    super(message, 'INVALID_REQUEST', 400);
  }
}

export class ModelUnavailableError extends AIServiceError {
  constructor(message: string = 'AI model unavailable') {
    super(message, 'MODEL_UNAVAILABLE', 503);
  }
}