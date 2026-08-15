# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: grading-errors.spec.ts >> Answer Grading Error Handling >> should allow retry after failed grading
- Location: tests\e2e\grading-errors.spec.ts:87:7

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
  21  |     await page.waitForSelector('[data-testid="question-card"]', { timeout: 5000 });
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
> 88  |     await page.waitForSelector('[data-testid="question-card"]', { timeout: 5000 });
      |                ^ TimeoutError: page.waitForSelector: Timeout 5000ms exceeded.
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
  122 |     await testButton.click();
  123 | 
  124 |     const submitButton = page.locator('button:has-text("Submit Answer")');
  125 | 
  126 |     // Button should be disabled when empty
  127 |     await expect(submitButton).toBeDisabled();
  128 | 
  129 |     // Type whitespace only
  130 |     const textarea = page.locator('[data-testid="answer-textarea"]');
  131 |     await textarea.fill('   ');
  132 | 
  133 |     // Button should still be disabled for whitespace
  134 |     await expect(submitButton).toBeDisabled();
  135 | 
  136 |     // Type valid answer
  137 |     await textarea.fill('Valid answer');
  138 |     await expect(submitButton).toBeEnabled();
  139 |   });
  140 | 
  141 |   test('should display metrics when grading succeeds', async ({ page }) => {
  142 |     await page.waitForSelector('[data-testid="question-card"]', { timeout: 5000 });
  143 | 
  144 |     const testButton = page.locator('[data-testid="test-button"]').first();
  145 |     await testButton.click();
  146 | 
  147 |     const textarea = page.locator('[data-testid="answer-textarea"]');
  148 |     await textarea.fill('Speed limit in urban areas is 50 km/h');
  149 | 
  150 |     const submitButton = page.locator('button:has-text("Submit Answer")');
  151 | 
  152 |     try {
  153 |       const responsePromise = page.waitForResponse(
  154 |         response => response.url().includes('/api/test/evaluate') && response.status() === 200,
  155 |         { timeout: 30000 }
  156 |       );
  157 | 
  158 |       await submitButton.click();
  159 |       const response = await responsePromise;
  160 | 
  161 |       // Verify verdict is displayed
  162 |       const verdictResult = page.locator('[data-testid="verdict-result"]');
  163 |       await expect(verdictResult).toBeVisible({ timeout: 5000 });
  164 | 
  165 |       // Metrics should be present in response
  166 |       const responseBody = await response.json();
  167 |       if (responseBody.metrics) {
  168 |         // Check if metrics are displayed
  169 |         const metricsText = page.locator('text=/faithfulness|relevance|coherence/i');
  170 |         const hasMetrics = await metricsText.isVisible().catch(() => false);
  171 | 
  172 |         if (hasMetrics) {
  173 |           await expect(metricsText.first()).toBeVisible();
  174 |         }
  175 |       }
  176 |     } catch (error) {
  177 |       // Grading timeout is acceptable
  178 |       console.log('Grading request timed out (expected)', error);
  179 |     }
  180 |   });
  181 | });
  182 | 
```