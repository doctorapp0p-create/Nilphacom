import { Order } from '../../types';

export const CLINIC_WHATSAPP_NUMBER = '8801352669100';

/**
 * Normalizes a Bangladeshi or international phone number into wa.me digits format (e.g., 88017xxxxxxxx).
 * Returns null if the number is empty or too short to be valid.
 */
export const normalizeWhatsAppPhone = (rawPhone?: string | null): string | null => {
  if (!rawPhone) return null;
  let digits = rawPhone.replace(/[^0-9]/g, '');
  if (!digits) return null;

  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }
  if (digits.startsWith('01') && digits.length === 11) {
    digits = `88${digits}`;
  } else if (digits.startsWith('1') && digits.length === 10) {
    digits = `880${digits}`;
  } else if (digits.startsWith('8801') && digits.length === 13) {
    // Already normalized
  } else if (digits.length < 10) {
    return null;
  }
  return digits;
};

export interface OrderBreakdown {
  originalAmount: number;
  discountAmount: number;
  discountPercent: number;
  discountedSubtotal: number;
  shipping: number;
  finalTotal: number;
}

export const getOrderBreakdown = (order: Partial<Order>): OrderBreakdown => {
  const itemsTotal =
    Array.isArray(order.items) && order.items.length > 0
      ? order.items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0)
      : 0;

  const netAmount = Math.max(0, Number(order.amount) || 0);
  const rawOriginal = Number(order.original_amount) || itemsTotal || netAmount;
  const originalAmount = Math.max(rawOriginal, netAmount);

  const recordedDiscount =
    Number(order.coupon_discount_amount) ||
    Number(order.manual_discount_amount) ||
    Math.max(0, originalAmount - netAmount);

  const discountAmount = Math.max(0, recordedDiscount);
  const discountPercent =
    Number(order.coupon_discount_percent) ||
    (originalAmount > 0 && discountAmount > 0 ? Math.round((discountAmount / originalAmount) * 100) : 0);

  const shipping = Math.max(0, Number(order.shipping) || 0);
  const finalTotal = netAmount + shipping;

  return {
    originalAmount,
    discountAmount,
    discountPercent,
    discountedSubtotal: netAmount,
    shipping,
    finalTotal
  };
};

export const getOrderStatusLabelBn = (status?: Order['status']): string => {
  switch (status) {
    case 'verified':
      return 'কনফার্মকৃত (Verified)';
    case 'processing':
      return 'প্রসেসিং চলছে (Processing)';
    case 'completed':
      return 'সম্পন্ন (Completed)';
    case 'cancelled':
      return 'বাতিল (Cancelled)';
    default:
      return 'পেন্ডিং রিভিউ (Pending)';
  }
};

export interface WhatsAppMessageStaffContext {
  staffId?: string;
  staffName?: string;
  staffCode?: string;
  staffDesignation?: string;
}

/**
 * Builds an itemized, transparent Bengali WhatsApp confirmation message showing:
 * - Order ID, Status & Date
 * - Patient Details
 * - Every ordered item (quantity & line price)
 * - Original Price, Exact Discount Amount & Promo Code, Delivery/Collection Fee, Net Payable Total
 * - Confirming Staff Name & Staff ID/Code
 */
