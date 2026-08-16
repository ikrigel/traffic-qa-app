# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: rag-embedding-verification.spec.ts >> RAG Document Embedding Verification >> should embed and store document in vector database
- Location: tests\e2e\rag-embedding-verification.spec.ts:18:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=/✅|Successfully/')
Expected: visible
Error: strict mode violation: locator('text=/✅|Successfully/') resolved to 20 elements:
    1) <span class="text-xs px-2 py-1 rounded font-semibold bg-green-100 text-green-700">✅ Embedded</span> aka getByText('✅ Embedded').first()
    2) <span class="text-xs px-2 py-1 rounded font-semibold bg-green-100 text-green-700">✅ Embedded</span> aka getByText('✅ Embedded').nth(1)
    3) <span class="text-xs px-2 py-1 rounded font-semibold bg-green-100 text-green-700">✅ Embedded</span> aka getByText('✅ Embedded').nth(2)
    4) <span class="text-xs px-2 py-1 rounded font-semibold bg-green-100 text-green-700">✅ Embedded</span> aka getByText('✅ Embedded').nth(3)
    5) <span class="text-xs px-2 py-1 rounded font-semibold bg-green-100 text-green-700">✅ Embedded</span> aka getByText('✅ Embedded').nth(4)
    6) <span class="text-xs px-2 py-1 rounded font-semibold bg-green-100 text-green-700">✅ Embedded</span> aka getByText('✅ Embedded').nth(5)
    7) <span class="text-xs px-2 py-1 rounded font-semibold bg-green-100 text-green-700">✅ Embedded</span> aka locator('div:nth-child(9) > .flex.justify-between > .flex > .text-xs.px-2.py-1.rounded.font-semibold')
    8) <span class="text-xs px-2 py-1 rounded font-semibold bg-green-100 text-green-700">✅ Embedded</span> aka locator('div:nth-child(10) > .flex.justify-between > .flex > .text-xs.px-2.py-1.rounded.font-semibold')
    9) <span class="text-xs px-2 py-1 rounded font-semibold bg-green-100 text-green-700">✅ Embedded</span> aka locator('div:nth-child(11) > .flex.justify-between > .flex > .text-xs.px-2.py-1.rounded.font-semibold')
    10) <span class="text-xs px-2 py-1 rounded font-semibold bg-green-100 text-green-700">✅ Embedded</span> aka locator('div:nth-child(12) > .flex.justify-between > .flex > .text-xs.px-2.py-1.rounded.font-semibold')
    ...

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('text=/✅|Successfully/')

