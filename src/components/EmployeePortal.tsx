import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, UserCheck, Key, Phone, UserPlus, 
  Search, Copy, Check, Lock, Stethoscope, TestTube, 
  Gift, Users, Pill, Ambulance, HeartHandshake, 
  CalendarCheck, LogOut, ArrowRight, Eye, EyeOff, 
  FileText, Sparkles, MapPin, Calendar, Clock, AlertCircle
} from 'lucide-react';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth as getTempAuth, createUserWithEmailAndPassword, signOut as signTempOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { Profile, UserRole, LabTest, Order, Doctor, Clinic } from '../../types';

interface EmployeePortalProps {
  currentProfile: Profile;
  profiles: Profile[];
  labTests: LabTest[];
  orders: Order[];
  doctors: Doctor[];
  hospitals: Clinic[];
  appointments: any[];
  onLogout: () => void;
  onRefreshData?: () => Promise<void>;
  onNavigateHome?: () => void;
}

export const EmployeePortal: React.FC<EmployeePortalProps> = ({
  currentProfile,
  profiles,
  labTests,
  orders,
  doctors,
  hospitals,
  appointments,
  onLogout,
  onRefreshData,
  onNavigateHome
}) => {
  const permissions = currentProfile.permissions || {};
  const myStaffCode = (currentProfile.referral_code || '').trim().toUpperCase();

  // Determine initial active tab based on what's permitted
  const initialTab = useMemo(() => {
    if (permissions.create_user_with_code) return 'create_user';
    if (permissions.view_my_referred_users) return 'my_users';
    if (permissions.manage_lab_tests) return 'lab_tests';
    if (permissions.free_doctor_consultation) return 'free_doctor';
    if (permissions.manage_appointments) return 'appointments';
    if (permissions.manage_medicine_orders) return 'medicines';
    if (permissions.manage_blood_donors) return 'blood_donors';
    return 'overview';
  }, [permissions]);

  const [activeTab, setActiveTab] = useState<string>(initialTab);

  // Copied text helper
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // --- STATE: CREATE USER WITH STAFF CODE ---
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientPhone, setNewPatientPhone] = useState('');
  const [newPatientPassword, setNewPatientPassword] = useState('123456');
  const [newPatientDistrict, setNewPatientDistrict] = useState('নীলফামারী');
  const [newPatientUpazila, setNewPatientUpazila] = useState('ডোমার');
  const [newPatientVillage, setNewPatientVillage] = useState('');
  const [isCreatingPatient, setIsCreatingPatient] = useState(false);
  const [patientCreateError, setPatientCreateError] = useState<string | null>(null);
  const [createdPatientSuccess, setCreatedPatientSuccess] = useState<{
    name: string;
    phone: string;
    pass: string;
    code: string;
  } | null>(null);

  // Generate unique password for user
  const generateRandomUserPass = () => {
    const num = Math.floor(100000 + Math.random() * 900000);
    setNewPatientPassword(String(num));
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setPatientCreateError(null);

    const name = newPatientName.trim();
    const phone = newPatientPhone.trim().replace(/[^0-9]/g, '');
    const pass = newPatientPassword.trim();

    if (!name) {
      setPatientCreateError('রোগী/গ্রাহকের পূর্ণ নাম লিখুন।');
      return;
    }
    if (phone.length !== 11 || !phone.startsWith('01')) {
      setPatientCreateError('সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017xxxxxxxx)।');
      return;
    }
    if (pass.length < 6) {
      setPatientCreateError('পাসওয়ার্ড ন্যূনতম ৬ ডিজিট হতে হবে।');
      return;
    }

    const phoneExists = profiles.some(p => p.phone === phone);
    if (phoneExists) {
      setPatientCreateError(`এই মোবাইল নম্বর (${phone}) ইতিমধ্যে অ্যাকাউন্টে রয়েছে।`);
      return;
    }

    setIsCreatingPatient(true);
    let tempAppRef: any = null;

    try {
      const appOptions = auth.app.options;
      const tempAppName = `TempPatientApp-${Date.now()}`;
      tempAppRef = initializeApp(appOptions, tempAppName);
      const tempAuth = getTempAuth(tempAppRef);

      const normalizedEmail = `${phone}@nilpha.com`;
      let userId = '';

      try {
        const credential = await createUserWithEmailAndPassword(tempAuth, normalizedEmail, pass);
        userId = credential.user.uid;
      } catch (authErr: any) {
        console.warn("TempAuth createUser error, fallback to custom ID:", authErr?.message || authErr);
        userId = 'pat_' + phone + '_' + Date.now();
      }

      // Generate user referral code
      const cleanName = name.replace(/[^A-Za-z]/g, '').slice(0, 4).toUpperCase() || 'USER';
      const userRefCode = `${cleanName}${phone.slice(-4)}`;

      const newProfile: Profile = {
        id: userId,
        full_name: name,
        phone: phone,
        virtual_email: normalizedEmail,
        role: UserRole.PATIENT,
        status: 'active',
        referral_code: userRefCode,
        referred_by_code: myStaffCode, // AUTOMATICALLY ATTACH EMPLOYEE STAFF CODE!
        created_password: pass,
        district: newPatientDistrict,
        upazila: newPatientUpazila,
        village: newPatientVillage,
        reward_points: 0,
        taka_balance: 0,
        created_by: currentProfile.id,
        created_at: new Date().toISOString()
      };

      await setDoc(doc(db, 'profiles', userId), newProfile);
      await signTempOut(tempAuth);

      setCreatedPatientSuccess({
        name,
        phone,
        pass,
        code: myStaffCode
      });

      setNewPatientName('');
      setNewPatientPhone('');
      setNewPatientPassword('123456');
      setNewPatientVillage('');

      if (onRefreshData) {
        await onRefreshData();
      }
    } catch (err: any) {
      console.error("Create patient error:", err);
      setPatientCreateError(err.message || 'ইউজার অ্যাকাউন্ট তৈরিতে সমস্যা হয়েছে।');
    } finally {
      if (tempAppRef) {
        try {
          await deleteApp(tempAppRef);
        } catch (delErr) {
          console.error("Temp app delete error:", delErr);
        }
      }
      setIsCreatingPatient(false);
    }
  };

  // --- MY REFERRED USERS LIST ---
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const myReferredUsers = useMemo(() => {
    if (!myStaffCode) return [];
    return profiles.filter(p => {
      const isReferredByMe = p.referred_by_code?.trim().toUpperCase() === myStaffCode;
      const isCreatedByMe = p.created_by === currentProfile.id;
      return isReferredByMe || isCreatedByMe;
    });
  }, [profiles, myStaffCode, currentProfile.id]);

  const filteredMyUsers = useMemo(() => {
    if (!userSearchQuery.trim()) return myReferredUsers;
    const q = userSearchQuery.toLowerCase().trim();
    return myReferredUsers.filter(u => 
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.phone || '').includes(q) ||
      (u.village || '').toLowerCase().includes(q) ||
      (u.upazila || '').toLowerCase().includes(q)
    );
  }, [myReferredUsers, userSearchQuery]);

  // --- LAB TESTS VIEW ---
  const [labSearch, setLabSearch] = useState('');
  const filteredLabTests = useMemo(() => {
    if (!labSearch.trim()) return labTests;
    const q = labSearch.toLowerCase().trim();
    return labTests.filter(t => 
      (t.name || '').toLowerCase().includes(q) ||
      (t.category || '').toLowerCase().includes(q)
    );
  }, [labTests, labSearch]);

  // --- APPOINTMENTS VIEW ---
  const [appSearch, setAppSearch] = useState('');
  const filteredAppointments = useMemo(() => {
    if (!appSearch.trim()) return appointments;
    const q = appSearch.toLowerCase().trim();
    return appointments.filter(a => 
      (a.patient_name || '').toLowerCase().includes(q) ||
      (a.patient_phone || '').toLowerCase().includes(q) ||
      (a.doctor_name || '').toLowerCase().includes(q) ||
      (a.referred_by_code || '').toLowerCase().includes(q)
    );
  }, [appointments, appSearch]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-left font-sans">
      {/* Top Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center font-black text-white shadow-md">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-base text-white">স্টাফ ওয়ার্কস্পেস (Staff Portal)</h1>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-black uppercase">
                  🟢 কর্মী আইডি
                </span>
              </div>
              <p className="text-xs text-slate-400 font-bold flex items-center gap-2">
                <span>{currentProfile.full_name}</span>
                <span>•</span>
                <span className="text-violet-300 font-medium">{currentProfile.designation || 'মেডিকেল এসিস্ট্যান্ট'}</span>
                <span>•</span>
                <span className="font-mono text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800">
                  কোড: {myStaffCode}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateHome && (
              <button
                onClick={onNavigateHome}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                🌐 মূল ওয়েবসাইট
              </button>
            )}
            <button
              onClick={onLogout}
              className="text-xs bg-rose-600/90 hover:bg-rose-600 text-white px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <LogOut size={14} /> লগআউট
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto no-scrollbar border-t border-slate-800/80 pt-1">
          {/* Create User Tab */}
          <button
            onClick={() => setActiveTab('create_user')}
            className={`px-4 py-3 text-xs font-black uppercase tracking-wider flex items-center gap-2 whitespace-nowrap border-b-2 transition-all cursor-pointer ${
              activeTab === 'create_user'
                ? 'border-violet-500 text-violet-400 bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus size={14} />
            নতুন ইউজার/রোগী তৈরি
            {!permissions.create_user_with_code && <Lock size={11} className="text-rose-400 ml-1" />}
          </button>

          {/* My Users List Tab */}
          <button
            onClick={() => setActiveTab('my_users')}
            className={`px-4 py-3 text-xs font-black uppercase tracking-wider flex items-center gap-2 whitespace-nowrap border-b-2 transition-all cursor-pointer ${
              activeTab === 'my_users'
                ? 'border-violet-500 text-violet-400 bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users size={14} />
            আমার ইউজার তালিকা ({myReferredUsers.length})
            {!permissions.view_my_referred_users && <Lock size={11} className="text-rose-400 ml-1" />}
          </button>

          {/* Lab Tests Tab */}
          <button
            onClick={() => setActiveTab('lab_tests')}
            className={`px-4 py-3 text-xs font-black uppercase tracking-wider flex items-center gap-2 whitespace-nowrap border-b-2 transition-all cursor-pointer ${
              activeTab === 'lab_tests'
                ? 'border-violet-500 text-violet-400 bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <TestTube size={14} />
            ল্যাব টেস্ট চেক ও অর্ডার
            {!permissions.manage_lab_tests && <Lock size={11} className="text-rose-400 ml-1" />}
          </button>

          {/* Free Doctor Consultation Tab */}
          <button
            onClick={() => setActiveTab('free_doctor')}
            className={`px-4 py-3 text-xs font-black uppercase tracking-wider flex items-center gap-2 whitespace-nowrap border-b-2 transition-all cursor-pointer ${
              activeTab === 'free_doctor'
                ? 'border-violet-500 text-violet-400 bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Gift size={14} />
            ফ্রি ডক্টর কনসালটেশন
            {!permissions.free_doctor_consultation && <Lock size={11} className="text-rose-400 ml-1" />}
          </button>

          {/* Doctor Appointments Tab */}
          <button
            onClick={() => setActiveTab('appointments')}
            className={`px-4 py-3 text-xs font-black uppercase tracking-wider flex items-center gap-2 whitespace-nowrap border-b-2 transition-all cursor-pointer ${
              activeTab === 'appointments'
                ? 'border-violet-500 text-violet-400 bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CalendarCheck size={14} />
            ডাক্তার সিরিয়াল
            {!permissions.manage_appointments && <Lock size={11} className="text-rose-400 ml-1" />}
          </button>

          {/* Medicines Orders Tab */}
          <button
            onClick={() => setActiveTab('medicines')}
            className={`px-4 py-3 text-xs font-black uppercase tracking-wider flex items-center gap-2 whitespace-nowrap border-b-2 transition-all cursor-pointer ${
              activeTab === 'medicines'
                ? 'border-violet-500 text-violet-400 bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Pill size={14} />
            ঔষধ অর্ডার
            {!permissions.manage_medicine_orders && <Lock size={11} className="text-rose-400 ml-1" />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">

        {/* TAB 1: CREATE USER WITH STAFF CODE */}
        {activeTab === 'create_user' && (
          <div>
            {!permissions.create_user_with_code ? (
              <div className="bg-white p-10 rounded-[32px] border border-slate-200 text-center space-y-3">
                <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl mx-auto flex items-center justify-center">
                  <Lock size={26} />
                </div>
                <h3 className="text-base font-black text-slate-800">🔒 অ্যাক্সেস অনুমোদিত নয়</h3>
                <p className="text-xs text-slate-500 font-bold max-w-md mx-auto">
                  আপনার স্টাফ একাউন্টে "নিজের কোড দিয়ে ইউজার তৈরি" সুবিধাটি এডমিন কর্তৃক সক্রিয় করা হয়নি। এটি সক্রিয় করার জন্য এডমিনের সাথে যোগাযোগ করুন।
                </p>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in">
                {/* Banner */}
                <div className="bg-gradient-to-r from-violet-900 to-indigo-900 text-white p-6 rounded-[32px] shadow-lg flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="bg-violet-500/30 text-violet-200 border border-violet-400/30 font-black text-[10px] uppercase px-3 py-1 rounded-full flex items-center gap-1.5 w-fit mb-2">
                      <UserPlus size={12} /> স্টাফ রেফারেল অ্যাসিস্ট্যান্ট
                    </span>
                    <h2 className="text-xl font-black text-white">
                      নিজের কোড ({myStaffCode}) দিয়ে নতুন রোগী/ইউজার রেজিস্ট্রেশন
                    </h2>
                    <p className="text-xs text-violet-200 font-medium mt-1">
                      রোগীর নাম ও মোবাইল নম্বর দিয়ে সাবমিট করলেই স্বয়ংক্রিয়ভাবে আপনার স্টাফ কোড যুক্ত হয়ে একাউন্ট তৈরি হয়ে যাবে।
                    </p>
                  </div>
                </div>

                {/* Success Card */}
                {createdPatientSuccess && (
                  <div className="bg-emerald-50 border-2 border-emerald-300 p-5 rounded-[28px] shadow-md space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-emerald-900 flex items-center gap-2">
                        <Check className="text-emerald-600" size={18} /> রোগী অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে!
                      </h4>
                      <button 
                        onClick={() => setCreatedPatientSuccess(null)}
                        className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                      >
                        ✕ বন্ধ করুন
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-white p-3.5 rounded-2xl border border-emerald-200 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">রোগীর নাম:</span>
                        <strong className="text-slate-800">{createdPatientSuccess.name}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">লগইন ফোন নম্বর:</span>
                        <strong className="text-indigo-600 font-mono">{createdPatientSuccess.phone}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">পাসওয়ার্ড:</span>
                        <strong className="text-emerald-700 font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">{createdPatientSuccess.pass}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">রেফারেল কোড:</span>
                        <strong className="text-violet-700 font-mono">{createdPatientSuccess.code}</strong>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const msg = `আপনার অ্যাকাউন্ট তৈরি হয়েছে:\nনাম: ${createdPatientSuccess.name}\nমোবাইল নম্বর: ${createdPatientSuccess.phone}\nপাসওয়ার্ড: ${createdPatientSuccess.pass}\nস্টাফ কোড: ${createdPatientSuccess.code}\nঅ্যাপ লিংক: https://ais-dev-izdxiw3n7dquszegwcvuu6-74713138350.asia-east1.run.app`;
                        copyToClipboard(msg, 'created_pat_msg');
                      }}
                      className="text-[11px] bg-emerald-600 text-white font-black px-3.5 py-1.5 rounded-xl shadow-xs hover:bg-emerald-700 flex items-center gap-1.5 transition-all cursor-pointer w-fit"
                    >
                      {copiedId === 'created_pat_msg' ? <Check size={14} /> : <Copy size={14} />} 
                      {copiedId === 'created_pat_msg' ? 'রোগীর তথ্য কপি হয়েছে!' : 'রোগীকে পাঠানোর তথ্য কপি করুন'}
                    </button>
                  </div>
                )}

                {patientCreateError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{patientCreateError}</span>
                  </div>
                )}

                {/* Form */}
                <div className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-100 shadow-xs max-w-2xl">
                  <form onSubmit={handleCreatePatient} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-700 uppercase">রোগী / গ্রাহকের নাম *</label>
                      <input
                        type="text"
                        required
                        placeholder="যেমন: মোঃ আল-আমিন সরকার"
                        value={newPatientName}
                        onChange={(e) => setNewPatientName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-violet-500 focus:bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-700 uppercase">মোবাইল নম্বর (লগইন নম্বর) *</label>
                      <input
                        type="tel"
                        required
                        maxLength={11}
                        placeholder="যেমন: 017xxxxxxxx"
                        value={newPatientPhone}
                        onChange={(e) => setNewPatientPhone(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold font-mono outline-none focus:border-violet-500 focus:bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-slate-700 uppercase">লগইন পাসওয়ার্ড *</label>
                        <button
                          type="button"
                          onClick={generateRandomUserPass}
                          className="text-[10px] text-violet-600 font-bold hover:underline"
                        >
                          র‍্যান্ডম জেনারেট করুন
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="ন্যূনতম ৬ ডিজিট"
                        value={newPatientPassword}
                        onChange={(e) => setNewPatientPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold font-mono outline-none focus:border-violet-500 focus:bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-black text-slate-700 uppercase">উপজেলা</label>
                        <input
                          type="text"
                          value={newPatientUpazila}
                          onChange={(e) => setNewPatientUpazila(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-black text-slate-700 uppercase">গ্রাম / ঠিকানা</label>
                        <input
                          type="text"
                          placeholder="যেমন: বামুনিয়া"
                          value={newPatientVillage}
                          onChange={(e) => setNewPatientVillage(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none"
                        />
                      </div>
                    </div>

                    {/* Locked Staff Code Preview */}
                    <div className="bg-violet-50/70 p-3.5 rounded-2xl border border-violet-200 flex items-center justify-between text-xs">
                      <span className="text-violet-900 font-bold">
                        অটোমেটিক যুক্ত হবে আপনার স্টাফ কোড:
                      </span>
                      <span className="font-mono font-black text-sm text-violet-700 bg-white px-2.5 py-0.5 rounded-lg border border-violet-200">
                        {myStaffCode}
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={isCreatingPatient}
                      className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-black py-3 rounded-2xl shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isCreatingPatient ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          অ্যাকাউন্ট তৈরি হচ্ছে...
                        </>
                      ) : (
                        <>
                          <UserPlus size={16} /> নতুন রোগী অ্যাকাউন্ট কনফার্ম করুন
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MY REFERRED USERS & PASSWORD VIEW */}
        {activeTab === 'my_users' && (
          <div>
            {!permissions.view_my_referred_users ? (
              <div className="bg-white p-10 rounded-[32px] border border-slate-200 text-center space-y-3">
                <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl mx-auto flex items-center justify-center">
                  <Lock size={26} />
                </div>
                <h3 className="text-base font-black text-slate-800">🔒 অ্যাক্সেস অনুমোদিত নয়</h3>
                <p className="text-xs text-slate-500 font-bold max-w-md mx-auto">
                  আপনার স্টাফ একাউন্টে "নিজের কোডের ইউজারদের তালিকা দেখা" সুবিধাটি বন্ধ রয়েছে।
                </p>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <Users className="text-violet-600" size={20} /> আপনার কোডের অধীনস্থ ইউজারদের তালিকা ({myReferredUsers.length} জন)
                    </h3>
                    <p className="text-xs text-slate-400 font-bold">
                      কোড: <span className="font-mono text-violet-700 font-black">{myStaffCode}</span>
                    </p>
                  </div>

                  {/* Password permission badge */}
                  <div className={`px-3 py-1.5 rounded-xl border text-[10px] font-black flex items-center gap-1.5 ${
                    permissions.view_user_passwords
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}>
                    <Key size={12} />
                    {permissions.view_user_passwords 
                      ? '✓ ইউজারদের পাসওয়ার্ড দেখার অনুমতি সক্রিয় আছে' 
                      : '🔒 পাসওয়ার্ড দেখার অনুমতি এডমিন দেননি'}
                  </div>
                </div>

                {/* Search Bar */}
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs">
                  <div className="relative">
                    <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="নাম, ফোন নম্বর বা গ্রাম দিয়ে খুঁজুন..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-bold outline-none focus:border-violet-500 focus:bg-white"
                    />
                  </div>
                </div>

                {filteredMyUsers.length === 0 ? (
                  <div className="bg-white p-10 rounded-[28px] border border-dashed border-slate-200 text-center space-y-2">
                    <p className="text-xs text-slate-400 font-bold">
                      আপনার কোড ব্যবহার করে কোনো রোগী বা গ্রাহক এখনো নিবন্ধিত হয়নি।
                    </p>
                  </div>
                ) : (
                  <div className="bg-white rounded-[28px] border border-slate-100 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase tracking-wider font-black text-slate-500">
                          <tr>
                            <th className="py-3 px-4">রোগী/গ্রাহকের নাম</th>
                            <th className="py-3 px-4">ফোন নম্বর</th>
                            <th className="py-3 px-4">ঠিকানা</th>
                            <th className="py-3 px-4">ইউনিক পাসওয়ার্ড</th>
                            <th className="py-3 px-4">রেজিস্ট্রেশন তারিখ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {filteredMyUsers.map(u => (
                            <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-3.5 px-4 font-bold text-slate-900">
                                {u.full_name}
                              </td>
                              <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">
                                {u.phone}
                              </td>
                              <td className="py-3.5 px-4 text-slate-500">
                                {[u.village, u.upazila, u.district].filter(Boolean).join(', ') || 'N/A'}
                              </td>
                              <td className="py-3.5 px-4">
                                {permissions.view_user_passwords ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono font-black text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
                                      {u.created_password || (u as any).password || '123456'}
                                    </span>
                                    <button
                                      onClick={() => copyToClipboard(u.created_password || (u as any).password || '123456', `u_pass_${u.id}`)}
                                      title="পাসওয়ার্ড কপি করুন"
                                      className="text-[10px] text-slate-400 hover:text-slate-600 p-1"
                                    >
                                      {copiedId === `u_pass_${u.id}` ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                    <Lock size={10} /> অনুমতি নেই
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-[10px] text-slate-400">
                                {u.created_at ? new Date(u.created_at).toLocaleDateString('bn-BD') : 'পূর্বের রেকর্ড'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: LAB TESTS CHECK & ORDER */}
        {activeTab === 'lab_tests' && (
          <div>
            {!permissions.manage_lab_tests ? (
              <div className="bg-white p-10 rounded-[32px] border border-slate-200 text-center space-y-3">
                <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl mx-auto flex items-center justify-center">
                  <Lock size={26} />
                </div>
                <h3 className="text-base font-black text-slate-800">🔒 অ্যাক্সেস অনুমোদিত নয়</h3>
                <p className="text-xs text-slate-500 font-bold max-w-md mx-auto">
                  আপনার স্টাফ একাউন্টে "ল্যাব টেস্ট চেক ও অর্ডার" সুবিধাটি বন্ধ রয়েছে।
                </p>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <TestTube className="text-indigo-600" size={20} /> ল্যাব টেস্ট ডিরেক্টরি ও মূল্য তালিকা ({labTests.length} টি টেস্ট)
                    </h3>
                    <p className="text-xs text-slate-400 font-bold">
                      টেস্ট চেক করুন, টেস্ট ফি জানুন এবং রোগীদের সহায়তাদান করুন।
                    </p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs">
                  <div className="relative">
                    <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="ল্যাব টেস্টের নাম বা ক্যাটাগরি দিয়ে খুঁজুন (যেমন: CBC, Lipid, X-Ray)..."
                      value={labSearch}
                      onChange={(e) => setLabSearch(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-bold outline-none focus:border-indigo-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {filteredLabTests.map(test => (
                    <div 
                      key={test.id}
                      className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs space-y-2 hover:border-indigo-200 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-black text-xs text-slate-900 leading-snug">{test.name}</h4>
                        <span className="text-[10px] font-mono font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg shrink-0">
                          ৳{test.price}
                        </span>
                      </div>
                      {test.category && (
                        <p className="text-[10px] text-slate-400 font-bold">
                          ক্যাটাগরি: {test.category}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: FREE DOCTOR CONSULTATION */}
        {activeTab === 'free_doctor' && (
          <div>
            {!permissions.free_doctor_consultation ? (
              <div className="bg-white p-10 rounded-[32px] border border-slate-200 text-center space-y-3">
                <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl mx-auto flex items-center justify-center">
                  <Lock size={26} />
                </div>
                <h3 className="text-base font-black text-slate-800">🔒 অ্যাক্সেস অনুমোদিত নয়</h3>
                <p className="text-xs text-slate-500 font-bold max-w-md mx-auto">
                  আপনার স্টাফ একাউন্টে "ফ্রি ডাক্তার কনসালটেশন" সুবিধাটি বন্ধ রয়েছে।
                </p>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in">
                <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-6 rounded-[32px] shadow-lg">
                  <span className="bg-white/20 text-white font-black text-[10px] uppercase px-3 py-1 rounded-full flex items-center gap-1.5 w-fit mb-2">
                    <Gift size={12} /> ফ্রি চিকিৎসা সহায়তা
                  </span>
                  <h2 className="text-xl font-black text-white">
                    🎁 ফ্রি ডাক্তার কনসালটেশন সার্ভিস
                  </h2>
                  <p className="text-xs text-amber-100 font-medium mt-1">
                    রোগীদের জন্য ফ্রি ডাক্তার টোকেন ও ভিডিও কনসালটেশন সহায়তা প্রদান করুন।
                  </p>
                </div>
                <div className="bg-white p-8 rounded-[32px] border border-slate-100 text-center space-y-3">
                  <p className="text-xs text-slate-600 font-bold">
                    ফ্রি ডক্টরস কনসালটেশন প্যানেল চালু রয়েছে। রোগীদের তথ্য যাচাই করে কনসালটেশন নিশ্চিত করুন।
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: APPOINTMENTS */}
        {activeTab === 'appointments' && (
          <div>
            {!permissions.manage_appointments ? (
              <div className="bg-white p-10 rounded-[32px] border border-slate-200 text-center space-y-3">
                <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl mx-auto flex items-center justify-center">
                  <Lock size={26} />
                </div>
                <h3 className="text-base font-black text-slate-800">🔒 অ্যাক্সেস অনুমোদিত নয়</h3>
                <p className="text-xs text-slate-500 font-bold max-w-md mx-auto">
                  আপনার স্টাফ একাউন্টে "ডাক্তার অ্যাপয়েন্টমেন্ট ও সিরিয়াল" সুবিধাটি বন্ধ রয়েছে।
                </p>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <CalendarCheck className="text-teal-600" size={20} /> ডক্টর অ্যাপয়েন্টমেন্ট ও সিরিয়াল তালিকা ({appointments.length} টি)
                  </h3>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs">
                  <div className="relative">
                    <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="রোগীর নাম, ফোন নম্বর অথবা ডাক্তারের নাম দিয়ে খুঁজুন..."
                      value={appSearch}
                      onChange={(e) => setAppSearch(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-bold outline-none focus:border-teal-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredAppointments.slice(0, 30).map(app => (
                    <div 
                      key={app.id}
                      className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-black text-xs text-slate-900">{app.patient_name || 'নাম নেই'}</h4>
                          <p className="text-[11px] font-mono text-indigo-600 font-bold">{app.patient_phone || 'ফোন নেই'}</p>
                        </div>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {app.status || 'pending'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-bold">
                        ডাক্তার: <span className="text-slate-900 font-black">{app.doctor_name || 'ডক্টর'}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: MEDICINES */}
        {activeTab === 'medicines' && (
          <div>
            {!permissions.manage_medicine_orders ? (
              <div className="bg-white p-10 rounded-[32px] border border-slate-200 text-center space-y-3">
                <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl mx-auto flex items-center justify-center">
                  <Lock size={26} />
                </div>
                <h3 className="text-base font-black text-slate-800">🔒 অ্যাক্সেস অনুমোদিত নয়</h3>
                <p className="text-xs text-slate-500 font-bold max-w-md mx-auto">
                  আপনার স্টাফ একাউন্টে "ঔষধ ও মেডিকেল সামগ্রী অর্ডার" সুবিধাটি বন্ধ রয়েছে।
                </p>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Pill className="text-sky-600" size={20} /> ঔষধ ও মেডিকেল পণ্য অর্ডার
                </h3>
                <div className="bg-white p-8 rounded-[32px] border border-slate-100 text-center text-xs text-slate-500 font-bold">
                  ঔষধ অর্ডার ম্যানেজমেন্ট প্যানেল প্রস্তুত রয়েছে।
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
