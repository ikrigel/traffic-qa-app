-- Document sources tracking
CREATE TABLE document_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  source_type TEXT CHECK (source_type IN ('url', 'file', 'text')) NOT NULL,
  source_url TEXT,
  source_path TEXT,
  source_text TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  last_ingested_at TIMESTAMP,
  ingest_status TEXT CHECK (ingest_status IN ('pending', 'in_progress', 'success', 'failed')),
  ingest_error TEXT,
  total_chunks INT DEFAULT 0,
  verified_chunks INT DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Content validation checksums
CREATE TABLE source_content_validation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES document_sources(id) ON DELETE CASCADE,
  content_hash TEXT UNIQUE,
  total_size INT,
  chunk_count INT,
  regulation_count INT,
  first_regulation INT,
  last_regulation INT,
  validated_at TIMESTAMP DEFAULT NOW()
);

-- Hebrew text index for search
CREATE TABLE hebrew_content_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES rag_documents(id) ON DELETE CASCADE,
  hebrew_tokens TEXT[], -- Array of Hebrew words for search
  regulation_numbers INT[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_document_sources_status ON document_sources(ingest_status);
CREATE INDEX idx_document_sources_active ON document_sources(is_active);
CREATE INDEX idx_source_content_validation_source ON source_content_validation(source_id);
CREATE INDEX idx_hebrew_content_index_tokens ON hebrew_content_index USING GIN(hebrew_tokens);
CREATE INDEX idx_hebrew_content_index_regulations ON hebrew_content_index USING GIN(regulation_numbers);
