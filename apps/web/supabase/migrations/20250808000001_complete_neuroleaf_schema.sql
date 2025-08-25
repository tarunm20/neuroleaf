/*
 * -------------------------------------------------------
 * Complete Neuroleaf Production Schema
 * Includes MakerKit base + Neuroleaf extensions
 * -------------------------------------------------------
 */

/*
 * -------------------------------------------------------
 * MakerKit Base Schema - Security & Accounts
 * -------------------------------------------------------
 */
-- Create a private Makerkit schema
CREATE SCHEMA IF NOT EXISTS kit;
CREATE EXTENSION IF NOT EXISTS "unaccent" SCHEMA kit;

-- We remove all default privileges from public schema on functions to
--   prevent public access to them
ALTER DEFAULT PRIVILEGES
    REVOKE EXECUTE ON FUNCTIONS
    FROM public;

REVOKE ALL ON SCHEMA public FROM public;

REVOKE ALL PRIVILEGES ON DATABASE "postgres" FROM "anon";
REVOKE ALL PRIVILEGES ON SCHEMA "public" FROM "anon";
REVOKE ALL PRIVILEGES ON SCHEMA "storage" FROM "anon";
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA "public" FROM "anon";
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA "storage" FROM "anon";
REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA "public" FROM "anon";
REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA "storage" FROM "anon";
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA "public" FROM "anon";
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA "storage" FROM "anon";

-- We remove all default privileges from public schema on functions to
--   prevent public access to them by default
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    REVOKE EXECUTE ON FUNCTIONS
    FROM anon, authenticated;

-- we allow the authenticated role to execute functions in the public schema
GRANT USAGE ON SCHEMA public TO authenticated;

-- we allow the service_role role to execute functions in the public schema
GRANT USAGE ON SCHEMA public TO service_role;

/*
 * -------------------------------------------------------
 * Accounts Table (MakerKit Base)
 * -------------------------------------------------------
 */
CREATE TABLE IF NOT EXISTS public.accounts (
    id          UUID UNIQUE  NOT NULL DEFAULT extensions.uuid_generate_v4(),
    name        VARCHAR(255) NOT NULL,
    email       VARCHAR(320) UNIQUE,
    updated_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ,
    created_by  UUID REFERENCES auth.users,
    updated_by  UUID REFERENCES auth.users,
    picture_url VARCHAR(1000),
    public_data JSONB DEFAULT '{}'::jsonb NOT NULL,
    PRIMARY KEY (id)
);

COMMENT ON TABLE public.accounts IS 'Accounts are the top level entity in the Supabase MakerKit';
COMMENT ON COLUMN public.accounts.name IS 'The name of the account';
COMMENT ON COLUMN public.accounts.email IS 'The email of the account. For teams, this is the email of the team (if any)';
COMMENT ON COLUMN public.accounts.picture_url IS 'The picture url of the account';
COMMENT ON COLUMN public.accounts.public_data IS 'The public data of the account. Use this to store any additional data that you want to store for the account';
COMMENT ON COLUMN public.accounts.updated_at IS 'The timestamp when the account was last updated';
COMMENT ON COLUMN public.accounts.created_at IS 'The timestamp when the account was created';
COMMENT ON COLUMN public.accounts.created_by IS 'The user who created the account';
COMMENT ON COLUMN public.accounts.updated_by IS 'The user who last updated the account';

-- Enable RLS on the accounts table
ALTER TABLE "public"."accounts" ENABLE ROW LEVEL SECURITY;

-- Users can read their own accounts
CREATE POLICY accounts_read ON public.accounts FOR SELECT TO authenticated 
    USING ((SELECT auth.uid()) = id);

-- Users can update their own accounts
CREATE POLICY accounts_update ON public.accounts
    FOR UPDATE TO authenticated 
    USING ((SELECT auth.uid()) = id)
    WITH CHECK ((SELECT auth.uid()) = id);

-- Revoke all on accounts table from authenticated and service_role
REVOKE ALL ON public.accounts FROM authenticated, service_role;

-- Open up access to accounts
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.accounts TO authenticated, service_role;

-- Function to protect account fields from being updated by anyone
CREATE OR REPLACE FUNCTION kit.protect_account_fields() RETURNS TRIGGER AS $$
BEGIN
    IF current_user IN ('authenticated', 'anon') THEN
        IF NEW.id <> OLD.id OR NEW.email <> OLD.email THEN
            RAISE EXCEPTION 'You do not have permission to update this field';
        END IF;
    END IF;
    RETURN NEW;
END
$$ LANGUAGE plpgsql SET search_path = '';

-- trigger to protect account fields
CREATE TRIGGER protect_account_fields
    BEFORE UPDATE ON public.accounts
    FOR EACH ROW
    EXECUTE FUNCTION kit.protect_account_fields();

-- create a trigger to update the account email when the primary owner email is updated
CREATE OR REPLACE FUNCTION kit.handle_update_user_email() RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = '' AS $$
BEGIN
    UPDATE public.accounts 
    SET email = NEW.email
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$;

