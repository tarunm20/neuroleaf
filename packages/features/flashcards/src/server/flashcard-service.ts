import { SupabaseClient } from '@supabase/supabase-js';
import { 
  Flashcard, 
  CreateFlashcardData, 
  UpdateFlashcardData, 
  FlashcardFilters,
  BulkImportData,
  ReorderFlashcardsData,
  ExportRequestData,
} from '../schemas/flashcard.schema';

export class FlashcardService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get flashcards for a deck with optional filters
   */
  async getFlashcards(deckId: string, filters?: Partial<FlashcardFilters>): Promise<{
    flashcards: Flashcard[];
    total: number;
  }> {
    let query = this.supabase
      .from('flashcards')
      .select('*', { count: 'exact' })
      .eq('deck_id', deckId);

    // Apply filters
    if (filters?.search) {
      query = query.or(`front_content.ilike.%${filters.search}%,back_content.ilike.%${filters.search}%`);
    }

    if (filters?.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags);
    }

    if (filters?.difficulty) {
      query = query.eq('difficulty', filters.difficulty);
    }

    if (filters?.ai_generated !== undefined) {
      query = query.eq('ai_generated', filters.ai_generated);
    }

    // Apply sorting
    const sortBy = filters?.sortBy || 'position';
    const sortOrder = filters?.sortOrder || 'asc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const limit = filters?.limit || 20;
    const offset = filters?.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch flashcards: ${error.message}`);
    }

    return {
      flashcards: data || [],
      total: count || 0,
    };
  }

  /**
   * Get a single flashcard by ID
   */
  async getFlashcard(flashcardId: string): Promise<Flashcard> {
    const { data, error } = await this.supabase
      .from('flashcards')
      .select('*')
      .eq('id', flashcardId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch flashcard: ${error.message}`);
    }

    if (!data) {
      throw new Error('Flashcard not found');
    }

    return data;
  }

  /**
   * Create a new flashcard
   */
  async createFlashcard(data: CreateFlashcardData, userId: string): Promise<Flashcard> {
    // Get the next position if not specified
    if (data.position === undefined) {
      const { count } = await this.supabase
        .from('flashcards')
        .select('*', { count: 'exact' })
        .eq('deck_id', data.deck_id);
      
      data.position = (count || 0);
    }

    const { data: flashcard, error } = await this.supabase
      .from('flashcards')
      .insert({
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create flashcard: ${error.message}`);
    }

    return flashcard;
  }

  /**
   * Update an existing flashcard
   */
  async updateFlashcard(data: UpdateFlashcardData, userId: string): Promise<Flashcard> {
    const { data: flashcard, error } = await this.supabase
      .from('flashcards')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update flashcard: ${error.message}`);
    }

    return flashcard;
  }

  /**
   * Delete a flashcard
   */
  async deleteFlashcard(flashcardId: string): Promise<void> {
    const { error } = await this.supabase
      .from('flashcards')
      .delete()
      .eq('id', flashcardId);

    if (error) {
      throw new Error(`Failed to delete flashcard: ${error.message}`);
    }
  }

  /**
   * Bulk delete flashcards
   */
  async bulkDeleteFlashcards(flashcardIds: string[]): Promise<void> {
    if (flashcardIds.length === 0) return;

    const { error } = await this.supabase
      .from('flashcards')
      .delete()
      .in('id', flashcardIds);

    if (error) {
      throw new Error(`Failed to delete flashcards: ${error.message}`);
    }
  }

  /**
   * Duplicate flashcards
   */
  async duplicateFlashcards(flashcardIds: string[], targetDeckId?: string): Promise<Flashcard[]> {
    if (flashcardIds.length === 0) return [];

    // Get the original flashcards
    const { data: originalCards, error: fetchError } = await this.supabase
      .from('flashcards')
      .select('*')
      .in('id', flashcardIds);

    if (fetchError) {
      throw new Error(`Failed to fetch flashcards for duplication: ${fetchError.message}`);
    }

    if (!originalCards) return [];

    // Prepare the new flashcards
    const newFlashcards = originalCards.map((card) => ({
      deck_id: targetDeckId || card.deck_id,
      front_content: card.front_content,
      back_content: card.back_content,
      front_media_urls: card.front_media_urls,
      back_media_urls: card.back_media_urls,
      tags: card.tags,
      difficulty: card.difficulty,
      position: 0, // Will be updated after insertion
      ai_generated: card.ai_generated,
      public_data: card.public_data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    // Insert the new flashcards
    const { data: duplicatedCards, error: insertError } = await this.supabase
      .from('flashcards')
      .insert(newFlashcards)
      .select();

    if (insertError) {
      throw new Error(`Failed to duplicate flashcards: ${insertError.message}`);
    }

    return duplicatedCards || [];
  }

  /**
   * Reorder flashcards within a deck
   */
  async reorderFlashcards(data: ReorderFlashcardsData): Promise<void> {
    const updates = data.flashcard_positions.map((item) => ({
      id: item.id,
      position: item.position,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await this.supabase
      .from('flashcards')
      .upsert(updates);

    if (error) {
      throw new Error(`Failed to reorder flashcards: ${error.message}`);
    }
  }

  /**
   * Bulk import flashcards
   */
  async bulkImportFlashcards(data: BulkImportData, userId: string): Promise<Flashcard[]> {
    if (data.overwrite_existing) {
      // Delete existing flashcards in the deck
      await this.supabase
        .from('flashcards')
        .delete()
        .eq('deck_id', data.deck_id);
    }

    // Prepare flashcards for insertion
    const flashcardsToInsert = data.flashcards.map((card, index) => ({
      deck_id: data.deck_id,
      front_content: card.front_content,
      back_content: card.back_content,
      tags: card.tags,
      difficulty: card.difficulty,
      position: index,
      ai_generated: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      front_media_urls: [],
      back_media_urls: [],
      public_data: {},
    }));

    const { data: insertedCards, error } = await this.supabase
      .from('flashcards')
      .insert(flashcardsToInsert)
      .select();

    if (error) {
      throw new Error(`Failed to import flashcards: ${error.message}`);
    }

    return insertedCards || [];
  }

  /**
   * Export flashcards
   */
  async exportFlashcards(data: ExportRequestData): Promise<{
    flashcards: Flashcard[];
    metadata: {
      deck_name: string;
      total_cards: number;
      exported_at: string;
      format: string;
    };
  }> {
    // Get deck information
    const { data: deck, error: deckError } = await this.supabase
      .from('decks')
      .select('name')
      .eq('id', data.deck_id)
      .single();

    if (deckError) {
      throw new Error(`Failed to fetch deck: ${deckError.message}`);
    }

    // Get flashcards with filters
    const result = await this.getFlashcards(data.deck_id, data.filters);

    return {
      flashcards: result.flashcards,
      metadata: {
        deck_name: deck.name,
        total_cards: result.total,
        exported_at: new Date().toISOString(),
        format: data.format,
      },
    };
  }

  /**
   * Search flashcards across multiple decks
   */
  async searchFlashcards(
    accountId: string,
    query: string,
    options?: {
      deckIds?: string[];
      limit?: number;
      offset?: number;
    }
  ): Promise<{
    flashcards: (Flashcard & { deck_name: string })[];
    total: number;
  }> {
    let searchQuery = this.supabase
      .from('flashcards')
      .select(`
        *,
        decks!inner(name, account_id)
      `, { count: 'exact' })
      .eq('decks.account_id', accountId)
      .or(`front_content.ilike.%${query}%,back_content.ilike.%${query}%`);

    if (options?.deckIds && options.deckIds.length > 0) {
      searchQuery = searchQuery.in('deck_id', options.deckIds);
    }

    const limit = options?.limit || 20;
    const offset = options?.offset || 0;
    searchQuery = searchQuery
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await searchQuery;

    if (error) {
      throw new Error(`Failed to search flashcards: ${error.message}`);
    }

    const flashcards = (data || []).map((item: any) => ({
      ...item,
      deck_name: item.decks.name,
    }));

    return {
      flashcards,
      total: count || 0,
    };
  }

  /**
   * Get flashcard statistics for a deck
   */
  async getDeckStatistics(deckId: string): Promise<{
    total_cards: number;
    by_difficulty: { easy: number; medium: number; hard: number };
    ai_generated_count: number;
    with_media_count: number;
    average_content_length: { front: number; back: number };
  }> {
    const { data, error } = await this.supabase.rpc('get_deck_flashcard_stats', {
      deck_id: deckId,
    });

    if (error) {
      // Fallback to manual calculation if RPC function doesn't exist
      const { data: flashcards, error: fallbackError } = await this.supabase
        .from('flashcards')
        .select('*')
        .eq('deck_id', deckId);

      if (fallbackError) {
        throw new Error(`Failed to get deck statistics: ${fallbackError.message}`);
      }

      const stats = {
        total_cards: flashcards?.length || 0,
        by_difficulty: { easy: 0, medium: 0, hard: 0 },
        ai_generated_count: 0,
        with_media_count: 0,
        average_content_length: { front: 0, back: 0 },
      };

      if (flashcards) {
        let totalFrontLength = 0;
        let totalBackLength = 0;

        flashcards.forEach((card) => {
          stats.by_difficulty[card.difficulty as keyof typeof stats.by_difficulty]++;
          if (card.ai_generated) stats.ai_generated_count++;
          if (card.front_media_urls.length > 0 || card.back_media_urls.length > 0) {
            stats.with_media_count++;
          }
          totalFrontLength += card.front_content.length;
          totalBackLength += card.back_content.length;
        });

        if (flashcards.length > 0) {
          stats.average_content_length.front = Math.round(totalFrontLength / flashcards.length);
          stats.average_content_length.back = Math.round(totalBackLength / flashcards.length);
        }
      }

      return stats;
    }

    return data;
  }
}