```

# Page snapshot

```yaml
- generic [active] [ref=f2e1]:
  - main [ref=f2e2]:
    - generic [ref=f2e4]:
      - heading "Admin Panel" [level=1] [ref=f2e5]
      - link "Back to Home" [ref=f2e6] [cursor=pointer]:
        - /url: /
    - generic [ref=f2e8]:
      - generic [ref=f2e10]:
        - button "👥 Users" [ref=f2e11] [cursor=pointer]
        - button "📄 RAG Documents" [ref=f2e12] [cursor=pointer]
        - button "📋 Debug Logs" [ref=f2e13] [cursor=pointer]
        - button "🤖 Evaluations" [ref=f2e14] [cursor=pointer]
        - button "🖥️ DevKit Console" [ref=f2e15] [cursor=pointer]
      - generic [ref=f2e16]: Loading documents...
  - alert [ref=f2e18]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { loginAsUser } from '../fixtures/auth';
  3   | import fs from 'fs';
  4   | import path from 'path';
  5   | 
  6   | const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  7   | 
  8   | test.describe('RAG Document Embedding Verification', () => {
  9   |   test.beforeEach(async ({ page }) => {
  10  |     // Login as super_admin for admin access
  11  |     await loginAsUser(page, 'super_admin');
  12  | 
  13  |     // Navigate to home page
  14  |     await page.goto(`${APP_URL}/`);
  15  |     await page.waitForLoadState('networkidle');
  16  |   });
  17  | 
  18  |   test('should embed and store document in vector database', async ({ page, context, request }) => {
  19  |     // Check if logged in
  20  |     const adminLink = page.locator('a[href="/admin"]');
  21  |     const isLoggedIn = await adminLink.count() > 0;
  22  | 
  23  |     if (!isLoggedIn) {
  24  |       test.skip();
  25  |       return;
  26  |     }
  27  | 
  28  |     // Navigate to admin panel
  29  |     await page.click('a[href="/admin"]');
  30  |     await page.waitForLoadState('networkidle');
  31  | 
  32  |     // Click on RAG Documents
  33  |     await page.click('text=RAG Documents');
  34  |     await page.waitForLoadState('networkidle');
  35  | 
  36  |     // Click on Paste Text tab
  37  |     await page.click('text=📝 Paste Text');
  38  | 
  39  |     // Fill in test document
  40  |     const testTitle = `Test Embedding Doc ${Date.now()}`;
  41  |     const testContent = `This is a test document with unique content for embedding verification. It contains information about traffic laws and regulations. The document should be successfully embedded in the vector database using Gemini embeddings with 768 dimensions.`;
  42  |     const testSource = 'Test Embedding Verification';
  43  | 
  44  |     await page.fill('input[placeholder*="Traffic Safety"]', testTitle);
  45  |     await page.fill('input[placeholder*="Israeli"]', testSource);
  46  |     await page.fill('textarea', testContent);
  47  | 
  48  |     // Click Upload button
  49  |     const uploadButton = page.locator('button:has-text("📤 Upload Document")');
  50  |     await uploadButton.click();
  51  | 
  52  |     // Wait for success message
  53  |     const successMessage = page.locator('text=/✅|Successfully/');
> 54  |     await expect(successMessage).toBeVisible({ timeout: 10000 });
      |                                  ^ Error: expect(locator).toBeVisible() failed
  55  | 
  56  |     // Wait for document to appear in list
  57  |     await page.waitForTimeout(2000);
  58  | 
  59  |     // Refresh to see the uploaded document
  60  |     await page.reload();
  61  |     await page.waitForLoadState('networkidle');
  62  |     await page.click('text=RAG Documents');
  63  |     await page.waitForLoadState('networkidle');
  64  | 
  65  |     // Verify document appears in uploaded documents list
  66  |     const docTitle = page.locator(`text=${testTitle}`);
  67  |     await expect(docTitle).toBeVisible({ timeout: 5000 });
  68  | 
  69  |     // Look for the embedding status badge
  70  |     const embeddingBadge = page.locator(testTitle).locator('..').locator('text=/✅|⏳/');
  71  |     await expect(embeddingBadge).toBeVisible();
  72  | 
  73  |     // Check if it shows "Embedded" (green badge) or "Pending" (yellow badge)
  74  |     const badgeText = await embeddingBadge.textContent();
  75  |     expect(['✅ Embedded', '⏳ Pending']).toContain(badgeText?.trim());
  76  | 
  77  |     // Verify via API that document has embedding
  78  |     const response = await request.get(`${APP_URL}/api/admin/rag-documents`, {
  79  |       headers: {
  80  |         'Cookie': await getCookieString(context),
  81  |       },
  82  |     });
  83  | 
  84  |     expect(response.ok()).toBeTruthy();
  85  |     const data = await response.json();
  86  |     const uploadedDoc = data.documents?.find((doc: any) => doc.title === testTitle);
  87  | 
  88  |     expect(uploadedDoc).toBeDefined();
  89  |     expect(uploadedDoc.embedding).toBeTruthy(); // embedding field should be truthy if embedded
  90  |   });
  91  | 
  92  |   test('should retrieve embedded document via RAG query', async ({ page, request, context }) => {
  93  |     // Check if logged in
  94  |     const adminLink = page.locator('a[href="/admin"]');
  95  |     const isLoggedIn = await adminLink.count() > 0;
  96  | 
  97  |     if (!isLoggedIn) {
  98  |       test.skip();
  99  |       return;
  100 |     }
  101 | 
  102 |     // First, ensure we have a test document uploaded
  103 |     const testTitle = `RAG Query Test ${Date.now()}`;
  104 |     const testContent = `Speed limits in Israel vary by road type. Urban roads typically have a 50 km/h limit. Highways have 110 km/h limit. Main roads have 90 km/h limit. Exceeding speed limits is a serious traffic violation.`;
  105 | 
  106 |     // Upload document via API
  107 |     const uploadResponse = await request.post(`${APP_URL}/api/admin/rag-documents`, {
  108 |       headers: {
  109 |         'Cookie': await getCookieString(context),
  110 |       },
  111 |       data: {
  112 |         title: testTitle,
  113 |         content: testContent,
  114 |         source: 'Speed Limit Test',
  115 |       },
  116 |     });
  117 | 
  118 |     if (!uploadResponse.ok()) {
  119 |       console.log('Failed to upload test document, skipping RAG retrieval test');
  120 |       test.skip();
  121 |       return;
  122 |     }
  123 | 
  124 |     // Wait for embedding
  125 |     await page.waitForTimeout(3000);
  126 | 
  127 |     // Navigate to home and test RAG retrieval via chat
  128 |     await page.goto(`${APP_URL}/`);
  129 |     await page.waitForLoadState('networkidle');
  130 | 
  131 |     // Look for chat assistant
  132 |     const chatWidget = page.locator('text=/Chat|Assistant/i');
  133 |     const chatExists = await chatWidget.count() > 0;
  134 | 
  135 |     if (!chatExists) {
  136 |       console.log('Chat assistant not found, skipping chat test');
  137 |       test.skip();
  138 |       return;
  139 |     }
  140 | 
  141 |     // Send a query related to speed limits
  142 |     const chatInput = page.locator('input[placeholder*="Ask"]');
  143 |     if (await chatInput.count() > 0) {
  144 |       await chatInput.fill('What are the speed limits in Israel?');
  145 |       await chatInput.press('Enter');
  146 | 
  147 |       // Wait for response
  148 |       await page.waitForTimeout(5000);
  149 | 
  150 |       // Verify response mentions speed limits
  151 |       const response = page.locator('text=/speed|limit|110|50|90/i');
  152 |       const hasResponse = await response.count() > 0;
  153 | 
  154 |       if (hasResponse) {
```