import { test as base, type Page } from '@playwright/test';

// Test credentials
const TEST_USER = {
  name: 'Test User',
  email: process.env.TEST_USER_EMAIL || 'test@example.com',
  password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
};

// Helper function to create test user
async function createTestUser(page: Page) {
  await page.goto('/register');
  await page.fill('input[name="fullName"]', TEST_USER.name);
  await page.fill('input[name="email"]', TEST_USER.email);
  await page.fill('input[name="password"]', TEST_USER.password);
  await page.fill('input[name="confirmPassword"]', TEST_USER.password);
  await page.check('#acceptTerms');
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard or timeout
  try {
    await page.waitForURL('/dashboard', { timeout: 15000 });
  } catch {
    // If redirect doesn't happen, continue anyway
  }
}

// Helper function to login
async function loginTestUser(page: Page) {
  await page.goto('/login');
  await page.fill('input[name="email"]', TEST_USER.email);
  await page.fill('input[name="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  await page.waitForURL('/dashboard', { timeout: 15000 });
}

export const test = base.extend<{
  authenticatedPage: Page;
}>({
  // Extend test with authenticated page
  authenticatedPage: async ({ page }, use) => {
    // First try to create the test user (will fail if already exists, which is fine)
    await page.goto('/register');

    // Check if we're already on the register page (not logged in)
    const currentUrl = page.url();
    if (currentUrl.includes('/register')) {
      // Try to create user
      try {
        await createTestUser(page);
      } catch {
        // User might already exist, try to login
        await loginTestUser(page);
      }
    } else {
      // Already logged in or somewhere else, go to login
      await loginTestUser(page);
    }

    await use(page);
  },
});

export { expect } from '@playwright/test';
