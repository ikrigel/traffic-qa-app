-- Add role-based access control to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin', 'super_admin'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Self-heal: the hardcoded super admin account must always carry the super_admin role
UPDATE users
SET role = 'super_admin'
WHERE email = 'ikrigel@gmail.com'
  AND role IS DISTINCT FROM 'super_admin';

-- RAG source documents table (foundation only — no embeddings/vector search yet)
CREATE TABLE IF NOT EXISTS rag_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  source TEXT,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rag_documents_created_at ON rag_documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rag_documents_created_by ON rag_documents(created_by);

-- Server-side application/debug logs
CREATE TABLE IF NOT EXISTS debug_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL DEFAULT 'error',
  source TEXT NOT NULL,
  message TEXT NOT NULL,
  context JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'debug_logs_level_check'
  ) THEN
    ALTER TABLE debug_logs
      ADD CONSTRAINT debug_logs_level_check CHECK (level IN ('info', 'warn', 'error'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_debug_logs_created_at ON debug_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_debug_logs_level ON debug_logs(level);

-- Defense in depth: RLS policies (deny-all for anon/authenticated, since this app uses service-role client)
ALTER TABLE rag_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE debug_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Deny all client access to rag_documents') THEN
    CREATE POLICY "Deny all client access to rag_documents"
      ON rag_documents AS RESTRICTIVE FOR ALL
      TO anon, authenticated
      USING (false);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Deny all client access to debug_logs') THEN
    CREATE POLICY "Deny all client access to debug_logs"
      ON debug_logs AS RESTRICTIVE FOR ALL
      TO anon, authenticated
      USING (false);
  END IF;
END $$;
