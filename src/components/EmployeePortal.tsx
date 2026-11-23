import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck,
  Key,
  UserPlus,
  Search,
  Copy,
  Check,
  Lock,
  TestTube,
  Gift,
  Users,
  Pill,
  CalendarCheck,
  LogOut,
  AlertCircle,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Tag,
  RefreshCw,
  CheckCircle2,
  Calendar,
  Package,
  Building2,
  Phone,
  MapPin,
  CreditCard,
  Sparkles,
  X
} from 'lucide-react';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth as getTempAuth, createUserWithEmailAndPassword, signOut as signTempOut } from 'firebase/auth';
import { doc, setDoc, addDoc, collection } from 'firebase/firestore';
import { auth, db, ensureFirebaseAuthSession } from '../../services/firebase';
import { Profile, UserRole, LabTest, Order, Doctor, Clinic, Coupon } from '../../types';
import {
  ALL_MEDICINES_DATA,
  TOP_PHARMA_COMPANIES,
  MEDICINE_TYPES
} from '../data/medicineData';
import { EMERGENCY_SERVICES } from '../../constants';
import {
  fetchCoupons,
  validateCoupon,
  isCouponAssignedToStaff
} from '../services/couponService';

interface EmployeePortalProps {
  currentProfile: Profile;
  profiles: Profile[];
  labTests: LabTest[];
  orders: Order[];
  doctors: Doctor[];
  hospitals: Clinic[];
  appointments: any[];
  coupons?: Coupon[];
  onLogout: () => void;
  onRefreshData?: () => Promise<void>;
  onRefreshCoupons?: () => Promise<void>;
  onNavigateHome?: () => void;
}

interface CartLineItem {
  id: string;
  name: string;
  subLabel?: string;
  price: number;
  quantity: number;
  category: 'medicine' | 'accessory' | 'service' | 'lab_test';
}

