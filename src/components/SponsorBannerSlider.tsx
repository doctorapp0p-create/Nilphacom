import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Edit3, 
  Upload, 
  Image as ImageIcon, 
  Clock, 
  Sparkles, 
  ArrowUp, 
  ArrowDown, 
  Check, 
  Eye, 
  EyeOff, 
  ExternalLink, 
  Play, 
  Pause, 
  Settings, 
  X, 
  RefreshCw, 
  Save, 
  Sliders, 
  HelpCircle,
  Percent,
  Phone,
  ShieldCheck,
  Building,
  Stethoscope,
  Baby,
  Gift
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../../services/firebase';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { SponsorSlide, DurationUnit, SponsorSliderSettings, Profile, Hospital } from '../../types';

const DEFAULT_DOCTOR_IMAGE = '/src/assets/images/doctor_sponsor_banner_1785435948836.jpg';
const DEFAULT_HOSPITAL_IMAGE = '/ar_general_hospital.png';

// High-quality Initial Default Slides
export const DEFAULT_SPONSOR_SLIDES: SponsorSlide[] = [
  {
    id: 'slide_featured_hospital',
    title: 'এ আর জেনারেল হাসপাতাল অ্যান্ড ডিজিটাল ডায়াগনস্টিক',
    subtitle: 'অভিজ্ঞ বিশেষজ্ঞ ডাক্তারদের নিয়মিত চেম্বার ও আধুনিক ডায়াগনস্টিক টেস্টে বিশেষ ছাড়।',
    badge: '⭐ স্পন্সরড হাসপাতাল ও ডায়াগনস্টিক',
    image: DEFAULT_HOSPITAL_IMAGE,
    durationValue: 8,
    durationUnit: 'seconds',
    actionType: 'category',
    actionTarget: 'hospitals',
    buttonText: 'হাসপাতাল বিস্তারিত',
    isActive: true,
    order: 1,
    createdAt: new Date().toISOString()
  },
  {
    id: 'slide_doctor_consultation',
    title: 'বিশেষজ্ঞ ডক্টর ও স্পন্সরড হাসপাতাল সেবা',
    subtitle: 'আমাদের পার্টনার হাসপাতাল ও অভিজ্ঞ বিশেষজ্ঞ ডাক্তারদের নিয়মিত তথ্য পেতে এবং সরাসরি সিরিয়াল দিতে সাথে থাকুন।',
    badge: '🏥 ফিচার্ড পার্টনার স্পট',
    image: DEFAULT_DOCTOR_IMAGE,
    durationValue: 10,
    durationUnit: 'seconds',
    actionType: 'category',
    actionTarget: 'doctors',
    buttonText: 'ডাক্তার খুঁজুন',
    isActive: true,
    order: 2,
    createdAt: new Date().toISOString()
  },
  {
    id: 'slide_free_doctor_camp',
    title: '🎁 আজকের ফ্রি ডাক্তার কনসালটেশন ও বিশেষ টেস্ট ছাড়',
    subtitle: 'অসহায় ও দুস্থ রোগীদের জন্য ১০০% বিনামূল্যে বিশেষজ্ঞ ডাক্তার সেবা ও ডায়াগনস্টিক টেস্টে ৫০% ছাড়।',
    badge: '🔥 বিশেষ মানবিক উদ্যোগ',
    image: DEFAULT_DOCTOR_IMAGE,
    durationValue: 6,
    durationUnit: 'seconds',
    actionType: 'category',
    actionTarget: 'free_doctors',
    buttonText: 'ফ্রি সেবা ক্লেইম করুন',
    isActive: true,
    order: 3,
    createdAt: new Date().toISOString()
  },
  {
    id: 'slide_maternity_aid',
    title: '🤰 গরিব প্রসূতি মায়েদের নিরাপদ সিজারে নগদ ২,০০০ টাকা অনুদান',
    subtitle: 'প্রান্তিক অসচ্ছল গর্ভবতী মায়েদের নিরাপদ ডেলিভারিতে সরাসরি বিকাশ/নগদে আর্থিক সহায়তা।',
    badge: '💖 মাতৃকল্যাণ সহায়তা',
    image: DEFAULT_DOCTOR_IMAGE,
    durationValue: 7,
    durationUnit: 'seconds',
    actionType: 'category',
    actionTarget: 'maternity_donation',
    buttonText: 'অনুদানের আবেদন ও তথ্য',
    isActive: true,
    order: 4,
    createdAt: new Date().toISOString()
  }
];

