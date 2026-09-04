
export const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\p{L}\p{M}\p{N}-]+/gu, '')   // Remove all non-letter, non-mark, non-numeric, non-hyphen chars across all languages
    .replace(/--+/g, '-')      // Replace multiple - with single -
    .replace(/^-+/, '')        // Trim - from start of text
    .replace(/-+$/, '');       // Trim - from end of text
};

export const normalizeDigits = (str: string | number | undefined | null): string => {
  if (str === undefined || str === null) return '';
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  let res = str.toString().trim();
  for (let i = 0; i < 10; i++) {
    res = res.replace(new RegExp(bengaliDigits[i], 'g'), i.toString());
  }
  return res;
};

export const normalizePhoneNumber = (phone: string): string => {
  if (!phone) return '';
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  let converted = phone.toString().trim();
  for (let i = 0; i < 10; i++) {
    converted = converted.replace(new RegExp(bengaliDigits[i], 'g'), i.toString());
  }
  const digitsOnly = converted.replace(/\D/g, '');
  if (digitsOnly.length === 13 && digitsOnly.startsWith('8801')) {
    return digitsOnly.substring(2);
  }
  if (digitsOnly.length === 10 && digitsOnly.startsWith('1')) {
    return '0' + digitsOnly;
  }
  return digitsOnly;
};

export const toVirtualEmail = (text: string): string => {
  if (!text) return "";
  const trimmed = text.trim();
  
  // Map admin username to their actual Firebase login email
  if (trimmed.toLowerCase() === 'doctorapp0p' || trimmed.toLowerCase() === 'doctorapp0p@gmail.com') {
    return 'doctorapp0p@gmail.com';
  }
  if (trimmed.toLowerCase() === 'moderator' || trimmed.toLowerCase() === 'modaretor' || trimmed.toLowerCase() === 'moderator@nilpha.com' || trimmed.toLowerCase() === 'modaretor@nilpha.com') {
    return 'moderator@nilpha.com';
  }
  
  if (trimmed.includes('@')) return trimmed;

  const normalizedPhone = normalizePhoneNumber(trimmed);
  if (normalizedPhone.length === 11 && normalizedPhone.startsWith('01')) {
    return `${normalizedPhone}@nilpha.com`;
  }

  // Convert spaces and special characters to make a valid ASCII virtual email
  let cleaned = trimmed
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_.-]/g, '');

  if (!cleaned) {
    let hash = 0;
    for (let i = 0; i < trimmed.length; i++) {
      hash = ((hash << 5) - hash) + trimmed.charCodeAt(i);
      hash |= 0;
    }
    cleaned = `user_${Math.abs(hash)}`;
  }
  return `${cleaned}@nilpha.com`;
};

export const getLoginCandidateEmails = (text: string): string[] => {
  if (!text) return [];
  const trimmed = text.trim();
  const candidates: string[] = [];

  const addCand = (email: string) => {
    if (!email) return;
    const lower = email.toLowerCase().trim();
    if (lower && !candidates.includes(lower)) {
      candidates.push(lower);
    }
  };

  if (trimmed.toLowerCase() === 'doctorapp0p' || trimmed.toLowerCase() === 'doctorapp0p@gmail.com') {
    return ['doctorapp0p@gmail.com'];
  }
  if (trimmed.toLowerCase() === 'moderator' || trimmed.toLowerCase() === 'modaretor' || trimmed.toLowerCase() === 'moderator@nilpha.com' || trimmed.toLowerCase() === 'modaretor@nilpha.com') {
    return ['moderator@nilpha.com'];
  }

  if (trimmed.includes('@')) {
    addCand(trimmed);
    if (trimmed.endsWith('@nilpha.com')) {
      addCand(trimmed.replace('@nilpha.com', '@phone.virtual'));
    } else if (trimmed.endsWith('@phone.virtual')) {
      addCand(trimmed.replace('@phone.virtual', '@nilpha.com'));
    }
    return candidates;
  }

  const primaryVirtual = toVirtualEmail(trimmed);
  addCand(primaryVirtual);

  const normalizedPhone = normalizePhoneNumber(trimmed);
  if (normalizedPhone) {
    addCand(`${normalizedPhone}@nilpha.com`);
    addCand(`${normalizedPhone}@phone.virtual`);

    if (normalizedPhone.length === 11 && normalizedPhone.startsWith('01')) {
      addCand(`88${normalizedPhone}@nilpha.com`);
      addCand(`88${normalizedPhone}@phone.virtual`);
      addCand(`${normalizedPhone.substring(1)}@nilpha.com`);
      addCand(`${normalizedPhone.substring(1)}@phone.virtual`);
    }
  }

  const cleanedUsername = trimmed.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9_.-]/g, '');
  if (cleanedUsername) {
    addCand(`${cleanedUsername}@nilpha.com`);
    addCand(`${cleanedUsername}@phone.virtual`);
  }

  return candidates;
};

