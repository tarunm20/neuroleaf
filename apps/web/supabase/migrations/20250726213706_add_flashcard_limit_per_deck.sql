-- Add flashcard_limit_per_deck column to accounts table
ALTER TABLE accounts 
ADD COLUMN flashcard_limit_per_deck integer DEFAULT 50;

-- Update existing accounts with tier-based flashcard limits
-- Free tier: 50 cards per deck
-- Pro tier: unlimited (-1)
-- Premium tier: unlimited (-1)
UPDATE accounts 
SET flashcard_limit_per_deck = CASE 
  WHEN subscription_tier = 'free' THEN 50
  WHEN subscription_tier = 'pro' THEN -1
  WHEN subscription_tier = 'premium' THEN -1
  ELSE 50
END;

-- Create index for efficient flashcard limit queries
CREATE INDEX idx_accounts_flashcard_limit ON accounts(flashcard_limit_per_deck);