import { test, expect } from '@playwright/test';

test.describe('Chat Assistant', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app
    await page.goto('http://localhost:3000');

    // Wait for page to load and auth to complete
    await page.waitForSelector('[data-testid="question-list"]', { timeout: 10000 });
  });

  test('should open chat assistant', async ({ page }) => {
    // Look for chat button or icon
    const chatButton = page.locator('button:has-text("💬")');
    if (await chatButton.isVisible()) {
      await chatButton.click();
    } else {
      // Try alternative selector for chat floating widget
      const chatWidget = page.locator('[data-testid="chat-widget"]');
      if (await chatWidget.isVisible()) {
        await chatWidget.click();
      }
    }

    // Chat should be visible
    const chatTitle = page.locator('text=Traffic Laws AI Assistant');
    await expect(chatTitle).toBeVisible({ timeout: 5000 });
  });

  test('should send message and receive response', async ({ page }) => {
    // Open chat
    const chatButton = page.locator('button:has-text("💬")');
    if (await chatButton.isVisible()) {
      await chatButton.click();
    }

    // Wait for chat to be visible
    await page.waitForSelector('text=Traffic Laws AI Assistant', { timeout: 5000 });

    // Send a message
    const input = page.locator('[placeholder*="Ask a question"]');
    await input.fill('מה הגבלת המהירות בעיר?');
    
    const sendButton = page.locator('button:has-text("Send")');
    await sendButton.click();

    // Wait for response - should see assistant message
    await page.waitForSelector('[data-testid="chat-message-assistant"]', { timeout: 15000 });

    const response = page.locator('[data-testid="chat-message-assistant"]').first();
    await expect(response).toBeVisible();
    
    const responseText = await response.textContent();
    expect(responseText).toBeTruthy();
    expect(responseText?.length).toBeGreaterThan(0);
  });

  test('should handle generation errors gracefully', async ({ page }) => {
    // Open chat
    const chatButton = page.locator('button:has-text("💬")');
    if (await chatButton.isVisible()) {
      await chatButton.click();
    }

    // Wait for chat to be visible
    await page.waitForSelector('text=Traffic Laws AI Assistant', { timeout: 5000 });

    // Send a message
    const input = page.locator('[placeholder*="Ask a question"]');
    await input.fill('test');
    
    const sendButton = page.locator('button:has-text("Send")');
    await sendButton.click();

    // Should eventually show error or response
    const errorOrResponse = page.locator(
      'text=/All your API keys failed|I don\'t have enough information|מהו/',
      { timeout: 15000 }
    );
    
    await expect(errorOrResponse).toBeVisible();
  });

  test('should close chat widget', async ({ page }) => {
    // Open chat
    const chatButton = page.locator('button:has-text("💬")');
    if (await chatButton.isVisible()) {
      await chatButton.click();
    }

    // Wait for chat
    await page.waitForSelector('text=Traffic Laws AI Assistant', { timeout: 5000 });

    // Click close button (X)
    const closeButton = page.locator('[data-testid="chat-close"]');
    if (await closeButton.isVisible()) {
      await closeButton.click();
    } else {
      const xButton = page.locator('button:has-text("✕")').first();
      await xButton.click();
    }

    // Chat should be hidden
    const chatTitle = page.locator('text=Traffic Laws AI Assistant');
    await expect(chatTitle).not.toBeVisible({ timeout: 5000 });
  });
});
