'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';
import { requireUser } from '@kit/supabase/require-user';
import { checkDeckLimit } from '@kit/subscription/server';
import { DeckService } from './deck-service';
import { CreateDeckData, UpdateDeckData } from '../schemas/deck.schema';

async function getDeckService() {
  const supabase = getSupabaseServerAdminClient();
  return new DeckService(supabase);
}

export async function createDeckAction(data: CreateDeckData) {
  const supabase = getSupabaseServerAdminClient();
  const result = await requireUser(supabase);
  
  if (result.error) {
    throw new Error('Authentication required');
  }
  
  // Check deck limit before creating
  const deckLimitCheck = await checkDeckLimit(result.data.id);
  if (!deckLimitCheck.canCreate) {
    throw new Error(`Deck limit reached (${deckLimitCheck.current}/${deckLimitCheck.limit}). Please upgrade to create more decks.`);
  }
  
  const deckService = await getDeckService();

  try {
    const deck = await deckService.createDeck(data, result.data.id, result.data.id);
    
    revalidatePath('/home/decks');
    redirect(`/home/decks/${deck.id}`);
  } catch (error) {
    throw new Error(`Failed to create deck: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function updateDeckAction(data: UpdateDeckData) {
  const supabase = getSupabaseServerAdminClient();
  const result = await requireUser(supabase);
  
  if (result.error) {
    return { 
      success: false, 
      error: 'Authentication required' 
    };
  }
  
  const deckService = await getDeckService();

  try {
    const deck = await deckService.updateDeck(data, result.data.id);
    
    revalidatePath('/home/decks');
    revalidatePath(`/home/decks/${deck.id}`);
    
    return { success: true, deck };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update deck' 
    };
  }
}

export async function deleteDeckAction(deckId: string) {
  const supabase = getSupabaseServerAdminClient();
  await requireUser(supabase);
  const deckService = await getDeckService();

  try {
    await deckService.deleteDeck(deckId);
    
    revalidatePath('/home/decks');
    
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete deck' 
    };
  }
}

export async function duplicateDeckAction(deckId: string, newName?: string) {
  const supabase = getSupabaseServerAdminClient();
  const result = await requireUser(supabase);
  
  if (result.error) {
    return { 
      success: false, 
      error: 'Authentication required' 
    };
  }
  
  // Check deck limit before duplicating
  const deckLimitCheck = await checkDeckLimit(result.data.id);
  if (!deckLimitCheck.canCreate) {
    return { 
      success: false, 
      error: `Deck limit reached (${deckLimitCheck.current}/${deckLimitCheck.limit}). Please upgrade to create more decks.` 
    };
  }
  
  const deckService = await getDeckService();

  try {
    const newDeck = await deckService.duplicateDeck(deckId, result.data.id, result.data.id, newName);
    
    revalidatePath('/home/decks');
    
    return { success: true, deck: newDeck };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to duplicate deck' 
    };
  }
}

