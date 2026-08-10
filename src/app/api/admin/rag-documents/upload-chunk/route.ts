/* eslint-disable no-console */
import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { apiError } from '@/lib/apiErrors';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export const dynamic = 'force-dynamic';

const UPLOAD_DIR = path.join(os.tmpdir(), 'rag-uploads');

async function ensureUploadDir() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    console.error('[CHUNK-UPLOAD] Failed to create upload dir:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user || user.role !== 'super_admin') {
      return apiError('UNAUTHORIZED_KEY_ACCESS', 'Only super_admin can upload RAG documents', 403);
    }

    await ensureUploadDir();

    const formData = await request.formData();
    const sessionId = formData.get('sessionId') as string;
    const chunkIndexStr = formData.get('chunkIndex') as string;
    const totalChunksStr = formData.get('totalChunks') as string;
    const chunk = formData.get('chunk') as File;

    if (!sessionId || !chunkIndexStr || !totalChunksStr || !chunk) {
      return apiError('MISSING_FIELDS', 'Missing required fields', 400);
    }

    const chunkIndex = parseInt(chunkIndexStr, 10);
    const totalChunks = parseInt(totalChunksStr, 10);

    console.log(`[CHUNK-UPLOAD] Receiving chunk ${chunkIndex + 1}/${totalChunks} for session ${sessionId}`);

    // Create session directory
    const sessionDir = path.join(UPLOAD_DIR, sessionId);
    await fs.mkdir(sessionDir, { recursive: true });

    // Save chunk to temp file
    const arrayBuffer = await chunk.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const chunkPath = path.join(sessionDir, `chunk-${chunkIndex}`);
    await fs.writeFile(chunkPath, buffer);

    console.log(`[CHUNK-UPLOAD] ✅ Saved chunk ${chunkIndex + 1}/${totalChunks} (${(buffer.length / 1024 / 1024).toFixed(2)}MB)`);

    return NextResponse.json({
      success: true,
      sessionId,
      chunkIndex,
      totalChunks,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Chunk upload failed';
    console.error('[CHUNK-UPLOAD] Error:', message);
    return apiError('INTERNAL_ERROR', message, 500);
  }
}