const getTodayDateKey = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const extractDateKey = (app: any): string => {
  const rawDate = (app.date || app.appointment_date || '').toString().trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(rawDate)) {
    return rawDate.slice(0, 10);
  }
  const created = app.created_at;
  if (created) {
    try {
      let dt: Date | null = null;
      if (typeof created === 'string') {
        const parsed = new Date(created);
        if (!isNaN(parsed.getTime())) dt = parsed;
      } else if (typeof created?.seconds === 'number') {
        dt = new Date(created.seconds * 1000);
      } else if (typeof created?.toDate === 'function') {
        dt = created.toDate();
      }
      if (dt) {
        const y = dt.getFullYear();
        const m = String(dt.getMonth() + 1).padStart(2, '0');
        const d = String(dt.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
    } catch {
      // Fallback below
    }
  }
  return 'তারিখ অজানা';
};

const formatBnDateHeader = (dateKey: string): string => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return dateKey;
  try {
    const [y, m, d] = dateKey.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString('bn-BD', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateKey;
  }
};

export const EmployeePortal: React.FC<EmployeePortalProps> = ({
  currentProfile,
  profiles,
  labTests,
  orders,
  hospitals,
  appointments,
  coupons = [],
  onLogout,
  onRefreshData,
  onRefreshCoupons,
  onNavigateHome
}) => {
  const permissions = currentProfile.permissions || {};
  const myStaffCode = (currentProfile.referral_code || '').trim().toUpperCase();
  const todayKey = useMemo(() => getTodayDateKey(), []);
  const isSuspended = currentProfile.status === 'suspended';

  const [localCoupons, setLocalCoupons] = useState<Coupon[]>(coupons);
  useEffect(() => {
    if (coupons && coupons.length > 0) {
      setLocalCoupons(coupons);
    } else {
      fetchCoupons().then(setLocalCoupons).catch(() => {});
    }
  }, [coupons]);

  const effectiveCoupons = localCoupons.length > 0 ? localCoupons : coupons;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await ensureFirebaseAuthSession();
      if (onRefreshData) await onRefreshData();
      if (onRefreshCoupons) await onRefreshCoupons();
      const latestCoupons = await fetchCoupons();
      setLocalCoupons(latestCoupons);
    } catch (e) {
      console.warn('Refresh error:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Default tab prioritizes Serial List -> Medicine Order -> Lab Tests -> Create User
  const [activeTab, setActiveTab] = useState<
    'appointments' | 'medicines' | 'lab_tests' | 'my_orders' | 'create_user' | 'my_users' | 'free_doctor'
  >('appointments');

  // Copied text helper
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // --- MY REFERRED USERS LIST ---
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const myReferredUsers = useMemo(() => {
    return profiles.filter(p => {
      const isReferredByMe = Boolean(myStaffCode && p.referred_by_code?.trim().toUpperCase() === myStaffCode);
      const isCreatedByMe = p.created_by === currentProfile.id;
      return isReferredByMe || isCreatedByMe;
    });
  }, [profiles, myStaffCode, currentProfile.id]);

  const myReferredIds = useMemo(() => new Set(myReferredUsers.map(u => u.id)), [myReferredUsers]);
  const myReferredPhones = useMemo(
    () => new Set(myReferredUsers.map(u => (u.phone || '').trim()).filter(Boolean)),
    [myReferredUsers]
  );

  const filteredMyUsers = useMemo(() => {
    if (!userSearchQuery.trim()) return myReferredUsers;
    const q = userSearchQuery.toLowerCase().trim();
    return myReferredUsers.filter(
      u =>
        (u.full_name || '').toLowerCase().includes(q) ||
        (u.phone || '').includes(q) ||
        (u.village || '').toLowerCase().includes(q) ||
        (u.upazila || '').toLowerCase().includes(q)
    );
  }, [myReferredUsers, userSearchQuery]);

  // --- ADMIN-ASSIGNED PROMO CODES FOR THIS STAFF ---
  const myAssignedPromos = useMemo(() => {
    return effectiveCoupons.filter(c => {
      if (c.is_active === false) return false;
      return isCouponAssignedToStaff(c, currentProfile);
    });
  }, [effectiveCoupons, currentProfile]);

  const generalActivePromos = useMemo(() => {
    return effectiveCoupons.filter(c => {
      if (c.is_active === false) return false;
      const hasStaffList = Boolean(
        c.staff_only ||
        (c.assigned_staff_ids && c.assigned_staff_ids.length > 0) ||
        (c.assigned_staff_codes && c.assigned_staff_codes.length > 0)
      );
      return !hasStaffList;
    });
  }, [effectiveCoupons]);

  // --- STAFF SERIALS / APPOINTMENTS (DATE-WISE) ---
  const [appScope, setAppScope] = useState<'mine' | 'all'>('mine');
  const [appDateFilter, setAppDateFilter] = useState<string>(''); // '' = all dates, YYYY-MM-DD = specific date
  const [appSearch, setAppSearch] = useState('');

  const myAppointments = useMemo(() => {
    return appointments.filter(a => {
      const refCode = (a.referred_by_code || '').trim().toUpperCase();
      const matchRef = Boolean(myStaffCode && refCode === myStaffCode);
      const matchCreator = a.created_by === currentProfile.id || a.staff_id === currentProfile.id;
      const matchPatientId = Boolean(a.patient_id && myReferredIds.has(a.patient_id));
      const matchPhone = Boolean(a.patient_phone && myReferredPhones.has(a.patient_phone.trim()));
      return matchRef || matchCreator || matchPatientId || matchPhone;
    });
  }, [appointments, myStaffCode, currentProfile.id, myReferredIds, myReferredPhones]);

  const baseAppointmentsList = useMemo(() => {
    if (appScope === 'all' && permissions.manage_appointments) return appointments;
    return myAppointments;
  }, [appScope, permissions.manage_appointments, appointments, myAppointments]);

  const todayMySerialCount = useMemo(
    () => myAppointments.filter(a => extractDateKey(a) === todayKey).length,
    [myAppointments, todayKey]
  );

  const filteredScopedAppointments = useMemo(() => {
    return baseAppointmentsList.filter(a => {
      if (appDateFilter && extractDateKey(a) !== appDateFilter) {
        return false;
      }
      if (appSearch.trim()) {
        const q = appSearch.toLowerCase().trim();
        return (
          (a.patient_name || '').toLowerCase().includes(q) ||
          (a.patient_phone || '').toLowerCase().includes(q) ||
          (a.doctor_name || '').toLowerCase().includes(q) ||
          (a.referred_by_code || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [baseAppointmentsList, appDateFilter, appSearch]);

  const dateGroupedAppointments = useMemo(() => {
    const map = new Map<string, any[]>();
    filteredScopedAppointments.forEach(app => {
      const key = extractDateKey(app);
      const arr = map.get(key) || [];
      arr.push(app);
      map.set(key, arr);
    });
    return Array.from(map.entries()).sort((a, b) => {
      if (a[0] === 'তারিখ অজানা') return 1;
      if (b[0] === 'তারিখ অজানা') return -1;
      return b[0].localeCompare(a[0]);
    });
  }, [filteredScopedAppointments]);

  // --- STAFF ORDERS LIST (Created locally + fetched) ---
  const [locallyCreatedOrders, setLocallyCreatedOrders] = useState<Order[]>([]);
  const myStaffOrders = useMemo(() => {
    const merged = [...locallyCreatedOrders, ...orders];
    const seen = new Set<string>();
    const unique: Order[] = [];
    merged.forEach(o => {
      const key = o.id || `${o.created_at}_${o.item_name}_${o.sender_contact}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(o);
      }
    });
    return unique.filter(o => {
      const matchStaffId = o.staff_id === currentProfile.id || o.user_id === currentProfile.id;
      const matchStaffCode = Boolean(
        myStaffCode &&
          ((o.staff_code || '').trim().toUpperCase() === myStaffCode ||
            (o.referred_by_code || '').trim().toUpperCase() === myStaffCode)
      );
      return matchStaffId || matchStaffCode;
    });
  }, [locallyCreatedOrders, orders, currentProfile.id, myStaffCode]);

  const [orderHistoryFilter, setOrderHistoryFilter] = useState<'all' | 'medicine' | 'lab_test'>('all');
  const filteredMyStaffOrders = useMemo(() => {
    if (orderHistoryFilter === 'all') return myStaffOrders;
    if (orderHistoryFilter === 'lab_test') return myStaffOrders.filter(o => o.order_type === 'lab_test');
    return myStaffOrders.filter(o => o.order_type !== 'lab_test');
  }, [myStaffOrders, orderHistoryFilter]);

  // --- CREATE USER WITH STAFF CODE ---
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientPhone, setNewPatientPhone] = useState('');
  const [newPatientPassword, setNewPatientPassword] = useState('123456');
  const [newPatientDistrict, setNewPatientDistrict] = useState('নীলফামারী');
  const [newPatientUpazila, setNewPatientUpazila] = useState('ডোমার');
  const [newPatientVillage, setNewPatientVillage] = useState('');
  const [isCreatingPatient, setIsCreatingPatient] = useState(false);
  const [patientCreateError, setPatientCreateError] = useState<string | null>(null);
  const [createdPatientSuccess, setCreatedPatientSuccess] = useState<{
    name: string;
    phone: string;
    pass: string;
    code: string;
  } | null>(null);

  const generateRandomUserPass = () => {
    const num = Math.floor(100000 + Math.random() * 900000);
    setNewPatientPassword(String(num));
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setPatientCreateError(null);

    const name = newPatientName.trim();
    const phone = newPatientPhone.trim().replace(/[^0-9]/g, '');
    const pass = newPatientPassword.trim();

    if (!name) {
      setPatientCreateError('রোগী/গ্রাহকের পূর্ণ নাম লিখুন।');
      return;
    }
    if (phone.length !== 11 || !phone.startsWith('01')) {
      setPatientCreateError('সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017xxxxxxxx)।');
      return;
    }
    if (pass.length < 6) {
      setPatientCreateError('পাসওয়ার্ড ন্যূনতম ৬ ডিজিট হতে হবে।');
      return;
    }

    const phoneExists = profiles.some(p => p.phone === phone);
    if (phoneExists) {
      setPatientCreateError(`এই মোবাইল নম্বর (${phone}) ইতিমধ্যে অ্যাকাউন্টে রয়েছে।`);
      return;
    }

    setIsCreatingPatient(true);
    let tempAppRef: any = null;

    try {
      await ensureFirebaseAuthSession();
      const appOptions = auth.app.options;
      const tempAppName = `TempPatientApp-${Date.now()}`;
      tempAppRef = initializeApp(appOptions, tempAppName);
      const tempAuth = getTempAuth(tempAppRef);

      const normalizedEmail = `${phone}@nilpha.com`;
      let userId = '';

      try {
        const credential = await createUserWithEmailAndPassword(tempAuth, normalizedEmail, pass);
        userId = credential.user.uid;
      } catch (authErr: any) {
        console.warn('TempAuth createUser error, fallback to custom ID:', authErr?.message || authErr);
        userId = 'pat_' + phone + '_' + Date.now();
      }

      const cleanName = name.replace(/[^A-Za-z]/g, '').slice(0, 4).toUpperCase() || 'USER';
      const userRefCode = `${cleanName}${phone.slice(-4)}`;

      const newProfile: Profile = {
        id: userId,
        full_name: name,
        phone: phone,
        virtual_email: normalizedEmail,
        role: UserRole.PATIENT,
        status: 'active',
        referral_code: userRefCode,
        referred_by_code: myStaffCode,
        created_password: pass,
        district: newPatientDistrict,
        upazila: newPatientUpazila,
        village: newPatientVillage,
        reward_points: 0,
        taka_balance: 0,
        created_by: currentProfile.id,
        created_at: new Date().toISOString()
      };

      await setDoc(doc(db, 'profiles', userId), newProfile);
      await signTempOut(tempAuth);

      setCreatedPatientSuccess({
        name,
        phone,
        pass,
        code: myStaffCode
      });

      setNewPatientName('');
      setNewPatientPhone('');
      setNewPatientPassword('123456');
      setNewPatientVillage('');

      if (onRefreshData) {
        await onRefreshData();
      }
    } catch (err: any) {
      console.error('Create patient error:', err);
      setPatientCreateError(err.message || 'ইউজার অ্যাকাউন্ট তৈরিতে সমস্যা হয়েছে।');
    } finally {
      if (tempAppRef) {
        try {
          await deleteApp(tempAppRef);
        } catch (delErr) {
          console.error('Temp app delete error:', delErr);
        }
      }
      setIsCreatingPatient(false);
    }
  };

  // --- MEDICINE & OTHER PRODUCTS CATALOG + CART + CHECKOUT ---
  const [medSearch, setMedSearch] = useState('');
  const [medCategoryTab, setMedCategoryTab] = useState<'all' | 'medicine' | 'equipment' | 'service'>('all');
  const [medCompanyFilter, setMedCompanyFilter] = useState('all');
  const [medTypeFilter, setMedTypeFilter] = useState('all');
  const [medVisibleLimit, setMedVisibleLimit] = useState(24);

  // Custom / Manual Item Add
  const [showCustomItemForm, setShowCustomItemForm] = useState(false);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState<string>('');
  const [customItemQty, setCustomItemQty] = useState<number>(1);
  const [customItemCategory, setCustomItemCategory] = useState<'medicine' | 'accessory' | 'service'>('accessory');

  const [medCart, setMedCart] = useState<CartLineItem[]>([]);
  const [medCustomerName, setMedCustomerName] = useState('');
  const [medCustomerPhone, setMedCustomerPhone] = useState('');
  const [medDeliveryAddress, setMedDeliveryAddress] = useState('');
  const [medDeliveryFee, setMedDeliveryFee] = useState<number>(30);
  const [medPaymentType, setMedPaymentType] = useState<'offline' | 'online'>('offline');
  const [medPaymentMethod, setMedPaymentMethod] = useState<'bkash' | 'nagad'>('bkash');
  const [medTrxId, setMedTrxId] = useState('');
  const [medPromoInput, setMedPromoInput] = useState('');
  const [medAppliedCoupon, setMedAppliedCoupon] = useState<Coupon | null>(null);
  const [medPromoMsg, setMedPromoMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [isSubmittingMedOrder, setIsSubmittingMedOrder] = useState(false);
  const [medOrderSuccess, setMedOrderSuccess] = useState<Order | null>(null);
  const [medOrderError, setMedOrderError] = useState<string | null>(null);

  const filteredCatalogItems = useMemo(() => {
    const q = medSearch.toLowerCase().trim();
    const list: Array<{
      id: string;
      name: string;
      bnName: string;
      subtitle: string;
      badge: string;
      price: number;
      unit: string;
      itemCategory: 'medicine' | 'accessory' | 'service';
    }> = [];

    if (medCategoryTab === 'all' || medCategoryTab === 'medicine' || medCategoryTab === 'equipment') {
      ALL_MEDICINES_DATA.forEach(item => {
        if (medCategoryTab === 'medicine' && item.category !== 'medicine') return;
        if (medCategoryTab === 'equipment' && item.category !== 'equipment') return;
        if (medCompanyFilter !== 'all') {
          const compObj = TOP_PHARMA_COMPANIES.find(c => c.id === medCompanyFilter);
          if (compObj && item.company !== compObj.name) return;
        }
        if (medTypeFilter !== 'all' && item.type !== medTypeFilter) return;
        if (q) {
          const hit =
            item.name.toLowerCase().includes(q) ||
            item.bnName.toLowerCase().includes(q) ||
            item.generic.toLowerCase().includes(q) ||
            item.company.toLowerCase().includes(q);
          if (!hit) return;
        }
        list.push({
          id: item.id,
          name: `${item.bnName} (${item.name})`,
          bnName: item.bnName,
          subtitle: `${item.generic} • ${item.companyBn || item.company}`,
          badge: item.category === 'equipment' ? '🩺 মেডিকেল এক্সেসরিজ' : `💊 ${item.typeBn || item.type}`,
          price: item.price,
          unit: item.unit,
          itemCategory: item.category === 'equipment' ? 'accessory' : 'medicine'
        });
      });
    }

    if (medCategoryTab === 'all' || medCategoryTab === 'service') {
      EMERGENCY_SERVICES.forEach(srv => {
        if (q) {
          const hit =
            srv.name.toLowerCase().includes(q) || srv.description.toLowerCase().includes(q);
          if (!hit) return;
        }
        list.push({
          id: srv.id,
          name: srv.name,
          bnName: srv.name,
          subtitle: srv.description,
          badge: `${srv.icon} অন্যান্য / হোম সেবা`,
          price: srv.price,
          unit: '১ বার সার্ভিস',
          itemCategory: 'service'
        });
      });
    }

    return list;
  }, [medSearch, medCategoryTab, medCompanyFilter, medTypeFilter]);

  const addToMedCart = (item: {
    id: string;
    name: string;
    subLabel?: string;
    price: number;
    category: 'medicine' | 'accessory' | 'service';
  }) => {
    setMedOrderSuccess(null);
    setMedOrderError(null);
    setMedCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateMedCartQty = (id: string, delta: number) => {
    setMedCart(prev =>
      prev
        .map(item => (item.id === id ? { ...item, quantity: item.quantity + delta } : item))
        .filter(item => item.quantity > 0)
    );
  };

  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = customItemName.trim();
    const numericPrice = Number(customItemPrice);
    if (!cleanName || !numericPrice || numericPrice <= 0) {
      return;
    }
    const id = `custom_${Date.now()}`;
    setMedCart(prev => [
      ...prev,
      {
        id,
        name: cleanName,
        subLabel: 'কাস্টম / অন্যান্য আইটেম',
        price: numericPrice,
        quantity: Math.max(1, customItemQty || 1),
        category: customItemCategory
      }
    ]);
    setCustomItemName('');
    setCustomItemPrice('');
    setCustomItemQty(1);
    setShowCustomItemForm(false);
  };

  const medCartSubtotal = useMemo(
    () => medCart.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [medCart]
  );

  const medDiscountAmount = useMemo(() => {
    if (!medAppliedCoupon) return 0;
    return Math.round((medCartSubtotal * medAppliedCoupon.discount_percent) / 100);
  }, [medAppliedCoupon, medCartSubtotal]);

  const medFinalPayable = Math.max(0, medCartSubtotal - medDiscountAmount) + medDeliveryFee;

  const handleApplyMedPromo = (overrideCode?: string) => {
    const code = (overrideCode ?? medPromoInput).trim().toUpperCase();
    if (!code) {
      setMedPromoMsg({ type: 'err', text: 'প্রোমো কোড লিখুন অথবা তালিকা থেকে সিলেক্ট করুন।' });
      return;
    }
    const res = validateCoupon(code, medCartSubtotal, 'medicines', effectiveCoupons, currentProfile);
    if (res.valid && res.coupon) {
      setMedPromoInput(res.coupon.code);
      setMedAppliedCoupon(res.coupon);
      setMedPromoMsg({ type: 'ok', text: res.message });
    } else {
      setMedAppliedCoupon(null);
      setMedPromoMsg({ type: 'err', text: res.message });
    }
  };

  const handleConfirmMedicineOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setMedOrderError(null);
    if (medCart.length === 0) {
      setMedOrderError('অনুগ্রহ করে অন্তত একটি ঔষধ বা পণ্য কার্টে যোগ করুন।');
      return;
    }
    if (!medCustomerName.trim() || medCustomerName.trim().length < 2) {
      setMedOrderError('অনুগ্রহ করে ক্রেতা / রোগীর নাম লিখুন।');
      return;
    }
    if (!medCustomerPhone.trim() || medCustomerPhone.trim().length < 11) {
      setMedOrderError('সঠিক ১১-ডিজিটের মোবাইল নম্বর দিন।');
      return;
    }
    if (!medDeliveryAddress.trim() || medDeliveryAddress.trim().length < 3) {
      setMedOrderError('ডেলিভারির সম্পূর্ণ ঠিকানা উল্লেখ করুন।');
      return;
    }
    if (medPaymentType === 'online' && !medTrxId.trim()) {
      setMedOrderError('অনলাইন পেমেন্টের জন্য TrxID প্রদান করুন।');
      return;
    }

    setIsSubmittingMedOrder(true);
    try {
      await ensureFirebaseAuthSession();
      const itemsText = medCart.map(i => `${i.name} x ${i.quantity} (৳${i.price * i.quantity})`).join(', ');
      const discountedAmount = Math.max(0, medCartSubtotal - medDiscountAmount);
      const hasMedicine = medCart.some(i => i.category === 'medicine');
      const deliveryLabel =
        medDeliveryFee === 0
          ? 'সরাসরি অফিস/স্টোর (৳০)'
          : medDeliveryFee === 30
          ? 'নীলফামারী শহর ২ কিমি (৳৩০)'
          : medDeliveryFee === 50
          ? '৫ কিমি এরিয়া (৳৫০)'
          : '১০ কিমি এরিয়া (৳৮০)';

      const newOrder: Order = {
        user_id: currentProfile.id,
        user_email: currentProfile.virtual_email || `${currentProfile.phone || 'staff'}@nilpha.com`,
        item_name: `স্টাফ অর্ডার (${hasMedicine ? 'ঔষধ ও পণ্য' : 'মেডিকেল পণ্য/সেবা'}): ${itemsText}`,
        order_type: hasMedicine ? 'medicine' : 'accessory',
        amount: discountedAmount,
        original_amount: medCartSubtotal,
        shipping: medDeliveryFee,
        delivery_distance_label: deliveryLabel,
        payment_method: medPaymentType === 'offline' ? 'Cash on Delivery (Staff)' : medPaymentMethod,
        payment_type: medPaymentType,
        sender_name: `${currentProfile.full_name} (স্টাফ)`,
        sender_contact: medCustomerPhone.trim(),
        patient_name: medCustomerName.trim(),
        delivery_address: medDeliveryAddress.trim(),
        trx_id:
          medPaymentType === 'offline'
            ? `STAFF-COD-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
            : medTrxId.trim(),
        referred_by_code: myStaffCode,
        staff_id: currentProfile.id,
        staff_name: currentProfile.full_name,
        staff_code: myStaffCode,
        items: medCart.map(i => ({
          id: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          category: i.category
        })),
        coupon_code: medAppliedCoupon ? medAppliedCoupon.code : undefined,
        coupon_discount_percent: medAppliedCoupon ? medAppliedCoupon.discount_percent : undefined,
        coupon_discount_amount: medDiscountAmount > 0 ? medDiscountAmount : undefined,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'orders'), newOrder);
      const savedOrder: Order = { ...newOrder, id: docRef.id };
      setLocallyCreatedOrders(prev => [savedOrder, ...prev]);
      setMedOrderSuccess(savedOrder);
      setMedCart([]);
      setMedTrxId('');
      setMedAppliedCoupon(null);
      setMedPromoInput('');
      setMedPromoMsg(null);

      if (onRefreshData) {
        onRefreshData().catch(() => {});
      }
    } catch (err: any) {
      console.error('Staff medicine order error:', err);
      setMedOrderError('অর্ডার কনফার্ম করতে সমস্যা হয়েছে। ইন্টারনেট সংযোগ যাচাই করে আবার চেষ্টা করুন।');
    } finally {
      setIsSubmittingMedOrder(false);
    }
  };

  // --- LAB TEST CATALOG + CART + CHECKOUT ---
  const [labSearch, setLabSearch] = useState('');
  const [labCategoryFilter, setLabCategoryFilter] = useState<string>('all');
  const [labCart, setLabCart] = useState<LabTest[]>([]);
  const [labHospitalName, setLabHospitalName] = useState<string>(hospitals[0]?.name || 'নির্দিষ্ট কোনো হাসপাতাল নেই');
  const [labPatientName, setLabPatientName] = useState('');
  const [labPatientPhone, setLabPatientPhone] = useState('');
  const [labPatientAddress, setLabPatientAddress] = useState('');
  const [labCollectionFee, setLabCollectionFee] = useState<number>(0);
  const [labPaymentType, setLabPaymentType] = useState<'offline' | 'online'>('offline');
  const [labPaymentMethod, setLabPaymentMethod] = useState<'bkash' | 'nagad'>('bkash');
  const [labTrxId, setLabTrxId] = useState('');
  const [labPromoInput, setLabPromoInput] = useState('');
  const [labAppliedCoupon, setLabAppliedCoupon] = useState<Coupon | null>(null);
  const [labPromoMsg, setLabPromoMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [isSubmittingLabOrder, setIsSubmittingLabOrder] = useState(false);
  const [labOrderSuccess, setLabOrderSuccess] = useState<Order | null>(null);
  const [labOrderError, setLabOrderError] = useState<string | null>(null);

  const filteredLabTests = useMemo(() => {
    return labTests.filter(t => {
      if (t.isActive === false) return false;
      if (labCategoryFilter !== 'all' && (t.category || 'Other') !== labCategoryFilter) return false;
      if (labSearch.trim()) {
        const q = labSearch.toLowerCase().trim();
        return (
          (t.name || '').toLowerCase().includes(q) ||
          (t.category || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [labTests, labCategoryFilter, labSearch]);

  const toggleLabTestInCart = (test: LabTest) => {
    setLabOrderSuccess(null);
    setLabOrderError(null);
    setLabCart(prev => {
      const exists = prev.some(item => item.id === test.id);
      if (exists) return prev.filter(item => item.id !== test.id);
      return [...prev, test];
    });
  };

  const labCartSubtotal = useMemo(
    () => labCart.reduce((sum, t) => sum + (t.discountPrice || t.price || 0), 0),
    [labCart]
  );

  const labDiscountAmount = useMemo(() => {
    if (!labAppliedCoupon) return 0;
    return Math.round((labCartSubtotal * labAppliedCoupon.discount_percent) / 100);
  }, [labAppliedCoupon, labCartSubtotal]);

  const labFinalPayable = Math.max(0, labCartSubtotal - labDiscountAmount) + labCollectionFee;

  const handleApplyLabPromo = (overrideCode?: string) => {
    const code = (overrideCode ?? labPromoInput).trim().toUpperCase();
    if (!code) {
      setLabPromoMsg({ type: 'err', text: 'প্রোমো কোড লিখুন অথবা তালিকা থেকে সিলেক্ট করুন।' });
      return;
    }
    const res = validateCoupon(code, labCartSubtotal, 'tests', effectiveCoupons, currentProfile);
    if (res.valid && res.coupon) {
      setLabPromoInput(res.coupon.code);
      setLabAppliedCoupon(res.coupon);
      setLabPromoMsg({ type: 'ok', text: res.message });
    } else {
      setLabAppliedCoupon(null);
      setLabPromoMsg({ type: 'err', text: res.message });
    }
  };

  const handleConfirmLabOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLabOrderError(null);
    if (labCart.length === 0) {
      setLabOrderError('অনুগ্রহ করে অন্তত একটি ল্যাব টেস্ট সিলেক্ট করুন।');
      return;
    }
    if (!labPatientName.trim() || labPatientName.trim().length < 2) {
      setLabOrderError('অনুগ্রহ করে রোগীর নাম লিখুন।');
      return;
    }
    if (!labPatientPhone.trim() || labPatientPhone.trim().length < 11) {
      setLabOrderError('সঠিক ১১-ডিজিটের মোবাইল নম্বর দিন।');
      return;
    }
    if (!labPatientAddress.trim() || labPatientAddress.trim().length < 3) {
      setLabOrderError('রোগীর ঠিকানা লিখুন।');
      return;
    }
    if (labPaymentType === 'online' && !labTrxId.trim()) {
      setLabOrderError('অনলাইন পেমেন্টের জন্য TrxID প্রদান করুন।');
      return;
    }

    setIsSubmittingLabOrder(true);
    try {
      await ensureFirebaseAuthSession();
      const testNames = labCart.map(t => `${t.name} (৳${t.discountPrice || t.price})`).join(', ');
      const discountedAmount = Math.max(0, labCartSubtotal - labDiscountAmount);
      const collectionLabel =
        labCollectionFee === 0
          ? 'ডায়াগনস্টিক সেন্টারে উপস্থিত হয়ে টেস্ট (৳০)'
          : `বাসা থেকে স্যাম্পল সংগ্রহ (৳${labCollectionFee})`;

      const newOrder: Order = {
        user_id: currentProfile.id,
        user_email: currentProfile.virtual_email || `${currentProfile.phone || 'staff'}@nilpha.com`,
        item_name: `ল্যাব টেস্ট অর্ডার (স্টাফ): ${testNames}`,
        order_type: 'lab_test',
        amount: discountedAmount,
        original_amount: labCartSubtotal,
        shipping: labCollectionFee,
        delivery_distance_label: collectionLabel,
        hospital_name: labHospitalName || 'নির্দিষ্ট কোনো হাসপাতাল নেই',
        payment_method: labPaymentType === 'offline' ? 'Cash at Lab / Sample Collection' : labPaymentMethod,
        payment_type: labPaymentType,
        sender_name: `${currentProfile.full_name} (স্টাফ)`,
        sender_contact: labPatientPhone.trim(),
        patient_name: labPatientName.trim(),
        delivery_address: labPatientAddress.trim(),
        trx_id:
          labPaymentType === 'offline'
            ? `LAB-STAFF-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
            : labTrxId.trim(),
        referred_by_code: myStaffCode,
        staff_id: currentProfile.id,
        staff_name: currentProfile.full_name,
        staff_code: myStaffCode,
        items: labCart.map(t => ({
          id: t.id,
          name: t.name,
          price: t.discountPrice || t.price,
          quantity: 1,
          category: t.category || 'lab_test'
        })),
        coupon_code: labAppliedCoupon ? labAppliedCoupon.code : undefined,
        coupon_discount_percent: labAppliedCoupon ? labAppliedCoupon.discount_percent : undefined,
        coupon_discount_amount: labDiscountAmount > 0 ? labDiscountAmount : undefined,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'orders'), newOrder);
      const savedOrder: Order = { ...newOrder, id: docRef.id };
      setLocallyCreatedOrders(prev => [savedOrder, ...prev]);
      setLabOrderSuccess(savedOrder);
      setLabCart([]);
      setLabTrxId('');
      setLabAppliedCoupon(null);
      setLabPromoInput('');
      setLabPromoMsg(null);

      if (onRefreshData) {
        onRefreshData().catch(() => {});
      }
    } catch (err) {
      console.error('Staff lab test order error:', err);
      setLabOrderError('ল্যাব টেস্ট অর্ডার কনফার্ম করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsSubmittingLabOrder(false);
    }
  };

  if (isSuspended) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white max-w-md w-full p-8 rounded-[32px] border border-rose-200 text-center space-y-4 shadow-lg">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl mx-auto flex items-center justify-center">
            <Lock size={30} />
          </div>
          <h2 className="text-lg font-black text-slate-900">স্টাফ একাউন্ট সাময়িকভাবে স্থগিত</h2>
          <p className="text-xs text-slate-500 font-bold leading-relaxed">
            আপনার স্টাফ আইডিটি বর্তমানে এডমিন কর্তৃক স্থগিত (Suspended) রয়েছে। বিস্তারিত জানতে এডমিনের সাথে যোগাযোগ করুন।
          </p>
          <button
            onClick={onLogout}
            className="w-full py-3 bg-rose-600 text-white rounded-2xl text-xs font-black cursor-pointer"
          >
            লগআউট করুন
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-left font-sans">
      {/* Top Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center font-black text-white shadow-md">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-base text-white">স্টাফ ওয়ার্কস্পেস (Staff Dashboard)</h1>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-black uppercase">
                  🟢 কর্মী আইডি
                </span>
              </div>
              <p className="text-xs text-slate-400 font-bold flex flex-wrap items-center gap-2">
                <span>{currentProfile.full_name}</span>
                <span>•</span>
                <span className="text-violet-300 font-medium">{currentProfile.designation || 'মেডিকেল এসিস্ট্যান্ট'}</span>
                <span>•</span>
                <span className="font-mono text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800">
                  কোড: {myStaffCode || 'N/A'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="text-xs bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-indigo-500/30"
              title="ডাটা সতেজ করুন"
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">রিফ্রেশ</span>
            </button>
            {onNavigateHome && (
              <button
                onClick={onNavigateHome}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                🌐 মূল ওয়েবসাইট
              </button>
            )}
            <button
              onClick={onLogout}
              className="text-xs bg-rose-600/90 hover:bg-rose-600 text-white px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <LogOut size={14} /> লগআউট
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto no-scrollbar border-t border-slate-800/80 pt-1">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`px-3.5 py-3 text-xs font-black tracking-wide flex items-center gap-1.5 whitespace-nowrap border-b-2 transition-all cursor-pointer ${
              activeTab === 'appointments'
                ? 'border-teal-400 text-teal-300 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CalendarCheck size={14} />
            রোগীর সিরিয়াল (তারিখ অনুযায়ী)
            <span className="bg-teal-500/20 text-teal-300 text-[10px] px-1.5 py-0.5 rounded-md font-mono">
              {myAppointments.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('medicines')}
            className={`px-3.5 py-3 text-xs font-black tracking-wide flex items-center gap-1.5 whitespace-nowrap border-b-2 transition-all cursor-pointer ${
              activeTab === 'medicines'
                ? 'border-sky-400 text-sky-300 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Pill size={14} />
            ঔষধ ও পণ্য অর্ডার
            {medCart.length > 0 && (
              <span className="bg-sky-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-mono">
                {medCart.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('lab_tests')}
            className={`px-3.5 py-3 text-xs font-black tracking-wide flex items-center gap-1.5 whitespace-nowrap border-b-2 transition-all cursor-pointer ${
              activeTab === 'lab_tests'
                ? 'border-indigo-400 text-indigo-300 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <TestTube size={14} />
            ল্যাব টেস্ট অর্ডার
            {labCart.length > 0 && (
              <span className="bg-indigo-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-mono">
                {labCart.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('my_orders')}
            className={`px-3.5 py-3 text-xs font-black tracking-wide flex items-center gap-1.5 whitespace-nowrap border-b-2 transition-all cursor-pointer ${
              activeTab === 'my_orders'
                ? 'border-amber-400 text-amber-300 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package size={14} />
            আমার অর্ডার ও প্রোমো ({myStaffOrders.length})
          </button>

          <button
            onClick={() => setActiveTab('create_user')}
            className={`px-3.5 py-3 text-xs font-black tracking-wide flex items-center gap-1.5 whitespace-nowrap border-b-2 transition-all cursor-pointer ${
              activeTab === 'create_user'
                ? 'border-violet-400 text-violet-300 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus size={14} />
            নতুন রোগী তৈরি
            {!permissions.create_user_with_code && <Lock size={11} className="text-rose-400 ml-0.5" />}
          </button>

          <button
            onClick={() => setActiveTab('my_users')}
            className={`px-3.5 py-3 text-xs font-black tracking-wide flex items-center gap-1.5 whitespace-nowrap border-b-2 transition-all cursor-pointer ${
              activeTab === 'my_users'
                ? 'border-violet-400 text-violet-300 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users size={14} />
            আমার রোগী ({myReferredUsers.length})
          </button>

          {permissions.free_doctor_consultation && (
            <button
              onClick={() => setActiveTab('free_doctor')}
              className={`px-3.5 py-3 text-xs font-black tracking-wide flex items-center gap-1.5 whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                activeTab === 'free_doctor'
                  ? 'border-amber-400 text-amber-300 bg-slate-800/60'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Gift size={14} />
              ফ্রি ডক্টর
            </button>
          )}
        </div>
      </header>

      {/* Top Quick KPI Strip + Admin-Assigned Staff Promo Banner */}
      <div className="max-w-7xl w-full mx-auto px-4 md:px-6 pt-4 space-y-3">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('appointments')}
            className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-teal-400 transition-all text-left cursor-pointer"
          >
            <p className="text-[10px] font-black uppercase text-slate-400">আমার মোট রোগীর সিরিয়াল</p>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-black text-teal-700">{myAppointments.length} জন</span>
              <span className="text-[10px] font-black text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md">
                আজ: {todayMySerialCount} জন
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('medicines')}
            className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-sky-400 transition-all text-left cursor-pointer"
          >
            <p className="text-[10px] font-black uppercase text-slate-400">ঔষধ ও অন্যান্য অর্ডার</p>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-black text-sky-700">
                {myStaffOrders.filter(o => o.order_type !== 'lab_test').length} টি
              </span>
              <span className="text-[10px] font-black text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md">
                অর্ডার করুন →
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('lab_tests')}
            className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-400 transition-all text-left cursor-pointer"
          >
            <p className="text-[10px] font-black uppercase text-slate-400">ল্যাব টেস্ট অর্ডার</p>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-black text-indigo-700">
                {myStaffOrders.filter(o => o.order_type === 'lab_test').length} টি
              </span>
              <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                টেস্ট বুক করুন →
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('my_orders')}
            className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-violet-400 transition-all text-left cursor-pointer"
          >
            <p className="text-[10px] font-black uppercase text-slate-400">Admin প্রদত্ত প্রোমো কোড</p>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-black text-violet-700">{myAssignedPromos.length} টি</span>
              <span className="text-[10px] font-black text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md">
                কোড দেখুন →
              </span>
            </div>
          </button>
        </div>

        {/* Highlight Banner if Admin assigned promo codes specifically for this staff */}
        {myAssignedPromos.length > 0 && (
          <div className="bg-gradient-to-r from-violet-700 via-indigo-700 to-purple-700 text-white p-3.5 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-white/15 shrink-0">
                <Tag size={16} className="text-amber-300" />
              </span>
              <div>
                <p className="text-xs font-black">
                  🎯 আপনার জন্য Admin প্রদত্ত বিশেষ প্রোমো কোড ({myAssignedPromos.length} টি):
                </p>
                <p className="text-[11px] text-indigo-100 font-medium">
                  ঔষধ ও ল্যাব টেস্ট অর্ডারের চেকআউটে কোডে ক্লিক করলেই অটোমেটিক ডিসকাউন্ট যুক্ত হবে।
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {myAssignedPromos.map(promo => (
                <button
                  key={promo.id}
                  type="button"
                  onClick={() => copyToClipboard(promo.code, `top_promo_${promo.id}`)}
                  className="bg-white text-indigo-900 px-3 py-1.5 rounded-xl text-xs font-mono font-black flex items-center gap-1.5 shadow-xs hover:bg-amber-50 transition-all cursor-pointer"
                >
                  <span>{promo.code}</span>
                  <span className="bg-pink-100 text-pink-700 px-1.5 py-0.5 rounded text-[10px] font-sans font-black">
                    -{promo.discount_percent}%
                  </span>
                  {copiedId === `top_promo_${promo.id}` ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* TAB 1: DATE-WISE PATIENT SERIAL LIST */}
        {activeTab === 'appointments' && (
          <div className="space-y-5 animate-in fade-in">
            <div className="bg-gradient-to-r from-teal-900 via-emerald-900 to-slate-900 text-white p-5 sm:p-6 rounded-[28px] shadow-md flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="bg-teal-500/20 text-teal-200 border border-teal-400/30 text-[10px] font-black uppercase px-3 py-1 rounded-full inline-flex items-center gap-1.5 mb-2">
                  <CalendarCheck size={12} /> তারিখ অনুযায়ী রোগীর সিরিয়াল রিপোর্ট
                </span>
                <h2 className="text-lg sm:text-xl font-black text-white">
                  আমার দেয়া রোগীর সিরিয়াল ও তালিকা (তারিখ আকারে)
                </h2>
                <p className="text-xs text-teal-100/80 font-medium mt-0.5">
                  কোন তারিখে কতজন রোগীর সিরিয়াল দিয়েছেন তার সম্পূর্ণ হিসাব ও তালিকা এখানে তারিখ অনুযায়ী সাজানো রয়েছে।
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <div className="bg-white/10 backdrop-blur-xs border border-white/15 px-4 py-2.5 rounded-2xl text-center">
                  <p className="text-[10px] text-teal-200 font-bold">আজকের সিরিয়াল</p>
                  <p className="text-lg font-black text-white">{todayMySerialCount} জন</p>
                </div>
                <div className="bg-white/10 backdrop-blur-xs border border-white/15 px-4 py-2.5 rounded-2xl text-center">
                  <p className="text-[10px] text-teal-200 font-bold">সর্বমোট সিরিয়াল</p>
                  <p className="text-lg font-black text-amber-300">{myAppointments.length} জন</p>
                </div>
                <div className="bg-white/10 backdrop-blur-xs border border-white/15 px-4 py-2.5 rounded-2xl text-center">
                  <p className="text-[10px] text-teal-200 font-bold">মোট তারিখ</p>
                  <p className="text-lg font-black text-white">{dateGroupedAppointments.length} দিন</p>
                </div>
              </div>
            </div>

            {/* Filter & Scope Controls */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setAppScope('mine')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      appScope === 'mine' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    আমার দেয়া সিরিয়াল ({myAppointments.length})
                  </button>
                  {permissions.manage_appointments && (
                    <button
                      type="button"
                      onClick={() => setAppScope('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                        appScope === 'all' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      সকল সিরিয়াল ({appointments.length})
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAppDateFilter('')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                      appDateFilter === ''
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    সকল তারিখ
                  </button>
                  <button
                    type="button"
                    onClick={() => setAppDateFilter(todayKey)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                      appDateFilter === todayKey
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    আজকের ({todayKey})
                  </button>
                  <input
                    type="date"
                    value={appDateFilter}
                    onChange={e => setAppDateFilter(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="রোগীর নাম, মোবাইল নম্বর অথবা ডাক্তারের নাম দিয়ে খুঁজুন..."
                  value={appSearch}
                  onChange={e => setAppSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-bold outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Date-wise Grouped List */}
            {dateGroupedAppointments.length === 0 ? (
              <div className="bg-white p-10 rounded-[28px] border border-dashed border-slate-200 text-center space-y-2">
                <Calendar size={32} className="mx-auto text-slate-300" />
                <p className="text-sm font-black text-slate-600">কোনো রোগীর সিরিয়াল পাওয়া যায়নি</p>
                <p className="text-xs text-slate-400 font-medium">
                  আপনার স্টাফ কোড ({myStaffCode}) ব্যবহার করে সিরিয়াল দিলে বা ফিল্টার পরিবর্তন করলে এখানে তারিখ অনুযায়ী দেখা যাবে।
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {dateGroupedAppointments.map(([dateKey, items]) => (
                  <div
                    key={dateKey}
                    className="bg-white rounded-[28px] border border-slate-200/80 shadow-xs overflow-hidden"
                  >
                    {/* Date Header */}
                    <div className="bg-gradient-to-r from-slate-50 to-teal-50/60 px-5 py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="p-2 rounded-xl bg-teal-600 text-white shadow-2xs">
                          <Calendar size={16} />
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-black text-slate-900">
                              {formatBnDateHeader(dateKey)}
                            </h3>
                            {dateKey === todayKey && (
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                আজকের তালিকা
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] font-mono text-slate-500 font-bold">তারিখ: {dateKey}</p>
                        </div>
                      </div>

                      <div className="bg-teal-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-black shadow-2xs">
                        মোট রোগী: {items.length} জন
                      </div>
                    </div>

                    {/* Patient List for that Date */}
                    <div className="divide-y divide-slate-100">
                      {items.map((app, idx) => {
                        const statusColor =
                          app.status === 'visited'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : app.status === 'absent'
                            ? 'bg-rose-100 text-rose-800 border-rose-200'
                            : 'bg-amber-100 text-amber-800 border-amber-200';
                        const statusBn =
                          app.status === 'visited'
                            ? 'দেখানো হয়েছে'
                            : app.status === 'absent'
                            ? 'আসেননি'
                            : 'পেন্ডিং';

                        return (
                          <div
                            key={app.id || `${dateKey}_${idx}`}
                            className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="flex items-start gap-3">
                              <span className="w-7 h-7 rounded-xl bg-slate-100 text-slate-700 font-mono font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                                #{idx + 1}
                              </span>
                              <div className="space-y-0.5">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="text-sm font-black text-slate-900">
                                    {app.patient_name || 'নাম নেই'}
                                  </h4>
                                  {app.patient_age && (
                                    <span className="text-[10px] text-slate-500 font-bold">
                                      ({app.patient_age} বছর)
                                    </span>
                                  )}
                                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${statusColor}`}>
                                    {statusBn}
                                  </span>
                                </div>
                                <p className="text-xs font-bold text-slate-700">
                                  👨‍⚕️ ডাক্তার: <span className="text-indigo-700">{app.doctor_name || 'উল্লেখ নেই'}</span>
                                  {app.doctor_specialty ? ` (${app.doctor_specialty})` : ''}
                                </p>
                                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 font-bold">
                                  <span className="font-mono text-blue-700">📞 {app.patient_phone || 'ফোন নেই'}</span>
                                  {app.patient_address && <span>📍 {app.patient_address}</span>}
                                  {app.referred_by_code && (
                                    <span className="font-mono text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded">
                                      কোড: {app.referred_by_code}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {app.consultation_fee ? (
                              <div className="text-left sm:text-right shrink-0">
                                <span className="text-[10px] text-slate-400 font-bold block">ভিজিট / ফি</span>
                                <span className="text-xs font-black text-slate-800">৳{app.consultation_fee}</span>
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MEDICINE & OTHER PRODUCTS ORDER + CHECKOUT + CONFIRM */}
        {activeTab === 'medicines' && (
          <div className="space-y-5 animate-in fade-in">
            <div className="bg-gradient-to-r from-sky-900 via-blue-900 to-indigo-900 text-white p-5 sm:p-6 rounded-[28px] shadow-md flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="bg-sky-500/20 text-sky-200 border border-sky-400/30 text-[10px] font-black uppercase px-3 py-1 rounded-full inline-flex items-center gap-1.5 mb-2">
                  <Pill size={12} /> স্টাফ ঔষধ ও মেডিকেল পণ্য অর্ডার প্যানেল
                </span>
                <h2 className="text-lg sm:text-xl font-black text-white">
                  ঔষধ ও অন্যান্য পণ্য অর্ডার, চেকআউট ও কনফার্মেশন
                </h2>
                <p className="text-xs text-sky-100/80 font-medium mt-0.5">
                  রোগীর জন্য যেকোনো ঔষধ, মেডিকেল এক্সেসরিজ বা হোম সেবা কার্টে যোগ করে প্রোমো কোড সহ অর্ডার কনফার্ম করুন।
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomItemForm(!showCustomItemForm)}
                className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-2xl text-xs font-black shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Plus size={15} /> {showCustomItemForm ? 'ফর্ম বন্ধ করুন' : 'অন্যান্য/কাস্টম আইটেম যোগ'}
              </button>
            </div>

            {showCustomItemForm && (
              <form
                onSubmit={handleAddCustomItem}
                className="bg-amber-50 border-2 border-amber-200 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-5 gap-3 items-end"
              >
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-black text-slate-700">পণ্য বা আইটেমের নাম *</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: হুইলচেয়ার / গ্লুকোমিটার / বিশেষ ঔষধ"
                    value={customItemName}
                    onChange={e => setCustomItemName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs font-bold outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-700">ধরন</label>
                  <select
                    value={customItemCategory}
                    onChange={e => setCustomItemCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs font-bold outline-none"
                  >
                    <option value="accessory">অন্যান্য / এক্সেসরিজ</option>
                    <option value="medicine">ঔষধ</option>
                    <option value="service">হোম সেবা</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-700">দাম (৳) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="দাম"
                    value={customItemPrice}
                    onChange={e => setCustomItemPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs font-bold outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    value={customItemQty}
                    onChange={e => setCustomItemQty(Number(e.target.value))}
                    className="w-16 px-2 py-2 bg-white border border-amber-200 rounded-xl text-xs font-bold outline-none text-center"
                    title="পরিমাণ"
                  />
                  <button
                    type="submit"
                    className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black cursor-pointer"
                  >
                    যোগ করুন
                  </button>
                </div>
              </form>
            )}

            {medOrderSuccess && (
              <div className="bg-emerald-50 border-2 border-emerald-300 p-5 rounded-[28px] shadow-sm space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-black text-emerald-900 flex items-center gap-2">
                    <CheckCircle2 className="text-emerald-600" size={20} /> অর্ডার সফলভাবে কনফার্ম করা হয়েছে!
                  </h4>
                  <button
                    type="button"
                    onClick={() => setMedOrderSuccess(null)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-700"
                  >
                    ✕ বন্ধ করুন
                  </button>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-emerald-200 text-xs space-y-1.5">
                  <p><strong>অর্ডার আইডি:</strong> <span className="font-mono text-indigo-700">{medOrderSuccess.id}</span></p>
                  <p><strong>রোগী/ক্রেতা:</strong> {medOrderSuccess.patient_name} ({medOrderSuccess.sender_contact})</p>
                  <p><strong>বিবরণ:</strong> {medOrderSuccess.item_name}</p>
                  {medOrderSuccess.coupon_code && (
                    <p className="text-pink-700 font-bold">
                      🎟️ প্রোমো কোড: {medOrderSuccess.coupon_code} (-৳{medOrderSuccess.coupon_discount_amount || 0} ছাড়)
                    </p>
                  )}
                  <p className="text-sm font-black text-emerald-700">
                    সর্বমোট প্রদেয়: ৳{(medOrderSuccess.amount || 0) + (medOrderSuccess.shipping || 0)}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left: Product Browser */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'all', label: '✨ সব পণ্য ও সেবা' },
                      { id: 'medicine', label: '💊 ঔষধ' },
                      { id: 'equipment', label: '🩺 মেডিকেল এক্সেসরিজ' },
                      { id: 'service', label: '🚑 অন্যান্য সেবা' }
                    ].map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setMedCategoryTab(cat.id as any);
                          setMedVisibleLimit(24);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          medCategoryTab === cat.id
                            ? 'bg-sky-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-1 relative">
                      <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="ঔষধ বা পণ্যের নাম..."
                        value={medSearch}
                        onChange={e => setMedSearch(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-bold outline-none focus:border-sky-500"
                      />
                    </div>
                    <select
                      value={medCompanyFilter}
                      onChange={e => setMedCompanyFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                    >
                      {TOP_PHARMA_COMPANIES.map(c => (
                        <option key={c.id} value={c.id}>{c.bnName}</option>
                      ))}
                    </select>
                    <select
                      value={medTypeFilter}
                      onChange={e => setMedTypeFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                    >
                      {MEDICINE_TYPES.map(t => (
                        <option key={t.id} value={t.id}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredCatalogItems.slice(0, medVisibleLimit).map(item => {
                    const inCart = medCart.find(c => c.id === item.id);
                    return (
                      <div
                        key={item.id}
                        className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between gap-3 hover:border-sky-300 transition-all"
                      >
                        <div className="space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-100">
                              {item.badge}
                            </span>
                            <span className="text-sm font-black text-emerald-700 font-mono">
                              ৳{item.price}
                            </span>
                          </div>
                          <h4 className="text-xs font-black text-slate-900 leading-snug pt-1">{item.name}</h4>
                          <p className="text-[11px] text-slate-500 font-medium line-clamp-2">{item.subtitle}</p>
                          <p className="text-[10px] text-slate-400 font-bold">ইউনিট: {item.unit}</p>
                        </div>

                        {inCart ? (
                          <div className="flex items-center justify-between bg-sky-50 border border-sky-200 rounded-xl p-1.5">
                            <button
                              type="button"
                              onClick={() => updateMedCartQty(item.id, -1)}
                              className="w-7 h-7 rounded-lg bg-white text-sky-700 font-black flex items-center justify-center border border-sky-200 cursor-pointer"
                            >
                              <Minus size={13} />
                            </button>
                            <span className="text-xs font-black text-sky-900">
                              কার্টে: {inCart.quantity} টি (৳{inCart.price * inCart.quantity})
                            </span>
                            <button
                              type="button"
                              onClick={() => updateMedCartQty(item.id, 1)}
                              className="w-7 h-7 rounded-lg bg-sky-600 text-white font-black flex items-center justify-center cursor-pointer"
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              addToMedCart({
                                id: item.id,
                                name: item.name,
                                subLabel: item.unit,
                                price: item.price,
                                category: item.itemCategory
                              })
                            }
                            className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-black transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <ShoppingCart size={13} /> কার্টে যোগ করুন
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {filteredCatalogItems.length > medVisibleLimit && (
                  <button
                    type="button"
                    onClick={() => setMedVisibleLimit(v => v + 24)}
                    className="w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-black rounded-2xl cursor-pointer"
                  >
                    আরও পণ্য দেখুন ({filteredCatalogItems.length - medVisibleLimit} টি বাকি)
                  </button>
                )}
              </div>

              {/* Right: Cart, Checkout & Confirm Order */}
              <div className="lg:col-span-5 bg-white rounded-[28px] border border-slate-200 shadow-sm p-5 space-y-4 lg:sticky lg:top-24">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <ShoppingCart size={17} className="text-sky-600" />
                    চেকআউট ও অর্ডার কনফার্মেশন ({medCart.reduce((s, i) => s + i.quantity, 0)})
                  </h3>
                  {medCart.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setMedCart([])}
                      className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                    >
                      কার্ট খালি করুন
                    </button>
                  )}
                </div>

                {/* Cart Items */}
                {medCart.length === 0 ? (
                  <div className="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-200 text-center space-y-1">
                    <ShoppingCart size={24} className="mx-auto text-slate-300" />
                    <p className="text-xs font-bold text-slate-500">আপনার অর্ডার কার্ট খালি</p>
                    <p className="text-[10px] text-slate-400">বাম পাশ থেকে ঔষধ বা অন্যান্য পণ্য যোগ করুন।</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {medCart.map(item => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-black text-slate-800 truncate">{item.name}</p>
                          <p className="text-[10px] font-bold text-slate-500">
                            ৳{item.price} × {item.quantity} = ৳{item.price * item.quantity}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => updateMedCartQty(item.id, -1)}
                            className="w-6 h-6 bg-white border border-slate-200 rounded-lg flex items-center justify-center font-black cursor-pointer"
                          >
                            -
                          </button>
                          <span className="w-5 text-center font-black">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateMedCartQty(item.id, 1)}
                            className="w-6 h-6 bg-white border border-slate-200 rounded-lg flex items-center justify-center font-black cursor-pointer"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() => updateMedCartQty(item.id, -item.quantity)}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <form onSubmit={handleConfirmMedicineOrder} className="space-y-3 pt-1">
                  {/* Quick Pick from My Referred Users */}
                  {myReferredUsers.length > 0 && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-500">
                        আমার নিবন্ধিত রোগী থেকে দ্রুত সিলেক্ট করুন (ঐচ্ছিক)
                      </label>
                      <select
                        onChange={e => {
                          const found = myReferredUsers.find(u => u.id === e.target.value);
                          if (found) {
                            setMedCustomerName(found.full_name || '');
                            setMedCustomerPhone(found.phone || '');
                            const addr = [found.village, found.upazila, found.district].filter(Boolean).join(', ');
                            if (addr) setMedDeliveryAddress(addr);
                          }
                        }}
                        defaultValue=""
                        className="w-full px-3 py-2 bg-violet-50 border border-violet-200 rounded-xl text-xs font-bold text-violet-900 outline-none"
                      >
                        <option value="">-- আমার রোগীর তালিকা থেকে বাছুন --</option>
                        {myReferredUsers.map(u => (
                          <option key={u.id} value={u.id}>
                            {u.full_name} ({u.phone})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-600 flex items-center gap-1">
                        <Users size={11} /> ক্রেতা / রোগীর নাম *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="রোগীর পূর্ণ নাম"
                        value={medCustomerName}
                        onChange={e => setMedCustomerName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-sky-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-600 flex items-center gap-1">
                        <Phone size={11} /> মোবাইল নম্বর *
                      </label>
                      <input
                        type="tel"
                        required
                        maxLength={11}
                        placeholder="017xxxxxxxx"
                        value={medCustomerPhone}
                        onChange={e => setMedCustomerPhone(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-600 flex items-center gap-1">
                      <MapPin size={11} /> ডেলিভারি ঠিকানা *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="গ্রাম/মহল্লা, উপজেলা, জেলা"
                      value={medDeliveryAddress}
                      onChange={e => setMedDeliveryAddress(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-600">ডেলিভারি / ট্রান্সপোর্ট চার্জ</label>
                    <select
                      value={medDeliveryFee}
                      onChange={e => setMedDeliveryFee(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                    >
                      <option value={0}>সরাসরি অফিস/দোকান থেকে সংগ্রহ (৳০)</option>
                      <option value={30}>নীলফামারী শহর ২ কিমি (৳৩০)</option>
                      <option value={50}>নীলফামারী ৫ কিমি এরিয়া (৳৫০)</option>
                      <option value={80}>১০ কিমি এরিয়া (৳৮০)</option>
                    </select>
                  </div>

                  {/* Promo Code Section for Staff */}
                  <div className="bg-violet-50/80 border border-violet-200 p-3 rounded-2xl space-y-2">
                    <label className="text-[10px] font-black uppercase text-violet-900 flex items-center gap-1">
                      <Tag size={12} className="text-violet-600" /> প্রোমো কোড (Admin প্রদত্ত স্টাফ প্রোমো)
                    </label>

                    {(myAssignedPromos.length > 0 || generalActivePromos.length > 0) && (
                      <div className="flex flex-wrap gap-1.5">
                        {myAssignedPromos
                          .filter(p => !p.applicable_to || p.applicable_to === 'all' || p.applicable_to === 'medicines')
                          .map(p => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handleApplyMedPromo(p.code)}
                              className="px-2 py-1 rounded-lg bg-violet-600 text-white text-[10px] font-mono font-black cursor-pointer hover:bg-violet-700"
                            >
                              🎯 {p.code} (-{p.discount_percent}%)
                            </button>
                          ))}
                        {generalActivePromos
                          .filter(p => !p.applicable_to || p.applicable_to === 'all' || p.applicable_to === 'medicines')
                          .slice(0, 3)
                          .map(p => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handleApplyMedPromo(p.code)}
                              className="px-2 py-1 rounded-lg bg-white border border-violet-200 text-violet-800 text-[10px] font-mono font-black cursor-pointer hover:bg-violet-100"
                            >
                              {p.code} (-{p.discount_percent}%)
                            </button>
                          ))}
                      </div>
                    )}

                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="প্রোমো কোড লিখুন..."
                        value={medPromoInput}
                        onChange={e => setMedPromoInput(e.target.value.toUpperCase())}
                        className="flex-1 px-3 py-1.5 bg-white border border-violet-200 rounded-xl text-xs font-mono font-black uppercase outline-none"
                      />
                      {medAppliedCoupon ? (
                        <button
                          type="button"
                          onClick={() => {
                            setMedAppliedCoupon(null);
                            setMedPromoInput('');
                            setMedPromoMsg(null);
                          }}
                          className="px-3 py-1.5 bg-rose-100 text-rose-700 rounded-xl text-xs font-black cursor-pointer"
                        >
                          বাতিল
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleApplyMedPromo()}
                          className="px-3 py-1.5 bg-violet-700 hover:bg-violet-800 text-white rounded-xl text-xs font-black cursor-pointer"
                        >
                          প্রয়োগ
                        </button>
                      )}
                    </div>

                    {medPromoMsg && (
                      <p className={`text-[11px] font-bold ${medPromoMsg.type === 'ok' ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {medPromoMsg.text}
                      </p>
                    )}
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-600 flex items-center gap-1">
                      <CreditCard size={11} /> পেমেন্ট মাধ্যম
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setMedPaymentType('offline')}
                        className={`py-2 px-3 rounded-xl text-xs font-black border cursor-pointer ${
                          medPaymentType === 'offline'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        💵 ক্যাশ অন ডেলিভারি
                      </button>
                      <button
                        type="button"
                        onClick={() => setMedPaymentType('online')}
                        className={`py-2 px-3 rounded-xl text-xs font-black border cursor-pointer ${
                          medPaymentType === 'online'
                            ? 'bg-pink-600 text-white border-pink-600'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        📱 bKash / Nagad
                      </button>
                    </div>

                    {medPaymentType === 'online' && (
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <select
                          value={medPaymentMethod}
                          onChange={e => setMedPaymentMethod(e.target.value as any)}
                          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                        >
                          <option value="bkash">bKash (বিকাশ)</option>
                          <option value="nagad">Nagad (নগদ)</option>
                        </select>
                        <input
                          type="text"
                          placeholder="TrxID দিন *"
                          value={medTrxId}
                          onChange={e => setMedTrxId(e.target.value.toUpperCase())}
                          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold outline-none"
                        />
                      </div>
                    )}
                  </div>

                  {/* Price Summary */}
                  <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-300 font-bold">
                      <span>পণ্যের মোট মূল্য:</span>
                      <span>৳{medCartSubtotal}</span>
                    </div>
                    {medDiscountAmount > 0 && (
                      <div className="flex justify-between text-pink-300 font-bold">
                        <span>প্রোমো ছাড় ({medAppliedCoupon?.code}):</span>
                        <span>-৳{medDiscountAmount}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-300 font-bold">
                      <span>ডেলিভারি / ট্রান্সপোর্ট চার্জ:</span>
                      <span>+৳{medDeliveryFee}</span>
                    </div>
                    <div className="flex justify-between text-base font-black text-emerald-400 pt-1.5 border-t border-slate-700">
                      <span>সর্বমোট প্রদেয়:</span>
                      <span>৳{medFinalPayable}</span>
                    </div>
                  </div>

                  {medOrderError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-2">
                      <AlertCircle size={15} className="shrink-0" />
                      <span>{medOrderError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmittingMedOrder || medCart.length === 0}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-md active:scale-95 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSubmittingMedOrder ? 'কনফার্ম হচ্ছে...' : '✓ চেকআউট ও অর্ডার কনফার্ম করুন'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: LAB TEST ORDER + CHECKOUT + CONFIRM */}
        {activeTab === 'lab_tests' && (
          <div className="space-y-5 animate-in fade-in">
            <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 text-white p-5 sm:p-6 rounded-[28px] shadow-md flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 text-[10px] font-black uppercase px-3 py-1 rounded-full inline-flex items-center gap-1.5 mb-2">
                  <TestTube size={12} /> স্টাফ ল্যাব টেস্ট অর্ডার ও চেকআউট
                </span>
                <h2 className="text-lg sm:text-xl font-black text-white">
                  ল্যাব ও ডায়াগনস্টিক টেস্ট নির্বাচন, প্রোমো প্রয়োগ ও অর্ডার কনফার্মেশন
                </h2>
                <p className="text-xs text-indigo-100/80 font-medium mt-0.5">
                  রোগীর জন্য প্রয়োজনীয় টেস্ট সিলেক্ট করুন, প্রোমো কোড লাগান এবং সরাসরি ল্যাব টেস্ট অর্ডার কনফার্ম করুন।
                </p>
              </div>
              <div className="bg-white/10 border border-white/15 px-4 py-2 rounded-2xl text-xs font-black">
                সিলেক্টেড টেস্ট: {labCart.length} টি (৳{labCartSubtotal})
              </div>
            </div>

            {labOrderSuccess && (
              <div className="bg-emerald-50 border-2 border-emerald-300 p-5 rounded-[28px] shadow-sm space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-black text-emerald-900 flex items-center gap-2">
                    <CheckCircle2 className="text-emerald-600" size={20} /> ল্যাব টেস্ট অর্ডার সফলভাবে কনফার্ম হয়েছে!
                  </h4>
                  <button
                    type="button"
                    onClick={() => setLabOrderSuccess(null)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-700"
                  >
                    ✕ বন্ধ করুন
                  </button>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-emerald-200 text-xs space-y-1.5">
                  <p><strong>অর্ডার আইডি:</strong> <span className="font-mono text-indigo-700">{labOrderSuccess.id}</span></p>
                  <p><strong>রোগী:</strong> {labOrderSuccess.patient_name} ({labOrderSuccess.sender_contact})</p>
                  <p><strong>ডায়াগনস্টিক / ক্লিনিক:</strong> {labOrderSuccess.hospital_name}</p>
                  <p><strong>টেস্টসমূহ:</strong> {labOrderSuccess.item_name}</p>
                  {labOrderSuccess.coupon_code && (
                    <p className="text-pink-700 font-bold">
                      🎟️ প্রোমো কোড: {labOrderSuccess.coupon_code} (-৳{labOrderSuccess.coupon_discount_amount || 0} ছাড়)
                    </p>
                  )}
                  <p className="text-sm font-black text-emerald-700">
                    সর্বমোট প্রদেয়: ৳{(labOrderSuccess.amount || 0) + (labOrderSuccess.shipping || 0)}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left: Lab Tests List */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {['all', 'Pathology', 'X-Ray', 'Ultrasonogram', 'ECG & Echo', 'Other'].map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setLabCategoryFilter(cat)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          labCategoryFilter === cat
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {cat === 'all' ? 'সকল টেস্ট' : cat}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="ল্যাব টেস্টের নাম দিয়ে খুঁজুন (যেমন: CBC, Lipid, X-Ray, USG)..."
                      value={labSearch}
                      onChange={e => setLabSearch(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-bold outline-none focus:border-indigo-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredLabTests.map(test => {
                    const selected = labCart.some(t => t.id === test.id);
                    const effectivePrice = test.discountPrice || test.price;
                    return (
                      <div
                        key={test.id}
                        onClick={() => toggleLabTestInCart(test)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                          selected
                            ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-200 shadow-xs'
                            : 'bg-white border-slate-200/80 hover:border-indigo-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-black text-xs text-slate-900 leading-snug">{test.name}</h4>
                            {test.category && (
                              <span className="text-[10px] text-slate-500 font-bold">{test.category}</span>
                            )}
                          </div>
                          <span className="text-xs font-mono font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg shrink-0">
                            ৳{effectivePrice}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <span className={`text-[11px] font-black ${selected ? 'text-indigo-700' : 'text-slate-400'}`}>
                            {selected ? '✓ অর্ডারে যুক্ত আছে' : '+ অর্ডারে যোগ করুন'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right: Lab Test Checkout & Confirm */}
              <div className="lg:col-span-5 bg-white rounded-[28px] border border-slate-200 shadow-sm p-5 space-y-4 lg:sticky lg:top-24">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <TestTube size={17} className="text-indigo-600" />
                    ল্যাব টেস্ট চেকআউট ({labCart.length} টি)
                  </h3>
                  {labCart.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setLabCart([])}
                      className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                    >
                      সব বাদ দিন
                    </button>
                  )}
                </div>

                {labCart.length === 0 ? (
                  <div className="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-200 text-center space-y-1">
                    <TestTube size={24} className="mx-auto text-slate-300" />
                    <p className="text-xs font-bold text-slate-500">কোনো ল্যাব টেস্ট সিলেক্ট করা হয়নি</p>
                    <p className="text-[10px] text-slate-400">বাম পাশ থেকে টেস্টগুলোতে ক্লিক করে যোগ করুন।</p>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {labCart.map(t => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between gap-2 p-2.5 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs"
                      >
                        <span className="font-black text-slate-800 truncate">{t.name}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono font-black text-indigo-700">৳{t.discountPrice || t.price}</span>
                          <button
                            type="button"
                            onClick={() => toggleLabTestInCart(t)}
                            className="text-rose-500 hover:bg-rose-50 p-1 rounded cursor-pointer"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <form onSubmit={handleConfirmLabOrder} className="space-y-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-600 flex items-center gap-1">
                      <Building2 size={11} /> ডায়াগনস্টিক সেন্টার / ক্লিনিক নির্বাচন
                    </label>
                    <select
                      value={labHospitalName}
                      onChange={e => setLabHospitalName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                    >
                      {hospitals.map(h => (
                        <option key={h.id} value={h.name}>{h.name}</option>
                      ))}
                      <option value="নির্দিষ্ট কোনো হাসপাতাল নেই">যেকোনো অনুমোদিত ডায়াগনস্টিক সেন্টার</option>
                    </select>
                  </div>

                  {myReferredUsers.length > 0 && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-500">
                        আমার রোগী তালিকা থেকে বাছুন (ঐচ্ছিক)
                      </label>
                      <select
                        onChange={e => {
                          const found = myReferredUsers.find(u => u.id === e.target.value);
                          if (found) {
                            setLabPatientName(found.full_name || '');
                            setLabPatientPhone(found.phone || '');
                            const addr = [found.village, found.upazila, found.district].filter(Boolean).join(', ');
                            if (addr) setLabPatientAddress(addr);
                          }
                        }}
                        defaultValue=""
                        className="w-full px-3 py-2 bg-violet-50 border border-violet-200 rounded-xl text-xs font-bold text-violet-900 outline-none"
                      >
                        <option value="">-- রোগী নির্বাচন করুন --</option>
                        {myReferredUsers.map(u => (
                          <option key={u.id} value={u.id}>
                            {u.full_name} ({u.phone})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-600">রোগীর নাম *</label>
                      <input
                        type="text"
                        required
                        placeholder="রোগীর পূর্ণ নাম"
                        value={labPatientName}
                        onChange={e => setLabPatientName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-600">মোবাইল নম্বর *</label>
                      <input
                        type="tel"
                        required
                        maxLength={11}
                        placeholder="017xxxxxxxx"
                        value={labPatientPhone}
                        onChange={e => setLabPatientPhone(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-600">ঠিকানা *</label>
                    <input
                      type="text"
                      required
                      placeholder="গ্রাম/মহল্লা, উপজেলা, জেলা"
                      value={labPatientAddress}
                      onChange={e => setLabPatientAddress(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-600">স্যাম্পল সংগ্রহ মাধ্যম</label>
                    <select
                      value={labCollectionFee}
                      onChange={e => setLabCollectionFee(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                    >
                      <option value={0}>সেন্টারে গিয়ে টেস্ট (৳০)</option>
                      <option value={30}>বাসা থেকে স্যাম্পল সংগ্রহ ২ কিমি (৳৩০)</option>
                      <option value={50}>বাসা থেকে স্যাম্পল সংগ্রহ ৫ কিমি (৳৫০)</option>
                      <option value={80}>বাসা থেকে স্যাম্পল সংগ্রহ ১০ কিমি (৳৮০)</option>
                    </select>
                  </div>

                  {/* Promo Code Section for Lab Tests */}
                  <div className="bg-violet-50/80 border border-violet-200 p-3 rounded-2xl space-y-2">
                    <label className="text-[10px] font-black uppercase text-violet-900 flex items-center gap-1">
                      <Tag size={12} className="text-violet-600" /> স্টাফ প্রোমো / কুপন কোড
                    </label>

                    {(myAssignedPromos.length > 0 || generalActivePromos.length > 0) && (
                      <div className="flex flex-wrap gap-1.5">
                        {myAssignedPromos
                          .filter(p => !p.applicable_to || p.applicable_to === 'all' || p.applicable_to === 'tests')
                          .map(p => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handleApplyLabPromo(p.code)}
                              className="px-2 py-1 rounded-lg bg-violet-600 text-white text-[10px] font-mono font-black cursor-pointer hover:bg-violet-700"
                            >
                              🎯 {p.code} (-{p.discount_percent}%)
                            </button>
                          ))}
                        {generalActivePromos
                          .filter(p => !p.applicable_to || p.applicable_to === 'all' || p.applicable_to === 'tests')
                          .slice(0, 3)
                          .map(p => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handleApplyLabPromo(p.code)}
                              className="px-2 py-1 rounded-lg bg-white border border-violet-200 text-violet-800 text-[10px] font-mono font-black cursor-pointer hover:bg-violet-100"
                            >
                              {p.code} (-{p.discount_percent}%)
                            </button>
                          ))}
                      </div>
                    )}

                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="প্রোমো কোড লিখুন..."
                        value={labPromoInput}
                        onChange={e => setLabPromoInput(e.target.value.toUpperCase())}
                        className="flex-1 px-3 py-1.5 bg-white border border-violet-200 rounded-xl text-xs font-mono font-black uppercase outline-none"
                      />
                      {labAppliedCoupon ? (
                        <button
                          type="button"
                          onClick={() => {
                            setLabAppliedCoupon(null);
                            setLabPromoInput('');
                            setLabPromoMsg(null);
                          }}
                          className="px-3 py-1.5 bg-rose-100 text-rose-700 rounded-xl text-xs font-black cursor-pointer"
                        >
                          বাতিল
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleApplyLabPromo()}
                          className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-black cursor-pointer"
                        >
                          প্রয়োগ
                        </button>
                      )}
                    </div>

                    {labPromoMsg && (
                      <p className={`text-[11px] font-bold ${labPromoMsg.type === 'ok' ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {labPromoMsg.text}
                      </p>
                    )}
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setLabPaymentType('offline')}
                        className={`py-2 px-3 rounded-xl text-xs font-black border cursor-pointer ${
                          labPaymentType === 'offline'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        💵 ক্যাশ (সেন্টারে/হোম)
                      </button>
                      <button
                        type="button"
                        onClick={() => setLabPaymentType('online')}
                        className={`py-2 px-3 rounded-xl text-xs font-black border cursor-pointer ${
                          labPaymentType === 'online'
                            ? 'bg-pink-600 text-white border-pink-600'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        📱 bKash / Nagad
                      </button>
                    </div>
                    {labPaymentType === 'online' && (
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={labPaymentMethod}
                          onChange={e => setLabPaymentMethod(e.target.value as any)}
                          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                        >
                          <option value="bkash">bKash (বিকাশ)</option>
                          <option value="nagad">Nagad (নগদ)</option>
                        </select>
                        <input
                          type="text"
                          placeholder="TrxID দিন *"
                          value={labTrxId}
                          onChange={e => setLabTrxId(e.target.value.toUpperCase())}
                          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold outline-none"
                        />
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-300 font-bold">
                      <span>টেস্ট ফি মোট:</span>
                      <span>৳{labCartSubtotal}</span>
                    </div>
                    {labDiscountAmount > 0 && (
                      <div className="flex justify-between text-pink-300 font-bold">
                        <span>প্রোমো ছাড় ({labAppliedCoupon?.code}):</span>
                        <span>-৳{labDiscountAmount}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-300 font-bold">
                      <span>স্যাম্পল সংগ্রহ চার্জ:</span>
                      <span>+৳{labCollectionFee}</span>
                    </div>
                    <div className="flex justify-between text-base font-black text-emerald-400 pt-1.5 border-t border-slate-700">
                      <span>সর্বমোট প্রদেয়:</span>
                      <span>৳{labFinalPayable}</span>
                    </div>
                  </div>

                  {labOrderError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-2">
                      <AlertCircle size={15} className="shrink-0" />
                      <span>{labOrderError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmittingLabOrder || labCart.length === 0}
                    className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-md active:scale-95 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSubmittingLabOrder ? 'কনফার্ম হচ্ছে...' : '✓ ল্যাব টেস্ট অর্ডার কনফার্ম করুন'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: MY ORDERS & ADMIN-ASSIGNED STAFF PROMOS */}
        {activeTab === 'my_orders' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Admin-Assigned Promo Codes Card */}
            <div className="bg-white p-5 sm:p-6 rounded-[28px] border border-violet-200 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Sparkles className="text-violet-600" size={18} /> আমার জন্য Admin প্রদত্ত প্রোমো কোডসমূহ
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    অ্যাডমিন প্যানেল থেকে আপনার জন্য নির্ধারিত প্রোমো কোডগুলো এখানে পাবেন। ঔষধ ও ল্যাব টেস্ট অর্ডারে এগুলো ব্যবহার করতে পারবেন।
                  </p>
                </div>
              </div>

              {myAssignedPromos.length === 0 ? (
                <div className="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-200 text-center space-y-1">
                  <Tag size={24} className="mx-auto text-slate-300" />
                  <p className="text-xs font-bold text-slate-600">আপনার জন্য এখনো কোনো নির্দিষ্ট স্টাফ প্রোমো কোড বরাদ্দ হয়নি।</p>
                  <p className="text-[11px] text-slate-400">অ্যাডমিন কুপন ম্যানেজার থেকে আপনার জন্য কোড দিলে এখানে স্বয়ংক্রিয়ভাবে দেখাবে।</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {myAssignedPromos.map(promo => (
                    <div
                      key={promo.id}
                      className="p-4 rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200 space-y-2.5 flex flex-col justify-between"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-black text-sm text-violet-900 bg-white px-2.5 py-1 rounded-xl border border-violet-200">
                            {promo.code}
                          </span>
                          <span className="text-xs font-black bg-pink-600 text-white px-2.5 py-0.5 rounded-full">
                            {promo.discount_percent}% ছাড়
                          </span>
                        </div>
                        <h4 className="text-xs font-black text-slate-900">{promo.title}</h4>
                        {promo.description && (
                          <p className="text-[11px] text-slate-600 font-medium">{promo.description}</p>
                        )}
                        <p className="text-[10px] font-bold text-indigo-700">
                          প্রযোজ্য: {promo.applicable_to === 'tests' ? 'ল্যাব টেস্ট' : promo.applicable_to === 'medicines' ? 'ঔষধ ও পণ্য' : 'সব অর্ডারে'}
                          {promo.min_order_amount ? ` • ন্যূনতম ৳${promo.min_order_amount}` : ''}
                        </p>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(promo.code, `card_promo_${promo.id}`)}
                          className="flex-1 py-1.5 bg-white border border-violet-200 text-violet-800 rounded-xl text-[11px] font-black flex items-center justify-center gap-1 cursor-pointer"
                        >
                          {copiedId === `card_promo_${promo.id}` ? <Check size={12} /> : <Copy size={12} />}
                          {copiedId === `card_promo_${promo.id}` ? 'কপি হয়েছে' : 'কোড কপি'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (promo.applicable_to === 'tests') {
                              setLabPromoInput(promo.code);
                              setActiveTab('lab_tests');
                            } else {
                              setMedPromoInput(promo.code);
                              setActiveTab('medicines');
                            }
                          }}
                          className="flex-1 py-1.5 bg-violet-700 text-white rounded-xl text-[11px] font-black cursor-pointer hover:bg-violet-800"
                        >
                          অর্ডারে ব্যবহার →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Staff Order History */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Package className="text-amber-600" size={18} /> আমার করা অর্ডারের তালিকা ({filteredMyStaffOrders.length})
                </h3>
                <div className="flex gap-1.5 bg-white p-1 rounded-xl border border-slate-200">
                  {[
                    { id: 'all', label: 'সব' },
                    { id: 'medicine', label: '💊 ঔষধ ও পণ্য' },
                    { id: 'lab_test', label: '🧪 ল্যাব টেস্ট' }
                  ].map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setOrderHistoryFilter(f.id as any)}
                      className={`px-3 py-1 rounded-lg text-xs font-black cursor-pointer ${
                        orderHistoryFilter === f.id ? 'bg-slate-900 text-white' : 'text-slate-600'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredMyStaffOrders.length === 0 ? (
                <div className="bg-white p-10 rounded-[28px] border border-dashed border-slate-200 text-center space-y-2">
                  <Package size={32} className="mx-auto text-slate-300" />
                  <p className="text-xs font-bold text-slate-500">এখনো কোনো অর্ডার পাওয়া যায়নি।</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredMyStaffOrders.map((order, idx) => (
                    <div
                      key={order.id || idx}
                      className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                        <div>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                            {order.order_type === 'lab_test' ? '🧪 ল্যাব টেস্ট' : '💊 ঔষধ / পণ্য'}
                          </span>
                          <h4 className="text-sm font-black text-slate-900 mt-1">
                            রোগী: {order.patient_name || order.sender_name}
                          </h4>
                          <p className="text-[11px] font-mono text-blue-700 font-bold">{order.sender_contact}</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                            order.status === 'completed' || order.status === 'verified'
                              ? 'bg-emerald-100 text-emerald-800'
                              : order.status === 'cancelled'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {order.status}
                          </span>
                          <p className="text-sm font-black text-emerald-700 mt-1">
                            ৳{(order.amount || 0) + (order.shipping || 0)}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs font-bold text-slate-700 leading-relaxed">{order.item_name}</p>
                      {order.hospital_name && (
                        <p className="text-[11px] text-indigo-700 font-bold">🏥 {order.hospital_name}</p>
                      )}
                      {order.coupon_code && (
                        <p className="text-[11px] text-pink-700 font-black">
                          🎟️ প্রোমো: {order.coupon_code} (-{order.coupon_discount_percent}% / -৳{order.coupon_discount_amount || 0})
                        </p>
                      )}
                      <p className="text-[10px] text-slate-400 font-bold">
                        📍 {order.delivery_address} • {order.created_at ? new Date(order.created_at).toLocaleString('bn-BD') : ''}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: CREATE USER WITH STAFF CODE */}
        {activeTab === 'create_user' && (
          <div>
            {!permissions.create_user_with_code ? (
              <div className="bg-white p-10 rounded-[32px] border border-slate-200 text-center space-y-3">
                <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl mx-auto flex items-center justify-center">
                  <Lock size={26} />
                </div>
                <h3 className="text-base font-black text-slate-800">🔒 অ্যাক্সেস অনুমোদিত নয়</h3>
                <p className="text-xs text-slate-500 font-bold max-w-md mx-auto">
                  আপনার স্টাফ একাউন্টে "নিজের কোড দিয়ে ইউজার তৈরি" সুবিধাটি এডমিন কর্তৃক সক্রিয় করা হয়নি।
                </p>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in">
                <div className="bg-gradient-to-r from-violet-900 to-indigo-900 text-white p-6 rounded-[32px] shadow-lg">
                  <span className="bg-violet-500/30 text-violet-200 border border-violet-400/30 font-black text-[10px] uppercase px-3 py-1 rounded-full flex items-center gap-1.5 w-fit mb-2">
                    <UserPlus size={12} /> স্টাফ রেফারেল অ্যাসিস্ট্যান্ট
                  </span>
                  <h2 className="text-xl font-black text-white">
                    নিজের কোড ({myStaffCode}) দিয়ে নতুন রোগী/ইউজার রেজিস্ট্রেশন
                  </h2>
                  <p className="text-xs text-violet-200 font-medium mt-1">
                    রোগীর নাম ও মোবাইল নম্বর দিয়ে সাবমিট করলেই স্বয়ংক্রিয়ভাবে আপনার স্টাফ কোড যুক্ত হয়ে একাউন্ট তৈরি হয়ে যাবে।
                  </p>
                </div>

                {createdPatientSuccess && (
                  <div className="bg-emerald-50 border-2 border-emerald-300 p-5 rounded-[28px] shadow-md space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-emerald-900 flex items-center gap-2">
                        <Check className="text-emerald-600" size={18} /> রোগী অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে!
                      </h4>
                      <button
                        onClick={() => setCreatedPatientSuccess(null)}
                        className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                      >
                        ✕ বন্ধ করুন
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-white p-3.5 rounded-2xl border border-emerald-200 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">রোগীর নাম:</span>
                        <strong className="text-slate-800">{createdPatientSuccess.name}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">লগইন ফোন নম্বর:</span>
                        <strong className="text-indigo-600 font-mono">{createdPatientSuccess.phone}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">পাসওয়ার্ড:</span>
                        <strong className="text-emerald-700 font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">{createdPatientSuccess.pass}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">রেফারেল কোড:</span>
                        <strong className="text-violet-700 font-mono">{createdPatientSuccess.code}</strong>
                      </div>
                    </div>
                  </div>
                )}

                {patientCreateError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{patientCreateError}</span>
                  </div>
                )}

                <div className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-100 shadow-xs max-w-2xl">
                  <form onSubmit={handleCreatePatient} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-700 uppercase">রোগী / গ্রাহকের নাম *</label>
                      <input
                        type="text"
                        required
                        placeholder="যেমন: মোঃ আল-আমিন সরকার"
                        value={newPatientName}
                        onChange={e => setNewPatientName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-violet-500 focus:bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-700 uppercase">মোবাইল নম্বর (লগইন নম্বর) *</label>
                      <input
                        type="tel"
                        required
                        maxLength={11}
                        placeholder="যেমন: 017xxxxxxxx"
                        value={newPatientPhone}
                        onChange={e => setNewPatientPhone(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold font-mono outline-none focus:border-violet-500 focus:bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-slate-700 uppercase">লগইন পাসওয়ার্ড *</label>
                        <button
                          type="button"
                          onClick={generateRandomUserPass}
                          className="text-[10px] text-violet-600 font-bold hover:underline"
                        >
                          র‍্যান্ডম জেনারেট করুন
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="ন্যূনতম ৬ ডিজিট"
                        value={newPatientPassword}
                        onChange={e => setNewPatientPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold font-mono outline-none focus:border-violet-500 focus:bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-black text-slate-700 uppercase">উপজেলা</label>
                        <input
                          type="text"
                          value={newPatientUpazila}
                          onChange={e => setNewPatientUpazila(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-black text-slate-700 uppercase">গ্রাম / ঠিকানা</label>
                        <input
                          type="text"
                          placeholder="যেমন: বামুনিয়া"
                          value={newPatientVillage}
                          onChange={e => setNewPatientVillage(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none"
                        />
                      </div>
                    </div>

                    <div className="bg-violet-50/70 p-3.5 rounded-2xl border border-violet-200 flex items-center justify-between text-xs">
                      <span className="text-violet-900 font-bold">অটোমেটিক যুক্ত হবে আপনার স্টাফ কোড:</span>
                      <span className="font-mono font-black text-sm text-violet-700 bg-white px-2.5 py-0.5 rounded-lg border border-violet-200">
                        {myStaffCode}
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={isCreatingPatient}
                      className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-black py-3 rounded-2xl shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isCreatingPatient ? 'অ্যাকাউন্ট তৈরি হচ্ছে...' : '✓ নতুন রোগী অ্যাকাউন্ট কনফার্ম করুন'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: MY REFERRED USERS */}
        {activeTab === 'my_users' && (
          <div>
            {!permissions.view_my_referred_users ? (
              <div className="bg-white p-10 rounded-[32px] border border-slate-200 text-center space-y-3">
                <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl mx-auto flex items-center justify-center">
                  <Lock size={26} />
                </div>
                <h3 className="text-base font-black text-slate-800">🔒 অ্যাক্সেস অনুমোদিত নয়</h3>
                <p className="text-xs text-slate-500 font-bold max-w-md mx-auto">
                  আপনার স্টাফ একাউন্টে "নিজের কোডের ইউজারদের তালিকা দেখা" সুবিধাটি বন্ধ রয়েছে।
                </p>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <Users className="text-violet-600" size={20} /> আপনার কোডের অধীনস্থ ইউজারদের তালিকা ({myReferredUsers.length} জন)
                    </h3>
                    <p className="text-xs text-slate-400 font-bold">
                      কোড: <span className="font-mono text-violet-700 font-black">{myStaffCode}</span>
                    </p>
                  </div>
                  <div className={`px-3 py-1.5 rounded-xl border text-[10px] font-black flex items-center gap-1.5 ${
                    permissions.view_user_passwords
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}>
                    <Key size={12} />
                    {permissions.view_user_passwords
                      ? '✓ ইউজারদের পাসওয়ার্ড দেখার অনুমতি সক্রিয়'
                      : '🔒 পাসওয়ার্ড দেখার অনুমতি নেই'}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs">
                  <div className="relative">
                    <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="নাম, ফোন নম্বর বা গ্রাম দিয়ে খুঁজুন..."
                      value={userSearchQuery}
                      onChange={e => setUserSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-bold outline-none focus:border-violet-500 focus:bg-white"
                    />
                  </div>
                </div>

                {filteredMyUsers.length === 0 ? (
                  <div className="bg-white p-10 rounded-[28px] border border-dashed border-slate-200 text-center space-y-2">
                    <p className="text-xs text-slate-400 font-bold">
                      আপনার কোড ব্যবহার করে কোনো রোগী বা গ্রাহক এখনো নিবন্ধিত হয়নি।
                    </p>
                  </div>
                ) : (
                  <div className="bg-white rounded-[28px] border border-slate-100 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase tracking-wider font-black text-slate-500">
                          <tr>
                            <th className="py-3 px-4">রোগী/গ্রাহকের নাম</th>
                            <th className="py-3 px-4">ফোন নম্বর</th>
                            <th className="py-3 px-4">ঠিকানা</th>
                            <th className="py-3 px-4">ইউনিক পাসওয়ার্ড</th>
                            <th className="py-3 px-4">রেজিস্ট্রেশন তারিখ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {filteredMyUsers.map(u => (
                            <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-3.5 px-4 font-bold text-slate-900">{u.full_name}</td>
                              <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">{u.phone}</td>
                              <td className="py-3.5 px-4 text-slate-500">
                                {[u.village, u.upazila, u.district].filter(Boolean).join(', ') || 'N/A'}
                              </td>
                              <td className="py-3.5 px-4">
                                {permissions.view_user_passwords ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono font-black text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
                                      {u.created_password || (u as any).password || '123456'}
                                    </span>
                                    <button
                                      onClick={() => copyToClipboard(u.created_password || (u as any).password || '123456', `u_pass_${u.id}`)}
                                      className="text-[10px] text-slate-400 hover:text-slate-600 p-1"
                                    >
                                      {copiedId === `u_pass_${u.id}` ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                    <Lock size={10} /> অনুমতি নেই
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-[10px] text-slate-400">
                                {u.created_at ? new Date(u.created_at).toLocaleDateString('bn-BD') : 'পূর্বের রেকর্ড'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 7: FREE DOCTOR CONSULTATION */}
        {activeTab === 'free_doctor' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-6 rounded-[32px] shadow-lg">
              <span className="bg-white/20 text-white font-black text-[10px] uppercase px-3 py-1 rounded-full flex items-center gap-1.5 w-fit mb-2">
                <Gift size={12} /> ফ্রি চিকিৎসা সহায়তা
              </span>
              <h2 className="text-xl font-black text-white">🎁 ফ্রি ডাক্তার কনসালটেশন সার্ভিস</h2>
              <p className="text-xs text-amber-100 font-medium mt-1">
                রোগীদের জন্য ফ্রি ডাক্তার টোকেন ও ভিডিও কনসালটেশন সহায়তা প্রদান করুন।
              </p>
            </div>
            <div className="bg-white p-8 rounded-[32px] border border-slate-100 text-center space-y-3">
              <p className="text-xs text-slate-600 font-bold">
                ফ্রি ডক্টরস কনসালটেশন প্যানেল চালু রয়েছে। মূল ওয়েবসাইট থেকেও ফ্রি ডক্টর টোকেন বুকিং সহায়তা দিতে পারবেন।
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
