/*
 * -------------------------------------------------------
 * Enhanced SM-2 Spaced Repetition Schema
 * Adds missing fields and optimizations for SM-2 algorithm
 * -------------------------------------------------------
 */

-- Add missing SM-2 algorithm fields to user_progress
ALTER TABLE public.user_progress 
ADD COLUMN IF NOT EXISTS quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 5),
ADD COLUMN IF NOT EXISTS response_time_ms INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_learning BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS graduation_date TIMESTAMPTZ DEFAULT NULL;

-- Add indexes for better SM-2 query performance
CREATE INDEX IF NOT EXISTS idx_user_progress_due_cards 
ON public.user_progress(user_id, next_review_date);

CREATE INDEX IF NOT EXISTS idx_user_progress_learning_status 
ON public.user_progress(user_id, is_learning);

-- Add subscription-related fields to study_sessions for premium tracking
ALTER TABLE public.study_sessions 
ADD COLUMN IF NOT EXISTS uses_sm2 BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS subscription_tier subscription_tier DEFAULT 'free';

-- Create dedicated table for SM-2 review history (for analytics)
CREATE TABLE IF NOT EXISTS public.sm2_reviews (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    flashcard_id UUID NOT NULL REFERENCES public.flashcards(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.study_sessions(id) ON DELETE SET NULL,
    
    -- SM-2 algorithm data at time of review
    quality_score INTEGER NOT NULL CHECK (quality_score >= 0 AND quality_score <= 5),
    ease_factor_before DECIMAL(4,2) NOT NULL,
    ease_factor_after DECIMAL(4,2) NOT NULL,
    interval_before INTEGER NOT NULL,
    interval_after INTEGER NOT NULL,
    repetitions_before INTEGER NOT NULL,
    repetitions_after INTEGER NOT NULL,
    
    -- Review metadata
    response_time_ms INTEGER DEFAULT NULL,
    was_correct BOOLEAN NOT NULL,
    review_date TIMESTAMPTZ DEFAULT NOW(),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for SM-2 review analytics
CREATE INDEX idx_sm2_reviews_user_id ON public.sm2_reviews(user_id);
CREATE INDEX idx_sm2_reviews_flashcard_id ON public.sm2_reviews(flashcard_id);
CREATE INDEX idx_sm2_reviews_date ON public.sm2_reviews(review_date);
CREATE INDEX idx_sm2_reviews_quality ON public.sm2_reviews(quality_score);

-- Enable RLS for sm2_reviews
ALTER TABLE public.sm2_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sm2_reviews
CREATE POLICY sm2_reviews_select ON public.sm2_reviews
    FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY sm2_reviews_insert ON public.sm2_reviews
    FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

-- Grant permissions
GRANT SELECT, INSERT ON public.sm2_reviews TO authenticated, service_role;

/*
 * -------------------------------------------------------
 * SM-2 Helper Functions
 * -------------------------------------------------------
 */

-- Function to get due cards for SM-2 algorithm
CREATE OR REPLACE FUNCTION get_due_cards_sm2(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    flashcard_id UUID,
    deck_id UUID,
    deck_name VARCHAR(255),
    front_content TEXT,
    back_content TEXT,
    ease_factor DECIMAL(4,2),
    repetitions INTEGER,
    interval_days INTEGER,
    next_review_date TIMESTAMPTZ,
    days_overdue INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id as flashcard_id,
        d.id as deck_id,
        d.name as deck_name,
        f.front_content,
        f.back_content,
        up.ease_factor,
        up.repetitions,
        up.interval_days,
        up.next_review_date,
        EXTRACT(DAY FROM NOW() - up.next_review_date)::INTEGER as days_overdue
    FROM public.user_progress up
    JOIN public.flashcards f ON f.id = up.flashcard_id
    JOIN public.decks d ON d.id = f.deck_id
    WHERE up.user_id = p_user_id
        AND up.next_review_date <= NOW()
    ORDER BY up.next_review_date ASC, up.ease_factor ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get SM-2 study statistics
CREATE OR REPLACE FUNCTION get_sm2_study_stats(p_user_id UUID)
RETURNS TABLE (
    cards_due_today INTEGER,
    cards_learning INTEGER,
    cards_mastered INTEGER,
    average_ease_factor DECIMAL(4,2),
    average_retention DECIMAL(4,2),
    study_streak_days INTEGER,
    total_reviews INTEGER,
    reviews_today INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT 
            COUNT(*) FILTER (WHERE up.next_review_date <= NOW()) as due_today,
            COUNT(*) FILTER (WHERE up.is_learning = true) as learning,
            COUNT(*) FILTER (WHERE up.is_learning = false) as mastered,
            AVG(up.ease_factor) as avg_ef,
            AVG(CASE WHEN up.total_reviews > 0 THEN up.correct_reviews::DECIMAL / up.total_reviews END) as avg_retention,
            COALESCE(MAX(up.streak), 0) as max_streak,
            SUM(up.total_reviews) as total_revs
        FROM public.user_progress up
        WHERE up.user_id = p_user_id
    ),
    today_reviews AS (
        SELECT COUNT(*) as reviews_today
        FROM public.sm2_reviews sr
        WHERE sr.user_id = p_user_id 
            AND sr.review_date >= CURRENT_DATE
    )
    SELECT 
        s.due_today::INTEGER,
        s.learning::INTEGER,
        s.mastered::INTEGER,
        ROUND(s.avg_ef, 2) as average_ease_factor,
        ROUND(s.avg_retention, 2) as average_retention,
        s.max_streak::INTEGER,
        s.total_revs::INTEGER,
        tr.reviews_today::INTEGER
    FROM stats s
    CROSS JOIN today_reviews tr;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_due_cards_sm2(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_sm2_study_stats(UUID) TO authenticated;

/*
 * -------------------------------------------------------
 * Comments for documentation
 * -------------------------------------------------------
 */

COMMENT ON TABLE public.sm2_reviews IS 'Detailed history of SM-2 algorithm reviews for analytics and progress tracking';
COMMENT ON FUNCTION get_due_cards_sm2(UUID, INTEGER) IS 'Returns flashcards due for review using SM-2 algorithm priority';
COMMENT ON FUNCTION get_sm2_study_stats(UUID) IS 'Returns comprehensive SM-2 study statistics for dashboard display';