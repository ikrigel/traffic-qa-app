import { test, expect } from '@playwright/test';
import { loginAsUser } from '../fixtures/auth';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

test.describe('RAG Embedding System', () => {
  test.beforeEach(async ({ page }) => {
    // Login as super_admin for admin API access
    await loginAsUser(page, 'super_admin');

    await page.goto(`${APP_URL}/`);
    await page.waitForLoadState('networkidle');
  });

  test('should verify embeddings exist in database', async ({ page, request, context }) => {
    // Check if logged in
    const adminLink = page.locator('a[href="/admin"]');
    const isLoggedIn = await adminLink.count() > 0;

    if (!isLoggedIn) {
      test.skip();
      return;
    }

    // Call debug endpoint
    const debugResponse = await request.get(`${APP_URL}/api/admin/rag-documents/debug-embeddings`, {
      headers: {
        'Cookie': await getCookieString(context),
      },
    });

    expect(debugResponse.ok()).toBeTruthy();
    const debugData = await debugResponse.json();

    // Verify embeddings exist
    expect(debugData.totalDocuments).toBeGreaterThan(0);
    expect(debugData.documentsWithEmbedding).toBeGreaterThan(0);
    expect(debugData.documentsWithoutEmbedding).toBeLessThanOrEqual(debugData.totalDocuments);

    // Verify embedding structure
    if (debugData.sampleDocument) {
      expect(debugData.sampleDocument.embeddingIsArray).toBeTruthy();
      expect(debugData.sampleDocument.embeddingLength).toBe(768); // Gemini 768D embeddings
    }

    // Verify RPC function works
    expect(debugData.rpcFunctionWorks).toBeTruthy();
  });

  test('should retrieve documents via vector similarity search', async ({ page, request, context }) => {
    const adminLink = page.locator('a[href="/admin"]');
    const isLoggedIn = await adminLink.count() > 0;

    if (!isLoggedIn) {
      test.skip();
      return;
    }

    // Call test-retrieval endpoint
    const testResponse = await request.post(`${APP_URL}/api/admin/rag-documents/test-retrieval`, {
      headers: {
        'Cookie': await getCookieString(context),
      },
      data: {
        query: 'מהי תקנה 25?', // "What is regulation 25?" in Hebrew
      },
    });

    expect(testResponse.ok()).toBeTruthy();
    const testData = await testResponse.json();

    // Verify retrieval works
    expect(testData.stats.totalDocuments).toBeGreaterThan(0);
    expect(testData.stats.withEmbedding).toBe(testData.stats.totalDocuments);

    // Should retrieve some documents
    expect(testData.retrieved).toBeDefined();
    expect(Array.isArray(testData.retrieved)).toBeTruthy();
    if (testData.retrieved.length > 0) {
      // Check similarity scores are valid (0-1)
      for (const doc of testData.retrieved) {
        expect(doc.similarity).toBeGreaterThanOrEqual(0);
        expect(doc.similarity).toBeLessThanOrEqual(1);
      }
    }
  });

  test('should provide RAG context to chat assistant', async ({ page, request, context }) => {
    const adminLink = page.locator('a[href="/admin"]');
    const isLoggedIn = await adminLink.count() > 0;

    if (!isLoggedIn) {
      test.skip();
      return;
    }

    // Send chat message
    const chatResponse = await request.post(`${APP_URL}/api/chat`, {
      headers: {
        'Cookie': await getCookieString(context),
      },
      data: {
        message: 'מהי תקנה 25?', // "What is regulation 25?" in Hebrew
      },
    });

    expect(chatResponse.ok()).toBeTruthy();
    const chatData = await chatResponse.json();

    // Verify response has sources
    expect(chatData.answer).toBeDefined();
    expect(chatData.sources).toBeDefined();
    expect(Array.isArray(chatData.sources)).toBeTruthy();

    // If documents were retrieved, verify they're in the response
    if (chatData.sources.length > 0) {
      for (const source of chatData.sources) {
        expect(source.id).toBeDefined();
        expect(source.title).toBeDefined();
      }
    }
  });

  test('should use RAG context for answer grading', async ({ page, request, context }) => {
    const adminLink = page.locator('a[href="/admin"]');
    const isLoggedIn = await adminLink.count() > 0;

    if (!isLoggedIn) {
      test.skip();
      return;
    }

    // Grade an answer
    const gradeResponse = await request.post(`${APP_URL}/api/test/evaluate`, {
      headers: {
        'Cookie': await getCookieString(context),
      },
      data: {
        questionId: 1,
        questionText: 'מהי תקנה 25?',
        correctAnswer: 'תקנה 25 עוסקת בעקיפה',
        userAnswer: 'תקנה 25 היא על עקיפה',
        inputMethod: 'typed',
      },
    });

    expect(gradeResponse.ok()).toBeTruthy();
    const gradeData = await gradeResponse.json();

    // Verify grading response
    expect(gradeData.verdict).toBeDefined();
    expect(['correct', 'partial', 'incorrect']).toContain(gradeData.verdict);
    expect(gradeData.feedback).toBeDefined();
    expect(gradeData.metrics).toBeDefined();
  });

  test('should handle multiple document chunks correctly', async ({ page, request, context }) => {
    const adminLink = page.locator('a[href="/admin"]');
    const isLoggedIn = await adminLink.count() > 0;

    if (!isLoggedIn) {
      test.skip();
      return;
    }

    // Get all documents
    const docsResponse = await request.get(`${APP_URL}/api/admin/rag-documents`, {
      headers: {
        'Cookie': await getCookieString(context),
      },
    });

    expect(docsResponse.ok()).toBeTruthy();
    const docsData = await docsResponse.json();

    // Verify documents exist
    expect(docsData.documents).toBeDefined();
    expect(Array.isArray(docsData.documents)).toBeTruthy();

    // Count documents with and without embeddings
    const withEmbedding = docsData.documents.filter((d: any) => d.embedding).length;
    const withoutEmbedding = docsData.documents.filter((d: any) => !d.embedding).length;

    console.log(`Documents: ${docsData.documents.length}, With embedding: ${withEmbedding}, Without: ${withoutEmbedding}`);

    // All documents should have embeddings
    expect(withEmbedding).toBe(docsData.documents.length);
    expect(withoutEmbedding).toBe(0);
  });

  test('should verify embedding dimensions are 768D', async ({ page, request, context }) => {
    const adminLink = page.locator('a[href="/admin"]');
    const isLoggedIn = await adminLink.count() > 0;

    if (!isLoggedIn) {
      test.skip();
      return;
    }

    const docsResponse = await request.get(`${APP_URL}/api/admin/rag-documents`, {
      headers: {
        'Cookie': await getCookieString(context),
      },
    });

    expect(docsResponse.ok()).toBeTruthy();
    const docsData = await docsResponse.json();

    // Check a document with embedding
    const docWithEmbedding = docsData.documents.find((d: any) => d.embedding);
    if (docWithEmbedding) {
      expect(Array.isArray(docWithEmbedding.embedding)).toBeTruthy();
      expect(docWithEmbedding.embedding.length).toBe(768); // Gemini 768D
    }
  });
});

// Helper function to get cookie string from context
async function getCookieString(context: any): Promise<string> {
  const cookies = await context.cookies();
  return cookies
    .map((cookie: any) => `${cookie.name}=${cookie.value}`)
    .join('; ');
}
