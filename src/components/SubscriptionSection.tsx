import React, { useState, useEffect } from 'react';
import { 
  CreditCard, ShieldCheck, CheckCircle2, Clock, 
  Sparkles, Check, X, Phone, MapPin, Search, 
  AlertCircle, Copy, ArrowRight, RefreshCw, Zap, 
  Stethoscope, Microscope, Award, Download, 
  Share2, MessageSquare, User, Calendar, Filter
} from 'lucide-react';
import { db } from '../../services/firebase';
import { 
  doc, getDoc, setDoc, collection, getDocs, 
  query, orderBy, limit, addDoc, updateDoc 
} from 'firebase/firestore';
import { 
  Profile, Subscription, SubscriptionPlan, 
  SubscriptionPlanType, UserRole 
} from '../../types';

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'tier1_test_discount',
    title: 'টেস্ট ডিসকাউন্ট হেলথ কার্ড',
    titleEn: '20% Test Discount Health Card',
    badge: 'সকল টেস্টে ২০% ছাড়',
    discountRate: 20,
    hasFreeDoctor: false,
    features: [
      'সকল প্রকার ল্যাব ও প্যাথলজি টেস্টে ২০% ফ্ল্যাট ডিসকাউন্ট',
      'ডিজিটাল এক্স-রে ও আল্ট্রাসোনোগ্রামে (USG) ২০% ছাড়',
      '৩ বছর বা ৫ বছরের দীর্ঘস্থায়ী মেয়াদী সুবিধা',
      'ডিজিটাল সাবস্ক্রিপশন স্মার্ট কার্ড ও আজীবন হিস্টোরি',
      'পরিবারের সদস্যদের টেস্টেও কার্ড ব্যবহারের বিশেষ সুযোগ'
    ],
    pricing: [
      { durationYears: 3, price: 300, labelBn: '৩ বছর মেয়াদ - ৳৩০০ টাকা' },
      { durationYears: 5, price: 500, labelBn: '৫ বছর মেয়াদ - ৳৫০০ টাকা' }
    ],
    colorScheme: {
      from: 'from-blue-600',
      to: 'to-indigo-800',
      border: 'border-blue-300',
      accent: 'bg-blue-600'
    }
  },
  {
    id: 'tier2_test_and_doctor',
    title: 'অল-ইন-ওয়ান প্রিমিয়াম হেলথ ও ডক্টর কার্ড',
    titleEn: '20% Test Discount + Free Online Doctor',
    badge: '২০% টেস্ট ছাড় + ফ্রি অনলাইন ডাক্তার',
    discountRate: 20,
    hasFreeDoctor: true,
    features: [
      'সকল প্রকার ডায়াগনস্টিক ও প্যাথলজিক্যাল টেস্টে ২০% ছাড়',
      'মেয়াদকালীন সময়ে অভিজ্ঞ চিকিৎসকদের সাথে ফ্রি অনলাইন কনসালটেশন',
      'অনলাইন ভিডিও কল ও ভয়েস কলে সরাসরি প্রেসক্রিপশন সুবিধা',
      '৩ বছর বা ৫ বছর মেয়াদের সর্বোচ্চ সাশ্রয়ী প্রিমিয়াম মেম্বারশিপ',
      'জরুরি ডক্টর সাপোর্ট ও অগ্রাধিকার সিরিয়াল সুবিধা',
      'প্রিমিয়াম ভিআইপি গোল্ডেন ডিজিটাল হেলথ কার্ড'
    ],
    pricing: [
      { durationYears: 3, price: 1000, labelBn: '৩ বছর মেয়াদ - ৳১,০০০ টাকা' },
      { durationYears: 5, price: 1500, labelBn: '৫ বছর মেয়াদ - ৳১,৫০০ টাকা' }
    ],
    colorScheme: {
      from: 'from-amber-600',
      to: 'to-purple-900',
      border: 'border-amber-400',
      accent: 'bg-gradient-to-r from-amber-500 to-purple-600'
    }
  }
];

interface SubscriptionSectionProps {
  profile: Profile | null;
  isAdmin?: boolean;
  whatsappNumber?: string;
  onOpenAuth?: () => void;
}

