import React, { useState, useEffect } from 'react';
import { Gift, Heart, ShieldCheck, CheckCircle2, Clock, Hospital, Phone, MapPin, Search, AlertCircle, FileText, Check, X, Sparkles, Send, Copy, ArrowRight, RefreshCw, Zap, Plus, Trash2, Edit3, Building2 } from 'lucide-react';
import { db } from '../../services/firebase';
import { doc, getDoc, setDoc, collection, getDocs, query, orderBy, limit, addDoc } from 'firebase/firestore';
import { FreeDoctorSettings, FreeDoctorClaim, Profile, SponsorHospital } from '../../types';

const DEFAULT_SPONSORS: SponsorHospital[] = [
  {
    id: 'sp_1',
    name: 'পপুলার ডায়াগনস্টিক সেন্টার (রংপুর)',
    district: 'রংপুর',
    labDiscountPercent: '৫০% টেস্ট ছাড়',
    discountType: '50_percent',
    description: 'সকল প্যাথলজি ও এক্স-রে পরীক্ষায় ৫০% ডিসকাউন্ট ছাড়',
    isActive: true
  },
  {
    id: 'sp_2',
    name: 'ঢাকা প্রাভা হেলথ কেয়ার',
    district: 'ঢাকা',
    labDiscountPercent: '১০০% সম্পূর্ণ ফ্রী',
    discountType: '100_percent_free',
    description: 'ফ্রি ডাক্তার কনসালটেশন এর সাথে ১০০% সম্পূর্ণ ফ্রী টেস্ট সুবিধা',
    isActive: true
  }
];

const DEFAULT_SETTINGS: FreeDoctorSettings = {
  enabled: true,
  todayDoctorName: 'ডা. মো. হাবিবুর রহমান (হাবীব)',
  todayDoctorSpecialty: 'মুখ ও দন্তরোগ বিশেষজ্ঞ ও সার্জন',
  todayDoctorDegree: 'বি.ডি.এস. (রাজশাহী মেডিকেল কলেজ)',
  todayDoctorSchedule: 'সকাল: ১০টা–১টা, বিকাল: ৪টা–রাত ৯টা',
  todayDoctorChamber: 'ডক্টরস ডেন্টাল, উকিলের মোড়, নীলফামারী',
  sponsoringHospital: 'পপুলার ডায়াগনস্টিক সেন্টার (রংপুর) ও ঢাকা প্রাভা হেলথ কেয়ার',
  sponsorHospitals: DEFAULT_SPONSORS,
  district: 'রংপুর ও ঢাকা',
  totalTokens: 30,
  claimedTokens: 8,
  labDiscountType: '50_percent',
  customNotice: 'বর্তমানে এই মাসের স্পন্সরকৃত নতুন ফ্রি টোকেন কোটা শেষ হয়ে গেছে। খুব শীঘ্রই পরবর্তী মাসের নতুন হসপিটাল স্পন্সর চালু হলে দ্রুত টোকেন ক্লেইম করুন।',
  availableSpecialties: ['মুখ ও দন্তরোগ বিশেষজ্ঞ', 'মেডিসিন বিশেষজ্ঞ', 'শিশু রোগ বিশেষজ্ঞ', 'স্ত্রী ও প্রসূতি রোগ', 'হৃদরোগ ও ডায়াবেটিস', 'সাধারণ চিকিৎসা']
};

interface FreeDoctorClaimSectionProps {
  profile: Profile | null;
  isAdmin?: boolean;
  whatsappNumber?: string;
}

