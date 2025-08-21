'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { requireUser } from '@kit/supabase/require-user';
import { FlashcardService } from './flashcard-service';
import { 
  CreateFlashcardData, 
  UpdateFlashcardData, 
  BulkImportData, 
  ReorderFlashcardsData,
  AIGenerationRequestData 
} from '../schemas/flashcard.schema';
import { FlashcardGenerator } from '@kit/ai/flashcard-generator';
import { createGeminiClient } from '@kit/ai/gemini';
import { SubscriptionService } from '@kit/subscription/server';

async function getFlashcardService() {
  const supabase = getSupabaseServerAdminClient();
  return new FlashcardService(supabase);
}

export async function createFlashcardAction(data: CreateFlashcardData) {
  const supabase = getSupabaseServerClient();
  const result = await requireUser(supabase);
  
  if (result.error) {
    throw new Error('Authentication required');
  }
  
  const flashcardService = await getFlashcardService();

  try {
    const flashcard = await flashcardService.createFlashcard(data, result.data.id);
    
    revalidatePath(`/home/decks/${data.deck_id}`);
    revalidatePath(`/home/decks/${data.deck_id}/flashcards`);
    
    return { success: true, flashcard };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create flashcard' 
    };
  }
}

export async function updateFlashcardAction(data: UpdateFlashcardData) {
  const supabase = getSupabaseServerClient();
  const result = await requireUser(supabase);
  
  if (result.error) {
    return { 
      success: false, 
      error: 'Authentication required' 
    };
  }
  
  const flashcardService = await getFlashcardService();

  try {
    const flashcard = await flashcardService.updateFlashcard(data, result.data.id);
    
    // Get deck_id for revalidation
    const { data: flashcardData } = await supabase
      .from('flashcards')
      .select('deck_id')
      .eq('id', data.id)
      .single();
    
    if (flashcardData) {
      revalidatePath(`/home/decks/${flashcardData.deck_id}`);
      revalidatePath(`/home/decks/${flashcardData.deck_id}/flashcards`);
      revalidatePath(`/home/decks/${flashcardData.deck_id}/flashcards/${data.id}`);
    }
    
    return { success: true, flashcard };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update flashcard' 
    };
  }
}

export async function deleteFlashcardAction(flashcardId: string) {
  const supabase = getSupabaseServerClient();
  const result = await requireUser(supabase);
  
  if (result.error) {
    return { 
      success: false, 
      error: 'Authentication required' 
    };
  }
  
  const flashcardService = await getFlashcardService();

  try {
    // Get deck_id before deletion
    const { data: flashcardData } = await supabase
      .from('flashcards')
      .select('deck_id')
      .eq('id', flashcardId)
      .single();
    
    await flashcardService.deleteFlashcard(flashcardId);
    
    if (flashcardData) {
      revalidatePath(`/home/decks/${flashcardData.deck_id}`);
      revalidatePath(`/home/decks/${flashcardData.deck_id}/flashcards`);
    }
    
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete flashcard' 
    };
  }
}

export async function bulkDeleteFlashcardsAction(flashcardIds: string[]) {
  const supabase = getSupabaseServerClient();
  const result = await requireUser(supabase);
  
  if (result.error) {
    return { 
      success: false, 
      error: 'Authentication required' 
    };
  }
  
  const flashcardService = await getFlashcardService();

  try {
    // Get unique deck IDs for revalidation
    const { data: flashcardsData } = await supabase
      .from('flashcards')
      .select('deck_id')
      .in('id', flashcardIds);
    
    const deckIds = [...new Set(flashcardsData?.map(f => f.deck_id) || [])];
    
    await flashcardService.bulkDeleteFlashcards(flashcardIds);
    
    // Revalidate all affected decks
    deckIds.forEach(deckId => {
      revalidatePath(`/home/decks/${deckId}`);
      revalidatePath(`/home/decks/${deckId}/flashcards`);
    });
    
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete flashcards' 
    };
  }
}

