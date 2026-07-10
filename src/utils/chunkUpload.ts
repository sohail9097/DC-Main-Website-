/**
 * High-reliability chunked upload helper for files in the AI Studio environment.
 * Bypasses reverse proxy body size limits by uploading files in small, safe chunks (e.g., 1.5MB).
 */
export async function uploadFileInChunks(
  file: File,
  fileType: 'brief' | 'resume' | 'video' | 'contactImage',
  onProgress?: (progress: number) => void
): Promise<{ url: string; filename: string; originalname: string; size: number }> {
  const chunkSize = 1.5 * 1024 * 1024; // 1.5MB chunks
  const totalChunks = Math.ceil(file.size / chunkSize);
  const uploadId = Date.now().toString() + '-' + Math.round(Math.random() * 1e9);

  // Robust fetch with retry and exponential backoff
  const fetchWithRetry = async (url: string, options: RequestInit, retries = 3, delay = 1000): Promise<Response> => {
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

  // Upload chunks sequentially to keep connection stable and track progress accurately
  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const start = chunkIndex * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunkBlob = file.slice(start, end);

    const formData = new FormData();
    // Must append filename to binary chunk so multer handles it properly
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
      // Use 90% of progress for chunks, remaining 10% for assembly
      const percent = Math.round(((chunkIndex + 1) / totalChunks) * 90);
      onProgress(percent);
    }
  }

  if (onProgress) {
    onProgress(95);
  }

  // Assemble chunks on the server
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

  if (!assembleResponse.ok) {
    let errorMsg = 'Failed to assemble uploaded file chunks on the server.';
    try {
      const errData = await assembleResponse.json();
      errorMsg = errData.error || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }

  if (onProgress) {
    onProgress(100);
  }

  return assembleResponse.json();
}
