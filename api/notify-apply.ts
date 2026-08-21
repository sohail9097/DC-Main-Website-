import type { IncomingMessage, ServerResponse } from "http";
import nodemailer from "nodemailer";

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Only POST is accepted." });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const { name, email, phone, role, message, resumeUrl } = body;

    // Validation
    if (!name || typeof name !== "string" || name.trim() === "") {
      return res.status(400).json({ error: "Full Name is required." });
    }
    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "A valid Email Address is required." });
    }
    if (!role || typeof role !== "string" || role.trim() === "") {
      return res.status(400).json({ error: "Position Applied For is required." });
    }

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || `"Dream Team Careers" <${smtpUser || "noreply@cinematic-dreamteam.com"}>`;
    const recipientEmail = process.env.RECIPIENT_EMAIL || "sohailgaji9097@gmail.com";

    const emailSubject = `New Job Application: ${name} is applying for ${role}`;

    // Handle resume attachments (Data URL or web link)
    const attachments: any[] = [];
    let resumeStatusMsg = "No resume uploaded";

    if (resumeUrl && typeof resumeUrl === "string") {
      if (resumeUrl.startsWith("data:")) {
        const matches = resumeUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const buffer = Buffer.from(matches[2], "base64");
          attachments.push({
            filename: `resume_${name.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`,
            content: buffer
          });
          resumeStatusMsg = "Attached directly to email (Base64 file)";
        }
      } else {
        resumeStatusMsg = `Link provided: ${resumeUrl}`;
      }
    }

    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #ffffff; color: #111827;">
        <div style="border-bottom: 2px solid #ea580c; padding-bottom: 12px; margin-bottom: 20px;">
          <h2 style="color: #ea580c; margin: 0; font-size: 22px; font-weight: 700;">New Job Application Received</h2>
          <p style="color: #6b7280; font-size: 14px; margin: 4px 0 0 0;">Dreamcatchers Careers Portal</p>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="padding: 10px 0; font-weight: 600; width: 140px; border-bottom: 1px solid #f3f4f6; color: #4b5563;">Candidate Name:</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #111827; font-weight: 600;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; font-weight: 600; border-bottom: 1px solid #f3f4f6; color: #4b5563;">Email Address:</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6;"><a href="mailto:${email}" style="color: #ea580c; text-decoration: none; font-weight: 600;">${email}</a></td>
          </tr>
          <tr>
            <td style="padding: 10px 0; font-weight: 600; border-bottom: 1px solid #f3f4f6; color: #4b5563;">Phone Number:</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #111827;">${phone || "Not specified"}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; font-weight: 600; border-bottom: 1px solid #f3f4f6; color: #4b5563;">Position:</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6;"><span style="background-color: #fff7ed; color: #c2410c; padding: 4px 10px; border-radius: 4px; font-size: 14px; font-weight: 600; border: 1px solid #ffedd5;">${role}</span></td>
          </tr>
          <tr>
            <td style="padding: 10px 0; font-weight: 600; border-bottom: 1px solid #f3f4f6; color: #4b5563;">Resume Status:</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #111827;">${resumeStatusMsg}</td>
          </tr>
        </table>
        
        <div style="margin: 20px 0;">
          <h3 style="color: #374151; font-size: 15px; margin: 0 0 8px 0; font-weight: 600;">Message / Cover Letter:</h3>
          <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 14px; white-space: pre-wrap; line-height: 1.6; color: #374151; font-size: 14px;">
            ${message || "No cover letter provided."}
          </div>
        </div>

        ${resumeUrl ? `
          <div style="margin: 24px 0; text-align: center;">
            <a href="${resumeUrl}" target="_blank" style="background-color: #ea580c; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">
              View Attached Resume
            </a>
          </div>
        ` : ''}

        <div style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 30px; border-top: 1px solid #f3f4f6; padding-top: 15px;">
          Received automatically via Dreamcatchers Vercel Serverless Form Handler.
        </div>
      </div>
    `;

    const hasValidSmtp = Boolean(smtpHost && smtpHost.trim() && smtpUser && smtpUser.trim() && smtpPass && smtpPass.trim());

    if (!hasValidSmtp) {
      console.warn("[Vercel Notify-Apply] SMTP credentials not detected in process.env. Please add SMTP_HOST, SMTP_USER, SMTP_PASS to Vercel Environment Variables.");
      return res.status(200).json({
        success: true,
        emailSent: false,
        warning: "Application stored in Firestore. To receive emails on Vercel, please set SMTP_HOST, SMTP_USER, SMTP_PASS in Vercel Project Settings > Environment Variables.",
        message: "Your application has been received and stored in the database."
      });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass
      },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 10000
    });

    await transporter.sendMail({
      from: smtpFrom,
      to: recipientEmail,
      subject: emailSubject,
      html: emailHtml,
      attachments: attachments
    });

    return res.status(200).json({
      success: true,
      emailSent: true,
      message: "Application submitted and email sent to Dreamcatchers production desk."
    });
  } catch (err: any) {
    console.error("[Vercel Notify-Apply Error]:", err);
    return res.status(500).json({
      error: "Failed to dispatch email: " + (err.message || "Internal server error"),
      success: false
    });
  }
}
