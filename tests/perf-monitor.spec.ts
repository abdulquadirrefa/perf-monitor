import 'dotenv/config';
import { test, expect, chromium } from '@playwright/test';
import { sendEmail, PageResult } from '../utils/mailer';
import * as fs from 'fs';

const THRESHOLD_MS = Number(process.env.SLOW_THRESHOLD_MS) || 3000;

const PAGES = [
  { name: process.env.PAGE_4_NAME || 'Page 1', url: process.env.PAGE_4_URL || '' },
  { name: process.env.PAGE_5_NAME || 'Page 2', url: process.env.PAGE_5_URL || '' },
  { name: process.env.PAGE_6_NAME || 'Page 3', url: process.env.PAGE_6_URL || '' },
].filter(p => p.url);

const results: PageResult[] = [];

test.describe('Performance Monitor', () => {

  // Login once and save session before all tests
  // test.beforeAll(async () => {
  //   const browser = await chromium.launch({ headless: true });
  //   const context = await browser.newContext();
  //   const page = await context.newPage();

  //   await page.goto('https://flo.uat.brandixlk.org/', { timeout: 60000 });
  //   await page.fill('#username', process.env.APP_USER ?? '');
  //   await page.fill('#password', process.env.APP_PASS ?? '');
  //   await page.click('#kc-login');
  //   await expect(page.getByText('Select Plant')).toBeVisible({ timeout: 20000 });

  //   await context.storageState({ path: 'auth.json' });
  //   await browser.close();
  // });

 for (const { name, url } of PAGES) {
  test(`Check: ${name}`, async ({ browser }) => {

    const context = await browser.newContext();
    const page = await context.newPage();

    console.log(`\n[${name}] Checking → ${url}`);

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(1000);

      const metrics = await page.evaluate(() => {
        const t = performance.timing;
        return {
          ttfb:       t.responseStart - t.requestStart,
          domLoad:    t.domContentLoadedEventEnd - t.navigationStart,
          fullLoad:   t.loadEventEnd - t.navigationStart,
          dnsLookup:  t.domainLookupEnd - t.domainLookupStart,
          tcpConnect: t.connectEnd - t.connectStart,
        };
      });

      const isSlow    = metrics.fullLoad > THRESHOLD_MS;
      const checkedAt = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Colombo' });

      console.log(`[${name}] Full Load : ${metrics.fullLoad}ms`);
      console.log(`[${name}] TTFB      : ${metrics.ttfb}ms`);
      console.log(`[${name}] Status    : ${isSlow ? '⚠️  SLOW' : '✅ OK'}`);

      results.push({ name, url, metrics, isSlow, threshold: THRESHOLD_MS, checkedAt });

    } catch (e) {
      // Page failed to load — report it as slow/error so email still goes out
      console.log(`[${name}] ERROR: ${e}`);
      results.push({
        name,
        url,
        metrics: { ttfb: 0, domLoad: 0, fullLoad: 0, dnsLookup: 0, tcpConnect: 0 },
        isSlow: true,
        threshold: THRESHOLD_MS,
        checkedAt: new Date().toLocaleString('en-GB', { timeZone: 'Asia/Colombo' }),
      });
    } finally {
      await context.close();
    }
  });
}
 test.afterAll(async () => {
  if (results.length > 0) {
    try {
      await sendEmail(results);
    } catch (e) {
      console.error('[Email] Failed to send email:', e);
      // Don't let email failure affect test results
    }
  }
  if (fs.existsSync('auth.json')) fs.unlinkSync('auth.json');
});

});