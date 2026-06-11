import axios from "axios";
import { loadSetting } from "./platformSettings";

export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  resource_type: string;
  format: string;
  original_filename: string;
}

// Maximum allowed file size (10 MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const ALLOWED_DOC_TYPES = ['application/pdf', 'text/plain', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

export function validateFile(file: File, type: 'image' | 'doc' | 'any' = 'any'): string | null {
  if (file.size > MAX_FILE_SIZE) return `File too large — max 10 MB (got ${(file.size / 1024 / 1024).toFixed(1)} MB)`;
  if (type === 'image' && !ALLOWED_IMAGE_TYPES.includes(file.type)) return 'Invalid file type — images only (JPEG, PNG, GIF, WebP, SVG)';
  if (type === 'doc' && !ALLOWED_DOC_TYPES.includes(file.type)) return 'Invalid file type — documents only (PDF, DOC, TXT)';
  return null;
}

async function getCloudinaryConfig() {
  // Try Firestore platform settings first, fall back to env vars
  const settings = await loadSetting('cloudinary');
  return {
    cloudName: settings.cloudName || import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '',
    uploadPreset: settings.uploadPreset || import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '',
    apiKey: settings.apiKey || import.meta.env.VITE_CLOUDINARY_API_KEY || '',
  };
}

export const uploadToCloudinary = async (
  file: File,
  onProgress?: (percent: number) => void,
  fileType: 'image' | 'doc' | 'any' = 'any'
): Promise<CloudinaryUploadResponse> => {
  const validationError = validateFile(file, fileType);
  if (validationError) throw new Error(validationError);

  const config = await getCloudinaryConfig();
  if (!config.cloudName || !config.uploadPreset) {
    throw new Error('Cloudinary is not configured. Go to Platform Settings → Cloudinary to set it up.');
  }

  try {
    // Try signed upload via Netlify function first
    const signResponse = await axios.post('/.netlify/functions/sign-cloudinary', {}, { timeout: 5000 });
    const { signature, timestamp, cloudName, apiKey, uploadPreset } = signResponse.data;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);
    formData.append('upload_preset', uploadPreset);

    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
      formData,
      {
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            onProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
          }
        },
      }
    );
    return response.data;
  } catch {
    // Netlify function not available — use unsigned upload (development / no backend)
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', config.uploadPreset);

    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${config.cloudName}/upload`,
      formData,
      {
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            onProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
          }
        },
      }
    );
    return response.data;
  }
};
