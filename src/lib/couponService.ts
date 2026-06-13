import { db, collection, query, where, getDocs, addDoc, doc, getDoc, runTransaction, serverTimestamp } from '../firebase';

export type CouponType = 'marketplace' | 'subscription';
export type DiscountType = 'percentage' | 'fixed';

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  discountType: DiscountType;
  value: number;
  usageLimit: number | null;
  usedCount: number;
  expiresAt: string | null;
  minAmount: number | null;
  active: boolean;
  createdBy: string;
  description: string;
  createdAt: any;
}

export interface CouponValidation {
  valid: boolean;
  coupon?: Coupon;
  error?: string;
  discountAmount?: number;
}

export async function validateCoupon(
  code: string,
  type: CouponType,
  orderAmount: number = 0
): Promise<CouponValidation> {
  try {
    const q = query(collection(db, 'coupons'), where('code', '==', code.toUpperCase().trim()));
    const snap = await getDocs(q);
    if (snap.empty) return { valid: false, error: 'Coupon code not found' };

    const couponDoc = snap.docs[0];
    const coupon = { id: couponDoc.id, ...couponDoc.data() } as Coupon;

    if (!coupon.active) return { valid: false, error: 'This coupon is no longer active' };
    if (coupon.type !== type) return { valid: false, error: `This coupon is only valid for ${coupon.type} purchases` };
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) return { valid: false, error: 'This coupon has expired' };
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) return { valid: false, error: 'This coupon has reached its usage limit' };
    if (coupon.minAmount !== null && orderAmount < coupon.minAmount) return { valid: false, error: `Minimum order amount of $${coupon.minAmount} required` };

    const discountAmount = coupon.discountType === 'percentage'
      ? (orderAmount * coupon.value) / 100
      : Math.min(coupon.value, orderAmount);

    return { valid: true, coupon, discountAmount };
  } catch (err) {
    return { valid: false, error: 'Failed to validate coupon' };
  }
}

export async function redeemCoupon(
  couponId: string,
  userId: string,
  context?: { orderId?: string; subscriptionId?: string }
): Promise<void> {
  await runTransaction(db, async (tx) => {
    const couponRef = doc(db, 'coupons', couponId);
    const couponSnap = await tx.get(couponRef);
    if (!couponSnap.exists()) throw new Error('Coupon not found');
    const data = couponSnap.data();
    if (data.usageLimit !== null && data.usedCount >= data.usageLimit) throw new Error('Coupon limit exceeded');
    tx.update(couponRef, { usedCount: (data.usedCount || 0) + 1 });
  });

  await addDoc(collection(db, 'coupon_usages'), {
    couponId,
    userId,
    orderId: context?.orderId || null,
    subscriptionId: context?.subscriptionId || null,
    usedAt: serverTimestamp(),
  });
}

export async function getUserCoupons(userId: string): Promise<any[]> {
  try {
    const q = query(collection(db, 'user_coupons'), where('userId', '==', userId), where('used', '==', false));
    const snap = await getDocs(q);
    const userCoupons = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

    const enriched = await Promise.all(userCoupons.map(async (uc) => {
      try {
        const couponSnap = await getDoc(doc(db, 'coupons', uc.couponId));
        if (couponSnap.exists()) return { ...uc, coupon: { id: couponSnap.id, ...couponSnap.data() } };
      } catch {}
      return uc;
    }));

    return enriched;
  } catch {
    return [];
  }
}

export function generateCouponCode(prefix: string = ''): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const random = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return prefix ? `${prefix.toUpperCase()}-${random}` : random;
}

export function generateBulkCodes(prefix: string, count: number): string[] {
  const codes = new Set<string>();
  while (codes.size < count) codes.add(generateCouponCode(prefix));
  return Array.from(codes);
}
