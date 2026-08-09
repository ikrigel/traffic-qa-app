-- Create user_progress table for tracking quiz performance
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL,
  attempts INTEGER DEFAULT 0,
  correct_attempts INTEGER DEFAULT 0,
  last_attempted_at TIMESTAMP,
  first_attempted_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, question_id)
);

-- Create user_statistics table for overall stats
CREATE TABLE IF NOT EXISTS user_statistics (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_attempts INTEGER DEFAULT 0,
  total_correct INTEGER DEFAULT 0,
  accuracy_percentage FLOAT DEFAULT 0,
  questions_mastered INTEGER DEFAULT 0,
  streak_current INTEGER DEFAULT 0,
  streak_longest INTEGER DEFAULT 0,
  last_activity_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_question_id ON user_progress(question_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_question ON user_progress(user_id, question_id);

-- Enable RLS
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_statistics ENABLE ROW LEVEL SECURITY;

-- Create policies for user_progress
CREATE POLICY user_progress_select ON user_progress FOR SELECT USING (true);
CREATE POLICY user_progress_insert ON user_progress FOR INSERT WITH CHECK (true);
CREATE POLICY user_progress_update ON user_progress FOR UPDATE USING (true);

-- Create policies for user_statistics
CREATE POLICY user_stats_select ON user_statistics FOR SELECT USING (true);
CREATE POLICY user_stats_insert ON user_statistics FOR INSERT WITH CHECK (true);
CREATE POLICY user_stats_update ON user_statistics FOR UPDATE USING (true);

-- Create triggers to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_user_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_user_statistics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_progress_updated_at ON user_progress;
CREATE TRIGGER user_progress_updated_at
  BEFORE UPDATE ON user_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_user_progress_updated_at();

DROP TRIGGER IF EXISTS user_statistics_updated_at ON user_statistics;
CREATE TRIGGER user_statistics_updated_at
  BEFORE UPDATE ON user_statistics
  FOR EACH ROW
  EXECUTE FUNCTION update_user_statistics_updated_at();
