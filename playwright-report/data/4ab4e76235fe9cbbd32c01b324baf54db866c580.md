# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: rag-upload.spec.ts >> RAG Document Upload >> should switch between Paste Text and Upload Files tabs
- Location: tests\e2e\rag-upload.spec.ts:141:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=📝 Paste Text')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=📝 Paste Text')

```

```yaml
- main:
  - heading "Admin Panel" [level=1]
  - link "Back to Home":
    - /url: /
  - button "👥 Users"
  - button "📄 RAG Documents"
  - button "📋 Debug Logs"
  - button "🤖 Evaluations"
  - button "🖥️ DevKit Console"
  - text: Loading documents...
- alert
```

# Test source

```ts
  58  |     // Click Upload button
  59  |     const uploadButton = page.locator('button:has-text("📤 Upload Files")');
  60  |     await uploadButton.click();
  61  | 
  62  |     // Wait for upload to complete
  63  |     await page.waitForTimeout(3000);
  64  | 
  65  |     // Check for success message
  66  |     const successMessage = page.locator('text=/✅|Successfully/');
  67  |     await expect(successMessage).toBeVisible({ timeout: 10000 });
  68  |   });
  69  | 
  70  |   test('should show error for large files', async ({ page }) => {
  71  |     // Check if logged in
  72  |     const adminLink = page.locator('a[href="/admin"]');
  73  |     if (await adminLink.count() === 0) {
  74  |       test.skip();
  75  |       return;
  76  |     }
  77  | 
  78  |     // Navigate to admin panel
  79  |     await page.click('a[href="/admin"]');
  80  |     await page.waitForLoadState('networkidle');
  81  | 
  82  |     // Click on RAG Documents
  83  |     await page.click('text=RAG Documents');
  84  |     await page.waitForLoadState('networkidle');
  85  | 
  86  |     // Click on Upload Files tab
  87  |     await page.click('text=📁 Upload Files');
  88  | 
  89  |     // Create a large test file (51MB, exceeds 50MB limit)
  90  |     const largeFilePath = path.join(__dirname, 'large-file.bin');
  91  |     const largeBuffer = Buffer.alloc(51 * 1024 * 1024);
  92  |     fs.writeFileSync(largeFilePath, largeBuffer);
  93  | 
  94  |     try {
  95  |       // Try to upload large file
  96  |       const fileInput = page.locator('input[type="file"]');
  97  |       await fileInput.setInputFiles(largeFilePath);
  98  | 
  99  |       // Should show file info
  100 |       await expect(page.locator('text=large-file.bin')).toBeVisible();
  101 | 
  102 |       // File size should be displayed
  103 |       const sizeText = page.locator('text=/MB/');
  104 |       await expect(sizeText).toBeVisible();
  105 |     } finally {
  106 |       // Cleanup
  107 |       if (fs.existsSync(largeFilePath)) {
  108 |         fs.unlinkSync(largeFilePath);
  109 |       }
  110 |     }
  111 |   });
  112 | 
  113 |   test('should validate file types (PDF, DOCX, TXT)', async ({ page }) => {
  114 |     // Check if logged in
  115 |     const adminLink = page.locator('a[href="/admin"]');
  116 |     if (await adminLink.count() === 0) {
  117 |       test.skip();
  118 |       return;
  119 |     }
  120 | 
  121 |     // Navigate to admin panel
  122 |     await page.click('a[href="/admin"]');
  123 |     await page.waitForLoadState('networkidle');
  124 | 
  125 |     // Click on RAG Documents
  126 |     await page.click('text=RAG Documents');
  127 |     await page.waitForLoadState('networkidle');
  128 | 
  129 |     // Click on Upload Files tab
  130 |     await page.click('text=📁 Upload Files');
  131 | 
  132 |     // Check file input accepts only PDF, DOCX, TXT
  133 |     const fileInput = page.locator('input[type="file"]');
  134 |     const acceptAttribute = await fileInput.getAttribute('accept');
  135 | 
  136 |     expect(acceptAttribute).toContain('.pdf');
  137 |     expect(acceptAttribute).toContain('.docx');
  138 |     expect(acceptAttribute).toContain('.txt');
  139 |   });
  140 | 
  141 |   test('should switch between Paste Text and Upload Files tabs', async ({ page }) => {
  142 |     // Check if logged in
  143 |     const adminLink = page.locator('a[href="/admin"]');
  144 |     if (await adminLink.count() === 0) {
  145 |       test.skip();
  146 |       return;
  147 |     }
  148 | 
  149 |     // Navigate to admin panel
  150 |     await page.click('a[href="/admin"]');
  151 |     await page.waitForLoadState('networkidle');
  152 | 
  153 |     // Click on RAG Documents
  154 |     await page.click('text=RAG Documents');
  155 |     await page.waitForLoadState('networkidle');
  156 | 
  157 |     // Verify Paste Text tab is active by default
> 158 |     await expect(page.locator('text=📝 Paste Text')).toBeVisible();
      |                                                      ^ Error: expect(locator).toBeVisible() failed
  159 |     await expect(page.locator('text=Title *')).toBeVisible();
  160 | 
  161 |     // Click Upload Files tab
  162 |     await page.click('text=📁 Upload Files');
  163 | 
  164 |     // Verify file input appears
  165 |     const fileInput = page.locator('input[type="file"]');
  166 |     await expect(fileInput).toBeVisible();
  167 | 
  168 |     // Click Paste Text tab
  169 |     await page.click('text=📝 Paste Text');
  170 | 
  171 |     // Verify text inputs appear
  172 |     await expect(page.locator('label:has-text("Title *")')).toBeVisible();
  173 |     await expect(page.locator('textarea')).toBeVisible();
  174 |   });
  175 | 
  176 |   test('should display uploaded documents in the list', async ({ page }) => {
  177 |     // Check if logged in
  178 |     const adminLink = page.locator('a[href="/admin"]');
  179 |     if (await adminLink.count() === 0) {
  180 |       test.skip();
  181 |       return;
  182 |     }
  183 | 
  184 |     // Navigate to admin panel
  185 |     await page.click('a[href="/admin"]');
  186 |     await page.waitForLoadState('networkidle');
  187 | 
  188 |     // Click on RAG Documents
  189 |     await page.click('text=RAG Documents');
  190 |     await page.waitForLoadState('networkidle');
  191 | 
  192 |     // Check if documents list exists
  193 |     const documentsList = page.locator('text=/Uploaded Documents/');
  194 |     const isVisible = await documentsList.isVisible().catch(() => false);
  195 | 
  196 |     if (isVisible) {
  197 |       // List should be present
  198 |       await expect(documentsList).toBeVisible();
  199 |     }
  200 |   });
  201 | 
  202 |   test('API endpoint should require super_admin role', async ({ request }) => {
  203 |     // Try to upload without authentication - should fail
  204 |     const response = await request.post(`${APP_URL}/api/admin/rag-documents/upload`, {
  205 |       data: {
  206 |         documents: [
  207 |           {
  208 |             title: 'Test',
  209 |             content: 'Test content',
  210 |             source: 'Test',
  211 |           },
  212 |         ],
  213 |       },
  214 |     });
  215 | 
  216 |     // Should return 401 (not authenticated) or 403 (forbidden)
  217 |     expect([401, 403]).toContain(response.status());
  218 |   });
  219 | 
  220 |   test('API endpoint should accept multipart/form-data', async ({ request }) => {
  221 |     // This test would require valid authentication
  222 |     // For now, just verify the endpoint exists and responds
  223 |     const response = await request.get(`${APP_URL}/api/admin/rag-documents/upload`);
  224 | 
  225 |     // Should return 200 for GET (returns documentation) or 401 for unauthenticated
  226 |     expect([200, 401, 403]).toContain(response.status());
  227 | 
  228 |     if (response.status() === 200) {
  229 |       const data = await response.json();
  230 |       expect(data).toHaveProperty('endpoint');
  231 |       expect(data.endpoint).toContain('/api/admin/rag-documents/upload');
  232 |     }
  233 |   });
  234 | });
  235 | 
```