import { Page } from '@playwright/test';
import { TEST_USER, TEST_ADMIN, TEST_SUPER_ADMIN } from '../../playwright.config';

export type TestUserType = 'user' | 'admin' | 'super_admin';

const userMap = {
  user: TEST_USER,
  admin: TEST_ADMIN,
  super_admin: TEST_SUPER_ADMIN,
};

export async function loginAsUser(page: Page, userType: TestUserType = 'user') {
  const user = userMap[userType];

  // Call test setup endpoint to create session and set auth cookie
  const setupResponse = await page.request.post('http://localhost:3000/api/test/setup-auth', {
    data: user,
  });

  if (!setupResponse.ok()) {
    const error = await setupResponse.text();
    throw new Error(`Failed to setup test auth: ${error}`);
  }

  // Navigate to app
  await page.goto('http://localhost:3000');

  // Wait for auth to complete - /api/user should return user data
  await page.waitForFunction(
    async () => {
      const response = await fetch('http://localhost:3000/api/user', {
        credentials: 'include',
      });
      return response.ok;
    },
    { timeout: 5000 }
  );
}

export async function logout(page: Page) {
  // Call logout endpoint
  await fetch('http://localhost:3000/api/auth?action=logout', {
    credentials: 'include',
  }).catch(() => {
    // Ignore errors
  });

  // Navigate to home
  await page.goto('http://localhost:3000');

  // Wait for logout to complete
  await page.waitForFunction(
    async () => {
      const response = await fetch('http://localhost:3000/api/user', {
        credentials: 'include',
      });
      return !response.ok; // User should not be authenticated
    },
    { timeout: 5000 }
  ).catch(() => {
    // Ignore timeout - logout might be instant
  });
}
