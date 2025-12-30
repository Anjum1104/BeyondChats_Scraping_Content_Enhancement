const axios = require('axios');
const cheerio = require('cheerio');

async function debugLinks() {
    try {
        const url = 'https://beyondchats.com/blogs/page/15/';
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        console.log('--- All Links ---');
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            console.log(href);
        });
    } catch (err) {
        console.error(err);
    }
}

debugLinks();
