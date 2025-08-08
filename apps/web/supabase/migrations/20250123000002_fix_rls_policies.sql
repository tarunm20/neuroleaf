-- Fix RLS policies to prevent infinite recursion
-- Drop existing policies first
DROP POLICY IF EXISTS decks_select ON public.decks;
DROP POLICY IF EXISTS decks_insert ON public.decks;
DROP POLICY IF EXISTS decks_update ON public.decks;
DROP POLICY IF EXISTS decks_delete ON public.decks;

DROP POLICY IF EXISTS flashcards_select ON public.flashcards;
DROP POLICY IF EXISTS flashcards_insert ON public.flashcards;
DROP POLICY IF EXISTS flashcards_update ON public.flashcards;
DROP POLICY IF EXISTS flashcards_delete ON public.flashcards;

-- Create simplified RLS policies for decks (no circular references)
CREATE POLICY decks_select ON public.decks
    FOR SELECT USING (
        account_id = auth.uid() OR 
        visibility = 'public'
    );

CREATE POLICY decks_insert ON public.decks
    FOR INSERT WITH CHECK (account_id = auth.uid());

CREATE POLICY decks_update ON public.decks
    FOR UPDATE USING (account_id = auth.uid())
    WITH CHECK (account_id = auth.uid());

CREATE POLICY decks_delete ON public.decks
    FOR DELETE USING (account_id = auth.uid());

-- Create simplified RLS policies for flashcards
CREATE POLICY flashcards_select ON public.flashcards
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.decks d 
            WHERE d.id = flashcards.deck_id 
            AND (d.account_id = auth.uid() OR d.visibility = 'public')
        )
    );

CREATE POLICY flashcards_insert ON public.flashcards
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.decks d 
            WHERE d.id = flashcards.deck_id 
            AND d.account_id = auth.uid()
        )
    );

CREATE POLICY flashcards_update ON public.flashcards
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.decks d 
            WHERE d.id = flashcards.deck_id 
            AND d.account_id = auth.uid()
        )
    );

CREATE POLICY flashcards_delete ON public.flashcards
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.decks d 
            WHERE d.id = flashcards.deck_id 
            AND d.account_id = auth.uid()
        )
    );