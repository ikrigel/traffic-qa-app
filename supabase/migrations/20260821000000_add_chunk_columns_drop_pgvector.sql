-- Add new chunking-related columns to rag_documents table
ALTER TABLE rag_documents
ADD COLUMN chunk_index INT,
ADD COLUMN parent_document_id UUID,
ADD COLUMN parent_title TEXT,
ADD COLUMN total_chunks INT,
ADD COLUMN regulation_numbers TEXT[];

-- Create index on parent_document_id for grouping/filtering chunks by parent document
CREATE INDEX idx_rag_documents_parent_document_id ON rag_documents(parent_document_id);

-- Drop the orphaned pgvector column (unused, wrong dimensionality)
-- First drop dependent objects: the matching function and its RPC
DROP FUNCTION IF EXISTS match_rag_documents(vector(768), int) CASCADE;
DROP RPC IF EXISTS match_rag_documents(query_embedding vector(768), match_count int) CASCADE;

-- Then drop the column
ALTER TABLE rag_documents
DROP COLUMN IF EXISTS embedding;

-- Drop the HNSW index on the now-deleted embedding column (if it exists)
DROP INDEX IF EXISTS rag_documents_embedding_idx;
