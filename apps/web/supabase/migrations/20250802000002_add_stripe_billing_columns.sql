-- Add Stripe billing columns to accounts table
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT,
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_accounts_stripe_customer_id ON accounts(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_accounts_stripe_subscription_id ON accounts(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_accounts_subscription_expires_at ON accounts(subscription_expires_at);

-- Update existing free tier users to have proper defaults
UPDATE accounts 
SET subscription_tier = 'free'
WHERE subscription_tier IS NULL;

-- Set not null constraint for subscription_tier
ALTER TABLE accounts 
ALTER COLUMN subscription_tier SET DEFAULT 'free';

-- Add comment explaining the billing system
COMMENT ON COLUMN accounts.stripe_customer_id IS 'Stripe customer ID for billing';
COMMENT ON COLUMN accounts.stripe_subscription_id IS 'Stripe subscription ID for active subscriptions';
COMMENT ON COLUMN accounts.subscription_status IS 'Stripe subscription status: active, past_due, canceled, etc.';
COMMENT ON COLUMN accounts.subscription_expires_at IS 'When the current subscription period ends';