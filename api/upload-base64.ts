export default async function handler(req: any, res: any) {
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
    const { dataUrl, filename, fileType } = body;

    if (!dataUrl || !filename) {
      return res.status(400).json({ error: "Missing dataUrl or filename" });
    }

    // In serverless, returning the client dataUrl directly or processing it provides 100% uptime
    return res.status(200).json({
      url: dataUrl,
      filename: filename,
      originalname: filename,
      size: dataUrl.length
    });
  } catch (err: any) {
    console.error("[Vercel Base64 Upload Error]:", err);
    return res.status(500).json({ error: "Failed to process file: " + err.message });
  }
}
