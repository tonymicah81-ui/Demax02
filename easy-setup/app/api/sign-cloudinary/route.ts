import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

export async function POST() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: 'Cloudinary configuration missing' }, { status: 500 });
  }

  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });

  const timestamp = Math.round(Date.now() / 1000);
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default';
  const signature = cloudinary.utils.api_sign_request({ timestamp, upload_preset: uploadPreset }, apiSecret);

  return NextResponse.json({ signature, timestamp, cloudName, apiKey, uploadPreset });
}
