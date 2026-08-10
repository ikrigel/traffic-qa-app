/**
 * Streaming file upload with client-side chunking
 * Breaks large files into 4MB chunks to avoid Vercel's 6MB request limit
 */

const CHUNK_SIZE = 4 * 1024 * 1024; // 4MB per chunk

export interface UploadChunkEvent {
  type: 'start' | 'progress' | 'complete' | 'error';
  chunkIndex?: number;
  totalChunks?: number;
  progress?: number; // 0-100
  error?: string;
}

export interface UploadOptions {
  onProgress?: (event: UploadChunkEvent) => void;
  source?: string;
}

async function uploadChunk(
  sessionId: string,
  chunkIndex: number,
  totalChunks: number,
  chunk: Blob,
  filename: string,
  source?: string
): Promise<{ sessionId: string; success: boolean; error?: string }> {
  const formData = new FormData();
  formData.append('sessionId', sessionId);
  formData.append('chunkIndex', chunkIndex.toString());
  formData.append('totalChunks', totalChunks.toString());
  formData.append('filename', filename);
  formData.append('chunk', chunk);
  if (source) {
    formData.append('source', source);
  }

  const response = await fetch('/api/admin/rag-documents/upload-chunk', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || data.message || `Chunk upload failed: ${response.status}`);
  }

  return { sessionId: data.sessionId, success: true };
}

export async function uploadLargeFile(
  file: File,
  options: UploadOptions = {}
): Promise<{ success: boolean; error?: string; results?: any }> {
  const { onProgress, source } = options;
  const sessionId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const totalSize = file.size;
  const totalChunks = Math.ceil(totalSize / CHUNK_SIZE);

  console.log(`[CHUNKED-UPLOAD] Starting upload: ${file.name} (${(totalSize / 1024 / 1024).toFixed(2)}MB, ${totalChunks} chunks)`);

  try {
    onProgress?.({ type: 'start', totalChunks });

    let uploadedSize = 0;
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, totalSize);
      const chunk = file.slice(start, end);

      console.log(`[CHUNKED-UPLOAD] Uploading chunk ${i + 1}/${totalChunks} (${(chunk.size / 1024 / 1024).toFixed(2)}MB)`);

      await uploadChunk(sessionId, i, totalChunks, chunk, file.name, source);

      uploadedSize += chunk.size;
      const progress = Math.round((uploadedSize / totalSize) * 100);

      onProgress?.({
        type: 'progress',
        chunkIndex: i,
        totalChunks,
        progress,
      });
    }

    console.log(`[CHUNKED-UPLOAD] ✅ All chunks uploaded, finalizing...`);

    // Finalize upload (server will merge all chunks and process)
    const finalResponse = await fetch('/api/admin/rag-documents/upload-finalize', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, filename: file.name, source }),
    });

    const finalData = await finalResponse.json();

    if (!finalResponse.ok) {
      const errorMsg = finalData.error?.message || finalData.error || 'Finalization failed';
      throw new Error(errorMsg);
    }

    // Check if it's a duplicate
    if (finalData.error?.code === 'DUPLICATE_FILE') {
      const dupMsg = `File already uploaded as "${finalData.error.existingDocTitle}" - ${finalData.error.message}`;
      console.log(`[CHUNKED-UPLOAD] ℹ️ Duplicate: ${dupMsg}`);
      return { success: false, error: dupMsg };
    }

    onProgress?.({ type: 'complete' });
    console.log(`[CHUNKED-UPLOAD] ✅ Upload complete`);

    return { success: true, results: finalData.results };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Upload failed';
    console.error(`[CHUNKED-UPLOAD] ❌ Error: ${errorMsg}`);
    onProgress?.({ type: 'error', error: errorMsg });
    return { success: false, error: errorMsg };
  }
}
