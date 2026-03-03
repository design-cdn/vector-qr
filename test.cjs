const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('http://localhost:5173');

    // Test pasting URL
    await page.fill('.url-input', 'http://localhost:3000/');
    await page.click('.submit-button');

    // Wait for Result to generate
    await page.waitForSelector('.svg-container svg');

    // Take screenshot
    await page.screenshot({ path: '/Users/easyjunkie/Desktop/qr-to-vector/screenshot1.png' });

    console.log("Screenshot saved!");
    await browser.close();
})();
