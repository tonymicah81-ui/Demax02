import { useState, useEffect } from 'react';
import { db, doc, getDoc, setDoc, serverTimestamp } from '../firebase';

export interface VaultSettings {
  active: boolean;
  pinHash: string;
  updatedAt?: any;
}

export interface CloudinarySettings {
  cloudName: string;
  uploadPreset: string;
  apiKey: string;
  updatedAt?: any;
}

export interface LoadingSettings {
  effect: 'default' | 'pulse' | 'scan' | 'custom';
  logoUrl: string;
  customHTML: string;
  customCSS: string;
  updatedAt?: any;
}

export interface GeneralSettings {
  supportEmail: string;
  updatedAt?: any;
}

export interface PlatformSettings {
  vault: VaultSettings;
  cloudinary: CloudinarySettings;
  loading: LoadingSettings;
  general: GeneralSettings;
}

const DEFAULTS: PlatformSettings = {
  vault: { active: false, pinHash: '' },
  cloudinary: { cloudName: '', uploadPreset: '', apiKey: '' },
  loading: { effect: 'default', logoUrl: '', customHTML: '', customCSS: '' },
  general: { supportEmail: 'support@durax.com' },
};

export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + 'durex_vault_salt');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function verifyPin(entered: string, storedHash: string): Promise<boolean> {
  if (!storedHash) return false;
  const hash = await hashPin(entered);
  return hash === storedHash;
}

export async function loadSetting<K extends keyof PlatformSettings>(key: K): Promise<PlatformSettings[K]> {
  try {
    const snap = await getDoc(doc(db, 'platform_settings', key));
    if (snap.exists()) return snap.data() as PlatformSettings[K];
  } catch {
    // Return default if unavailable
  }
  return DEFAULTS[key];
}

export async function saveSetting<K extends keyof PlatformSettings>(
  key: K,
  data: Partial<PlatformSettings[K]>
): Promise<void> {
  await setDoc(doc(db, 'platform_settings', key), {
    ...data,
    updatedAt: serverTimestamp()
  }, { merge: true });
}

export function usePlatformSetting<K extends keyof PlatformSettings>(key: K) {
  const [data, setData] = useState<PlatformSettings[K]>(DEFAULTS[key]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSetting(key).then(result => {
      setData(result);
      setLoading(false);
    });
  }, [key]);

  return { data, loading };
}
