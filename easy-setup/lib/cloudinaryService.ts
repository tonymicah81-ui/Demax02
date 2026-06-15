import axios from 'axios';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

interface UploadResult {
  url: string;
  publicId: string;
}

async function getCloudinaryConfig() {
  try {
    const snap = await getDoc(doc(db, 'platform_settings', 'config'));
    if (snap.exists()) {
      const data = snap.data();
      const c = data?.cloudinary;
      if (c?.cloudName && c?.uploadPreset && c?.apiKey) return c;
    }
  } catch {}
  return {
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '',
    uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '',
    apiKey: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || '',
  };
}

export async function uploadToCloudinary(
  file: File,
  onProgress?: (pct: number) => void
): Promise<UploadResult> {
  const config = await getCloudinaryConfig();

  // Get signature from Netlify Function
  const signRes = await axios.post('/.netlify/functions/sign-cloudinary');
  const { signature, timestamp, uploadPreset } = signRes.data;

  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', uploadPreset || config.uploadPreset);
  fd.append('api_key', config.apiKey);
  fd.append('timestamp', timestamp.toString());
  fd.append('signature', signature);

  const res = await axios.post(
    `https://api.cloudinary.com/v1_1/${config.cloudName}/upload`,
    fd,
    { onUploadProgress: e => onProgress?.(Math.round((e.loaded / (e.total || 1)) * 100)) }
  );

  return { url: res.data.secure_url, publicId: res.data.public_id };
}
