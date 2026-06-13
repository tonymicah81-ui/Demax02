import { db, doc, getDoc, setDoc, addDoc, collection, getDocs, query, where, serverTimestamp } from '../firebase';
import { generateBulkCodes } from './couponService';

export interface ReferralMilestone {
  count: number;
  rewardType: 'coupon';
  couponValue: number;
  discountType: 'percentage' | 'fixed';
  couponType: 'marketplace' | 'subscription';
  label: string;
}

export interface ReferralSettings {
  milestones: ReferralMilestone[];
}

export interface ReferralDoc {
  userId: string;
  referralCode: string;
  totalReferrals: number;
  milestonesReached: number[];
  createdAt: any;
}

export function generateReferralCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function createReferralDoc(userId: string): Promise<string> {
  const code = generateReferralCode();
  await setDoc(doc(db, 'referrals', userId), {
    userId,
    referralCode: code,
    totalReferrals: 0,
    milestonesReached: [],
    createdAt: serverTimestamp(),
  });
  return code;
}

export async function getReferralDoc(userId: string): Promise<ReferralDoc | null> {
  try {
    const snap = await getDoc(doc(db, 'referrals', userId));
    if (snap.exists()) return { userId: snap.id, ...snap.data() } as ReferralDoc;
  } catch {}
  return null;
}

export async function loadReferralSettings(): Promise<ReferralSettings> {
  try {
    const snap = await getDoc(doc(db, 'platform_settings', 'referral_settings'));
    if (snap.exists()) return snap.data() as ReferralSettings;
  } catch {}
  return { milestones: [] };
}

export async function processReferral(referredUserId: string, referralCode: string): Promise<void> {
  try {
    const q = query(collection(db, 'referrals'), where('referralCode', '==', referralCode));
    const snap = await getDocs(q);
    if (snap.empty) return;

    const referrerDoc = snap.docs[0];
    const referrerId = referrerDoc.id;
    const currentData = referrerDoc.data() as ReferralDoc;
    const newTotal = (currentData.totalReferrals || 0) + 1;

    await addDoc(collection(db, 'referral_events'), {
      referrerId,
      referredUserId,
      referralCode,
      rewardGranted: false,
      createdAt: serverTimestamp(),
    });

    const settings = await loadReferralSettings();
    const alreadyReached = currentData.milestonesReached || [];
    const newMilestones: number[] = [...alreadyReached];

    for (const milestone of settings.milestones) {
      if (newTotal >= milestone.count && !alreadyReached.includes(milestone.count)) {
        newMilestones.push(milestone.count);
        const [code] = generateBulkCodes('REF', 1);
        await addDoc(collection(db, 'coupons'), {
          code,
          type: milestone.couponType,
          discountType: milestone.discountType,
          value: milestone.couponValue,
          usageLimit: 1,
          usedCount: 0,
          expiresAt: null,
          minAmount: null,
          active: true,
          createdBy: 'system',
          description: `Referral milestone reward — ${milestone.label}`,
          createdAt: serverTimestamp(),
        });
        await addDoc(collection(db, 'user_coupons'), {
          userId: referrerId,
          couponCode: code,
          grantedBy: 'system',
          grantedAt: serverTimestamp(),
          used: false,
        });
      }
    }

    await setDoc(doc(db, 'referrals', referrerId), {
      totalReferrals: newTotal,
      milestonesReached: newMilestones,
    }, { merge: true });
  } catch (err) {
    console.warn('Referral processing failed (non-blocking):', err);
  }
}
