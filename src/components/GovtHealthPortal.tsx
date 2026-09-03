import React, { useState } from 'react';
import { 
  Building2, 
  ExternalLink, 
  ShieldCheck, 
  CheckCircle2, 
  Phone, 
  Globe, 
  Calendar, 
  Clock, 
  FileText, 
  UserCheck, 
  ArrowRight,
  Maximize2,
  RefreshCw,
  Info,
  BadgeCheck,
  Sparkles,
  Smartphone,
  ChevronRight
} from 'lucide-react';

interface GovtHealthPortalProps {
  onBackToHome?: () => void;
}

export const GovtHealthPortal: React.FC<GovtHealthPortalProps> = ({ onBackToHome }) => {
  const [iframeKey, setIframeKey] = useState(0);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'ticket' | 'portal_view' | 'guide'>('overview');

  const GOVT_URL = "https://amarswasthyo.mohfw.gov.bd/";

  const handleOpenGovtSite = (path: string = '') => {
    window.open(`${GOVT_URL}${path}`, '_blank', 'noopener,noreferrer');
  };

  const handleRefreshIframe = () => {
    setIframeLoading(true);
    setIframeKey(prev => prev + 1);
  };

  return (
    <div id="govt-health-portal" className="space-y-6 text-left animate-fadeIn">
      {/* Hero Header Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-emerald-500/30">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/40 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider text-emerald-200 backdrop-blur-md">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>গণপ্রজাতন্ত্রী বাংলাদেশ সরকার • স্বাস্থ্য ও পরিবার কল্যাণ মন্ত্রণালয় (MOHFW)</span>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="tel:16263"
                className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-emerald-100 text-xs font-black px-3 py-1.5 rounded-xl border border-white/20 transition-all"
                title="স্বাস্থ্য বাতায়ন হটলাইন"
              >
                <Phone size={13} className="text-emerald-300" />
                <span>স্বাস্থ্য বাতায়ন: ১৬২৬৩</span>
              </a>
            </div>
          </div>

          <div className="max-w-3xl space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span className="text-3xl sm:text-4xl">🏛️</span>
              <span>সরকারি হাসপাতাল স্বাস্থ্যসেবা ও ই-টিকিট পোর্টাল</span>
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-medium">
              সরাসরি স্বাস্থ্য ও পরিবার কল্যাণ মন্ত্রণালয়ের অফিশিয়াল ডিজিটাল স্বাস্থ্য পোর্টাল <strong>"আমার স্বাস্থ্য" (amarswasthyo.mohfw.gov.bd)</strong>-এর মাধ্যমে দেশের যেকোনো সরকারি মেডিকেল কলেজ, জেলা ও উপজেলা সদর হাসপাতালের আউটডোর টিকিট কাটুন, রোগী নিবন্ধন করুন এবং বিনামূল্যে সরকারি স্বাস্থ্য সুবিধা গ্রহণ করুন।
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleOpenGovtSite()}
              className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Globe size={16} />
              <span>সরাসরি অফিশিয়াল সরকারি পোর্টালে যান</span>
              <ExternalLink size={14} />
            </button>

            <button
              onClick={() => setActiveTab('portal_view')}
              className="px-4 py-3 bg-white/15 hover:bg-white/25 text-white font-black text-xs sm:text-sm rounded-2xl border border-white/25 backdrop-blur-md active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Smartphone size={16} className="text-emerald-300" />
              <span>অ্যাপেই পোর্টাল ব্রাউজ করুন</span>
            </button>

            <button
              onClick={() => setActiveTab('guide')}
              className="px-4 py-3 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-200 font-bold text-xs rounded-2xl border border-emerald-500/30 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Info size={15} />
              <span>টিকিট কাটার নিয়ম দেখুন</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
        {[
          { id: 'overview', label: '🏛️ সরকারি সেবা ও সুবিধাসমূহ', desc: 'সকল ফিচার' },
          { id: 'ticket', label: '🎫 অনলাইন ই-টিকিট বুকিং', desc: 'আউটডোর টিকিট' },
          { id: 'portal_view', label: '🌐 লাইভ পোর্টাল ভিউয়ার', desc: 'ওয়েবসাইট ব্রাউজ' },
          { id: 'guide', label: '📖 টিকিট কাটার নির্দেশিকা', desc: 'সহজ নিয়ম' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl font-black text-xs transition-all text-center flex flex-col items-center gap-0.5 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-emerald-700 text-white shadow-md'
                : 'text-slate-600 hover:bg-white/60'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`text-[9px] font-bold ${activeTab === tab.id ? 'text-emerald-200' : 'text-slate-400'}`}>
              {tab.desc}
            </span>
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW & SERVICES */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Card 1: Ticket Booking */}
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all space-y-3 relative overflow-hidden group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-2xl font-black shadow-2xs">
                🎫
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-base text-slate-800 flex items-center gap-1.5">
                  সরকারি আউটডোর ই-টিকিট
                </h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  লাইনে দাঁড়িয়ে ভিড় না করে ঘরে বসেই দেশের যেকোনো সরকারি হাসপাতালের বহিঃবিভাগ (OPD) ডাক্তার দেখানোর টিকিট কাটুন মাত্র ১০ টাকায়।
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-black text-emerald-600 uppercase">ফি: মাত্র ১০ টাকা</span>
                <button
                  onClick={() => handleOpenGovtSite()}
                  className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 hover:text-emerald-800"
                >
                  <span>টিকিট কাটুন</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Card 2: Patient Registration & Health ID */}
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all space-y-3 relative overflow-hidden group">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center text-2xl font-black shadow-2xs">
                📋
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-base text-slate-800 flex items-center gap-1.5">
                  রোগী নিবন্ধন ও হেলথ আইডি
                </h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  জাতীয় পরিচয়পত্র (NID) বা জন্মনিবন্ধন দিয়ে স্থায়ী ডিজিটাল হেলথ অ্যাকাউন্ট খুলুন এবং আজীবন সব প্রেসক্রিপশন সংরক্ষিত রাখুন।
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-black text-teal-600 uppercase">১০০% সরকারি ও সুরক্ষিত</span>
                <button
                  onClick={() => handleOpenGovtSite()}
                  className="inline-flex items-center gap-1 text-xs font-black text-teal-700 hover:text-teal-800"
                >
                  <span>নিবন্ধন করুন</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Card 3: Digital Prescription */}
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all space-y-3 relative overflow-hidden group">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center text-2xl font-black shadow-2xs">
                📑
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-base text-slate-800 flex items-center gap-1.5">
                  ডিজিটাল প্রেসক্রিপশন ও হিস্ট্রি
                </h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  সরকারি হাসপাতালের ডাক্তারদের দেওয়া সকল ই-প্রেসক্রিপশন ও টেস্ট রিপোর্ট যেকোনো সময় অনলাইনে চেক করুন এবং প্রিন্ট নিন।
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-black text-blue-600 uppercase">অনলাইন রেকর্ড</span>
                <button
                  onClick={() => handleOpenGovtSite()}
                  className="inline-flex items-center gap-1 text-xs font-black text-blue-700 hover:text-blue-800"
                >
                  <span>প্রেসক্রিপশন দেখুন</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Card 4: Govt Hospital Directory */}
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all space-y-3 relative overflow-hidden group">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center text-2xl font-black shadow-2xs">
                🏥
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-base text-slate-800 flex items-center gap-1.5">
                  সরকারি হাসপাতালের তালিকা
                </h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  ঢাকা মেডিকেল, স্যার সলিমুল্লাহ, রংপুর মেডিকেলসহ সারা দেশের সকল মেডিকেল কলেজ, সদর হাসপাতাল ও উপজেলা স্বাস্থ্য কমপ্লেক্সের তথ্য।
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-black text-indigo-600 uppercase">সমগ্র বাংলাদেশ</span>
                <button
                  onClick={() => handleOpenGovtSite()}
                  className="inline-flex items-center gap-1 text-xs font-black text-indigo-700 hover:text-indigo-800"
                >
                  <span>হাসপাতাল খুঁজুন</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Card 5: Free Medicine & Supplies */}
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all space-y-3 relative overflow-hidden group">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center text-2xl font-black shadow-2xs">
                💊
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-base text-slate-800 flex items-center gap-1.5">
                  বিনামূল্যে সরকারি ঔষধ
                </h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  সরকারি হাসপাতালে আউটডোর বা ইনডোরে চিকিৎসা নেওয়ার পর সরকারি ডিসপেনসারি থেকে প্রয়োজনীয় জরুরি ঔষধ বিনামূল্যে সংগ্রহ করুন।
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-black text-rose-600 uppercase">বিনামূল্যে সেবা</span>
                <button
                  onClick={() => setActiveTab('guide')}
                  className="inline-flex items-center gap-1 text-xs font-black text-rose-700 hover:text-rose-800"
                >
                  <span>নির্দেশনা জানুন</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Card 6: Emergency Govt Hotlines */}
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all space-y-3 relative overflow-hidden group">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center text-2xl font-black shadow-2xs">
                🚨
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-base text-slate-800 flex items-center gap-1.5">
                  সরকারি হেল্পলাইন ও জরুরি সেবা
                </h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  ২৪ ঘন্টা ডাক্তারদের সাথে ফ্রিতে কথা বলুন <strong>১৬২৬৩</strong> নাম্বারে এবং জাতীয় জরুরি পুলিশ/অ্যাম্বুলেন্স সেবার জন্য কল করুন <strong>৯৯৯</strong>।
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-black text-amber-600 uppercase">২৪/৭ চালু</span>
                <a
                  href="tel:16263"
                  className="inline-flex items-center gap-1 text-xs font-black text-amber-700 hover:text-amber-800"
                >
                  <span>১৬২৬৩ কল করুন</span>
                  <Phone size={13} />
                </a>
              </div>
            </div>
          </div>

          {/* Quick Notice Banner */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-3 bg-emerald-600 text-white rounded-2xl shrink-0 shadow-md">
                <ShieldCheck size={24} />
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-sm text-slate-800">
                  নিরাপদ ও নির্ভরযোগ্য সরকারি স্বাস্থ্য প্ল্যাটফর্ম
                </h4>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  'আমার স্বাস্থ্য' পোর্টালটি বাংলাদেশ স্বাস্থ্য ও পরিবার কল্যাণ মন্ত্রণালয়ের অধীন পরিচালিত। আপনার জাতীয় পরিচয়পত্র ও স্বাস্থ্য তথ্য সম্পূর্ণ গোপনীয় ও সুরক্ষিত থাকে।
                </p>
              </div>
            </div>
            <button
              onClick={() => handleOpenGovtSite()}
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-md active:scale-95 transition-all shrink-0 flex items-center gap-2 cursor-pointer"
            >
              <span>ওয়েবসাইট ভিজিট করুন</span>
              <ExternalLink size={14} />
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: TICKET BOOKING STEPS */}
      {activeTab === 'ticket' && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-2 inline-block">
                🎫 অনলাইন ই-টিকিটিং গাইড
              </span>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">
                সরকারি হাসপাতালে মাত্র ১০ টাকায় যেভাবে অনলাইন টিকিট কাটবেন
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                নিচের ধাপগুলো অনুসরণ করে ১ মিনিটের মধ্যেই আপনার কাঙ্ক্ষিত সরকারি হাসপাতালের টিকিট কনফার্ম করুন।
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  step: '০১',
                  title: 'আমার স্বাস্থ্য ওয়েবসাইটে প্রবেশ করুন',
                  desc: 'amarswasthyo.mohfw.gov.bd ওয়েবসাইটে যান অথবা উপরের "পোর্টালে যান" বাটনে ক্লিক করুন।',
                  icon: '🌐'
                },
                {
                  step: '০২',
                  title: 'মোবাইল নম্বর বা NID দিয়ে লগইন/রেজিস্ট্রেশন',
                  desc: 'আপনার মোবাইল নম্বরে পাঠানো ওটিপি (OTP) দিয়ে একাউন্টে সহজে লগইন করুন।',
                  icon: '📱'
                },
                {
                  step: '০৩',
                  title: 'হাসপাতাল ও ডিপার্টমেন্ট নির্বাচন',
                  desc: 'যে সরকারি হাসপাতালে ডাক্তার দেখাতে চান তা সিলেক্ট করে মেডিসিন, শিশু, চক্ষু বা পছন্দমতো বিভাগ বেছে নিন।',
                  icon: '🏥'
                },
                {
                  step: '০৪',
                  title: 'তারিখ সিলেক্ট ও ১০ টাকা ফি পরিশোধ',
                  desc: 'ডাক্তার দেখানোর সুবিধাজনক তারিখ সিলেক্ট করে বিকাশ/নগদের মাধ্যমে মাত্র ১০ টাকার আউটডোর ফি পরিশোধ করুন।',
                  icon: '💳'
                },
                {
                  step: '০৫',
                  title: 'টিকিট ডাউনলোড ও হাসপাতালে যান',
                  desc: 'অনলাইন টিকিটটি মোবাইল স্ক্রিনে সেভ রাখুন বা প্রিন্ট করে নির্দিষ্ট দিনে নির্ধারিত রুমে ডাক্তার দেখান।',
                  icon: '📄'
                },
                {
                  step: '০৬',
                  title: 'লাইনের ঝামেলা ছাড়া দ্রুত সেবা',
                  desc: 'অনলাইন টিকিটধারীদের জন্য সরকারি হাসপাতালে বিশেষ কাউন্টারে দ্রুত সেবা প্রদান করা হয়।',
                  icon: '⚡'
                }
              ].map((item) => (
                <div key={item.step} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                    {item.step}
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-black text-sm text-slate-800 flex items-center gap-1.5">
                      <span>{item.icon}</span> {item.title}
                    </h5>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100">
              <div>
                <h5 className="font-black text-sm text-emerald-950">এখনই সরাসরি সরকারি টিকিট কাটতে চান?</h5>
                <p className="text-xs text-emerald-800 font-medium">১০ টাকার টিকিটে বিশেষজ্ঞ সরকারি চিকিৎসকের পরামর্শ গ্রহণ করুন।</p>
              </div>
              <button
                onClick={() => handleOpenGovtSite()}
                className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>সরকারি পোর্টালে টিকিট কাটুন</span>
                <ExternalLink size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LIVE PORTAL EMBED VIEWER */}
      {activeTab === 'portal_view' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <h4 className="font-black text-xs sm:text-sm text-slate-800">
                  'আমার স্বাস্থ্য' সরকারি পোর্টাল ফ্রেম
                </h4>
                <p className="text-[10px] text-slate-400 font-bold">
                  URL: {GOVT_URL}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRefreshIframe}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer"
                title="রিফ্রেশ করুন"
              >
                <RefreshCw size={13} />
                <span>রিফ্রেশ</span>
              </button>

              <button
                onClick={() => handleOpenGovtSite()}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                title="সম্পূর্ণ নতুন ট্যাবে খুলুন"
              >
                <Maximize2 size={13} />
                <span>নতুন ট্যাবে বড় করে দেখুন</span>
              </button>
            </div>
          </div>

          {/* Iframe Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-900 font-medium flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Info size={16} className="text-amber-700 shrink-0" />
              <span>
                যদি কোনো ব্রাউজারে সরকারি ফ্রেম সিকিউরিটির কারণে পোর্টালটি লোড হতে দেরি হয়, তবে <strong>"নতুন ট্যাবে বড় করে দেখুন"</strong> বাটনে ক্লিক করে সরাসরি ব্যবহার করুন।
              </span>
            </div>
            <button
              onClick={() => handleOpenGovtSite()}
              className="shrink-0 font-black text-emerald-800 underline text-xs"
            >
              সরাসরি ওপেন করুন &rarr;
            </button>
          </div>

          {/* Embedded Web Container */}
          <div className="relative w-full h-[650px] sm:h-[750px] bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xl">
            {iframeLoading && (
              <div className="absolute inset-0 bg-slate-50 flex flex-col items-center justify-center gap-3 z-10">
                <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-black text-slate-600">সরকারি স্বাস্থ্য পোর্টাল লোড হচ্ছে...</p>
                <button
                  onClick={() => handleOpenGovtSite()}
                  className="text-xs font-bold text-emerald-700 underline mt-2"
                >
                  লোড না হলে সরাসরি ওপেন করতে এখানে ক্লিক করুন
                </button>
              </div>
            )}
            <iframe
              key={iframeKey}
              src={GOVT_URL}
              title="আমার স্বাস্থ্য - সরকারি স্বাস্থ্য সেবা পোর্টাল"
              className="w-full h-full border-none"
              onLoad={() => setIframeLoading(false)}
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
            />
          </div>
        </div>
      )}

      {/* TAB 4: DETAILED GUIDES & FAQS */}
      {activeTab === 'guide' && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-5">
            <div>
              <span className="bg-teal-100 text-teal-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-2 inline-block">
                ❓ সাধারণ প্রশ্নোত্তর ও জরুরি তথ্য
              </span>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">
                সরকারি স্বাস্থ্য সেবা সম্পর্কিত সাধারণ প্রশ্নোত্তর (FAQs)
              </h3>
            </div>

            <div className="space-y-3">
              {[
                {
                  q: "১. সরকারি হাসপাতালের টিকিট ফি কত?",
                  a: "সরকারি হাসপাতালের বহির্বিভাগ (OPD)-এ ডাক্তার দেখানোর ফি মাত্র ১০ (দশ) টাকা।"
                },
                {
                  q: "২. অনলাইনে টিকিট কাটলে কি সিরিয়াল নিশ্চিত হয়?",
                  a: "হ্যাঁ, 'আমার স্বাস্থ্য' পোর্টালে অনলাইন টিকিট কাটলে টিকিট নাম্বার ও সময় উল্লেখ থাকে, ফলে দীর্ঘ লাইনে দাঁড়িয়ে থাকার প্রয়োজন হয় না।"
                },
                {
                  q: "৩. কোনো কারণে হাসপাতালে না যেতে পারলে কি টিকিট বাতিল করা যাবে?",
                  a: "অনলাইন পোর্টালে টিকিট বুকিং ম্যানেজমেন্টে গিয়ে নির্ধারিত সময়ের পূর্বে তারিখ পরিবর্তন বা বাতিল করার সুযোগ রয়েছে।"
                },
                {
                  q: "৪. সরকারি হাসপাতালে কি কি ঔষধ বিনামূল্যে পাওয়া যায়?",
                  a: "সরকারি হাসপাতালের ডিসপেনসারিতে প্যারাসিটামল, এন্টাসিড, অ্যান্টিবায়োটিক, প্রেসার, ডায়াবেটিসসহ ৬০+ ধরনের জরুরি প্রাথমিক ঔষধ বিনামূল্যে সরবরাহ করা হয় (স্টক সাপেক্ষে)।"
                },
                {
                  q: "৫. যেকোনো সহায়তার জন্য সরকারি হেল্পলাইন নম্বর কোনটি?",
                  a: "যেকোনো সরকারি স্বাস্থ্য তথ্য, অ্যাম্বুলেন্স খোঁজ ও চিকিৎসকের পরামর্শের জন্য ২৪ ঘন্টা যেকোনো ফোন থেকে ১৬২৬৩ (স্বাস্থ্য বাতায়ন) নম্বরে বিনামূল্যে কল করা যায়।"
                }
              ].map((faq, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                  <h5 className="font-black text-sm text-slate-800 flex items-center gap-2">
                    <span className="text-emerald-600">📌</span> {faq.q}
                  </h5>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed pl-5">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 text-center">
              <button
                onClick={() => handleOpenGovtSite()}
                className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-lg active:scale-95 transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <span>অফিশিয়াল পোর্টাল ভিজিট করুন (amarswasthyo.mohfw.gov.bd)</span>
                <ExternalLink size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
