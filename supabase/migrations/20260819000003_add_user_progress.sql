-- Create user_progress table for tracking learning progress
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL,
  times_attempted INTEGER DEFAULT 0,
  times_correct INTEGER DEFAULT 0,
  times_partial INTEGER DEFAULT 0,
  times_incorrect INTEGER DEFAULT 0,
  last_attempted_at TIMESTAMP,
  first_correct_at TIMESTAMP,
  mastery_level TEXT CHECK (mastery_level IN ('unstarted', 'learning', 'proficient', 'mastered')) DEFAULT 'unstarted',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

-- Create user_stats table for overall learning stats
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  total_attempts INTEGER DEFAULT 0,
  total_correct INTEGER DEFAULT 0,
  total_partial INTEGER DEFAULT 0,
  total_incorrect INTEGER DEFAULT 0,
  overall_accuracy NUMERIC(5,2) DEFAULT 0,
  questions_mastered INTEGER DEFAULT 0,
  questions_proficient INTEGER DEFAULT 0,
  questions_learning INTEGER DEFAULT 0,
  questions_unstarted INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_progress_question_id ON user_progress(question_id);
CREATE INDEX idx_user_progress_mastery ON user_progress(mastery_level);
CREATE INDEX idx_user_stats_user_id ON user_stats(user_id);

-- Enable RLS on user_progress
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Deny all by default (main access via service role)
CREATE POLICY "Deny all access by default" ON user_progress AS RESTRICTIVE FOR ALL TO public USING (false);
CREATE POLICY "Deny all access by default" ON user_stats AS RESTRICTIVE FOR ALL TO public USING (false);
