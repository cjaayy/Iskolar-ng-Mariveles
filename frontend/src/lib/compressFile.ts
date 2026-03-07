/**
 * Client-side file compression utility.
 *
 * Supports JPEG/PNG images via the Canvas API.
 * PDFs, DOC, and DOCX cannot be meaningfully compressed in the browser,
 * so those formats are returned as-is with a flag indicating no compression.
 */

const MIN_FILE_SIZE = 500 * 1024; // 500 KB
const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3 MB

export interface CompressionResult {
  file: File;
  compressed: boolean;
  originalSize: number;
  finalSize: number;
  error?: string;
}

/**
 * Load an image from a File into an HTMLImageElement.
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Render an image to a canvas at the given dimensions and quality,
 * then return the resulting Blob.
 */
function canvasToBlob(
  img: HTMLImageElement,
  width: number,
  height: number,
  quality: number,
  mimeType: string,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("Canvas context unavailable"));
      return;
    }

    ctx.drawImage(img, 0, 0, width, height);

    // PNG ignores quality; for PNG we may need to fall back to JPEG
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas toBlob returned null"));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality,
    );
  });
}

/**
 * Compress an image file to fit within MAX_FILE_SIZE (3 MB).
 *
 * Strategy:
 *  1. Start at quality = 0.85 and step down by 0.05.
 *  2. If quality drops to 0.3 and the file is still too large,
 *     scale dimensions down by 10% and restart quality loop.
 *  3. Repeat until the file is within range or we hit the floor.
 */
async function compressImage(file: File): Promise<CompressionResult> {
  const originalSize = file.size;

  // Already within limits
  if (file.size <= MAX_FILE_SIZE && file.size >= MIN_FILE_SIZE) {
    return { file, compressed: false, originalSize, finalSize: file.size };
  }

  // Too small — cannot compress further and shouldn't
  if (file.size < MIN_FILE_SIZE) {
    return {
      file,
      compressed: false,
      originalSize,
      finalSize: file.size,
      error: `File is too small (${formatBytes(file.size)}). Minimum size is 500 KB — please upload a higher-quality scan.`,
    };
  }

  const img = await loadImage(file);
  const originalUrl = img.src;

  // Use JPEG for compression output (even for PNGs — JPEG compresses much better)
  const outputMime = "image/jpeg";
  const outputExt = ".jpg";

  let width = img.naturalWidth;
  let height = img.naturalHeight;
  let scaleFactor = 1;
  const minScale = 0.3; // don't go below 30 % of original dimensions
  const qualityFloor = 0.3;

  let bestBlob: Blob | null = null;

  outer: while (scaleFactor >= minScale) {
    const w = Math.round(width * scaleFactor);
    const h = Math.round(height * scaleFactor);

    for (let q = 0.85; q >= qualityFloor; q -= 0.05) {
      const blob = await canvasToBlob(img, w, h, q, outputMime);

      if (blob.size <= MAX_FILE_SIZE) {
        bestBlob = blob;
        break outer;
      }
    }

    // Reduce dimensions by 10 %
    scaleFactor -= 0.1;
  }

  URL.revokeObjectURL(originalUrl);

  if (!bestBlob || bestBlob.size > MAX_FILE_SIZE) {
    return {
      file,
      compressed: false,
      originalSize,
      finalSize: file.size,
      error:
        "Could not compress the image below 3 MB. Please use a lower-resolution image.",
    };
  }

  if (bestBlob.size < MIN_FILE_SIZE) {
    // Compression went too aggressive — still return it but note the warning
    // This is unlikely for real photos/scans but handle it gracefully
    return {
      file: blobToFile(bestBlob, file.name, outputExt, outputMime),
      compressed: true,
      originalSize,
      finalSize: bestBlob.size,
      error: `Compressed file is below 500 KB (${formatBytes(bestBlob.size)}). The original may be too low-resolution.`,
    };
  }

  return {
    file: blobToFile(bestBlob, file.name, outputExt, outputMime),
    compressed: true,
    originalSize,
    finalSize: bestBlob.size,
  };
}

function blobToFile(
  blob: Blob,
  originalName: string,
  newExt: string,
  mimeType: string,
): File {
  const nameWithoutExt = originalName.replace(/\.[^.]+$/, "");
  return new File([blob], `${nameWithoutExt}${newExt}`, { type: mimeType });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

/**
 * Main entry point.
 * - Images: compress via Canvas API.
 * - PDF / DOC / DOCX: return size-validation result only (no browser compression).
 */
export async function compressFile(file: File): Promise<CompressionResult> {
  const originalSize = file.size;

  // Image types — can compress
  if (
    file.type === "image/jpeg" ||
    file.type === "image/png" ||
    file.type === "image/jpg"
  ) {
    return compressImage(file);
  }

  // Non-image types — validate size only
  if (file.size > MAX_FILE_SIZE) {
    return {
      file,
      compressed: false,
      originalSize,
      finalSize: file.size,
      error: `File is ${formatBytes(file.size)}. Maximum allowed size is 3 MB. Please compress this file externally before uploading.`,
    };
  }

  if (file.size < MIN_FILE_SIZE) {
    return {
      file,
      compressed: false,
      originalSize,
      finalSize: file.size,
      error: `File is too small (${formatBytes(file.size)}). Minimum size is 500 KB.`,
    };
  }

  return { file, compressed: false, originalSize, finalSize: file.size };
}

export { MIN_FILE_SIZE, MAX_FILE_SIZE, formatBytes };
