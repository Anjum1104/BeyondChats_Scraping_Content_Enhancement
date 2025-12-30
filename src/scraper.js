const axios = require('axios');
const cheerio = require('cheerio');

const API_URL = 'http://localhost:3000/api/articles';
const LAST_PAGE = 15;

async function fetchArticleLinks(page) {
    try {
        const url = `https://beyondchats.com/blogs/page/${page}/`;
        console.log(`Fetching list: ${url}`);
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        const links = [];
        // Depending on theme, titles might be in different tags. 
        // Generically looking for article headers inside the loop
        // Generic scraper for blog links
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            if (!href) return;

            // Check if it's a valid blog post link
            // 1. Must be from the same domain (relative or absolute)
            // 2. Must contain /blogs/
            // 3. Must NOT be an archive/tag/category/pagination page
            if (href.includes('/blogs/') &&
                !href.includes('/tag/') &&
                !href.includes('/category/') &&
                !href.includes('/page/') &&
                !href.includes('/author/') &&
                href !== 'https://beyondchats.com/blogs/' &&
                href !== '/blogs/') {

                // ensure absolute url
                let fullUrl = href;
                if (href.startsWith('/')) {
                    fullUrl = `https://beyondchats.com${href}`;
                }
                links.push(fullUrl);
            }
        });

        // Deduplicate
        return [...new Set(links)];
    } catch (err) {
        console.error(`Error fetching page ${page}:`, err.message);
        return [];
    }
}

async function scrapeArticle(url) {
    try {
        console.log(`Scraping article: ${url}`);
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        const title = $('h1').first().text().trim();
        // Try multiple selectors for content
        let content = $('.rich-text-block').html() || $('.entry-content').html() || $('article').html();

        if (!content) {
            console.warn(`No content found for ${url}`);
            content = "";
        }

        // Clean up content (optional, stripping scripts etc could be good)
        // For now, raw HTML is verification enough

        return {
            title,
            content,
            url,
            original_date: new Date() // Placeholder as date parsing is brittle
        };
    } catch (err) {
        console.error(`Error scraping article ${url}:`, err.message);
        return null;
    }
}

async function run() {
    let articlesToFetch = [];

    // 1. Get from Page 15 (Oldest)
    const links15 = await fetchArticleLinks(15);
    console.log(`Found ${links15.length} links on page 15`);
    // Reverse to get oldest first (if page order is new->old)
    // Actually, on a paginated blog, page 15 has the oldest articles.
    // Within page 15, usually top is newer than bottom? 
    // Wait, usually: Page 1 (Newest) ... Page 15 (Oldest).
    // On Page 15, the top article is the "newest of the old" and bottom is "oldest of the old".
    // So to get the *absolute oldest*, we want the *bottom* of Page 15.
    // Then work our way up.

    articlesToFetch.push(...links15.reverse());

    // 2. If needed, get from Page 14
    if (articlesToFetch.length < 5) {
        let links14 = await fetchArticleLinks(14);
        console.log(`Found ${links14.length} links on page 14`);
        links14 = links14.reverse(); // Bottom of page 14 is older than top of page 14 (but newer than page 15)
        articlesToFetch.push(...links14);
    }

    // Take first 5 (which are the 5 oldest)
    articlesToFetch = articlesToFetch.slice(0, 5);
    console.log(`Targeting articles:`, articlesToFetch);

    for (const link of articlesToFetch) {
        const articleData = await scrapeArticle(link);
        if (articleData) {
            try {
                await axios.post(API_URL, articleData);
                console.log(`Saved: ${articleData.title}`);
            } catch (err) {
                console.error(`Failed to save ${articleData.title}:`, err.message);
            }
        }
    }
}

run();
