const { Article, initDb } = require('./database');

async function clear() {
    await initDb();
    await Article.destroy({
        where: {},
        truncate: true
    });
    console.log('Database cleared.');
}

clear();
