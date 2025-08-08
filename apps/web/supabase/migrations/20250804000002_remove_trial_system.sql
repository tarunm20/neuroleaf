-- Remove trial system - users must pay upfront for Pro features
-- This rollback removes all trial-related functionality

-- 1. Drop trial helper functions
DROP FUNCTION IF EXISTS get_trial_status(UUID);
DROP FUNCTION IF EXISTS is_user_in_trial(UUID);

-- 2. Drop trial-related indexes
DROP INDEX IF EXISTS idx_accounts_trial_expires_at;
DROP INDEX IF EXISTS idx_accounts_has_used_trial;

-- 3. Remove trial columns from accounts table
ALTER TABLE accounts DROP COLUMN IF EXISTS trial_expires_at;
ALTER TABLE accounts DROP COLUMN IF EXISTS has_used_trial;

-- Add comment
COMMENT ON TABLE accounts IS 'User accounts - trial system removed, users must pay upfront for Pro features';