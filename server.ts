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
      // Direct download / streaming link
      const url = `https://drive.google.com/uc?export=download&id=${fileId}`;
      
      // Let fetch handle redirects natively (follow is the default)
      let response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        signal: abortController.signal
      });

      const contentType = response.headers.get('content-type') || '';
      const finalUrl = response.url;

      // Extract Set-Cookie header safely
      let rawCookies: string[] = [];
      if (typeof response.headers.getSetCookie === 'function') {
        rawCookies = response.headers.getSetCookie();
      } else {
        const rawCookiesHeader = response.headers.get('set-cookie');
        rawCookies = rawCookiesHeader ? [rawCookiesHeader] : [];
      }
      let activeCookies = rawCookies.map(c => c.split(';')[0].trim());

      // If it returned HTML, it is the virus scan warning screen (common for files > 100MB)
      if (contentType.includes('text/html')) {
        const htmlText = await response.text();
        
        let confirmToken: string | null = null;
        const confirmMatchUrl = htmlText.match(/confirm=([a-zA-Z0-9_-]+)/);
        if (confirmMatchUrl) {
          confirmToken = confirmMatchUrl[1];
        } else {
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

        // Build the bypass stream URL using the final redirected URL
        const streamUrlObj = new URL(finalUrl);
        streamUrlObj.searchParams.set('confirm', confirmToken);
        const confirmedStreamUrl = streamUrlObj.toString();

        // Safe parsing of any additional Set-Cookie headers from the warning page response
        let newRawCookies: string[] = [];
        if (typeof response.headers.getSetCookie === 'function') {
          newRawCookies = response.headers.getSetCookie();
        }
        const newCookies = newRawCookies.map(c => c.split(';')[0].trim());
        activeCookies = [...activeCookies, ...newCookies];

        // Fetch the confirmed stream, forwarding the Range header for range-requests
        const clientRange = req.headers.range;
        const fetchHeaders: Record<string, string> = {
          'Cookie': activeCookies.join('; '),
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        };

        if (clientRange) {
          fetchHeaders['Range'] = clientRange;
        }

        response = await fetch(confirmedStreamUrl, {
          headers: fetchHeaders,
          signal: abortController.signal
        });
      } else {
        // If the first response was already the video stream, check if range support is requested
        const clientRange = req.headers.range;
        if (clientRange && response.status !== 206) {
          const fetchHeaders: Record<string, string> = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Range': clientRange
          };
          if (activeCookies.length > 0) {
            fetchHeaders['Cookie'] = activeCookies.join('; ');
          }
          response = await fetch(finalUrl, {
            headers: fetchHeaders,
            signal: abortController.signal
          });
        }
      }

      // Forward response status
      res.status(response.status);

      // Copy relevant media headers back to the browser
      const copyHeaders = [
        'content-type',
        'content-length',
        'content-range',
        'accept-ranges',
        'cache-control'
      ];

      copyHeaders.forEach(h => {
        const val = response.headers.get(h);
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
      if (!response.body) {
        return res.status(500).send("No stream body available");
      }

      const { Readable, pipeline } = await import("stream");
      const readableStream = Readable.fromWeb(response.body as any);

      pipeline(readableStream, res, (err) => {
        if (err) {
          // Stream cancellation, abort on seek/disconnect, or network reset is normal for video chunking
          if (
            err.name === 'AbortError' || 
            (err as any).code === 'ERR_STREAM_PREMATURE_CLOSE' ||
            (err as any).code === 'ECONNRESET'
          ) {
            return;
          }
          console.warn("Stream pipeline completed with message:", err.message);
        }
      });

    } catch (error: any) {
      if (error.name === 'AbortError') {
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
