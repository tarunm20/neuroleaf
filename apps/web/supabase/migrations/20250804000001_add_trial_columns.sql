-- Add trial tracking columns to accounts table
-- This enables 7-day free trials for Pro features

-- 1. Add trial_expires_at column to track when trial ends
ALTER TABLE accounts 
ADD COLUMN trial_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- 2. Add has_used_trial to prevent multiple trials per user
ALTER TABLE accounts 
ADD COLUMN has_used_trial BOOLEAN DEFAULT FALSE;

-- 3. Create index for efficient trial expiry queries
CREATE INDEX idx_accounts_trial_expires_at ON accounts(trial_expires_at) 
WHERE trial_expires_at IS NOT NULL;

-- 4. Create index for trial status queries
CREATE INDEX idx_accounts_has_used_trial ON accounts(has_used_trial);

-- Add helpful comments
COMMENT ON COLUMN accounts.trial_expires_at IS 'Timestamp when the user''s free trial expires. NULL means no active trial.';
COMMENT ON COLUMN accounts.has_used_trial IS 'True if user has already used their one-time free trial.';

-- 5. Create a helper function to check if a user is currently in trial
CREATE OR REPLACE FUNCTION is_user_in_trial(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM accounts 
    WHERE id = user_id 
    AND trial_expires_at IS NOT NULL 
    AND trial_expires_at > NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create function to get trial status with days remaining
CREATE OR REPLACE FUNCTION get_trial_status(user_id UUID)
RETURNS TABLE (
  is_active BOOLEAN,
  expires_at TIMESTAMP WITH TIME ZONE,
  days_remaining INTEGER,
  has_used_trial BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (a.trial_expires_at IS NOT NULL AND a.trial_expires_at > NOW()) as is_active,
    a.trial_expires_at as expires_at,
    CASE 
      WHEN a.trial_expires_at IS NOT NULL AND a.trial_expires_at > NOW() 
      THEN GREATEST(0, EXTRACT(days FROM (a.trial_expires_at - NOW()))::INTEGER)
      ELSE 0
    END as days_remaining,
    a.has_used_trial
  FROM accounts a
  WHERE a.id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;