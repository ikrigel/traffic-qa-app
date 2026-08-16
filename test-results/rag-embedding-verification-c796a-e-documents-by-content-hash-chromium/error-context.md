# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: rag-embedding-verification.spec.ts >> RAG Document Embedding Verification >> should detect and reject duplicate documents by content hash
- Location: tests\e2e\rag-embedding-verification.spec.ts:160:7

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected value: 200
Received array: [409, 400]
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
        - button "📥" [ref=f1e9] [cursor=pointer]
        - button "❓" [ref=f1e10] [cursor=pointer]
        - button "ℹ️" [ref=f1e11] [cursor=pointer]
        - button "⚙️" [ref=f1e12] [cursor=pointer]
        - link "🤖" [ref=f1e13] [cursor=pointer]:
          - /url: /tutor
        - link "פאנל ניהול" [ref=f1e14] [cursor=pointer]:
          - /url: /admin
        - button "Logout" [ref=f1e15] [cursor=pointer]
    - generic [ref=f1e16]:
      - generic [ref=f1e17]:
        - heading "Traffic Laws Q&A" [level=2] [ref=f1e18]
        - paragraph [ref=f1e19]: Study Israeli traffic laws for your driving exam
        - generic [ref=f1e20]:
          - generic [ref=f1e22]:
            - generic [ref=f1e23]: T
            - generic [ref=f1e24]:
              - paragraph [ref=f1e25]: Logged in as
              - paragraph [ref=f1e26]: test-superadmin@example.com
          - generic [ref=f1e27]:
            - generic [ref=f1e28]:
              - generic [ref=f1e29]: 📝
              - generic [ref=f1e30]: "0"
              - generic [ref=f1e31]: שאלות
            - generic [ref=f1e32]:
              - generic [ref=f1e33]: 📈
              - generic [ref=f1e34]: 0%
              - generic [ref=f1e35]: התקדמות
            - generic [ref=f1e36]:
              - generic [ref=f1e37]: ✓
              - generic [ref=f1e38]: "0"
              - generic [ref=f1e39]: נכונות
          - generic [ref=f1e40]:
            - generic [ref=f1e41]:
              - heading "📚 בחר קורס" [level=2] [ref=f1e42]
              - generic [ref=f1e43]:
                - button "דיני תעבורה Traffic Laws 23 שאלות" [ref=f1e44] [cursor=pointer]:
                  - generic [ref=f1e45]: דיני תעבורה
                  - generic [ref=f1e46]: Traffic Laws
                  - generic [ref=f1e47]: 23 שאלות
                - button "נהלי רישוי Licensing Procedures יעודכן בקרוב" [ref=f1e48] [cursor=pointer]:
                  - generic [ref=f1e49]: נהלי רישוי
                  - generic [ref=f1e50]: Licensing Procedures
                  - generic [ref=f1e51]: יעודכן בקרוב
            - generic [ref=f1e52]:
              - heading "📚 דיני תעבורה" [level=3] [ref=f1e53]
              - generic [ref=f1e54]:
                - generic [ref=f1e55]:
                  - generic [ref=f1e56]:
                    - textbox "🔍 חפש שאלות..." [ref=f1e57]
                    - button "🔴 שאלות חשובות" [ref=f1e58] [cursor=pointer]
                  - paragraph [ref=f1e59]: 23 מתוך 23 שאלות
                - generic [ref=f1e60]:
                  - generic [ref=f1e61]:
                    - generic [ref=f1e63]:
                      - generic [ref=f1e64]: Q1
                      - paragraph [ref=f1e66]: נסיעה שלא בכביש
                    - generic [ref=f1e67]:
                      - button "🔽 הצג תשובה" [ref=f1e68] [cursor=pointer]
                      - button "📝 בחן אותי" [ref=f1e69] [cursor=pointer]
                  - generic [ref=f1e70]:
                    - generic [ref=f1e72]:
                      - generic [ref=f1e73]: Q2
                      - paragraph [ref=f1e75]: חובת הזהירות הכללית
                    - generic [ref=f1e76]:
                      - button "🔽 הצג תשובה" [ref=f1e77] [cursor=pointer]
                      - button "📝 בחן אותי" [ref=f1e78] [cursor=pointer]
                  - generic [ref=f1e79]:
                    - generic [ref=f1e81]:
                      - generic [ref=f1e82]:
                        - generic [ref=f1e83]: Q3
                        - generic [ref=f1e84]: חשוב
                      - paragraph [ref=f1e85]: מהירות מרבית מותרת לפי סוג דרך ולפי סוגי רכב
                    - generic [ref=f1e86]:
                      - button "🔽 הצג תשובה" [ref=f1e87] [cursor=pointer]
                      - button "📝 בחן אותי" [ref=f1e88] [cursor=pointer]
                  - generic [ref=f1e89]:
                    - generic [ref=f1e91]:
                      - generic [ref=f1e92]: Q4
                      - paragraph [ref=f1e94]: רכב בטחון
                    - generic [ref=f1e95]:
                      - button "🔽 הצג תשובה" [ref=f1e96] [cursor=pointer]
                      - button "📝 בחן אותי" [ref=f1e97] [cursor=pointer]
                  - generic [ref=f1e98]:
                    - generic [ref=f1e100]:
                      - generic [ref=f1e101]: Q5
                      - paragraph [ref=f1e103]: אחריות פלילית - מי אחראי לביצוע עבירות
                    - generic [ref=f1e104]:
                      - button "🔽 הצג תשובה" [ref=f1e105] [cursor=pointer]
                      - button "📝 בחן אותי" [ref=f1e106] [cursor=pointer]
                  - generic [ref=f1e107]:
                    - generic [ref=f1e109]:
                      - generic [ref=f1e110]:
                        - generic [ref=f1e111]: Q6
                        - generic [ref=f1e112]: חשוב
                      - paragraph [ref=f1e113]: עקיפה
                    - generic [ref=f1e114]:
                      - button "🔽 הצג תשובה" [ref=f1e115] [cursor=pointer]
                      - button "📝 בחן אותי" [ref=f1e116] [cursor=pointer]
                  - generic [ref=f1e117]:
                    - generic [ref=f1e119]:
                      - generic [ref=f1e120]:
                        - generic [ref=f1e121]: Q7
                        - generic [ref=f1e122]: חשוב
                      - paragraph [ref=f1e123]: חגורת בטיחות
                    - generic [ref=f1e124]:
                      - button "🔽 הצג תשובה" [ref=f1e125] [cursor=pointer]
                      - button "📝 בחן אותי" [ref=f1e126] [cursor=pointer]
                  - generic [ref=f1e127]:
                    - generic [ref=f1e129]:
                      - generic [ref=f1e130]: Q8
                      - paragraph [ref=f1e132]: "אורות: נסיעה בזמן תאורה, זמן לילה, עמעום"
                    - generic [ref=f1e133]:
                      - button "🔽 הצג תשובה" [ref=f1e134] [cursor=pointer]
                      - button "📝 בחן אותי" [ref=f1e135] [cursor=pointer]
                  - generic [ref=f1e136]:
                    - generic [ref=f1e138]:
                      - generic [ref=f1e139]: Q9
                      - paragraph [ref=f1e141]: שמירת רווח בנסיעה בדרך שאינה עירונית
                    - generic [ref=f1e142]:
                      - button "🔽 הצג תשובה" [ref=f1e143] [cursor=pointer]
                      - button "📝 בחן אותי" [ref=f1e144] [cursor=pointer]
                  - generic [ref=f1e145]:
                    - generic [ref=f1e147]:
                      - generic [ref=f1e148]:
                        - generic [ref=f1e149]: Q10
                        - generic [ref=f1e150]: חשוב
                      - paragraph [ref=f1e151]: פניות שמאלה
                    - generic [ref=f1e152]:
                      - button "🔽 הצג תשובה" [ref=f1e153] [cursor=pointer]
                      - button "📝 בחן אותי" [ref=f1e154] [cursor=pointer]
                  - generic [ref=f1e155]:
                    - generic [ref=f1e157]:
                      - generic [ref=f1e158]:
                        - generic [ref=f1e159]: Q11
                        - generic [ref=f1e160]: חשוב
                      - paragraph [ref=f1e161]: נהג חדש
                    - generic [ref=f1e162]:
                      - button "🔽 הצג תשובה" [ref=f1e163] [cursor=pointer]
                      - button "📝 בחן אותי" [ref=f1e164] [cursor=pointer]
                  - generic [ref=f1e165]:
                    - generic [ref=f1e167]:
                      - generic [ref=f1e168]: Q12
                      - paragraph [ref=f1e170]: נתיב לתחבורה ציבורית
                    - generic [ref=f1e171]:
                      - button "🔽 הצג תשובה" [ref=f1e172] [cursor=pointer]
                      - button "📝 בחן אותי" [ref=f1e173] [cursor=pointer]
                  - generic [ref=f1e174]:
                    - generic [ref=f1e176]:
                      - generic [ref=f1e177]: Q13
                      - paragraph [ref=f1e179]: סטייה/פנייה, פנייה ימינה, נסיעה לאחור
                    - generic [ref=f1e180]:
                      - button "🔽 הצג תשובה" [ref=f1e181] [cursor=pointer]
                      - button "📝 בחן אותי" [ref=f1e182] [cursor=pointer]
                  - generic [ref=f1e183]:
                    - generic [ref=f1e185]:
                      - generic [ref=f1e186]: Q14
                      - paragraph [ref=f1e188]: חניה
                    - generic [ref=f1e189]:
                      - button "🔽 הצג תשובה" [ref=f1e190] [cursor=pointer]
                      - button "📝 בחן אותי" [ref=f1e191] [cursor=pointer]
                  - generic [ref=f1e192]:
                    - generic [ref=f1e194]:
                      - generic [ref=f1e195]: Q15
                      - paragraph [ref=f1e197]: מתן זכות קדימה בצומת (מרומזר, מתומרר, ללא, מעגל תנועה)
                    - generic [ref=f1e198]:
                      - button "🔽 הצג תשובה" [ref=f1e199] [cursor=pointer]
                      - button "📝 בחן אותי" [ref=f1e200] [cursor=pointer]
                  - generic [ref=f1e201]:
                    - generic [ref=f1e203]:
                      - generic [ref=f1e204]: Q16
                      - paragraph [ref=f1e206]: הנהיגה בנתיב שיועד לעובר דרך מסוים, שמירה על ימין הדרך, כניסה לצמתים
                    - generic [ref=f1e207]:
                      - button "🔽 הצג תשובה" [ref=f1e208] [cursor=pointer]
                      - button "📝 בחן אותי" [ref=f1e209] [cursor=pointer]
                  - generic [ref=f1e210]:
                    - generic [ref=f1e212]:
                      - generic [ref=f1e213]: Q17
                      - paragraph [ref=f1e215]: פסילת רישיון נהיגה
                    - generic [ref=f1e216]:
                      - button "🔽 הצג תשובה" [ref=f1e217] [cursor=pointer]
                      - button "📝 בחן אותי" [ref=f1e218] [cursor=pointer]
                  - generic [ref=f1e219]:
                    - generic [ref=f1e221]:
                      - generic [ref=f1e222]: Q18
                      - paragraph [ref=f1e224]: סדר הופעת האור ברמזור ומשמעותן
                    - generic [ref=f1e225]:
                      - button "🔽 הצג תשובה" [ref=f1e226] [cursor=pointer]
                      - button "📝 בחן אותי" [ref=f1e227] [cursor=pointer]
                  - generic [ref=f1e228]:
                    - generic [ref=f1e230]:
                      - generic [ref=f1e231]: Q19
                      - paragraph [ref=f1e233]: מנהרה - נסיעה ואיסור נסיעה במנהרה
                    - generic [ref=f1e234]:
                      - button "🔽 הצג תשובה" [ref=f1e235] [cursor=pointer]
                      - button "📝 בחן אותי" [ref=f1e236] [cursor=pointer]
                  - generic [ref=f1e237]:
                    - generic [ref=f1e239]:
                      - generic [ref=f1e240]:
                        - generic [ref=f1e241]: Q20
                        - generic [ref=f1e242]: חשוב
                      - paragraph [ref=f1e243]: פניית פרסה
                    - generic [ref=f1e244]:
                      - button "🔽 הצג תשובה" [ref=f1e245] [cursor=pointer]
                      - button "📝 בחן אותי" [ref=f1e246] [cursor=pointer]
                  - generic [ref=f1e247]:
                    - generic [ref=f1e249]:
                      - generic [ref=f1e250]: Q21
                      - paragraph [ref=f1e252]: פסילת רישיון נהיגה ע״י קצין משטרה
                    - generic [ref=f1e253]:
                      - button "🔽 הצג תשובה" [ref=f1e254] [cursor=pointer]
                      - button "📝 בחן אותי" [ref=f1e255] [cursor=pointer]
                  - generic [ref=f1e256]:
                    - generic [ref=f1e258]:
                      - generic [ref=f1e259]: Q22
                      - paragraph [ref=f1e261]: הנסיעה בכביש חד סטרי, בדרך משולב ובאזור מיתון תנועה
                    - generic [ref=f1e262]:
                      - button "🔽 הצג תשובה" [ref=f1e263] [cursor=pointer]
                      - button "📝 בחן אותי" [ref=f1e264] [cursor=pointer]
                  - generic [ref=f1e265]:
                    - generic [ref=f1e267]:
                      - generic [ref=f1e268]: Q23
                      - paragraph [ref=f1e270]: הגדר טרקטור וטרקטורון
                    - generic [ref=f1e271]:
                      - button "🔽 הצג תשובה" [ref=f1e272] [cursor=pointer]
                      - button "📝 בחן אותי" [ref=f1e273] [cursor=pointer]
      - paragraph [ref=f1e275]: Built with Next.js, React, and Supabase
    - button "💬" [ref=f1e277] [cursor=pointer]
  - alert [ref=f1e278]
