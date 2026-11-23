import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Coupon, Profile, UserRole } from '../../types';

export const DEFAULT_COUPONS: Coupon[] = [
  {
    id: 'coupon_test20',
    code: 'TEST20',
    discount_percent: 20,
    title: 'ল্যাব টেস্টে ২০% স্পেশাল ছাড়',
    description: 'যেকোনো ল্যাব টেস্ট ও ডায়াগনস্টিক পরীক্ষার মূল্যে সরাসরি ২০% ছাড়।',
    applicable_to: 'tests',
    min_order_amount: 0,
    is_active: true,
    usage_count: 14,
    created_at: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'coupon_special15',
    code: 'SPECIAL15',
    discount_percent: 15,
    title: 'স্পেশাল ১৫% হেলথ ছাড়',
    description: 'সকল টেস্ট, ঔষধ ও জরুরি হোম স্বাস্থ্য সার্ভিসে ১৫% ডিসকাউন্ট।',
    applicable_to: 'all',
    min_order_amount: 0,
    is_active: true,
    usage_count: 8,
    created_at: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'coupon_nilpha10',
    code: 'NILPHA10',
    discount_percent: 10,
    title: 'নিলফা মেম্বার ১০% ছাড়',
    description: 'সাধারণ ব্যবহারকারীদের জন্য ১০% সার্বজনীন ছাড় কুপন।',
    applicable_to: 'all',
    min_order_amount: 0,
    is_active: true,
    usage_count: 22,
    created_at: '2026-01-01T00:00:00.000Z'
  }
];

const LOCAL_STORAGE_KEY = 'nilpha_coupons_cache';

export async function fetchCoupons(): Promise<Coupon[]> {
  // Check local cache first
  const local = localStorage.getItem(LOCAL_STORAGE_KEY);
  let cachedCoupons: Coupon[] = [];
  if (local) {
    try {
      cachedCoupons = JSON.parse(local);
    } catch {
      cachedCoupons = [];
    }
  }

  try {
    const snap = await getDocs(collection(db, 'coupons'));
    if (!snap.empty) {
      const list: Coupon[] = [];
      snap.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Coupon);
      });
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
      return list;
    }
  } catch (err) {
    console.warn('Could not fetch coupons from Firestore, using local/default:', err);
  }

  if (cachedCoupons && cachedCoupons.length > 0) {
    return cachedCoupons;
  }

  // Fallback to default coupons and save them
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_COUPONS));
  
  // Try to seed default coupons in firestore asynchronously
  try {
    for (const c of DEFAULT_COUPONS) {
      setDoc(doc(db, 'coupons', c.id), c, { merge: true }).catch(() => {});
    }
  } catch {
    // Ignore seeding errors
  }

  return DEFAULT_COUPONS;
}

export async function saveCoupon(coupon: Coupon): Promise<void> {
  // Update local storage
  const current = await fetchCoupons();
  const cleanCoupon: Coupon = {
    ...coupon,
    code: coupon.code.toUpperCase().trim()
  };
  const index = current.findIndex(c => c.id === cleanCoupon.id || c.code.toUpperCase() === cleanCoupon.code);
  let updated: Coupon[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = cleanCoupon;
  } else {
    updated = [cleanCoupon, ...current];
  }
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

  // Sync to firestore
  try {
    await setDoc(doc(db, 'coupons', cleanCoupon.id), cleanCoupon, { merge: true });
  } catch (err) {
    console.error('Error saving coupon to Firestore:', err);
  }
}

export async function deleteCoupon(couponId: string): Promise<void> {
  const current = await fetchCoupons();
  const updated = current.filter(c => c.id !== couponId);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

  try {
    await deleteDoc(doc(db, 'coupons', couponId));
  } catch (err) {
    console.error('Error deleting coupon from Firestore:', err);
  }
}

export async function toggleCouponStatus(couponId: string, isActive: boolean): Promise<void> {
  const current = await fetchCoupons();
  const updated = current.map(c => c.id === couponId ? { ...c, is_active: isActive } : c);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

  try {
    await updateDoc(doc(db, 'coupons', couponId), { is_active: isActive });
  } catch (err) {
    console.error('Error updating coupon status in Firestore:', err);
  }
}

export function isCouponAssignedToStaff(coupon: Coupon, staffProfile?: Profile | null): boolean {
  if (!coupon || coupon.is_active === false) return false;
  const hasSpecificIds = (coupon.assigned_staff_ids && coupon.assigned_staff_ids.length > 0) || false;
  const hasSpecificCodes = (coupon.assigned_staff_codes && coupon.assigned_staff_codes.length > 0) || false;

  if (!coupon.staff_only && !hasSpecificIds && !hasSpecificCodes) {
    return false;
  }

  if (!staffProfile) return false;

  // All-staff coupon (staff_only=true with no specific IDs/codes)
  if (!hasSpecificIds && !hasSpecificCodes) {
    return staffProfile.role === UserRole.EMPLOYEE || staffProfile.role === UserRole.ADMIN || staffProfile.role === UserRole.MODERATOR;
  }

  const staffCode = (staffProfile.referral_code || '').trim().toUpperCase();
  const matchesId = Boolean(coupon.assigned_staff_ids?.includes(staffProfile.id));
  const matchesCode = Boolean(
    staffCode && coupon.assigned_staff_codes?.some(c => c.trim().toUpperCase() === staffCode)
  );
  return matchesId || matchesCode;
}