export const FreeDoctorClaimSection: React.FC<FreeDoctorClaimSectionProps> = ({
  profile,
  isAdmin = false,
  whatsappNumber = '8801352669100'
}) => {
  const [settings, setSettings] = useState<FreeDoctorSettings>(DEFAULT_SETTINGS);
  const [claims, setClaims] = useState<FreeDoctorClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [submittedClaim, setSubmittedClaim] = useState<FreeDoctorClaim | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Admin states
  const [adminSaving, setAdminSaving] = useState(false);
  const [claimsFilter, setClaimsFilter] = useState<'all' | 'pending' | 'approved' | 'completed' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Admin Sponsor Hospital Modal State
  const [showSponsorModal, setShowSponsorModal] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<SponsorHospital | null>(null);
  const [spName, setSpName] = useState('');
  const [spDiscount, setSpDiscount] = useState('৫০% টেস্ট ছাড়');
  const [spDistrict, setSpDistrict] = useState('');
  const [spDesc, setSpDesc] = useState('');
  const [spActive, setSpActive] = useState(true);

  // Patient Form inputs
  const [formName, setFormName] = useState(profile?.full_name || '');
  const [formPhone, setFormPhone] = useState(profile?.phone || '');
  const [formAddress, setFormAddress] = useState(profile?.address || '');
  const [formIllness, setFormIllness] = useState('');
  const [formSpecialty, setFormSpecialty] = useState('মেডিসিন বিশেষজ্ঞ');
  const [selectedSponsorId, setSelectedSponsorId] = useState<string>('');
  const [formRefCode, setFormRefCode] = useState(profile?.referred_by_code || localStorage.getItem('prefilled_referral_code') || '');

  // Fetch Settings & Claims from Firestore
  useEffect(() => {
    fetchSettingsAndClaims();
  }, []);

  useEffect(() => {
    if (profile?.full_name && !formName) setFormName(profile.full_name);
    if (profile?.phone && !formPhone) setFormPhone(profile.phone);
    if (profile?.address && !formAddress) setFormAddress(profile.address);
    if ((profile?.referred_by_code || localStorage.getItem('prefilled_referral_code')) && !formRefCode) {
      setFormRefCode(profile?.referred_by_code || localStorage.getItem('prefilled_referral_code') || '');
    }
  }, [profile]);

  const activeSponsors = (settings.sponsorHospitals && settings.sponsorHospitals.length > 0)
    ? settings.sponsorHospitals.filter(s => s.isActive)
    : DEFAULT_SPONSORS.filter(s => s.isActive);

  useEffect(() => {
    if (activeSponsors.length > 0 && !selectedSponsorId) {
      setSelectedSponsorId(activeSponsors[0].id);
    }
  }, [settings]);

  const fetchSettingsAndClaims = async () => {
    setLoading(true);
    try {
      // Get settings
      const settingsRef = doc(db, 'settings', 'free_doctor_tokens');
      const settingsSnap = await getDoc(settingsRef);
      if (settingsSnap.exists()) {
        const data = settingsSnap.data() as FreeDoctorSettings;
        if (!data.sponsorHospitals || data.sponsorHospitals.length === 0) {
          data.sponsorHospitals = DEFAULT_SPONSORS;
        }
        setSettings({ ...DEFAULT_SETTINGS, ...data });
      } else {
        // Initialize default settings in firestore if not exists
        await setDoc(settingsRef, DEFAULT_SETTINGS);
        setSettings(DEFAULT_SETTINGS);
      }

      // Get claims
      const claimsRef = collection(db, 'free_claims');
      const claimsSnap = await getDocs(claimsRef);
      const list: FreeDoctorClaim[] = claimsSnap.docs.map(d => ({
        id: d.id,
        ...d.data()
      } as FreeDoctorClaim));
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setClaims(list);
    } catch (err: any) {
      console.warn('Notice: Free doctor claims offline fallback:', err?.message || err);
    } finally {
      setLoading(false);
    }
  };

  const remainingTokens = Math.max(0, settings.totalTokens - settings.claimedTokens);
  const isAvailable = settings.enabled && remainingTokens > 0;

  // Handle Open Add/Edit Sponsor Modal
  const handleOpenSponsorModal = (sponsor?: SponsorHospital) => {
    if (sponsor) {
      setEditingSponsor(sponsor);
      setSpName(sponsor.name);
      setSpDiscount(sponsor.labDiscountPercent || '৫০% টেস্ট ছাড়');
      setSpDistrict(sponsor.district || '');
      setSpDesc(sponsor.description || '');
      setSpActive(sponsor.isActive);
    } else {
      setEditingSponsor(null);
      setSpName('');
      setSpDiscount('৫০% টেস্ট ছাড়');
      setSpDistrict('');
      setSpDesc('');
      setSpActive(true);
    }
    setShowSponsorModal(true);
  };

  // Save Sponsor Hospital
  const handleSaveSponsorHospital = () => {
    if (!spName.trim()) {
      alert('দয়া করে হসপিটালের নাম লিখুন।');
      return;
    }

    const currentList = settings.sponsorHospitals || DEFAULT_SPONSORS;
    let updatedList: SponsorHospital[] = [];

    if (editingSponsor) {
      updatedList = currentList.map(s => s.id === editingSponsor.id ? {
        ...s,
        name: spName.trim(),
        labDiscountPercent: spDiscount.trim() || '৫০% ছাড়',
        district: spDistrict.trim(),
        description: spDesc.trim(),
        isActive: spActive
      } : s);
    } else {
      const newSponsor: SponsorHospital = {
        id: `sp_${Date.now()}`,
        name: spName.trim(),
        labDiscountPercent: spDiscount.trim() || '৫০% ছাড়',
        district: spDistrict.trim(),
        description: spDesc.trim(),
        isActive: spActive
      };
      updatedList = [...currentList, newSponsor];
    }

    // Auto-update combined string for legacy compatibility
    const activeNames = updatedList.filter(s => s.isActive).map(s => `${s.name} (${s.labDiscountPercent})`).join(' ও ');
    const newSettings = {
      ...settings,
      sponsorHospitals: updatedList,
      sponsoringHospital: activeNames || settings.sponsoringHospital
    };

    setSettings(newSettings);
    setShowSponsorModal(false);
  };

  // Delete Sponsor Hospital
  const handleDeleteSponsorHospital = (sponsorId: string) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই স্পন্সর হাসপাতালটি তালিকা থেকে মুছে ফেলতে চান?')) return;
    const currentList = settings.sponsorHospitals || DEFAULT_SPONSORS;
    const updatedList = currentList.filter(s => s.id !== sponsorId);
    
    const activeNames = updatedList.filter(s => s.isActive).map(s => `${s.name} (${s.labDiscountPercent})`).join(' ও ');
    setSettings({
      ...settings,
      sponsorHospitals: updatedList,
      sponsoringHospital: activeNames || settings.sponsoringHospital
    });
  };

  // Toggle Active Sponsor Status
  const handleToggleSponsorActive = (sponsorId: string) => {
    const currentList = settings.sponsorHospitals || DEFAULT_SPONSORS;
    const updatedList = currentList.map(s => s.id === sponsorId ? { ...s, isActive: !s.isActive } : s);
    
    const activeNames = updatedList.filter(s => s.isActive).map(s => `${s.name} (${s.labDiscountPercent})`).join(' ও ');
    setSettings({
      ...settings,
      sponsorHospitals: updatedList,
      sponsoringHospital: activeNames || settings.sponsoringHospital
    });
  };

  // Handle Patient Claim Submission
  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim() || !formIllness.trim()) {
      alert('দয়া করে আপনার নাম, মোবাইল নম্বর এবং সমস্যার বিবরণ লিখুন।');
      return;
    }

    const chosenSponsor = activeSponsors.find(s => s.id === selectedSponsorId) || activeSponsors[0];
    const chosenHospitalName = chosenSponsor ? chosenSponsor.name : (settings.sponsoringHospital || 'পপুলার ডায়াগনস্টিক সেন্টার');
    const chosenDiscountNote = chosenSponsor ? chosenSponsor.labDiscountPercent : (settings.labDiscountType === '100_percent_free' ? '১০০% সম্পূর্ণ ফ্রী' : '৫০% ডিসকাউন্ট');

    setSubmitting(true);
    try {
      // Generate unique token
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const tokenCode = `FREE-DOC-${randomNum}`;

      const newClaim: FreeDoctorClaim = {
        id: `claim_${Date.now()}`,
        patientName: formName.trim(),
        patientPhone: formPhone.trim(),
        patientAddress: formAddress.trim() || 'নির্ধারিত নয়',
        illnessDetails: formIllness.trim(),
        selectedSpecialty: formSpecialty,
        tokenCode,
        labDiscountGranted: chosenDiscountNote,
        sponsoringHospital: chosenHospitalName,
        hospitalDiscountNote: chosenDiscountNote,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      if (formRefCode.trim()) {
        newClaim.referredByCode = formRefCode.trim().toUpperCase();
      }

      // Save claim to Firestore
      await setDoc(doc(db, 'free_claims', newClaim.id), newClaim);

      // Update claimed tokens count in settings
      const newClaimedCount = settings.claimedTokens + 1;
      const updatedSettings = { ...settings, claimedTokens: newClaimedCount };
      await setDoc(doc(db, 'settings', 'free_doctor_tokens'), updatedSettings, { merge: true });
      setSettings(updatedSettings);

      setClaims(prev => [newClaim, ...prev]);
      setSubmittedClaim(newClaim);
      setShowClaimModal(false);
    } catch (err) {
      console.error('Error submitting free claim:', err);
      alert('ক্লেইম করার সময় সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setSubmitting(false);
    }
  };

  // Admin: Save Settings Changes
  const handleSaveAdminSettings = async () => {
    setAdminSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'free_doctor_tokens'), settings, { merge: true });
      alert('✓ ফ্রি ডাক্তার, স্পন্সর হাসপাতাল ও টেস্ট ছাড় সেটিংস সফলভাবে আপডেট করা হয়েছে!');
    } catch (err) {
      console.error('Error saving free settings:', err);
      alert('সেটিংস সেভ করতে ব্যর্থ হয়েছে।');
    } finally {
      setAdminSaving(false);
    }
  };

  // Admin: Update Claim Status
  const handleUpdateClaimStatus = async (claimId: string, status: 'pending' | 'approved' | 'completed' | 'cancelled') => {
    try {
      await setDoc(doc(db, 'free_claims', claimId), { status }, { merge: true });
      setClaims(prev => prev.map(c => c.id === claimId ? { ...c, status } : c));
    } catch (err) {
      console.error('Error updating claim status:', err);
      alert('স্ট্যাটাস আপডেট করা সম্ভব হয়নি।');
    }
  };

  // Generate WhatsApp text for claim
  const getWhatsAppClaimText = (claim: FreeDoctorClaim) => {
    let msg = `হ্যালো নিলফা হেলথকেয়ার Admin,\nআমি ফ্রী ডাক্তার কনসালটেশন ক্লেইম করেছি!\n\n🎟️ টোকেন কোড: ${claim.tokenCode}\n👤 রোগীর নাম: ${claim.patientName}\n📱 মোবাইল: ${claim.patientPhone}\n📍 ঠিকানা: ${claim.patientAddress}\n🩺 কি সমস্যা: ${claim.illnessDetails}\n👨‍⚕️ পছন্দের ডাক্তার বিভাগ: ${claim.selectedSpecialty || 'সাধারণ'}\n🏥 স্পন্সর হাসপাতাল: ${claim.sponsoringHospital}\n🧪 টেস্ট সুবিধা: ${claim.labDiscountGranted || 'বিশেষ ডিসকাউন্ট'}`;
    if (claim.referredByCode) {
      msg += `\n🔑 রেফার কোড: ${claim.referredByCode}`;
    }
    msg += `\n\nদয়া করে আমার এই ফ্রি টোকেনটি কনফার্ম করে ডাক্তার দেখানোর স্থান ও সময় জানান।`;
    return msg;
  };

  // Filtered claims for admin
  const filteredClaims = claims.filter(c => {
    const matchesFilter = claimsFilter === 'all' || c.status === claimsFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || 
      c.patientName.toLowerCase().includes(q) || 
      c.patientPhone.toLowerCase().includes(q) || 
      c.tokenCode.toLowerCase().includes(q) ||
      (c.referredByCode && c.referredByCode.toLowerCase().includes(q));
    return matchesFilter && matchesSearch;
  });

  // Patient's own claims
  const userClaims = claims.filter(c => 
    (profile?.phone && c.patientPhone === profile.phone) || 
    (profile?.full_name && c.patientName.toLowerCase() === profile.full_name.toLowerCase())
  );

  const sponsorListToDisplay = (settings.sponsorHospitals && settings.sponsorHospitals.length > 0)
    ? settings.sponsorHospitals
    : DEFAULT_SPONSORS;

  if (isAdmin) {
    return (
      <div className="space-y-6 text-left animate-in fade-in duration-200">
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-blue-500/20">
          <div>
            <div className="flex items-center gap-2">
              <Gift className="text-amber-400 animate-bounce" size={24} />
              <h2 className="text-xl font-black uppercase tracking-tight">
                ফ্রি ডাক্তার টোকেন ও একাধিক হসপিটাল স্পন্সর এডমিন প্যানেল
              </h2>
            </div>
            <p className="text-xs text-blue-200 font-medium mt-1">
              গরিব রোগীদের ফ্রি ডাক্তার দেখানো, একাধিক হসপিটাল স্পন্সর যোগ করা ও হাসপাতাল অনুযায়ী টেস্টের % ডিসকাউন্ট নির্ধারণ।
            </p>
          </div>
          <button
            onClick={fetchSettingsAndClaims}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-black flex items-center gap-2 border border-white/20 transition-all self-start md:self-auto"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            রিলোড লিস্ট
          </button>
        </div>

        {/* Multi-Hospital Sponsors Section */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
                <Building2 size={18} className="text-blue-600" />
                🏥 স্পন্সর হাসপাতাল ও টেস্ট ডিসকাউন্ট তালিকা ({sponsorListToDisplay.length} টি)
              </h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                একাধিক হাসপাতাল যোগ করুন এবং প্রতিটি হাসপাতাল কত পার্সেন্ট (%) টেস্ট ছাড় দিচ্ছে তা নির্ধারণ করুন।
              </p>
            </div>
            <button
              onClick={() => handleOpenSponsorModal()}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all self-start sm:self-auto"
            >
              <Plus size={16} />
              নতুন স্পন্সর হাসপাতাল যোগ করুন
            </button>
          </div>

          {/* Hospital Sponsor Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {sponsorListToDisplay.map(s => (
              <div key={s.id} className={`p-4 rounded-2xl border transition-all space-y-2.5 ${s.isActive ? 'bg-gradient-to-br from-slate-50 to-blue-50/40 border-slate-200 shadow-sm' : 'bg-slate-100/70 border-slate-200 opacity-60'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-extrabold text-slate-900 text-xs block">
                      🏥 {s.name}
                    </span>
                    {s.district && (
                      <span className="text-[10px] text-slate-500 font-bold block mt-0.5">
                        📍 এলাকা: {s.district}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full whitespace-nowrap ${s.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                    {s.isActive ? '🟢 সক্রিয়' : '🔴 বন্ধ'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-blue-600 text-white text-[11px] font-black px-3 py-1 rounded-xl shadow-sm">
                    🧪 টেস্ট ছাড়: {s.labDiscountPercent}
                  </span>
                </div>

                {s.description && (
                  <p className="text-[11px] text-slate-600 font-medium">
                    {s.description}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/80">
                  <button
                    onClick={() => handleToggleSponsorActive(s.id)}
                    className="text-[11px] font-black text-slate-700 hover:text-blue-600 underline"
                  >
                    {s.isActive ? 'নিষ্ক্রিয় করুন' : 'সক্রিয় করুন'}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenSponsorModal(s)}
                      className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-blue-700 hover:bg-blue-50 flex items-center gap-1"
                    >
                      <Edit3 size={12} />
                      এডিট
                    </button>
                    <button
                      onClick={() => handleDeleteSponsorHospital(s.id)}
                      className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Settings Control Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b pb-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <Zap size={18} className="text-amber-500" />
              আজকের ফ্রি ডাক্তার ও ফ্রি টিকিট কনফিগারেশন
            </h3>
            <label className="flex items-center gap-3 cursor-pointer">
              <span className={`text-xs font-black uppercase ${settings.enabled ? 'text-emerald-600' : 'text-slate-400'}`}>
                {settings.enabled ? '🟢 সার্ভিস চালূ আছে (ON)' : '🔴 সার্ভিস বন্ধ (OFF)'}
              </span>
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={e => setSettings({ ...settings, enabled: e.target.checked })}
                className="w-5 h-5 accent-emerald-600 cursor-pointer rounded"
              />
            </label>
          </div>

          {/* Today's Doctor Admin Inputs */}
          <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/50 p-4 rounded-2xl border border-blue-200/80 space-y-3">
            <div className="flex items-center gap-2 text-xs font-black text-blue-900 uppercase">
              <span>👨‍⚕️</span> আজকের নির্ধারিত ফ্রি ডাক্তারের বিবরণ (Today's Free Doctor)
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-black text-slate-700 mb-1">
                  🩺 আজকের ফ্রি ডাক্তারের নাম:
                </label>
                <input
                  type="text"
                  value={settings.todayDoctorName || ''}
                  onChange={e => setSettings({ ...settings, todayDoctorName: e.target.value })}
                  placeholder="যেমন: ডা. মো. হাবিবুর রহমান (হাবীব)"
                  className="w-full px-3.5 py-2 bg-white border border-blue-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-700 mb-1">
                  🎓 বিশেষজ্ঞ ও ডিগ্রি:
                </label>
                <input
                  type="text"
                  value={settings.todayDoctorSpecialty || ''}
                  onChange={e => setSettings({ ...settings, todayDoctorSpecialty: e.target.value })}
                  placeholder="যেমন: মুখ ও দন্তরোগ বিশেষজ্ঞ ও সার্জন, বি.ডি.এস."
                  className="w-full px-3.5 py-2 bg-white border border-blue-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-black text-slate-700 mb-1">
                  🏥 চেম্বার / রোগী দেখার স্থান:
                </label>
                <input
                  type="text"
                  value={settings.todayDoctorChamber || ''}
                  onChange={e => setSettings({ ...settings, todayDoctorChamber: e.target.value })}
                  placeholder="যেমন: ডক্টরস ডেন্টাল, উকিলের মোড়, নীলফামারী"
                  className="w-full px-3.5 py-2 bg-white border border-blue-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-700 mb-1">
                  ⏰ রোগী দেখার সময়সূচী:
                </label>
                <input
                  type="text"
                  value={settings.todayDoctorSchedule || ''}
                  onChange={e => setSettings({ ...settings, todayDoctorSchedule: e.target.value })}
                  placeholder="যেমন: সকাল: ১০টা–১টা, বিকাল: ৪টা–রাত ৯টা"
                  className="w-full px-3.5 py-2 bg-white border border-blue-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                🎟️ মোট বরাদ্দকৃত ফ্রি টিকিট / অ্যাপয়েন্টমেন্ট সংখ্যা (এই মাসে)
              </label>
              <input
                type="number"
                value={settings.totalTokens}
                onChange={e => setSettings({ ...settings, totalTokens: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <span className="text-[10px] text-slate-400 font-bold mt-1 block">এডমিন যে সংখ্যা লিখবেন ততটি ফ্রি টিকিট দেখাবে</span>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                ✅ ইতোমধ্যে ক্লেইমকৃত / বুকড টিকিট সংখ্যা
              </label>
              <input
                type="number"
                value={settings.claimedTokens}
                onChange={e => setSettings({ ...settings, claimedTokens: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <span className="text-[10px] text-slate-400 font-bold mt-1 block">অবশিষ্ট খালি টিকিট = মোট টিকিট - বুকড টিকিট</span>
            </div>
          </div>

          {/* Custom No Sponsor Notice Input */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              ⚠️ কোনো স্পন্সর না থাকলে বা টোকেন শেষ হলে দেখানোর নোটিশ টেক্সট:
            </label>
            <textarea
              rows={2}
              value={settings.customNotice || ''}
              onChange={e => setSettings({ ...settings, customNotice: e.target.value })}
              placeholder="যেমন: এই মুহূর্তে নতুন কোনো স্পন্সরশিপ বা ফ্রি টোকেন খালি নেই..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveAdminSettings}
              disabled={adminSaving}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all"
            >
              <CheckCircle2 size={16} />
              {adminSaving ? 'সেভ হচ্ছে...' : 'সেটিংস সেভ করুন (Save Changes)'}
            </button>
          </div>
        </div>

        {/* Claims Table Section */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b pb-4">
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
                📋 রোগীদের ফ্রি ক্লেইম আবেদন তালিকা ({filteredClaims.length} টি)
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                ফ্রি ডাক্তার দেখানো ও পরীক্ষা নিরীক্ষা ডিসকাউন্ট ক্লেইমের সমস্ত লিস্ট
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="text"
                placeholder="🔍 নাম, ফোন বা টোকেন দিয়ে খুঁজুন..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none w-56"
              />
              <select
                value={claimsFilter}
                onChange={e => setClaimsFilter(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-700 outline-none"
              >
                <option value="all">সব ক্লেইম</option>
                <option value="pending">⏳ পেন্ডিং (Pending)</option>
                <option value="approved">✅ অনুমোদিত (Approved)</option>
                <option value="completed">🎉 সম্পন্ন (Completed)</option>
                <option value="cancelled">❌ বাতিল (Cancelled)</option>
              </select>
            </div>
          </div>

          {filteredClaims.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FileText size={36} className="mx-auto mb-2 opacity-50" />
              <p className="text-xs font-black uppercase tracking-wider">কোনো ক্লেইম রেকর্ড পাওয়া যায়নি</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase font-black tracking-wider text-[10px] border-b">
                    <th className="p-3">টোকেন কোড</th>
                    <th className="p-3">রোগীর নাম ও ফোন</th>
                    <th className="p-3">ঠিকানা</th>
                    <th className="p-3">রোগের বিবরণ / ক্যাটাগরি</th>
                    <th className="p-3">স্পন্সর হাসপাতাল & ছাড় %</th>
                    <th className="p-3">তারিখ</th>
                    <th className="p-3">স্ট্যাটাস</th>
                    <th className="p-3 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredClaims.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3">
                        <span className="font-mono font-black text-blue-700 bg-blue-50 px-2 py-1 rounded-lg border border-blue-200 block text-center">
                          {c.tokenCode}
                        </span>
                        {c.referredByCode && (
                          <span className="text-[9px] font-black text-emerald-600 block mt-1">
                            🔑 রেফার: {c.referredByCode}
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="font-extrabold text-slate-900">{c.patientName}</div>
                        <div className="text-[10px] text-slate-500 font-bold">{c.patientPhone}</div>
                      </td>
                      <td className="p-3 max-w-[150px] truncate text-slate-600 font-bold">
                        {c.patientAddress}
                      </td>
                      <td className="p-3 max-w-[180px]">
                        <div className="text-[11px] font-bold text-slate-800 truncate" title={c.illnessDetails}>
                          {c.illnessDetails}
                        </div>
                        <div className="text-[9px] text-blue-600 font-black">
                          {c.selectedSpecialty || 'সাধারণ'}
                        </div>
                      </td>
                      <td className="p-3 max-w-[170px]">
                        <div className="text-[10px] font-extrabold text-slate-800 truncate">
                          🏥 {c.sponsoringHospital}
                        </div>
                        <span className="inline-block text-[9px] font-black px-2 py-0.5 rounded-full mt-0.5 bg-blue-100 text-blue-900 border border-blue-200">
                          🧪 ছাড়: {c.labDiscountGranted || '৫০% ছাড়'}
                        </span>
                      </td>
                      <td className="p-3 text-[10px] text-slate-500 whitespace-nowrap">
                        {new Date(c.createdAt).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="p-3">
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${
                          c.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                          c.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          c.status === 'cancelled' ? 'bg-rose-100 text-rose-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {c.status === 'approved' ? 'অনুমোদিত' : c.status === 'completed' ? 'সম্পন্ন' : c.status === 'cancelled' ? 'বাতিল' : 'পেন্ডিং'}
                        </span>
                      </td>
                      <td className="p-3 text-right whitespace-nowrap space-x-1">
                        <select
                          value={c.status}
                          onChange={e => handleUpdateClaimStatus(c.id, e.target.value as any)}
                          className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-700 outline-none"
                        >
                          <option value="pending">পেন্ডিং</option>
                          <option value="approved">অনুমোদন করুন</option>
                          <option value="completed">সম্পন্ন করুন</option>
                          <option value="cancelled">বাতিল করুন</option>
                        </select>
                        <a
                          href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(getWhatsAppClaimText(c))}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black inline-flex items-center gap-1 transition-all"
                        >
                          <Send size={10} />
                          WhatsApp
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Admin Modal: Add/Edit Sponsor Hospital */}
        {showSponsorModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 border border-slate-200 text-left animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="text-blue-600" size={20} />
                  <h3 className="text-sm font-black text-slate-900 uppercase">
                    {editingSponsor ? 'স্পন্সর হাসপাতাল এডিট করুন' : 'নতুন স্পন্সর হাসপাতাল যোগ করুন'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowSponsorModal(false)}
                  className="p-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">
                    🏥 হসপিটাল / ডায়াগনস্টিক সেন্টারের নাম *
                  </label>
                  <input
                    type="text"
                    value={spName}
                    onChange={e => setSpName(e.target.value)}
                    placeholder="যেমন: পপুলার ডায়াগনস্টিক সেন্টার (রংপুর)"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">
                    🧪 টেস্ট ডিসকাউন্ট হার (ছাড় %) *
                  </label>
                  <input
                    type="text"
                    value={spDiscount}
                    onChange={e => setSpDiscount(e.target.value)}
                    placeholder="যেমন: ৫০% টেস্ট ছাড় বা ১০০% সম্পূর্ণ ফ্রী"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <p className="text-[10px] text-slate-400 font-medium mt-1">
                    উদাহরণ: "৫০% টেস্ট ছাড়", "১০০% সম্পূর্ণ ফ্রী", "৪০% প্যাথলজি ছাড়" ইত্যাদি।
                  </p>
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">
                    📍 জেলা / ব্রাঞ্চ এলাকা (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    value={spDistrict}
                    onChange={e => setSpDistrict(e.target.value)}
                    placeholder="যেমন: রংপুর, ঢাকা, নীলফামারী"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">
                    📝 অতিরিক্ত বিবরণ / সুবিধা (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    value={spDesc}
                    onChange={e => setSpDesc(e.target.value)}
                    placeholder="যেমন: সকল রক্ত পরীক্ষা ও আল্ট্রাসোনোগ্রামে বিশেষ ছাড়"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={spActive}
                      onChange={e => setSpActive(e.target.checked)}
                      className="w-4 h-4 accent-emerald-600 rounded"
                    />
                    <span className="font-extrabold text-slate-800">
                      এই স্পন্সর হাসপাতালটি এখন সক্রিয় রাখুন (Active)
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  onClick={() => setShowSponsorModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  বাতিল
                </button>
                <button
                  onClick={handleSaveSponsorHospital}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md shadow-blue-600/20"
                >
                  {editingSponsor ? 'আপডেট করুন' : 'যোগ করুন'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Patient / User Facing View
  return (
    <div className="space-y-4">
      {/* Main Banner Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-blue-500/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-400/30">
              <Gift size={12} className="animate-spin" />
              ফ্রি ডাক্তার ক্লেইম অফার
            </span>

            {isAvailable ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                🟢 স্পন্সরকৃত ফ্রি টোকেন চালু আছে
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-black uppercase tracking-wider border border-rose-500/30">
                🔴 বর্তমানে স্পন্সর স্টক পূর্ণ / বন্ধ
              </span>
            )}
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              🎁 ফ্রী ডাক্তার সিরিয়াল & ল্যাব টেস্টে বিশেষ ছাড়!
            </h3>
            <p className="text-xs text-blue-100/90 font-medium leading-relaxed mt-1.5 max-w-2xl">
              দরিদ্র ও সুবিধাবঞ্চিত রোগীদের জন্য প্রতি মাসে স্পন্সরকৃত ফ্রি ডাক্তার কনসালটেশন টোকেন সুবিধা। আপনার পছন্দনীয় হাসপাতালে ফ্রি ডাক্তার ও টেস্ট ছাড়ের জন্য এখনই ক্লেইম করুন।
            </p>
          </div>

          {/* Today's Free Doctor Spotlight Card */}
          {settings.todayDoctorName && (
            <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-blue-500/20 backdrop-blur-md p-4 rounded-2xl border border-amber-400/40 space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 bg-amber-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                  <span>🩺</span> আজকের নির্ধারিত ফ্রি ডাক্তার
                </span>
                <span className="text-[10px] bg-white/20 backdrop-blur-md text-amber-200 font-black px-2.5 py-0.5 rounded-full border border-white/20">
                  🎟️ ফ্রি টিকিট খালি আছে: {remainingTokens} টি
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div>
                  <h4 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                    {settings.todayDoctorName}
                  </h4>
                  {settings.todayDoctorSpecialty && (
                    <p className="text-xs font-bold text-amber-300 mt-0.5">
                      {settings.todayDoctorSpecialty} {settings.todayDoctorDegree ? `• ${settings.todayDoctorDegree}` : ''}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-blue-100 font-medium mt-1">
                    {settings.todayDoctorChamber && (
                      <span className="flex items-center gap-1">
                        <span>🏥</span> {settings.todayDoctorChamber}
                      </span>
                    )}
                    {settings.todayDoctorSchedule && (
                      <span className="flex items-center gap-1 text-emerald-300 font-bold">
                        <span>⏰</span> {settings.todayDoctorSchedule}
                      </span>
                    )}
                  </div>
                </div>

                {isAvailable && (
                  <button
                    onClick={() => {
                      if (settings.todayDoctorSpecialty) setFormSpecialty(settings.todayDoctorSpecialty.split(',')[0].trim());
                      setShowClaimModal(true);
                    }}
                    className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all active:scale-95 shrink-0 flex items-center gap-1.5"
                  >
                    <span>ফ্রি টিকিট নিন</span>
                    <ArrowRight size={12} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Sponsor & Token Stats Box */}
          {isAvailable ? (
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-amber-300 font-black">
                  <Hospital size={16} />
                  <span>স্পন্সর হাসপাতালসমূহ ({activeSponsors.length} টি):</span>
                </div>
                <div className="bg-amber-400 text-slate-950 px-3 py-1 rounded-full text-[11px] font-black self-start sm:self-auto">
                  🎟️ অবশিষ্ট ফ্রি টোকেন: {remainingTokens} টি
                </div>
              </div>

              {/* Active Sponsor Badges Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeSponsors.map(sp => (
                  <div key={sp.id} className="bg-white/10 p-2.5 rounded-xl border border-white/15 flex items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-white text-[11px] truncate">
                      🏥 {sp.name}
                    </span>
                    <span className="bg-emerald-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-md whitespace-nowrap">
                      🧪 {sp.labDiscountPercent}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowClaimModal(true)}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 hover:scale-105 transition-all flex items-center justify-center gap-2"
              >
                <Gift size={16} />
                ফ্রি টোকেন Claim করুন (ফ্রি ডাক্তার + টেস্ট ছাড়)
              </button>
            </div>
          ) : (
            <div className="bg-rose-500/10 backdrop-blur-md p-4 rounded-2xl border border-rose-500/30 text-xs space-y-2">
              <div className="flex items-center gap-2 font-black text-rose-300">
                <AlertCircle size={16} />
                <span>স্পন্সরশিপ নোটিশ:</span>
              </div>
              <p className="text-rose-100 font-medium leading-relaxed">
                {settings.customNotice || 'এই মুহূর্তে নতুন কোনো স্পন্সরশিপ বা ফ্রি টোকেন খালি নেই। অনুগ্রহ করে পরবর্তী স্পন্সর চালুর পর ট্রাই করুন।'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* User's Claim History if any */}
      {userClaims.length > 0 && (
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3 text-left">
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            🎟️ আপনার ক্লেইমকৃত ফ্রি টোকেন ({userClaims.length} টি)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {userClaims.map(c => (
              <div key={c.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-lg text-xs">
                    {c.tokenCode}
                  </span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                    c.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                    c.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {c.status === 'approved' ? 'অনুমোদিত' : c.status === 'completed' ? 'সম্পন্ন' : 'পেন্ডিং'}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-800">
                  রোগী: {c.patientName} ({c.patientPhone})
                </div>
                <div className="text-[10px] text-slate-600 font-bold">
                  🏥 স্পন্সর: {c.sponsoringHospital}
                </div>
                <div className="text-[10px] font-black text-emerald-700 bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                  🧪 টেস্ট সুবিধা: {c.labDiscountGranted || 'বিশেষ ছাড়'}
                </div>
                <a
                  href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(getWhatsAppClaimText(c))}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black flex items-center justify-center gap-1 transition-all"
                >
                  <Send size={12} />
                  WhatsApp এ আপডেট পান
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Claim Modal Form */}
      {showClaimModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-5 border border-slate-200 max-h-[90vh] overflow-y-auto text-left animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Gift className="text-amber-500" size={20} />
                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                  ফ্রি ডাক্তার ও টেস্ট ক্লেইম ফরম
                </h3>
              </div>
              <button
                onClick={() => setShowClaimModal(false)}
                className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleClaimSubmit} className="space-y-4">
              {/* Select Sponsor Hospital */}
              <div className="space-y-2">
                <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  🏥 পছন্দনীয় স্পন্সর হাসপাতাল নির্বাচন করুন *
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {activeSponsors.map(sp => (
                    <label
                      key={sp.id}
                      onClick={() => setSelectedSponsorId(sp.id)}
                      className={`p-3 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                        (selectedSponsorId === sp.id || (activeSponsors.length === 1))
                          ? 'border-blue-600 bg-blue-50/70 shadow-sm'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="sponsorHospitalRadio"
                          checked={selectedSponsorId === sp.id || (activeSponsors.length === 1)}
                          onChange={() => setSelectedSponsorId(sp.id)}
                          className="accent-blue-600 w-4 h-4"
                        />
                        <div>
                          <span className="text-xs font-extrabold text-slate-900 block">
                            {sp.name}
                          </span>
                          {sp.district && (
                            <span className="text-[10px] text-slate-500 font-medium block">
                              📍 এলাকা: {sp.district}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200 whitespace-nowrap">
                        🧪 {sp.labDiscountPercent}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  রোগীর নাম *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="যেমন: মোঃ করিম ইসলাম"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  মোবাইল নম্বর *
                </label>
                <input
                  type="tel"
                  required
                  value={formPhone}
                  onChange={e => setFormPhone(e.target.value)}
                  placeholder="যেমন: 01700000000"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  ঠিকানা / এলাকা *
                </label>
                <input
                  type="text"
                  required
                  value={formAddress}
                  onChange={e => setFormAddress(e.target.value)}
                  placeholder="যেমন: ডিমলা, নীলফামারী"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  পছন্দের ডাক্তার বিভাগ
                </label>
                <select
                  value={formSpecialty}
                  onChange={e => setFormSpecialty(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none"
                >
                  {(settings.availableSpecialties || DEFAULT_SETTINGS.availableSpecialties!).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  রোগের বিবরণ / কি সমস্যা *
                </label>
                <textarea
                  rows={2}
                  required
                  value={formIllness}
                  onChange={e => setFormIllness(e.target.value)}
                  placeholder="যেমন: ৩ দিন ধরে প্রচণ্ড জ্বর, মাথা ব্যথা ও পাতলা পায়খানা..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  রেফার কোড (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={formRefCode}
                  onChange={e => setFormRefCode(e.target.value)}
                  placeholder="যেমন: RD001 বা REF123"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 uppercase outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-xl shadow-blue-500/20 hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
              >
                <Gift size={16} />
                {submitting ? 'ক্লেইম সাবমিট হচ্ছে...' : 'ফ্রি টোকেন সাবমিট করুন (Submit Claim)'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal showing Ticket */}
      {submittedClaim && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 text-center animate-in fade-in zoom-in-95 border border-slate-200">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900 uppercase">
                অভিনন্দন! ফ্রি টোকেন সফলভাবে ক্লেইম করা হয়েছে
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                আপনার ফ্রি ডাক্তার টোকেন কোড নিচে দেওয়া হলো:
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-2xl border-2 border-dashed border-blue-300 space-y-2">
              <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">
                আপনার ফ্রি টোকেন আইডি
              </span>
              <div className="text-xl font-black font-mono text-blue-900 tracking-wider">
                {submittedClaim.tokenCode}
              </div>
              <div className="text-xs font-bold text-slate-800">
                রোগী: {submittedClaim.patientName} ({submittedClaim.patientPhone})
              </div>
              <div className="text-[11px] font-extrabold text-blue-900">
                🏥 স্পন্সর: {submittedClaim.sponsoringHospital}
              </div>
              <div className="text-[11px] font-black text-emerald-700 bg-emerald-100/80 px-3 py-1 rounded-full inline-block">
                🧪 টেস্ট সুবিধা: {submittedClaim.labDiscountGranted}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <a
                href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(getWhatsAppClaimText(submittedClaim))}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
              >
                <Send size={16} />
                WhatsApp এ কনফার্ম করুন
              </a>

              <button
                onClick={() => setSubmittedClaim(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-extrabold uppercase transition-all"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

