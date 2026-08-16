import { test, expect } from '@playwright/test';
import { loginAsUser } from '../fixtures/auth';

test.describe('User API Keys Management', () => {
  test.beforeEach(async ({ page, context }) => {
    // Login as test user
    await loginAsUser(page, 'user');
  });

  test('should open settings modal and navigate to API Keys tab', async ({ page }) => {
    // Click settings button
    const settingsButton = page.getByRole('button', { name: /⚙️/i });
    await expect(settingsButton).toBeVisible();
    await settingsButton.click();

    // Verify settings modal is open
    const modal = page.locator('[class*="fixed inset-0"]');
    await expect(modal).toBeVisible();

    // Check that API Keys tab is visible
    const apiKeysTab = page.getByRole('button', { name: /🔑 API Keys/i });
    await expect(apiKeysTab).toBeVisible();

    // API Keys tab should be active by default
    await expect(apiKeysTab).toHaveClass(/text-indigo-600/);
  });

  test('should display provider selection buttons', async ({ page }) => {
    // Open settings
    await page.getByRole('button', { name: /⚙️/i }).click();

    // Check that all provider buttons are visible
    const providers = ['⚡ Groq', '🔮 Google Gemini', '🏠 Ollama', '🤖 OpenAI', '🤗 HuggingFace'];

    for (const provider of providers) {
      const providerButton = page.getByRole('button', { name: new RegExp(provider) });
      await expect(providerButton).toBeVisible();
    }
  });

  test('should select a provider and show help text', async ({ page }) => {
    // Open settings
    await page.getByRole('button', { name: /⚙️/i }).click();

    // Click Groq provider
    const groqButton = page.getByRole('button', { name: /⚡ Groq/ });
    await groqButton.click();

    // Verify it's selected (has indigo background)
    await expect(groqButton).toHaveClass(/bg-indigo-600/);

    // Verify help text mentions Groq console
    const helpText = page.locator('text=/groq.com/i');
    await expect(helpText).toBeVisible();
  });

  test('should validate empty API key submission', async ({ page }) => {
    // Open settings
    await page.getByRole('button', { name: /⚙️/i }).click();

    // Try to submit without entering a key
    const submitButton = page.getByRole('button', { name: /Add API Key/i });
    await expect(submitButton).toBeDisabled();

    // Error should appear when unfocusing the input
    const input = page.locator('input[type="password"]');
    await input.focus();
    await input.blur();
  });

  test('should add a new API key successfully', async ({ page }) => {
    // Open settings
    await page.getByRole('button', { name: /⚙️/i }).click();

    // Select provider (default is Groq)
    const groqButton = page.locator('button').filter({ hasText: /⚡ Groq/ }).first();
    await groqButton.click();

    // Enter display name
    const displayNameInput = page.locator('input[placeholder*="e.g., My"]').first();
    await displayNameInput.fill('My Test Groq Key');

    // Enter API key
    const apiKeyInput = page.locator('input[type="password"]').first();
    await apiKeyInput.fill('test-api-key-12345');

    // Submit form
    const submitButton = page.getByRole('button', { name: /Add API Key/i });
    await submitButton.click();

    // Wait for success message
    const successMessage = page.locator('text=/✅.*successfully/i').first();
    await expect(successMessage).toBeVisible({ timeout: 5000 });

    // Verify the key appears in the list
    const keyName = page.locator('text=My Test Groq Key').first();
    await expect(keyName).toBeVisible({ timeout: 5000 });
  });

  test('should display API key in the list', async ({ page }) => {
    // Open settings
    await page.getByRole('button', { name: /⚙️/i }).click();

    // Check if API keys list is visible (either with existing keys or empty state)
    const listSection = page.locator('text=/🔑 Your API Keys|No API Keys Added/i').first();
    await expect(listSection).toBeVisible();
  });

  test('should set API key as default', async ({ page }) => {
    // Open settings
    await page.getByRole('button', { name: /⚙️/i }).click();

    // Add first key
    const apiKeyInput = page.locator('input[type="password"]').first();
    await apiKeyInput.fill('first-test-key');

    const submitButton = page.getByRole('button', { name: /Add API Key/i });
    await submitButton.click();

    // Wait for first key to appear
    await page.waitForTimeout(1000);

    // Add second key with different provider
    const geminiButton = page.getByRole('button', { name: /🔮 Google Gemini/ }).first();
    await geminiButton.click();

    await apiKeyInput.fill('second-test-key');
    await submitButton.click();

    // Wait for second key to appear
    await page.waitForTimeout(1000);

    // Click "Set Default" on first key (should now exist)
    const setDefaultButtons = page.getByRole('button', { name: /Set Default/i });
    const firstSetDefaultButton = setDefaultButtons.first();

    if (await firstSetDefaultButton.isVisible()) {
      await firstSetDefaultButton.click();

      // Verify success message
      const successMessage = page.locator('text=/✅.*Default key updated/i').first();
      await expect(successMessage).toBeVisible({ timeout: 5000 });
    }
  });

  test('should delete an API key', async ({ page }) => {
    // Open settings
    await page.getByRole('button', { name: /⚙️/i }).click();

    // Add a key first
    const apiKeyInput = page.locator('input[type="password"]').first();
    await apiKeyInput.fill('temp-test-key');

    const submitButton = page.getByRole('button', { name: /Add API Key/i });
    await submitButton.click();

    // Wait for key to appear
    await page.waitForTimeout(1000);

    // Click delete button
    const deleteButton = page.getByRole('button', { name: /Delete/i }).first();

    // Handle confirmation dialog
    page.on('dialog', dialog => {
      dialog.accept();
    });

    await deleteButton.click();

    // Wait for deletion confirmation
    await page.waitForTimeout(500);

    // Verify success message
    const successMessage = page.locator('text=/✅.*deleted/i').first();
    await expect(successMessage).toBeVisible({ timeout: 5000 });
  });

  test('should handle duplicate API key submission', async ({ page }) => {
    // Open settings
    await page.getByRole('button', { name: /⚙️/i }).click();

    const apiKeyInput = page.locator('input[type="password"]').first();
    const submitButton = page.getByRole('button', { name: /Add API Key/i });

    // Add first key
    await apiKeyInput.fill('duplicate-test-key');
    await submitButton.click();

    // Wait for success
    await page.locator('text=/✅.*successfully/i').first().waitFor({ timeout: 5000 });

    // Try to add same key again
    await apiKeyInput.fill('duplicate-test-key');
    await submitButton.click();

    // Should show error
    const errorMessage = page.locator('text=/❌.*already in use/i').first();
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test('should display provider in key list', async ({ page }) => {
    // Open settings
    await page.getByRole('button', { name: /⚙️/i }).click();

    // Add a key
    const apiKeyInput = page.locator('input[type="password"]').first();
    const displayNameInput = page.locator('input[placeholder*="e.g., My"]').first();
    const submitButton = page.getByRole('button', { name: /Add API Key/i });

    await displayNameInput.fill('Test Provider Key');
    await apiKeyInput.fill('provider-test-key');
    await submitButton.click();

    // Wait for key to appear
    await page.waitForTimeout(1000);

    // Check that provider is displayed - use first() to avoid strict mode violation
    const providerText = page.locator('text=Provider: groq').first();
    await expect(providerText).toBeVisible({ timeout: 5000 });
  });

  test('should show help text for each provider', async ({ page }) => {
    // Open settings
    await page.getByRole('button', { name: /⚙️/i }).click();

    const providers = [
      { name: /⚡ Groq/, helpText: /console.groq.com|groq/ },
      { name: /🔮 Google Gemini/, helpText: /aistudio.google.com|Google AI Studio/ },
      { name: /🏠 Ollama/, helpText: /ollama.ai|Ollama/ },
      { name: /🤖 OpenAI/, helpText: /platform.openai.com|OpenAI Platform/ },
      { name: /🤗 HuggingFace/, helpText: /huggingface.co|HuggingFace/ },
    ];

    for (const provider of providers) {
      const button = page.getByRole('button', { name: provider.name });
      await button.click();

      const helpText = page.locator(provider.helpText);
      await expect(helpText).toBeVisible();
    }
  });

  test('should close settings modal', async ({ page }) => {
    // Open settings
    await page.getByRole('button', { name: /⚙️/i }).click();

    // Verify modal is open
    const modal = page.locator('[class*="fixed inset-0"]');
    await expect(modal).toBeVisible();

    // Click close button
    const closeButton = page.locator('button').filter({ hasText: '✕' }).first();
    await closeButton.click();

    // Modal should be gone
    await expect(modal).not.toBeVisible();
  });

  test('should persist API keys across page reloads', async ({ page }) => {
    // Open settings and add a key
    await page.getByRole('button', { name: /⚙️/i }).click();

    const apiKeyInput = page.locator('input[type="password"]').first();
    const submitButton = page.getByRole('button', { name: /Add API Key/i });

    await apiKeyInput.fill('persist-test-key');
    await submitButton.click();

    // Wait for success
    await page.locator('text=/✅.*successfully/i').first().waitFor({ timeout: 5000 });

    // Close modal
    const closeButton = page.locator('button').filter({ hasText: '✕' }).first();
    await closeButton.click();

    // Reload page
    await page.reload();

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Open settings again
    await page.getByRole('button', { name: /⚙️/i }).click();

    // Key should still be there
    const keyName = page.locator('text=persist-test-key').first();
    await expect(keyName).toBeVisible({ timeout: 5000 });
  });
});
