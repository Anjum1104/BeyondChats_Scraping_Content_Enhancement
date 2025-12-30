require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const API_URL = 'http://localhost:3000/api/articles';
const ARTICLE_COUNT = 5; // Process 5 articles as per Phase 1 count, though we might want to just do one for testing.

// LLM Configuration (Defaulting to OpenAI format, but can be adapted)
const LLM_API_URL = 'https://api.openai.com/v1/chat/completions';
const LLM_API_KEY = process.env.LLM_API_KEY;

async function getArticles() {
    try {
        const { data } = await axios.get(API_URL);
        // Filter for articles that haven't been enhanced yet if we had a flag, 
        // but task says "Fetch the articles from API", implying all or the ones we just created.
        // We'll process valid ones (with titles).
        return data.filter(a => a.status === 'scraped');
    } catch (err) {
        console.error('Error fetching articles:', err.message);
        return [];
    }
}

async function searchGoogle(query) {
    console.log(`Searching DuckDuckGo for: "${query}"`);
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Use a real UA
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    try {
        // Use DuckDuckGo HTML version which is easier to scrape and has fewer blocks
        await page.goto(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, { waitUntil: 'domcontentloaded' });

        // Extract top 2 results
        const results = await page.evaluate(() => {
            const data = [];
            // DDG HTML selectors
            const elements = document.querySelectorAll('.result');
            for (const el of elements) {
                const linkEl = el.querySelector('.result__a'); // The title link
                if (linkEl) {
                    let href = linkEl.href;
                    const title = linkEl.innerText;

                    // Decrypt DDG redirect if present (uddg param)
                    if (href.includes('duckduckgo.com/l/') || href.includes('uddg=')) {
                        try {
                            const urlObj = new URL(href);
                            const uddg = urlObj.searchParams.get('uddg');
                            if (uddg) {
                                href = decodeURIComponent(uddg);
                            }
                        } catch (e) { }
                    }

                    if (href && !href.includes('duckduckgo.com')) {
                        data.push({
                            url: href,
                            title: title
                        });
                    }
                }
                if (data.length >= 2) break;
            }
            return data;
        });

        await browser.close();
        return results;
    } catch (err) {
        console.error('Error searching DuckDuckGo:', err.message);
        await browser.close();
        return [];
    }
}

async function scrapeContent(url) {
    try {
        console.log(`Scraping external: ${url}`);
        // Simple axios+cheerio for speed, fall back to puppeteer if needed?
        // Let's stick to axios for external blogs as they are likely static enough for text extraction.
        // If not, we could reuse puppeteer but it's slower.
        const { data } = await axios.get(url, { timeout: 10000 });
        const $ = cheerio.load(data);

        // Remove scripts, styles
        $('script').remove();
        $('style').remove();
        $('nav').remove();
        $('header').remove();
        $('footer').remove();

        // simplistic text extraction
        const text = $('body').text().replace(/\s+/g, ' ').trim();
        return text.substring(0, 3000); // Limit context size for LLM
    } catch (err) {
        console.error(`Failed to scrape ${url}:`, err.message);
        return "";
    }
}

async function callLLM(originalTitle, originalContent, referenceData) {
    if (!LLM_API_KEY) {
        console.warn('Skipping LLM call: No API Key provided.');
        return originalContent + '\n\n[System: LLM Key missing, content not rewritten.]';
    }

    const referencesText = referenceData.map((ref, i) =>
        `Source ${i + 1} (${ref.url}):\n${ref.content}`
    ).join('\n\n');

    const prompt = `
    You are an expert content editor.
    
    Original Article Title: ${originalTitle}
    Original Content:
    ${originalContent.substring(0, 2000)}...

    I have found 2 high-ranking articles on Google for the same topic:
    ${referencesText}

    Task:
    Rewrite and improve the original article. 
    1. Make it more comprehensive using insights from the 2 new sources.
    2. Improve formatting (use markdown headers, lists).
    3. Keep the tone professional and engaging.
    4. CRITICAL: At the very end, add a "References" section citing the 2 new sources with their URLs.
    
    Return ONLY the new article content in Markdown format.
    `;

    try {
        const response = await axios.post(LLM_API_URL, {
            model: "gpt-3.5-turbo", // Or gpt-4
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7
        }, {
            headers: {
                'Authorization': `Bearer ${LLM_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data.choices[0].message.content;
    } catch (err) {
        console.error('LLM Call failed:', err.response ? err.response.data : err.message);
        return originalContent + '\n\n[System: LLM call failed. Content unchanged.]';
    }
}

async function run() {
    const articles = await getArticles();
    console.log(`Found ${articles.length} articles to process.`);

    for (const article of articles) {
        console.log(`\nProcessing: ${article.title}`);

        // 1. Search Google
        const searchResults = await searchGoogle(article.title);
        if (searchResults.length === 0) {
            console.log('No search results found, skipping enhancement.');
            continue;
        }

        // 2. Scrape Top 2
        const references = [];
        for (const res of searchResults) {
            const content = await scrapeContent(res.url);
            if (content.length > 100) {
                references.push({ ...res, content });
            }
        }

        if (references.length === 0) {
            console.log('Could not scrape reference content, skipping.');
            continue;
        }

        // 3. Call LLM
        const newContent = await callLLM(article.title, article.content, references);

        // 4. Update Article
        try {
            await axios.put(`${API_URL}/${article.id}`, {
                content: newContent,
                status: 'enhanced'
            });
            console.log(`Successfully updated article ${article.id}`);
        } catch (err) {
            console.error(`Failed to update article ${article.id}:`, err.message);
        }
    }
}

run();
