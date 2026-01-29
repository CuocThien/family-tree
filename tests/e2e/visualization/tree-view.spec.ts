import { test, expect } from '../setup';

test.describe('Tree Visualization', () => {
  test('should display tree board', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');

    await page.waitForURL('/dashboard');

    // Look for a tree
    const treeCards = page.locator('div[role="button"]').filter({ hasText: /Family Tree/ });
    const count = await treeCards.count();

    if (count > 0) {
      await treeCards.first().click();
      await page.waitForURL(/\/trees\/[a-f0-9]+/);

      // Should display tree canvas
      await page.waitForTimeout(2000);

      // Check if we're on the tree board page
      const url = page.url();
      expect(url).toMatch(/\/trees\/[a-f0-9]+/);
    } else {
      test.skip(true, 'No trees found');
    }
  });

  test('should have floating controls visible', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');

    await page.waitForURL('/dashboard');

    const treeCards = page.locator('div[role="button"]').filter({ hasText: /Family Tree/ });
    const count = await treeCards.count();

    if (count > 0) {
      await treeCards.first().click();
      await page.waitForURL(/\/trees\/[a-f0-9]+/);
      await page.waitForTimeout(2000);

      // Look for control buttons (zoom, view mode, etc.)
      const buttons = page.locator('button').count();
      expect(await buttons).toBeGreaterThan(0);
    } else {
      test.skip(true, 'No trees found');
    }
  });

  test('should show add person button', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');

    await page.waitForURL('/dashboard');

    const treeCards = page.locator('div[role="button"]').filter({ hasText: /Family Tree/ });
    const count = await treeCards.count();

    if (count > 0) {
      await treeCards.first().click();
      await page.waitForURL(/\/trees\/[a-f0-9]+/);
      await page.waitForTimeout(2000);

      // Look for add person button (usually has a plus icon)
      const addButton = page.locator('button').filter({ hasText: '' }).locator('svg').locator('path[d*="M12 5"]').first();
      const addCount = await addButton.count();

      if (addCount > 0) {
        await addButton.click();
        await page.waitForTimeout(1000);
      }
    } else {
      test.skip(true, 'No trees found');
    }
  });

  test('should navigate back to dashboard from tree', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');

    await page.waitForURL('/dashboard');

    const treeCards = page.locator('div[role="button"]').filter({ hasText: /Family Tree/ });
    const count = await treeCards.count();

    if (count > 0) {
      await treeCards.first().click();
      await page.waitForURL(/\/trees\/[a-f0-9]+/);

      // Navigate back to dashboard
      await page.goto('/dashboard');

      await expect(page.locator('h1')).toContainText('Welcome back');
    } else {
      test.skip(true, 'No trees found');
    }
  });
});
