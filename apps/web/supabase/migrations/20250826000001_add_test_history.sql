/*
 * -------------------------------------------------------
 * Test History Enhancement Migration
 * Adds complete test history functionality to existing schema
 * Run this after the base neuroleaf schema is in place
 * -------------------------------------------------------
 */

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
CREATE TABLE IF NOT EXISTS public.ai_test_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    month_year TEXT NOT NULL, -- Format: "2025-01"
    tests_generated INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(user_id, month_year)
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_ai_test_usage_user_month ON public.ai_test_usage(user_id, month_year);
CREATE INDEX IF NOT EXISTS idx_ai_test_usage_updated_at ON public.ai_test_usage(updated_at);

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
CREATE TABLE IF NOT EXISTS public.ai_token_usage (
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
CREATE INDEX IF NOT EXISTS idx_ai_token_usage_user_month ON public.ai_token_usage(user_id, month_year);
CREATE INDEX IF NOT EXISTS idx_ai_token_usage_month_year ON public.ai_token_usage(month_year);

-- Function to increment token usage atomically
-- Drop existing function first to handle any signature changes
DROP FUNCTION IF EXISTS increment_token_usage(UUID, INTEGER);

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
-- Drop existing function first to handle return type changes
DROP FUNCTION IF EXISTS get_current_month_token_usage(UUID);

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

-- Grant permissions on the new tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_test_usage TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_token_usage TO authenticated, service_role;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;

-- Grant execute on test usage functions
GRANT EXECUTE ON FUNCTION get_current_month_test_usage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_test_usage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reset_monthly_test_usage() TO service_role;

-- Add comments for documentation
COMMENT ON TABLE public.ai_test_usage IS 'Tracks monthly AI test generation limits per user for freemium model';
COMMENT ON TABLE public.ai_token_usage IS 'Tracks monthly AI token usage per user for freemium limits';
COMMENT ON FUNCTION increment_token_usage(UUID, INTEGER) IS 'Atomically increments token usage for a user in current month';
COMMENT ON FUNCTION get_current_month_token_usage(UUID) IS 'Gets current month token usage for a user';
COMMENT ON FUNCTION reset_old_token_usage() IS 'Cleanup function to remove old token usage records';