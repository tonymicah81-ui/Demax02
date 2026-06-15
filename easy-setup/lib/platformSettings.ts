import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { PlatformBranding, PlatformSEO, PlatformToggles, EmailSettings, CloudinarySettings } from '@/types';

export interface AllPlatformSettings {
  branding: PlatformBranding;
  seo: PlatformSEO;
  toggles: PlatformToggles;
  email: EmailSettings;
  cloudinary: CloudinarySettings;
}

const DEFAULTS: AllPlatformSettings = {
  branding: {
    platformName: 'My Platform',
    tagline: 'Your SaaS, your rules.',
    primaryColor: '#6366f1',
    secondaryColor: '#8b5cf6',
    logoUrl: '',
    faviconUrl: '',
  },
  seo: {
    metaTitle: 'My Platform',
    metaDescription: 'A powerful SaaS platform.',
    ogImageUrl: '',
  },
  toggles: {
    registrationOpen: true,
    maintenanceMode: false,
    maintenanceMessage: 'We are performing scheduled maintenance. Back soon!',
  },
  email: { provider: 'emailjs' },
  cloudinary: { cloudName: '', uploadPreset: '', apiKey: '' },
};

export async function loadAllSettings(): Promise<AllPlatformSettings> {
  try {
    const snap = await getDoc(doc(db, 'platform_settings', 'config'));
    if (!snap.exists()) return DEFAULTS;
    const data = snap.data();
    return {
      branding: { ...DEFAULTS.branding, ...(data.branding || {}) },
      seo: { ...DEFAULTS.seo, ...(data.seo || {}) },
      toggles: { ...DEFAULTS.toggles, ...(data.toggles || {}) },
      email: { ...DEFAULTS.email, ...(data.email || {}) },
      cloudinary: { ...DEFAULTS.cloudinary, ...(data.cloudinary || {}) },
    };
  } catch {
    return DEFAULTS;
  }
}

export async function saveSettings(key: keyof AllPlatformSettings, value: any): Promise<void> {
  await setDoc(doc(db, 'platform_settings', 'config'), { [key]: value }, { merge: true });
}

export function buildCssVariables(branding: PlatformBranding): string {
  return `
    :root {
      --color-primary: ${branding.primaryColor};
      --color-secondary: ${branding.secondaryColor};
    }
  `;
}
