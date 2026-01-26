import { test, expect } from '@playwright/test';

/**
 * @file tests/screenshots.spec.ts
 * @description This Playwright test script is used to generate screenshots of the main application views.
 * It navigates to the test pages for the dashboard and sales views and captures screenshots to be used
 * in the README.md file.
 */
test('take screenshots', async ({ page }) => {
  await page.goto('http://localhost:3000/test');
  await page.screenshot({ path: 'public/images/dashboard.png' });
  await page.screenshot({ path: 'public/images/consolidated.png' });

  await page.goto('http://localhost:3000/test/sales');
  await page.screenshot({ path: 'public/images/sales.png' });
});
