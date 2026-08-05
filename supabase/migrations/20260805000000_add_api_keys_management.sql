-- API Keys table for per-user provider keys
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  key_encrypted TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  display_name TEXT,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP,
  rotated_at TIMESTAMP
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'api_keys_provider_check'
  ) THEN
    ALTER TABLE api_keys
      ADD CONSTRAINT api_keys_provider_check
      CHECK (provider IN ('gemini', 'openai', 'groq', 'ollama', 'huggingface'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_provider ON api_keys(provider);
CREATE INDEX IF NOT EXISTS idx_api_keys_default ON api_keys(user_id, is_default);

-- Provider configuration table (admin settings)
CREATE TABLE IF NOT EXISTS ai_provider_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT UNIQUE NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  default_model TEXT,
  rate_limit_per_minute INT,
  cost_per_request NUMERIC(10,6),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO ai_provider_config (provider, is_enabled, default_model, rate_limit_per_minute, cost_per_request)
VALUES
  ('gemini', true, 'gemini-1.5-flash', 60, 0.0),
  ('groq', true, 'mixtral-8x7b-32768', 30, 0.0),
  ('openai', true, 'gpt-3.5-turbo', 3500, 0.0015),
  ('ollama', true, 'llama2', NULL, 0.0),
  ('huggingface', true, 'meta-llama/Llama-2-7b-chat-hf', 100, 0.0)
ON CONFLICT (provider) DO NOTHING;

-- Usage tracking per key
CREATE TABLE IF NOT EXISTS api_key_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  provider TEXT NOT NULL,
  operation TEXT NOT NULL, -- 'embedding', 'generation', 'grading'
  tokens_used INT,
  cost_incurred NUMERIC(10,6),
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_key_usage_key_id ON api_key_usage(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_key_usage_user_id ON api_key_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_api_key_usage_provider ON api_key_usage(provider);
CREATE INDEX IF NOT EXISTS idx_api_key_usage_created_at ON api_key_usage(created_at DESC);

-- RLS Policies (deny-all for defense-in-depth)
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_provider_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_key_usage ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Deny all client access to api_keys') THEN
    CREATE POLICY "Deny all client access to api_keys"
      ON api_keys AS RESTRICTIVE FOR ALL
      TO anon, authenticated
      USING (false);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Deny all client access to ai_provider_config') THEN
    CREATE POLICY "Deny all client access to ai_provider_config"
      ON ai_provider_config AS RESTRICTIVE FOR ALL
      TO anon, authenticated
      USING (false);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Deny all client access to api_key_usage') THEN
    CREATE POLICY "Deny all client access to api_key_usage"
      ON api_key_usage AS RESTRICTIVE FOR ALL
      TO anon, authenticated
      USING (false);
  END IF;
END $$;