export interface CouponValidationResult {
  valid: boolean;
  coupon?: Coupon;
  discountPercent?: number;
  discountAmount?: number;
  message: string;
}

export function validateCoupon(
  code: string,
  orderAmount: number,
  orderCategory: boolean | 'tests' | 'medicines' | 'services' | 'all' = 'tests',
  couponsList: Coupon[] = [],
  userProfile?: Profile | null
): CouponValidationResult {
  const cleanCode = (code || '').trim().toUpperCase();
  if (!cleanCode) {
    return { valid: false, message: 'দয়া করে একটি কুপন বা প্রোমো কোড লিখুন।' };
  }

  const normalizedCategory: 'tests' | 'medicines' | 'services' | 'all' =
    typeof orderCategory === 'boolean'
      ? (orderCategory ? 'tests' : 'services')
      : orderCategory;

  const list = couponsList.length > 0 ? couponsList : DEFAULT_COUPONS;
  const coupon = list.find(c => c.code.toUpperCase() === cleanCode);

  if (!coupon) {
    return { valid: false, message: `❌ "${cleanCode}" কোনো কার্যকর প্রোমো/কুপন কোড নয়।` };
  }

  if (coupon.is_active === false) {
    return { valid: false, message: `❌ দুঃখিত, "${cleanCode}" প্রোমো কোডটি বর্তমানে স্থগিত রাখা হয়েছে।` };
  }

  // Staff-specific / Staff-only promo validation
  const hasSpecificStaff = Boolean(
    (coupon.assigned_staff_ids && coupon.assigned_staff_ids.length > 0) ||
    (coupon.assigned_staff_codes && coupon.assigned_staff_codes.length > 0)
  );
  if (coupon.staff_only || hasSpecificStaff) {
    const isStaffOrAdmin = userProfile && (
      userProfile.role === UserRole.EMPLOYEE ||
      userProfile.role === UserRole.ADMIN ||
      userProfile.role === UserRole.MODERATOR
    );
    if (!isStaffOrAdmin) {
      return {
        valid: false,
        message: `❌ "${cleanCode}" শুধুমাত্র অনুমোদিত স্টাফদের জন্য নির্ধারিত প্রোমো কোড।`
      };
    }
    if (hasSpecificStaff && userProfile?.role === UserRole.EMPLOYEE) {
      const staffCode = (userProfile.referral_code || '').trim().toUpperCase();
      const matchesId = Boolean(coupon.assigned_staff_ids?.includes(userProfile.id));
      const matchesCode = Boolean(
        staffCode && coupon.assigned_staff_codes?.some(c => c.trim().toUpperCase() === staffCode)
      );
      if (!matchesId && !matchesCode) {
        return {
          valid: false,
          message: `❌ দুঃখিত, "${cleanCode}" প্রোমো কোডটি আপনার স্টাফ আইডির জন্য নির্ধারিত নয়।`
        };
      }
    }
  }

  // Category restriction checks
  if (normalizedCategory !== 'all') {
    if (coupon.applicable_to === 'tests' && normalizedCategory !== 'tests') {
      return { valid: false, message: `❌ "${cleanCode}" প্রোমো কোডটি শুধুমাত্র ল্যাব টেস্ট অর্ডারের জন্য প্রযোজ্য।` };
    }
    if (coupon.applicable_to === 'medicines' && normalizedCategory !== 'medicines') {
      return { valid: false, message: `❌ "${cleanCode}" প্রোমো কোডটি শুধুমাত্র ঔষধ ও মেডিকেল পণ্যের অর্ডারের জন্য প্রযোজ্য।` };
    }
    if (coupon.applicable_to === 'services' && normalizedCategory !== 'services') {
      return { valid: false, message: `❌ "${cleanCode}" প্রোমো কোডটি শুধুমাত্র হেলথ সার্ভিসের জন্য প্রযোজ্য।` };
    }
  }

  if (coupon.min_order_amount && orderAmount < coupon.min_order_amount) {
    return { 
      valid: false, 
      message: `❌ "${cleanCode}" প্রোমো কোড ব্যবহারের জন্য ন্যূনতম ৳${coupon.min_order_amount} টাকার অর্ডার প্রয়োজন।` 
    };
  }

  const percent = Math.min(100, Math.max(1, coupon.discount_percent || 0));
  const discountAmount = Math.round((orderAmount * percent) / 100);

  return {
    valid: true,
    coupon,
    discountPercent: percent,
    discountAmount,
    message: `🎉 প্রোমো কোড "${cleanCode}" সফলভাবে প্রয়োগ করা হয়েছে! আপনি ${percent}% ছাড় (৳${discountAmount} BDT) পেয়েছেন।`
  };
}

