/*
 * -------------------------------------------------------
 * Neuroleaf Flashcard Schema - Fixed Version
 * This migration creates the core tables for the Neuroleaf
 * AI-powered flashcard learning platform.
 * -------------------------------------------------------
 */

-- Create enum types for better data consistency
CREATE TYPE deck_visibility AS ENUM ('private', 'public', 'shared');
CREATE TYPE study_session_status AS ENUM ('active', 'completed', 'paused');
CREATE TYPE card_difficulty AS ENUM ('easy', 'medium', 'hard');

/*
 * -------------------------------------------------------
 * Table: Decks
 * Collections of flashcards organized by topic/subject
 * -------------------------------------------------------
 */
CREATE TABLE IF NOT EXISTS public.decks (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    visibility deck_visibility NOT NULL DEFAULT 'private',
    tags TEXT[],
    total_cards INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    public_data JSONB DEFAULT '{}'::jsonb
);

-- Add indexes for performance
CREATE INDEX idx_decks_account_id ON public.decks(account_id);
CREATE INDEX idx_decks_visibility ON public.decks(visibility);
CREATE INDEX idx_decks_tags ON public.decks USING GIN(tags);
CREATE INDEX idx_decks_created_at ON public.decks(created_at);

-- Enable RLS
ALTER TABLE public.decks ENABLE ROW LEVEL SECURITY;

/*
 * -------------------------------------------------------
 * Table: Flashcards
 * Individual flashcards within decks
 * -------------------------------------------------------
 */
CREATE TABLE IF NOT EXISTS public.flashcards (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    deck_id UUID NOT NULL REFERENCES public.decks(id) ON DELETE CASCADE,
    front_content TEXT NOT NULL,
    back_content TEXT NOT NULL,
    front_media_urls TEXT[],
    back_media_urls TEXT[],
    tags TEXT[],
    difficulty card_difficulty DEFAULT 'medium',
    position INTEGER DEFAULT 0,
    ai_generated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    public_data JSONB DEFAULT '{}'::jsonb
);

-- Add indexes
CREATE INDEX idx_flashcards_deck_id ON public.flashcards(deck_id);
CREATE INDEX idx_flashcards_tags ON public.flashcards USING GIN(tags);
CREATE INDEX idx_flashcards_difficulty ON public.flashcards(difficulty);
CREATE INDEX idx_flashcards_position ON public.flashcards(deck_id, position);

-- Enable RLS
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

/*
 * -------------------------------------------------------
 * Table: User Progress
 * Tracks individual user's learning progress per flashcard
 * Implements spaced repetition algorithm data
 * -------------------------------------------------------
 */
CREATE TABLE IF NOT EXISTS public.user_progress (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    flashcard_id UUID NOT NULL REFERENCES public.flashcards(id) ON DELETE CASCADE,
    ease_factor DECIMAL(4,2) DEFAULT 2.5, -- For SM-2 algorithm
    repetitions INTEGER DEFAULT 0,
    interval_days INTEGER DEFAULT 1,
    next_review_date TIMESTAMPTZ DEFAULT NOW(),
    last_reviewed_at TIMESTAMPTZ,
    total_reviews INTEGER DEFAULT 0,
    correct_reviews INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, flashcard_id)
);

-- Add indexes
CREATE INDEX idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX idx_user_progress_flashcard_id ON public.user_progress(flashcard_id);
CREATE INDEX idx_user_progress_next_review ON public.user_progress(next_review_date);
CREATE INDEX idx_user_progress_user_flashcard ON public.user_progress(user_id, flashcard_id);

-- Enable RLS
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

/*
 * -------------------------------------------------------
 * Table: Study Sessions
 * Tracks user study sessions for analytics and progress
 * -------------------------------------------------------
 */
CREATE TABLE IF NOT EXISTS public.study_sessions (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    deck_id UUID NOT NULL REFERENCES public.decks(id) ON DELETE CASCADE,
    status study_session_status DEFAULT 'active',
    cards_studied INTEGER DEFAULT 0,
    cards_correct INTEGER DEFAULT 0,
    total_time_seconds INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    session_data JSONB DEFAULT '{}'::jsonb
);

-- Add indexes
CREATE INDEX idx_study_sessions_user_id ON public.study_sessions(user_id);
CREATE INDEX idx_study_sessions_deck_id ON public.study_sessions(deck_id);
CREATE INDEX idx_study_sessions_started_at ON public.study_sessions(started_at);

-- Enable RLS
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

/*
 * -------------------------------------------------------
 * Table: AI Generations
 * Tracks AI-generated content for auditing and improvement
 * -------------------------------------------------------
 */
