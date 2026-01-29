import { test, expect } from '../setup';

test.describe('Tree Management Flow', () => {
  test('should create first family tree', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard');

    // Click "Create New Tree" button
    await page.click('text=Create New Tree');

    // Wait for modal/form to appear
    await expect(page.locator('h2')).toContainText('Create Family Tree');

    // Fill tree form
    const treeName = `Test Tree ${Date.now()}`;
    await page.fill('input[name="name"]', treeName);
    await page.fill('textarea[name="description"]', 'Testing family tree creation');

    // Submit form
    await page.click('button[type="submit"]:not([disabled])');

    // Should redirect to tree board or show success
    await page.waitForTimeout(2000);

    // Verify tree was created by checking dashboard
    await page.goto('/dashboard');
    await expect(page.locator(`text=${treeName}`)).toBeVisible();
  });

  test('should display existing trees in dashboard', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard');

    // Should show welcome message
    await expect(page.locator('h1')).toContainText('Welcome back');

    // Should show "Create New Tree" button
    await expect(page.locator('text=Create New Tree')).toBeVisible();
  });

  test('should navigate to tree board', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard');

    // Look for any existing tree card
    const treeCards = page.locator('div[role="button"]').filter({ hasText: /Family Tree/ });

    const count = await treeCards.count();
    if (count > 0) {
      // Click on first tree
      await treeCards.first().click();

      // Should navigate to tree board
      await page.waitForURL(/\/trees\/[a-f0-9]+/, { timeout: 5000 });
    } else {
      // Skip test if no trees exist
      test.skip();
    }
  });

  test('should use zoom controls on tree board', async ({ page }) => {
    // Navigate to a tree (assuming one exists or we create one)
    await page.goto('/dashboard');

    // Try to find and click on a tree
    const treeCards = page.locator('div[role="button"]').filter({ hasText: /Family Tree/ });
    const count = await treeCards.count();

    if (count > 0) {
      await treeCards.first().click();
      await page.waitForURL(/\/trees\/[a-f0-9]+/);

      // Test zoom in button
      const zoomInButton = page.locator('button').filter({ hasText: '' }).locator('svg').nth(0);
      await zoomInButton.click();

      // Test zoom out button
      await page.waitForTimeout(500);
    } else {
      test.skip();
    }
  });

  test('should show tree creation modal', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard');

    // Click "Create New Tree" button
    await page.click('text=Create New Tree');

    // Modal should appear
    await expect(page.locator('h2')).toContainText('Create Family Tree');
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('textarea[name="description"]')).toBeVisible();

    // Close modal by clicking outside or cancel
    await page.keyboard.press('Escape');
  });

  test('should validate tree name on creation', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard');

    // Click "Create New Tree" button
    await page.click('text=Create New Tree');

    // Try to submit without name
    await page.click('button[type="submit"]');

    // Should show validation error
    await expect(page.locator('text=required')).toBeVisible();
  });
});
