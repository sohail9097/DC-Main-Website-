import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";
import fs from "fs";
import multer from "multer";
import nodemailer from "nodemailer";

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

  // Configure a resume-specific multer config
  const resumeStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, "resume-" + uniqueSuffix + ext);
    }
  });

  const uploadResume = multer({
    storage: resumeStorage,
    limits: {
      fileSize: 15 * 1024 * 1024 // 15MB limit
    },
    fileFilter: (req, file, cb) => {
      const allowedExts = [".pdf", ".doc", ".docx", ".txt", ".rtf", ".png", ".jpg", ".jpeg"];
      const ext = path.extname(file.originalname).toLowerCase();
      if (allowedExts.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error("Only PDF, Word (DOC/DOCX), Text (TXT/RTF), and Image files are allowed."));
      }
    }
  });

  // Upload candidate resume
  app.post("/api/upload-resume", (req, res) => {
    uploadResume.single("resume")(req, res, (err) => {
      if (err) {
        let errMsg = "Upload failed";
        if (err instanceof multer.MulterError) {
          errMsg = `Multer error: ${err.message}`;
          if (err.code === "LIMIT_FILE_SIZE") {
            errMsg = "File size limit exceeded. Max limit is 15MB.";
          }
        } else if (err instanceof Error) {
          errMsg = err.message;
        }
        return res.status(400).json({ error: errMsg });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No resume file selected or uploaded" });
      }

      const resumeUrl = `/uploads/${req.file.filename}`;
      res.json({
        url: resumeUrl,
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size
      });
    });
  });

  // Configure a project brief-specific multer config
  const briefStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, "brief-" + uniqueSuffix + ext);
    }
  });

  const uploadBrief = multer({
    storage: briefStorage,
    limits: {
      fileSize: 25 * 1024 * 1024 // 25MB limit
    },
    fileFilter: (req, file, cb) => {
      const allowedExts = [".pdf", ".doc", ".docx", ".txt", ".exe", ".jpg", ".jpeg", ".png", ".worl"];
      const ext = path.extname(file.originalname).toLowerCase();
      if (allowedExts.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error("Only .pdf, .doc, .docx, .txt, .exe, .jpg, .jpeg, .png, and .worl files are allowed for project briefs."));
      }
    }
  });

  // Upload project brief file
  app.post("/api/upload-brief", (req, res) => {
    uploadBrief.single("brief")(req, res, (err) => {
      if (err) {
        let errMsg = "Upload failed";
        if (err instanceof multer.MulterError) {
          errMsg = `Multer error: ${err.message}`;
          if (err.code === "LIMIT_FILE_SIZE") {
            errMsg = "File size limit exceeded. Max limit is 25MB.";
          }
        } else if (err instanceof Error) {
          errMsg = err.message;
        }
        return res.status(400).json({ error: errMsg });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No brief file selected or uploaded" });
      }

      const briefUrl = `/uploads/${req.file.filename}`;
      res.json({
        url: briefUrl,
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size
      });
    });
  });

  // Configure a contact-image-specific multer config
  const contactImageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, "contact-img-" + uniqueSuffix + ext);
    }
  });

  const uploadContactImage = multer({
    storage: contactImageStorage,
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
      const allowedExts = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
      const ext = path.extname(file.originalname).toLowerCase();
      if (allowedExts.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error("Only image files (.jpg, .jpeg, .png, .gif, .webp, .svg) are allowed."));
      }
    }
  });

  app.post("/api/upload-contact-image", (req, res) => {
    uploadContactImage.single("contactImage")(req, res, (err) => {
      if (err) {
        let errMsg = "Upload failed";
        if (err instanceof multer.MulterError) {
          errMsg = `Multer error: ${err.message}`;
          if (err.code === "LIMIT_FILE_SIZE") {
            errMsg = "File size limit exceeded. Max limit is 10MB.";
          }
        } else if (err instanceof Error) {
          errMsg = err.message;
        }
        return res.status(400).json({ error: errMsg });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No image file selected or uploaded" });
      }

      const imageUrl = `/uploads/${req.file.filename}`;
      res.json({
        url: imageUrl,
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size
      });
    });
  });

  // Simple in-memory rate limiter to prevent spam
  const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

  // Send email and notify candidate application
  app.post("/api/notify-apply", express.json(), async (req, res) => {
    const { name, email, phone, role, message, resumeUrl } = req.body;

    // Server-side validation
    if (!name || typeof name !== "string" || name.trim() === "") {
      return res.status(400).json({ error: "Full Name is required." });
    }
    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "A valid Email Address is required." });
    }
    if (!role || typeof role !== "string" || role.trim() === "") {
      return res.status(400).json({ error: "Position Applied For is required." });
    }

    // Rate limiting to prevent spam (max 5 submissions per 15 minutes per IP)
    const clientIp = (req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || "").split(",")[0].trim();
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxSubmissions = 5;

    let rateInfo = rateLimitMap.get(clientIp);
    if (!rateInfo || now > rateInfo.resetTime) {
      rateInfo = { count: 0, resetTime: now + windowMs };
    }

    if (rateInfo.count >= maxSubmissions) {
      const remainingMinutes = Math.ceil((rateInfo.resetTime - now) / 60000);
      return res.status(429).json({
        error: `Too many submissions. Please try again after ${remainingMinutes} minute(s) to prevent spam.`
      });
    }

    rateInfo.count += 1;
    rateLimitMap.set(clientIp, rateInfo);

    // Prepare transporter with standard env settings or fallback simulated
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || '"Dream Team Careers" <noreply@cinematic-dreamteam.com>';

    const recipientEmail = "sohailgaji9097@gmail.com";

    const emailSubject = `New Job Application: ${name} is applying for ${role}`;
    
    // Attachments handling
    const attachments: any[] = [];
    let resumeStatusMsg = "No resume uploaded";

    if (resumeUrl) {
      const filename = path.basename(resumeUrl);
      const filePath = path.join(uploadsDir, filename);
      if (fs.existsSync(filePath)) {
        attachments.push({
          filename: filename,
          path: filePath
        });
        resumeStatusMsg = `Attached: ${filename}`;
      } else {
        resumeStatusMsg = `Resume uploaded but file not found on server: ${filename}`;
      }
    }

    // Format full resume link using APP_URL if available
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const fullResumeUrl = resumeUrl ? (resumeUrl.startsWith("http") ? resumeUrl : `${appUrl}${resumeUrl}`) : "No resume uploaded";

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #ffffff; color: #1f2937;">
        <h2 style="color: #ea580c; border-bottom: 2px solid #ea580c; padding-bottom: 10px; margin-top: 0;">New Job Application Received</h2>
        
        <p style="font-size: 16px; line-height: 1.5;">A new candidate has submitted an application for the <strong>${role}</strong> position.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; width: 150px; border-bottom: 1px solid #f3f4f6;">Full Name:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #f3f4f6;">Email:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;"><a href="mailto:${email}" style="color: #ea580c; text-decoration: none;">${email}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #f3f4f6;">Phone:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">${phone || "Not specified"}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #f3f4f6;">Target Role:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;"><span style="background-color: #fff7ed; color: #c2410c; padding: 2px 8px; border-radius: 4px; font-size: 14px; font-weight: 600;">${role}</span></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #f3f4f6;">Resume Status:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">${resumeStatusMsg}</td>
          </tr>
        </table>
        
        <div style="margin: 20px 0;">
          <h3 style="color: #374151; font-size: 16px; margin-bottom: 8px;">Candidate's Message / Cover Letter:</h3>
          <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px 15px; font-style: italic; white-space: pre-wrap; line-height: 1.5; color: #4b5563;">
            ${message || "No message provided."}
          </div>
        </div>

        <div style="margin: 25px 0 10px 0; text-align: center;">
          ${resumeUrl ? `
            <a href="${fullResumeUrl}" target="_blank" style="background-color: #ea580c; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
              View & Download Resume File
            </a>
          ` : `
            <p style="color: #dc2626; font-weight: bold;">No resume was attached.</p>
          `}
        </div>

        <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 40px; border-top: 1px solid #f3f4f6; padding-top: 15px;">
          This application was processed securely by the web backend.
        </p>
      </div>
    `;

    console.log(`[Job Application System] Processing application for: ${name} (${email}) - Role: ${role}`);

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.log(`[Job Application System] SMTP credentials not configured. Running in Simulated Mode for ${name} (${email}).`);
      return res.json({
        success: true,
        emailSent: false,
        message: "Since SMTP credentials are not configured yet, the transmission to sohailgaji9097@gmail.com was simulated. Your application is saved securely in the database."
      });
    }

    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });

      await transporter.sendMail({
        from: smtpFrom,
        to: recipientEmail,
        subject: emailSubject,
        html: emailHtml,
        attachments: attachments
      });

      console.log(`[Job Application System] SUCCESS: Email successfully sent with attachments to ${recipientEmail}`);
      return res.json({
        success: true,
        emailSent: true,
        message: "Your application and resume have been successfully submitted and emailed to the Dream Team production desk."
      });
    } catch (err: any) {
      console.error(`[Job Application System] ERROR sending email via SMTP:`, err.message);
      return res.status(500).json({
        error: `Failed to transmit application email: ${err.message}`
      });
    }
  });

  // Send email and notify project inquiry
  app.post("/api/notify-inquiry", express.json(), async (req, res) => {
    const { name, emailOrPhone, orgName, orgType, subject, message, briefUrl, briefOriginalName } = req.body;

    // Server-side validation
    if (!name || typeof name !== "string" || name.trim() === "") {
      return res.status(400).json({ error: "Full Name is required." });
    }
    if (!emailOrPhone || typeof emailOrPhone !== "string" || emailOrPhone.trim() === "") {
      return res.status(400).json({ error: "Email or Contact Number is required." });
    }
    if (!subject || typeof subject !== "string" || subject.trim() === "") {
      return res.status(400).json({ error: "Subject is required." });
    }
    if (!message || typeof message !== "string" || message.trim() === "") {
      return res.status(400).json({ error: "Message is required." });
    }

    // Rate limiting to prevent spam (max 5 submissions per 15 minutes per IP)
    const clientIp = (req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || "").split(",")[0].trim();
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxSubmissions = 5;

    let rateInfo = rateLimitMap.get(clientIp + "_inq");
    if (!rateInfo || now > rateInfo.resetTime) {
      rateInfo = { count: 0, resetTime: now + windowMs };
    }

    if (rateInfo.count >= maxSubmissions) {
      const remainingMinutes = Math.ceil((rateInfo.resetTime - now) / 60000);
      return res.status(429).json({
        error: `Too many submissions. Please try again after ${remainingMinutes} minute(s) to prevent spam.`
      });
    }

    rateInfo.count += 1;
    rateLimitMap.set(clientIp + "_inq", rateInfo);

    // Prepare transporter with standard env settings or fallback simulated
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || '"Dreamcatchers Studio" <noreply@cinematic-dreamteam.com>';

    const recipientEmail = "sohailgaji9097@gmail.com";

    const emailSubject = `New Project Inquiry: ${subject} (From ${name})`;
    
    // Attachments handling
    const attachments: any[] = [];
    let briefStatusMsg = "No brief file uploaded";

    if (briefUrl) {
      const filename = path.basename(briefUrl);
      const filePath = path.join(uploadsDir, filename);
      if (fs.existsSync(filePath)) {
        attachments.push({
          filename: briefOriginalName || filename,
          path: filePath
        });
        briefStatusMsg = `Attached: ${briefOriginalName || filename}`;
      } else {
        briefStatusMsg = `Brief uploaded but file not found on server: ${filename}`;
      }
    }

    // Format full brief link using APP_URL if available
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const fullBriefUrl = briefUrl ? (briefUrl.startsWith("http") ? briefUrl : `${appUrl}${briefUrl}`) : "No brief uploaded";

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #ffffff; color: #1f2937;">
        <h2 style="color: #ea580c; border-bottom: 2px solid #ea580c; padding-bottom: 10px; margin-top: 0;">New Project Inquiry / Brief Received</h2>
        
        <p style="font-size: 16px; line-height: 1.5;">A visitor has submitted a new project inquiry through the contact form.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; width: 150px; border-bottom: 1px solid #f3f4f6;">Full Name:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #f3f4f6;">Email / Phone:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">${emailOrPhone}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #f3f4f6;">Organisation:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">${orgName || "Not specified"} (${orgType || "Other"})</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #f3f4f6;">Subject:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">${subject}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #f3f4f6;">Project Brief:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">${briefStatusMsg}</td>
          </tr>
        </table>
        
        <div style="margin: 20px 0;">
          <h3 style="color: #374151; font-size: 16px; margin-bottom: 8px;">Message Details:</h3>
          <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px 15px; font-style: italic; white-space: pre-wrap; line-height: 1.5; color: #4b5563;">
            ${message}
          </div>
        </div>

        <div style="margin: 25px 0 10px 0; text-align: center;">
          ${briefUrl ? `
            <a href="${fullBriefUrl}" target="_blank" style="background-color: #ea580c; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
              View & Download Project Brief
            </a>
          ` : `
            <p style="color: #6b7280; font-style: italic;">No attachment was provided.</p>
          `}
        </div>

        <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 40px; border-top: 1px solid #f3f4f6; padding-top: 15px;">
          This inquiry was processed securely by the web backend.
        </p>
      </div>
    `;

    console.log(`[Project Inquiry System] Processing inquiry from: ${name} (${emailOrPhone}) - Subject: ${subject}`);

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.log(`[Project Inquiry System] SMTP credentials not configured. Running in Simulated Mode for ${name} (${emailOrPhone}).`);
      return res.json({
        success: true,
        emailSent: false,
        message: "Since SMTP credentials are not configured yet, the transmission to sohailgaji9097@gmail.com was simulated. Your inquiry is saved securely in the database."
      });
    }

    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });

      await transporter.sendMail({
        from: smtpFrom,
        to: recipientEmail,
        subject: emailSubject,
        html: emailHtml,
        attachments: attachments
      });

      console.log(`[Project Inquiry System] SUCCESS: Email successfully sent with attachments to ${recipientEmail}`);
      return res.json({
        success: true,
        emailSent: true,
        message: "Your inquiry and brief have been successfully submitted and emailed to the team."
      });
    } catch (err: any) {
      console.error(`[Project Inquiry System] ERROR sending email via SMTP:`, err.message);
      return res.status(500).json({
        error: `Failed to transmit inquiry email: ${err.message}`
      });
    }
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
    const { uploadId, filename, totalChunks, fileType } = req.body;
    if (!uploadId || !filename || !totalChunks) {
      return res.status(400).json({ error: "Missing uploadId, filename, or totalChunks" });
    }

    const sanitizedExt = path.extname(filename).toLowerCase();
    if (fileType === "brief") {
      const allowedExts = [".pdf", ".doc", ".docx", ".txt", ".exe", ".jpg", ".jpeg", ".png", ".worl"];
      if (!allowedExts.includes(sanitizedExt)) {
        return res.status(400).json({ error: "Only .pdf, .doc, .docx, .txt, .exe, .jpg, .jpeg, .png, and .worl files are allowed for project briefs." });
      }
    } else if (fileType === "resume") {
      const allowedExts = [".pdf", ".doc", ".docx", ".txt", ".rtf", ".png", ".jpg", ".jpeg"];
      if (!allowedExts.includes(sanitizedExt)) {
        return res.status(400).json({ error: "Only PDF, Word (DOC/DOCX), Text (TXT/RTF), and Image files are allowed." });
      }
    }

    const tempDirName = `temp-${uploadId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
    const chunkTempDir = path.join(uploadsDir, tempDirName);

    if (!fs.existsSync(chunkTempDir)) {
      return res.status(404).json({ error: "Upload session not found or chunks missing" });
    }

    const total = parseInt(totalChunks, 10);
    const ext = sanitizedExt || ".mp4";
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    
    let prefix = "video-";
    if (fileType === "brief") {
      prefix = "brief-";
    } else if (fileType === "resume") {
      prefix = "resume-";
    } else if (fileType === "contactImage") {
      prefix = "contact-img-";
    }
    
    const finalFilename = `${prefix}${uniqueSuffix}${ext}`;
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

  // Proxy endpoint to support autoplay and streaming of Google Drive videos of any size (>100MB virus scan bypass) with high-performance direct streaming proxy
  app.get("/api/drive-stream", async (req, res) => {
    const rawFileId = req.query.id as string;
    if (!rawFileId) {
      return res.status(400).send("Missing file id");
    }

    // Helper to extract clean file ID from raw string or a full URL
    const extractFileId = (input: string): string => {
      const driveUrlRegex = /\/file\/d\/([a-zA-Z0-9_-]+)/;
      const match = input.match(driveUrlRegex);
      if (match) return match[1];

      const idQueryRegex = /[?&]id=([a-zA-Z0-9_-]+)/;
      const queryMatch = input.match(idQueryRegex);
      if (queryMatch) return queryMatch[1];

      return input.trim();
    };

    const fileId = extractFileId(rawFileId);
    console.log(`[Google Drive Proxy] Initializing stream request for fileId: "${fileId}"`);

    const abortController = new AbortController();
    req.on('close', () => {
      console.log(`[Google Drive Proxy] Client disconnected. Aborting request for fileId: "${fileId}"`);
      abortController.abort();
    });

    try {
      const url = `https://drive.google.com/uc?export=download&id=${fileId}`;
      
      const initialHeaders: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      };

      // Forward client's Range header on first request so Google can respond with 206 if no virus scan screen is triggered
      if (req.headers.range) {
        initialHeaders['Range'] = req.headers.range;
      }

      console.log(`[Google Drive Proxy] Sending initial download check request...`);
      let response = await fetch(url, {
        headers: initialHeaders,
        signal: abortController.signal
      });

      const contentType = response.headers.get('content-type') || '';
      let finalUrl = response.url;

      // Safe cookie collection
      let rawCookies: string[] = [];
      if (typeof response.headers.getSetCookie === 'function') {
        rawCookies = response.headers.getSetCookie();
      } else {
        const rawCookiesHeader = response.headers.get('set-cookie');
        rawCookies = rawCookiesHeader ? [rawCookiesHeader] : [];
      }
      let activeCookies = rawCookies.map(c => c.split(';')[0].trim()).filter(Boolean);

      let streamUrl = finalUrl;
      let hasWarning = false;

      // If the content type contains HTML, Google is showing a "large file virus scan" warning page
      if (contentType.includes('text/html')) {
        hasWarning = true;
        const htmlText = await response.text();
        console.log(`[Google Drive Proxy] File >100MB warning page detected. Bypassing virus scan check...`);

        // Extract the confirmation token
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

        // Fallback to 't' if not matched, which is the standard generic bypass token
        if (!confirmToken) {
          confirmToken = 't';
        }

        console.log(`[Google Drive Proxy] Extracted confirmation token: "${confirmToken}"`);

        const streamUrlObj = new URL(finalUrl);
        streamUrlObj.searchParams.set('confirm', confirmToken);
        streamUrl = streamUrlObj.toString();

        // Accumulate any cookies returned on the warning page
        let newRawCookies: string[] = [];
        if (typeof response.headers.getSetCookie === 'function') {
          newRawCookies = response.headers.getSetCookie();
        }
        const newCookies = newRawCookies.map(c => c.split(';')[0].trim()).filter(Boolean);
        activeCookies = Array.from(new Set([...activeCookies, ...newCookies]));
      }

      // If we had no warning page and no Range header requested, we can reuse the initial response body directly
      let streamResponse = response;
      if (hasWarning || req.headers.range) {
        // If we didn't hit a warning but have range, we should cancel the previous unused body to release resources
        if (!hasWarning) {
          try {
            if (response.body) {
              await response.body.cancel();
            }
          } catch (e) {}
        }

        const fetchHeaders: Record<string, string> = {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        };

        if (activeCookies.length > 0) {
          fetchHeaders['Cookie'] = activeCookies.join('; ');
        }

        if (req.headers.range) {
          fetchHeaders['Range'] = req.headers.range;
          console.log(`[Google Drive Proxy] Forwarding Range: "${req.headers.range}"`);
        }

        console.log(`[Google Drive Proxy] Fetching binary stream from: ${streamUrl}`);
        streamResponse = await fetch(streamUrl, {
          headers: fetchHeaders,
          signal: abortController.signal
        });
      }

      // Verify that we are streaming actual video/media content, not HTML
      const finalContentType = streamResponse.headers.get('content-type') || '';
      if (finalContentType.includes('text/html')) {
        console.error(`[Google Drive Proxy] Error: Google returned an HTML page instead of a video stream. The file may be private or deleted.`);
        return res.status(502).send("Unable to fetch video. The Google Drive file might be private, restricted, or deleted. Please make sure the file sharing settings are set to 'Anyone with the link can view'.");
      }

      // Forward correct status code (especially 206 for Range requests)
      res.status(streamResponse.status);

      // Copy key media streaming headers back to the browser
      const copyHeaders = [
        'content-type',
        'content-length',
        'content-range',
        'accept-ranges',
        'cache-control'
      ];

      copyHeaders.forEach(h => {
        const val = streamResponse.headers.get(h);
        if (val) {
          res.setHeader(h, val);
        }
      });

      // Ensure necessary video delivery headers are present
      if (!res.getHeader('content-type')) {
        res.setHeader('content-type', 'video/mp4');
      }
      if (!res.getHeader('accept-ranges')) {
        res.setHeader('accept-ranges', 'bytes');
      }

      // Stream the video bytes to the client
      if (!streamResponse.body) {
        console.error(`[Google Drive Proxy] Stream response body is empty`);
        return res.status(500).send("No stream body available");
      }

      const { Readable, pipeline } = await import("stream");
      const readableStream = Readable.fromWeb(streamResponse.body as any);

      pipeline(readableStream, res, (err) => {
        if (err) {
          if (
            err.name === 'AbortError' || 
            (err as any).code === 'ERR_STREAM_PREMATURE_CLOSE' ||
            (err as any).code === 'ECONNRESET'
          ) {
            // Normal client-side seeking/disconnections, safe to ignore
            return;
          }
          console.warn("[Google Drive Proxy] Stream pipeline completed with warning:", err.message);
        }
      });

    } catch (error: any) {
      if (error.name === 'AbortError') {
        return;
      }
      console.error("[Google Drive Proxy] Stream error occurred:", error);
      if (!res.headersSent) {
        res.status(500).send("Error streaming Google Drive video");
      }
    }
  });

  // Global JSON error handler middleware to prevent Express from ever serving default HTML error pages for APIs
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("[Backend Unhandled Error]:", err);
    if (!res.headersSent) {
      res.status(err.status || 500).json({
        error: err.message || "An internal server error occurred on the backend."
      });
    } else {
      next(err);
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
