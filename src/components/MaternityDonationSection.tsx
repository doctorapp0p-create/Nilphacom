import React, { useState, useEffect, useMemo } from 'react';
import { Heart, Baby, ShieldCheck, CheckCircle2, Clock, AlertCircle, FileText, Check, X, Sparkles, Send, Copy, ArrowRight, RefreshCw, Phone, MapPin, User, Calendar, DollarSign, Building2, Search, Filter, HelpCircle, ExternalLink, Camera, Image as ImageIcon, Eye, ZoomIn, Download, Upload, Trash2, CheckCircle } from 'lucide-react';
import { db } from '../../services/firebase';
import { doc, getDoc, setDoc, collection, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
import { MaternityDonationSettings, MaternityDonationApplication, Profile } from '../../types';

const DEFAULT_SETTINGS: MaternityDonationSettings = {
  enabled: true,
  monthlyGrantLimit: 15,
  grantedCountThisMonth: 3,
  grantAmount: 2000,
  contactHotline: '01352669100',
  customNotice: 'গরিব ও অসচ্ছল পরিবারের গর্ভবতী মায়েদের নিরাপদ সিজার ডেলিভারির সহায়তায় nilpha.com এর বিশেষ ২০০০ টাকা আর্থিক অনুদান প্রকল্প।',
  rulesAndGuidelines: [
    'আবেদনকারী পরিবারকে প্রকৃত অর্থেই আর্থিকভাবে অসচ্ছল ও দরিদ্র হতে হবে (কম আয়ের পরিবার, দিনমজুর, প্রান্তিক কৃষক ইত্যাদি)।',
    'বাধ্যতামূলক: গর্ভবতী মা (স্ত্রী) এবং তার স্বামীর ১ কপি করে স্পষ্ট রঙিন ছবি আপলোড করতে হবে।',
    'বাধ্যতামূলক: স্বামী এবং স্ত্রী উভয়ের ভোটার আইডি (NID) কার্ডের সামনের ও পেছনের অংশের স্পষ্ট ছবি আপলোড করতে হবে।',
    'অবশ্যই nilpha.com প্ল্যাটফর্মের মাধ্যমে নিবন্ধিত বা নির্দেশিত গাইনী ও প্রসূতি বিশেষজ্ঞ ডাক্তারের পরামর্শ/প্রেসক্রিপশন থাকতে হবে।',
    'গর্ভবতী মায়ের সম্ভাব্য সিজার বা ডেলিভারির তারিখ ও হাসপাতালের সঠিক বিবরণ প্রদান করতে হবে।',
    'টাকা পাওয়ার জন্য সঠিক ও সচল বিকাশ (bKash) বা নগদ (Nagad) ব্যক্তিগত মোবাইল নম্বর দিতে হবে।',
    'প্রতি মাসে নির্ধারিত সীমিত কোটায় আবেদন ও ডকুমেন্টস পুঙ্খানুপুঙ্খ যাচাইপূর্বক শুধুমাত্র এডমিন কর্তৃক অনুমোদিত (Accepted) হলেই ২০০০ টাকা অনুদান প্রদান করা হবে।',
    'ভুল, অস্পষ্ট বা ভুয়া তথ্য ও ছবি প্রদান করলে আবেদন সরাসরি বাতিল (Denied) বলে গণ্য হবে।'
  ]
};

interface MaternityDonationSectionProps {
  profile: Profile | null;
  isAdmin?: boolean;
  whatsappNumber?: string;
  hotline?: string;
  onOpenDoctorBooking?: () => void;
  onNavigateToDonation?: () => void;
}

// Compress and read image to lightweight Base64
const compressAndReadImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      alert('অনুগ্রহ করে শুধুমাত্র ছবি ফাইল (JPG, PNG, JPEG) আপলোড করুন।');
      reject(new Error('Invalid file type'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIMENSION = 900;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIMENSION) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          }
        } else {
          if (height > MAX_DIMENSION) {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(dataUrl);
        } else {
          resolve(readerEvent.target?.result as string);
        }
      };
      img.onerror = () => reject(new Error('Failed to parse image'));
      img.src = readerEvent.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const MaternityDonationSection: React.FC<MaternityDonationSectionProps> = ({
  profile,
  isAdmin = false,
  whatsappNumber,
  hotline,
  onOpenDoctorBooking,
  onNavigateToDonation
}) => {
  const activeHotline = hotline || whatsappNumber || '8801352669100';
  const [settings, setSettings] = useState<MaternityDonationSettings>(DEFAULT_SETTINGS);
  const [applications, setApplications] = useState<MaternityDonationApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedApp, setSubmittedApp] = useState<MaternityDonationApplication | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Lightbox / Image Zoom Modal
  const [previewModalDoc, setPreviewModalDoc] = useState<{ url: string; title: string; applicantName?: string } | null>(null);

  // Form Fields
  const [applicantName, setApplicantName] = useState(profile?.full_name || '');
  const [husbandOrGuardianName, setHusbandOrGuardianName] = useState('');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [altPhone, setAltPhone] = useState('');
  const [district, setDistrict] = useState('নীলফামারী');
  const [upazilaOrArea, setUpazilaOrArea] = useState('');
  const [fullAddress, setFullAddress] = useState(profile?.address || '');
  const [familyMonthlyIncome, setFamilyMonthlyIncome] = useState('৫,০০০ টাকার নিচে');
  const [occupation, setOccupation] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [nilphaDoctorConsulted, setNilphaDoctorConsulted] = useState('');
  const [prescriptionDetailsOrSlip, setPrescriptionDetailsOrSlip] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad'>('bkash');
  const [payoutNumber, setPayoutNumber] = useState(profile?.phone || '');
  const [reasonForAssistance, setReasonForAssistance] = useState('');

  // NID Numbers State
  const [wifeNidNumber, setWifeNidNumber] = useState<string>('');
  const [husbandNidNumber, setHusbandNidNumber] = useState<string>('');

  // Required Document Upload States (6 mandatory/strongly recommended items)
  const [wifePhotoUrl, setWifePhotoUrl] = useState<string>('');
  const [husbandPhotoUrl, setHusbandPhotoUrl] = useState<string>('');
  const [wifeNidFrontUrl, setWifeNidFrontUrl] = useState<string>('');
  const [wifeNidBackUrl, setWifeNidBackUrl] = useState<string>('');
  const [husbandNidFrontUrl, setHusbandNidFrontUrl] = useState<string>('');
  const [husbandNidBackUrl, setHusbandNidBackUrl] = useState<string>('');
  const [uploadingDocKey, setUploadingDocKey] = useState<string | null>(null);

  // Admin States
  const [adminSaving, setAdminSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'completed'>('all');
  const [adminSearch, setAdminSearch] = useState('');
  const [rejectingAppId, setRejectingAppId] = useState<string | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'apply' | 'my_status' | 'admin_settings'>('overview');

  useEffect(() => {
    fetchSettingsAndApplications();
  }, []);

  useEffect(() => {
    if (profile?.full_name && !applicantName) setApplicantName(profile.full_name);
    if (profile?.phone && !phone) setPhone(profile.phone);
    if (profile?.phone && !payoutNumber) setPayoutNumber(profile.phone);
    if (profile?.address && !fullAddress) setFullAddress(profile.address);
  }, [profile]);

  const fetchSettingsAndApplications = async () => {
    setLoading(true);
    try {
      // Fetch Settings
      const settingsRef = doc(db, 'settings', 'maternity_donation_config');
      const settingsSnap = await getDoc(settingsRef);
      if (settingsSnap.exists()) {
        setSettings({ ...DEFAULT_SETTINGS, ...settingsSnap.data() as MaternityDonationSettings });
      } else {
        await setDoc(settingsRef, DEFAULT_SETTINGS);
        setSettings(DEFAULT_SETTINGS);
      }

      // Fetch Applications
      const appsRef = collection(db, 'maternity_donations');
      const appsSnap = await getDocs(appsRef);
      const list: MaternityDonationApplication[] = appsSnap.docs.map(d => ({
        id: d.id,
        ...d.data()
      } as MaternityDonationApplication));
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setApplications(list);
    } catch (err) {
      console.error('Error fetching maternity donation data:', err);
    } finally {
      setLoading(false);
    }
  };

  const remainingQuota = Math.max(0, settings.monthlyGrantLimit - settings.grantedCountThisMonth);
  const isAvailable = settings.enabled && remainingQuota > 0;

  // Filtered Applications for Admin
  const filteredApps = useMemo(() => {
    return applications.filter(app => {
      if (statusFilter !== 'all' && app.status !== statusFilter) return false;
      if (adminSearch.trim()) {
        const q = adminSearch.toLowerCase().trim();
        return (
          app.applicantName.toLowerCase().includes(q) ||
          app.husbandOrGuardianName.toLowerCase().includes(q) ||
          (app.wifeNidNumber && app.wifeNidNumber.toLowerCase().includes(q)) ||
          (app.husbandNidNumber && app.husbandNidNumber.toLowerCase().includes(q)) ||
          app.phone.includes(q) ||
          app.payoutNumber.includes(q) ||
          app.applicationCode.toLowerCase().includes(q) ||
          app.district.toLowerCase().includes(q) ||
          app.hospitalName.toLowerCase().includes(q) ||
          app.nilphaDoctorConsulted.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [applications, statusFilter, adminSearch]);

  // User's own applications
  const userApplications = useMemo(() => {
    if (!profile && !phone) return [];
    return applications.filter(app => 
      (profile?.id && app.userId === profile.id) || 
      (profile?.phone && app.phone === profile.phone) ||
      (phone && app.phone === phone)
    );
  }, [applications, profile, phone]);

  // Handle Document File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDocKey(key);
    try {
      const compressedDataUrl = await compressAndReadImage(file);
      switch (key) {
        case 'wifePhoto':
          setWifePhotoUrl(compressedDataUrl);
          break;
        case 'husbandPhoto':
          setHusbandPhotoUrl(compressedDataUrl);
          break;
        case 'wifeNidFront':
          setWifeNidFrontUrl(compressedDataUrl);
          break;
        case 'wifeNidBack':
          setWifeNidBackUrl(compressedDataUrl);
          break;
        case 'husbandNidFront':
          setHusbandNidFrontUrl(compressedDataUrl);
          break;
        case 'husbandNidBack':
          setHusbandNidBackUrl(compressedDataUrl);
          break;
        default:
          break;
      }
    } catch (err) {
      console.error('Image upload failed:', err);
      alert('ছবি আপলোড করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setUploadingDocKey(null);
    }
  };

  // Submit Application Form
  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantName.trim() || !phone.trim() || !husbandOrGuardianName.trim() || !payoutNumber.trim()) {
      alert('দয়া করে গর্ভবতী মায়ের নাম, অভিভাবকের নাম, মোবাইল নম্বর এবং বিকাশ/নগদ নম্বর সঠিকভাবে পূরণ করুন।');
      return;
    }

    if (!nilphaDoctorConsulted.trim()) {
      alert('দয়া করে nilpha.com এর কোন ডাক্তারের পরামর্শ নিয়েছেন বা কার অধীনে আছেন তার নাম উল্লেখ করুন।');
      return;
    }

    if (!wifeNidNumber.trim() || !husbandNidNumber.trim()) {
      alert('⚠️ জরুরি: গর্ভবতী মা (স্ত্রী) এবং স্বামী উভয়ের ভোটার আইডি (NID) নম্বর প্রদান করা আবশ্যক।');
      return;
    }

    // Document Validation
    if (!wifePhotoUrl || !husbandPhotoUrl) {
      alert('⚠️ জরুরি: আবেদনটি বিবেচনার জন্য গর্ভবতী মা (স্ত্রী) এবং তার স্বামীর ১ কপি করে রঙিন ছবি আপলোড করা আবশ্যক।');
      return;
    }

    if (!wifeNidFrontUrl || !wifeNidBackUrl) {
      alert('⚠️ জরুরি: গর্ভবতী মা (স্ত্রী)-এর জাতীয় পরিচয়পত্র (NID)-এর সামনের এবং পেছনের উভয় অংশের ছবি আপলোড করা আবশ্যক।');
      return;
    }

    if (!husbandNidFrontUrl || !husbandNidBackUrl) {
      alert('⚠️ জরুরি: স্বামীর জাতীয় পরিচয়পত্র (NID)-এর সামনের এবং পেছনের উভয় অংশের ছবি আপলোড করা আবশ্যক।');
      return;
    }

    setSubmitting(true);
    try {
      const randomCode = Math.floor(1000 + Math.random() * 9000);
      const appCode = `MAT-2000-${randomCode}`;

      const newApp: MaternityDonationApplication = {
        id: `mat_${Date.now()}`,
        applicationCode: appCode,
        applicantName: applicantName.trim(),
        husbandOrGuardianName: husbandOrGuardianName.trim(),
        wifeNidNumber: wifeNidNumber.trim(),
        husbandNidNumber: husbandNidNumber.trim(),
        phone: phone.trim(),
        altPhone: altPhone.trim() || undefined,
        district: district.trim(),
        upazilaOrArea: upazilaOrArea.trim(),
        fullAddress: fullAddress.trim(),
        familyMonthlyIncome: familyMonthlyIncome.trim(),
        occupation: occupation.trim() || 'দিনমজুর / নিম্ন আয়',
        expectedDeliveryDate: expectedDeliveryDate.trim() || 'জরুরি / চলতি মাস',
        hospitalName: hospitalName.trim() || 'জেলা সদর হাসপাতাল / ডায়াগনস্টিক ক্লিনিক',
        nilphaDoctorConsulted: nilphaDoctorConsulted.trim(),
        prescriptionDetailsOrSlip: prescriptionDetailsOrSlip.trim() || undefined,
        paymentMethod,
        payoutNumber: payoutNumber.trim(),
        reasonForAssistance: reasonForAssistance.trim() || 'সিজারের অপারেশন খরচ বহনে অসচ্ছলতা',
        grantAmount: settings.grantAmount || 2000,
        wifePhotoUrl,
        husbandPhotoUrl,
        wifeNidFrontUrl,
        wifeNidBackUrl,
        husbandNidFrontUrl,
        husbandNidBackUrl,
        status: 'pending',
        userId: profile?.id || undefined,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'maternity_donations', newApp.id), newApp);
      setApplications(prev => [newApp, ...prev]);
      setSubmittedApp(newApp);
      setShowApplyModal(false);

      // Reset document states
      setWifeNidNumber('');
      setHusbandNidNumber('');
      setWifePhotoUrl('');
      setHusbandPhotoUrl('');
      setWifeNidFrontUrl('');
      setWifeNidBackUrl('');
      setHusbandNidFrontUrl('');
      setHusbandNidBackUrl('');
    } catch (err) {
      console.error('Error submitting maternity application:', err);
      alert('আবেদন জমা দেওয়ার সময় ত্রুটি হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setSubmitting(false);
    }
  };

  // Admin Actions
  const handleUpdateAppStatus = async (appId: string, newStatus: 'approved' | 'rejected' | 'completed', rejectionReason?: string) => {
    try {
      const appRef = doc(db, 'maternity_donations', appId);
      const updateData: Partial<MaternityDonationApplication> = {
        status: newStatus,
        updatedAt: new Date().toISOString()
      };

      if (newStatus === 'approved') {
        updateData.approvedAt = new Date().toISOString();
        // Increment granted count
        const newCount = settings.grantedCountThisMonth + 1;
        const newSettings = { ...settings, grantedCountThisMonth: newCount };
        await setDoc(doc(db, 'settings', 'maternity_donation_config'), newSettings, { merge: true });
        setSettings(newSettings);
      } else if (newStatus === 'rejected') {
        updateData.rejectionReason = rejectionReason || 'তথ্য বা ডকুমেন্টস যাচাইয়ে অসঙ্গতি অথবা কোটা পূর্ণ';
      }

      await updateDoc(appRef, updateData as any);
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, ...updateData } : a));
      setRejectingAppId(null);
      setRejectReasonInput('');
      alert(`✓ আবেদনের স্ট্যাটাস সফলভাবে "${newStatus === 'approved' ? 'একসেপ্ট (Approved)' : newStatus === 'rejected' ? 'ডিনাই (Rejected)' : 'পরিশোধ সম্পন্ন (Completed)'}" করা হয়েছে!`);
    } catch (err) {
      console.error('Error updating application status:', err);
      alert('স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে।');
    }
  };

  // Admin Delete Application
  const handleDeleteApp = async (appId: string) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই আবেদনটি মুছে ফেলতে চান?')) return;
    try {
      await deleteDoc(doc(db, 'maternity_donations', appId));
      setApplications(prev => prev.filter(a => a.id !== appId));
    } catch (err) {
      console.error('Error deleting application:', err);
      alert('মুছতে সমস্যা হয়েছে।');
    }
  };

  // Save Admin Settings
  const handleSaveAdminSettings = async () => {
    setAdminSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'maternity_donation_config'), settings, { merge: true });
      alert('✓ মাতৃত্বকালীন অনুদান সেটিংস ও মাসিক কোটা সফলভাবে আপডেট করা হয়েছে!');
    } catch (err) {
      console.error('Error saving settings:', err);
      alert('সেটিংস সেভ করতে সমস্যা হয়েছে।');
    } finally {
      setAdminSaving(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-r from-pink-700 via-rose-700 to-purple-900 text-white p-6 sm:p-8 rounded-[32px] shadow-2xl relative overflow-hidden space-y-4 border border-rose-400/20">
        <div className="absolute right-3 -bottom-6 opacity-15 pointer-events-none">
          <Baby size={160} />
        </div>

        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-rose-100 border border-white/20">
            <Sparkles size={12} className="text-amber-300" />
            <span>nilpha.com সামাজিক স্বাস্থ্য সহায়তা উদ্যোগ</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
            গরিব গর্ভবতী মায়েদের সিজারের জন্য <span className="text-amber-300 underline decoration-amber-400/60 decoration-2">৳২,০০০ টাকা</span> অনুদান
          </h2>

          <p className="text-xs sm:text-sm font-bold text-rose-100/90 leading-relaxed">
            আর্থিকভাবে অসচ্ছল ও দরিদ্র গর্ভবতী মায়েদের নিরাপদ ডেলিভারি ও সিজার অপারেশনের খরচে সহায়তার জন্য nilpha.com প্রতি মাসে নির্ধারিত সংখ্যক মাকে ২,০০০ টাকা অনুদান প্রদান করবে।
          </p>
        </div>

        {/* Live Monthly Quota Counter & Stats */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/20">
            <span className="text-[9px] font-black text-rose-200 uppercase tracking-wider block">অনুদান পরিমাণ</span>
            <span className="text-lg font-black text-amber-300 mt-0.5 block">৳{settings.grantAmount || 2000} BDT</span>
            <span className="text-[8px] text-rose-200">বিকাশ / নগদে সরাসরি</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/20">
            <span className="text-[9px] font-black text-rose-200 uppercase tracking-wider block">এই মাসের মোট কোটা</span>
            <span className="text-lg font-black text-white mt-0.5 block">{settings.monthlyGrantLimit} জন মা</span>
            <span className="text-[8px] text-rose-200">এডমিন নির্ধারিত বাজেট</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/20">
            <span className="text-[9px] font-black text-rose-200 uppercase tracking-wider block">অনুমোদিত দেওয়া হয়েছে</span>
            <span className="text-lg font-black text-emerald-300 mt-0.5 block">{settings.grantedCountThisMonth} জন</span>
            <span className="text-[8px] text-emerald-200">চলতি মাসের একসেপ্টেড</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/20">
            <span className="text-[9px] font-black text-rose-200 uppercase tracking-wider block">অবশিষ্ট খালি কোটা</span>
            <span className="text-lg font-black text-amber-400 mt-0.5 block">{remainingQuota} জন</span>
            <span className="text-[8px] text-amber-200">{remainingQuota > 0 ? 'আবেদন গ্রহণ চলছে ✓' : 'এই মাসের কোটা পূর্ণ'}</span>
          </div>
        </div>

        {/* Action Button Bar */}
        <div className="relative z-10 pt-2 flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowApplyModal(true)}
            className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-2xl shadow-xl shadow-amber-400/20 active:scale-95 transition-all flex items-center gap-2"
          >
            <Heart size={16} className="text-rose-600 fill-rose-600" />
            <span>অনুদান পেতে আবেদন করুন (Apply for ৳2000)</span>
            <ArrowRight size={14} />
          </button>

          {onNavigateToDonation && (
            <button
              onClick={onNavigateToDonation}
              className="px-5 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs rounded-2xl shadow-lg shadow-amber-500/30 flex items-center gap-1.5 transition-all active:scale-95"
            >
              <span>🤲 গর্ভবতী মায়েদের জন্য ডোনেট করুন</span>
              <Heart size={14} className="fill-slate-950" />
            </button>
          )}

          <a
            href={`https://wa.me/88${whatsappNumber}?text=${encodeURIComponent('Hello nilpha.com, I want to know about the 2000 BDT Maternity C-Section Donation program.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-3 bg-white/20 hover:bg-white/30 text-white font-bold text-xs rounded-2xl backdrop-blur-md border border-white/30 transition-all flex items-center gap-1.5"
          >
            <span>💬 WhatsApp সহায়তা</span>
          </a>

          {userApplications.length > 0 && (
            <button
              onClick={() => setActiveTab('my_status')}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 text-rose-100 font-bold text-xs rounded-2xl border border-white/20 transition-all"
            >
              📋 আমার আবেদনের স্ট্যাটাস ({userApplications.length}টি)
            </button>
          )}
        </div>
      </div>

      {/* Rules & Eligibility Guidelines Box */}
      <div className="bg-white p-6 rounded-[28px] border border-rose-100 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 text-rose-700">
          <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center">
            <ShieldCheck size={18} className="text-rose-600" />
          </div>
          <div>
            <h3 className="font-black text-sm text-slate-800 uppercase tracking-tight">
              ২,০০০ টাকা অনুদান পাওয়ার নিয়মাবলী ও শর্তাবলী (Eligibility Rules)
            </h3>
            <p className="text-[11px] font-bold text-slate-500">
              সঠিকভাবে আবেদন করার পূর্বে নিচের নির্দেশনাসমূহ ভালো করে পড়ে নিন:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {(settings.rulesAndGuidelines || DEFAULT_SETTINGS.rulesAndGuidelines!).map((rule, idx) => (
            <div key={idx} className="flex items-start gap-2.5 bg-rose-50/50 p-3 rounded-2xl border border-rose-100/60">
              <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <p className="text-xs font-bold text-slate-700 leading-relaxed">
                {rule}
              </p>
            </div>
          ))}
        </div>

        {/* Required Documents Highlight Banner */}
        <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-black text-amber-950 flex items-center gap-1.5">
              <span>📸</span> প্রয়োজনীয় বাধ্যতামূলক ডকুমেন্টস ও ছবি
            </p>
            <p className="text-[11px] font-bold text-amber-800 leading-relaxed">
              আবেদনের সময় <b>গর্ভবতী মা (স্ত্রী) ও তার স্বামীর ১ কপি করে ছবি</b> এবং <b>উভয়ের ভোটার আইডি (NID) কার্ডের সামনের ও পেছনের অংশের স্পষ্ট ছবি</b> আপলোড করতে হবে।
            </p>
          </div>
          <button
            onClick={() => setShowApplyModal(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-sm shrink-0 transition-all"
          >
            এখনই আবেদন করুন
          </button>
        </div>

        {/* Doctor Consultation Notice & CTA */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <p className="text-xs font-black text-blue-900 flex items-center gap-1.5">
              <span>🩺</span> nilpha.com ডাক্তারের পরামর্শ আবশ্যক
            </p>
            <p className="text-[11px] font-bold text-slate-600">
              অনুদান মঞ্জুর হওয়ার জন্য অবশ্যই nilpha.com এর মাধ্যমে তালিকাভুক্ত ডাক্তারের পরামর্শ নেওয়া থাকতে হবে।
            </p>
          </div>
          {onOpenDoctorBooking && (
            <button
              onClick={onOpenDoctorBooking}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md shrink-0 transition-all"
            >
              গাইনী ডক্টরের সিরিয়াল দিন
            </button>
          )}
        </div>
      </div>

      {/* User's Submitted Applications (If Any) */}
      {userApplications.length > 0 && (
        <div className="bg-white p-6 rounded-[28px] border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="font-black text-sm text-slate-800 flex items-center gap-2">
            <span>📋</span> আপনার আবেদনসমূহের বর্তমান স্ট্যাটাস ও ডকুমেন্টস ({userApplications.length}টি)
          </h3>
          <div className="space-y-4">
            {userApplications.map(app => (
              <div key={app.id} className="p-4 sm:p-5 rounded-2xl border border-slate-100 bg-slate-50 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                        {app.applicationCode}
                      </span>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                        app.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                        app.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                        app.status === 'completed' ? 'bg-purple-100 text-purple-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {app.status === 'approved' ? '✓ একসেপ্টেড (অনুমোদিত)' :
                         app.status === 'rejected' ? '✕ বাতিল (Denied)' :
                         app.status === 'completed' ? '✓ ২০০০ টাকা বিকাশ/নগদে পাঠানো হয়েছে' :
                         '⏳ যাচাইকরণ প্রক্রিয়াধীন (Pending Review)'}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-800">{app.applicantName} (স্বামী: {app.husbandOrGuardianName})</p>
                    {(app.wifeNidNumber || app.husbandNidNumber) && (
                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        {app.wifeNidNumber && (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                            <span>🪪 স্ত্রী NID:</span>
                            <span className="font-mono font-black">{app.wifeNidNumber}</span>
                          </span>
                        )}
                        {app.husbandNidNumber && (
                          <span className="text-[10px] font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200 flex items-center gap-1">
                            <span>🪪 স্বামী NID:</span>
                            <span className="font-mono font-black">{app.husbandNidNumber}</span>
                          </span>
                        )}
                      </div>
                    )}
                    <p className="text-[10px] text-slate-500 font-bold">হাসপাতাল: {app.hospitalName} | ডাক্তার: {app.nilphaDoctorConsulted}</p>
                    {app.rejectionReason && app.status === 'rejected' && (
                      <p className="text-[10px] font-bold text-rose-600 bg-rose-50 p-2 rounded-xl border border-rose-100 mt-1">
                        বাতিলের কারণ: {app.rejectionReason}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-black text-rose-600 block">৳{app.grantAmount}</span>
                    <span className="text-[10px] font-mono text-slate-400 block">{app.paymentMethod.toUpperCase()}: {app.payoutNumber}</span>
                  </div>
                </div>

                {/* Uploaded Documents Thumbnails */}
                {(app.wifePhotoUrl || app.husbandPhotoUrl || app.wifeNidFrontUrl || app.husbandNidFrontUrl) && (
                  <div className="pt-2 border-t border-slate-200/60 space-y-1.5">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider block">
                      সংযুক্ত ছবি ও ভোটার আইডি কার্ড:
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {app.wifePhotoUrl && (
                        <div
                          onClick={() => setPreviewModalDoc({ url: app.wifePhotoUrl!, title: 'স্ত্রীর ১ কপি ছবি', applicantName: app.applicantName })}
                          className="group relative cursor-pointer aspect-square rounded-xl overflow-hidden border border-slate-200 bg-white hover:shadow-md transition-all"
                        >
                          <img src={app.wifePhotoUrl} alt="Wife Photo" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <span className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-[8px] font-black text-white text-center py-0.5 truncate">
                            স্ত্রীর ছবি
                          </span>
                        </div>
                      )}

                      {app.husbandPhotoUrl && (
                        <div
                          onClick={() => setPreviewModalDoc({ url: app.husbandPhotoUrl!, title: 'স্বামীর ১ কপি ছবি', applicantName: app.applicantName })}
                          className="group relative cursor-pointer aspect-square rounded-xl overflow-hidden border border-slate-200 bg-white hover:shadow-md transition-all"
                        >
                          <img src={app.husbandPhotoUrl} alt="Husband Photo" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <span className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-[8px] font-black text-white text-center py-0.5 truncate">
                            স্বামীর ছবি
                          </span>
                        </div>
                      )}

                      {app.wifeNidFrontUrl && (
                        <div
                          onClick={() => setPreviewModalDoc({ url: app.wifeNidFrontUrl!, title: 'স্ত্রীর NID (সামনের অংশ)', applicantName: app.applicantName })}
                          className="group relative cursor-pointer aspect-square rounded-xl overflow-hidden border border-slate-200 bg-white hover:shadow-md transition-all"
                        >
                          <img src={app.wifeNidFrontUrl} alt="Wife NID Front" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <span className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-[8px] font-black text-white text-center py-0.5 truncate">
                            স্ত্রী NID (সামনে)
                          </span>
                        </div>
                      )}

                      {app.wifeNidBackUrl && (
                        <div
                          onClick={() => setPreviewModalDoc({ url: app.wifeNidBackUrl!, title: 'স্ত্রীর NID (পেছনের অংশ)', applicantName: app.applicantName })}
                          className="group relative cursor-pointer aspect-square rounded-xl overflow-hidden border border-slate-200 bg-white hover:shadow-md transition-all"
                        >
                          <img src={app.wifeNidBackUrl} alt="Wife NID Back" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <span className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-[8px] font-black text-white text-center py-0.5 truncate">
                            স্ত্রী NID (পেছনে)
                          </span>
                        </div>
                      )}

                      {app.husbandNidFrontUrl && (
                        <div
                          onClick={() => setPreviewModalDoc({ url: app.husbandNidFrontUrl!, title: 'স্বামীর NID (সামনের অংশ)', applicantName: app.applicantName })}
                          className="group relative cursor-pointer aspect-square rounded-xl overflow-hidden border border-slate-200 bg-white hover:shadow-md transition-all"
                        >
                          <img src={app.husbandNidFrontUrl} alt="Husband NID Front" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <span className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-[8px] font-black text-white text-center py-0.5 truncate">
                            স্বামী NID (সামনে)
                          </span>
                        </div>
                      )}

                      {app.husbandNidBackUrl && (
                        <div
                          onClick={() => setPreviewModalDoc({ url: app.husbandNidBackUrl!, title: 'স্বামীর NID (পেছনের অংশ)', applicantName: app.applicantName })}
                          className="group relative cursor-pointer aspect-square rounded-xl overflow-hidden border border-slate-200 bg-white hover:shadow-md transition-all"
                        >
                          <img src={app.husbandNidBackUrl} alt="Husband NID Back" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <span className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-[8px] font-black text-white text-center py-0.5 truncate">
                            স্বামী NID (পেছনে)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin Management Section */}
      {isAdmin && (
        <div className="bg-slate-900 text-white p-6 sm:p-7 rounded-[32px] shadow-2xl border border-slate-800 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <span className="bg-rose-600 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-1 inline-block">
                এডমিন কন্ট্রোল প্যানেল
              </span>
              <h3 className="font-black text-base text-white flex items-center gap-2">
                <span>⚙️</span> মাতৃত্বকালীন সিজার ২০০০ টাকা অনুদান কন্ট্রোল ও আবেদন তালিকা
              </h3>
            </div>
            <button
              onClick={handleSaveAdminSettings}
              disabled={adminSaving}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
            >
              {adminSaving ? <RefreshCw size={12} className="animate-spin" /> : <SaveIcon />}
              <span>সেটিংস সংরক্ষণ করুন</span>
            </button>
          </div>

          {/* Admin Quota & Config Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
            <div>
              <label className="text-[11px] font-black text-slate-300 block mb-1">
                মাসে কয়জন গর্ভবতী মা টাকা পাবেন (মাসিক কোটা):
              </label>
              <input
                type="number"
                min="1"
                max="500"
                value={settings.monthlyGrantLimit}
                onChange={e => setSettings({ ...settings, monthlyGrantLimit: parseInt(e.target.value) || 1 })}
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none focus:border-rose-500"
              />
              <span className="text-[9px] text-slate-400 mt-1 block">বাজেট অনুযায়ী প্রতি মাসের সর্বোচ্চ লিমিট</span>
            </div>

            <div>
              <label className="text-[11px] font-black text-slate-300 block mb-1">
                চলতি মাসে প্রদত্ত/অনুমোদিত সংখ্যা:
              </label>
              <input
                type="number"
                min="0"
                value={settings.grantedCountThisMonth}
                onChange={e => setSettings({ ...settings, grantedCountThisMonth: parseInt(e.target.value) || 0 })}
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none focus:border-rose-500"
              />
              <span className="text-[9px] text-slate-400 mt-1 block">নতুন মাস এলে রিসেট করতে পারেন</span>
            </div>

            <div>
              <label className="text-[11px] font-black text-slate-300 block mb-1">
                অনুদান পরিমাণ (টাকা):
              </label>
              <input
                type="number"
                value={settings.grantAmount || 2000}
                onChange={e => setSettings({ ...settings, grantAmount: parseInt(e.target.value) || 2000 })}
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none focus:border-rose-500"
              />
              <span className="text-[9px] text-slate-400 mt-1 block">ডিফল্ট: ২০০০ টাকা</span>
            </div>
          </div>

          {/* Applications Table / Filter Toolbar */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {[
                  { id: 'all', label: `সকল আবেদন (${applications.length})` },
                  { id: 'pending', label: `⏳ পেন্ডিং (${applications.filter(a => a.status === 'pending').length})` },
                  { id: 'approved', label: `✓ একসেপ্টেড (${applications.filter(a => a.status === 'approved').length})` },
                  { id: 'completed', label: `💰 পরিশোধিত (${applications.filter(a => a.status === 'completed').length})` },
                  { id: 'rejected', label: `✕ বাতিল (${applications.filter(a => a.status === 'rejected').length})` }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black whitespace-nowrap transition-all ${
                      statusFilter === tab.id
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  value={adminSearch}
                  onChange={e => setAdminSearch(e.target.value)}
                  placeholder="নাম, মোবাইল বা কোড খুঁজুন..."
                  className="pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-bold outline-none focus:border-rose-500 w-full sm:w-56"
                />
              </div>
            </div>

            {/* List of Applications */}
            {filteredApps.length === 0 ? (
              <div className="p-8 text-center bg-slate-800/50 rounded-2xl text-slate-400 font-bold text-xs">
                কোনো আবেদন পাওয়া যায়নি।
              </div>
            ) : (
              <div className="space-y-4">
                {filteredApps.map(app => (
                  <div key={app.id} className="bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-700 space-y-4 text-left">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-700/60 pb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-black text-rose-400 bg-rose-950/80 px-2.5 py-0.5 rounded-md border border-rose-800/60">
                            {app.applicationCode}
                          </span>
                          <span className="text-sm font-black text-white">
                            {app.applicantName}
                          </span>
                          <span className="text-xs text-slate-400 font-bold">
                            (স্বামী/অভিভাবক: {app.husbandOrGuardianName})
                          </span>
                        </div>
                        {/* NID Numbers Badges */}
                        {(app.wifeNidNumber || app.husbandNidNumber) && (
                          <div className="flex flex-wrap items-center gap-2 mt-1.5">
                            {app.wifeNidNumber && (
                              <div className="bg-emerald-950/80 border border-emerald-700/80 px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-[11px]">
                                <span className="text-emerald-400 font-bold">👩 স্ত্রীর NID:</span>
                                <span className="font-mono font-black text-emerald-200">{app.wifeNidNumber}</span>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(app.wifeNidNumber!, `wife_nid_${app.id}`)}
                                  className="text-emerald-400 hover:text-emerald-200 p-0.5"
                                  title="স্ত্রীর NID কপি করুন"
                                >
                                  <Copy size={11} />
                                </button>
                                {copiedId === `wife_nid_${app.id}` && <span className="text-[9px] text-emerald-300 font-bold">কপি!</span>}
                              </div>
                            )}
                            {app.husbandNidNumber && (
                              <div className="bg-indigo-950/80 border border-indigo-700/80 px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-[11px]">
                                <span className="text-indigo-400 font-bold">👨 স্বামীর NID:</span>
                                <span className="font-mono font-black text-indigo-200">{app.husbandNidNumber}</span>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(app.husbandNidNumber!, `husband_nid_${app.id}`)}
                                  className="text-indigo-400 hover:text-indigo-200 p-0.5"
                                  title="স্বামীর NID কপি করুন"
                                >
                                  <Copy size={11} />
                                </button>
                                {copiedId === `husband_nid_${app.id}` && <span className="text-[9px] text-indigo-300 font-bold">কপি!</span>}
                              </div>
                            )}
                          </div>
                        )}
                        <p className="text-[11px] text-slate-400 font-bold mt-1">
                          📍 {app.fullAddress}, {app.upazilaOrArea}, {app.district} | 📅 আবেদন: {new Date(app.createdAt).toLocaleDateString('bn-BD')}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                          app.status === 'approved' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                          app.status === 'rejected' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                          app.status === 'completed' ? 'bg-purple-950 text-purple-400 border border-purple-800' :
                          'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}>
                          {app.status === 'approved' ? '✓ একসেপ্টেড (অনুমোদিত)' :
                           app.status === 'rejected' ? '✕ ডিনাই (বাতিল)' :
                           app.status === 'completed' ? '✓ টাকা পরিশোধিত' :
                           '⏳ পেন্ডিং (যাচাই প্রয়োজন)'}
                        </span>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-900/60 p-3 rounded-xl border border-slate-700/50">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">পারিবারিক অবস্থা ও আয়:</span>
                        <span className="font-black text-white">{app.familyMonthlyIncome} ({app.occupation})</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">ডেলিভারি তারিখ ও হাসপাতাল:</span>
                        <span className="font-black text-amber-300">{app.expectedDeliveryDate} ({app.hospitalName})</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">nilpha.com ডাক্তারের রেফারেন্স:</span>
                        <span className="font-black text-blue-300">{app.nilphaDoctorConsulted}</span>
                      </div>
                    </div>

                    {/* Uploaded Documents & NID Verification Gallery */}
                    <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-700/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-amber-300 flex items-center gap-1.5">
                          <Eye size={13} />
                          <span>আপলোডকৃত ছবি ও ভোটার আইডি (NID) ভেরিফিকেশন:</span>
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold">
                          (বড় করে দেখতে ছবিতে ক্লিক করুন)
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-1">
                        {/* Wife Photo */}
                        <div
                          onClick={() => app.wifePhotoUrl && setPreviewModalDoc({ url: app.wifePhotoUrl, title: 'স্ত্রীর ১ কপি ছবি', applicantName: app.applicantName })}
                          className={`relative rounded-xl overflow-hidden border p-1 text-center ${
                            app.wifePhotoUrl ? 'border-pink-500/50 bg-pink-950/20 cursor-pointer hover:border-pink-400' : 'border-slate-800 bg-slate-950/40 opacity-60'
                          }`}
                        >
                          {app.wifePhotoUrl ? (
                            <div className="space-y-1">
                              <img src={app.wifePhotoUrl} alt="Wife" className="w-full h-20 object-cover rounded-lg" />
                              <span className="text-[9px] font-black text-pink-300 block truncate">👩 স্ত্রীর ছবি</span>
                            </div>
                          ) : (
                            <div className="h-20 flex flex-col items-center justify-center text-slate-500">
                              <ImageIcon size={20} />
                              <span className="text-[8px] mt-1">ছবি নেই</span>
                            </div>
                          )}
                        </div>

                        {/* Husband Photo */}
                        <div
                          onClick={() => app.husbandPhotoUrl && setPreviewModalDoc({ url: app.husbandPhotoUrl, title: 'স্বামীর ১ কপি ছবি', applicantName: app.applicantName })}
                          className={`relative rounded-xl overflow-hidden border p-1 text-center ${
                            app.husbandPhotoUrl ? 'border-blue-500/50 bg-blue-950/20 cursor-pointer hover:border-blue-400' : 'border-slate-800 bg-slate-950/40 opacity-60'
                          }`}
                        >
                          {app.husbandPhotoUrl ? (
                            <div className="space-y-1">
                              <img src={app.husbandPhotoUrl} alt="Husband" className="w-full h-20 object-cover rounded-lg" />
                              <span className="text-[9px] font-black text-blue-300 block truncate">👨 স্বামীর ছবি</span>
                            </div>
                          ) : (
                            <div className="h-20 flex flex-col items-center justify-center text-slate-500">
                              <ImageIcon size={20} />
                              <span className="text-[8px] mt-1">ছবি নেই</span>
                            </div>
                          )}
                        </div>

                        {/* Wife NID Front */}
                        <div
                          onClick={() => app.wifeNidFrontUrl && setPreviewModalDoc({ url: app.wifeNidFrontUrl, title: 'স্ত্রীর NID (সামনের অংশ)', applicantName: app.applicantName })}
                          className={`relative rounded-xl overflow-hidden border p-1 text-center ${
                            app.wifeNidFrontUrl ? 'border-emerald-500/50 bg-emerald-950/20 cursor-pointer hover:border-emerald-400' : 'border-slate-800 bg-slate-950/40 opacity-60'
                          }`}
                        >
                          {app.wifeNidFrontUrl ? (
                            <div className="space-y-1">
                              <img src={app.wifeNidFrontUrl} alt="Wife NID Front" className="w-full h-20 object-cover rounded-lg" />
                              <span className="text-[9px] font-black text-emerald-300 block truncate">🪪 স্ত্রী NID (সামনে)</span>
                            </div>
                          ) : (
                            <div className="h-20 flex flex-col items-center justify-center text-slate-500">
                              <ImageIcon size={20} />
                              <span className="text-[8px] mt-1">NID নেই</span>
                            </div>
                          )}
                        </div>

                        {/* Wife NID Back */}
                        <div
                          onClick={() => app.wifeNidBackUrl && setPreviewModalDoc({ url: app.wifeNidBackUrl, title: 'স্ত্রীর NID (পেছনের অংশ)', applicantName: app.applicantName })}
                          className={`relative rounded-xl overflow-hidden border p-1 text-center ${
                            app.wifeNidBackUrl ? 'border-emerald-500/50 bg-emerald-950/20 cursor-pointer hover:border-emerald-400' : 'border-slate-800 bg-slate-950/40 opacity-60'
                          }`}
                        >
                          {app.wifeNidBackUrl ? (
                            <div className="space-y-1">
                              <img src={app.wifeNidBackUrl} alt="Wife NID Back" className="w-full h-20 object-cover rounded-lg" />
                              <span className="text-[9px] font-black text-emerald-300 block truncate">🪪 স্ত্রী NID (পেছনে)</span>
                            </div>
                          ) : (
                            <div className="h-20 flex flex-col items-center justify-center text-slate-500">
                              <ImageIcon size={20} />
                              <span className="text-[8px] mt-1">NID নেই</span>
                            </div>
                          )}
                        </div>

                        {/* Husband NID Front */}
                        <div
                          onClick={() => app.husbandNidFrontUrl && setPreviewModalDoc({ url: app.husbandNidFrontUrl, title: 'স্বামীর NID (সামনের অংশ)', applicantName: app.applicantName })}
                          className={`relative rounded-xl overflow-hidden border p-1 text-center ${
                            app.husbandNidFrontUrl ? 'border-indigo-500/50 bg-indigo-950/20 cursor-pointer hover:border-indigo-400' : 'border-slate-800 bg-slate-950/40 opacity-60'
                          }`}
                        >
                          {app.husbandNidFrontUrl ? (
                            <div className="space-y-1">
                              <img src={app.husbandNidFrontUrl} alt="Husband NID Front" className="w-full h-20 object-cover rounded-lg" />
                              <span className="text-[9px] font-black text-indigo-300 block truncate">🪪 স্বামী NID (সামনে)</span>
                            </div>
                          ) : (
                            <div className="h-20 flex flex-col items-center justify-center text-slate-500">
                              <ImageIcon size={20} />
                              <span className="text-[8px] mt-1">NID নেই</span>
                            </div>
                          )}
                        </div>

                        {/* Husband NID Back */}
                        <div
                          onClick={() => app.husbandNidBackUrl && setPreviewModalDoc({ url: app.husbandNidBackUrl, title: 'স্বামীর NID (পেছনের অংশ)', applicantName: app.applicantName })}
                          className={`relative rounded-xl overflow-hidden border p-1 text-center ${
                            app.husbandNidBackUrl ? 'border-indigo-500/50 bg-indigo-950/20 cursor-pointer hover:border-indigo-400' : 'border-slate-800 bg-slate-950/40 opacity-60'
                          }`}
                        >
                          {app.husbandNidBackUrl ? (
                            <div className="space-y-1">
                              <img src={app.husbandNidBackUrl} alt="Husband NID Back" className="w-full h-20 object-cover rounded-lg" />
                              <span className="text-[9px] font-black text-indigo-300 block truncate">🪪 স্বামী NID (পেছনে)</span>
                            </div>
                          ) : (
                            <div className="h-20 flex flex-col items-center justify-center text-slate-500">
                              <ImageIcon size={20} />
                              <span className="text-[8px] mt-1">NID নেই</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Payout & Contact Details */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 p-3 rounded-xl border border-slate-700">
                      <div className="flex items-center gap-3">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">পেমেন্ট নম্বর ({app.paymentMethod.toUpperCase()}):</span>
                          <span className="font-mono text-sm font-black text-emerald-400 flex items-center gap-1.5">
                            {app.payoutNumber}
                            <button
                              onClick={() => copyToClipboard(app.payoutNumber, app.id)}
                              className="text-slate-400 hover:text-white p-1"
                              title="নম্বর কপি করুন"
                            >
                              <Copy size={12} />
                            </button>
                            {copiedId === app.id && <span className="text-[9px] text-emerald-300">কপি হয়েছে!</span>}
                          </span>
                        </div>
                        <div className="border-l border-slate-700 pl-3">
                          <span className="text-[10px] text-slate-400 font-bold block">অনুদান পরিমাণ:</span>
                          <span className="text-sm font-black text-rose-400">৳{app.grantAmount} BDT</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={`tel:${app.phone}`}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black flex items-center gap-1"
                        >
                          <Phone size={12} /> কল
                        </a>
                        <a
                          href={`https://wa.me/88${app.phone}?text=${encodeURIComponent(`Hello ${app.applicantName}, regarding your nilpha.com ৳2000 C-Section assistance application (${app.applicationCode})...`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1"
                        >
                          WhatsApp
                        </a>
                      </div>
                    </div>

                    {/* Rejection input box if opened */}
                    {rejectingAppId === app.id && (
                      <div className="bg-rose-950/70 p-3.5 rounded-xl border border-rose-800 space-y-2">
                        <label className="text-xs font-black text-rose-200 block">
                          আবেদন ডিনাই / বাতিলের কারণ লিখুন:
                        </label>
                        <input
                          type="text"
                          value={rejectReasonInput}
                          onChange={e => setRejectReasonInput(e.target.value)}
                          placeholder="যেমন: মোবাইল নম্বরে পাওয়া যায়নি / অস্পষ্ট ভোটার আইডি / ডাক্তারের প্রেসক্রিপশন নেই..."
                          className="w-full px-3 py-2 bg-slate-900 border border-rose-700 rounded-xl text-xs text-white font-bold outline-none"
                        />
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            onClick={() => { setRejectingAppId(null); setRejectReasonInput(''); }}
                            className="px-3 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold"
                          >
                            বাতিল
                          </button>
                          <button
                            onClick={() => handleUpdateAppStatus(app.id, 'rejected', rejectReasonInput)}
                            className="px-3.5 py-1 bg-rose-600 text-white rounded-lg text-xs font-black"
                          >
                            ডিনাই নিশ্চিত করুন
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Admin Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-700/60">
                      <button
                        onClick={() => handleDeleteApp(app.id)}
                        className="text-[10px] text-slate-500 hover:text-rose-400 font-bold"
                      >
                        আবেদন ডিলিট
                      </button>

                      <div className="flex items-center gap-2">
                        {app.status !== 'approved' && app.status !== 'completed' && (
                          <button
                            onClick={() => handleUpdateAppStatus(app.id, 'approved')}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1"
                          >
                            <Check size={14} /> একসেপ্ট করুন (Approve)
                          </button>
                        )}

                        {app.status === 'approved' && (
                          <button
                            onClick={() => handleUpdateAppStatus(app.id, 'completed')}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-black rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1"
                          >
                            💰 ২০০০ টাকা পাঠানো হয়েছে (Complete)
                          </button>
                        )}

                        {app.status !== 'rejected' && (
                          <button
                            onClick={() => setRejectingAppId(app.id)}
                            className="px-3.5 py-2 bg-rose-900/80 hover:bg-rose-800 text-rose-200 text-xs font-black rounded-xl border border-rose-700 transition-all active:scale-95 flex items-center gap-1"
                          >
                            <X size={14} /> ডিনাই করুন (Deny)
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Application Form Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl p-6 sm:p-7 space-y-5 text-left my-8 animate-in zoom-in-95 border border-rose-100">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🤰</span>
                <div>
                  <h3 className="font-black text-base text-slate-800">
                    মাতৃত্বকালীন ২০০০ টাকা অনুদান আবেদন
                  </h3>
                  <p className="text-[10px] font-bold text-rose-600">
                    nilpha.com গরিব গর্ভবতী মা সহায়তা প্রকল্প
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowApplyModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitApplication} className="space-y-4 max-h-[72vh] overflow-y-auto pr-1 no-scrollbar">
              {/* Mother Name & Guardian */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-700">গর্ভবতী মায়ের (স্ত্রীর) নাম *</label>
                  <input
                    type="text"
                    required
                    value={applicantName}
                    onChange={e => setApplicantName(e.target.value)}
                    placeholder="মায়ের পূর্ণ নাম লিখুন"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-rose-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-700">স্বামীর নাম *</label>
                  <input
                    type="text"
                    required
                    value={husbandOrGuardianName}
                    onChange={e => setHusbandOrGuardianName(e.target.value)}
                    placeholder="স্বামীর পূর্ণ নাম লিখুন"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-rose-600"
                  />
                </div>
              </div>

              {/* Phone Numbers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-700">মোবাইল নম্বর *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-rose-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-700">বিকল্প মোবাইল নম্বর (যদি থাকে)</label>
                  <input
                    type="tel"
                    value={altPhone}
                    onChange={e => setAltPhone(e.target.value)}
                    placeholder="বিকল্প নম্বর"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-rose-600"
                  />
                </div>
              </div>

              {/* District & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-700">জেলা *</label>
                  <select
                    value={district}
                    onChange={e => setDistrict(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-rose-600"
                  >
                    <option value="নীলফামারী">নীলফামারী</option>
                    <option value="রংপুর">রংপুর</option>
                    <option value="দিনাজপুর">দিনাজপুর</option>
                    <option value="লালমনিরহাট">লালমনিরহাট</option>
                    <option value="কুড়িগ্রাম">কুড়িগ্রাম</option>
                    <option value="গাইবান্ধা">গাইবান্ধা</option>
                    <option value="অন্যান্য">অন্যান্য</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-700">উপজেলা / ইউনিয়ন / গ্রাম *</label>
                  <input
                    type="text"
                    required
                    value={upazilaOrArea}
                    onChange={e => setUpazilaOrArea(e.target.value)}
                    placeholder="যেমন: ডোমার, বোড়াগাড়ী"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-rose-600"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-700">পূর্ণ ঠিকানা *</label>
                <input
                  type="text"
                  required
                  value={fullAddress}
                  onChange={e => setFullAddress(e.target.value)}
                  placeholder="গ্রাম, পোস্ট অফিস ও বাসার ঠিকানা"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-rose-600"
                />
              </div>

              {/* Financial Status & Income */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-700">পারিবারিক মাসিক আনুমানিক আয় *</label>
                  <select
                    value={familyMonthlyIncome}
                    onChange={e => setFamilyMonthlyIncome(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-rose-600"
                  >
                    <option value="৫,০০০ টাকার নিচে">৫,০০০ টাকার নিচে (অতি দরিদ্র)</option>
                    <option value="৫,০০০ - ৮,০০০ টাকা">৫,০০০ - ৮,০০০ টাকা (দরিদ্র)</option>
                    <option value="৮,০০০ - ১২,০০০ টাকা">৮,০০০ - ১২,০০০ টাকা (স্বল্প আয়ের পরিবার)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-700">পরিবারের আয়ের উৎস / পেশা</label>
                  <input
                    type="text"
                    value={occupation}
                    onChange={e => setOccupation(e.target.value)}
                    placeholder="যেমন: দিনমজুর, রিকশাচালক, কৃষক"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-rose-600"
                  />
                </div>
              </div>

              {/* Delivery info & Hospital */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-700">সম্ভাব্য ডেলিভারি / সিজারের তারিখ *</label>
                  <input
                    type="date"
                    required
                    value={expectedDeliveryDate}
                    onChange={e => setExpectedDeliveryDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-rose-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-700">সিজার করানোর হাসপাতাল / ক্লিনিকের নাম *</label>
                  <input
                    type="text"
                    required
                    value={hospitalName}
                    onChange={e => setHospitalName(e.target.value)}
                    placeholder="যেমন: নীলফামারী সদর হাসপাতাল / ক্লিনিক"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-rose-600"
                  />
                </div>
              </div>

              {/* nilpha.com Doctor Consultation info */}
              <div className="space-y-1 bg-blue-50/70 p-3.5 rounded-2xl border border-blue-100">
                <label className="text-[11px] font-black text-blue-900">
                  nilpha.com ডাক্তারের নাম ও পরামর্শের বিবরণ * (বাধ্যতামূলক)
                </label>
                <input
                  type="text"
                  required
                  value={nilphaDoctorConsulted}
                  onChange={e => setNilphaDoctorConsulted(e.target.value)}
                  placeholder="যেমন: ডা. ফারহানা হক (গাইনী বিশেষজ্ঞ) - nilpha.com থেকে পরামর্শ নেওয়া হয়েছে"
                  className="w-full px-3.5 py-2.5 bg-white border border-blue-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-blue-600"
                />
                <span className="text-[10px] text-blue-600 font-bold block mt-0.5">
                  ✓ আবেদনের গ্রহণযোগ্যতার জন্য ডাক্তারের নাম বা প্রেসক্রিপশন রেফারেন্স উল্লেখ করুন।
                </span>
              </div>

              {/* NID Numbers (Wife & Husband) */}
              <div className="space-y-2 bg-gradient-to-r from-emerald-50/80 to-teal-50/80 p-3.5 rounded-2xl border border-emerald-200">
                <div className="flex items-center gap-1.5 text-emerald-950">
                  <span className="text-base">🪪</span>
                  <div>
                    <label className="text-[11px] font-black block">জাতীয় পরিচয়পত্র (NID) নম্বর * (বাধ্যতামূলক)</label>
                    <p className="text-[9px] text-emerald-800 font-bold">গর্ভবতী মা (স্ত্রী) এবং স্বামী উভয়ের ভোটার আইডি কার্ডের সঠিক নম্বর লিখুন</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-emerald-950">স্ত্রীর NID নম্বর *</label>
                    <input
                      type="text"
                      required
                      value={wifeNidNumber}
                      onChange={e => setWifeNidNumber(e.target.value)}
                      placeholder="যেমন: 199XXXXXXXXXX বা 10/13/17 ডিজিট"
                      className="w-full px-3.5 py-2.5 bg-white border border-emerald-300 rounded-xl text-xs font-mono font-bold text-slate-800 outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-emerald-950">স্বামীর NID নম্বর *</label>
                    <input
                      type="text"
                      required
                      value={husbandNidNumber}
                      onChange={e => setHusbandNidNumber(e.target.value)}
                      placeholder="যেমন: 199XXXXXXXXXX বা 10/13/17 ডিজিট"
                      className="w-full px-3.5 py-2.5 bg-white border border-emerald-300 rounded-xl text-xs font-mono font-bold text-slate-800 outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>
              </div>

              {/* ========================================================= */}
              {/* MANDATORY DOCUMENTS & PHOTOS UPLOAD SECTION (6 SLOTS)    */}
              {/* ========================================================= */}
              <div className="space-y-3 bg-gradient-to-br from-amber-50/80 via-rose-50/50 to-pink-50/80 p-4 sm:p-5 rounded-2xl border-2 border-amber-200/90">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-950">
                    <Camera size={18} className="text-rose-600" />
                    <div>
                      <h4 className="font-black text-xs sm:text-sm uppercase tracking-tight text-slate-900">
                        জরুরি ডকুমেন্টস ও ছবি আপলোড (বাধ্যতামূলক) *
                      </h4>
                      <p className="text-[10px] text-amber-900 font-bold">
                        প্রতারণা রোধ ও প্রকৃত গরিব মায়েদের সেবা নিশ্চিত করতে স্বামী-স্ত্রীর ছবি ও ভোটার আইডি কার্ড আবশ্যক।
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {/* 1. Wife Photo */}
                  <DocumentUploadCard
                    title="১. গর্ভবতী মায়ের (স্ত্রীর) ১ কপি ছবি *"
                    subtitle="স্ত্রীর মুখের স্পষ্ট রঙিন ছবি"
                    imageUrl={wifePhotoUrl}
                    isUploading={uploadingDocKey === 'wifePhoto'}
                    onFileChange={(e) => handleFileUpload(e, 'wifePhoto')}
                    onRemove={() => setWifePhotoUrl('')}
                    accentColor="rose"
                  />

                  {/* 2. Husband Photo */}
                  <DocumentUploadCard
                    title="২. স্বামীর ১ কপি ছবি *"
                    subtitle="স্বামীর মুখের স্পষ্ট রঙিন ছবি"
                    imageUrl={husbandPhotoUrl}
                    isUploading={uploadingDocKey === 'husbandPhoto'}
                    onFileChange={(e) => handleFileUpload(e, 'husbandPhoto')}
                    onRemove={() => setHusbandPhotoUrl('')}
                    accentColor="blue"
                  />

                  {/* 3. Wife NID Front */}
                  <DocumentUploadCard
                    title="৩. স্ত্রীর ভোটার আইডি (সামনের অংশ) *"
                    subtitle="জাতীয় পরিচয়পত্রের সামনের স্পষ্ট ছবি"
                    imageUrl={wifeNidFrontUrl}
                    isUploading={uploadingDocKey === 'wifeNidFront'}
                    onFileChange={(e) => handleFileUpload(e, 'wifeNidFront')}
                    onRemove={() => setWifeNidFrontUrl('')}
                    accentColor="emerald"
                  />

                  {/* 4. Wife NID Back */}
                  <DocumentUploadCard
                    title="৪. স্ত্রীর ভোটার আইডি (পেছনের অংশ) *"
                    subtitle="জাতীয় পরিচয়পত্রের পেছনের স্পষ্ট ছবি"
                    imageUrl={wifeNidBackUrl}
                    isUploading={uploadingDocKey === 'wifeNidBack'}
                    onFileChange={(e) => handleFileUpload(e, 'wifeNidBack')}
                    onRemove={() => setWifeNidBackUrl('')}
                    accentColor="emerald"
                  />

                  {/* 5. Husband NID Front */}
                  <DocumentUploadCard
                    title="৫. স্বামীর ভোটার আইডি (সামনের অংশ) *"
                    subtitle="স্বামীর জাতীয় পরিচয়পত্রের সামনের ছবি"
                    imageUrl={husbandNidFrontUrl}
                    isUploading={uploadingDocKey === 'husbandNidFront'}
                    onFileChange={(e) => handleFileUpload(e, 'husbandNidFront')}
                    onRemove={() => setHusbandNidFrontUrl('')}
                    accentColor="indigo"
                  />

                  {/* 6. Husband NID Back */}
                  <DocumentUploadCard
                    title="৬. স্বামীর ভোটার আইডি (পেছনের অংশ) *"
                    subtitle="স্বামীর জাতীয় পরিচয়পত্রের পেছনের ছবি"
                    imageUrl={husbandNidBackUrl}
                    isUploading={uploadingDocKey === 'husbandNidBack'}
                    onFileChange={(e) => handleFileUpload(e, 'husbandNidBack')}
                    onRemove={() => setHusbandNidBackUrl('')}
                    accentColor="indigo"
                  />
                </div>
              </div>

              {/* Payment Receiving Method */}
              <div className="space-y-2 bg-rose-50/70 p-3.5 rounded-2xl border border-rose-100">
                <label className="text-[11px] font-black text-rose-900 block">
                  ২০০০ টাকা অনুদান গ্রহণের মাধ্যম ও নম্বর *
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs font-black text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bkash"
                      checked={paymentMethod === 'bkash'}
                      onChange={() => setPaymentMethod('bkash')}
                      className="accent-pink-600"
                    />
                    <span>বিকাশ (bKash) Personal</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-black text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="nagad"
                      checked={paymentMethod === 'nagad'}
                      onChange={() => setPaymentMethod('nagad')}
                      className="accent-rose-600"
                    />
                    <span>নগদ (Nagad) Personal</span>
                  </label>
                </div>

                <input
                  type="tel"
                  required
                  value={payoutNumber}
                  onChange={e => setPayoutNumber(e.target.value)}
                  placeholder="01XXXXXXXXX (ব্যক্তিগত একাউন্ট নম্বর)"
                  className="w-full px-3.5 py-2.5 bg-white border border-rose-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-rose-600"
                />
              </div>

              {/* Reason for Assistance */}
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-700">অতিরিক্ত কোনো কারণ বা পারিবারিক অবস্থা (যদি থাকে)</label>
                <textarea
                  rows={2}
                  value={reasonForAssistance}
                  onChange={e => setReasonForAssistance(e.target.value)}
                  placeholder="আর্থিক সমস্যা বা অন্য কোনো তথ্য উল্লেখ করুন..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-rose-600"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-black text-xs rounded-xl shadow-lg flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                  <span>আবেদন জমা দিন (Submit)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Dialog Modal */}
      {submittedApp && (
        <div className="fixed inset-0 z-[320] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl p-6 sm:p-7 space-y-4 text-center animate-in zoom-in-95 border-2 border-emerald-100">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto shadow-sm">
              ✓
            </div>

            <div className="space-y-1">
              <h3 className="font-black text-lg text-slate-800">
                আবেদন সফলভাবে জমা হয়েছে!
              </h3>
              <p className="text-xs font-bold text-slate-500">
                আপনার মাতৃত্বকালীন ২০০০ টাকা অনুদানের আবেদন ও সংযুক্ত ডকুমেন্টস এডমিন ভেরিফিকেশনের জন্য গৃহীত হয়েছে।
              </p>
            </div>

            <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 text-left space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-500 uppercase">আবেদন ট্র্যাকিং কোড</span>
                <span className="font-mono text-xs font-black text-rose-600 bg-white px-2 py-0.5 rounded-md border border-rose-200">
                  {submittedApp.applicationCode}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-700">
                নাম: <span className="font-black">{submittedApp.applicantName}</span>
              </p>
              {submittedApp.wifeNidNumber && (
                <p className="text-xs font-bold text-slate-700">
                  স্ত্রীর NID: <span className="font-mono font-black text-emerald-700">{submittedApp.wifeNidNumber}</span>
                </p>
              )}
              {submittedApp.husbandNidNumber && (
                <p className="text-xs font-bold text-slate-700">
                  স্বামীর NID: <span className="font-mono font-black text-indigo-700">{submittedApp.husbandNidNumber}</span>
                </p>
              )}
              <p className="text-xs font-bold text-slate-700">
                পেমেন্ট নম্বর: <span className="font-mono font-black">{submittedApp.payoutNumber} ({submittedApp.paymentMethod.toUpperCase()})</span>
              </p>
              <p className="text-[11px] font-bold text-amber-800 bg-amber-100/60 p-2 rounded-xl">
                ⏳ এডমিন টিম আপনার দেওয়া ছবি ও ভোটার আইডি কার্ড ভেরিফাই করে আবেদন একসেপ্ট (Approved) করলেই আপনার বিকাশ/নগদে ২০০০ টাকা পাঠিয়ে দেওয়া হবে।
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <a
                href={`https://wa.me/88${whatsappNumber}?text=${encodeURIComponent(`Hello nilpha.com, I just applied for 2000 BDT Maternity assistance. My Code: ${submittedApp.applicationCode}, Name: ${submittedApp.applicantName}, Phone: ${submittedApp.phone}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5"
              >
                <span>💬 WhatsApp এ এডমিনকে অবগত করুন</span>
              </a>

              <button
                onClick={() => setSubmittedApp(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-xl"
              >
                ঠিক আছে, বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Image Lightbox / Zoom Modal */}
      {previewModalDoc && (
        <div className="fixed inset-0 z-[400] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="relative max-w-3xl w-full max-h-[90vh] flex flex-col items-center justify-center text-white space-y-3">
            {/* Header */}
            <div className="w-full flex items-center justify-between bg-slate-900/80 px-4 py-2.5 rounded-2xl border border-slate-700">
              <div>
                <h4 className="font-black text-sm text-white flex items-center gap-2">
                  <span>📸</span> {previewModalDoc.title}
                </h4>
                {previewModalDoc.applicantName && (
                  <p className="text-[11px] text-slate-400 font-bold">
                    আবেদনকারী: {previewModalDoc.applicantName}
                  </p>
                )}
              </div>
              <button
                onClick={() => setPreviewModalDoc(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-white transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Image Container */}
            <div className="relative max-h-[75vh] w-full flex items-center justify-center overflow-auto rounded-2xl bg-slate-950 p-2 border border-slate-800">
              <img
                src={previewModalDoc.url}
                alt={previewModalDoc.title}
                className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-2xl"
              />
            </div>

            {/* Actions Bar */}
            <div className="flex items-center gap-3">
              <a
                href={previewModalDoc.url}
                download={`${previewModalDoc.title}.jpg`}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 border border-slate-700 transition-all"
              >
                <Download size={14} />
                <span>ডাউনলোড করুন</span>
              </a>
              <button
                onClick={() => setPreviewModalDoc(null)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition-all"
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

// Reusable Document Upload Card Component
interface DocumentUploadCardProps {
  title: string;
  subtitle: string;
  imageUrl?: string;
  isUploading: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  accentColor?: string;
}

const DocumentUploadCard: React.FC<DocumentUploadCardProps> = ({
  title,
  subtitle,
  imageUrl,
  isUploading,
  onFileChange,
  onRemove
}) => {
  return (
    <div className={`p-3 rounded-2xl border bg-white transition-all ${
      imageUrl ? 'border-emerald-300 shadow-sm bg-emerald-50/20' : 'border-slate-200 hover:border-rose-300'
    }`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <span className="text-[11px] font-black text-slate-800 block leading-tight">
            {title}
          </span>
          <span className="text-[9px] font-bold text-slate-500 block">
            {subtitle}
          </span>
        </div>
        {imageUrl && (
          <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5 shrink-0">
            <CheckCircle size={10} />
            <span>যুক্ত হয়েছে</span>
          </span>
        )}
      </div>

      {imageUrl ? (
        <div className="space-y-2">
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
            <img src={imageUrl} alt="Document preview" className="w-full h-full object-cover" />
          </div>
          <div className="flex items-center justify-between gap-2 pt-1">
            <label className="text-[10px] font-black text-blue-600 hover:text-blue-700 cursor-pointer flex items-center gap-1">
              <Upload size={11} />
              <span>ছবি পরিবর্তন</span>
              <input
                type="file"
                accept="image/*"
                onChange={onFileChange}
                className="hidden"
              />
            </label>
            <button
              type="button"
              onClick={onRemove}
              className="text-[10px] font-black text-rose-600 hover:text-rose-700 flex items-center gap-0.5"
            >
              <Trash2 size={11} />
              <span>মুছে ফেলুন</span>
            </button>
          </div>
        </div>
      ) : (
        <label className="relative flex flex-col items-center justify-center aspect-[4/3] rounded-xl border-2 border-dashed border-slate-300 hover:border-rose-400 bg-slate-50 hover:bg-rose-50/40 cursor-pointer transition-all p-3 text-center">
          {isUploading ? (
            <div className="flex flex-col items-center gap-1">
              <RefreshCw size={20} className="animate-spin text-rose-600" />
              <span className="text-[10px] font-black text-rose-600">ছবি প্রসেস হচ্ছে...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                <Camera size={16} />
              </div>
              <span className="text-[10px] font-black text-slate-700">
                ছবি সিলেক্ট / তুলুন
              </span>
              <span className="text-[8px] text-slate-400 font-bold">
                JPG বা PNG ফরম্যাট
              </span>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            disabled={isUploading}
            onChange={onFileChange}
            className="hidden"
          />
        </label>
      )}
    </div>
  );
};

const SaveIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/>
    <polyline points="7 3 7 8 15 8"/>
  </svg>
);
