import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Stethoscope, FileText, User, Calendar, Phone, 
  MapPin, Activity, CheckCircle2, Clock, Search, 
  Plus, Send, Printer, Eye, Award, ShieldCheck, 
  Sparkles, RefreshCw, AlertCircle, Trash2, HeartPulse, LogOut,
  Video, ExternalLink, FileDown, History, ArrowRight
} from 'lucide-react';
import { Prescription, Profile, Doctor, UserRole, LabTest, Subscription } from '../../types';
import { DigitalPrescriptionModal } from './DigitalPrescriptionModal';
import { db, auth } from '../../services/firebase';
import { 
  collection, query, where, getDocs, doc, 
  updateDoc, serverTimestamp, getDoc 
} from 'firebase/firestore';
import { convertToBanglaDigits, calculateSubscriptionTiming } from '../../utils';

interface DoctorPortalProps {
  currentProfile: Profile | null;
  doctorsList: Doctor[];
  labTestsList: LabTest[];
  onLogout?: () => void;
}

export const DoctorPortal: React.FC<DoctorPortalProps> = ({
  currentProfile,
  doctorsList,
  labTestsList,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<'appointments' | 'prescriptions' | 'profile'>('appointments');
  const [appointmentFilter, setAppointmentFilter] = useState<'all' | 'pending' | 'live' | 'visited'>('all');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [subscriptionsMap, setSubscriptionsMap] = useState<Record<string, Subscription>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchedPatientHistory, setSearchedPatientHistory] = useState<Prescription[] | null>(null);

  // Selected doctor representation (if current user is a doctor or admin impersonating)
  const [doctorInfo, setDoctorInfo] = useState<Partial<Doctor>>({
    name: currentProfile?.full_name || 'ডা. বিশেষজ্ঞ চিকিৎসক',
    degree: 'MBBS, BCS (Health), FCPS / MD',
    specialty: 'মেডিসিন ও স্বাস্থ্য বিশেষজ্ঞ',
    phone: currentProfile?.phone || '01352669100',
    bmdcReg: 'A-10824',
    chamber: 'নীলফামারী আধুনিক ডিজিটাল হেলথ সেন্টার',
  });

  // Digital Prescription Modal State
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [selectedPatientForRx, setSelectedPatientForRx] = useState<any>(null);
  const [selectedPrescriptionToView, setSelectedPrescriptionToView] = useState<Prescription | null>(null);

  // Fetch appointments, prescriptions, and subscriptions
  const loadDoctorData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch appointments
      const appSnap = await getDocs(collection(db, 'appointments'));
      const appList = appSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Sort newest first
      appList.sort((a: any, b: any) => {
        const tA = a.created_at?.seconds ? a.created_at.seconds * 1000 : Date.parse(a.created_at || '0');
        const tB = b.created_at?.seconds ? b.created_at.seconds * 1000 : Date.parse(b.created_at || '0');
        return tB - tA;
      });
      setAppointments(appList);

      // 2. Fetch prescriptions
      const presSnap = await getDocs(collection(db, 'prescriptions'));
      const presList = presSnap.docs.map(d => ({ id: d.id, ...d.data() } as Prescription));
      presList.sort((a, b) => Date.parse(b.created_at || '0') - Date.parse(a.created_at || '0'));
      setPrescriptions(presList);

      // 3. Fetch subscriptions for fast lookups
      try {
        const subSnap = await getDocs(collection(db, 'subscriptions'));
        const sMap: Record<string, Subscription> = {};
        subSnap.docs.forEach(d => {
          const s = d.data() as Subscription;
          if (s.user_id) sMap[s.user_id] = s;
          if (s.card_number) sMap[s.card_number] = s;
          if (s.user_phone) sMap[s.user_phone] = s;
          if ((s as any).phone) sMap[(s as any).phone] = s;
        });
        setSubscriptionsMap(sMap);
      } catch (err) {
        console.warn('Subscriptions fetch error:', err);
      }
    } catch (err) {
      console.error('Error loading doctor portal data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDoctorData();
  }, [currentProfile]);

  // Handle Mark Status
  const handleUpdateStatus = async (appId: string, status: 'visited' | 'absent' | 'pending') => {
    try {
      await updateDoc(doc(db, 'appointments', appId), {
        status,
        updated_at: serverTimestamp()
      });
      setAppointments(prev => prev.map(a => a.id === appId ? { ...a, status } : a));
    } catch (err) {
      console.error('Status update error:', err);
      alert('স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে!');
    }
  };

  // Trigger WhatsApp Call for Live Doctor Consultations
  const handleStartLiveCall = (app: any) => {
    let cleanPhone = (app.patient_phone || '').replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '88' + cleanPhone;
    else if (!cleanPhone.startsWith('88')) cleanPhone = '880' + cleanPhone;

    const callMsg = `*আসসালামু আলাইকুম ${app.patient_name || 'রোগী'}*\nজেবি হেলথকেয়ার লাইভ ডক্টর পোর্টাল থেকে চিকিৎসক আপনার সাথে ভিডিও/অডিও কনসালটেশন শুরু করতে যুক্ত হচ্ছেন। অনুগ্রহ করে লাইনে থাকুন।`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(callMsg)}`, '_blank');
  };

  // Open Prescription Builder for a patient
  const handleOpenRxForPatient = (app: any) => {
    // Generate PID if none
    const cleanPhone = (app.patient_phone || '').replace(/\D/g, '').slice(-5);
    const pid = app.patient_online_id || app.online_id || (cleanPhone ? `PID-${cleanPhone}` : `PID-${Math.floor(10000 + Math.random() * 90000)}`);

    setSelectedPatientForRx({
      id: app.patient_id || 'guest',
      onlineId: pid,
      patient_online_id: pid,
      name: app.patient_name,
      phone: app.patient_phone,
      age: app.patient_age,
      gender: app.patient_gender || 'পুরুষ',
      address: app.patient_address,
      appointmentId: app.id,
      problems: app.problems,
      subscriptionCard: app.subscription_card_number,
      subscriptionPlan: app.subscription_plan_name,
      has30Discount: Boolean(app.has_30_discount_on_tests || app.subscription_card_number)
    });
    setSelectedPrescriptionToView(null);
    setIsPrescriptionModalOpen(true);
  };

  // Open Prescription Builder for blank / new
  const handleOpenBlankRx = () => {
    setSelectedPatientForRx(null);
    setSelectedPrescriptionToView(null);
    setIsPrescriptionModalOpen(true);
  };

  // View existing prescription
  const handleViewPrescription = (pres: Prescription) => {
    setSelectedPrescriptionToView(pres);
    setSelectedPatientForRx({
      id: pres.patient_id,
      onlineId: pres.patient_online_id,
      patient_online_id: pres.patient_online_id,
      name: pres.patient_name,
      phone: pres.patient_phone,
      age: pres.patient_age,
      gender: pres.patient_gender,
      address: pres.patient_address,
      subscriptionCard: pres.subscription_card_number,
      subscriptionPlan: pres.subscription_plan_name,
      has30Discount: Boolean(pres.has_discount_badge || pres.subscription_card_number)
    });
    setIsPrescriptionModalOpen(true);
  };

  // Quick re-prescribe / follow-up for a patient from prescription history
  const handleFollowupRx = (pres: Prescription) => {
    setSelectedPatientForRx({
      id: pres.patient_id,
      onlineId: pres.patient_online_id,
      patient_online_id: pres.patient_online_id,
      name: pres.patient_name,
      phone: pres.patient_phone,
      age: pres.patient_age,
      gender: pres.patient_gender,
      address: pres.patient_address,
      problems: `পূর্বের রোগ: ${pres.diagnosis || 'N/A'} (ফলো-আপ)`,
      subscriptionCard: pres.subscription_card_number,
      subscriptionPlan: pres.subscription_plan_name,
      has30Discount: Boolean(pres.has_discount_badge || pres.subscription_card_number)
    });
    setSelectedPrescriptionToView(null);
    setIsPrescriptionModalOpen(true);
  };

  // Calculate Waiting Queue Count
  const waitingPatientsCount = appointments.filter(a => a.status === 'pending' || !a.status).length;
  const liveWaitingCount = appointments.filter(a => (a.status === 'pending' || !a.status) && a.is_live_consultation).length;

  // Filtered Appointments
  const filteredAppointments = appointments.filter(app => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = (
      (app.patient_name || '').toLowerCase().includes(q) ||
      (app.patient_phone || '').includes(q) ||
      (app.patient_online_id || '').toLowerCase().includes(q) ||
      (app.doctor_name || '').toLowerCase().includes(q) ||
      (app.subscription_card_number || '').toLowerCase().includes(q) ||
      (app.date || '').toLowerCase().includes(q)
    );

    if (!matchesSearch) return false;

    if (appointmentFilter === 'pending') return app.status === 'pending' || !app.status;
    if (appointmentFilter === 'live') return app.is_live_consultation;
    if (appointmentFilter === 'visited') return app.status === 'visited';

    return true;
  });

  // Filtered Prescriptions
  const filteredPrescriptions = prescriptions.filter(pres => {
    const q = searchTerm.toLowerCase();
    return (
      (pres.patient_name || '').toLowerCase().includes(q) ||
      (pres.patient_phone || '').includes(q) ||
      (pres.patient_online_id || '').toLowerCase().includes(q) ||
      (pres.prescription_code || '').toLowerCase().includes(q) ||
      (pres.diagnosis || '').toLowerCase().includes(q) ||
      (pres.medicines || '').toLowerCase().includes(q)
    );
  });

  // Check if search query matches an exact patient's online ID or phone to show patient history group
  const matchedPatientPrescriptions = searchTerm.trim().length >= 3 
    ? prescriptions.filter(p => 
        (p.patient_online_id && p.patient_online_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.patient_phone && p.patient_phone.includes(searchTerm.replace(/\D/g, '')))
      )
    : [];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-teal-900 border border-blue-500/20 rounded-[32px] p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-blue-400 shadow-xl">
            <Stethoscope size={36} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-blue-500/20 text-blue-300 border border-blue-400/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                Doctor Consultation Portal
              </span>
              <span className="bg-rose-500/30 text-rose-300 border border-rose-400/40 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 bg-rose-400 rounded-full" /> লাইভ অনলাইন কিউ
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
              ডাক্তার ড্যাশবোর্ড ও প্রেসক্রিপশন পোর্টাল
            </h1>
            <p className="text-xs text-slate-300 font-bold mt-1">
              অনলাইন লাইভ কনসালটেশন কিউ, রোগীর অনলাইন আইডি দিয়ে পূর্বের হিস্ট্রি সার্চ ও অফিসিয়াল প্রেসক্রিপশন তৈরি করুন
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10 w-full md:w-auto">
          <button
            onClick={handleOpenBlankRx}
            className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-900/40 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={18} /> নতুন প্রেসক্রিপশন লিখুন
          </button>

          <button
            onClick={loadDoctorData}
            className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all shadow-md"
            title="রিফ্রেশ করুন"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Live Waiting Queue Counter Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div 
          onClick={() => { setActiveTab('appointments'); setAppointmentFilter('pending'); }}
          className="bg-gradient-to-r from-amber-950/70 to-orange-950/70 border border-amber-500/40 rounded-3xl p-5 shadow-lg flex items-center justify-between cursor-pointer hover:border-amber-400 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center text-xl font-black border border-amber-400/30">
              <Clock size={24} className="animate-spin" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-amber-400 tracking-wider">মোট অপেক্ষমাণ রোগী</p>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                {convertToBanglaDigits(waitingPatientsCount)} জন
              </h3>
            </div>
          </div>
          <span className="text-xs bg-amber-500 text-slate-950 font-black px-3 py-1 rounded-xl">
            কিউ দেখুন
          </span>
        </div>

        <div 
          onClick={() => { setActiveTab('appointments'); setAppointmentFilter('live'); }}
          className="bg-gradient-to-r from-rose-950/70 to-red-950/70 border border-rose-500/40 rounded-3xl p-5 shadow-lg flex items-center justify-between cursor-pointer hover:border-rose-400 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-300 flex items-center justify-center text-xl font-black border border-rose-400/30">
              <Video size={24} className="animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-rose-400 tracking-wider">🔴 লাইভ ভিডিও/অডিও কিউ</p>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                {convertToBanglaDigits(liveWaitingCount)} জন
              </h3>
            </div>
          </div>
          <span className="text-xs bg-rose-500 text-white font-black px-3 py-1 rounded-xl animate-pulse">
            লাইভ কল
          </span>
        </div>

        <div 
          onClick={() => { setActiveTab('appointments'); setAppointmentFilter('visited'); }}
          className="bg-gradient-to-r from-emerald-950/70 to-teal-950/70 border border-emerald-500/40 rounded-3xl p-5 shadow-lg flex items-center justify-between cursor-pointer hover:border-emerald-400 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-xl font-black border border-emerald-400/30">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">আজকের ভিজিট সম্পন্ন</p>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                {convertToBanglaDigits(appointments.filter(a => a.status === 'visited').length)} জন
              </h3>
            </div>
          </div>
          <span className="text-xs bg-emerald-500 text-slate-950 font-black px-3 py-1 rounded-xl">
            সম্পন্ন
          </span>
        </div>
      </div>

      {/* Navigation Tabs & Powerful Patient ID Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700/60 w-full sm:w-auto overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
              activeTab === 'appointments'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar size={15} /> রোগীর কিউ ({appointments.length})
          </button>
          <button
            onClick={() => setActiveTab('prescriptions')}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
              activeTab === 'prescriptions'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText size={15} /> প্রেসক্রিপশন ও রোগীর হিস্ট্রি ({prescriptions.length})
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User size={15} /> ডক্টর প্রোফাইল
          </button>
        </div>

        {/* Global Search Bar supporting Patient Online ID (PID-XXXXX) */}
        <div className="relative w-full sm:w-96">
          <input
            type="text"
            placeholder="🔍 রোগীর অনলাইন আইডি (PID-...), মোবাইল বা নাম লিখুন..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800/90 border border-slate-700 rounded-2xl pl-10 pr-10 py-3 text-xs font-bold text-white placeholder:text-slate-400 outline-none focus:border-blue-500 shadow-inner"
          />
          <Search size={16} className="text-blue-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs bg-slate-700 px-1.5 py-0.5 rounded-full"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* When Doctor Searches Patient ID, Show Targeted Patient Profile & History Summary */}
      {matchedPatientPrescriptions.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-950/90 to-blue-950/90 border-2 border-indigo-500/60 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-indigo-500/30 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/40 border border-indigo-400/50 flex items-center justify-center text-indigo-300">
                <History size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-white">
                    রোগীর অতীত প্রেসক্রিপশন ও মেডিকেল হিস্ট্রি
                  </h3>
                  <span className="bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 text-[10px] font-black px-2.5 py-0.5 rounded-full font-mono">
                    {matchedPatientPrescriptions[0].patient_online_id || 'PID-Found'}
                  </span>
                </div>
                <p className="text-xs text-indigo-200 font-bold">
                  রোগী: {matchedPatientPrescriptions[0].patient_name} • ফোন: {matchedPatientPrescriptions[0].patient_phone || 'N/A'} • মোট {convertToBanglaDigits(matchedPatientPrescriptions.length)} টি প্রেসক্রিপশন রেকর্ড
                </p>
              </div>
            </div>

            <button
              onClick={() => handleFollowupRx(matchedPatientPrescriptions[0])}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
            >
              <Plus size={15} /> রোগীর জন্য নতুন প্রেসক্রিপশন লিখুন
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {matchedPatientPrescriptions.map((p, pIdx) => (
              <div key={p.id || pIdx} className="bg-slate-900/80 border border-indigo-400/30 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex justify-between items-center text-[10px] text-slate-400">
                  <span className="font-mono text-indigo-300 font-bold">{p.prescription_code || 'Rx-Code'}</span>
                  <span>{new Date(p.created_at).toLocaleDateString('bn-BD')}</span>
                </div>
                {p.diagnosis && (
                  <p className="text-xs font-black text-white bg-indigo-950/60 p-2 rounded-lg border border-indigo-500/30">
                    রোগ/ডায়াগনসিস: {p.diagnosis}
                  </p>
                )}
                <p className="text-slate-300 line-clamp-2 font-medium text-[11px]">
                  💊 {p.medicines}
                </p>
                <div className="pt-2 flex gap-2">
                  <button
                    onClick={() => handleViewPrescription(p)}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black text-[11px] py-1.5 rounded-xl flex items-center justify-center gap-1"
                  >
                    <Eye size={12} /> দেখুন ও প্রিন্ট
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Appointment Sub-Filters */}
      {activeTab === 'appointments' && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
          {[
            { id: 'all', label: 'সকল অ্যাপয়েন্টমেন্ট', count: appointments.length },
            { id: 'pending', label: '⏳ অপেক্ষমাণ কিউ', count: waitingPatientsCount },
            { id: 'live', label: '🔴 লাইভ কল রিকোয়েস্ট', count: liveWaitingCount },
            { id: 'visited', label: '✓ ভিজিট সম্পন্ন', count: appointments.filter(a => a.status === 'visited').length }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setAppointmentFilter(f.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-black tracking-tight whitespace-nowrap transition-all border ${
                appointmentFilter === f.id
                  ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750'
              }`}
            >
              {f.label} ({convertToBanglaDigits(f.count)})
            </button>
          ))}
        </div>
      )}

      {/* Main Tab Content */}
      {activeTab === 'appointments' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAppointments.length === 0 ? (
              <div className="col-span-full bg-slate-800/40 border border-slate-700/50 rounded-3xl p-12 text-center text-slate-400 space-y-2">
                <Calendar size={36} className="mx-auto opacity-40 text-blue-400" />
                <p className="text-sm font-black">কোনো রোগী পাওয়া যায়নি</p>
                <p className="text-xs text-slate-500">রোগীরা অনলাইন থেকে বুকিং দিলে এখানে সরাসরি দৃশ্যমান হবে।</p>
              </div>
            ) : (
              filteredAppointments.map((app, idx) => {
                // Find matching subscription if any
                const matchedSub = (app.patient_id && subscriptionsMap[app.patient_id]) ||
                  (app.subscription_card_number && subscriptionsMap[app.subscription_card_number]) ||
                  (app.patient_phone && subscriptionsMap[app.patient_phone]) ||
                  (app.active_subscription);

                const subTiming = calculateSubscriptionTiming(matchedSub);
                const hasSub = Boolean(app.subscription_card_number || app.has_30_discount_on_tests || matchedSub);
                const isFreeDoc = Boolean(app.has_free_doctor || app.consultation_fee === 0 || isFreeDoctorSub(matchedSub));
                const isLive = Boolean(app.is_live_consultation);
                const cleanPhone = (app.patient_phone || '').replace(/\D/g, '').slice(-5);
                const patientPID = app.patient_online_id || (cleanPhone ? `PID-${cleanPhone}` : `PID-10824`);

                return (
                  <div
                    key={app.id || idx}
                    className={`bg-slate-800/90 border rounded-3xl p-5 space-y-4 shadow-xl transition-all flex flex-col justify-between ${
                      isLive 
                        ? 'border-rose-500/60 ring-1 ring-rose-500/30' 
                        : 'border-slate-700/70 hover:border-blue-500/50'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Status Badges */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                            app.status === 'visited'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : app.status === 'absent'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                          }`}>
                            {app.status === 'visited' ? '✓ সম্পন্ন (Visited)' : app.status === 'absent' ? '✕ অনুপস্থিত' : '⏳ অপেক্ষারত কিউ'}
                          </span>

                          {isLive && (
                            <span className="bg-rose-500/25 text-rose-300 border border-rose-400/40 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Video size={10} className="animate-pulse" /> লাইভ {app.consultation_type === 'audio' ? 'অডিও' : 'ভিডিও'}
                            </span>
                          )}

                          {app.has_prescription && (
                            <span className="bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[9px] font-black px-2 py-0.5 rounded-full">
                              Rx রচিত
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] font-bold text-slate-400">
                          {app.date}
                        </span>
                      </div>

                      {/* Patient Details with Online ID */}
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-base font-black text-white">{app.patient_name}</h3>
                          <span className="text-[10px] font-black bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded font-mono">
                            {patientPID}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 font-bold">
                          বয়স: {app.patient_age || 'N/A'} {app.patient_address && `• ঠিকানা: ${app.patient_address}`}
                        </p>
                        <p className="text-xs text-blue-400 font-bold flex items-center gap-1 mt-0.5 font-mono">
                          <Phone size={12} /> {app.patient_phone}
                        </p>
                      </div>

                      {/* Subscription Timing & Expiry Detail Box */}
                      {hasSub ? (
                        <div className="bg-gradient-to-r from-emerald-950/90 to-teal-950/90 border border-emerald-500/40 rounded-2xl p-3.5 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-emerald-300 uppercase tracking-wider flex items-center gap-1">
                              ⭐ সাবস্ক্রিপশন কার্ড
                            </span>
                            <span className="text-[10px] font-black bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full">
                              {app.subscription_card_number || matchedSub?.card_number || 'সক্রিয়'}
                            </span>
                          </div>
                          
                          <p className="text-[11px] font-bold text-emerald-200">
                            {app.subscription_plan_name || matchedSub?.plan_name || 'প্যাকেজ ২ (ফ্রি ডক্টর + ২০% টেস্ট ছাড়)'}
                          </p>

                          {/* Subscription Start Date, Expiry Date & Remaining Days */}
                          <div className="bg-black/30 p-2 rounded-xl text-[10px] space-y-0.5 text-slate-300 border border-white/5">
                            <p>
                              📅 একটিভ ডেট: <span className="font-black text-emerald-300">{subTiming.formattedActivationDate}</span>
                            </p>
                            <p>
                              ⏳ মেয়াদ উত্তীর্ণ: <span className="font-black text-amber-300">{subTiming.formattedExpiryDate}</span>
                            </p>
                            <p className="text-emerald-400 font-black pt-0.5">
                              🎉 অবশিষ্ট সময়: <span className="underline">{subTiming.remainingDaysBengaliText}</span>
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-slate-900/60 border border-slate-700/60 rounded-2xl p-2.5 text-xs text-slate-300 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400">ভিজিট ফি:</span>
                          <span className="text-xs font-black text-amber-400">
                            ৳{app.consultation_fee || (isLive ? 200 : 50)} ({app.payment_status === 'paid' ? 'পরিশোধিত' : 'পেন্ডিং'})
                          </span>
                        </div>
                      )}

                      {/* Problems / Chief complaints */}
                      {app.problems && app.problems !== 'উল্লিখিত নেই' && (
                        <div className="bg-slate-900/50 p-2.5 rounded-xl border border-slate-700/40 text-xs">
                          <span className="text-[10px] text-slate-400 font-black uppercase block">লক্ষণ ও সমস্যা:</span>
                          <p className="text-slate-300 font-medium line-clamp-2">{app.problems}</p>
                        </div>
                      )}
                    </div>

                    {/* Action Controls */}
                    <div className="pt-3 border-t border-slate-700/50 space-y-2">
                      {/* Live Call Button & Multi-Party Video Room */}
                      {isLive && (
                        <div className="space-y-1.5">
                          <button
                            type="button"
                            onClick={() => handleStartLiveCall(app)}
                            className="w-full bg-rose-600 hover:bg-rose-500 text-white font-black text-xs py-2.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-rose-900/40 transition-all active:scale-95 animate-pulse"
                          >
                            <Video size={16} /> কল শুরু করুন (WhatsApp Live Call)
                          </button>

                          {app.meeting_room_url && (
                            <a
                              href={app.meeting_room_url}
                              target="_blank"
                              rel="noreferrer"
                              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[11px] py-2 rounded-2xl flex items-center justify-center gap-1.5 transition-all shadow-md"
                            >
                              <ExternalLink size={13} /> লাইভ কনফারেন্স রুম (ডাক্তার + মডারেটর + রোগী)
                            </a>
                          )}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenRxForPatient(app)}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-xs py-3 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 transition-all active:scale-95"
                      >
                        <FileText size={16} /> প্রেসক্রিপশন লিখুন (Rx)
                      </button>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(app.id, 'visited')}
                          className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                            app.status === 'visited'
                              ? 'bg-emerald-500 text-slate-950 font-black'
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}
                        >
                          ✓ দেখা হয়েছে
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(app.id, 'absent')}
                          className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                            app.status === 'absent'
                              ? 'bg-rose-500 text-white font-black'
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}
                        >
                          ✕ অনুপস্থিত
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Prescriptions & Patient History Tab */}
      {activeTab === 'prescriptions' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPrescriptions.length === 0 ? (
              <div className="col-span-full bg-slate-800/40 border border-slate-700/50 rounded-3xl p-12 text-center text-slate-400 space-y-2">
                <FileText size={36} className="mx-auto opacity-40 text-blue-400" />
                <p className="text-sm font-black">কোনো প্রেসক্রিপশন রেকর্ড পাওয়া যায়নি</p>
                <p className="text-xs text-slate-500">রোগীর অনলাইন আইডি বা ফোন নম্বর দিয়ে সার্চ করুন অথবা "নতুন প্রেসক্রিপশন লিখুন" বাটনে ক্লিক করুন।</p>
              </div>
            ) : (
              filteredPrescriptions.map((pres) => (
                <div
                  key={pres.id}
                  className="bg-slate-800/90 border border-slate-700/70 hover:border-emerald-500/50 rounded-3xl p-5 space-y-4 shadow-xl transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-black px-2.5 py-1 rounded-full font-mono uppercase">
                        {pres.prescription_code || 'Rx-Pad'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {new Date(pres.created_at).toLocaleDateString('bn-BD')}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-black text-white">{pres.patient_name}</h3>
                        {pres.patient_online_id && (
                          <span className="text-[10px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-2 py-0.5 rounded font-mono">
                            {pres.patient_online_id}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 font-bold">
                        বয়স: {pres.patient_age || 'N/A'} • {pres.patient_gender || 'পুরুষ'}
                      </p>
                      {pres.patient_phone && (
                        <p className="text-xs text-slate-400 font-bold mt-0.5 font-mono">
                          📞 {pres.patient_phone}
                        </p>
                      )}
                    </div>

                    {pres.diagnosis && (
                      <div className="bg-indigo-950/60 border border-indigo-500/30 p-2.5 rounded-xl text-xs">
                        <span className="text-[9px] text-indigo-300 font-black uppercase block">Diagnosis (রোগের বিবরণ):</span>
                        <p className="text-indigo-200 font-bold">{pres.diagnosis}</p>
                      </div>
                    )}

                    <div className="bg-slate-900/50 p-2.5 rounded-xl border border-slate-700/40 text-xs text-slate-300 space-y-1">
                      <span className="text-[9px] text-slate-400 font-black uppercase block">ওষুধ সমূহ (Rx):</span>
                      <p className="line-clamp-2 text-[11px] text-slate-300">{pres.medicines}</p>
                    </div>

                    {pres.subscription_card_number && (
                      <span className="inline-block bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold px-2 py-0.5 rounded-lg">
                        ⭐ মেম্বারশিপ: {pres.subscription_card_number}
                      </span>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-700/50 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleViewPrescription(pres)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md"
                    >
                      <Eye size={14} /> দেখুন ও প্রিন্ট
                    </button>

                    <button
                      type="button"
                      onClick={() => handleFollowupRx(pres)}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs px-3 py-2.5 rounded-xl flex items-center justify-center gap-1 transition-all shadow-md"
                      title="নতুন ফলো-আপ প্রেসক্রিপশন"
                    >
                      <Plus size={14} /> ফলো-আপ
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Doctor Profile Tab */}
      {activeTab === 'profile' && (
        <div className="max-w-2xl mx-auto bg-slate-800/90 border border-slate-700/70 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex items-center gap-4 border-b border-slate-700/60 pb-6">
            <div className="w-16 h-16 rounded-full bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400 text-2xl font-black">
              👨‍⚕️
            </div>
            <div>
              <h2 className="text-xl font-black text-white">{doctorInfo.name}</h2>
              <p className="text-xs text-blue-400 font-bold">{doctorInfo.specialty}</p>
              <p className="text-xs text-slate-400 font-bold">{doctorInfo.degree}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-700/50 space-y-1">
              <span className="text-[10px] text-slate-400 font-black uppercase block">BMDC রেজিস্ট্রেশন</span>
              <p className="font-bold text-white text-sm">{doctorInfo.bmdcReg || 'A-10824'}</p>
            </div>
            <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-700/50 space-y-1">
              <span className="text-[10px] text-slate-400 font-black uppercase block">মোবাইল নম্বর</span>
              <p className="font-bold text-white text-sm">{doctorInfo.phone || '01352669100'}</p>
            </div>
            <div className="sm:col-span-2 bg-slate-900/60 p-4 rounded-2xl border border-slate-700/50 space-y-1">
              <span className="text-[10px] text-slate-400 font-black uppercase block">ডিজিটাল চেম্বার</span>
              <p className="font-bold text-white text-sm">{doctorInfo.chamber || 'নীলফামারী আধুনিক ডিজিটাল হেলথ সেন্টার'}</p>
            </div>
          </div>

          {onLogout && (
            <div className="pt-4 border-t border-slate-700/60">
              <button
                type="button"
                onClick={onLogout}
                className="w-full bg-rose-600 hover:bg-rose-500 text-white font-black text-xs py-3 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <LogOut size={16} /> লগআউট করুন
              </button>
            </div>
          )}
        </div>
      )}

      {/* Digital Prescription Suite Modal */}
      <DigitalPrescriptionModal
        isOpen={isPrescriptionModalOpen}
        onClose={() => setIsPrescriptionModalOpen(false)}
        doctorInfo={doctorInfo}
        doctorProfile={doctorInfo}
        patientData={selectedPatientForRx}
        patientInfo={selectedPatientForRx}
        existingPrescription={selectedPrescriptionToView}
        labTestsList={labTestsList}
        onPrescriptionSaved={() => {
          loadDoctorData();
          setIsPrescriptionModalOpen(false);
        }}
        onSuccess={() => {
          loadDoctorData();
          setIsPrescriptionModalOpen(false);
        }}
      />
    </div>
  );
};

function isFreeDoctorSub(sub: any): boolean {
  if (!sub) return false;
  return (
    sub.plan_type === 'tier2_test_and_doctor' ||
    sub.plan_type === 'test_and_doctor' ||
    sub.has_free_doctor === true ||
    sub.package_type === 'test_and_doctor'
  );
}
