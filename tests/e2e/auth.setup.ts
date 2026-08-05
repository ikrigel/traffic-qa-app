import { test as setup } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Mock authentication by setting session cookie directly
  // This bypasses the OAuth flow for testing
  await page.goto('/');

  // Set a test session cookie
  await page.context().addCookies([
    {
      name: 'auth_token',
      value: 'test_token_for_e2e_testing',
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
  ]);

  // Save auth state
  await page.context().storageState({ path: authFile });
});
