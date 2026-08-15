# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: voice-input.spec.ts >> Voice Input Feature >> should clear textarea when submitting via voice
- Location: tests\e2e\voice-input.spec.ts:116:7

# Error details

```
TimeoutError: page.waitForSelector: Timeout 5000ms exceeded.
Call log:
  - waiting for locator('[data-testid="question-card"]') to be visible

```

# Page snapshot

```yaml
- generic [active] [ref=f1e1]:
  - main [ref=f1e2]:
    - generic [ref=f1e4]:
      - generic [ref=f1e5]:
        - heading "Traffic Laws Q&A" [level=1] [ref=f1e6]
        - paragraph [ref=f1e7]: קורס 54 - דרכים 2000 - פותח על ידי יגאל קריגל
      - generic [ref=f1e8]:
        - button "❓" [ref=f1e9] [cursor=pointer]
        - button "ℹ️" [ref=f1e10] [cursor=pointer]
    - generic [ref=f1e11]:
      - generic [ref=f1e12]:
        - heading "Traffic Laws Q&A" [level=2] [ref=f1e13]
        - paragraph [ref=f1e14]: Study Israeli traffic laws for your driving exam
        - button "📧 Login with Gmail" [ref=f1e16] [cursor=pointer]
      - paragraph [ref=f1e18]: Built with Next.js, React, and Supabase
  - alert [ref=f1e19]
```

# Test source

```ts
  21  |     if (browserName === 'firefox') {
  22  |       test.skip();
  23  |     }
  24  | 
  25  |     await page.waitForSelector('[data-testid="question-card"]', { timeout: 5000 });
  26  | 
  27  |     const testButton = page.locator('[data-testid="test-button"]').first();
  28  |     await testButton.click();
  29  | 
  30  |     // Check for voice button visibility
  31  |     const voiceButton = page.locator('button:has-text("Voice")');
  32  | 
  33  |     if (browserName === 'chromium' || browserName === 'webkit') {
  34  |       // Chrome and Safari support Web Speech API
  35  |       await expect(voiceButton).toBeVisible({ timeout: 3000 });
  36  |     }
  37  |   });
  38  | 
  39  |   test('should hide voice button on unsupported browsers', async ({ page, browserName }) => {
  40  |     if (browserName === 'chromium' || browserName === 'webkit') {
  41  |       test.skip();
  42  |     }
  43  | 
  44  |     await page.waitForSelector('[data-testid="question-card"]', { timeout: 5000 });
  45  | 
  46  |     const testButton = page.locator('[data-testid="test-button"]').first();
  47  |     await testButton.click();
  48  | 
  49  |     const voiceButton = page.locator('button:has-text("Voice")');
  50  | 
  51  |     // Button should not be visible if browser doesn't support Speech API
  52  |     const isVisible = await voiceButton.isVisible().catch(() => false);
  53  |     expect(isVisible).toBeFalsy();
  54  |   });
  55  | 
  56  |   test('should show error on iOS/Safari without Web Speech API', async ({ page, browserName }) => {
  57  |     if (browserName !== 'webkit') {
  58  |       test.skip();
  59  |     }
  60  | 
  61  |     await page.waitForSelector('[data-testid="question-card"]', { timeout: 5000 });
  62  | 
  63  |     const testButton = page.locator('[data-testid="test-button"]').first();
  64  |     await testButton.click();
  65  | 
  66  |     const voiceButton = page.locator('button:has-text("Voice")');
  67  |     const isVisible = await voiceButton.isVisible().catch(() => false);
  68  | 
  69  |     // On older iOS Safari, voice button may not be visible
  70  |     if (!isVisible) {
  71  |       // User can still type as fallback
  72  |       const textarea = page.locator('[data-testid="answer-textarea"]');
  73  |       await expect(textarea).toBeVisible();
  74  |     }
  75  |   });
  76  | 
  77  |   test('should display error message when voice input fails', async ({ page, browserName }) => {
  78  |     if (browserName === 'firefox') {
  79  |       test.skip();
  80  |     }
  81  | 
  82  |     await page.waitForSelector('[data-testid="question-card"]', { timeout: 5000 });
  83  | 
  84  |     const testButton = page.locator('[data-testid="test-button"]').first();
  85  |     await testButton.click();
  86  | 
  87  |     const voiceButton = page.locator('button:has-text("Voice")');
  88  | 
  89  |     if (await voiceButton.isVisible().catch(() => false)) {
  90  |       // Click voice button to start listening
  91  |       await voiceButton.click();
  92  | 
  93  |       // Wait a bit for speech recognition to initialize
  94  |       await page.waitForTimeout(500);
  95  | 
  96  |       // Voice button should still be functional
  97  |       await expect(voiceButton).toBeVisible();
  98  |     }
  99  |   });
  100 | 
  101 |   test('should allow fallback to typing when voice is not available', async ({ page }) => {
  102 |     await page.waitForSelector('[data-testid="question-card"]', { timeout: 5000 });
  103 | 
  104 |     const testButton = page.locator('[data-testid="test-button"]').first();
  105 |     await testButton.click();
  106 | 
  107 |     // Textarea should always be available as fallback
  108 |     const textarea = page.locator('[data-testid="answer-textarea"]');
  109 |     await expect(textarea).toBeVisible();
  110 | 
  111 |     // Should be able to type
  112 |     await textarea.fill('Fallback answer without voice');
  113 |     await expect(textarea).toHaveValue('Fallback answer without voice');
  114 |   });
  115 | 
  116 |   test('should clear textarea when submitting via voice', async ({ page, browserName }) => {
  117 |     if (browserName === 'firefox') {
  118 |       test.skip();
  119 |     }
  120 | 
> 121 |     await page.waitForSelector('[data-testid="question-card"]', { timeout: 5000 });
      |                ^ TimeoutError: page.waitForSelector: Timeout 5000ms exceeded.
  122 | 
  123 |     const testButton = page.locator('[data-testid="test-button"]').first();
  124 |     await testButton.click();
  125 | 
  126 |     const textarea = page.locator('[data-testid="answer-textarea"]');
  127 | 
  128 |     // Type first (simulate voice input setting the textarea)
  129 |     await textarea.fill('Voice input simulation');
  130 | 
  131 |     // Submit
  132 |     const submitButton = page.locator('button:has-text("Submit Answer")');
  133 |     await expect(submitButton).toBeEnabled();
  134 |     await submitButton.click();
  135 | 
  136 |     // After submit, should try again
  137 |     try {
  138 |       await page.waitForSelector('button:has-text("Try Again")', { timeout: 3000 });
  139 |     } catch {
  140 |       // Acceptable if grading fails in test environment
  141 |     }
  142 |   });
  143 | });
  144 | 
```