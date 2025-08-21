import { z } from 'zod';

// Base flashcard schema
export const FlashcardSchema = z.object({
  id: z.string().uuid(),
  deck_id: z.string().uuid(),
  front_content: z.string().min(1, 'Front content is required'),
  back_content: z.string().min(1, 'Back content is required'),
  front_media_urls: z.array(z.string().url()).default([]),
  back_media_urls: z.array(z.string().url()).default([]),
  tags: z.array(z.string()).max(20, 'Too many tags').default([]),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  position: z.number().int().min(0).default(0),
  ai_generated: z.boolean().default(false),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  public_data: z.record(z.any()).default({}),
});

export type Flashcard = z.infer<typeof FlashcardSchema>;

// Create flashcard schema
export const CreateFlashcardSchema = z.object({
  deck_id: z.string().uuid('Invalid deck ID'),
  front_content: z.string().min(1, 'Front content is required').max(5000, 'Front content too long'),
  back_content: z.string().min(1, 'Back content is required').max(5000, 'Back content too long'),
  front_media_urls: z.array(z.string().url()).max(10, 'Too many front media items').default([]),
  back_media_urls: z.array(z.string().url()).max(10, 'Too many back media items').default([]),
  tags: z.array(z.string().min(1).max(50)).max(20, 'Too many tags').default([]),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  position: z.number().int().min(0).optional(),
  ai_generated: z.boolean().default(false),
  public_data: z.record(z.any()).default({}),
});

export type CreateFlashcardData = z.infer<typeof CreateFlashcardSchema>;

// Update flashcard schema
export const UpdateFlashcardSchema = z.object({
  id: z.string().uuid('Invalid flashcard ID'),
  front_content: z.string().min(1, 'Front content is required').max(5000, 'Front content too long').optional(),
  back_content: z.string().min(1, 'Back content is required').max(5000, 'Back content too long').optional(),
  front_media_urls: z.array(z.string().url()).max(10, 'Too many front media items').optional(),
  back_media_urls: z.array(z.string().url()).max(10, 'Too many back media items').optional(),
  tags: z.array(z.string().min(1).max(50)).max(20, 'Too many tags').optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  position: z.number().int().min(0).optional(),
  public_data: z.record(z.any()).optional(),
});

export type UpdateFlashcardData = z.infer<typeof UpdateFlashcardSchema>;

// Flashcard filters schema
export const FlashcardFiltersSchema = z.object({
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  ai_generated: z.boolean().optional(),
  sortBy: z.enum(['position', 'created_at', 'updated_at', 'difficulty']).default('position'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export type FlashcardFilters = z.infer<typeof FlashcardFiltersSchema>;

// Bulk import schemas
export const BulkImportFlashcardSchema = z.object({
  front_content: z.string().min(1, 'Front content is required'),
  back_content: z.string().min(1, 'Back content is required'),
  tags: z.array(z.string()).default([]),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
});

export const BulkImportSchema = z.object({
  deck_id: z.string().uuid('Invalid deck ID'),
  flashcards: z.array(BulkImportFlashcardSchema).min(1, 'At least one flashcard required').max(1000, 'Too many flashcards'),
  overwrite_existing: z.boolean().default(false),
});

export type BulkImportData = z.infer<typeof BulkImportSchema>;

// Reorder flashcards schema
export const ReorderFlashcardsSchema = z.object({
  deck_id: z.string().uuid('Invalid deck ID'),
  flashcard_positions: z.array(z.object({
    id: z.string().uuid('Invalid flashcard ID'),
    position: z.number().int().min(0),
  })).min(1, 'At least one flashcard position required'),
});

export type ReorderFlashcardsData = z.infer<typeof ReorderFlashcardsSchema>;

// AI generation request schema
export const AIGenerationRequestSchema = z.object({
  deck_id: z.string().uuid('Invalid deck ID'),
  content: z.string().min(1, 'Content is required').max(5000000, 'Content is too long. Please keep it under 5,000,000 characters.'),
  number_of_cards: z.number().int().min(1, 'At least 1 card required').max(5, 'Maximum 5 cards per request').default(5),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  language: z.string().min(2).max(10).default('en'),
  subject: z.string().max(100).optional(),
  card_type: z.enum(['basic', 'cloze', 'image_occlusion']).default('basic'),
  // For image uploads
  image_data: z.string().optional(), // base64 encoded image
  is_image: z.boolean().default(false),
});

export type AIGenerationRequestData = z.infer<typeof AIGenerationRequestSchema>;

// Export formats
export const ExportFormatSchema = z.enum(['csv', 'json', 'anki', 'pdf']);
export type ExportFormat = z.infer<typeof ExportFormatSchema>;

export const ExportRequestSchema = z.object({
  deck_id: z.string().uuid('Invalid deck ID'),
  format: ExportFormatSchema,
  filters: FlashcardFiltersSchema.optional(),
  include_media: z.boolean().default(false),
  include_metadata: z.boolean().default(true),
});

export type ExportRequestData = z.infer<typeof ExportRequestSchema>;

// Flashcard templates
export const FlashcardTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  front_template: z.string(),
  back_template: z.string(),
  css: z.string().optional(),
  fields: z.array(z.object({
    name: z.string(),
    type: z.enum(['text', 'textarea', 'image', 'audio']),
    required: z.boolean().default(false),
  })),
});

export type FlashcardTemplate = z.infer<typeof FlashcardTemplateSchema>;

// Study progress schema (for integration with study modes)
export const StudyProgressSchema = z.object({
  flashcard_id: z.string().uuid(),
  user_id: z.string().uuid(),
  ease_factor: z.number().min(1.3).max(4.0).default(2.5),
  repetitions: z.number().int().min(0).default(0),
  interval_days: z.number().int().min(1).default(1),
  next_review_date: z.string().datetime(),
  last_reviewed_at: z.string().datetime().optional(),
  total_reviews: z.number().int().min(0).default(0),
  correct_reviews: z.number().int().min(0).default(0),
  streak: z.number().int().min(0).default(0),
});

export type StudyProgress = z.infer<typeof StudyProgressSchema>;