export const buildOrderWhatsAppMessage = (
  order: Order,
  staffContext?: WhatsAppMessageStaffContext,
  audience: 'patient_receipt' | 'clinic_confirmation' = 'patient_receipt'
): string => {
  const breakdown = getOrderBreakdown(order);
  const patientName = order.patient_name || order.sender_name || 'সম্মানিত রোগী/গ্রাহক';
  const patientPhone = order.sender_contact || 'উল্লেখ নেই';
  const address = order.delivery_address || 'উল্লেখ নেই';
  const orderId = order.id || 'N/A';

  let dateStr = '';
  try {
    dateStr = order.created_at
      ? new Date(order.created_at).toLocaleString('bn-BD', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : new Date().toLocaleDateString('bn-BD');
  } catch {
    dateStr = new Date().toLocaleDateString('bn-BD');
  }

  const lines: string[] = [];

  if (audience === 'clinic_confirmation') {
    lines.push('🏥 *নিলফা হেলথকেয়ার — রোগীর সরাসরি অর্ডার কনফার্মেশন*');
  } else {
    lines.push('🏥 *নিলফা হেলথকেয়ার — অর্ডার ও ডিসকাউন্ট কনফার্মেশন*');
  }
  lines.push('──────────────────────');
  lines.push(`🆔 *অর্ডার আইডি:* ${orderId}`);
  lines.push(`📌 *অর্ডার স্ট্যাটাস:* ${getOrderStatusLabelBn(order.status)}`);
  lines.push(`📅 *তারিখ ও সময়:* ${dateStr}`);
  lines.push('');

  lines.push('👤 *রোগী / ক্রেতার তথ্য:*');
  lines.push(`• নাম: ${patientName}`);
  lines.push(`• মোবাইল: ${patientPhone}`);
  lines.push(`• ঠিকানা: ${address}`);
  if (order.hospital_name) {
    lines.push(`• ল্যাব / হাসপাতাল: ${order.hospital_name}`);
  }
  lines.push('');

  lines.push('📦 *রোগীর জন্য কী কী অর্ডার করা হয়েছে:*');
  if (Array.isArray(order.items) && order.items.length > 0) {
    order.items.forEach((item, index) => {
      const qty = Number(item.quantity) || 1;
      const unitPrice = Number(item.price) || 0;
      const lineTotal = unitPrice * qty;
      lines.push(`${index + 1}. ${item.name} (${qty}টি × ৳${unitPrice}) = ৳${lineTotal}`);
    });
  } else {
    lines.push(`• ${order.item_name || 'হেলথ সার্ভিস / পণ্য'}`);
  }
  lines.push('');

  lines.push('💰 *মূল্য ও ডিসকাউন্ট (ছাড়) বিবরণ:*');
  lines.push(`• মোট মূল মূল্য: ৳${breakdown.originalAmount}`);
  if (breakdown.discountAmount > 0) {
    const promoPart = order.coupon_code ? ` [${order.coupon_code}]` : '';
    const pctPart = breakdown.discountPercent > 0 ? ` (${breakdown.discountPercent}% ছাড়)` : '';
    lines.push(`• 🎉 ডিসকাউন্ট / ছাড়${promoPart}${pctPart}: -৳${breakdown.discountAmount}`);
    lines.push(`• ছাড়ের পর মূল্য: ৳${breakdown.discountedSubtotal}`);
  } else {
    lines.push('• ডিসকাউন্ট / ছাড়: ৳০');
  }
  lines.push(
    `• ডেলিভারি / স্যাম্পল সংগ্রহ চার্জ: ৳${breakdown.shipping}${
      order.delivery_distance_label ? ` (${order.delivery_distance_label})` : ''
    }`
  );
  lines.push(`• *সর্বমোট প্রদেয় বিল: ৳${breakdown.finalTotal} টাকা*`);
  lines.push('');

  lines.push(
    `💳 *পেমেন্ট পদ্ধতি:* ${order.payment_method || 'Cash on Delivery'}${
      order.trx_id ? ` | TrxID: ${order.trx_id}` : ''
    }`
  );

  const staffName =
    order.confirmed_by_staff_name || staffContext?.staffName || order.staff_name;
  const staffCode =
    order.confirmed_by_staff_code || staffContext?.staffCode || order.staff_code || order.referred_by_code;
  const staffId =
    order.confirmed_by_staff_id || staffContext?.staffId || order.staff_id;
  const staffDesig =
    order.confirmed_by_staff_designation || staffContext?.staffDesignation;

  if (staffName || staffCode || staffId) {
    lines.push('');
    lines.push('👨‍💼 *কনফার্মকারী স্টাফের তথ্য:*');
    if (staffName) {
      lines.push(`• স্টাফের নাম: ${staffName}${staffDesig ? ` (${staffDesig})` : ''}`);
    }
    if (staffCode || staffId) {
      lines.push(
        `• স্টাফ আইডি / কোড: ${staffCode ? `${staffCode}` : ''}${
          staffCode && staffId ? ` (ID: ${staffId})` : !staffCode && staffId ? staffId : ''
        }`
      );
    }
  }

  lines.push('');
  if (audience === 'clinic_confirmation') {
    lines.push('আমি আমার উপরের অর্ডার ও ডিসকাউন্ট বিবরণ যাচাই করে কনফার্ম করছি।');
  } else {
    lines.push('আপনার অর্ডারটির সম্পূর্ণ তালিকা ও ডিসকাউন্ট হিসাব উপরে দেওয়া হলো। যেকোনো প্রয়োজনে আমাদের সাথে যোগাযোগ করুন। ধন্যবাদ!');
  }

  return lines.join('\n');
};

export const buildWhatsAppHref = (phone: string | null | undefined, message: string, fallbackClinic = false): string => {
  const normalized = normalizeWhatsAppPhone(phone);
  const target = normalized || (fallbackClinic ? CLINIC_WHATSAPP_NUMBER : '');
  if (!target) {
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  }
  return `https://wa.me/${target}?text=${encodeURIComponent(message)}`;
};