export const convertToBanglaDigits = (numStr: string | number | undefined | null): string => {
  if (numStr === undefined || numStr === null) return '';
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(numStr).replace(/[0-9]/g, (w) => banglaDigits[parseInt(w, 10)] || w);
};

export interface SubscriptionTimeCalculation {
  isActive: boolean;
  isExpired: boolean;
  remainingDays: number;
  totalDays: number;
  progressPercent: number;
  formattedActivationDate: string;
  formattedExpiryDate: string;
  remainingDaysBengaliText: string;
}

export const calculateSubscriptionTiming = (sub: {
  valid_from?: string;
  valid_until?: string;
  created_at?: string;
  approved_at?: string;
  duration_years?: number;
  years?: number;
  status?: string;
} | null | undefined): SubscriptionTimeCalculation => {
  if (!sub) {
    return {
      isActive: false,
      isExpired: true,
      remainingDays: 0,
      totalDays: 0,
      progressPercent: 0,
      formattedActivationDate: 'প্রযোজ্য নয়',
      formattedExpiryDate: 'প্রযোজ্য নয়',
      remainingDaysBengaliText: 'সাবস্ক্রিপশন নেই'
    };
  }

  const now = new Date();
  
  // Determine start date
  let startDate: Date;
  if (sub.valid_from) {
    startDate = new Date(sub.valid_from);
  } else if (sub.approved_at) {
    startDate = new Date(sub.approved_at);
  } else if (sub.created_at) {
    startDate = new Date(sub.created_at);
  } else {
    startDate = new Date();
  }

  const durationYears = sub.duration_years || sub.years || 3;

  // Determine end date
  let endDate: Date;
  if (sub.valid_until) {
    endDate = new Date(sub.valid_until);
  } else {
    endDate = new Date(startDate);
    endDate.setFullYear(startDate.getFullYear() + durationYears);
  }

  const msPerDay = 1000 * 60 * 60 * 24;
  const totalDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / msPerDay));
  const diffFromNow = endDate.getTime() - now.getTime();
  const remainingDays = Math.max(0, Math.ceil(diffFromNow / msPerDay));
  const isExpired = remainingDays <= 0 || (sub.status === 'expired');
  const isActive = !isExpired && (sub.status === 'approved' || !sub.status);
  const elapsedDays = totalDays - remainingDays;
  const progressPercent = Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100)));

  const formatDateBn = (d: Date): string => {
    if (isNaN(d.getTime())) return 'N/A';
    const day = convertToBanglaDigits(d.getDate());
    const year = convertToBanglaDigits(d.getFullYear());
    const banglaMonths = [
      'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
      'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
    ];
    return `${day} ${banglaMonths[d.getMonth()]} ${year}`;
  };

  let remainingText = '';
  if (isExpired) {
    remainingText = 'মেয়াদ উত্তীর্ণ (Expired)';
  } else if (remainingDays > 365) {
    const years = Math.floor(remainingDays / 365);
    const months = Math.floor((remainingDays % 365) / 30);
    remainingText = `${convertToBanglaDigits(remainingDays)} দিন বাকি (${convertToBanglaDigits(years)} বছর ${months > 0 ? convertToBanglaDigits(months) + ' মাস' : ''})`;
  } else if (remainingDays > 30) {
    const months = Math.floor(remainingDays / 30);
    remainingText = `${convertToBanglaDigits(remainingDays)} দিন বাকি (প্রায় ${convertToBanglaDigits(months)} মাস)`;
  } else {
    remainingText = `${convertToBanglaDigits(remainingDays)} দিন বাকি`;
  }

  return {
    isActive,
    isExpired,
    remainingDays,
    totalDays,
    progressPercent,
    formattedActivationDate: formatDateBn(startDate),
    formattedExpiryDate: formatDateBn(endDate),
    remainingDaysBengaliText: remainingText
  };
};

