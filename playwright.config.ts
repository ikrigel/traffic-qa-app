import { defineConfig, devices } from '@playwright/test';

export const TEST_USER = {
  email: 'test@example.com',
  id: 'test-user-id-12345',
  role: 'user',
};

export const TEST_ADMIN = {
  email: 'admin@example.com',
  id: 'admin-user-id-67890',
  role: 'admin',
};

export const TEST_SUPER_ADMIN = {
  email: 'superadmin@example.com',
  id: 'superadmin-id-11111',
  role: 'super_admin',
};

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
