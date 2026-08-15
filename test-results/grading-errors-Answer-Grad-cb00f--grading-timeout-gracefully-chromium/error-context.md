# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: grading-errors.spec.ts >> Answer Grading Error Handling >> should handle grading timeout gracefully
- Location: tests\e2e\grading-errors.spec.ts:20:7

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
  3   | test.describe('Answer Grading Error Handling', () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     await page.goto('/');
  6   |     await page.context().addCookies([
  7   |       {
  8   |         name: 'auth_token',
  9   |         value: 'test_token_for_e2e_testing',
  10  |         domain: 'localhost',
  11  |         path: '/',
  12  |         httpOnly: true,
  13  |         secure: false,
  14  |         sameSite: 'Lax',
  15  |       },
  16  |     ]);
  17  |     await page.reload();
  18  |   });
  19  | 
  20  |   test('should handle grading timeout gracefully', async ({ page }) => {
> 21  |     await page.waitForSelector('[data-testid="question-card"]', { timeout: 5000 });
      |                ^ TimeoutError: page.waitForSelector: Timeout 5000ms exceeded.
  22  | 
  23  |     const testButton = page.locator('[data-testid="test-button"]').first();
  24  |     await testButton.click();
  25  | 
  26  |     const textarea = page.locator('[data-testid="answer-textarea"]');
  27  |     await textarea.fill('Test answer that might timeout');
  28  | 
  29  |     const submitButton = page.locator('button:has-text("Submit Answer")');
  30  | 
  31  |     // Intercept the API response with a delay to simulate timeout
  32  |     const responsePromise = page.waitForResponse(
  33  |       response => response.url().includes('/api/test/evaluate'),
  34  |       { timeout: 40000 } // Longer timeout to catch the 25s timeout
  35  |     );
  36  | 
  37  |     await submitButton.click();
  38  | 
  39  |     try {
  40  |       const response = await responsePromise;
  41  | 
  42  |       if (response.status() === 500) {
  43  |         // Verify error message is shown
  44  |         const errorElements = page.locator('text=/error|failed|timeout/i');
  45  |         const isErrorVisible = await errorElements.isVisible().catch(() => false);
  46  | 
  47  |         if (isErrorVisible) {
  48  |           await expect(errorElements.first()).toContainText(/error|failed/i);
  49  |         }
  50  |       }
  51  |     } catch (error) {
  52  |       // Timeout is acceptable in test environment
  53  |       console.log('Response timeout (expected in test)', error);
  54  |     }
  55  |   });
  56  | 
  57  |   test('should show error when grading API fails', async ({ page }) => {
  58  |     await page.waitForSelector('[data-testid="question-card"]', { timeout: 5000 });
  59  | 
  60  |     const testButton = page.locator('[data-testid="test-button"]').first();
  61  |     await testButton.click();
  62  | 
  63  |     const textarea = page.locator('[data-testid="answer-textarea"]');
  64  |     await textarea.fill('Test answer for API failure test');
  65  | 
  66  |     // Intercept and fail the request
  67  |     await page.route('**/api/test/evaluate', route => {
  68  |       route.abort('failed');
  69  |     });
  70  | 
  71  |     const submitButton = page.locator('button:has-text("Submit Answer")');
  72  |     await submitButton.click();
  73  | 
  74  |     // Should show error alert or message
  75  |     await page.waitForTimeout(1000);
  76  | 
  77  |     const errorElements = page.locator('text=/error|failed/i');
  78  |     const alertDialog = page.locator('[role="alert"]');
  79  | 
  80  |     const hasError =
  81  |       await errorElements.isVisible().catch(() => false) ||
  82  |       await alertDialog.isVisible().catch(() => false);
  83  | 
  84  |     expect(hasError).toBe(true);
  85  |   });
  86  | 
  87  |   test('should allow retry after failed grading', async ({ page }) => {
  88  |     await page.waitForSelector('[data-testid="question-card"]', { timeout: 5000 });
  89  | 
  90  |     const testButton = page.locator('[data-testid="test-button"]').first();
  91  |     await testButton.click();
  92  | 
  93  |     const textarea = page.locator('[data-testid="answer-textarea"]');
  94  |     await textarea.fill('First attempt');
  95  | 
  96  |     const submitButton = page.locator('button:has-text("Submit Answer")');
  97  | 
  98  |     // Fail first attempt
  99  |     await page.route('**/api/test/evaluate', route => {
  100 |       route.abort('failed');
  101 |     });
  102 | 
  103 |     await submitButton.click();
  104 |     await page.waitForTimeout(500);
  105 | 
  106 |     // Clear the route to allow success on retry
  107 |     await page.unroute('**/api/test/evaluate');
  108 | 
  109 |     // Try again by clearing and resubmitting
  110 |     await textarea.clear();
  111 |     await textarea.fill('Second attempt after error');
  112 | 
  113 |     // Should be able to submit again
  114 |     const submitButtonAfterError = page.locator('button:has-text("Submit Answer")');
  115 |     await expect(submitButtonAfterError).toBeEnabled();
  116 |   });
  117 | 
  118 |   test('should validate answer is not empty before grading', async ({ page }) => {
  119 |     await page.waitForSelector('[data-testid="question-card"]', { timeout: 5000 });
  120 | 
  121 |     const testButton = page.locator('[data-testid="test-button"]').first();
```