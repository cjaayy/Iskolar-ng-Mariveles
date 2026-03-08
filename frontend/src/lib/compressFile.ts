const MIN_FILE_SIZE = 500 * 1024;
const MAX_FILE_SIZE = 3 * 1024 * 1024;

export interface CompressionResult {
  file: File;
  compressed: boolean;
  originalSize: number;
  finalSize: number;
  error?: string;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

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

async function compressImage(file: File): Promise<CompressionResult> {
  const originalSize = file.size;

  if (file.size <= MAX_FILE_SIZE && file.size >= MIN_FILE_SIZE) {
    return { file, compressed: false, originalSize, finalSize: file.size };
  }

  const img = await loadImage(file);
  const originalUrl = img.src;

  const outputMime = "image/jpeg";
  const outputExt = ".jpg";

  const width = img.naturalWidth;
  const height = img.naturalHeight;

  if (file.size < MIN_FILE_SIZE) {
    let bestBlob: Blob | null = null;

    for (const q of [1.0, 0.98, 0.95]) {
      const blob = await canvasToBlob(img, width, height, q, outputMime);
      if (blob.size >= MIN_FILE_SIZE && blob.size <= MAX_FILE_SIZE) {
        bestBlob = blob;
        break;
      }
      if (blob.size < MIN_FILE_SIZE && q === 1.0) {
        for (let upScale = 1.25; upScale <= 3.0; upScale += 0.25) {
          const w = Math.round(width * upScale);
          const h = Math.round(height * upScale);
          const upBlob = await canvasToBlob(img, w, h, 1.0, outputMime);
          if (upBlob.size >= MIN_FILE_SIZE && upBlob.size <= MAX_FILE_SIZE) {
            bestBlob = upBlob;
            break;
          }
          if (upBlob.size > MAX_FILE_SIZE) break;
        }
        break;
      }
      if (blob.size > MAX_FILE_SIZE) continue;
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

    const fallback = await canvasToBlob(img, width, height, 1.0, outputMime);
    return {
      file: blobToFile(fallback, file.name, outputExt, outputMime),
      compressed: true,
      originalSize,
      finalSize: fallback.size,
    };
  }

  const minScale = 0.3;

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

    if (!result) continue;

    if (result.blob.size >= MIN_FILE_SIZE) {
      bestResult = result;
      break;
    }

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

export async function compressFile(file: File): Promise<CompressionResult> {
  const originalSize = file.size;

  if (
    file.type === "image/jpeg" ||
    file.type === "image/png" ||
    file.type === "image/jpg"
  ) {
    return compressImage(file);
  }

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
