-- Create subscription tier enum
CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'premium');

-- Add subscription_tier column to accounts table
ALTER TABLE accounts 
ADD COLUMN subscription_tier subscription_tier DEFAULT 'free';

-- Add deck_limit column to track current tier limits
ALTER TABLE accounts 
ADD COLUMN deck_limit integer DEFAULT 3;

-- Create index for efficient subscription tier queries
CREATE INDEX idx_accounts_subscription_tier ON accounts(subscription_tier);

-- Update existing accounts to have default tier and limit
UPDATE accounts 
SET subscription_tier = 'free', deck_limit = 3 
WHERE subscription_tier IS NULL;