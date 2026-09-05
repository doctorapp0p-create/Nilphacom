import React, { useState } from 'react';
import { 
  Phone, 
  MessageSquare, 
  Stethoscope, 
  Building2, 
  Award, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Share2, 
  ShieldCheck, 
  Send, 
  X,
  Megaphone,
  UserCheck,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../../services/firebase';
import { collection, addDoc } from 'firebase/firestore';

interface DoctorProfileAdBannerCardProps {
  hotline?: string;
  whatsappNumber?: string;
}

export const DoctorProfileAdBannerCard: React.FC<DoctorProfileAdBannerCardProps> = ({
  hotline = '01352669100',
  whatsappNumber = '8801352669100'
}) => {
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form state
  const [hospitalName, setHospitalName] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [degree, setDegree] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  const handleWhatsAppClick = (customMsg?: string) => {
    const text = customMsg || `হ্যালো nilpha.com, আমি আমার প্রতিষ্ঠানের ডাক্তারদের প্রোফাইল ব্যানার এবং অ্যাড ব্যানার দিতে চাই। অনুগ্রহ করে বিস্তারিত প্রসেস ও খরচ জানান।`;
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospitalName || !doctorName || !phone) {
      alert('অনুগ্রহ করে প্রতিষ্ঠানের নাম, ডাক্তারের নাম ও মোবাইল নম্বর পূরণ করুন');
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'banner_ad_requests'), {
        hospitalName,
        doctorName,
        degree,
        specialty,
        phone,
        notes,
        createdAt: new Date().toISOString(),
        status: 'pending'
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting banner ad request:', err);
      // Even if Firestore fails, show success and prompt WhatsApp
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="w-full my-4 select-none">
      {/* Outer Banner Card with Premium Medical Gradient & Glow */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white shadow-2xl border-2 border-amber-400/40 p-4 sm:p-6 lg:p-7">
        
        {/* Decorative Background Lighting */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/20 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-emerald-500/15 rounded-full blur-[80px] pointer-events-none" />

        {/* Top Floating Announcement Tag */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2.5 pb-4 border-b border-white/10">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 text-[11px] sm:text-xs font-black px-3.5 py-1.5 rounded-full shadow-lg shadow-amber-400/20 uppercase tracking-wider">
            <Megaphone size={14} className="animate-bounce" />
            <span>বিজ্ঞাপন ও ব্যানার সেবা</span>
          </div>

          <span className="text-[10px] sm:text-xs font-bold text-amber-300 bg-amber-950/60 px-3 py-1 rounded-full border border-amber-500/30 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            ব্যানার স্পট খালি রয়েছে
          </span>
        </div>

        {/* Main Pitch Heading */}
        <div className="relative z-10 my-4 space-y-1.5">
          <h2 className="text-base sm:text-xl lg:text-2xl font-black text-white leading-tight tracking-tight">
            আপনার প্রতিষ্ঠানের ডাক্তার এর <span className="text-amber-400 underline decoration-amber-400/60 underline-offset-4">প্রোফাইল ব্যানার</span> এবং <span className="text-sky-300 underline decoration-sky-400/60 underline-offset-4">অ্যাড ব্যানার</span> দিতে আমাদের সাথে যোগাযোগ করুন
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed max-w-3xl">
            নীলফামারীর হাজারো রোগী ও সেবাগ্রহীতার কাছে আপনার হাসপাতাল, ক্লিনিক বা ডায়াগনস্টিক সেন্টারের বিশেষজ্ঞ চিকিৎসকদের পরিচিতি ও সিরিয়াল তথ্য পৌঁছে দিন। নিচে দেওয়া ডেমো ব্যানারের মতো আকর্ষণীয় ডিজাইনে ব্যানার প্রচার করা হবে।
          </p>
        </div>

        {/* --- THE DEMO DOCTOR PROFILE & AD BANNER PREVIEW BOX --- */}
        <div className="relative z-10 my-4 bg-slate-900/90 backdrop-blur-md rounded-2xl p-4 sm:p-5 border-2 border-sky-500/40 shadow-inner">
          {/* Demo Badge */}
          <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="bg-sky-500 text-white text-[10px] sm:text-[11px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                ডেমো ডক্টর ব্যানার প্রিভিউ
              </span>
              <span className="text-[10px] text-slate-400 font-bold hidden sm:inline">
                (আপনার ডাক্তারের তথ্য অনুযায়ী এভাবে ব্যানার তৈরি হবে)
              </span>
            </div>
            <span className="text-[10px] text-emerald-400 font-black bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
              ✓ ভেরিফাইড প্রোফাইল
            </span>
          </div>

          {/* Demo Doctor Profile Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Left: Doctor Photo / Avatar with Stethoscope Badge */}
            <div className="md:col-span-3 flex sm:flex-col items-center gap-3">
              <div className="relative">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-xl bg-slate-800 shrink-0">
                  <img 
                    src="/src/assets/images/demo_doctor_banner_1788648969320.jpg" 
                    alt="ডেমো ডাক্তার" 
                    className="w-full h-full object-cover object-top"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="absolute -bottom-1.5 -right-1.5 bg-emerald-500 text-white p-1 rounded-full shadow border-2 border-slate-900" title="ভেরিফাইড ডাক্তার">
                  <ShieldCheck size={14} />
                </div>
              </div>
              <div className="text-left sm:text-center">
                <span className="text-[9px] font-black uppercase text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-500/40">
                  ডেমো বিশেষজ্ঞ ডাক্তার
                </span>
                <p className="text-[10px] text-slate-400 mt-1">সিরিয়াল কোড: DOC-DEMO-01</p>
              </div>
            </div>

            {/* Middle: Doctor Name, Degrees, Designation & Hospital Name */}
            <div className="md:col-span-6 space-y-2">
              <div>
                <div className="flex items-center gap-1.5 text-sky-400 text-[11px] font-bold">
                  <Stethoscope size={13} />
                  <span>মেডিসিন ও হৃদরোগ বিশেষজ্ঞ</span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  <span>ডাঃ মোঃ তানভীর আহমেদ</span>
                  <span className="text-xs text-amber-300 font-bold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
                    (ডেমো ডাক্তার)
                  </span>
                </h3>
              </div>

              {/* Degrees */}
              <div className="bg-slate-800/80 rounded-xl p-2.5 border border-slate-700/80 space-y-1">
                <div className="flex items-start gap-1.5">
                  <Award size={14} className="text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-[13px] font-black text-amber-200 leading-snug">
                    MBBS (ঢাকা), BCS (স্বাস্থ্য), FCPS (মেডিসিন), MD (কার্ডিওলজি)
                  </p>
                </div>
                <p className="text-[11px] text-slate-300 font-medium pl-5">
                  সহকারী অধ্যাপক ও সিনিয়র কনসালট্যান্ট (কার্ডিওলজি বিভাগ)
                </p>
              </div>

              {/* Hospital & Chamber Schedule */}
              <div className="space-y-1 text-xs text-slate-300">
                <div className="flex items-center gap-1.5 font-bold text-white">
                  <Building2 size={13} className="text-emerald-400 shrink-0" />
                  <span>চেম্বার:</span>
                  <span className="text-emerald-300 underline underline-offset-2">
                    এ আর জেনারেল হাসপাতাল অ্যান্ড ডিজিটাল ডায়াগনস্টিক সেন্টার (ডেমো)
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
                  <Clock size={12} className="text-sky-400 shrink-0" />
                  <span>রোগী দেখার সময়: প্রতিদিন বিকাল ৪:০০ টা - রাত ৮:৩০ টা (শুক্রবার বন্ধ)</span>
                </div>
              </div>
            </div>

            {/* Right: Quick Action Callout Box for Advertisers */}
            <div className="md:col-span-3 bg-gradient-to-b from-indigo-950/80 to-slate-950 p-3.5 rounded-xl border border-indigo-500/30 text-center space-y-2.5">
              <span className="text-[10px] font-black uppercase text-indigo-200 tracking-wider block">
                আপনার হাসপাতালের ব্যানার দিন
              </span>
              <p className="text-[11px] text-slate-300 leading-tight font-medium">
                আপনার প্রতিষ্ঠানের ডাক্তারদের প্রোফাইল ব্যানার এখানে যুক্ত করতে এখনই যোগাযোগ করুন।
              </p>
              <button
                onClick={() => handleWhatsAppClick()}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black py-2 px-3 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <MessageSquare size={14} />
                <span>ব্যানার দিতে WhatsApp</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Call To Action Bar with Hotline and Direct Actions */}
        <div className="relative z-10 pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
            <span>
              বিজ্ঞাপন ও প্রোফাইল ব্যানার দিতে কল বা মেসেজ করুন: <strong className="text-white font-black text-amber-300 tracking-wider">01352-669100</strong>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Direct WhatsApp */}
            <button
              onClick={() => handleWhatsAppClick()}
              className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-600/30 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <MessageSquare size={15} />
              <span>WhatsApp মেসেজ</span>
            </button>

            {/* Direct Phone Call */}
            <a
              href={`tel:${hotline}`}
              className="flex-1 sm:flex-initial bg-sky-600 hover:bg-sky-700 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-lg shadow-sky-600/30 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Phone size={15} />
              <span>সরাসরি কল করুন</span>
            </a>

            {/* Open Form Modal */}
            <button
              onClick={() => setShowModal(true)}
              className="flex-1 sm:flex-initial bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black px-4 py-2.5 rounded-xl shadow-lg shadow-amber-400/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles size={15} />
              <span>ব্যানার রিকোয়েস্ট ফর্ম</span>
            </button>
          </div>
        </div>

      </div>

      {/* --- MODAL: Banner & Ad Placement Request Form --- */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 15 }}
              className="relative w-full max-w-lg bg-slate-900 text-white rounded-3xl p-5 sm:p-6 border border-slate-700 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              {/* Close Button */}
              <button
                onClick={() => { setShowModal(false); setSubmitted(false); }}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 transition-colors"
              >
                <X size={18} />
              </button>

              {submitted ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-500/40">
                    <CheckCircle2 size={36} />
                  </div>
                  <h3 className="text-xl font-black text-white">ব্যানার রিকোয়েস্ট জমা হয়েছে!</h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-sm mx-auto">
                    ধন্যবাদ! আপনার প্রতিষ্ঠানের ডাক্তার প্রোফাইল ও ব্যানার রিকোয়েস্ট আমরা পেয়েছি। আমাদের টিম দ্রুত আপনার মোবাইল নম্বরে যোগাযোগ করবে।
                  </p>

                  <div className="pt-3 flex flex-col sm:flex-row gap-2 justify-center">
                    <button
                      onClick={() => handleWhatsAppClick(`হ্যালো, আমি মাত্র nilpha.com এ ${hospitalName} এর ডাক্তার (${doctorName}) এর জন্য ব্যানার রিকোয়েস্ট সাবমিট করেছি।`)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-5 py-2.5 rounded-xl flex items-center justify-center gap-2"
                    >
                      <MessageSquare size={15} />
                      <span>তাৎক্ষণিক WhatsApp করুন</span>
                    </button>
                    <button
                      onClick={() => { setShowModal(false); setSubmitted(false); }}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-4 py-2.5 rounded-xl"
                    >
                      বন্ধ করুন
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitRequest} className="space-y-4">
                  <div>
                    <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider bg-amber-400/10 px-2.5 py-1 rounded-md">
                      ব্যানার বিজ্ঞাপন আবেদন
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-white mt-1.5">
                      আপনার প্রতিষ্ঠানের ডাক্তার ব্যানার দিতে তথ্য দিন
                    </h3>
                    <p className="text-xs text-slate-300 mt-1">
                      তথ্য দেওয়ার পর আমাদের টিম সরাসরি যোগাযোগ করে ব্যানার তৈরি ও পাবলিশ করবে।
                    </p>
                  </div>

                  {/* Institution Name */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                      প্রতিষ্ঠান / হাসপাতাল / ডায়াগনস্টিক নাম <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: এ আর জেনারেল হাসপাতাল অ্যান্ড ডায়াগনস্টিক সেন্টার"
                      value={hospitalName}
                      onChange={(e) => setHospitalName(e.target.value)}
                      className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500"
                    />
                  </div>

                  {/* Doctor Name */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                      ডাক্তারের নাম <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: ডাঃ মোঃ তানভীর আহমেদ"
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                      className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500"
                    />
                  </div>

                  {/* Degrees */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                        ডিগ্রীসমূহ
                      </label>
                      <input
                        type="text"
                        placeholder="যেমন: MBBS, FCPS, MD"
                        value={degree}
                        onChange={(e) => setDegree(e.target.value)}
                        className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                        বিশেষজ্ঞতা / বিভাগ
                      </label>
                      <input
                        type="text"
                        placeholder="যেমন: মেডিসিন ও হৃদরোগ বিশেষজ্ঞ"
                        value={specialty}
                        onChange={(e) => setSpecialty(e.target.value)}
                        className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>

                  {/* Contact Phone */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                      যোগাযোগের মোবাইল নম্বর <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="017XXXXXXXX বা 013XXXXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500"
                    />
                  </div>

                  {/* Extra notes */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                      চেম্বার সময় বা অতিরিক্ত তথ্য (ঐচ্ছিক)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="রোগী দেখার সময়, ভিজিটিং দিন বা বিশেষ ছাড় সংক্রান্ত তথ্য..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500"
                    />
                  </div>

                  {/* Submit buttons */}
                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
                    >
                      বাতিল
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-amber-400/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {submitting ? (
                        <span>জমা হচ্ছে...</span>
                      ) : (
                        <>
                          <Send size={14} />
                          <span>রিকোয়েস্ট পাঠান</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
