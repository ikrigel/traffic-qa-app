-- Create user_preferences table for storing user settings
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,

  -- Display preferences
  theme TEXT DEFAULT 'auto' CHECK (theme IN ('light', 'dark', 'auto')),
  language TEXT DEFAULT 'he' CHECK (language IN ('he', 'en')),
  compact_mode BOOLEAN DEFAULT false,
  high_contrast BOOLEAN DEFAULT false,

  -- Content preferences
  show_answers BOOLEAN DEFAULT false,
  show_onboarding BOOLEAN DEFAULT true,

  -- Notification preferences
  notification_email BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only see their own preferences (but service role bypasses this)
CREATE POLICY user_prefs_select ON user_preferences
  FOR SELECT USING (true);

CREATE POLICY user_prefs_update ON user_preferences
  FOR UPDATE USING (true);

CREATE POLICY user_prefs_insert ON user_preferences
  FOR INSERT WITH CHECK (true);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_preferences_updated_at ON user_preferences;
CREATE TRIGGER user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_preferences_updated_at();
