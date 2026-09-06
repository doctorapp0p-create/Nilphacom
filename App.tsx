
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth as getTempAuth, signOut as signTempOut } from 'firebase/auth';
import { UserRole, Doctor, Clinic, Medicine, Order, Profile, Prescription, LabTest, Quiz, QuizSubmission, Withdrawal, PharmacyStore } from './types';
import { DOCTORS, CLINICS, MEDICINES, EMERGENCY_SERVICES, DISTRICTS, LAB_TESTS, SPECIALTIES } from './constants';
import { slugify, toVirtualEmail, normalizePhoneNumber, normalizeDigits, getLoginCandidateEmails } from './utils';
import { ALL_DISTRICTS_DATA } from './src/data/addressData';
import { gemini } from './services/geminiService';
import { auth, db } from './services/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile,
  updatePassword,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  writeBatch,
  increment
} from 'firebase/firestore';
import { Routes, Route, Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import SEO from './SEO';
import { DoctorProfilePage, ClinicLandingPage, SpecialistLandingPage, DistrictLandingPage } from './LandingPages';
import { BookingModal } from './src/components/BookingModal';
import { SecurityGuard, sanitizeInput } from './src/components/SecurityGuard';
import { AdminLabBillBuilder } from './src/components/AdminLabBillBuilder';
import { AuthModal } from './src/components/AuthModal';
import { BuyMedicineSection } from './src/components/BuyMedicineSection';
import { AdminDataModal } from './src/components/AdminDataModal';
import { LevelUpRewardSection } from './src/components/LevelUpRewardSection';
import { AmbulanceCalculator } from './src/components/AmbulanceCalculator';
const doctorSponsorBanner = '/src/assets/images/doctor_sponsor_banner_1785435948836.jpg';
import { HomeNursingCare } from './src/components/HomeNursingCare';
import { OxygenSupportCard } from './src/components/OxygenSupportCard';
import { FreeDoctorClaimSection } from './src/components/FreeDoctorClaimSection';
import { MaternityDonationSection } from './src/components/MaternityDonationSection';
import { DonationPortalSection } from './src/components/DonationPortalSection';
import { SubscriptionSection } from './src/components/SubscriptionSection';
import { DoctorPortal } from './src/components/DoctorPortal';
import { SponsorBannerSlider } from './src/components/SponsorBannerSlider';
import { DoctorProfileAdBannerCard } from './src/components/DoctorProfileAdBannerCard';
import { LiveDoctorModal } from './src/components/LiveDoctorModal';
import { GovtHealthPortal } from './src/components/GovtHealthPortal';
import { BloodDonationSection } from './src/components/BloodDonationSection';
import { CouponManager } from './src/components/CouponManager';
import { fetchCoupons, validateCoupon } from './src/services/couponService';
import { Coupon } from './types';
import { Share2, Bot, Video, Microscope, Ambulance, Star, ShieldCheck, Zap, MessageSquare, ArrowRight, X, Download, Smartphone, Stethoscope, Percent, MapPin, Calendar, Clock, Phone, BadgeCheck, Search, ChevronRight, FileText, Youtube, User, HelpCircle, Wallet, LogOut, Gift, Building, HeartHandshake, Baby, Heart, CreditCard, Plus, CheckCircle2, AlertCircle, RefreshCw, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const WHATSAPP_NUMBER = '8801352669100';

// --- UI Components ---

const Card: React.FC<{ children: React.ReactNode, className?: string, onClick?: () => void }> = ({ children, className = "", onClick }) => (
  <div onClick={onClick} className={`bg-white rounded-[24px] border border-slate-100 shadow-sm p-4 transition-all active:scale-[0.98] ${className}`}>
    {children}
  </div>
);

const Badge: React.FC<{ status: string }> = ({ status }) => {
  const colors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-600",
    active: "bg-emerald-100 text-emerald-600",
    verified: "bg-blue-100 text-blue-600",
    processing: "bg-indigo-100 text-indigo-600",
    completed: "bg-emerald-100 text-emerald-600",
    cancelled: "bg-rose-100 text-rose-600",
    suspended: "bg-red-100 text-red-600"
  };
  return (
    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-lg ${colors[status] || colors.pending}`}>
      {status}
    </span>
  );
};

export const downloadDoctorsCSV = (doctorsList: Doctor[], clinicsList: Clinic[] = []) => {
  if (!doctorsList || doctorsList.length === 0) {
    alert("ডাউনলোড করার মতো কোনো ডাক্তারের তথ্য পাওয়া যায়নি।");
    return;
  }

  const headers = [
    "ID (আইডি)",
    "Doctor Name (ডাক্তারের নাম)",
    "Degree (ডিগ্রী)",
    "Specialty (স্পেশালিটি)",
    "Districts (অঞ্চল/জেলা)",
    "Clinics & Hospitals (চেম্বার/হাসপাতাল)",
    "Schedule (সময়সূচী)",
    "Consultation Fee (ফি - ৳)",
    "Rating (রেটিং)",
    "Video Consultant (ভিডিও পরামর্শ)",
    "Available Today (আজ আছেন)"
  ];

  const csvRows = doctorsList.map(d => {
    const clinicNames = (d.clinics || []).map(cid => {
      const found = clinicsList.find(c => c.id === cid);
      return found ? `${found.name} (${found.address || ''})` : cid;
    }).join(' | ');

    const districtsStr = Array.isArray(d.districts) ? d.districts.join(', ') : (d.districts || '');

    return [
      `"${(d.id || '').replace(/"/g, '""')}"`,
      `"${(d.name || '').replace(/"/g, '""')}"`,
      `"${(d.degree || '').replace(/"/g, '""')}"`,
      `"${(d.specialty || '').replace(/"/g, '""')}"`,
      `"${districtsStr.replace(/"/g, '""')}"`,
      `"${clinicNames.replace(/"/g, '""')}"`,
      `"${(d.schedule || '').replace(/"/g, '""')}"`,
      `"${d.consultationFee || 0}"`,
      `"${d.rating || 5.0}"`,
      `"${d.isVideoConsultant ? 'Yes' : 'No'}"`,
      `"${d.availableToday ? 'Yes' : 'No'}"`
    ];
  });

  const csvContent = "\uFEFF" + [headers.join(','), ...csvRows.map(row => row.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `doctors_list_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const Button: React.FC<{ 
  children: React.ReactNode, 
  onClick?: () => void, 
  variant?: 'primary' | 'secondary' | 'danger' | 'success', 
  className?: string,
  disabled?: boolean,
  loading?: boolean,
  type?: "button" | "submit"
}> = ({ children, onClick, variant = 'primary', className = "", disabled = false, loading = false, type = "button" }) => {
  const styles = {
    primary: "bg-blue-600 text-white shadow-blue-100 shadow-lg",
    secondary: "bg-slate-100 text-slate-600",
    danger: "bg-red-500 text-white shadow-red-100 shadow-lg",
    success: "bg-green-600 text-white shadow-green-100 shadow-lg"
  };
  return (
    <button 
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled || loading}
      className={`px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 ${styles[variant]} ${className}`}
    >
      {loading ? (
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
      ) : children}
    </button>
  );
};

// --- Offline Banner ---
const OfflineBanner: React.FC = () => {
  return (
    <motion.div 
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      className="bg-rose-600 text-white text-center py-2 relative z-[60]"
    >
      <p className="text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
        আপনি বর্তমানে অফলাইনে আছেন। কিছু সার্ভিস সীমিত হতে পারে।
      </p>
    </motion.div>
  );
};

// --- Update Notification for PWA ---
const UpdatePrompt: React.FC = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleUpdate = () => setShow(true);
    window.addEventListener('swUpdateAvailable', handleUpdate);
    return () => window.removeEventListener('swUpdateAvailable', handleUpdate);
  }, []);

  if (!show) return null;

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-24 left-6 right-6 z-[400] bg-slate-900 text-white p-5 rounded-[32px] shadow-2xl flex items-center justify-between gap-4 border border-white/10"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center animate-pulse">
          <Zap size={20} fill="white" />
        </div>
        <div>
          <h4 className="text-[11px] font-black uppercase tracking-widest">নতুন আপডেট উপলব্ধ!</h4>
          <p className="text-[9px] text-slate-400 font-medium">সেরা পারফরম্যান্সের জন্য অ্যাপটি রিফ্রেশ করুন।</p>
        </div>
      </div>
      <button 
        onClick={() => window.location.reload()}
        className="bg-white text-slate-900 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg"
      >
        রিফ্রেশ করুন
      </button>
    </motion.div>
  );
};

// --- Reusable Quiz Card Item ---
interface QuizCardItemProps {
  quiz: Quiz;
  submission?: QuizSubmission;
  userPhone?: string;
  onSubmitQuiz: (quizId: string, uploadDate: string, answer: string, userPhone: string, prizeAmount: number) => Promise<void>;
}

const QuizCardItem: React.FC<QuizCardItemProps> = ({ quiz, submission, userPhone = '', onSubmitQuiz }) => {
  const [ans, setAns] = useState('');
  const [upDate, setUpDate] = useState('');
  const [phone, setPhone] = useState(userPhone);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userPhone && !phone) {
      setPhone(userPhone);
    }
  }, [userPhone]);

  return (
    <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl space-y-4 text-left">
      <div className="flex justify-between items-start gap-3">
        <div className="text-left">
          <span className="bg-purple-100 text-purple-700 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider mb-2 inline-block">
            ৳{quiz.prize_amount} টাকা পুরস্কার
          </span>
          <h4 className="text-xs font-black text-slate-800 leading-snug">{quiz.question}</h4>
          <p className="text-[10px] text-slate-400 font-semibold mt-1">ভিডিও টাইটেল: <span className="text-slate-600 font-bold">{quiz.video_title}</span></p>
          {quiz.answer_hint && (
            <div className="bg-purple-50 p-2.5 rounded-xl border border-purple-100/80 text-[11px] font-bold text-purple-900 mt-2 text-left">
              <span className="text-purple-700 font-extrabold mr-1">💡 সমাধান / উত্তর:</span>
              <span>{quiz.answer_hint}</span>
            </div>
          )}
        </div>
      </div>

      {submission ? (
        <div className="bg-white p-3.5 rounded-xl border border-slate-100 text-xs space-y-2 text-left shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase">আপনার সাবমিটকৃত উত্তর</p>
          <div className="flex justify-between items-center">
            <span className="font-extrabold text-slate-700">উত্তর: <span className="text-blue-600">{submission.answer}</span></span>
            <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase ${
              submission.status === 'correct' ? 'bg-emerald-100 text-emerald-700' :
              submission.status === 'incorrect' ? 'bg-rose-100 text-rose-700' :
              'bg-amber-100 text-amber-700 animate-pulse'
            }`}>
              {submission.status === 'correct' ? 'সঠিক (পেইড)' :
               submission.status === 'incorrect' ? 'ভুল উত্তর' : 'যাচাই করা হচ্ছে'}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 font-bold">প্রদত্ত ফোন: <span className="text-purple-700 font-black">{submission.user_phone || userPhone || 'N/A'}</span></p>
          {submission.status === 'correct' && (
            <p className="text-[10px] text-emerald-600 font-black">✓ অভিনন্দন! ৳{quiz.prize_amount} টাকা আপনার একাউন্টে যোগ হয়েছে।</p>
          )}
        </div>
      ) : (
        <form 
          onSubmit={async (e) => {
            e.preventDefault();
            if (!isSubscribed) {
              alert("⚠️ ১ম শর্ত পূরণ হয়নি: কুইজে অংশ নিতে বা উত্তর সাবমিট করতে আমাদের ইউটিউব চ্যানেলটি সাবস্ক্রাইব করুন এবং বক্সে টিক চিহ্ন দিন!");
              return;
            }
            if (!phone || phone.trim().length < 11) {
              alert("⚠️ ২য় শর্ত পূরণ হয়নি: ক্যাশ পুরস্কার গ্রহণের জন্য সঠিক ১১ ডিজিটের বিকাশ/নগদ মোবাইল নম্বর দিন!");
              return;
            }
            if (!upDate) {
              alert("ভিডিও আপলোড ডেট সিলেক্ট করুন!");
              return;
            }
            if (!ans.trim()) {
              alert("আপনার উত্তরটি লিখুন!");
              return;
            }

            setLoading(true);
            try {
              await onSubmitQuiz(quiz.id, upDate, ans.trim(), phone.trim(), quiz.prize_amount || 50);
              setAns('');
              setUpDate('');
            } catch (err) {
              console.error(err);
            } finally {
              setLoading(false);
            }
          }}
          className="space-y-4"
        >
          {/* Mandatory Prerequisites Box */}
          <div className="bg-purple-50/80 p-3.5 rounded-2xl border border-purple-200/80 space-y-3">
            <div className="flex items-center gap-1.5">
              <span className="bg-purple-600 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                ★ অংশ নেওয়ার ২টি শর্ত (Mandatory Rules)
              </span>
            </div>

            {/* Rule 1: YouTube Subscription */}
            <div className="space-y-2 bg-white p-3 rounded-xl border border-purple-100">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-800">
                  ১. ইউটিউব চ্যানেল সাবস্ক্রাইব শর্ত *
                </span>
                {isSubscribed ? (
                  <span className="text-emerald-600 font-extrabold text-[9px] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    ✓ সাবস্ক্রাইবড
                  </span>
                ) : (
                  <span className="text-rose-600 font-bold text-[9px] bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                    সাবস্ক্রাইব করা আবশ্যক
                  </span>
                )}
              </div>

              <a
                href="https://www.youtube.com/@NilphaHealthcare"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-red-600 hover:bg-red-700 text-white text-xs font-black py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <span>📺</span>
                <span>আমাদের ইউটিউব চ্যানেল খুলুন ও সাবস্ক্রাইব করুন</span>
              </a>

              <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isSubscribed}
                  onChange={(e) => setIsSubscribed(e.target.checked)}
                  className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                />
                <span className="text-[11px] font-bold text-slate-800">
                  আমি ইউটিউব চ্যানেলটি সাবস্ক্রাইব করেছি
                </span>
              </label>
            </div>

            {/* Rule 2: Phone Number Input */}
            <div className="space-y-1 bg-white p-3 rounded-xl border border-purple-100 text-left">
              <label className="text-[10px] font-black text-slate-800 block">
                ২. পুরস্কার পাওয়ার বিকাশ/নগদ মোবাইল নম্বর *
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="যেমন: 01700000000"
                className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:border-purple-600 focus:bg-white text-slate-800"
              />
              <p className="text-[9px] text-slate-400 font-semibold mt-0.5">
                কুইজ বিজয়ী হলে এই নম্বরে পুরস্কারের ক্যাশ টাকা পাঠানো হবে।
              </p>
            </div>
          </div>

          <div className="space-y-1 text-left">
            <label className="text-[9px] font-black uppercase text-slate-400">৩. ভিডিও আপলোড ডেট (YouTube Upload Date) *</label>
            <input 
              type="date" 
              value={upDate}
              onChange={(e) => setUpDate(e.target.value)}
              className="w-full bg-white p-3 rounded-xl border border-slate-100 text-xs font-bold outline-none focus:border-purple-500 text-slate-800"
            />
          </div>

          <div className="space-y-1 text-left">
            <label className="text-[9px] font-black uppercase text-slate-400">৪. আপনার উত্তরটি লিখুন *</label>
            <input 
              type="text" 
              placeholder="সঠিক উত্তরটি এখানে লিখুন..."
              value={ans}
              onChange={(e) => setAns(e.target.value)}
              className="w-full bg-white p-3 rounded-xl border border-slate-100 text-xs font-bold outline-none focus:border-purple-500 text-slate-800"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !isSubscribed || !phone || phone.trim().length < 11}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-white py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all text-center cursor-pointer shadow-md"
          >
            {loading ? 'জমা দেওয়া হচ্ছে...' : '✓ ২ টি শর্ত সাপেক্ষে উত্তর জমা দিন'}
          </button>
        </form>
      )}
    </div>
  );
};

// --- Floating Download Prompt for Web Version ---
const DownloadFAB: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    // Check if user has already interacted with the prompt
    const promptSeen = localStorage.getItem('jb_healthcare_apk_prompt_seen');
    if (promptSeen) return;

    // Show tooltip after 3 seconds of page load for the first time
    const timer = setTimeout(() => {
      setShowTooltip(true);
      // Persist seen state so it doesn't auto-prompt again even if they don't click anything
      localStorage.setItem('jb_healthcare_apk_prompt_seen', 'true');
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsOpen(false);
    setShowTooltip(false);
    // Persist seen state so it doesn't auto-prompt again
    localStorage.setItem('jb_healthcare_apk_prompt_seen', 'true');
  };

  const handleDownload = () => {
    setIsOpen(false);
    setShowTooltip(false);
    localStorage.setItem('jb_healthcare_apk_prompt_seen', 'true');
  };

  return (
    <div className="fixed bottom-24 right-6 z-[300]">
      <AnimatePresence>
        {(isOpen || showTooltip) && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
            exit={{ opacity: 0, y: 20, scale: 0.9, x: 20 }}
            className="absolute bottom-20 right-0 w-72 bg-white rounded-[32px] shadow-2xl border border-slate-100 p-6 mb-2"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="bg-blue-50 p-3 rounded-2xl">
                <Smartphone className="text-blue-600" size={24} />
              </div>
              <button 
                onClick={handleDismiss}
                className="p-1 hover:bg-slate-50 rounded-full text-slate-400"
              >
                <X size={18} />
              </button>
            </div>
            
            <h3 className="text-sm font-black text-slate-800 leading-tight mb-2 uppercase tracking-tight">
              Nilpha অ্যাপ
            </h3>
            
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed mb-5">
              সব ফিচারের সেরা অভিজ্ঞতার জন্য আমাদের অফিসিয়াল অ্যাপটি আপনার ফোনে ইনস্টল করুন। 
            </p>
            
            <div className="space-y-3">
              <a 
                href="/downloads/nilpha.apk" 
                download="nilpha.apk"
                onClick={handleDownload}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
              >
                <Download size={16} /> সরাসরি APK ডাউনলোড করুন
              </a>
              <p className="text-[8px] text-center text-rose-500 font-bold leading-tight">
                *মোবাইলে ডাউনলোড না হলে নতুন ট্যাবে (Open in New Tab) ওপেন করুন।
              </p>
              <div className="flex items-center justify-center gap-2 text-[8px] font-black text-slate-400 uppercase tracking-widest pt-1 border-t border-slate-50">
                <ShieldCheck size={10} /> Secure • Android Version v2.0
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => { setIsOpen(!isOpen); setShowTooltip(false); }}
        className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-full flex items-center justify-center shadow-2xl shadow-blue-500/40 relative active:scale-90 transition-all border-4 border-white"
      >
        <Smartphone size={28} />
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 1, 0.3] }}
          transition={{ repeat: Infinity, duration: 2.5 }}
          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg"
        >
          <span className="w-2 h-2 bg-white rounded-full shadow-inner" />
        </motion.div>
      </motion.button>
    </div>
  );
};

// --- Patient Detail View Subcomponent ---
const PatientDetailView: React.FC<{
  profiles: Profile[];
  selectedPatientId: string | null;
  appointments: any[];
  onUpdateAppointmentStatus?: (appId: string, status: 'pending' | 'visited' | 'absent') => Promise<void>;
  onUpdatePatientPassword?: (patientId: string, newPassword: string) => Promise<void>;
}> = ({ profiles, selectedPatientId, appointments, onUpdateAppointmentStatus, onUpdatePatientPassword }) => {
  const [copiedPass, setCopiedPass] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [newPassInput, setNewPassInput] = useState('');
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);

  const pat = profiles.find(p => p.id === selectedPatientId);
  if (!pat) {
    return (
      <div className="py-24 text-center text-slate-400 space-y-3">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-50 rounded-2xl text-slate-300">
          <User size={24} />
        </div>
        <p className="text-xs font-black uppercase tracking-wider">কোনো রোগীকে নির্বাচন করা হয়নি</p>
        <p className="text-[10px] max-w-xs mx-auto">বামপাশের তালিকা থেকে যেকোনো রোগীর উপর ক্লিক করে তার সম্পূর্ণ প্রোফাইল তথ্য, পাসওয়ার্ড এবং পূর্বের ডক্টর অ্যাপয়েন্টমেন্টের ইতিহাস দেখুন।</p>
      </div>
    );
  }

  const currentPass = pat.created_password || pat.password || '123456';
  const patApps = appointments.filter(a => a.patient_id === pat.id || a.patient_phone === pat.phone);
  const recommender = pat.referred_by_code 
    ? profiles.find(p => p.role === UserRole.RURAL_DOCTOR && p.referral_code?.trim().toUpperCase() === pat.referred_by_code?.trim().toUpperCase())
    : null;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentPass);
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 2000);
  };

  const handleSavePassword = async () => {
    if (!newPassInput.trim()) {
      alert('পাসওয়ার্ড লিখুন!');
      return;
    }
    if (newPassInput.trim().length < 4) {
      alert('পাসওয়ার্ড অন্তত ৪ অক্ষরের হতে হবে!');
      return;
    }
    setIsUpdatingPass(true);
    try {
      if (onUpdatePatientPassword) {
        await onUpdatePatientPassword(pat.id, newPassInput.trim());
      }
      setIsChangingPass(false);
      setNewPassInput('');
    } catch (e: any) {
      alert('পাসওয়ার্ড আপডেটে ত্রুটি: ' + (e?.message || e));
    } finally {
      setIsUpdatingPass(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Patient profile details card */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-6 rounded-[28px] relative overflow-hidden shadow-lg text-left">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mr-10 -mt-10" />
        
        <div className="relative z-10 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[8px] font-black bg-indigo-500 text-indigo-100 px-2 py-0.5 rounded-full uppercase tracking-wider">Patient ID Profile</span>
              <h3 className="font-extrabold text-base mt-1.5">{pat.full_name}</h3>
            </div>
            <span className="text-[9px] font-black bg-emerald-500 text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider">Active</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/10 text-xs text-left">
            <div className="space-y-0.5">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">মোবাইল নম্বর (ইউজারনেম)</p>
              <p className="font-mono font-bold text-slate-100">{pat.phone || 'N/A'}</p>
            </div>
            <div className="space-y-1 text-left">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">লগইন পাসওয়ার্ড (PIN)</p>
              
              {!isChangingPass ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold text-slate-100 bg-white/10 px-2 py-1 rounded text-xs border border-white/10">
                    {currentPass}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="text-[9px] font-bold bg-white/20 hover:bg-white/30 text-white px-2 py-1 rounded-md transition-all cursor-pointer"
                    title="পাসওয়ার্ড কপি করুন"
                  >
                    {copiedPass ? '✓ কপি হয়েছে' : '📋 কপি'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewPassInput(currentPass);
                      setIsChangingPass(true);
                    }}
                    className="text-[9px] font-bold bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-md transition-all cursor-pointer"
                    title="পাসওয়ার্ড পরিবর্তন করুন"
                  >
                    ✏️ পরিবর্তন
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={newPassInput}
                      onChange={(e) => setNewPassInput(e.target.value)}
                      placeholder="নতুন পাসওয়ার্ড দিন..."
                      className="bg-white/10 border border-white/20 text-white font-mono text-xs px-2.5 py-1 rounded-lg outline-none focus:ring-1 focus:ring-blue-400 w-36"
                    />
                    <button
                      type="button"
                      disabled={isUpdatingPass}
                      onClick={handleSavePassword}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                    >
                      {isUpdatingPass ? '...' : 'সংরক্ষণ'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsChangingPass(false)}
                      className="bg-white/10 hover:bg-white/20 text-white text-[9px] px-2 py-1.5 rounded-lg transition-all cursor-pointer"
                    >
                      বাতিল
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewPassInput('123456')}
                    className="text-[8px] text-indigo-300 underline hover:text-indigo-200"
                  >
                    ডিফল্ট "123456" সেট করুন
                  </button>
                </div>
              )}
            </div>
          </div>

          {pat.referred_by_code && (
            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-left">
              <div>
                <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest">নিবন্ধিত হয়েছেন যার মাধ্যমে (Rural Doctor)</p>
                <p className="font-extrabold text-indigo-100 mt-0.5">
                  👨‍⚕️ {recommender ? recommender.full_name : 'অজানা পল্লী চিকিৎসক'}
                </p>
              </div>
              <span className="bg-indigo-600 text-white font-mono text-[9px] font-black px-2.5 py-1 rounded-xl">
                Code: {pat.referred_by_code}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Patient Appointments History */}
      <div className="space-y-3 text-left">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
          📅 অ্যাপয়েন্টমেন্টের ইতিহাস ({patApps.length})
        </h4>
        {patApps.length === 0 ? (
          <p className="text-xs text-slate-400 font-bold bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
            কোনো অ্যাপয়েন্টমেন্টের ইতিহাস পাওয়া যায়নি।
          </p>
        ) : (
          <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
            {patApps.map((app: any) => (
              <div key={app.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-left">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="text-xs font-black text-slate-800">{app.doctor_name || 'ডাক্তার অ্যাপয়েন্টমেন্ট'}</h5>
                    <p className="text-[10px] text-slate-500 font-bold">📅 তারিখ: {app.date || app.appointment_date || 'N/A'}</p>
                  </div>
                  <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                    app.status === 'visited' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                    app.status === 'absent' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                    'bg-amber-100 text-amber-800 border-amber-200'
                  }`}>
                    {app.status === 'visited' ? '✓ দেখিয়েছেন' : app.status === 'absent' ? '✕ আসেননি' : '⏳ পেন্ডিং'}
                  </span>
                </div>

                <div className="flex gap-2 pt-1 border-t border-slate-200/60">
                  <button
                    type="button"
                    onClick={() => onUpdateAppointmentStatus?.(app.id, 'visited')}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${
                      app.status === 'visited'
                        ? 'bg-emerald-600 text-white font-extrabold'
                        : 'bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700'
                    }`}
                  >
                    ✓ দেখিয়েছেন
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateAppointmentStatus?.(app.id, 'absent')}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${
                      app.status === 'absent'
                        ? 'bg-rose-600 text-white font-extrabold'
                        : 'bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700'
                    }`}
                  >
                    ✕ আসেননি
                  </button>
                  {app.status !== 'pending' && (
                    <button
                      type="button"
                      onClick={() => onUpdateAppointmentStatus?.(app.id, 'pending')}
                      className="px-2.5 py-1.5 rounded-xl text-[9px] font-black bg-slate-100 hover:bg-slate-200 text-slate-500 transition-all"
                      title="রিসেট"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// --- Admin Dashboard Component ---
const AdminDashboard: React.FC<{ 
  profile: Profile, 
  onLogout: () => void, 
  ticker: string, 
  setTicker: (val: string) => void, 
  onUpdateTicker: () => void,
  doctors: Doctor[],
  hospitals: Clinic[],
  labTests: LabTest[],
  orders: Order[],
  profiles: Profile[],
  appointments: any[],
  onAdd: (type: 'doctor' | 'hospital' | 'lab_test') => void,
  onEdit: (type: 'doctor' | 'hospital' | 'lab_test', item: any) => void,
  onDelete: (type: 'doctor' | 'hospital' | 'lab_test', id: string) => void,
  onRefreshAdminData?: () => Promise<void>,
  onUpdateAppointmentStatus?: (appId: string, status: 'pending' | 'visited' | 'absent') => Promise<void>,
  onUpdateOrderStatus?: (orderId: string, status: 'pending' | 'verified' | 'completed' | 'cancelled') => Promise<void>,
  quizzes?: any[],
  submissions?: any[],
  withdrawals?: any[],
  onAddQuiz?: (videoTitle: string, uploadDate: string, question: string, prizeAmount: number, answerHint?: string) => Promise<void>,
  onUpdateSubmissionStatus?: (submissionId: string, status: 'correct' | 'incorrect', userId: string, prizeAmount: number) => Promise<void>,
  onUpdateWithdrawalStatus?: (withdrawalId: string, status: 'completed' | 'rejected', userId: string, amount: number) => Promise<void>,
  isLabTestsServiceEnabled?: boolean,
  onToggleGlobalLabTestsService?: (enabled: boolean) => Promise<void>,
  onToggleTestActive?: (test: LabTest) => Promise<void>,
  onCouponsUpdated?: () => void,
}> = ({ profile, onLogout, ticker, setTicker, onUpdateTicker, doctors, hospitals, labTests, orders, profiles, appointments, onAdd, onEdit, onDelete, onRefreshAdminData, onUpdateAppointmentStatus, onUpdateOrderStatus, quizzes = [], submissions = [], withdrawals = [], onAddQuiz, onUpdateSubmissionStatus, onUpdateWithdrawalStatus, isLabTestsServiceEnabled = true, onToggleGlobalLabTestsService, onToggleTestActive, onCouponsUpdated }) => {
  const [activeSubTab, setActiveSubTab] = useState<'today_apps' | 'overview' | 'doctors' | 'orders' | 'hospitals' | 'labtests' | 'coupons' | 'billing' | 'referrals' | 'patients' | 'quizzes' | 'withdrawals' | 'free_doctors' | 'maternity_donation' | 'subscriptions' | 'doctor_portal'>('today_apps');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);

  // States for Today's Doctor Appointments List
  const [todayAppsFilter, setTodayAppsFilter] = useState<'today' | 'all'>('today');
  const [todayAppsStatus, setTodayAppsStatus] = useState<'all' | 'pending' | 'visited' | 'absent'>('all');
  const [todayAppsSearch, setTodayAppsSearch] = useState('');

  // Search states for Rural Doctors and Patients
  const [rdSearchQuery, setRdSearchQuery] = useState('');
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // Search & Filter state for Admin Doctor Specialists List
  const [adminDoctorSearch, setAdminDoctorSearch] = useState('');
  const [adminDoctorSpecialtyFilter, setAdminDoctorSpecialtyFilter] = useState('all');

  useEffect(() => {
    if (onRefreshAdminData) {
      onRefreshAdminData();
    }
  }, [onRefreshAdminData]);

  const filteredAdminDoctors = useMemo(() => {
    return doctors.filter(d => {
      // Specialty Filter
      if (adminDoctorSpecialtyFilter !== 'all') {
        const docSpec = (d.specialty || '').toLowerCase();
        const filterSpec = adminDoctorSpecialtyFilter.toLowerCase();
        if (filterSpec === 'dentistry') {
          const isDentistry = docSpec.includes('dent') || docSpec.includes('দন্ত') || docSpec.includes('ডেন্টাল') || (d.degree || '').toLowerCase().includes('বি.ডি.এস') || (d.degree || '').toLowerCase().includes('দন্ত');
          if (!isDentistry) return false;
        } else if (!docSpec.includes(filterSpec)) {
          return false;
        }
      }

      // Search Query
      if (adminDoctorSearch.trim()) {
        const q = adminDoctorSearch.trim().toLowerCase();
        const nameMatch = (d.name || '').toLowerCase().includes(q);
        const degreeMatch = (d.degree || '').toLowerCase().includes(q);
        const specialtyMatch = (d.specialty || '').toLowerCase().includes(q);
        const scheduleMatch = (d.schedule || '').toLowerCase().includes(q);
        const districtMatch = (d.districts || []).some(dist => dist.toLowerCase().includes(q));
        const clinicMatch = (d.clinics || []).some(cid => {
          const h = hospitals.find(hp => hp.id === cid);
          return h && (h.name.toLowerCase().includes(q) || h.address.toLowerCase().includes(q));
        });
        return nameMatch || degreeMatch || specialtyMatch || scheduleMatch || districtMatch || clinicMatch;
      }

      return true;
    });
  }, [doctors, hospitals, adminDoctorSearch, adminDoctorSpecialtyFilter]);

  // Helper date for today's appointment comparison
  const todayISO = useMemo(() => new Date().toISOString().split('T')[0], []);

  const isTodayApp = useCallback((app: any) => {
    if (app.date) {
      if (app.date === todayISO) return true;
      if (typeof app.date === 'string' && app.date.includes(todayISO)) return true;
    }
    if (app.created_at) {
      let d: Date | null = null;
      if (typeof app.created_at === 'string') d = new Date(app.created_at);
      else if (app.created_at?.seconds) d = new Date(app.created_at.seconds * 1000);
      if (d && !isNaN(d.getTime())) {
        if (d.toISOString().split('T')[0] === todayISO) return true;
      }
    }
    return false;
  }, [todayISO]);

  const todayAppointmentsList = useMemo(() => {
    return appointments.filter(isTodayApp);
  }, [appointments, isTodayApp]);

  const displayedTodayApps = useMemo(() => {
    let list = todayAppsFilter === 'today' ? todayAppointmentsList : appointments;

    if (todayAppsStatus !== 'all') {
      if (todayAppsStatus === 'pending') {
        list = list.filter(a => a.status === 'pending' || !a.status);
      } else {
        list = list.filter(a => a.status === todayAppsStatus);
      }
    }

    if (todayAppsSearch.trim()) {
      const q = todayAppsSearch.trim().toLowerCase();
      list = list.filter(a =>
        (a.patient_name || '').toLowerCase().includes(q) ||
        (a.patient_phone || '').toLowerCase().includes(q) ||
        (a.doctor_name || '').toLowerCase().includes(q) ||
        (a.doctor_specialty || '').toLowerCase().includes(q) ||
        (a.referred_by_code || '').toLowerCase().includes(q) ||
        (a.problems || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [appointments, todayAppointmentsList, todayAppsFilter, todayAppsStatus, todayAppsSearch]);

  // States for Admin's Rural Doctor Registration Engine
  const [rdName, setRdName] = useState('');
  const [rdPhone, setRdPhone] = useState('');
  const [rdPass, setRdPass] = useState('123456');
  const [rdCode, setRdCode] = useState('');
  const [isCreatingRD, setIsCreatingRD] = useState(false);
  const [createdRDSuccess, setCreatedRDSuccess] = useState<{ name: string, phone: string, pass: string, code: string } | null>(null);
  const [rdError, setRdError] = useState<string | null>(null);

  // Admin Quiz Form states
  const [newQuizVideoTitle, setNewQuizVideoTitle] = useState('');
  const [newQuizUploadDate, setNewQuizUploadDate] = useState('');
  const [newQuizQuestion, setNewQuizQuestion] = useState('');
  const [newQuizAnswerHint, setNewQuizAnswerHint] = useState('');
  const [newQuizPrizeAmount, setNewQuizPrizeAmount] = useState('50');
  const [quizSubTab, setQuizSubTab] = useState<'manage' | 'participants'>('manage');
  const [selectedQuizDate, setSelectedQuizDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const filteredRDs = useMemo(() => {
    const rds = profiles.filter(p => p.role === UserRole.RURAL_DOCTOR);
    if (!rdSearchQuery.trim()) return rds;
    const query = rdSearchQuery.toLowerCase().trim();
    return rds.filter(r => 
      (r.full_name || '').toLowerCase().includes(query) || 
      (r.referral_code || '').toLowerCase().includes(query) ||
      (r.phone || '').includes(query)
    );
  }, [profiles, rdSearchQuery]);

  const filteredPatients = useMemo(() => {
    const pts = profiles.filter(p => p.role === UserRole.PATIENT || !p.role || (p.role !== UserRole.ADMIN && p.role !== UserRole.DOCTOR && p.role !== UserRole.RURAL_DOCTOR));
    if (!patientSearchQuery.trim()) return pts;
    const query = patientSearchQuery.toLowerCase().trim();
    return pts.filter(p => 
      (p.full_name || '').toLowerCase().includes(query) || 
      (p.phone || '').includes(query) ||
      (p.referred_by_code || '').toLowerCase().includes(query)
    );
  }, [profiles, patientSearchQuery]);

  const lastRDCode = useMemo(() => {
    const rds = profiles.filter(p => p.role === UserRole.RURAL_DOCTOR);
    let maxNum = 500;
    rds.forEach(r => {
      if (r.referral_code && r.referral_code.toUpperCase().startsWith('RD')) {
        const num = parseInt(r.referral_code.toUpperCase().replace('RD', ''), 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });
    return `RD${maxNum + 1}`;
  }, [profiles]);

  useEffect(() => {
    if (!rdCode || rdCode.startsWith('RD')) {
      setRdCode(lastRDCode);
    }
  }, [lastRDCode]);

  const [isFixingPasswords, setIsFixingPasswords] = useState(false);

  const handleUpdatePatientPassword = async (patientId: string, newPass: string) => {
    try {
      await updateDoc(doc(db, 'profiles', patientId), {
        created_password: newPass
      });
      alert(`পাসওয়ার্ড সফলভাবে আপডেট করা হয়েছে! নতুন পাসওয়ার্ড: ${newPass}`);
      if (onRefreshAdminData) {
        await onRefreshAdminData();
      }
    } catch (err: any) {
      console.error("Error updating patient password:", err);
      alert('পাসওয়ার্ড আপডেট করতে সমস্যা হয়েছে: ' + (err.message || 'Error'));
    }
  };

  const handleFixAllPasswords = async () => {
    const missingProfiles = profiles.filter(p => (p.role === UserRole.PATIENT || !p.role || (p.role !== UserRole.ADMIN && p.role !== UserRole.DOCTOR && p.role !== UserRole.RURAL_DOCTOR)) && !p.created_password && !(p as any).password);
    if (missingProfiles.length === 0) {
      alert('সকল রোগীর প্রোফাইলে ইতিমধ্যে পাসওয়ার্ড সেট করা রয়েছে!');
      return;
    }
    if (!window.confirm(`মোট ${missingProfiles.length} জন রোগীর প্রোফাইলে কোনো পাসওয়ার্ড সেট করা নেই। আপনি কি এদের পাসওয়ার্ড হিসেবে ডিফল্ট "123456" সেট করতে চান?`)) {
      return;
    }
    setIsFixingPasswords(true);
    let updatedCount = 0;
    try {
      for (const p of missingProfiles) {
        try {
          await updateDoc(doc(db, 'profiles', p.id), {
            created_password: '123456'
          });
          updatedCount++;
        } catch (e) {
          console.warn("Failed to update profile", p.id, e);
        }
      }
      alert(`মোট ${updatedCount} জন রোগীর প্রোফাইলে সফলভাবে "123456" পাসওয়ার্ড সেট করা হয়েছে!`);
      if (onRefreshAdminData) {
        await onRefreshAdminData();
      }
    } catch (err: any) {
      alert('সমস্যা হয়েছে: ' + (err.message || 'Error'));
    } finally {
      setIsFixingPasswords(false);
    }
  };

  const handleCreateRuralDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setRdError(null);
    setCreatedRDSuccess(null);

    const name = rdName.trim();
    const phone = rdPhone.trim();
    const pass = rdPass.trim();
    const code = rdCode.trim().toUpperCase();

    if (!name || !phone || !pass || !code) {
      setRdError('সবগুলো তথ্য বিবরণী সঠিকভাবে পূরণ করুন।');
      return;
    }

    // Validate that rural doctor name is in English only (letters, spaces, dots, dashes, parentheses)
    const isEnglish = /^[A-Za-z0-9\s.,()'-]+$/.test(name);
    if (!isEnglish) {
      setRdError('পল্লী চিকিৎসকের নাম অবশ্যই ইংরেজিতে (English) হতে হবে। বাংলায় বা অন্য কোনো অক্ষরে নাম গ্রহণযোগ্য নয়।');
      return;
    }

    if (phone.length !== 11 || !phone.startsWith('01')) {
      setRdError('সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017xxxxxxxx)।');
      return;
    }

    if (pass.length < 6) {
      setRdError('লগইন পাসওয়ার্ড ন্যূনতম ৬ ডিজিটের হতে হবে।');
      return;
    }

    const codeExists = profiles.some(p => p.referral_code?.toUpperCase() === code);
    if (codeExists) {
      setRdError(`এই কোডটি (${code}) ইতিমধ্যে অন্য চিকিৎসকের জন্য ব্যবহৃত হচ্ছে। আলাদা কোড ব্যবহার করুন।`);
      return;
    }

    setIsCreatingRD(true);
    let tempAppRef: any = null;

    try {
      const appOptions = auth.app.options;
      const tempAppName = `TempRDApp-${Date.now()}`;
      tempAppRef = initializeApp(appOptions, tempAppName);
      const tempAuth = getTempAuth(tempAppRef);

      const normalizedEmail = `${phone}@nilpha.com`;
      let userId = '';

      try {
        const credential = await createUserWithEmailAndPassword(tempAuth, normalizedEmail, pass);
        userId = credential.user.uid;
      } catch (authErr: any) {
        console.warn("TempAuth createUser error, fallback to custom ID:", authErr?.message || authErr);
        userId = 'rd_' + phone.replace(/[^0-9]/g, '') + '_' + Date.now();
      }

      const newRCProfile: Profile = {
        id: userId,
        full_name: name,
        phone: phone,
        role: UserRole.RURAL_DOCTOR,
        status: 'active',
        referral_code: code,
        created_password: pass
      };

      await setDoc(doc(db, 'profiles', userId), newRCProfile);

      await signTempOut(tempAuth);

      setCreatedRDSuccess({
        name,
        phone,
        pass,
        code
      });

      setRdName('');
      setRdPhone('');
      setRdPass('123456');
      setRdCode('');

      if (onRefreshAdminData) {
        await onRefreshAdminData();
      }
    } catch (err: any) {
      console.error("Create RD error:", err);
      setRdError(err.message || 'অ্যাকাউন্ট তৈরি করার সময় একটি সমস্যা হয়েছে।');
    } finally {
      if (tempAppRef) {
        try {
          await deleteApp(tempAppRef);
        } catch (delErr) {
          console.error("Temp App delete fail:", delErr);
        }
      }
      setIsCreatingRD(false);
    }
  };

  // States for Admin's Specialist Doctor Account Creation Engine
  const [docName, setDocName] = useState('');
  const [docPhone, setDocPhone] = useState('');
  const [docPass, setDocPass] = useState('123456');
  const [docBmdc, setDocBmdc] = useState('');
  const [docSpecialty, setDocSpecialty] = useState('মেডিসিন বিশেষজ্ঞ (Medicine)');
  const [docDegree, setDocDegree] = useState('MBBS, BCS (Health), FCPS');
  const [docChamber, setDocChamber] = useState('নীলফামারী আধুনিক ডিজিটাল হেলথ সেন্টার');
  const [docFee, setDocFee] = useState('500');
  const [docIsVideo, setDocIsVideo] = useState(true);
  const [isCreatingDoc, setIsCreatingDoc] = useState(false);
  const [createdDocSuccess, setCreatedDocSuccess] = useState<{ name: string, phone: string, pass: string, bmdc: string, specialty: string } | null>(null);
  const [docCreateError, setDocCreateError] = useState<string | null>(null);
  const [selectedDoctorForPortalPreview, setSelectedDoctorForPortalPreview] = useState<Profile | null>(null);
  const [docPortalPreviewOpen, setDocPortalPreviewOpen] = useState(false);
  const [doctorAccountSearch, setDoctorAccountSearch] = useState('');

  const doctorProfiles = useMemo(() => {
    return profiles.filter(p => p.role === UserRole.DOCTOR);
  }, [profiles]);

  const filteredDoctorProfiles = useMemo(() => {
    if (!doctorAccountSearch.trim()) return doctorProfiles;
    const q = doctorAccountSearch.toLowerCase().trim();
    return doctorProfiles.filter(p => 
      (p.full_name || '').toLowerCase().includes(q) ||
      (p.phone || '').includes(q)
    );
  }, [doctorProfiles, doctorAccountSearch]);

  const handleCreateDoctorAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDocCreateError(null);
    setCreatedDocSuccess(null);

    const name = docName.trim();
    const phone = docPhone.trim();
    const pass = docPass.trim();
    const bmdc = docBmdc.trim();
    const specialty = docSpecialty.trim();
    const degree = docDegree.trim();
    const chamber = docChamber.trim();
    const fee = parseInt(docFee, 10) || 500;

    if (!name || !phone || !pass) {
      setDocCreateError('ডাক্তারের নাম, মোবাইল নম্বর এবং পাসওয়ার্ড পূরণ করুন।');
      return;
    }

    if (phone.length !== 11 || !phone.startsWith('01')) {
      setDocCreateError('সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017xxxxxxxx)।');
      return;
    }

    if (pass.length < 6) {
      setDocCreateError('লগইন পাসওয়ার্ড ন্যূনতম ৬ অক্ষরের হতে হবে।');
      return;
    }

    setIsCreatingDoc(true);
    let tempAppRef: any = null;

    try {
      const appOptions = auth.app.options;
      const tempAppName = `TempDocApp-${Date.now()}`;
      tempAppRef = initializeApp(appOptions, tempAppName);
      const tempAuth = getTempAuth(tempAppRef);

      const normalizedEmail = `${phone}@nilpha.com`;
      let userId: string | null = null;

      // Check existing profile in local state
      const existingProfile = profiles.find(p => p.phone === phone);
      if (existingProfile) {
        userId = existingProfile.id;
      }

      try {
        const credential = await createUserWithEmailAndPassword(tempAuth, normalizedEmail, pass);
        userId = credential.user.uid;
      } catch (authErr: any) {
        if (authErr.code === 'auth/email-already-in-use') {
          // Account already exists in Firebase Auth, attempt sign in to update credentials & role
          try {
            const loginCred = await signInWithEmailAndPassword(tempAuth, normalizedEmail, pass);
            userId = loginCred.user.uid;
          } catch (signInErr: any) {
            // If sign in with new pass failed, try with old created_password if available or default
            if (existingProfile?.created_password) {
              try {
                const retryCred = await signInWithEmailAndPassword(tempAuth, normalizedEmail, existingProfile.created_password);
                userId = retryCred.user.uid;
                if (retryCred.user && pass) {
                  await updatePassword(retryCred.user, pass);
                }
              } catch (retryErr) {
                console.warn("Could not sign into existing auth user with old password:", retryErr);
              }
            }
          }
        } else {
          console.warn("TempAuth error, continuing with profile update:", authErr?.message || authErr);
          if (!userId) {
            userId = 'pat_' + phone.replace(/[^0-9]/g, '') + '_' + Date.now();
          }
        }
      }

      // If userId is still not determined, query Firestore profiles collection
      if (!userId) {
        try {
          const qSnap = await getDocs(query(collection(db, 'profiles'), where('phone', '==', phone)));
          if (!qSnap.empty) {
            userId = qSnap.docs[0].id;
          }
        } catch (queryErr) {
          console.warn("Error querying profiles for phone:", queryErr);
        }
      }

      // Fallback ID if still not found
      if (!userId) {
        userId = `doc-user-${phone}`;
      }

      const newDocProfile: Partial<Profile> = {
        id: userId,
        full_name: name,
        phone: phone,
        role: UserRole.DOCTOR,
        status: 'active',
        created_password: pass,
        district: 'নীলফামারী'
      };

      await setDoc(doc(db, 'profiles', userId), newDocProfile, { merge: true });

      // Also add/update doctor in public doctors list
      const docSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      const existingDocRecord = doctors.find(d => d.phone === phone || d.user_id === userId);
      const doctorDocId = existingDocRecord ? existingDocRecord.id : `doc-${userId.substring(0, 8)}`;

      const newDocRecord: any = {
        id: doctorDocId,
        name,
        slug: docSlug || `doc-${Date.now()}`,
        degree: degree || 'MBBS, FCPS',
        specialty: specialty || 'মেডিসিন',
        districts: ['নীলফামারী', 'রংপুর'],
        clinics: existingDocRecord?.clinics || [],
        schedule: existingDocRecord?.schedule || 'প্রতিদিন সকাল ১০টা - রাত ৮টা (অনলাইন কনসালটেশন)',
        availableToday: true,
        rating: existingDocRecord?.rating || 5,
        image: existingDocRecord?.image || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80',
        isVideoConsultant: docIsVideo,
        consultationFee: fee,
        phone: phone,
        bmdcReg: bmdc || 'A-10824',
        chamber: chamber || 'নীলফামারী ডিজিটাল হেলথ সেন্টার',
        created_password: pass,
        user_id: userId
      };

      await setDoc(doc(db, 'doctors', doctorDocId), newDocRecord, { merge: true });

      await signTempOut(tempAuth);

      setCreatedDocSuccess({
        name,
        phone,
        pass,
        bmdc: bmdc || 'A-10824',
        specialty
      });

      setDocName('');
      setDocPhone('');
      setDocPass('123456');
      setDocBmdc('');

      if (onRefreshAdminData) {
        await onRefreshAdminData();
      }
    } catch (err: any) {
      console.error("Create Doctor error:", err);
      setDocCreateError(err.message || 'ডাক্তার অ্যাকাউন্ট তৈরি করতে সমস্যা হয়েছে।');
    } finally {
      if (tempAppRef) {
        try {
          await deleteApp(tempAppRef);
        } catch (delErr) {
          console.error("Temp App delete fail:", delErr);
        }
      }
      setIsCreatingDoc(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-slate-900 text-white p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl -mr-10 -mt-10" />
        <div className="flex justify-between items-center relative z-10">
          <div>
            <h1 className="text-xl font-black uppercase tracking-tighter">Admin Panel</h1>
            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">{profile.full_name}</p>
          </div>
          <button onClick={onLogout} className="bg-white/10 p-3 rounded-2xl hover:bg-white/20 transition-all active:scale-90">
             <X size={20} />
          </button>
        </div>
      </header>

      {/* Admin Navigation */}
      <div className="bg-white border-b px-6 flex gap-6 overflow-x-auto no-scrollbar">
        {[
          { id: 'today_apps', label: '📅 টুডে অ্যাপয়েন্টমেন্ট', icon: <Calendar size={14} className="text-amber-500" /> },
          { id: 'overview', label: 'Overview', icon: <Zap size={14} /> },
          { id: 'billing', label: 'Billing Builder', icon: <Percent size={14} /> },
          { id: 'doctors', label: 'Specialists', icon: <Stethoscope size={14} /> },
          { id: 'orders', label: 'Booking Orders', icon: <MessageSquare size={14} /> },
          { id: 'hospitals', label: 'Clinics', icon: <Microscope size={14} /> },
          { id: 'labtests', label: 'Manage Lab Tests', icon: <FileText size={14} /> },
          { id: 'coupons', label: '🎟️ কুপন কোড (Coupons)', icon: <Tag size={14} className="text-pink-500" /> },
          { id: 'referrals', label: 'Rural Doctors', icon: <BadgeCheck size={14} className="text-emerald-500" /> },
          { id: 'patients', label: 'Patient Search & Serials', icon: <User size={14} className="text-blue-500" /> },
          { id: 'quizzes', label: 'Quiz Admin', icon: <HelpCircle size={14} className="text-purple-500" /> },
          { id: 'withdrawals', label: 'Withdrawal Req', icon: <Wallet size={14} className="text-pink-500" /> },
          { id: 'free_doctors', label: '🎁 Free Tokens & Sponsor', icon: <Gift size={14} className="text-amber-500 animate-bounce" /> },
          { id: 'maternity_donation', label: '🤰 Maternity Donation (৳2000)', icon: <Baby size={14} className="text-rose-500 animate-pulse" /> },
          { id: 'subscriptions', label: '💳 Subscriptions (30% Discount)', icon: <CreditCard size={14} className="text-indigo-500" /> },
          { id: 'doctor_portal', label: '👨‍⚕️ ডক্টর পোর্টাল ও একাউন্ট', icon: <Stethoscope size={14} className="text-teal-500" /> }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`py-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-b-4 ${activeSubTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 p-6 space-y-8">
        {/* Today's Doctor Appointments Subtab */}
        {activeSubTab === 'today_apps' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-left-4 text-left">
            {/* Banner Header */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 p-6 rounded-[32px] text-white shadow-xl flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="bg-amber-400 text-slate-950 font-black text-[10px] uppercase px-3 py-1 rounded-full flex items-center gap-1.5 w-fit mb-2 shadow-sm">
                  <Calendar size={12} /> দৈনিক অনলাইন সিরিয়াল ট্র্যাকার
                </span>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  📅 টুডে ডাক্তার অ্যাপয়েন্টমেন্ট লিস্ট
                </h2>
                <p className="text-xs text-indigo-200 font-bold mt-1">
                  আজকের দিনে যেসকল রোগী অনলাইনের মাধ্যমে ডক্টর সিরিয়াল দিয়েছে তাদের দেখানোর নিশ্চিতকরণ প্যানেল।
                </p>
              </div>
              
              {/* Date Badge */}
              <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/15 text-right shrink-0">
                <p className="text-[10px] font-black uppercase text-indigo-300">আজকের তারিখ</p>
                <p className="text-sm font-black text-white">{new Date().toLocaleDateString('bn-BD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>

            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">আজকের মোট সিরিয়াল</p>
                <p className="text-2xl font-black text-slate-900">{todayAppointmentsList.length} জন</p>
              </div>
              <div className="bg-amber-50/70 p-5 rounded-[28px] border border-amber-200/80 shadow-sm">
                <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-1">⏳ পেন্ডিং (অপেক্ষমান)</p>
                <p className="text-2xl font-black text-amber-800">{todayAppointmentsList.filter(a => a.status === 'pending' || !a.status).length} জন</p>
              </div>
              <div className="bg-emerald-50/70 p-5 rounded-[28px] border border-emerald-200/80 shadow-sm">
                <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1">✅ সফল দেখিয়েছেন (ইয়েস)</p>
                <p className="text-2xl font-black text-emerald-800">{todayAppointmentsList.filter(a => a.status === 'visited').length} জন</p>
              </div>
              <div className="bg-rose-50/70 p-5 rounded-[28px] border border-rose-200/80 shadow-sm">
                <p className="text-[10px] font-black text-rose-700 uppercase tracking-widest mb-1">❌ বাতিল / আসেননি (নো)</p>
                <p className="text-2xl font-black text-rose-800">{todayAppointmentsList.filter(a => a.status === 'absent').length} জন</p>
              </div>
            </div>

            {/* Filter Controls & Search */}
            <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Scope filter */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setTodayAppsFilter('today')}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${todayAppsFilter === 'today' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    📅 আজকের সিরিয়াল ({todayAppointmentsList.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTodayAppsFilter('all')}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${todayAppsFilter === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    📋 সকল সিরিয়াল ({appointments.length})
                  </button>
                </div>

                {/* Status filter */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase text-slate-400 mr-1">স্ট্যাটাস:</span>
                  {[
                    { key: 'all', label: 'সব' },
                    { key: 'pending', label: '⏳ পেন্ডিং' },
                    { key: 'visited', label: '✅ দেখিয়েছেন' },
                    { key: 'absent', label: '❌ আসেননি/বাতিল' }
                  ].map(st => (
                    <button
                      key={st.key}
                      type="button"
                      onClick={() => setTodayAppsStatus(st.key as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${todayAppsStatus === st.key ? 'bg-slate-900 text-white font-black' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-4 top-3.5 text-slate-400" size={16} />
                <input
                  type="text"
                  value={todayAppsSearch}
                  onChange={e => setTodayAppsSearch(e.target.value)}
                  placeholder="রোগীর নাম, ফোন নম্বর, ডাক্তারের নাম, রেফারেল কোড অথবা সমস্যা দিয়ে খুঁজুন..."
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:border-blue-600 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* List of Appointments */}
            {displayedTodayApps.length === 0 ? (
              <div className="bg-white p-12 rounded-[32px] border border-slate-100 text-center space-y-2">
                <p className="text-3xl">🩺</p>
                <p className="text-sm font-black text-slate-700">কোনো অ্যাপয়েন্টমেন্ট পাওয়া যায়নি।</p>
                <p className="text-xs text-slate-400 font-bold">সার্চ বক্স অথবা ফিল্টার পরিবর্তন করে দেখুন।</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayedTodayApps.map((app, idx) => (
                  <div
                    key={app.id || idx}
                    className="bg-white p-5 rounded-[28px] border border-slate-200/80 shadow-sm space-y-4 hover:shadow-md transition-all text-left"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-[9px] font-black bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                          ডাক্তার তথ্য
                        </span>
                        <h4 className="font-black text-sm text-slate-900 mt-1 flex items-center gap-1.5">
                          👨‍⚕️ {app.doctor_name}
                        </h4>
                        <p className="text-xs font-extrabold text-blue-600">
                          {app.doctor_specialty}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-black px-3 py-1 rounded-xl uppercase tracking-wider ${
                          app.status === 'visited'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : app.status === 'absent'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                          {app.status === 'visited' ? '✅ দেখিয়েছেন' : app.status === 'absent' ? '❌ আসেননি/বাতিল' : '⏳ পেন্ডিং'}
                        </span>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1.5 text-xs font-bold text-slate-700">
                      <div className="grid grid-cols-2 gap-2">
                        <p><span className="text-slate-400 font-normal">রোগীর নাম:</span> <strong className="text-slate-900">{app.patient_name}</strong></p>
                        <p><span className="text-slate-400 font-normal">মোবাইল:</span> <strong className="font-mono text-slate-900">{app.patient_phone}</strong></p>
                        <p><span className="text-slate-400 font-normal">বয়স/ঠিকানা:</span> {app.patient_age ? `${app.patient_age} বছর` : ''} {app.patient_address ? `(${app.patient_address})` : ''}</p>
                        <p><span className="text-slate-400 font-normal">তারিখ:</span> <strong className="text-slate-900">{app.date}</strong></p>
                      </div>
                      {app.problems && (
                        <p className="pt-1 border-t border-slate-200/60 text-[11px]">
                          <span className="text-slate-400 font-normal">সমস্যা:</span> <span className="italic text-slate-800">{app.problems}</span>
                        </p>
                      )}
                      {app.referred_by_code && (
                        <p className="pt-1 border-t border-slate-200/60 text-[11px] text-purple-700 font-extrabold flex items-center justify-between">
                          <span>🏷️ রেফারার কোড: <strong className="bg-purple-100 px-2 py-0.5 rounded-md text-purple-900">{app.referred_by_code}</strong></span>
                          {app.referred_by_name && <span>({app.referred_by_name})</span>}
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2 pt-1">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        রোগী ডাক্তার দেখিয়েছেন কিনা আপডেট দিন:
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => onUpdateAppointmentStatus?.(app.id, 'visited')}
                          className={`py-3 px-3 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 ${
                            app.status === 'visited'
                              ? 'bg-emerald-600 text-white ring-2 ring-emerald-600/30 font-black'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          ✓ ইয়েস (দেখিয়েছেন)
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpdateAppointmentStatus?.(app.id, 'absent')}
                          className={`py-3 px-3 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 ${
                            app.status === 'absent'
                              ? 'bg-rose-600 text-white ring-2 ring-rose-600/30 font-black'
                              : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                          }`}
                        >
                          ✕ নো (আসেননি/ক্যান্সেল)
                        </button>
                      </div>
                      {app.status !== 'pending' && (
                        <button
                          type="button"
                          onClick={() => onUpdateAppointmentStatus?.(app.id, 'pending')}
                          className="w-full py-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                        >
                          ↺ পেন্ডিং এ রাখুন (Reset Status)
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeSubTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                 <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Total Specialists</p>
                 <p className="text-3xl font-black text-slate-800">{doctors.length}</p>
              </div>
              <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                 <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Hospitals</p>
                 <p className="text-3xl font-black text-slate-800">{hospitals.length}</p>
              </div>
            </div>

            {/* Ticker Management */}
            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 rounded-2xl text-red-600"><Zap size={20} fill="currentColor" /></div>
                <h3 className="font-black text-slate-800 uppercase tracking-tight">Ticker Message Control</h3>
              </div>
              <textarea 
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                className="w-full bg-slate-50 p-6 rounded-[32px] border-2 border-slate-100 focus:border-blue-500 outline-none text-sm font-medium leading-relaxed"
                rows={3}
                placeholder="ম্যাসেজটি এখানে লিখুন..."
              />
              <Button onClick={onUpdateTicker} className="w-full py-5 rounded-[28px] shadow-lg shadow-blue-500/20">
                Update Ticker Message
              </Button>
            </div>

            {/* Website Export Info */}
            <div className="bg-blue-600 p-8 rounded-[40px] text-white space-y-4">
               <h3 className="font-black uppercase tracking-tight flex items-center gap-2"><Smartphone size={20} /> Website Export Info</h3>
               <p className="text-[11px] font-medium leading-relaxed opacity-80">আপনি Hostinger-এ মেজবানি করার জন্য আপনার কোডটি 'Build' করে সেখানে আপলোড করতে পারেন। এতে আপনার কোনো খরচ হবে না।</p>
            </div>

            {/* Database Reset Section */}
            <div className="bg-rose-50 border-2 border-rose-100 p-8 rounded-[40px] space-y-4">
              <h3 className="font-black text-rose-600 uppercase tracking-tight flex items-center gap-2 underline decoration-rose-200">System Maintenance</h3>
              <p className="text-[11px] font-bold text-rose-900/60 leading-relaxed uppercase">সম্পূর্ণ ডাটাবেস রিসেট করে ডিফল্ট ডক্টর এবং হসপিটাল লিস্ট লোড করতে নিচের বাটনটি ব্যবহার করুন। এটি বর্তমানে থাকা সকল ম্যানুয়াল ডাটা মুছে ফেলবে।</p>
              <Button onClick={() => (window as any).seedDatabase()} variant="destructive" className="w-full py-5 rounded-[28px] shadow-lg shadow-rose-500/20">
                Clear & Reset Database (Default Seed)
              </Button>
            </div>
          </div>
        )}

        {activeSubTab === 'doctors' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 text-left">
            {/* Header & Main Actions */}
            <div className="flex flex-wrap justify-between items-center gap-3 bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm">
               <div>
                 <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                   🩺 Specialists & Doctor List ({doctors.length} জন)
                 </h2>
                 <p className="text-xs font-bold text-slate-500 mt-0.5">
                   ডাটাবেজে নিবন্ধিত সকল ডাক্তারের বিস্তারিত প্রোফাইল, সার্চ এবং এডিট কন্ট্রোল প্যানেল
                 </p>
               </div>
               <div className="flex items-center gap-2">
                 <button
                   type="button"
                   onClick={() => downloadDoctorsCSV(doctors, hospitals)}
                   className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all active:scale-95"
                 >
                   <Download size={14} /> ডাউনলোড CSV
                 </button>
                 <Button onClick={() => onAdd('doctor')} variant="success" className="px-5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-1.5">
                   + নতুন ডক্টর যুক্ত করুন
                 </Button>
               </div>
            </div>

            {/* Doctor Search & Specialty Filter Controls */}
            <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                {/* Search Bar Input */}
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-3.5 text-slate-400" size={16} />
                  <input
                    type="text"
                    value={adminDoctorSearch}
                    onChange={e => setAdminDoctorSearch(e.target.value)}
                    placeholder="ডাক্তারের নাম, পদবী, ডিপার্টমেন্ট (যেমন: Medicine, Dentistry), চেম্বার বা এলাকা লিখে খুঁজুন..."
                    className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:border-blue-600 focus:bg-white transition-all"
                  />
                  {adminDoctorSearch && (
                    <button
                      type="button"
                      onClick={() => setAdminDoctorSearch('')}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-1 rounded-full"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Specialty Dropdown Filter */}
                <div className="shrink-0 flex items-center gap-2">
                  <span className="text-xs font-black text-slate-500 whitespace-nowrap">ফিল্টার:</span>
                  <select
                    value={adminDoctorSpecialtyFilter}
                    onChange={e => setAdminDoctorSpecialtyFilter(e.target.value)}
                    className="px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:border-blue-600"
                  >
                    <option value="all">সকল ডিপার্টমেন্ট (All)</option>
                    <option value="Medicine">মেডিসিন (Medicine)</option>
                    <option value="dentistry">ডেন্টাল / দন্তরোগ (Dentistry)</option>
                    <option value="Gynecology">গাইনী ও স্ত্রীরোগ (Gynecology)</option>
                    <option value="Pediatrics">শিশু রোগ (Pediatrics)</option>
                    <option value="Orthopedics">অর্থোপেডিক্স (Orthopedics)</option>
                    <option value="Cardiology">হৃদরোগ (Cardiology)</option>
                    <option value="Dermatology">চর্ম ও যৌন (Dermatology)</option>
                    <option value="ENT">ই.এন.টি / নাক-কান-গলা (ENT)</option>
                    <option value="Eye">চক্ষু বিশেষজ্ঞ (Eye)</option>
                    <option value="Neurology">নিউরো মেডিসিন (Neurology)</option>
                  </select>
                </div>
              </div>

              {/* Quick Preset Filter Badges */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
                {[
                  { id: 'all', label: 'সব' },
                  { id: 'Medicine', label: '🩺 মেডিসিন' },
                  { id: 'dentistry', label: '🦷 ডেন্টাল' },
                  { id: 'Gynecology', label: '🤰 গাইনী' },
                  { id: 'Pediatrics', label: '👶 শিশু রোগ' },
                  { id: 'Orthopedics', label: '🦴 অর্থোপেডিক্স' },
                  { id: 'Cardiology', label: '❤️ কার্ডিওলজি' },
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setAdminDoctorSpecialtyFilter(item.id)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black tracking-tight whitespace-nowrap transition-all border ${
                      adminDoctorSpecialtyFilter === item.id
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Filter Counter Status */}
              <div className="flex justify-between items-center text-[11px] font-black text-slate-500 pt-1 border-t border-slate-100">
                <span>
                  ফলাফল: <span className="text-blue-600">{filteredAdminDoctors.length} জন</span> ডক্টর পাওয়া গেছে {doctors.length !== filteredAdminDoctors.length && `(মোট ${doctors.length} জন এর মধ্যে)`}
                </span>
                {(adminDoctorSearch || adminDoctorSpecialtyFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setAdminDoctorSearch('');
                      setAdminDoctorSpecialtyFilter('all');
                    }}
                    className="text-rose-600 hover:underline font-bold"
                  >
                    ফিল্টার রিসেট করুন
                  </button>
                )}
              </div>
            </div>

            {/* Doctor Items Grid / List */}
            {filteredAdminDoctors.length === 0 ? (
              <div className="bg-white p-12 rounded-[32px] border border-slate-100 text-center space-y-3">
                <span className="text-4xl">🔍</span>
                <h3 className="font-black text-slate-800 text-base">কোনো ডক্টর পাওয়া যায়নি!</h3>
                <p className="text-xs text-slate-500 font-bold max-w-sm mx-auto">
                  সার্চ কীওয়ার্ড বা ডিপার্টমেন্ট ফিল্টার পরিবর্তন করে চেষ্টা করুন।
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setAdminDoctorSearch('');
                    setAdminDoctorSpecialtyFilter('all');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white font-black text-xs rounded-xl shadow-md"
                >
                  সকল ডক্টর দেখুন
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredAdminDoctors.map(d => {
                  const chambers = d.clinics.map(cid => hospitals.find(h => h.id === cid)).filter(Boolean);
                  return (
                    <div 
                      key={d.id} 
                      className="bg-white p-5 rounded-[28px] border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-all text-left relative"
                    >
                      <div className="flex items-start gap-4">
                        <img 
                          src={d.image} 
                          className="w-16 h-20 rounded-2xl object-cover bg-slate-100 shrink-0 border shadow-xs" 
                          alt={d.name} 
                          referrerPolicy="no-referrer" 
                        />
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="bg-blue-50 text-blue-700 font-black text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wider border border-blue-200/50">
                              {d.specialty}
                            </span>
                            {d.availableToday && (
                              <span className="bg-emerald-50 text-emerald-700 font-black text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1 border border-emerald-200/50">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                আজ চেম্বার খোলা
                              </span>
                            )}
                            {d.isVideoConsultant && (
                              <span className="bg-purple-50 text-purple-700 font-black text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wider border border-purple-200/50">
                                📹 ভিডিও কল
                              </span>
                            )}
                          </div>

                          <h3 className="font-black text-base text-slate-900 leading-snug truncate">
                            {d.name}
                          </h3>
                          <p className="text-[10px] font-bold text-slate-600 leading-relaxed bg-slate-50 p-2 rounded-xl border border-slate-100 line-clamp-2">
                            {d.degree || 'কোনো পদবী উল্লেখ নেই'}
                          </p>

                          {chambers.length > 0 && (
                            <div className="pt-2 space-y-1">
                              {chambers.map(c => (
                                <div key={c?.id} className="flex items-center gap-1 text-[10px] font-bold text-slate-700">
                                  <Building size={12} className="text-blue-600 shrink-0" />
                                  <span className="truncate">{c?.name} - <span className="text-slate-400">{c?.address}</span></span>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-[10px] font-bold text-slate-500">
                            {d.schedule && (
                              <span className="flex items-center gap-1 text-slate-700">
                                <Clock size={11} className="text-amber-600 shrink-0" /> {d.schedule}
                              </span>
                            )}
                            {d.consultationFee !== undefined && (
                              <span className="flex items-center gap-1 font-black text-emerald-700">
                                💳 ফি: ৳{d.consultationFee}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons for Edit & Delete */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <span className="text-[9px] font-mono text-slate-400">ID: {d.id}</span>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => onEdit('doctor', d)} 
                            className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
                          >
                            <span>✏️</span> এডিট তথ্য (Edit Info)
                          </button>
                          <button 
                            onClick={() => onDelete('doctor', d.id)} 
                            className="px-3.5 py-2 bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
                          >
                            <X size={14} /> মুছুন
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeSubTab === 'hospitals' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="flex justify-between items-center">
               <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Clinics List</h2>
               <Button onClick={() => onAdd('hospital')} variant="success" className="px-6 py-2 rounded-xl text-[10px]">Add New</Button>
            </div>
            <div className="space-y-4">
              {hospitals.map(h => (
                <div key={h.id} className="bg-white p-4 rounded-[32px] border border-slate-100 flex justify-between items-center shadow-sm">
                  <div className="flex items-center gap-4">
                    <img src={h.image} className="w-12 h-12 rounded-2xl object-cover" referrerPolicy="no-referrer" />
                    <div>
                      <p className="text-sm font-black text-slate-800 leading-tight">{h.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{h.address}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => onEdit('hospital', h)} className="p-2 bg-slate-100 rounded-xl text-slate-600 hover:bg-blue-100 hover:text-blue-600 transition-all"><Zap size={14} /></button>
                    <button onClick={() => onDelete('hospital', h.id)} className="p-2 bg-slate-100 rounded-xl text-slate-600 hover:bg-red-100 hover:text-red-600 transition-all"><X size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSubTab === 'billing' && (
          <div className="animate-in fade-in slide-in-from-right-4">
            <AdminLabBillBuilder hospitals={hospitals} />
          </div>
        )}

        {activeSubTab === 'labtests' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 text-left">
            {/* Master Control: Only ONE single button for ON and OFF all tests */}
            <div className={`p-6 sm:p-7 rounded-[32px] border-2 shadow-lg transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-5 ${
              isLabTestsServiceEnabled 
                ? 'bg-gradient-to-br from-emerald-900 via-teal-950 to-slate-900 text-white border-emerald-500/50 shadow-emerald-950/30' 
                : 'bg-gradient-to-br from-rose-950 via-red-950 to-slate-950 text-white border-rose-500/50 shadow-rose-950/30'
            }`}>
              <div className="space-y-1.5 max-w-2xl">
                <div className="inline-flex items-center gap-2 bg-white/10 px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md">
                  <span className={`w-2.5 h-2.5 rounded-full ${isLabTestsServiceEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                  মাস্টার কন্ট্রোল সুইচ (একক বাটন)
                </div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
                  {isLabTestsServiceEnabled 
                    ? '🟢 সকল টেস্ট পাবলিক ও চালু রয়েছে (ALL TESTS ON)' 
                    : '🔴 সকল টেস্ট সম্পূর্ণ বন্ধ রয়েছে (ALL TESTS OFF)'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed">
                  {isLabTestsServiceEnabled 
                    ? 'অ্যাপের সাধারণ ভিজিটররা বর্তমানে সকল প্রকার ল্যাব টেস্ট দেখতে পাচ্ছেন ও অর্ডার করতে পারছেন। সব টেস্ট একসাথে বন্ধ করতে পাশের বাটনে ক্লিক করুন।' 
                    : 'বর্তমানে সাধারণ ব্যবহারকারীদের জন্য সব ধরনের টেস্ট বন্ধ রাখা হয়েছে। এক ক্লিকে পুনরায় সকল টেস্ট পাবলিক করতে পাশের বাটনে চাপুন।'}
                </p>
              </div>

              {/* শুধুমাত্র একটি বাটন অন এবং অফ করার জন্য */}
              <button
                type="button"
                onClick={() => onToggleGlobalLabTestsService && onToggleGlobalLabTestsService(!isLabTestsServiceEnabled)}
                className={`px-7 py-3.5 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider flex items-center gap-2.5 shadow-xl active:scale-95 transition-all shrink-0 select-none ${
                  isLabTestsServiceEnabled
                    ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-900/50 hover:shadow-rose-800'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-900/50 hover:shadow-emerald-800 animate-pulse'
                }`}
              >
                {isLabTestsServiceEnabled ? (
                  <>
                    <span className="text-base">🔴</span>
                    <span>সকল টেস্ট অফ করুন (Turn OFF)</span>
                  </>
                ) : (
                  <>
                    <span className="text-base">🟢</span>
                    <span>সকল টেস্ট অন করুন (Turn ON)</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Coupon Management Banner */}
            <div className="bg-gradient-to-r from-pink-50 via-purple-50 to-blue-50 p-5 rounded-[28px] border border-pink-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center font-black shrink-0">
                  <Tag size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">
                    🎟️ টেস্ট অর্ডারের জন্য শতকরা ডিসকাউন্ট কুপন কোড
                  </h4>
                  <p className="text-xs text-slate-600 font-medium">
                    এডমিন প্যানেল থেকে কুপন কোড (যেমন: TEST20, NILPHA15) তৈরি ও শতকরা (%) ছাড় নিয়ন্ত্রণ করুন।
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveSubTab('coupons')}
                className="px-5 py-2.5 bg-pink-600 hover:bg-pink-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-sm transition-all shrink-0"
              >
                কুপন পরিচালনা করুন →
              </button>
            </div>

            {/* Header & Add Button */}
            <div className="flex flex-wrap justify-between items-center gap-3 bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm">
               <div>
                 <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                   🧪 ল্যাব টেস্ট তালিকা ({labTests.length} টি)
                 </h2>
                 <p className="text-xs font-bold text-slate-500 mt-0.5">
                   {isLabTestsServiceEnabled 
                     ? 'মাস্টার সুইচ ON থাকায় সকল টেস্ট বর্তমানে পাবলিক রয়েছে' 
                     : 'মাস্টার সুইচ OFF থাকায় সকল টেস্ট বর্তমানে বন্ধ রয়েছে'}
                 </p>
               </div>
               <Button onClick={() => onAdd('lab_test')} variant="success" className="px-5 py-2.5 rounded-2xl text-xs font-black">
                 + Add New Test
               </Button>
            </div>

            {/* Tests List */}
            <div className="space-y-3">
              {labTests.map(t => {
                const finalPrice = t.discountPrice || t.price;
                return (
                  <div key={t.id} className="p-4 rounded-[28px] border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm transition-all bg-white border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-lg shrink-0 bg-blue-50 text-blue-600">
                        <Microscope size={20} />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-black text-slate-800 leading-tight">{t.name}</p>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                            isLabTestsServiceEnabled 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}>
                            {isLabTestsServiceEnabled ? '🟢 পাবলিক (ON)' : '🔴 বন্ধ (OFF)'}
                          </span>
                        </div>
                        <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">
                          ৳{finalPrice} {t.discountPrice && <span className="line-through text-slate-400 font-normal">৳{t.price}</span>} ({t.category || 'Pathology'})
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button onClick={() => onEdit('lab_test', t)} className="p-2 bg-slate-100 rounded-xl text-slate-600 hover:bg-blue-100 hover:text-blue-600 transition-all" title="Edit Test"><Zap size={14} /></button>
                      <button onClick={() => onDelete('lab_test', t.id)} className="p-2 bg-slate-100 rounded-xl text-slate-600 hover:bg-red-100 hover:text-red-600 transition-all" title="Delete Test"><X size={14} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Coupons Management Subtab */}
        {activeSubTab === 'coupons' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 text-left">
            <CouponManager onCouponsUpdated={onCouponsUpdated} />
          </div>
        )}

        {activeSubTab === 'orders' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 text-left">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
              <div>
                <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                  📦 অর্ডার ও পেমেন্ট রিকোয়েস্ট তালিকা ({orders.length})
                </h2>
                <p className="text-[11px] text-slate-500 font-bold mt-0.5">
                  সকল অনলাইন/ক্যাশ অর্ডার রিভিউ করুন এবং একসেপ্ট (Accept) বা ডিনাই (Deny) করুন।
                </p>
              </div>
              <button
                onClick={() => onRefreshAdminData && onRefreshAdminData()}
                className="px-3.5 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0"
              >
                🔄 রিফ্রেশ তালিকা
              </button>
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-20 space-y-4 bg-white rounded-3xl border border-slate-100 shadow-sm">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
                  <MessageSquare size={32} />
                </div>
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">কোনো অর্ডার পাওয়া যায়নি</p>
                <p className="text-[10px] text-slate-400 font-medium max-w-xs mx-auto">ব্যবহারকারীরা হোম সার্ভিস বা টেস্ট অর্ডার করলে এখানে সরাসরি জমা হবে।</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map(order => {
                  const statusBadgeColor = 
                    order.status === 'verified' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                    order.status === 'completed' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                    order.status === 'cancelled' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                    'bg-amber-100 text-amber-800 border-amber-200';

                  const statusLabel = 
                    order.status === 'verified' ? '✅ একসেপ্টেড (Verified)' :
                    order.status === 'completed' ? '🎉 সম্পন্ন (Completed)' :
                    order.status === 'cancelled' ? '❌ ডিনাই / বাতিল (Cancelled)' :
                    '⏳ পেন্ডিং রিভিউ';

                  const totalPay = (order.amount || 0) + (order.shipping || 0);

                  return (
                    <div key={order.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-md space-y-4 text-left">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border ${statusBadgeColor}`}>
                              {statusLabel}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">ID: {order.id?.substring(0, 8)}</span>
                          </div>
                          <h3 className="text-base font-black text-slate-800 mt-1">
                            👤 সেবা গ্রহীতা: {order.patient_name || order.sender_name}
                          </h3>
                        </div>

                        <div className="text-right">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">সর্বমোট মূল্য:</p>
                          <p className="text-lg font-black text-emerald-600">৳{totalPay} BDT</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-bold text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">পণ্যের বিবরণ / সার্ভিস</p>
                          <p className="font-extrabold text-slate-900">📝 {order.item_name}</p>
                          {order.hospital_name && (
                            <p className="text-[11px] text-blue-600 font-bold">🏥 {order.hospital_name}</p>
                          )}
                          <p className="text-[11px] text-slate-600 pt-1">
                            💰 সার্ভিস ফি: ৳{order.amount} | 🚗 ট্রান্সপোর্ট চার্জ: ৳{order.shipping || 0}
                          </p>
                          {order.coupon_code && (
                            <p className="text-[10px] text-pink-600 font-extrabold flex items-center gap-1 bg-pink-50 p-1.5 rounded-lg border border-pink-100">
                              🎟️ কুপন: <span className="font-mono font-black">{order.coupon_code}</span> ({order.coupon_discount_percent}% ছাড় - ৳{order.coupon_discount_amount || 0})
                            </p>
                          )}
                          {order.delivery_distance_label && (
                            <p className="text-[10px] text-indigo-600 font-black">
                              📍 দূরত্ব কাভারেজ: {order.delivery_distance_label}
                            </p>
                          )}
                        </div>

                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">গ্রাহকের ঠিকানা ও পেমেন্ট</p>
                          <p className="flex items-center gap-1.5 text-slate-800">
                            📱 মোবাইল: <a href={`tel:${order.sender_contact}`} className="text-blue-600 font-mono underline font-extrabold">{order.sender_contact}</a>
                          </p>
                          <p className="text-slate-800 flex items-start gap-1">
                            <span>📍 ঠিকানা:</span>
                            <span className="font-extrabold text-slate-900">{order.delivery_address || 'ঠিকানা দেওয়া হয়নি'}</span>
                          </p>
                          <p className="text-slate-600 pt-1">
                            💳 পেমেন্ট টাইপ: <span className="font-black uppercase text-indigo-700">{order.payment_type === 'offline' ? '💵 ক্যাশ অন সার্ভিস' : `📱 ${order.payment_method}`}</span>
                          </p>
                          {order.payment_type !== 'offline' && (
                            <p className="text-[11px] font-mono font-black text-rose-600">
                              🔑 TrxID: {order.trx_id}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* 30% Test Discount Subscriber Info & Hospital Notification Banner */}
                      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 p-3.5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div>
                          <span className="bg-indigo-600 text-white text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 w-fit mb-1 shadow-sm">
                            <CreditCard size={11} /> ৩০% টেস্ট ডিসকাউন্ট সাবস্ক্রাইবার যাচাই
                          </span>
                          <p className="text-xs font-black text-indigo-950">
                            {order.subscription_plan_name ? `প্যাকেজ: ${order.subscription_plan_name}` : 'অনলাইন সাবস্ক্রাইবার বা প্যাকেজ গ্রহণকারী'}
                          </p>
                          <p className="text-[10px] text-indigo-700 font-bold mt-0.5">
                            ⚠️ অ্যাডমিন করণীয়: এই টেস্ট অর্ডারের ক্ষেত্রে সংশ্লিষ্ট হাসপাতাল/ল্যাব কর্তৃপক্ষকে ৩০% ডিসকাউন্ট প্রযোজ্য রাখার জন্য অবগত করুন।
                          </p>
                        </div>
                        <a
                          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`[হাসপাতাল নোটিশ] রোগী: ${order.patient_name || order.sender_name}, ফোন: ${order.sender_contact} আমাদের ৩০% ডিসকাউন্ট সাবস্ক্রিপশনধারী গ্রাহক। টেস্ট: ${order.item_name} (হাসপাতাল: ${order.hospital_name || 'ল্যাব'}) এর জন্য ৩০% ডিসকাউন্ট প্রযোজ্য করতে অনুরোধ করা হচ্ছে।`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-sm shrink-0 active:scale-95 transition-all"
                        >
                          <span>💬 হাসপাতালকে WhatsApp এ জানান</span>
                        </a>
                      </div>

                      {/* Admin Decision Action Buttons */}
                      <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400">
                          যাচাই করে একসেপ্ট করুন বা ডিনাই করুন:
                        </p>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onUpdateOrderStatus && order.id && onUpdateOrderStatus(order.id, 'verified')}
                            disabled={order.status === 'verified'}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
                              order.status === 'verified'
                                ? 'bg-emerald-100 text-emerald-800 cursor-not-allowed opacity-80'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20 active:scale-95'
                            }`}
                          >
                            ✓ একসেপ্ট (Accept)
                          </button>

                          <button
                            type="button"
                            onClick={() => onUpdateOrderStatus && order.id && onUpdateOrderStatus(order.id, 'completed')}
                            disabled={order.status === 'completed'}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
                              order.status === 'completed'
                                ? 'bg-blue-100 text-blue-800 cursor-not-allowed opacity-80'
                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/20 active:scale-95'
                            }`}
                          >
                            🎉 সম্পন্ন (Complete)
                          </button>

                          <button
                            type="button"
                            onClick={() => onUpdateOrderStatus && order.id && onUpdateOrderStatus(order.id, 'cancelled')}
                            disabled={order.status === 'cancelled'}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
                              order.status === 'cancelled'
                                ? 'bg-rose-100 text-rose-800 cursor-not-allowed opacity-80'
                                : 'bg-rose-600 text-white hover:bg-rose-700 shadow-md shadow-rose-600/20 active:scale-95'
                            }`}
                          >
                            ✕ ডিনাই / বাতিল (Deny)
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeSubTab === 'referrals' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 text-left">
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Rural Doctors & Referrals ({profiles.filter(p => p.role === UserRole.RURAL_DOCTOR).length})</h2>
            
            {/* Top Stat Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-slate-900 text-white p-5 rounded-[28px] border border-slate-800 shadow-md">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">মোট পল্লী চিকিৎসক</p>
                <p className="text-2xl font-black text-indigo-400">{profiles.filter(p => p.role === UserRole.RURAL_DOCTOR).length} জন</p>
              </div>
              <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">মোট নিবন্ধিত রোগী</p>
                <p className="text-2xl font-black text-slate-800">{profiles.filter(p => p.role === UserRole.PATIENT || !p.role || (p.role !== UserRole.ADMIN && p.role !== UserRole.DOCTOR && p.role !== UserRole.RURAL_DOCTOR)).length} জন</p>
              </div>
              <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">রেফার করা সিরিয়াল</p>
                <p className="text-2xl font-black text-teal-600">{appointments.filter(a => a.referred_by_code).length} বার</p>
              </div>
              <div className="bg-white p-5 rounded-[28px] border-2 border-emerald-100 bg-emerald-50/20 shadow-sm">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">ডাক্তার দেখিয়েছেন (সফল)</p>
                <p className="text-2xl font-black text-emerald-700">{appointments.filter(a => a.referred_by_code && a.status === 'visited').length} জন</p>
              </div>
              <div className="bg-white p-5 rounded-[28px] border-2 border-rose-100 bg-rose-50/20 shadow-sm">
                <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">আসেননি বা রিজেক্ট (ব্যর্থ)</p>
                <p className="text-2xl font-black text-rose-700">{appointments.filter(a => a.referred_by_code && a.status === 'absent').length} জন</p>
              </div>
            </div>

            {/* Main Content Grid: 2 Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Premium Rural Doctor Registration Form (Specialized Profile Registry) */}
              <div className="lg:col-span-5 bg-gradient-to-br from-indigo-50/50 to-blue-50/30 p-6 rounded-[32px] border-2 border-indigo-100/80 shadow-md space-y-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded-md uppercase tracking-wider">Onboarding System</span>
                    <span className="text-[9px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-md uppercase tracking-wider">Secure PIN</span>
                  </div>
                  <h3 className="text-base font-black text-slate-800 uppercase tracking-tight mt-2 font-black leading-tight">পল্লী চিকিৎসক অ্যাকাউন্ট ক্রিয়েটর</h3>
                  <p className="text-[11px] text-slate-500 font-bold mt-1">রেফারেল-কোড ব্যবহারকারী চিকিৎসকদের বিশেষ ও পৃথক প্রোফাইল তৈরি করার সিকিউর প্যানেল।</p>
                </div>

                {rdError && (
                  <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl border border-rose-100 text-xs font-bold leading-relaxed">
                    ⚠️ {rdError}
                  </div>
                )}

                {createdRDSuccess ? (
                  <div className="bg-emerald-50 text-emerald-800 p-6 rounded-3xl border border-emerald-100 space-y-4 animate-in zoom-in-95">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black bg-emerald-600 text-white p-1 rounded-full">✓</span>
                      <h4 className="font-extrabold text-sm uppercase tracking-tight">সফলভাবে তৈরি হয়েছে!</h4>
                    </div>
                    <p className="text-[11px] font-bold text-emerald-700">পল্লী চিকিৎসকের লগইন এবং রেফারেল বিবরণী নিচে দেওয়া হলো। এটি কপি করে ওনার সাথে শেয়ার করুন:</p>
                    
                    <div className="bg-white/80 p-4 rounded-2xl border border-emerald-100 text-xs font-bold space-y-2 font-mono text-slate-700">
                      <p>👤 নাম: {createdRDSuccess.name}</p>
                      <p>📱 মোবাইল: {createdRDSuccess.phone}</p>
                      <p>🔑 পাসওয়ার্ড: {createdRDSuccess.pass}</p>
                      <p>🎟️ কোড: {createdRDSuccess.code}</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <button 
                        onClick={() => {
                          const text = `নিলফা (Nilpha) ডিজিটাল মেডিকেল প্ল্যাটফর্মে আপনার "পল্লী চিকিৎসক" অ্যাকাউন্ট তৈরি করা হয়েছে!\n\nনাম: ${createdRDSuccess.name}\nমোবাইল: ${createdRDSuccess.phone}\nপাসওয়ার্ড: ${createdRDSuccess.pass}\nরেফারেল কোড: ${createdRDSuccess.code}\n\nঅ্যাপ লিঙ্ক: https://nilpha.com`;
                          navigator.clipboard.writeText(text);
                          alert('কপি করা হয়েছে!');
                        }}
                        className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 py-3 rounded-2xl text-[10px] uppercase font-black tracking-wider transition-all"
                      >
                        📋 বিবরণী কপি করুন
                      </button>
                      <a 
                        href={`https://wa.me/?text=${encodeURIComponent(`নিলফা (Nilpha) ডিজিটাল মেডিকেল প্ল্যাটফর্মে আপনার "পল্লী চিকিৎসক" অ্যাকাউন্ট তৈরি করা হয়েছে!\n\nনাম: ${createdRDSuccess.name}\nমোবাইল: ${createdRDSuccess.phone}\nপাসওয়ার্ড: ${createdRDSuccess.pass}\nরেফারেল কোড: ${createdRDSuccess.code}\n\nঅ্যাপ লিঙ্ক: https://nilpha.com`)}`}
                        target="_blank"
                        referrerPolicy="no-referrer"
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-center py-3 rounded-2xl text-[10px] uppercase font-black tracking-wider transition-all flex items-center justify-center gap-1"
                      >
                        💬 হোয়াটসঅ্যাপ করুন
                      </a>
                    </div>

                    <button 
                      onClick={() => setCreatedRDSuccess(null)}
                      className="w-full text-center text-[10px] font-black uppercase text-indigo-600 hover:underline pt-2 block"
                    >
                      আরেকটি অ্যাকাউন্ট তৈরি করুন
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleCreateRuralDoctor} className="space-y-4">
                    <Input 
                      label="চিকিৎসকের পূর্ণ নাম (Full Name)" 
                      placeholder="যেমন: ডাঃ আব্দুর রহমান" 
                      value={rdName}
                      onChange={setRdName}
                      required
                    />

                    <Input 
                      label="১১ ডিজিটের মোবাইল নম্বর" 
                      placeholder="যেমন: 017xxxxxxxx" 
                      value={rdPhone}
                      onChange={setRdPhone}
                      required
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <Input 
                        label="লগইন পাসওয়ার্ড (PIN)" 
                        placeholder="ন্যূনতম ৬ ডিজিট" 
                        value={rdPass}
                        onChange={setRdPass}
                        required
                      />
                      <Input 
                        label="রেফারেল কোড (Unique RD Code)" 
                        placeholder="যেমন: RD501" 
                        value={rdCode}
                        onChange={setRdCode}
                        required
                      />
                    </div>

                    <div className="bg-slate-100 p-3 rounded-2xl text-[10px] text-slate-500 font-bold leading-relaxed border border-slate-200">
                      💡 **কোড ব্যবহারের নিয়ম**: এই কোডটি ব্যবহার করে রোগীরা স্বয়ংক্রিয়ভাবে অ্যাকাউন্ট খুলতে পারবেন। তাছাড়া পল্লী চিকিৎসক বা এই কোড ব্যবহারকারী রেজিষ্ট্রেশন করলে ওনার প্রোফাইল ও তালিকা আলাদাভাবে ট্র্যাকিং করা যাবে।
                    </div>

                    <button
                      type="submit"
                      disabled={isCreatingRD}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-2xl font-black text-xs uppercase tracking-wider shadow-md transition-all active:scale-95 disabled:opacity-50"
                    >
                      {isCreatingRD ? 'অ্যাকাউন্ট তৈরি হচ্ছে...' : '➕ চিকিৎসকের বিশেষ অ্যাকাউন্ট তৈরি করুন'}
                    </button>
                  </form>
                )}
              </div>

              {/* Right Column: Leaderboard & Stats */}
              <div className="lg:col-span-7 bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm space-y-4">
                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">পল্লী চিকিৎসক লিডারবোর্ড ও ট্র্যাকিং</h3>
                  <span className="text-[10px] font-black text-slate-400 uppercase">Realtime Sync</span>
                </div>

                {/* Rural Doctor Search Bar */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="🔍 পল্লী চিকিৎসকের নাম, কোড বা মোবাইল নম্বর দিয়ে খুঁজুন..."
                    value={rdSearchQuery}
                    onChange={(e) => setRdSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 pl-10 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
                  />
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                    🔍
                  </span>
                  {rdSearchQuery && (
                    <button 
                      type="button"
                      onClick={() => setRdSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black bg-slate-200 hover:bg-slate-300 text-slate-600 px-2 py-1 rounded-md uppercase transition-all"
                    >
                      CLEAR
                    </button>
                  )}
                </div>

                {filteredRDs.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <p className="text-xs font-black uppercase tracking-wider">কোনো পল্লী চিকিৎসক পাওয়া যায়নি</p>
                    <p className="text-[10px]">আপনার খোঁজা নাম বা কোডের সাথে মিলছে এমন কোনো পল্লী চিকিৎসক নেই।</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto pr-2 no-scrollbar">
                    {filteredRDs.map((docInfo, idx) => {
                      const referredPList = profiles.filter(p => 
                        (p.referred_by_code || '').trim().toUpperCase() === (docInfo.referral_code || '').trim().toUpperCase()
                      );
                      const referredAppList = appointments.filter(a => 
                        (a.referred_by_code || '').trim().toUpperCase() === (docInfo.referral_code || '').trim().toUpperCase()
                      );
                      const isExpanded = expandedDocId === docInfo.id;
                      
                      return (
                        <div key={docInfo.id || idx} className="py-4 border-b border-slate-50 last:border-none">
                          <div 
                            onClick={() => setExpandedDocId(isExpanded ? null : docInfo.id)}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 p-2 rounded-2xl transition-all"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-slate-400">#{idx + 1}</span>
                                <h4 className="font-extrabold text-sm text-slate-800">{docInfo.full_name}</h4>
                                <span className="text-[9px] font-black bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                  Code: {docInfo.referral_code}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 font-bold mt-1">📱 ইউজারনেম: <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">{docInfo.phone || 'N/A'}</span></p>
                              <p className="text-[10px] text-indigo-600 font-bold mt-1">🔑 পাসওয়ার্ড: <span className="font-mono bg-indigo-50 px-1.5 py-0.5 rounded text-indigo-700">{docInfo.created_password || 'N/A'}</span></p>
                              <p className="text-[9px] text-blue-600 font-black mt-2 uppercase tracking-wider">
                                {isExpanded ? '▲ তালিকা বন্ধ করুন' : '▼ নিবন্ধিত রোগী দেখতে ক্লিক করুন'}
                              </p>
                            </div>
                            
                            {/* Stat chips */}
                            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                              <div className="bg-slate-50/85 px-3 py-2 rounded-2xl border border-slate-100 min-w-[85px] text-center">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">নিবন্ধিত রোগী</p>
                                <p className="text-xs font-extrabold text-slate-800 mt-1">{referredPList.length} জন</p>
                              </div>
                              <div className="bg-emerald-50/30 px-3 py-2 rounded-2xl border border-emerald-100 min-w-[85px] text-center">
                                <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest leading-none">কোড বুকিং</p>
                                <p className="text-xs font-extrabold text-emerald-700 mt-1">{referredAppList.length} বার</p>
                              </div>
                              <div className="bg-teal-50/50 px-3 py-2 rounded-2xl border border-teal-100 min-w-[95px] text-center">
                                <p className="text-[8px] font-black text-teal-600 uppercase tracking-widest leading-none">ডাক্তার দেখিয়েছেন</p>
                                <p className="text-xs font-extrabold text-teal-700 mt-1">
                                  {referredAppList.filter(a => a.status === 'visited').length} জন
                                </p>
                              </div>
                              <div className="bg-rose-50/50 px-3 py-2 rounded-2xl border border-rose-100 min-w-[95px] text-center">
                                <p className="text-[8px] font-black text-rose-600 uppercase tracking-widest leading-none">আসেননি/ক্যান্সেল</p>
                                <p className="text-xs font-extrabold text-rose-700 mt-1">
                                  {referredAppList.filter(a => a.status === 'absent').length} জন
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Expanded Patient Referral List & Booking Serials */}
                          {isExpanded && (
                            <div className="mt-3 ml-6 p-5 bg-slate-50/80 rounded-[24px] border border-slate-100/80 space-y-5">
                              {/* Registered Patients Sub-section */}
                              <div className="space-y-3">
                                <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-left flex items-center justify-between">
                                  <span>📋 {docInfo.full_name}-এর নিবন্ধিত রোগী তালিকা ({referredPList.length} জন)</span>
                                  <span className="bg-indigo-50 text-indigo-600 text-[8px] font-black px-2 py-0.5 rounded-full uppercase">Patients</span>
                                </h5>
                                {referredPList.length === 0 ? (
                                  <p className="text-[10px] text-slate-400 italic font-semibold text-left">কোনো নিবন্ধিত রোগী নেই</p>
                                ) : (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {referredPList.map((pat, pidx) => (
                                      <div key={pat.id || pidx} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center text-left animate-in fade-in zoom-in-95 duration-200">
                                        <div>
                                          <p className="font-extrabold text-xs text-slate-800">{pat.full_name}</p>
                                          <p className="text-[9px] text-slate-500 font-semibold mt-0.5">📱 {pat.phone || 'N/A'}</p>
                                        </div>
                                        <div className="text-right">
                                          <p className="text-[9px] font-bold text-indigo-600">
                                            🔑 পাসওয়ার্ড: <span className="font-mono bg-indigo-50 px-1.5 py-0.5 rounded text-indigo-700">{pat.created_password || pat.password || '123456'}</span>
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Booked Serials Sub-section */}
                              <div className="space-y-3 pt-3 border-t border-slate-100">
                                <h5 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest text-left flex items-center justify-between">
                                  <span>🩺 রোগীদের বুক করা সিরিয়ালসমূহ ({referredAppList.length} বার)</span>
                                  <span className="bg-emerald-50 text-emerald-600 text-[8px] font-black px-2 py-0.5 rounded-full uppercase">Serials</span>
                                </h5>
                                {referredAppList.length === 0 ? (
                                  <p className="text-[10px] text-slate-400 italic font-semibold text-left">কোনো রোগী এখনো সিরিয়াল বুক করেনি</p>
                                ) : (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {referredAppList.map((app, appidx) => (
                                      <div key={app.id || appidx} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm space-y-2 text-left animate-in fade-in zoom-in-95 duration-200">
                                        <div className="flex justify-between items-start">
                                          <div>
                                            <p className="font-extrabold text-xs text-slate-800">👨‍⚕️ {app.doctor_name}</p>
                                            <p className="text-[9px] text-blue-600 font-bold uppercase">{app.doctor_specialty}</p>
                                          </div>
                                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                            app.status === 'visited' 
                                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                              : app.status === 'absent'
                                                ? 'bg-rose-50 text-rose-700 border border-rose-100'
                                                : 'bg-amber-50 text-amber-700 border border-amber-100'
                                          }`}>
                                            {app.status === 'visited' ? 'ডাক্তার দেখিয়েছেন' : app.status === 'absent' ? 'আসেননি/ক্যান্সেল' : 'পেন্ডিং'}
                                          </span>
                                        </div>
                                        <div className="text-[9px] text-slate-500 font-bold space-y-0.5 bg-slate-50 p-2 rounded-lg">
                                          <p>👤 রোগী: <span className="text-slate-800 font-extrabold">{app.patient_name}</span></p>
                                          <p>📱 ফোন: {app.patient_phone}</p>
                                          <p>📅 তারিখ: {app.date}</p>
                                          {app.problems && <p className="italic text-slate-400">🩺 সমস্যা: "{app.problems}"</p>}
                                        </div>
                                        
                                        {/* Status Update Actions */}
                                        <div className="flex gap-1 pt-1.5 border-t border-slate-100">
                                          <button
                                            type="button"
                                            onClick={() => onUpdateAppointmentStatus?.(app.id, 'visited')}
                                            className={`flex-1 py-1 rounded text-[8px] font-black uppercase tracking-wider transition-all ${
                                              app.status === 'visited'
                                                ? 'bg-emerald-600 text-white font-extrabold'
                                                : 'bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700'
                                            }`}
                                          >
                                            ✓ দেখিয়েছেন
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => onUpdateAppointmentStatus?.(app.id, 'absent')}
                                            className={`flex-1 py-1 rounded text-[8px] font-black uppercase tracking-wider transition-all ${
                                              app.status === 'absent'
                                                ? 'bg-rose-600 text-white font-extrabold'
                                                : 'bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700'
                                            }`}
                                          >
                                            ✕ আসেননি
                                          </button>
                                          {app.status !== 'pending' && (
                                            <button
                                              type="button"
                                              onClick={() => onUpdateAppointmentStatus?.(app.id, 'pending')}
                                              className="px-1.5 py-1 rounded text-[8px] font-black bg-slate-100 hover:bg-slate-200 text-slate-500 transition-all"
                                              title="রিসেট"
                                            >
                                              Reset
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {activeSubTab === 'patients' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 text-left">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">রোগী অনুসন্ধান ও সিরিয়াল হিস্ট্রি</h2>
                <p className="text-xs text-slate-500 font-bold mt-1">প্ল্যাটফর্মের সকল রোগীর প্রোফাইল, সংরক্ষিত পাসওয়ার্ড ও সিরিয়াল ট্র্যাকিং করুন।</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="bg-blue-50 text-blue-700 px-3.5 py-2 rounded-2xl border border-blue-100 text-xs font-black">
                  মোট নিবন্ধিত রোগী: {profiles.filter(p => p.role === UserRole.PATIENT || !p.role || (p.role !== UserRole.ADMIN && p.role !== UserRole.DOCTOR && p.role !== UserRole.RURAL_DOCTOR)).length} জন
                </div>
                <button
                  type="button"
                  disabled={isFixingPasswords}
                  onClick={handleFixAllPasswords}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-2xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  title="যেসকল একাউন্টে পাসওয়ার্ড নেই সেগুলোতে ডিফল্ট ১২৩৪৫৬ সেট করুন"
                >
                  {isFixingPasswords ? '⏳ প্রসেসিং...' : '🛡️ খালি পাসওয়ার্ড "123456" ফিক্স করুন'}
                </button>
              </div>
            </div>

            {/* Patient Panel Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Search & Results List */}
              <div className="lg:col-span-5 bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm space-y-4">
                <div className="space-y-2">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest font-extrabold">রোগী খুঁজুন</h3>
                  
                  {/* Search input */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="🔍 রোগীর নাম, ফোন নম্বর বা রেফারেল কোড দিন..."
                      value={patientSearchQuery}
                      onChange={(e) => setPatientSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 pl-10 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
                    />
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                      🔍
                    </span>
                    {patientSearchQuery && (
                      <button 
                        type="button"
                        onClick={() => setPatientSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black bg-slate-200 hover:bg-slate-300 text-slate-600 px-2 py-1 rounded-md uppercase transition-all"
                      >
                        CLEAR
                      </button>
                    )}
                  </div>
                </div>

                <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto pr-2 no-scrollbar space-y-2">
                  {filteredPatients.length === 0 ? (
                    <div className="py-12 text-center text-slate-400">
                      <p className="text-xs font-black uppercase tracking-wider">কোনো রোগী পাওয়া যায়নি</p>
                      <p className="text-[10px]">সঠিক নাম, ১১ ডিজিটের মোবাইল নম্বর বা রেফারেল কোড দিন।</p>
                    </div>
                  ) : (
                    filteredPatients.map((pat, idx) => {
                      const isSelected = selectedPatientId === pat.id;
                      const patAppsCount = appointments.filter(a => a.patient_id === pat.id || a.patient_phone === pat.phone).length;
                      const patPass = pat.created_password || pat.password || '123456';
                      
                      return (
                        <div 
                          key={pat.id || idx}
                          onClick={() => setSelectedPatientId(pat.id)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer text-left flex justify-between items-center ${
                            isSelected 
                              ? 'bg-blue-500 border-blue-500 text-white shadow-md shadow-blue-500/10' 
                              : 'bg-slate-50 hover:bg-slate-100/70 border-slate-100 text-slate-800'
                          }`}
                        >
                          <div className="space-y-1">
                            <h4 className="font-extrabold text-xs">{pat.full_name}</h4>
                            <p className={`text-[10px] font-bold ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                              📱 {pat.phone || 'N/A'}
                            </p>
                            <div className="flex items-center gap-1.5 pt-0.5">
                              <span className={`text-[9px] font-mono font-black px-2 py-0.5 rounded ${
                                isSelected ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                              }`}>
                                🔑 PIN: {patPass}
                              </span>
                            </div>
                            {pat.referred_by_code && (
                              <span className={`inline-block text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                isSelected ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'
                              }`}>
                                Ref: {pat.referred_by_code}
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-xl uppercase tracking-wider ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/60 text-slate-600 font-bold'
                            }`}>
                              {patAppsCount} সিরিয়াল
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Profile details and appointment history */}
              <div className="lg:col-span-7 bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm space-y-6">
                <PatientDetailView 
                  profiles={profiles} 
                  selectedPatientId={selectedPatientId} 
                  appointments={appointments} 
                  onUpdateAppointmentStatus={onUpdateAppointmentStatus} 
                  onUpdatePatientPassword={handleUpdatePatientPassword}
                />
              </div>

            </div>
          </div>
        )}

        {activeSubTab === 'quizzes' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 text-left">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">ইউটিউব কুইজ প্রতিযোগিতা নিয়ন্ত্রণ প্যানেল</h2>
                <p className="text-xs text-slate-500 font-bold mt-1">নতুন কুইজ তৈরি করুন, সমাধান লিখুন এবং তারিখভিত্তিক কমেন্ট ও অংশগ্রহণকারী লিস্ট দেখুন।</p>
              </div>

              {/* Quiz Panel Mode Switcher */}
              <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/60 shrink-0">
                <button
                  type="button"
                  onClick={() => setQuizSubTab('manage')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                    quizSubTab === 'manage'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📝 কুইজ তৈরি ও প্রশ্নাবলি ({quizzes.length})
                </button>
                <button
                  type="button"
                  onClick={() => setQuizSubTab('participants')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                    quizSubTab === 'participants'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📊 তারিখ অনুযায়ী অংশগ্রহণকারী ({submissions.length})
                </button>
              </div>
            </div>

            {quizSubTab === 'manage' ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Column: Create Quiz Form */}
                <div className="lg:col-span-5 bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-6">
                  <div className="flex items-center gap-2 text-purple-600 font-black text-sm uppercase tracking-wider">
                    <HelpCircle size={18} /> নতুন কুইজ যুক্ত করুন
                  </div>

                  <form 
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!newQuizVideoTitle || !newQuizUploadDate || !newQuizQuestion || !newQuizPrizeAmount) {
                        alert("সব আবশ্যক তথ্য সঠিকভাবে পূরণ করুন!");
                        return;
                      }
                      if (onAddQuiz) {
                        await onAddQuiz(newQuizVideoTitle, newQuizUploadDate, newQuizQuestion, Number(newQuizPrizeAmount), newQuizAnswerHint);
                        setNewQuizVideoTitle('');
                        setNewQuizUploadDate('');
                        setNewQuizQuestion('');
                        setNewQuizAnswerHint('');
                        setNewQuizPrizeAmount('50');
                      }
                    }}
                    className="space-y-4"
                  >
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">ইউটিউব ভিডিও টাইটেল</label>
                      <input 
                        type="text" 
                        placeholder="যেমন: জ্বর ও সর্দি প্রতিকার..."
                        value={newQuizVideoTitle}
                        onChange={(e) => setNewQuizVideoTitle(e.target.value)}
                        className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs font-bold outline-none focus:border-purple-500 text-slate-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">ভিডিও আপলোড ডেট (YouTube Upload Date)</label>
                      <input 
                        type="date" 
                        value={newQuizUploadDate}
                        onChange={(e) => setNewQuizUploadDate(e.target.value)}
                        className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs font-bold outline-none focus:border-purple-500 text-slate-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">কুইজের প্রশ্ন</label>
                      <textarea 
                        placeholder="ভিডিওর উপর ভিত্তি করে একটি ছোট প্রশ্ন লিখুন..."
                        value={newQuizQuestion}
                        onChange={(e) => setNewQuizQuestion(e.target.value)}
                        rows={3}
                        className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs font-bold outline-none focus:border-purple-500 text-slate-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">প্রশ্নের সমাধান / সঠিক উত্তর (ইউজাররা দেখতে পাবে)</label>
                      <input 
                        type="text" 
                        placeholder="যেমন: সঠিক উত্তর খ বা ছোট ব্যাখ্যা..."
                        value={newQuizAnswerHint}
                        onChange={(e) => setNewQuizAnswerHint(e.target.value)}
                        className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs font-bold outline-none focus:border-purple-500 text-slate-800"
                      />
                      <p className="text-[9px] text-purple-600 font-bold mt-0.5">💡 এই সমাধানটি সকল ইউজার কুইজ কার্ডে দেখতে পারবে।</p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">পুরস্কারের পরিমাণ (টাকা / BDT)</label>
                      <input 
                        type="number" 
                        placeholder="যেমন: ৫০ বা ১০০"
                        value={newQuizPrizeAmount}
                        onChange={(e) => setNewQuizPrizeAmount(e.target.value)}
                        className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs font-bold outline-none focus:border-purple-500 text-slate-800"
                      />
                    </div>

                    <Button type="submit" variant="primary" className="w-full py-4 rounded-[20px] bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/10 font-black">
                      নতুন কুইজ প্রকাশ করুন
                    </Button>
                  </form>
                </div>

                {/* Right Column: List of Quizzes */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm space-y-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest font-extrabold flex items-center gap-2">
                      <HelpCircle size={16} className="text-purple-500" /> প্রকাশিত কুইজ সমূহের তালিকা ({quizzes.length})
                    </h3>

                    {quizzes.length === 0 ? (
                      <p className="text-xs text-slate-400 font-bold text-center py-6">কোনো কুইজ এখনো তৈরি করা হয়নি।</p>
                    ) : (
                      <div className="space-y-3 max-h-[480px] overflow-y-auto no-scrollbar">
                        {quizzes.map((q) => (
                          <div key={q.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2 text-left">
                            <div className="flex justify-between items-start gap-3">
                              <div>
                                <p className="text-xs font-black text-slate-800">{q.question}</p>
                                <p className="text-[10px] text-slate-400 font-bold mt-1">ভিডিও: <span className="text-slate-600">{q.video_title}</span> • আপলোড ডেট: <span className="text-purple-600 font-extrabold">{q.upload_date}</span></p>
                              </div>
                              <span className="bg-purple-100 text-purple-700 text-[9px] font-black px-2.5 py-1 rounded-full uppercase shrink-0">৳{q.prize_amount} প্রাইজ</span>
                            </div>
                            {q.answer_hint && (
                              <div className="bg-purple-50/70 p-2 rounded-xl text-[10px] font-bold text-purple-900 border border-purple-100">
                                <span className="font-extrabold">💡 সমাধান:</span> {q.answer_hint}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Date-wise Quiz Participants & Comments Tracker View */
              <div className="space-y-6">
                {/* Date Selection Header & Overview */}
                <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-[32px] p-6 sm:p-8 space-y-6 shadow-xl">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4">
                    <div>
                      <span className="bg-purple-500/30 text-purple-200 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider mb-2 inline-block">
                        ★ তারিখভিত্তিক ট্র্যাকিং
                      </span>
                      <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                        📅 কুইজ অংশগ্রহণকারী ও কমেন্ট তালিকা
                      </h3>
                      <p className="text-xs text-purple-200 font-bold mt-0.5">
                        নির্দিষ্ট তারিখে কতজন কুইজে কমেন্ট বা উত্তর সাবমিট করেছেন তা সিলেক্ট করে দেখুন।
                      </p>
                    </div>

                    <div className="flex items-center gap-2 bg-white/10 p-2 rounded-2xl border border-white/20">
                      <span className="text-[10px] font-black uppercase text-purple-200 pl-1">তারিখ:</span>
                      <input 
                        type="date"
                        value={selectedQuizDate}
                        onChange={(e) => setSelectedQuizDate(e.target.value)}
                        className="bg-white text-slate-900 text-xs font-black px-3 py-2 rounded-xl outline-none"
                      />
                      <button
                        onClick={() => setSelectedQuizDate(todayISO)}
                        className="bg-purple-500 hover:bg-purple-400 text-white text-[10px] font-black px-3 py-2 rounded-xl transition-all"
                      >
                        আজকে (Today)
                      </button>
                    </div>
                  </div>

                  {/* Date Breakdown Quick Badges */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-wider text-purple-300">
                      সাম্প্রতিক তারিখসমূহ ও কমেন্ট সংখ্যা (Date-wise counts):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(new Set(submissions.map(s => (s.created_at ? s.created_at.slice(0, 10) : s.upload_date_selected)))).map(d => {
                        const countForDate = submissions.filter(s => (s.created_at ? s.created_at.slice(0, 10) : s.upload_date_selected) === d).length;
                        const isSelected = selectedQuizDate === d;
                        return (
                          <button
                            key={d}
                            onClick={() => setSelectedQuizDate(d)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-amber-400 text-slate-900 shadow-lg scale-105'
                                : 'bg-white/10 text-purple-100 hover:bg-white/20'
                            }`}
                          >
                            <span>📅 {d}</span>
                            <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${isSelected ? 'bg-slate-900 text-white' : 'bg-purple-800 text-purple-200'}`}>
                              {countForDate} জন
                            </span>
                          </button>
                        );
                      })}
                      {submissions.length === 0 && (
                        <span className="text-xs text-purple-300 italic font-bold">এখনো কেউ কুইজে সাবমিট বা কমেন্ট করেনি।</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Filtered Participants List for Selected Date */}
                {(() => {
                  const filteredByDate = submissions.filter(sub => {
                    const subDate = sub.created_at ? sub.created_at.slice(0, 10) : sub.upload_date_selected;
                    return subDate === selectedQuizDate;
                  });

                  return (
                    <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                          তারিখ: <span className="text-purple-600 font-extrabold">{selectedQuizDate}</span> — মোট কমেন্ট / অংশগ্রহণকারী ({filteredByDate.length} জন)
                        </h4>
                        <span className="text-[10px] text-slate-400 font-bold">
                          {filteredByDate.length > 0 ? `${filteredByDate.length} জন ডাটা পাওয়া গেছে` : 'কেউ অংশগ্রহণ করেনি'}
                        </span>
                      </div>

                      {filteredByDate.length === 0 ? (
                        <div className="py-12 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                          <p className="text-3xl">📭</p>
                          <p className="text-xs font-black text-slate-500 uppercase tracking-wider">
                            এই নির্বাচিত তারিখে ({selectedQuizDate}) কেউ কুইজে কমেন্ট বা অংশগ্রহণ করেনি।
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold">
                            অন্য কোনো তারিখ সিলেক্ট করুন অথবা ইউজারদের উত্তর দেওয়া পর্যন্ত অপেক্ষা করুন।
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {filteredByDate.map((sub, idx) => {
                            const targetQuiz = quizzes.find(q => q.id === sub.quiz_id);
                            return (
                              <div key={sub.id || idx} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/80 hover:bg-slate-50 transition-all text-left space-y-3">
                                <div className="flex justify-between items-start gap-2">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-purple-100 text-purple-700 font-black text-xs rounded-xl flex items-center justify-center shrink-0">
                                      #{idx + 1}
                                    </div>
                                    <div>
                                      <p className="text-xs font-black text-slate-800">{sub.user_full_name || 'ইউজার'}</p>
                                      <p className="text-[10px] text-slate-500 font-bold">📱 {sub.user_phone || 'N/A'}</p>
                                    </div>
                                  </div>

                                  <div className="text-right">
                                    <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase inline-block ${
                                      sub.status === 'correct' ? 'bg-emerald-100 text-emerald-700' :
                                      sub.status === 'incorrect' ? 'bg-rose-100 text-rose-700' :
                                      'bg-amber-100 text-amber-700'
                                    }`}>
                                      {sub.status === 'correct' ? 'সঠিক (পেইড)' :
                                       sub.status === 'incorrect' ? 'ভুল উত্তর' : 'অপেক্ষমান'}
                                    </span>
                                    <p className="text-[9px] text-slate-400 font-bold mt-1">
                                      সময়: {sub.created_at ? new Date(sub.created_at).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                    </p>
                                  </div>
                                </div>

                                <div className="bg-white p-3 rounded-xl border border-slate-100 text-xs space-y-1">
                                  <p className="text-[10px] text-slate-400 font-bold">প্রশ্ন: <span className="text-slate-700">{targetQuiz?.question || 'N/A'}</span></p>
                                  <p className="text-[10px] text-slate-400 font-bold">নির্বাচন করা ভিডিও আপলোড ডেট: <span className="text-purple-600 font-black">{sub.upload_date_selected}</span></p>
                                  <p className="text-xs font-black text-slate-800">উত্তর / কমেন্ট: <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{sub.answer}</span></p>
                                </div>

                                {sub.status === 'pending' && (
                                  <div className="flex gap-2 justify-end pt-1">
                                    <button
                                      onClick={() => onUpdateSubmissionStatus?.(sub.id, 'incorrect', sub.user_id, sub.prize_amount || 50)}
                                      className="bg-rose-100 text-rose-700 hover:bg-rose-200 text-[10px] font-black px-4 py-1.5 rounded-xl transition-all"
                                    >
                                      ✕ ভুল উত্তর
                                    </button>
                                    <button
                                      onClick={() => onUpdateSubmissionStatus?.(sub.id, 'correct', sub.user_id, sub.prize_amount || 50)}
                                      className="bg-emerald-600 text-white hover:bg-emerald-700 text-[10px] font-black px-4 py-1.5 rounded-xl transition-all shadow-md"
                                    >
                                      ✓ সঠিক ও ৳{sub.prize_amount || 50} প্রাইজ প্রদান
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {activeSubTab === 'withdrawals' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 text-left">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">উইথড্রয়াল রিকোয়েস্ট ম্যানেজমেন্ট</h2>
                <p className="text-xs text-slate-500 font-bold mt-1">ব্যবহারকারীদের জমাকৃত রিওয়ার্ড ব্যালেন্স উত্তোলন (উইথড্র) রিকোয়েস্টসমূহ রিভিউ করুন।</p>
              </div>
              <div className="bg-pink-50 text-pink-700 px-4 py-2 rounded-2xl border border-pink-100 text-xs font-black">
                অপেক্ষমান উইথড্র: {withdrawals.filter(w => w.status === 'pending').length} টি
              </div>
            </div>

            {/* Withdrawals Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Pending Requests</p>
                <p className="text-2xl font-black text-amber-500">
                  ৳{withdrawals.filter(w => w.status === 'pending').reduce((acc, curr) => acc + (curr.amount || 0), 0)}
                </p>
              </div>
              <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Completed Payouts</p>
                <p className="text-2xl font-black text-emerald-600">
                  ৳{withdrawals.filter(w => w.status === 'completed').reduce((acc, curr) => acc + (curr.amount || 0), 0)}
                </p>
              </div>
              <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Total Request Volume</p>
                <p className="text-2xl font-black text-slate-800">
                  ৳{withdrawals.reduce((acc, curr) => acc + (curr.amount || 0), 0)}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm text-left">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest font-extrabold mb-4">
                উত্তোলনের আবেদনসমূহের তালিকা
              </h3>

              {withdrawals.length === 0 ? (
                <p className="text-xs text-slate-400 font-bold text-center py-10">কোনো উইথড্রয়াল আবেদন পাওয়া যায়নি।</p>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 no-scrollbar">
                  {withdrawals.map((wd) => (
                    <div key={wd.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="text-left">
                          <p className="text-xs font-black text-slate-800">{wd.user_full_name || 'ইউজার'}</p>
                          <p className="text-[9px] text-slate-400 font-bold">ফোন নম্বর: {wd.user_phone || 'N/A'}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] font-black px-3 py-1 rounded-xl uppercase ${
                            wd.method === 'bkash' ? 'bg-pink-100 text-pink-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {wd.method === 'bkash' ? 'bKash' : 'Nagad'}
                          </span>
                          <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase ${
                            wd.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                            wd.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                            'bg-amber-100 text-amber-700 animate-pulse'
                          }`}>
                            {wd.status === 'completed' ? 'সফল (Paid)' :
                             wd.status === 'rejected' ? 'বাতিল' : 'অপেক্ষমান'}
                          </span>
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-left">
                        <div className="text-xs font-black text-slate-700">
                          হিসাব নম্বর: <span className="font-mono text-blue-600 bg-slate-100 px-2 py-1 rounded-md">{wd.account_number}</span>
                        </div>
                        <div className="text-xs font-black text-slate-800">
                          উত্তোলন পরিমাণ: <span className="text-emerald-600 text-sm font-extrabold">৳{wd.amount} টাকা</span>
                        </div>
                        <div className="text-[9px] text-slate-400 font-bold">
                          তারিখ: {wd.created_at ? new Date(wd.created_at).toLocaleString('bn-BD') : 'N/A'}
                        </div>
                      </div>

                      {wd.status === 'pending' && (
                        <div className="flex gap-2 justify-end pt-2">
                          <button
                            onClick={() => onUpdateWithdrawalStatus?.(wd.id, 'rejected', wd.user_id, wd.amount)}
                            className="bg-rose-100 text-rose-700 hover:bg-rose-200 text-[10px] font-black px-4 py-2.5 rounded-xl transition-all"
                          >
                            ✕ রিকোয়েস্ট বাতিল করুন (রিফান্ড)
                          </button>
                          <button
                            onClick={() => onUpdateWithdrawalStatus?.(wd.id, 'completed', wd.user_id, wd.amount)}
                            className="bg-emerald-600 text-white hover:bg-emerald-700 text-[10px] font-black px-4 py-2.5 rounded-xl shadow-md shadow-emerald-500/10 transition-all"
                          >
                            ✓ টাকা পাঠানো হয়েছে (সম্পূর্ণ করুন)
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeSubTab === 'free_doctors' && (
          <FreeDoctorClaimSection profile={profile} isAdmin={true} whatsappNumber={WHATSAPP_NUMBER} />
        )}

        {activeSubTab === 'maternity_donation' && (
          <MaternityDonationSection profile={profile} isAdmin={true} whatsappNumber={WHATSAPP_NUMBER} />
        )}

        {activeSubTab === 'subscriptions' && (
          <SubscriptionSection profile={profile} isAdmin={true} whatsappNumber={WHATSAPP_NUMBER} />
        )}

        {activeSubTab === 'doctor_portal' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 text-left">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 p-6 sm:p-8 rounded-[32px] text-white shadow-xl flex flex-col md:flex-row justify-between md:items-center gap-6">
              <div>
                <span className="bg-teal-400 text-slate-950 font-black text-[10px] uppercase px-3 py-1 rounded-full flex items-center gap-1.5 w-fit mb-2 shadow-sm">
                  <Stethoscope size={12} /> ডক্টর একাউন্ট ও ডিজিটাল প্রেসক্রিপশন পোর্টাল
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  👨‍⚕️ ডক্টর একাউন্টস ও লাইভ কনসালটেশন পোর্টাল
                </h2>
                <p className="text-xs text-teal-200 font-bold mt-1 max-w-xl">
                  বিশেষজ্ঞ চিকিৎসকদের আলাদা লগইন অ্যাকাউন্ট তৈরি করুন, তাদের BMDC নম্বর ও স্পেশালিটি সেট করুন এবং ডিজিটাল প্রেসক্রিপশন পোর্টাল পরিচালনা করুন।
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDoctorForPortalPreview(profile);
                    setDocPortalPreviewOpen(!docPortalPreviewOpen);
                  }}
                  className={`px-5 py-3.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 shadow-lg active:scale-95 ${
                    docPortalPreviewOpen
                      ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                      : 'bg-teal-500 text-white hover:bg-teal-400 shadow-teal-500/20'
                  }`}
                >
                  <Stethoscope size={16} />
                  {docPortalPreviewOpen ? '✕ প্রিভিউ বন্ধ করুন' : '🩺 লাইভ ডক্টর পোর্টাল প্রিভিউ দেখুন'}
                </button>
              </div>
            </div>

            {/* Live Doctor Portal Embedded View if toggled */}
            {docPortalPreviewOpen && (
              <div className="border-4 border-teal-500 rounded-[36px] overflow-hidden shadow-2xl bg-slate-900 p-2 sm:p-4">
                <div className="bg-teal-800/60 p-4 rounded-2xl text-white flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-emerald-400 rounded-full animate-ping" />
                    <span className="text-xs font-black uppercase tracking-wider">
                      লাইভ ডক্টর পোর্টাল মোড: {selectedDoctorForPortalPreview?.full_name || profile.full_name}
                    </span>
                  </div>
                  <button
                    onClick={() => setDocPortalPreviewOpen(false)}
                    className="bg-white/20 hover:bg-white/30 text-white text-xs font-black px-3 py-1.5 rounded-xl transition-all"
                  >
                    ✕ বন্ধ করুন
                  </button>
                </div>
                <DoctorPortal
                  currentProfile={selectedDoctorForPortalPreview || profile}
                  doctorsList={doctors}
                  labTestsList={labTests}
                  onLogout={() => setDocPortalPreviewOpen(false)}
                />
              </div>
            )}

            {/* Grid for Create Doctor Account + List of Doctor Accounts */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Create Doctor Account Form */}
              <div className="lg:col-span-5 bg-white rounded-[32px] p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
                <div className="flex items-center gap-2.5 text-teal-700 font-black text-sm uppercase tracking-wider border-b border-slate-100 pb-3">
                  <div className="w-8 h-8 rounded-xl bg-teal-100 flex items-center justify-center text-teal-700">
                    <Plus size={18} />
                  </div>
                  <span>নতুন ডক্টর অ্যাকাউন্ট তৈরি করুন</span>
                </div>

                {createdDocSuccess && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2 text-xs">
                    <p className="font-black text-emerald-800 flex items-center gap-1.5">
                      <CheckCircle2 size={16} className="text-emerald-600" /> ডক্টর অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে!
                    </p>
                    <div className="bg-white p-3 rounded-xl border border-emerald-200 font-mono text-[11px] space-y-1">
                      <p>👤 <strong>নাম:</strong> {createdDocSuccess.name}</p>
                      <p>📱 <strong>লগইন নম্বর/আইডি:</strong> {createdDocSuccess.phone}</p>
                      <p>🔑 <strong>পাসওয়ার্ড:</strong> {createdDocSuccess.pass}</p>
                      <p>🩺 <strong>BMDC রেজি নং:</strong> {createdDocSuccess.bmdc}</p>
                      <p>🏷️ <strong>স্পেশালিটি:</strong> {createdDocSuccess.specialty}</p>
                    </div>
                    <p className="text-[10px] text-emerald-700 font-bold">
                      💡 চিকিৎসক তার মোবাইল নম্বর ও এই পাসওয়ার্ড ব্যবহার করে সরাসরি অ্যাপে লগইন করতে পারবেন।
                    </p>
                  </div>
                )}

                {docCreateError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{docCreateError}</span>
                  </div>
                )}

                <form onSubmit={handleCreateDoctorAccount} className="space-y-4 text-xs font-bold text-slate-700">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                      ডাক্তারের পুরো নাম (Title সহ) *
                    </label>
                    <input
                      type="text"
                      value={docName}
                      onChange={e => setDocName(e.target.value)}
                      placeholder="যেমন: ডা. মোঃ রফিকুল ইসলাম (Dr. Md Rafiqul Islam)"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-teal-600 focus:bg-white transition-all"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                        মোবাইল নম্বর (লগইন আইডি) *
                      </label>
                      <input
                        type="tel"
                        value={docPhone}
                        onChange={e => setDocPhone(e.target.value)}
                        placeholder="017xxxxxxxx"
                        maxLength={11}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-800 outline-none focus:border-teal-600 focus:bg-white transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                        লগইন পাসওয়ার্ড *
                      </label>
                      <input
                        type="text"
                        value={docPass}
                        onChange={e => setDocPass(e.target.value)}
                        placeholder="123456"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-800 outline-none focus:border-teal-600 focus:bg-white transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                        BMDC রেজিস্ট্রেশন নম্বর
                      </label>
                      <input
                        type="text"
                        value={docBmdc}
                        onChange={e => setDocBmdc(e.target.value)}
                        placeholder="যেমন: A-10824"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-800 outline-none focus:border-teal-600 focus:bg-white transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                        কনসালটেশন ফি (টাকা)
                      </label>
                      <input
                        type="number"
                        value={docFee}
                        onChange={e => setDocFee(e.target.value)}
                        placeholder="500"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-800 outline-none focus:border-teal-600 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                      বিশেষজ্ঞ বিষয় / বিভাগ (Specialty)
                    </label>
                    <select
                      value={docSpecialty}
                      onChange={e => setDocSpecialty(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-teal-600 focus:bg-white transition-all"
                    >
                      <option value="মেডিসিন বিশেষজ্ঞ (Medicine)">মেডিসিন বিশেষজ্ঞ (Medicine)</option>
                      <option value="হৃদরোগ ও কার্ডিওলজি (Cardiology)">হৃদরোগ ও কার্ডিওলজি (Cardiology)</option>
                      <option value="গাইনী ও প্রসূতিরোগ (Gynecology & Obstetrics)">গাইনী ও প্রসূতিরোগ (Gynecology & Obstetrics)</option>
                      <option value="শিশু ও কিশোর রোগ বিশেষজ্ঞ (Pediatrics)">শিশু ও কিশোর রোগ বিশেষজ্ঞ (Pediatrics)</option>
                      <option value="অর্থোপেডিক ও হাড়-জোড়া (Orthopedics)">অর্থোপেডিক ও হাড়-জোড়া (Orthopedics)</option>
                      <option value="দন্তরোগ ও ডেন্টাল সার্জন (Dentistry)">দন্তরোগ ও ডেন্টাল সার্জন (Dentistry)</option>
                      <option value="চর্ম, এলার্জি ও যৌনরোগ (Dermatology & Venereology)">চর্ম, এলার্জি ও যৌনরোগ (Dermatology & Venereology)</option>
                      <option value="নাক, কান ও গলা বিশেষজ্ঞ (ENT)">নাক, কান ও গলা বিশেষজ্ঞ (ENT)</option>
                      <option value="চক্ষুরোগ বিশেষজ্ঞ (Ophthalmology)">চক্ষুরোগ বিশেষজ্ঞ (Ophthalmology)</option>
                      <option value="কিডনি ও মূত্ররোগ (Nephrology / Urology)">কিডনি ও মূত্ররোগ (Nephrology / Urology)</option>
                      <option value="জেনারেল ও ল্যাপারোস্কোপিক সার্জারি (Surgery)">জেনারেল ও ল্যাপারোস্কোপিক সার্জারি (Surgery)</option>
                      <option value="পুষ্টি ও ডায়াবেটিস (Nutrition / Diabetology)">পুষ্টি ও ডায়াবেটিস (Nutrition / Diabetology)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                      ডিগ্রি ও শিক্ষাগত যোগ্যতা
                    </label>
                    <input
                      type="text"
                      value={docDegree}
                      onChange={e => setDocDegree(e.target.value)}
                      placeholder="যেমন: MBBS, BCS (Health), FCPS / MD"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-teal-600 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                      হাসপাতাল / চেম্বারের ঠিকানা
                    </label>
                    <input
                      type="text"
                      value={docChamber}
                      onChange={e => setDocChamber(e.target.value)}
                      placeholder="যেমন: নীলফামারী আধুনিক ডিজিটাল হেলথ সেন্টার"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-teal-600 focus:bg-white transition-all"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="videoConsultantToggle"
                      checked={docIsVideo}
                      onChange={e => setDocIsVideo(e.target.checked)}
                      className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                    />
                    <label htmlFor="videoConsultantToggle" className="text-xs font-bold text-slate-700 cursor-pointer">
                      📹 অনলাইন ভিডিও ও ডিজিটাল কনসালট্যান্ট হিসেবে নিযুক্ত করুন
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isCreatingDoc}
                    className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-teal-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isCreatingDoc ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" /> অ্যাকাউন্ট তৈরি হচ্ছে...
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={16} /> ডাক্তার অ্যাকাউন্ট তৈরি করুন
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Right Column: List of Doctor Accounts */}
              <div className="lg:col-span-7 bg-white rounded-[32px] p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                      <Stethoscope size={18} className="text-teal-600" />
                      নিবন্ধিত ডাক্তার অ্যাকাউন্ট তালিকা ({doctorProfiles.length} জন)
                    </h3>
                    <p className="text-xs text-slate-500 font-bold mt-0.5">
                      সকল বিশেষজ্ঞ চিকিৎসকের লগইন তথ্য এবং ডিজিটাল পোর্টাল অ্যাক্সেস
                    </p>
                  </div>

                  {/* Search box */}
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                    <input
                      type="text"
                      value={doctorAccountSearch}
                      onChange={e => setDoctorAccountSearch(e.target.value)}
                      placeholder="নাম বা মোবাইল নম্বর দিয়ে খুঁজুন..."
                      className="pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-teal-600 focus:bg-white w-full sm:w-56 transition-all"
                    />
                  </div>
                </div>

                {filteredDoctorProfiles.length === 0 ? (
                  <div className="text-center py-16 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                    <p className="text-3xl">👨‍⚕️</p>
                    <p className="text-xs font-black text-slate-600">কোনো ডক্টর অ্যাকাউন্ট পাওয়া যায়নি।</p>
                    <p className="text-[10px] text-slate-400 font-bold">
                      বাম পাশের ফর্ম ব্যবহার করে প্রথম ডক্টর অ্যাকাউন্ট তৈরি করুন।
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[700px] overflow-y-auto pr-1 no-scrollbar">
                    {filteredDoctorProfiles.map((docP, idx) => {
                      const matchedDoctorDoc = doctors.find(d => d.phone === docP.phone || d.name === docP.full_name);

                      return (
                        <div
                          key={docP.id || idx}
                          className="bg-slate-50/80 hover:bg-slate-50 p-5 rounded-2xl border border-slate-200/80 transition-all space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200/60 pb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                                👨‍⚕️
                              </div>
                              <div>
                                <h4 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                                  {docP.full_name}
                                </h4>
                                <p className="text-xs font-extrabold text-teal-700">
                                  {matchedDoctorDoc?.specialty || 'মেডিসিন ও স্বাস্থ্য বিশেষজ্ঞ'}
                                </p>
                              </div>
                            </div>

                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-1 rounded-full uppercase border border-emerald-200">
                              অ্যাক্টিভ ডক্টর
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold text-slate-700 bg-white p-3 rounded-xl border border-slate-100">
                            <div>
                              <p className="text-[10px] text-slate-400 font-black uppercase">লগইন ফোন নম্বর:</p>
                              <p className="font-mono text-blue-600 font-black">{docP.phone}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-400 font-black uppercase">লগইন পাসওয়ার্ড:</p>
                              <p className="font-mono text-emerald-700 font-black">{docP.created_password || '123456'}</p>
                            </div>
                            {matchedDoctorDoc?.bmdcReg && (
                              <div>
                                <p className="text-[10px] text-slate-400 font-black uppercase">BMDC রেজি নং:</p>
                                <p className="font-mono text-slate-800 font-black">{matchedDoctorDoc.bmdcReg}</p>
                              </div>
                            )}
                            {matchedDoctorDoc?.degree && (
                              <div>
                                <p className="text-[10px] text-slate-400 font-black uppercase">যোগ্যতা/ডিগ্রি:</p>
                                <p className="text-slate-800">{matchedDoctorDoc.degree}</p>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                            <p className="text-[10px] text-slate-400 font-bold">
                              চেম্বার: {matchedDoctorDoc?.chamber || 'নীলফামারী ডিজিটাল হেলথ সেন্টার'}
                            </p>
                            
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedDoctorForPortalPreview(docP);
                                  setDocPortalPreviewOpen(true);
                                }}
                                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                              >
                                <Stethoscope size={13} />
                                এই পোর্টালে ঢুকুন
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Input: React.FC<{
  label: string,
  type?: string,
  placeholder?: string,
  value?: string,
  defaultValue?: string,
  onChange?: (val: string) => void,
  required?: boolean,
  className?: string,
  name?: string
}> = ({ label, type = "text", placeholder, value, defaultValue, onChange, required = false, className = "", name }) => (
  <div className={`space-y-1.5 w-full ${className}`}>
    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">{label}</label>
    <input 
      name={name}
      type={type}
      placeholder={placeholder}
      value={value}
      defaultValue={defaultValue}
      onChange={(e) => onChange ? onChange(e.target.value) : null}
      required={required}
      className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-2xl px-5 py-3 text-sm font-bold text-slate-700 outline-none transition-all placeholder:text-slate-300"
    />
  </div>
);

// --- Todays Doctors Banner Component ---

const TodaysDoctorsBanner: React.FC<{ doctors: Doctor[] }> = ({ doctors }) => {
  const todaysDocs = useMemo(() => doctors.filter(d => d.availableToday), [doctors]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (todaysDocs.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % todaysDocs.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [todaysDocs.length]);

  if (todaysDocs.length === 0) return null;

  const currentDoc = todaysDocs[currentIndex];
  const clinic = CLINICS.find(c => c.id === currentDoc.clinics[0]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-slate-900 rounded-[32px] p-6 text-white relative overflow-hidden h-44 flex items-center shadow-2xl border border-white/5"
    >
      <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/30 rounded-full blur-[80px] -mr-10 -mt-10" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-600/20 rounded-full blur-[60px] -ml-5 -mb-5" />
      
      <AnimatePresence mode="wait">
        <motion.div
          key={currentDoc.id}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative z-10 flex items-center justify-between w-full"
        >
          <div className="space-y-2 flex-1 pr-4">
            <div className="flex items-center gap-2">
              <div className="bg-emerald-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg shadow-emerald-900/40">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> আজকের ডাক্তার
              </div>
              <div className="bg-white/10 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-sm border border-white/10">
                Live Now
              </div>
            </div>
            
            <h3 className="text-xl font-black tracking-tight leading-tight">{currentDoc.name}</h3>
            
            <div className="space-y-1">
              <p className="text-[11px] text-blue-400 font-black uppercase tracking-widest">{currentDoc.specialty}</p>
              <div className="flex flex-col gap-0.5">
                <p className="text-[10px] text-slate-300 font-bold flex items-center gap-1.5 grayscale opacity-90">
                  📍 {clinic?.name || 'চেম্বার'}
                </p>
                <p className="text-[10px] text-slate-300 font-bold flex items-center gap-1.5 grayscale opacity-90">
                ⏰ {currentDoc.schedule}
                </p>
              </div>
            </div>
          </div>
          
          <div className="relative group">
            <div className="absolute inset-0 bg-blue-600/30 blur-xl rounded-full scale-90 group-hover:scale-110 transition-transform" />
            <div className="relative w-28 h-28 p-1.5 bg-white/10 rounded-[40px] backdrop-blur-xl border border-white/20 shadow-2xl overflow-hidden">
              <img 
                src={currentDoc.image} 
                alt={currentDoc.name} 
                className="w-full h-full object-cover rounded-[32px]" 
                referrerPolicy="no-referrer" 
              />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

// --- AI Doctor Component ---

// --- Landing Page Component ---

const LandingPage: React.FC<{ onStart: () => void }> = ({ onStart }) => {
  return (
    <div className="fixed inset-0 z-[200] bg-white overflow-y-auto no-scrollbar">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex flex-col items-center justify-center px-8 text-center bg-gradient-to-b from-blue-50 to-white overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-20 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl"
        />
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="z-10 space-y-6"
        >
          <div className="inline-flex items-center gap-2 bg-blue-600/10 text-blue-600 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">
            <Zap size={14} fill="currentColor" /> Digital Healthcare Solution
          </div>
          
          <h1 className="text-5xl font-black text-slate-900 leading-[1.1] tracking-tighter">
            আপনার হাতের মুঠোয় <br />
            <span className="text-blue-600">Nilpha ডাক্তার</span>
          </h1>
          
          <p className="text-slate-500 text-[11px] font-medium leading-relaxed max-w-xs mx-auto">
            Nilpha-তে আপনি পাচ্ছেন এআই ডাক্তার পরামর্শ, ভিডিও কনসাল্টেশন এবং জরুরি স্বাস্থ্যসেবা।
          </p>
          
          <div className="pt-8">
            <button 
              onClick={onStart}
              className="bg-blue-600 text-white px-10 py-5 rounded-[32px] font-black text-sm uppercase tracking-widest shadow-2xl shadow-blue-500/40 active:scale-95 transition-all flex items-center gap-3 mx-auto"
            >
              শুরু করুন <ArrowRight size={20} />
            </button>
            <p className="text-blue-600 text-lg font-black mt-8 text-center px-4 leading-snug">
              নীলফামারী জেলার সকল হাসপাতাল বা ক্লিনিক রোগীদের তথ্য প্রদানকারী পোর্টাল।
            </p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="absolute bottom-0 w-full px-6"
        >
          <div className="bg-white rounded-t-[40px] shadow-2xl border-x border-t border-slate-100 p-8 flex justify-around items-center">
            <div className="text-center">
              <p className="text-2xl font-black text-slate-800">৫০০০+</p>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">পরামর্শ</p>
            </div>
            <div className="w-px h-8 bg-slate-100" />
            <div className="text-center">
              <p className="text-2xl font-black text-slate-800">৫০+</p>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">বিশেষজ্ঞ</p>
            </div>
            <div className="w-px h-8 bg-slate-100" />
            <div className="text-center">
              <p className="text-2xl font-black text-slate-800">৪.৯/৫</p>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">রেটিং</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="px-8 py-20 space-y-12 bg-white">

        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">আমাদের সেবাসমূহ</h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">কেন আমাদের বেছে নেবেন?</p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {[
            { icon: <ShieldCheck className="text-blue-600" />, title: "দক্ষ বিশেষজ্ঞ ডক্টর", desc: "নীলফামারীর সেরা বিশেষজ্ঞ ডক্টরদের সিরিয়াল নিন সহজেই।" },
            { icon: <Video className="text-emerald-600" />, title: "ভিডিও কনসাল্টেশন", desc: "দেশের সেরা বিশেষজ্ঞ ডাক্তারদের সাথে সরাসরি কথা বলুন।" },
            { icon: <Ambulance className="text-red-600" />, title: "জরুরি SOS সেবা", desc: "২৪/৭ জরুরি অ্যাম্বুলেন্স এবং অক্সিজেন সাপোর্ট।" }
          ].map((f, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex gap-6 items-center p-6 bg-slate-50 rounded-[32px] border border-slate-100"
            >
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                {f.icon}
              </div>
              <div>
                <h4 className="font-black text-sm text-slate-800 uppercase tracking-tight">{f.title}</h4>
                <p className="text-[10px] text-slate-500 font-medium mt-1 leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Social Proof */}
      <section className="px-8 py-20 bg-slate-900 text-white rounded-t-[56px]">
        <div className="text-center space-y-8">
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">
            <Star size={14} fill="currentColor" className="text-yellow-400" /> Trusted by Thousands
          </div>
          
          <h2 className="text-3xl font-black leading-tight tracking-tighter">
            মানুষ কেন আমাদের <br /> পছন্দ করে?
          </h2>

          <div className="space-y-6 text-left">
            {[
              { name: "রাহাত হোসেন", text: "ডাক্তারদের সিরিয়াল নেওয়ার জন্য এই অ্যাপটি অনেক কাজের। খুব সহজে অ্যাপয়েন্টমেন্ট পেয়েছি।" },
              { name: "সুমাইয়া আক্তার", text: "ভিডিও কনসাল্টেশন করে অনেক উপকৃত হয়েছি। ডাক্তার খুব ভালো ছিলেন।" }
            ].map((r, i) => (
              <div key={i} className="bg-white/5 p-6 rounded-[32px] border border-white/10">
                <p className="text-xs font-medium italic opacity-80 leading-relaxed">"{r.text}"</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-[10px] font-black">{r.name[0]}</div>
                  <p className="text-[10px] font-black uppercase tracking-widest">{r.name}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-10">
            <button 
              onClick={onStart}
              className="w-full bg-white text-blue-600 py-5 rounded-[32px] font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all"
            >
              এখনই শুরু করুন
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

// --- Main App ---

const generateReferralCode = (fullName: string, uid: string) => {
  const cleanName = fullName.replace(/[^A-Za-z]/g, '').slice(0, 4).toUpperCase() || 'REF';
  const suffix = uid.slice(-4).toUpperCase();
  return `${cleanName}${suffix}`;
};

export default function App() {
  const [showLanding, setShowLanding] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [homeSubCategory, setHomeSubCategory] = useState<'doctors' | 'live_doctor' | 'govt_health' | 'blood_donation' | 'hospitals' | 'dental' | 'labtests' | 'emergency' | 'buy_medicine' | 'medical_accessories' | 'free_doctors' | 'maternity_donation' | 'donation' | 'subscriptions'>('doctors');
  const [showLiveDoctorModal, setShowLiveDoctorModal] = useState(false);
  const [liveDoctorSelectedDoc, setLiveDoctorSelectedDoc] = useState<Doctor | null>(null);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const isAdmin = useMemo(() => {
    if (!user) return false;
    if (profile?.role === UserRole.ADMIN || profile?.role === UserRole.MODERATOR) return true;
    const email = (user.email || '').toLowerCase().trim();
    return email === 'doctorapp0p@gmail.com' || email === 'jagadbandhutum@gmail.com' || email === 'jagadbandhu';
  }, [profile, user]);
  const [isLoading, setIsLoading] = useState(true);
  const [contactPhone, setContactPhone] = useState('');
  const [patientName, setPatientName] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryDistance, setDeliveryDistance] = useState<'within_2km' | 'around_5km' | 'around_10km' | 'none'>('within_2km');
  const [tickerMessage, setTickerMessage] = useState('Nilpha-তে আপনাকে স্বাগত! ডাক্তার চেম্বারে বসার সময় এবং ডাক্তার ফি চূড়ান্ত জানার জন্য আমাদের হট লাইন নাম্বারে যোগাযোগ করুন। যেকোনো প্রয়োজনে কল করুন: ০১৩৫২৬৬৯১০০');

  // Specialty Scroll Ref
  const specialtyScrollRef = useRef<HTMLDivElement>(null);

  // Specialist & Location Filtering
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  // Multi-Order Cart State
  const [cart, setCart] = useState<{id: string, name: string, price: number, type: 'test' | 'emergency'}[]>([]);

  // Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [doctorSearchTerm, setDoctorSearchTerm] = useState('');
  const [adminSearchTerm, setAdminSearchTerm] = useState('');
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);

  // Modals & Auth
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'moderator'>('login');
  const [authErrorMessage, setAuthErrorMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPayment, setShowPayment] = useState<{show: boolean, amount: number, item: string, shipping: number, isVideo?: boolean, isClinic?: boolean, isTest?: boolean, hospitalName?: string}>({show: false, amount: 0, item: '', shipping: 0});
  const [selectedTestHospital, setSelectedTestHospital] = useState<string>('none');
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad' | null>(null);
  const [paymentType, setPaymentType] = useState<'online' | 'offline'>('online');
  const [trxId, setTrxId] = useState('');
  
  // Coupon States for Checkout
  const [couponsList, setCouponsList] = useState<Coupon[]>([]);
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  const handleApplyCoupon = (overrideCode?: string) => {
    setCouponError('');
    setCouponSuccess('');
    const code = (overrideCode || couponCodeInput).trim().toUpperCase();
    if (!code) {
      setCouponError('অনুগ্রহ করে কুপন কোড লিখুন।');
      return;
    }
    const result = validateCoupon(code, showPayment.amount, !!showPayment.isTest, couponsList);
    if (result.valid && result.coupon) {
      setAppliedCoupon(result.coupon);
      setCouponSuccess(result.message);
    } else {
      setCouponError(result.message);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCodeInput('');
    setCouponError('');
    setCouponSuccess('');
  };

  const fetchCouponsList = useCallback(async () => {
    try {
      const list = await fetchCoupons();
      setCouponsList(list);
    } catch (err) {
      console.warn("Notice: coupons fetch error:", err);
    }
  }, []);
  
  // Serial Form State
  const [showSerialModal, setShowSerialModal] = useState(false);
  const [serialStep, setSerialStep] = useState(0);
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null);
  const [serialData, setSerialData] = useState({
    patientInfo: '',
    date: '',
    problems: '',
    previousDoctor: ''
  });
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Synchronize activeTab with URL if necessary
    if (location.pathname === '/') {
       // Default behavior
    }
  }, [location]);

  // Firestore Error Handling Helper
  enum OperationType {
    CREATE = 'create',
    UPDATE = 'update',
    DELETE = 'delete',
    LIST = 'list',
    GET = 'get',
    WRITE = 'write',
  }

  interface FirestoreErrorInfo {
    error: string;
    operationType: OperationType;
    path: string | null;
    authInfo: {
      userId?: string | null;
      email?: string | null;
      emailVerified?: boolean | null;
    }
  }

  const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
      },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  };

  // Moderator/Admin Control States
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [allPrescriptions, setAllPrescriptions] = useState<Prescription[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [allAppointments, setAllAppointments] = useState<any[]>([]);
  const [userAppointments, setUserAppointments] = useState<any[]>([]);
  const [referredPatients, setReferredPatients] = useState<any[]>([]);
  const [referredAppointments, setReferredAppointments] = useState<any[]>([]);
  const appointmentsByProblem = useMemo(() => {
    const groups: { [problem: string]: any[] } = {};
    referredAppointments.forEach(app => {
      const prob = (app.problems || 'উল্লিখিত নেই').trim();
      if (!groups[prob]) {
        groups[prob] = [];
      }
      groups[prob].push(app);
    });
    return Object.entries(groups).map(([problem, apps]) => ({
      problem,
      apps,
    })).sort((a, b) => b.apps.length - a.apps.length);
  }, [referredAppointments]);
  const [isRegisteringPatientByDoc, setIsRegisteringPatientByDoc] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [hospitals, setHospitals] = useState<Clinic[]>([]);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [isLabTestsServiceEnabled, setIsLabTestsServiceEnabled] = useState<boolean>(true);
  const [selectedTestCategory, setSelectedTestCategory] = useState<string>('all');
  const [historyTab, setHistoryTab] = useState<'info' | 'history' | 'admin'>('info');
  const [adminSubTab, setAdminSubTab] = useState<'log' | 'users' | 'orders' | 'settings' | 'data'>('log');
  const [adminDataTab, setAdminDataTab] = useState<'doctors' | 'hospitals' | 'tests'>('doctors');
  const [selectedUserRecords, setSelectedUserRecords] = useState<{p: Profile, recs: Prescription[], ords: Order[]} | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Quiz & Reward System States
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [userSubmissions, setUserSubmissions] = useState<any[]>([]);
  const [userWithdrawals, setUserWithdrawals] = useState<any[]>([]);
  const [allQuizzes, setAllQuizzes] = useState<any[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<any[]>([]);
  const [allWithdrawals, setAllWithdrawals] = useState<any[]>([]);

  // Local UI states for Reward & Quiz inputs
  const [withdrawMethod, setWithdrawMethod] = useState<'bkash' | 'nagad'>('bkash');
  const [withdrawAccount, setWithdrawAccount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<{[quizId: string]: string}>({});
  const [quizDates, setQuizDates] = useState<{[quizId: string]: string}>({});

  // Capture URL referral parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref') || params.get('referredByCode');
    if (refCode) {
      localStorage.setItem('prefilled_referral_code', refCode.trim().toUpperCase());
    }
  }, []);

  useEffect(() => {
    const handleInitialPath = () => {
      const path = window.location.pathname;
      const params = new URLSearchParams(window.location.search);
      if (path === '/admin' || path === '/wp-admin') {
        setAuthMode('moderator');
        setShowAuthModal(true);
        window.history.replaceState({}, '', '/');
      } else if (path === '/register' || path === '/signup' || params.get('auth') === 'register' || params.get('register') !== null) {
        setAuthMode('register');
        setShowAuthModal(true);
        if (path === '/register' || path === '/signup') {
          window.history.replaceState({}, '', '/');
        }
      } else if (path === '/login' || path === '/signin' || params.get('auth') === 'login' || params.get('login') !== null) {
        setAuthMode('login');
        setShowAuthModal(true);
        if (path === '/login' || path === '/signin') {
          window.history.replaceState({}, '', '/');
        }
      }
    };
    handleInitialPath();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const WHATSAPP_NUMBER = '8801352669100';

  const handleWhatsAppConsult = (doctor: Doctor) => {
    setBookingDoctor(doctor);
    setSerialStep(0);
    setSerialData({
      patientInfo: '',
      date: '',
      problems: '',
      previousDoctor: ''
    });
    setShowSerialModal(true);
  };

  const finalizeSerialBooking = () => {
    if (!bookingDoctor) return;
    const userRefCode = profile?.referred_by_code || profile?.referral_code || localStorage.getItem('prefilled_referral_code') || '';
    
    let message = `হ্যালো জেবি হেলথকেয়ার, আমি ডাক্তার ${bookingDoctor.name}-এর সিরিয়াল বুকিং করতে চাই।\n\n`;
    message += `👤 রোগীর তথ্য (নাম, বয়স, ঠিকানা): ${serialData.patientInfo}\n`;
    message += `📅 পরামর্শের তারিখ: ${serialData.date}\n`;
    message += `🩺 সমস্যা: ${serialData.problems}\n`;
    message += `👨‍⚕️ আগের ডক্টর: ${serialData.previousDoctor}`;
    if (userRefCode) {
      message += `\n🔑 রেফার কোড: ${userRefCode}`;
    }

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
    setShowSerialModal(false);
    setBookingDoctor(null);
  };

  const handleWhatsAppBooking = () => {
    if (!patientName || !contactPhone) {
      alert('রোগীর নাম এবং ফোন নম্বর দিন।');
      return;
    }
    const transportFee = 
      deliveryDistance === 'within_2km' ? 30 :
      deliveryDistance === 'around_5km' ? 50 :
      deliveryDistance === 'around_10km' ? 80 : 0;

    const distanceLabel = 
      deliveryDistance === 'within_2km' ? 'নীলফামারী শহর (২ কিমি)' :
      deliveryDistance === 'around_5km' ? 'নীলফামারী শহর (৫ কিমি)' :
      deliveryDistance === 'around_10km' ? 'নীলফামারী শহর (১০ কিমি)' :
      'সরাসরি চেম্বার/সেন্টার';

    const couponDiscPct = appliedCoupon ? appliedCoupon.discount_percent : 0;
    const couponDiscAmt = appliedCoupon ? Math.round((showPayment.amount * couponDiscPct) / 100) : 0;
    const discServiceAmount = Math.max(0, showPayment.amount - couponDiscAmt);
    const totalAmount = discServiceAmount + transportFee;
    const couponInfo = appliedCoupon ? `\n🎟️ কুপন ডিসকাউন্ট: ${appliedCoupon.code} (${couponDiscPct}% ছাড় = -৳${couponDiscAmt} BDT)` : '';
    const testHospitalInfo = showPayment.isTest
      ? `\n🏥 নির্বাচিত টেস্টের হাসপাতাল: ${selectedTestHospital === 'none' ? 'নির্দিষ্ট কোনো হাসপাতাল নেই (অন্য যেকোনো স্থান/বিশ্বস্ত ল্যাব)' : selectedTestHospital}`
      : (showPayment.hospitalName ? `\n🏥 হাসপাতাল: ${showPayment.hospitalName}` : '');
    const userRefCode = profile?.referred_by_code || profile?.referral_code || localStorage.getItem('prefilled_referral_code') || '';
    const refCodeInfo = userRefCode ? `\n🔑 রেফার কোড: ${userRefCode}` : '';
    const message = `হ্যালো নিলফা হেলথকেয়ার,\n\nআমি একটি সার্ভিস/পণ্য বুক করতে চাই:\n📝 আইটেম: ${showPayment.item}${testHospitalInfo}${refCodeInfo}\n💰 সার্ভিস মূল্য: ৳${showPayment.amount}${couponInfo}\n🚗 যাতায়াত/ডেলিভারি ফি: ৳${transportFee} (${distanceLabel})\n💳 সর্বমোট প্রদেয়: ৳${totalAmount} BDT\n\n👤 সেবা গ্রহণকারী/রোগী: ${patientName}\n📱 মোবাইল: ${contactPhone}\n📍 ঠিকানা: ${deliveryAddress || 'উলেখিত নেই'}\n💳 পেমেন্ট পদ্ধতি: ${paymentType === 'offline' ? 'ক্যাশ অন সার্ভিস' : (paymentMethod || 'bkash') + ' (TrxID: ' + (trxId || 'N/A') + ')'}\n\nদয়া করে আমার এই বুকিং টি দ্রুত কনফার্ম করুন।`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
  };

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) {
      alert('আপনার ব্রাউজার মেনু থেকে "Install App" বা "Add to Home Screen" এ ক্লিক করুন। আইফোনের ক্ষেত্রে শেয়ার বাটন থেকে "Add to Home Screen" করুন।');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleShare = async () => {
    const shareUrl = 'https://www.nilpha.com/';
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'JB Healthcare',
          text: 'জেবি হেলথকেয়ার - আপনার ডিজিটাল ডাক্তার। স্বাস্থ্যসেবা এখন আপনার হাতের মুঠোয়।',
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert('অ্যাপ লিঙ্ক কপি করা হয়েছে!');
      }
    } catch (err: any) {
      // Don't log canceled or abort errors as they are not "bugs"
      if (err.name === 'AbortError') {
        console.log('Share was canceled by user');
        return;
      }
      
      console.warn('Sharing failed, attempting clipboard fallback', err.message);
      
      // Fallback to clipboard if share fails or is cancelled
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('অ্যাপ লিঙ্ক কপি করা হয়েছে!');
      } catch (clipboardErr: any) {
        // If document isn't focused, we can't do much, just log it silenty for devs
        if (clipboardErr.name === 'NotAllowedError' || clipboardErr.message.includes('focused')) {
          console.warn('Clipboard failed due to focus loss, link was not copied.');
        } else {
          console.error('Final clipboard fallback failed', clipboardErr);
        }
      }
    }
  };

  const PAYMENT_NUMBERS = { bkash: '01518395772', nagad: '01846800973' };

  useEffect(() => {
    const init = async () => {
      // 1. Check for saved custom session in localStorage first
      const savedSessionRaw = localStorage.getItem('jb_custom_session');
      if (savedSessionRaw) {
        try {
          const savedSession = JSON.parse(savedSessionRaw);
          if (savedSession && savedSession.uid) {
            const profileRef = doc(db, 'profiles', savedSession.uid);
            const profileSnap = await getDoc(profileRef);
            if (profileSnap.exists()) {
              const prof = profileSnap.data() as Profile;
              setUser({
                uid: savedSession.uid,
                email: savedSession.email || prof.virtual_email || '',
                displayName: prof.full_name || 'User'
              } as any);
              setProfile(prof);
            }
          }
        } catch (e) {
          console.warn("Could not restore saved session:", e);
        }
      }

      onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          setUser(firebaseUser);
            try {
              const profileRef = doc(db, 'profiles', firebaseUser.uid);
              const profileSnap = await getDoc(profileRef);
              
              if (!profileSnap.exists()) {
                // Create profile if missing
                const refCode = generateReferralCode(firebaseUser.displayName || 'User', firebaseUser.uid);
                const newProf: Profile = {
                  id: firebaseUser.uid,
                  full_name: firebaseUser.displayName || 'User',
                  phone: '',
                  role: (firebaseUser.email === 'jagadbandhutum@gmail.com' || firebaseUser.email === 'doctorapp0p@gmail.com') ? UserRole.ADMIN : UserRole.PATIENT,
                  status: 'active',
                  referral_code: refCode,
                  reward_points: 0,
                  taka_balance: 0
                };
                
                // Check if there was a referredByCode prefilled in localStorage
                const prefilledRef = localStorage.getItem('prefilled_referral_code');
                if (prefilledRef) {
                  const refCodeUpper = prefilledRef.trim().toUpperCase();
                  newProf.referred_by_code = refCodeUpper;
                  
                  try {
                    const referrersQuery = query(collection(db, 'profiles'), where('referral_code', '==', refCodeUpper));
                    const referrersSnap = await getDocs(referrersQuery);
                    if (!referrersSnap.empty) {
                      const referrerDoc = referrersSnap.docs[0];
                      const referrerRef = doc(db, 'profiles', referrerDoc.id);
                      await updateDoc(referrerRef, {
                        reward_points: increment(20)
                      });
                    }
                  } catch (refErr) {
                    console.error("Error rewarding referrer on Google Sign-in:", refErr);
                  }
                  localStorage.removeItem('prefilled_referral_code');
                }

                await setDoc(profileRef, newProf);
                setProfile(newProf);
                localStorage.setItem('jb_custom_session', JSON.stringify({
                  uid: newProf.id,
                  email: firebaseUser.email || '',
                  role: newProf.role
                }));
              } else {
                let prof = profileSnap.data() as Profile;
                // Force update role if it's the owner email
                if ((firebaseUser.email === 'jagadbandhutum@gmail.com' || firebaseUser.email === 'doctorapp0p@gmail.com') && prof.role !== UserRole.ADMIN) {
                  prof.role = UserRole.ADMIN;
                  await updateDoc(profileRef, { role: UserRole.ADMIN });
                }
                
                let updated = false;
                if (!prof.referral_code) {
                  prof.referral_code = generateReferralCode(prof.full_name || 'User', firebaseUser.uid);
                  updated = true;
                }
                if (prof.reward_points === undefined) {
                  prof.reward_points = 0;
                  updated = true;
                }
                if (prof.taka_balance === undefined) {
                  prof.taka_balance = 0;
                  updated = true;
                }
                
                if (updated) {
                  await updateDoc(profileRef, {
                    referral_code: prof.referral_code,
                    reward_points: prof.reward_points,
                    taka_balance: prof.taka_balance
                  });
                }
                setProfile(prof);
                localStorage.setItem('jb_custom_session', JSON.stringify({
                  uid: prof.id,
                  email: firebaseUser.email || prof.virtual_email || '',
                  role: prof.role
                }));
              }
            } catch (error) {
              handleFirestoreError(error, OperationType.GET, `profiles/${firebaseUser.uid}`);
            }
          } else {
            const hasCustomSession = localStorage.getItem('jb_custom_session');
            if (!hasCustomSession) {
              setUser(null);
              setProfile(null);
            }
          }
        });

      try {
        const settingsRef = doc(db, 'settings', 'ticker_message');
        const settingsSnap = await getDoc(settingsRef);
        if (settingsSnap.exists()) {
          let val = settingsSnap.data().value || '';
          const originalVal = val;
          // Remove 20% discount text if present
          if (
            val.includes('২০ পার্সেন্ট') || 
            val.includes('২০%') || 
            val.includes('20%') || 
            val.includes('20 percent') ||
            val.includes('সিরিয়াল দিলে ২০')
          ) {
            val = val
              .replace(/অ্যাপস বা ওয়েবসাইটের মাধ্যমে\s*সিরিয়াল দিলে\s*(২০|20)\s*(পার্সেন্ট|%)\s*ডিসকাউন্ট[।.]?/gi, '')
              .replace(/সিরিয়াল দিলে\s*(২০|20)\s*(পার্সেন্ট|%)\s*ডিসকাউন্ট[।.]?/gi, '')
              .replace(/(২০|20)\s*(পার্সেন্ট|%)\s*ডিসকাউন্ট[।.]?/gi, '')
              .replace(/20%\s*discount[.]?/gi, '')
              .replace(/\s{2,}/g, ' ')
              .trim();
          }
          if (val.includes('01846800973') || val.includes('০১৮৪৬৮০০৯৭৩')) {
            val = val.replace(/01846800973/g, '01352669100').replace(/০১৮৪৬৮০০৯৭৩/g, '০১৩৫২৬৬৯১০০');
          }
          if (val !== originalVal && val.length > 0) {
            setDoc(settingsRef, { key: 'ticker_message', value: val }).catch(e => console.warn("Auto updating ticker DB skipped: ", e?.message || e));
          }
          setTickerMessage(val || 'Nilpha-তে আপনাকে স্বাগত! ডাক্তার চেম্বারে বসার সময় এবং ডাক্তার ফি চূড়ান্ত জানার জন্য আমাদের হট লাইন নাম্বারে যোগাযোগ করুন। যেকোনো প্রয়োজনে কল করুন: ০১৩৫২৬৬৯১০০');
        }

        const labStatusRef = doc(db, 'settings', 'lab_tests_status');
        const labStatusSnap = await getDoc(labStatusRef);
        if (labStatusSnap.exists()) {
          setIsLabTestsServiceEnabled(labStatusSnap.data().enabled ?? true);
        }
      } catch (error: any) {
        console.warn("Notice: Initializing with local settings (Firestore notice):", error?.message || error);
      }
      
      // Fetch initial data
      await fetchData();
      
      // Fetch initial coupons
      await fetchCouponsList();
      
      setIsLoading(false);
    };
    init();
    
    // Check if landing has been seen
    const hasSeenLanding = sessionStorage.getItem('jb_landing_seen');
    if (hasSeenLanding) setShowLanding(false);
  }, []);

  const fetchData = async () => {
    try {
      const docRes = await getDocs(collection(db, 'doctors'));
      const hospRes = await getDocs(collection(db, 'hospitals'));
      const testRes = await getDocs(collection(db, 'lab_tests'));
      
      const dbDoctors = docRes.docs.map(d => {
        const data = d.data() as Doctor;
        if (d.id === 'ek-med1') {
          // If we are logged in as admin/moderator and the DB version has outdated schedule, update it in Firestore
          const needsUpdate = data.schedule !== 'প্রতি শুক্রবার: দুপুর ২:০০ - ৫:০০';
          if (needsUpdate && profile && (profile.role === UserRole.ADMIN || profile.role === UserRole.MODERATOR)) {
            import('firebase/firestore').then(({ doc, updateDoc }) => {
              updateDoc(doc(db, 'doctors', 'ek-med1'), {
                schedule: 'প্রতি শুক্রবার: দুপুর ২:০০ - ৫:০০'
              }).catch(e => console.error("Auto-correcting Dr. Dip Jyoti's schedule failed: ", e));
            });
          }
          return {
            ...data,
            id: d.id,
            schedule: 'প্রতি শুক্রবার: দুপুর ২:০০ - ৫:০০'
          };
        }
        if (d.id === 'j-sakil' || d.id === 'j-shakil') {
          // Auto-correct Dr. Sahariar Ahmed Shakil's details and schedule in Firestore
          const correctSchedule = 'প্রতি শুক্রবার বিকাল ৩:০০ টা থেকে রাত ৯:০০ টা পর্যন্ত';
          const needsUpdate = data.schedule !== correctSchedule || data.specialty !== 'Medicine';
          if (needsUpdate && profile && (profile.role === UserRole.ADMIN || profile.role === UserRole.MODERATOR)) {
            import('firebase/firestore').then(({ doc, updateDoc }) => {
              updateDoc(doc(db, 'doctors', d.id), {
                name: 'Dr. Sahariar Ahmed Shakil',
                degree: 'MBBS, BCS (স্বাস্থ্য) | সাধারণ ও মেডিসিন বিশেষজ্ঞ',
                specialty: 'Medicine',
                schedule: correctSchedule,
                clinics: ['c-janata'],
                districts: ['Nilphamari']
              }).catch(e => console.error("Auto-correcting Dr. Shakil's details failed: ", e));
            });
          }
          return {
            ...data,
            id: d.id,
            name: 'Dr. Sahariar Ahmed Shakil',
            degree: 'MBBS, BCS (স্বাস্থ্য) | সাধারণ ও মেডিসিন বিশেষজ্ঞ',
            specialty: 'Medicine',
            schedule: correctSchedule,
            clinics: data.clinics?.length ? Array.from(new Set([...data.clinics, 'c-janata'])) : ['c-janata'],
            districts: data.districts?.length ? Array.from(new Set([...data.districts, 'Nilphamari'])) : ['Nilphamari']
          };
        }
        if (d.id === 'dr-habibur-rahman-dental') {
          return {
            ...data,
            id: d.id,
            name: 'Dr. Md. Habibur Rahman (Dentist) - ডা. মো. হাবিবুর রহমান (হাবীব)',
            degree: 'বি.ডি.এস. (রাজশাহী মেডিকেল কলেজ) | মুখ ও দন্তরোগ বিশেষজ্ঞ ও সার্জন (Dentist & Dental Surgeon) | বি.এম.ডি.সি. রেজি. নং– ৮৫৭৭ | ওরাল সার্জারি, ডেন্টাল ফিলিং ও রুট ক্যানেল চিকিৎসায় অ্যাডভান্সড ট্রেনিং প্রাপ্ত',
            specialty: 'Dentistry',
            schedule: 'সকাল: ১০:০০টা - দুপুর ১:০০টা, বিকাল: ৪:০০টা - রাত ৯:০০টা',
            clinics: data.clinics?.length ? Array.from(new Set([...data.clinics, 'c-doctors-dental'])) : ['c-doctors-dental'],
            districts: data.districts?.length ? Array.from(new Set([...data.districts, 'Nilphamari'])) : ['Nilphamari']
          };
        }
        if (d.id === 'dr-ar-rezaul-alam') {
          return {
            ...data,
            id: d.id,
            name: 'অধ্যাপক ডা. মো. রেজাউল আলম',
            degree: 'এমবিবিএস, ডিভি (থাইল্যান্ড), এমপিএইচ (ঢাকা), সিসিএস (ইন্ডিয়া), সিসিডি (বারডেম) | অধ্যাপক ও বিভাগীয় প্রধান, চর্ম ও যৌন রোগ বিভাগ, রংপুর কমিউনিটি মেডিকেল কলেজ ও হাসপাতাল, রংপুর | চর্ম-যৌন, এলার্জি ও কুষ্ট রোগ বিশেষজ্ঞ',
            specialty: 'Dermatology',
            schedule: 'প্রতি সোমবার ও বৃহস্পতিবার বিকাল ৫টা থেকে রাত ৯টা পর্যন্ত',
            clinics: ['c-ar'],
            districts: ['Nilphamari']
          };
        }
        if (d.id === 'dr-ar-hasina-banu') {
          return {
            ...data,
            id: d.id,
            name: 'ডা. মোছা. হাসিনা বানু (Dr. Mst. Hasina Banu)',
            degree: 'এমবিবিএস, বিসিএস (স্বাস্থ্য), এমসিপিএস (গাইনী এন্ড অবস), এফসিপিএস (গাইনী এন্ড অবস) | সহকারী অধ্যাপক (গাইনী এন্ড অবস্), ২৫০ শয্যা জেনারেল হাসপাতাল, নীলফামারী | স্ত্রীরোগ ও প্রসূতি বিদ্যা বিশেষজ্ঞ ও সার্জন',
            specialty: 'Gynecology',
            schedule: 'প্রতিদিন বিকাল ৪টা থেকে রাত ১০টা পর্যন্ত, প্রতি শুক্রবার দুপুর ১ টা - রাত ১০ টা পর্যন্ত।',
            clinics: ['c-ar'],
            districts: ['Nilphamari']
          };
        }
        if (d.id === 'dr-ar-shamsur') {
          return {
            ...data,
            id: d.id,
            name: 'ডা. মো. শামসুর রহমান (Dr. Md. Shamsur Rahman)',
            degree: 'এমবিবিএস, বিসিএস (স্বাস্থ্য), এমডি (ফিজিক্যাল মেডিসিন এন্ড রিহ্যাবিলিটেশন) | কনসালটেন্ট, ২৫০ শয্যা জেনারেল হাসপাতাল, নীলফামারী | বাত-ব্যথা, প্যারালাইসিস, স্পোর্টস, মেডিসিন এন্ড রিহ্যাবিলিটেশন বিশেষজ্ঞ',
            specialty: 'Physical Medicine',
            schedule: 'প্রতি রবি, সোম ও বুধবার বিকাল ৪টা - রাত ৯টা পর্যন্ত।',
            clinics: ['c-ar'],
            districts: ['Nilphamari']
          };
        }
        if (d.id === 'dr-ar-mahbubul') {
          return {
            ...data,
            id: d.id,
            name: 'ডা. মো: মাহবুবুল আলম চৌধুরী (Dr. Md. Mahbubul Alam Chowdhury)',
            degree: 'এমবিবিএস (ঢাকা), বিসিএস (স্বাস্থ্য), এমসিপিএস, ডিএলও (ইএনটি) | সহযোগী অধ্যাপক- ইএনটি, নীলফামারী মেডিকেল কলেজ, নীলফামারী | নাক, কান, গলা রোগ বিশেষজ্ঞ ও হেড নেক সার্জন',
            specialty: 'ENT',
            schedule: 'প্রতি মঙ্গলবার ও শুক্রবার বিকাল ০৪টা থেকে রাত ০৯ টা পর্যন্ত।',
            clinics: ['c-ar'],
            districts: ['Nilphamari']
          };
        }
        return { id: d.id, ...data } as Doctor;
      }).filter(d => d.id !== 'moun-biplab');

      // Check if moun-biplab exists in Firestore and clean it up if user is admin/moderator
      const hasBiplabInDb = docRes.docs.some(d => d.id === 'moun-biplab');
      if (hasBiplabInDb && profile && (profile.role === UserRole.ADMIN || profile.role === UserRole.MODERATOR)) {
        import('firebase/firestore').then(({ doc, deleteDoc }) => {
          deleteDoc(doc(db, 'doctors', 'moun-biplab')).catch(e => console.error("Auto-deleting Dr. Biplab failed: ", e));
        });
      }

      // Auto-sync updated c-ar doctors in DB if user is admin/moderator
      if (profile && (profile.role === UserRole.ADMIN || profile.role === UserRole.MODERATOR)) {
        import('firebase/firestore').then(({ doc, setDoc }) => {
          const arTargetDocs = DOCTORS.filter(d => ['dr-ar-hasina-banu', 'dr-ar-shamsur', 'dr-ar-mahbubul'].includes(d.id));
          arTargetDocs.forEach(arDoc => {
            setDoc(doc(db, 'doctors', arDoc.id), arDoc, { merge: true }).catch(e => console.warn(`Auto-syncing ${arDoc.id} in DB:`, e));
          });
        });
      }

      const dbHospitals = hospRes.docs.map(h => ({ id: h.id, ...h.data() } as Clinic));
      const dbTests = testRes.docs.map(t => ({ id: t.id, ...t.data() } as LabTest));

      // Merge DB data with local constants: DB version has precedence, but local entries not in DB are merged
      const mergedDoctors = dbDoctors.length > 0
        ? [...dbDoctors, ...DOCTORS.filter(d => !dbDoctors.some(dbD => dbD.id === d.id))]
        : DOCTORS;

      // Sequential list ordering: hospital/clinic/thana doctors appear first in sequential order, and Dr. Habibur Rahman (Dentist) is placed at the very end of the list
      const sortedMergedDoctors = [...mergedDoctors].sort((a, b) => {
        const isAHabib = a.id === 'dr-habibur-rahman-dental' || (a.name && (a.name.includes('হাবিবুর') || a.name.toLowerCase().includes('habibur')));
        const isBHabib = b.id === 'dr-habibur-rahman-dental' || (b.name && (b.name.includes('হাবিবুর') || b.name.toLowerCase().includes('habibur')));
        if (isAHabib && !isBHabib) return 1;
        if (!isAHabib && isBHabib) return -1;
        return 0;
      });

      const mergedHospitalsList = dbHospitals.length > 0
        ? dbHospitals.map(dbH => {
            const localC = CLINICS.find(c => c.id === dbH.id);
            if (localC) {
              const combinedDoctors = dbH.id === 'c-ar'
                ? (localC.doctors || [])
                : Array.from(new Set([...(dbH.doctors || []), ...(localC.doctors || [])])).filter(id => id !== 'moun-biplab');
              
              // If c-moun hospital has moun-biplab in its DB doctors array, and active user is admin, auto-correct the database
              if (dbH.id === 'c-moun' && dbH.doctors?.includes('moun-biplab') && profile && (profile.role === UserRole.ADMIN || profile.role === UserRole.MODERATOR)) {
                import('firebase/firestore').then(({ doc, updateDoc }) => {
                  updateDoc(doc(db, 'hospitals', 'c-moun'), {
                    doctors: combinedDoctors
                  }).catch(e => console.error("Auto-correcting C-Moun hospital doctors failed: ", e));
                });
              }

              // Auto-sync c-ar hospital details in DB if user is admin/moderator
              if (dbH.id === 'c-ar' && profile && (profile.role === UserRole.ADMIN || profile.role === UserRole.MODERATOR)) {
                import('firebase/firestore').then(({ doc, updateDoc }) => {
                  updateDoc(doc(db, 'hospitals', 'c-ar'), {
                    address: localC.address,
                    doctors: localC.doctors
                  }).catch(e => console.warn("Auto-syncing c-ar in DB: ", e));
                });
              }

              return { ...dbH, ...localC, doctors: combinedDoctors };
            }
            return dbH;
          })
        : CLINICS;

      const finalHospitals = dbHospitals.length > 0
        ? [...mergedHospitalsList, ...CLINICS.filter(c => !dbHospitals.some(dbH => dbH.id === c.id))]
        : CLINICS;

      const finalTests = dbTests.length > 0
        ? [...dbTests, ...LAB_TESTS.filter(t => !dbTests.some(dbT => dbT.id === t.id))]
        : LAB_TESTS;

      setDoctors(sortedMergedDoctors);
      setHospitals(finalHospitals);
      setLabTests(finalTests);
    } catch (error: any) {
       console.warn("Notice: Using local bundled healthcare repository (Firestore notice):", error?.message || error);
       // Seamless fallback to constants on error
       const sortedDoctors = [...DOCTORS].sort((a, b) => {
         const isAHabib = a.id === 'dr-habibur-rahman-dental' || (a.name && (a.name.includes('হাবিবুর') || a.name.toLowerCase().includes('habibur')));
         const isBHabib = b.id === 'dr-habibur-rahman-dental' || (b.name && (b.name.includes('হাবিবুর') || b.name.toLowerCase().includes('habibur')));
         if (isAHabib && !isBHabib) return 1;
         if (!isAHabib && isBHabib) return -1;
         return 0;
       });
       setDoctors(sortedDoctors);
       setHospitals(CLINICS);
       setLabTests(LAB_TESTS);
    }
  };

  useEffect(() => {
    if (user) {
      if (isAdmin) {
        fetchAdminData();
      } else {
        fetchUserData();
      }
    }
  }, [user, isAdmin, activeTab]);

  const fetchAdminData = async () => {
    let rawProfiles: Profile[] = [];
    // 1. Fetch profiles safely
    try {
      let profSnap;
      try {
        profSnap = await getDocs(query(collection(db, 'profiles'), orderBy('full_name', 'asc')));
      } catch (e) {
        profSnap = await getDocs(collection(db, 'profiles'));
      }
      rawProfiles = profSnap.docs.map(d => ({ id: d.id, ...d.data() } as Profile));
    } catch (e) {
      console.warn("Admin fetch profiles error:", e);
    }

    // 2. Fetch prescriptions safely
    try {
      let presSnap;
      try {
        presSnap = await getDocs(query(collection(db, 'prescriptions'), orderBy('created_at', 'desc')));
      } catch (e) {
        presSnap = await getDocs(collection(db, 'prescriptions'));
      }
      const pList = presSnap.docs.map(d => ({ id: d.id, ...d.data() } as Prescription));
      pList.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
      setAllPrescriptions(pList);
    } catch (e) {
      console.warn("Admin fetch prescriptions error:", e);
    }

    // 3. Fetch orders safely
    let oList: Order[] = [];
    try {
      let ordSnap;
      try {
        ordSnap = await getDocs(query(collection(db, 'orders'), orderBy('created_at', 'desc')));
      } catch (e) {
        ordSnap = await getDocs(collection(db, 'orders'));
      }
      oList = ordSnap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
      oList.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
      setAllOrders(oList);
    } catch (e) {
      console.warn("Admin fetch orders error:", e);
    }

    // 4. Fetch appointments safely
    let aList: any[] = [];
    try {
      let appSnap;
      try {
        appSnap = await getDocs(query(collection(db, 'appointments'), orderBy('created_at', 'desc')));
      } catch (e) {
        appSnap = await getDocs(collection(db, 'appointments'));
      }
      aList = appSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      aList.sort((a: any, b: any) => (b.created_at || '').localeCompare(a.created_at || ''));
      setAllAppointments(aList);
    } catch (e) {
      console.warn("Admin fetch appointments error:", e);
    }

    // Combine profiles with unique patients from appointments and orders
    const pList = [...rawProfiles];
    const existingPhones = new Set(pList.map(p => (p.phone || '').trim()).filter(Boolean));
    const existingIds = new Set(pList.map(p => p.id));

    aList.forEach((app: any) => {
      const phone = (app.patient_phone || app.phone || '').trim();
      const name = (app.patient_name || '').trim();
      const id = app.patient_id || (phone ? `phone_${phone}` : null);
      if (id && !existingIds.has(id) && (!phone || !existingPhones.has(phone))) {
        if (name || phone) {
          existingIds.add(id);
          if (phone) existingPhones.add(phone);
          pList.push({
            id: id,
            full_name: name || phone || 'Registered Patient',
            phone: phone,
            role: UserRole.PATIENT,
            status: 'active'
          });
        }
      }
    });

    oList.forEach((ord: any) => {
      const phone = (ord.sender_contact || '').trim();
      const name = (ord.sender_name || '').trim();
      const id = ord.user_id || (phone ? `phone_${phone}` : null);
      if (id && !existingIds.has(id) && (!phone || !existingPhones.has(phone))) {
        if (name || phone) {
          existingIds.add(id);
          if (phone) existingPhones.add(phone);
          pList.push({
            id: id,
            full_name: name || phone || 'Customer',
            phone: phone,
            role: UserRole.PATIENT,
            status: 'active'
          });
        }
      }
    });

    pList.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
    setAllProfiles(pList);

    // Fetch all quizzes
    try {
      const quizSnap = await getDocs(collection(db, 'quizzes'));
      const qList = quizSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      qList.sort((a: any, b: any) => (b.created_at || '').localeCompare(a.created_at || ''));
      setAllQuizzes(qList);
    } catch (e) {
      console.warn("Admin fetch quizzes error:", e);
    }

    // Fetch all submissions
    try {
      const subSnap = await getDocs(collection(db, 'quiz_submissions'));
      const sList = subSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      sList.sort((a: any, b: any) => (b.created_at || '').localeCompare(a.created_at || ''));
      setAllSubmissions(sList);
    } catch (e) {
      console.warn("Admin fetch submissions error:", e);
    }

    // Fetch all withdrawals
    try {
      const wdSnap = await getDocs(collection(db, 'withdrawals'));
      const wList = wdSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      wList.sort((a: any, b: any) => (b.created_at || '').localeCompare(a.created_at || ''));
      setAllWithdrawals(wList);
    } catch (e) {
      console.warn("Admin fetch withdrawals error:", e);
    }
  };

  const handleUpdateAppointmentStatus = async (appId: string, status: 'pending' | 'visited' | 'absent') => {
    if (!user || profile?.role !== UserRole.ADMIN) {
      alert("অ্যাডমিন পারমিশন নেই।");
      return;
    }
    try {
      const appRef = doc(db, 'appointments', appId);
      const appSnap = await getDoc(appRef);

      if (!appSnap.exists()) {
        alert("সিরিয়াল ডাটাবেজে পাওয়া যায়নি।");
        return;
      }

      const appData = appSnap.data();
      const oldStatus = appData.status || 'pending';

      if (status === 'visited' && oldStatus !== 'visited') {
        // Find referral code
        let refCode = (appData.referred_by_code || '').trim();
        if (!refCode && appData.patient_id) {
          try {
            const patSnap = await getDoc(doc(db, 'profiles', appData.patient_id));
            if (patSnap.exists()) {
              refCode = (patSnap.data().referred_by_code || '').trim();
            }
          } catch (e) {
            console.error("Patient profile fetch error:", e);
          }
        }

        if (refCode) {
          const refCodeUpper = refCode.toUpperCase();
          const refCodeVars = Array.from(new Set([refCodeUpper, refCode.toLowerCase(), refCode]));

          // Find referrer profile
          const refProfQuery = query(
            collection(db, 'profiles'),
            where('referral_code', 'in', refCodeVars)
          );
          const refProfSnap = await getDocs(refProfQuery);

          if (!refProfSnap.empty) {
            const referrerDoc = refProfSnap.docs[0];
            const referrerId = referrerDoc.id;
            const referrerData = referrerDoc.data() as Profile;

            // Fetch referrer's visited appointments in the current calendar month
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth();

            const visitedAppQuery = query(
              collection(db, 'appointments'),
              where('referred_by_code', 'in', refCodeVars),
              where('status', '==', 'visited')
            );
            const visitedAppSnap = await getDocs(visitedAppQuery);

            let monthlyVisitedCount = 0;
            visitedAppSnap.docs.forEach(d => {
              if (d.id === appId) return; // exclude current appointment if already visited
              const data = d.data();
              let dateObj = new Date();
              if (data.created_at) {
                if (typeof data.created_at === 'string') dateObj = new Date(data.created_at);
                else if (data.created_at.seconds) dateObj = new Date(data.created_at.seconds * 1000);
              }
              if (dateObj.getFullYear() === currentYear && dateObj.getMonth() === currentMonth) {
                monthlyVisitedCount++;
              }
            });

            // Calculate level-up commission: 50 + (N-1)*10 for N-th patient this month
            const patientSequenceInMonth = monthlyVisitedCount + 1;
            const monthlyCommission = 50 + (patientSequenceInMonth - 1) * 10;

            // Check 10-Referrals condition bonus (50 Taka)
            let unlockBonus = 0;
            if (!referrerData.referral_10_bonus_credited) {
              const refUsersQuery = query(
                collection(db, 'profiles'),
                where('referred_by_code', 'in', refCodeVars)
              );
              const refUsersSnap = await getDocs(refUsersQuery);
              if (refUsersSnap.size >= 10) {
                unlockBonus = 50;
              }
            }

            const totalCredit = monthlyCommission + unlockBonus;

            // Update referrer profile balance in Firestore
            await updateDoc(doc(db, 'profiles', referrerId), {
              taka_balance: increment(totalCredit),
              reward_points: increment(totalCredit),
              ...(unlockBonus > 0 ? { referral_10_bonus_credited: true } : {})
            });

            // Update appointment record
            await updateDoc(appRef, {
              status: 'visited',
              reward_credited: true,
              credited_amount: totalCredit,
              credited_to: referrerId,
              visited_at: serverTimestamp(),
              referred_by_code: refCodeUpper
            });

            alert(`✓ রোগী দেখানোর তথ্য সেভ হয়েছে!\n\nরেফারার (${referrerData.full_name || refCodeUpper}) এর অ্যাকাউন্টে ৳${totalCredit} BDT রিওয়ার্ড ওয়ালেটে যোগ করা হয়েছে।\n(এ মাসের ${patientSequenceInMonth}-তম রোগী রিওয়ার্ড: ৳${monthlyCommission}${unlockBonus > 0 ? ' + ৳৫০ রেফারেল শর্ত বোনাস' : ''})`);
          } else {
            await updateDoc(appRef, { status: 'visited', visited_at: serverTimestamp() });
          }
        } else {
          await updateDoc(appRef, { status: 'visited', visited_at: serverTimestamp() });
        }
      } else if (status !== 'visited' && oldStatus === 'visited' && appData.reward_credited && appData.credited_to) {
        // Reverse credited money if status changed back from visited to absent/pending
        const amountToDeduct = appData.credited_amount || 0;
        if (amountToDeduct > 0) {
          try {
            await updateDoc(doc(db, 'profiles', appData.credited_to), {
              taka_balance: increment(-amountToDeduct),
              reward_points: increment(-amountToDeduct)
            });
          } catch (errDeduct) {
            console.error("Error deducting reward points:", errDeduct);
          }
        }
        await updateDoc(appRef, {
          status,
          reward_credited: false,
          credited_amount: 0
        });
      } else {
        await updateDoc(appRef, { status });
      }

      await fetchAdminData();
      await fetchData();
    } catch (err: any) {
      console.error("Error updating appointment status:", err);
      alert("সিরিয়াল স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে। এরর: " + err.message);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: 'pending' | 'verified' | 'completed' | 'cancelled') => {
    if (!user || profile?.role !== UserRole.ADMIN) {
      alert("অ্যাডমিন পারমিশন নেই।");
      return;
    }
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status });
      const statusText = 
        status === 'verified' ? 'একসেপ্ট (Verified)' :
        status === 'completed' ? 'সম্পন্ন (Completed)' :
        status === 'cancelled' ? 'ডিনাই / বাতিল (Cancelled)' : 'পেন্ডিং';
      alert(`অর্ডার স্ট্যাটাস সফলভাবে "${statusText}" আপডেট করা হয়েছে!`);
      await fetchAdminData();
      await fetchUserData();
    } catch (err: any) {
      console.error("Order status update error:", err);
      alert("অর্ডার স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে: " + err.message);
    }
  };

  const fetchUserData = async () => {
    if (!profile) return;
    
    const getTimestampMs = (val: any): number => {
      if (!val) return 0;
      if (typeof val === 'string') {
        const parsed = Date.parse(val);
        return isNaN(parsed) ? 0 : parsed;
      }
      if (typeof val.seconds === 'number') {
        return val.seconds * 1000;
      }
      if (typeof val.toDate === 'function') {
        return val.toDate().getTime();
      }
      return 0;
    };
    
    // 1. Fetch prescriptions
    try {
      const presQuery = query(
        collection(db, 'prescriptions'),
        where(profile.role === UserRole.DOCTOR ? 'doctor_id' : 'patient_id', '==', user.uid || user.id)
      );
      const presSnap = await getDocs(presQuery);
      const prescriptions = presSnap.docs.map(d => ({ id: d.id, ...d.data() } as Prescription));
      prescriptions.sort((a, b) => {
        const tA = getTimestampMs(a.created_at);
        const tB = getTimestampMs(b.created_at);
        return tB - tA;
      });
      setAllPrescriptions(prescriptions);
    } catch (err) {
      console.error("Prescriptions fetch error:", err);
    }

    // 2. Fetch orders
    try {
      const ordersQuery = query(
        collection(db, 'orders'),
        where('user_id', '==', user.uid || user.id)
      );
      const ordSnap = await getDocs(ordersQuery);
      const orders = ordSnap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
      orders.sort((a, b) => {
        const tA = getTimestampMs(a.created_at);
        const tB = getTimestampMs(b.created_at);
        return tB - tA;
      });
      setAllOrders(orders);
    } catch (err) {
      console.error("Orders fetch error:", err);
    }

    // 3. Fetch user appointments
    try {
      const appQuery = query(
        collection(db, 'appointments'),
        where('patient_id', '==', user.uid || user.id)
      );
      const appSnap = await getDocs(appQuery);
      const apps = appSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      apps.sort((a: any, b: any) => {
        const tA = getTimestampMs(a.created_at);
        const tB = getTimestampMs(b.created_at);
        return tB - tA;
      });
      setUserAppointments(apps);
    } catch (err) {
      console.error("User appointments fetch error:", err);
    }

    // 4. Fetch referred patients & appointments for users
    try {
      if (profile?.referral_code) {
        const refCodeRaw = profile.referral_code.trim();
        const refCodeVariations = Array.from(new Set([
          refCodeRaw.toUpperCase(),
          refCodeRaw.toLowerCase(),
          refCodeRaw
        ]));
        
        const refQuery = query(
          collection(db, 'profiles'),
          where('referred_by_code', 'in', refCodeVariations)
        );
        const refSnap = await getDocs(refQuery);
        setReferredPatients(refSnap.docs.map(d => d.data() as Profile));

        // Fetch appointments matching this referral code
        const refAppQuery = query(
          collection(db, 'appointments'),
          where('referred_by_code', 'in', refCodeVariations)
        );
        const refAppSnap = await getDocs(refAppQuery);
        const refApps = refAppSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        refApps.sort((a: any, b: any) => {
          const tA = getTimestampMs(a.created_at);
          const tB = getTimestampMs(b.created_at);
          return tB - tA;
        });
        setReferredAppointments(refApps);
      }

      // 5. Fetch quizzes
      try {
        const qSnap = await getDocs(collection(db, 'quizzes'));
        const qList = qSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        qList.sort((a: any, b: any) => (b.created_at || '').localeCompare(a.created_at || ''));
        setQuizzes(qList);
      } catch (err) {
        console.error("Quizzes fetch error:", err);
      }

      // 6. Fetch user quiz submissions
      try {
        const subQuery = query(
          collection(db, 'quiz_submissions'),
          where('user_id', '==', user.uid || user.id)
        );
        const subSnap = await getDocs(subQuery);
        const subList = subSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        subList.sort((a: any, b: any) => (b.created_at || '').localeCompare(a.created_at || ''));
        setUserSubmissions(subList);
      } catch (err) {
        console.error("User submissions fetch error:", err);
      }

      // 7. Fetch user withdrawals
      try {
        const wdQuery = query(
          collection(db, 'withdrawals'),
          where('user_id', '==', user.uid || user.id)
        );
        const wdSnap = await getDocs(wdQuery);
        const wdList = wdSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        wdList.sort((a: any, b: any) => (b.created_at || '').localeCompare(a.created_at || ''));
        setUserWithdrawals(wdList);
      } catch (err) {
        console.error("User withdrawals fetch error:", err);
      }
    } catch (error) {
      console.error("Referred data fetch error:", error);
    }
  };

  // --- REWARDS & QUIZ HANDLERS ---
  // Convert 100 Reward Points to 50 Taka
  const handleConvertRewards = async () => {
    if (!profile || !user) return;
    const currentPoints = profile.reward_points || 0;
    if (currentPoints < 100) {
      alert("১০০ রিওয়ার্ড পয়েন্ট প্রয়োজন টাকা পরিবর্তন করার জন্য।");
      return;
    }
    
    try {
      const profileRef = doc(db, 'profiles', user.uid);
      await updateDoc(profileRef, {
        reward_points: increment(-100),
        taka_balance: increment(50)
      });
      
      const updatedProfile = {
        ...profile,
        reward_points: currentPoints - 100,
        taka_balance: (profile.taka_balance || 0) + 50
      };
      setProfile(updatedProfile);
      alert("অভিনন্দন! ১০০ রিওয়ার্ড পয়েন্ট সফলভাবে ৫০ টাকায় রূপান্তর করা হয়েছে।");
      await fetchUserData();
    } catch (err: any) {
      console.error("Reward conversion error:", err);
      alert("পয়েন্ট রূপান্তর করতে সমস্যা হয়েছে: " + err.message);
    }
  };

  // Submit Withdrawal Request
  const handleWithdraw = async (method: 'bkash' | 'nagad', accountNumber: string, amount: number) => {
    if (!profile || !user) return;
    const currentBalance = profile.taka_balance || 0;
    if (amount < 50) {
      alert("সর্বনিম্ন উইথড্রয়াল এমাউন্ট ৫০ টাকা।");
      return;
    }
    if (currentBalance < amount) {
      alert("আপনার পর্যাপ্ত ব্যালেন্স নেই।");
      return;
    }
    
    try {
      const withdrawalRef = doc(collection(db, 'withdrawals'));
      const newWd = {
        id: withdrawalRef.id,
        user_id: user.uid,
        user_full_name: profile.full_name,
        user_phone: profile.phone || '',
        method,
        account_number: accountNumber,
        amount,
        status: 'pending',
        created_at: new Date().toISOString()
      };
      
      const profileRef = doc(db, 'profiles', user.uid);
      await setDoc(withdrawalRef, newWd);
      await updateDoc(profileRef, {
        taka_balance: increment(-amount)
      });
      
      setProfile({
        ...profile,
        taka_balance: currentBalance - amount
      });
      
      alert("আপনার উইথড্রয়াল রিকোয়েস্টটি সফলভাবে সাবমিট করা হয়েছে এবং এটি পেন্ডিং আছে।");
      await fetchUserData();
    } catch (err: any) {
      console.error("Withdrawal error:", err);
      alert("উইথড্র রিকোয়েস্ট সাবমিট করতে সমস্যা হয়েছে: " + err.message);
    }
  };

  // Add Quiz (Moderator/Admin only)
  const handleAddQuiz = async (videoTitle: string, uploadDate: string, question: string, prizeAmount: number, answerHint?: string) => {
    if (!isAdmin) {
      alert("শুধুমাত্র এডমিন বা মডারেটর এটি করতে পারেন।");
      return;
    }
    try {
      const quizRef = doc(collection(db, 'quizzes'));
      const newQuiz = {
        id: quizRef.id,
        video_title: videoTitle,
        upload_date: uploadDate,
        question,
        answer_hint: answerHint || '',
        prize_amount: Number(prizeAmount),
        created_at: new Date().toISOString()
      };
      await setDoc(quizRef, newQuiz);
      alert("নতুন কুইজ প্রতিযোগিতা সফলভাবে যুক্ত করা হয়েছে!");
      await fetchAdminData();
    } catch (err: any) {
      console.error("Quiz creation error:", err);
      alert("কুইজ তৈরি করতে সমস্যা হয়েছে: " + err.message);
    }
  };

  // Submit Quiz Answer
  const handleQuizSubmit = async (quizId: string, uploadDateSelected: string, answer: string, submittedPhone?: string, prizeAmount: number = 0) => {
    if (!profile || !user) {
      alert("কুইজে অংশ নিতে দয়া করে প্রথমে লগইন করুন।");
      return;
    }
    
    const finalPhone = submittedPhone || profile.phone || '';
    if (!finalPhone || finalPhone.trim().length < 11) {
      alert("পুরস্কার গ্রহণের জন্য আপনার ১১ ডিজিটের সঠিক মোবাইল নাম্বার দেওয়া আবশ্যক!");
      return;
    }

    const alreadySubmitted = userSubmissions.some(s => s.quiz_id === quizId);
    if (alreadySubmitted) {
      alert("আপনি ইতিমধ্যে এই কুইজে উত্তর দিয়েছেন!");
      return;
    }

    try {
      const subRef = doc(collection(db, 'quiz_submissions'));
      const newSub = {
        id: subRef.id,
        quiz_id: quizId,
        user_id: user.uid,
        user_full_name: profile.full_name,
        user_phone: finalPhone,
        upload_date_selected: uploadDateSelected,
        answer,
        status: 'pending',
        prize_amount: prizeAmount,
        created_at: new Date().toISOString()
      };
      await setDoc(subRef, newSub);

      // Also update profile phone if it was not present
      if (!profile.phone && finalPhone) {
        try {
          const profileRef = doc(db, 'profiles', user.uid);
          await updateDoc(profileRef, { phone: finalPhone });
          setProfile({ ...profile, phone: finalPhone });
        } catch (e) {
          console.error("Profile phone update error:", e);
        }
      }

      alert("আপনার উত্তরটি সফলভাবে পাঠানো হয়েছে! মডারেটর এটি যাচাই করে রিওয়ার্ড প্রদান করবেন।");
      await fetchUserData();
    } catch (err: any) {
      console.error("Quiz submission error:", err);
      alert("উত্তর সাবমিট করতে সমস্যা হয়েছে: " + err.message);
    }
  };

  // Update Quiz Submission Status (Moderator/Admin only)
  const handleUpdateSubmissionStatus = async (submissionId: string, status: 'correct' | 'incorrect', userId: string, prizeAmount: number) => {
    if (!isAdmin) {
      alert("শুধুমাত্র এডমিন বা মডারেটর এটি করতে পারেন।");
      return;
    }
    try {
      const subRef = doc(db, 'quiz_submissions', submissionId);
      await updateDoc(subRef, { status });
      
      if (status === 'correct') {
        const userProfRef = doc(db, 'profiles', userId);
        await updateDoc(userProfRef, {
          taka_balance: increment(prizeAmount)
        });
      }
      
      alert(`সাবমিশনটি সফলভাবে "${status === 'correct' ? 'সঠিক' : 'ভুল'}" হিসেবে আপডেট করা হয়েছে!`);
      await fetchAdminData();
    } catch (err: any) {
      console.error("Submission status update error:", err);
      alert("স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে: " + err.message);
    }
  };

  // Update Withdrawal Request Status (Moderator/Admin only)
  const handleUpdateWithdrawalStatus = async (withdrawalId: string, status: 'completed' | 'rejected', userId: string, amount: number) => {
    if (!isAdmin) {
      alert("শুধুমাত্র এডমিন বা মডারেটর এটি করতে পারেন।");
      return;
    }
    try {
      const wdRef = doc(db, 'withdrawals', withdrawalId);
      await updateDoc(wdRef, { status });
      
      if (status === 'rejected') {
        const userProfRef = doc(db, 'profiles', userId);
        await updateDoc(userProfRef, {
          taka_balance: increment(amount)
        });
      }
      
      alert(`উইথড্রয়াল রিকোয়েস্টটি সফলভাবে "${status === 'completed' ? 'কনফার্ম' : 'রিজেক্ট'}" করা হয়েছে!`);
      await fetchAdminData();
    } catch (err: any) {
      console.error("Withdrawal status update error:", err);
      alert("স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে: " + err.message);
    }
  };

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsProcessing(true);
    setAuthErrorMessage('');
    const formData = new FormData(e.currentTarget);
    const rawEmail = (formData.get('email') as string || '').trim();
    const emailVal = toVirtualEmail(rawEmail);
    const passVal = (formData.get('password') as string || '').trim();
    const trimmed = rawEmail.trim().toLowerCase();

    try {
      // Recognized universal admin/moderator passwords (unified: jagad@01750)
      const validAdminPasswords = ['jagad@01750', 'jagad01750', 'admin123', '123456', 'nilpha2026', 'doctorapp0p', 'admin'];

      // 1. Moderator & Admin Universal Handling
      const isModOrAdminUser = 
        authMode === 'moderator' ||
        trimmed === 'moderator' || 
        trimmed === 'modaretor' || 
        trimmed === 'moderator@nilpha.com' || 
        trimmed === 'modaretor@nilpha.com' ||
        trimmed === 'admin' ||
        trimmed === 'doctorapp0p' ||
        trimmed === 'doctorapp0p@gmail.com' ||
        trimmed === 'jagadbandhu' ||
        trimmed === 'jagadbandhutum@gmail.com';

      if (isModOrAdminUser) {
        let isPassCorrect = validAdminPasswords.includes(passVal);

        // Also check if any stored profile with ADMIN or MODERATOR role has this password
        if (!isPassCorrect) {
          try {
            const adminQuery = query(collection(db, 'profiles'), where('role', 'in', [UserRole.ADMIN, UserRole.MODERATOR]));
            const adminSnap = await getDocs(adminQuery);
            adminSnap.forEach(docSnap => {
              const data = docSnap.data() as Profile;
              if (data.created_password === passVal || (data as any).password === passVal) {
                isPassCorrect = true;
              }
            });
          } catch (e) {
            console.warn("Admin Firestore password check:", e);
          }
        }

        if (isPassCorrect) {
          const isSuperAdminEmail = 
            trimmed === 'moderator' ||
            trimmed === 'modaretor' ||
            trimmed === 'moderator@nilpha.com' ||
            trimmed === 'doctorapp0p' || 
            trimmed === 'doctorapp0p@gmail.com' || 
            trimmed === 'jagadbandhu' || 
            trimmed === 'jagadbandhutum@gmail.com' ||
            passVal === 'jagad@01750' ||
            passVal === 'jagad01750';
          const targetEmail = trimmed.includes('@') ? trimmed : 'jagadbandhutum@gmail.com';
          const targetName = 'Super Admin & Moderator';
          const targetUid = 'admin_master_001';
          let firebaseUser: any = null;
          
          try {
            const cred = await signInWithEmailAndPassword(auth, targetEmail, passVal);
            firebaseUser = cred.user;
          } catch (signInErr: any) {
            if (
              signInErr.code === 'auth/user-not-found' || 
              signInErr.code === 'auth/invalid-credential' || 
              signInErr.code === 'auth/invalid-login-credentials'
            ) {
              try {
                const cred = await createUserWithEmailAndPassword(auth, targetEmail, passVal);
                firebaseUser = cred.user;
              } catch (createErr) {
                // If Auth createUser fails or is disabled, fallback seamlessly
              }
            }
          }

          const activeUid = firebaseUser?.uid || targetUid;
          const profileRef = doc(db, 'profiles', activeUid);
          let modProf: Profile | null = null;
          try {
            const profileSnap = await getDoc(profileRef);
            modProf = profileSnap.exists() ? (profileSnap.data() as Profile) : null;
          } catch (fetchErr) {
            console.warn("Admin profile fetch notice:", fetchErr);
          }
          
          if (!modProf) {
            modProf = { 
              id: activeUid, 
              full_name: targetName, 
              role: UserRole.ADMIN, 
              status: 'active', 
              phone: '01352669100',
              virtual_email: targetEmail,
              created_password: passVal
            };
            try {
              await setDoc(profileRef, modProf);
            } catch (saveErr) {
              console.warn("Could not save admin profile:", saveErr);
            }
          } else if (modProf.role !== UserRole.ADMIN || modProf.status !== 'active') {
            modProf.role = UserRole.ADMIN;
            modProf.status = 'active';
            try {
              await updateDoc(profileRef, { role: UserRole.ADMIN, status: 'active' });
            } catch (upErr) {
              console.warn("Could not update admin profile:", upErr);
            }
          }

          const adminUserObj = firebaseUser || {
            uid: activeUid,
            email: targetEmail,
            displayName: targetName
          };

          setUser(adminUserObj as any);
          setProfile(modProf);
          localStorage.setItem('jb_custom_session', JSON.stringify({
            uid: activeUid,
            email: targetEmail,
            role: UserRole.ADMIN
          }));
          setShowAuthModal(false);
          setAuthErrorMessage('');
          return;
        } else {
          throw new Error('ভুল পাসওয়ার্ড! অনুগ্রহ করে সঠিক পাসওয়ার্ড দিয়ে আবার চেষ্টা করুন।');
        }
      }

      if (authMode === 'login') {
        let firebaseUser: any = null;
        let matchedProfile: Profile | null = null;
        const normalizedInputPhone = normalizePhoneNumber(rawEmail);
        const inputDigits = rawEmail.replace(/\D/g, '');

        if (!trimmed || !passVal) {
          throw new Error('অনুগ্রহ করে মোবাইল নম্বর/ইউজারনেম এবং পাসওয়ার্ড পূরণ করুন।');
        }

        // 1. First, search for user in Firestore profiles
        try {
          const phoneQueries = Array.from(new Set([
            normalizedInputPhone,
            trimmed,
            inputDigits,
            `+88${normalizedInputPhone}`,
            `88${normalizedInputPhone}`,
            normalizedInputPhone.startsWith('0') ? normalizedInputPhone.substring(1) : ''
          ])).filter(Boolean);

          for (const pVal of phoneQueries) {
            const snapPhone = await getDocs(query(collection(db, 'profiles'), where('phone', '==', pVal)));
            if (!snapPhone.empty) {
              matchedProfile = { id: snapPhone.docs[0].id, ...(snapPhone.docs[0].data() as Profile) };
              break;
            }
          }

          if (!matchedProfile) {
            const cleanedUsername = trimmed.replace(/\s+/g, '').replace(/[^a-z0-9_.-]/g, '');
            if (cleanedUsername) {
              const snapU = await getDocs(query(collection(db, 'profiles'), where('username', '==', cleanedUsername)));
              if (!snapU.empty) {
                matchedProfile = { id: snapU.docs[0].id, ...(snapU.docs[0].data() as Profile) };
              }
            }
          }

          if (!matchedProfile && trimmed.includes('@')) {
            const snapV = await getDocs(query(collection(db, 'profiles'), where('virtual_email', '==', trimmed)));
            if (!snapV.empty) {
              matchedProfile = { id: snapV.docs[0].id, ...(snapV.docs[0].data() as Profile) };
            }
          }

          // Fallback scan: Search through all registered profiles in Firestore
          if (!matchedProfile) {
            const allSnap = await getDocs(collection(db, 'profiles'));
            for (const d of allSnap.docs) {
              const pData = d.data() as Profile;
              const pPhoneClean = normalizePhoneNumber(pData.phone || '').replace(/\D/g, '');
              const pRawClean = (pData.phone || '').replace(/\D/g, '');
              
              const phoneMatches = inputDigits && (
                pPhoneClean === inputDigits ||
                pRawClean === inputDigits ||
                (inputDigits.length >= 10 && pPhoneClean.endsWith(inputDigits.slice(-10)))
              );

              const userMatches = pData.username && pData.username.toLowerCase().trim() === trimmed;
              const emailMatches = pData.virtual_email && pData.virtual_email.toLowerCase().trim() === trimmed;
              const phoneExact = pData.phone && pData.phone.trim() === trimmed;

              if (phoneMatches || userMatches || emailMatches || phoneExact) {
                matchedProfile = { id: d.id, ...pData };
                break;
              }
            }
          }
        } catch (dbErr) {
          console.warn("Firestore lookup before login:", dbErr);
        }

        // 2. If a profile exists in Firestore, verify password
        if (matchedProfile) {
          const storedPassRaw = matchedProfile.created_password ?? (matchedProfile as any).password;
          const storedPassStr = String(storedPassRaw ?? '').trim();
          const passValStr = passVal.trim();
          const storedPassNorm = normalizeDigits(storedPassStr);
          const passValNorm = normalizeDigits(passValStr);

          const isPassMatch = 
            (storedPassRaw && (
              storedPassStr === passValStr || 
              storedPassNorm === passValNorm || 
              storedPassStr.toLowerCase() === passValStr.toLowerCase()
            )) || 
            (!storedPassRaw && (
              passValNorm === '123456' || 
              passValStr === '123456' || 
              passValStr.length >= 6
            )) ||
            (matchedProfile.role === UserRole.ADMIN && validAdminPasswords.includes(passValStr));

          if (isPassMatch) {
            // Check status
            if (matchedProfile.status === 'pending') {
              throw new Error('আপনার অ্যাকাউন্টটি পেন্ডিং অবস্থায় রয়েছে। অনুমোদনের জন্য অপেক্ষা করুন।');
            }
            if ((matchedProfile.status as string) === 'blocked' || (matchedProfile.status as string) === 'inactive' || matchedProfile.status === 'suspended') {
              throw new Error('আপনার অ্যাকাউন্টটি সাময়িকভাবে বন্ধ রয়েছে। যোগাযোগের জন্য এডমিনকে বলুন।');
            }

            // Auto-persist password in Firestore if it was missing previously
            if (!storedPassRaw) {
              try {
                await updateDoc(doc(db, 'profiles', matchedProfile.id), { created_password: passValStr });
                matchedProfile.created_password = passValStr;
              } catch (updateErr) {
                console.warn("Could not save backfilled password:", updateErr);
              }
            }

            // Attempt Firebase Auth sign in if possible
            try {
              const candEmails = Array.from(new Set([
                matchedProfile.virtual_email,
                `${matchedProfile.phone}@nilpha.com`,
                `${matchedProfile.phone}@phone.virtual`,
                ...getLoginCandidateEmails(trimmed)
              ])).filter(Boolean) as string[];

              for (const cand of candEmails) {
                try {
                  const cred = await signInWithEmailAndPassword(auth, cand, passValStr);
                  firebaseUser = cred.user;
                  break;
                } catch {
                  // Keep trying next
                }
              }
            } catch {
              // Ignore
            }

            const activeUser = firebaseUser || {
              uid: matchedProfile.id,
              email: matchedProfile.virtual_email || `${matchedProfile.phone}@nilpha.com`,
              displayName: matchedProfile.full_name || 'User'
            };

            setUser(activeUser as any);
            setProfile(matchedProfile);
            localStorage.setItem('jb_custom_session', JSON.stringify({
              uid: matchedProfile.id,
              email: activeUser.email,
              role: matchedProfile.role
            }));
            setShowAuthModal(false);
            setAuthErrorMessage('');
            return;
          } else {
            // Profile was found, but entered password did NOT match stored password!
            // Check Firebase Auth candidates in case password was changed in Auth
            const candidateEmails = Array.from(new Set([
              matchedProfile.virtual_email,
              `${matchedProfile.phone}@nilpha.com`,
              `${matchedProfile.phone}@phone.virtual`,
              ...getLoginCandidateEmails(trimmed)
            ])).filter(Boolean) as string[];

            for (const cand of candidateEmails) {
              try {
                const cred = await signInWithEmailAndPassword(auth, cand, passVal);
                firebaseUser = cred.user;
                break;
              } catch {
                // Ignore
              }
            }

            if (firebaseUser) {
              matchedProfile.created_password = passVal;
              try {
                await updateDoc(doc(db, 'profiles', matchedProfile.id), { created_password: passVal });
              } catch {
                // Ignore
              }

              setUser(firebaseUser);
              setProfile(matchedProfile);
              localStorage.setItem('jb_custom_session', JSON.stringify({
                uid: matchedProfile.id,
                email: firebaseUser.email,
                role: matchedProfile.role
              }));
              setShowAuthModal(false);
              setAuthErrorMessage('');
              return;
            }

            throw new Error('ভুল পাসওয়ার্ড! অনুগ্রহ করে সঠিক পাসওয়ার্ড দিন, অথবা ডিফল্ট পাসওয়ার্ড "123456" দিয়ে চেষ্টা করুন।');
          }
        }

        // 3. If no Firestore profile was found initially, try Firebase Auth
        const candidateEmails = getLoginCandidateEmails(trimmed);
        for (const cand of candidateEmails) {
          try {
            const cred = await signInWithEmailAndPassword(auth, cand, passVal);
            firebaseUser = cred.user;
            break;
          } catch (err: any) {
            // Keep trying
          }
        }

        if (!firebaseUser) {
          throw new Error('এই মোবাইল নম্বর বা ইউজারনেম দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি। অনুগ্রহ করে "রেজিস্ট্রেশন" করুন।');
        }

        const profileRef = doc(db, 'profiles', firebaseUser.uid);
        const profileSnap = await getDoc(profileRef);
        let prof = profileSnap.data() as Profile;

        if (!prof) {
          prof = {
            id: firebaseUser.uid,
            full_name: firebaseUser.displayName || 'User',
            phone: normalizedInputPhone || '',
            virtual_email: firebaseUser.email || emailVal,
            role: (firebaseUser.email === 'jagadbandhutum@gmail.com' || firebaseUser.email === 'doctorapp0p@gmail.com') ? UserRole.ADMIN : UserRole.PATIENT,
            status: 'active',
            created_password: passVal
          };
          await setDoc(profileRef, prof);
        }

        if (prof?.status === 'pending') {
          await signOut(auth);
          throw new Error('আপনার অ্যাকাউন্টটি পেন্ডিং অবস্থায় রয়েছে। অনুমোদনের জন্য অপেক্ষা করুন।');
        }

        if ((prof?.status as string) === 'blocked' || (prof?.status as string) === 'inactive' || prof?.status === 'suspended') {
          await signOut(auth);
          throw new Error('আপনার অ্যাকাউন্টটি সাময়িকভাবে বন্ধ রয়েছে। যোগাযোগের জন্য এডমিনকে বলুন।');
        }

        setUser(firebaseUser);
        setProfile(prof);
        localStorage.setItem('jb_custom_session', JSON.stringify({
          uid: prof.id,
          email: prof.virtual_email || firebaseUser.email,
          role: prof.role
        }));
        setShowAuthModal(false);
        setAuthErrorMessage('');
      } else {
        const fullName = formData.get('fullName') as string;
        const rawPhoneInput = formData.get('phone') as string;
        const rawEmailInput = (formData.get('email') as string || '').trim();
        const normalizedPhone = normalizePhoneNumber(rawPhoneInput);
        const isRuralDocChecked = formData.get('isRuralDoctor') === 'on';
        
        if (!fullName || (!rawPhoneInput && !rawEmailInput) || !passVal) {
          throw new Error('দয়া করে সব প্রয়োজনীয় তথ্য পূরণ করুন!');
        }

        if (passVal.length < 6) {
          throw new Error('পাসওয়ার্ডটি অন্তত ৬ অক্ষরের হতে হবে!');
        }

        let regVirtualEmail = '';
        if (rawEmailInput && rawEmailInput.includes('@')) {
          regVirtualEmail = rawEmailInput.toLowerCase();
        } else if (normalizedPhone && normalizedPhone.length === 11) {
          regVirtualEmail = `${normalizedPhone}@nilpha.com`;
        } else if (rawEmailInput) {
          regVirtualEmail = toVirtualEmail(rawEmailInput);
        } else {
          regVirtualEmail = toVirtualEmail(rawPhoneInput);
        }

        const cleanedUsername = rawEmailInput && !rawEmailInput.includes('@') 
          ? rawEmailInput.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9_.-]/g, '')
          : '';

        const districtRaw = formData.get('district') as string || '';
        let upazilaRaw = formData.get('upazila') as string || '';
        const unionRaw = formData.get('union') as string || '';
        const villageRaw = formData.get('village') as string || '';

        const districtMap: Record<string, string> = {
          'Nilphamari': 'নীলফামারী',
          'Panchagarh': 'পঞ্চগড়',
          'Dhaka': 'ঢাকা',
          'Chattogram': 'চট্টগ্রাম',
          'Sylhet': 'সিলেট',
          'Rajshahi': 'রাজশাহী',
          'Khulna': 'খুলনা',
          'Barishal': 'বরিশাল',
          'Rangpur': 'রংপুর',
          'Mymensingh': 'ময়মনসিংহ'
        };
        const district = districtMap[districtRaw] || districtRaw;

        let upazila = upazilaRaw;
        const matchedUpazilaObj = ALL_DISTRICTS_DATA[districtRaw]?.upazilas.find(u => u.id === upazilaRaw || u.name === upazilaRaw);
        if (matchedUpazilaObj) {
          upazila = matchedUpazilaObj.name;
        } else if (districtRaw === 'Nilphamari') {
          if (upazilaRaw === 'sadar') upazila = 'নীলফামারী সদর উপজেলা';
          else if (upazilaRaw === 'saidpur') upazila = 'সৈয়দপুর উপজেলা';
          else if (upazilaRaw === 'dimla') upazila = 'ডিমলা উপজেলা';
          else if (upazilaRaw === 'domar') upazila = 'ডোমার উপজেলা';
          else if (upazilaRaw === 'jaldhaka') upazila = 'জলঢাকা উপজেলা';
          else if (upazilaRaw === 'kishoreganj') upazila = 'কিশোরগঞ্জ উপজেলা';
        }
        const union = unionRaw;
        const village = villageRaw;

        let docCode = '';
        if (isRuralDocChecked) {
          const ruralDoctorCode = (formData.get('ruralDoctorCode') as string || '').trim().toUpperCase();
          const representativePin = (formData.get('representativePin') as string || '').trim();
          if (!ruralDoctorCode || !representativePin) {
            throw new Error('পল্লী চিকিৎসক কোড এবং প্রতিনিধি পিন আবশ্যক!');
          }
          if (representativePin !== '1971' && representativePin !== 'nilpha2026' && representativePin !== '5560') {
            throw new Error('ভুল প্রতিনিধি পিন! শুধুমাত্র আমাদের অনুমোদিত প্রতিনিধি বা এডমিন এই অ্যাকাউন্ট খুলতে পারেন।');
          }
          docCode = ruralDoctorCode;
        }

        // Check if an existing profile already exists in Firestore for this phone/username/email
        const existingCandidates: string[] = [];
        try {
          if (normalizedPhone) {
            const snapP = await getDocs(query(collection(db, 'profiles'), where('phone', '==', normalizedPhone)));
            snapP.forEach(d => {
              const p = d.data() as Profile;
              if (p.virtual_email) existingCandidates.push(p.virtual_email);
            });
          }
          if (cleanedUsername) {
            const snapU = await getDocs(query(collection(db, 'profiles'), where('username', '==', cleanedUsername)));
            snapU.forEach(d => {
              const p = d.data() as Profile;
              if (p.virtual_email) existingCandidates.push(p.virtual_email);
            });
          }
        } catch (checkErr) {
          console.warn("Pre-registration profile check failed:", checkErr);
        }

        let firebaseUser;

        // If existing profile was found, attempt login with password
        if (existingCandidates.length > 0) {
          for (const cand of existingCandidates) {
            try {
              const cred = await signInWithEmailAndPassword(auth, cand, passVal);
              firebaseUser = cred.user;
              break;
            } catch (loginErr) {
              // Incorrect password or login error
            }
          }
          if (!firebaseUser) {
            setAuthMode('login');
            throw new Error('এই মোবাইল নম্বর/ইউজারনেম দিয়ে ইতোমধ্যে অ্যাকাউন্ট তৈরি রয়েছে। অনুগ্রহ করে সঠিক পাসওয়ার্ড দিয়ে "লগইন" করুন।');
          }
        }
        
        if (!firebaseUser) {
          try {
            const userCredential = await createUserWithEmailAndPassword(auth, regVirtualEmail, passVal);
            firebaseUser = userCredential.user;
            await updateProfile(firebaseUser, { displayName: fullName });
          } catch (createErr: any) {
            if (createErr.code === 'auth/email-already-in-use') {
              const regCandidates = getLoginCandidateEmails(rawEmailInput || rawPhoneInput);
              if (!regCandidates.includes(regVirtualEmail)) regCandidates.unshift(regVirtualEmail);

              for (const cand of regCandidates) {
                try {
                  const cred = await signInWithEmailAndPassword(auth, cand, passVal);
                  firebaseUser = cred.user;
                  break;
                } catch (loginErr) {
                  // Keep trying next candidate
                }
              }

              if (!firebaseUser) {
                setAuthMode('login');
                throw new Error('এই তথ্য (মোবাইল/ইউজারনেম) দিয়ে ইতোমধ্যে অ্যাকাউন্ট তৈরি রয়েছে। অনুগ্রহ করে পাসওয়ার্ড দিয়ে "লগইন" করুন।');
              }
            } else if (createErr.code === 'auth/weak-password') {
              throw new Error('পাসওয়ার্ডটি অন্তত ৬ অক্ষরের হতে হবে!');
            } else if (createErr.code === 'auth/invalid-email') {
              throw new Error('দয়া করে সঠিক মোবাইল নম্বর বা ইউজারনেম দিন!');
            } else {
              console.warn("Firebase Auth fallback on registration:", createErr?.message || createErr);
              const customUid = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
              firebaseUser = {
                uid: customUid,
                email: regVirtualEmail,
                displayName: fullName
              };
            }
          }
        }
        
        const newProf: Profile = { 
          id: firebaseUser.uid, 
          full_name: fullName, 
          phone: normalizedPhone || rawPhoneInput, 
          virtual_email: regVirtualEmail,
          role: isRuralDocChecked ? UserRole.RURAL_DOCTOR : UserRole.PATIENT, 
          status: 'active',
          created_password: passVal,
          district: district || '',
          upazila: upazila || '',
          union: union || '',
          village: village || ''
        };

        if (cleanedUsername) {
          newProf.username = cleanedUsername;
        }

        if (isRuralDocChecked) {
          newProf.referral_code = docCode;
        } else {
          const referredByCode = (formData.get('referredByCode') as string || '').trim().toUpperCase();
          if (referredByCode) {
            newProf.referred_by_code = referredByCode;
          }
        }
        
        await setDoc(doc(db, 'profiles', firebaseUser.uid), newProf);
        
        setUser(firebaseUser);
        setProfile(newProf);
        localStorage.setItem('jb_custom_session', JSON.stringify({
          uid: newProf.id,
          email: regVirtualEmail,
          role: newProf.role
        }));
        setShowAuthModal(false);
        setAuthErrorMessage('');
      }
    } catch (err: any) { 
      console.warn("Auth Notice:", err?.message || err);
      let msg = 'একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।';
      if (
        err.code === 'auth/user-not-found' || 
        err.code === 'auth/wrong-password' || 
        err.code === 'auth/invalid-credential' || 
        err.code === 'auth/invalid-email'
      ) {
        msg = 'ভুল ইউজারনেম/মোবাইল নম্বর বা পাসওয়ার্ড!';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'এই মোবাইল নম্বর বা ইউজারনেম দিয়ে ইতোমধ্যে অ্যাকাউন্ট তৈরি করা রয়েছে। দয়া করে লগইন করুন।';
      } else if (err.code === 'auth/weak-password') {
        msg = 'পাসওয়ার্ড অত্যন্ত দুর্বল। অন্তত ৬ অক্ষরের পাসওয়ার্ড দিন।';
      } else if (err.message && !err.message.includes('Firebase:') && !err.message.includes('auth/')) {
        msg = err.message;
      } else {
        msg = 'ভুল ইউজারনেম/মোবাইল নম্বর বা পাসওয়ার্ড!';
      }
      setAuthErrorMessage(msg);
    }
    finally { setIsProcessing(false); }
  };

  const handleGoogleLogin = async () => {
    setIsProcessing(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const { user: firebaseUser } = userCredential;

      const profileRef = doc(db, 'profiles', firebaseUser.uid);
      const profileSnap = await getDoc(profileRef);
      let prof = profileSnap.data() as Profile;
      
      const isAdminEmail = firebaseUser.email === 'jagadbandhutum@gmail.com' || firebaseUser.email === 'doctorapp0p@gmail.com';
      
      if (!prof) {
        prof = {
          id: firebaseUser.uid,
          full_name: firebaseUser.displayName || 'ইউজার',
          phone: '',
          role: isAdminEmail ? UserRole.ADMIN : UserRole.PATIENT,
          status: 'active'
        };
        await setDoc(profileRef, prof);
      } else if (isAdminEmail && prof.role !== UserRole.ADMIN) {
        // Force update role if it's the admin email but role is different
        prof.role = UserRole.ADMIN;
        await updateDoc(profileRef, { role: UserRole.ADMIN });
      }

      if (prof?.status === 'pending') {
        await signOut(auth);
        throw new Error('আপনার অ্যাকাউন্টটি পেন্ডিং অবস্থায় আছে।');
      }

      setUser(firebaseUser);
      setProfile(prof);
      localStorage.setItem('jb_custom_session', JSON.stringify({
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        role: prof.role
      }));
      setShowAuthModal(false);
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      alert("গুগল লগইন এরর: " + (err.message || 'একটি সমস্যা হয়েছে'));
    } finally {
      setIsProcessing(false);
    }
  };

  const logout = async () => {
    localStorage.removeItem('jb_custom_session');
    try {
      await signOut(auth);
    } catch {
      // Ignore
    }
    setUser(null);
    setProfile(null);
    window.location.reload();
  };

  const toggleCartItem = (item: {id: string, name: string, price: number, type: 'test' | 'emergency'}) => {
    setCart(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) return prev.filter(i => i.id !== item.id);
      return [...prev, item];
    });
  };

  const startCheckout = () => {
    if (cart.length === 0) return;
    const totalAmount = cart.reduce((sum, item) => sum + item.price, 0);
    const itemNames = cart.map(i => i.name).join(', ');
    const hasEmergency = cart.some(i => i.type === 'emergency');
    const hasTest = cart.some(i => i.type === 'test');
    const shipping = hasEmergency ? 100 : 0;
    
    if (!patientName && profile?.full_name) setPatientName(profile.full_name);
    if (!contactPhone && profile?.phone) setContactPhone(profile.phone);
    
    setShowPayment({ show: true, amount: totalAmount, item: itemNames, shipping, isTest: hasTest });
  };

  const submitOrder = async () => {
    if (isProcessing) return;
    if (!user) {
      alert('অর্ডার করতে দয়া করে লগইন করুন।');
      setShowAuthModal(true);
      return;
    }
    if (!patientName || patientName.trim().length < 2) {
      alert('অনুগ্রহ করে সেবা গ্রহণকারী / রোগীর নাম লিখুন।');
      return;
    }
    if (!contactPhone || contactPhone.trim().length < 11) {
      alert('অনুগ্রহ করে সঠিক ১১-ডিজিটের মোবাইল নম্বর দিন।');
      return;
    }
    if (!deliveryAddress || deliveryAddress.trim().length < 3) {
      alert('অনুগ্রহ করে সেবা প্রদান বা ডেলিভারির সম্পূর্ণ ঠিকানা উল্লেখ করুন।');
      return;
    }
    if (paymentType === 'online' && !trxId) {
      alert('অনুগ্রহ করে বিকাশ বা নগদের TrxID দিন।');
      return;
    }

    const calculatedShipping = 
      deliveryDistance === 'within_2km' ? 30 :
      deliveryDistance === 'around_5km' ? 50 :
      deliveryDistance === 'around_10km' ? 80 : 0;

    const deliveryDistanceLabel = 
      deliveryDistance === 'within_2km' ? 'নীলফামারী শহর (২ কিমি - ৳৩০)' :
      deliveryDistance === 'around_5km' ? 'নীলফামারী শহর (৫ কিমি - ৳৫০)' :
      deliveryDistance === 'around_10km' ? 'নীলফামারী শহর (১০ কিমি - ৳৮০)' :
      'সরাসরি চেম্বার/সেন্টার (৳০)';

    const couponDiscPct = appliedCoupon ? appliedCoupon.discount_percent : 0;
    const couponDiscAmt = appliedCoupon ? Math.round((showPayment.amount * couponDiscPct) / 100) : 0;
    const discountedServiceAmount = Math.max(0, showPayment.amount - couponDiscAmt);

    setIsProcessing(true);
    const newOrder: Order = {
      user_id: user.uid || user.id,
      user_email: user.email || 'guest@jb.com',
      item_name: showPayment.item || 'সাধারণ হেলথ সেবা',
      amount: discountedServiceAmount,
      original_amount: showPayment.amount,
      shipping: calculatedShipping,
      delivery_distance_label: deliveryDistanceLabel,
      payment_method: paymentType === 'offline' ? 'Cash at Delivery/Clinic' : (paymentMethod || 'bkash'),
      payment_type: paymentType,
      sender_name: profile?.full_name || patientName,
      sender_contact: contactPhone.trim(),
      patient_name: patientName.trim(),
      delivery_address: deliveryAddress.trim(),
      trx_id: paymentType === 'offline' ? `OFFLINE-${Math.random().toString(36).substr(2, 6).toUpperCase()}` : trxId.trim(),
      hospital_name: showPayment.isTest
        ? (selectedTestHospital === 'none' ? 'নির্দিষ্ট কোনো হাসপাতাল নেই' : selectedTestHospital)
        : (showPayment.hospitalName || ''),
      coupon_code: appliedCoupon ? appliedCoupon.code : undefined,
      coupon_discount_percent: appliedCoupon ? appliedCoupon.discount_percent : undefined,
      coupon_discount_amount: couponDiscAmt > 0 ? couponDiscAmt : undefined,
      subscription_plan_name: profile?.active_subscription?.plan_name || (profile?.active_subscription ? `${profile.active_subscription.package_type === 'test_discount_only' ? 'Package 1 (Test 30% Discount)' : 'Package 2 (Test 30% + Free Doctor Consultation)'} - ${profile.active_subscription.years} Years` : ''),
      referred_by_code: profile?.referred_by_code || profile?.referral_code || localStorage.getItem('prefilled_referral_code') || '',
      status: 'pending'
    };

    const finalizeSuccess = () => {
      setShowPayment({ show: false, amount: 0, item: '', shipping: 0 });
      setCart([]);
      setTrxId('');
      setContactPhone('');
      setPatientName('');
      setDeliveryAddress('');
      setPaymentType('online');
      handleRemoveCoupon();
      alert('আপনার অর্ডার রিকুয়েস্ট সফলভাবে গ্রহণ করা হয়েছে! অ্যাডমিন প্যানেল থেকে রিভিউর পর আপনাকে নিশ্চিত করা হবে।');
      fetchUserData();
    };

    // --- INSTANT FEEDBACK ---
    finalizeSuccess();

    try {
      const ordersRef = collection(db, 'orders');
      
      // Fire and forget PHP notification
      fetch('./api.php?path=orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder)
      }).catch(e => console.log("PHP notify fail:", e));

      // Background Firestore operation
      await addDoc(ordersRef, { ...newOrder, created_at: serverTimestamp() });
      await fetchAdminData();
    } catch (error) {
      console.error("Order submission background logic failure:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredDoctors = useMemo(() => {
    // 1. Availability Logic (Common helpers)
    const bnDayNames = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
    const todayBn = bnDayNames[new Date().getDay()];
    
    const checkDay = (docSchedule: string, day: string) => {
      if (!docSchedule || !docSchedule.trim()) return true;

      const daysMeta = [
        { key: 'sat', shortBn: 'শনি', fullBn: 'শনিবার', index: 0 },
        { key: 'sun', shortBn: 'রবি', fullBn: 'রবিবার', index: 1 },
        { key: 'mon', shortBn: 'সোম', fullBn: 'সোমবার', index: 2 },
        { key: 'tue', shortBn: 'মঙ্গল', fullBn: 'মঙ্গলবার', index: 3 },
        { key: 'wed', shortBn: 'বুধ', fullBn: 'বুধবার', index: 4 },
        { key: 'thu', shortBn: 'বৃহস্পতি', fullBn: 'বৃহস্পতিবার', altBn: ['বৃহঃ', 'বৃহঃবার'], index: 5 },
        { key: 'fri', shortBn: 'শুক্র', fullBn: 'শুক্রবার', index: 6 },
      ];

      const s = docSchedule.toLowerCase()
        .replace(/[\u2013\u2014–—]/g, '-')
        .replace(/থেকে|হতে|পর্যন্ত|টু|\bto\b/g, '-')
        .replace(/\s*-\s*/g, '-')
        .replace(/\s+/g, ' ');

      const targetDayLower = day.toLowerCase();

      let targetIdx = -1;
      for (const d of daysMeta) {
        if (targetDayLower === d.fullBn || targetDayLower === d.shortBn || targetDayLower.includes(d.fullBn) || d.fullBn.includes(targetDayLower) || targetDayLower.includes(d.shortBn)) {
          targetIdx = d.index;
          break;
        }
      }

      if (targetIdx === -1) return false;

      const activeDays = new Set<number>();

      // 1. Check for 'everyday' / 'daily'
      const isEveryday = s.includes('প্রতিদিন') || 
                        s.includes('সবদিন') || 
                        s.includes('দৈনিক') || 
                        s.includes('সপ্তাহে ৭ দিন') || 
                        s.includes('সপ্তাহের ৭ দিন') || 
                        s.includes('৭ দিন') || 
                        s.includes('24/7') || 
                        s.includes('২৪ ঘণ্টা') || 
                        s.includes('২৪ ঘন্টা') || 
                        s.includes('daily') || 
                        s.includes('everyday');

      if (isEveryday || s.includes('নিয়মিত') || s.includes('নিয়মিত')) {
        daysMeta.forEach(d => activeDays.add(d.index));
      }

      // Helper to find day index from string token
      const findDayIndex = (str: string) => {
        const token = str.trim().toLowerCase();
        for (const d of daysMeta) {
          if (token === d.fullBn || token === d.shortBn) return d.index;
          if (d.altBn && d.altBn.includes(token)) return d.index;
        }
        for (const d of daysMeta) {
          if (token.includes(d.fullBn) || token.includes(d.shortBn)) return d.index;
          if (d.altBn && d.altBn.some(alt => token.includes(alt))) return d.index;
        }
        return -1;
      };

      // 2. Ranges matching: e.g. শনি-বৃহস্পতি, শনিবার-বৃহস্পতিবার, sat-thu
      const dayTokens = 'শনিবার|রবিবার|সোমবার|মঙ্গলবার|বুধবার|বৃহস্পতিবার|শুক্রবার|শনি|রবি|সোম|মঙ্গল|বুধ|বৃহস্পতি|বৃহঃবার|বৃহঃ|sat|sun|mon|tue|wed|thu|fri|saturday|sunday|monday|tuesday|wednesday|thursday|friday';
      const rangeRegex = new RegExp(`(${dayTokens})-(${dayTokens})`, 'gi');

      let rMatch;
      while ((rMatch = rangeRegex.exec(s)) !== null) {
        const startIdx = findDayIndex(rMatch[1]);
        const endIdx = findDayIndex(rMatch[2]);

        if (startIdx !== -1 && endIdx !== -1) {
          let idx = startIdx;
          while (true) {
            activeDays.add(idx);
            if (idx === endIdx) break;
            idx = (idx + 1) % 7;
          }
        }
      }

      // 3. Individual Day mentions
      daysMeta.forEach(d => {
        const hasFull = s.includes(d.fullBn);
        const hasShort = s.includes(d.shortBn);
        const hasAlt = d.altBn ? d.altBn.some(alt => s.includes(alt)) : false;

        if (hasFull || hasShort || hasAlt) {
          activeDays.add(d.index);
        }
      });

      // 4. Closed / Off Day Exclusions (e.g., (শুক্রবার বন্ধ), (বৃহস্পতিবার অফ), শুক্রবার ব্যতীত, শুক্রবার ছাড়া)
      daysMeta.forEach(d => {
        const dayNames = [d.fullBn, d.shortBn, ...(d.altBn || [])];
        const isClosedForThisDay = dayNames.some(dn => {
          const regex1 = new RegExp(`${dn}\\s*(বন্ধ|অফ|অফ-|বন্ধ-|ব্যতীত|ছাড়া|বাদে|closed|off)`, 'i');
          const regex2 = new RegExp(`(বন্ধ|অফ|closed|off)\\s*[:\\-]?\\s*${dn}`, 'i');
          return regex1.test(s) || regex2.test(s);
        });

        if (isClosedForThisDay) {
          activeDays.delete(d.index);
        }
      });

      // Default fallback if no days detected at all in schedule string: assume available on all days
      if (activeDays.size === 0) {
        return true;
      }

      return activeDays.has(targetIdx);
    };

    // Prepare initial list with availability - strictly exclude Live Doctors from general all doctors list
    let list = doctors
      .filter(d => !d.isVideoConsultant)
      .map(d => ({
        ...d,
        availableToday: checkDay(d.schedule, todayBn)
      }));

    // Apply strict filters
    if (selectedLocation) {
      const loc = selectedLocation.toLowerCase().trim();
      const locEnMap: Record<string, string[]> = {
        'রংপুর': ['rangpur', 'রংপুর'],
        'নীলফামারী': ['nilphamari', 'নীলফামারী'],
        'সৈয়দপুর': ['syedpur', 'sayedpur', 'saidpur', 'সৈয়দপুর', 'সৈয়দপুর'],
        'ডোমার': ['domar', 'ডোমার'],
        'ডিমলা': ['dimla', 'ডিমলা'],
        'জলঢাকা': ['jaldhaka', 'জলঢাকা'],
        'কিশোরগঞ্জ': ['kishoreganj', 'kishorganj', 'কিশোরগঞ্জ'],
        'দেবিগঞ্জ': ['debiganj', 'দেবিগঞ্জ'],
      };
      const keywords = locEnMap[loc] || [loc];
      list = list.filter(d => {
        const docAddr = (d.address || '').toLowerCase();
        const docDist = (d.district || '').toLowerCase();
        const docDistricts = (d.districts || []).map(x => x.toLowerCase());

        const directMatch = keywords.some(kw => 
          docAddr.includes(kw) || 
          docDist.includes(kw) || 
          docDistricts.some(dist => dist.includes(kw))
        );

        if (directMatch) return true;

        // Check associated clinics/hospitals
        const docClinics = d.clinics || [];
        const hospitalMatch = hospitals.some(h => 
          docClinics.includes(h.id) && 
          keywords.some(kw => 
            h.name.toLowerCase().includes(kw) || 
            (h.address || '').toLowerCase().includes(kw) || 
            (h.district || '').toLowerCase().includes(kw)
          )
        );

        return hospitalMatch;
      });
    }

    if (selectedHospitalId) {
      list = list.filter(d => (d.clinics || []).includes(selectedHospitalId));
    }
    
    if (selectedSpecialty) {
      list = list.filter(d => d.specialty.toLowerCase() === selectedSpecialty.toLowerCase());
    }
    
    if (selectedDay) {
      list = list.filter(d => {
        if (selectedDay === 'আজ') return d.availableToday;
        return checkDay(d.schedule, selectedDay);
      });
    }

    if (doctorSearchTerm.trim()) {
      const search = doctorSearchTerm.toLowerCase().trim();
      list = list.filter(d => d.name.toLowerCase().includes(search));
    }

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      list = list.filter(d => {
        const docName = d.name.toLowerCase();
        const docSpecialty = d.specialty.toLowerCase();
        const docDegree = (d.degree || '').toLowerCase();
        const docClinics = d.clinics || [];
        const hospitalMatch = hospitals.some(h => docClinics.includes(h.id) && h.name.toLowerCase().includes(search));
        
        // Match by specialty synonyms and Bengali names (e.g. matching "অর্থোপেডিক", "অর্থপেডিক", "ortho" as Orthopedics)
        const specialtyObj = SPECIALTIES.find(spec => spec.name.toLowerCase() === docSpecialty || spec.id === docSpecialty);
        
        // Define specialty keyword associations for robust search (bidirectional matching)
        const specialtyKeywordsMap: Record<string, string[]> = {
          orthopedics: ['ortho', 'orthopedics', 'অর্থোপেডিক', 'অর্থোপেডিক্স', 'অর্থোপেডিকস', 'অর্থপেডিক', 'অর্থপেডিক্স', 'অর্থপেডিকস', 'হাড়', 'হাড়', 'পঙ্গু'],
          medicine: ['medicine', 'মেডিসিন', 'মেডিসন', 'মেডেসিন', 'এমেডিসিন'],
          cardiology: ['cardio', 'কার্ডিওলজি', 'কার্ডিও', 'হৃদরোগ', 'হার্ট', 'heart'],
          neuromedicine: ['neuro', 'নিউরো', 'নিউরোলজি', 'মস্তিষ্ক', 'স্ট্রোক', 'brain'],
          gynecology: ['gyn', 'গাইনী', 'গাইনি', 'গাইনোকোলজি', 'গর্ভবতী', 'গর্ভ', 'প্রসূতি', 'obstetrics', 'obs', 'স্ত্রী রোগ', 'স্ত্রীরোগ'],
          pediatrics: ['pediatr', 'শিশু', 'নবজাতক', 'কিশোর', 'child', 'baby'],
          surgery: ['surgeon', 'সার্জারি', 'সার্জারী', 'অপারেশন', 'surgery'],
          urology: ['uro', 'ইউরোলজি', 'ইউরোলজিস্ট', 'মূত্র', 'bladder'],
          endocrinology: ['endocrine', 'ডায়াবেটিস', 'হরমোন', 'diabetes', 'hormone'],
          ent: ['ent', 'নাক', 'কান', 'গলা', 'nose', 'ear', 'throat', 'হেড নেক', 'head neck'],
          dermatology: ['derm', 'চর্ম', 'যৌন', 'স্কিন', 'skin', 'এলার্জি'],
          ophthalmology: ['eye', 'চোখ', 'চক্ষু', 'দৃষ্টি', 'ophthal'],
          psychiatry: ['psych', 'মানসিক', 'মন', 'পাগল', 'বিষন্নতা'],
          dentistry: ['dent', 'দাঁত', 'দন্ত', 'ডেন্টাল', 'tooth', 'teeth'],
          gastroenterology: ['gastro', 'লিভার', 'পরিপাকতন্ত্র', 'গ্যাস্ট্রিক', 'পেট', 'liver', 'stomach'],
          nephrology: ['nephro', 'কিডনি', 'নেফ্রোলজি', 'renal', 'kidney'],
          oncology: ['onco', 'ক্যান্সার', 'টিউমার', 'cancer', 'tumor'],
          hematology: ['hemato', 'রক্তরোগ', 'রক্ত', 'blood'],
          'physical-medicine': ['physical', 'ফিজিকেল', 'ব্যায়াম', 'থেরাপি', 'ফিজিওথেরাপি', 'physio', 'বাত', 'বাত-ব্যথা', 'প্যারালাইসিস', 'স্পোর্টস', 'রিহ্যাবিলিটেশন'],
          'physical medicine': ['physical', 'ফিজিকেল', 'ব্যায়াম', 'থেরাপি', 'ফিজিওথেরাপি', 'physio', 'বাত', 'বাত-ব্যথা', 'প্যারালাইসিস', 'স্পোর্টস', 'রিহ্যাবিলিটেশন'],
          physical_medicine: ['physical', 'ফিজিকেল', 'ব্যায়াম', 'থেরাপি', 'ফিজিওথেরাপি', 'physio', 'বাত', 'বাত-ব্যথা', 'প্যারালাইসিস', 'স্পোর্টস', 'রিহ্যাবিলিটেশন']
        };

        const listKeywords = specialtyKeywordsMap[docSpecialty] || [];
        const specialtyMatch = (specialtyObj && (
          specialtyObj.name.toLowerCase().includes(search) ||
          specialtyObj.bnName.toLowerCase().includes(search)
        )) || listKeywords.some(kw => search.includes(kw) || kw.includes(search));
        
        return docName.includes(search) || 
               docSpecialty.includes(search) || 
               docDegree.includes(search) || 
               hospitalMatch || 
               specialtyMatch;
      });
    }

    // Deduplicate by Name + Degree to fix data consistency issues
    const uniqueMap = new Map();
    list.forEach(d => {
      const key = `${d.name}-${d.degree}`.toLowerCase().trim();
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, d);
      } else {
        const existing = uniqueMap.get(key);
        // Merge clinics if duplicate entry found
        existing.clinics = Array.from(new Set([...(existing.clinics || []), ...(d.clinics || [])]));
      }
    });

    const resultList = Array.from(uniqueMap.values());

    // Sequential list ordering: hospital/clinic/thana doctors maintain serial order first, and Dr. Habibur Rahman (Dentist) is placed at the very end of the list
    return resultList.sort((a, b) => {
      const isAHabib = a.id === 'dr-habibur-rahman-dental' || (a.name && (a.name.includes('হাবিবুর') || a.name.toLowerCase().includes('habibur')));
      const isBHabib = b.id === 'dr-habibur-rahman-dental' || (b.name && (b.name.includes('হাবিবুর') || b.name.toLowerCase().includes('habibur')));
      if (isAHabib && !isBHabib) return 1;
      if (!isAHabib && isBHabib) return -1;
      return 0;
    });
  }, [searchTerm, doctorSearchTerm, selectedHospitalId, selectedSpecialty, selectedDay, selectedLocation, doctors, hospitals]);

  const filteredHospitals = useMemo(() => {
    let list = hospitals;
    if (selectedLocation) {
      const loc = selectedLocation.toLowerCase().trim();
      const locEnMap: Record<string, string[]> = {
        'রংপুর': ['rangpur', 'রংপুর'],
        'নীলফামারী': ['nilphamari', 'নীলফামারী'],
        'সৈয়দপুর': ['syedpur', 'sayedpur', 'saidpur', 'সৈয়দপুর', 'সৈয়দপুর'],
        'ডোমার': ['domar', 'ডোমার'],
        'ডিমলা': ['dimla', 'ডিমলা'],
        'জলঢাকা': ['jaldhaka', 'জলঢাকা'],
        'কিশোরগঞ্জ': ['kishoreganj', 'kishorganj', 'কিশোরগঞ্জ'],
        'দেবিগঞ্জ': ['debiganj', 'দেবিগঞ্জ'],
      };
      const keywords = locEnMap[loc] || [loc];
      list = list.filter(h => {
        const name = h.name.toLowerCase();
        const addr = (h.address || '').toLowerCase();
        const dist = (h.district || '').toLowerCase();
        return keywords.some(kw => name.includes(kw) || addr.includes(kw) || dist.includes(kw));
      });
    }
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      list = list.filter(h => h.name.toLowerCase().includes(search) || (h.address || '').toLowerCase().includes(search));
    }
    return list;
  }, [hospitals, selectedLocation, searchTerm]);

  const filteredLabTests = useMemo(() => {
    return labTests.filter(t => {
      const search = searchTerm.toLowerCase().trim();
      const matchesSearch = !search ||
        t.name.toLowerCase().includes(search) ||
        (t.description || '').toLowerCase().includes(search) ||
        (t.hospital_name || '').toLowerCase().includes(search) ||
        (t.category || '').toLowerCase().includes(search);
      const matchesCategory = selectedTestCategory === 'all' || t.category === selectedTestCategory;
      const isActive = t.isActive !== false;
      const isVisible = isAdmin || isActive;
      return matchesSearch && matchesCategory && isVisible;
    });
  }, [searchTerm, labTests, selectedTestCategory, isAdmin]);

  const handleToggleGlobalLabTestsService = async (enabled: boolean) => {
    if (!user || profile?.role !== UserRole.ADMIN) {
      alert("অ্যাডমিন পারমিশন নেই।");
      return;
    }
    try {
      setIsLabTestsServiceEnabled(enabled);
      await setDoc(doc(db, 'settings', 'lab_tests_status'), { enabled, key: 'lab_tests_status' }, { merge: true });
    } catch (error) {
      console.error("Error toggling global lab tests service status:", error);
      alert("সেবা স্ট্যাটাস সেভ করতে সমস্যা হয়েছে।");
    }
  };

  const handleToggleTestActive = async (testItem: LabTest) => {
    if (!user || profile?.role !== UserRole.ADMIN) {
      alert("অ্যাডমিন পারমিশন নেই।");
      return;
    }
    try {
      const updatedItem = { ...testItem, isActive: testItem.isActive === false ? true : false };
      await setDoc(doc(db, 'lab_tests', testItem.id), updatedItem, { merge: true });
      await fetchData();
    } catch (error) {
      console.error("Error toggling test active state:", error);
    }
  };

  const masterLogFiltered = useMemo(() => {
    return allPrescriptions.filter(p => 
      p.patient_name.toLowerCase().includes(adminSearchTerm.toLowerCase()) ||
      p.doctor_name.toLowerCase().includes(adminSearchTerm.toLowerCase())
    );
  }, [allPrescriptions, adminSearchTerm]);

  // --- Data Management Functions ---
  const handleSaveData = async (type: 'doctor' | 'hospital' | 'lab_test', item: any) => {
    if (!user || profile?.role !== UserRole.ADMIN) {
      alert("অ্যাডমিন পারমিশন নেই।");
      return;
    }
    setIsProcessing(true);
    try {
      const collectionName = type === 'doctor' ? 'doctors' : type === 'hospital' ? 'hospitals' : 'lab_tests';
      await setDoc(doc(db, collectionName, item.id), item, { merge: true });
      
      alert('সফলভাবে সেভ হয়েছে!');
      setShowAddModal(false);
      setEditingItem(null);
      await fetchData();
    } catch (err: any) {
      console.error("Save Error:", err);
      alert('সেভ করা যায়নি। এরর: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const seedDatabase = useCallback(async () => {
    if (!user || !isAdmin || !confirm('এটি আপনার ফায়ারবেস অ্যাকাউন্টে প্রাথমিক ডেটা যোগ করবে। আপনি কি নিশ্চিত?')) return;
    setIsProcessing(true);
    try {
      const batch = writeBatch(db);
      
      DOCTORS.forEach(d => batch.set(doc(db, 'doctors', d.id), d));
      CLINICS.forEach(c => batch.set(doc(db, 'hospitals', c.id), c));
      LAB_TESTS.forEach(t => batch.set(doc(db, 'lab_tests', t.id), t));
      
      await batch.commit();
      alert('ডেটাবেস সফলভাবে সিড হয়েছে!');
      await fetchData();
    } catch (err: any) {
      alert('সিড করা যায়নি। এরর: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  }, [user, profile, fetchData]);

  useEffect(() => {
    if (user && isAdmin) {
      (window as any).seedDatabase = seedDatabase;
    }
  }, [seedDatabase, user, isAdmin]);

  const handleDeleteData = async (type: 'doctor' | 'hospital' | 'lab_test', id: string) => {
    if (!user || profile?.role !== UserRole.ADMIN) {
      alert("অ্যাডমিন পারমিশন নেই।");
      return;
    }
    
    // Using a simpler confirm or just proceeding if confirm is unreliable in iframes
    if (!window.confirm('আপনি কি নিশ্চিত যে এটি ডিলিট করতে চান?')) return;

    setIsProcessing(true);
    try {
      const collectionName = type === 'doctor' ? 'doctors' : type === 'hospital' ? 'hospitals' : 'lab_tests';
      await deleteDoc(doc(db, collectionName, id));
      alert('সফলভাবে ডিলিট হয়েছে!');
      await fetchData();
    } catch (err: any) {
      console.error("Delete Error:", err);
      alert('ডিলিট করা যায়নি। এরর: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Update ticker message in database ---
  const updateTicker = async () => {
    if (!user || !isAdmin) return;
    setIsProcessing(true);
    try {
      await setDoc(doc(db, 'settings', 'ticker_message'), { key: 'ticker_message', value: tickerMessage });
      alert('Ticker সফলভাবে আপডেট হয়েছে!');
    } catch (err: any) {
      console.error(err);
      alert('Ticker আপডেট করা যায়নি।');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBookingSuccess = () => {
    if (profile?.role === UserRole.ADMIN) {
      fetchAdminData();
    } else {
      fetchUserData();
    }
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center font-black text-blue-600 animate-pulse uppercase tracking-[0.3em]">Nilpha...</div>;

  const HOTLINE_CONTACT = "01352669100";
  const YOUTUBE_CHANNEL_URL = "https://www.youtube.com/@DoctorM-c9k";

  const activeTransportFee = 
    deliveryDistance === 'within_2km' ? 30 :
    deliveryDistance === 'around_5km' ? 50 :
    deliveryDistance === 'around_10km' ? 80 : 0;

  const couponDiscountPercent = appliedCoupon ? appliedCoupon.discount_percent : 0;
  const couponDiscountAmount = appliedCoupon ? Math.round((showPayment.amount * couponDiscountPercent) / 100) : 0;
  const discountedServiceAmount = Math.max(0, showPayment.amount - couponDiscountAmount);
  const totalPayableAmount = discountedServiceAmount + activeTransportFee;
  const currentPayMethod = (paymentMethod || 'bkash') as 'bkash' | 'nagad';
  const currentPayNumber = PAYMENT_NUMBERS[currentPayMethod] || '01518395772';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none overflow-x-hidden">
      <SecurityGuard />
      <SEO 
        title="Nilpha | নীলফামারীর সেরা ডাক্তারদের তালিকা ও সিরিয়াল বুকিং - Nilphamari Medical Directory"
        description="নীলফামারী জেলার সকল বিশেষজ্ঞ ডাক্তারদের তালিকা, চেম্বারের ঠিকানা, ভিজিটিং সময়সূচী ও সরাসরি সিরিয়াল বুকিং সেবা। ডক্টর কুটুম নীলফামারী সহ সকল ক্লিনিক ও হাসপাতালের ডাক্তারদের তথ্য Nilpha.com-এ।"
        keywords={[
          'Nilpha',
          'Nilpha.com',
          'Nilphamari Doctor',
          'নীলফামারী ডাক্তার',
          'নীলফামারীর ডাক্তারদের তালিকা',
          'নীলফামারীর সেরা ডাক্তার',
          'ডক্টর কুটুম নীলফামারী',
          'Doctor Kutum Nilphamari',
          'ডাক্তার সিরিয়াল নীলফামারী',
          'Doctor Appointment Nilphamari',
          'Nilphamari Medical Directory',
          'Nilphamari Hospital Doctor List',
          'জনতা ক্লিনিক নীলফামারী',
          'এ আর জেনারেল হাসপাতাল নীলফামারী',
          'নীলফামারী ডায়াবেটিস হাসপাতাল',
          'গাইনী ডাক্তার নীলফামারী',
          'শিশু বিশেষজ্ঞ নীলফামারী',
          'মেডিসিন বিশেষজ্ঞ নীলফামারী',
          'সার্জারি বিশেষজ্ঞ নীলফামারী',
          'হৃদরোগ বিশেষজ্ঞ নীলফামারী',
          'চক্ষু বিশেষজ্ঞ নীলফামারী',
          'অর্থোপেডিক বিশেষজ্ঞ নীলফামারী',
          'নাক কান গলা বিশেষজ্ঞ নীলফামারী',
          'চর্ম ও যৌন বিশেষজ্ঞ নীলফামারী'
        ]}
        canonical="/"
        ogUrl="/"
        schemas={[
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Nilpha Healthcare Network",
            "alternateName": ["Nilpha", "ডক্টর কুটুম নীলফামারী", "Nilphamari Doctor Portal"],
            "url": "https://nilpha.com",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://nilpha.com/?search={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          },
          {
            "@context": "https://schema.org",
            "@type": "MedicalOrganization",
            "name": "Nilpha Healthcare Network",
            "alternateName": "Nilpha.com",
            "url": "https://nilpha.com",
            "logo": "https://nilpha.com/logo.png",
            "telephone": `+88${HOTLINE_CONTACT}`,
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "Nilphamari Sadar",
              "addressLocality": "Nilphamari",
              "addressRegion": "Rangpur",
              "postalCode": "5300",
              "addressCountry": "BD"
            }
          },
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": "Nilphamari Specialist Doctors Directory",
            "description": "Directory of certified doctors and specialists in Nilphamari district",
            "itemListElement": DOCTORS.slice(0, 30).map((d, idx) => ({
              "@type": "ListItem",
              "position": idx + 1,
              "name": d.name,
              "url": `https://nilpha.com/doctors/${slugify(d.name)}`
            }))
          }
        ]}
      />

      <BookingModal 
        isOpen={!!bookingDoctor} 
        onClose={() => setBookingDoctor(null)} 
        doctorName={bookingDoctor?.name || ''} 
        doctorSpecialty={bookingDoctor?.specialty || ''} 
        hotline={HOTLINE_CONTACT} 
        onSuccess={handleBookingSuccess}
      />

      <Routes>
        {/* Dynamic Landing Pages */}
        <Route path="/doctors/:slug" element={<DoctorProfilePage />} />
        <Route path="/hospitals/:slug" element={<ClinicLandingPage />} />
        <Route path="/specialists/:slug" element={<SpecialistLandingPage />} />
        <Route path="/districts/:slug" element={<DistrictLandingPage />} />
        <Route path="/doctor-portal" element={<DoctorPortal currentProfile={profile || { id: 'guest', full_name: 'Doctor', role: UserRole.DOCTOR, phone: '' }} doctorsList={doctors} labTestsList={labTests} onLogout={logout} />} />
        <Route path="/doctor" element={<DoctorPortal currentProfile={profile || { id: 'guest', full_name: 'Doctor', role: UserRole.DOCTOR, phone: '' }} doctorsList={doctors} labTestsList={labTests} onLogout={logout} />} />

        {/* Main App Experience */}
        <Route path="*" element={
          isAdmin ? (
            <>
               <AdminDashboard 
                profile={profile!} 
                onLogout={logout} 
                ticker={tickerMessage} 
                setTicker={setTickerMessage} 
                onUpdateTicker={updateTicker}
                doctors={doctors}
                hospitals={hospitals}
                labTests={labTests}
                orders={allOrders}
                profiles={allProfiles}
                appointments={allAppointments}
                onAdd={(type) => {
                  setAdminDataTab(type === 'doctor' ? 'doctors' : type === 'hospital' ? 'hospitals' : 'tests');
                  setEditingItem({});
                  setTempImage(null);
                  setShowAddModal(true);
                }}
                onEdit={(type, item) => {
                  setAdminDataTab(type === 'doctor' ? 'doctors' : type === 'hospital' ? 'hospitals' : 'tests');
                  setEditingItem(item);
                  setTempImage(item.image || null);
                  setShowAddModal(true);
                }}
                onDelete={handleDeleteData}
                onRefreshAdminData={fetchAdminData}
                onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                quizzes={allQuizzes}
                submissions={allSubmissions}
                withdrawals={allWithdrawals}
                onAddQuiz={handleAddQuiz}
                onUpdateSubmissionStatus={handleUpdateSubmissionStatus}
                onUpdateWithdrawalStatus={handleUpdateWithdrawalStatus}
                isLabTestsServiceEnabled={isLabTestsServiceEnabled}
                onToggleGlobalLabTestsService={handleToggleGlobalLabTestsService}
                onToggleTestActive={handleToggleTestActive}
                onCouponsUpdated={fetchCouponsList}
              />

              <AdminDataModal
                isOpen={showAddModal}
                onClose={() => {
                  setShowAddModal(false);
                  setEditingItem(null);
                }}
                type={adminDataTab === 'doctors' ? 'doctor' : adminDataTab === 'hospitals' ? 'hospital' : 'lab_test'}
                initialItem={editingItem}
                hospitals={hospitals}
                onSave={handleSaveData}
                isProcessing={isProcessing}
                tempImage={tempImage}
                setTempImage={setTempImage}
                handleImageUpload={handleImageUpload}
              />
            </>
          ) : (
            <>
              <AnimatePresence>
                {showLanding && (
                  <LandingPage onStart={() => {
                    setShowLanding(false);
                    sessionStorage.setItem('jb_landing_seen', 'true');
                  }} />
                )}
              </AnimatePresence>

              {/* Ticker */}
              <div className="bg-red-600 text-white py-3 overflow-hidden whitespace-nowrap z-50 shadow-md border-b-2 border-red-700">
                <div className="animate-marquee inline-block pl-[100%] font-black text-sm uppercase tracking-wider">
                  {tickerMessage} • ইমারজেন্সি হেল্পলাইন: {HOTLINE_CONTACT} • 
                </div>
              </div>

              <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md px-6 py-4 border-b flex justify-between items-center shadow-sm">
                <h1 className="text-xl font-black text-slate-800 tracking-tight cursor-pointer" onClick={() => { setActiveTab('home'); setHomeSubCategory('doctors'); setSelectedHospitalId(null); setSelectedSpecialty(null); navigate('/'); }}>
                  <span className="text-blue-600">Nil</span>pha
                </h1>
                <div className="flex gap-2 items-center">
                   <a 
                     href={YOUTUBE_CHANNEL_URL} 
                     target="_blank" 
                     rel="noopener noreferrer" 
                     className="w-9 h-9 bg-red-50 hover:bg-red-100 rounded-full flex items-center justify-center text-red-600 border-2 border-red-100 active:scale-90 transition-all cursor-pointer" 
                     title="ইউটিউব চ্যানেল (টিউটোরিয়াল ও নিয়মাবলী)"
                   >
                     <Youtube size={16} />
                   </a>
                   <button onClick={handleShare} className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 border-2 border-slate-50 active:scale-90 transition-all" title="Share App">
                     <Share2 size={16} />
                   </button>
                   {user ? (
                     <button onClick={() => { setActiveTab('profile'); navigate('/'); }} className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-[11px] font-black border-2 border-blue-50">
                       {profile?.full_name?.[0].toUpperCase() || '👤'}
                     </button>
                   ) : (
                     <div className="flex items-center gap-1.5">
                       <button 
                         onClick={() => { setAuthMode('register'); setShowAuthModal(true); }} 
                         className="text-[10px] sm:text-[11px] font-black uppercase bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl transition-all shadow-sm shadow-emerald-500/20 active:scale-95 cursor-pointer whitespace-nowrap"
                       >
                         রেজিস্ট্রেশন
                       </button>
                       <button 
                         onClick={() => { setAuthMode('login'); setShowAuthModal(true); }} 
                         className="text-[10px] sm:text-[11px] font-black uppercase bg-blue-600 hover:bg-blue-700 text-white px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl transition-all shadow-sm shadow-blue-500/20 active:scale-95 cursor-pointer whitespace-nowrap"
                       >
                         লগিন
                       </button>
                     </div>
                   )}
                </div>
              </header>

              <main className="flex-1 p-6 mobile-p-safe space-y-8 overflow-y-auto no-scrollbar pb-32">
                {activeTab === 'home' && (
                  <div className="space-y-6 animate-in fade-in">
                    {/* Category Menu: Direct one-tap navigation to any section */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-600 rounded-full" />
                          আমাদের সেবাসমূহ
                        </h2>
                        {homeSubCategory !== 'doctors' && (
                          <button 
                            onClick={() => {
                              setHomeSubCategory('doctors');
                              setSelectedHospitalId(null);
                              setSearchTerm('');
                              setSelectedSpecialty(null);
                              setSelectedDay(null);
                            }}
                            className="text-[10px] font-black text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95"
                          >
                            <span>⬅️</span> ডাক্তারদের তালিকায় ফিরে যান
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-7 lg:grid-cols-14 gap-1.5">
                        {[
                          { id: 'doctors', icon: '👨‍⚕️', label: 'ডক্টর' },
                          { id: 'live_doctor', icon: '🔴', label: 'লাইভ ডক্টর' },
                          { id: 'blood_donation', icon: '🩸', label: 'ব্লাড ডোনেট' },
                          { id: 'govt_health', icon: '🏛️', label: 'সরকারি স্বাস্থ্য ও টিকিট' },
                          { id: 'subscriptions', icon: '💳', label: 'সাবস্ক্রিপশন' },
                          { id: 'free_doctors', icon: '🎁', label: 'ফ্রি ডাক্তার' },
                          { id: 'maternity_donation', icon: '🤰', label: 'সিজার অনুদান' },
                          { id: 'donation', icon: '🤲', label: 'ডোনেট করুন' },
                          { id: 'hospitals', icon: '🏥', label: 'হাসপাতাল' },
                          { id: 'dental', icon: '🦷', label: 'ডেন্টাল সেবা' },
                          { id: 'labtests', icon: '🧪', label: 'ল্যাব ও টেস্ট' },
                          { id: 'emergency', icon: '🆘', label: 'SOS সেবা' },
                          { id: 'buy_medicine', icon: '💊', label: 'ঔষধ পণ্য' },
                          { id: 'medical_accessories', icon: '🩺', label: 'মেডিকেল এক্সেসরিজ' }
                        ].map(cat => (
                          <button 
                            key={cat.id} 
                            onClick={() => { 
                              setHomeSubCategory(cat.id as any); 
                              setSelectedHospitalId(null); 
                              setSearchTerm(''); 
                              setSelectedSpecialty(null);
                              setSelectedDay(null);
                            }}
                            className={`flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl transition-all cursor-pointer ${homeSubCategory === cat.id ? 'bg-blue-600 text-white shadow-lg scale-105' : 'bg-white text-slate-500 border border-slate-100 hover:border-slate-300'}`}
                          >
                            <span className="text-xl">{cat.icon}</span>
                            <span className="text-[9px] font-black uppercase tracking-tight text-center leading-none">{cat.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Top Hero Section: ONLY displayed on Doctors category */}
                    {homeSubCategory === 'doctors' && (
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-stretch animate-in fade-in">
                        {/* LEFT SIDE: Dynamic Multi-Slide Sponsored Doctor & Hospital Promotional Slider with Per-Slide Timers */}
                        <div className="md:col-span-7 flex flex-col">
                          <SponsorBannerSlider 
                            isAdmin={isAdmin}
                            hospitals={hospitals}
                            whatsappNumber={WHATSAPP_NUMBER}
                            onNavigateCategory={(cat) => {
                              setHomeSubCategory(cat);
                              setSelectedHospitalId(null);
                              setSearchTerm('');
                              setSelectedSpecialty(null);
                              setSelectedDay(null);
                            }}
                            onSelectHospital={(hId) => {
                              setSelectedHospitalId(hId);
                              setHomeSubCategory('doctors');
                            }}
                          />
                        </div>

                        {/* RIGHT SIDE: Compact Action Buttons Stacked Vertically */}
                        <div className="md:col-span-5 flex flex-col gap-2 justify-between">
                          {/* 2. WhatsApp Button (Compact) */}
                          <button 
                            onClick={() => window.open(`https://wa.me/88${HOTLINE_CONTACT}?text=Hello,%20I%20want%20to%20know%20more%20about%20doctors`, '_blank')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-2xl font-bold text-xs shadow-sm active:scale-95 transition-all flex items-center justify-between gap-2 border-b-2 border-emerald-800 cursor-pointer"
                          >
                            <span className="flex items-center gap-1.5 truncate">
                              <span className="text-sm leading-none">💬</span>
                              <span className="truncate">ডাক্তার সম্পর্কিত জানতে WhatsApp করুন</span>
                            </span>
                            <span className="text-[9px] bg-emerald-700/80 px-1.5 py-0.5 rounded-md shrink-0 font-black">মেসেজ</span>
                          </button>

                          {/* 3. Call Hotline Button (Compact) */}
                          <a 
                            href={`tel:${HOTLINE_CONTACT}`}
                            className="bg-sky-600 hover:bg-sky-700 text-white px-3 py-2 rounded-2xl font-bold text-xs shadow-sm active:scale-95 transition-all flex items-center justify-between gap-2 border-b-2 border-sky-800 cursor-pointer"
                          >
                            <span className="flex items-center gap-1.5 truncate">
                              <span className="text-sm leading-none">📞</span>
                              <span className="truncate">সরাসরি কল করুন (01352669100)</span>
                            </span>
                            <span className="text-[9px] bg-sky-700/80 px-1.5 py-0.5 rounded-md shrink-0 font-black">কল</span>
                          </a>

                          {/* 4. Video Guide Button (Compact) */}
                          <a 
                            href={YOUTUBE_CHANNEL_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-2xl font-bold text-xs shadow-sm active:scale-95 transition-all flex items-center justify-between gap-2 border-b-2 border-red-800 cursor-pointer"
                          >
                            <span className="flex items-center gap-1.5 truncate">
                              <Youtube size={15} className="fill-white shrink-0" />
                              <span className="truncate">ব্যবহারের নিয়ম-কানুন ও ভিডিও গাইড</span>
                            </span>
                            <span className="text-[9px] bg-red-700/80 px-1.5 py-0.5 rounded-md shrink-0 font-black">YouTube</span>
                          </a>

                          {/* 5. Donate Button (Prominent) */}
                          <button 
                            onClick={() => {
                              setHomeSubCategory('donation');
                              setSelectedHospitalId(null); 
                              setSearchTerm(''); 
                              setSelectedSpecialty(null);
                              setSelectedDay(null);
                            }}
                            className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white px-3 py-2 rounded-2xl font-bold text-xs shadow-sm active:scale-95 transition-all flex items-center justify-between gap-2 border-b-2 border-emerald-900 cursor-pointer"
                          >
                            <span className="flex items-center gap-1.5 truncate">
                              <span className="text-sm leading-none">🤲</span>
                              <span className="truncate">মানবসেবায় ও মায়েদের ফান্ডে ডোনেট করুন</span>
                            </span>
                            <span className="text-[9px] bg-amber-300 text-slate-950 px-1.5 py-0.5 rounded-md shrink-0 font-black">দান করুন</span>
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-6">
                       <div className="flex justify-between items-center bg-slate-100/50 p-2 rounded-2xl">
                           <h2 className="text-[11px] font-black text-slate-800 uppercase ml-2 tracking-wide">
                            {homeSubCategory === 'doctors' 
                              ? (selectedHospitalId 
                                  ? hospitals.find(h => h.id === selectedHospitalId)?.name 
                                  : 'বিশেষজ্ঞ ডক্টর') 
                              : (homeSubCategory === 'blood_donation' ? '🩸 ব্লাড ডোনেট ও জরুরি রক্তদাতা ডিরেক্টরি' : homeSubCategory === 'live_doctor' ? '🔴 লাইভ ডক্টর — ভিডিও কল কনসালটেশন' : homeSubCategory === 'govt_health' ? '🏛️ সরকারি হাসপাতাল স্বাস্থ্যসেবা ও ই-টিকিট পোর্টাল (আমার স্বাস্থ্য)' : homeSubCategory === 'free_doctors' ? '🎁 আজকের ফ্রি ডাক্তার সেবা ও ডিসকাউন্ট' : homeSubCategory === 'maternity_donation' ? '🤰 গরিব গর্ভবতী মায়েদের সিজার ডেলিভারি অনুদান (৳২,০০০)' : homeSubCategory === 'donation' ? '🤲 মানবতার কল্যাণে ডোনেশন ফান্ড ও ডোনার পোর্টাল' : homeSubCategory === 'hospitals' ? 'হাসপাতাল লিস্ট' : homeSubCategory === 'dental' ? 'ডেন্টাল চেম্বার ও দন্তরোগ সেবা' : homeSubCategory === 'labtests' ? 'ল্যাব টেস্ট' : homeSubCategory === 'buy_medicine' ? 'ঔষধ পণ্য' : homeSubCategory === 'medical_accessories' ? 'মেডিকেল এক্সেসরিজ' : 'জরুরি SOS সেবা')}
                          </h2>
                          <div className="relative">
                            <input 
                              type="text" 
                              placeholder="খুঁজুন..." 
                              value={searchTerm} 
                              onChange={(e) => setSearchTerm(sanitizeInput(e.target.value))} 
                              className="bg-white border-none rounded-xl py-2 px-3 text-[10px] font-bold outline-none w-36 shadow-sm" 
                            />
                            <span className="absolute right-2 top-2 text-slate-300 text-[10px]">🔍</span>
                          </div>
                       </div>

                       {homeSubCategory === 'doctors' && (
                         <div className="space-y-6">
                            {/* Today's Doctors Highlight Banner (Only inside Doctors section) */}
                            <TodaysDoctorsBanner doctors={doctors} />
                            {/* Promotional Demo Doctor Profile Banner & Ad Placement Notice */}
                            <DoctorProfileAdBannerCard 
                              hotline={HOTLINE_CONTACT}
                              whatsappNumber={WHATSAPP_NUMBER}
                            />
                            {/* Location Filter Bar (Right above Saturday/Sunday Day selector) */}
                            <div className="space-y-1.5">
                               <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-500 tracking-wider px-1">
                                 <span className="flex items-center gap-1">
                                   <MapPin size={12} className="text-emerald-600" /> এলাকা নির্বাচন করুন:
                                 </span>
                                 {selectedLocation && (
                                   <button 
                                     onClick={() => setSelectedLocation(null)} 
                                     className="text-blue-600 hover:underline text-[9px] font-bold"
                                   >
                                     সকল এলাকা দেখুন
                                   </button>
                                 )}
                               </div>
                               <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                                   {[
                                     { id: 'all', label: 'সকল এলাকা' },
                                     { id: 'রংপুর', label: 'রংপুর' },
                                     { id: 'নীলফামারী', label: 'নীলফামারী' },
                                     { id: 'সৈয়দপুর', label: 'সৈয়দপুর' },
                                     { id: 'ডোমার', label: 'ডোমার' },
                                     { id: 'ডিমলা', label: 'ডিমলা' },
                                     { id: 'জলঢাকা', label: 'জলঢাকা' },
                                     { id: 'কিশোরগঞ্জ', label: 'কিশোরগঞ্জ' },
                                     { id: 'দেবিগঞ্জ', label: 'দেবিগঞ্জ' },
                                   ].map(loc => {
                                     const isSelected = loc.id === 'all' ? selectedLocation === null : selectedLocation === loc.id;
                                     return (
                                       <button
                                         key={loc.id}
                                         onClick={() => setSelectedLocation(loc.id === 'all' ? null : (selectedLocation === loc.id ? null : loc.id))}
                                         className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black tracking-tight whitespace-nowrap transition-all border-2 flex items-center gap-1 ${
                                           isSelected 
                                             ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100 scale-105' 
                                             : 'bg-white text-slate-700 border-slate-100 hover:border-slate-300'
                                         }`}
                                       >
                                         <span>📍</span>
                                         {loc.label}
                                       </button>
                                     );
                                   })}
                               </div>
                            </div>

                            {/* Day Filter Bar */}
                            <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                                {[
                                  { id: 'all', label: 'সকল দিন' },
                                  { id: 'আজ', label: 'আজ (আজকের ডাক্তার)' },
                                  { id: 'শনিবার', label: 'শনিবার' },
                                  { id: 'রবিবার', label: 'রবিবার' },
                                  { id: 'সোমবার', label: 'সোমবার' },
                                  { id: 'মঙ্গলবার', label: 'মঙ্গলবার' },
                                  { id: 'বুধবার', label: 'বুধবার' },
                                  { id: 'বৃহস্পতিবার', label: 'বৃহস্পতিবার' },
                                  { id: 'শুক্রবার', label: 'শুক্রবার' },
                                ].map(day => {
                                  const isSelected = (day.id === 'all' ? selectedDay === null : selectedDay === day.id);
                                  const todayName = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'][new Date().getDay()];
                                  const isToday = day.id === 'আজ' || day.id === todayName;

                                  return (
                                    <button
                                      key={day.id}
                                      onClick={() => day.id === 'all' ? setSelectedDay(null) : setSelectedDay(selectedDay === day.id ? null : day.id)}
                                      className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black tracking-tight whitespace-nowrap transition-all border-2 flex items-center gap-1.5 ${
                                        isSelected 
                                          ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100 scale-105' 
                                          : 'bg-white text-slate-600 border-slate-100 hover:border-blue-200'
                                      }`}
                                    >
                                      {isToday && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>}
                                      <span>{day.label}</span>
                                    </button>
                                  );
                                })}
                            </div>

                            {/* Specialty Bar */}
                            <div className="relative w-full group">
                                <div 
                                  ref={specialtyScrollRef}
                                  className="flex gap-4 overflow-x-auto no-scrollbar pb-3 px-1 scroll-smooth cursor-grab active:cursor-grabbing"
                                >
                                    <button 
                                        onClick={() => setSelectedSpecialty(null)}
                                        className={`flex flex-col items-center gap-2 min-w-[75px] transition-all duration-300 ${selectedSpecialty === null ? 'scale-110 active:scale-100' : 'opacity-40 hover:opacity-100'}`}
                                    >
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl shadow-xl transition-all border-2 ${selectedSpecialty === null ? 'bg-blue-600 text-white border-blue-400' : 'bg-white border-slate-100'}`}>✨</div>
                                        <span className={`text-[9px] font-black uppercase tracking-tighter text-center ${selectedSpecialty === null ? 'text-blue-600' : 'text-slate-400'}`}>All Docs</span>
                                    </button>
                                    {SPECIALTIES.map(spec => (
                                        <button 
                                            key={spec.id}
                                            onClick={() => setSelectedSpecialty(spec.name)}
                                            className={`flex flex-col items-center gap-2 min-w-[75px] transition-all duration-300 ${selectedSpecialty === spec.name ? 'scale-110 active:scale-100' : 'opacity-40 hover:opacity-100'}`}
                                        >
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl shadow-xl transition-all border-2 ${selectedSpecialty === spec.name ? 'bg-blue-600 text-white border-blue-400' : 'bg-white border-slate-100'}`}>
                                              {spec.id === 'dentistry' || spec.icon === '🦷' ? '🦷' : (
                                                spec.icon === 'Stethoscope' ? '🩺' :
                                                spec.icon === 'Activity' ? '⚡' :
                                                spec.icon === 'User' ? '👩‍⚕️' :
                                                spec.icon === 'Heart' ? '👶' :
                                                spec.icon === 'HeartPulse' ? '❤️' :
                                                spec.icon === 'Bone' ? '🦴' :
                                                spec.icon === 'Shield' ? '🧴' :
                                                spec.icon === 'Ear' ? '👂' :
                                                spec.icon === 'Eye' ? '👁️' :
                                                spec.icon === 'Brain' ? '🧠' :
                                                spec.icon === 'Smile' ? '😊' :
                                                spec.icon === 'ShieldAlert' ? '💧' :
                                                spec.icon === 'Thermometer' ? '🧪' :
                                                spec.icon === 'Zap' ? '🎗️' : (spec.icon || '🩺')
                                              )}
                                            </div>
                                            <div className="flex flex-col items-center">
                                              <span className={`text-[11px] font-black uppercase tracking-tight text-center leading-none ${selectedSpecialty === spec.name ? 'text-blue-600' : 'text-slate-900 border-b-2 border-transparent'}`}>{spec.name}</span>
                                              <span className={`text-[10px] font-black text-center leading-none mt-2 ${selectedSpecialty === spec.name ? 'text-blue-500' : 'text-slate-700'}`}>{spec.bnName}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                <div className="absolute top-0 right-0 h-14 w-12 bg-gradient-to-l from-slate-50 to-transparent pointer-events-none group-hover:opacity-0 transition-opacity"></div>
                            </div>

                            <div className="space-y-4">
                               <div className="flex justify-between items-center bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs">
                                 <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                                   🩺 বিশেষজ্ঞ ডাক্তার তালিকা ({filteredDoctors.length} জন)
                                 </span>
                                 <button
                                   type="button"
                                   onClick={() => downloadDoctorsCSV(filteredDoctors, hospitals)}
                                   className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-black px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all active:scale-95"
                                 >
                                   <Download size={12} /> ডাউনলোড CSV
                                 </button>
                               </div>

                               {filteredDoctors.length === 0 ? (
                                 <Card className="p-8 text-center text-slate-400 font-bold text-xs space-y-2">
                                   <div className="text-2xl">👨‍⚕️</div>
                                   <p>এই এলাকায় বা ফিল্টারে কোনো ডক্টর পাওয়া যায়নি।</p>
                                 </Card>
                               ) : (
                                 filteredDoctors.map(d => (
                                 <Card 
                                  key={d.id} 
                                  onClick={() => navigate(`/doctors/${slugify(d.name)}`)}
                                  className="flex items-start gap-4 border-l-4 border-l-blue-600 hover:border-l-8 hover:shadow-lg transition-all cursor-pointer group relative p-5"
                                 >
                                   <div className="relative shrink-0">
                                     <img src={d.image} className="w-20 h-24 rounded-2xl object-cover border bg-slate-50 shadow-sm" alt={d.name} />
                                     {Boolean(d.isVideoConsultant) && (
                                       <div className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white rounded-full p-1 shadow-md animate-pulse" title="নিবন্ধিত লাইভ ডক্টর">
                                         <Video size={10} />
                                       </div>
                                     )}
                                   </div>
                                   <div className="flex-1 space-y-1">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <h4 className="font-black text-[15px] text-slate-800 leading-tight group-hover:text-blue-600 transition-colors">{d.name}</h4>
                                        {Boolean(d.isVideoConsultant) && (
                                          <span className="bg-rose-50 text-rose-600 border border-rose-200 text-[8px] font-black px-1.5 py-0.5 rounded-full inline-flex items-center gap-1 animate-pulse shadow-2xs">
                                            <Video size={9} className="text-rose-600 shrink-0" />
                                            লাইভ ডক্টর
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[10px] text-blue-600 font-black uppercase tracking-wider">{d.specialty}</p>
                                      <p className="text-[9px] text-slate-400 font-bold leading-tight line-clamp-2 italic">{d.degree}</p>
                                      
                                      <div className="pt-2 border-t border-slate-50 mt-2 space-y-1.5">
                                         <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-500 uppercase">
                                            <MapPin size={10} className="text-blue-500" />
                                            {selectedHospitalId 
                                               ? (CLINICS.find(c => c.id === selectedHospitalId)?.name || 'চেম্বার')
                                               : (d.clinics.map(cid => CLINICS.find(c => c.id === cid)?.name).filter(Boolean).join(' • ') || 'চেম্বার')
                                            }
                                         </div>
                                         <div className="flex items-center gap-1.5 text-[9px] font-black text-rose-500 uppercase">
                                            <Clock size={10} />
                                            {d.schedule}
                                         </div>
                                      </div>
                                   </div>
                                   <div className="flex flex-col gap-2 shrink-0">
                                      {Boolean(d.isVideoConsultant) && (
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setLiveDoctorSelectedDoc(d);
                                            setShowLiveDoctorModal(true);
                                          }}
                                          className="bg-gradient-to-r from-red-600 to-rose-600 text-white px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-tight shadow-md shadow-red-200 flex items-center gap-1.5 hover:from-red-700 hover:to-rose-700 active:scale-95 transition-all cursor-pointer animate-pulse"
                                          title="ভিডিও কলে সরাসরি এই ডক্টরকে দেখান"
                                        >
                                          <Video size={10} /> লাইভ কল
                                        </button>
                                      )}
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setBookingDoctor(d);
                                          setShowSerialModal(true);
                                        }}
                                        className="bg-emerald-600 text-white px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-tight shadow-md shadow-emerald-100 flex items-center gap-1.5 hover:bg-emerald-700 active:scale-95 transition-all"
                                      >
                                        <MessageSquare size={10} /> সিরিয়াল দিন
                                      </button>
                                      <a 
                                        href={`tel:${HOTLINE_CONTACT}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="bg-blue-600 text-white px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-tight shadow-md shadow-blue-100 flex items-center gap-1.5 hover:bg-blue-700 active:scale-95 transition-all"
                                      >
                                        <Phone size={10} /> কল করুন
                                      </a>
                                   </div>
                                   {d.availableToday && (
                                     <div className="absolute top-4 right-4">
                                        <span className="flex h-2 w-2 relative">
                                           <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                           <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                        </span>
                                      </div>
                                   )}
                                 </Card>
                               )))}
                            </div>
                         </div>
                       )}

                       {homeSubCategory === 'live_doctor' && (
                         <div className="space-y-6 text-left">
                            {/* Live Doctor Hero Banner */}
                            <div className="relative overflow-hidden bg-gradient-to-br from-red-600 via-rose-700 to-indigo-900 rounded-[32px] p-6 sm:p-8 text-white shadow-2xl border border-red-500/30 space-y-4">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider text-white border border-white/20">
                                  <span className="flex h-2.5 w-2.5 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                                  </span>
                                  <span>🔴 অন-ডিউটি লাইভ ভিডিও কনসালটেশন</span>
                                </div>
                                <span className="bg-amber-400 text-slate-950 text-xs font-black px-3 py-1 rounded-full shadow-sm">
                                  ভিজিট ফি: ৳২০০ | সাবস্ক্রিপশনে ফ্রি (৳০)
                                </span>
                              </div>

                              <div className="space-y-2 max-w-2xl">
                                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                                  ঘরে বসেই অভিজ্ঞ চিকিৎসকের সাথে সরাসরি লাইভ ভিডিও বা অডিও কলে কথা বলুন
                                </h3>
                                <p className="text-xs sm:text-sm font-bold text-red-100 leading-relaxed">
                                  জরুরি স্বাস্থ্য সমস্যা, প্রেসক্রিপশন রিভিউ, বিশেষজ্ঞ চিকিৎসকের দ্বিতীয় মতামত কিংবা প্রাথমিক চিকিৎসার পরামর্শ নিন সরাসরি অনলাইন লাইভ কনসালটেশনের মাধ্যমে।
                                </p>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 space-y-1">
                                  <div className="flex items-center gap-2 font-black text-xs text-amber-300">
                                    <span>💵</span> সাধারণ রোগীর ভিজিট ফি:
                                  </div>
                                  <p className="text-lg font-black text-white">৳২০০ টাকা / ভিজিট</p>
                                  <p className="text-[10px] text-red-100 font-bold">বিকাশ বা নগদ একাউন্টে পেমেন্ট করে তাৎক্ষণিক কলে যুক্ত হন।</p>
                                </div>

                                <div className="bg-emerald-500/20 backdrop-blur-md p-4 rounded-2xl border border-emerald-400/30 space-y-1">
                                  <div className="flex items-center gap-2 font-black text-xs text-emerald-300">
                                    <span>⭐</span> সাবস্ক্রিপশন কার্ডধারী সুবিধা:
                                  </div>
                                  <p className="text-lg font-black text-emerald-300">১০০% ফ্রি (৳০ ভিজিট চার্জ)</p>
                                  <p className="text-[10px] text-emerald-100 font-bold">সাবস্ক্রিপশন থাকলে কোনো ফি দেখাবে না, আনলিমিটেড ফ্রি ডাক্তার + ৩০% ল্যাব টেস্ট ডিসকাউন্ট!</p>
                                </div>
                              </div>

                              <div className="pt-2 flex flex-wrap gap-3">
                                <button
                                  onClick={() => {
                                    setLiveDoctorSelectedDoc(null);
                                    setShowLiveDoctorModal(true);
                                  }}
                                  className="px-6 py-3.5 bg-white text-rose-700 hover:bg-rose-50 font-black text-xs rounded-2xl shadow-xl active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                                >
                                  <Video size={16} className="text-rose-600" />
                                  <span>তাৎক্ষণিক লাইভ ডক্টর কল শুরু করুন</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setHomeSubCategory('subscriptions');
                                    const subTarget = document.getElementById('subscription-section');
                                    if (subTarget) subTarget.scrollIntoView({ behavior: 'smooth' });
                                  }}
                                  className="px-5 py-3.5 bg-white/20 hover:bg-white/30 text-white font-black text-xs rounded-2xl border border-white/30 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                                >
                                  <span>💳 সাবস্ক্রিপশন কার্ড নিন (ফ্রি ডক্টর)</span>
                                </button>
                              </div>
                            </div>

                            {/* Available Doctors for Live Consultation */}
                            {(() => {
                              const liveDocs = doctors.filter(d => Boolean(d.isVideoConsultant));
                              return (
                                <div className="space-y-4">
                                  <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs">
                                    <div>
                                      <h4 className="font-black text-sm text-slate-800 flex items-center gap-2">
                                        <span>🔴</span> লাইভ কনসালটেশনের জন্য নিবন্ধিত বিশেষজ্ঞ চিকিৎসকমণ্ডলী ({liveDocs.length} জন)
                                      </h4>
                                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                                        যেসব ডক্টর লাইভ ভিডিও কনসালটেশনে নিবন্ধিত, শুধুমাত্র তাদের তালিকা এখানে প্রদর্শিত হচ্ছে।
                                      </p>
                                    </div>
                                  </div>

                                  {liveDocs.length === 0 ? (
                                    <div className="bg-white p-8 rounded-3xl border border-slate-100 text-center space-y-2">
                                      <div className="text-3xl">👨‍⚕️</div>
                                      <h4 className="font-black text-sm text-slate-700">বর্তমানে কোনো লাইভ ডক্টর তালিকাভুক্ত নেই</h4>
                                      <p className="text-xs text-slate-400 font-medium">এডমিন প্যানেলে ডাক্তারের প্রোফাইলে "লাইভ ডক্টর" অপশন চালু করলে এখানে প্রদর্শিত হবে।</p>
                                    </div>
                                  ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {liveDocs.map(d => (
                                        <Card key={d.id} className="p-5 border-l-4 border-l-rose-600 flex items-start gap-4 hover:shadow-lg transition-all text-left relative">
                                          <div className="relative shrink-0">
                                            <img src={d.image} className="w-20 h-24 rounded-2xl object-cover border bg-slate-50 shadow-sm" alt={d.name} />
                                            <div className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white rounded-full p-1 shadow-md animate-pulse" title="নিবন্ধিত লাইভ ডক্টর">
                                              <Video size={10} />
                                            </div>
                                          </div>
                                          <div className="flex-1 space-y-1">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                              <h4 className="font-black text-[15px] text-slate-800 leading-tight">{d.name}</h4>
                                              <span className="bg-rose-50 text-rose-600 border border-rose-200 text-[8px] font-black px-1.5 py-0.5 rounded-full inline-flex items-center gap-1 animate-pulse shadow-2xs">
                                                🔴 লাইভ ডক্টর
                                              </span>
                                            </div>
                                            <p className="text-[10px] text-rose-600 font-black uppercase tracking-wider">{d.specialty}</p>
                                            <p className="text-[9px] text-slate-400 font-bold leading-tight line-clamp-2 italic">{d.degree}</p>
                                            
                                            <div className="pt-2 border-t border-slate-100 mt-2 space-y-1">
                                              <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-500 uppercase">
                                                <Clock size={10} className="text-rose-500" /> {d.schedule}
                                              </div>
                                              <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-600">
                                                <ShieldCheck size={10} /> অনলাইন ভিডিও/অডিও লাইভ সাপোর্ট
                                              </div>
                                            </div>

                                            <div className="pt-2 flex items-center gap-2">
                                              <button
                                                onClick={() => {
                                                  setLiveDoctorSelectedDoc(d);
                                                  setShowLiveDoctorModal(true);
                                                }}
                                                className="px-3.5 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-black text-[10px] rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer animate-pulse"
                                              >
                                                <Video size={12} /> লাইভ ভিডিও কল
                                              </button>
                                              <button
                                                onClick={() => {
                                                  setBookingDoctor(d);
                                                  setShowSerialModal(true);
                                                }}
                                                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[10px] rounded-xl active:scale-95 transition-all cursor-pointer"
                                              >
                                                চেম্বারে সিরিয়াল
                                              </button>
                                            </div>
                                          </div>
                                        </Card>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                         </div>
                       )}

                       {homeSubCategory === 'dental' && (
                         <div className="space-y-6">
                            {/* Dental Banner Header */}
                            <div className="bg-gradient-to-r from-teal-700 via-emerald-700 to-cyan-800 text-white p-6 rounded-3xl shadow-xl space-y-3 relative overflow-hidden">
                              <div className="absolute right-3 -bottom-4 opacity-15 text-white pointer-events-none">
                                <span className="text-8xl">🦷</span>
                              </div>
                              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white border border-white/20">
                                <span>🦷</span> ডেন্টাল ও দন্তরোগ সেবা ক্যাটাগরি
                              </div>
                              <h3 className="text-xl font-black text-white tracking-tight leading-tight">
                                ডেন্টাল চেম্বার ও দন্তরোগ বিশেষজ্ঞ তালিকা
                              </h3>
                              <p className="text-xs font-bold text-teal-100 max-w-xl leading-relaxed">
                                আপনার এলাকার অভিজ্ঞ বি.ডি.এস. ও দন্তরোগ বিশেষজ্ঞ ডক্টর, আধুনিক ডেন্টাল চেম্বারের ঠিকানা, বসার সময় এবং সরাসরি সিরিয়াল বুকিং সুবিধা।
                              </p>
                            </div>

                            {/* Location Filter Bar */}
                            <div className="space-y-1.5">
                               <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-500 tracking-wider px-1">
                                 <span className="flex items-center gap-1">
                                   <MapPin size={12} className="text-emerald-600" /> এলাকা অনুযায়ী ডেন্টাল চেম্বার খুঁজুন:
                                 </span>
                                 {selectedLocation && (
                                   <button 
                                     onClick={() => setSelectedLocation(null)} 
                                     className="text-blue-600 hover:underline text-[9px] font-bold"
                                   >
                                     সকল এলাকা দেখুন
                                   </button>
                                 )}
                               </div>
                               <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                                   {[
                                     { id: 'all', label: 'সকল এলাকা' },
                                     { id: 'নীলফামারী', label: 'নীলফামারী' },
                                     { id: 'সৈয়দপুর', label: 'সৈয়দপুর' },
                                     { id: 'ডোমার', label: 'ডোমার' },
                                     { id: 'ডিমলা', label: 'ডিমলা' },
                                     { id: 'জলঢাকা', label: 'জলঢাকা' },
                                     { id: 'কিশোরগঞ্জ', label: 'কিশোরগঞ্জ' },
                                     { id: 'রংপুর', label: 'রংপুর' },
                                   ].map(loc => {
                                     const isSelected = loc.id === 'all' ? selectedLocation === null : selectedLocation === loc.id;
                                     return (
                                       <button
                                         key={loc.id}
                                         onClick={() => setSelectedLocation(loc.id === 'all' ? null : (selectedLocation === loc.id ? null : loc.id))}
                                         className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black tracking-tight whitespace-nowrap transition-all border-2 flex items-center gap-1 ${
                                           isSelected 
                                             ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100 scale-105' 
                                             : 'bg-white text-slate-700 border-slate-100 hover:border-slate-300'
                                         }`}
                                       >
                                         <span>📍</span>
                                         {loc.label}
                                       </button>
                                     );
                                   })}
                               </div>
                            </div>

                            {/* List of Dental Doctors / Chambers */}
                            {(() => {
                              const dentalDocs = doctors.filter(d => {
                                const spec = (d.specialty || '').toLowerCase();
                                const deg = (d.degree || '').toLowerCase();
                                const name = (d.name || '').toLowerCase();
                                const isDental = spec.includes('dent') || spec.includes('দন্ত') || spec.includes('ডেন্টাল') || deg.includes('বি.ডি.এস') || deg.includes('দন্ত') || deg.includes('ডেন্টাল') || name.includes('ডেন্টাল');
                                if (!isDental) return false;

                                if (selectedLocation) {
                                  const loc = selectedLocation.toLowerCase().trim();
                                  const docDistricts = (d.districts || []).map(dist => dist.toLowerCase());
                                  const docClinics = (d.clinics || []);
                                  const matchesClinicLoc = hospitals.some(h => docClinics.includes(h.id) && (h.district.toLowerCase().includes(loc) || h.address.toLowerCase().includes(loc) || h.name.toLowerCase().includes(loc)));
                                  const matchesDist = docDistricts.some(dist => dist.includes(loc) || loc.includes(dist));
                                  return matchesClinicLoc || matchesDist;
                                }
                                return true;
                              });

                              if (dentalDocs.length === 0) {
                                return (
                                  <Card className="p-8 text-center space-y-4 border-2 border-amber-100 bg-amber-50/50 rounded-3xl">
                                    <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-2xl mx-auto shadow-sm">
                                      📍
                                    </div>
                                    <div className="space-y-1.5">
                                      <h4 className="font-black text-sm text-slate-800">
                                        {selectedLocation ? `"${selectedLocation}" এলাকায় আপাতত কোনো সক্রিয় ডেন্টাল চেম্বারের তথ্য পাওয়া যায়নি` : 'কোনো ডেন্টাল ডক্টর পাওয়া যায়নি'}
                                      </h4>
                                      <p className="text-xs font-bold text-slate-500 max-w-md mx-auto leading-relaxed">
                                        বর্তমানে নীলফামারী সদর উকিলের মোড়ে "ডক্টরস ডেন্টাল" চেম্বারে ডা. মো. হাবিবুর রহমান (হাবীব) প্রতিনিয়ত রোগী দেখছেন। শীঘ্রই {selectedLocation || 'অন্যান্য'} এলাকার ডেন্টাল চেম্বার যুক্ত করা হচ্ছে।
                                      </p>
                                    </div>
                                    {selectedLocation && (
                                      <button
                                        onClick={() => setSelectedLocation('নীলফামারী')}
                                        className="bg-emerald-600 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-md hover:bg-emerald-700 transition-all inline-flex items-center gap-2"
                                      >
                                        <span>📍</span> নীলফামারী সদরের ডেন্টাল চেম্বার দেখুন
                                      </button>
                                    )}
                                  </Card>
                                );
                              }

                              return (
                                <div className="space-y-4">
                                  <div className="flex justify-between items-center bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs">
                                    <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                                      🦷 ডেন্টাল বিশেষজ্ঞ ডক্টর ও চেম্বার তালিকা ({dentalDocs.length} টি)
                                    </span>
                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                                      {selectedLocation ? `ফিল্টার: ${selectedLocation}` : 'সকল এলাকা'}
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {dentalDocs.map(d => {
                                      const chambers = d.clinics.map(cid => hospitals.find(h => h.id === cid)).filter(Boolean);
                                      return (
                                        <Card 
                                          key={d.id} 
                                          onClick={() => navigate(`/doctors/${slugify(d.name)}`)}
                                          className="p-5 border-l-4 border-l-teal-600 hover:border-l-8 hover:shadow-xl transition-all cursor-pointer group relative bg-white rounded-2xl"
                                        >
                                          <div className="flex items-start gap-4">
                                            <div className="relative shrink-0">
                                              <img src={d.image} className="w-20 h-24 rounded-2xl object-cover border bg-slate-50 shadow-sm" alt={d.name} />
                                              <div className="absolute -bottom-2 -right-1 bg-teal-600 text-white p-1 rounded-lg text-xs shadow-md">
                                                🦷
                                              </div>
                                            </div>

                                            <div className="flex-1 space-y-1">
                                              <div className="flex items-center gap-2">
                                                <span className="bg-teal-50 text-teal-700 font-black text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wider border border-teal-200/50">
                                                  দন্তরোগ বিশেষজ্ঞ
                                                </span>
                                                {d.availableToday && (
                                                  <span className="bg-emerald-100 text-emerald-800 font-black text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                    আজ চেম্বার খোলা
                                                  </span>
                                                )}
                                              </div>

                                              <h4 className="font-black text-base text-slate-900 leading-tight group-hover:text-teal-600 transition-colors">
                                                {d.name}
                                              </h4>
                                              <p className="text-[10px] font-bold text-slate-600 leading-relaxed bg-slate-50 p-2 rounded-xl border border-slate-100">
                                                {d.degree}
                                              </p>

                                              {chambers.map(c => (
                                                <div key={c?.id} className="pt-2 mt-2 border-t border-slate-100 space-y-1">
                                                  <div className="flex items-start gap-1.5 text-[10px] font-black text-slate-800">
                                                    <Building size={12} className="text-teal-600 shrink-0 mt-0.5" />
                                                    <span>চেম্বার: <span className="text-teal-700">{c?.name}</span></span>
                                                  </div>
                                                  <div className="flex items-start gap-1.5 text-[10px] font-bold text-slate-500">
                                                    <MapPin size={12} className="text-emerald-600 shrink-0 mt-0.5" />
                                                    <span>{c?.address}</span>
                                                  </div>
                                                </div>
                                              ))}

                                              <div className="flex items-center gap-1.5 text-[10px] font-black text-rose-600 pt-1">
                                                <Clock size={12} className="shrink-0" />
                                                <span>সময়সূচী: {d.schedule}</span>
                                              </div>
                                            </div>
                                          </div>

                                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                                            <a 
                                              href={`tel:${HOTLINE_CONTACT}`}
                                              onClick={(e) => e.stopPropagation()}
                                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight flex items-center gap-1.5 transition-all"
                                            >
                                              <Phone size={12} /> কল করুন
                                            </a>
                                            <button 
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setBookingDoctor(d);
                                                setShowSerialModal(true);
                                              }}
                                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight shadow-md shadow-emerald-100 flex items-center gap-1.5 active:scale-95 transition-all"
                                            >
                                              <MessageSquare size={12} /> সিরিয়াল বুকিং দিন
                                            </button>
                                          </div>
                                        </Card>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })()}
                         </div>
                       )}

                       {homeSubCategory === 'subscriptions' && (
                         <div className="space-y-6">
                           <SubscriptionSection 
                             profile={profile} 
                             whatsappNumber={WHATSAPP_NUMBER} 
                             onOpenAuth={() => setShowAuthModal(true)} 
                           />
                         </div>
                       )}

                       {homeSubCategory === 'free_doctors' && (
                         <div className="space-y-6">
                           <FreeDoctorClaimSection profile={profile} whatsappNumber={WHATSAPP_NUMBER} />
                         </div>
                       )}

                       {homeSubCategory === 'maternity_donation' && (
                         <div className="space-y-6">
                           <MaternityDonationSection 
                             profile={profile} 
                             whatsappNumber={WHATSAPP_NUMBER}
                             onOpenDoctorBooking={() => {
                               setHomeSubCategory('doctors');
                               setSelectedSpecialty('Gynae & Obs');
                             }}
                             onNavigateToDonation={() => setHomeSubCategory('donation')}
                           />
                         </div>
                       )}

                       {homeSubCategory === 'donation' && (
                         <div className="space-y-6">
                           <DonationPortalSection 
                             profile={profile}
                             isAdmin={isAdmin}
                             whatsappNumber={WHATSAPP_NUMBER}
                             onNavigateToMaternity={() => setHomeSubCategory('maternity_donation')}
                             onNavigateToDoctors={() => setHomeSubCategory('doctors')}
                           />
                         </div>
                       )}

                       {homeSubCategory === 'blood_donation' && (
                         <div className="space-y-6">
                           <BloodDonationSection 
                             profile={profile}
                             isAdmin={isAdmin}
                             whatsappNumber={WHATSAPP_NUMBER}
                             onOpenAuth={() => setShowAuthModal(true)}
                           />
                         </div>
                       )}

                       {(homeSubCategory === 'buy_medicine' || homeSubCategory === 'medical_accessories') && (
                         <BuyMedicineSection 
                           user={user}
                           profile={profile}
                           db={db}
                           onOpenAuth={() => setShowAuthModal(true)}
                           initialCategory={homeSubCategory === 'medical_accessories' ? 'equipment' : 'all'}
                         />
                       )}

                       {homeSubCategory === 'hospitals' && (
                         <div className="space-y-4">
                            {/* Promotional Demo Doctor Profile Banner & Ad Placement Notice */}
                            <DoctorProfileAdBannerCard 
                              hotline={HOTLINE_CONTACT}
                              whatsappNumber={WHATSAPP_NUMBER}
                            />
                            {/* Location Filter Bar for Hospitals */}
                            <div className="space-y-1.5">
                               <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-500 tracking-wider px-1">
                                 <span className="flex items-center gap-1">
                                   <MapPin size={12} className="text-emerald-600" /> এলাকা নির্বাচন করুন:
                                 </span>
                                 {selectedLocation && (
                                   <button 
                                     onClick={() => setSelectedLocation(null)} 
                                     className="text-blue-600 hover:underline text-[9px] font-bold"
                                   >
                                     সকল এলাকা দেখুন
                                   </button>
                                 )}
                               </div>
                               <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                                   {[
                                     { id: 'all', label: 'সকল এলাকা' },
                                     { id: 'রংপুর', label: 'রংপুর' },
                                     { id: 'নীলফামারী', label: 'নীলফামারী' },
                                     { id: 'সৈয়দপুর', label: 'সৈয়দপুর' },
                                     { id: 'ডোমার', label: 'ডোমার' },
                                     { id: 'ডিমলা', label: 'ডিমলা' },
                                     { id: 'জলঢাকা', label: 'জলঢাকা' },
                                     { id: 'কিশোরগঞ্জ', label: 'কিশোরগঞ্জ' },
                                     { id: 'দেবিগঞ্জ', label: 'দেবিগঞ্জ' },
                                   ].map(loc => {
                                     const isSelected = loc.id === 'all' ? selectedLocation === null : selectedLocation === loc.id;
                                     return (
                                       <button
                                         key={loc.id}
                                         onClick={() => setSelectedLocation(loc.id === 'all' ? null : (selectedLocation === loc.id ? null : loc.id))}
                                         className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black tracking-tight whitespace-nowrap transition-all border-2 flex items-center gap-1 ${
                                           isSelected 
                                             ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100 scale-105' 
                                             : 'bg-white text-slate-700 border-slate-100 hover:border-slate-300'
                                         }`}
                                       >
                                         <span>📍</span>
                                         {loc.label}
                                       </button>
                                     );
                                   })}
                               </div>
                            </div>

                            {filteredHospitals.length === 0 ? (
                              <Card className="p-8 text-center text-slate-400 font-bold text-xs">
                                এই এলাকায় কোনো হাসপাতাল বা ক্লিনিক পাওয়া যায়নি।
                              </Card>
                            ) : (
                              filteredHospitals.map(c => (
                               <Card key={c.id} className="p-0 overflow-hidden relative cursor-pointer group shadow-lg" onClick={() => { 
                                 setSelectedHospitalId(c.id); 
                                 setHomeSubCategory('doctors'); 
                                 setSearchTerm('');
                                 setSelectedSpecialty(null);
                                 setSelectedDay(null);
                               }}>
                                  <img src={c.image} className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500" alt={c.name} />
                                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent p-6 text-white">
                                     <div className="flex justify-between items-end">
                                       <div>
                                         <h4 className="font-black text-base uppercase tracking-tight">{c.name}</h4>
                                         <p className="text-[10px] font-bold uppercase opacity-80 mt-1">{c.address}</p>
                                       </div>
                                       <div className="bg-blue-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2">
                                         View Doctors <ArrowRight size={12} />
                                       </div>
                                     </div>
                                  </div>
                                  <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black text-white border border-white/20" onClick={(e) => { e.stopPropagation(); navigate(`/hospitals/${slugify(c.name)}`); }}>
                                    Full Profile
                                  </div>
                               </Card>
                              ))
                            )}
                         </div>
                       )}

                       {homeSubCategory === 'emergency' && (
                         <div className="space-y-6">
                           {/* Emergency Blood Support Quick Action Banner */}
                           <div className="bg-gradient-to-r from-red-600 via-rose-700 to-slate-900 rounded-3xl p-4 sm:p-5 text-white shadow-lg border border-red-400/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
                             <div className="flex items-center gap-3">
                               <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-inner">
                                 🩸
                               </div>
                               <div className="space-y-0.5">
                                 <div className="flex items-center gap-2">
                                   <span className="bg-amber-400 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-md uppercase">জরুরি রক্ত প্রয়োজন?</span>
                                   <span className="text-xs font-black text-white">রক্তদাতা ডিরেক্টরি ও ডোনার লিস্ট</span>
                                 </div>
                                 <p className="text-[11px] text-red-100 font-medium">
                                   A, B, O, AB (+ ও -) সকল গ্রুপের স্বেচ্ছাসেবী রক্তদাতাদের সরাসরি কল করুন।
                                 </p>
                               </div>
                             </div>
                             <button
                               onClick={() => {
                                 setHomeSubCategory('blood_donation');
                                 const el = document.getElementById('blood-donation-section');
                                 if (el) el.scrollIntoView({ behavior: 'smooth' });
                               }}
                               className="px-4 py-2 bg-white hover:bg-rose-50 text-red-700 font-black text-xs rounded-xl shadow-md active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                             >
                               🩸 ব্লাড ডোনেট পোর্টাল খুলুন
                             </button>
                           </div>

                           {/* Dynamic Premium Ambulance Service Calculator & Fixed Routes */}
                           <AmbulanceCalculator
                             hotline={HOTLINE_CONTACT}
                             onAddToCart={(item) => toggleCartItem(item)}
                             onDirectCheckout={(item) => {
                               toggleCartItem(item);
                               setTimeout(startCheckout, 100);
                             }}
                           />

                           {/* Home Nursing Care Services Section */}
                           <HomeNursingCare
                             hotline={HOTLINE_CONTACT}
                             cart={cart}
                             onAddToCart={(item) => toggleCartItem(item)}
                             onDirectCheckout={(item) => {
                               toggleCartItem(item);
                               setTimeout(startCheckout, 100);
                             }}
                           />

                           {/* Emergency Core Services Grid */}
                           <div className="space-y-3">
                             <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                               <span className="w-2 h-2 rounded-full bg-red-600" />
                               জরুরি সার্ভিসসমূহ (Home Health Services)
                             </h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                               {EMERGENCY_SERVICES.map((serv) => {
                                 const inCart = cart.some(i => i.id === serv.id);
                                 return (
                                   <Card 
                                     key={serv.id} 
                                     className={`p-4 border-2 transition-all flex items-center justify-between gap-3 ${inCart ? 'border-red-500 bg-red-50/50' : 'border-slate-100 hover:border-slate-200'}`}
                                   >
                                     <div className="flex items-center gap-3">
                                       <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-sm">
                                         {serv.icon}
                                       </div>
                                       <div>
                                         <h4 className="font-black text-xs text-slate-800">{serv.name}</h4>
                                         <p className="text-[10px] font-bold text-slate-400 mt-0.5">{serv.description}</p>
                                         <p className="text-xs font-black text-red-600 mt-1">৳{serv.price} BDT</p>
                                       </div>
                                     </div>
                                     <button
                                       onClick={() => toggleCartItem({ id: serv.id, name: serv.name, price: serv.price, type: 'emergency' })}
                                       className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight shrink-0 transition-all ${
                                         inCart 
                                           ? 'bg-red-600 text-white shadow-md' 
                                           : 'bg-slate-100 text-slate-700 hover:bg-red-600 hover:text-white'
                                       }`}
                                     >
                                       {inCart ? 'যোগ হয়েছে ✓' : '+ বুক করুন'}
                                     </button>
                                   </Card>
                                 );
                               })}
                             </div>
                           </div>

                           {/* Oxygen Support Component with 3-day and 6-day duration plans */}
                           <OxygenSupportCard
                             hotline={HOTLINE_CONTACT}
                             cart={cart}
                             onAddToCart={(item) => toggleCartItem(item)}
                             onDirectCheckout={(item) => {
                               toggleCartItem(item);
                               setTimeout(startCheckout, 100);
                             }}
                           />
                         </div>
                       )}

                       {homeSubCategory === 'govt_health' && (
                         <GovtHealthPortal onBackToHome={() => setHomeSubCategory('doctors')} />
                       )}

                       {homeSubCategory === 'labtests' && (
                         <div className="space-y-5 text-left">
                           <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white p-6 rounded-3xl shadow-xl space-y-2 relative overflow-hidden">
                             <div className="absolute right-3 -bottom-4 opacity-15 text-white pointer-events-none">
                               <Microscope size={120} />
                             </div>
                             {!isLabTestsServiceEnabled && (
                               <div className="bg-rose-950/90 text-white p-3.5 rounded-2xl border border-rose-500/50 mb-3 space-y-1 relative z-20 shadow-lg">
                                 <div className="inline-flex items-center gap-1.5 bg-rose-500/30 text-rose-200 border border-rose-400/30 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
                                   <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                                   সার্ভিস নোটিশ (Service Disabled)
                                 </div>
                                 <p className="text-xs font-bold text-rose-100">
                                   🛑 ল্যাব ও ডায়াগনস্টিক টেস্ট সেবা এডমিন প্যানেল থেকে সাময়িকভাবে বন্ধ (OFF) রাখা হয়েছে।
                                 </p>
                               </div>
                             )}
                             <div className="relative z-10">
                               <div className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-md mb-2">
                                 ✨ অনলাইন ল্যাব ও ডায়াগনস্টিক সার্ভিস
                               </div>
                               <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                                 <Microscope size={22} className="text-blue-300" /> প্যাথলজিক্যাল টেস্ট, এক্স-রে ও আল্ট্রাসোনোগ্রাম (USG)
                               </h3>
                               <p className="text-xs font-medium opacity-90 leading-relaxed max-w-xl mt-1">
                                 নির্ভুল প্যাথলজি পরীক্ষা, ডিজিটাল এক্স-রে ও আল্ট্রাসোনোগ্রাম টেস্টের রেট তালিকা দেখুন। সরাসরি পছন্দমত টেস্ট বেছে বুক করুন এবং বিকাশ/নগদে অনলাইনে পরিশোধ করুন।
                               </p>
                               <div className="mt-3 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 text-xs text-blue-50 font-medium space-y-1">
                                 <div className="flex items-center gap-1.5 font-black text-amber-300">
                                   <span>🏥</span>
                                   <span>হাসপাতাল চয়েস ও রিপোর্ট ডেলিভারি নোটিশ:</span>
                                 </div>
                                 <p className="text-[11px] leading-relaxed text-blue-100">
                                   টেস্ট অর্ডার করার সময় আপনার পছন্দের হাসপাতাল সিলেক্ট করতে পারবেন। <span className="font-bold text-amber-200">পপুলার ডায়াগনস্টিক সেন্টার (রংপুর)</span> অথবা <span className="font-bold text-amber-200">ঢাকা প্রাভা হেলথ কেয়ার (ঢাকা)</span> থেকে রিপোর্ট করাতে ৩ থেকে ৫ দিন সময় লাগবে।
                                 </p>
                               </div>
                             </div>
                           </div>

                           {/* Category Filter Pills */}
                           <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                             {[
                               { id: 'all', label: '📋 সকল টেস্ট' },
                               { id: 'Pathology', label: '🧪 প্যাথলজি ও রক্ত' },
                               { id: 'X-Ray', label: '🩻 ডিজিটাল এক্স-রে' },
                               { id: 'Ultrasonogram', label: '🖥️ আল্ট্রাসোনোগ্রাম (USG)' },
                               { id: 'ECG & Echo', label: '💓 ইসিজি ও ইকো' },
                             ].map(cat => (
                               <button
                                 key={cat.id}
                                 onClick={() => setSelectedTestCategory(cat.id)}
                                 className={`px-4 py-2 rounded-2xl text-xs font-black shrink-0 transition-all active:scale-95 flex items-center gap-1.5 ${
                                   selectedTestCategory === cat.id
                                     ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                                     : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                 }`}
                               >
                                 {cat.label}
                               </button>
                             ))}
                           </div>

                           {filteredLabTests.length === 0 ? (
                             <Card className="p-10 text-center text-slate-400 font-bold text-xs space-y-2">
                               <div className="text-3xl">🔬</div>
                               <p>এই ক্যাটাগরিতে কোনো টেস্ট পাওয়া যায়নি।</p>
                             </Card>
                           ) : (
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                               {filteredLabTests.map(t => {
                                 const inCart = cart.some(i => i.id === t.id);
                                 const finalPrice = t.discountPrice || t.price;
                                 const hasDiscount = !!t.discountPrice && t.discountPrice < t.price;
                                 const isTestActive = t.isActive !== false && isLabTestsServiceEnabled;
                                 const categoryLabel = 
                                   t.category === 'X-Ray' ? '🩻 ডিজিটাল এক্স-রে' :
                                   t.category === 'Ultrasonogram' ? '🖥️ আল্ট্রাসোনোগ্রাম (USG)' :
                                   t.category === 'ECG & Echo' ? '💓 ইসিজি ও ইকো' : '🧪 প্যাথলজি';

                                 return (
                                   <Card key={t.id} className={`p-4 border transition-all flex flex-col justify-between space-y-3 ${
                                     isTestActive ? 'border-slate-100 hover:border-blue-200 hover:shadow-md' : 'border-rose-100 bg-rose-50/20'
                                   }`}>
                                     <div className="space-y-1.5">
                                       <div className="flex items-center justify-between gap-2">
                                         <span className="text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                                           {categoryLabel}
                                         </span>
                                         <div className="flex items-center gap-1.5">
                                           {t.isActive === false && (
                                             <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                                               🔴 বন্ধ (OFF)
                                             </span>
                                           )}
                                           {hasDiscount && (
                                             <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                               ৳{t.price - t.discountPrice!} ছাড়!
                                             </span>
                                           )}
                                         </div>
                                       </div>

                                       <h4 className="font-black text-sm text-slate-800 leading-snug">{t.name}</h4>
                                       <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                                         🏥 {t.hospital_name || 'JB Diagnostic & Consultation Center'}
                                       </p>
                                       {t.description && (
                                         <p className="text-[10px] font-medium text-slate-400 italic bg-slate-50 p-2 rounded-xl border border-slate-100/80">
                                           ℹ️ {t.description}
                                         </p>
                                       )}
                                     </div>

                                     <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                                       <div>
                                         <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">টেস্ট ফি:</p>
                                         <div className="flex items-baseline gap-1.5">
                                           <span className="text-sm font-black text-emerald-600">৳{finalPrice} BDT</span>
                                           {hasDiscount && (
                                             <span className="text-xs text-slate-400 line-through font-bold">৳{t.price}</span>
                                           )}
                                         </div>
                                       </div>

                                       <div className="flex items-center gap-1.5">
                                         <button
                                           type="button"
                                           disabled={!isTestActive}
                                           onClick={() => toggleCartItem({ id: t.id, name: t.name, price: finalPrice, type: 'test' })}
                                           className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                                             !isTestActive
                                               ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                               : inCart ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                           }`}
                                         >
                                           {!isTestActive ? 'বন্ধ রয়েছে' : inCart ? 'কার্টে আছে ✓' : '+ কার্টে যোগ'}
                                         </button>

                                         <button
                                           type="button"
                                           disabled={!isTestActive}
                                           onClick={() => {
                                             if (!patientName && profile?.full_name) setPatientName(profile.full_name);
                                             if (!contactPhone && profile?.phone) setContactPhone(profile.phone);
                                             setShowPayment({
                                               show: true,
                                               amount: finalPrice,
                                               item: `${t.name}`,
                                               shipping: 0,
                                               isTest: true,
                                               hospitalName: t.hospital_name || 'JB Diagnostic Center'
                                             });
                                           }}
                                           className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-1 ${
                                             !isTestActive
                                               ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                               : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 active:scale-95'
                                           }`}
                                         >
                                           💳 পেমেন্ট সহ বুকিং
                                         </button>
                                       </div>
                                     </div>
                                   </Card>
                                 );
                               })}
                             </div>
                           )}
                         </div>
                       )}

                       {/* Floating Cart Action Bar */}
                       {cart.length > 0 && (
                         <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:w-96 z-40 bg-slate-900 text-white p-4 rounded-3xl shadow-2xl border border-slate-700 flex items-center justify-between animate-in slide-in-from-bottom-5">
                           <div>
                             <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider">
                               বাছাইকৃত আইটেম ({cart.length}টি)
                             </p>
                             <p className="text-base font-black text-emerald-400 mt-0.5">
                               ৳{cart.reduce((s, i) => s + i.price, 0)} BDT
                             </p>
                           </div>
                           <div className="flex items-center gap-2">
                             <button
                               onClick={() => setCart([])}
                               className="px-3 py-2 bg-slate-800 text-slate-400 hover:text-white rounded-xl text-[10px] font-bold"
                             >
                               রিসেট
                             </button>
                             <button
                               onClick={startCheckout}
                               className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl shadow-lg flex items-center gap-1.5 active:scale-95 transition-all"
                             >
                               চেকআউট করুন <ArrowRight size={14} />
                             </button>
                           </div>
                         </div>
                       )}
                    </div>
                  </div>
                )}

                {activeTab === 'profile' && (
                  <div className="animate-in slide-in-from-bottom-5 space-y-6">
                    {/* Top Logout Toolbar & Header View */}
                    <div className="flex justify-between items-center bg-rose-50 border border-rose-100 p-3 px-5 rounded-2xl">
                      <p className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                        <span>👤</span> আপনার প্রোফাইল নিয়ন্ত্রণ প্যানেল
                      </p>
                      <button
                        onClick={logout}
                        className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                        title="সহজে লগ আউট করুন"
                      >
                        <LogOut size={14} />
                        <span>লগ আউট (Logout)</span>
                      </button>
                    </div>

                    {/* Profile Header View */}
                    <Card className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-6 sm:p-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-none text-left shadow-sm">
                       <div className="w-16 h-16 bg-blue-600 rounded-[22px] flex items-center justify-center text-white text-3xl font-black shrink-0 shadow-md">
                         {profile?.full_name?.[0] || '👤'}
                       </div>
                       <div className="flex-1 w-full space-y-1">
                          <div className="flex items-center justify-between sm:justify-start gap-2.5 flex-wrap">
                            <h4 className="font-black text-xl text-slate-800 tracking-tight">{profile?.full_name}</h4>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setShowQuizModal(true)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-black text-[11px] rounded-full shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer border border-purple-300/40"
                                title="ডেইলি ইউটিউব কুইজ প্রতিযোগিতা এন্ট্রি বা সাবমিট করুন"
                              >
                                <span className="text-sm">📺</span>
                                <span>কুইজ এন্ট্রি / সাবমিট</span>
                                {allQuizzes.length > 0 && (
                                  <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full animate-pulse ml-0.5">
                                    {allQuizzes.length}
                                  </span>
                                )}
                              </button>
                            </div>
                          </div>
                          <p className="text-[10px] text-blue-600 uppercase font-black tracking-widest opacity-70">
                            {profile?.role === UserRole.RURAL_DOCTOR ? 'পল্লী চিকিৎসক (Rural Doctor)' : profile?.role || 'পেশেন্ট'}
                          </p>
                          {profile?.phone && <p className="text-[11px] text-slate-500 font-bold mt-0.5">📱 {profile.phone}</p>}
                       </div>
                    </Card>

                    {/* Subscription (30% Test Discount & Free Doctor Card) in User Profile */}
                    <div id="subscription-section" className="scroll-mt-20">
                      <SubscriptionSection 
                        profile={profile} 
                        whatsappNumber={WHATSAPP_NUMBER} 
                        onOpenAuth={() => setShowAuthModal(true)} 
                      />
                    </div>

                    {/* Free Doctor & Test Discount Claim Section (In User Profile) */}
                    <div id="free-doctor-claim-section" className="scroll-mt-20">
                      <FreeDoctorClaimSection profile={profile} whatsappNumber={WHATSAPP_NUMBER} />
                    </div>

                    {/* Maternity Donation Section (In User Profile) */}
                    <div id="maternity-donation-section" className="scroll-mt-20">
                      <MaternityDonationSection profile={profile} whatsappNumber={WHATSAPP_NUMBER} />
                    </div>

                    {/* Financial Visibility Card (Wallet & Quiz Earnings) */}
                    {(() => {
                      const userQuizSubmissions = allSubmissions.filter(sub => sub.user_id === profile?.id || (user?.uid && sub.user_id === user.uid));
                      const quizWinningsTotal = userQuizSubmissions.filter(sub => sub.status === 'correct').reduce((acc, curr) => acc + (curr.prize_amount || 50), 0);
                      const correctQuizCount = userQuizSubmissions.filter(sub => sub.status === 'correct').length;

                      return (
                        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 text-white p-6 sm:p-7 rounded-[32px] shadow-xl border border-slate-800 space-y-5 text-left">
                          <div className="flex justify-between items-center border-b border-white/10 pb-4">
                            <div>
                              <span className="bg-amber-400 text-slate-900 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-1 inline-block">
                                💰 আমার ওয়ালেট ও কুইজ ইনকাম
                              </span>
                              <h3 className="font-black text-base tracking-tight text-white flex items-center gap-2">
                                💳 বর্তমান ব্যালেন্স ও অর্জিত ক্যাশ
                              </h3>
                            </div>
                            <button
                              onClick={() => {
                                const target = document.getElementById('withdraw-section');
                                if (target) target.scrollIntoView({ behavior: 'smooth' });
                              }}
                              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg active:scale-95 transition-all cursor-pointer"
                            >
                              ৳ ক্যাশআউট করুন
                            </button>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center">
                              <p className="text-[9px] font-black uppercase tracking-wider text-purple-200">মোট ব্যালেন্স</p>
                              <p className="text-xl font-black text-emerald-400 mt-1">৳{profile?.taka_balance || 0} BDT</p>
                              <p className="text-[8px] text-slate-300 font-bold mt-0.5">({profile?.reward_points || 0} পয়েন্ট)</p>
                            </div>

                            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center">
                              <p className="text-[9px] font-black uppercase tracking-wider text-amber-200">কুইজ থেকে আয়</p>
                              <p className="text-xl font-black text-amber-300 mt-1">৳{quizWinningsTotal} BDT</p>
                              <p className="text-[8px] text-slate-300 font-bold mt-0.5">অর্জিত ক্যাশ প্রাইজ</p>
                            </div>

                            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center">
                              <p className="text-[9px] font-black uppercase tracking-wider text-blue-200">মোট কুইজ এন্ট্রি</p>
                              <p className="text-xl font-black text-blue-300 mt-1">{userQuizSubmissions.length} টি</p>
                              <p className="text-[8px] text-slate-300 font-bold mt-0.5">অংশগ্রহণ সংখ্যা</p>
                            </div>

                            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center">
                              <p className="text-[9px] font-black uppercase tracking-wider text-emerald-200">বিজয়ী কুইজ</p>
                              <p className="text-xl font-black text-emerald-300 mt-1">{correctQuizCount} টি</p>
                              <p className="text-[8px] text-slate-300 font-bold mt-0.5">সঠিক উত্তর দেওয়া</p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* YouTube Quiz competition section - FIRST AT TOP OF PROFILE */}
                    <div id="youtube-quiz-section" className="bg-gradient-to-br from-purple-50/90 via-indigo-50/40 to-white rounded-[32px] p-6 border-2 border-purple-200/80 shadow-xl space-y-6 text-left">
                      <div className="flex justify-between items-center border-b border-purple-100 pb-4">
                        <div>
                          <span className="bg-purple-600 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-1 inline-block">
                            ★ ডেইলি ইউটিউব প্রতিযোগিতা
                          </span>
                          <h3 className="font-black text-base text-slate-800 tracking-tight flex items-center gap-2">
                            📺 ডেইলি ইউটিউব কুইজ প্রতিযোগিতা
                          </h3>
                          <p className="text-[10px] text-slate-500 font-bold mt-0.5">আমাদের ভিডিও দেখে সঠিক উত্তর ও আপলোড ডেট দিন এবং জিতে নিন আকর্ষণীয় নগদ ক্যাশ!</p>
                        </div>
                        <button
                          onClick={() => setShowQuizModal(true)}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-[11px] rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
                        >
                          <span>এন্ট্রি ফর্ম</span>
                        </button>
                      </div>

                      {allQuizzes.length === 0 ? (
                        <div className="py-6 text-center bg-white/70 rounded-2xl border border-purple-100">
                          <p className="text-[11px] text-slate-400 font-bold uppercase italic">আজকের কোনো নতুন কুইজ এন্ট্রি পাওয়া যায়নি। শীঘ্রই যুক্ত হবে!</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {allQuizzes.map((quiz) => {
                            const submission = allSubmissions.find(sub => sub.quiz_id === quiz.id && sub.user_id === profile?.id);
                            return (
                              <QuizCardItem 
                                key={quiz.id}
                                quiz={quiz}
                                submission={submission}
                                userPhone={profile?.phone || ''}
                                onSubmitQuiz={handleQuizSubmit}
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Address display card */}
                    {(profile?.district || profile?.upazila || profile?.union || profile?.village) && (
                      <Card className="p-5 bg-slate-50 border border-slate-100 text-left space-y-2">
                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">📍 নিবন্ধিত ঠিকানা (Registered Address)</h4>
                        <div className="text-xs font-bold text-slate-700 space-y-1.5">
                          <p>জেলা (District): <span className="text-slate-900 font-extrabold">{profile.district || 'উল্লেখ নেই'}</span></p>
                          <p>উপজেলা (Upazila): <span className="text-slate-900 font-extrabold">{profile.upazila || 'উল্লেখ নেই'}</span></p>
                          <p>ইউনিয়ন (Union): <span className="text-slate-900 font-extrabold">{profile.union || 'উল্লেখ নেই'}</span></p>
                          <p>গ্রাম/পাড়া/মহল্লা (Village/Para): <span className="text-slate-900 font-extrabold">{profile.village || 'উল্লেখ নেই'}</span></p>
                        </div>
                      </Card>
                    )}

                    {/* Reward & Payout Engine */}
                    <div id="withdraw-section" className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-xl space-y-6 text-left">
                      <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                        <div>
                          <h3 className="font-black text-sm text-slate-800 tracking-tight">🌟 রেফারেল রিওয়ার্ড ও ক্যাশআউট</h3>
                          <p className="text-[10px] text-slate-400 font-bold">শেয়ার করুন ও রিওয়ার্ড পয়েন্ট কনভার্ট করে টাকা তুলুন।</p>
                        </div>
                        <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-2.5 py-1 rounded-full uppercase">
                          ৳১ টাকা = ৪ পয়েন্ট
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">রিওয়ার্ড পয়েন্ট</p>
                          <p className="text-xl font-black text-indigo-600 mt-1">{profile?.reward_points || 0} Pt</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">কনভার্টকৃত ব্যালেন্স</p>
                          <p className="text-xl font-black text-emerald-600 mt-1">৳{profile?.taka_balance || 0} BDT</p>
                        </div>
                      </div>

                      {/* Convert points section */}
                      <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/30 space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-extrabold text-slate-700">টাকায় রূপান্তর (BDT Convert)</span>
                          <span className="font-bold text-[10px] text-indigo-600">১০০ পয়েন্ট = ৫০ টাকা</span>
                        </div>
                        
                        {(profile?.reward_points || 0) >= 100 ? (
                          <button
                            onClick={handleConvertRewards}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-indigo-500/15 active:scale-95 transition-all text-center"
                          >
                            কনভার্ট করুন (৫০ টাকা দাবি করুন)
                          </button>
                        ) : (
                          <div className="space-y-2">
                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-indigo-600 h-full transition-all duration-500" 
                                style={{ width: `${Math.min(100, ((profile?.reward_points || 0) / 100) * 100)}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-slate-500 font-bold text-center">
                              আর {100 - (profile?.reward_points || 0)} পয়েন্ট হলেই ৫০ টাকা কনভার্ট করতে পারবেন (বর্তমানে: {profile?.reward_points || 0}/১০০)
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Cash Withdrawal Section */}
                      <div className="bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100/50 space-y-4">
                        <h4 className="text-xs font-extrabold text-emerald-950 flex items-center gap-1.5">
                          💸 ক্যাশআউট রিকোয়েস্ট (bKash / Nagad)
                        </h4>
                        
                        {(profile?.taka_balance || 0) >= 50 ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => setWithdrawMethod('bkash')}
                                className={`py-2 px-3 rounded-xl text-[11px] font-black uppercase tracking-wider border transition-all text-center ${
                                  withdrawMethod === 'bkash' 
                                    ? 'bg-pink-600 border-pink-600 text-white shadow-md' 
                                    : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
                                }`}
                              >
                                bKash
                              </button>
                              <button
                                onClick={() => setWithdrawMethod('nagad')}
                                className={`py-2 px-3 rounded-xl text-[11px] font-black uppercase tracking-wider border transition-all text-center ${
                                  withdrawMethod === 'nagad' 
                                    ? 'bg-orange-600 border-orange-600 text-white shadow-md' 
                                    : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
                                }`}
                              >
                                Nagad
                              </button>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase text-slate-400">একাউন্ট নম্বর (Personal)</label>
                              <input 
                                type="tel" 
                                placeholder="যেমন: ০১৭XXXXXXXX"
                                value={withdrawAccount}
                                onChange={(e) => setWithdrawAccount(e.target.value)}
                                className="w-full bg-white p-3 rounded-xl border border-slate-100 text-xs font-bold outline-none text-slate-800"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase text-slate-400">উত্তোলনের পরিমাণ (BDT)</label>
                              <input 
                                type="number" 
                                placeholder={`সর্বোচ্চ ৳${profile?.taka_balance}`}
                                value={withdrawAmount}
                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                className="w-full bg-white p-3 rounded-xl border border-slate-100 text-xs font-bold outline-none text-slate-800"
                              />
                            </div>

                            <button
                              onClick={() => {
                                if (!withdrawAccount || !withdrawAmount) {
                                  alert("নম্বর ও টাকা সঠিকভাবে দিন!");
                                  return;
                                }
                                handleWithdraw(withdrawMethod, withdrawAccount, Number(withdrawAmount));
                              }}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-500/10 active:scale-95 transition-all text-center"
                            >
                              টাকা উত্তোলনের আবেদন করুন
                            </button>
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-500 font-bold text-center py-2">
                            মিনিমাম ৫০ টাকা ব্যালেন্স হলে উইথড্র রিকোয়েস্ট সাবমিট করতে পারবেন।
                          </p>
                        )}
                      </div>

                      {/* Share and Referral Code Link generator */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                        <p className="text-xs font-black text-slate-700">🔗 আপনার পার্সোনাল রেফারেল লিংক</p>
                        <p className="text-[10px] text-slate-400 font-bold leading-normal">
                          নিচের লিংকটি কপি করে আপনার বন্ধুদের শেয়ার করুন। তারা রেজিষ্ট্রেশন করলে আপনি পেয়ে যাবেন ২০ রিওয়ার্ড পয়েন্ট!
                        </p>
                        <div className="flex gap-2 items-center bg-white p-2.5 rounded-xl border border-slate-100">
                          <input 
                            type="text" 
                            readOnly 
                            value={`${window.location.origin}?ref=${profile?.referral_code || ''}`}
                            className="bg-transparent text-[10px] font-bold text-slate-500 outline-none flex-1 truncate"
                          />
                          <button
                            onClick={() => {
                              const refUrl = `${window.location.origin}?ref=${profile?.referral_code || ''}`;
                              navigator.clipboard.writeText(refUrl);
                              alert("রেফারেল লিংক কপি করা হয়েছে!");
                            }}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase shrink-0 transition-all"
                          >
                            Copy Link
                          </button>
                        </div>
                      </div>

                      {/* Level Up Reward System Section */}
                      <LevelUpRewardSection
                        referredPatientsCount={referredPatients.length}
                        referredAppointments={referredAppointments}
                        takaBalance={profile?.taka_balance || 0}
                      />
                    </div>

                    {/* Rural Doctor Section */}
                    {profile?.role === UserRole.RURAL_DOCTOR && (
                      <div className="space-y-6 text-left">
                        {/* Stats cards Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-blue-100 p-3 rounded-[20px] text-center flex flex-col justify-center">
                            <p className="text-[8px] font-black text-blue-500 uppercase tracking-wider mb-0.5">রেফারেল কোড</p>
                            <p className="text-sm font-black text-blue-900 tracking-wider uppercase">{profile.referral_code}</p>
                          </div>
                          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 p-3 rounded-[20px] text-center flex flex-col justify-center">
                            <p className="text-[8px] font-black text-indigo-600 uppercase tracking-wider mb-0.5">নিবন্ধিত রোগী</p>
                            <p className="text-sm font-black text-indigo-950">{referredPatients.length} জন</p>
                          </div>
                          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 p-3 rounded-[20px] text-center flex flex-col justify-center">
                            <p className="text-[8px] font-black text-amber-600 uppercase tracking-wider mb-0.5">রোগীর সিরিয়াল</p>
                            <p className="text-sm font-black text-amber-950">{referredAppointments.length} বার</p>
                          </div>
                          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 p-3 rounded-[20px] text-center flex flex-col justify-center">
                            <p className="text-[8px] font-black text-emerald-600 uppercase tracking-wider mb-0.5">ডাক্তার দেখিয়েছেন</p>
                            <p className="text-sm font-black text-emerald-950">
                              {referredAppointments.filter(app => app.status === 'visited').length} জন
                            </p>
                          </div>
                          <div className="bg-gradient-to-br from-rose-50 to-red-50 border border-rose-100 p-3 rounded-[20px] text-center flex flex-col justify-center col-span-2 sm:col-span-1">
                            <p className="text-[8px] font-black text-rose-600 uppercase tracking-wider mb-0.5">আসেননি / রিজেক্ট</p>
                            <p className="text-sm font-black text-rose-950">
                              {referredAppointments.filter(app => app.status === 'absent').length} জন
                            </p>
                          </div>
                        </div>

                        {/* Register patient button triggers logout & register prefills */}
                        <button 
                          onClick={async () => {
                            const rCode = profile.referral_code;
                            await logout();
                            setAuthMode('register');
                            localStorage.setItem('prefilled_referral_code', rCode);
                            setShowAuthModal(true);
                          }}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-3xl font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2 active:scale-95 transition-all text-center"
                        >
                          ➕ নতুন রোগী রেজিষ্ট্রেশন করুন
                        </button>

                        {/* Registered Patients List */}
                        <div className="space-y-4">
                          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest font-extrabold">আপনার নিবন্ধিত রোগী তালিকা ({referredPatients.length})</h3>
                          {referredPatients.length === 0 ? (
                            <p className="text-[10px] text-slate-400 font-extrabold uppercase italic">আপনার কোড ব্যবহার করে রেজিষ্ট্রেশন করা রোগীর সংখ্যা শূন্য।</p>
                          ) : (
                            <div className="space-y-2">
                              {referredPatients.map((p, idx) => (
                                <Card key={p.id || idx} className="bg-white p-4 rounded-2xl flex justify-between items-center border border-slate-100 shadow-sm">
                                  <div>
                                    <h4 className="font-extrabold text-[13px] text-slate-800">{p.full_name}</h4>
                                    <p className="text-[10px] text-slate-500 font-bold">📱 {p.phone}</p>
                                    {p.created_password && (
                                      <p className="text-[10px] text-indigo-600 font-bold mt-1">🔑 পাসওয়ার্ড: <span className="font-mono bg-indigo-50 px-1.5 py-0.5 rounded text-indigo-700">{p.created_password}</span></p>
                                    )}
                                  </div>
                                  <span className="text-[8px] font-black tracking-widest bg-slate-100 text-slate-500 uppercase px-2 py-1 rounded-xl">
                                    নথিভূক্ত
                                  </span>
                                </Card>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Disease/Problem Summary Section */}
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest font-extrabold flex items-center justify-between">
                            <span>কোন কোন রোগের সিরিয়াল দেওয়া হল ({appointmentsByProblem.length})</span>
                            <span className="text-[9px] font-black bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-full uppercase tracking-wider">Disease Analysis</span>
                          </h3>
                          {appointmentsByProblem.length === 0 ? (
                            <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 text-center">
                              <p className="text-[10px] text-slate-400 font-extrabold uppercase italic">কোনো রোগের সিরিয়াল বুকিং পাওয়া যায়নি।</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 gap-3">
                              {appointmentsByProblem.map(({ problem, apps }, idx) => (
                                <Card key={idx} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                                  <div className="flex justify-between items-center bg-indigo-50/50 p-2.5 px-3.5 rounded-xl border border-indigo-100/30">
                                    <div className="flex items-center gap-2">
                                      <span className="text-base">🩺</span>
                                      <span className="font-extrabold text-[12px] text-indigo-950">{problem}</span>
                                    </div>
                                    <span className="bg-indigo-600 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase">
                                      {apps.length} টি সিরিয়াল
                                    </span>
                                  </div>
                                  <div className="space-y-2 pl-1">
                                    {apps.map((app, aIdx) => (
                                      <div key={aIdx} className="text-[10px] text-slate-600 border-t border-slate-50 pt-2 first:border-0 first:pt-0 flex justify-between items-start gap-4">
                                        <div>
                                          <p className="font-extrabold text-slate-900">👤 {app.patient_name} <span className="text-slate-500 font-bold">({app.patient_age ? `${app.patient_age} বছর` : 'বয়স উল্লেখ নেই'})</span></p>
                                          <p className="text-[9px] text-slate-500 font-bold">📱 {app.patient_phone}</p>
                                          <p className="text-[9px] text-blue-600 font-bold mt-0.5">👨‍⚕️ {app.doctor_name} ({app.doctor_specialty})</p>
                                        </div>
                                        <div className="text-right flex flex-col items-end">
                                          <span className="text-[9px] text-indigo-700 bg-indigo-50/80 px-2 py-0.5 rounded-lg font-black">{app.date}</span>
                                          <span className={`text-[8px] font-black mt-1 px-1.5 py-0.5 rounded-md ${
                                            app.status === 'visited'
                                              ? 'bg-emerald-50 text-emerald-700'
                                              : app.status === 'absent'
                                                ? 'bg-rose-50 text-rose-700'
                                                : 'bg-amber-50 text-amber-700'
                                          }`}>
                                            {app.status === 'visited' ? 'দেখা হয়েছে' : app.status === 'absent' ? 'আসেননি' : 'পেন্ডিং'}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </Card>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Referred Patients Appointment Serials list */}
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest font-extrabold flex items-center justify-between">
                            <span>রোগীদের বুক করা সিরিয়ালসমূহ ({referredAppointments.length})</span>
                            <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full uppercase tracking-wider">Serials</span>
                          </h3>
                          {referredAppointments.length === 0 ? (
                            <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 text-center">
                              <p className="text-[10px] text-slate-400 font-extrabold uppercase italic">আপনার কোনো রোগী এখনও সিরিয়াল বুকিং করেনি।</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {referredAppointments.map((app, idx) => (
                                <Card key={app.id || idx} className="border-l-4 border-l-blue-500 bg-white p-4 rounded-2xl space-y-2 text-left shadow-sm animate-in fade-in zoom-in-95 duration-200">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h4 className="font-extrabold text-[12px] text-slate-800 leading-tight">👨‍⚕️ {app.doctor_name}</h4>
                                      <p className="text-[9px] text-blue-600 font-bold uppercase tracking-wider mt-0.5">{app.doctor_specialty}</p>
                                    </div>
                                    <span className={`text-[8px] font-black px-2 py-1 rounded-xl uppercase tracking-wider ${
                                      app.status === 'visited'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                        : app.status === 'absent'
                                          ? 'bg-rose-50 text-rose-700 border border-rose-100'
                                          : 'bg-amber-50 text-amber-700 border border-amber-100'
                                    }`}>
                                      {app.status === 'visited' ? 'ডাক্তার দেখিয়েছেন' : app.status === 'absent' ? 'আসেননি/ক্যান্সেল' : 'পেন্ডিং'}
                                    </span>
                                  </div>
                                  <div className="text-[10px] font-bold text-slate-600 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <p className="text-slate-700 font-semibold">👤 রোগীর নাম: <span className="font-extrabold text-slate-900">{app.patient_name}</span></p>
                                    <p>📱 ফোন নম্বর: <span className="font-mono">{app.patient_phone}</span></p>
                                    <p>📅 দেখানোর তারিখ: {app.date}</p>
                                    {app.problems && <p>🩺 সমস্যা: <span className="font-medium text-slate-500 italic">"{app.problems}"</span></p>}
                                  </div>
                                </Card>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Patient Appointments History Section */}
                    {profile?.role === UserRole.PATIENT && (
                      <div className="space-y-4 text-left">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest font-extrabold">আপনার বুক করা অ্যাপয়েন্টমেন্টসমূহ ({userAppointments.length})</h3>
                        {userAppointments.length === 0 ? (
                          <div className="bg-white p-8 rounded-[32px] border border-slate-100 text-center space-y-2">
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-relaxed">কোনো অ্যাপয়েন্টমেন্ট হিস্ট্রি নেই</p>
                            <p className="text-[9px] text-slate-400 max-w-xs mx-auto">ডাক্তারের তালিকা থেকে সিরিয়াল দিলে তার ইতিহাস এখানে দেখতে পাবেন।</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {userAppointments.map((app) => (
                              <Card key={app.id} className="border-l-4 border-l-emerald-500 bg-white p-5 rounded-3xl space-y-3 text-left shadow-sm">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-extrabold text-sm text-slate-800 leading-tight">{app.doctor_name}</h4>
                                    <p className="text-[9px] text-blue-600 font-bold uppercase tracking-wider mt-0.5">{app.doctor_specialty}</p>
                                  </div>
                                  <span className={`text-[8px] font-black px-2 py-1 rounded-xl uppercase tracking-wider ${
                                    app.status === 'visited'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : app.status === 'absent'
                                        ? 'bg-rose-100 text-rose-800'
                                        : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {app.status === 'visited' ? 'ডাক্তার দেখিয়েছেন' : app.status === 'absent' ? 'আসেননি/ক্যান্সেল' : 'পেন্ডিং'}
                                  </span>
                                </div>
                                <div className="text-[10px] font-bold text-slate-500 space-y-1 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                   <p>📅 তারিখ: {app.date}</p>
                                   <p>👤 রোগী: {app.patient_name} ({app.patient_phone})</p>
                                   {app.problems && <p>🩺 সমস্যা: {app.problems}</p>}
                                </div>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-4 pt-4">
                      <Button onClick={handleShare} variant="primary" className="w-full py-4 rounded-[28px]"><Share2 size={20} /> Share Nilpha</Button>
                      <Button onClick={logout} variant="secondary" className="w-full py-4 rounded-[28px] text-red-500">Logout</Button>
                    </div>
                  </div>
                )}

                {activeTab === 'orders' && (
                  <div className="space-y-6 text-left">
                    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-1">
                      <h2 className="text-lg font-black text-slate-800 tracking-tight uppercase flex items-center gap-2">
                        📜 আপনার সার্ভিস ও অর্ডার ইতিহাস ({allOrders.length})
                      </h2>
                      <p className="text-[10px] text-slate-500 font-bold">
                        আপনার বুকিংকৃত রক্ত পরীক্ষা, অক্সিজেন, ঔষধ বা হোম সার্ভিসের লাইভ স্ট্যাটাস।
                      </p>
                    </div>

                    {allOrders.length === 0 ? (
                      <Card className="p-10 text-center text-slate-400 font-bold text-xs space-y-2">
                        <div className="text-3xl">📦</div>
                        <p>আপনার কোনো সাম্প্রতিক অর্ডার পাওয়া যায়নি।</p>
                      </Card>
                    ) : (
                      <div className="space-y-4">
                        {allOrders.map(order => {
                          const statusBadgeColor = 
                            order.status === 'verified' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                            order.status === 'completed' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                            order.status === 'cancelled' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                            'bg-amber-100 text-amber-800 border-amber-200';

                          const statusLabel = 
                            order.status === 'verified' ? '✅ একসেপ্টেড (Verified)' :
                            order.status === 'completed' ? '🎉 সম্পন্ন (Completed)' :
                            order.status === 'cancelled' ? '❌ ডিনাই / বাতিল (Cancelled)' :
                            '⏳ পেন্ডিং রিভিউ';

                          return (
                            <Card key={order.id} className="p-5 border border-slate-100 hover:shadow-md transition-all space-y-3">
                              <div className="flex justify-between items-start gap-2 border-b border-slate-100 pb-2.5">
                                <div>
                                  <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${statusBadgeColor}`}>
                                    {statusLabel}
                                  </span>
                                  <h4 className="text-sm font-black text-slate-800 mt-1.5">{order.item_name}</h4>
                                  {order.hospital_name && (
                                    <p className="text-[10px] text-blue-600 font-bold">🏥 {order.hospital_name}</p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="text-[9px] text-slate-400 font-bold uppercase">সর্বমোট প্রদেয়:</p>
                                  <p className="text-sm font-black text-emerald-600">৳{(order.amount || 0) + (order.shipping || 0)} BDT</p>
                                </div>
                              </div>

                              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/80 text-[11px] font-bold text-slate-600 space-y-1">
                                <p>👤 সেবা গ্রহীতা: <span className="text-slate-900 font-extrabold">{order.patient_name || order.sender_name}</span> ({order.sender_contact})</p>
                                {order.delivery_address && <p>📍 ঠিকানা: <span className="text-slate-900 font-extrabold">{order.delivery_address}</span></p>}
                                {order.delivery_distance_label && <p>🚗 যাতায়াত কাভারেজ: <span className="text-indigo-600 font-extrabold">{order.delivery_distance_label}</span></p>}
                                <p className="text-[10px] text-slate-400 font-mono pt-1">
                                  💳 পেমেন্ট: {order.payment_method} {order.trx_id ? `| TrxID: ${order.trx_id}` : ''}
                                </p>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </main>

              {profile?.role !== UserRole.ADMIN && (
                <nav className="fixed bottom-6 left-6 right-6 z-50 bg-slate-900/95 backdrop-blur-2xl flex justify-around items-center py-5 rounded-[40px] shadow-2xl border border-white/10 overflow-hidden">
                  <button onClick={() => { setActiveTab('home'); setHomeSubCategory('doctors'); setSelectedHospitalId(null); setSelectedSpecialty(null); setSelectedDay(null); setSelectedLocation(null); navigate('/'); }} className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'home' ? 'text-blue-400 scale-125' : 'text-slate-500 opacity-60'}`}>
                    <span className="text-2xl">🏠</span>
                    <span className="text-[8px] font-black uppercase tracking-[0.2em]">Home</span>
                  </button>
                  <button onClick={() => { setActiveTab('orders'); navigate('/'); }} className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'orders' ? 'text-yellow-400 scale-125' : 'text-slate-500 opacity-60'}`}>
                    <span className="text-2xl">📜</span>
                    <span className="text-[8px] font-black uppercase tracking-[0.2em]">Orders</span>
                  </button>
                  <button onClick={() => { setActiveTab('profile'); navigate('/'); }} className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'profile' ? 'text-fuchsia-400 scale-125' : 'text-slate-500 opacity-60'}`}>
                    <span className="text-2xl">👤</span>
                    <span className="text-[8px] font-black uppercase tracking-[0.2em]">Profile</span>
                  </button>
                </nav>
              )}
            </>
          )
        } />
      </Routes>


      {/* Checkout Payment Modal */}
      {showPayment.show && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-5 my-8 text-left max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-black text-lg text-slate-900 tracking-tight flex items-center gap-2">
                    💳 চেকআউট ও পেমেন্ট
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                    আপনার নির্বাচিত সেবার তথ্য, যাতায়াত চার্জ ও পেমেন্ট সম্পন্ন করুন
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setShowPayment({ show: false, amount: 0, item: '', shipping: 0 });
                    handleRemoveCoupon();
                  }}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Order Items & Price Summary */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">আইটেম ও সার্ভিস মূল্য বিবরণী</p>
                <div className="text-xs font-extrabold text-slate-800 border-b border-slate-200/60 pb-2">
                  📝 {showPayment.item || 'জরুরি স্বাস্থ্য সার্ভিস'}
                </div>
                <div className="flex justify-between text-xs font-bold text-slate-600 pt-1">
                  <span>সার্ভিস / পরীক্ষার ফি:</span>
                  <span>৳{showPayment.amount} BDT</span>
                </div>
                {appliedCoupon && couponDiscountAmount > 0 && (
                  <div className="flex justify-between items-center text-xs font-black text-pink-600 bg-pink-50 p-2 rounded-xl border border-pink-200">
                    <span className="flex items-center gap-1.5">
                      <Tag size={13} /> কুপন ডিসকাউন্ট ({appliedCoupon.code} - {appliedCoupon.discount_percent}% ছাড়):
                    </span>
                    <span className="text-sm">-৳{couponDiscountAmount} BDT</span>
                  </div>
                )}
                <div className="flex justify-between text-xs font-bold text-slate-600">
                  <span>যাতায়াত / ডেলিভারি চার্জ (নীলফামারী শহর হতে):</span>
                  <span className="text-blue-600">৳{activeTransportFee} BDT</span>
                </div>
                <div className="flex justify-between text-sm font-black text-blue-600 pt-2 border-t border-slate-200">
                  <span>সর্বমোট প্রদেয় টাকা:</span>
                  <span className="text-base text-emerald-600 font-black">৳{totalPayableAmount} BDT</span>
                </div>
              </div>

              {/* Coupon Code Section for Test Orders & Services */}
              <div className="bg-gradient-to-r from-pink-50/80 via-purple-50/80 to-blue-50/80 p-4 rounded-2xl border border-pink-200/90 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black uppercase text-slate-800 flex items-center gap-1.5">
                    <Tag size={13} className="text-pink-600" />
                    <span>ডিসকাউন্ট কুপন কোড (Coupon Code)</span>
                  </label>
                  {appliedCoupon && (
                    <span className="text-[9px] bg-pink-600 text-white font-black px-2.5 py-0.5 rounded-full shadow-xs">
                      {appliedCoupon.discount_percent}% ছাড় প্রযোজ্য
                    </span>
                  )}
                </div>

                {appliedCoupon ? (
                  <div className="p-3 bg-white rounded-xl border border-emerald-300 flex items-center justify-between gap-2 shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-xs shrink-0">
                        ✓
                      </span>
                      <div>
                        <p className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                          <span>{appliedCoupon.code}</span>
                          <span className="text-[10px] text-emerald-600 font-extrabold">({appliedCoupon.discount_percent}% ছাড়)</span>
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium">
                          {appliedCoupon.title} • মোট সাশ্রয় ৳{couponDiscountAmount} BDT
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="px-2.5 py-1 text-[10px] font-black text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition-all active:scale-95 shrink-0"
                    >
                      ✕ কুপন বাতিল
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCodeInput}
                        onChange={(e) => {
                          setCouponCodeInput(e.target.value.toUpperCase());
                          setCouponError('');
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleApplyCoupon();
                          }
                        }}
                        placeholder="কুপন কোড লিখুন (যেমন: TEST20)"
                        className="flex-1 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-black uppercase text-slate-800 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                      />
                      <button
                        type="button"
                        onClick={() => handleApplyCoupon()}
                        className="px-4 py-2.5 bg-pink-600 hover:bg-pink-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-sm active:scale-95 transition-all shrink-0"
                      >
                        প্রয়োগ করুন
                      </button>
                    </div>

                    {couponError && (
                      <p className="text-[11px] text-rose-600 font-bold flex items-center gap-1">
                        <AlertCircle size={12} /> {couponError}
                      </p>
                    )}

                    {couponSuccess && (
                      <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 size={12} /> {couponSuccess}
                      </p>
                    )}

                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                      💡 কুপন কোড দিলে টেস্ট ফি থেকে স্বয়ংক্রিয়ভাবে শতকরা (%) নির্ধারিত টাকা ডিসকাউন্ট বাদ হয়ে যাবে।
                    </p>
                  </div>
                )}
              </div>

              {/* Hospital Choice for Test Order */}
              {showPayment.isTest && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50/80 p-4 rounded-2xl border border-blue-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black uppercase text-blue-950 flex items-center gap-1.5">
                      <span>🏥</span> টেস্ট করানোর হাসপাতাল / ডায়াগনস্টিক সেন্টার চয়েস করুন *
                    </label>
                    <span className="text-[9px] bg-blue-600 text-white font-extrabold px-2.5 py-0.5 rounded-full shadow-sm">
                      হাসপাতাল চয়েস অপশন
                    </span>
                  </div>

                  <select
                    value={selectedTestHospital}
                    onChange={(e) => setSelectedTestHospital(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-blue-300 rounded-xl text-xs font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/30"
                  >
                    <option value="none">নির্দিষ্ট কোনো হাসপাতাল নেই (অন্য যেকোনো স্থান / বিশ্বস্ত ল্যাব)</option>
                    {hospitals.map(h => (
                      <option key={h.id} value={h.name}>
                        {h.name} {h.district ? `(${h.district})` : ''}
                      </option>
                    ))}
                  </select>

                  {/* Notice for Popular (Rangpur) & Prava Health Care (Dhaka) */}
                  {(selectedTestHospital.includes('পপুলার') || selectedTestHospital.includes('Popular') || selectedTestHospital.includes('প্রাভা') || selectedTestHospital.includes('প্রোভা') || selectedTestHospital.includes('Prava')) ? (
                    <div className="bg-amber-100/90 border-2 border-amber-400 p-3.5 rounded-xl text-amber-950 space-y-1.5 animate-in fade-in duration-200 shadow-sm">
                      <div className="flex items-center gap-1.5 font-black text-xs text-amber-950">
                        <span className="text-base">⏰</span>
                        <span>রিপোর্ট ডেলিভারি সময়সূচী সংক্রান্ত নোটিশ:</span>
                      </div>
                      <p className="text-[11px] font-extrabold text-amber-950 leading-relaxed">
                        পপুলার ডায়াগনস্টিক সেন্টার (রংপুর) অথবা ঢাকা প্রাভা হেলথ কেয়ার (ঢাকা) থেকে টেস্ট করানোর ক্ষেত্রে রিপোর্ট প্রস্তুত ও ডেলিভারি করতে <span className="underline font-black text-rose-800">৩ (তিন) থেকে ৫ (পাঁচ) দিন সময় লাগবে</span>।
                      </p>
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-600 font-bold leading-tight">
                      ℹ️ আপনি যে হাসপাতাল সিলেক্ট করবেন, আমরা সেই হাসপাতাল থেকেই আপনার টেস্ট সম্পন্ন করে রিপোর্ট প্রদান করব। কোনো নির্দিষ্ট হাসপাতাল না থাকলে "নির্দিষ্ট কোনো হাসপাতাল নেই" রাখুন।
                    </p>
                  )}
                </div>
              )}

              {/* Recipient & Transport Address Fields */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">সেবা গ্রহণকারীর তথ্য ও অবস্থান</h4>
                <div className="space-y-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">সেবা গ্রহণকারী / রোগীর নাম *</label>
                    <input
                      type="text"
                      value={patientName}
                      onChange={(e) => setPatientName(sanitizeInput(e.target.value))}
                      placeholder="যেমন: মোঃ রফিকুল ইসলাম"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">মোবাইল নম্বর *</label>
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(sanitizeInput(e.target.value))}
                      placeholder="যেমন: 01700000000"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">পূর্ণাঙ্গ ঠিকানা / লোকেশন (হোম সার্ভিসের জন্য) *</label>
                    <textarea
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(sanitizeInput(e.target.value))}
                      rows={2}
                      placeholder="যেমন: বাড়ি #৪৫, সড়ক #২, সবুজপাড়া, নীলফামারী সদর"
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-600 focus:bg-white resize-none"
                    />
                  </div>

                  {/* Nilphamari Transport Distance Selector */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-indigo-700 block mb-1.5">
                      🚗 নীলফামারী শহর থেকে দূরত্ব (হোম ডেলিভারি/যাতায়াত ফি) *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDeliveryDistance('within_2km')}
                        className={`p-2.5 rounded-xl border-2 text-[11px] text-left transition-all ${
                          deliveryDistance === 'within_2km'
                            ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 font-extrabold shadow-sm'
                            : 'border-slate-200 bg-slate-50 text-slate-600 font-bold'
                        }`}
                      >
                        <div className="font-black text-slate-900">২ কিমি এর মধ্যে</div>
                        <div className="text-[10px] text-indigo-600 font-black mt-0.5">৳৩০ যাতায়াত ফি</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeliveryDistance('around_5km')}
                        className={`p-2.5 rounded-xl border-2 text-[11px] text-left transition-all ${
                          deliveryDistance === 'around_5km'
                            ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 font-extrabold shadow-sm'
                            : 'border-slate-200 bg-slate-50 text-slate-600 font-bold'
                        }`}
                      >
                        <div className="font-black text-slate-900">প্রায় ৫ কিমি</div>
                        <div className="text-[10px] text-indigo-600 font-black mt-0.5">৳৫০ যাতায়াত ফি</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeliveryDistance('around_10km')}
                        className={`p-2.5 rounded-xl border-2 text-[11px] text-left transition-all ${
                          deliveryDistance === 'around_10km'
                            ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 font-extrabold shadow-sm'
                            : 'border-slate-200 bg-slate-50 text-slate-600 font-bold'
                        }`}
                      >
                        <div className="font-black text-slate-900">প্রায় ১০ কিমি</div>
                        <div className="text-[10px] text-indigo-600 font-black mt-0.5">৳৮০ যাতায়াত ফি</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeliveryDistance('none')}
                        className={`p-2.5 rounded-xl border-2 text-[11px] text-left transition-all ${
                          deliveryDistance === 'none'
                            ? 'border-slate-700 bg-slate-100 text-slate-900 font-extrabold shadow-sm'
                            : 'border-slate-200 bg-slate-50 text-slate-600 font-bold'
                        }`}
                      >
                        <div className="font-black text-slate-900">সরাসরি সেন্টারে সেবা</div>
                        <div className="text-[10px] text-emerald-600 font-black mt-0.5">৳০ (যাতায়াত ফ্রি)</div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">পেমেন্ট মাধ্যম নির্বাচন করুন</h4>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentType('online')}
                    className={`py-3 px-3 rounded-2xl border-2 text-xs font-black transition-all flex flex-col items-center gap-1 ${
                      paymentType === 'online' ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-sm' : 'border-slate-100 bg-slate-50 text-slate-500'
                    }`}
                  >
                    <span className="text-base">📱</span>
                    <span>অনলাইন পেমেন্ট</span>
                    <span className="text-[9px] font-bold opacity-75">(bKash / Nagad)</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setPaymentType('offline')}
                    className={`py-3 px-3 rounded-2xl border-2 text-xs font-black transition-all flex flex-col items-center gap-1 ${
                      paymentType === 'offline' ? 'border-emerald-600 bg-emerald-50 text-emerald-600 shadow-sm' : 'border-slate-100 bg-slate-50 text-slate-500'
                    }`}
                  >
                    <span className="text-base">💵</span>
                    <span>ক্যাশ অন সেবা</span>
                    <span className="text-[9px] font-bold opacity-75">(সেবার পর নগদ দিন)</span>
                  </button>
                </div>

                {/* Online Mobile Banking Tabs (bKash & Nagad) */}
                {paymentType === 'online' && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4 animate-in fade-in duration-200">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('bkash')}
                        className={`py-2.5 rounded-xl border-2 font-black text-xs transition-all flex items-center justify-center gap-1.5 ${
                          currentPayMethod === 'bkash'
                            ? 'border-pink-500 bg-pink-50 text-pink-600 shadow-sm'
                            : 'border-slate-200 bg-white text-slate-500'
                        }`}
                      >
                        <span className="text-base">🌸</span> bKash (বিকাশ)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('nagad')}
                        className={`py-2.5 rounded-xl border-2 font-black text-xs transition-all flex items-center justify-center gap-1.5 ${
                          currentPayMethod === 'nagad'
                            ? 'border-orange-500 bg-orange-50 text-orange-600 shadow-sm'
                            : 'border-slate-200 bg-white text-slate-500'
                        }`}
                      >
                        <span className="text-base">🍊</span> Nagad (নগদ)
                      </button>
                    </div>

                    <div className={`p-3.5 rounded-xl text-xs space-y-2 font-bold ${
                      currentPayMethod === 'bkash' ? 'bg-pink-100/70 text-pink-950 border border-pink-200' : 'bg-orange-100/70 text-orange-950 border border-orange-200'
                    }`}>
                      <div className="flex items-center justify-between gap-2 font-black text-sm">
                        <span>{currentPayMethod === 'bkash' ? '🌸 বিকাশ Personal' : '🍊 নগদ Personal'} নম্বর:</span>
                        <span className="bg-white px-3 py-1 rounded-lg border border-slate-300 font-mono tracking-wider text-slate-900 select-all font-black">
                          {currentPayNumber}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed opacity-95">
                        ১. আমাদের অফিশিয়াল <span className="font-extrabold font-mono text-black">{currentPayMethod === 'bkash' ? 'bKash (01518395772)' : 'Nagad (01846800973)'}</span> নম্বরে ৳{totalPayableAmount} টাকা Send Money / Payment করুন।
                        <br />
                        ২. পেমেন্ট শেষে প্রাপ্ত ট্রানজেকশন আইডি (TrxID) নিচে লিখে সাবমিট করুন।
                      </p>
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-600 block mb-1">
                        পেমেন্ট TrxID (ট্রানজেকশন আইডি) *
                      </label>
                      <input
                        type="text"
                        value={trxId}
                        onChange={(e) => setTrxId(e.target.value.toUpperCase())}
                        placeholder="যেমন: 9J87HG65"
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-black uppercase tracking-wider outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit & WhatsApp Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={submitOrder}
                  disabled={isProcessing}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wide rounded-2xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isProcessing ? 'অর্ডার জমা হচ্ছে...' : '✓ কনফার্ম সার্ভিস অর্ডার'}
                </button>

                <button
                  type="button"
                  onClick={handleWhatsAppBooking}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wide rounded-2xl shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <MessageSquare size={14} /> হোয়াটসঅ্যাপে বুকিং তথ্য পাঠান
                </button>
              </div>
            </div>
          </div>
      )}

      {/* Daily YouTube Quiz Entry Modal */}
      {showQuizModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl border border-slate-100 text-left relative">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <span className="inline-block bg-purple-100 text-purple-700 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-1">
                  দৈনিক প্রতিযোগিতা
                </span>
                <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                  📺 ডেইলি ইউটিউব কুইজ এন্ট্রি ও সাবমিট
                </h3>
                <p className="text-[11px] text-slate-500 font-bold mt-1">
                  ইউটিউব ভিডিও দেখে সঠিক উত্তর ও আপলোড ডেট দিন এবং ক্যাশ প্রাইজ জিতে নিন!
                </p>
              </div>
              <button
                onClick={() => setShowQuizModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold transition-all"
              >
                ✕
              </button>
            </div>

            {allQuizzes.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="text-4xl">📺</div>
                <p className="text-xs text-slate-400 font-extrabold uppercase italic">
                  আজকের কোনো নতুন কুইজ এন্ট্রি পাওয়া যায়নি। শীঘ্রই যুক্ত হবে!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {allQuizzes.map((quiz) => {
                  const submission = allSubmissions.find(
                    sub => sub.quiz_id === quiz.id && sub.user_id === profile?.id
                  );
                  return (
                    <QuizCardItem
                      key={quiz.id}
                      quiz={quiz}
                      submission={submission}
                      userPhone={profile?.phone || ''}
                      onSubmitQuiz={handleQuizSubmit}
                    />
                  );
                })}
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowQuizModal(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-all"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      <LiveDoctorModal
        isOpen={showLiveDoctorModal}
        onClose={() => {
          setShowLiveDoctorModal(false);
          setLiveDoctorSelectedDoc(null);
        }}
        selectedDoctor={liveDoctorSelectedDoc}
        doctors={doctors}
        currentUser={profile ? {
          id: profile.id,
          name: profile.name,
          phone: profile.phone,
          email: profile.email
        } : null}
        onOpenSubscription={() => {
          setShowLiveDoctorModal(false);
          setHomeSubCategory('subscriptions');
          const subTarget = document.getElementById('subscription-section');
          if (subTarget) subTarget.scrollIntoView({ behavior: 'smooth' });
        }}
        onDoctorSelect={(doc) => setLiveDoctorSelectedDoc(doc)}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          setAuthErrorMessage('');
        }}
        authMode={authMode}
        setAuthMode={(mode) => {
          setAuthErrorMessage('');
          setAuthMode(mode);
        }}
        onSubmit={handleAuth}
        onGoogleLogin={handleGoogleLogin}
        isProcessing={isProcessing}
        errorMessage={authErrorMessage}
        onClearError={() => setAuthErrorMessage('')}
      />
    </div>
  );
}
