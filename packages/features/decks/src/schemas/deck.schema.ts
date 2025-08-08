import { z } from 'zod';

export const DeckVisibility = z.enum(['private', 'public', 'shared']);
export type DeckVisibility = z.infer<typeof DeckVisibility>;

export const CreateDeckSchema = z.object({
  name: z.string().min(1, 'Deck name is required').max(255, 'Deck name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  visibility: DeckVisibility,
  tags: z.array(z.string()).max(10, 'Too many tags'),
});

// Form schema with defaults for form validation
export const CreateDeckFormSchema = z.object({
  name: z.string().min(1, 'Deck name is required').max(255, 'Deck name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  visibility: DeckVisibility.default('private'),
  tags: z.array(z.string()).max(10, 'Too many tags').default([]),
});

export type CreateDeckData = z.infer<typeof CreateDeckSchema>;

export const UpdateDeckSchema = z.object({
  id: z.string().uuid('Invalid deck ID'),
  name: z.string().min(1, 'Deck name is required').max(255, 'Deck name too long').optional(),
  description: z.string().max(1000, 'Description too long').optional().nullable(),
  visibility: DeckVisibility.optional(),
  tags: z.array(z.string()).max(10, 'Too many tags').optional(),
});

export type UpdateDeckData = z.infer<typeof UpdateDeckSchema>;

export const DeckSchema = z.object({
  id: z.string().uuid(),
  account_id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  visibility: DeckVisibility,
  tags: z.array(z.string()),
  total_cards: z.number().int().min(0),
  created_at: z.string(),
  updated_at: z.string(),
  created_by: z.string().uuid().nullable(),
  updated_by: z.string().uuid().nullable(),
  public_data: z.record(z.any()),
});

export type Deck = z.infer<typeof DeckSchema>;

export const DeckWithStatsSchema = DeckSchema.extend({
  cards_due: z.number().int().min(0).default(0),
  cards_studied_today: z.number().int().min(0).default(0),
  accuracy_rate: z.number().min(0).max(100).nullable().default(null),
  last_studied: z.string().nullable().default(null),
});

export type DeckWithStats = z.infer<typeof DeckWithStatsSchema>;

export const DeckFiltersSchema = z.object({
  visibility: DeckVisibility.optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'created_at', 'updated_at', 'total_cards']).default('updated_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export type DeckFilters = z.infer<typeof DeckFiltersSchema>;