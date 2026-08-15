# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: user-api-keys.spec.ts >> User API Keys Management >> should close settings modal
- Location: tests\e2e\user-api-keys.spec.ts:255:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /⚙️/i })

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e4]:
      - generic [ref=e5]:
        - heading "Traffic Laws Q&A" [level=1] [ref=e6]
        - paragraph [ref=e7]: קורס 54 - דרכים 2000 - פותח על ידי יגאל קריגל
      - generic [ref=e8]:
        - button "❓" [ref=e9] [cursor=pointer]
        - button "ℹ️" [ref=e10] [cursor=pointer]
    - generic [ref=e11]:
      - generic [ref=e12]:
        - heading "Traffic Laws Q&A" [level=2] [ref=e13]
        - paragraph [ref=e14]: Study Israeli traffic laws for your driving exam
        - button "📧 Login with Gmail" [ref=e16] [cursor=pointer]
      - paragraph [ref=e18]: Built with Next.js, React, and Supabase
  - alert [ref=e19]
```

# Test source

```ts
  157 | 
  158 |   test('should delete an API key', async ({ page }) => {
  159 |     // Open settings
  160 |     await page.getByRole('button', { name: /⚙️/i }).click();
  161 | 
  162 |     // Add a key first
  163 |     const apiKeyInput = page.locator('input[type="password"]');
  164 |     await apiKeyInput.fill('temp-test-key');
  165 | 
  166 |     const submitButton = page.getByRole('button', { name: /Add API Key/i });
  167 |     await submitButton.click();
  168 | 
  169 |     // Wait for key to appear
  170 |     await page.waitForTimeout(1000);
  171 | 
  172 |     // Click delete button
  173 |     const deleteButton = page.getByRole('button', { name: /Delete/i }).first();
  174 | 
  175 |     // Handle confirmation dialog
  176 |     page.on('dialog', dialog => {
  177 |       dialog.accept();
  178 |     });
  179 | 
  180 |     await deleteButton.click();
  181 | 
  182 |     // Wait for deletion confirmation
  183 |     await page.waitForTimeout(500);
  184 | 
  185 |     // Verify success message
  186 |     const successMessage = page.locator('text=/✅.*deleted/i');
  187 |     await expect(successMessage).toBeVisible({ timeout: 5000 });
  188 |   });
  189 | 
  190 |   test('should handle duplicate API key submission', async ({ page }) => {
  191 |     // Open settings
  192 |     await page.getByRole('button', { name: /⚙️/i }).click();
  193 | 
  194 |     const apiKeyInput = page.locator('input[type="password"]');
  195 |     const submitButton = page.getByRole('button', { name: /Add API Key/i });
  196 | 
  197 |     // Add first key
  198 |     await apiKeyInput.fill('duplicate-test-key');
  199 |     await submitButton.click();
  200 | 
  201 |     // Wait for success
  202 |     await page.locator('text=/✅.*successfully/i').waitFor({ timeout: 5000 });
  203 | 
  204 |     // Try to add same key again
  205 |     await apiKeyInput.fill('duplicate-test-key');
  206 |     await submitButton.click();
  207 | 
  208 |     // Should show error
  209 |     const errorMessage = page.locator('text=/❌.*already in use/i');
  210 |     await expect(errorMessage).toBeVisible({ timeout: 5000 });
  211 |   });
  212 | 
  213 |   test('should display provider in key list', async ({ page }) => {
  214 |     // Open settings
  215 |     await page.getByRole('button', { name: /⚙️/i }).click();
  216 | 
  217 |     // Add a key
  218 |     const apiKeyInput = page.locator('input[type="password"]');
  219 |     const displayNameInput = page.locator('input[placeholder*="e.g., My"]');
  220 |     const submitButton = page.getByRole('button', { name: /Add API Key/i });
  221 | 
  222 |     await displayNameInput.fill('Test Provider Key');
  223 |     await apiKeyInput.fill('provider-test-key');
  224 |     await submitButton.click();
  225 | 
  226 |     // Wait for key to appear
  227 |     await page.waitForTimeout(1000);
  228 | 
  229 |     // Check that provider is displayed
  230 |     const providerText = page.locator('text=Provider: groq');
  231 |     await expect(providerText).toBeVisible({ timeout: 5000 });
  232 |   });
  233 | 
  234 |   test('should show help text for each provider', async ({ page }) => {
  235 |     // Open settings
  236 |     await page.getByRole('button', { name: /⚙️/i }).click();
  237 | 
  238 |     const providers = [
  239 |       { name: /⚡ Groq/, helpText: /console.groq.com|groq/ },
  240 |       { name: /🔮 Google Gemini/, helpText: /aistudio.google.com|Google AI Studio/ },
  241 |       { name: /🏠 Ollama/, helpText: /ollama.ai|Ollama/ },
  242 |       { name: /🤖 OpenAI/, helpText: /platform.openai.com|OpenAI Platform/ },
  243 |       { name: /🤗 HuggingFace/, helpText: /huggingface.co|HuggingFace/ },
  244 |     ];
  245 | 
  246 |     for (const provider of providers) {
  247 |       const button = page.getByRole('button', { name: provider.name });
  248 |       await button.click();
  249 | 
  250 |       const helpText = page.locator(provider.helpText);
  251 |       await expect(helpText).toBeVisible();
  252 |     }
  253 |   });
  254 | 
  255 |   test('should close settings modal', async ({ page }) => {
  256 |     // Open settings
> 257 |     await page.getByRole('button', { name: /⚙️/i }).click();
      |                                                     ^ Error: locator.click: Test timeout of 30000ms exceeded.
  258 | 
  259 |     // Verify modal is open
  260 |     const modal = page.locator('[class*="fixed inset-0"]');
  261 |     await expect(modal).toBeVisible();
  262 | 
  263 |     // Click close button
  264 |     const closeButton = page.locator('button').filter({ hasText: '✕' }).first();
  265 |     await closeButton.click();
  266 | 
  267 |     // Modal should be gone
  268 |     await expect(modal).not.toBeVisible();
  269 |   });
  270 | 
  271 |   test('should persist API keys across page reloads', async ({ page }) => {
  272 |     // Open settings and add a key
  273 |     await page.getByRole('button', { name: /⚙️/i }).click();
  274 | 
  275 |     const apiKeyInput = page.locator('input[type="password"]');
  276 |     const submitButton = page.getByRole('button', { name: /Add API Key/i });
  277 | 
  278 |     await apiKeyInput.fill('persist-test-key');
  279 |     await submitButton.click();
  280 | 
  281 |     // Wait for success
  282 |     await page.locator('text=/✅.*successfully/i').waitFor({ timeout: 5000 });
  283 | 
  284 |     // Close modal
  285 |     const closeButton = page.locator('button').filter({ hasText: '✕' }).first();
  286 |     await closeButton.click();
  287 | 
  288 |     // Reload page
  289 |     await page.reload();
  290 | 
  291 |     // Wait for page to load
  292 |     await page.waitForTimeout(2000);
  293 | 
  294 |     // Open settings again
  295 |     await page.getByRole('button', { name: /⚙️/i }).click();
  296 | 
  297 |     // Key should still be there
  298 |     const keyName = page.locator('text=persist-test-key').first();
  299 |     await expect(keyName).toBeVisible({ timeout: 5000 });
  300 |   });
  301 | });
  302 | 
```