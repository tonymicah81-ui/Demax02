import axios from "axios";
import { loadSetting } from "./platformSettings";

export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  resource_type: string;
  format: string;
  original_filename: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
const ALLOWED_DOC_TYPES = [
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export function validateFile(file: File, type: "image" | "doc" | "any" = "any"): string | null {
  if (file.size > MAX_FILE_SIZE)
    return `File too large — max 10 MB (got ${(file.size / 1024 / 1024).toFixed(1)} MB)`;
  if (type === "image" && !ALLOWED_IMAGE_TYPES.includes(file.type))
    return "Invalid file type — images only (JPEG, PNG, GIF, WebP, SVG)";
  if (type === "doc" && !ALLOWED_DOC_TYPES.includes(file.type))
    return "Invalid file type — documents only (PDF, DOC, TXT)";
  return null;
}

// ─── localStorage cache ──────────────────────────────────────────────────────
const CACHE_PREFIX = "dt_upload_";

function getFileCacheKey(file: File): string {
  return `${CACHE_PREFIX}${btoa(`${file.name}_${file.size}_${file.lastModified}`).replace(/=/g, "")}`;
}

export function checkFileCache(file: File): { url: string; name: string; type: string } | null {
  try {
    const raw = localStorage.getItem(getFileCacheKey(file));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function cacheFile(file: File, data: { url: string; name: string; type: string }): void {
  try {
    localStorage.setItem(getFileCacheKey(file), JSON.stringify(data));
  } catch {
    // Storage quota exceeded — ignore
  }
}

// ─── Upload ──────────────────────────────────────────────────────────────────
async function getCloudinaryConfig() {
  const settings = await loadSetting("cloudinary");
  return {
    cloudName: settings.cloudName || import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "",
    uploadPreset: settings.uploadPreset || import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "",
    apiKey: settings.apiKey || import.meta.env.VITE_CLOUDINARY_API_KEY || "",
  };
}

export const uploadToCloudinary = async (
  file: File,
  onProgress?: (percent: number) => void,
  fileType: "image" | "doc" | "any" = "any",
  signal?: AbortSignal
): Promise<CloudinaryUploadResponse> => {
  const validationError = validateFile(file, fileType);
  if (validationError) throw new Error(validationError);

  const config = await getCloudinaryConfig();
  if (!config.cloudName || !config.uploadPreset) {
    throw new Error(
      "Cloudinary is not configured. Go to Platform Settings → Cloudinary to set it up."
    );
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", config.uploadPreset);

  try {
    // Try signed upload via Netlify function first
    const signResponse = await axios.post("/.netlify/functions/sign-cloudinary", {}, {
      timeout: 4000,
      signal,
    });
    const { signature, timestamp, cloudName, apiKey, uploadPreset } = signResponse.data;

    const signedForm = new FormData();
    signedForm.append("file", file);
    signedForm.append("api_key", apiKey);
    signedForm.append("timestamp", String(timestamp));
    signedForm.append("signature", signature);
    signedForm.append("upload_preset", uploadPreset);

    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
      signedForm,
      {
        signal,
        onUploadProgress: (e) => {
          if (onProgress && e.total)
            onProgress(Math.round((e.loaded * 100) / e.total));
        },
      }
    );
    return response.data;
  } catch (err: any) {
    // If aborted, re-throw so caller can handle
    if (axios.isCancel(err) || err?.name === "AbortError" || signal?.aborted) throw err;

    // Netlify not available — fall back to unsigned direct upload
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${config.cloudName}/upload`,
      formData,
      {
        signal,
        onUploadProgress: (e) => {
          if (onProgress && e.total)
            onProgress(Math.round((e.loaded * 100) / e.total));
        },
      }
    );
    const result = response.data as CloudinaryUploadResponse;
    cacheFile(file, {
      url: result.secure_url,
      name: result.original_filename || file.name,
      type:
        result.resource_type === "image"
          ? "image"
          : result.resource_type === "video"
          ? "video"
          : "doc",
    });
    return result;
  }
};
