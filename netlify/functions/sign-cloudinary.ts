import { v2 as cloudinary } from 'cloudinary';

export const handler = async (event: any) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const cloudName = process.env.VITE_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.VITE_CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Cloudinary configuration missing on server' }),
    };
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });

  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const params = {
      timestamp: timestamp,
      upload_preset: process.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ml_default',
    };

    const signature = cloudinary.utils.api_sign_request(params, apiSecret);

    return {
      statusCode: 200,
      body: JSON.stringify({
        signature,
        timestamp,
        cloudName,
        apiKey,
        uploadPreset: params.upload_preset,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to generate signature' }),
    };
  }
};