CREATE TABLE IF NOT EXISTS public.ai_generations (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    deck_id UUID REFERENCES public.decks(id) ON DELETE CASCADE,
    flashcard_id UUID REFERENCES public.flashcards(id) ON DELETE CASCADE,
    generation_type VARCHAR(50) NOT NULL, -- 'flashcard', 'deck', 'hint', etc.
    prompt TEXT NOT NULL,
    generated_content JSONB NOT NULL,
    model_used VARCHAR(100),
    tokens_used INTEGER,
    generation_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_ai_generations_user_id ON public.ai_generations(user_id);
CREATE INDEX idx_ai_generations_deck_id ON public.ai_generations(deck_id);
CREATE INDEX idx_ai_generations_type ON public.ai_generations(generation_type);
CREATE INDEX idx_ai_generations_created_at ON public.ai_generations(created_at);

-- Enable RLS
ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;

/*
 * -------------------------------------------------------
 * Table: Deck Collaborators
 * For shared deck functionality - users who can access shared decks
 * -------------------------------------------------------
 */
CREATE TABLE IF NOT EXISTS public.deck_collaborators (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    deck_id UUID NOT NULL REFERENCES public.decks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invited_by UUID NOT NULL REFERENCES auth.users(id),
    role VARCHAR(20) DEFAULT 'viewer', -- 'viewer', 'editor'
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    
    UNIQUE(deck_id, user_id)
);

-- Add indexes
CREATE INDEX idx_deck_collaborators_deck_id ON public.deck_collaborators(deck_id);
CREATE INDEX idx_deck_collaborators_user_id ON public.deck_collaborators(user_id);

-- Enable RLS
ALTER TABLE public.deck_collaborators ENABLE ROW LEVEL SECURITY;

/*
 * -------------------------------------------------------
 * RLS POLICIES (after all tables are created)
 * -------------------------------------------------------
 */

-- RLS Policies for decks
CREATE POLICY decks_select ON public.decks
    FOR SELECT USING (
        account_id = (SELECT auth.uid()) OR 
        visibility = 'public' OR
        (visibility = 'shared' AND id IN (
            SELECT deck_id FROM public.deck_collaborators 
            WHERE user_id = (SELECT auth.uid())
        ))
    );

CREATE POLICY decks_insert ON public.decks
    FOR INSERT WITH CHECK (account_id = (SELECT auth.uid()));

CREATE POLICY decks_update ON public.decks
    FOR UPDATE USING (account_id = (SELECT auth.uid()))
    WITH CHECK (account_id = (SELECT auth.uid()));

CREATE POLICY decks_delete ON public.decks
    FOR DELETE USING (account_id = (SELECT auth.uid()));

-- RLS Policies for flashcards (inherit from deck permissions)
CREATE POLICY flashcards_select ON public.flashcards
    FOR SELECT USING (
        deck_id IN (
            SELECT id FROM public.decks 
            WHERE account_id = (SELECT auth.uid()) OR 
                  visibility = 'public' OR
                  (visibility = 'shared' AND id IN (
                      SELECT deck_id FROM public.deck_collaborators 
                      WHERE user_id = (SELECT auth.uid())
                  ))
        )
    );

CREATE POLICY flashcards_insert ON public.flashcards
    FOR INSERT WITH CHECK (
        deck_id IN (SELECT id FROM public.decks WHERE account_id = (SELECT auth.uid()))
    );

CREATE POLICY flashcards_update ON public.flashcards
    FOR UPDATE USING (
        deck_id IN (SELECT id FROM public.decks WHERE account_id = (SELECT auth.uid()))
    );

CREATE POLICY flashcards_delete ON public.flashcards
    FOR DELETE USING (
        deck_id IN (SELECT id FROM public.decks WHERE account_id = (SELECT auth.uid()))
    );

-- RLS Policies for user_progress
CREATE POLICY user_progress_select ON public.user_progress
    FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY user_progress_insert ON public.user_progress
    FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY user_progress_update ON public.user_progress
    FOR UPDATE USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY user_progress_delete ON public.user_progress
    FOR DELETE USING (user_id = (SELECT auth.uid()));

-- RLS Policies for study_sessions
CREATE POLICY study_sessions_select ON public.study_sessions
    FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY study_sessions_insert ON public.study_sessions
    FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY study_sessions_update ON public.study_sessions
    FOR UPDATE USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY study_sessions_delete ON public.study_sessions
    FOR DELETE USING (user_id = (SELECT auth.uid()));

-- RLS Policies for ai_generations
CREATE POLICY ai_generations_select ON public.ai_generations
    FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY ai_generations_insert ON public.ai_generations
    FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

-- RLS Policies for deck_collaborators
CREATE POLICY deck_collaborators_select ON public.deck_collaborators
    FOR SELECT USING (
        user_id = (SELECT auth.uid()) OR
        deck_id IN (SELECT id FROM public.decks WHERE account_id = (SELECT auth.uid()))
    );

CREATE POLICY deck_collaborators_insert ON public.deck_collaborators
    FOR INSERT WITH CHECK (
        deck_id IN (SELECT id FROM public.decks WHERE account_id = (SELECT auth.uid()))
    );

CREATE POLICY deck_collaborators_update ON public.deck_collaborators
    FOR UPDATE USING (
        deck_id IN (SELECT id FROM public.decks WHERE account_id = (SELECT auth.uid()))
    );

CREATE POLICY deck_collaborators_delete ON public.deck_collaborators
    FOR DELETE USING (
        deck_id IN (SELECT id FROM public.decks WHERE account_id = (SELECT auth.uid())) OR
        user_id = (SELECT auth.uid())
    );

/*
 * -------------------------------------------------------
 * TRIGGERS AND FUNCTIONS
 * -------------------------------------------------------
 */

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER decks_updated_at 
    BEFORE UPDATE ON public.decks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER flashcards_updated_at 
    BEFORE UPDATE ON public.flashcards 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER user_progress_updated_at 
    BEFORE UPDATE ON public.user_progress 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at();

-- Function to update deck total_cards count
CREATE OR REPLACE FUNCTION update_deck_total_cards()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.decks 
        SET total_cards = total_cards + 1 
        WHERE id = NEW.deck_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.decks 
        SET total_cards = GREATEST(total_cards - 1, 0) 
        WHERE id = OLD.deck_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language plpgsql;

-- Add trigger to keep total_cards in sync
CREATE TRIGGER flashcards_count_trigger 
    AFTER INSERT OR DELETE ON public.flashcards 
    FOR EACH ROW 
    EXECUTE FUNCTION update_deck_total_cards();

/*
 * -------------------------------------------------------
 * PERMISSIONS
 * Grant necessary permissions to authenticated users
 * -------------------------------------------------------
 */

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.decks TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.flashcards TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_progress TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_sessions TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_generations TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deck_collaborators TO authenticated, service_role;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;