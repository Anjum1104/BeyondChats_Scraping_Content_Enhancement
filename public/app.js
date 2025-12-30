document.addEventListener('DOMContentLoaded', () => {
    fetchArticles();

    // Modal logic
    const modal = document.getElementById('article-modal');
    const span = document.getElementsByClassName('close-modal')[0];

    span.onclick = function () {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Re-enable scrolling
    }

    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }
});

async function fetchArticles() {
    const grid = document.getElementById('articles-grid');
    try {
        const response = await fetch('/api/articles');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const articles = await response.json();

        grid.innerHTML = ''; // Clear loading

        if (articles.length === 0) {
            grid.innerHTML = '<p class="loading">No articles found.</p>';
            return;
        }

        articles.forEach(article => {
            const card = createArticleCard(article);
            grid.appendChild(card);
        });

    } catch (error) {
        console.error('Error fetching articles:', error);
        grid.innerHTML = `<p class="loading">Error loading articles: ${error.message}</p>`;
    }
}

function createArticleCard(article) {
    const div = document.createElement('div');
    div.className = 'article-card';

    // Create a temporary element to strip HTML tags for the excerpt
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = article.content || '';
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    const excerpt = textContent.slice(0, 150) + (textContent.length > 150 ? '...' : '');

    const statusClass = article.status === 'enhanced' ? 'status-enhanced' : 'status-scraped';

    div.innerHTML = `
        <div class="card-content">
            <div>
                <span class="article-status ${statusClass}">${article.status || 'scraped'}</span>
                <h2 class="article-title">${article.title}</h2>
                <div class="article-excerpt">${excerpt}</div>
            </div>
            <div class="card-actions">
                <a href="${article.url}" target="_blank" class="original-link">Original Source</a>
                <button class="read-more-btn" onclick="openModal(${article.id})">Read Full</button>
            </div>
        </div>
    `;
    return div;
}

async function openModal(id) {
    const modal = document.getElementById('article-modal');
    const modalBody = document.getElementById('modal-body');

    // Show loading in modal
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Disable background scrolling
    modalBody.innerHTML = '<p>Loading...</p>';

    try {
        // We can use the existing data if we stored it, but fetching fresh is also fine
        const response = await fetch(`/api/articles/${id}`);
        const article = await response.json();

        modalBody.innerHTML = `
            <h2>${article.title}</h2>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 2rem;">
                Status: ${article.status} | Updated: ${new Date(article.updatedAt).toLocaleDateString()}
            </p>
            <div class="article-body">
                ${article.content}
            </div>
        `;
    } catch (error) {
        modalBody.innerHTML = `<p>Error loading article details.</p>`;
    }
}
