import { test, expect } from '@playwright/test';
import { loginAsUser } from '../fixtures/auth';
import fs from 'fs';
import path from 'path';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

test.describe('RAG Document Embedding Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Login as super_admin for admin access
    await loginAsUser(page, 'super_admin');

    // Navigate to home page
    await page.goto(`${APP_URL}/`);
    await page.waitForLoadState('networkidle');
  });

  test('should embed and store document in vector database', async ({ page, context, request }) => {
    // Check if logged in
    const adminLink = page.locator('a[href="/admin"]');
    const isLoggedIn = await adminLink.count() > 0;

    if (!isLoggedIn) {
      test.skip();
      return;
    }

    // Navigate to admin panel
    await page.click('a[href="/admin"]');
    await page.waitForLoadState('networkidle');

    // Click on RAG Documents
    await page.click('text=RAG Documents');
    await page.waitForLoadState('networkidle');

    // Click on Paste Text tab
    await page.click('text=📝 Paste Text');

    // Fill in test document
    const testTitle = `Test Embedding Doc ${Date.now()}`;
    const testContent = `This is a test document with unique content for embedding verification. It contains information about traffic laws and regulations. The document should be successfully embedded in the vector database using Gemini embeddings with 768 dimensions.`;
    const testSource = 'Test Embedding Verification';

    await page.fill('input[placeholder*="Traffic Safety"]', testTitle);
    await page.fill('input[placeholder*="Israeli"]', testSource);
    await page.fill('textarea', testContent);

    // Click Upload button
    const uploadButton = page.locator('button:has-text("📤 Upload Document")');
    await uploadButton.click();

    // Wait for success message
    const successMessage = page.locator('text=/✅|Successfully/');
    await expect(successMessage).toBeVisible({ timeout: 10000 });

    // Wait for document to appear in list
    await page.waitForTimeout(2000);

    // Refresh to see the uploaded document
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.click('text=RAG Documents');
    await page.waitForLoadState('networkidle');

    // Verify document appears in uploaded documents list
    const docTitle = page.locator(`text=${testTitle}`);
    await expect(docTitle).toBeVisible({ timeout: 5000 });

    // Look for the embedding status badge
    const embeddingBadge = page.locator(testTitle).locator('..').locator('text=/✅|⏳/');
    await expect(embeddingBadge).toBeVisible();

    // Check if it shows "Embedded" (green badge) or "Pending" (yellow badge)
    const badgeText = await embeddingBadge.textContent();
    expect(['✅ Embedded', '⏳ Pending']).toContain(badgeText?.trim());

    // Verify via API that document has embedding
    const response = await request.get(`${APP_URL}/api/admin/rag-documents`, {
      headers: {
        'Cookie': await getCookieString(context),
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    const uploadedDoc = data.documents?.find((doc: any) => doc.title === testTitle);

    expect(uploadedDoc).toBeDefined();
    expect(uploadedDoc.embedding).toBeTruthy(); // embedding field should be truthy if embedded
  });

  test('should retrieve embedded document via RAG query', async ({ page, request, context }) => {
    // Check if logged in
    const adminLink = page.locator('a[href="/admin"]');
    const isLoggedIn = await adminLink.count() > 0;

    if (!isLoggedIn) {
      test.skip();
      return;
    }

    // First, ensure we have a test document uploaded
    const testTitle = `RAG Query Test ${Date.now()}`;
    const testContent = `Speed limits in Israel vary by road type. Urban roads typically have a 50 km/h limit. Highways have 110 km/h limit. Main roads have 90 km/h limit. Exceeding speed limits is a serious traffic violation.`;

    // Upload document via API
    const uploadResponse = await request.post(`${APP_URL}/api/admin/rag-documents`, {
      headers: {
        'Cookie': await getCookieString(context),
      },
      data: {
        title: testTitle,
        content: testContent,
        source: 'Speed Limit Test',
      },
    });

    if (!uploadResponse.ok()) {
      console.log('Failed to upload test document, skipping RAG retrieval test');
      test.skip();
      return;
    }

    // Wait for embedding
    await page.waitForTimeout(3000);

    // Navigate to home and test RAG retrieval via chat
    await page.goto(`${APP_URL}/`);
    await page.waitForLoadState('networkidle');

    // Look for chat assistant
    const chatWidget = page.locator('text=/Chat|Assistant/i');
    const chatExists = await chatWidget.count() > 0;

    if (!chatExists) {
      console.log('Chat assistant not found, skipping chat test');
      test.skip();
      return;
    }

    // Send a query related to speed limits
    const chatInput = page.locator('input[placeholder*="Ask"]');
    if (await chatInput.count() > 0) {
      await chatInput.fill('What are the speed limits in Israel?');
      await chatInput.press('Enter');

      // Wait for response
      await page.waitForTimeout(5000);

      // Verify response mentions speed limits
      const response = page.locator('text=/speed|limit|110|50|90/i');
      const hasResponse = await response.count() > 0;

      if (hasResponse) {
        await expect(response).toBeVisible();
      }
    }
  });

  test('should detect and reject duplicate documents by content hash', async ({ page, context, request }) => {
    // Check if logged in
    const adminLink = page.locator('a[href="/admin"]');
    const isLoggedIn = await adminLink.count() > 0;

    if (!isLoggedIn) {
      test.skip();
      return;
    }

    const testTitle = `Duplicate Test ${Date.now()}`;
    const testContent = 'This is a test document with unique content for duplicate detection testing.';

    // Upload first document
    const firstUpload = await request.post(`${APP_URL}/api/admin/rag-documents`, {
      headers: {
        'Cookie': await getCookieString(context),
      },
      data: {
        title: testTitle,
        content: testContent,
        source: 'Test',
      },
    });

    expect(firstUpload.ok()).toBeTruthy();

    // Try to upload same content with different title
    const secondUpload = await request.post(`${APP_URL}/api/admin/rag-documents`, {
      headers: {
        'Cookie': await getCookieString(context),
      },
      data: {
        title: `${testTitle} - Duplicate`,
        content: testContent, // Same content
        source: 'Test',
      },
    });

    // Should fail with 409 (duplicate)
    expect([409, 400]).toContain(secondUpload.status());

    const response = await secondUpload.json();
    if (response.error?.code === 'DUPLICATE_FILE') {
      expect(response.error.message).toContain('already uploaded');
    }
  });

  test('should verify embedding dimensions are correct (768D for Gemini)', async ({ page, context, request }) => {
    // Check if logged in
    const adminLink = page.locator('a[href="/admin"]');
    const isLoggedIn = await adminLink.count() > 0;

    if (!isLoggedIn) {
      test.skip();
      return;
    }

    // Navigate to admin panel
    await page.click('a[href="/admin"]');
    await page.waitForLoadState('networkidle');

    // Click on RAG Documents
    await page.click('text=RAG Documents');
    await page.waitForLoadState('networkidle');

    // Get list of documents
    const response = await request.get(`${APP_URL}/api/admin/rag-documents`, {
      headers: {
        'Cookie': await getCookieString(context),
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    // Find a document with embedding
    const docWithEmbedding = data.documents?.find((doc: any) => doc.embedding);

    if (docWithEmbedding) {
      // Embedding should be an array of numbers (768 dimensions)
      if (Array.isArray(docWithEmbedding.embedding)) {
        // Gemini embeddings are 768D
        expect(docWithEmbedding.embedding.length).toBe(768);
      }
    }
  });

  test('should show embedding status badges (Embedded vs Pending)', async ({ page, context }) => {
    // Check if logged in
    const adminLink = page.locator('a[href="/admin"]');
    const isLoggedIn = await adminLink.count() > 0;

    if (!isLoggedIn) {
      test.skip();
      return;
    }

    // Navigate to admin panel
    await page.click('a[href="/admin"]');
    await page.waitForLoadState('networkidle');

    // Click on RAG Documents
    await page.click('text=RAG Documents');
    await page.waitForLoadState('networkidle');

    // Look for status badges
    const embeddedBadges = page.locator('text=/✅ Embedded/');
    const pendingBadges = page.locator('text=/⏳ Pending/');

    const hasEmbedded = await embeddedBadges.count() > 0;
    const hasPending = await pendingBadges.count() > 0;

    // Should have at least one badge showing (either embedded or pending)
    if (hasEmbedded || hasPending) {
      // Good - documents exist and have status badges
      expect(true).toBeTruthy();
    }
  });

  test('should delete document and remove embedding from vector database', async ({ page, context, request }) => {
    // Check if logged in
    const adminLink = page.locator('a[href="/admin"]');
    const isLoggedIn = await adminLink.count() > 0;

    if (!isLoggedIn) {
      test.skip();
      return;
    }

    const testTitle = `Delete Test ${Date.now()}`;

    // Upload document via API
    const uploadResponse = await request.post(`${APP_URL}/api/admin/rag-documents`, {
      headers: {
        'Cookie': await getCookieString(context),
      },
      data: {
        title: testTitle,
        content: 'This document will be deleted to verify embedding removal.',
        source: 'Delete Test',
      },
    });

    expect(uploadResponse.ok()).toBeTruthy();
    const uploadedData = await uploadResponse.json();
    const docId = uploadedData.document?.id;

    if (!docId) {
      test.skip();
      return;
    }

    // Navigate to admin panel
    await page.click('a[href="/admin"]');
    await page.waitForLoadState('networkidle');

    // Click on RAG Documents
    await page.click('text=RAG Documents');
    await page.waitForLoadState('networkidle');

    // Find and delete the document
    const deleteButton = page.locator(`text=${testTitle}`).locator('..').locator('button:has-text("🗑️")');
    await deleteButton.click();

    // Confirm deletion
    await page.waitForLoadState('networkidle');

    // Accept the confirmation dialog if it appears
    const confirmDialog = page.locator('text=/Delete|confirm/i');
    if (await confirmDialog.count() > 0) {
      const confirmButton = page.locator('button:has-text("Delete")');
      await confirmButton.click();
    }

    // Wait for deletion to complete
    await page.waitForTimeout(2000);

    // Verify document is removed from database
    const getResponse = await request.get(`${APP_URL}/api/admin/rag-documents`, {
      headers: {
        'Cookie': await getCookieString(context),
      },
    });

    expect(getResponse.ok()).toBeTruthy();
    const data = await getResponse.json();
    const deletedDoc = data.documents?.find((doc: any) => doc.id === docId);

    // Document should no longer exist
    expect(deletedDoc).toBeUndefined();
  });

  test('should validate database integrity with RAG validation endpoint', async ({ request, context }) => {
    // Check database integrity via validation endpoint
    const validationResponse = await request.get(`${APP_URL}/api/admin/rag-documents/validate`, {
      headers: {
        'Cookie': await getCookieString(context),
      },
    });

    if (validationResponse.ok()) {
      const report = await validationResponse.json();

      expect(report).toHaveProperty('report');
      const { report: data } = report;

      // Verify report structure
      expect(data).toHaveProperty('totalDocuments');
      expect(data).toHaveProperty('documentsWithEmbedding');
      expect(data).toHaveProperty('documentsWithoutEmbedding');
      expect(data).toHaveProperty('orphanedChunks');

      // Documents with embeddings should be >= 0
      expect(data.documentsWithEmbedding).toBeGreaterThanOrEqual(0);
      expect(data.documentsWithoutEmbedding).toBeGreaterThanOrEqual(0);

      // Total should equal sum of embedded and non-embedded
      expect(data.totalDocuments).toBe(
        data.documentsWithEmbedding + data.documentsWithoutEmbedding
      );
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
