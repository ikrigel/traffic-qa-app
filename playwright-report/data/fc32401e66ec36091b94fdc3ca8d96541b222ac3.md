# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tutor.spec.ts >> Driving Tutor RAG System - Acceptance Tests >> should handle overtaking question with proper source citation
- Location: tests\e2e\tutor.spec.ts:22:7

# Error details

```
TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('text=מקור') to be visible

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - heading "🚗 מדריך דיני תעבורה" [level=2] [ref=e5]
      - button "🗑️ נקה" [ref=e6] [cursor=pointer]
    - generic [ref=e7]:
      - button "📚 מדריך" [ref=e8] [cursor=pointer]
      - button "🎯 חידון" [ref=e9] [cursor=pointer]
      - button "✍️ תשובת בחינה" [ref=e10] [cursor=pointer]
      - button "📋 סיכום" [ref=e11] [cursor=pointer]
    - generic [ref=e13]:
      - paragraph [ref=e14]: ברוכים הבאים למדריך דיני התעבורה!
      - paragraph [ref=e15]: שאלו שאלה או בקשו הסברים על דיני התעבורה
    - generic [ref=e16]: Not authenticated
    - generic [ref=e17]:
      - textbox "שאלו שאלה..." [ref=e18]
      - button "שלח" [disabled] [ref=e19]
  - alert [ref=e20]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Driving Tutor RAG System - Acceptance Tests', () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     // Navigate to tutor page
  6   |     await page.goto('/tutor');
  7   |     // Wait for page to load
  8   |     await page.waitForLoadState('networkidle');
  9   |   });
  10  | 
  11  |   test('should display tutor interface with mode selector', async ({ page }) => {
  12  |     // Check main heading
  13  |     await expect(page.locator('text=מדריך דיני תעבורה')).toBeVisible();
  14  | 
  15  |     // Check mode buttons
  16  |     await expect(page.locator('button:has-text("מדריך")')).toBeVisible();
  17  |     await expect(page.locator('button:has-text("חידון")')).toBeVisible();
  18  |     await expect(page.locator('button:has-text("תשובת בחינה")')).toBeVisible();
  19  |     await expect(page.locator('button:has-text("סיכום")')).toBeVisible();
  20  |   });
  21  | 
  22  |   test('should handle overtaking question with proper source citation', async ({ page }) => {
  23  |     // Type a question about overtaking (עקיפה)
  24  |     await page.fill('input[placeholder="שאלו שאלה..."]', 'מה הם כללי העקיפה?');
  25  | 
  26  |     // Send message
  27  |     await page.click('button:has-text("שלח")');
  28  | 
  29  |     // Wait for response
> 30  |     await page.waitForSelector('text=מקור', { timeout: 10000 });
      |                ^ TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
  31  | 
  32  |     // Verify response contains source citation
  33  |     const sourceElement = await page.locator('text=📚 מקורות:');
  34  |     await expect(sourceElement).toBeVisible();
  35  | 
  36  |     // Verify citation format
  37  |     const citations = await page.locator('[class*="citation"]');
  38  |     expect(await citations.count()).toBeGreaterThan(0);
  39  |   });
  40  | 
  41  |   test('should handle insufficient evidence gracefully', async ({ page }) => {
  42  |     // Ask a question unlikely to have documentation
  43  |     await page.fill('input[placeholder="שאלו שאלה..."]', 'מה הם סוגי הרכבים הנדירים ביותר?');
  44  | 
  45  |     // Send message
  46  |     await page.click('button:has-text("שלח")');
  47  | 
  48  |     // Wait for response (might contain insufficient evidence message)
  49  |     await page.waitForTimeout(5000);
  50  | 
  51  |     // Check if response indicates insufficient evidence or provides sources
  52  |     const response = await page.locator('[class*="assistant"]').last();
  53  |     const responseText = await response.textContent();
  54  | 
  55  |     // Either has sources OR has the exact insufficient evidence phrase
  56  |     const hasSourcesOrInsufficient =
  57  |       responseText?.includes('מקור') ||
  58  |       responseText?.includes('לא מצאתי לכך מקור מספיק');
  59  | 
  60  |     expect(hasSourcesOrInsufficient).toBeTruthy();
  61  |   });
  62  | 
  63  |   test('should maintain conversation history', async ({ page }) => {
  64  |     // Send first message
  65  |     await page.fill('input[placeholder="שאלו שאלה..."]', 'מה זה דיני תעבורה?');
  66  |     await page.click('button:has-text("שלח")');
  67  | 
  68  |     // Wait for first response
  69  |     await page.waitForTimeout(3000);
  70  | 
  71  |     // Verify first message appears
  72  |     await expect(page.locator('text=מה זה דיני תעבורה')).toBeVisible();
  73  | 
  74  |     // Send follow-up message
  75  |     await page.fill('input[placeholder="שאלו שאלה..."]', 'ספר לי עוד על זה');
  76  |     await page.click('button:has-text("שלח")');
  77  | 
  78  |     // Wait for second response
  79  |     await page.waitForTimeout(3000);
  80  | 
  81  |     // Verify both messages are in history
  82  |     const messages = await page.locator('[class*="user"]');
  83  |     expect(await messages.count()).toBeGreaterThanOrEqual(2);
  84  |   });
  85  | 
  86  |   test('should switch between teaching modes correctly', async ({ page }) => {
  87  |     // Click quiz mode
  88  |     await page.click('button:has-text("חידון")');
  89  | 
  90  |     // Verify quiz mode is selected (button styling)
  91  |     const quizButton = page.locator('button:has-text("חידון")');
  92  |     await expect(quizButton).toHaveClass(/bg-blue-500/);
  93  | 
  94  |     // Send a message in quiz mode
  95  |     await page.fill('input[placeholder="שאלו שאלה..."]', 'חידון על מהירות');
  96  |     await page.click('button:has-text("שלח")');
  97  | 
  98  |     // Wait for response
  99  |     await page.waitForTimeout(3000);
  100 | 
  101 |     // Response should be formatted as a single question (quiz mode behavior)
  102 |     const response = await page.locator('[class*="assistant"]').last();
  103 |     const responseText = await response.textContent();
  104 |     expect(responseText).toBeTruthy();
  105 |   });
  106 | 
  107 |   test('should clear history when clicking clear button', async ({ page }) => {
  108 |     // Send a message
  109 |     await page.fill('input[placeholder="שאלו שאלה..."]', 'שאלה בדיקה');
  110 |     await page.click('button:has-text("שלח")');
  111 | 
  112 |     // Wait for response
  113 |     await page.waitForTimeout(2000);
  114 | 
  115 |     // Verify message appears
  116 |     await expect(page.locator('text=שאלה בדיקה')).toBeVisible();
  117 | 
  118 |     // Click clear button
  119 |     await page.click('button:has-text("🗑️ נקה")');
  120 | 
  121 |     // Verify messages are cleared
  122 |     await expect(page.locator('text=ברוכים הבאים')).toBeVisible();
  123 |     await expect(page.locator('text=שאלה בדיקה')).not.toBeVisible();
  124 |   });
  125 | 
  126 |   test('should display error message on API failure', async ({ page }) => {
  127 |     // Intercept API call and return error
  128 |     await page.route('/api/tutor/chat', route => {
  129 |       route.abort('failed');
  130 |     });
```