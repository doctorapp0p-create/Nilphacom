import React, { useState } from 'react';
import { 
  Heart, 
  User, 
  Phone, 
  MapPin, 
  FileText, 
  Send, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  HelpCircle, 
  Stethoscope, 
  Scissors, 
  Pill, 
  Microscope, 
  Ambulance, 
  Baby, 
  Upload, 
  Sparkles,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../../services/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { MedicalAssistanceApplication, Profile } from '../../types';

interface MedicalAidApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile | null;
  onSuccess?: (newApp: MedicalAssistanceApplication) => void;
}

export const AID_CATEGORIES = [
  {
    id: 'maternity_csection',
    title: 'গর্ভবতী মায়ের সিজারিয়ান ডেলিভারি অনুদান (৳২,০০০)',
    shortName: 'সিজার ডেলিভারি অনুদান',
    icon: '🤰',
    defaultAmount: 2000,
    desc: 'অসচ্ছল পরিবারের প্রসূতি মায়েদের জন্য এককালীন নগদ ২০০০ টাকা সিজার অনুদান।'
  },
  {
    id: 'free_doctor_consultation',
    title: 'ফ্রি বিশেষজ্ঞ ডাক্তার কনসালটেশন ও ফি মওকুফ',
    shortName: 'ফ্রি ডাক্তার সেবা',
    icon: '👨‍⚕️',
    defaultAmount: 500,
    desc: 'এমবিবিএস ও বিশেষজ্ঞ চিকিৎসকের চেম্বারে সম্পূর্ণ ফ্রি ভিজিট ও পরামর্শ।'
  },
  {
    id: 'major_surgery_aid',
    title: 'বড় অপারেশন ও জটিল সার্জারি ব্যয় সহায়তা',
    shortName: 'অপারেশন ও সার্জারি',
    icon: '🏥',
    defaultAmount: 5000,
    desc: 'হার্নিয়া, এপেন্ডিসাইটিস, টিউমার, চক্ষু ছানি, অর্থোপেডিক বা ট্রমা অপারেশনের হাসপাতাল ও ওটি বিল।'
  },
  {
    id: 'essential_medicine_aid',
    title: 'জীবনরক্ষাকারী জরুরি প্রেসক্রিপশন ঔষধ ফান্ড',
    shortName: 'জরুরি প্রেসক্রিপশন ঔষধ',
    icon: '💊',
    defaultAmount: 1000,
    desc: 'ডায়াবেটিস, শ্বাসকষ্ট, হৃদরোগ ও নিয়মিত জীবনরক্ষাকারী প্রয়োজনীয় ঔষধের অর্থ।'
  },
  {
    id: 'lab_test_subsidy',
    title: 'ল্যাব ও ডায়াগনস্টিক টেস্ট ব্যয় ছাড় ও অনুদান',
    shortName: 'ডায়াগনস্টিক ল্যাব টেস্ট',
    icon: '🧪',
    defaultAmount: 1500,
    desc: 'রক্ত পরীক্ষা, এক্স-রে, ইউএসজি ও প্যাথলজি টেস্টের ফি মওকুফ সহায়তা।'
  },
  {
    id: 'oxygen_ambulance_emergency',
    title: 'জরুরি অক্সিজেন ও ফ্রি অ্যাম্বুলেন্স সাপোর্ট',
    shortName: 'অক্সিজেন ও অ্যাম্বুলেন্স',
    icon: '🚑',
    defaultAmount: 3000,
    desc: 'শ্বাসকষ্টের সিলিন্ডার ও দূরবর্তী হাসপাতালে স্থানান্তরের অ্যাম্বুলেন্স ভাড়া।'
  },
  {
    id: 'other',
    title: 'অন্যান্য জরুরি স্বাস্থ্য ও মানবিক চিকিৎসা সহায়তা',
    shortName: 'অন্যান্য স্বাস্থ্য সাহায্য',
    icon: '🤲',
    defaultAmount: 2000,
    desc: 'বিশেষ দুর্ঘটনা বা অন্যান্য জরুরি স্বাস্থ্য সংকট।'
  }
];

