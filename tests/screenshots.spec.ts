import { test, expect } from '@playwright/test';

/**
 * @file tests/screenshots.spec.ts
 * @description This Playwright test script is used to generate screenshots of the main application views.
 * It navigates to the test pages for the dashboard and sales views and captures screenshots to be used
 * in the README.md file.
 */
test('take screenshots', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.screenshot({ path: 'public/images/front-page.png' });
  await page.goto('http://localhost:3000/signup');
  await page.screenshot({ path: 'public/images/signup.png' });
  await page.goto('http://localhost:3000/login');
  await page.screenshot({ path: 'public/images/login.png' });
  await page.goto('http://localhost:3000/dashboard');
  await page.screenshot({ path: 'public/images/consolidated.png' });
  await page.goto('http://localhost:3000/dashboard/holdings');  
});
