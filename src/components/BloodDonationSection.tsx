import React, { useState, useEffect, useMemo } from 'react';
import { 
  Heart, 
  Droplet, 
  Phone, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Filter, 
  ShieldCheck, 
  Share2, 
  Copy, 
  Check, 
  User, 
  PlusCircle, 
  Clock, 
  MessageSquare, 
  Activity, 
  Lock, 
  Unlock, 
  Sparkles, 
  ChevronRight, 
  RefreshCw, 
  Users, 
  Award, 
  ExternalLink,
  Edit3,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../../services/firebase';
import { doc, setDoc, collection, getDocs, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { BloodDonor, BloodGroup, Profile, UserRole } from '../../types';

interface BloodDonationSectionProps {
  profile: Profile | null;
  isAdmin: boolean;
  whatsappNumber?: string;
  onOpenAuth?: () => void;
}

// Initial starter seed donors across local regions
const SEED_BLOOD_DONORS: BloodDonor[] = [
  {
    id: 'donor_seed_1',
    name: 'মো: আরিফুল ইসলাম',
    bloodGroup: 'A+',
    phone: '01711223344',
    district: 'নীলফামারী',
    upazila: 'সদর',
    address: 'চৌধুরী পাড়া, নীলফামারী সদর',
    lastDonationDate: '2024-01-15',
    isAvailable: true,
    gender: 'male',
    age: 26,
    totalDonationsCount: 5,
    registeredAt: '2024-01-01',
    verified: true
  },
  {
    id: 'donor_seed_2',
    name: 'রাশেদুল হাসান',
    bloodGroup: 'A-',
    phone: '01822334455',
    district: 'নীলফামারী',
    upazila: 'সৈয়দপুর',
    address: 'রেলওয়ে কলোনি, সৈয়দপুর',
    lastDonationDate: '2023-11-20',
    isAvailable: true,
    gender: 'male',
    age: 29,
    totalDonationsCount: 3,
    registeredAt: '2024-01-05',
    verified: true
  },
  {
    id: 'donor_seed_3',
    name: 'মো: তানভীর আহমেদ',
    bloodGroup: 'B+',
    phone: '01933445566',
    district: 'রংপুর',
    upazila: 'কোতোয়ালী',
    address: 'মেডিকেল পূর্ব গেট, রংপুর',
    lastDonationDate: '2024-02-10',
    isAvailable: true,
    gender: 'male',
    age: 24,
    totalDonationsCount: 6,
    registeredAt: '2024-01-10',
    verified: true
  },
  {
    id: 'donor_seed_4',
    name: 'ফারজানা আক্তার',
    bloodGroup: 'B-',
    phone: '01744556677',
    district: 'নীলফামারী',
    upazila: 'জলঢাকা',
    address: 'হাসপাতাল রোড, জলঢাকা',
    lastDonationDate: '2023-12-05',
    isAvailable: true,
    gender: 'female',
    age: 23,
    totalDonationsCount: 2,
    registeredAt: '2024-01-12',
    verified: true
  },
  {
    id: 'donor_seed_5',
    name: 'মাহমুদুল হাসান শুভ',
    bloodGroup: 'O+',
    phone: '01755667788',
    district: 'নীলফামারী',
    upazila: 'ডোমার',
    address: 'ডোমার বাজার, ডোমার',
    lastDonationDate: '2024-01-28',
    isAvailable: true,
    gender: 'male',
    age: 27,
    totalDonationsCount: 8,
    registeredAt: '2024-01-15',
    verified: true
  },
  {
    id: 'donor_seed_6',
    name: 'সোহেল রানা',
    bloodGroup: 'O-',
    phone: '01866778899',
    district: 'নীলফামারী',
    upazila: 'কিশোরগঞ্জ',
    address: 'কিশোরগঞ্জ থানা মোড়',
    lastDonationDate: '2023-10-18',
    isAvailable: true,
    gender: 'male',
    age: 31,
    totalDonationsCount: 4,
    registeredAt: '2024-01-20',
    verified: true
  },
  {
    id: 'donor_seed_7',
    name: 'মো: আব্দুল্লাহ আল মামুন',
    bloodGroup: 'AB+',
    phone: '01977889900',
    district: 'নীলফামারী',
    upazila: 'ডিমলা',
    address: 'ডিমলা সদর বাজার',
    lastDonationDate: '2024-02-01',
    isAvailable: true,
    gender: 'male',
    age: 28,
    totalDonationsCount: 4,
    registeredAt: '2024-01-22',
    verified: true
  },
  {
    id: 'donor_seed_8',
    name: 'কাজী শাহরিয়ার কবীর',
    bloodGroup: 'AB-',
    phone: '01788990011',
    district: 'রংপুর',
    upazila: 'সদর',
    address: 'ধাপ জেল রোড, রংপুর',
    lastDonationDate: '2023-09-12',
    isAvailable: true,
    gender: 'male',
    age: 33,
    totalDonationsCount: 7,
    registeredAt: '2024-01-25',
    verified: true
  }
];

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export const BloodDonationSection: React.FC<BloodDonationSectionProps> = ({
  profile,
  isAdmin,
  whatsappNumber = '01352669100',
  onOpenAuth
}) => {
  const [donors, setDonors] = useState<BloodDonor[]>(SEED_BLOOD_DONORS);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  // Gated Access State
  const [myDonorRegistration, setMyDonorRegistration] = useState<BloodDonor | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showRegModal, setShowRegModal] = useState(false);
  const [showPhoneLookupModal, setShowPhoneLookupModal] = useState(false);
  const [phoneLookupInput, setPhoneLookupInput] = useState('');
  const [lookupError, setLookupError] = useState('');
  const [isSubmittingReg, setIsSubmittingReg] = useState(false);
  const [regSuccessMessage, setRegSuccessMessage] = useState('');

  // Helper to normalize Bengali digits to English digits
  const normalizeDigits = (str: string) => {
    const bnToEn: { [key: string]: string } = {
      '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
      '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
    };
    return str.replace(/[০-৯]/g, (d) => bnToEn[d] || d);
  };

  // Filtering States
  // Category tabs: 'all' | 'group_a' | 'group_b' | 'group_o' | 'group_ab' | 'a_neg' | 'b_neg' | 'o_neg' | 'ab_neg'
  const [mainGroupFilter, setMainGroupFilter] = useState<'all' | 'group_a' | 'group_b' | 'group_o' | 'group_ab' | 'a_neg' | 'b_neg' | 'o_neg' | 'ab_neg'>('all');
  const [specificGroupFilter, setSpecificGroupFilter] = useState<BloodGroup | 'all'>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'ready'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Registration Form State
  const [formData, setFormData] = useState({
    name: profile?.full_name || '',
    bloodGroup: 'A+' as BloodGroup,
    phone: profile?.phone || '',
    alternatePhone: '',
    district: profile?.district || 'নীলফামারী',
    upazila: profile?.upazila || '',
    address: profile?.village || '',
    lastDonationDate: '',
    isAvailable: true,
    gender: 'male' as 'male' | 'female' | 'other',
    age: ''
  });

  // Emergency Blood Request Modal
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencyBloodGroup, setEmergencyBloodGroup] = useState<BloodGroup>('O+');
  const [emergencyHospital, setEmergencyHospital] = useState('');
  const [emergencyBags, setEmergencyBags] = useState('1');
  const [emergencyPhone, setEmergencyPhone] = useState(profile?.phone || '');
  const [emergencyNotes, setEmergencyNotes] = useState('');

  // 1. Check existing local registration or match profile phone
  useEffect(() => {
    try {
      const savedDonor = localStorage.getItem('nilpha_blood_donor_record');
      if (savedDonor) {
        const parsed = JSON.parse(savedDonor);
        setMyDonorRegistration(parsed);
        setIsUnlocked(true);
      }
    } catch (e) {
      console.error('Error reading saved donor from storage', e);
    }
  }, []);

  // Check if profile phone already exists as donor in firestore/local
  useEffect(() => {
    if (profile?.phone && donors.length > 0 && !isUnlocked) {
      const matched = donors.find(d => d.phone.replace(/[^0-9]/g, '') === profile.phone?.replace(/[^0-9]/g, ''));
      if (matched) {
        setMyDonorRegistration(matched);
        setIsUnlocked(true);
        try {
          localStorage.setItem('nilpha_blood_donor_record', JSON.stringify(matched));
        } catch (e) {}
      }
    }
  }, [profile?.phone, donors, isUnlocked]);

  // If Admin or Moderator, automatically unlock
  useEffect(() => {
    if (isAdmin) {
      setIsUnlocked(true);
    }
  }, [isAdmin]);

  // 2. Fetch donors from Firestore
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      const colRef = collection(db, 'blood_donors');
      const q = query(colRef, orderBy('registeredAt', 'desc'));
      
      unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const fetched: BloodDonor[] = [];
          snapshot.forEach(docSnap => {
            fetched.push({
              id: docSnap.id,
              ...docSnap.data()
            } as BloodDonor);
          });
          setDonors(fetched);

          // Check if current user or saved phone is in fetched list
          const savedPhone = profile?.phone || myDonorRegistration?.phone;
          if (savedPhone) {
            const cleanSaved = savedPhone.replace(/[^0-9]/g, '');
            const found = fetched.find(d => d.phone.replace(/[^0-9]/g, '') === cleanSaved);
            if (found) {
              setMyDonorRegistration(found);
              setIsUnlocked(true);
              try {
                localStorage.setItem('nilpha_blood_donor_record', JSON.stringify(found));
              } catch (e) {}
            }
          }
        } else {
          // If Firestore is empty, seed initial records
          seedInitialDonors();
        }
        setIsLoading(false);
      }, (err) => {
        console.warn('Firestore blood_donors listener error, falling back to initial data:', err);
        setIsLoading(false);
      });
    } catch (e) {
      console.warn('Error setting up firestore listener for blood donors:', e);
      setIsLoading(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [profile?.phone]);

  const seedInitialDonors = async () => {
    try {
      for (const donor of SEED_BLOOD_DONORS) {
        await setDoc(doc(db, 'blood_donors', donor.id), donor, { merge: true });
      }
    } catch (e) {
      console.warn('Could not seed initial blood donors to firestore', e);
    }
  };

  // Handle Quick Phone Lookup for existing donors
  const handlePhoneLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError('');
    const cleaned = normalizeDigits(phoneLookupInput.trim()).replace(/[^0-9]/g, '');
    if (cleaned.length < 10) {
      setLookupError('অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নম্বর লিখুন');
      return;
    }

    const matched = donors.find(d => normalizeDigits(d.phone).replace(/[^0-9]/g, '').includes(cleaned));
    if (matched) {
      setMyDonorRegistration(matched);
      setIsUnlocked(true);
      setShowPhoneLookupModal(false);
      try {
        localStorage.setItem('nilpha_blood_donor_record', JSON.stringify(matched));
      } catch (e) {}
      setRegSuccessMessage(`স্বাগতম ${matched.name}! আপনার রক্তদাতা প্রোফাইল সক্রিয় রয়েছে। সকল নম্বর এখন আনলক করা হয়েছে।`);
      setTimeout(() => setRegSuccessMessage(''), 4000);
    } else {
      setLookupError('এই মোবাইল নম্বর দিয়ে কোনো ডোনার নিবন্ধন পাওয়া যায়নি। আপনি নতুন রক্তদাতা হিসেবে নিবন্ধন করতে পারেন।');
    }
  };

  // Handle Registration Submission
  const handleRegisterDonor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('অনুগ্রহ করে আপনার পুরো নাম লিখুন');
      return;
    }
    const cleanPhone = normalizeDigits(formData.phone.trim()).replace(/[^0-9]/g, '');
    if (cleanPhone.length < 11) {
      alert('অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নম্বর প্রদান করুন');
      return;
    }
    if (!formData.district.trim() || !formData.address.trim()) {
      alert('অনুগ্রহ করে আপনার জেলা ও বিস্তারিত এলাকা/ঠিকানা লিখুন');
      return;
    }

    setIsSubmittingReg(true);
    try {
      const donorId = `donor_${cleanPhone}_${Date.now()}`;
      const newDonor: BloodDonor = {
        id: donorId,
        name: formData.name.trim(),
        bloodGroup: formData.bloodGroup,
        phone: formData.phone.trim(),
        alternatePhone: formData.alternatePhone.trim() || undefined,
        district: formData.district.trim(),
        upazila: formData.upazila.trim() || undefined,
        address: formData.address.trim(),
        lastDonationDate: formData.lastDonationDate || undefined,
        isAvailable: formData.isAvailable,
        gender: formData.gender,
        age: formData.age ? parseInt(formData.age, 10) : undefined,
        userId: profile?.id || undefined,
        registeredAt: new Date().toISOString(),
        verified: true
      };

      // Save to Firestore
      try {
        await setDoc(doc(db, 'blood_donors', donorId), newDonor);
      } catch (err) {
        console.warn('Firestore write error, keeping local registration', err);
      }

      // Update local state and storage
      setDonors(prev => [newDonor, ...prev.filter(d => d.phone !== newDonor.phone)]);
      setMyDonorRegistration(newDonor);
      setIsUnlocked(true);
      setShowRegModal(false);
      try {
        localStorage.setItem('nilpha_blood_donor_record', JSON.stringify(newDonor));
      } catch (e) {}

      setRegSuccessMessage(`ধন্যবাদ ${newDonor.name}! রক্তদাতা হিসেবে আপনার নিবন্ধন সফল হয়েছে। রক্তদাতা তালিকা আপনার জন্য উন্মুক্ত করা হয়েছে।`);
      setTimeout(() => setRegSuccessMessage(''), 6000);
    } catch (error) {
      console.error('Error registering blood donor:', error);
      alert('নিবন্ধন করতে সমস্যা হয়েছে, অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsSubmittingReg(false);
    }
  };

  // Toggle my own availability status
  const handleToggleMyAvailability = async () => {
    if (!myDonorRegistration) return;
    const updatedStatus = !myDonorRegistration.isAvailable;
    const updatedRecord: BloodDonor = {
      ...myDonorRegistration,
      isAvailable: updatedStatus,
      updatedAt: new Date().toISOString()
    };

    setMyDonorRegistration(updatedRecord);
    try {
      localStorage.setItem('nilpha_blood_donor_record', JSON.stringify(updatedRecord));
      await setDoc(doc(db, 'blood_donors', myDonorRegistration.id), updatedRecord, { merge: true });
    } catch (e) {
      console.warn('Error updating availability status', e);
    }
  };

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2500);
  };

  // 3. Filtered Donors Logic
  const filteredDonors = useMemo(() => {
    return donors.filter(d => {
      // Main Group Tab Filter
      if (mainGroupFilter === 'group_a') {
        if (d.bloodGroup !== 'A+' && d.bloodGroup !== 'A-') return false;
      } else if (mainGroupFilter === 'group_b') {
        if (d.bloodGroup !== 'B+' && d.bloodGroup !== 'B-') return false;
      } else if (mainGroupFilter === 'group_o') {
        if (d.bloodGroup !== 'O+' && d.bloodGroup !== 'O-') return false;
      } else if (mainGroupFilter === 'group_ab') {
        if (d.bloodGroup !== 'AB+' && d.bloodGroup !== 'AB-') return false;
      } else if (mainGroupFilter === 'a_neg') {
        if (d.bloodGroup !== 'A-') return false;
      } else if (mainGroupFilter === 'b_neg') {
        if (d.bloodGroup !== 'B-') return false;
      } else if (mainGroupFilter === 'o_neg') {
        if (d.bloodGroup !== 'O-') return false;
      } else if (mainGroupFilter === 'ab_neg') {
        if (d.bloodGroup !== 'AB-') return false;
      }

      // Specific Single Blood Group Filter Pill (if selected)
      if (specificGroupFilter !== 'all') {
        if (d.bloodGroup !== specificGroupFilter) return false;
      }

      // Location / District / Upazila
      if (locationFilter !== 'all') {
        const fullLoc = `${d.district} ${d.upazila || ''} ${d.address}`.toLowerCase();
        if (!fullLoc.includes(locationFilter.toLowerCase())) return false;
      }

      // Availability Filter
      if (availabilityFilter === 'ready' && !d.isAvailable) {
        return false;
      }

      // Search Term (Name, Phone, Address)
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = d.name.toLowerCase().includes(term);
        const matchesPhone = d.phone.includes(term);
        const matchesAddress = (d.address + ' ' + (d.upazila || '') + ' ' + d.district).toLowerCase().includes(term);
        const matchesGroup = d.bloodGroup.toLowerCase().includes(term);
        if (!matchesName && !matchesPhone && !matchesAddress && !matchesGroup) return false;
      }

      return true;
    });
  }, [donors, mainGroupFilter, specificGroupFilter, locationFilter, availabilityFilter, searchTerm]);

  // Counts by Blood Group
  const bloodGroupStats = useMemo(() => {
    const counts: Record<string, number> = {
      'all': donors.length,
      'group_a': donors.filter(d => d.bloodGroup === 'A+' || d.bloodGroup === 'A-').length,
      'group_b': donors.filter(d => d.bloodGroup === 'B+' || d.bloodGroup === 'B-').length,
      'group_o': donors.filter(d => d.bloodGroup === 'O+' || d.bloodGroup === 'O-').length,
      'group_ab': donors.filter(d => d.bloodGroup === 'AB+' || d.bloodGroup === 'AB-').length,
      'A+': donors.filter(d => d.bloodGroup === 'A+').length,
      'A-': donors.filter(d => d.bloodGroup === 'A-').length,
      'B+': donors.filter(d => d.bloodGroup === 'B+').length,
      'B-': donors.filter(d => d.bloodGroup === 'B-').length,
      'O+': donors.filter(d => d.bloodGroup === 'O+').length,
      'O-': donors.filter(d => d.bloodGroup === 'O-').length,
      'AB+': donors.filter(d => d.bloodGroup === 'AB+').length,
      'AB-': donors.filter(d => d.bloodGroup === 'AB-').length,
      'ready': donors.filter(d => d.isAvailable).length,
    };
    return counts;
  }, [donors]);

  // Send Emergency Request to WhatsApp
  const handleSendEmergencyRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emergencyHospital.trim() || !emergencyPhone.trim()) {
      alert('অনুগ্রহ করে হাসপাতাল এবং রোগীর যোগাযোগের নম্বর লিখুন');
      return;
    }

    const msg = `🚨 জরুরি রক্ত প্রয়োজন! (Nilpha Health Blood Request)\n` +
      `🩸 রক্তের গ্রুপ: ${emergencyBloodGroup}\n` +
      `🏥 হাসপাতালের নাম ও ঠিকানা: ${emergencyHospital}\n` +
      `💉 রক্তের পরিমাণ: ${emergencyBags} ব্যাগ\n` +
      `📞 রোগীর স্বজনের মোবাইল: ${emergencyPhone}\n` +
      `📝 অতিরিক্ত বিবরণ: ${emergencyNotes || 'জরুরি প্রয়োজনে অতি দ্রুত রক্তদাতা প্রয়োজন'}\n` +
      `🌐 Nilpha Digital Doctor App`;

    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/88${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encoded}`, '_blank');
    setShowEmergencyModal(false);
  };

  return (
    <div id="blood-donation-section" className="space-y-6 text-left animate-fadeIn">
      {/* Hero Header Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-rose-700 via-red-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-red-500/30">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-80 h-80 bg-red-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-60 h-60 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 bg-red-500/25 border border-red-400/40 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider text-rose-200 backdrop-blur-md">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-ping" />
              <span>রক্তদান জীবন দান • Nilpha রক্তদাতা নেটওয়ার্ক</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowEmergencyModal(true)}
                className="inline-flex items-center gap-1.5 bg-white text-rose-800 hover:bg-rose-50 text-xs font-black px-4 py-2 rounded-xl shadow-lg active:scale-95 transition-all cursor-pointer animate-pulse"
              >
                <span>🚨 জরুরি রক্তের আবেদন</span>
              </button>
            </div>
          </div>

          <div className="max-w-3xl space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span className="text-3xl sm:text-4xl text-rose-300">🩸</span>
              <span>ব্লাড ডোনেট ও জরুরি রক্তদাতা ডিরেক্টরি</span>
            </h2>
            <p className="text-xs sm:text-sm text-rose-100/90 leading-relaxed font-medium">
              নীলফামারী, রংপুরসহ সমগ্র উত্তরবঙ্গের স্বেচ্ছাসেবী রক্তদাতাদের নির্ভরযোগ্য ডাটাবেজ। গ্রুপ অনুযায়ী ফিল্টার করে মুহূর্তেই যোগাযোগ করুন অথবা নিজে রক্তদাতা হিসেবে যুক্ত হয়ে একটি জীবন বাঁচান।
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15">
              <div className="text-xl sm:text-2xl font-black text-white">{bloodGroupStats['all']} জন</div>
              <div className="text-[10px] text-rose-200 font-bold">মোট নিবন্ধিত রক্তদাতা</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15">
              <div className="text-xl sm:text-2xl font-black text-emerald-300">{bloodGroupStats['ready']} জন</div>
              <div className="text-[10px] text-rose-200 font-bold">বর্তমানে রক্তদানে প্রস্তুত</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15">
              <div className="text-xl sm:text-2xl font-black text-amber-300">৮টি গ্রুপ</div>
              <div className="text-[10px] text-rose-200 font-bold">A, B, O, AB (+ ও -)</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15">
              <div className="text-xl sm:text-2xl font-black text-white">১০০% ফ্রি</div>
              <div className="text-[10px] text-rose-200 font-bold">স্বেচ্ছাসেবী সেবা</div>
            </div>
          </div>

          {/* User Status Bar if Unlocked / Registered */}
          {isUnlocked && myDonorRegistration && (
            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-3.5 border border-white/25 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black text-xs shadow-md">
                  ✓
                </div>
                <div>
                  <div className="font-black text-white flex items-center gap-1.5">
                    <span>আপনার ডোনার প্রোফাইল সক্রিয়: <strong>{myDonorRegistration.name}</strong> ({myDonorRegistration.bloodGroup})</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-black ${myDonorRegistration.isAvailable ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-slate-900'}`}>
                      {myDonorRegistration.isAvailable ? '🟢 রক্তদানে প্রস্তুত' : '⏳ সাময়িক বিরতিতে'}
                    </span>
                  </div>
                  <div className="text-[10px] text-rose-200 font-medium">মোবাইল: {myDonorRegistration.phone} • {myDonorRegistration.address}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleMyAvailability}
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white font-black text-[11px] rounded-xl transition-all cursor-pointer"
                >
                  {myDonorRegistration.isAvailable ? 'সাময়িক বিরতি নিন' : 'প্রস্তুত স্ট্যাটাস দিন'}
                </button>
                <button
                  onClick={() => {
                    setFormData({
                      name: myDonorRegistration.name,
                      bloodGroup: myDonorRegistration.bloodGroup,
                      phone: myDonorRegistration.phone,
                      alternatePhone: myDonorRegistration.alternatePhone || '',
                      district: myDonorRegistration.district,
                      upazila: myDonorRegistration.upazila || '',
                      address: myDonorRegistration.address,
                      lastDonationDate: myDonorRegistration.lastDonationDate || '',
                      isAvailable: myDonorRegistration.isAvailable,
                      gender: myDonorRegistration.gender || 'male',
                      age: myDonorRegistration.age ? String(myDonorRegistration.age) : ''
                    });
                    setShowRegModal(true);
                  }}
                  className="px-3 py-1.5 bg-white text-rose-800 font-black text-[11px] rounded-xl shadow-md hover:bg-rose-50 transition-all cursor-pointer flex items-center gap-1"
                >
                  <Edit3 size={12} />
                  <span>তথ্য আপডেট</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Success Notification Alert */}
      {regSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-2xl flex items-center gap-3 text-emerald-900 text-xs font-bold shadow-sm animate-bounce">
          <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
          <span>{regSuccessMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🛡️ PRIVACY & ACCESS POLICY BANNER (FOR NEW / UNREGISTERED USERS) */}
      {/* ========================================================================= */}
      {!isUnlocked ? (
        <div className="bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 border border-rose-200/80 p-5 sm:p-6 rounded-3xl shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 bg-rose-100 text-rose-800 px-3 py-1 rounded-full text-xs font-black">
                <Lock size={13} />
                <span>রক্তদাতা সুরক্ষা ও নম্বর গোপনীয়তা পলিসি</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                রক্তদাতাদের নাম ও রক্তের গ্রুপ সবার জন্য উন্মুক্ত • নম্বর দেখতে ডোনার রেজিস্ট্রেশন আবশ্যক
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-3xl">
                যেকোনো ভিজিটর প্রতিটি গ্রুপের রক্তদাতার সংখ্যা, নাম ও রক্তের গ্রুপ সরাসরি দেখতে পারবেন। তবে রক্তদাতাদের অযাচিত কল বা প্রাইভেসি সুরক্ষার জন্য <strong>শুধুমাত্র যারা রক্তদাতা হিসেবে নাম ও রক্তের গ্রুপ দিয়ে রেজিস্ট্রেশন করেছেন</strong>, তারাই ডোনারদের মোবাইল নম্বর দেখতে ও সরাসরি কল করতে পারবেন।
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                onClick={() => setShowRegModal(true)}
                className="px-5 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-red-600/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                <PlusCircle size={16} />
                <span>রক্তদাতা হিসেবে নিবন্ধন করুন</span>
              </button>
              <button
                onClick={() => {
                  setLookupError('');
                  setShowPhoneLookupModal(true);
                }}
                className="px-4 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs sm:text-sm rounded-2xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Phone size={14} />
                <span>পূর্বে নিবন্ধিত? নম্বর দিন</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-emerald-900 font-bold">
            <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
            <span>
              আপনার রক্তদাতা প্রোফাইল সক্রিয় রয়েছে। আপনি সকল রক্তদাতার <strong>নাম</strong>, <strong>রক্তের গ্রুপ</strong> ও <strong>মোবাইল নম্বর</strong> দেখতে এবং সরাসরি কল করতে পারছেন।
            </span>
          </div>
          <button
            onClick={() => setShowRegModal(true)}
            className="text-[11px] font-black text-emerald-800 underline hover:text-emerald-950 cursor-pointer"
          >
            প্রোফাইল তথ্য এডিট করুন
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🩸 BLOOD DONOR DIRECTORY & ADVANCED FILTERS (ACCESSIBLE TO ALL USERS) */}
      {/* ========================================================================= */}
      <div className="space-y-6">
          {/* Main Blood Group Categorization Tabs (As requested by user: A, B, O, A-, B-, O-, AB-) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-xs sm:text-sm text-slate-800 flex items-center gap-2">
                <span>🎯</span> রক্তের মূল গ্রুপ নির্বাচন করুন:
              </h4>
              <button
                onClick={() => {
                  setMainGroupFilter('all');
                  setSpecificGroupFilter('all');
                  setLocationFilter('all');
                  setAvailabilityFilter('all');
                  setSearchTerm('');
                }}
                className="text-[11px] font-black text-rose-600 hover:underline"
              >
                রিসেট ফিল্টার
              </button>
            </div>

            {/* 1. Main Category Tabs */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {[
                { id: 'all', label: 'সকল গ্রুপ', desc: 'সব রক্তদাতা', count: bloodGroupStats['all'] },
                { id: 'group_a', label: 'গ্রুপ A', desc: 'A+ ও A-', count: bloodGroupStats['group_a'] },
                { id: 'group_b', label: 'গ্রুপ B', desc: 'B+ ও B-', count: bloodGroupStats['group_b'] },
                { id: 'group_o', label: 'গ্রুপ O', desc: 'O+ ও O-', count: bloodGroupStats['group_o'] },
                { id: 'group_ab', label: 'গ্রুপ AB', desc: 'AB+ ও AB-', count: bloodGroupStats['group_ab'] },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setMainGroupFilter(tab.id as any);
                    setSpecificGroupFilter('all');
                  }}
                  className={`p-3 rounded-2xl font-black text-xs transition-all flex flex-col items-center justify-center gap-0.5 border cursor-pointer ${
                    mainGroupFilter === tab.id
                      ? 'bg-rose-700 text-white border-rose-700 shadow-md shadow-rose-200 scale-102'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-rose-300'
                  }`}
                >
                  <span className="text-sm font-black">{tab.label}</span>
                  <span className={`text-[10px] font-bold ${mainGroupFilter === tab.id ? 'text-rose-200' : 'text-slate-400'}`}>
                    {tab.desc} ({tab.count})
                  </span>
                </button>
              ))}
            </div>

            {/* 2. Specific Blood Group Pills (Including A-, B-, O-, AB-) */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                নির্দিষ্ট রক্তের গ্রুপ ফিল্টার (পজিটিভ / নেগেটিভ):
              </div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                <button
                  onClick={() => setSpecificGroupFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                    specificGroupFilter === 'all'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  সব গ্রুপ ({filteredDonors.length})
                </button>

                {BLOOD_GROUPS.map(grp => {
                  const count = bloodGroupStats[grp] || 0;
                  const isNeg = grp.includes('-');
                  return (
                    <button
                      key={grp}
                      onClick={() => setSpecificGroupFilter(grp)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 border ${
                        specificGroupFilter === grp
                          ? 'bg-red-600 text-white border-red-600 shadow-md scale-105'
                          : isNeg
                          ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                          : 'bg-white text-slate-800 border-slate-200 hover:border-red-300'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${isNeg ? 'bg-amber-400' : 'bg-red-500'}`} />
                      <span>{grp}</span>
                      <span className={`text-[10px] ${specificGroupFilter === grp ? 'text-red-100' : 'text-slate-400'}`}>
                        ({count})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Secondary Controls Bar: Area Filter, Ready Filter & Search */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="রক্তদাতার নাম, মোবাইল নম্বর, থানা বা এলাকা দিয়ে খুঁজুন..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-rose-500"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Ready Only Toggle & New Donor Button */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAvailabilityFilter(prev => prev === 'ready' ? 'all' : 'ready')}
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    availabilityFilter === 'ready'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>শুধুমাত্র প্রস্তুত ডোনার ({bloodGroupStats['ready']})</span>
                </button>

                <button
                  onClick={() => {
                    setFormData({
                      name: profile?.full_name || '',
                      bloodGroup: 'A+',
                      phone: profile?.phone || '',
                      alternatePhone: '',
                      district: profile?.district || 'নীলফামারী',
                      upazila: profile?.upazila || '',
                      address: profile?.village || '',
                      lastDonationDate: '',
                      isAvailable: true,
                      gender: 'male',
                      age: ''
                    });
                    setShowRegModal(true);
                  }}
                  className="px-3.5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <PlusCircle size={14} />
                  <span>নতুন ডোনার যোগ</span>
                </button>
              </div>
            </div>

            {/* Area quick pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
              <span className="text-[10px] font-black text-slate-400 whitespace-nowrap">📍 এলাকা:</span>
              {[
                { id: 'all', label: 'সকল এলাকা' },
                { id: 'নীলফামারী', label: 'নীলফামারী' },
                { id: 'সৈয়দপুর', label: 'সৈয়দপুর' },
                { id: 'ডোমার', label: 'ডোমার' },
                { id: 'ডিমলা', label: 'ডিমলা' },
                { id: 'জলঢাকা', label: 'জলঢাকা' },
                { id: 'কিশোরগঞ্জ', label: 'কিশোরগঞ্জ' },
                { id: 'রংপুর', label: 'রংপুর' },
                { id: 'দিনাজপুর', label: 'দিনাজপুর' }
              ].map(loc => (
                <button
                  key={loc.id}
                  onClick={() => setLocationFilter(loc.id)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer whitespace-nowrap ${
                    locationFilter === loc.id
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {loc.label}
                </button>
              ))}
            </div>
          </div>

          {/* Donors List Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h4 className="font-black text-xs sm:text-sm text-slate-800 flex items-center gap-2">
                <span>📋</span> রক্তদাতাদের তালিকা ({filteredDonors.length} জন পাওয়া গেছে)
              </h4>
              <span className="text-[10px] text-slate-400 font-bold">
                জরুরি প্রয়োজনে যেকোনো নম্বরে সরাসরি কল করুন
              </span>
            </div>

            {filteredDonors.length === 0 ? (
              <div className="bg-white p-10 rounded-3xl border border-slate-200 text-center space-y-3">
                <div className="text-4xl">🔍</div>
                <h4 className="font-black text-sm text-slate-800">কোনো রক্তদাতা পাওয়া যায়নি</h4>
                <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
                  আপনার নির্বাচিত ফিল্টারে বর্তমানে কোনো রক্তদাতা নেই। ফিল্টার পরিবর্তন করুন অথবা জরুরি রক্তের রিকোয়েস্ট পাঠান।
                </p>
                <div className="flex justify-center gap-2 pt-2">
                  <button
                    onClick={() => {
                      setMainGroupFilter('all');
                      setSpecificGroupFilter('all');
                      setLocationFilter('all');
                      setSearchTerm('');
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl"
                  >
                    সকল রক্তদাতা দেখুন
                  </button>
                  <button
                    onClick={() => setShowEmergencyModal(true)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl"
                  >
                    জরুরি রক্তের আবেদন করুন
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDonors.map(donor => {
                  const isNeg = donor.bloodGroup.includes('-');
                  return (
                    <div
                      key={donor.id}
                      className={`bg-white rounded-3xl p-5 border transition-all hover:shadow-lg relative overflow-hidden space-y-3.5 text-left ${
                        isNeg ? 'border-rose-200 shadow-xs' : 'border-slate-100 shadow-2xs'
                      }`}
                    >
                      {/* Top Header inside card */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {/* Blood Group Badge */}
                          <div className={`w-13 h-13 rounded-2xl flex flex-col items-center justify-center font-black shrink-0 shadow-md ${
                            isNeg
                              ? 'bg-gradient-to-br from-amber-500 to-rose-600 text-white'
                              : 'bg-gradient-to-br from-red-600 to-rose-700 text-white'
                          }`}>
                            <span className="text-lg leading-none">{donor.bloodGroup}</span>
                            <span className="text-[8px] uppercase tracking-wider opacity-90">রক্তের গ্রুপ</span>
                          </div>

                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <h5 className="font-black text-sm text-slate-900 leading-tight">{donor.name}</h5>
                              {donor.verified && (
                                <span title="যাচাইকৃত রক্তদাতা" className="text-emerald-600">
                                  <ShieldCheck size={14} />
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                              <MapPin size={11} className="text-rose-500 shrink-0" />
                              <span>{donor.district}{donor.upazila ? ` • ${donor.upazila}` : ''}</span>
                            </p>
                          </div>
                        </div>

                        {/* Availability Pill */}
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                          donor.isAvailable
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}>
                          {donor.isAvailable ? '🟢 প্রস্তুত' : '⏳ বিরতি'}
                        </span>
                      </div>

                      {/* Detailed Address & Info */}
                      <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 space-y-1 text-[11px] text-slate-600 font-medium">
                        <div className="flex items-start gap-1.5">
                          <span className="text-slate-400 font-bold shrink-0">ঠিকানা:</span>
                          <span className="font-bold text-slate-700 leading-snug">{donor.address}</span>
                        </div>
                        {donor.lastDonationDate && (
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                            <Clock size={11} className="text-slate-400" />
                            <span>সর্বশেষ রক্তদান: {donor.lastDonationDate}</span>
                          </div>
                        )}
                        {donor.totalDonationsCount && donor.totalDonationsCount > 0 && (
                          <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 font-bold">
                            <Award size={11} />
                            <span>মোট রক্তদান করেছেন: {donor.totalDonationsCount} বার</span>
                          </div>
                        )}
                      </div>

                      {/* Contact & Call Action Buttons */}
                      {isUnlocked ? (
                        <div className="pt-1 flex items-center gap-2">
                          {/* Direct Call */}
                          <a
                            href={`tel:${donor.phone}`}
                            className="flex-1 py-2.5 px-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-black text-xs rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Phone size={13} />
                            <span>কল করুন ({donor.phone})</span>
                          </a>

                          {/* WhatsApp Button */}
                          <a
                            href={`https://wa.me/88${donor.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`আসসালামু আলাইকুম ${donor.name} ভাই/আপু, Nilpha ডিজিটাল স্বাস্থ্য অ্যাপে আপনার রক্তদাতা প্রোফাইল দেখে জরুরি রক্তের প্রয়োজনে যোগাযোগ করছি।`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl transition-all"
                            title="হোয়াটসঅ্যাপে মেসেজ পাঠান"
                          >
                            <MessageSquare size={15} />
                          </a>

                          {/* Copy Phone */}
                          <button
                            onClick={() => handleCopyPhone(donor.phone)}
                            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer"
                            title="নম্বর কপি করুন"
                          >
                            {copiedPhone === donor.phone ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                          </button>
                        </div>
                      ) : (
                        <div className="pt-1 space-y-2">
                          <div className="flex items-center justify-between text-xs px-1">
                            <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
                              <Phone size={11} /> মোবাইল নম্বর:
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-black text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200 text-xs">
                                {donor.phone && donor.phone.length >= 5 ? `${donor.phone.slice(0, 3)}••••••${donor.phone.slice(-2)}` : '০১৭•••••••'}
                              </span>
                              <span className="text-[9px] font-black text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                <Lock size={9} /> গোপন
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => setShowRegModal(true)}
                            className="w-full py-2.5 px-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-black text-xs rounded-xl shadow-xs hover:shadow active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Lock size={13} />
                            <span>মোবাইল নম্বর দেখতে ডোনার নিবন্ধন করুন</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      {/* ========================================================================= */}
      {/* 📝 REGISTRATION MODAL FORM */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showRegModal && (
          <div className="fixed inset-0 z-[1000] overflow-y-auto flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
            {/* Backdrop click dismiss */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRegModal(false)}
              className="fixed inset-0 cursor-pointer"
            />

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="bg-white rounded-t-[28px] sm:rounded-3xl max-w-xl w-full max-h-[92vh] sm:max-h-[88vh] shadow-2xl border border-slate-100 flex flex-col overflow-hidden text-left relative z-10 my-auto"
            >
              {/* Pinned / Fixed Header */}
              <div className="flex items-center justify-between border-b border-slate-100 p-4 sm:p-6 bg-white shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center text-xl font-black shrink-0">
                    🩸
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-800">
                      রক্তদাতা হিসেবে নিবন্ধন করুন
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">
                      তথ্য প্রদান করে রক্তদাতা ডিরেক্টরি আনলক করুন
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRegModal(false)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-500 transition-all cursor-pointer shrink-0"
                  aria-label="বন্ধ করুন"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form wrapping scrollable inputs and pinned footer */}
              <form onSubmit={handleRegisterDonor} className="flex flex-col flex-1 overflow-hidden min-h-0">
                {/* Scrollable Form Body */}
                <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 overscroll-contain">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Name */}
                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-700">আপনার পূর্ণ নাম *</label>
                      <input
                        type="text"
                        required
                        placeholder="যেমন: মো: আরিফুল ইসলাম"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-rose-500"
                      />
                    </div>

                    {/* Blood Group */}
                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-700">রক্তের গ্রুপ *</label>
                      <select
                        value={formData.bloodGroup}
                        onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value as BloodGroup })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-rose-700 outline-none focus:border-rose-500"
                      >
                        {BLOOD_GROUPS.map(grp => (
                          <option key={grp} value={grp}>{grp} ({grp.includes('+') ? 'পজিটিভ' : 'নেগেটিভ'})</option>
                        ))}
                      </select>
                    </div>

                    {/* Phone */}
                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-700">মোবাইল নম্বর *</label>
                      <input
                        type="tel"
                        required
                        placeholder="যেমন: 01712345678"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-rose-500"
                      />
                    </div>

                    {/* Alternate Phone */}
                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-700">বিকল্প নম্বর / হোয়াটসঅ্যাপ (ঐচ্ছিক)</label>
                      <input
                        type="tel"
                        placeholder="বিকল্প নম্বর"
                        value={formData.alternatePhone}
                        onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-rose-500"
                      />
                    </div>

                    {/* District */}
                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-700">জেলা *</label>
                      <select
                        value={formData.district}
                        onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-rose-500"
                      >
                        <option value="নীলফামারী">নীলফামারী</option>
                        <option value="রংপুর">রংপুর</option>
                        <option value="দিনাজপুর">দিনাজপুর</option>
                        <option value="কুড়িগ্রাম">কুড়িগ্রাম</option>
                        <option value="লালমনিরহাট">লালমনিরহাট</option>
                        <option value="পঞ্চগড়">পঞ্চগড়</option>
                        <option value="ঠাকুরগাঁও">ঠাকুরগাঁও</option>
                        <option value="ঢাকা">ঢাকা</option>
                        <option value="অন্যান্য">অন্যান্য</option>
                      </select>
                    </div>

                    {/* Upazila */}
                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-700">উপজেলা / থানা</label>
                      <input
                        type="text"
                        placeholder="যেমন: সদর / সৈয়দপুর / ডোমার / ডিমলা"
                        value={formData.upazila}
                        onChange={(e) => setFormData({ ...formData, upazila: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>

                  {/* Detailed Address */}
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-700">বিস্তারিত ঠিকানা / গ্রাম / মহল্লা *</label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: কলেজ রোড, নতুন বাজার, নীলফামারী"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-rose-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Last Donation Date */}
                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-700">সর্বশেষ রক্তদানের তারিখ (যদি দিয়ে থাকেন)</label>
                      <input
                        type="date"
                        value={formData.lastDonationDate}
                        onChange={(e) => setFormData({ ...formData, lastDonationDate: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-rose-500"
                      />
                    </div>

                    {/* Ready to Donate */}
                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-700">রক্তদানে বর্তমান প্রস্তুতি</label>
                      <select
                        value={formData.isAvailable ? 'yes' : 'no'}
                        onChange={(e) => setFormData({ ...formData, isAvailable: e.target.value === 'yes' })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-rose-500"
                      >
                        <option value="yes">🟢 হ্যাঁ, আমি রক্তদানে প্রস্তুত</option>
                        <option value="no">⏳ সাময়িক বিরতিতে আছি (৩ মাস পর)</option>
                      </select>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200 font-medium">
                    🔒 আপনার দেওয়া তথ্য শুধুমাত্র জরুরি রক্তের প্রয়োজনে রক্তগ্রহীতাদের সাহায্যার্থে ব্যবহার হবে।
                  </p>
                </div>

                {/* Pinned Action Footer - Always visible and accessible on all mobile screens */}
                <div className="p-3.5 sm:p-5 border-t border-slate-200 bg-white sticky bottom-0 flex items-center justify-between gap-3 shrink-0 z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
                  <button
                    type="button"
                    onClick={() => setShowRegModal(false)}
                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-all cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReg}
                    className="flex-1 sm:flex-none px-6 py-3.5 bg-red-600 hover:bg-red-700 active:scale-95 disabled:opacity-50 text-white text-xs sm:text-sm font-black rounded-xl shadow-lg shadow-red-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer touch-manipulation"
                  >
                    {isSubmittingReg ? <RefreshCw size={16} className="animate-spin" /> : <Check size={16} />}
                    <span>নিবন্ধন কনফার্ম করুন</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 🚨 EMERGENCY BLOOD REQUEST MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showEmergencyModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/75 backdrop-blur-md overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEmergencyModal(false)}
              className="absolute inset-0 cursor-pointer"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl max-w-lg w-full max-h-[92dvh] sm:max-h-[88vh] shadow-2xl border border-red-100 flex flex-col overflow-hidden text-left relative z-10"
            >
              <div className="flex items-center justify-between border-b border-slate-100 p-4 sm:p-6 bg-white shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center text-xl font-black shrink-0">
                    🚨
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      জরুরি রক্তের রিকোয়েস্ট পাঠান
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">
                      Nilpha ব্লাড সাপোর্ট টিম ও রক্তদাতা নেটওয়ার্কে রিকোয়েস্ট যাবে
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEmergencyModal(false)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-500 transition-all cursor-pointer shrink-0"
                  aria-label="বন্ধ করুন"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSendEmergencyRequest} className="flex flex-col flex-1 overflow-hidden min-h-0">
                <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 overscroll-contain">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-700">প্রয়োজনীয় রক্তের গ্রুপ *</label>
                      <select
                        value={emergencyBloodGroup}
                        onChange={(e) => setEmergencyBloodGroup(e.target.value as BloodGroup)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-red-600 outline-none"
                      >
                        {BLOOD_GROUPS.map(grp => (
                          <option key={grp} value={grp}>{grp}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-700">রক্তের পরিমাণ (ব্যাগ) *</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={emergencyBags}
                        onChange={(e) => setEmergencyBags(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-700">হাসপাতালের নাম ও ঠিকানা *</label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: নীলফামারী সদর হাসপাতাল / রংপুর মেডিকেল"
                      value={emergencyHospital}
                      onChange={(e) => setEmergencyHospital(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-red-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-700">রোগীর স্বজনের মোবাইল নম্বর *</label>
                    <input
                      type="tel"
                      required
                      placeholder="যেমন: 01712345678"
                      value={emergencyPhone}
                      onChange={(e) => setEmergencyPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-red-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-700">অতিরিক্ত বিবরণ বা রোগীর সমস্যা</label>
                    <textarea
                      rows={2}
                      placeholder="যেমন: রোগীর সিজারিয়ান অপারেশন / ডেঙ্গু রোগী / রক্তের অতি জরুরি প্রয়োজন"
                      value={emergencyNotes}
                      onChange={(e) => setEmergencyNotes(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/95 backdrop-blur-sm flex items-center justify-end gap-3 shrink-0 z-10">
                  <button
                    type="button"
                    onClick={() => setShowEmergencyModal(false)}
                    className="px-4 py-3 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-all cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="flex-1 sm:flex-none px-6 py-3 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-black rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <MessageSquare size={16} />
                    <span>হোয়াটসঅ্যাপে জানান</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 📱 QUICK PHONE LOOKUP MODAL (FOR RETURNING DONORS) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showPhoneLookupModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/75 backdrop-blur-md overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPhoneLookupModal(false)}
              className="absolute inset-0 cursor-pointer"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-white rounded-3xl max-w-md w-full max-h-[92dvh] sm:max-h-[88vh] shadow-2xl border border-slate-100 flex flex-col overflow-hidden relative z-10 text-left"
            >
              <div className="flex items-center justify-between border-b border-slate-100 p-4 sm:p-5 shrink-0 bg-white">
                <div className="flex items-center gap-2 text-slate-800">
                  <div className="w-9 h-9 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center text-lg shrink-0">
                    📱
                  </div>
                  <div>
                    <h4 className="font-black text-sm">পূর্বে নিবন্ধিত রক্তদাতা আনলক</h4>
                    <p className="text-[11px] text-slate-500 font-medium">আপনার মোবাইল নম্বর যাচাই করুন</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPhoneLookupModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer shrink-0"
                  aria-label="বন্ধ করুন"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handlePhoneLookup} className="flex flex-col flex-1 overflow-hidden min-h-0">
                <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 overscroll-contain">
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    আপনি যদি ইতিপূর্বে রক্তদাতা হিসেবে রেজিস্ট্রেশন করে থাকেন, তবে নিচে আপনার মোবাইল নম্বরটি লিখুন। নম্বর মিলে গেলে সকল রক্তদাতার নম্বর তাৎক্ষণিকভাবে আপনার জন্য আনলক হয়ে যাবে।
                  </p>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700">আপনার মোবাইল নম্বর</label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        autoFocus
                        placeholder="যেমন: 01712345678"
                        value={phoneLookupInput}
                        onChange={(e) => {
                          setPhoneLookupInput(e.target.value);
                          setLookupError('');
                        }}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-rose-500"
                      />
                      <Phone size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                    </div>
                    {lookupError && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold space-y-2">
                        <p>{lookupError}</p>
                        <button
                          type="button"
                          onClick={() => {
                            setShowPhoneLookupModal(false);
                            setShowRegModal(true);
                          }}
                          className="text-xs text-rose-800 underline font-black cursor-pointer"
                        >
                          নতুন রক্তদাতা হিসেবে নিবন্ধন করতে এখানে ক্লিক করুন →
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50/95 backdrop-blur-sm flex items-center justify-end gap-2.5 shrink-0 z-10">
                  <button
                    type="button"
                    onClick={() => setShowPhoneLookupModal(false)}
                    className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="flex-1 sm:flex-none px-6 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-xs font-black rounded-xl shadow-md active:scale-95 transition-all cursor-pointer"
                  >
                    যাচাই ও আনলক করুন
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
