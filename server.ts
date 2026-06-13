import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

app.post('/.netlify/functions/sign-cloudinary', (req, res) => {
  const cloudName = process.env.VITE_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.VITE_CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return res.status(500).json({ error: 'Cloudinary configuration missing on server' });
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });

  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const uploadPreset = process.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ml_default';
    const params = { timestamp, upload_preset: uploadPreset };
    const signature = cloudinary.utils.api_sign_request(params, apiSecret);

    res.json({ signature, timestamp, cloudName, apiKey, uploadPreset });
  } catch {
    res.status(500).json({ error: 'Failed to generate signature' });
  }
});

const PORT = process.env.API_PORT || 3001;
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});
