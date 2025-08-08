-- Add flashcard statistics function for better performance
CREATE OR REPLACE FUNCTION get_deck_flashcard_stats(deck_uuid UUID)
RETURNS TABLE (
  total_cards INTEGER,
  easy_count INTEGER,
  medium_count INTEGER,
  hard_count INTEGER,
  ai_generated_count INTEGER,
  with_media_count INTEGER,
  avg_front_length INTEGER,
  avg_back_length INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER AS total_cards,
    COUNT(CASE WHEN difficulty = 'easy' THEN 1 END)::INTEGER AS easy_count,
    COUNT(CASE WHEN difficulty = 'medium' THEN 1 END)::INTEGER AS medium_count,
    COUNT(CASE WHEN difficulty = 'hard' THEN 1 END)::INTEGER AS hard_count,
    COUNT(CASE WHEN ai_generated THEN 1 END)::INTEGER AS ai_generated_count,
    COUNT(CASE WHEN array_length(front_media_urls, 1) > 0 OR array_length(back_media_urls, 1) > 0 THEN 1 END)::INTEGER AS with_media_count,
    COALESCE(AVG(LENGTH(front_content))::INTEGER, 0) AS avg_front_length,
    COALESCE(AVG(LENGTH(back_content))::INTEGER, 0) AS avg_back_length
  FROM flashcards
  WHERE flashcards.deck_id = deck_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_deck_flashcard_stats(UUID) TO authenticated;