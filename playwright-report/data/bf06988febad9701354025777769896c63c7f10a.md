# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: user-api-keys.spec.ts >> User API Keys Management >> should display provider selection buttons
- Location: tests\e2e\user-api-keys.spec.ts:40:7

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
- generic [ref=f1e3]:
  - generic [ref=f1e4]:
    - generic [ref=f1e6]:
      - generic [ref=f1e7]: Loading
      - progressbar [ref=f1e8]
    - main [ref=f1e15]:
      - generic [ref=f1e16]:
        - generic [ref=f1e17]: Sign in with Google
        - 'heading "Access blocked: Authorization Error" [level=1] [ref=f1e23]'
      - generic [ref=f1e31]:
        - generic [ref=f1e32]: The OAuth client was not found.
        - generic [ref=f1e33]:
          - text: If you are a developer of this app, see
          - button "error details" [ref=f1e34] [cursor=pointer]
          - text: .
        - generic [ref=f1e35]: "Error 401: invalid_client"
  - contentinfo [ref=f1e40]:
    - combobox "Change language English (United States)" [ref=f1e44] [cursor=pointer]:
      - generic: English (United States)
    - list [ref=f1e46]:
      - listitem [ref=f1e47]:
        - link "Open Google Account Help Center (external, opens in a new window)" [ref=f1e48] [cursor=pointer]:
          - /url: https://support.google.com/accounts?hl=en-US&p=account_iph
          - text: Help
      - listitem [ref=f1e49]:
        - link "Privacy Policy (external, opens in a new window)" [ref=f1e50] [cursor=pointer]:
          - /url: https://accounts.google.com/TOS?loc=IL&hl=en-US&privacy=true
          - text: Privacy
      - listitem [ref=f1e51]:
        - link "Google Terms of Service (external, opens in a new window)" [ref=f1e52] [cursor=pointer]:
          - /url: https://accounts.google.com/TOS?loc=IL&hl=en-US
          - text: Terms
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('User API Keys Management', () => {
  4   |   test.beforeEach(async ({ page, context }) => {
  5   |     // Set up authentication before each test
  6   |     await page.goto('http://localhost:3000');
  7   | 
  8   |     // Wait for login button and click it
  9   |     const loginButton = page.getByRole('button', { name: /login with gmail/i });
  10  |     if (await loginButton.isVisible()) {
  11  |       await loginButton.click();
  12  | 
  13  |       // Handle Google OAuth flow (in real tests, you'd use test credentials)
  14  |       // For now, we'll wait for redirect and check if authenticated
  15  |       await page.waitForNavigation({ timeout: 5000 }).catch(() => {});
  16  | 
  17  |       // Check if we're back on home page with user info
  18  |       await page.waitForSelector('[class*="Logged in as"]', { timeout: 5000 }).catch(() => {});
  19  |     }
  20  |   });
  21  | 
  22  |   test('should open settings modal and navigate to API Keys tab', async ({ page }) => {
  23  |     // Click settings button
  24  |     const settingsButton = page.getByRole('button', { name: /⚙️/i });
  25  |     await expect(settingsButton).toBeVisible();
  26  |     await settingsButton.click();
  27  | 
  28  |     // Verify settings modal is open
  29  |     const modal = page.locator('[class*="fixed inset-0"]');
  30  |     await expect(modal).toBeVisible();
  31  | 
  32  |     // Check that API Keys tab is visible
  33  |     const apiKeysTab = page.getByRole('button', { name: /🔑 API Keys/i });
  34  |     await expect(apiKeysTab).toBeVisible();
  35  | 
  36  |     // API Keys tab should be active by default
  37  |     await expect(apiKeysTab).toHaveClass(/text-indigo-600/);
  38  |   });
  39  | 
  40  |   test('should display provider selection buttons', async ({ page }) => {
  41  |     // Open settings
> 42  |     await page.getByRole('button', { name: /⚙️/i }).click();
      |                                                     ^ Error: locator.click: Test timeout of 30000ms exceeded.
  43  | 
  44  |     // Check that all provider buttons are visible
  45  |     const providers = ['⚡ Groq', '🔮 Google Gemini', '🏠 Ollama', '🤖 OpenAI', '🤗 HuggingFace'];
  46  | 
  47  |     for (const provider of providers) {
  48  |       const providerButton = page.getByRole('button', { name: new RegExp(provider) });
  49  |       await expect(providerButton).toBeVisible();
  50  |     }
  51  |   });
  52  | 
  53  |   test('should select a provider and show help text', async ({ page }) => {
  54  |     // Open settings
  55  |     await page.getByRole('button', { name: /⚙️/i }).click();
  56  | 
  57  |     // Click Groq provider
  58  |     const groqButton = page.getByRole('button', { name: /⚡ Groq/ });
  59  |     await groqButton.click();
  60  | 
  61  |     // Verify it's selected (has indigo background)
  62  |     await expect(groqButton).toHaveClass(/bg-indigo-600/);
  63  | 
  64  |     // Verify help text mentions Groq console
  65  |     const helpText = page.locator('text=/groq.com/i');
  66  |     await expect(helpText).toBeVisible();
  67  |   });
  68  | 
  69  |   test('should validate empty API key submission', async ({ page }) => {
  70  |     // Open settings
  71  |     await page.getByRole('button', { name: /⚙️/i }).click();
  72  | 
  73  |     // Try to submit without entering a key
  74  |     const submitButton = page.getByRole('button', { name: /Add API Key/i });
  75  |     await expect(submitButton).toBeDisabled();
  76  | 
  77  |     // Error should appear when unfocusing the input
  78  |     const input = page.locator('input[type="password"]');
  79  |     await input.focus();
  80  |     await input.blur();
  81  |   });
  82  | 
  83  |   test('should add a new API key successfully', async ({ page }) => {
  84  |     // Open settings
  85  |     await page.getByRole('button', { name: /⚙️/i }).click();
  86  | 
  87  |     // Select provider (default is Groq)
  88  |     const providerInput = page.getByRole('button', { name: /⚡ Groq/ });
  89  |     await providerInput.click();
  90  | 
  91  |     // Enter display name
  92  |     const displayNameInput = page.locator('input[placeholder*="e.g., My"]');
  93  |     await displayNameInput.fill('My Test Groq Key');
  94  | 
  95  |     // Enter API key
  96  |     const apiKeyInput = page.locator('input[type="password"]');
  97  |     await apiKeyInput.fill('test-api-key-12345');
  98  | 
  99  |     // Submit form
  100 |     const submitButton = page.getByRole('button', { name: /Add API Key/i });
  101 |     await submitButton.click();
  102 | 
  103 |     // Wait for success message
  104 |     const successMessage = page.locator('text=/✅.*successfully/i');
  105 |     await expect(successMessage).toBeVisible({ timeout: 5000 });
  106 | 
  107 |     // Verify the key appears in the list
  108 |     const keyName = page.locator('text=My Test Groq Key');
  109 |     await expect(keyName).toBeVisible({ timeout: 5000 });
  110 |   });
  111 | 
  112 |   test('should display API key in the list', async ({ page }) => {
  113 |     // Open settings
  114 |     await page.getByRole('button', { name: /⚙️/i }).click();
  115 | 
  116 |     // Check if API keys list is visible (either with existing keys or empty state)
  117 |     const listSection = page.locator('text=/🔑 Your API Keys|No API Keys Added/i');
  118 |     await expect(listSection).toBeVisible();
  119 |   });
  120 | 
  121 |   test('should set API key as default', async ({ page }) => {
  122 |     // Open settings
  123 |     await page.getByRole('button', { name: /⚙️/i }).click();
  124 | 
  125 |     // Add first key
  126 |     const apiKeyInput = page.locator('input[type="password"]');
  127 |     await apiKeyInput.fill('first-test-key');
  128 | 
  129 |     const submitButton = page.getByRole('button', { name: /Add API Key/i });
  130 |     await submitButton.click();
  131 | 
  132 |     // Wait for first key to appear
  133 |     await page.waitForTimeout(1000);
  134 | 
  135 |     // Add second key with different provider
  136 |     const geminiButton = page.getByRole('button', { name: /🔮 Google Gemini/ });
  137 |     await geminiButton.click();
  138 | 
  139 |     await apiKeyInput.fill('second-test-key');
  140 |     await submitButton.click();
  141 | 
  142 |     // Wait for second key to appear
```