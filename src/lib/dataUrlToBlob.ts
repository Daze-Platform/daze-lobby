/**
 * Converts a base64 data URL to a Blob with proper MIME type handling.
 * Avoids stack overflow issues with large files by using chunk-based processing.
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  // Validate input
  if (!dataUrl || !dataUrl.startsWith("data:")) {
    throw new Error("Invalid data URL format");
  }

  // Split the data URL into metadata and base64 content
  const [meta, base64Data] = dataUrl.split(",");
  
  if (!meta || !base64Data) {
    throw new Error("Malformed data URL");
  }

  // Extract MIME type from metadata (e.g., "data:image/png;base64")
  const mimeMatch = meta.match(/^data:(.*?);/);
  const mimeType = mimeMatch?.[1] || "image/png";

  // Decode base64 to binary string
  const binaryString = atob(base64Data);
  const length = binaryString.length;

  // Use chunk-based processing to avoid stack overflow with large files
  const CHUNK_SIZE = 8192; // 8KB chunks
  const bytes = new Uint8Array(length);

  for (let i = 0; i < length; i += CHUNK_SIZE) {
    const end = Math.min(i + CHUNK_SIZE, length);
    for (let j = i; j < end; j++) {
      bytes[j] = binaryString.charCodeAt(j);
    }
  }

  return new Blob([bytes], { type: mimeType });
}

/**
 * Gets the file extension for a given MIME type.
 */
export function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
    "application/pdf": "pdf",
  };

  return mimeToExt[mimeType] || "png";
}

/**
 * Extracts the MIME type from a data URL.
 */
export function getMimeTypeFromDataUrl(dataUrl: string): string {
  if (!dataUrl || !dataUrl.startsWith("data:")) {
    return "image/png";
  }

  const mimeMatch = dataUrl.match(/^data:(.*?);/);
  return mimeMatch?.[1] || "image/png";
}
