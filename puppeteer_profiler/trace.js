const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  console.log('Setting mobile viewport and CPU throttling...');
  await page.emulate(puppeteer.KnownDevices['iPhone 13 Pro']);

  const client = await page.target().createCDPSession();
  await client.send('Emulation.setCPUThrottlingRate', { rate: 6 });

  console.log('Loading http://localhost:3333 ...');
  await page.goto('http://localhost:3333', { waitUntil: 'networkidle2', timeout: 60000 });

  // Wait extra for loading screen to finish and canvas to start
  console.log('Waiting 5s for loading screen to complete...');
  await new Promise(r => setTimeout(r, 5000));

  console.log('Starting trace...');
  await page.tracing.start({ path: 'trace.json', screenshots: false, categories: [
    'devtools.timeline',
    'v8.execute',
    'disabled-by-default-devtools.timeline',
    'disabled-by-default-devtools.timeline.frame',
  ]});

  // Small settle time
  await new Promise(r => setTimeout(r, 500));

  console.log('Clicking hamburger menu...');
  // Try multiple selectors to find the hamburger
  const clicked = await page.evaluate(() => {
    // Look for nav buttons with SVG (hamburger icons)
    const nav = document.querySelector('nav');
    if (!nav) return 'no nav found';
    
    const buttons = nav.querySelectorAll('button');
    for (const b of buttons) {
      const svg = b.querySelector('svg');
      // Hamburger is typically the last button or one with Menu/AlignJustify icon
      const rect = b.getBoundingClientRect();
      // Skip tiny buttons, look for ones on the right side (hamburger position)
      if (svg && rect.width > 20 && rect.x > window.innerWidth / 2) {
        b.click();
        return `clicked button at x=${rect.x}, y=${rect.y}, w=${rect.width}`;
      }
    }
    
    // Fallback: click any button in nav
    if (buttons.length > 0) {
      const last = buttons[buttons.length - 1];
      last.click();
      return `fallback: clicked last nav button`;
    }
    return 'no buttons found';
  });
  console.log('Click result:', clicked);

  console.log('Waiting 2s for animation to complete...');
  await new Promise(r => setTimeout(r, 2000));

  console.log('Stopping trace...');
  await page.tracing.stop();
  await browser.close();

  console.log('\nAnalyzing trace...');
  const trace = JSON.parse(fs.readFileSync('trace.json', 'utf8'));
  const events = trace.traceEvents;

  // Find main thread
  let mainThreadId = null;
  for (const e of events) {
    if (e.name === 'thread_name' && e.args && e.args.name === 'CrRendererMain') {
      mainThreadId = e.tid;
      break;
    }
  }

  if (!mainThreadId) {
    // Fallback: find thread with most events
    const threadCounts = {};
    for (const e of events) {
      if (e.tid) threadCounts[e.tid] = (threadCounts[e.tid] || 0) + 1;
    }
    mainThreadId = parseInt(Object.entries(threadCounts).sort((a, b) => b[1] - a[1])[0][0]);
    console.log(`Main thread not explicitly found, using busiest thread: ${mainThreadId}`);
  } else {
    console.log(`Found main thread: ${mainThreadId}`);
  }

  // Get all complete events (X = complete, with duration)
  const mainEvents = events.filter(e => e.tid === mainThreadId && e.ph === 'X' && e.dur > 0);

  // Find long tasks (> 16ms = dropped frame)
  const longTasks = mainEvents.filter(e => e.dur > 16000);
  longTasks.sort((a, b) => b.dur - a.dur);

  console.log('\n==================================');
  console.log('TOP LONG TASKS (> 16ms, i.e. dropped frames):');
  console.log('==================================\n');

  if (longTasks.length === 0) {
    console.log("No long tasks found on main thread.");
  } else {
    for (let i = 0; i < Math.min(30, longTasks.length); i++) {
      const e = longTasks[i];
      const ms = (e.dur / 1000).toFixed(2);
      let detail = '';
      if (e.args && e.args.data) {
        const d = e.args.data;
        if (d.functionName) detail += ` fn=${d.functionName}`;
        if (d.url) detail += ` url=${d.url.split('/').pop()}`;
        if (d.scriptName) detail += ` script=${d.scriptName.split('/').pop()}`;
        if (d.type) detail += ` type=${d.type}`;
        if (d.elementCount) detail += ` elements=${d.elementCount}`;
        if (d.stackTrace) {
          const top = d.stackTrace[0];
          if (top) detail += ` at=${top.functionName || 'anon'}(${(top.url || '').split('/').pop()}:${top.lineNumber})`;
        }
      }
      console.log(`  ${ms} ms  ${e.name}${detail}`);
    }
  }

  // Category breakdown
  console.log('\n==================================');
  console.log('CATEGORY BREAKDOWN (all main thread time):');
  console.log('==================================\n');

  const categories = {};
  for (const e of mainEvents) {
    const cat = e.cat || 'unknown';
    const name = e.name;
    const key = name;
    if (!categories[key]) categories[key] = { total: 0, count: 0 };
    categories[key].total += e.dur;
    categories[key].count++;
  }

  const sorted = Object.entries(categories).sort((a, b) => b[1].total - a[1].total);
  for (let i = 0; i < Math.min(25, sorted.length); i++) {
    const [name, data] = sorted[i];
    console.log(`  ${(data.total / 1000).toFixed(2)} ms  (${data.count}x)  ${name}`);
  }

  console.log('\n==================================');
  console.log('LAYOUT/STYLE RECALCS (Performance killers):');
  console.log('==================================\n');

  const layoutEvents = mainEvents.filter(e => 
    ['Layout', 'RecalculateStyles', 'UpdateLayoutTree', 'InvalidateLayout', 'ScheduleStyleRecalculation'].includes(e.name)
  );
  layoutEvents.sort((a, b) => b.dur - a.dur);

  for (let i = 0; i < Math.min(15, layoutEvents.length); i++) {
    const e = layoutEvents[i];
    const ms = (e.dur / 1000).toFixed(2);
    let detail = '';
    if (e.args && e.args.data) {
      if (e.args.data.elementCount) detail += ` elements=${e.args.data.elementCount}`;
      if (e.args.data.stackTrace) {
        const top = e.args.data.stackTrace[0];
        if (top) detail += ` triggered_by=${top.functionName || 'anon'}(${(top.url || '').split('/').pop()}:${top.lineNumber})`;
      }
    }
    console.log(`  ${ms} ms  ${e.name}${detail}`);
  }

  console.log('\nDone!');
})();
