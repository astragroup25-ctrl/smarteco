const { chromium } = require('playwright-core');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\User\\.gemini\\antigravity\\brain\\7139445c-993d-4b19-9e5a-ac8cef4efcf7';

async function screenshot(page, url, filename) {
  console.log(`Navigating to ${url}...`);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {
    console.log(`networkidle timed out for ${url}, taking screenshot anyway`);
  });
  // Wait a bit for rendering
  await page.waitForTimeout(2000);
  const outPath = path.join(ARTIFACT_DIR, filename);
  await page.screenshot({ path: outPath, fullPage: false });
  console.log(`Screenshot saved: ${outPath}`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    ignoreHTTPSErrors: true,
    userAgent: 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 Chrome/90 Mobile Safari/537.36'
  });
  const page = await context.newPage();

  await screenshot(page, 'http://localhost:3000/forfaits', 'forfaits_375.png');
  await screenshot(page, 'http://localhost:3000/paiement?forfait=test', 'paiement_375.png');

  await browser.close();
  console.log('Done.');
})();
