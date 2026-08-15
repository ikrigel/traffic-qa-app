# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: chat.spec.ts >> Chat Assistant >> should send message and receive response
- Location: tests\e2e\chat.spec.ts:30:7

# Error details

```
TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('[data-testid="question-list"]') to be visible

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
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Chat Assistant', () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     // Navigate to app
  6   |     await page.goto('http://localhost:3000');
  7   | 
  8   |     // Wait for page to load and auth to complete
> 9   |     await page.waitForSelector('[data-testid="question-list"]', { timeout: 10000 });
      |                ^ TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
  10  |   });
  11  | 
  12  |   test('should open chat assistant', async ({ page }) => {
  13  |     // Look for chat button or icon
  14  |     const chatButton = page.locator('button:has-text("💬")');
  15  |     if (await chatButton.isVisible()) {
  16  |       await chatButton.click();
  17  |     } else {
  18  |       // Try alternative selector for chat floating widget
  19  |       const chatWidget = page.locator('[data-testid="chat-widget"]');
  20  |       if (await chatWidget.isVisible()) {
  21  |         await chatWidget.click();
  22  |       }
  23  |     }
  24  | 
  25  |     // Chat should be visible
  26  |     const chatTitle = page.locator('text=Traffic Laws AI Assistant');
  27  |     await expect(chatTitle).toBeVisible({ timeout: 5000 });
  28  |   });
  29  | 
  30  |   test('should send message and receive response', async ({ page }) => {
  31  |     // Open chat
  32  |     const chatButton = page.locator('button:has-text("💬")');
  33  |     if (await chatButton.isVisible()) {
  34  |       await chatButton.click();
  35  |     }
  36  | 
  37  |     // Wait for chat to be visible
  38  |     await page.waitForSelector('text=Traffic Laws AI Assistant', { timeout: 5000 });
  39  | 
  40  |     // Send a message
  41  |     const input = page.locator('[placeholder*="Ask a question"]');
  42  |     await input.fill('מה הגבלת המהירות בעיר?');
  43  |     
  44  |     const sendButton = page.locator('button:has-text("Send")');
  45  |     await sendButton.click();
  46  | 
  47  |     // Wait for response - should see assistant message
  48  |     await page.waitForSelector('[data-testid="chat-message-assistant"]', { timeout: 15000 });
  49  | 
  50  |     const response = page.locator('[data-testid="chat-message-assistant"]').first();
  51  |     await expect(response).toBeVisible();
  52  |     
  53  |     const responseText = await response.textContent();
  54  |     expect(responseText).toBeTruthy();
  55  |     expect(responseText?.length).toBeGreaterThan(0);
  56  |   });
  57  | 
  58  |   test('should handle generation errors gracefully', async ({ page }) => {
  59  |     // Open chat
  60  |     const chatButton = page.locator('button:has-text("💬")');
  61  |     if (await chatButton.isVisible()) {
  62  |       await chatButton.click();
  63  |     }
  64  | 
  65  |     // Wait for chat to be visible
  66  |     await page.waitForSelector('text=Traffic Laws AI Assistant', { timeout: 5000 });
  67  | 
  68  |     // Send a message
  69  |     const input = page.locator('[placeholder*="Ask a question"]');
  70  |     await input.fill('test');
  71  |     
  72  |     const sendButton = page.locator('button:has-text("Send")');
  73  |     await sendButton.click();
  74  | 
  75  |     // Should eventually show error or response
  76  |     const errorOrResponse = page.locator(
  77  |       'text=/All your API keys failed|I don\'t have enough information|מהו/',
  78  |       { timeout: 15000 }
  79  |     );
  80  |     
  81  |     await expect(errorOrResponse).toBeVisible();
  82  |   });
  83  | 
  84  |   test('should close chat widget', async ({ page }) => {
  85  |     // Open chat
  86  |     const chatButton = page.locator('button:has-text("💬")');
  87  |     if (await chatButton.isVisible()) {
  88  |       await chatButton.click();
  89  |     }
  90  | 
  91  |     // Wait for chat
  92  |     await page.waitForSelector('text=Traffic Laws AI Assistant', { timeout: 5000 });
  93  | 
  94  |     // Click close button (X)
  95  |     const closeButton = page.locator('[data-testid="chat-close"]');
  96  |     if (await closeButton.isVisible()) {
  97  |       await closeButton.click();
  98  |     } else {
  99  |       const xButton = page.locator('button:has-text("✕")').first();
  100 |       await xButton.click();
  101 |     }
  102 | 
  103 |     // Chat should be hidden
  104 |     const chatTitle = page.locator('text=Traffic Laws AI Assistant');
  105 |     await expect(chatTitle).not.toBeVisible({ timeout: 5000 });
  106 |   });
  107 | });
  108 | 
```