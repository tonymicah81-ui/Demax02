import { useState, useEffect } from 'react';
import { db, doc, getDoc, setDoc, updateDoc, serverTimestamp } from '../firebase';

// ─── Vault (separate `vault` collection) ────────────────────────────────────
export interface VaultConfig {
  status: 'active' | 'inactive' | '';
  pin: string;
  lastTimeVisit: string;    // ISO date string | ''
  countTryNumber: number;
  lastLockTime: string;     // ISO date string | ''
}

export const VAULT_CONFIG_DEFAULT: VaultConfig = {
  status: '',
  pin: '',
  lastTimeVisit: '',
  countTryNumber: 0,
  lastLockTime: '',
};

export async function loadVaultConfig(): Promise<VaultConfig> {
  try {
    const snap = await getDoc(doc(db, 'vault', 'config'));
    if (snap.exists()) return { ...VAULT_CONFIG_DEFAULT, ...snap.data() } as VaultConfig;
  } catch {
    // Return default on any error
  }
  return { ...VAULT_CONFIG_DEFAULT };
}

export async function saveVaultConfig(data: Partial<VaultConfig>): Promise<void> {
  await setDoc(doc(db, 'vault', 'config'), data, { merge: true });
}

export async function updateVaultTracking(data: {
  lastTimeVisit?: string;
  countTryNumber?: number;
  lastLockTime?: string;
}): Promise<void> {
  try {
    await updateDoc(doc(db, 'vault', 'config'), data);
  } catch {
    // Silently ignore — tracking is best-effort
  }
}

// ─── Platform Settings (platform_settings collection) ───────────────────────
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

export interface SubscriptionSettings {
  emailBasicPrice: number;
  emailProPrice: number;
  botPrice: number;
  updatedAt?: any;
}

export interface BrandingSettings {
  logoUrl: string;
  heroImageUrl: string;
  faviconUrl: string;
  updatedAt?: any;
}

export interface AdsSettings {
  adsenseClientId: string;
  adsSlotId: string;
  adsEnabled: boolean;
  adsFrequency: number;
  updatedAt?: any;
}

export interface AnnouncementItem {
  id: string;
  message: string;
  type: 'promo' | 'info' | 'ad';
  active: boolean;
  link?: string;
}

export interface AnnouncementsSettings {
  items: AnnouncementItem[];
  updatedAt?: any;
}

export interface PaymentSettings {
  halfPaymentGlobal: boolean;
  updatedAt?: any;
}

export interface PlatformSettings {
  cloudinary: CloudinarySettings;
  loading: LoadingSettings;
  general: GeneralSettings;
  subscriptions: SubscriptionSettings;
  branding: BrandingSettings;
  ads: AdsSettings;
  announcements: AnnouncementsSettings;
  payment: PaymentSettings;
}

const DEFAULTS: PlatformSettings = {
  cloudinary: { cloudName: '', uploadPreset: '', apiKey: '' },
  loading: { effect: 'default', logoUrl: '', customHTML: '', customCSS: '' },
  general: { supportEmail: 'support@durax.com' },
  subscriptions: { emailBasicPrice: 15, emailProPrice: 30, botPrice: 20 },
  branding: { logoUrl: '', heroImageUrl: '', faviconUrl: '' },
  ads: { adsenseClientId: '', adsSlotId: '', adsEnabled: false, adsFrequency: 6 },
  announcements: { items: [] },
  payment: { halfPaymentGlobal: false },
};

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