-- trigger the function every time a user email is updated
CREATE TRIGGER "on_auth_user_updated"
    AFTER UPDATE OF email ON auth.users
    FOR EACH ROW
    EXECUTE PROCEDURE kit.handle_update_user_email();

-- Setup a new user account after user creation
CREATE OR REPLACE FUNCTION kit.new_user_created_setup() RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = '' AS $$
DECLARE
    user_name   TEXT;
    picture_url TEXT;
BEGIN
    IF NEW.raw_user_meta_data ->> 'name' IS NOT NULL THEN
        user_name := NEW.raw_user_meta_data ->> 'name';
    END IF;

    IF user_name IS NULL AND NEW.email IS NOT NULL THEN
        user_name := split_part(NEW.email, '@', 1);
    END IF;

    IF user_name IS NULL THEN
        user_name := '';
    END IF;

    IF NEW.raw_user_meta_data ->> 'avatar_url' IS NOT NULL THEN
        picture_url := NEW.raw_user_meta_data ->> 'avatar_url';
    ELSE
        picture_url := NULL;
    END IF;

    INSERT INTO public.accounts(id, name, picture_url, email)
    VALUES (NEW.id, user_name, picture_url, NEW.email);

    RETURN NEW;
END;
$$;

-- trigger the function every time a user is created
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE PROCEDURE kit.new_user_created_setup();

-- Storage - Account Image
INSERT INTO storage.buckets (id, name, PUBLIC)
VALUES ('account_image', 'account_image', true);

-- Function: get the storage filename as a UUID.
CREATE OR REPLACE FUNCTION kit.get_storage_filename_as_uuid(name TEXT) RETURNS UUID
SET search_path = '' AS $$
BEGIN
    RETURN replace(storage.filename(name), concat('.', storage.extension(name)), '')::uuid;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION kit.get_storage_filename_as_uuid (TEXT) TO authenticated, service_role;

-- RLS policies for storage bucket account_image
CREATE POLICY account_image ON storage.objects FOR ALL USING (
    bucket_id = 'account_image'
    AND (kit.get_storage_filename_as_uuid(name) = auth.uid())
) WITH CHECK (
    bucket_id = 'account_image'
    AND (kit.get_storage_filename_as_uuid(name) = auth.uid())
);

/*
 * -------------------------------------------------------
 * Neuroleaf Extensions - Add Subscription Columns to Accounts
 * -------------------------------------------------------
 */

-- Create enum types for Neuroleaf
CREATE TYPE deck_visibility AS ENUM ('private', 'public', 'shared');
CREATE TYPE study_session_status AS ENUM ('active', 'completed', 'paused');
CREATE TYPE card_difficulty AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'premium');
CREATE TYPE test_mode AS ENUM ('flashcard', 'ai_questions');

-- Add subscription tier and limits to accounts
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS subscription_tier subscription_tier DEFAULT 'free',
ADD COLUMN IF NOT EXISTS deck_limit INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS flashcard_limit_per_deck INTEGER DEFAULT 50;

-- Add Stripe billing columns to accounts
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT,
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

-- Create indexes for subscription columns
CREATE INDEX IF NOT EXISTS idx_accounts_subscription_tier ON accounts(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_accounts_stripe_customer_id ON accounts(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_accounts_stripe_subscription_id ON accounts(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_accounts_subscription_expires_at ON accounts(subscription_expires_at);
CREATE INDEX IF NOT EXISTS idx_accounts_flashcard_limit ON accounts(flashcard_limit_per_deck);

-- Update existing accounts to have default tier and limits
UPDATE accounts 
SET 
    subscription_tier = 'free', 
    deck_limit = 3,
    flashcard_limit_per_deck = 50
WHERE subscription_tier IS NULL;

-- Set tier-based flashcard limits
UPDATE accounts 
SET flashcard_limit_per_deck = CASE 
  WHEN subscription_tier = 'free' THEN 50
  WHEN subscription_tier = 'pro' THEN -1
  WHEN subscription_tier = 'premium' THEN -1
  ELSE 50
END;

/*
 * -------------------------------------------------------
 * Neuroleaf Tables
 * -------------------------------------------------------
 */

-- Decks Table
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

CREATE INDEX idx_decks_account_id ON public.decks(account_id);
CREATE INDEX idx_decks_visibility ON public.decks(visibility);
CREATE INDEX idx_decks_tags ON public.decks USING GIN(tags);
CREATE INDEX idx_decks_created_at ON public.decks(created_at);

ALTER TABLE public.decks ENABLE ROW LEVEL SECURITY;

-- Flashcards Table
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

CREATE INDEX idx_flashcards_deck_id ON public.flashcards(deck_id);
CREATE INDEX idx_flashcards_tags ON public.flashcards USING GIN(tags);
CREATE INDEX idx_flashcards_difficulty ON public.flashcards(difficulty);
CREATE INDEX idx_flashcards_position ON public.flashcards(deck_id, position);

ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

-- User Progress Table (Simplified for MVP)
CREATE TABLE IF NOT EXISTS public.user_progress (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    flashcard_id UUID NOT NULL REFERENCES public.flashcards(id) ON DELETE CASCADE,
    last_reviewed_at TIMESTAMPTZ,
    total_reviews INTEGER DEFAULT 0,
    correct_reviews INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    mastery_level INTEGER DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 100),
    needs_review BOOLEAN DEFAULT TRUE,
    first_learned_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, flashcard_id)
);

CREATE INDEX idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX idx_user_progress_flashcard_id ON public.user_progress(flashcard_id);
CREATE INDEX idx_user_progress_user_flashcard ON public.user_progress(user_id, flashcard_id);
CREATE INDEX idx_user_progress_mastery ON public.user_progress(user_id, mastery_level);

ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Study Sessions Table
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
    session_data JSONB DEFAULT '{}'::jsonb,
    session_type VARCHAR(20) DEFAULT 'study' CHECK (session_type IN ('study', 'test')),
    average_score DECIMAL(4,2) DEFAULT NULL
);