export async function duplicateFlashcardsAction(flashcardIds: string[], targetDeckId?: string) {
  const supabase = getSupabaseServerClient();
  const result = await requireUser(supabase);
  
  if (result.error) {
    return { 
      success: false, 
      error: 'Authentication required' 
    };
  }
  
  const flashcardService = await getFlashcardService();

  try {
    const duplicatedCards = await flashcardService.duplicateFlashcards(flashcardIds, targetDeckId);
    
    // Revalidate target deck (or original deck if no target specified)
    if (duplicatedCards.length > 0) {
      const deckId = targetDeckId || duplicatedCards[0]?.deck_id;
      if (deckId) {
        revalidatePath(`/home/decks/${deckId}`);
        revalidatePath(`/home/decks/${deckId}/flashcards`);
      }
    }
    
    return { success: true, flashcards: duplicatedCards };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to duplicate flashcards' 
    };
  }
}

export async function reorderFlashcardsAction(data: ReorderFlashcardsData) {
  const supabase = getSupabaseServerClient();
  const result = await requireUser(supabase);
  
  if (result.error) {
    return { 
      success: false, 
      error: 'Authentication required' 
    };
  }
  
  const flashcardService = await getFlashcardService();

  try {
    await flashcardService.reorderFlashcards(data);
    
    revalidatePath(`/home/decks/${data.deck_id}`);
    revalidatePath(`/home/decks/${data.deck_id}/flashcards`);
    
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to reorder flashcards' 
    };
  }
}

export async function bulkImportFlashcardsAction(data: BulkImportData) {
  const supabase = getSupabaseServerClient();
  const result = await requireUser(supabase);
  
  if (result.error) {
    return { 
      success: false, 
      error: 'Authentication required' 
    };
  }
  
  const flashcardService = await getFlashcardService();

  try {
    const importedCards = await flashcardService.bulkImportFlashcards(data, result.data.id);
    
    revalidatePath(`/home/decks/${data.deck_id}`);
    revalidatePath(`/home/decks/${data.deck_id}/flashcards`);
    
    return { success: true, flashcards: importedCards };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to import flashcards' 
    };
  }
}

