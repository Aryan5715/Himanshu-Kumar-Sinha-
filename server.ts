import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Search YouTube for song query
  app.get("/api/search-song", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: "Missing query parameter 'q'" });
      }

      console.log(`Searching YouTube for: ${query}`);
      const ytData = await searchYouTube(query);
      if (ytData) {
        return res.json(ytData);
      } else {
        return res.status(404).json({ error: "Song not found on YouTube" });
      }
    } catch (e: any) {
      console.error("Error in /api/search-song:", e);
      return res.status(500).json({ error: e.message });
    }
  });

  // Serve static assets or mount Vite Developer Server Middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Scrapes youtube search results page to bypass API key restriction
async function searchYouTube(query: string): Promise<{ videoId: string; title: string } | null> {
  try {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query + " official lyric audio")}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    const html = await response.text();
    
    // Pattern 1: find videoId in YouTube initial data json
    let match = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
    let videoId = match ? match[1] : null;

    if (!videoId) {
      // Pattern 2: find videoId in watch URLs
      match = html.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);
      videoId = match ? match[1] : null;
    }

    if (!videoId) return null;

    // Retrieve corresponding video title if available
    let title = query;
    const titleMatch = html.match(/"title":\s*\{\s*"runs":\s*\[\s*\{\s*"text":\s*"([^"]+)"/);
    if (titleMatch) {
      title = titleMatch[1];
    }

    return { videoId, title };
  } catch (error) {
    console.error("YouTube Scraping Search Error:", error);
    return null;
  }
}

startServer();
