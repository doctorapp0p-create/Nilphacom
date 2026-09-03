import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Video, Phone, Stethoscope, Clock, ShieldCheck, 
  CheckCircle2, AlertCircle, X, Sparkles, CreditCard, 
  User, Activity, ArrowRight, RefreshCw, Calendar, 
  MessageSquare, Copy, Check, Star, Zap, Percent
} from 'lucide-react';
import { auth, db } from '../../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  collection, query, where, getDocs, doc, 
  getDoc, addDoc, serverTimestamp, setDoc 
} from 'firebase/firestore';
import { Profile, Doctor, Subscription } from '../../types';
import { 
  convertToBanglaDigits, 
  calculateSubscriptionTiming, 
  normalizePhoneNumber 
} from '../../utils';

interface LiveDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctorsList?: Doctor[];
  doctors?: Doctor[];
  selectedDoctor?: Doctor | null;
  hotline?: string;
  onOpenSubscriptionModal?: () => void;
  onOpenSubscription?: () => void;
  onOpenAuthModal?: () => void;
  currentUser?: any;
  onDoctorSelect?: (doc: Doctor) => void;
}

export const LiveDoctorModal: React.FC<LiveDoctorModalProps> = ({
  isOpen,
  onClose,
  doctorsList,
  doctors,
  selectedDoctor,
  hotline = '01352669100',
  onOpenSubscriptionModal,
  onOpenSubscription,
  onOpenAuthModal,
  currentUser: propUser,
  onDoctorSelect
}) => {
  const activeDoctorsList = doctorsList || doctors || [];
  const handleOpenSubscription = onOpenSubscription || onOpenSubscriptionModal;

  const [currentUser, setCurrentUser] = useState(propUser || auth.currentUser);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userSubscription, setUserSubscription] = useState<Subscription | any | null>(null);
  const [waitingCount, setWaitingCount] = useState<number>(0);
  const [isLoadingQueue, setIsLoadingQueue] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

  // Form State
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState<'পুরুষ' | 'মহিলা' | 'শিশু'>('পুরুষ');
  const [patientAddress, setPatientAddress] = useState('নীলফামারী');
  const [healthProblems, setHealthProblems] = useState('');
  const [chosenDoctorId, setChosenDoctorId] = useState<string>(selectedDoctor?.id || 'any');
  const [consultationType, setConsultationType] = useState<'video' | 'audio'>('video');

  // Payment inputs for 200 BDT fee
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad'>('bkash');
  const [senderPhone, setSenderPhone] = useState('');
  const [trxId, setTrxId] = useState('');

  // Fetch real-time waiting queue and user subscription
  const fetchLiveDoctorQueue = async () => {
    setIsLoadingQueue(true);
    try {
      // Query pending appointments for live doctor
      const appRef = collection(db, 'appointments');
      const q = query(appRef, where('status', '==', 'pending'));
      const snap = await getDocs(q);
      setWaitingCount(snap.size);
    } catch (err) {
      console.warn('Error fetching live queue count:', err);
    } finally {
      setIsLoadingQueue(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchLiveDoctorQueue();

    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setCurrentUser(u);
        try {
          // 1. Fetch Profile
          const pRef = doc(db, 'profiles', u.uid);
          const pSnap = await getDoc(pRef);
          if (pSnap.exists()) {
            const pData = pSnap.data() as Profile;
            setProfile(pData);
            setPatientName(pData.full_name || u.displayName || '');
            setPatientPhone(pData.phone || '');
            if ((pData as any).active_subscription) {
              setUserSubscription((pData as any).active_subscription);
            }
          }

          // 2. Fetch Active Approved Subscriptions from Firestore
          const subQ = query(
            collection(db, 'subscriptions'),
            where('user_id', '==', u.uid),
            where('status', '==', 'approved')
          );
          const subSnap = await getDocs(subQ);
          if (!subSnap.empty) {
            const subData = subSnap.docs[0].data() as Subscription;
            setUserSubscription(subData);
          }
        } catch (err) {
          console.warn('Error fetching user profile in LiveDoctorModal:', err);
        }
      } else {
        if (!propUser) {
          setProfile(null);
          setUserSubscription(null);
        }
      }
    });

    return unsub;
  }, [isOpen]);

  useEffect(() => {
    if (selectedDoctor) {
      setChosenDoctorId(selectedDoctor.id);
    }
  }, [selectedDoctor]);

  // Subscription calculation
  const subTiming = calculateSubscriptionTiming(userSubscription);
  const isFreeDoctorSubscriber = Boolean(
    userSubscription && 
    subTiming.isActive && 
    (
      userSubscription.plan_type === 'tier2_test_and_doctor' ||
      userSubscription.plan_type === 'test_and_doctor' ||
      userSubscription.has_free_doctor === true ||
      userSubscription.package_type === 'test_and_doctor'
    )
  );

  const hasTestOnlySubscription = Boolean(
    userSubscription && 
    subTiming.isActive && 
    !isFreeDoctorSubscriber
  );

  // Fee calculation: ৳0 for free doctor subscribers, ৳200 for regular patients
  const currentFee = isFreeDoctorSubscriber ? 0 : 200;

  const handleCopyNumber = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedNumber(num);
    setTimeout(() => setCopiedNumber(null), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!patientName.trim() || !patientPhone.trim()) {
      alert('অনুগ্রহ করে রোগীর নাম এবং মোবাইল নম্বর দিন।');
      return;
    }

    if (!healthProblems.trim()) {
      alert('অনুগ্রহ করে রোগীর স্বাস্থ্য সমস্যা বা কী কারণে দেখাতে চান সংক্ষেপে লিখুন।');
      return;
    }

    // If not subscribed, confirm payment notice
    if (!isFreeDoctorSubscriber) {
      if (!trxId.trim() && !senderPhone.trim()) {
        const confirmPay = window.confirm(
          'অনলাইন লাইভ ডাক্তারের সাথে কথা বলতে ২০০ টাকা ভিজিট ফি বিকাশ বা নগদে পাঠাতে হবে। আপনি কি ২০০ টাকা পেমেন্ট নিশ্চিত করতে চান?'
        );
        if (!confirmPay) return;
      }
    }

    setIsSubmitting(true);
    try {
      const selectedDocObj = activeDoctorsList.find(d => d.id === chosenDoctorId);
      const docName = selectedDocObj ? selectedDocObj.name : 'অন-ডিউটি বিশেষজ্ঞ চিকিৎসক';
      const docSpecialty = selectedDocObj ? selectedDocObj.specialty : 'মেডিসিন ও লাইভ কনসালটেশন';

      // Generate Unique Room & Patient Online ID for Multi-Party Supervision
      const phoneDigits = patientPhone.trim().replace(/\D/g, '').slice(-5);
      const randomCode = Math.floor(10000 + Math.random() * 90000);
      const patientPID = `PID-${phoneDigits || randomCode}`;
      const consultationRoomId = `JBHealthCare-LiveDoc-${patientPID}-${Date.now().toString().slice(-4)}`;
      const liveMeetingUrl = `https://meet.jit.si/${consultationRoomId}`;

      const appointmentRecord: any = {
        patient_id: currentUser ? (currentUser.uid || currentUser.id) : 'guest',
        patient_online_id: patientPID,
        patient_name: patientName.trim(),
        patient_phone: patientPhone.trim(),
        patient_age: patientAge.trim() || 'N/A',
        patient_gender: patientGender,
        patient_address: patientAddress.trim(),
        doctor_id: chosenDoctorId === 'any' ? 'on_duty' : chosenDoctorId,
        doctor_name: docName,
        doctor_specialty: docSpecialty,
        is_live_consultation: true,
        consultation_type: consultationType,
        consultation_fee: currentFee,
        problems: healthProblems.trim(),
        status: 'pending',
        date: 'আজই (লাইভ কনসালটেশন)',
        payment_method: isFreeDoctorSubscriber ? 'free_subscription' : paymentMethod,
        payment_trx_id: trxId.trim(),
        payment_sender_phone: senderPhone.trim() || patientPhone.trim(),
        payment_status: isFreeDoctorSubscriber ? 'waived' : (trxId.trim() ? 'paid' : 'pending'),
        subscription_card_number: userSubscription?.card_number || '',
        subscription_plan_name: userSubscription?.plan_name || '',
        has_free_doctor: isFreeDoctorSubscriber,
        has_30_discount_on_tests: Boolean(userSubscription && subTiming.isActive),
        meeting_room_id: consultationRoomId,
        meeting_room_url: liveMeetingUrl,
        moderator_supervision_enabled: true,
        created_at: serverTimestamp()
      };

      await addDoc(collection(db, 'appointments'), appointmentRecord);

      // Reassuring, polished, professional Bengali message
      const queuePositionText = convertToBanglaDigits(waitingCount + 1);
      
      let waMsg = `*আসসালামু আলাইকুম ${patientName.trim()}*,\n`;
      waMsg += `জেবি ডিজিটাল হেলথকেয়ার লাইভ ডক্টর কনসালটেশন সেবায় আপনাকে স্বাগতম।\n\n`;
      
      if (isFreeDoctorSubscriber) {
        waMsg += `আপনার সক্রিয় সাবস্ক্রিপশন কার্ডের মাধ্যমে লাইভ ডাক্তারের সাথে কনসালটেশনের অনুরোধটি সফলভাবে গ্রহণ করা হয়েছে।\n\n`;
      } else {
        waMsg += `আপনার লাইভ ডক্টর কনসালটেশন অনুরোধ ও ২০০ টাকা ভিজিট ফি সফলভাবে নথিভুক্ত করা হয়েছে।\n\n`;
      }

      waMsg += `━━━━━━━━━━━━━━━━━━━━\n`;
      waMsg += `📋 *লাইভ কনসালটেশন তথ্য:*\n`;
      waMsg += `• রোগীর আইডি: *${patientPID}*\n`;
      waMsg += `• রোগীর নাম: ${patientName.trim()}\n`;
      waMsg += `• বয়স ও লিঙ্গ: ${patientAge.trim() || 'N/A'} (${patientGender})\n`;
      waMsg += `• মোবাইল নম্বর: ${patientPhone.trim()}\n`;
      waMsg += `• এলাকা/ঠিকানা: ${patientAddress.trim()}\n`;
      waMsg += `• স্বাস্থ্য সমস্যা: ${healthProblems.trim()}\n`;
      waMsg += `• চিকিৎসক: *${docName}* (${docSpecialty})\n`;
      waMsg += `• কনসালটেশন মাধ্যম: *${consultationType === 'video' ? 'ভিডিও কল 📹' : 'অডিও কল 📞'}*\n`;
      
      if (isFreeDoctorSubscriber) {
        waMsg += `• পেমেন্ট স্ট্যাটাস: *৳০ (মেম্বারশিপ কার্ড: ${userSubscription.card_number})*\n`;
      } else {
        waMsg += `• ভিজিট ফি: *৳২০০ টাকা*\n`;
        waMsg += `• পেমেন্ট মাধ্যম: *${paymentMethod === 'bkash' ? 'বিকাশ' : 'নগদ'}*\n`;
        if (senderPhone.trim()) waMsg += `• প্রেরক নম্বর: ${senderPhone.trim()}\n`;
        if (trxId.trim()) waMsg += `• ট্রানজেকশন ID: ${trxId.trim()}\n`;
      }
      waMsg += `• অপেক্ষমাণ কিউ ক্রম: *${queuePositionText} নং*\n`;
      waMsg += `━━━━━━━━━━━━━━━━━━━━\n\n`;

      waMsg += `📞 *পরবর্তী পদক্ষেপ:*\n`;
      waMsg += `শীঘ্রই আমাদের একজন সেন্ট্রাল প্রতিনিধি / কো-অর্ডিনেটর আপনার সাথে ফোনে বা হোয়াটসঅ্যাপে যোগাযোগ করে ডাক্তারের সাথে সরাসরি কথা বলে দেওয়ার ব্যবস্থা করছেন।\n\n`;
      waMsg += `অনুগ্রহ করে আপনার ফোনটি সচল রাখুন এবং কিছুক্ষণ অপেক্ষা করুন। আমাদের মেডিকেল মডারেটর উপস্থিত থেকে সর্বোত্তম স্বাস্থ্যসেবা নিশ্চিত করবেন।\n\n`;
      waMsg += `🏥 *জেবি ডিজিটাল হেলথ সেন্টার*\n`;
      waMsg += `📍 নীলফামারী হেড অফিস ও ডিজিটাল টেলিমেডিসিন ইউনিট\n`;
      waMsg += `📞 সার্বক্ষণিক হেল্পলাইন: ${hotline}`;

      let formattedPhone = hotline.replace(/\D/g, '');
      if (formattedPhone.startsWith('0')) formattedPhone = '88' + formattedPhone;
      else if (!formattedPhone.startsWith('88')) formattedPhone = '880' + formattedPhone;

      window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(waMsg)}`, '_blank');
      alert(`আপনার লাইভ ডক্টর কনসালটেশন রিকুয়েস্ট সফল হয়েছে! \n\nশীঘ্রই আমাদের একজন প্রতিনিধি আপনার সাথে যোগাযোগ করে ডাক্তারের সাথে কথা বলিয়ে দেওয়ার ব্যবস্থা করছেন। অপেক্ষমাণ ক্রম: ${queuePositionText} নং।`);
      onClose();
    } catch (err: any) {
      console.error('Error submitting live doctor request:', err);
      alert('রিকুয়েস্ট পাঠাতে সমস্যা হয়েছে: ' + (err.message || 'Error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-[32px] w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-100 my-6 flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 via-rose-700 to-indigo-900 text-white p-6 sm:p-7 relative overflow-hidden shrink-0">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <button
              onClick={onClose}
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all active:scale-95 z-10"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 relative z-10">
              <div className="w-13 h-13 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-lg shrink-0">
                <Video size={28} className="animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-white/25 text-white font-black px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> লাইভ অনলাইন কনসালটেশন
                  </span>
                  <span className="bg-amber-400 text-slate-950 font-black px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider">
                    সরাসরি কথা বলুন
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
                  লাইভ ডক্টর — ভিডিও ও অডিও কল
                </h2>
                <p className="text-xs text-rose-100 font-bold mt-0.5">
                  ঘরে বসেই অভিজ্ঞ চিকিৎসকের সাথে সরাসরি ভিডিও/ভয়েস কলে কথা বলে প্রেসক্রিপশন নিন
                </p>
              </div>
            </div>

            {/* Live Waiting Queue Counter Bar */}
            <div className="mt-4 pt-4 border-t border-white/20 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10">
                <Clock size={16} className="text-amber-300 animate-spin" />
                <span className="font-bold text-slate-100 text-[11px]">
                  বর্তমানে অপেক্ষমাণ রোগী: <span className="font-black text-amber-300 text-sm">{isLoadingQueue ? '...' : `${convertToBanglaDigits(waitingCount)} জন`}</span>
                </span>
              </div>
              <button
                type="button"
                onClick={fetchLiveDoctorQueue}
                className="text-[10px] bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-all"
              >
                <RefreshCw size={12} className={isLoadingQueue ? 'animate-spin' : ''} /> রিফ্রেশ কিউ
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-left">
            {/* Dual Option Banner: Subscription vs 200 BDT Fee */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              
              {/* Card 1: Subscription Status & Validity Display */}
              <div className={`p-4 rounded-2xl border transition-all ${
                isFreeDoctorSubscriber 
                  ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-300 ring-2 ring-emerald-400/40 shadow-sm' 
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">💳</span>
                    <div>
                      <h4 className="text-xs font-black text-slate-800">সাবস্ক্রিপশন কার্ড</h4>
                      <p className="text-[10px] text-slate-500 font-bold">ফ্রি আনলিমিটেড ডক্টর</p>
                    </div>
                  </div>
                  {isFreeDoctorSubscriber ? (
                    <span className="bg-emerald-600 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase">
                      সক্রিয় (Active)
                    </span>
                  ) : (
                    <span className="bg-slate-200 text-slate-600 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                      অ্যাক্টিভ নেই
                    </span>
                  )}
                </div>

                {isFreeDoctorSubscriber ? (
                  <div className="mt-3 pt-3 border-t border-emerald-200/60 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-[11px] font-black text-emerald-950">
                      <span>ফি চার্জ:</span>
                      <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-lg">৳০ (সম্পূর্ণ ফ্রি)</span>
                    </div>
                    <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200 space-y-1 text-[10px]">
                      <p className="text-slate-600 font-bold">
                        📅 একটিভ: <span className="font-black text-slate-800">{subTiming.formattedActivationDate}</span>
                      </p>
                      <p className="text-slate-600 font-bold">
                        ⏳ মেয়াদ উত্তীর্ণ: <span className="font-black text-slate-800">{subTiming.formattedExpiryDate}</span>
                      </p>
                      <p className="text-emerald-700 font-black flex items-center gap-1 pt-0.5">
                        <Sparkles size={11} /> অবশিষ্ট সময়: <span className="underline">{subTiming.remainingDaysBengaliText}</span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 pt-3 border-t border-slate-200 space-y-2 text-xs">
                    <p className="text-[11px] text-slate-600 font-medium">
                      সাবস্ক্রিপশন নেওয়া থাকলে ডক্টর ফি <strong className="text-emerald-600">৳০ (ফ্রি)</strong> এবং টেস্টে <strong className="text-indigo-600">৩০% ছাড়</strong> পাবেন।
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenSubscriptionModal?.();
                      }}
                      className="w-full bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                    >
                      <Sparkles size={12} /> প্যাকেজ ২ সাবস্ক্রাইব করুন
                    </button>
                  </div>
                )}
              </div>

              {/* Card 2: One-time 200 BDT Fee Payment Option */}
              <div className={`p-4 rounded-2xl border transition-all ${
                !isFreeDoctorSubscriber 
                  ? 'bg-gradient-to-br from-rose-50 to-orange-50 border-rose-300 ring-2 ring-rose-400/40 shadow-sm' 
                  : 'bg-slate-50 border-slate-200 opacity-70'
              }`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">💵</span>
                    <div>
                      <h4 className="text-xs font-black text-slate-800">এককালীন ভিজিট ফি</h4>
                      <p className="text-[10px] text-slate-500 font-bold">বিকাশ / নগদ পেমেন্ট</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                    isFreeDoctorSubscriber ? 'bg-slate-200 text-slate-500 line-through' : 'bg-rose-600 text-white'
                  }`}>
                    ৳২০০ টাকা
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-rose-200/60 space-y-2 text-xs">
                  {isFreeDoctorSubscriber ? (
                    <p className="text-[11px] text-emerald-700 font-black">
                      ✓ আপনি সাবস্ক্রিপশন কার্ডধারী হওয়ায় আপনাকে এই ২০০ টাকা ভিজিট দিতে হবে না!
                    </p>
                  ) : (
                    <div className="space-y-1.5 text-[10px] text-slate-700">
                      <p className="font-bold leading-tight">
                        অনলাইনে ডাক্তার দেখাতে বিকাশ/নগদে ২০০ টাকা পেমেন্ট করুন:
                      </p>
                      <div className="bg-white p-2 rounded-xl border border-rose-200 flex items-center justify-between font-mono font-black text-rose-700 text-xs">
                        <span>{hotline} (Personal)</span>
                        <button
                          type="button"
                          onClick={() => handleCopyNumber(hotline)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 px-2 py-1 rounded-lg text-[9px] font-bold flex items-center gap-1 transition-all"
                        >
                          {copiedNumber === hotline ? <Check size={11} /> : <Copy size={11} />}
                          {copiedNumber === hotline ? 'কপি হয়েছে' : 'কপি'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Consultation Booking Form */}
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <User size={14} className="text-rose-600" /> রোগীর তথ্য ও কনসালটেশন বিবরণ
                </h3>
                <span className="text-[10px] text-slate-400 font-bold">* আবশ্যক ক্ষেত্র</span>
              </div>

              {/* Consultation Type Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-600 tracking-wider">
                  কনসালটেশনের মাধ্যম নির্ধারণ করুন:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setConsultationType('video')}
                    className={`p-3 rounded-2xl border-2 flex items-center justify-center gap-2 text-xs font-black transition-all ${
                      consultationType === 'video'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-100 scale-102'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Video size={16} /> ভিডিও কল (Live Video)
                  </button>
                  <button
                    type="button"
                    onClick={() => setConsultationType('audio')}
                    className={`p-3 rounded-2xl border-2 flex items-center justify-center gap-2 text-xs font-black transition-all ${
                      consultationType === 'audio'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100 scale-102'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Phone size={16} /> অডিও কল (Voice Call)
                  </button>
                </div>
              </div>

              {/* Doctor Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-600 tracking-wider">
                  পছন্দের ডক্টর নির্বাচন করুন:
                </label>
                <select
                  value={chosenDoctorId}
                  onChange={(e) => setChosenDoctorId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-bold text-slate-800 outline-none focus:border-rose-500"
                >
                  <option value="any">✨ যেকোনো অন-ডিউটি বিশেষজ্ঞ লাইভ চিকিৎসক (দ্রুততম সার্ভিস)</option>
                  {activeDoctorsList.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.isVideoConsultant ? '🔴 [লাইভ ডক্টর] ' : '👨‍⚕️ '}{d.name} ({d.specialty})
                    </option>
                  ))}
                </select>
              </div>

              {/* Patient Basic Info Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-600 tracking-wider">
                    রোগীর নাম *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: মো: রফিকুল ইসলাম"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-bold text-slate-800 outline-none focus:border-rose-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-600 tracking-wider">
                    মোবাইল নম্বর (WhatsApp) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="017XXXXXXXX"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-bold text-slate-800 outline-none focus:border-rose-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-600 tracking-wider">
                    বয়স
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: ৩২"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-bold text-slate-800 outline-none focus:border-rose-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-600 tracking-wider">
                    লিঙ্গ
                  </label>
                  <select
                    value={patientGender}
                    onChange={(e) => setPatientGender(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-bold text-slate-800 outline-none focus:border-rose-500"
                  >
                    <option value="পুরুষ">পুরুষ</option>
                    <option value="মহিলা">মহিলা</option>
                    <option value="শিশু">শিশু</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-600 tracking-wider">
                    ঠিকানা / এলাকা
                  </label>
                  <input
                    type="text"
                    placeholder="নীলফামারী / সৈয়দপুর"
                    value={patientAddress}
                    onChange={(e) => setPatientAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-bold text-slate-800 outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-600 tracking-wider">
                  রোগের প্রধান সমস্যা ও লক্ষণসমূহ *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="যেমন: গত ৩ দিন ধরে জ্বর, তীব্র মাথা ব্যথা ও কাশি হচ্ছে..."
                  value={healthProblems}
                  onChange={(e) => setHealthProblems(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-bold text-slate-800 outline-none focus:border-rose-500"
                />
              </div>

              {/* Payment details inputs if not free subscriber */}
              {!isFreeDoctorSubscriber && (
                <div className="bg-rose-50/70 border border-rose-200 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-rose-950 flex items-center gap-1.5">
                      <CreditCard size={14} className="text-rose-600" /> ২০০ টাকা ফি পেমেন্ট তথ্য দিন
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('bkash')}
                        className={`px-3 py-1 rounded-xl text-[10px] font-black ${
                          paymentMethod === 'bkash'
                            ? 'bg-pink-600 text-white'
                            : 'bg-white text-slate-700 border border-slate-200'
                        }`}
                      >
                        বিকাশ
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('nagad')}
                        className={`px-3 py-1 rounded-xl text-[10px] font-black ${
                          paymentMethod === 'nagad'
                            ? 'bg-orange-600 text-white'
                            : 'bg-white text-slate-700 border border-slate-200'
                        }`}
                      >
                        নগদ
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-black uppercase text-slate-600">
                        যে নম্বর থেকে টাকা পাঠিয়েছেন
                      </label>
                      <input
                        type="tel"
                        placeholder="01XXXXXXXXX"
                        value={senderPhone}
                        onChange={(e) => setSenderPhone(e.target.value)}
                        className="w-full bg-white border border-rose-200 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-800 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase text-slate-600">
                        TrxID (ট্রানজেকশন আইডি)
                      </label>
                      <input
                        type="text"
                        placeholder="যেমন: 9J3K8L2P"
                        value={trxId}
                        onChange={(e) => setTrxId(e.target.value)}
                        className="w-full bg-white border border-rose-200 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-800 outline-none uppercase"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-red-600 via-rose-600 to-indigo-700 hover:from-red-700 hover:to-indigo-800 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-wider shadow-xl shadow-rose-900/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" /> অনুরোধ পাঠানো হচ্ছে...
                    </>
                  ) : (
                    <>
                      <Video size={18} /> 
                      {isFreeDoctorSubscriber 
                        ? 'ফ্রি লাইভ কনসালটেশন শুরু করুন (৳০)' 
                        : '২০০ টাকা ফি দিয়ে লাইভ কনসালটেশন শুরু করুন'}
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
                <p className="text-[10px] text-center text-slate-400 font-bold mt-2">
                  🔒 সাবমিট করার সাথে সাথে আপনার রিকুয়েস্ট ডক্টরের লাইভ কিউতে যুক্ত হবে এবং হোয়াটসঅ্যাপে সরাসরি কানেক্ট করা হবে।
                </p>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
