import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Proxy endpoint to support autoplay and streaming of Google Drive videos of any size (>100MB virus scan bypass)
  app.get("/api/drive-stream", async (req, res) => {
    const fileId = req.query.id as string;
    if (!fileId) {
      return res.status(400).send("Missing file id");
    }

    const abortController = new AbortController();
    req.on('close', () => {
      abortController.abort();
    });

    try {
      const url = `https://drive.google.com/uc?export=download&id=${fileId}`;
      
      // First request: check if it redirects directly or serves the virus warning screen
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        redirect: 'manual',
        signal: abortController.signal
      });

      let redirectUrl = response.headers.get('location');
      
      // Safe parsing of Set-Cookie header
      let rawCookies: string[] = [];
      if (typeof response.headers.getSetCookie === 'function') {
        rawCookies = response.headers.getSetCookie();
      } else {
        const rawCookiesHeader = response.headers.get('set-cookie');
        rawCookies = rawCookiesHeader ? [rawCookiesHeader] : [];
      }

      // Extract only the NAME=VALUE pairs for sending in the Cookie request header
      const cookies = rawCookies.map(c => c.split(';')[0].trim());

      let videoStreamUrl = redirectUrl || url;
      let activeCookies = [...cookies];

      // Second request: Fetch the video stream URL to check if it's returning HTML (virus check page) or video bytes
      let videoResponse = await fetch(videoStreamUrl, {
        headers: {
          'Cookie': activeCookies.join('; '),
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        signal: abortController.signal
      });

      const contentType = videoResponse.headers.get('content-type') || '';

      if (contentType.includes('text/html')) {
        // It returned 200 OK with HTML (the Google virus warning screen for files > 100MB)
        const htmlText = await videoResponse.text();
        
        let confirmToken: string | null = null;
        // Try finding confirm token in URL query params
        const confirmMatchUrl = htmlText.match(/confirm=([a-zA-Z0-9_-]+)/);
        if (confirmMatchUrl) {
          confirmToken = confirmMatchUrl[1];
        } else {
          // Look for hidden input: name="confirm" value="t" or value="t" name="confirm"
          const confirmMatchInput = htmlText.match(/name="confirm"\s+value="([^"]+)"/) || 
                                    htmlText.match(/value="([^"]+)"\s+name="confirm"/);
          if (confirmMatchInput) {
            confirmToken = confirmMatchInput[1];
          }
        }

        // Fallback to 't' which is the universal Google Drive bypass token for large files
        if (!confirmToken) {
          confirmToken = 't';
        }

        // Build the final confirmed stream URL
        const streamUrlObj = new URL(videoStreamUrl);
        streamUrlObj.searchParams.set('confirm', confirmToken);
        const finalStreamUrl = streamUrlObj.toString();

        // Safe parsing of Set-Cookie header from the warning page response
        let newRawCookies: string[] = [];
        if (typeof videoResponse.headers.getSetCookie === 'function') {
          newRawCookies = videoResponse.headers.getSetCookie();
        } else {
          const rawConfirmCookies = videoResponse.headers.get('set-cookie');
          newRawCookies = rawConfirmCookies ? [rawConfirmCookies] : [];
        }
        const newCookies = newRawCookies.map(c => c.split(';')[0].trim());
        activeCookies = [...activeCookies, ...newCookies];

        // Fetch the final video stream, forwarding the Range header for range-requests
        const clientRange = req.headers.range;
        const fetchHeaders: Record<string, string> = {
          'Cookie': activeCookies.join('; '),
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        };

        if (clientRange) {
          fetchHeaders['Range'] = clientRange;
        }

        videoResponse = await fetch(finalStreamUrl, {
          headers: fetchHeaders,
          signal: abortController.signal
        });
      } else {
        // If the second request was already the video stream (not HTML), and the client requested a Range,
        // we should refetch it with the range header if it wasn't already included.
        const clientRange = req.headers.range;
        if (clientRange) {
          videoResponse = await fetch(videoStreamUrl, {
            headers: {
              'Cookie': activeCookies.join('; '),
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Range': clientRange
            },
            signal: abortController.signal
          });
        }
      }

      // Forward response status (e.g., 206 Partial Content or 200 OK)
      res.status(videoResponse.status);

      // Copy relevant media headers back to the browser
      const copyHeaders = [
        'content-type',
        'content-length',
        'content-range',
        'accept-ranges',
        'cache-control'
      ];

      copyHeaders.forEach(h => {
        const val = videoResponse.headers.get(h);
        if (val) {
          res.setHeader(h, val);
        }
      });

      if (!res.getHeader('content-type')) {
        res.setHeader('content-type', 'video/mp4');
      }
      if (!res.getHeader('accept-ranges')) {
        res.setHeader('accept-ranges', 'bytes');
      }

      // Stream the video bytes to the client
      const reader = videoResponse.body?.getReader();
      if (!reader) {
        return res.status(500).send("No body reader available");
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
      res.end();

    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Normal client cancellation/disconnection - exit gracefully
        return;
      }
      console.error("Error proxying Google Drive video stream:", error);
      if (!res.headersSent) {
        res.status(500).send("Error streaming Google Drive video");
      }
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
