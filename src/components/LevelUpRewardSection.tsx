import React, { useState, useMemo } from 'react';
import { Award, Zap, Users, Calendar, CheckCircle2, Lock, ArrowUpRight, ChevronRight, TrendingUp, Sparkles, AlertCircle, Search, Filter } from 'lucide-react';

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-[24px] border border-slate-100 shadow-sm p-4 ${className}`}>
    {children}
  </div>
);

interface LevelUpRewardSectionProps {
  referredPatientsCount: number;
  referredAppointments: any[];
  takaBalance: number;
}

export const LevelUpRewardSection: React.FC<LevelUpRewardSectionProps> = ({
  referredPatientsCount,
  referredAppointments,
  takaBalance
}) => {
  const [filterMode, setFilterMode] = useState<'today' | 'all' | 'visited' | 'absent' | 'pending'>('today');

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const todayISO = now.toISOString().split('T')[0];

  // Helper to check if an appointment is today
  const isTodayApp = (app: any) => {
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
  };

  // Bengali Month Names
  const bnMonths = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];
  const currentMonthNameBn = bnMonths[currentMonth];

  // Today's appointments stats
  const todayApps = useMemo(() => referredAppointments.filter(isTodayApp), [referredAppointments, todayISO]);
  const todayVisitedCount = useMemo(() => todayApps.filter(a => a.status === 'visited').length, [todayApps]);
  const todayAbsentCount = useMemo(() => todayApps.filter(a => a.status === 'absent').length, [todayApps]);
  const todayPendingCount = useMemo(() => todayApps.filter(a => a.status === 'pending' || !a.status).length, [todayApps]);

  // Total patients who completed/visited appointments in current month
  const currentMonthVisitedApps = referredAppointments.filter(app => {
    const isCompleted = app.status === 'visited' || app.status === 'completed' || app.status === 'confirmed';
    if (!isCompleted) return false;

    let appDate = new Date();
    if (app.created_at) {
      if (typeof app.created_at === 'string') {
        appDate = new Date(app.created_at);
      } else if (app.created_at.seconds) {
        appDate = new Date(app.created_at.seconds * 1000);
      }
    }
    return appDate.getFullYear() === currentYear && appDate.getMonth() === currentMonth;
  });

  const monthPatientCount = currentMonthVisitedApps.length;

  // Qualification condition: 10 referrals & at least 1 appointment
  const totalBookedAppointmentsCount = referredAppointments.length;
  const is10ReferralsMet = referredPatientsCount >= 10;
  const is1AppointmentMet = totalBookedAppointmentsCount >= 1;
  const isReferral50BonusUnlocked = is10ReferralsMet && is1AppointmentMet;

  // Next patient reward rate: 50 + (monthPatientCount * 10)
  const nextPatientReward = 50 + (monthPatientCount * 10);
  const currentLevel = monthPatientCount + 1;

  // Calculate total monthly patient reward earned so far
  let totalMonthEarnings = 0;
  for (let i = 1; i <= monthPatientCount; i++) {
    totalMonthEarnings += 50 + (i - 1) * 10;
  }

  // Filtered appointments list for supervision
  const filteredAppointmentsList = useMemo(() => {
    if (filterMode === 'today') return todayApps;
    if (filterMode === 'visited') return referredAppointments.filter(a => a.status === 'visited');
    if (filterMode === 'absent') return referredAppointments.filter(a => a.status === 'absent');
    if (filterMode === 'pending') return referredAppointments.filter(a => a.status === 'pending' || !a.status);
    return referredAppointments;
  }, [referredAppointments, todayApps, filterMode]);

  // Sample tiers for preview table
  const previewTiers = [
    { patientNo: 1, reward: 50, levelName: 'লেভেল ১' },
    { patientNo: 2, reward: 60, levelName: 'লেভেল ২' },
    { patientNo: 3, reward: 70, levelName: 'লেভেল ৩' },
    { patientNo: 4, reward: 80, levelName: 'লেভেল ৪' },
    { patientNo: 5, reward: 90, levelName: 'লেভেল ৫' },
    { patientNo: 6, reward: 100, levelName: 'লেভেল ৬' },
  ];

  return (
    <div className="space-y-5 text-left my-6">
      {/* Section Title Header */}
      <div className="bg-gradient-to-r from-purple-700 via-indigo-800 to-blue-800 p-6 rounded-[28px] text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="bg-amber-400 text-slate-950 font-black text-[10px] uppercase px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
              <Sparkles size={12} className="animate-spin" /> লেভেল আপ ইনকাম প্রোগ্রাম
            </span>
            <span className="bg-white/15 backdrop-blur-md text-purple-100 text-[10px] font-extrabold px-3 py-1 rounded-full border border-white/20">
              🗓️ চলতি মাস: {currentMonthNameBn} {currentYear}
            </span>
          </div>

          <div>
            <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              🚀 লেভেল আপ (Level Up) & রোগী প্রতি রিওয়ার্ড
            </h3>
            <p className="text-xs font-bold text-purple-100/90 mt-1 leading-relaxed">
              রোগী প্রতি ৫০ টাকা থেকে শুরু করে ক্রমান্বয়ে প্রতি রোগীতে ১০ টাকা করে বৃদ্ধি পাবে!
            </p>
          </div>

          {/* Highlights Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15">
              <p className="text-[9px] font-black text-purple-200 uppercase tracking-wider">বর্তমান লেভেল</p>
              <p className="text-lg font-black text-amber-300 mt-0.5">লেভেল {currentLevel}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15">
              <p className="text-[9px] font-black text-purple-200 uppercase tracking-wider">পরবর্তী রোগী রিওয়ার্ড</p>
              <p className="text-lg font-black text-emerald-300 mt-0.5">৳{nextPatientReward} BDT</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15 col-span-2 sm:col-span-1">
              <p className="text-[9px] font-black text-purple-200 uppercase tracking-wider">এ মাসের অর্জিত রিওয়ার্ড</p>
              <p className="text-lg font-black text-white mt-0.5">৳{totalMonthEarnings} BDT</p>
            </div>
          </div>
        </div>
      </div>

      {/* 50 Taka Referral Unlock Requirement Condition Card */}
      <Card className="p-5 bg-gradient-to-br from-amber-50/80 via-orange-50/50 to-white border-2 border-amber-200/80 rounded-[24px] shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎁</span>
              <h4 className="font-black text-sm text-slate-900">
                ৫০ টাকা রেফারেল বোনাস আনলক করার শর্ত
              </h4>
            </div>
            <p className="text-[11px] font-extrabold text-slate-600 leading-relaxed">
              ১০ জন ইউজারকে রেফার করতে হবে এবং তাদের মধ্যে থেকে ন্যূনতম ১ জন ইউজারকে ডক্টর অ্যাপয়েন্টমেন্ট বুকিং সম্পন্ন করতে হবে।
            </p>
          </div>

          {isReferral50BonusUnlocked ? (
            <span className="shrink-0 bg-emerald-600 text-white font-black text-[10px] uppercase px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-md shadow-emerald-600/20">
              <CheckCircle2 size={13} /> ৫০৳ বোনাস আনলকড
            </span>
          ) : (
            <span className="shrink-0 bg-amber-500 text-white font-black text-[10px] uppercase px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-md shadow-amber-500/20">
              <Lock size={13} /> শর্ত সাপেক্ষে লকড
            </span>
          )}
        </div>

        {/* Progress Tracker */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Tracker 1: 10 Referrals */}
          <div className="bg-white p-3.5 rounded-2xl border border-amber-100 shadow-2xs space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-slate-700 font-extrabold flex items-center gap-1.5">
                <Users size={14} className="text-indigo-600" /> ১. রেফারেল রেজিষ্ট্রেশন:
              </span>
              <span className={`font-black ${is10ReferralsMet ? 'text-emerald-600' : 'text-amber-600'}`}>
                {referredPatientsCount} / ১০ জন
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  is10ReferralsMet ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(100, (referredPatientsCount / 10) * 100)}%` }}
              />
            </div>
            <p className="text-[9px] font-bold text-slate-400">
              {is10ReferralsMet
                ? '✓ ১০ জন রেফারেল পূরণের শর্ত সম্পন্ন হয়েছে!'
                : `আর ${10 - referredPatientsCount} জন রেফার করলেই ১ম ধাপ সম্পন্ন হবে`}
            </p>
          </div>

          {/* Tracker 2: At least 1 Appointment */}
          <div className="bg-white p-3.5 rounded-2xl border border-amber-100 shadow-2xs space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-slate-700 font-extrabold flex items-center gap-1.5">
                <Calendar size={14} className="text-purple-600" /> ২. অ্যাপয়েন্টমেন্ট সম্পন্ন:
              </span>
              <span className={`font-black ${is1AppointmentMet ? 'text-emerald-600' : 'text-amber-600'}`}>
                {totalBookedAppointmentsCount} / ১ জন
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  is1AppointmentMet ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(100, (totalBookedAppointmentsCount / 1) * 100)}%` }}
              />
            </div>
            <p className="text-[9px] font-bold text-slate-400">
              {is1AppointmentMet
                ? '✓ রেফারেল ইউজারের অ্যাপয়েন্টমেন্ট শর্ত সম্পন্ন হয়েছে!'
                : 'কমপক্ষে ১ জন রেফারকৃত ইউজারকে ডক্টর দেখাত হবে'}
            </p>
          </div>
        </div>

        {/* Bonus reward status badge alert */}
        <div className="bg-amber-100/70 text-amber-950 p-3 rounded-xl border border-amber-200 text-xs font-bold flex items-center gap-2">
          <AlertCircle size={16} className="text-amber-700 shrink-0" />
          <span>
            {isReferral50BonusUnlocked
              ? 'অভিনন্দন! আপনার ১০ জন রেফারেল ও অ্যাপয়েন্টমেন্ট শর্ত পূরণ থাকায় ৫০ টাকা বোনাস একাউন্টে যুক্ত হয়েছে।'
              : 'শর্ত পূরণ করার সাথে সাথেই ৫০ টাকা বোনাস সরাসরি আপনার ওয়ালেট ব্যালেন্সে যোগ হবে!'}
          </span>
        </div>
      </Card>

      {/* Tiered Level-Up Progression System Details */}
      <Card className="p-5 bg-white border border-slate-100 rounded-[24px] shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div>
            <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <TrendingUp size={16} className="text-indigo-600" />
              ক্রমান্বয়ে রিওয়ার্ড বৃদ্ধির নিয়ম (মাসিক হিসাব)
            </h4>
            <p className="text-[11px] font-bold text-slate-400 mt-0.5">
              প্রতিটি নতুন রোগীর জন্য ১০ টাকা করে অতিরিক্ত বোনাস যোগ হবে!
            </p>
          </div>
          <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black px-2.5 py-1 rounded-xl uppercase">
            {currentMonthNameBn} মাস
          </span>
        </div>

        {/* Tier Chart Table */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {previewTiers.map((tier) => {
            const isCurrentTier = monthPatientCount + 1 === tier.patientNo;
            const isCompletedTier = monthPatientCount >= tier.patientNo;

            return (
              <div
                key={tier.patientNo}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                  isCurrentTier
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-600 shadow-md scale-[1.02]'
                    : isCompletedTier
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200 font-bold'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg ${
                      isCurrentTier 
                        ? 'bg-amber-400 text-slate-950' 
                        : isCompletedTier 
                        ? 'bg-emerald-200 text-emerald-900' 
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      {tier.levelName}
                    </span>
                    {isCurrentTier && (
                      <span className="text-[9px] font-black uppercase tracking-widest text-amber-300">
                        (আপনার বর্তমান লেভেল)
                      </span>
                    )}
                  </div>
                  <p className={`text-xs font-extrabold mt-1 ${isCurrentTier ? 'text-white' : 'text-slate-800'}`}>
                    {tier.patientNo}-তম রোগী সিরিয়াল
                  </p>
                </div>

                <div className="text-right">
                  <p className={`text-sm font-black ${
                    isCurrentTier ? 'text-amber-300' : isCompletedTier ? 'text-emerald-700' : 'text-indigo-600'
                  }`}>
                    ৳{tier.reward}
                  </p>
                  <p className={`text-[9px] font-bold ${isCurrentTier ? 'text-purple-100' : 'text-slate-400'}`}>
                    {isCompletedTier ? '✓ অর্জিত' : 'রিওয়ার্ড'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dynamic Formula Explanation */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
          <p className="text-xs font-black text-slate-800 flex items-center gap-1.5">
            <span>💡</span> রিওয়ার্ডের নিয়ম কীভাবে কাজ করে?
          </p>
          <ul className="text-[11px] font-bold text-slate-600 space-y-1.5 leading-relaxed pl-1">
            <li className="flex items-start gap-1.5">
              <span className="text-emerald-600 font-black">•</span>
              <span><strong>১ম রোগী:</strong> ৫০ টাকা পাবেন।</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-emerald-600 font-black">•</span>
              <span><strong>২য় রোগী:</strong> ৬০ টাকা পাবেন।</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-emerald-600 font-black">•</span>
              <span><strong>৩য় রোগী:</strong> ৭০ টাকা পাবেন।</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-emerald-600 font-black">•</span>
              <span><strong>৪র্থ রোগী:</strong> ৮০ টাকা এবং <strong>৫ম রোগী:</strong> ৯০ টাকা... এভাবে প্রতিক্ষেত্রে ১০ টাকা করে যোগ হবে!</span>
            </li>
            <li className="flex items-start gap-1.5 text-indigo-700 font-extrabold pt-1 border-t border-slate-200/60">
              <span>🗓️</span>
              <span><strong>মাসিক রিসেট নিয়ম:</strong> এই হিসাবটি শুধু প্রত্যেক মাস অনুযায়ী কাউন্ট হবে। নতুন মাস পড়ার সাথে সাথে আবার ১ম রোগী থেকে ৫০ টাকা, ২য় রোগী ৬০ টাকা এভাবে ক্রমান্বয়ে বৃদ্ধি পাবে।</span>
            </li>
          </ul>
        </div>
      </Card>

      {/* Referred Patient Serials under User Supervision */}
      <Card className="p-5 bg-white border border-slate-100 rounded-[24px] shadow-sm space-y-4">
        {/* Header & Title */}
        <div className="flex flex-wrap justify-between items-center border-b border-slate-100 pb-3 gap-2">
          <div>
            <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Users size={16} className="text-blue-600" />
              আপনার রেফার করা রোগীদের সিরিয়াল ও তদারকি ড্যাশবোর্ড ({referredAppointments.length})
            </h4>
            <p className="text-[11px] font-bold text-slate-400 mt-0.5">
              এডমিন দ্বারা নিশ্চিত হওয়ার পর রোগী প্রতি কমিশন সরাসরি ওয়ালেট ব্যালেন্সে জমা হয়:
            </p>
          </div>
          <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-2.5 py-1 rounded-xl uppercase tracking-wider flex items-center gap-1">
            <Sparkles size={11} /> লাইভ স্ট্যাটাস ট্র্যাকিং
          </span>
        </div>

        {/* Today's Live Supervision Quick Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">📅 আজকের মোট রোগী</p>
            <p className="text-base font-black text-slate-800 mt-0.5">{todayApps.length} জন</p>
          </div>
          <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200">
            <p className="text-[9px] font-black text-emerald-700 uppercase tracking-wider">✅ দেখিয়েছেন (সফল)</p>
            <p className="text-base font-black text-emerald-800 mt-0.5">{todayVisitedCount} জন</p>
          </div>
          <div className="bg-rose-50 p-3 rounded-2xl border border-rose-200">
            <p className="text-[9px] font-black text-rose-700 uppercase tracking-wider">❌ আসেননি/বাতিল</p>
            <p className="text-base font-black text-rose-800 mt-0.5">{todayAbsentCount} জন</p>
          </div>
          <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200">
            <p className="text-[9px] font-black text-amber-700 uppercase tracking-wider">⏳ পেন্ডিং (অপেক্ষমান)</p>
            <p className="text-base font-black text-amber-800 mt-0.5">{todayPendingCount} জন</p>
          </div>
        </div>

        {/* Filter Navigation Bar */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] font-black uppercase text-slate-400 mr-1 flex items-center gap-1">
            <Filter size={11} /> ফিল্টার:
          </span>
          {[
            { key: 'today', label: `📅 আজকের সিরিয়াল (${todayApps.length})` },
            { key: 'all', label: `📋 সকল সিরিয়াল (${referredAppointments.length})` },
            { key: 'visited', label: `✅ দেখিয়েছেন (${referredAppointments.filter(a => a.status === 'visited').length})` },
            { key: 'absent', label: `❌ বাতিল/আসেননি (${referredAppointments.filter(a => a.status === 'absent').length})` },
            { key: 'pending', label: `⏳ পেন্ডিং (${referredAppointments.filter(a => a.status === 'pending' || !a.status).length})` },
          ].map(f => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilterMode(f.key as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterMode === f.key
                  ? 'bg-blue-600 text-white font-black shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Supervision Patient List */}
        {filteredAppointmentsList.length === 0 ? (
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center space-y-1">
            <p className="text-xs font-bold text-slate-500">এই ফিল্টারে কোনো রোগীর সিরিয়াল পাওয়া যায়নি।</p>
            <p className="text-[10px] font-medium text-slate-400">
              {filterMode === 'today'
                ? 'আজকে আপনার রেফারেন্স কোডে কোনো ডক্টর দেখানোর সিরিয়াল নেই।'
                : 'আপনার রেফারেল লিংক শেয়ার করে রোগীদের সাহায্য করুন ও কমিশন উপভোগ করুন।'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAppointmentsList.map((app, idx) => (
              <div 
                key={app.id || idx}
                className="bg-slate-50/70 hover:bg-slate-50 p-4 rounded-2xl border border-slate-200/70 text-left space-y-2.5 transition-all"
              >
                <div className="flex flex-wrap justify-between items-start gap-2">
                  <div>
                    <h5 className="font-black text-xs text-slate-900 flex items-center gap-1.5">
                      👨‍⚕️ {app.doctor_name}
                    </h5>
                    <p className="text-[10px] font-extrabold text-blue-600 mt-0.5 uppercase tracking-wider">
                      {app.doctor_specialty}
                    </p>
                  </div>

                  {/* Status Badge */}
                  <div className="text-right">
                    <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2.5 py-1 rounded-xl uppercase tracking-wider ${
                      app.status === 'visited'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : app.status === 'absent'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {app.status === 'visited' ? (
                        <>✓ দেখিয়েছেন (কমিশন যোগ হয়েছে)</>
                      ) : app.status === 'absent' ? (
                        <>✕ আসেননি (ক্যান্সেল)</>
                      ) : (
                        <>⏳ পেন্ডিং (এডমিন যাচায় চলছে)</>
                      )}
                    </span>
                    {app.status === 'visited' && (
                      <p className="text-[10px] font-black text-emerald-600 mt-1">
                        +৳{app.credited_amount || 50} BDT ওয়ালেটে যোগ হয়েছে
                      </p>
                    )}
                  </div>
                </div>

                {/* Patient Details */}
                <div className="text-[11px] font-bold text-slate-600 space-y-1 bg-white p-3 rounded-xl border border-slate-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    <p><span className="text-slate-400 font-normal">রোগীর নাম:</span> <strong className="text-slate-900">{app.patient_name}</strong></p>
                    <p><span className="text-slate-400 font-normal">মোবাইল:</span> <strong className="font-mono text-slate-800">{app.patient_phone}</strong></p>
                    <p><span className="text-slate-400 font-normal">সিরিয়ালের তারিখ:</span> <strong className="text-slate-800">{app.date}</strong></p>
                    {app.problems && <p><span className="text-slate-400 font-normal">সমস্যা:</span> <span className="italic text-slate-600">{app.problems}</span></p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
