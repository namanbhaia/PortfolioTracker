import { test, expect } from '@playwright/test';

test('take screenshots', async ({ page }) => {
  await page.goto('http://localhost:3000/test');
  await page.screenshot({ path: 'public/images/dashboard.png' });
  await page.screenshot({ path: 'public/images/consolidated.png' });

  await page.goto('http://localhost:3000/test/sales');
  await page.screenshot({ path: 'public/images/sales.png' });
});
