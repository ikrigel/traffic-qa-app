import { test, expect } from '@playwright/test';
import { loginAsUser } from '../fixtures/auth';

test.describe('Driving Tutor RAG System - Acceptance Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login as test user
    await loginAsUser(page, 'user');

    // Navigate to tutor page
    await page.goto('/tutor');
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display tutor interface with mode selector', async ({ page }) => {
    // Check main heading
    await expect(page.locator('text=מדריך דיני תעבורה')).toBeVisible();

    // Check mode buttons
    await expect(page.locator('button:has-text("מדריך")')).toBeVisible();
    await expect(page.locator('button:has-text("חידון")')).toBeVisible();
    await expect(page.locator('button:has-text("תשובת בחינה")')).toBeVisible();
    await expect(page.locator('button:has-text("סיכום")')).toBeVisible();
  });

  test('should handle overtaking question with proper source citation', async ({ page }) => {
    // Type a question about overtaking (עקיפה)
    await page.fill('input[placeholder="שאלו שאלה..."]', 'מה הם כללי העקיפה?');

    // Send message
    await page.click('button:has-text("שלח")');

    // Wait for response
    await page.waitForSelector('text=מקור', { timeout: 10000 });

    // Verify response contains source citation
    const sourceElement = await page.locator('text=📚 מקורות:');
    await expect(sourceElement).toBeVisible();

    // Verify citation format
    const citations = await page.locator('[class*="citation"]');
    expect(await citations.count()).toBeGreaterThan(0);
  });

  test('should handle insufficient evidence gracefully', async ({ page }) => {
    // Ask a question unlikely to have documentation
    await page.fill('input[placeholder="שאלו שאלה..."]', 'מה הם סוגי הרכבים הנדירים ביותר?');

    // Send message
    await page.click('button:has-text("שלח")');

    // Wait for response (might contain insufficient evidence message)
    await page.waitForTimeout(5000);

    // Check if response indicates insufficient evidence or provides sources
    const response = await page.locator('[class*="assistant"]').last();
    const responseText = await response.textContent();

    // Either has sources OR has the exact insufficient evidence phrase
    const hasSourcesOrInsufficient =
      responseText?.includes('מקור') ||
      responseText?.includes('לא מצאתי לכך מקור מספיק');

    expect(hasSourcesOrInsufficient).toBeTruthy();
  });

  test('should maintain conversation history', async ({ page }) => {
    // Send first message
    await page.fill('input[placeholder="שאלו שאלה..."]', 'מה זה דיני תעבורה?');
    await page.click('button:has-text("שלח")');

    // Wait for first response
    await page.waitForTimeout(3000);

    // Verify first message appears
    await expect(page.locator('text=מה זה דיני תעבורה')).toBeVisible();

    // Send follow-up message
    await page.fill('input[placeholder="שאלו שאלה..."]', 'ספר לי עוד על זה');
    await page.click('button:has-text("שלח")');

    // Wait for second response
    await page.waitForTimeout(3000);

    // Verify both messages are in history
    const messages = await page.locator('[class*="user"]');
    expect(await messages.count()).toBeGreaterThanOrEqual(2);
  });

  test('should switch between teaching modes correctly', async ({ page }) => {
    // Click quiz mode
    await page.click('button:has-text("חידון")');

    // Verify quiz mode is selected (button styling)
    const quizButton = page.locator('button:has-text("חידון")');
    await expect(quizButton).toHaveClass(/bg-blue-500/);

    // Send a message in quiz mode
    await page.fill('input[placeholder="שאלו שאלה..."]', 'חידון על מהירות');
    await page.click('button:has-text("שלח")');

    // Wait for response
    await page.waitForTimeout(3000);

    // Response should be formatted as a single question (quiz mode behavior)
    const response = await page.locator('[class*="assistant"]').last();
    const responseText = await response.textContent();
    expect(responseText).toBeTruthy();
  });

  test('should clear history when clicking clear button', async ({ page }) => {
    // Send a message
    await page.fill('input[placeholder="שאלו שאלה..."]', 'שאלה בדיקה');
    await page.click('button:has-text("שלח")');

    // Wait for response
    await page.waitForTimeout(2000);

    // Verify message appears
    await expect(page.locator('text=שאלה בדיקה')).toBeVisible();

    // Click clear button
    await page.click('button:has-text("🗑️ נקה")');

    // Verify messages are cleared
    await expect(page.locator('text=ברוכים הבאים')).toBeVisible();
    await expect(page.locator('text=שאלה בדיקה')).not.toBeVisible();
  });

  test('should display error message on API failure', async ({ page }) => {
    // Intercept API call and return error
    await page.route('/api/tutor/chat', route => {
      route.abort('failed');
    });

    // Send message
    await page.fill('input[placeholder="שאלו שאלה..."]', 'תשאלה');
    await page.click('button:has-text("שלח")');

    // Wait for error display
    await page.waitForTimeout(2000);

    // Verify error message appears
    const errorElement = await page.locator('[class*="text-red"]');
    expect(await errorElement.count()).toBeGreaterThan(0);
  });

  test('should handle concurrent message sending gracefully', async ({ page }) => {
    // Fill input
    await page.fill('input[placeholder="שאלו שאלה..."]', 'שאלה ראשונה');

    // Try to send multiple times quickly
    const sendButton = page.locator('button:has-text("שלח")');
    await sendButton.click();
    await sendButton.click(); // Second click while loading
    await sendButton.click(); // Third click while loading

    // Wait for response
    await page.waitForTimeout(5000);

    // Should only process one message (button is disabled during send)
    await expect(sendButton).toBeDisabled();
  });

  test('should preserve RTL text layout in responses', async ({ page }) => {
    // Send message
    await page.fill('input[placeholder="שאלו שאלה..."]', 'שלום, תן לי תשובה בעברית');
    await page.click('button:has-text("שלח")');

    // Wait for response
    await page.waitForTimeout(3000);

    // Verify page RTL direction is preserved
    const body = page.locator('body');
    await expect(body).toHaveAttribute('dir', 'rtl');

    // Verify response contains Hebrew text
    const response = await page.locator('[class*="assistant"]').last();
    const responseText = await response.textContent();
    const hasHebrewChars = /[֐-׿]/.test(responseText || '');
    expect(hasHebrewChars).toBeTruthy();
  });

  test('should display sources with proper metadata when available', async ({ page }) => {
    // Send a question that should have sources
    await page.fill('input[placeholder="שאלו שאלה..."]', 'מה גבולות המהירות בישראל?');
    await page.click('button:has-text("שלח")');

    // Wait for response with sources
    await page.waitForSelector('text=מקורות:', { timeout: 10000 });

    // Verify source format
    const sourceSection = await page.locator('text=📚 מקורות:').isVisible();
    expect(sourceSection).toBeTruthy();

    // Verify source items are listed
    const sourceItems = await page.locator('li:has-text("S")');
    expect(await sourceItems.count()).toBeGreaterThan(0);
  });
});
