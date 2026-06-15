import { v2 as cloudinary } from 'cloudinary';

export const handler = async (event: any) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Cloudinary not configured' }) };
  }

  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });

  const timestamp = Math.round(Date.now() / 1000);
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default';
  const signature = cloudinary.utils.api_sign_request({ timestamp, upload_preset: uploadPreset }, apiSecret);

  return {
    statusCode: 200,
    body: JSON.stringify({ signature, timestamp, cloudName, apiKey, uploadPreset }),
  };
};
