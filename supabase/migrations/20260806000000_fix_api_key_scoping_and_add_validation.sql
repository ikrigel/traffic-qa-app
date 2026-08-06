-- Fix global-vs-per-user uniqueness bug (root cause 1)
DROP INDEX IF EXISTS idx_api_keys_hash;
CREATE UNIQUE INDEX IF NOT EXISTS idx_api_keys_user_hash ON api_keys(user_id, key_hash);

-- Key validation tracking (for new test/validate endpoint)
ALTER TABLE api_keys
  ADD COLUMN IF NOT EXISTS validation_status TEXT DEFAULT 'unknown'
    CHECK (validation_status IN ('unknown', 'valid', 'invalid')),
  ADD COLUMN IF NOT EXISTS last_validated_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS last_validation_error TEXT,
  ADD COLUMN IF NOT EXISTS priority INTEGER;

-- RLS policies (maintain existing deny-all for defense-in-depth)
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Deny all client access to api_keys') THEN
    CREATE POLICY "Deny all client access to api_keys"
      ON api_keys AS RESTRICTIVE FOR ALL
      TO anon, authenticated
      USING (false);
  END IF;
END $$;