export const DEFAULT_SLIDER_SETTINGS: SponsorSliderSettings = {
  autoPlay: true,
  defaultDurationValue: 7,
  defaultDurationUnit: 'seconds',
  showProgress: true,
  showArrows: true,
  showDots: true,
  pauseOnHover: true
};

// Helper: Convert Duration value and unit to milliseconds
export function getDurationInMs(val: number, unit: DurationUnit): number {
  const safeVal = Math.max(1, Number(val) || 5);
  switch (unit) {
    case 'hours':
      return safeVal * 60 * 60 * 1000;
    case 'minutes':
      return safeVal * 60 * 1000;
    case 'seconds':
    default:
      return safeVal * 1000;
  }
}

// Helper: Format duration for display (Bengali)
export function formatDurationBangla(val: number, unit: DurationUnit): string {
  const numEn = String(val);
  const numBn = numEn.replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[parseInt(d, 10)]);
  if (unit === 'hours') return `${numBn} ঘন্টা`;
  if (unit === 'minutes') return `${numBn} মিনিট`;
  return `${numBn} সেকেন্ড`;
}

// Compress Image to lightweight Base64
async function compressImageFile(file: File, maxWidth = 1200, maxHeight = 700, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('Image loading error'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('File reading error'));
    reader.readAsDataURL(file);
  });
}

interface SponsorBannerSliderProps {
  isAdmin?: boolean;
  hospitals?: Hospital[];
  onNavigateCategory?: (category: 'doctors' | 'hospitals' | 'dental' | 'labtests' | 'emergency' | 'buy_medicine' | 'medical_accessories' | 'free_doctors' | 'maternity_donation' | 'donation') => void;
  onSelectHospital?: (hospitalId: string) => void;
  onOpenDoctorBooking?: () => void;
  whatsappNumber?: string;
}

