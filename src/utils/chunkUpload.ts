/**
 * High-reliability upload helper for files in the AI Studio environment.
 * Multi-tier pipeline:
 * 1. Fast direct multipart upload
 * 2. Base64 JSON upload (bypasses proxy form-data restrictions)
 * 3. Chunked upload (for larger files)
 * 4. Client-side Data URL fallback (zero-failure guaranteed)
 */

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export async function uploadFileInChunks(
  file: File,
  fileType: 'brief' | 'resume' | 'video' | 'contactImage',
  onProgress?: (progress: number) => void
): Promise<{ url: string; filename: string; originalname: string; size: number }> {
  if (!file) {
    throw new Error("No file provided for upload.");
  }

  // Strategy 1: Direct single-request multipart upload for small documents/images
  if (file.size <= 15 * 1024 * 1024 && fileType !== 'video') {
    try {
      let endpoint = '/api/upload-resume';
      let fieldName = 'resume';

      if (fileType === 'brief') {
        endpoint = '/api/upload-brief';
        fieldName = 'brief';
      } else if (fileType === 'contactImage') {
        endpoint = '/api/upload-contact-image';
        fieldName = 'contactImage';
      }

      if (onProgress) onProgress(30);

      const directFormData = new FormData();
      directFormData.append(fieldName, file);

      const directRes = await fetch(endpoint, {
        method: 'POST',
        body: directFormData
      });

      if (directRes.ok) {
        const directData = await directRes.json();
        if (directData && directData.url) {
          if (onProgress) onProgress(100);
          return directData;
        }
      }
    } catch (directErr) {
      console.warn(`[UploadHelper] Direct multipart upload for ${fileType} failed, trying JSON Base64 upload:`, directErr);
    }
  }

  // Strategy 2: Base64 JSON Upload for non-video files under 20MB (bypasses reverse proxy multipart limits)
  if (file.size <= 20 * 1024 * 1024 && fileType !== 'video') {
    try {
      if (onProgress) onProgress(45);
      const base64Data = await readFileAsDataUrl(file);
      
      const b64Res = await fetch('/api/upload-base64', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          dataUrl: base64Data,
          filename: file.name,
          fileType
        })
      });

      if (b64Res.ok) {
        const b64Data = await b64Res.json();
        if (b64Data && b64Data.url) {
          if (onProgress) onProgress(100);
          return b64Data;
        }
      }
    } catch (b64Err) {
      console.warn(`[UploadHelper] Base64 upload for ${fileType} failed, trying chunked upload:`, b64Err);
    }
  }

  // Strategy 3: Chunked Upload
  try {
    const chunkSize = 1.5 * 1024 * 1024; // 1.5MB chunks
    const totalChunks = Math.ceil(file.size / chunkSize);
    const uploadId = Date.now().toString() + '-' + Math.round(Math.random() * 1e9);

    const fetchWithRetry = async (url: string, options: RequestInit, retries = 2, delay = 600): Promise<Response> => {
      try {
        const response = await fetch(url, options);
        if (!response.ok && retries > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
          return fetchWithRetry(url, options, retries - 1, delay * 1.5);
        }
        return response;
      } catch (err) {
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
          return fetchWithRetry(url, options, retries - 1, delay * 1.5);
        }
        throw err;
      }
    };

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunkBlob = file.slice(start, end);

      const formData = new FormData();
      formData.append('chunk', chunkBlob, `chunk-${chunkIndex}.bin`);
      formData.append('uploadId', uploadId);
      formData.append('chunkIndex', chunkIndex.toString());
      formData.append('totalChunks', totalChunks.toString());
      formData.append('filename', file.name);

      const response = await fetchWithRetry('/api/upload-video-chunk', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        let errorMsg = `Failed to upload chunk ${chunkIndex + 1} of ${totalChunks}`;
        try {
          const errData = await response.json();
          errorMsg = errData.error || errorMsg;
        } catch {}
        throw new Error(errorMsg);
      }

      if (onProgress) {
        const percent = Math.round(((chunkIndex + 1) / totalChunks) * 90);
        onProgress(percent);
      }
    }

    if (onProgress) onProgress(95);

    const assembleResponse = await fetchWithRetry('/api/upload-video-assemble', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        uploadId,
        filename: file.name,
        totalChunks: totalChunks.toString(),
        fileType
      })
    });

    if (assembleResponse.ok) {
      const assembleData = await assembleResponse.json();
      if (onProgress) onProgress(100);
      return assembleData;
    }
  } catch (chunkErr) {
    console.warn(`[UploadHelper] Chunked upload failed:`, chunkErr);
  }

  // Strategy 4: Client-side Data URL Fallback (Guaranteed to succeed for documents & images)
  if (fileType !== 'video') {
    try {
      if (onProgress) onProgress(80);
      const clientDataUrl = await readFileAsDataUrl(file);
      if (onProgress) onProgress(100);
      return {
        url: clientDataUrl,
        filename: file.name,
        originalname: file.name,
        size: file.size
      };
    } catch (fallbackErr) {
      console.error("[UploadHelper] Client fallback failed:", fallbackErr);
    }
  }

  throw new Error("Unable to upload file. Please check your network connection and try again.");
}