CREATE INDEX idx_study_sessions_user_id ON public.study_sessions(user_id);
CREATE INDEX idx_study_sessions_deck_id ON public.study_sessions(deck_id);
CREATE INDEX idx_study_sessions_started_at ON public.study_sessions(started_at);

ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

-- AI Generations Table
CREATE TABLE IF NOT EXISTS public.ai_generations (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    deck_id UUID REFERENCES public.decks(id) ON DELETE CASCADE,
    flashcard_id UUID REFERENCES public.flashcards(id) ON DELETE CASCADE,
    generation_type VARCHAR(50) NOT NULL,
    prompt TEXT NOT NULL,
    generated_content JSONB NOT NULL,
    model_used VARCHAR(100),
    tokens_used INTEGER,
    generation_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_generations_user_id ON public.ai_generations(user_id);
CREATE INDEX idx_ai_generations_deck_id ON public.ai_generations(deck_id);
CREATE INDEX idx_ai_generations_type ON public.ai_generations(generation_type);
CREATE INDEX idx_ai_generations_created_at ON public.ai_generations(created_at);

ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;

-- Deck Collaborators Table
CREATE TABLE IF NOT EXISTS public.deck_collaborators (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    deck_id UUID NOT NULL REFERENCES public.decks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invited_by UUID NOT NULL REFERENCES auth.users(id),
    role VARCHAR(20) DEFAULT 'viewer',
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    
    UNIQUE(deck_id, user_id)
);

CREATE INDEX idx_deck_collaborators_deck_id ON public.deck_collaborators(deck_id);
CREATE INDEX idx_deck_collaborators_user_id ON public.deck_collaborators(user_id);

ALTER TABLE public.deck_collaborators ENABLE ROW LEVEL SECURITY;

-- Test Sessions Table (AI Test Mode)
CREATE TABLE IF NOT EXISTS public.test_sessions (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    deck_id UUID NOT NULL REFERENCES public.decks(id) ON DELETE CASCADE,
    
    -- Test configuration
    test_mode test_mode NOT NULL DEFAULT 'flashcard',
    total_questions INTEGER NOT NULL DEFAULT 0,
    questions_completed INTEGER DEFAULT 0,
    
    -- Performance metrics
    average_score DECIMAL(4,2) DEFAULT NULL,
    time_spent_seconds INTEGER DEFAULT 0,
    
    -- Session status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ DEFAULT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_test_sessions_user_id ON public.test_sessions(user_id);
CREATE INDEX idx_test_sessions_deck_id ON public.test_sessions(deck_id);
CREATE INDEX idx_test_sessions_status ON public.test_sessions(status);
CREATE INDEX idx_test_sessions_started_at ON public.test_sessions(started_at);

ALTER TABLE public.test_sessions ENABLE ROW LEVEL SECURITY;

-- Test Responses Table (AI Graded)
CREATE TABLE IF NOT EXISTS public.test_responses (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    test_session_id UUID NOT NULL REFERENCES public.test_sessions(id) ON DELETE CASCADE,
    flashcard_id UUID REFERENCES public.flashcards(id) ON DELETE CASCADE,
    
    -- Question and response
    question_text TEXT NOT NULL,
    expected_answer TEXT DEFAULT NULL,
    user_response TEXT NOT NULL,
    
    -- AI grading results
    ai_score DECIMAL(4,2) NOT NULL CHECK (ai_score >= 0 AND ai_score <= 100),
    ai_feedback TEXT NOT NULL,
    ai_model_used VARCHAR(100) DEFAULT NULL,
    
    -- Performance tracking
    response_time_seconds INTEGER DEFAULT NULL,
    is_correct BOOLEAN DEFAULT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_test_responses_session_id ON public.test_responses(test_session_id);
CREATE INDEX idx_test_responses_flashcard_id ON public.test_responses(flashcard_id);
CREATE INDEX idx_test_responses_score ON public.test_responses(ai_score);
CREATE INDEX idx_test_responses_created_at ON public.test_responses(created_at);

ALTER TABLE public.test_responses ENABLE ROW LEVEL SECURITY;

-- Performance Analytics Table
CREATE TABLE IF NOT EXISTS public.performance_analytics (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    flashcard_id UUID NOT NULL REFERENCES public.flashcards(id) ON DELETE CASCADE,
    
    -- Performance metrics
    total_attempts INTEGER DEFAULT 0,
    correct_attempts INTEGER DEFAULT 0,
    average_score DECIMAL(4,2) DEFAULT NULL,
    best_score DECIMAL(4,2) DEFAULT NULL,
    latest_score DECIMAL(4,2) DEFAULT NULL,
    
    -- Mastery tracking
    mastery_level INTEGER DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 100),
    is_mastered BOOLEAN DEFAULT FALSE,
    mastered_at TIMESTAMPTZ DEFAULT NULL,
    
    -- Timestamps
    first_attempt_at TIMESTAMPTZ DEFAULT NULL,
    last_attempt_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, flashcard_id)
);

CREATE INDEX idx_performance_analytics_user_id ON public.performance_analytics(user_id);
CREATE INDEX idx_performance_analytics_flashcard_id ON public.performance_analytics(flashcard_id);
CREATE INDEX idx_performance_analytics_mastery ON public.performance_analytics(user_id, mastery_level);
CREATE INDEX idx_performance_analytics_mastered ON public.performance_analytics(user_id, is_mastered);

ALTER TABLE public.performance_analytics ENABLE ROW LEVEL SECURITY;

/*
 * -------------------------------------------------------
 * RLS POLICIES
 * -------------------------------------------------------
 */

-- RLS Policies for decks
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

-- RLS Policies for flashcards
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

-- RLS Policies for user_progress
CREATE POLICY user_progress_select ON public.user_progress
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY user_progress_insert ON public.user_progress
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY user_progress_update ON public.user_progress
    FOR UPDATE USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY user_progress_delete ON public.user_progress
    FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for study_sessions
CREATE POLICY study_sessions_select ON public.study_sessions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY study_sessions_insert ON public.study_sessions
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY study_sessions_update ON public.study_sessions
    FOR UPDATE USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY study_sessions_delete ON public.study_sessions
    FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for ai_generations
CREATE POLICY ai_generations_select ON public.ai_generations
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY ai_generations_insert ON public.ai_generations
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policies for deck_collaborators
CREATE POLICY deck_collaborators_select ON public.deck_collaborators
    FOR SELECT USING (
        user_id = auth.uid() OR
        deck_id IN (SELECT id FROM public.decks WHERE account_id = auth.uid())
    );

CREATE POLICY deck_collaborators_insert ON public.deck_collaborators
    FOR INSERT WITH CHECK (
        deck_id IN (SELECT id FROM public.decks WHERE account_id = auth.uid())
    );

CREATE POLICY deck_collaborators_update ON public.deck_collaborators
    FOR UPDATE USING (
        deck_id IN (SELECT id FROM public.decks WHERE account_id = auth.uid())
    );

CREATE POLICY deck_collaborators_delete ON public.deck_collaborators
    FOR DELETE USING (
        deck_id IN (SELECT id FROM public.decks WHERE account_id = auth.uid()) OR
        user_id = auth.uid()
    );

-- RLS Policies for test_sessions
CREATE POLICY test_sessions_select ON public.test_sessions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY test_sessions_insert ON public.test_sessions
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY test_sessions_update ON public.test_sessions
    FOR UPDATE USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY test_sessions_delete ON public.test_sessions
    FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for test_responses
CREATE POLICY test_responses_select ON public.test_responses
    FOR SELECT USING (
        test_session_id IN (
            SELECT id FROM public.test_sessions 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY test_responses_insert ON public.test_responses
    FOR INSERT WITH CHECK (
        test_session_id IN (
            SELECT id FROM public.test_sessions 
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for performance_analytics
CREATE POLICY performance_analytics_select ON public.performance_analytics
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY performance_analytics_insert ON public.performance_analytics
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY performance_analytics_update ON public.performance_analytics
    FOR UPDATE USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY performance_analytics_delete ON public.performance_analytics
    FOR DELETE USING (user_id = auth.uid());

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
$$ LANGUAGE plpgsql;

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

CREATE TRIGGER test_sessions_updated_at 
    BEFORE UPDATE ON public.test_sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER performance_analytics_updated_at 
    BEFORE UPDATE ON public.performance_analytics 
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
$$ LANGUAGE plpgsql;

-- Add trigger to keep total_cards in sync
CREATE TRIGGER flashcards_count_trigger 
    AFTER INSERT OR DELETE ON public.flashcards 
    FOR EACH ROW 
    EXECUTE FUNCTION update_deck_total_cards();

-- Function to update performance analytics when test responses are added
CREATE OR REPLACE FUNCTION update_performance_analytics()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_total_attempts INTEGER;
    v_correct_attempts INTEGER;
    v_avg_score DECIMAL(4,2);
    v_best_score DECIMAL(4,2);
    v_mastery_level INTEGER;
BEGIN
    -- Get user_id from test_session
    SELECT user_id INTO v_user_id 
    FROM public.test_sessions 
    WHERE id = NEW.test_session_id;
    
    -- Calculate performance metrics for this flashcard
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE ai_score >= 80),
        AVG(ai_score),
        MAX(ai_score)
    INTO v_total_attempts, v_correct_attempts, v_avg_score, v_best_score
    FROM public.test_responses tr
    JOIN public.test_sessions ts ON ts.id = tr.test_session_id
    WHERE ts.user_id = v_user_id 
        AND tr.flashcard_id = NEW.flashcard_id;
    
    -- Calculate mastery level (0-100 based on performance)
    v_mastery_level := LEAST(100, GREATEST(0, 
        CASE 
            WHEN v_total_attempts = 0 THEN 0
            WHEN v_avg_score >= 90 AND v_total_attempts >= 3 THEN 100
            WHEN v_avg_score >= 80 AND v_total_attempts >= 2 THEN 80
            WHEN v_avg_score >= 70 THEN 60
            WHEN v_avg_score >= 60 THEN 40
            WHEN v_avg_score >= 50 THEN 20
            ELSE 0
        END
    ));
    
    -- Insert or update performance analytics
    INSERT INTO public.performance_analytics (
        user_id, flashcard_id, total_attempts, correct_attempts,
        average_score, best_score, latest_score, mastery_level,
        is_mastered, mastered_at, first_attempt_at, last_attempt_at
    ) VALUES (
        v_user_id, NEW.flashcard_id, v_total_attempts, v_correct_attempts,
        v_avg_score, v_best_score, NEW.ai_score, v_mastery_level,
        (v_mastery_level >= 80), 
        CASE WHEN v_mastery_level >= 80 THEN NOW() ELSE NULL END,
        NOW(), NOW()
    )
    ON CONFLICT (user_id, flashcard_id) DO UPDATE SET
        total_attempts = v_total_attempts,
        correct_attempts = v_correct_attempts,
        average_score = v_avg_score,
        best_score = v_best_score,
        latest_score = NEW.ai_score,
        mastery_level = v_mastery_level,
        is_mastered = (v_mastery_level >= 80),
        mastered_at = CASE 
            WHEN v_mastery_level >= 80 AND NOT performance_analytics.is_mastered 
            THEN NOW() 
            ELSE performance_analytics.mastered_at 
        END,
        last_attempt_at = NOW(),
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to update performance analytics
CREATE TRIGGER update_performance_analytics_trigger
    AFTER INSERT ON public.test_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_performance_analytics();

/*
 * -------------------------------------------------------
 * HELPER FUNCTIONS
 * -------------------------------------------------------
 */

-- Function to get performance summary for a user
CREATE OR REPLACE FUNCTION get_user_performance_summary(p_user_id UUID)
RETURNS TABLE (
    total_flashcards INTEGER,
    mastered_flashcards INTEGER,
    needs_review_flashcards INTEGER,
    average_mastery_level DECIMAL(4,2),
    total_test_sessions INTEGER,
    average_test_score DECIMAL(4,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH flashcard_stats AS (
        SELECT 
            COUNT(*) as total_cards,
            COUNT(*) FILTER (WHERE pa.is_mastered = true) as mastered,
            COUNT(*) FILTER (WHERE pa.mastery_level < 60) as needs_review,
            AVG(pa.mastery_level) as avg_mastery
        FROM public.performance_analytics pa
        WHERE pa.user_id = p_user_id
    ),
    session_stats AS (
        SELECT 
            COUNT(*) as total_sessions,
            AVG(ts.average_score) as avg_score
        FROM public.test_sessions ts
        WHERE ts.user_id = p_user_id AND ts.status = 'completed'
    )
    SELECT 
        COALESCE(fs.total_cards, 0)::INTEGER,
        COALESCE(fs.mastered, 0)::INTEGER,
        COALESCE(fs.needs_review, 0)::INTEGER,
        ROUND(COALESCE(fs.avg_mastery, 0), 2),
        COALESCE(ss.total_sessions, 0)::INTEGER,
        ROUND(COALESCE(ss.avg_score, 0), 2)
    FROM flashcard_stats fs
    CROSS JOIN session_stats ss;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get deck performance analytics
CREATE OR REPLACE FUNCTION get_deck_performance_analytics(p_user_id UUID, p_deck_id UUID)
RETURNS TABLE (
    flashcard_id UUID,
    front_content TEXT,
    mastery_level INTEGER,
    is_mastered BOOLEAN,
    total_attempts INTEGER,
    average_score DECIMAL(4,2),
    latest_score DECIMAL(4,2),
    last_attempt_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id as flashcard_id,
        f.front_content,
        COALESCE(pa.mastery_level, 0) as mastery_level,
        COALESCE(pa.is_mastered, false) as is_mastered,
        COALESCE(pa.total_attempts, 0) as total_attempts,
        pa.average_score,
        pa.latest_score,
        pa.last_attempt_at
    FROM public.flashcards f
    LEFT JOIN public.performance_analytics pa ON pa.flashcard_id = f.id AND pa.user_id = p_user_id
    WHERE f.deck_id = p_deck_id
    ORDER BY pa.mastery_level ASC NULLS FIRST, f.position ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/*
 * -------------------------------------------------------
 * PERMISSIONS
 * -------------------------------------------------------
 */

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.decks TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.flashcards TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_progress TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_sessions TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_generations TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deck_collaborators TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.test_sessions TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.test_responses TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.performance_analytics TO authenticated, service_role;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_user_performance_summary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_deck_performance_analytics(UUID, UUID) TO authenticated;

/*
 * -------------------------------------------------------
 * COMMENTS
 * -------------------------------------------------------
 */

COMMENT ON TABLE public.decks IS 'Flashcard decks with subscription-based limits';
COMMENT ON TABLE public.flashcards IS 'Individual flashcards with AI generation support';
COMMENT ON TABLE public.test_sessions IS 'AI-powered test sessions with different modes';
COMMENT ON TABLE public.test_responses IS 'Individual test question responses with AI grading';
COMMENT ON TABLE public.performance_analytics IS 'User performance tracking and mastery levels per flashcard';
COMMENT ON COLUMN accounts.stripe_customer_id IS 'Stripe customer ID for billing';
COMMENT ON COLUMN accounts.stripe_subscription_id IS 'Stripe subscription ID for active subscriptions';
COMMENT ON COLUMN accounts.subscription_status IS 'Stripe subscription status: active, past_due, canceled, etc.';
COMMENT ON COLUMN accounts.subscription_expires_at IS 'When the current subscription period ends';

/*
 * -------------------------------------------------------
 * Test History Enhancements
 * Expands test_sessions and test_responses for complete test history functionality
 * -------------------------------------------------------
 */

-- Add columns to test_sessions for comprehensive test data storage
ALTER TABLE public.test_sessions ADD COLUMN IF NOT EXISTS test_questions JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.test_sessions ADD COLUMN IF NOT EXISTS test_results JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.test_sessions ADD COLUMN IF NOT EXISTS overall_analysis JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.test_sessions ADD COLUMN IF NOT EXISTS grading_metadata JSONB DEFAULT '{}'::jsonb;

-- Add columns to test_responses for enhanced question data
ALTER TABLE public.test_responses ADD COLUMN IF NOT EXISTS question_type VARCHAR(20) DEFAULT 'open_ended';
ALTER TABLE public.test_responses ADD COLUMN IF NOT EXISTS question_options JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.test_responses ADD COLUMN IF NOT EXISTS correct_answer_data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.test_responses ADD COLUMN IF NOT EXISTS grading_method VARCHAR(50) DEFAULT 'ai_grading';

-- Add comments for new columns
COMMENT ON COLUMN public.test_sessions.test_questions IS 'Array of test questions with metadata (question_type, options, correct_answer, etc.)';
COMMENT ON COLUMN public.test_sessions.test_results IS 'Complete test results with individual question scores and overall performance';
COMMENT ON COLUMN public.test_sessions.overall_analysis IS 'AI-generated overall performance analysis, strengths, weaknesses, recommendations';
COMMENT ON COLUMN public.test_sessions.grading_metadata IS 'Metadata about grading process (objective vs AI grading counts, model versions, etc.)';

COMMENT ON COLUMN public.test_responses.question_type IS 'Type of question: multiple_choice, true_false, or open_ended';
COMMENT ON COLUMN public.test_responses.question_options IS 'Array of options for multiple choice questions';
COMMENT ON COLUMN public.test_responses.correct_answer_data IS 'Correct answer data: index for MCQ, boolean for T/F, text for open-ended';
COMMENT ON COLUMN public.test_responses.grading_method IS 'Method used for grading: objective_grading_v1, ai_grading, etc.';

-- Create indexes for efficient querying of test history
CREATE INDEX IF NOT EXISTS idx_test_sessions_completed_at ON public.test_sessions(completed_at) WHERE completed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_test_responses_question_type ON public.test_responses(question_type);
CREATE INDEX IF NOT EXISTS idx_test_responses_grading_method ON public.test_responses(grading_method);

-- Create a function to get complete test history for a user
CREATE OR REPLACE FUNCTION get_user_test_history(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
) RETURNS TABLE (
    session_id UUID,
    deck_id UUID,
    deck_name VARCHAR(255),
    test_mode test_mode,
    total_questions INTEGER,
    questions_completed INTEGER,
    average_score DECIMAL(4,2),
    time_spent_seconds INTEGER,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    test_questions JSONB,
    test_results JSONB,
    overall_analysis JSONB,
    grading_metadata JSONB
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ts.id as session_id,
        ts.deck_id,
        d.name as deck_name,
        ts.test_mode,
        ts.total_questions,
        ts.questions_completed,
        ts.average_score,
        ts.time_spent_seconds,
        ts.started_at,
        ts.completed_at,
        ts.test_questions,
        ts.test_results,
        ts.overall_analysis,
        ts.grading_metadata
    FROM public.test_sessions ts
    JOIN public.decks d ON d.id = ts.deck_id
    WHERE ts.user_id = p_user_id 
        AND ts.status = 'completed'
        AND ts.completed_at IS NOT NULL
    ORDER BY ts.completed_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Grant execute permissions on the new function
GRANT EXECUTE ON FUNCTION get_user_test_history(UUID, INTEGER, INTEGER) TO authenticated, service_role;

-- Create a function to get detailed test session data including all responses
CREATE OR REPLACE FUNCTION get_test_session_details(
    p_session_id UUID,
    p_user_id UUID
) RETURNS TABLE (
    session_id UUID,
    deck_id UUID,
    deck_name VARCHAR(255),
    test_mode test_mode,
    total_questions INTEGER,
    questions_completed INTEGER,
    average_score DECIMAL(4,2),
    time_spent_seconds INTEGER,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    test_questions JSONB,
    test_results JSONB,
    overall_analysis JSONB,
    grading_metadata JSONB,
    responses JSONB
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ts.id as session_id,
        ts.deck_id,
        d.name as deck_name,
        ts.test_mode,
        ts.total_questions,
        ts.questions_completed,
        ts.average_score,
        ts.time_spent_seconds,
        ts.started_at,
        ts.completed_at,
        ts.test_questions,
        ts.test_results,
        ts.overall_analysis,
        ts.grading_metadata,
        COALESCE(ts.test_results->'individual_grades', '[]'::jsonb) as responses
    FROM public.test_sessions ts
    JOIN public.decks d ON d.id = ts.deck_id
    WHERE ts.id = p_session_id 
        AND ts.user_id = p_user_id
        AND ts.status = 'completed';
END;
$$;

-- Grant execute permissions on the detailed function
GRANT EXECUTE ON FUNCTION get_test_session_details(UUID, UUID) TO authenticated, service_role;

-- Create a function to save complete test session with questions and results
CREATE OR REPLACE FUNCTION save_complete_test_session(
    p_session_id UUID,
    p_user_id UUID,
    p_questions JSONB DEFAULT '[]'::jsonb,
    p_results JSONB DEFAULT '{}'::jsonb,
    p_analysis JSONB DEFAULT '{}'::jsonb,
    p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
    v_questions_count INTEGER;
    v_average_score DECIMAL(4,2);
BEGIN
    -- Extract questions count and average score from the data
    v_questions_count := jsonb_array_length(p_questions);
    v_average_score := COALESCE((p_analysis->>'overall_percentage')::DECIMAL(4,2), 0);
    
    UPDATE public.test_sessions 
    SET 
        test_questions = p_questions,
        test_results = p_results,
        overall_analysis = p_analysis,
        grading_metadata = p_metadata,
        questions_completed = v_questions_count,
        average_score = v_average_score,
        status = 'completed',
        completed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_session_id 
        AND user_id = p_user_id;
    
    RETURN FOUND;
END;
$$;

-- Grant execute permissions on the save function
GRANT EXECUTE ON FUNCTION save_complete_test_session(UUID, UUID, JSONB, JSONB, JSONB, JSONB) TO authenticated, service_role;

-- Add constraints for data integrity (using DO blocks for conditional constraint creation)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'check_question_type' AND table_name = 'test_responses') THEN
        ALTER TABLE public.test_responses ADD CONSTRAINT check_question_type 
            CHECK (question_type IN ('multiple_choice', 'true_false', 'open_ended'));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'check_grading_method' AND table_name = 'test_responses') THEN
        ALTER TABLE public.test_responses ADD CONSTRAINT check_grading_method 
            CHECK (grading_method IN ('objective_grading_v1', 'ai_grading', 'comprehensive_ai_grading'));
    END IF;
END $$;

/*
 * -------------------------------------------------------
 * AI Test Usage Tracking
 * Track monthly test generation limits per user
 * -------------------------------------------------------
 */

-- Create ai_test_usage table for tracking monthly test generation limits
CREATE TABLE public.ai_test_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    month_year TEXT NOT NULL, -- Format: "2025-01"
    tests_generated INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(user_id, month_year)
);

-- Create index for efficient lookups
CREATE INDEX idx_ai_test_usage_user_month ON public.ai_test_usage(user_id, month_year);
CREATE INDEX idx_ai_test_usage_updated_at ON public.ai_test_usage(updated_at);

-- Enable RLS
ALTER TABLE public.ai_test_usage ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own usage data
CREATE POLICY "Users can view own test usage" ON public.ai_test_usage
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own usage data
CREATE POLICY "Users can insert own test usage" ON public.ai_test_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own usage data
CREATE POLICY "Users can update own test usage" ON public.ai_test_usage
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create function to get current month usage
CREATE OR REPLACE FUNCTION get_current_month_test_usage(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_month TEXT;
    usage_count INTEGER;
BEGIN
    -- Get current month in YYYY-MM format
    current_month := to_char(now(), 'YYYY-MM');
    
    -- Get usage count for current month
    SELECT COALESCE(tests_generated, 0) INTO usage_count
    FROM public.ai_test_usage
    WHERE user_id = p_user_id AND month_year = current_month;
    
    -- Return 0 if no record found
    RETURN COALESCE(usage_count, 0);
END;
$$;

-- Create function to increment test usage
CREATE OR REPLACE FUNCTION increment_test_usage(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_month TEXT;
    new_count INTEGER;
BEGIN
    -- Get current month in YYYY-MM format
    current_month := to_char(now(), 'YYYY-MM');
    
    -- Insert or update usage record
    INSERT INTO public.ai_test_usage (user_id, month_year, tests_generated)
    VALUES (p_user_id, current_month, 1)
    ON CONFLICT (user_id, month_year)
    DO UPDATE SET
        tests_generated = ai_test_usage.tests_generated + 1,
        updated_at = now()
    RETURNING tests_generated INTO new_count;
    
    RETURN new_count;
END;
$$;

-- Create function to reset monthly usage (for cleanup jobs)
CREATE OR REPLACE FUNCTION reset_monthly_test_usage()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    reset_count INTEGER;
BEGIN
    -- Delete records older than 6 months to keep table size manageable
    DELETE FROM public.ai_test_usage 
    WHERE updated_at < now() - interval '6 months';
    
    GET DIAGNOSTICS reset_count = ROW_COUNT;
    RETURN reset_count;
END;
$$;

/*
 * -------------------------------------------------------
 * AI Token Usage Tracking
 * Replaces test-based tracking with token-based tracking for more precise limits
 * -------------------------------------------------------
 */

-- Create ai_token_usage table for tracking monthly token consumption
CREATE TABLE public.ai_token_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  month_year TEXT NOT NULL, -- format: YYYY-MM (e.g., "2025-01")
  tokens_used INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Ensure one record per user per month
  UNIQUE(user_id, month_year)
);

-- Enable Row Level Security
ALTER TABLE public.ai_token_usage ENABLE ROW LEVEL SECURITY;

-- RLS policies for ai_token_usage
CREATE POLICY "Users can view own token usage" ON public.ai_token_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own token usage" ON public.ai_token_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own token usage" ON public.ai_token_usage
  FOR UPDATE USING (auth.uid() = user_id);

-- Create index for efficient queries
CREATE INDEX idx_ai_token_usage_user_month ON public.ai_token_usage(user_id, month_year);
CREATE INDEX idx_ai_token_usage_month_year ON public.ai_token_usage(month_year);

-- Function to increment token usage atomically
CREATE OR REPLACE FUNCTION increment_token_usage(p_user_id UUID, p_tokens_used INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_month TEXT;
  new_total INTEGER;
BEGIN
  -- Get current month in YYYY-MM format
  current_month := to_char(now(), 'YYYY-MM');
  
  -- Insert or update token usage for current month
  INSERT INTO public.ai_token_usage (user_id, month_year, tokens_used)
  VALUES (p_user_id, current_month, p_tokens_used)
  ON CONFLICT (user_id, month_year)
  DO UPDATE SET 
    tokens_used = ai_token_usage.tokens_used + p_tokens_used,
    updated_at = now()
  RETURNING tokens_used INTO new_total;
  
  RETURN new_total;
END;
$$;

-- Function to reset old token usage records (cleanup function for cron jobs)
CREATE OR REPLACE FUNCTION reset_old_token_usage()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete records older than 13 months (keep current + 12 months of history)
  DELETE FROM public.ai_token_usage 
  WHERE month_year < to_char(now() - INTERVAL '13 months', 'YYYY-MM');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Function to get current month token usage for a user
CREATE OR REPLACE FUNCTION get_current_month_token_usage(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_month TEXT;
  token_count INTEGER := 0;
BEGIN
  -- Get current month in YYYY-MM format
  current_month := to_char(now(), 'YYYY-MM');
  
  -- Get token usage for current month
  SELECT tokens_used INTO token_count
  FROM public.ai_token_usage
  WHERE user_id = p_user_id AND month_year = current_month;
  
  -- Return 0 if no record exists
  RETURN COALESCE(token_count, 0);
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION increment_token_usage(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_month_token_usage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reset_old_token_usage() TO service_role;

-- Add comments for documentation
COMMENT ON TABLE public.ai_token_usage IS 'Tracks monthly AI token usage per user for freemium limits';
COMMENT ON FUNCTION increment_token_usage(UUID, INTEGER) IS 'Atomically increments token usage for a user in current month';
COMMENT ON FUNCTION get_current_month_token_usage(UUID) IS 'Gets current month token usage for a user';
COMMENT ON FUNCTION reset_old_token_usage() IS 'Cleanup function to remove old token usage records';