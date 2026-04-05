const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('https://chatzone-platform.fly.dev/register', { waitUntil: 'networkidle' });
  const bodyText = await page.textContent('body');
  console.log('Contains closure text:', bodyText.includes('التسجيل مغلق'));
  const inputCount = await page.locator('input').count();
  console.log('Input count:', inputCount);
  const inputs = await page.locator('input').evaluateAll(els => els.map(e => ({ type: e.type, placeholder: e.placeholder })));
  console.log('Inputs:', JSON.stringify(inputs));
  await browser.close();
})();
