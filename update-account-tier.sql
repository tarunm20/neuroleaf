-- SQL script to update your account to Pro tier in development
-- Run this in your local Supabase SQL editor

-- Update your account to Pro tier (replace YOUR_USER_ID with your actual user ID)
UPDATE accounts 
SET 
  subscription_tier = 'pro',
  subscription_status = 'active',
  subscription_expires_at = NOW() + INTERVAL '1 year'
WHERE id = 'YOUR_USER_ID';

-- To find your user ID, first run this query:
-- SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Then use that ID in the UPDATE query above

-- Verify the update worked:
SELECT id, subscription_tier, subscription_status, subscription_expires_at 
FROM accounts 
WHERE id = 'YOUR_USER_ID';