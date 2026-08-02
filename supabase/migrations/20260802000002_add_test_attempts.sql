-- Real user test attempts (typed or spoken answers with AI grading)
CREATE TABLE IF NOT EXISTS test_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  user_answer TEXT NOT NULL,
  input_method TEXT DEFAULT 'typed',
  verdict TEXT,
  metrics JSONB,
  feedback TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'test_attempts_input_method_check'
  ) THEN
    ALTER TABLE test_attempts
      ADD CONSTRAINT test_attempts_input_method_check
      CHECK (input_method IN ('typed', 'voice'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_test_attempts_user_id ON test_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_created_at ON test_attempts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_test_attempts_question_id ON test_attempts(question_id);

-- Defense in depth: RLS policies (deny-all for anon/authenticated)
ALTER TABLE test_attempts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Deny all client access to test_attempts') THEN
    CREATE POLICY "Deny all client access to test_attempts"
      ON test_attempts AS RESTRICTIVE FOR ALL
      TO anon, authenticated
      USING (false);
  END IF;
END $$;
