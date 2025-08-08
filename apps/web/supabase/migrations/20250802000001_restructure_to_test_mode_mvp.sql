/*
 * -------------------------------------------------------
 * Neuroleaf MVP Restructure: Test Mode Focus
 * This migration removes spaced repetition complexity and
 * adds AI-powered test mode functionality
 * -------------------------------------------------------
 */

/*
 * -------------------------------------------------------
 * PHASE 1: Remove Spaced Repetition System
 * -------------------------------------------------------
 */

-- Drop SM-2 specific functions
DROP FUNCTION IF EXISTS get_due_cards_sm2(UUID, INTEGER);
DROP FUNCTION IF EXISTS get_sm2_study_stats(UUID);

-- Drop SM-2 review history table (not needed for test mode)
DROP TABLE IF EXISTS public.sm2_reviews CASCADE;

-- Remove SM-2 specific fields from user_progress table
-- Keep basic progress tracking but remove spaced repetition complexity
ALTER TABLE public.user_progress 
DROP COLUMN IF EXISTS ease_factor,
DROP COLUMN IF EXISTS repetitions,
DROP COLUMN IF EXISTS interval_days,
DROP COLUMN IF EXISTS next_review_date,
DROP COLUMN IF EXISTS quality_score,
DROP COLUMN IF EXISTS response_time_ms,
DROP COLUMN IF EXISTS is_learning,
DROP COLUMN IF EXISTS graduation_date;

-- Remove SM-2 related indexes
DROP INDEX IF EXISTS idx_user_progress_next_review;
DROP INDEX IF EXISTS idx_user_progress_due_cards;
DROP INDEX IF EXISTS idx_user_progress_learning_status;

-- Remove SM-2 fields from study_sessions
ALTER TABLE public.study_sessions 
DROP COLUMN IF EXISTS uses_sm2,
DROP COLUMN IF EXISTS subscription_tier;

/*
 * -------------------------------------------------------
 * PHASE 2: Simplify Existing Tables for MVP
 * -------------------------------------------------------
 */

-- Simplify user_progress to basic mastery tracking
ALTER TABLE public.user_progress 
ADD COLUMN IF NOT EXISTS mastery_level INTEGER DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 100),
ADD COLUMN IF NOT EXISTS needs_review BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS first_learned_at TIMESTAMPTZ DEFAULT NULL;

-- Add basic performance tracking
CREATE INDEX IF NOT EXISTS idx_user_progress_mastery 
ON public.user_progress(user_id, mastery_level);

-- Simplify study_sessions for basic tracking
ALTER TABLE public.study_sessions 
ADD COLUMN IF NOT EXISTS session_type VARCHAR(20) DEFAULT 'study' CHECK (session_type IN ('study', 'test')),
ADD COLUMN IF NOT EXISTS average_score DECIMAL(4,2) DEFAULT NULL;

/*
 * -------------------------------------------------------
 * PHASE 3: Add Test Mode Tables
 * -------------------------------------------------------
 */

-- Create enum for test modes
CREATE TYPE test_mode AS ENUM ('flashcard', 'ai_questions');

-- Test sessions for AI-powered testing
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

