-- Add missing location and country columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS country TEXT;

-- Create index for country filtering
CREATE INDEX IF NOT EXISTS idx_users_country ON users(country);
