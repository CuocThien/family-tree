import { test as base } from '@playwright/test';

// Test credentials - these should be set up before running tests
const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'test@example.com',
  password: process.env.TEST_USER_PASSWORD || 'testpassword123',
};

export const test = base.extend({
  // Extend test with authenticated page
  authenticatedPage: async ({ page }, use) => {
    // Navigate to login
    await page.goto('/login');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    await use(page);
  },
});

export { expect } from '@playwright/test';
