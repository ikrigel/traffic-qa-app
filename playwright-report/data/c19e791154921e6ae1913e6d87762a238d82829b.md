# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: rag-embeddings.spec.ts >> RAG Embedding System >> should handle multiple document chunks correctly
- Location: tests\e2e\rag-embeddings.spec.ts:157:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 25
Received: 20
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
  87  | 
  88  |   test('should provide RAG context to chat assistant', async ({ page, request, context }) => {
  89  |     const adminLink = page.locator('a[href="/admin"]');
  90  |     const isLoggedIn = await adminLink.count() > 0;
  91  | 
  92  |     if (!isLoggedIn) {
  93  |       test.skip();
  94  |       return;
  95  |     }
  96  | 
  97  |     // Send chat message
  98  |     const chatResponse = await request.post(`${APP_URL}/api/chat`, {
  99  |       headers: {
  100 |         'Cookie': await getCookieString(context),
  101 |       },
  102 |       data: {
  103 |         message: 'מהי תקנה 25?', // "What is regulation 25?" in Hebrew
  104 |       },
  105 |     });
  106 | 
  107 |     expect(chatResponse.ok()).toBeTruthy();
  108 |     const chatData = await chatResponse.json();
  109 | 
  110 |     // Verify response has sources
  111 |     expect(chatData.answer).toBeDefined();
  112 |     expect(chatData.sources).toBeDefined();
  113 |     expect(Array.isArray(chatData.sources)).toBeTruthy();
  114 | 
  115 |     // If documents were retrieved, verify they're in the response
  116 |     if (chatData.sources.length > 0) {
  117 |       for (const source of chatData.sources) {
  118 |         expect(source.id).toBeDefined();
  119 |         expect(source.title).toBeDefined();
  120 |       }
  121 |     }
  122 |   });
  123 | 
  124 |   test('should use RAG context for answer grading', async ({ page, request, context }) => {
  125 |     const adminLink = page.locator('a[href="/admin"]');
  126 |     const isLoggedIn = await adminLink.count() > 0;
  127 | 
  128 |     if (!isLoggedIn) {
  129 |       test.skip();
  130 |       return;
  131 |     }
  132 | 
  133 |     // Grade an answer
  134 |     const gradeResponse = await request.post(`${APP_URL}/api/test/evaluate`, {
  135 |       headers: {
  136 |         'Cookie': await getCookieString(context),
  137 |       },
  138 |       data: {
  139 |         questionId: 1,
  140 |         questionText: 'מהי תקנה 25?',
  141 |         correctAnswer: 'תקנה 25 עוסקת בעקיפה',
  142 |         userAnswer: 'תקנה 25 היא על עקיפה',
  143 |         inputMethod: 'typed',
  144 |       },
  145 |     });
  146 | 
  147 |     expect(gradeResponse.ok()).toBeTruthy();
  148 |     const gradeData = await gradeResponse.json();
  149 | 
  150 |     // Verify grading response
  151 |     expect(gradeData.verdict).toBeDefined();
  152 |     expect(['correct', 'partial', 'incorrect']).toContain(gradeData.verdict);
  153 |     expect(gradeData.feedback).toBeDefined();
  154 |     expect(gradeData.metrics).toBeDefined();
  155 |   });
  156 | 
  157 |   test('should handle multiple document chunks correctly', async ({ page, request, context }) => {
  158 |     const adminLink = page.locator('a[href="/admin"]');
  159 |     const isLoggedIn = await adminLink.count() > 0;
  160 | 
  161 |     if (!isLoggedIn) {
  162 |       test.skip();
  163 |       return;
  164 |     }
  165 | 
  166 |     // Get all documents
  167 |     const docsResponse = await request.get(`${APP_URL}/api/admin/rag-documents`, {
  168 |       headers: {
  169 |         'Cookie': await getCookieString(context),
  170 |       },
  171 |     });
  172 | 
  173 |     expect(docsResponse.ok()).toBeTruthy();
  174 |     const docsData = await docsResponse.json();
  175 | 
  176 |     // Verify documents exist
  177 |     expect(docsData.documents).toBeDefined();
  178 |     expect(Array.isArray(docsData.documents)).toBeTruthy();
  179 | 
  180 |     // Count documents with and without embeddings
  181 |     const withEmbedding = docsData.documents.filter((d: any) => d.embedding).length;
  182 |     const withoutEmbedding = docsData.documents.filter((d: any) => !d.embedding).length;
  183 | 
  184 |     console.log(`Documents: ${docsData.documents.length}, With embedding: ${withEmbedding}, Without: ${withoutEmbedding}`);
  185 | 
  186 |     // All documents should have embeddings
> 187 |     expect(withEmbedding).toBe(docsData.documents.length);
      |                           ^ Error: expect(received).toBe(expected) // Object.is equality
  188 |     expect(withoutEmbedding).toBe(0);
  189 |   });
  190 | 
  191 |   test('should verify embedding dimensions are 768D', async ({ page, request, context }) => {
  192 |     const adminLink = page.locator('a[href="/admin"]');
  193 |     const isLoggedIn = await adminLink.count() > 0;
  194 | 
  195 |     if (!isLoggedIn) {
  196 |       test.skip();
  197 |       return;
  198 |     }
  199 | 
  200 |     const docsResponse = await request.get(`${APP_URL}/api/admin/rag-documents`, {
  201 |       headers: {
  202 |         'Cookie': await getCookieString(context),
  203 |       },
  204 |     });
  205 | 
  206 |     expect(docsResponse.ok()).toBeTruthy();
  207 |     const docsData = await docsResponse.json();
  208 | 
  209 |     // Check a document with embedding
  210 |     const docWithEmbedding = docsData.documents.find((d: any) => d.embedding);
  211 |     if (docWithEmbedding) {
  212 |       expect(Array.isArray(docWithEmbedding.embedding)).toBeTruthy();
  213 |       expect(docWithEmbedding.embedding.length).toBe(768); // Gemini 768D
  214 |     }
  215 |   });
  216 | });
  217 | 
  218 | // Helper function to get cookie string from context
  219 | async function getCookieString(context: any): Promise<string> {
  220 |   const cookies = await context.cookies();
  221 |   return cookies
  222 |     .map((cookie: any) => `${cookie.name}=${cookie.value}`)
  223 |     .join('; ');
  224 | }
  225 | 
```