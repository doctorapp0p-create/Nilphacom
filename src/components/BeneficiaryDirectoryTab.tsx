import React, { useState, useMemo } from 'react';
import { 
  Heart, 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  Phone, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Sparkles, 
  ArrowRight, 
  Plus, 
  Building2, 
  User, 
  Share2, 
  Copy, 
  Check, 
  Gift, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MedicalAssistanceApplication, MaternityDonationApplication, FreeDoctorClaim, Profile } from '../../types';

export interface UnifiedBeneficiaryItem {
  id: string;
  sourceType: 'medical_aid' | 'maternity' | 'free_doctor';
  code: string;
  patientName: string;
  guardianName?: string;
  phone: string;
  district: string;
  upazilaOrArea: string;
  villageOrUnion: string;
  fullAddress: string;
  category: string;
  categoryTitle: string;
  categoryIcon: string;
  illnessDetails: string;
  requestedAmount: number;
  fundedAmount: number;
  status: 'pending' | 'verified' | 'sponsored' | 'disbursed' | 'rejected' | 'completed';
  createdAt: string;
  paymentMethod?: string;
  payoutNumber?: string;
  rawDoc?: any;
}

interface BeneficiaryDirectoryTabProps {
  medicalApps: MedicalAssistanceApplication[];
  maternityApps?: MaternityDonationApplication[];
  freeDoctorClaims?: FreeDoctorClaim[];
  profile: Profile | null;
  isAdmin?: boolean;
  onOpenApplyModal: () => void;
  onSponsorPatient: (item: UnifiedBeneficiaryItem) => void;
  whatsappNumber?: string;
}

