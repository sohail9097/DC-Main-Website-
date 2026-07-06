import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";
import fs from "fs";
import multer from "multer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Ensure uploads directory exists at root level
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Serve uploads using high-performance, range-request compliant res.sendFile
  app.get("/uploads/:filename", (req, res) => {
    const filename = req.params.filename;
    // Sanitize path to prevent directory traversal
    const safeFilename = path.basename(filename);
    const filePath = path.join(uploadsDir, safeFilename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).send("File not found");
    }

    // res.sendFile natively handles Range requests (206), Content-Type mapping, Accept-Ranges, and chunking!
    res.sendFile(filePath);
  });

  // Serve uploads statically as a fallback
  app.use("/uploads", express.static(uploadsDir));

  // Configure multer storage for secure video uploads
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, file.fieldname + "-" + uniqueSuffix + ext);
    }
  });

  const upload = multer({
    storage,
    limits: {
      fileSize: 150 * 1024 * 1024 // 150MB limit
    }
  });

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Upload a local video file with custom error handling to ensure JSON is always returned
  app.post("/api/upload-video", (req, res) => {
    upload.single("video")(req, res, (err) => {
      if (err) {
        let errMsg = "Upload failed";
        if (err instanceof multer.MulterError) {
          errMsg = `Multer error: ${err.message}`;
          if (err.code === "LIMIT_FILE_SIZE") {
            errMsg = "File size limit exceeded. Max limit is 150MB.";
          }
        } else if (err instanceof Error) {
          errMsg = err.message;
        }
        return res.status(400).json({ error: errMsg });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No video file selected or uploaded" });
      }

      const videoUrl = `/uploads/${req.file.filename}`;
      res.json({
        url: videoUrl,
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size
      });
    });
  });

  // Upload video chunk for chunked uploads (bypasses proxy/ingress body size limits)
  app.post("/api/upload-video-chunk", (req, res) => {
    upload.single("chunk")(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message || "Chunk upload failed" });
      }

      const { uploadId, chunkIndex, totalChunks, filename } = req.body;
      if (!req.file) {
        return res.status(400).json({ error: "No chunk file received" });
      }
      if (!uploadId || chunkIndex === undefined) {
        // clean up uploaded file
        if (req.file.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({ error: "Missing uploadId or chunkIndex" });
      }

      // Create unique temp directory for this upload
      const tempDirName = `temp-${uploadId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
      const chunkTempDir = path.join(uploadsDir, tempDirName);
      if (!fs.existsSync(chunkTempDir)) {
        fs.mkdirSync(chunkTempDir, { recursive: true });
      }

      // Move chunk to its spot
      const chunkPath = path.join(chunkTempDir, `chunk-${chunkIndex}`);
      try {
        if (fs.existsSync(chunkPath)) {
          fs.unlinkSync(chunkPath);
        }
        fs.renameSync(req.file.path, chunkPath);
        res.json({ success: true, chunkIndex: parseInt(chunkIndex, 10) });
      } catch (err: any) {
        // clean up uploaded file if rename fails
        if (req.file.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: `Failed to save chunk: ${err.message}` });
      }
    });
  });

  // Assemble video chunks into the final video file
  app.post("/api/upload-video-assemble", express.json(), (req, res) => {
    const { uploadId, filename, totalChunks } = req.body;
    if (!uploadId || !filename || !totalChunks) {
      return res.status(400).json({ error: "Missing uploadId, filename, or totalChunks" });
    }

    const tempDirName = `temp-${uploadId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
    const chunkTempDir = path.join(uploadsDir, tempDirName);

    if (!fs.existsSync(chunkTempDir)) {
      return res.status(404).json({ error: "Upload session not found or chunks missing" });
    }

    const total = parseInt(totalChunks, 10);
    const sanitizedExt = path.extname(filename) || ".mp4";
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const finalFilename = `video-${uniqueSuffix}${sanitizedExt}`;
    const finalPath = path.join(uploadsDir, finalFilename);

    const writeStream = fs.createWriteStream(finalPath);
    let currentChunk = 0;

    function appendNextChunk() {
      if (currentChunk >= total) {
        writeStream.end();
        return;
      }

      const chunkPath = path.join(chunkTempDir, `chunk-${currentChunk}`);
      if (!fs.existsSync(chunkPath)) {
        writeStream.destroy(new Error(`Chunk ${currentChunk} is missing`));
        return;
      }

      const readStream = fs.createReadStream(chunkPath);
      readStream.pipe(writeStream, { end: false });

      readStream.on("end", () => {
        currentChunk++;
        appendNextChunk();
      });

      readStream.on("error", (err) => {
        writeStream.destroy(err);
      });
    }

    writeStream.on("finish", () => {
      // Clean up temp directory
      try {
        const files = fs.readdirSync(chunkTempDir);
        files.forEach(file => fs.unlinkSync(path.join(chunkTempDir, file)));
        fs.rmdirSync(chunkTempDir);
      } catch (err) {
        console.warn("Could not clean up temp upload directory:", err);
      }

      const stats = fs.statSync(finalPath);
      res.json({
        url: `/uploads/${finalFilename}`,
        filename: finalFilename,
        originalname: filename,
        size: stats.size
      });
    });

    writeStream.on("error", (err: any) => {
      if (fs.existsSync(finalPath)) {
        fs.unlinkSync(finalPath);
      }
      res.status(500).json({ error: `Assembly failed: ${err.message}` });
    });

    appendNextChunk();
  });

  // Get list of uploaded local videos
  app.get("/api/uploaded-videos", (req, res) => {
    try {
      if (!fs.existsSync(uploadsDir)) {
        return res.json([]);
      }
      const files = fs.readdirSync(uploadsDir);
      const videos = files
        .filter(file => {
          const filePath = path.join(uploadsDir, file);
          try {
            const stat = fs.statSync(filePath);
            return stat.isFile() && /\.(mp4|webm|ogg|mov|m4v)$/i.test(file);
          } catch (e) {
            return false;
          }
        })
        .map(file => {
          const filePath = path.join(uploadsDir, file);
          const stats = fs.statSync(filePath);
          return {
            filename: file,
            url: `/uploads/${file}`,
            size: stats.size,
            createdAt: stats.birthtime
          };
        })
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      res.json(videos);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete an uploaded video securely
  app.delete("/api/uploaded-videos/:filename", (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, path.basename(filename));
    
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "File not found" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Proxy endpoint to support autoplay and streaming of Google Drive videos of any size (>100MB virus scan bypass) with high-performance direct redirection
  app.get("/api/drive-stream", async (req, res) => {
    const fileId = req.query.id as string;
    if (!fileId) {
      return res.status(400).send("Missing file id");
    }

    try {
      // Direct download / streaming link
      const url = `https://drive.google.com/uc?export=download&id=${fileId}`;
      
      // Let's do a quick check on our server side to see if there is a virus scan confirmation bypass needed
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      const contentType = response.headers.get('content-type') || '';
      const finalUrl = response.url;

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

        if (confirmToken) {
          // Build the bypass stream URL using the final redirected URL
          const streamUrlObj = new URL(finalUrl);
          streamUrlObj.searchParams.set('confirm', confirmToken);
          
          // 302 redirect browser to stream directly from Google's high-performance CDN with the bypass token
          return res.redirect(302, streamUrlObj.toString());
        }
      }

      // Already direct video stream/redirect. Redirect browser to get native range request support from Google's CDN
      return res.redirect(302, finalUrl);

    } catch (error: any) {
      console.error("Error redirecting Google Drive video stream:", error);
      // Failover redirect directly to UC download link which allows the client to resolve it
      return res.redirect(302, `https://drive.google.com/uc?export=download&id=${fileId}`);
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