-- Individual test responses with AI grading
CREATE TABLE IF NOT EXISTS public.test_responses (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    test_session_id UUID NOT NULL REFERENCES public.test_sessions(id) ON DELETE CASCADE,
    flashcard_id UUID REFERENCES public.flashcards(id) ON DELETE CASCADE,
    
    -- Question and response
    question_text TEXT NOT NULL,
    expected_answer TEXT DEFAULT NULL, -- For flashcard mode
    user_response TEXT NOT NULL,
    
    -- AI grading results
    ai_score DECIMAL(4,2) NOT NULL CHECK (ai_score >= 0 AND ai_score <= 100),
    ai_feedback TEXT NOT NULL,
    ai_model_used VARCHAR(100) DEFAULT NULL,
    
    -- Performance tracking
    response_time_seconds INTEGER DEFAULT NULL,
    is_correct BOOLEAN DEFAULT NULL, -- For simple correct/incorrect tracking
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance analytics for mastery tracking
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

/*
 * -------------------------------------------------------
 * PHASE 4: Add Indexes for Performance
 * -------------------------------------------------------
 */

-- Test sessions indexes
CREATE INDEX idx_test_sessions_user_id ON public.test_sessions(user_id);
CREATE INDEX idx_test_sessions_deck_id ON public.test_sessions(deck_id);
CREATE INDEX idx_test_sessions_status ON public.test_sessions(status);
CREATE INDEX idx_test_sessions_started_at ON public.test_sessions(started_at);

-- Test responses indexes
CREATE INDEX idx_test_responses_session_id ON public.test_responses(test_session_id);
CREATE INDEX idx_test_responses_flashcard_id ON public.test_responses(flashcard_id);
CREATE INDEX idx_test_responses_score ON public.test_responses(ai_score);
CREATE INDEX idx_test_responses_created_at ON public.test_responses(created_at);

-- Performance analytics indexes
CREATE INDEX idx_performance_analytics_user_id ON public.performance_analytics(user_id);
CREATE INDEX idx_performance_analytics_flashcard_id ON public.performance_analytics(flashcard_id);
CREATE INDEX idx_performance_analytics_mastery ON public.performance_analytics(user_id, mastery_level);
CREATE INDEX idx_performance_analytics_mastered ON public.performance_analytics(user_id, is_mastered);

/*
 * -------------------------------------------------------
 * PHASE 5: Enable RLS for New Tables
 * -------------------------------------------------------
 */

-- Enable RLS
ALTER TABLE public.test_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for test_sessions
CREATE POLICY test_sessions_select ON public.test_sessions
    FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY test_sessions_insert ON public.test_sessions
    FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY test_sessions_update ON public.test_sessions
    FOR UPDATE USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY test_sessions_delete ON public.test_sessions
    FOR DELETE USING (user_id = (SELECT auth.uid()));

-- RLS Policies for test_responses
CREATE POLICY test_responses_select ON public.test_responses
    FOR SELECT USING (
        test_session_id IN (
            SELECT id FROM public.test_sessions 
            WHERE user_id = (SELECT auth.uid())
        )
    );

CREATE POLICY test_responses_insert ON public.test_responses
    FOR INSERT WITH CHECK (
        test_session_id IN (
            SELECT id FROM public.test_sessions 
            WHERE user_id = (SELECT auth.uid())
        )
    );

-- RLS Policies for performance_analytics
CREATE POLICY performance_analytics_select ON public.performance_analytics
    FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY performance_analytics_insert ON public.performance_analytics
    FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY performance_analytics_update ON public.performance_analytics
    FOR UPDATE USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY performance_analytics_delete ON public.performance_analytics
    FOR DELETE USING (user_id = (SELECT auth.uid()));

/*
 * -------------------------------------------------------
 * PHASE 6: Add Triggers for Automatic Updates
 * -------------------------------------------------------
 */

-- Update timestamps on test_sessions
CREATE TRIGGER test_sessions_updated_at 
    BEFORE UPDATE ON public.test_sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at();

-- Update timestamps on performance_analytics
CREATE TRIGGER performance_analytics_updated_at 
    BEFORE UPDATE ON public.performance_analytics 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at();

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
        COUNT(*) FILTER (WHERE ai_score >= 80), -- Consider 80+ as "correct"
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
 * PHASE 7: Grant Permissions
 * -------------------------------------------------------
 */

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.test_sessions TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.test_responses TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.performance_analytics TO authenticated, service_role;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;

/*
 * -------------------------------------------------------
 * PHASE 8: Helper Functions for Test Mode
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

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_user_performance_summary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_deck_performance_analytics(UUID, UUID) TO authenticated;

/*
 * -------------------------------------------------------
 * Comments for documentation
 * -------------------------------------------------------
 */

COMMENT ON TABLE public.test_sessions IS 'AI-powered test sessions with different modes (flashcard or AI-generated questions)';
COMMENT ON TABLE public.test_responses IS 'Individual test question responses with AI grading and feedback';
COMMENT ON TABLE public.performance_analytics IS 'User performance tracking and mastery levels per flashcard';
COMMENT ON FUNCTION get_user_performance_summary(UUID) IS 'Returns overall performance summary for user dashboard';
COMMENT ON FUNCTION get_deck_performance_analytics(UUID, UUID) IS 'Returns detailed performance analytics for a specific deck';