import { Pinecone } from '@pinecone-database/pinecone';

let pineconeClient: Pinecone | null = null;

export const getPineconeClient = (): Pinecone => {
  if (!pineconeClient) {
    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey) throw new Error('PINECONE_API_KEY not set');
    pineconeClient = new Pinecone({ apiKey });
  }
  return pineconeClient;
};

export const getPineconeIndex = () => {
  const client = getPineconeClient();
  const indexName = process.env.PINECONE_INDEX_NAME || 'traffic-rag';
  return client.Index(indexName);
};

export interface PineconeVector {
  id: string;
  values: number[];
  metadata?: Record<string, any>;
}

export const upsertVectors = async (vectors: PineconeVector[]) => {
  const index = getPineconeIndex();
  return index.upsert({
    records: vectors.map(v => ({
      id: v.id,
      values: v.values,
      metadata: v.metadata || {},
    })),
  });
};

export const queryVectors = async (embedding: number[], topK = 5) => {
  const index = getPineconeIndex();
  const results = await index.query({
    vector: embedding,
    topK,
    includeMetadata: true,
  });
  return results.matches || [];
};

export const deleteVector = async (id: string) => {
  const index = getPineconeIndex();
  try {
    await index.deleteMany({
      ids: [id],
    });
  } catch (error) {
    console.error(`Failed to delete vector ${id}:`, error);
  }
};

export const deleteVectors = async (ids: string[]) => {
  const index = getPineconeIndex();
  try {
    await index.deleteMany({
      ids,
    });
  } catch (error) {
    console.error(`Failed to delete vectors:`, error);
  }
};
