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
 * Compress an image file to land inside the 500 KB – 3 MB range.
 *
 * Strategy — binary-search on JPEG quality at each scale level:
 *  1. At the current scale, binary-search quality (0.1 – 0.92) to find the
 *     highest quality whose output is ≤ 3 MB **and** ≥ 500 KB.
 *  2. If even quality = 0.1 at this scale is still > 3 MB, shrink dimensions
 *     by 10 % and retry.
 *  3. If quality = 0.92 produces < 500 KB at this scale, that means the image
 *     is inherently small — accept the highest-quality result we can get
 *     (even if it sits below 500 KB).
 */
async function compressImage(file: File): Promise<CompressionResult> {
  const originalSize = file.size;

  // Already within limits
  if (file.size <= MAX_FILE_SIZE && file.size >= MIN_FILE_SIZE) {
    return { file, compressed: false, originalSize, finalSize: file.size };
  }

  const img = await loadImage(file);
  const originalUrl = img.src;

  const outputMime = "image/jpeg";
  const outputExt = ".jpg";

  const width = img.naturalWidth;
  const height = img.naturalHeight;

  // ── Image is UNDER 500 KB — re-encode at max quality to reach minimum ──
  if (file.size < MIN_FILE_SIZE) {
    // Try increasing quality up to 1.0
    let bestBlob: Blob | null = null;

    for (const q of [1.0, 0.98, 0.95]) {
      const blob = await canvasToBlob(img, width, height, q, outputMime);
      if (blob.size >= MIN_FILE_SIZE && blob.size <= MAX_FILE_SIZE) {
        bestBlob = blob;
        break;
      }
      // If q=1.0 is still < 500KB, try scaling up slightly
      if (blob.size < MIN_FILE_SIZE && q === 1.0) {
        // Scale up in steps until we reach 500 KB or 3 MB cap
        for (let upScale = 1.25; upScale <= 3.0; upScale += 0.25) {
          const w = Math.round(width * upScale);
          const h = Math.round(height * upScale);
          const upBlob = await canvasToBlob(img, w, h, 1.0, outputMime);
          if (upBlob.size >= MIN_FILE_SIZE && upBlob.size <= MAX_FILE_SIZE) {
            bestBlob = upBlob;
            break;
          }
          if (upBlob.size > MAX_FILE_SIZE) break; // don't overshoot
        }
        break;
      }
      if (blob.size > MAX_FILE_SIZE) continue; // try lower quality
    }

    URL.revokeObjectURL(originalUrl);

    if (bestBlob && bestBlob.size >= MIN_FILE_SIZE) {
      return {
        file: blobToFile(bestBlob, file.name, outputExt, outputMime),
        compressed: true,
        originalSize,
        finalSize: bestBlob.size,
      };
    }

    // Could not bring it up to 500 KB — return the max-quality version anyway
    const fallback = await canvasToBlob(img, width, height, 1.0, outputMime);
    return {
      file: blobToFile(fallback, file.name, outputExt, outputMime),
      compressed: true,
      originalSize,
      finalSize: fallback.size,
    };
  }

  // ── Image is OVER 3 MB — compress down ──
  const minScale = 0.3;

  // Helper: binary-search quality at a fixed scale, targeting ≤ 3 MB.
  async function searchQuality(
    scale: number,
  ): Promise<{ blob: Blob; quality: number } | null> {
    const w = Math.round(width * scale);
    const h = Math.round(height * scale);

    let lo = 0.1;
    let hi = 0.92;
    let bestBlob: Blob | null = null;
    let bestQ = lo;

    for (let i = 0; i < 8; i++) {
      const mid = (lo + hi) / 2;
      const blob = await canvasToBlob(img, w, h, mid, outputMime);

      if (blob.size <= MAX_FILE_SIZE) {
        bestBlob = blob;
        bestQ = mid;
        lo = mid + 0.001;
      } else {
        hi = mid - 0.001;
      }
    }

    if (!bestBlob) return null;
    return { blob: bestBlob, quality: bestQ };
  }

  let bestResult: { blob: Blob; quality: number } | null = null;

  for (let scale = 1; scale >= minScale; scale -= 0.1) {
    const result = await searchQuality(scale);

    if (!result) continue; // too large even at lowest quality

    if (result.blob.size >= MIN_FILE_SIZE) {
      bestResult = result;
      break;
    }

    // Result < 500 KB — image is inherently small at this scale; accept it
    bestResult = result;
    break;
  }

  URL.revokeObjectURL(originalUrl);

  if (!bestResult) {
    return {
      file,
      compressed: false,
      originalSize,
      finalSize: file.size,
      error:
        "Could not compress the image below 3 MB. Please use a lower-resolution image.",
    };
  }

  return {
    file: blobToFile(bestResult.blob, file.name, outputExt, outputMime),
    compressed: true,
    originalSize,
    finalSize: bestResult.blob.size,
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