export const SubscriptionSection: React.FC<SubscriptionSectionProps> = ({
  profile,
  isAdmin = false,
  whatsappNumber = '8801352669100',
  onOpenAuth
}) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [userSubscription, setUserSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [showApplyModal, setShowApplyModal] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Selected Plan Form state
  const [selectedPlanType, setSelectedPlanType] = useState<SubscriptionPlanType>('tier1_test_discount');
  const [selectedDuration, setSelectedDuration] = useState<3 | 5>(3);
  const [formName, setFormName] = useState<string>(profile?.full_name || '');
  const [formPhone, setFormPhone] = useState<string>(profile?.phone || '');
  const [formDistrict, setFormDistrict] = useState<string>(profile?.district || 'নীলফামারী');
  const [formAddress, setFormAddress] = useState<string>(profile?.village || profile?.upazila || '');
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad' | 'rocket'>('bkash');
  const [senderPhone, setSenderPhone] = useState<string>(profile?.phone || '');
  const [trxId, setTrxId] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  // Admin filter & action state
  const [adminStatusFilter, setAdminStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [adminSearch, setAdminSearch] = useState<string>('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const activePlan = SUBSCRIPTION_PLANS.find(p => p.id === selectedPlanType) || SUBSCRIPTION_PLANS[0];
  const activePricing = activePlan.pricing.find(pr => pr.durationYears === selectedDuration) || activePlan.pricing[0];

  // Official payment numbers
  const BKASH_NUMBER = '01518395772';
  const NAGAD_NUMBER = '01846800973';
  const ROCKET_NUMBER = '01518395772';

  const currentPayNumber = paymentMethod === 'bkash' ? BKASH_NUMBER : (paymentMethod === 'nagad' ? NAGAD_NUMBER : ROCKET_NUMBER);

  useEffect(() => {
    fetchSubscriptions();
  }, [profile?.id, profile?.phone]);

  useEffect(() => {
    if (profile?.full_name && !formName) setFormName(profile.full_name);
    if (profile?.phone && !formPhone) {
      setFormPhone(profile.phone);
      if (!senderPhone) setSenderPhone(profile.phone);
    }
  }, [profile]);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const subRef = collection(db, 'subscriptions');
      const snap = await getDocs(subRef);
      const list: Subscription[] = snap.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      } as Subscription));

      list.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      setSubscriptions(list);

      // Find active or latest user subscription
      if (profile?.id || profile?.phone) {
        const mySub = list.find(s => 
          (profile.id && s.user_id === profile.id) || 
          (profile.phone && s.user_phone === profile.phone)
        );
        setUserSubscription(mySub || null);
      }
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleApplySubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!profile && onOpenAuth) {
      onOpenAuth();
      return;
    }

    if (!formName.trim()) {
      setFormError('অনুগ্রহ করে গ্রাহকের পুরো নাম লিখুন।');
      return;
    }
    if (!formPhone.trim() || formPhone.length < 11) {
      setFormError('সঠিক ১১ ডিজিটের মোবাইল নম্বর প্রদান করুন।');
      return;
    }
    if (!senderPhone.trim() || senderPhone.length < 11) {
      setFormError('যে নম্বর থেকে পেমেন্ট করেছেন সেই নম্বরটি প্রদান করুন।');
      return;
    }
    if (!trxId.trim() || trxId.length < 4) {
      setFormError('সঠিক পেমেন্ট TrxID (ট্রানজেকশন আইডি) প্রদান করুন।');
      return;
    }

    setSubmitting(true);
    try {
      // Generate a distinct card number NIL-SUB-XXXXXX
      const randomDigits = Math.floor(100000 + Math.random() * 900000);
      const cardNumber = `NIL-SUB-${randomDigits}`;

      const newSubData: Omit<Subscription, 'id'> = {
        user_id: profile?.id || 'guest_' + Date.now(),
        user_name: formName.trim(),
        user_phone: formPhone.trim(),
        user_email: profile?.virtual_email || '',
        district: formDistrict.trim(),
        address: formAddress.trim(),
        plan_type: selectedPlanType,
        plan_name: activePlan.title,
        duration_years: selectedDuration,
        fee: activePricing.price,
        payment_method: paymentMethod,
        payment_sender_phone: senderPhone.trim(),
        trx_id: trxId.trim().toUpperCase(),
        card_number: cardNumber,
        status: 'pending',
        created_at: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, 'subscriptions'), newSubData);
      const createdSub: Subscription = { id: docRef.id, ...newSubData };

      setSubscriptions(prev => [createdSub, ...prev]);
      setUserSubscription(createdSub);
      setShowApplyModal(false);
      setTrxId('');

      // Auto-prompt WhatsApp confirmation
      const msg = `আসসালামু আলাইকুম, আমি Nilpha Health এ ${activePlan.title} (${selectedDuration} বছর মেয়াদী, ৳${activePricing.price}) এর জন্য সাবস্ক্রিপশন আবেদন করেছি।\nকার্ড নং: ${cardNumber}\nনাম: ${formName}\nমোবাইল: ${formPhone}\nপেমেন্ট TrxID: ${trxId.toUpperCase()}`;
      window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');

    } catch (err: any) {
      console.error('Error submitting subscription application:', err);
      setFormError('আবেদন জমা দিতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setSubmitting(false);
    }
  };

  // Admin Approve Action
  const handleAdminApprove = async (sub: Subscription) => {
    setProcessingId(sub.id);
    try {
      const now = new Date();
      const validFrom = now.toISOString();
      const validUntil = new Date(now.getFullYear() + sub.duration_years, now.getMonth(), now.getDate()).toISOString();

      await updateDoc(doc(db, 'subscriptions', sub.id), {
        status: 'approved',
        valid_from: validFrom,
        valid_until: validUntil,
        approved_at: validFrom
      });

      setSubscriptions(prev => prev.map(item => 
        item.id === sub.id 
          ? { ...item, status: 'approved', valid_from: validFrom, valid_until: validUntil, approved_at: validFrom } 
          : item
      ));

      if (userSubscription?.id === sub.id) {
        setUserSubscription(prev => prev ? { ...prev, status: 'approved', valid_from: validFrom, valid_until: validUntil, approved_at: validFrom } : null);
      }

      // Option to notify user via WhatsApp
      const notifyMsg = `অভিনন্দন ${sub.user_name}! Nilpha Health-এ আপনার সাবস্ক্রিপশন অনুমোদিত হয়েছে।\nকার্ড নং: ${sub.card_number}\nপ্ল্যান: ${sub.plan_name}\nমেয়াদ: ${sub.duration_years} বছর (${new Date(validUntil).toLocaleDateString('bn-BD')} পর্যন্ত)।\nএখন থেকে আপনি সকল টেস্টে ২০% ডিসকাউন্ট উপভোগ করতে পারবেন!`;
      const waUrl = `https://wa.me/88${sub.user_phone}?text=${encodeURIComponent(notifyMsg)}`;
      window.open(waUrl, '_blank');

    } catch (err) {
      console.error('Admin approval error:', err);
      alert('অনুমোদন করতে সমস্যা হয়েছে।');
    } finally {
      setProcessingId(null);
    }
  };

  // Admin Reject Action
  const handleAdminReject = async (subId: string) => {
    const reason = window.prompt('বাতিলের কারণ লিখুন (ঐচ্ছিক):');
    if (reason === null) return;

    setProcessingId(subId);
    try {
      await updateDoc(doc(db, 'subscriptions', subId), {
        status: 'rejected',
        admin_notes: reason || 'পেমেন্ট তথ্য যাচাই করা সম্ভব হয়নি।'
      });

      setSubscriptions(prev => prev.map(item => 
        item.id === subId 
          ? { ...item, status: 'rejected', admin_notes: reason || 'বাতিল করা হয়েছে' } 
          : item
      ));

      if (userSubscription?.id === subId) {
        setUserSubscription(prev => prev ? { ...prev, status: 'rejected', admin_notes: reason || 'বাতিল করা হয়েছে' } : null);
      }
    } catch (err) {
      console.error('Admin rejection error:', err);
      alert('বাতিল করতে সমস্যা হয়েছে।');
    } finally {
      setProcessingId(null);
    }
  };

  // Filtered subscriptions for admin
  const filteredSubs = subscriptions.filter(sub => {
    const matchStatus = adminStatusFilter === 'all' || sub.status === adminStatusFilter;
    const matchSearch = !adminSearch || 
      sub.user_name.toLowerCase().includes(adminSearch.toLowerCase()) ||
      sub.user_phone.includes(adminSearch) ||
      sub.trx_id.toLowerCase().includes(adminSearch.toLowerCase()) ||
      sub.card_number.toLowerCase().includes(adminSearch.toLowerCase());
    return matchStatus && matchSearch;
  });

  // Admin View
  if (isAdmin) {
    const pendingCount = subscriptions.filter(s => s.status === 'pending').length;
    const approvedCount = subscriptions.filter(s => s.status === 'approved').length;
    const totalRev = subscriptions.filter(s => s.status === 'approved').reduce((acc, curr) => acc + (curr.fee || 0), 0);

    return (
      <div className="space-y-6 text-left animate-in fade-in duration-300">
        {/* Admin Header Stats */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-[32px] text-white shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="bg-amber-400 text-slate-950 font-black text-[10px] uppercase px-3 py-1 rounded-full flex items-center gap-1.5 w-fit mb-2 shadow-sm">
              <Award size={12} /> হেলথ কার্ড ও সাবস্ক্রিপশন ম্যানেজমেন্ট
            </span>
            <h2 className="text-2xl font-black text-white tracking-tight">
              💳 মেম্বারশিপ ও সাবস্ক্রিপশন অনুমোদন প্যানেল
            </h2>
            <p className="text-xs text-indigo-200 font-bold mt-1">
              গ্রাহকদের ৩ বছর ও ৫ বছর মেয়াদী সাবস্ক্রিপশন আবেদনসমূহ যাচাই, অনুমোদন ও স্মার্ট কার্ড বিতরণ।
            </p>
          </div>
          <button
            onClick={fetchSubscriptions}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-2xl text-xs font-bold flex items-center gap-1.5 border border-white/10"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> রিফ্রেশ
          </button>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">মোট আবেদন</p>
            <p className="text-2xl font-black text-slate-900">{subscriptions.length} টি</p>
          </div>
          <div className="bg-amber-50/80 p-5 rounded-[28px] border border-amber-200 shadow-sm">
            <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-1">⏳ পেন্ডিং আবেদন</p>
            <p className="text-2xl font-black text-amber-800">{pendingCount} জন</p>
          </div>
          <div className="bg-emerald-50/80 p-5 rounded-[28px] border border-emerald-200 shadow-sm">
            <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1">✅ সক্রিয় মেম্বার</p>
            <p className="text-2xl font-black text-emerald-800">{approvedCount} জন</p>
          </div>
          <div className="bg-blue-50/80 p-5 rounded-[28px] border border-blue-200 shadow-sm">
            <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-1">💰 অর্জিত রেভিনিউ</p>
            <p className="text-2xl font-black text-blue-800">৳{totalRev} BDT</p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
              {[
                { id: 'all', label: `সব (${subscriptions.length})` },
                { id: 'pending', label: `⏳ পেন্ডিং (${pendingCount})` },
                { id: 'approved', label: `✅ অনুমোদিত (${approvedCount})` },
                { id: 'rejected', label: `❌ বাতিল (${subscriptions.filter(s => s.status === 'rejected').length})` }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setAdminStatusFilter(tab.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                    adminStatusFilter === tab.id 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative min-w-[240px]">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="নাম / ফোন / TrxID / কার্ড নং খুঁজুন..."
                value={adminSearch}
                onChange={e => setAdminSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-600"
              />
            </div>
          </div>

          {/* Subscriptions Table / List */}
          {filteredSubs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-bold text-xs space-y-2">
              <CreditCard size={36} className="mx-auto text-slate-300 opacity-60" />
              <p>কোনো সাবস্ক্রিপশন আবেদন পাওয়া যায়নি।</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredSubs.map(sub => {
                const isPending = sub.status === 'pending';
                const isApproved = sub.status === 'approved';
                const isRejected = sub.status === 'rejected';

                return (
                  <div 
                    key={sub.id} 
                    className={`p-5 rounded-2xl border-2 transition-all space-y-4 ${
                      isPending ? 'bg-amber-50/30 border-amber-200' :
                      isApproved ? 'bg-emerald-50/20 border-emerald-200' :
                      'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-black bg-slate-900 text-white px-2.5 py-0.5 rounded-lg tracking-wider">
                            {sub.card_number}
                          </span>
                          <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                            isPending ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                            isApproved ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                            'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}>
                            {isPending ? '⏳ পেন্ডিং ভেরিফিকেশন' : isApproved ? '✅ সক্রিয় মেম্বারশিপ' : '❌ আবেদন বাতিল'}
                          </span>
                          <span className="text-[10px] font-black bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                            {sub.plan_type === 'tier2_test_and_doctor' ? '🎁 ২০% ছাড় + ফ্রি ডাক্তার' : '🧪 ২০% টেস্ট ছাড়'}
                          </span>
                        </div>

                        <h4 className="text-base font-black text-slate-900 mt-1 flex items-center gap-2">
                          <span>{sub.user_name}</span>
                          <span className="text-xs font-bold text-slate-500 font-mono">({sub.user_phone})</span>
                        </h4>

                        <p className="text-xs text-slate-600 font-medium">
                          📍 {sub.address || 'ঠিকানা দেওয়া হয়নি'}, {sub.district || 'নীলফামারী'}
                        </p>
                      </div>

                      <div className="text-right space-y-1">
                        <div className="text-sm font-black text-slate-900">
                          ফি: <span className="text-emerald-600 font-extrabold text-base">৳{sub.fee} BDT</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400">
                          মেয়াদ: <span className="text-slate-700 font-black">{sub.duration_years} বছর</span>
                        </p>
                        <p className="text-[9px] text-slate-400">
                          তারিখ: {new Date(sub.created_at).toLocaleDateString('bn-BD')}
                        </p>
                      </div>
                    </div>

                    {/* Payment Info Box */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">পেমেন্ট মেথড ও প্রেরক নম্বর</span>
                        <div className="font-bold text-slate-800 flex items-center gap-2">
                          <span className="uppercase font-black text-purple-700">{sub.payment_method}</span> • 
                          <span className="font-mono">{sub.payment_sender_phone}</span>
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">পেমেন্ট TrxID</span>
                        <div className="font-mono font-black text-blue-700 tracking-wider select-all bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          {sub.trx_id}
                        </div>
                      </div>

                      {isApproved && sub.valid_until && (
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">মেয়াদ উত্তীর্ণের তারিখ</span>
                          <div className="font-bold text-emerald-700">
                            {new Date(sub.valid_until).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </div>
                        </div>
                      )}

                      {isRejected && sub.admin_notes && (
                        <div className="space-y-0.5 text-rose-700">
                          <span className="text-[9px] font-black uppercase text-rose-400 tracking-wider">বাতিলের কারণ:</span>
                          <div className="font-bold">{sub.admin_notes}</div>
                        </div>
                      )}
                    </div>

                    {/* Admin Action Buttons */}
                    <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <a
                        href={`https://wa.me/88${sub.user_phone}?text=${encodeURIComponent(`আসসালামু আলাইকুম ${sub.user_name}, আপনার Nilpha Health সাবস্ক্রিপশন কার্ড (${sub.card_number}) সংক্রান্ত তথ্যের জন্য যোগাযোগ করা হচ্ছে।`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all"
                      >
                        <MessageSquare size={13} /> হোয়াটসঅ্যাপ
                      </a>

                      {isPending && (
                        <>
                          <button
                            type="button"
                            disabled={processingId === sub.id}
                            onClick={() => handleAdminReject(sub.id)}
                            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-black transition-all active:scale-95 disabled:opacity-50"
                          >
                            ✕ বাতিল করুন
                          </button>

                          <button
                            type="button"
                            disabled={processingId === sub.id}
                            onClick={() => handleAdminApprove(sub)}
                            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                          >
                            <CheckCircle2 size={14} /> 
                            {processingId === sub.id ? 'অনুমোদন হচ্ছে...' : '✓ অনুমোদন ও কার্ড সক্রিয় করুন'}
                          </button>
                        </>
                      )}

                      {isApproved && (
                        <span className="text-xs font-black text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 size={15} /> কার্ড সক্রিয় রয়েছে
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // User-Facing View
  return (
    <div className="space-y-6 text-left animate-in fade-in duration-300">
      {/* Hero Banner with Plan Explanation */}
      <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 text-white p-6 sm:p-8 rounded-[32px] shadow-2xl relative overflow-hidden space-y-4 border border-indigo-500/30">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-10 translate-y-10">
          <Award size={260} />
        </div>

        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 bg-amber-400 text-slate-950 px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md">
            <Sparkles size={13} /> বিশেষ মেম্বারশিপ অফার (৩ ও ৫ বছর মেয়াদী)
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-snug">
            💳 Nilpha ডিজিটাল হেলথ কার্ড ও সাবস্ক্রিপশন প্ল্যান
          </h2>

          <p className="text-xs sm:text-sm text-indigo-100 font-normal leading-relaxed max-w-2xl">
            একবার রেজিস্ট্রেশন করে ৩ বছর বা ৫ বছরের জন্য সাবস্ক্রিপশন গ্রহণ করুন। সকল প্যাথলজিক্যাল ও ডায়াগনস্টিক টেস্টে পান নিশ্চিত <span className="text-amber-300 font-black">২০% ফ্ল্যাট ডিসকাউন্ট</span> এবং ফ্রি অনলাইন স্পেশালিস্ট ডাক্তার কনসালটেশনের বিশেষ সুবিধা!
          </p>

          {/* If user already has an active subscription, display their digital card */}
          {userSubscription && userSubscription.status === 'approved' && (
            <div className="mt-4 p-5 bg-gradient-to-r from-amber-500/20 to-purple-500/20 rounded-2xl border border-amber-300/40 backdrop-blur-md space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Award className="text-amber-300" size={20} />
                  <span className="font-black text-amber-300 text-xs uppercase tracking-wider">আপনার সক্রিয় মেম্বারশিপ কার্ড</span>
                </div>
                <span className="bg-emerald-500 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full">
                  সক্রিয় (Active)
                </span>
              </div>

              <div className="bg-slate-950/80 p-4 rounded-xl border border-white/10 flex flex-wrap items-center justify-between gap-4 font-mono">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">কার্ড নম্বর</p>
                  <p className="text-lg font-black text-amber-400 tracking-wider select-all">{userSubscription.card_number}</p>
                  <p className="text-xs text-white font-sans mt-0.5">{userSubscription.user_name} ({userSubscription.plan_name})</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 uppercase">মেয়াদ শেষ</p>
                  <p className="text-xs font-bold text-emerald-300">
                    {userSubscription.valid_until ? new Date(userSubscription.valid_until).toLocaleDateString('bn-BD') : `${userSubscription.duration_years} বছর`}
                  </p>
                  <p className="text-[10px] text-amber-200 font-sans mt-0.5">২০% টেস্ট ছাড় সক্রিয়</p>
                </div>
              </div>
            </div>
          )}

          {userSubscription && userSubscription.status === 'pending' && (
            <div className="mt-3 p-4 bg-amber-500/20 rounded-2xl border border-amber-400/40 backdrop-blur-md flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <Clock className="text-amber-300 shrink-0" size={18} />
                <div>
                  <p className="font-black text-amber-200">আপনার সাবস্ক্রিপশন আবেদনটি অ্যাডমিন যাচাইাধীন রয়েছে</p>
                  <p className="text-[11px] text-slate-300 font-medium">কার্ড নং: <span className="font-mono font-bold text-white">{userSubscription.card_number}</span> (TrxID: {userSubscription.trx_id})</p>
                </div>
              </div>
              <button
                onClick={() => {
                  const msg = `আসসালামু আলাইকুম, আমি Nilpha Health এ সাবস্ক্রিপশন আবেদন জমা দিয়েছি। কার্ড নং: ${userSubscription.card_number}, TrxID: ${userSubscription.trx_id}। দ্রুত অনুমোদনের অনুরোধ করছি।`;
                  window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
                }}
                className="px-3 py-1.5 bg-emerald-600 text-white font-black text-[10px] rounded-xl hover:bg-emerald-500 transition-all shrink-0"
              >
                হোয়াটসঅ্যাপে তাগিদ দিন
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Two Subscription Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SUBSCRIPTION_PLANS.map((plan, idx) => {
          const isTier2 = plan.id === 'tier2_test_and_doctor';

          return (
            <div 
              key={plan.id}
              className={`rounded-[32px] p-6 sm:p-7 border-2 transition-all flex flex-col justify-between relative shadow-xl ${
                isTier2 
                  ? 'bg-gradient-to-b from-purple-50/80 via-white to-amber-50/50 border-purple-300/80 hover:border-purple-500 shadow-purple-900/5' 
                  : 'bg-gradient-to-b from-blue-50/80 via-white to-indigo-50/50 border-blue-200 hover:border-blue-400 shadow-blue-900/5'
              }`}
            >
              {/* Card Header Top */}
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-xs ${
                    isTier2 ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'
                  }`}>
                    {idx === 0 ? '১ নং সাবস্ক্রিপশন প্ল্যান' : '২ নং সুপার প্রিমিয়াম প্ল্যান'}
                  </span>

                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                    ★ {plan.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-snug">
                    {plan.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-bold mt-1">
                    {plan.titleEn}
                  </p>
                </div>

                {/* Pricing Badges Box */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-inner space-y-2.5">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">সাবস্ক্রিপশন ফি ও মেয়াদকাল:</p>
                  
                  <div className="grid grid-cols-2 gap-2.5">
                    {plan.pricing.map(pr => (
                      <div 
                        key={pr.durationYears}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          isTier2 ? 'bg-purple-50/50 border-purple-200' : 'bg-blue-50/50 border-blue-200'
                        }`}
                      >
                        <span className="text-[10px] font-black uppercase text-slate-500 block">
                          {pr.durationYears} বছর মেয়াদ
                        </span>
                        <span className={`text-base sm:text-lg font-black block mt-0.5 ${
                          isTier2 ? 'text-purple-700' : 'text-blue-700'
                        }`}>
                          ৳{pr.price} <span className="text-[10px] font-bold text-slate-400">BDT</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Plan Key Features */}
                <div className="space-y-2.5 pt-2">
                  <p className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 size={14} className={isTier2 ? 'text-purple-600' : 'text-blue-600'} />
                    প্ল্যানের প্রধান সুবিধাসমূহ:
                  </p>
                  <ul className="space-y-2">
                    {plan.features.map((feat, fIdx) => (
                      <li key={fIdx} className="text-xs text-slate-600 font-medium flex items-start gap-2 leading-relaxed">
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-white shrink-0 mt-0.5 text-[9px] font-black ${
                          isTier2 ? 'bg-purple-600' : 'bg-blue-600'
                        }`}>
                          ✓
                        </span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6 mt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPlanType(plan.id);
                    setSelectedDuration(3);
                    setShowApplyModal(true);
                  }}
                  className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider text-white shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer ${
                    isTier2 
                      ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-amber-600 hover:opacity-95 shadow-purple-500/20' 
                      : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                  }`}
                >
                  <CreditCard size={15} /> এই সাবস্ক্রিপশনটি নিতে আবেদন করুন
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Subscription Application Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] max-w-lg w-full max-h-[92vh] overflow-y-auto p-6 sm:p-7 space-y-5 shadow-2xl border border-slate-100 text-left relative">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <span className="inline-block bg-blue-100 text-blue-700 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-1">
                  সাবস্ক্রিপশন রেজিস্ট্রেশন ফর্ম
                </span>
                <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                  💳 হেলথ কার্ড সাবস্ক্রিপশন আবেদন
                </h3>
                <p className="text-[11px] text-slate-500 font-bold mt-0.5">
                  ফি পরিশোধ করে TrxID সাবমিট করুন। অ্যাডমিন অনুমোদনের পর কার্ড সক্রিয় হবে।
                </p>
              </div>
              <button
                onClick={() => setShowApplyModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold transition-all"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApplySubscription} className="space-y-4">
              {/* Plan Choice Selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  ১. সাবস্ক্রিপশন প্ল্যান নির্বাচন করুন *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {SUBSCRIPTION_PLANS.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPlanType(p.id)}
                      className={`p-3 rounded-2xl border-2 text-left transition-all ${
                        selectedPlanType === p.id 
                          ? 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-sm' 
                          : 'border-slate-200 bg-slate-50 text-slate-600'
                      }`}
                    >
                      <p className="text-xs font-black leading-tight">{p.title}</p>
                      <span className="text-[9px] font-bold text-blue-600 block mt-1">{p.badge}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration Choice (3 years vs 5 years) */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  ২. মেয়াদ নির্বাচন করুন *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {activePlan.pricing.map(pr => (
                    <button
                      key={pr.durationYears}
                      type="button"
                      onClick={() => setSelectedDuration(pr.durationYears as 3 | 5)}
                      className={`p-3 rounded-2xl border-2 text-center transition-all ${
                        selectedDuration === pr.durationYears 
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-black shadow-sm' 
                          : 'border-slate-200 bg-slate-50 text-slate-600 font-bold'
                      }`}
                    >
                      <div className="text-xs font-black">{pr.durationYears} বছর মেয়াদ</div>
                      <div className="text-sm font-extrabold text-emerald-600 mt-0.5">৳{pr.price} টাকা</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Applicant Details */}
              <div className="space-y-3 pt-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  ৩. কার্ড গ্রহীতার ব্যক্তিগত তথ্য *
                </label>
                
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">পূর্ণ নাম *</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: মোঃ রফিকুল ইসলাম"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">মোবাইল নম্বর *</label>
                    <input
                      type="tel"
                      required
                      placeholder="017XXXXXXXX"
                      value={formPhone}
                      onChange={e => setFormPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">জেলা *</label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: নীলফামারী"
                      value={formDistrict}
                      onChange={e => setFormDistrict(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">ঠিকানা / গ্রাম / এলাকা</label>
                  <input
                    type="text"
                    placeholder="যেমন: সবুজপাড়া, নীলফামারী সদর"
                    value={formAddress}
                    onChange={e => setFormAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              {/* Payment Section */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  ৪. পেমেন্ট সম্পন্ন করুন ও TrxID দিন *
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'bkash', label: '🌸 বিকাশ', num: BKASH_NUMBER },
                    { id: 'nagad', label: '🍊 নগদ', num: NAGAD_NUMBER },
                    { id: 'rocket', label: '🚀 রকেট', num: ROCKET_NUMBER }
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`py-2 rounded-xl border-2 text-xs font-black transition-all ${
                        paymentMethod === m.id 
                          ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm' 
                          : 'border-slate-200 bg-slate-50 text-slate-600'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* Payment instruction box */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-3.5 rounded-2xl border border-amber-200 text-xs space-y-2">
                  <div className="flex items-center justify-between font-black text-slate-900">
                    <span>{paymentMethod === 'bkash' ? '🌸 বিকাশ Personal' : paymentMethod === 'nagad' ? '🍊 নগদ Personal' : '🚀 রকেট'} নম্বর:</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(currentPayNumber, 'num')}
                      className="bg-white px-2.5 py-1 rounded-lg border border-amber-300 text-slate-900 font-mono flex items-center gap-1 hover:bg-amber-100 transition-all cursor-pointer"
                    >
                      <span>{currentPayNumber}</span>
                      <Copy size={11} className="text-amber-700" />
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                    ১. আমাদের নম্বরে মোট <span className="font-black text-rose-700">৳{activePricing.price} টাকা</span> Send Money করুন।
                    <br />
                    ২. পেমেন্ট শেষে পাওয়া TrxID ও যে নম্বর থেকে পাঠিয়েছেন তা নিচে লিখুন।
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">প্রেরক মোবাইল নম্বর *</label>
                    <input
                      type="tel"
                      required
                      placeholder="যে নম্বর থেকে টাকা পাঠিয়েছেন"
                      value={senderPhone}
                      onChange={e => setSenderPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">পেমেন্ট TrxID (ট্রানজেকশন আইডি) *</label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: 9J782HG5"
                      value={trxId}
                      onChange={e => setTrxId(e.target.value.toUpperCase())}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-black uppercase outline-none focus:border-blue-600 tracking-wider"
                    />
                  </div>
                </div>
              </div>

              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2">
                  <AlertCircle size={15} /> {formError}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  বাতিল
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wide rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Check size={14} /> 
                  {submitting ? 'আবেদন জমা হচ্ছে...' : `৳${activePricing.price} টাকা ফি সাবমিট করুন`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
