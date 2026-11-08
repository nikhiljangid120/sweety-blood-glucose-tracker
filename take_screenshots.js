const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function capture() {
  console.log('🚀 Launching Chrome for automated screenshot capture...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    defaultViewport: { width: 1440, height: 920, deviceScaleFactor: 2 },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  try {
    // 1. Login Page
    console.log('📸 1. Capturing Login Page...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_login_page.png') });

    // 2. Obtain token from backend API directly
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo@sweety.app', password: 'Password123!' }),
    }).then((r) => r.json());

    if (!loginRes.success) {
      throw new Error(`Login failed: ${loginRes.error}`);
    }

    // Set localStorage token in browser
    await page.evaluate(({ token, user }) => {
      localStorage.setItem('sweety_token', token);
      localStorage.setItem('sweety_user', JSON.stringify(user));
    }, loginRes.data);

    // 3. Reload / navigate to Dashboard
    console.log('📸 2. Capturing Dashboard Overview & Trend Chart...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1500)); // allow Recharts animation to render
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_dashboard_overview.png') });

    // 4. Open Add Reading Modal
    console.log('📸 3. Opening Record Reading Form Modal...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find((b) => b.textContent.includes('Add Reading'));
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_reading_modal.png') });

    // Close modal
    await page.keyboard.press('Escape');
    await new Promise((r) => setTimeout(r, 500));

    // 5. Navigate to Reports via Navbar
    console.log('📸 4. Capturing Daily Clinical Report...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('nav button'));
      const rep = buttons.find((b) => b.textContent.includes('Reports'));
      if (rep) rep.click();
    });
    await new Promise((r) => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_reports_daily.png') });

    // 6. Click Monthly Report Tab
    console.log('📸 5. Capturing Monthly (Previous Month) Report...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const monthlyTab = buttons.find((b) => b.textContent.includes('Monthly Report'));
      if (monthlyTab) monthlyTab.click();
    });
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_reports_monthly.png') });

    console.log('🎉 Successfully captured 5 high-resolution screenshots!');
  } catch (err) {
    console.error('❌ Error during capture:', err);
  } finally {
    await browser.close();
  }
}

capture();
