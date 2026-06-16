import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: false }); // opens browser so you can log in
  const page = await browser.newPage();

  await page.goto('https://flo.qa.brandixlk.org/login');

  // Log in manually in the browser window that opens
  // Wait until you're fully logged in...
  await page.waitForTimeout(30000); // 30 seconds for you to log in

  // Save the session
  await page.context().storageState({ path: 'auth.json' });
  console.log('Session saved to auth.json');
  await browser.close();
})();