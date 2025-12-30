const axios = require('axios');
const cheerio = require('cheerio');

async function findLastPage() {
    try {
        const { data } = await axios.get('https://beyondchats.com/blogs/');
        const $ = cheerio.load(data);

        const pageLinks = [];
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            if (href && href.includes('/page/')) {
                pageLinks.push(href);
            }
        });

        console.log('Pagination links found:', pageLinks);

        // Try to find the max page number
        let maxPage = 1;
        pageLinks.forEach(link => {
            const match = link.match(/\/page\/(\d+)\/?/);
            if (match) {
                const pageNum = parseInt(match[1]);
                if (pageNum > maxPage) maxPage = pageNum;
            }
        });

        console.log('Max page found:', maxPage);
    } catch (err) {
        console.error(err);
    }
}

findLastPage();
