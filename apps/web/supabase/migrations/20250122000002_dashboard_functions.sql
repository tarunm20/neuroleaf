/*
 * -------------------------------------------------------
 * Dashboard Helper Functions
 * Functions to support the learning dashboard
 * -------------------------------------------------------
 */

-- Function to get due decks summary for a user
CREATE OR REPLACE FUNCTION get_due_decks_summary(user_id UUID)
RETURNS TABLE (
  deck_id UUID,
  deck_name TEXT,
  cards_due BIGINT,
  total_cards INTEGER,
  next_review TIMESTAMPTZ,
  average_difficulty TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id AS deck_id,
    d.name AS deck_name,
    COUNT(up.flashcard_id) AS cards_due,
    d.total_cards,
    MIN(up.next_review_date) AS next_review,
    CASE 
      WHEN AVG(CASE 
        WHEN f.difficulty = 'easy' THEN 1
        WHEN f.difficulty = 'medium' THEN 2
        WHEN f.difficulty = 'hard' THEN 3
        ELSE 2
      END) < 1.5 THEN 'easy'
      WHEN AVG(CASE 
        WHEN f.difficulty = 'easy' THEN 1
        WHEN f.difficulty = 'medium' THEN 2
        WHEN f.difficulty = 'hard' THEN 3
        ELSE 2
      END) < 2.5 THEN 'medium'
      ELSE 'hard'
    END AS average_difficulty
  FROM public.decks d
  INNER JOIN public.flashcards f ON f.deck_id = d.id
  INNER JOIN public.user_progress up ON up.flashcard_id = f.id
  WHERE up.user_id = get_due_decks_summary.user_id
    AND up.next_review_date <= NOW()
    AND (d.account_id = get_due_decks_summary.user_id 
         OR d.visibility = 'public' 
         OR (d.visibility = 'shared' AND d.id IN (
           SELECT deck_id FROM public.deck_collaborators 
           WHERE user_id = get_due_decks_summary.user_id
         )))
  GROUP BY d.id, d.name, d.total_cards
  HAVING COUNT(up.flashcard_id) > 0
  ORDER BY next_review ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's learning streak
CREATE OR REPLACE FUNCTION get_user_study_streak(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  streak INTEGER := 0;
  current_date DATE := CURRENT_DATE;
  check_date DATE;
  session_exists BOOLEAN;
BEGIN
  -- Start from today and work backwards
  check_date := current_date;
  
  -- Check each day for study sessions
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM public.study_sessions 
      WHERE user_id = get_user_study_streak.user_id 
        AND DATE(started_at) = check_date
        AND cards_studied > 0
    ) INTO session_exists;
    
    IF session_exists THEN
      streak := streak + 1;
      check_date := check_date - INTERVAL '1 day';
    ELSE
      -- If it's not today and we don't have a session, break
      IF check_date < current_date THEN
        EXIT;
      -- If it's today and no session, streak is 0
      ELSIF check_date = current_date THEN
        streak := 0;
        EXIT;
      END IF;
    END IF;
    
    -- Safety limit to prevent infinite loops
    IF streak > 365 THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN streak;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's weekly study statistics
CREATE OR REPLACE FUNCTION get_user_weekly_stats(user_id UUID)
RETURNS TABLE (
  total_study_time INTEGER,
  cards_studied INTEGER,
  cards_correct INTEGER,
  accuracy_rate INTEGER,
  sessions_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(s.total_time_seconds), 0)::INTEGER AS total_study_time,
    COALESCE(SUM(s.cards_studied), 0)::INTEGER AS cards_studied,
    COALESCE(SUM(s.cards_correct), 0)::INTEGER AS cards_correct,
    CASE 
      WHEN SUM(s.cards_studied) > 0 THEN 
        ROUND((SUM(s.cards_correct)::FLOAT / SUM(s.cards_studied)::FLOAT) * 100)::INTEGER
      ELSE 0
    END AS accuracy_rate,
    COUNT(s.id)::INTEGER AS sessions_count
  FROM public.study_sessions s
  WHERE s.user_id = get_user_weekly_stats.user_id
    AND s.started_at >= (NOW() - INTERVAL '7 days')
    AND s.cards_studied > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get recent user activities
CREATE OR REPLACE FUNCTION get_user_recent_activities(user_id UUID, activity_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  activity_id TEXT,
  activity_type TEXT,
  title TEXT,
  description TEXT,
  activity_timestamp TIMESTAMPTZ,
  deck_name TEXT,
  cards_studied INTEGER,
  accuracy INTEGER,
  session_duration INTEGER
) AS $$
BEGIN
  RETURN QUERY
  (
    -- Study sessions
    SELECT 
      CONCAT('session-', s.id::TEXT) AS activity_id,
      'study_session' AS activity_type,
      'Study Session Completed' AS title,
      CONCAT('Studied ', s.cards_studied, ' cards') AS description,
      s.started_at AS activity_timestamp,
      d.name AS deck_name,
      s.cards_studied,
      CASE 
        WHEN s.cards_studied > 0 THEN ROUND((s.cards_correct::FLOAT / s.cards_studied::FLOAT) * 100)::INTEGER
        ELSE 0
      END AS accuracy,
      s.total_time_seconds AS session_duration
    FROM public.study_sessions s
    LEFT JOIN public.decks d ON d.id = s.deck_id
    WHERE s.user_id = get_user_recent_activities.user_id
      AND s.cards_studied > 0
    ORDER BY s.started_at DESC
    LIMIT activity_limit / 2
  )
  UNION ALL
  (
    -- Deck creations
    SELECT 
      CONCAT('deck-', d.id::TEXT) AS activity_id,
      'deck_created' AS activity_type,
      'New Deck Created' AS title,
      CONCAT('Created "', d.name, '"') AS description,
      d.created_at AS activity_timestamp,
      d.name AS deck_name,
      d.total_cards,
      NULL::INTEGER AS accuracy,
      NULL::INTEGER AS session_duration
    FROM public.decks d
    WHERE d.account_id = get_user_recent_activities.user_id
    ORDER BY d.created_at DESC
    LIMIT activity_limit / 2
  )
  ORDER BY activity_timestamp DESC
  LIMIT activity_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_due_decks_summary(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_user_study_streak(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_user_weekly_stats(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_user_recent_activities(UUID, INTEGER) TO authenticated, service_role;