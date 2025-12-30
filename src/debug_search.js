const puppeteer = require('puppeteer');

async function debugSearch() {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Set a standard User Agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');

    try {
        console.log('Navigating to Google...');
        await page.goto('https://www.google.com/search?q=test', { waitUntil: 'domcontentloaded' });

        console.log('Taking screenshot...');
        await page.screenshot({ path: 'google_search_debug.png' });

        // Debug selector
        const results = await page.evaluate(() => {
            const items = document.querySelectorAll('.g');
            return items.length;
        });

        console.log(`Found ${results} results with selector .g`);

        const content = await page.content();
        console.log(`Page content length: ${content.length}`);

    } catch (err) {
        console.error(err);
    } finally {
        await browser.close();
    }
}

debugSearch();
