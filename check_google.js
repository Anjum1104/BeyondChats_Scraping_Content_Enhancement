const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function run() {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    // Use a real UA
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    try {
        console.log('Navigating...');
        await page.goto('https://www.google.com/search?q=test', { waitUntil: 'domcontentloaded' });

        const content = await page.content();
        console.log('Page content length:', content.length);

        const fs = require('fs');
        fs.writeFileSync('google_dump.html', content);
        console.log('Dumped to google_dump.html');

    } catch (err) {
        console.error(err);
    } finally {
        await browser.close();
    }
}

run();
