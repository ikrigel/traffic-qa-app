# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin-evaluations.spec.ts >> Admin Evaluations Panel >> should display manual evaluation form
- Location: tests\e2e\admin-evaluations.spec.ts:53:7

# Error details

```
TimeoutError: page.waitForSelector: Timeout 5000ms exceeded.
Call log:
  - waiting for locator('[data-testid="admin-panel"]') to be visible

```

# Page snapshot

```yaml
- generic [active] [ref=f2e1]:
  - main [ref=f2e2]:
    - generic [ref=f2e3]:
      - generic [ref=f2e4]: 🔒
      - heading "Access Denied" [level=1] [ref=f2e5]
      - paragraph [ref=f2e6]: You do not have permission to access the admin panel.
      - link "Back to Home" [ref=f2e7] [cursor=pointer]:
        - /url: /
  - alert [ref=f2e8]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Admin Evaluations Panel', () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     await page.goto('/');
  6   |     // Set test session with super_admin role
  7   |     await page.context().addCookies([
  8   |       {
  9   |         name: 'auth_token',
  10  |         value: 'test_token_super_admin',
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
  21  |   test('should navigate to admin panel', async ({ page }) => {
  22  |     // Wait for page load
  23  |     await page.waitForTimeout(2000);
  24  | 
  25  |     // Look for admin link or button
  26  |     const adminLink = page.locator('a:has-text("Admin"), button:has-text("Admin")').first();
  27  | 
  28  |     if (await adminLink.isVisible().catch(() => false)) {
  29  |       await adminLink.click();
  30  |       await page.waitForURL('**/admin', { timeout: 5000 });
  31  |       await expect(page).toHaveURL(/\/admin/);
  32  |     }
  33  |   });
  34  | 
  35  |   test('should access evaluations tab in admin panel', async ({ page }) => {
  36  |     await page.goto('/admin');
  37  | 
  38  |     // Wait for admin panel to load
  39  |     await page.waitForSelector('[data-testid="admin-panel"]', { timeout: 5000 });
  40  | 
  41  |     // Click evaluations tab
  42  |     const evaluationsTab = page.locator('button:has-text("Evaluations"), text=Evaluations').first();
  43  | 
  44  |     if (await evaluationsTab.isVisible().catch(() => false)) {
  45  |       await evaluationsTab.click();
  46  | 
  47  |       // Verify evaluations panel is visible
  48  |       const evaluationsPanel = page.locator('[data-testid="evaluations-panel"]');
  49  |       await expect(evaluationsPanel).toBeVisible({ timeout: 5000 });
  50  |     }
  51  |   });
  52  | 
  53  |   test('should display manual evaluation form', async ({ page }) => {
  54  |     await page.goto('/admin');
  55  | 
> 56  |     await page.waitForSelector('[data-testid="admin-panel"]', { timeout: 5000 });
      |                ^ TimeoutError: page.waitForSelector: Timeout 5000ms exceeded.
  57  | 
  58  |     const evaluationsTab = page.locator('button:has-text("Evaluations"), text=Evaluations').first();
  59  |     if (await evaluationsTab.isVisible().catch(() => false)) {
  60  |       await evaluationsTab.click();
  61  | 
  62  |       // Look for evaluation form fields
  63  |       const questionInput = page.locator('[placeholder*="question"], [placeholder*="Question"]').first();
  64  |       const answerInput = page.locator('[placeholder*="answer"], [placeholder*="Answer"]').first();
  65  | 
  66  |       // At least one should be visible in the evaluation panel
  67  |       const hasForm =
  68  |         await questionInput.isVisible().catch(() => false) ||
  69  |         await answerInput.isVisible().catch(() => false) ||
  70  |         await page.locator('text=/test.*rag|evaluate.*question/i').isVisible().catch(() => false);
  71  | 
  72  |       expect(hasForm).toBe(true);
  73  |     }
  74  |   });
  75  | 
  76  |   test('should display test attempts feed', async ({ page }) => {
  77  |     await page.goto('/admin');
  78  | 
  79  |     await page.waitForSelector('[data-testid="admin-panel"]', { timeout: 5000 });
  80  | 
  81  |     const evaluationsTab = page.locator('button:has-text("Evaluations"), text=Evaluations').first();
  82  |     if (await evaluationsTab.isVisible().catch(() => false)) {
  83  |       await evaluationsTab.click();
  84  | 
  85  |       // Look for test attempts section
  86  |       const attemptsSection = page.locator('[data-testid="test-attempts-feed"], text=/test.*attempt/i').first();
  87  | 
  88  |       if (await attemptsSection.isVisible({ timeout: 3000 }).catch(() => false)) {
  89  |         await expect(attemptsSection).toBeVisible();
  90  |       }
  91  |     }
  92  |   });
  93  | 
  94  |   test('should show verdict badges with correct colors', async ({ page }) => {
  95  |     await page.goto('/admin');
  96  | 
  97  |     await page.waitForSelector('[data-testid="admin-panel"]', { timeout: 5000 });
  98  | 
  99  |     const evaluationsTab = page.locator('button:has-text("Evaluations"), text=Evaluations').first();
  100 |     if (await evaluationsTab.isVisible().catch(() => false)) {
  101 |       await evaluationsTab.click();
  102 | 
  103 |       // Look for verdict badges (correct/partial/incorrect)
  104 |       const verdictBadges = page.locator('[data-testid*="verdict"], text=/correct|partial|incorrect/i');
  105 | 
  106 |       // If there are test attempts, verdict badges should be visible
  107 |       const badgeCount = await verdictBadges.count().catch(() => 0);
  108 | 
  109 |       if (badgeCount > 0) {
  110 |         await expect(verdictBadges.first()).toBeVisible();
  111 |       }
  112 |     }
  113 |   });
  114 | 
  115 |   test('should be inaccessible to non-admin users', async ({ page }) => {
  116 |     // Set non-admin session
  117 |     await page.context().clearCookies();
  118 |     await page.context().addCookies([
  119 |       {
  120 |         name: 'auth_token',
  121 |         value: 'test_token_regular_user',
  122 |         domain: 'localhost',
  123 |         path: '/',
  124 |         httpOnly: true,
  125 |         secure: false,
  126 |         sameSite: 'Lax',
  127 |       },
  128 |     ]);
  129 | 
  130 |     await page.goto('/admin');
  131 | 
  132 |     // Should either redirect or show access denied
  133 |     const accessDenied = await page.locator('text=/access.*denied|not.*authorized|403/i')
  134 |       .isVisible()
  135 |       .catch(() => false);
  136 | 
  137 |     const redirectedAway = page.url().includes('/admin') === false;
  138 | 
  139 |     expect(accessDenied || redirectedAway).toBe(true);
  140 |   });
  141 | });
  142 | 
```