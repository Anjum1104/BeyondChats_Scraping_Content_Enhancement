const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Article, initDb } = require('./database');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static('public'));

// Init DB
initDb();

// GET all articles
app.get('/api/articles', async (req, res) => {
    try {
        const articles = await Article.findAll();
        res.json(articles);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET one article
app.get('/api/articles/:id', async (req, res) => {
    try {
        const article = await Article.findByPk(req.params.id);
        if (!article) return res.status(404).json({ error: 'Article not found' });
        res.json(article);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST create article (Scraper will use this)
app.post('/api/articles', async (req, res) => {
    try {
        const article = await Article.create(req.body);
        res.status(201).json(article);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT update article (Enhancer will use this)
app.put('/api/articles/:id', async (req, res) => {
    try {
        const article = await Article.findByPk(req.params.id);
        if (!article) return res.status(404).json({ error: 'Article not found' });

        await article.update(req.body);
        res.json(article);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE article
app.delete('/api/articles/:id', async (req, res) => {
    try {
        const article = await Article.findByPk(req.params.id);
        if (!article) return res.status(404).json({ error: 'Article not found' });

        await article.destroy();
        res.json({ message: 'Article deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
