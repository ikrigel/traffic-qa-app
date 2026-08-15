# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: test-answer-input.spec.ts >> Test Answer Input >> should allow typing an answer
- Location: tests\e2e\test-answer-input.spec.ts:35:7

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
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Test Answer Input', () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     await page.goto('/');
  6   |     // Set test session
  7   |     await page.context().addCookies([
  8   |       {
  9   |         name: 'auth_token',
  10  |         value: 'test_token_for_e2e_testing',
  11  |         domain: 'localhost',
  12  |         path: '/',
  13  |         httpOnly: true,
  14  |         secure: false,
  15  |         sameSite: 'Lax',
  16  |       },
  17  |     ]);
  18  |     await page.reload();
  19  |   });
  20  | 
  21  |   test('should display test answer input when question is visible', async ({ page }) => {
  22  |     // Wait for questions to load
  23  |     await page.waitForSelector('[data-testid="question-card"]', { timeout: 5000 });
  24  | 
  25  |     // Find first question and click test button
  26  |     const testButton = page.locator('[data-testid="test-button"]').first();
  27  |     await expect(testButton).toBeVisible();
  28  |     await testButton.click();
  29  | 
  30  |     // Verify test input appears
  31  |     const testInput = page.locator('[placeholder="Type your answer here..."]');
  32  |     await expect(testInput).toBeVisible();
  33  |   });
  34  | 
  35  |   test('should allow typing an answer', async ({ page }) => {
> 36  |     await page.waitForSelector('[data-testid="question-card"]', { timeout: 5000 });
      |                ^ TimeoutError: page.waitForSelector: Timeout 5000ms exceeded.
  37  | 
  38  |     const testButton = page.locator('[data-testid="test-button"]').first();
  39  |     await testButton.click();
  40  | 
  41  |     const textarea = page.locator('[placeholder="Type your answer here..."]');
  42  |     await textarea.fill('Test answer for the question');
  43  | 
  44  |     await expect(textarea).toHaveValue('Test answer for the question');
  45  |   });
  46  | 
  47  |   test('should disable submit button when answer is empty', async ({ page }) => {
  48  |     await page.waitForSelector('[data-testid="question-card"]', { timeout: 5000 });
  49  | 
  50  |     const testButton = page.locator('[data-testid="test-button"]').first();
  51  |     await testButton.click();
  52  | 
  53  |     const submitButton = page.locator('button:has-text("Submit Answer")');
  54  |     await expect(submitButton).toBeDisabled();
  55  | 
  56  |     // Type something and verify button is enabled
  57  |     const textarea = page.locator('[placeholder="Type your answer here..."]');
  58  |     await textarea.fill('Valid answer');
  59  |     await expect(submitButton).toBeEnabled();
  60  |   });
  61  | 
  62  |   test('should show voice button on supported browsers', async ({ page, browserName }) => {
  63  |     await page.waitForSelector('[data-testid="question-card"]', { timeout: 5000 });
  64  | 
  65  |     const testButton = page.locator('[data-testid="test-button"]').first();
  66  |     await testButton.click();
  67  | 
  68  |     const voiceButton = page.locator('button:has-text("Voice")');
  69  | 
  70  |     // Voice input is supported in Chrome, Edge, and Safari (14+)
  71  |     // Not supported in Firefox reliably
  72  |     if (browserName !== 'firefox') {
  73  |       await expect(voiceButton).toBeVisible();
  74  |     }
  75  |   });
  76  | 
  77  |   test('should close test input when close button is clicked', async ({ page }) => {
  78  |     await page.waitForSelector('[data-testid="question-card"]', { timeout: 5000 });
  79  | 
  80  |     const testButton = page.locator('[data-testid="test-button"]').first();
  81  |     await testButton.click();
  82  | 
  83  |     const testInput = page.locator('[placeholder="Type your answer here..."]');
  84  |     await expect(testInput).toBeVisible();
  85  | 
  86  |     const closeButton = page.locator('button:has-text("✕")').last();
  87  |     await closeButton.click();
  88  | 
  89  |     await expect(testInput).not.toBeVisible();
  90  |   });
  91  | 
  92  |   test('should submit typed answer and show result', async ({ page }) => {
  93  |     await page.waitForSelector('[data-testid="question-card"]', { timeout: 5000 });
  94  | 
  95  |     const testButton = page.locator('[data-testid="test-button"]').first();
  96  |     await testButton.click();
  97  | 
  98  |     const textarea = page.locator('[placeholder="Type your answer here..."]');
  99  |     await textarea.fill('Speed limit is 50 km/h in urban areas');
  100 | 
  101 |     // Submit answer
  102 |     const submitButton = page.locator('button:has-text("Submit Answer")');
  103 | 
  104 |     // Wait for API call and response
  105 |     const responsePromise = page.waitForResponse(
  106 |       response => response.url().includes('/api/test/evaluate') && response.status() === 200,
  107 |       { timeout: 30000 }
  108 |     );
  109 | 
  110 |     await submitButton.click();
  111 | 
  112 |     try {
  113 |       await responsePromise;
  114 | 
  115 |       // Wait for result to appear
  116 |       await page.waitForSelector('[data-testid="verdict-result"]', { timeout: 5000 });
  117 | 
  118 |       const result = page.locator('[data-testid="verdict-result"]');
  119 |       await expect(result).toBeVisible();
  120 | 
  121 |       // Verdict should be one of: correct, partial, incorrect
  122 |       const verdict = page.locator('[data-testid="verdict-text"]');
  123 |       await expect(verdict).toContainText(/correct|partial|incorrect/i);
  124 |     } catch (error) {
  125 |       // If grading fails (Vercel issue), verify error is shown
  126 |       const errorMsg = page.locator('text=/error|failed/i');
  127 |       const isErrorVisible = await errorMsg.isVisible().catch(() => false);
  128 |       if (!isErrorVisible) {
  129 |         throw error;
  130 |       }
  131 |     }
  132 |   });
  133 | 
  134 |   test('should show try again button after result', async ({ page }) => {
  135 |     await page.waitForSelector('[data-testid="question-card"]', { timeout: 5000 });
  136 | 
```