export const BeneficiaryDirectoryTab: React.FC<BeneficiaryDirectoryTabProps> = ({
  medicalApps,
  maternityApps = [],
  freeDoctorClaims = [],
  profile,
  isAdmin = false,
  onOpenApplyModal,
  onSponsorPatient,
  whatsappNumber = '8801352669100'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [selectedThana, setSelectedThana] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Unify all applications into a single list
  const unifiedList = useMemo(() => {
    const list: UnifiedBeneficiaryItem[] = [];

    // 1. Medical Assistance Applications
    medicalApps.forEach(m => {
      let icon = '🤲';
      if (m.category === 'maternity_csection') icon = '🤰';
      else if (m.category === 'free_doctor_consultation') icon = '👨‍⚕️';
      else if (m.category === 'major_surgery_aid') icon = '🏥';
      else if (m.category === 'essential_medicine_aid') icon = '💊';
      else if (m.category === 'lab_test_subsidy') icon = '🧪';
      else if (m.category === 'oxygen_ambulance_emergency') icon = '🚑';

      list.push({
        id: m.id,
        sourceType: 'medical_aid',
        code: m.applicationCode,
        patientName: m.patientName,
        guardianName: m.guardianName,
        phone: m.phone,
        district: m.district,
        upazilaOrArea: m.upazilaOrArea,
        villageOrUnion: m.villageOrUnion,
        fullAddress: m.fullAddress,
        category: m.category,
        categoryTitle: m.categoryTitle,
        categoryIcon: icon,
        illnessDetails: m.illnessDetails,
        requestedAmount: m.requestedAmount || 2000,
        fundedAmount: m.fundedAmount || 0,
        status: m.status,
        createdAt: m.createdAt,
        paymentMethod: m.paymentMethod,
        payoutNumber: m.payoutNumber,
        rawDoc: m
      });
    });

    // 2. Maternity Donation Applications
    maternityApps.forEach(mat => {
      // Avoid duplicate if already logged
      const existing = list.find(x => x.code === mat.applicationCode);
      if (!existing) {
        list.push({
          id: mat.id,
          sourceType: 'maternity',
          code: mat.applicationCode,
          patientName: mat.applicantName,
          guardianName: mat.husbandOrGuardianName ? `স্বামী: ${mat.husbandOrGuardianName} (${mat.occupation || 'দিনমজুর'})` : undefined,
          phone: mat.phone,
          district: mat.district,
          upazilaOrArea: mat.upazilaOrArea,
          villageOrUnion: mat.fullAddress.split(',')[0] || mat.upazilaOrArea,
          fullAddress: mat.fullAddress,
          category: 'maternity_csection',
          categoryTitle: 'অসচ্ছল গর্ভবতী মায়ের নিরাপদ সিজার ডেলিভারি অনুদান',
          categoryIcon: '🤰',
          illnessDetails: mat.reasonForAssistance || `প্রসূতি মা, সম্ভাব্য ডেলিভারি তারিখ: ${mat.expectedDeliveryDate || 'নিকটবর্তী'}। হাসপাতাল: ${mat.hospitalName || 'সরকারি স্বাস্থ্য কেন্দ্র'}`,
          requestedAmount: mat.grantAmount || 2000,
          fundedAmount: (mat.status === 'completed' || mat.status === 'approved') ? (mat.grantAmount || 2000) : 0,
          status: mat.status === 'approved' ? 'verified' : mat.status === 'completed' ? 'disbursed' : mat.status,
          createdAt: mat.createdAt,
          paymentMethod: mat.paymentMethod,
          payoutNumber: mat.payoutNumber,
          rawDoc: mat
        });
      }
    });

    // 3. Free Doctor Claims (token holders requesting doctor aid)
    freeDoctorClaims.forEach(f => {
      const existing = list.find(x => x.code === f.tokenCode);
      if (!existing) {
        list.push({
          id: f.id,
          sourceType: 'free_doctor',
          code: f.tokenCode,
          patientName: f.patientName,
          phone: f.patientPhone,
          district: f.patientAddress.includes('রংপুর') ? 'রংপুর' : 'নীলফামারী',
          upazilaOrArea: 'সদর/উপজেলা',
          villageOrUnion: f.patientAddress,
          fullAddress: f.patientAddress,
          category: 'free_doctor_consultation',
          categoryTitle: 'দরিদ্র রোগীর ফ্রি বিশেষজ্ঞ ডাক্তার পরামর্শ',
          categoryIcon: '👨‍⚕️',
          illnessDetails: `${f.illnessDetails || 'বিশেষজ্ঞ ডাক্তার পরামর্শ প্রয়োজন'} (হাসপাতাল: ${f.sponsoringHospital})`,
          requestedAmount: 500,
          fundedAmount: f.status === 'completed' ? 500 : 0,
          status: f.status === 'approved' ? 'verified' : f.status === 'completed' ? 'disbursed' : 'pending',
          createdAt: f.createdAt,
          rawDoc: f
        });
      }
    });

    // Sort by latest
    return list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [medicalApps, maternityApps, freeDoctorClaims]);

  // Unique Districts & Thanas for Filter dropdowns
  const availableDistricts = useMemo(() => {
    const set = new Set<string>();
    unifiedList.forEach(item => {
      if (item.district) set.add(item.district.trim());
    });
    return Array.from(set);
  }, [unifiedList]);

  const availableThanas = useMemo(() => {
    const set = new Set<string>();
    unifiedList.forEach(item => {
      if (selectedDistrict === 'all' || item.district === selectedDistrict) {
        if (item.upazilaOrArea) set.add(item.upazilaOrArea.trim());
      }
    });
    return Array.from(set);
  }, [unifiedList, selectedDistrict]);

  // Statistics Breakdown by Category
  const stats = useMemo(() => {
    let csectionCount = 0;
    let surgeryCount = 0;
    let doctorCount = 0;
    let medicineCount = 0;
    let labCount = 0;
    let ambulanceCount = 0;
    let totalRequestedAmount = 0;
    let totalFundedAmount = 0;

    unifiedList.forEach(i => {
      totalRequestedAmount += (i.requestedAmount || 0);
      totalFundedAmount += (i.fundedAmount || 0);

      if (i.category === 'maternity_csection') csectionCount++;
      else if (i.category === 'major_surgery_aid') surgeryCount++;
      else if (i.category === 'free_doctor_consultation') doctorCount++;
      else if (i.category === 'essential_medicine_aid') medicineCount++;
      else if (i.category === 'lab_test_subsidy') labCount++;
      else if (i.category === 'oxygen_ambulance_emergency') ambulanceCount++;
    });

    return {
      totalCount: unifiedList.length,
      csectionCount,
      surgeryCount,
      doctorCount,
      medicineCount,
      labCount,
      ambulanceCount,
      totalRequestedAmount,
      totalFundedAmount
    };
  }, [unifiedList]);

  // Filtered List
  const filteredList = useMemo(() => {
    return unifiedList.filter(item => {
      // District filter
      if (selectedDistrict !== 'all' && item.district !== selectedDistrict) return false;
      // Thana filter
      if (selectedThana !== 'all' && item.upazilaOrArea !== selectedThana) return false;
      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      // Status filter
      if (selectedStatus !== 'all' && item.status !== selectedStatus) return false;

      // Text Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.patientName.toLowerCase().includes(q);
        const matchesGuardian = item.guardianName?.toLowerCase().includes(q);
        const matchesDistrict = item.district.toLowerCase().includes(q);
        const matchesThana = item.upazilaOrArea.toLowerCase().includes(q);
        const matchesVillage = item.villageOrUnion.toLowerCase().includes(q);
        const matchesCode = item.code.toLowerCase().includes(q);
        const matchesIllness = item.illnessDetails.toLowerCase().includes(q);

        return matchesName || matchesGuardian || matchesDistrict || matchesThana || matchesVillage || matchesCode || matchesIllness;
      }

      return true;
    });
  }, [unifiedList, selectedDistrict, selectedThana, selectedCategory, selectedStatus, searchQuery]);

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSharePatient = (item: UnifiedBeneficiaryItem) => {
    const text = `🤲 রোগীর সাহায্য আবেদন: ${item.patientName} (${item.categoryTitle})। ঠিকানা: গ্রাম: ${item.villageOrUnion}, থানা: ${item.upazilaOrArea}, জেলা: ${item.district}। প্রয়োজনীয় অনুদান: ৳${item.requestedAmount}। সাহায্য করতে বা দেখতে ভিজিট করুন nilpha.com`;
    if (navigator.share) {
      navigator.share({
        title: `রোগী সাহায্য আবেদন - ${item.patientName}`,
        text: text,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      alert('রোগীর তথ্য ও অনুদান লিঙ্ক কপি করা হয়েছে!');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Call to Action */}
      <div className="bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-700/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold backdrop-blur-md border border-emerald-400/20">
              <ShieldCheck className="w-4 h-4" />
              <span>১০০% উন্মুক্ত ও স্বচ্ছ স্বাস্থ্য সেবা ভেরিফিকেশন বোর্ড</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              সাহায্যপ্রার্থী রোগী ও গর্ভবতী মায়েদের উন্মুক্ত আবেদন তালিকা
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              কোন জেলা, কোন থানা ও কোন গ্রাম থেকে কতজন রোগী কি বিষয়ের (সিজার ডেলিভারি, অপারেশন, ডাক্তার ফি, জরুরি ঔষধ) উপর সাহায্য চেয়েছেন তা এখানে উন্মুক্ত রয়েছে। যাকাত ও অনুদান দাতারা সরাসরি পছন্দের রোগীকে চিহ্নিত করে অর্থায়ন করতে পারেন।
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row gap-3">
            <button
              onClick={onOpenApplyModal}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs sm:text-sm shadow-lg hover:shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>চিকিৎসার জন্য নতুন আবেদন করুন</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Live Category Stats Breakdown (পরিসংখ্যান) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* C-Section */}
        <div 
          onClick={() => setSelectedCategory(selectedCategory === 'maternity_csection' ? 'all' : 'maternity_csection')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            selectedCategory === 'maternity_csection' 
              ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-300 shadow-sm' 
              : 'bg-white border-slate-200/80 hover:border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl">🤰</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-mono">
              {stats.csectionCount} জন
            </span>
          </div>
          <div className="text-xs font-bold text-slate-800 mt-2">সিজার অনুদান</div>
          <div className="text-[11px] text-slate-500">প্রসূতি মায়েদের সাহায্য</div>
        </div>

        {/* Surgery */}
        <div 
          onClick={() => setSelectedCategory(selectedCategory === 'major_surgery_aid' ? 'all' : 'major_surgery_aid')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            selectedCategory === 'major_surgery_aid' 
              ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-300 shadow-sm' 
              : 'bg-white border-slate-200/80 hover:border-blue-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl">🏥</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-mono">
              {stats.surgeryCount} জন
            </span>
          </div>
          <div className="text-xs font-bold text-slate-800 mt-2">বড় অপারেশন</div>
          <div className="text-[11px] text-slate-500">জটিল সার্জারি ফান্ড</div>
        </div>

        {/* Free Doctor */}
        <div 
          onClick={() => setSelectedCategory(selectedCategory === 'free_doctor_consultation' ? 'all' : 'free_doctor_consultation')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            selectedCategory === 'free_doctor_consultation' 
              ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-300 shadow-sm' 
              : 'bg-white border-slate-200/80 hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl">👨‍⚕️</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-mono">
              {stats.doctorCount} জন
            </span>
          </div>
          <div className="text-xs font-bold text-slate-800 mt-2">ফ্রি ডাক্তার ফি</div>
          <div className="text-[11px] text-slate-500">বিশেষজ্ঞ কনসালটেশন</div>
        </div>

        {/* Medicine */}
        <div 
          onClick={() => setSelectedCategory(selectedCategory === 'essential_medicine_aid' ? 'all' : 'essential_medicine_aid')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            selectedCategory === 'essential_medicine_aid' 
              ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-300 shadow-sm' 
              : 'bg-white border-slate-200/80 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl">💊</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-mono">
              {stats.medicineCount} জন
            </span>
          </div>
          <div className="text-xs font-bold text-slate-800 mt-2">জরুরি ঔষধ</div>
          <div className="text-[11px] text-slate-500">প্রেসক্রিপশন ফান্ড</div>
        </div>

        {/* Lab Tests */}
        <div 
          onClick={() => setSelectedCategory(selectedCategory === 'lab_test_subsidy' ? 'all' : 'lab_test_subsidy')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            selectedCategory === 'lab_test_subsidy' 
              ? 'bg-purple-50 border-purple-400 ring-2 ring-purple-300 shadow-sm' 
              : 'bg-white border-slate-200/80 hover:border-purple-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl">🧪</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-mono">
              {stats.labCount} জন
            </span>
          </div>
          <div className="text-xs font-bold text-slate-800 mt-2">ল্যাব টেস্ট ছাড়</div>
          <div className="text-[11px] text-slate-500">প্যাথলজি ও টেস্ট</div>
        </div>

        {/* Ambulance */}
        <div 
          onClick={() => setSelectedCategory(selectedCategory === 'oxygen_ambulance_emergency' ? 'all' : 'oxygen_ambulance_emergency')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            selectedCategory === 'oxygen_ambulance_emergency' 
              ? 'bg-cyan-50 border-cyan-400 ring-2 ring-cyan-300 shadow-sm' 
              : 'bg-white border-slate-200/80 hover:border-cyan-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl">🚑</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-700 font-mono">
              {stats.ambulanceCount} জন
            </span>
          </div>
          <div className="text-xs font-bold text-slate-800 mt-2">অ্যাম্বুলেন্স ও O₂</div>
          <div className="text-[11px] text-slate-500">জরুরি স্থানান্তর</div>
        </div>
      </div>

      {/* 3. Search & Comprehensive Filter Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="রোগীর নাম, গ্রাম, থানা, জেলা বা আবেদন কোড দিয়ে খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* District Dropdown */}
          <div className="sm:w-44">
            <select
              value={selectedDistrict}
              onChange={(e) => {
                setSelectedDistrict(e.target.value);
                setSelectedThana('all');
              }}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">সকল জেলা ({availableDistricts.length})</option>
              {availableDistricts.map(dist => (
                <option key={dist} value={dist}>{dist}</option>
              ))}
            </select>
          </div>

          {/* Thana Dropdown */}
          <div className="sm:w-44">
            <select
              value={selectedThana}
              onChange={(e) => setSelectedThana(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">সকল থানা/উপজেলা</option>
              {availableThanas.map(th => (
                <option key={th} value={th}>{th}</option>
              ))}
            </select>
          </div>

          {/* Category Dropdown */}
          <div className="sm:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">সকল ক্যাটাগরি</option>
              <option value="maternity_csection">🤰 সিজার ডেলিভারি অনুদান</option>
              <option value="major_surgery_aid">🏥 অপারেশন ও সার্জারি</option>
              <option value="free_doctor_consultation">👨‍⚕️ ফ্রি ডাক্তার সেবা</option>
              <option value="essential_medicine_aid">💊 জরুরি প্রেসক্রিপশন ঔষধ</option>
              <option value="lab_test_subsidy">🧪 ডায়াগনস্টিক ল্যাব টেস্ট</option>
              <option value="oxygen_ambulance_emergency">🚑 অক্সিজেন ও অ্যাম্বুলেন্স</option>
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="sm:w-36">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">সকল স্ট্যাটাস</option>
              <option value="pending">অপেক্ষমাণ (Pending)</option>
              <option value="verified">ভেরিফাইড (Verified)</option>
              <option value="sponsored">স্পন্সরড (Sponsored)</option>
              <option value="disbursed">বিতরণ সম্পন্ন (Disbursed)</option>
            </select>
          </div>
        </div>

        {/* Results Counter & Active Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
          <div>
            মোট প্রদর্শিত আবেদন: <strong className="text-emerald-700 font-mono text-sm">{filteredList.length}</strong> টি 
            {selectedDistrict !== 'all' && <span className="ml-1 text-slate-500">({selectedDistrict} জেলা)</span>}
          </div>

          {(selectedDistrict !== 'all' || selectedThana !== 'all' || selectedCategory !== 'all' || selectedStatus !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedDistrict('all');
                setSelectedThana('all');
                setSelectedCategory('all');
                setSelectedStatus('all');
                setSearchQuery('');
              }}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 underline"
            >
              সব ফিল্টার রিসেট করুন
            </button>
          )}
        </div>
      </div>

      {/* 4. Beneficiary Applications List / Grid */}
      {filteredList.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-3xl">
            🔍
          </div>
          <h3 className="text-lg font-bold text-slate-800">
            কোনো আবেদন খুঁজে পাওয়া যায়নি
          </h3>
          <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto">
            আপনার ফিল্টার বা সার্চ শব্দের সাথে মিল রেখে কোনো রোগীর আবেদন পাওয়া যায়নি। ফিল্টার রিসেট করুন অথবা নতুন আবেদন করুন।
          </p>
          <div className="pt-2">
            <button
              onClick={onOpenApplyModal}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-md"
            >
              চিকিৎসার জন্য আবেদন করুন
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredList.map((item) => {
            const isFunded = item.status === 'sponsored' || item.status === 'disbursed';
            const isVerified = item.status === 'verified';

            return (
              <div 
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden relative group"
              >
                {/* Status Colored Top Bar */}
                <div className={`h-1.5 w-full ${
                  isFunded 
                    ? 'bg-teal-500' 
                    : isVerified 
                    ? 'bg-emerald-500' 
                    : 'bg-amber-400'
                }`} />

                <div className="p-4 sm:p-5 space-y-4">
                  {/* Category & Status Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl p-1 bg-slate-50 rounded-xl border border-slate-100">
                        {item.categoryIcon}
                      </span>
                      <div>
                        <span className="inline-block px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px]">
                          {item.categoryTitle}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono flex items-center gap-1">
                          <span>আইডি:</span>
                          <span className="font-bold text-slate-600">{item.code}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(item.code, item.id)}
                            className="text-slate-400 hover:text-emerald-600"
                            title="কোড কপি করুন"
                          >
                            {copiedId === item.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0">
                      {isFunded ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[11px] font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>স্পন্সরপ্রাপ্ত</span>
                        </span>
                      ) : isVerified ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                          <ShieldCheck className="w-3 h-3" />
                          <span>ভেরিফাইড</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
                          <Clock className="w-3 h-3" />
                          <span>অপেক্ষমাণ</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Patient Name & Guardian */}
                  <div>
                    <h4 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{item.patientName}</span>
                    </h4>
                    {item.guardianName && (
                      <p className="text-xs text-slate-600 mt-0.5 ml-5">
                        {item.guardianName}
                      </p>
                    )}
                  </div>

                  {/* Geographic Location (District, Thana, Village) */}
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-700 space-y-1">
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                      <div className="leading-tight">
                        <strong>গ্রাম/ইউনিয়ন:</strong> {item.villageOrUnion || 'গ্রাম উল্লেখ নেই'} <br />
                        <strong>থানা:</strong> {item.upazilaOrArea} | <strong>জেলা:</strong> {item.district}
                      </div>
                    </div>
                  </div>

                  {/* Illness / Reason for Assistance */}
                  <div className="text-xs text-slate-600 bg-emerald-50/50 border border-emerald-100/60 rounded-xl p-2.5">
                    <div className="font-semibold text-emerald-900 mb-0.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-emerald-700" />
                      <span>সাহায্য চাওয়ার কারণ:</span>
                    </div>
                    <p className="line-clamp-3 text-slate-700 text-[11px] leading-relaxed">
                      {item.illnessDetails}
                    </p>
                  </div>

                  {/* Amount Needed & Progress */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-500">প্রয়োজনীয় অনুদান</div>
                      <div className="text-base font-extrabold text-emerald-700 font-mono">
                        ৳{item.requestedAmount.toLocaleString('bn-BD')}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleSharePatient(item)}
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
                        title="শেয়ার করুন"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onSponsorPatient(item)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm hover:shadow transition-all flex items-center gap-1"
                      >
                        <Gift className="w-3.5 h-3.5" />
                        <span>যাকাত / অনুদান দিন</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Footer timestamp */}
                <div className="px-4 py-2 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                  <span>আবেদনের তারিখ: {new Date(item.createdAt).toLocaleDateString('bn-BD')}</span>
                  {isAdmin && item.phone && (
                    <a 
                      href={`tel:${item.phone}`}
                      className="text-emerald-700 font-bold hover:underline font-mono"
                    >
                      📞 {item.phone}
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
