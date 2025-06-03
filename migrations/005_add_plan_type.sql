-- Migration to add plan_type column to users table

-- Add plan_type column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_type text NOT NULL DEFAULT 'FREE';

-- Create index for faster queries on plan_type
CREATE INDEX IF NOT EXISTS idx_users_plan_type ON users(plan_type);

-- Add comment to column for documentation
COMMENT ON COLUMN users.plan_type IS 'User subscription plan type: FREE, BASIC, PRO'; 