export const SponsorBannerSlider: React.FC<SponsorBannerSliderProps> = ({
  isAdmin = false,
  hospitals = [],
  onNavigateCategory,
  onSelectHospital,
  onOpenDoctorBooking,
  whatsappNumber = '8801352669100'
}) => {
  const [slides, setSlides] = useState<SponsorSlide[]>(DEFAULT_SPONSOR_SLIDES);
  const [sliderSettings, setSliderSettings] = useState<SponsorSliderSettings>(DEFAULT_SLIDER_SETTINGS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [loading, setLoading] = useState(true);

  // Admin Modal State
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<SponsorSlide | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [saving, setSaving] = useState(false);

  // Progress Bar Animation
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const slideStartTimeRef = useRef<number>(Date.now());
  const currentDurationMsRef = useRef<number>(7000);

  // Active filter
  const activeSlides = useMemo(() => {
    const list = slides.filter(s => s.isActive);
    return list.length > 0 ? list : DEFAULT_SPONSOR_SLIDES;
  }, [slides]);

  // Safe current slide
  const currentSlide = activeSlides[currentIndex % activeSlides.length] || activeSlides[0];

  // Fetch from Firebase / localStorage on mount
  useEffect(() => {
    fetchSlidesData();
  }, []);

  const fetchSlidesData = async () => {
    setLoading(true);
    try {
      // 1. Try fetching from Firestore settings doc
      const docRef = doc(db, 'settings', 'sponsor_banner_slider');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data.slides && Array.isArray(data.slides) && data.slides.length > 0) {
          setSlides(data.slides);
        }
        if (data.settings) {
          setSliderSettings(data.settings);
        }
      } else {
        // Fallback: Check localStorage
        const localSaved = localStorage.getItem('nilpha_sponsor_slides');
        if (localSaved) {
          try {
            const parsed = JSON.parse(localSaved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setSlides(parsed);
            }
          } catch (e) {
            console.error('Error parsing local slides:', e);
          }
        }
      }
    } catch (err) {
      console.error('Error loading sponsor slides from Firebase:', err);
    } finally {
      setLoading(false);
    }
  };

  // Save to Firebase & LocalStorage
  const saveSlidesToStorage = async (newSlides: SponsorSlide[], newSettings?: SponsorSliderSettings) => {
    setSaving(true);
    try {
      const finalSettings = newSettings || sliderSettings;
      const docRef = doc(db, 'settings', 'sponsor_banner_slider');
      await setDoc(docRef, {
        slides: newSlides,
        settings: finalSettings,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // Save to localStorage as well
      localStorage.setItem('nilpha_sponsor_slides', JSON.stringify(newSlides));
      localStorage.setItem('nilpha_sponsor_slider_settings', JSON.stringify(finalSettings));

      setSlides(newSlides);
      if (newSettings) setSliderSettings(newSettings);
      alert('সফলভাবে স্লাইডার ও ছবির সময়কাল সেভ করা হয়েছে!');
    } catch (err) {
      console.error('Error saving slides:', err);
      // Still update locally
      setSlides(newSlides);
      localStorage.setItem('nilpha_sponsor_slides', JSON.stringify(newSlides));
      alert('সেভ সম্পন্ন হয়েছে (লোকালি আপডেট করা হয়েছে)।');
    } finally {
      setSaving(false);
    }
  };

  // Next Slide Action
  const nextSlide = () => {
    setCurrentIndex(prev => (prev + 1) % activeSlides.length);
  };

  // Prev Slide Action
  const prevSlide = () => {
    setCurrentIndex(prev => (prev - 1 + activeSlides.length) % activeSlides.length);
  };

  // Dynamic Slide Transition Timer based on PER-SLIDE DURATION
  useEffect(() => {
    if (activeSlides.length <= 1) {
      setProgress(100);
      return;
    }

    if (!isPlaying || (sliderSettings.pauseOnHover && isHovered)) {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      return;
    }

    // Get current slide duration in ms
    const slideDurationMs = getDurationInMs(currentSlide.durationValue, currentSlide.durationUnit);
    currentDurationMsRef.current = slideDurationMs;
    slideStartTimeRef.current = Date.now();
    setProgress(0);

    // Clear previous
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    // Progress bar ticker (every 50ms)
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - slideStartTimeRef.current;
      const pct = Math.min(100, (elapsed / slideDurationMs) * 100);
      setProgress(pct);
    }, 50);

    // Main Timeout to switch slide
    timerRef.current = setTimeout(() => {
      nextSlide();
    }, slideDurationMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [currentIndex, isPlaying, isHovered, activeSlides, currentSlide, sliderSettings.pauseOnHover]);

  // Handle Banner Click Action
  const handleBannerAction = (slide: SponsorSlide) => {
    if (!slide.actionType || slide.actionType === 'none') return;

    switch (slide.actionType) {
      case 'category':
        if (slide.actionTarget && onNavigateCategory) {
          onNavigateCategory(slide.actionTarget as any);
        }
        break;
      case 'hospital':
        if (slide.actionTarget && onSelectHospital) {
          onSelectHospital(slide.actionTarget);
          if (onNavigateCategory) onNavigateCategory('hospitals');
        }
        break;
      case 'whatsapp':
        window.open(`https://wa.me/88${whatsappNumber}?text=${encodeURIComponent(`Hello nilpha.com, I am interested in: ${slide.title}`)}`, '_blank');
        break;
      case 'link':
        if (slide.actionTarget) {
          if (slide.actionTarget.startsWith('http')) {
            window.open(slide.actionTarget, '_blank');
          } else {
            window.location.href = slide.actionTarget;
          }
        }
        break;
      default:
        break;
    }
  };

  // Reorder Handler
  const handleMoveSlide = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;
    const newSlides = [...slides];
    const temp = newSlides[index];
    newSlides[index] = newSlides[targetIndex];
    newSlides[targetIndex] = temp;
    // Update order
    newSlides.forEach((s, idx) => { s.order = idx + 1; });
    saveSlidesToStorage(newSlides);
  };

  // Toggle Active
  const handleToggleActive = (id: string) => {
    const newSlides = slides.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s);
    saveSlidesToStorage(newSlides);
  };

  // Delete Slide
  const handleDeleteSlide = (id: string) => {
    if (slides.length <= 1) {
      alert('কমপক্ষে একটি স্লাইড থাকা আবশ্যক!');
      return;
    }
    if (!window.confirm('আপনি কি নিশ্চিতভাবে এই ব্যানার স্লাইডটি মুছে ফেলতে চান?')) return;
    const newSlides = slides.filter(s => s.id !== id);
    saveSlidesToStorage(newSlides);
  };

  // Save Slide from Form
  const handleSaveSlideForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlide) return;

    if (!editingSlide.title.trim()) {
      alert('অনুগ্রহ করে ব্যানারের শিরোনাম লিখুন');
      return;
    }
    if (!editingSlide.image) {
      alert('অনুগ্রহ করে ব্যানারের ছবি আপলোড করুন বা লিংক দিন');
      return;
    }

    const durationVal = Math.max(1, Number(editingSlide.durationValue) || 5);
    const updatedSlide: SponsorSlide = {
      ...editingSlide,
      durationValue: durationVal,
      durationUnit: editingSlide.durationUnit || 'seconds',
      order: editingSlide.order || (slides.length + 1)
    };

    let newSlides: SponsorSlide[];
    if (isCreatingNew) {
      newSlides = [...slides, updatedSlide];
    } else {
      newSlides = slides.map(s => s.id === updatedSlide.id ? updatedSlide : s);
    }

    saveSlidesToStorage(newSlides);
    setEditingSlide(null);
    setIsCreatingNew(false);
  };

  // Start Creating New Slide
  const handleStartNewSlide = () => {
    const newId = `slide_${Date.now()}`;
    setEditingSlide({
      id: newId,
      title: '',
      subtitle: '',
      badge: '⭐ স্পন্সরড প্রমোশন',
      image: DEFAULT_DOCTOR_IMAGE,
      durationValue: 7,
      durationUnit: 'seconds',
      actionType: 'category',
      actionTarget: 'doctors',
      buttonText: 'বিস্তারিত দেখুন',
      isActive: true,
      order: slides.length + 1,
      createdAt: new Date().toISOString()
    });
    setIsCreatingNew(true);
  };

  return (
    <div className="relative group w-full select-none">
      {/* 1. Main Slider Card Container */}
      <div 
        className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl shadow-xl border border-slate-800/90 min-h-[220px] sm:min-h-[240px] flex flex-col justify-between"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Background Image Slide with Smooth Crossfade Animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide.id}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="absolute inset-0 z-0"
          >
            <img 
              src={currentSlide.image} 
              alt={currentSlide.title} 
              className="w-full h-full object-cover object-center"
              referrerPolicy="no-referrer"
            />
            {/* Multi-layer Dark Gradient for perfect text contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-950/30" />
            <div className="absolute inset-0 bg-radial-to-t from-transparent via-slate-950/40 to-slate-950/80" />
          </motion.div>
        </AnimatePresence>

        {/* Top Header Overlay: Badges + Admin Settings Trigger */}
        <div className="relative z-10 p-3.5 sm:p-4 flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {currentSlide.badge && (
              <span className="inline-flex items-center gap-1.5 bg-amber-400 text-slate-950 text-[10px] sm:text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                <span>⭐</span> {currentSlide.badge}
              </span>
            )}
            <span className="text-[9px] bg-slate-900/80 backdrop-blur-md text-emerald-300 font-extrabold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
              <Clock size={11} className="text-emerald-400" />
              <span>{formatDurationBangla(currentSlide.durationValue, currentSlide.durationUnit)}</span>
            </span>
          </div>

          {/* Top Right: Admin Edit Button + Play/Pause */}
          <div className="flex items-center gap-1.5">
            {isAdmin && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsManageModalOpen(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] sm:text-xs font-black px-3 py-1.5 rounded-xl shadow-lg border border-emerald-400/40 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                title="ব্যানার স্লাইডার সেটিংস ও নতুন ছবি যোগ করুন"
              >
                <Settings size={13} className="animate-spin-slow" />
                <span>স্লাইডার ম্যানেজার ({slides.length})</span>
              </button>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsPlaying(!isPlaying);
              }}
              className="p-1.5 bg-slate-900/80 hover:bg-slate-800 text-slate-200 rounded-xl backdrop-blur-md border border-white/10 transition-colors"
              title={isPlaying ? 'স্লাইড বিরতি দিন' : 'স্লাইড চালু করুন'}
            >
              {isPlaying ? <Pause size={12} /> : <Play size={12} />}
            </button>
          </div>
        </div>

        {/* Center / Bottom Content */}
        <div className="relative z-10 p-4 sm:p-5 pt-0 space-y-2 mt-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide.id + '_content'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="space-y-1.5 max-w-2xl"
            >
              <h3 className="text-sm sm:text-base lg:text-lg font-black text-white tracking-wide drop-shadow-md flex items-center gap-2 leading-tight">
                {currentSlide.title}
              </h3>
              {currentSlide.subtitle && (
                <p className="text-[11px] sm:text-xs text-slate-200 font-medium leading-relaxed drop-shadow line-clamp-2 opacity-95">
                  {currentSlide.subtitle}
                </p>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Action Button & Indicator Row */}
          <div className="flex items-center justify-between gap-3 pt-2">
            {currentSlide.buttonText && currentSlide.actionType !== 'none' ? (
              <button
                onClick={() => handleBannerAction(currentSlide)}
                className="bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 text-xs font-black px-4 py-2 rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span>{currentSlide.buttonText}</span>
                <ExternalLink size={13} />
              </button>
            ) : (
              <div />
            )}

            {/* Slide Index / Indicator Dots */}
            {activeSlides.length > 1 && (
              <div className="flex items-center gap-1.5 bg-slate-950/60 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-white/10">
                {activeSlides.map((slide, idx) => (
                  <button
                    key={slide.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`transition-all rounded-full ${
                      idx === currentIndex 
                        ? 'w-5 h-1.5 bg-amber-400' 
                        : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70'
                    }`}
                    title={slide.title}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Previous & Next Arrow Controls */}
        {activeSlides.length > 1 && sliderSettings.showArrows && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevSlide();
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 bg-slate-950/60 hover:bg-slate-900 text-white rounded-full backdrop-blur-md border border-white/15 opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-90"
              aria-label="Previous Slide"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextSlide();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 bg-slate-950/60 hover:bg-slate-900 text-white rounded-full backdrop-blur-md border border-white/15 opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-90"
              aria-label="Next Slide"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}

        {/* Live Bottom Progress Bar */}
        {activeSlides.length > 1 && sliderSettings.showProgress && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-20 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-400 via-emerald-400 to-cyan-400 transition-[width] duration-75 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* 2. ADMIN MODAL: Comprehensive Slide & Duration Management */}
      {isManageModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-600/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <Sliders size={20} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    স্পন্সর ব্যানার স্লাইডার কন্ট্রোল প্যানেল
                  </h3>
                  <p className="text-xs text-slate-400">
                    যত খুশি তত ছবি যোগ করুন এবং প্রতিটির সময়কাল (সেকেন্ড/মিনিট/ঘন্টা) নির্ধারণ করুন
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsManageModalOpen(false);
                  setEditingSlide(null);
                  setIsCreatingNew(false);
                }}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
              {/* If Not Editing: Show Slides List & Quick Add */}
              {!editingSlide ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs font-bold text-slate-300">
                      মোট সক্রিয়/নিষ্ক্রিয় স্লাইড: {slides.length} টি
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={handleStartNewSlide}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-900/30 transition-all hover:scale-105"
                      >
                        <Plus size={14} />
                        <span>নতুন ব্যানার / ছবি যোগ করুন</span>
                      </button>
                    </div>
                  </div>

                  {/* Slides List Table / Cards */}
                  <div className="space-y-2.5">
                    {slides.map((slide, index) => (
                      <div 
                        key={slide.id}
                        className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          slide.isActive 
                            ? 'bg-slate-800/80 border-slate-700 hover:border-slate-600' 
                            : 'bg-slate-900/50 border-slate-800 opacity-60'
                        }`}
                      >
                        {/* Left Info */}
                        <div className="flex items-center gap-3">
                          {/* Image Thumbnail */}
                          <div className="w-16 h-12 rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-slate-700 relative">
                            <img 
                              src={slide.image} 
                              alt={slide.title} 
                              className="w-full h-full object-cover"
                            />
                            {!slide.isActive && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[9px] text-rose-300 font-bold">
                                নিষ্ক্রিয়
                              </div>
                            )}
                          </div>

                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-white line-clamp-1">{slide.title}</span>
                              {slide.badge && (
                                <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded shrink-0">
                                  {slide.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 line-clamp-1">{slide.subtitle || 'কোনো বিবরণ নেই'}</p>
                            
                            {/* Duration Badge */}
                            <div className="flex items-center gap-2 pt-0.5">
                              <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/50">
                                <Clock size={11} />
                                <span>স্থায়িত্ব: {formatDurationBangla(slide.durationValue, slide.durationUnit)}</span>
                              </span>
                              {slide.actionType && slide.actionType !== 'none' && (
                                <span className="text-[9px] text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded-md">
                                  অ্যাকশন: {slide.actionType}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right Action Buttons */}
                        <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                          {/* Move Order */}
                          <button
                            disabled={index === 0}
                            onClick={() => handleMoveSlide(index, 'up')}
                            className="p-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-slate-200 rounded-lg"
                            title="উপরে নিন"
                          >
                            <ArrowUp size={13} />
                          </button>
                          <button
                            disabled={index === slides.length - 1}
                            onClick={() => handleMoveSlide(index, 'down')}
                            className="p-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-slate-200 rounded-lg"
                            title="নিচে নিন"
                          >
                            <ArrowDown size={13} />
                          </button>

                          {/* Active Toggle */}
                          <button
                            onClick={() => handleToggleActive(slide.id)}
                            className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 ${
                              slide.isActive ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700' : 'bg-slate-800 text-slate-400'
                            }`}
                            title={slide.isActive ? 'সক্রিয় (ক্লিক করে বন্ধ করুন)' : 'নিষ্ক্রিয় (ক্লিক করে চালু করুন)'}
                          >
                            {slide.isActive ? <Eye size={13} /> : <EyeOff size={13} />}
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => {
                              setEditingSlide({ ...slide });
                              setIsCreatingNew(false);
                            }}
                            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                          >
                            <Edit3 size={13} />
                            <span>এডিট</span>
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteSlide(slide.id)}
                            className="p-1.5 bg-rose-900/50 hover:bg-rose-800 text-rose-300 rounded-lg transition-colors"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Reset to Default Button */}
                  <div className="pt-4 border-t border-slate-800 flex justify-between items-center text-xs">
                    <button
                      onClick={() => {
                        if (window.confirm('আপনি কি পূর্বনির্ধারিত (Default) স্লাইডগুলো ফিরিয়ে আনতে চান?')) {
                          saveSlidesToStorage(DEFAULT_SPONSOR_SLIDES);
                        }
                      }}
                      className="text-slate-400 hover:text-slate-200 flex items-center gap-1 underline"
                    >
                      <RefreshCw size={12} />
                      <span>ডিফল্ট স্লাইড রিস্টোর করুন</span>
                    </button>
                    <span className="text-[11px] text-slate-500">
                      স্লাইডার সেটিংস স্বয়ংক্রিয়ভাবে ডাটাবেজে সিঙ্ক থাকবে
                    </span>
                  </div>
                </div>
              ) : (
                /* Edit / Add Slide Form */
                <form onSubmit={handleSaveSlideForm} className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-sm font-black text-amber-400 flex items-center gap-2">
                      <Edit3 size={16} />
                      {isCreatingNew ? 'নতুন ব্যানার স্লাইড তৈরি করুন' : 'ব্যানার স্লাইড ও সময়কাল সম্পাদনা'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSlide(null);
                        setIsCreatingNew(false);
                      }}
                      className="text-xs text-slate-400 hover:text-white underline"
                    >
                      তালিকায় ফিরে যান
                    </button>
                  </div>

                  {/* 1. Image Upload / URL Input */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-200 block">
                      ব্যানারের ছবি (ছবি আপলোড করুন অথবা ইমেজ লিংক দিন) *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                      {/* Image Preview Box */}
                      <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-700 h-36 flex items-center justify-center group">
                        {editingSlide.image ? (
                          <img 
                            src={editingSlide.image} 
                            alt="Preview" 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <div className="text-center text-slate-500 text-xs p-4">
                            <ImageIcon size={24} className="mx-auto mb-1 opacity-50" />
                            কোনো ছবি নির্বাচিত নেই
                          </div>
                        )}
                        <div className="absolute top-2 left-2 bg-slate-900/80 px-2 py-0.5 rounded text-[10px] text-slate-300">
                          প্রিভিউ
                        </div>
                      </div>

                      {/* Upload & Preset Options */}
                      <div className="space-y-2">
                        {/* File Upload Button */}
                        <label className="w-full bg-slate-800 hover:bg-slate-700 border border-dashed border-slate-600 text-white p-3 rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-colors text-xs font-bold">
                          <Upload size={16} className="text-emerald-400" />
                          <span>ডিভাইস থেকে নতুন ছবি আপলোড করুন</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  const base64 = await compressImageFile(file);
                                  setEditingSlide({ ...editingSlide, image: base64 });
                                } catch (err) {
                                  alert('ছবি আপলোড করতে ব্যর্থ হয়েছে');
                                }
                              }
                            }} 
                          />
                        </label>

                        {/* Image URL Input */}
                        <div>
                          <input 
                            type="text" 
                            placeholder="অথবা ইমেজের ওয়েব লিংক (URL) পেস্ট করুন" 
                            value={editingSlide.image.startsWith('data:') ? '' : editingSlide.image}
                            onChange={(e) => setEditingSlide({ ...editingSlide, image: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs outline-none focus:border-emerald-500"
                          />
                        </div>

                        {/* Quick Presets */}
                        <div className="flex gap-1.5 text-[10px]">
                          <button
                            type="button"
                            onClick={() => setEditingSlide({ ...editingSlide, image: DEFAULT_HOSPITAL_IMAGE })}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700"
                          >
                            🏥 এ আর হাসপাতাল
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingSlide({ ...editingSlide, image: DEFAULT_DOCTOR_IMAGE })}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700"
                          >
                            👨‍⚕️ ডক্টর ব্যানার
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. DURATION CONFIGURATION (The primary user requirement) */}
                  <div className="bg-emerald-950/40 border border-emerald-700/50 p-4 rounded-2xl space-y-2.5">
                    <div className="flex items-center gap-2">
                      <Clock size={18} className="text-emerald-400" />
                      <label className="text-xs font-black text-emerald-300">
                        ⏱️ এই ছবিটি স্লাইডারে কতক্ষণ প্রদর্শিত হবে (Display Duration)? *
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-1">সময়ের পরিমাণ (সংখ্যা)</span>
                        <input 
                          type="number" 
                          min={1} 
                          max={3600}
                          value={editingSlide.durationValue}
                          onChange={(e) => setEditingSlide({ ...editingSlide, durationValue: parseInt(e.target.value, 10) || 5 })}
                          className="w-full bg-slate-800 border border-slate-700 text-white font-black text-sm px-3 py-2 rounded-xl outline-none focus:border-emerald-400"
                          required
                        />
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block mb-1">সময়ের একক (Unit)</span>
                        <select
                          value={editingSlide.durationUnit}
                          onChange={(e) => setEditingSlide({ ...editingSlide, durationUnit: e.target.value as DurationUnit })}
                          className="w-full bg-slate-800 border border-slate-700 text-white font-bold text-xs px-3 py-2 rounded-xl outline-none focus:border-emerald-400"
                        >
                          <option value="seconds">⏱️ সেকেন্ড (Seconds)</option>
                          <option value="minutes">⏳ মিনিট (Minutes)</option>
                          <option value="hours">🕐 ঘন্টা (Hours)</option>
                        </select>
                      </div>
                    </div>

                    {/* Calculated Bangla Preview */}
                    <div className="bg-slate-900/90 p-2.5 rounded-xl text-xs text-emerald-300 font-bold flex items-center justify-between">
                      <span>✓ নির্ধারিত সময়কাল:</span>
                      <span className="text-amber-300 font-black">
                        একটানা {formatDurationBangla(editingSlide.durationValue, editingSlide.durationUnit)}
                      </span>
                    </div>
                  </div>

                  {/* 3. Title & Subtitle */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-300 block mb-1">ব্যানারের মূল শিরোনাম (Title) *</label>
                      <input 
                        type="text" 
                        placeholder="যেমন: এ আর জেনারেল হাসপাতাল" 
                        value={editingSlide.title}
                        onChange={(e) => setEditingSlide({ ...editingSlide, title: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-300 block mb-1">টপ ট্যাগ / ব্যাজ (Badge)</label>
                      <input 
                        type="text" 
                        placeholder="যেমন: ⭐ স্পন্সরড হাসপাতাল" 
                        value={editingSlide.badge || ''}
                        onChange={(e) => setEditingSlide({ ...editingSlide, badge: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-300 block mb-1">ছোট বিবরণ বা অফারের তথ্য (Subtitle)</label>
                    <textarea 
                      rows={2} 
                      placeholder="যেমন: অভিজ্ঞ বিশেষজ্ঞ ডাক্তারদের নিয়মিত চেম্বার ও ডিজিটাল ডায়াগনস্টিক টেস্টে বিশেষ ছাড়।" 
                      value={editingSlide.subtitle || ''}
                      onChange={(e) => setEditingSlide({ ...editingSlide, subtitle: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs"
                    />
                  </div>

                  {/* 4. Action / Click Target */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-300 block mb-1">ক্লিকে কি ঘটবে (Action)</label>
                      <select
                        value={editingSlide.actionType || 'none'}
                        onChange={(e) => setEditingSlide({ ...editingSlide, actionType: e.target.value as any })}
                        className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs"
                      >
                        <option value="none">কোনো অ্যাকশন নেই</option>
                        <option value="category">নির্দিষ্ট সেবার মেনু খুলুন</option>
                        <option value="hospital">নির্দিষ্ট হাসপাতালের বিস্তারিত</option>
                        <option value="whatsapp">হোয়াটসঅ্যাপ চ্যাট চালু করুন</option>
                        <option value="link">কাস্টম ওয়েব লিংক ওপেন করুন</option>
                      </select>
                    </div>

                    {editingSlide.actionType === 'category' && (
                      <div>
                        <label className="text-[10px] font-bold text-slate-300 block mb-1">কোন সেকশনটি খুলবে?</label>
                        <select
                          value={editingSlide.actionTarget || 'doctors'}
                          onChange={(e) => setEditingSlide({ ...editingSlide, actionTarget: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs"
                        >
                          <option value="doctors">👨‍⚕️ বিশেষজ্ঞ ডাক্তার</option>
                          <option value="free_doctors">🎁 ফ্রি ডাক্তার ও ক্যাম্প</option>
                          <option value="maternity_donation">🤰 মাতৃত্বকালীন সিজার অনুদান</option>
                          <option value="donation">🤲 ডোনেশন ফান্ড</option>
                          <option value="hospitals">🏥 হাসপাতাল লিস্ট</option>
                          <option value="dental">🦷 ডেন্টাল চেম্বার</option>
                          <option value="labtests">🧪 ল্যাব টেস্ট</option>
                          <option value="emergency">🚨 জরুরি SOS</option>
                        </select>
                      </div>
                    )}

                    {editingSlide.actionType === 'hospital' && (
                      <div>
                        <label className="text-[10px] font-bold text-slate-300 block mb-1">কোন হাসপাতাল?</label>
                        <select
                          value={editingSlide.actionTarget || (hospitals[0]?.id || '')}
                          onChange={(e) => setEditingSlide({ ...editingSlide, actionTarget: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs"
                        >
                          {hospitals.map(h => (
                            <option key={h.id} value={h.id}>{h.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {editingSlide.actionType === 'link' && (
                      <div>
                        <label className="text-[10px] font-bold text-slate-300 block mb-1">ওয়েব লিংক (URL)</label>
                        <input 
                          type="text" 
                          placeholder="https://..." 
                          value={editingSlide.actionTarget || ''}
                          onChange={(e) => setEditingSlide({ ...editingSlide, actionTarget: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs"
                        />
                      </div>
                    )}

                    <div>
                      <label className="text-[10px] font-bold text-slate-300 block mb-1">বাটনের লেখা (Button Text)</label>
                      <input 
                        type="text" 
                        placeholder="যেমন: বিস্তারিত দেখুন" 
                        value={editingSlide.buttonText || ''}
                        onChange={(e) => setEditingSlide({ ...editingSlide, buttonText: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  {/* Active Toggle & Submit */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={editingSlide.isActive} 
                        onChange={(e) => setEditingSlide({ ...editingSlide, isActive: e.target.checked })}
                        className="w-4 h-4 rounded text-emerald-600 bg-slate-800 border-slate-700"
                      />
                      <span className="text-xs font-bold text-slate-300">এই স্লাইডটি ওয়েবসাইটে সক্রিয় থাকবে</span>
                    </label>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSlide(null);
                          setIsCreatingNew(false);
                        }}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                      >
                        বাতিল
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-lg shadow-emerald-900/30"
                      >
                        <Save size={14} />
                        <span>{saving ? 'সেভ হচ্ছে...' : 'স্লাইড সংরক্ষণ করুন'}</span>
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