export const MedicalAidApplicationModal: React.FC<MedicalAidApplicationModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSuccess
}) => {
  const [patientName, setPatientName] = useState(profile?.full_name || '');
  const [guardianName, setGuardianName] = useState('');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [district, setDistrict] = useState(profile?.district || 'নীলফামারী');
  const [upazilaOrArea, setUpazilaOrArea] = useState('');
  const [villageOrUnion, setVillageOrUnion] = useState('');
  const [fullAddress, setFullAddress] = useState(profile?.address || '');
  
  const [category, setCategory] = useState<MedicalAssistanceApplication['category']>('maternity_csection');
  const [illnessDetails, setIllnessDetails] = useState('');
  const [requestedAmount, setRequestedAmount] = useState<number>(2000);
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad' | 'rocket'>('bkash');
  const [payoutNumber, setPayoutNumber] = useState(profile?.phone || '');
  const [patientNid, setPatientNid] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [submittedApp, setSubmittedApp] = useState<MedicalAssistanceApplication | null>(null);

  if (!isOpen) return null;

  const handleCategorySelect = (catId: string, defAmt: number) => {
    setCategory(catId as any);
    setRequestedAmount(defAmt);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      alert('অনুগ্রহ করে রোগীর নাম লিখুন।');
      return;
    }
    if (!phone.trim() || phone.trim().length < 11) {
      alert('অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নম্বর লিখুন।');
      return;
    }
    if (!district.trim() || !upazilaOrArea.trim() || !villageOrUnion.trim()) {
      alert('অনুগ্রহ করে রোগীর জেলা, থানা/উপজেলা এবং ইউনিয়ন/গ্রাম উল্লেখ করুন।');
      return;
    }
    if (!illnessDetails.trim()) {
      alert('অনুগ্রহ করে রোগের বিবরণ এবং কি জন্য অনুদান প্রয়োজন তা বিস্তারিত লিখুন।');
      return;
    }
    if (!requestedAmount || requestedAmount < 100) {
      alert('অনুগ্রহ করে আনুমানিক কত টাকা অনুদান প্রয়োজন তা লিখুন।');
      return;
    }
    if (!payoutNumber.trim() || payoutNumber.trim().length < 11) {
      alert('অনুগ্রহ করে টাকা গ্রহণের জন্য সঠিক বিকাশ/নগদ নম্বর লিখুন।');
      return;
    }

    setSubmitting(true);
    try {
      const randomCode = 'MED-' + Math.floor(100000 + Math.random() * 900000);
      const selectedCatObj = AID_CATEGORIES.find(c => c.id === category);
      const catTitle = selectedCatObj ? selectedCatObj.title : 'চিকিৎসা সহায়তা';

      const newDocRef = doc(collection(db, 'medical_assistance_applications'));
      const appData: MedicalAssistanceApplication = {
        id: newDocRef.id,
        applicationCode: randomCode,
        patientName: patientName.trim(),
        guardianName: guardianName.trim() || undefined,
        phone: phone.trim(),
        district: district.trim(),
        upazilaOrArea: upazilaOrArea.trim(),
        villageOrUnion: villageOrUnion.trim(),
        fullAddress: fullAddress.trim() || `${villageOrUnion}, ${upazilaOrArea}, ${district}`,
        category,
        categoryTitle: catTitle,
        illnessDetails: illnessDetails.trim(),
        requestedAmount: Number(requestedAmount),
        fundedAmount: 0,
        paymentMethod,
        payoutNumber: payoutNumber.trim(),
        patientNid: patientNid.trim() || undefined,
        status: 'pending',
        createdAt: new Date().toISOString(),
        userId: profile?.id || undefined
      };

      await setDoc(newDocRef, appData);
      setSubmittedApp(appData);
      if (onSuccess) {
        onSuccess(appData);
      }
    } catch (err: any) {
      console.error('Error submitting medical assistance application:', err);
      alert('আবেদন জমা দিতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubmittedApp(null);
    setPatientName('');
    setGuardianName('');
    setIllnessDetails('');
    setVillageOrUnion('');
    setUpazilaOrArea('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-emerald-100 my-4"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-cyan-800 text-white p-5 sm:p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-2xl border border-white/20 shadow-inner">
              🤲
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-100 text-xs font-semibold backdrop-blur-sm mb-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                <span>যাকাত ও সামাজিক স্বাস্থ্য সেবা ফান্ড</span>
              </div>
              <h3 className="text-xl font-bold tracking-tight">
                চিকিৎসার অনুদানের জন্য আবেদন ফরম
              </h3>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                অসচ্ছল রোগী ও প্রসূতি মায়েদের জরুরি চিকিৎসার আর্থিক সহায়তা আবেদন
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {submittedApp ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-2xl font-bold text-slate-800">
                  আবেদন সফলভাবে গৃহীত হয়েছে!
                </h4>
                <p className="text-slate-600 text-sm mt-1">
                  আপনার আবেদনটি পর্যালোচনার জন্য জমা নেওয়া হয়েছে এবং উন্মুক্ত বোর্ডে যুক্ত হয়েছে।
                </p>
              </div>

              {/* Code Box */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 max-w-md mx-auto text-left space-y-2">
                <div className="flex justify-between items-center text-xs text-emerald-800">
                  <span className="font-semibold">আবেদন ট্র্যাকিং কোড:</span>
                  <span className="font-mono bg-emerald-600 text-white px-2.5 py-1 rounded-lg font-bold text-sm">
                    {submittedApp.applicationCode}
                  </span>
                </div>
                <div className="text-xs text-slate-700 space-y-1 pt-2 border-t border-emerald-200/60">
                  <p><strong>রোগীর নাম:</strong> {submittedApp.patientName}</p>
                  <p><strong>ক্যাটাগরি:</strong> {submittedApp.categoryTitle}</p>
                  <p><strong>ঠিকানা:</strong> {submittedApp.villageOrUnion}, {submittedApp.upazilaOrArea}, {submittedApp.district}</p>
                  <p><strong>প্রয়োজনীয় অনুদান:</strong> ৳{submittedApp.requestedAmount.toLocaleString('bn-BD')}</p>
                  <p><strong>টাকা পাওয়ার মাধ্যম:</strong> {submittedApp.paymentMethod.toUpperCase()} ({submittedApp.payoutNumber})</p>
                </div>
              </div>

              <p className="text-xs text-slate-500 max-w-md mx-auto">
                আমাদের ভেরিফিকেশন টিম দ্রুত আপনার দেওয়া নম্বরে যোগাযোগ করে তথ্য যাচাই করবে। কোনো ডোনার বা যাকাতদাতা স্পন্সর করলে আপনার বিকাশ/নগদে সহায়তা পৌঁছানো হবে।
              </p>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors shadow-md"
                >
                  ঠিক আছে (বন্ধ করুন)
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Note Banner */}
              <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 leading-relaxed">
                  <strong>জরুরি তথ্য:</strong> আপনার আবেদনটি যাকাত ও অনুদান দাতাদের জন্য উন্মুক্ত তালিকায় প্রদর্শিত হবে যাতে দাতা ও আমাদের ট্রাস্টি বোর্ড দ্রুত সঠিক রোগীকে চিহ্নিত করে অর্থায়ন করতে পারে। সঠিক জেলা, থানা ও গ্রামের নাম প্রদান করুন।
                </div>
              </div>

              {/* 1. Select Assistance Category */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">
                  ১. আপনি কি বিষয়ে অনুদান বা সহায়তা চাচ্ছেন? <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {AID_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategorySelect(cat.id, cat.defaultAmount)}
                      className={`text-left p-3 rounded-2xl border transition-all flex items-start gap-3 ${
                        category === cat.id
                          ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <span className="text-2xl shrink-0 p-1 bg-white rounded-xl shadow-xs border border-slate-100">
                        {cat.icon}
                      </span>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800 text-xs sm:text-sm">
                          {cat.shortName}
                        </div>
                        <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {cat.desc}
                        </div>
                        <div className="text-[11px] font-bold text-emerald-700 mt-1">
                          মানক অনুদান: ৳{cat.defaultAmount.toLocaleString('bn-BD')}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Patient & Guardian Details */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-1 border-b border-slate-100">
                  <User className="w-4 h-4 text-emerald-600" />
                  <span>২. রোগী ও অভিভাবকের ব্যক্তিগত বিবরণ</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      রোগী / প্রসূতি মায়ের নাম <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: মোছাঃ সেলিনা বেগম"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      অভিভাবক / স্বামীর নাম ও পেশা
                    </label>
                    <input
                      type="text"
                      placeholder="যেমন: মোঃ রফিকুল ইসলাম (দিনমজুর / রিকশাচালক)"
                      value={guardianName}
                      onChange={(e) => setGuardianName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      যোগাযোগের মোবাইল নম্বর <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="01XXXXXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      রোগী/অভিভাবকের NID নম্বর (ঐচ্ছিক)
                    </label>
                    <input
                      type="text"
                      placeholder="জাতীয় পরিচয়পত্র নম্বর"
                      value={patientNid}
                      onChange={(e) => setPatientNid(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Location (District, Thana, Village) */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-1 border-b border-slate-100">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>৩. পূর্ণাঙ্গ ঠিকানা ও অবস্থান (জেলা, থানা, গ্রাম)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      জেলা <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      <option value="নীলফামারী">নীলফামারী</option>
                      <option value="রংপুর">রংপুর</option>
                      <option value="কুড়িগ্রাম">কুড়িগ্রাম</option>
                      <option value="লালমনিরহাট">লালমনিরহাট</option>
                      <option value="দিনাজপুর">দিনাজপুর</option>
                      <option value="গাইবান্ধা">গাইবান্ধা</option>
                      <option value="ঠাকুরগাঁও">ঠাকুরগাঁও</option>
                      <option value="পঞ্চগড়">পঞ্চগড়</option>
                      <option value="বগুড়া">বগুড়া</option>
                      <option value="ঢাকা">ঢাকা</option>
                      <option value="অন্যান্য জেলা">অন্যান্য জেলা</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      থানা / উপজেলা <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: জলঢাকা / কিশোরগঞ্জ"
                      value={upazilaOrArea}
                      onChange={(e) => setUpazilaOrArea(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ইউনিয়ন ও গ্রাম <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: গোলমুন্ডা, বালাপাড়া"
                      value={villageOrUnion}
                      onChange={(e) => setVillageOrUnion(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    পূর্ণাঙ্গ ঠিকানা ও হাসপাতাল/ক্লিনিকের নাম (যদি থাকে)
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: গ্রাম: গোলমুন্ডা, জলঢাকা, নীলফামারী। জলঢাকা উপজেলা স্বাস্থ্য কমপ্লেক্স / নীলফামারী সদর হাসপাতাল"
                    value={fullAddress}
                    onChange={(e) => setFullAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* 4. Illness Description & Amount */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-1 border-b border-slate-100">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>৪. রোগের বিবরণ ও প্রয়োজনীয় সহায়তার পরিমাণ</span>
                </h4>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    রোগ ও আর্থিক সংকটের বিস্তারিত বিবরণ <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="যেমন: রোগী একজন গরিব দিনমজুরের গর্ভবতী স্ত্রী, আগামী সপ্তাহে সিজারিয়ান ডেলিভারি প্রয়োজন কিন্তু টাকার ব্যবস্থা নেই। অথবা রোগীর হার্নিয়া অপারেশন করাতে হবে, হাসপাতালে ওটি চার্জ ও ঔষধ কেনার টাকা নেই..."
                    value={illnessDetails}
                    onChange={(e) => setIllnessDetails(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      আনুমানিক কত টাকা অনুদান প্রয়োজন (৳) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold">৳</span>
                      <input
                        type="number"
                        min="100"
                        step="100"
                        required
                        value={requestedAmount}
                        onChange={(e) => setRequestedAmount(Number(e.target.value))}
                        className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      টাকা গ্রহণের মাধ্যম ও মোবাইল অ্যাকাউন্ট <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                        className="px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                      >
                        <option value="bkash">বিকাশ</option>
                        <option value="nagad">নগদ</option>
                        <option value="rocket">রকেট</option>
                      </select>
                      <input
                        type="tel"
                        required
                        placeholder="বিকাশ/নগদ নম্বর"
                        value={payoutNumber}
                        onChange={(e) => setPayoutNumber(e.target.value)}
                        className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 transition-colors"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>জমা হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>আবেদন জমা দিন</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};