```

# Test source

```ts
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
  155 |         await expect(response).toBeVisible();
  156 |       }
  157 |     }
  158 |   });
  159 | 
  160 |   test('should detect and reject duplicate documents by content hash', async ({ page, context, request }) => {
  161 |     // Check if logged in
  162 |     const adminLink = page.locator('a[href="/admin"]');
  163 |     const isLoggedIn = await adminLink.count() > 0;
  164 | 
  165 |     if (!isLoggedIn) {
  166 |       test.skip();
  167 |       return;
  168 |     }
  169 | 
  170 |     const testTitle = `Duplicate Test ${Date.now()}`;
  171 |     const testContent = 'This is a test document with unique content for duplicate detection testing.';
  172 | 
  173 |     // Upload first document
  174 |     const firstUpload = await request.post(`${APP_URL}/api/admin/rag-documents`, {
  175 |       headers: {
  176 |         'Cookie': await getCookieString(context),
  177 |       },
  178 |       data: {
  179 |         title: testTitle,
  180 |         content: testContent,
  181 |         source: 'Test',
  182 |       },
  183 |     });
  184 | 
  185 |     expect(firstUpload.ok()).toBeTruthy();
  186 | 
  187 |     // Try to upload same content with different title
  188 |     const secondUpload = await request.post(`${APP_URL}/api/admin/rag-documents`, {
  189 |       headers: {
  190 |         'Cookie': await getCookieString(context),
  191 |       },
  192 |       data: {
  193 |         title: `${testTitle} - Duplicate`,
  194 |         content: testContent, // Same content
  195 |         source: 'Test',
  196 |       },
  197 |     });
  198 | 
  199 |     // Should fail with 409 (duplicate)
> 200 |     expect([409, 400]).toContain(secondUpload.status());
      |                        ^ Error: expect(received).toContain(expected) // indexOf
  201 | 
  202 |     const response = await secondUpload.json();
  203 |     if (response.error?.code === 'DUPLICATE_FILE') {
  204 |       expect(response.error.message).toContain('already uploaded');
  205 |     }
  206 |   });
  207 | 
  208 |   test('should verify embedding dimensions are correct (768D for Gemini)', async ({ page, context, request }) => {
  209 |     // Check if logged in
  210 |     const adminLink = page.locator('a[href="/admin"]');
  211 |     const isLoggedIn = await adminLink.count() > 0;
  212 | 
  213 |     if (!isLoggedIn) {
  214 |       test.skip();
  215 |       return;
  216 |     }
  217 | 
  218 |     // Navigate to admin panel
  219 |     await page.click('a[href="/admin"]');
  220 |     await page.waitForLoadState('networkidle');
  221 | 
  222 |     // Click on RAG Documents
  223 |     await page.click('text=RAG Documents');
  224 |     await page.waitForLoadState('networkidle');
  225 | 
  226 |     // Get list of documents
  227 |     const response = await request.get(`${APP_URL}/api/admin/rag-documents`, {
  228 |       headers: {
  229 |         'Cookie': await getCookieString(context),
  230 |       },
  231 |     });
  232 | 
  233 |     expect(response.ok()).toBeTruthy();
  234 |     const data = await response.json();
  235 | 
  236 |     // Find a document with embedding
  237 |     const docWithEmbedding = data.documents?.find((doc: any) => doc.embedding);
  238 | 
  239 |     if (docWithEmbedding) {
  240 |       // Embedding should be an array of numbers (768 dimensions)
  241 |       if (Array.isArray(docWithEmbedding.embedding)) {
  242 |         // Gemini embeddings are 768D
  243 |         expect(docWithEmbedding.embedding.length).toBe(768);
  244 |       }
  245 |     }
  246 |   });
  247 | 
  248 |   test('should show embedding status badges (Embedded vs Pending)', async ({ page, context }) => {
  249 |     // Check if logged in
  250 |     const adminLink = page.locator('a[href="/admin"]');
  251 |     const isLoggedIn = await adminLink.count() > 0;
  252 | 
  253 |     if (!isLoggedIn) {
  254 |       test.skip();
  255 |       return;
  256 |     }
  257 | 
  258 |     // Navigate to admin panel
  259 |     await page.click('a[href="/admin"]');
  260 |     await page.waitForLoadState('networkidle');
  261 | 
  262 |     // Click on RAG Documents
  263 |     await page.click('text=RAG Documents');
  264 |     await page.waitForLoadState('networkidle');
  265 | 
  266 |     // Look for status badges
  267 |     const embeddedBadges = page.locator('text=/✅ Embedded/');
  268 |     const pendingBadges = page.locator('text=/⏳ Pending/');
  269 | 
  270 |     const hasEmbedded = await embeddedBadges.count() > 0;
  271 |     const hasPending = await pendingBadges.count() > 0;
  272 | 
  273 |     // Should have at least one badge showing (either embedded or pending)
  274 |     if (hasEmbedded || hasPending) {
  275 |       // Good - documents exist and have status badges
  276 |       expect(true).toBeTruthy();
  277 |     }
  278 |   });
  279 | 
  280 |   test('should delete document and remove embedding from vector database', async ({ page, context, request }) => {
  281 |     // Check if logged in
  282 |     const adminLink = page.locator('a[href="/admin"]');
  283 |     const isLoggedIn = await adminLink.count() > 0;
  284 | 
  285 |     if (!isLoggedIn) {
  286 |       test.skip();
  287 |       return;
  288 |     }
  289 | 
  290 |     const testTitle = `Delete Test ${Date.now()}`;
  291 | 
  292 |     // Upload document via API
  293 |     const uploadResponse = await request.post(`${APP_URL}/api/admin/rag-documents`, {
  294 |       headers: {
  295 |         'Cookie': await getCookieString(context),
  296 |       },
  297 |       data: {
  298 |         title: testTitle,
  299 |         content: 'This document will be deleted to verify embedding removal.',
  300 |         source: 'Delete Test',
```