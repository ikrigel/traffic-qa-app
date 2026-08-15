import { defineConfig, devices } from '@playwright/test';

export const TEST_USER = {
  email: 'test-user@example.com',
  id: '12345678-1234-1234-1234-123456789012',
  role: 'user',
};

export const TEST_ADMIN = {
  email: 'test-admin@example.com',
  id: '87654321-4321-4321-4321-210987654321',
  role: 'admin',
};

export const TEST_SUPER_ADMIN = {
  email: 'test-superadmin@example.com',
  id: '11111111-2222-3333-4444-555555555555',
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
