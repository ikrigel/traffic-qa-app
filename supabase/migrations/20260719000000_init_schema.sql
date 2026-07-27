-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  theme TEXT DEFAULT 'auto',
  show_answers BOOLEAN DEFAULT false
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  token TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '90 days',
  UNIQUE(user_id, device_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Enable RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Users can only read their own data
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own data') THEN
    CREATE POLICY "Users can read own data"
      ON users FOR SELECT
      USING (auth.uid() = id);
  END IF;
END $$;

-- Users can only update their own data
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own data') THEN
    CREATE POLICY "Users can update own data"
      ON users FOR UPDATE
      USING (auth.uid() = id);
  END IF;
END $$;

-- Users can only read their own sessions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own sessions') THEN
    CREATE POLICY "Users can read own sessions"
      ON sessions FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Users can only delete their own sessions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own sessions') THEN
    CREATE POLICY "Users can delete own sessions"
      ON sessions FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;
