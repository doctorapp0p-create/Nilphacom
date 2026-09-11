import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, UserCheck, Key, Phone, UserPlus, 
  Trash2, Edit3, Eye, EyeOff, CheckSquare, Square, 
  Sparkles, AlertCircle, Search, Copy, Check, Lock, 
  Unlock, User, Stethoscope, TestTube, Gift, Users, 
  Pill, Ambulance, HeartHandshake, CalendarCheck
} from 'lucide-react';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth as getTempAuth, createUserWithEmailAndPassword, signOut as signTempOut } from 'firebase/auth';
import { doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { Profile, UserRole, EmployeePermissions } from '../../types';

interface AdminEmployeeManagerProps {
  profiles: Profile[];
  currentAdminProfile: Profile;
  onRefreshData?: () => Promise<void>;
}

const PERMISSION_CONFIG: {
  key: keyof EmployeePermissions;
  label: string;
  badge: string;
  description: string;
  icon: any;
  color: string;
}[] = [
  {
    key: 'manage_lab_tests',
    label: 'ল্যাব টেস্ট চেক ও অর্ডার (All test check & order)',
    badge: 'ল্যাব টেস্ট',
    description: 'সকল প্যাথলজি ও ডায়াগনস্টিক টেস্টের মূল্য চেক করা এবং রোগীর পক্ষ থেকে টেস্ট অর্ডার বুক করা।',
    icon: TestTube,
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200'
  },
  {
    key: 'free_doctor_consultation',
    label: 'ফ্রি ডাক্তার কনসালটেশন (Free doctor consultation)',
    badge: 'ফ্রি কনসালটেশন',
    description: 'ফ্রি ডাক্তার কনসালটেশন সেবা, ক্লেইম অনুমোদন ও সহায়তা প্রদান।',
    icon: Gift,
    color: 'text-amber-600 bg-amber-50 border-amber-200'
  },
  {
    key: 'create_user_with_code',
    label: 'নিজের কোড দিয়ে ইউজার তৈরি (Create user with staff code)',
    badge: 'ইউজার তৈরি',
    description: 'কর্মচারীর নিজস্ব রেফারেল কোড যুক্ত করে নতুন রোগী/গ্রাহক অ্যাকাউন্ট রেজিস্টার করা।',
    icon: UserPlus,
    color: 'text-blue-600 bg-blue-50 border-blue-200'
  },
  {
    key: 'view_my_referred_users',
    label: 'নিজের কোডের ইউজারদের তালিকা দেখা (View my users list)',
    badge: 'ইউজার লিস্ট',
    description: 'এই কর্মচারীর রেফারেল কোড দিয়ে খোলা সকল ইউজার ও রোগীর সম্পূর্ণ তালিকা দেখা।',
    icon: Users,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200'
  },
  {
    key: 'view_user_passwords',
    label: 'ইউজারদের পাসওয়ার্ড দেখা (View user passwords)',
    badge: 'পাসওয়ার্ড ভিউ',
    description: 'নিজের কোডে খোলা গ্রাহকদের লগইন পাসওয়ার্ড দেখা ও প্রয়োজনে সহায়তা প্রদান।',
    icon: Key,
    color: 'text-purple-600 bg-purple-50 border-purple-200'
  },
  {
    key: 'manage_appointments',
    label: 'ডাক্তার অ্যাপয়েন্টমেন্ট ও সিরিয়াল (Manage Appointments)',
    badge: 'ডাক্তার সিরিয়াল',
    description: 'ডাক্তারদের দৈনিক সিরিয়াল তালিকা দেখা, রোগী খোঁজা ও সিরিয়াল স্ট্যাটাস আপডেট করা।',
    icon: CalendarCheck,
    color: 'text-teal-600 bg-teal-50 border-teal-200'
  },
  {
    key: 'manage_medicine_orders',
    label: 'ঔষধ ও মেডিকেল সামগ্রী অর্ডার (Medicine Orders)',
    badge: 'ঔষধ অর্ডার',
    description: 'ঔষধ ও মেডিকেল সামগ্রীর বুকিং এবং কাস্টমার অর্ডার তদারকি।',
    icon: Pill,
    color: 'text-sky-600 bg-sky-50 border-sky-200'
  },
  {
    key: 'manage_blood_donors',
    label: 'রক্তদাতা ডিরেক্টরি (Blood Donor Directory)',
    badge: 'রক্তদাতা',
    description: 'ব্লাড ডোনারদের ডাটাবেজ অনুসন্ধান ও জরুরি রোগীদের সাথে ডোনার ম্যাচিং।',
    icon: UserCheck,
    color: 'text-rose-600 bg-rose-50 border-rose-200'
  },
  {
    key: 'manage_ambulance_emergency',
    label: 'জরুরি অ্যাম্বুলেন্স ও SOS (Ambulance & SOS)',
    badge: 'ইমার্জেন্সি SOS',
    description: 'জরুরি এম্বুলেন্স সেবা এবং রোগীদের SOS অ্যালার্ট দেখা ও সহযোগিতা করা।',
    icon: Ambulance,
    color: 'text-red-600 bg-red-50 border-red-200'
  },
  {
    key: 'manage_donations',
    label: 'সিজার অনুদান ও মানবসেবা ফান্ড (Maternity & Charity Fund)',
    badge: 'ডোনেশন ফান্ড',
    description: 'গরিব গর্ভবতী মায়েদের অনুদান আবেদন ও মানবসেবা ফান্ড তালিকা দেখা।',
    icon: HeartHandshake,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200'
  }
];

const DEFAULT_EMPLOYEE_PERMISSIONS: EmployeePermissions = {
  manage_lab_tests: true,
  free_doctor_consultation: true,
  create_user_with_code: true,
  view_my_referred_users: true,
  view_user_passwords: true,
  manage_appointments: true,
  manage_medicine_orders: false,
  manage_blood_donors: false,
  manage_ambulance_emergency: false,
  manage_donations: false,
};

export const AdminEmployeeManager: React.FC<AdminEmployeeManagerProps> = ({
  profiles,
  currentAdminProfile,
  onRefreshData
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');

  // Create Employee Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [empFullName, setEmpFullName] = useState('');
  const [empPhone, setEmpPhone] = useState('');
  const [empPassword, setEmpPassword] = useState('');
  const [empDesignation, setEmpDesignation] = useState('মেডিকেল এসিস্ট্যান্ট');
  const [empReferralCode, setEmpReferralCode] = useState('');
  const [empPermissions, setEmpPermissions] = useState<EmployeePermissions>(DEFAULT_EMPLOYEE_PERMISSIONS);
  const [showPasswordInForm, setShowPasswordInForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Success Confirmation State
  const [createdSuccess, setCreatedSuccess] = useState<{
    name: string;
    phone: string;
    password: string;
    code: string;
    designation: string;
  } | null>(null);

  // Edit Permissions Modal State
  const [editingEmployee, setEditingEmployee] = useState<Profile | null>(null);
  const [editPermissionsState, setEditPermissionsState] = useState<EmployeePermissions>({});
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);

  // Change Password Modal State
  const [passwordChangeTarget, setPasswordChangeTarget] = useState<Profile | null>(null);
  const [newTargetPassword, setNewTargetPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Copied text helper
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter Employees
  const employeeList = useMemo(() => {
    return profiles.filter(p => p.role === UserRole.EMPLOYEE);
  }, [profiles]);

  const filteredEmployees = useMemo(() => {
    return employeeList.filter(emp => {
      if (statusFilter !== 'all') {
        const empStatus = emp.status || 'active';
        if (statusFilter === 'active' && empStatus !== 'active') return false;
        if (statusFilter === 'suspended' && empStatus !== 'suspended') return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = (emp.full_name || '').toLowerCase().includes(q);
        const phoneMatch = (emp.phone || '').includes(q);
        const codeMatch = (emp.referral_code || '').toLowerCase().includes(q);
        const desMatch = (emp.designation || '').toLowerCase().includes(q);
        return nameMatch || phoneMatch || codeMatch || desMatch;
      }
      return true;
    });
  }, [employeeList, statusFilter, searchQuery]);

  // Generate Unique Random Password
  const generateUniquePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'Emp';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    code += '@' + Math.floor(100 + Math.random() * 900);
    setEmpPassword(code);
  };

  // Auto-generate Unique Staff Referral Code
  const generateUniqueStaffCode = (name: string) => {
    const clean = name.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || 'EMP';
    const rand = Math.floor(100 + Math.random() * 900);
    return `${clean}${rand}`;
  };

  // Handle Form Open
  const handleOpenCreateModal = () => {
    setEmpFullName('');
    setEmpPhone('');
    setEmpDesignation('মেডিকেল এসিস্ট্যান্ট');
    setEmpPermissions(DEFAULT_EMPLOYEE_PERMISSIONS);
    setFormError(null);
    generateUniquePassword();
    setEmpReferralCode('EMP' + Math.floor(100 + Math.random() * 900));
    setShowCreateModal(true);
  };

  // Toggle All Permissions
  const handleToggleAllPermissions = (enable: boolean) => {
    const updated: EmployeePermissions = {};
    PERMISSION_CONFIG.forEach(p => {
      updated[p.key] = enable;
    });
    setEmpPermissions(updated);
  };

  const handleToggleAllEditPermissions = (enable: boolean) => {
    const updated: EmployeePermissions = {};
    PERMISSION_CONFIG.forEach(p => {
      updated[p.key] = enable;
    });
    setEditPermissionsState(updated);
  };

  // Handle Create Employee
  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const name = empFullName.trim();
    const phone = empPhone.trim().replace(/[^0-9]/g, '');
    const pass = empPassword.trim();
    const code = empReferralCode.trim().toUpperCase();
    const designation = empDesignation.trim() || 'স্টাফ';

    if (!name) {
      setFormError('কর্মচারীর পূর্ণ নাম অবশ্যই লিখতে হবে।');
      return;
    }

    if (phone.length !== 11 || !phone.startsWith('01')) {
      setFormError('সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017xxxxxxxx)।');
      return;
    }

    if (pass.length < 6) {
      setFormError('ইউনিক পাসওয়ার্ড কমপক্ষে ৬ ডিজিটের হতে হবে।');
      return;
    }

    if (!code) {
      setFormError('স্টাফ রেফারেল কোড দিন (যেমন: EMP101)।');
      return;
    }

    // Check if code or phone already exists
    const codeExists = profiles.some(p => p.referral_code?.toUpperCase() === code);
    if (codeExists) {
      setFormError(`এই স্টাফ কোড (${code}) ইতিমধ্যে অন্য অ্যাকাউন্টে ব্যবহৃত হচ্ছে। আলাদা কোড দিন।`);
      return;
    }

    const phoneExists = profiles.some(p => p.phone === phone);
    if (phoneExists) {
      setFormError(`এই ফোন নম্বর (${phone}) দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট নিবন্ধিত রয়েছে।`);
      return;
    }

    setIsSubmitting(true);
    let tempAppRef: any = null;

    try {
      const appOptions = auth.app.options;
      const tempAppName = `TempEmpApp-${Date.now()}`;
      tempAppRef = initializeApp(appOptions, tempAppName);
      const tempAuth = getTempAuth(tempAppRef);

      const normalizedEmail = `${phone}@nilpha.com`;
      let userId = '';

      try {
        const credential = await createUserWithEmailAndPassword(tempAuth, normalizedEmail, pass);
        userId = credential.user.uid;
      } catch (authErr: any) {
        console.warn("TempAuth createUser error, fallback to custom ID:", authErr?.message || authErr);
        userId = 'emp_' + phone + '_' + Date.now();
      }

      const newEmpProfile: Profile = {
        id: userId,
        full_name: name,
        phone: phone,
        virtual_email: normalizedEmail,
        role: UserRole.EMPLOYEE,
        status: 'active',
        referral_code: code,
        created_password: pass,
        designation: designation,
        permissions: empPermissions,
        created_by: currentAdminProfile.id || 'admin',
        created_at: new Date().toISOString()
      };

      await setDoc(doc(db, 'profiles', userId), newEmpProfile);
      await signTempOut(tempAuth);

      setCreatedSuccess({
        name,
        phone,
        password: pass,
        code,
        designation
      });

      setShowCreateModal(false);

      if (onRefreshData) {
        await onRefreshData();
      }
    } catch (err: any) {
      console.error("Create Employee error:", err);
      setFormError(err.message || 'কর্মচারী অ্যাকাউন্ট তৈরি করার সময় ত্রুটি হয়েছে।');
    } finally {
      if (tempAppRef) {
        try {
          await deleteApp(tempAppRef);
        } catch (delErr) {
          console.error("Temp App delete fail:", delErr);
        }
      }
      setIsSubmitting(false);
    }
  };

  // Open Edit Permissions Modal
  const handleOpenEditPermissions = (emp: Profile) => {
    setEditingEmployee(emp);
    setEditPermissionsState(emp.permissions || DEFAULT_EMPLOYEE_PERMISSIONS);
  };

  // Save Permissions
  const handleSavePermissions = async () => {
    if (!editingEmployee) return;
    setIsSavingPermissions(true);
    try {
      await updateDoc(doc(db, 'profiles', editingEmployee.id), {
        permissions: editPermissionsState
      });
      if (onRefreshData) {
        await onRefreshData();
      }
      setEditingEmployee(null);
    } catch (err: any) {
      alert('পারমিশন আপডেট করতে সমস্যা হয়েছে: ' + (err?.message || err));
    } finally {
      setIsSavingPermissions(false);
    }
  };

  // Toggle Employee Status
  const handleToggleStatus = async (emp: Profile) => {
    const newStatus = emp.status === 'suspended' ? 'active' : 'suspended';
    const confirmMsg = newStatus === 'suspended' 
      ? `আপনি কি সত্যিই ${emp.full_name}-এর অ্যাকাউন্ট সাময়িকভাবে বন্ধ (Suspend) করতে চান? বন্ধ থাকলে তিনি লগইন করতে পারবেন না।`
      : `আপনি কি ${emp.full_name}-এর অ্যাকাউন্ট পুনরায় সক্রিয় (Activate) করতে চান?`;
    
    if (!confirm(confirmMsg)) return;

    try {
      await updateDoc(doc(db, 'profiles', emp.id), {
        status: newStatus
      });
      if (onRefreshData) {
        await onRefreshData();
      }
    } catch (err: any) {
      alert('স্ট্যাটাস পরিবর্তনে সমস্যা: ' + err?.message);
    }
  };

  // Change Employee Password
  const handleChangePassword = async () => {
    if (!passwordChangeTarget || !newTargetPassword.trim()) return;
    if (newTargetPassword.trim().length < 6) {
      alert('নতুন পাসওয়ার্ড কমপক্ষে ৬ ডিজিটের হতে হবে।');
      return;
    }
    setIsChangingPassword(true);
    try {
      await updateDoc(doc(db, 'profiles', passwordChangeTarget.id), {
        created_password: newTargetPassword.trim()
      });
      alert(`সফলভাবে ${passwordChangeTarget.full_name}-এর পাসওয়ার্ড পরিবর্তন করা হয়েছে। নতুন পাসওয়ার্ড: ${newTargetPassword.trim()}`);
      setPasswordChangeTarget(null);
      setNewTargetPassword('');
      if (onRefreshData) {
        await onRefreshData();
      }
    } catch (err: any) {
      alert('পাসওয়ার্ড পরিবর্তনে ত্রুটি: ' + err?.message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Delete Employee
  const handleDeleteEmployee = async (emp: Profile) => {
    if (!confirm(`⚠️ সতর্কবার্তা! আপনি কি সত্যিই "${emp.full_name}"-এর স্টাফ অ্যাকাউন্ট স্থায়ীভাবে মুছে ফেলতে চান?`)) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'profiles', emp.id));
      if (onRefreshData) {
        await onRefreshData();
      }
    } catch (err: any) {
      alert('কর্মচারী মুছতে সমস্যা হয়েছে: ' + err?.message);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in text-left">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-violet-950 to-indigo-900 p-6 rounded-[32px] text-white shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="bg-violet-500/20 text-violet-300 border border-violet-400/30 font-black text-[10px] uppercase px-3 py-1 rounded-full flex items-center gap-1.5 w-fit mb-2">
            <ShieldCheck size={12} className="text-violet-400" /> স্টাফ ও রোল-বেসড অ্যাক্সেস কন্ট্রোল (RBAC)
          </span>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            👥 কর্মচারী ও স্টাফ একাউন্ট ম্যানেজমেন্ট
          </h2>
          <p className="text-xs text-violet-200/90 font-bold mt-1 max-w-2xl leading-relaxed">
            এডমিন প্যানেল থেকে ওয়েবসাইটের কর্মচারীদের জন্য আলাদা একাউন্ট তৈরি করুন, ইউনিক পাসওয়ার্ড সেট করুন এবং চেকবক্স টিক দিয়ে প্রতিটি স্টাফের জন্য নির্দিষ্ট সুবিধাসমূহ (ল্যাব টেস্ট, ফ্রি ডাক্তার, নিজস্ব কোডে রোগী নিবন্ধন ও পাসওয়ার্ড ভিউ) নির্ধারণ করে দিন।
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-black text-xs px-5 py-3 rounded-2xl shadow-lg shadow-violet-900/50 flex items-center gap-2 transition-all active:scale-95 cursor-pointer shrink-0 border border-violet-400/30"
        >
          <UserPlus size={16} /> নতুন কর্মচারী যোগ করুন
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">মোট কর্মচারী</p>
          <p className="text-2xl font-black text-slate-900">{employeeList.length} জন</p>
        </div>
        <div className="bg-emerald-50/70 p-5 rounded-[28px] border border-emerald-200/80 shadow-sm">
          <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1">সক্রিয় স্টাফ (Active)</p>
          <p className="text-2xl font-black text-emerald-800">{employeeList.filter(e => (e.status || 'active') === 'active').length} জন</p>
        </div>
        <div className="bg-rose-50/70 p-5 rounded-[28px] border border-rose-200/80 shadow-sm">
          <p className="text-[10px] font-black text-rose-700 uppercase tracking-widest mb-1">স্থগিত / বন্ধ (Suspended)</p>
          <p className="text-2xl font-black text-rose-800">{employeeList.filter(e => e.status === 'suspended').length} জন</p>
        </div>
        <div className="bg-indigo-50/70 p-5 rounded-[28px] border border-indigo-200/80 shadow-sm">
          <p className="text-[10px] font-black text-indigo-700 uppercase tracking-widest mb-1">অনুমতি ক্ষেত্রসমূহ</p>
          <p className="text-2xl font-black text-indigo-800">{PERMISSION_CONFIG.length} টি সুবিধা</p>
        </div>
      </div>

      {/* Success Notification Banner after creation */}
      {createdSuccess && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 p-5 rounded-[28px] shadow-md animate-in fade-in space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-emerald-800 font-black text-sm">
              <CheckSquare className="text-emerald-600" size={18} /> কর্মচারী একাউন্ট সফলভাবে তৈরি হয়েছে!
            </span>
            <button 
              onClick={() => setCreatedSuccess(null)}
              className="text-xs text-slate-400 hover:text-slate-600 font-bold px-2 py-1"
            >
              ✕ বন্ধ করুন
            </button>
          </div>
          <p className="text-xs text-emerald-900 font-semibold">
            কর্মচারীকে এই লগইন তথ্য দিন। তিনি ওয়েবসাইটে মোবাইল নম্বর অথবা ইউজারনেম এবং এই ইউনিক পাসওয়ার্ড দিয়ে লগইন করতে পারবেন:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-white p-3.5 rounded-2xl border border-emerald-200 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block font-bold">কর্মচারীর নাম:</span>
              <strong className="text-slate-800">{createdSuccess.name}</strong> ({createdSuccess.designation})
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-bold">লগইন ফোন নম্বর:</span>
              <strong className="text-indigo-600 font-mono">{createdSuccess.phone}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-bold">ইউনিক পাসওয়ার্ড:</span>
              <strong className="text-emerald-700 font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">{createdSuccess.password}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-bold">স্টাফ রেফারেল কোড:</span>
              <strong className="text-violet-700 font-mono bg-violet-50 px-2 py-0.5 rounded border border-violet-200">{createdSuccess.code}</strong>
            </div>
          </div>
          <button
            onClick={() => {
              const msg = `আপনার স্টাফ একাউন্ট লগইন তথ্য:\nনাম: ${createdSuccess.name} (${createdSuccess.designation})\nফোন: ${createdSuccess.phone}\nপাসওয়ার্ড: ${createdSuccess.password}\nস্টাফ কোড: ${createdSuccess.code}\nওয়েবসাইট: https://ais-dev-izdxiw3n7dquszegwcvuu6-74713138350.asia-east1.run.app`;
              copyToClipboard(msg, 'created_msg');
            }}
            className="text-[11px] bg-emerald-600 text-white font-black px-3.5 py-1.5 rounded-xl shadow-xs hover:bg-emerald-700 flex items-center gap-1.5 transition-all cursor-pointer w-fit"
          >
            {copiedId === 'created_msg' ? <Check size={14} /> : <Copy size={14} />} 
            {copiedId === 'created_msg' ? 'লগইন তথ্য কপি হয়েছে!' : 'সব লগইন তথ্য একসাথে কপি করুন'}
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="নাম, ফোন নম্বর, স্টাফ কোড বা পদবী দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-bold outline-none focus:border-violet-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          {(['all', 'active', 'suspended'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                statusFilter === st 
                  ? 'bg-violet-600 text-white border-violet-600 shadow-sm' 
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}
            >
              {st === 'all' ? 'সকল স্টাফ' : st === 'active' ? 'সক্রিয়' : 'স্থগিত'}
            </button>
          ))}
        </div>
      </div>

      {/* Employee List */}
      {filteredEmployees.length === 0 ? (
        <div className="bg-white p-12 rounded-[32px] border border-dashed border-slate-200 text-center space-y-3">
          <div className="w-14 h-14 bg-violet-50 text-violet-600 rounded-2xl mx-auto flex items-center justify-center">
            <UserCheck size={28} />
          </div>
          <h3 className="text-base font-black text-slate-800">কোনো কর্মচারী একাউন্ট পাওয়া যায়নি</h3>
          <p className="text-xs text-slate-400 font-bold max-w-sm mx-auto">
            উপরে "নতুন কর্মচারী যোগ করুন" বাটনে ক্লিক করে প্রথম স্টাফ অ্যাকাউন্ট তৈরি করুন এবং পারমিশন নির্ধারণ করে দিন।
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="bg-violet-600 text-white text-xs font-black px-4 py-2 rounded-xl hover:bg-violet-700 shadow-sm transition-all"
          >
            + নতুন কর্মচারী যোগ করুন
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEmployees.map(emp => {
            const isSuspended = emp.status === 'suspended';
            const empPerms = emp.permissions || {};
            const activePermCount = PERMISSION_CONFIG.filter(p => empPerms[p.key]).length;

            return (
              <div 
                key={emp.id}
                className={`bg-white rounded-[28px] border p-5 shadow-xs transition-all hover:shadow-md space-y-4 ${
                  isSuspended ? 'border-rose-200 bg-rose-50/20 opacity-90' : 'border-slate-100'
                }`}
              >
                {/* Employee Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${
                      isSuspended ? 'bg-rose-100 text-rose-700' : 'bg-violet-100 text-violet-700'
                    }`}>
                      {emp.full_name?.charAt(0) || 'E'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-sm text-slate-900">{emp.full_name}</h4>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                          isSuspended ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {isSuspended ? 'স্থগিত (Suspended)' : 'সক্রিয় (Active)'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-bold flex items-center gap-2 mt-0.5">
                        <span>{emp.designation || 'স্টাফ'}</span>
                        <span>•</span>
                        <span className="font-mono text-indigo-600 flex items-center gap-1">
                          <Phone size={11} /> {emp.phone}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Staff Referral Code Badge */}
                  <div className="text-right shrink-0">
                    <span className="text-[9px] font-black text-slate-400 block uppercase">স্টাফ রেফারেল কোড</span>
                    <span className="font-mono text-xs font-black bg-violet-50 text-violet-700 border border-violet-200 px-2 py-0.5 rounded-lg inline-block">
                      {emp.referral_code || 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Password Box */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Key size={14} className="text-slate-400" />
                    <span className="text-slate-500 font-bold text-[11px]">ইউনিক পাসওয়ার্ড:</span>
                    <span className="font-mono font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg">
                      {emp.created_password || '123456'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(emp.created_password || '123456', `pass_${emp.id}`)}
                      title="পাসওয়ার্ড কপি করুন"
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold bg-white px-2 py-1 rounded-md border border-slate-200 flex items-center gap-1 shadow-2xs"
                    >
                      {copiedId === `pass_${emp.id}` ? <Check size={11} /> : <Copy size={11} />}
                      কপি
                    </button>
                    <button
                      onClick={() => {
                        setPasswordChangeTarget(emp);
                        setNewTargetPassword('');
                      }}
                      title="পাসওয়ার্ড পরিবর্তন করুন"
                      className="text-[10px] text-slate-600 hover:text-slate-900 font-bold bg-white px-2 py-1 rounded-md border border-slate-200 flex items-center gap-1 shadow-2xs"
                    >
                      <Edit3 size={11} /> পরিবর্তন
                    </button>
                  </div>
                </div>

                {/* Permissions Breakdown Preview */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-black text-slate-700 flex items-center gap-1.5">
                      <ShieldCheck size={13} className="text-violet-600" /> অনুমোদিত সুবিধাসমূহ ({activePermCount}/{PERMISSION_CONFIG.length}):
                    </span>
                    <button
                      onClick={() => handleOpenEditPermissions(emp)}
                      className="text-[10px] font-black text-violet-600 hover:text-violet-800 bg-violet-50 hover:bg-violet-100 px-2.5 py-1 rounded-lg border border-violet-200 transition-all flex items-center gap-1"
                    >
                      <Edit3 size={11} /> পারমিশন এডিট করুন
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {PERMISSION_CONFIG.map(p => {
                      const isGranted = !!empPerms[p.key];
                      return (
                        <span
                          key={p.key}
                          className={`text-[9px] font-black px-2 py-1 rounded-lg flex items-center gap-1 border ${
                            isGranted 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                              : 'bg-slate-50 text-slate-400 border-slate-200 line-through opacity-60'
                          }`}
                        >
                          {isGranted ? '✓' : '✗'} {p.badge}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    onClick={() => handleToggleStatus(emp)}
                    className={`text-[10px] font-black px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all ${
                      isSuspended
                        ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                        : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                    }`}
                  >
                    {isSuspended ? <Unlock size={12} /> : <Lock size={12} />}
                    {isSuspended ? 'একাউন্ট পুনরায় চালু করুন' : 'সাময়িক স্থগিত (Suspend)'}
                  </button>

                  <button
                    onClick={() => handleDeleteEmployee(emp)}
                    className="text-[10px] font-black text-slate-400 hover:text-rose-600 px-2 py-1 rounded-lg hover:bg-rose-50 transition-all flex items-center gap-1"
                    title="স্থায়ীভাবে মুছুন"
                  >
                    <Trash2 size={12} /> ডিলিট
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE EMPLOYEE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[32px] max-w-2xl w-full p-6 md:p-8 shadow-2xl space-y-6 my-8 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <UserPlus className="text-violet-600" size={20} /> নতুন কর্মচারী একাউন্ট তৈরি করুন
                </h3>
                <p className="text-xs text-slate-400 font-bold mt-0.5">
                  স্টাফের তথ্য দিন, ইউনিক পাসওয়ার্ড দিন এবং অনুমোদিত সুবিধাসমূহ টিক দিন।
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateEmployee} className="space-y-5">
              {/* Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-600 uppercase">কর্মচারীর পূর্ণ নাম *</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: মোঃ রাশেদুল ইসলাম"
                    value={empFullName}
                    onChange={(e) => {
                      setEmpFullName(e.target.value);
                      if (!empReferralCode || empReferralCode.startsWith('EMP')) {
                        setEmpReferralCode(generateUniqueStaffCode(e.target.value));
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold outline-none focus:border-violet-500 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-600 uppercase">মোবাইল নম্বর (লগইন আইডি) *</label>
                  <input
                    type="tel"
                    required
                    maxLength={11}
                    placeholder="যেমন: 01712345678"
                    value={empPhone}
                    onChange={(e) => setEmpPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold font-mono outline-none focus:border-violet-500 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-600 uppercase">পদবী / ডিপার্টমেন্ট *</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: মেডিকেল এসিস্ট্যান্ট / ফিল্ড অফিসার"
                    value={empDesignation}
                    onChange={(e) => setEmpDesignation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold outline-none focus:border-violet-500 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-slate-600 uppercase">স্টাফ রেফারেল কোড *</label>
                    <button
                      type="button"
                      onClick={() => setEmpReferralCode(generateUniqueStaffCode(empFullName || 'EMP'))}
                      className="text-[9px] text-violet-600 font-bold hover:underline"
                    >
                      অটো-জেনারেট
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: EMP101"
                    value={empReferralCode}
                    onChange={(e) => setEmpReferralCode(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-black font-mono uppercase text-violet-700 outline-none focus:border-violet-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Unique Password Setup */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-700 uppercase flex items-center gap-1.5">
                    <Key size={13} className="text-violet-600" /> ইউনিক লগইন পাসওয়ার্ড *
                  </label>
                  <button
                    type="button"
                    onClick={generateUniquePassword}
                    className="text-[10px] text-violet-700 hover:text-violet-900 font-bold flex items-center gap-1 bg-violet-100/70 hover:bg-violet-100 px-2.5 py-1 rounded-lg border border-violet-200 transition-all"
                  >
                    <Sparkles size={12} /> শক্তিশালী পাসওয়ার্ড জেনারেট করুন
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPasswordInForm ? "text" : "password"}
                    required
                    placeholder="ন্যূনতম ৬ ডিজিট"
                    value={empPassword}
                    onChange={(e) => setEmpPassword(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-black text-indigo-700 outline-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordInForm(!showPasswordInForm)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPasswordInForm ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">
                  ⚠️ এই পাসওয়ার্ডটি কর্মচারীর জন্য ইউনিক। অন্য কেউ এটি অ্যাক্সেস করতে পারবে না।
                </p>
              </div>

              {/* Permissions Checklist Section */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-emerald-600" /> স্টাফের জন্য সুবিধাসমূহ (টিক দিন):
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold">
                      যেসব সুবিধার টিক মার্ক দেওয়া থাকবে, শুধুমাত্র সেই কাজগুলো কর্মচারী করতে পারবেন।
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleAllPermissions(true)}
                      className="text-[10px] text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg font-black border border-emerald-200"
                    >
                      সব টিক দিন
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleAllPermissions(false)}
                      className="text-[10px] text-slate-500 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg font-black"
                    >
                      সব মুছুন
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2.5 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
                  {PERMISSION_CONFIG.map(perm => {
                    const isChecked = !!empPermissions[perm.key];
                    const Icon = perm.icon;

                    return (
                      <div
                        key={perm.key}
                        onClick={() => {
                          setEmpPermissions(prev => ({
                            ...prev,
                            [perm.key]: !prev[perm.key]
                          }));
                        }}
                        className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 select-none ${
                          isChecked 
                            ? 'bg-violet-50/50 border-violet-500 shadow-2xs' 
                            : 'bg-white border-slate-150 hover:border-slate-300'
                        }`}
                      >
                        <div className="pt-0.5 shrink-0">
                          {isChecked ? (
                            <CheckSquare className="text-violet-600 fill-violet-100" size={18} />
                          ) : (
                            <Square className="text-slate-300" size={18} />
                          )}
                        </div>

                        <div className="flex-1 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className={`p-1 rounded-md text-xs ${perm.color}`}>
                              <Icon size={12} />
                            </span>
                            <span className="font-black text-xs text-slate-800">
                              {perm.label}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-snug font-medium">
                            {perm.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-black text-slate-600 hover:bg-slate-50 transition-all"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-black px-6 py-2.5 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      একাউন্ট তৈরি হচ্ছে...
                    </>
                  ) : (
                    <>
                      <UserCheck size={15} /> একাউন্ট তৈরি ও কনফার্ম করুন
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PERMISSIONS MODAL */}
      {editingEmployee && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[32px] max-w-xl w-full p-6 md:p-8 shadow-2xl space-y-6 my-8 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="text-violet-600" size={20} /> পারমিশন এডিট করুন
                </h3>
                <p className="text-xs text-slate-500 font-bold mt-0.5">
                  কর্মচারী: <strong className="text-slate-800">{editingEmployee.full_name}</strong> ({editingEmployee.phone})
                </p>
              </div>
              <button
                onClick={() => setEditingEmployee(null)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-700">সুবিধাসমূহ টিক/আনটিক করুন:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleAllEditPermissions(true)}
                  className="text-[10px] text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg font-black border border-emerald-200"
                >
                  সব টিক দিন
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleAllEditPermissions(false)}
                  className="text-[10px] text-slate-500 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg font-black"
                >
                  সব মুছুন
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5 max-h-[360px] overflow-y-auto pr-1 no-scrollbar">
              {PERMISSION_CONFIG.map(perm => {
                const isChecked = !!editPermissionsState[perm.key];
                const Icon = perm.icon;

                return (
                  <div
                    key={perm.key}
                    onClick={() => {
                      setEditPermissionsState(prev => ({
                        ...prev,
                        [perm.key]: !prev[perm.key]
                      }));
                    }}
                    className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 select-none ${
                      isChecked 
                        ? 'bg-violet-50/50 border-violet-500 shadow-2xs' 
                        : 'bg-white border-slate-150 hover:border-slate-300'
                    }`}
                  >
                    <div className="pt-0.5 shrink-0">
                      {isChecked ? (
                        <CheckSquare className="text-violet-600 fill-violet-100" size={18} />
                      ) : (
                        <Square className="text-slate-300" size={18} />
                      )}
                    </div>

                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`p-1 rounded-md text-xs ${perm.color}`}>
                          <Icon size={12} />
                        </span>
                        <span className="font-black text-xs text-slate-800">
                          {perm.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug font-medium">
                        {perm.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                disabled={isSavingPermissions}
                onClick={() => setEditingEmployee(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-black text-slate-600 hover:bg-slate-50"
              >
                বাতিল
              </button>
              <button
                type="button"
                disabled={isSavingPermissions}
                onClick={handleSavePermissions}
                className="bg-violet-600 hover:bg-violet-700 text-white text-xs font-black px-6 py-2.5 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {isSavingPermissions ? 'সেভ হচ্ছে...' : 'পারমিশন আপডেট সেভ করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {passwordChangeTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Key className="text-indigo-600" size={18} /> পাসওয়ার্ড পরিবর্তন করুন
              </h3>
              <button
                onClick={() => setPasswordChangeTarget(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 font-bold">
              কর্মচারী: <strong className="text-slate-800">{passwordChangeTarget.full_name}</strong> ({passwordChangeTarget.phone})
            </p>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-600 uppercase">নতুন ইউনিক পাসওয়ার্ড</label>
              <input
                type="text"
                placeholder="নতুন পাসওয়ার্ড লিখুন (ন্যূনতম ৬ ডিজিট)"
                value={newTargetPassword}
                onChange={(e) => setNewTargetPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-mono font-black text-indigo-700 outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPasswordChangeTarget(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-black text-slate-600"
              >
                বাতিল
              </button>
              <button
                type="button"
                disabled={isChangingPassword || !newTargetPassword.trim()}
                onClick={handleChangePassword}
                className="bg-indigo-600 text-white text-xs font-black px-5 py-2 rounded-xl shadow-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                {isChangingPassword ? 'আপডেট হচ্ছে...' : 'পাসওয়ার্ড আপডেট করুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
