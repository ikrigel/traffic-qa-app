-- Create app_settings table for storing app-wide configuration
CREATE TABLE app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

-- Insert default settings
INSERT INTO app_settings (key, value, description) VALUES
  ('favicon_url', '/favicon.svg', 'Application favicon URL or data URI'),
  ('app_theme_color', '#0ea5e9', 'App theme color for browser UI');

-- Create index for quick lookups
CREATE INDEX idx_app_settings_key ON app_settings(key);

-- Disable RLS for this table (read-only for service-role)
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role has full access" ON app_settings
  FOR ALL USING (true) WITH CHECK (true);
