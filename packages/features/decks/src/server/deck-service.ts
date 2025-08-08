import { SupabaseClient } from '@supabase/supabase-js';
import { 
  CreateDeckData, 
  UpdateDeckData, 
  Deck, 
  DeckWithStats, 
  DeckFilters,
  CreateDeckSchema,
  UpdateDeckSchema,
  DeckFiltersSchema
} from '../schemas/deck.schema';

export class DeckService {
  constructor(private supabase: SupabaseClient) {}

  async createDeck(
    data: CreateDeckData,
    accountId: string,
    userId: string
  ): Promise<Deck> {
    // Validate input data
    const validatedData = CreateDeckSchema.parse(data);

    // Check subscription limits before creating deck
    await this.checkDeckCreationLimits(accountId);

    const { data: deck, error } = await this.supabase
      .from('decks')
      .insert({
        ...validatedData,
        account_id: accountId,
        created_by: userId,
        updated_by: userId,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create deck: ${error.message}`);
    }

    return deck;
  }

  // Limit checking is now handled by the subscription package in server actions
  // This method is kept for backward compatibility but does nothing
  private async checkDeckCreationLimits(accountId: string): Promise<void> {
    // Subscription limits are now checked in deck-actions.ts using @kit/subscription/server
    return;
  }

  async updateDeck(data: UpdateDeckData, userId: string): Promise<Deck> {
    // Validate input data
    const validatedData = UpdateDeckSchema.parse(data);
    const { id, ...updateData } = validatedData;

    const { data: deck, error } = await this.supabase
      .from('decks')
      .update({
        ...updateData,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update deck: ${error.message}`);
    }

    return deck;
  }

  async deleteDeck(deckId: string): Promise<void> {
    const { error } = await this.supabase
      .from('decks')
      .delete()
      .eq('id', deckId);

    if (error) {
      throw new Error(`Failed to delete deck: ${error.message}`);
    }
  }

  async getDeck(deckId: string): Promise<Deck | null> {
    const { data, error } = await this.supabase
      .from('decks')
      .select('*')
      .eq('id', deckId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch deck: ${error.message}`);
    }

    return data || null;
  }

  async getUserDecks(
    accountId: string, 
    filters: Partial<DeckFilters> = {}
  ): Promise<{ decks: DeckWithStats[]; total: number }> {
    // Validate filters with defaults
    const validatedFilters = DeckFiltersSchema.parse(filters);

    // Optimized query with flashcard count in single query
    let query = this.supabase
      .from('decks')
      .select(`
        *,
        flashcards:flashcards(count)
      `, { count: 'exact' })
      .eq('account_id', accountId);

    // Apply filters
    if (validatedFilters.visibility) {
      query = query.eq('visibility', validatedFilters.visibility);
    }

    if (validatedFilters.tags && validatedFilters.tags.length > 0) {
      query = query.contains('tags', validatedFilters.tags);
    }

    // Search logic moved to client-side for better performance
    // The useFilteredDecks hook now handles all filtering client-side

    // Apply sorting
    query = query.order(validatedFilters.sortBy, { ascending: validatedFilters.sortOrder === 'asc' });

    // Apply pagination
    query = query.range(validatedFilters.offset, validatedFilters.offset + validatedFilters.limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch decks: ${error.message}`);
    }

    // Transform data to include simple stats for MVP
    const decksWithStats: DeckWithStats[] = (data || []).map((deck: any) => ({
      ...deck,
      total_cards: deck.flashcards?.[0]?.count || 0,
      cards_due: 0, // Removed spaced repetition
      cards_studied_today: 0, // Removed study sessions
      accuracy_rate: null, // Simplified for MVP
      last_studied: null, // Simplified for MVP
    }));

    return {
      decks: decksWithStats,
      total: count || 0,
    };
  }

  async getPublicDecks(
    filters: Partial<DeckFilters> = {}
  ): Promise<{ decks: Deck[]; total: number }> {
    const validatedFilters = DeckFiltersSchema.parse(filters);

    let query = this.supabase
      .from('decks')
      .select('*', { count: 'exact' })
      .eq('visibility', 'public');

    // Apply filters
    if (validatedFilters.tags && validatedFilters.tags.length > 0) {
      query = query.contains('tags', validatedFilters.tags);
    }

    if (validatedFilters.search) {
      query = query.or(`name.ilike.%${validatedFilters.search}%,description.ilike.%${validatedFilters.search}%`);
    }

    // Apply sorting
    query = query.order(validatedFilters.sortBy, { ascending: validatedFilters.sortOrder === 'asc' });

    // Apply pagination
    query = query.range(validatedFilters.offset, validatedFilters.offset + validatedFilters.limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch public decks: ${error.message}`);
    }

    return {
      decks: data || [],
      total: count || 0,
    };
  }

  async duplicateDeck(
    deckId: string, 
    accountId: string, 
    userId: string,
    newName?: string
  ): Promise<Deck> {
    // First, get the original deck
    const originalDeck = await this.getDeck(deckId);
    if (!originalDeck) {
      throw new Error('Deck not found');
    }

    // Check subscription limits before duplicating deck
    await this.checkDeckCreationLimits(accountId);

    // Create the new deck
    const { data: newDeck, error: deckError } = await this.supabase
      .from('decks')
      .insert({
        account_id: accountId,
        name: newName || `${originalDeck.name} (Copy)`,
        description: originalDeck.description,
        visibility: 'private', // Always create copies as private
        tags: originalDeck.tags,
        created_by: userId,
        updated_by: userId,
      })
      .select()
      .single();

    if (deckError) {
      throw new Error(`Failed to duplicate deck: ${deckError.message}`);
    }

    // Copy all flashcards from the original deck
    const { data: originalCards, error: cardsError } = await this.supabase
      .from('flashcards')
      .select('*')
      .eq('deck_id', deckId);

    if (cardsError) {
      throw new Error(`Failed to fetch original cards: ${cardsError.message}`);
    }

    if (originalCards && originalCards.length > 0) {
      const newCards = originalCards.map(card => ({
        deck_id: newDeck.id,
        front_content: card.front_content,
        back_content: card.back_content,
        front_media_urls: card.front_media_urls,
        back_media_urls: card.back_media_urls,
        tags: card.tags,
        difficulty: card.difficulty,
        position: card.position,
        ai_generated: card.ai_generated,
      }));

      const { error: insertError } = await this.supabase
        .from('flashcards')
        .insert(newCards);

      if (insertError) {
        throw new Error(`Failed to copy flashcards: ${insertError.message}`);
      }
    }

    return newDeck;
  }

  // Simplified deck stats for MVP - no spaced repetition features
  async getDeckStats(deckId: string, userId: string): Promise<{
    totalCards: number;
    cardsDue: number;
    cardsStudiedToday: number;
    accuracyRate: number | null;
    lastStudied: string | null;
  }> {
    // Get total cards
    const { data: cardsData, error: cardsError } = await this.supabase
      .from('flashcards')
      .select('id')
      .eq('deck_id', deckId);

    if (cardsError) {
      throw new Error(`Failed to fetch card count: ${cardsError.message}`);
    }

    const totalCards = cardsData?.length || 0;

    // For MVP, return simplified stats without spaced repetition
    return {
      totalCards,
      cardsDue: 0, // No spaced repetition in MVP
      cardsStudiedToday: 0, // No study sessions tracking in MVP
      accuracyRate: null, // No accuracy tracking in MVP
      lastStudied: null, // No last studied tracking in MVP
    };
  }
}