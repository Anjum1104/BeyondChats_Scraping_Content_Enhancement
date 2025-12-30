# BeyondChats Article Scraper & Enhancer

This project is a full-stack Node.js application designed to scrape articles from BeyondChats, store them in a local SQLite database, and enhance their content using an LLM (Large Language Model). It features a polished, dark-mode frontend for viewing the articles.

[LIVE Frontend Preview](https://beyondchats-articles.onrender.com) 


## Features

- **Web Scraping**: Automatically scrapes the oldest articles from the BeyondChats blog using Puppeteer.
- **Content Enhancement**: Fetches related content from Google Search and uses an LLM to rewrite and improve the articles.
- **REST API**: Provides a robust API for scraping, retrieving, updating, and deleting articles.
- **Premium Frontend**: A responsive, dark-themed web interface to browse and read articles.
- **Persistent Storage**: Uses SQLite with Sequelize for reliable local data management.

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: SQLite, Sequelize ORM
- **Scraping**: Puppeteer, Cheerio
- **Frontend**: HTML5, CSS3 (Variables, Flexbox/Grid), Vanilla JavaScript
- **Utilities**: Axios, Dotenv, CORS

## Prerequisites

- Node.js (v18 or higher recommended)
- npm (Node Package Manager)

## Setup & Installation

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/Anjum1104/BeyondChats_Scraping_Content_Enhancement.git
    cd BeyondChats_Scraping_Content_Enhancement
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Environment Configuration**
    Create a `.env` file in the root directory based on `.env.example`:
    ```bash
    cp .env.example .env
    ```
    Open `.env` and add your LLM API Key:
    ```
    LLM_API_KEY=your_actual_api_key_here
    ```

4.  **Start the Server**
    ```bash
    npm start
    ```
    The server will start on `http://localhost:3000`.

## API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/articles` | Retrieve all articles |
| `GET` | `/api/articles/:id` | Retrieve a specific article |
| `POST` | `/api/articles` | Create a new article (from scraper) |
| `PUT` | `/api/articles/:id` | Update an article (from enhancer) |
| `DELETE` | `/api/articles/:id` | Delete an article |

## Deployment (Render)

This project is configured for easy deployment on [Render](https://render.com).

1.  Push your code to a GitHub repository.
2.  Log in to Render and create a new **Web Service**.
3.  Connect your GitHub repository.
4.  Render will automatically detect the `render.yaml` file (if you choose "Blueprint") or you can configure it manually:
    -   **Build Command**: `npm install`
    -   **Start Command**: `npm start`
5.  **Important**: Add your `LLM_API_KEY` in the Environment Variables section of the Render dashboard.

## Project Structure

```
├── public/             # Static frontend files (HTML, CSS, JS)
├── src/
│   ├── database.js     # Database connection and model definitions
│   ├── server.js       # Express server entry point
│   ├── scraper.js      # Logic for scraping BeyondChats
│   ├── enhancer.js     # Logic for enhancing content via LLM
│   └── ...
├── .env                # Environment variables (do not commit)
├── render.yaml         # Render deployment configuration
└── package.json        # Project dependencies and scripts
```

## License

ISC
