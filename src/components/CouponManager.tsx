import React, { useState, useEffect } from 'react';
import { 
  Percent, 
  Tag, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  XCircle, 
  Copy, 
  Check, 
  Sparkles, 
  Calculator, 
  Info,
  RefreshCw
} from 'lucide-react';
import { Coupon } from '../../types';
import { 
  fetchCoupons, 
  saveCoupon, 
  deleteCoupon, 
  toggleCouponStatus,
  validateCoupon
} from '../services/couponService';

interface CouponManagerProps {
  onCouponsUpdated?: (coupons: Coupon[]) => void;
}

export const CouponManager: React.FC<CouponManagerProps> = ({ onCouponsUpdated }) => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  // Form states for Add / Edit
  const [formCode, setFormCode] = useState('');
  const [formDiscountPercent, setFormDiscountPercent] = useState<number>(20);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formApplicableTo, setFormApplicableTo] = useState<'all' | 'tests' | 'services'>('tests');
  const [formMinOrderAmount, setFormMinOrderAmount] = useState<number>(0);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Live Calculator State
  const [simTestPrice, setSimTestPrice] = useState<number>(1000);
  const [simCouponCode, setSimCouponCode] = useState<string>('TEST20');
  const [simResult, setSimResult] = useState<string | null>(null);

  const loadAllCoupons = async () => {
    setLoading(true);
    try {
      const data = await fetchCoupons();
      setCoupons(data);
      if (onCouponsUpdated) {
        onCouponsUpdated(data);
      }
    } catch (err) {
      console.error('Failed to load coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllCoupons();
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    // Optimistic update
    const updated = coupons.map(c => c.id === id ? { ...c, is_active: newStatus } : c);
    setCoupons(updated);
    if (onCouponsUpdated) onCouponsUpdated(updated);

    await toggleCouponStatus(id, newStatus);
    loadAllCoupons();
  };

  const handleDelete = async (id: string, code: string) => {
    if (!window.confirm(`আপনি কি নিশ্চিত যে কুপন কোড "${code}" মুছে ফেলতে চান?`)) {
      return;
    }
    const updated = coupons.filter(c => c.id !== id);
    setCoupons(updated);
    if (onCouponsUpdated) onCouponsUpdated(updated);

    await deleteCoupon(id);
    loadAllCoupons();
  };

  const handleOpenEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormCode(coupon.code);
    setFormDiscountPercent(coupon.discount_percent);
    setFormTitle(coupon.title);
    setFormDescription(coupon.description || '');
    setFormApplicableTo(coupon.applicable_to || 'tests');
    setFormMinOrderAmount(coupon.min_order_amount || 0);
    setFormIsActive(coupon.is_active);
    setFormError('');
    setFormSuccess('');
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingCoupon(null);
    setFormCode('');
    setFormDiscountPercent(20);
    setFormTitle('');
    setFormDescription('');
    setFormApplicableTo('tests');
    setFormMinOrderAmount(0);
    setFormIsActive(true);
    setFormError('');
    setFormSuccess('');
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    const cleanCode = formCode.trim().toUpperCase().replace(/\s+/g, '');
    if (!cleanCode) {
      setFormError('দয়া করে একটি কুপন কোড (যেমন: TEST20) লিখুন।');
      return;
    }

    if (!formDiscountPercent || formDiscountPercent <= 0 || formDiscountPercent > 100) {
      setFormError('শতকরা ডিসকাউন্টের হার ১% থেকে ১০০% এর মধ্যে হতে হবে।');
      return;
    }

    if (!formTitle.trim()) {
      setFormError('কুপনের একটি শিরোনাম বা নাম লিখুন।');
      return;
    }

    const couponData: Coupon = {
      id: editingCoupon ? editingCoupon.id : `coupon_${Date.now()}`,
      code: cleanCode,
      discount_percent: Number(formDiscountPercent),
      title: formTitle.trim(),
      description: formDescription.trim(),
      applicable_to: formApplicableTo,
      min_order_amount: Number(formMinOrderAmount) || 0,
      is_active: formIsActive,
      created_at: editingCoupon?.created_at || new Date().toISOString(),
      usage_count: editingCoupon?.usage_count || 0
    };

    try {
      await saveCoupon(couponData);
      setFormSuccess(editingCoupon ? 'কুপন সফলভাবে আপডেট হয়েছে!' : 'নতুন কুপন সফলভাবে যোগ হয়েছে!');
      await loadAllCoupons();
      setTimeout(() => {
        resetForm();
        setShowAddForm(false);
      }, 1200);
    } catch (err) {
      console.error(err);
      setFormError('কুপন সংরক্ষণ করতে সমস্যা হয়েছে, অনুগ্রহ করে পুনরায় চেষ্টা করুন।');
    }
  };

  const runSimulation = () => {
    const res = validateCoupon(simCouponCode, simTestPrice, true, coupons);
    if (res.valid) {
      const discounted = simTestPrice - (res.discountAmount || 0);
      setSimResult(`✅ কুপন ${res.coupon?.code} প্রযোজ্য হয়েছে (${res.discountPercent}% ছাড়)! টেস্টের মূল মূল্য ৳${simTestPrice}, ডিসকাউন্ট -৳${res.discountAmount}, রোগীকে দিতে হবে ৳${discounted} টাকা।`);
    } else {
      setSimResult(res.message);
    }
  };

  const totalCoupons = coupons.length;
  const activeCoupons = coupons.filter(c => c.is_active).length;
  const maxDiscount = coupons.reduce((max, c) => c.is_active ? Math.max(max, c.discount_percent) : max, 0);

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 p-6 rounded-[32px] text-white shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-blue-400/20">
            <Percent size={12} className="text-amber-400" /> ল্যাব টেস্ট কুপন ও শতকরা ডিসকাউন্ট কন্ট্রোল
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            🎫 কুপন কোড ম্যানেজমেন্ট ও পার্সেন্টেজ ডিসকাউন্ট
          </h2>
          <p className="text-xs text-indigo-200 font-medium max-w-2xl leading-relaxed">
            এখান থেকে টেস্ট অর্ডারের জন্য যেকোনো কুপন কোড তৈরি করুন, শতকরা ডিসকাউন্ট হার নির্ধারণ করুন এবং এক ক্লিকে চালু বা বন্ধ করুন। রোগীরা টেস্ট পেআউট ফর্মে এই কোড দিলে স্বয়ংক্রিয়ভাবে শতকরা ডিসকাউন্ট পাবেন।
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadAllCoupons}
            className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl border border-white/15 transition-all flex items-center gap-2 text-xs font-bold"
            title="রিফ্রেশ করুন"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">রিফ্রেশ</span>
          </button>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowAddForm(!showAddForm);
            }}
            className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-emerald-950/40 flex items-center gap-2 transition-all"
          >
            <Plus size={16} /> {showAddForm ? 'ফর্ম বন্ধ করুন' : '+ নতুন কুপন তৈরি করুন'}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
            <Tag size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">মোট কুপন কোড</p>
            <p className="text-lg font-black text-slate-800">{totalCoupons} টি</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">বর্তমানে সক্রিয়</p>
            <p className="text-lg font-black text-emerald-600">{activeCoupons} টি চালু</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center font-black">
            <Percent size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">সর্বোচ্চ ছাড়</p>
            <p className="text-lg font-black text-pink-600">{maxDiscount}% ছাড়</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-black">
            <Sparkles size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">অটোমেটিক প্রয়োগ</p>
            <p className="text-lg font-black text-purple-600">পেআউট ফর্মে</p>
          </div>
        </div>
      </div>

      {/* Add / Edit Form Card */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-[28px] border-2 border-blue-200 shadow-xl space-y-5 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <Tag size={18} />
              </span>
              <div>
                <h3 className="text-base font-black text-slate-800">
                  {editingCoupon ? `✏️ কুপন কোড এডিট: ${editingCoupon.code}` : '✨ নতুন কুপন কোড তৈরি করুন'}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  কুপন কোড ও শতকরা ডিসকাউন্টের মান নির্ধারণ করুন
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowAddForm(false);
              }}
              className="text-slate-400 hover:text-slate-600 text-sm font-bold"
            >
              ✕ বাতিল
            </button>
          </div>

          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-2">
              <XCircle size={16} className="shrink-0" />
              {formError}
            </div>
          )}

          {formSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl flex items-center gap-2">
              <CheckCircle2 size={16} className="shrink-0" />
              {formSuccess}
            </div>
          )}

          <form onSubmit={handleSaveCoupon} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Coupon Code */}
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700 uppercase flex items-center justify-between">
                  <span>কুপন কোড (Coupon Code) <span className="text-rose-500">*</span></span>
                  <span className="text-[10px] text-blue-600 font-bold lowercase">অটোমেটিক বড় হাতের হবে</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: TEST20 বা SPECIAL15"
                  value={formCode}
                  onChange={e => setFormCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-black text-slate-800 outline-none focus:border-blue-500 focus:bg-white tracking-wider"
                />
              </div>

              {/* Discount Percentage */}
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700 uppercase flex items-center justify-between">
                  <span>শতকরা ডিসকাউন্ট হার (%) <span className="text-rose-500">*</span></span>
                  <span className="text-[10px] text-emerald-600 font-bold">{formDiscountPercent}% ছাড়</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    placeholder="যেমন: 20"
                    value={formDiscountPercent}
                    onChange={e => setFormDiscountPercent(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-800 outline-none focus:border-blue-500 focus:bg-white pr-10"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">%</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700 uppercase">
                  অফার / কুপন শিরোনাম <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: ল্যাব টেস্টে ২০% স্পেশাল ছাড়"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              {/* Applicable To */}
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700 uppercase">
                  প্রযোজ্য ক্ষেত্র (Applicable Category)
                </label>
                <select
                  value={formApplicableTo}
                  onChange={e => setFormApplicableTo(e.target.value as any)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
                >
                  <option value="tests">🧪 শুধুমাত্র ল্যাব ও ডায়াগনস্টিক টেস্ট (Recommended)</option>
                  <option value="all">🌟 সকল টেস্ট এবং স্বাস্থ্য সেবা</option>
                  <option value="services">🏥 অন্যান্য সেবা</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-700 uppercase">
                বিস্তারিত বিবরণ (ঐচ্ছিক)
              </label>
              <input
                type="text"
                placeholder="যেমন: যেকোনো রক্ত ও ইউরিন টেস্ট বুকিং এ ২০% অটোমেটিক ছাড় প্রযোজ্য হবে।"
                value={formDescription}
                onChange={e => setFormDescription(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            {/* Minimum Order & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-2">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700 uppercase">
                  সর্বনিম্ন অর্ডার পরিমাণ (৳ BDT)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="০ (যেকোনো পরিমাণ)"
                  value={formMinOrderAmount}
                  onChange={e => setFormMinOrderAmount(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 mt-2 sm:mt-5">
                <input
                  type="checkbox"
                  id="formIsActiveCheck"
                  checked={formIsActive}
                  onChange={e => setFormIsActive(e.target.checked)}
                  className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                />
                <label htmlFor="formIsActiveCheck" className="text-xs font-black text-slate-800 cursor-pointer select-none">
                  {formIsActive ? '🟢 এই কুপনটি বর্তমানে চালু থাকবে (Active)' : '🔴 এই কুপনটি বন্ধ থাকবে (Inactive)'}
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowAddForm(false);
                }}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md active:scale-95 transition-all"
              >
                {editingCoupon ? '✓ কুপন তথ্য আপডেট করুন' : '✓ কুপন সেভ করুন'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Coupons List Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Tag size={16} className="text-blue-600" /> সক্রিয় ও তৈরিকৃত কুপনসমূহ ({coupons.length})
          </h3>
          <span className="text-[11px] text-slate-500 font-bold">
            রোগীরা এই কোড লিখলে নির্দিষ্ট % ছাড় পাবেন
          </span>
        </div>

        {coupons.length === 0 ? (
          <div className="bg-white p-12 rounded-[28px] border border-slate-100 text-center space-y-3 shadow-sm">
            <Tag size={36} className="mx-auto text-slate-300" />
            <p className="text-sm font-black text-slate-600">কোনো কুপন কোড পাওয়া যায়নি</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              উপরের "+ নতুন কুপন তৈরি করুন" বাটনে ক্লিক করে ল্যাব টেস্টের জন্য শতকরা ডিসকাউন্ট কুপন তৈরি করুন।
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coupons.map((coupon) => {
              const isActive = coupon.is_active !== false;
              return (
                <div
                  key={coupon.id}
                  className={`p-5 rounded-[24px] border transition-all space-y-4 shadow-sm relative overflow-hidden flex flex-col justify-between ${
                    isActive
                      ? 'bg-white border-blue-200/80 hover:border-blue-400 hover:shadow-md'
                      : 'bg-slate-50/90 border-slate-200 opacity-80'
                  }`}
                >
                  {/* Top Badge & Discount */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-black tracking-wider px-3 py-1 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center gap-1.5 shadow-xs">
                          {coupon.code}
                          <button
                            type="button"
                            onClick={() => handleCopy(coupon.code)}
                            className="text-blue-500 hover:text-blue-700 p-0.5"
                            title="কোড কপি করুন"
                          >
                            {copiedCode === coupon.code ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                          </button>
                        </span>
                        {copiedCode === coupon.code && (
                          <span className="text-[10px] text-emerald-600 font-bold animate-pulse">কপি হয়েছে!</span>
                        )}
                      </div>

                      <span className="text-sm font-black px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-700 border border-pink-200 flex items-center gap-1">
                        <Percent size={12} /> {coupon.discount_percent}% ছাড়
                      </span>
                    </div>

                    <h4 className="text-sm font-black text-slate-800 leading-snug">
                      {coupon.title}
                    </h4>

                    {coupon.description && (
                      <p className="text-[11px] text-slate-500 font-medium line-clamp-2">
                        {coupon.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {coupon.applicable_to === 'tests' ? '🧪 টেস্ট স্পেশাল' : '🌟 সার্বজনীন'}
                      </span>
                      {coupon.min_order_amount && coupon.min_order_amount > 0 ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                          মিনিমাম ৳{coupon.min_order_amount}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Actions & Status Toggle */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(coupon.id, isActive)}
                      className={`text-[11px] font-black px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all active:scale-95 ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                      }`}
                    >
                      {isActive ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          চালু (Active)
                        </>
                      ) : (
                        <>
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                          বন্ধ (Inactive)
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(coupon)}
                        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        title="এডিট করুন"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(coupon.id, coupon.code)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Live Coupon Simulator Box for Admin */}
      <div className="bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-6 rounded-[28px] border border-indigo-200/70 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
            <Calculator size={18} />
          </span>
          <div>
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">
              🧪 লাইভ কুপন ডিসকাউন্ট ক্যালকুলেটর (টেস্টিং টুল)
            </h4>
            <p className="text-[11px] text-slate-500 font-medium">
              অ্যাডমিন হিসেবে যেকোনো কুপন কোড ও টেস্ট মূল্যের শতকরা ডিসকাউন্ট হিসাব যাচাই করে দেখুন।
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-500">টেস্টের আনুমানিক মূল্য (৳)</label>
            <input
              type="number"
              value={simTestPrice}
              onChange={e => setSimTestPrice(Number(e.target.value))}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-800 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-500">কুপন কোড লিখুন</label>
            <input
              type="text"
              value={simCouponCode}
              onChange={e => setSimCouponCode(e.target.value.toUpperCase())}
              placeholder="যেমন: TEST20"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-black text-slate-800 outline-none uppercase"
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={runSimulation}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-sm active:scale-95 transition-all"
            >
              ডিসকাউন্ট হিসাব করুন
            </button>
          </div>
        </div>

        {simResult && (
          <div className="p-3.5 bg-white border border-indigo-200 rounded-xl text-xs font-bold text-indigo-900 flex items-start gap-2 shadow-xs">
            <Info size={16} className="text-indigo-600 shrink-0 mt-0.5" />
            <span>{simResult}</span>
          </div>
        )}
      </div>
    </div>
  );
};
