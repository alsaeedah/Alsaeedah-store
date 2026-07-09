const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('BROWSER ERROR:', msg.text());
        }
    });
    
    page.on('pageerror', error => {
        console.log('PAGE UNCAUGHT ERROR:', error.message);
    });

    try {
        await page.goto('http://localhost:5175', { waitUntil: 'networkidle', timeout: 10000 });
        console.log('Page loaded properly, waiting a bit for any delayed errors...');
        await page.waitForTimeout(3000); // give it time to crash
    } catch (e) {
        console.log("goto error:", e.message);
    }
    
    await browser.close();
})();
