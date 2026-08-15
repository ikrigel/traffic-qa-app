# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tutor.spec.ts >> Driving Tutor RAG System - Acceptance Tests >> should display sources with proper metadata when available
- Location: tests\e2e\tutor.spec.ts:180:7

# Error details

```
TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('text=מקורות:') to be visible

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
  131 | 
  132 |     // Send message
  133 |     await page.fill('input[placeholder="שאלו שאלה..."]', 'תשאלה');
  134 |     await page.click('button:has-text("שלח")');
  135 | 
  136 |     // Wait for error display
  137 |     await page.waitForTimeout(2000);
  138 | 
  139 |     // Verify error message appears
  140 |     const errorElement = await page.locator('[class*="text-red"]');
  141 |     expect(await errorElement.count()).toBeGreaterThan(0);
  142 |   });
  143 | 
  144 |   test('should handle concurrent message sending gracefully', async ({ page }) => {
  145 |     // Fill input
  146 |     await page.fill('input[placeholder="שאלו שאלה..."]', 'שאלה ראשונה');
  147 | 
  148 |     // Try to send multiple times quickly
  149 |     const sendButton = page.locator('button:has-text("שלח")');
  150 |     await sendButton.click();
  151 |     await sendButton.click(); // Second click while loading
  152 |     await sendButton.click(); // Third click while loading
  153 | 
  154 |     // Wait for response
  155 |     await page.waitForTimeout(5000);
  156 | 
  157 |     // Should only process one message (button is disabled during send)
  158 |     await expect(sendButton).toBeDisabled();
  159 |   });
  160 | 
  161 |   test('should preserve RTL text layout in responses', async ({ page }) => {
  162 |     // Send message
  163 |     await page.fill('input[placeholder="שאלו שאלה..."]', 'שלום, תן לי תשובה בעברית');
  164 |     await page.click('button:has-text("שלח")');
  165 | 
  166 |     // Wait for response
  167 |     await page.waitForTimeout(3000);
  168 | 
  169 |     // Verify page RTL direction is preserved
  170 |     const body = page.locator('body');
  171 |     await expect(body).toHaveAttribute('dir', 'rtl');
  172 | 
  173 |     // Verify response contains Hebrew text
  174 |     const response = await page.locator('[class*="assistant"]').last();
  175 |     const responseText = await response.textContent();
  176 |     const hasHebrewChars = /[֐-׿]/.test(responseText || '');
  177 |     expect(hasHebrewChars).toBeTruthy();
  178 |   });
  179 | 
  180 |   test('should display sources with proper metadata when available', async ({ page }) => {
  181 |     // Send a question that should have sources
  182 |     await page.fill('input[placeholder="שאלו שאלה..."]', 'מה גבולות המהירות בישראל?');
  183 |     await page.click('button:has-text("שלח")');
  184 | 
  185 |     // Wait for response with sources
> 186 |     await page.waitForSelector('text=מקורות:', { timeout: 10000 });
      |                ^ TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
  187 | 
  188 |     // Verify source format
  189 |     const sourceSection = await page.locator('text=📚 מקורות:').isVisible();
  190 |     expect(sourceSection).toBeTruthy();
  191 | 
  192 |     // Verify source items are listed
  193 |     const sourceItems = await page.locator('li:has-text("S")');
  194 |     expect(await sourceItems.count()).toBeGreaterThan(0);
  195 |   });
  196 | });
  197 | 
```