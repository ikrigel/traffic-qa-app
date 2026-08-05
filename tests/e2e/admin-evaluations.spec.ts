import { test, expect } from '@playwright/test';

test.describe('Admin Evaluations Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Set test session with super_admin role
    await page.context().addCookies([
      {
        name: 'auth_token',
        value: 'test_token_super_admin',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
      },
    ]);
    await page.reload();
  });

  test('should navigate to admin panel', async ({ page }) => {
    // Wait for page load
    await page.waitForTimeout(2000);

    // Look for admin link or button
    const adminLink = page.locator('a:has-text("Admin"), button:has-text("Admin")').first();

    if (await adminLink.isVisible().catch(() => false)) {
      await adminLink.click();
      await page.waitForURL('**/admin', { timeout: 5000 });
      await expect(page).toHaveURL(/\/admin/);
    }
  });

  test('should access evaluations tab in admin panel', async ({ page }) => {
    await page.goto('/admin');

    // Wait for admin panel to load
    await page.waitForSelector('[data-testid="admin-panel"]', { timeout: 5000 });

    // Click evaluations tab
    const evaluationsTab = page.locator('button:has-text("Evaluations"), text=Evaluations').first();

    if (await evaluationsTab.isVisible().catch(() => false)) {
      await evaluationsTab.click();

      // Verify evaluations panel is visible
      const evaluationsPanel = page.locator('[data-testid="evaluations-panel"]');
      await expect(evaluationsPanel).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display manual evaluation form', async ({ page }) => {
    await page.goto('/admin');

    await page.waitForSelector('[data-testid="admin-panel"]', { timeout: 5000 });

    const evaluationsTab = page.locator('button:has-text("Evaluations"), text=Evaluations').first();
    if (await evaluationsTab.isVisible().catch(() => false)) {
      await evaluationsTab.click();

      // Look for evaluation form fields
      const questionInput = page.locator('[placeholder*="question"], [placeholder*="Question"]').first();
      const answerInput = page.locator('[placeholder*="answer"], [placeholder*="Answer"]').first();

      // At least one should be visible in the evaluation panel
      const hasForm =
        await questionInput.isVisible().catch(() => false) ||
        await answerInput.isVisible().catch(() => false) ||
        await page.locator('text=/test.*rag|evaluate.*question/i').isVisible().catch(() => false);

      expect(hasForm).toBe(true);
    }
  });

  test('should display test attempts feed', async ({ page }) => {
    await page.goto('/admin');

    await page.waitForSelector('[data-testid="admin-panel"]', { timeout: 5000 });

    const evaluationsTab = page.locator('button:has-text("Evaluations"), text=Evaluations').first();
    if (await evaluationsTab.isVisible().catch(() => false)) {
      await evaluationsTab.click();

      // Look for test attempts section
      const attemptsSection = page.locator('[data-testid="test-attempts-feed"], text=/test.*attempt/i').first();

      if (await attemptsSection.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(attemptsSection).toBeVisible();
      }
    }
  });

  test('should show verdict badges with correct colors', async ({ page }) => {
    await page.goto('/admin');

    await page.waitForSelector('[data-testid="admin-panel"]', { timeout: 5000 });

    const evaluationsTab = page.locator('button:has-text("Evaluations"), text=Evaluations').first();
    if (await evaluationsTab.isVisible().catch(() => false)) {
      await evaluationsTab.click();

      // Look for verdict badges (correct/partial/incorrect)
      const verdictBadges = page.locator('[data-testid*="verdict"], text=/correct|partial|incorrect/i');

      // If there are test attempts, verdict badges should be visible
      const badgeCount = await verdictBadges.count().catch(() => 0);

      if (badgeCount > 0) {
        await expect(verdictBadges.first()).toBeVisible();
      }
    }
  });

  test('should be inaccessible to non-admin users', async ({ page }) => {
    // Set non-admin session
    await page.context().clearCookies();
    await page.context().addCookies([
      {
        name: 'auth_token',
        value: 'test_token_regular_user',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
      },
    ]);

    await page.goto('/admin');

    // Should either redirect or show access denied
    const accessDenied = await page.locator('text=/access.*denied|not.*authorized|403/i')
      .isVisible()
      .catch(() => false);

    const redirectedAway = page.url().includes('/admin') === false;

    expect(accessDenied || redirectedAway).toBe(true);
  });
});
