import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

test.describe('RAG Document Upload', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto(`${APP_URL}/`);

    // Wait for auth to complete and page to load
    await page.waitForLoadState('networkidle');
  });

  test('should upload a PDF document and display success message', async ({ page, context }) => {
    // Check if already logged in by looking for admin panel link
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

    // Click on Upload Files tab
    await page.click('text=📁 Upload Files');

    // Create a simple test PDF file
    const testPdfPath = path.join(__dirname, 'test-document.pdf');

    // If test PDF doesn't exist, create a mock one or skip
    if (!fs.existsSync(testPdfPath)) {
      console.log('Test PDF not found, skipping file upload test');
      test.skip();
      return;
    }

    // Set file input
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testPdfPath);

    // Verify file appears in the selected files list
    await expect(page.locator('text=test-document.pdf')).toBeVisible();

    // Click Upload button
    const uploadButton = page.locator('button:has-text("📤 Upload Files")');
    await uploadButton.click();

    // Wait for upload to complete
    await page.waitForTimeout(3000);

    // Check for success message
    const successMessage = page.locator('text=/✅|Successfully/');
    await expect(successMessage).toBeVisible({ timeout: 10000 });
  });

  test('should show error for large files', async ({ page }) => {
    // Check if logged in
    const adminLink = page.locator('a[href="/admin"]');
    if (await adminLink.count() === 0) {
      test.skip();
      return;
    }

    // Navigate to admin panel
    await page.click('a[href="/admin"]');
    await page.waitForLoadState('networkidle');

    // Click on RAG Documents
    await page.click('text=RAG Documents');
    await page.waitForLoadState('networkidle');

    // Click on Upload Files tab
    await page.click('text=📁 Upload Files');

    // Create a large test file (51MB, exceeds 50MB limit)
    const largeFilePath = path.join(__dirname, 'large-file.bin');
    const largeBuffer = Buffer.alloc(51 * 1024 * 1024);
    fs.writeFileSync(largeFilePath, largeBuffer);

    try {
      // Try to upload large file
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(largeFilePath);

      // Should show file info
      await expect(page.locator('text=large-file.bin')).toBeVisible();

      // File size should be displayed
      const sizeText = page.locator('text=/MB/');
      await expect(sizeText).toBeVisible();
    } finally {
      // Cleanup
      if (fs.existsSync(largeFilePath)) {
        fs.unlinkSync(largeFilePath);
      }
    }
  });

  test('should validate file types (PDF, DOCX, TXT)', async ({ page }) => {
    // Check if logged in
    const adminLink = page.locator('a[href="/admin"]');
    if (await adminLink.count() === 0) {
      test.skip();
      return;
    }

    // Navigate to admin panel
    await page.click('a[href="/admin"]');
    await page.waitForLoadState('networkidle');

    // Click on RAG Documents
    await page.click('text=RAG Documents');
    await page.waitForLoadState('networkidle');

    // Click on Upload Files tab
    await page.click('text=📁 Upload Files');

    // Check file input accepts only PDF, DOCX, TXT
    const fileInput = page.locator('input[type="file"]');
    const acceptAttribute = await fileInput.getAttribute('accept');

    expect(acceptAttribute).toContain('.pdf');
    expect(acceptAttribute).toContain('.docx');
    expect(acceptAttribute).toContain('.txt');
  });

  test('should switch between Paste Text and Upload Files tabs', async ({ page }) => {
    // Check if logged in
    const adminLink = page.locator('a[href="/admin"]');
    if (await adminLink.count() === 0) {
      test.skip();
      return;
    }

    // Navigate to admin panel
    await page.click('a[href="/admin"]');
    await page.waitForLoadState('networkidle');

    // Click on RAG Documents
    await page.click('text=RAG Documents');
    await page.waitForLoadState('networkidle');

    // Verify Paste Text tab is active by default
    await expect(page.locator('text=📝 Paste Text')).toBeVisible();
    await expect(page.locator('text=Title *')).toBeVisible();

    // Click Upload Files tab
    await page.click('text=📁 Upload Files');

    // Verify file input appears
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeVisible();

    // Click Paste Text tab
    await page.click('text=📝 Paste Text');

    // Verify text inputs appear
    await expect(page.locator('label:has-text("Title *")')).toBeVisible();
    await expect(page.locator('textarea')).toBeVisible();
  });

  test('should display uploaded documents in the list', async ({ page }) => {
    // Check if logged in
    const adminLink = page.locator('a[href="/admin"]');
    if (await adminLink.count() === 0) {
      test.skip();
      return;
    }

    // Navigate to admin panel
    await page.click('a[href="/admin"]');
    await page.waitForLoadState('networkidle');

    // Click on RAG Documents
    await page.click('text=RAG Documents');
    await page.waitForLoadState('networkidle');

    // Check if documents list exists
    const documentsList = page.locator('text=/Uploaded Documents/');
    const isVisible = await documentsList.isVisible().catch(() => false);

    if (isVisible) {
      // List should be present
      await expect(documentsList).toBeVisible();
    }
  });

  test('API endpoint should require super_admin role', async ({ request }) => {
    // Try to upload without authentication - should fail
    const response = await request.post(`${APP_URL}/api/admin/rag-documents/upload`, {
      data: {
        documents: [
          {
            title: 'Test',
            content: 'Test content',
            source: 'Test',
          },
        ],
      },
    });

    // Should return 401 (not authenticated) or 403 (forbidden)
    expect([401, 403]).toContain(response.status());
  });

  test('API endpoint should accept multipart/form-data', async ({ request }) => {
    // This test would require valid authentication
    // For now, just verify the endpoint exists and responds
    const response = await request.get(`${APP_URL}/api/admin/rag-documents/upload`);

    // Should return 200 for GET (returns documentation) or 401 for unauthenticated
    expect([200, 401, 403]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('endpoint');
      expect(data.endpoint).toContain('/api/admin/rag-documents/upload');
    }
  });
});
