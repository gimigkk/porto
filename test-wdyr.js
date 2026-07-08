const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const logs = [];
  page.on('console', async msg => {
    const args = await Promise.all(msg.args().map(arg => arg.jsonValue().catch(() => arg.toString())));
    const text = args.join(' ');
    if (text.includes('SpotifyBackside') || text.includes('TooltipRenderer') || text.includes('ExperienceNode') || text.includes('HeroContent')) {
      logs.push(`[${msg.type()}] ${text}`);
    }
  });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  
  await page.evaluate(() => window.scrollBy(0, 1000));
  await page.waitForTimeout(2000); 
  
  await page.evaluate(() => window.scrollBy(0, 2000));
  await page.waitForTimeout(3000); 

  console.log("--- WDYR LOGS ---");
  console.log(logs.join('\n'));
  console.log("-----------------");

  await browser.close();
})();
