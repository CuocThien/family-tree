/**
 * E2E Test: AddPerson Modal Fix
 *
 * This test verifies that the AddPerson modal does NOT auto-open
 * when viewing empty trees and can be properly closed.
 *
 * Prerequisites:
 * - Application must be running on http://localhost:3000
 * - User must be authenticated (login required)
 * - MongoDB connection must be available
 *
 * Run with:
 *   npx playwright test addperson-modal-fix.spec.ts --headed
 *
 * Or run with debug mode:
 *   npx playwright test addperson-modal-fix.spec.ts --debug
 */

import { test, expect } from '@playwright/test';

test.describe('AddPerson Modal - Fix Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to application
    await page.goto('http://localhost:3000');

    // Check if login is required
    const needsLogin = await page.getByText('Sign In').count() > 0;

    if (needsLogin) {
      test.skip(true, 'Authentication required - please login first');
    }
  });

  test('should NOT auto-open modal when viewing empty tree', async ({ page }) => {
    // TODO: Create or navigate to an empty tree
    // await page.goto('http://localhost:3000/dashboard/trees/new-empty-tree');

    // Verify modal is NOT present in DOM
    const modal = page.locator('text=Add New Member');
    await expect(modal).not.toBeVisible();

    // Verify "Add First Person" button is visible
    const addFirstButton = page.locator('text=Add First Person');
    await expect(addFirstButton).toBeVisible();

    // Take screenshot for verification
    await page.screenshot({ path: '.qc-reports/01-empty-tree-no-modal.png' });
  });

  test('should open modal when clicking "Add First Person" button', async ({ page }) => {
    // TODO: Navigate to empty tree
    // await page.goto('http://localhost:3000/dashboard/trees/new-empty-tree');

    // Click the "Add First Person" button
    await page.locator('text=Add First Person').click();

    // Verify modal is now visible
    const modal = page.locator('text=Add New Member');
    await expect(modal).toBeVisible();

    // Verify form fields are present
    await expect(page.locator('input[name="firstName"]')).toBeVisible();
    await expect(page.locator('input[name="lastName"]')).toBeVisible();

    // Take screenshot for verification
    await page.screenshot({ path: '.qc-reports/02-modal-opened.png' });
  });

  test('should close modal when clicking backdrop', async ({ page }) => {
    // TODO: Navigate to empty tree
    // await page.goto('http://localhost:3000/dashboard/trees/new-empty-tree');

    // Open modal
    await page.locator('text=Add First Person').click();

    // Wait for modal animation
    await page.waitForTimeout(300);

    // Click backdrop (the dark overlay)
    const backdrop = page.locator('.bg-background-dark\\/30');
    await backdrop.click();

    // Verify modal is closed
    const modal = page.locator('text=Add New Member');
    await expect(modal).not.toBeVisible();

    // Take screenshot for verification
    await page.screenshot({ path: '.qc-reports/03-modal-closed-backdrop.png' });
  });

  test('should close modal when clicking Cancel button', async ({ page }) => {
    // TODO: Navigate to empty tree
    // await page.goto('http://localhost:3000/dashboard/trees/new-empty-tree');

    // Open modal
    await page.locator('text=Add First Person').click();

    // Wait for modal animation
    await page.waitForTimeout(300);

    // Click Cancel button
    await page.locator('text=Cancel and Go Back').click();

    // Verify modal is closed
    const modal = page.locator('text=Add New Member');
    await expect(modal).not.toBeVisible();

    // Take screenshot for verification
    await page.screenshot({ path: '.qc-reports/04-modal-closed-cancel.png' });
  });

  test('should reopen modal after closing', async ({ page }) => {
    // TODO: Navigate to empty tree
    // await page.goto('http://localhost:3000/dashboard/trees/new-empty-tree');

    // Open modal
    await page.locator('text=Add First Person').click();
    await page.waitForTimeout(300);

    // Close modal
    await page.locator('text=Cancel and Go Back').click();
    await page.waitForTimeout(300);

    // Reopen modal
    await page.locator('text=Add First Person').click();
    await page.waitForTimeout(300);

    // Verify modal is open again
    const modal = page.locator('text=Add New Member');
    await expect(modal).toBeVisible();

    // Take screenshot for verification
    await page.screenshot({ path: '.qc-reports/05-modal-reopened.png' });
  });

  test('should close modal after successfully adding person', async ({ page }) => {
    // TODO: Navigate to empty tree
    // await page.goto('http://localhost:3000/dashboard/trees/new-empty-tree');

    // Open modal
    await page.locator('text=Add First Person').click();
    await page.waitForTimeout(300);

    // Fill out form
    await page.locator('input[name="firstName"]').fill('Test');
    await page.locator('input[name="lastName"]').fill('Person');

    // Select gender
    await page.locator('input[value="male"]').click();

    // Submit form
    await page.locator('text=Add to Family Tree').click();

    // Wait for submission
    await page.waitForTimeout(2000);

    // Verify modal is closed
    const modal = page.locator('text=Add New Member');
    await expect(modal).not.toBeVisible();

    // Take screenshot for verification
    await page.screenshot({ path: '.qc-reports/06-modal-closed-after-submit.png' });
  });

  test('should open Quick Add modal from populated tree', async ({ page }) => {
    // TODO: Navigate to a tree with existing members
    // await page.goto('http://localhost:3000/dashboard/trees/existing-tree');

    // Verify modal is NOT open initially
    const modal = page.locator('text=Add New Member');
    await expect(modal).not.toBeVisible();

    // Click "Quick Add" button in floating controls
    await page.locator('text=Quick Add').click();

    // Verify modal opens
    await expect(modal).toBeVisible();

    // Take screenshot for verification
    await page.screenshot({ path: '.qc-reports/07-quick-add-modal.png' });
  });

  test('should handle multiple open/close cycles', async ({ page }) => {
    // TODO: Navigate to empty tree
    // await page.goto('http://localhost:3000/dashboard/trees/new-empty-tree');

    // Cycle 1: Open and close via backdrop
    await page.locator('text=Add First Person').click();
    await page.waitForTimeout(300);
    await page.locator('.bg-background-dark\\/30').click();
    await page.waitForTimeout(300);

    // Cycle 2: Open and close via Cancel
    await page.locator('text=Add First Person').click();
    await page.waitForTimeout(300);
    await page.locator('text=Cancel and Go Back').click();
    await page.waitForTimeout(300);

    // Cycle 3: Open and close via X button
    await page.locator('text=Add First Person').click();
    await page.waitForTimeout(300);
    await page.locator('button').filter({ hasText: '' }).nth(1).click(); // X button
    await page.waitForTimeout(300);

    // Cycle 4: Open again to verify it still works
    await page.locator('text=Add First Person').click();
    await page.waitForTimeout(300);

    // Verify modal is still functional
    const modal = page.locator('text=Add New Member');
    await expect(modal).toBeVisible();

    // Take screenshot for verification
    await page.screenshot({ path: '.qc-reports/08-multiple-cycles.png' });
  });
});

/**
 * Helper function to navigate to an empty tree
 * TODO: Implement based on your application's routing
 */
async function navigateToEmptyTree(page: any) {
  // Example: Create a new tree
  // await page.click('text=Create New Tree');
  // await page.fill('input[name="treeName"]', 'Test Tree');
  // await page.click('button[type="submit"]');
  // await page.waitForURL(/\/dashboard\/trees\/[a-z0-9]+/);
}

/**
 * Helper function to navigate to a populated tree
 * TODO: Implement based on your application's routing
 */
async function navigateToPopulatedTree(page: any) {
  // Example: Select from existing trees
  // await page.click('text=My Trees');
  // await page.click('.tree-card:first-child');
  // await page.waitForURL(/\/dashboard\/trees\/[a-z0-9]+/);
}
