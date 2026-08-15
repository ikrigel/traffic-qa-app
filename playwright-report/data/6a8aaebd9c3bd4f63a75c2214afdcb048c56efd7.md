# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: user-api-keys.spec.ts >> User API Keys Management >> should delete an API key
- Location: tests\e2e\user-api-keys.spec.ts:158:7

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
  143 |     await page.waitForTimeout(1000);
  144 | 
  145 |     // Click "Set Default" on first key (should now exist)
  146 |     const setDefaultButtons = page.getByRole('button', { name: /Set Default/i });
  147 |     const firstSetDefaultButton = setDefaultButtons.first();
  148 | 
  149 |     if (await firstSetDefaultButton.isVisible()) {
  150 |       await firstSetDefaultButton.click();
  151 | 
  152 |       // Verify success message
  153 |       const successMessage = page.locator('text=/✅.*Default key updated/i');
  154 |       await expect(successMessage).toBeVisible({ timeout: 5000 });
  155 |     }
  156 |   });
  157 | 
  158 |   test('should delete an API key', async ({ page }) => {
  159 |     // Open settings
> 160 |     await page.getByRole('button', { name: /⚙️/i }).click();
      |                                                     ^ Error: locator.click: Test timeout of 30000ms exceeded.
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
  257 |     await page.getByRole('button', { name: /⚙️/i }).click();
  258 | 
  259 |     // Verify modal is open
  260 |     const modal = page.locator('[class*="fixed inset-0"]');
```