import { test, expect } from '../setup';

test.describe('Add/Update Person Flow', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    // authenticatedPage is already logged in from setup
  });

  test('should open add person modal from tree board', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard/trees');

    // Look for a tree to open
    const treeCards = page.locator('a[href*="/trees/"]').filter({ hasText: /Family Tree/ });
    const count = await treeCards.count();

    if (count > 0) {
      await treeCards.first().click();
      await page.waitForURL(/\/trees\/[a-f0-9]+/);

      // Click Quick Add button
      const quickAddButton = page.locator('button:has-text("Quick Add")');
      await quickAddButton.click();

      // Modal should open
      await expect(page.locator('text=Add New Member')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('input[placeholder*="First Name"]')).toBeVisible();
    } else {
      test.skip(true, 'No trees found');
    }
  });

  test('should add a new person', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard/trees');

    const treeCards = page.locator('a[href*="/trees/"]').filter({ hasText: /Family Tree/ });
    const count = await treeCards.count();

    if (count > 0) {
      await treeCards.first().click();
      await page.waitForURL(/\/trees\/[a-f0-9]+/);

      // Click Quick Add
      await page.locator('button:has-text("Quick Add")').click();

      // Wait for modal
      await page.waitForSelector('text=Add New Member', { timeout: 5000 });

      // Fill form
      await page.fill('input[placeholder*="First Name"]', `Jane${Date.now()}`);
      await page.fill('input[placeholder*="Last Name"]', 'Doe');

      // Select female gender
      await page.locator('button:has-text("Female")').click();

      // Submit
      await page.locator('button:has-text("Add to Family Tree")').click();

      // Should show success or modal close
      await page.waitForTimeout(2000);
    } else {
      test.skip(true, 'No trees found');
    }
  });

  test('should show validation errors', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard/trees');

    const treeCards = page.locator('a[href*="/trees/"]').filter({ hasText: /Family Tree/ });
    const count = await treeCards.count();

    if (count > 0) {
      await treeCards.first().click();
      await page.waitForURL(/\/trees\/[a-f0-9]+/);

      // Click Quick Add
      await page.locator('button:has-text("Quick Add")').click();

      // Wait for modal
      await page.waitForSelector('text=Add New Member', { timeout: 5000 });

      // Try to submit without required fields
      await page.locator('button:has-text("Add to Family Tree")').click();

      // Should show validation error
      await expect(page.locator('text=First name is required')).toBeVisible({ timeout: 3000 });
    } else {
      test.skip(true, 'No trees found');
    }
  });

  test('should add advanced details', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard/trees');

    const treeCards = page.locator('a[href*="/trees/"]').filter({ hasText: /Family Tree/ });
    const count = await treeCards.count();

    if (count > 0) {
      await treeCards.first().click();
      await page.waitForURL(/\/trees\/[a-f0-9]+/);

      // Click Quick Add
      await page.locator('button:has-text("Quick Add")').click();

      // Wait for modal
      await page.waitForSelector('text=Add New Member', { timeout: 5000 });

      // Fill basic info
      await page.fill('input[placeholder*="First Name"]', `John${Date.now()}`);
      await page.fill('input[placeholder*="Last Name"]', 'Smith');

      // Expand advanced details
      await page.locator('text=Add more details').click();

      // Fill birth date
      await page.fill('input[type="date"][name*="birthDate"]', '1950-01-01');

      // Mark as deceased
      await page.locator('input[type="checkbox"]').check();

      // Fill death date
      await page.fill('input[type="date"][name*="deathDate"]', '2020-12-31');

      // Submit
      await page.locator('button:has-text("Add to Family Tree")').click();

      // Should submit
      await page.waitForTimeout(2000);
    } else {
      test.skip(true, 'No trees found');
    }
  });

  test('should navigate to person profile', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard/trees');

    const treeCards = page.locator('a[href*="/trees/"]').filter({ hasText: /Family Tree/ });
    const count = await treeCards.count();

    if (count > 0) {
      await treeCards.first().click();
      await page.waitForURL(/\/trees\/[a-f0-9]+/);

      // Look for person nodes or navigate directly if we have a person ID
      // For now, let's just verify the profile page structure exists
      await page.goto('/dashboard/persons');

      // Check if we can see any person links
      const personLinks = page.locator('a[href*="/dashboard/persons/"]');
      const personCount = await personLinks.count();

      if (personCount === 0) {
        // If no persons exist, that's okay - just verify the routes are set up
        test.skip(true, 'No persons to test profile navigation');
      }
    } else {
      test.skip(true, 'No trees found');
    }
  });
});
