-- Enable vector extension (pgvector)
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to rag_documents (768 dims matches Gemini text-embedding-004)
ALTER TABLE rag_documents ADD COLUMN IF NOT EXISTS embedding vector(768);

CREATE INDEX IF NOT EXISTS idx_rag_documents_embedding
  ON rag_documents USING hnsw (embedding vector_cosine_ops);

-- RPC function for vector similarity search
CREATE OR REPLACE FUNCTION match_rag_documents(
  query_embedding vector(768),
  match_count int DEFAULT 5
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  source TEXT,
  content TEXT,
  metadata JSONB,
  created_by UUID,
  created_at TIMESTAMP,
  similarity FLOAT
) LANGUAGE sql STABLE AS $$
  SELECT
    id,
    title,
    source,
    content,
    metadata,
    created_by,
    created_at,
    1 - (embedding <=> query_embedding) as similarity
  FROM rag_documents
  WHERE embedding IS NOT NULL
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

-- RAG evaluation history (admin's manual pipeline-testing tool)
CREATE TABLE IF NOT EXISTS rag_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  expected_answer TEXT,
  ai_answer TEXT NOT NULL,
  retrieved_document_ids UUID[],
  metrics JSONB,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rag_evaluations_created_at ON rag_evaluations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rag_evaluations_created_by ON rag_evaluations(created_by);

-- Defense in depth: RLS policies (deny-all for anon/authenticated)
ALTER TABLE rag_evaluations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Deny all client access to rag_evaluations') THEN
    CREATE POLICY "Deny all client access to rag_evaluations"
      ON rag_evaluations AS RESTRICTIVE FOR ALL
      TO anon, authenticated
      USING (false);
  END IF;
END $$;
