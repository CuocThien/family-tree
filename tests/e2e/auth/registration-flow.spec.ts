import { test, expect } from '../setup';

test.describe('User Registration Flow', () => {
  test('should register a new user', async ({ page }) => {
    const timestamp = Date.now();
    await page.goto('/register');

    // Fill registration form
    await page.fill('input[name="fullName"]', `New User ${timestamp}`);
    await page.fill('input[name="email"]', `new-${timestamp}@example.com`);
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="confirmPassword"]', 'Password123!');
    await page.check('#acceptTerms'); // Accept terms

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 });
    await expect(page.locator('h1')).toContainText('Welcome back');
  });

  test('should show validation errors for invalid input', async ({ page }) => {
    await page.goto('/register');

    // Submit empty form
    await page.click('button[type="submit"]');

    // Should show validation errors
    await expect(page.locator('text=Name is required')).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');

    await page.waitForURL('/dashboard', { timeout: 10000 });
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('div[role="alert"]')).toBeVisible();
  });

  test('should logout successfully', async ({ authenticatedPage: page }) => {
    await page.goto('/settings');
    await page.click('button:has-text("Logout")');

    await expect(page).toHaveURL('/', { timeout: 5000 });
  });

  test('should toggle password visibility', async ({ page }) => {
    await page.goto('/login');

    const passwordInput = page.locator('input[type="password"]');
    const toggleButton = page.locator('button[aria-label*="password"]');

    // Initially password should be hidden
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click toggle to show password
    await toggleButton.first().click();
    await expect(page.locator('input[type="text"]').nth(1)).toBeVisible();

    // Click again to hide
    await toggleButton.first().click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should navigate between login and register', async ({ page }) => {
    await page.goto('/login');

    // Click link to register
    await page.click('text=Create an account');
    await expect(page).toHaveURL('/register');

    // Click link to login
    await page.click('text=Sign in');
    await expect(page).toHaveURL('/login');
  });
});