export async function generateFlashcardsWithAIAction(data: AIGenerationRequestData) {
  const supabase = getSupabaseServerClient();
  const result = await requireUser(supabase);
  
  if (result.error) {
    return { 
      success: false, 
      error: 'Authentication required' 
    };
  }
  
  try {
    // Validate environment
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Gemini API key is not configured. Please check your environment variables.');
    }

    // Validate input data
    if (data.is_image) {
      // For images, validate that image_data is provided
      if (!data.image_data) {
        throw new Error('Image data is required for image-based flashcard generation.');
      }
    } else {
      // For text content, validate length
      if (!data.content || data.content.trim().length < 10) {
        throw new Error('Content is too short. Please provide at least 10 characters of content to generate flashcards.');
      }
    }

    console.log('[AI Generation] Starting flashcard generation:', {
      contentLength: data.content.length,
      numberOfCards: data.number_of_cards,
      difficulty: data.difficulty,
      language: data.language,
      subject: data.subject,
      isImage: data.is_image,
      hasImageData: !!data.image_data,
    });

    // Create AI client and generator
    const aiClient = createGeminiClient();
    const generator = new FlashcardGenerator(aiClient);
    
    // Generate flashcards using AI (AI will determine optimal count)
    const aiResponse = await generator.generateFlashcards({
      content: data.content,
      numberOfCards: data.number_of_cards, // This will be overridden by AI analysis
      difficulty: data.difficulty,
      language: data.language,
      subject: data.subject,
      imageData: data.image_data,
      isImage: data.is_image,
    });
    
    // Validate card limits after AI generation
    if (aiResponse.flashcards && aiResponse.flashcards.length > 0) {
      // Get the account ID from the deck
      const { data: deck, error: deckError } = await supabase
        .from('decks')
        .select('account_id')
        .eq('id', data.deck_id)
        .single();

      if (deckError || !deck) {
        throw new Error('Deck not found or access denied');
      }

      // Check if user can create the AI-suggested number of cards
      const subscriptionService = new SubscriptionService(supabase);
      const cardLimitCheck = await subscriptionService.canCreateCards(deck.account_id, data.deck_id, aiResponse.flashcards.length);
      
      if (!cardLimitCheck.canCreate) {
        // Truncate to allowed count if exceeding limits
        if (cardLimitCheck.maxAllowed > 0) {
          const originalCount = aiResponse.flashcards.length;
          aiResponse.flashcards = aiResponse.flashcards.slice(0, cardLimitCheck.maxAllowed);
          console.log(`[AI Generation] Truncated from ${originalCount} to ${cardLimitCheck.maxAllowed} cards due to tier limits`);
        } else {
          throw new Error(cardLimitCheck.reason || 'Card limit exceeded');
        }
      }
    }
    
    console.log('[AI Generation] Generated flashcards:', {
      count: aiResponse.flashcards?.length || 0,
      tokensUsed: aiResponse.metadata.tokensUsed,
    });

    if (!aiResponse.flashcards || aiResponse.flashcards.length === 0) {
      throw new Error('No flashcards were generated. The AI may have had trouble processing your content. Please try with different content or fewer cards.');
    }
    
    // Convert AI response to flashcard format and import
    const flashcardsToImport = aiResponse.flashcards.map((card: any) => ({
      front_content: card.front,
      back_content: card.back,
      front_media_urls: [],
      back_media_urls: [],
      tags: card.tags || [],
      difficulty: card.difficulty || 'medium' as const,
      ai_generated: true,
      public_data: {},
    }));
    
    const flashcardService = await getFlashcardService();
    const importedCards = await flashcardService.bulkImportFlashcards({
      deck_id: data.deck_id,
      flashcards: flashcardsToImport,
      overwrite_existing: false,
    }, result.data.id);
    
    // Log AI generation for tracking
    await supabase.from('ai_generations').insert({
      user_id: result.data.id,
      deck_id: data.deck_id,
      generation_type: 'flashcard',
      prompt: data.content,
      generated_content: aiResponse,
      model_used: aiResponse.metadata.model,
      tokens_used: aiResponse.metadata.tokensUsed,
      generation_time_ms: aiResponse.metadata.processingTime,
      created_at: new Date().toISOString(),
    });
    
    revalidatePath(`/home/decks/${data.deck_id}`);
    revalidatePath(`/home/decks/${data.deck_id}/flashcards`);
    
    console.log('[AI Generation] Successfully imported flashcards:', {
      imported: importedCards.length,
      requested: data.number_of_cards,
    });

    return { 
      success: true, 
      flashcards: aiResponse.flashcards,
      metadata: aiResponse.metadata 
    };
  } catch (error) {
    console.error('[AI Generation] Error:', error);
    
    // Provide helpful error messages based on error type
    let userFriendlyMessage = 'Failed to generate flashcards';
    
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      
      if (errorMessage.includes('api key') || errorMessage.includes('authentication')) {
        userFriendlyMessage = 'AI service is not properly configured. Please contact support.';
      } else if (errorMessage.includes('quota') || errorMessage.includes('QUOTA_EXCEEDED')) {
        userFriendlyMessage = 'AI generation is temporarily at capacity. Please try again in a few minutes.';
      } else if (errorMessage.includes('content') && errorMessage.includes('short')) {
        userFriendlyMessage = error.message; // Use the specific content validation message
      } else if (errorMessage.includes('no flashcards')) {
        userFriendlyMessage = error.message; // Use the specific AI generation message
      } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
        userFriendlyMessage = 'Unable to connect to AI service. Please check your internet connection and try again.';
      } else {
        userFriendlyMessage = `AI generation failed: ${error.message}`;
      }
    }
    
    return { 
      success: false, 
      error: userFriendlyMessage
    };
  }
}