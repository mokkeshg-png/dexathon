import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface UploadOptions {
  bucket?: "avatars" | "documents";
  folder?: string;
  maxSizeBytes?: number; // default 10MB
  allowedTypes?: string[];
}

const DEFAULT_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const DEFAULT_DOC_TYPES = [...DEFAULT_IMAGE_TYPES, "application/pdf"];
const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB

/** Format byte size to human readable string (e.g. 2.4 MB) */
export function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/** Check if file is a PDF */
export function isPdf(fileOrUrl: File | string): boolean {
  if (typeof fileOrUrl === "string") {
    return fileOrUrl.toLowerCase().includes(".pdf") || fileOrUrl.startsWith("data:application/pdf");
  }
  return fileOrUrl.type === "application/pdf" || fileOrUrl.name.toLowerCase().endsWith(".pdf");
}

/** Validate file before upload */
export function validateMediaFile(file: File, options?: UploadOptions): { valid: boolean; error?: string } {
  const allowed = options?.allowedTypes ?? DEFAULT_DOC_TYPES;
  const maxSize = options?.maxSizeBytes ?? DEFAULT_MAX_SIZE;

  // Type check
  const mimeMatch = allowed.includes(file.type);
  const extMatch = allowed.some((type) => {
    if (type === "application/pdf") return file.name.toLowerCase().endsWith(".pdf");
    if (type.startsWith("image/")) {
      const ext = type.replace("image/", ".");
      return file.name.toLowerCase().endsWith(ext) || (ext === ".jpeg" && file.name.toLowerCase().endsWith(".jpg"));
    }
    return false;
  });

  if (!mimeMatch && !extMatch) {
    return {
      valid: false,
      error: `Unsupported file type. Please upload a valid image (${DEFAULT_IMAGE_TYPES.map(t => t.replace("image/", "").toUpperCase()).join(", ")}) or PDF.`,
    };
  }

  // Size check
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File is too large (${formatFileSize(file.size)}). Maximum allowed size is ${formatFileSize(maxSize)}.`,
    };
  }

  return { valid: true };
}

/** Convert file to base64 data URL */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/** Optional client-side image compression to keep payload lean */
export async function compressImage(file: File, maxWidth = 1600, quality = 0.85): Promise<string> {
  if (file.type === "application/pdf" || file.type === "image/gif") {
    return readFileAsDataUrl(file);
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL(file.type || "image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => readFileAsDataUrl(file).then(resolve);
    reader.readAsDataURL(file);
  });
}

export interface UploadResult {
  url: string;
  storageProvider: "supabase" | "data-url";
  fileName: string;
  fileSize: number;
  mimeType: string;
}

/**
 * Upload media file (avatar, project screenshot, certificate image or PDF, experience proof).
 * Attempts upload to Supabase Storage first. If the bucket does not exist or storage RLS denies,
 * it seamlessly converts to an optimized Data URL with zero user-facing crash.
 */
export async function uploadMedia(
  file: File,
  userId: string,
  options?: UploadOptions
): Promise<UploadResult> {
  const validation = validateMediaFile(file, options);
  if (!validation.valid) {
    throw new Error(validation.error || "Invalid file");
  }

  const bucket = options?.bucket ?? (options?.folder === "avatars" ? "avatars" : "documents");
  const folder = options?.folder ?? (bucket === "avatars" ? `${userId}` : `${userId}/portfolio`);
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${folder}/${Date.now()}_${safeName}`;

  // Try Supabase Storage if configured
  if (isSupabaseConfigured && supabase) {
    try {
      const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      });

      if (!uploadError) {
        const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(path);
        if (publicData?.publicUrl) {
          return {
            url: publicData.publicUrl,
            storageProvider: "supabase",
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
          };
        }
      } else {
        console.warn(`[Storage] Supabase storage upload returned:`, uploadError.message, `Falling back to data-url.`);
      }
    } catch (err: any) {
      console.warn(`[Storage] Supabase upload failed, falling back to data URL:`, err?.message);
    }
  }

  // Resilient fallback: data URL with compression
  const compressedUrl = await compressImage(file);
  return {
    url: compressedUrl,
    storageProvider: "data-url",
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
  };
}
