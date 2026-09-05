import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, User, Phone, LogIn, UserPlus, ShieldAlert, Chrome, Eye, EyeOff, Check, MapPin, Search, Sparkles, Building2 } from 'lucide-react';
import { ALL_DISTRICTS_DATA } from '../data/addressData';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  authMode: 'login' | 'register' | 'moderator';
  setAuthMode: (mode: 'login' | 'register' | 'moderator') => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onGoogleLogin: () => void;
  isProcessing: boolean;
  errorMessage?: string;
  onClearError?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  authMode,
  setAuthMode,
  onSubmit,
  onGoogleLogin,
  isProcessing,
  errorMessage,
  onClearError
}) => {
  const [showPassword, setShowPassword] = useState(false);
  
  const [selectedRegDistrict, setSelectedRegDistrict] = useState('Nilphamari');
  const [selectedRegUpazila, setSelectedRegUpazila] = useState('');
  const [selectedRegUnion, setSelectedRegUnion] = useState('');
  const [unionSearchTerm, setUnionSearchTerm] = useState('');

  if (!isOpen) return null;

  const handleTabChange = (mode: 'login' | 'register' | 'moderator') => {
    if (isProcessing) return;
    if (onClearError) onClearError();
    setAuthMode(mode);
  };

  const currentDistrictData = ALL_DISTRICTS_DATA[selectedRegDistrict];
  const upazilas = currentDistrictData?.upazilas || [];
  const selectedUpaObj = upazilas.find(u => u.id === selectedRegUpazila || u.name === selectedRegUpazila);
  const selectedUpazilaName = selectedUpaObj?.name || selectedRegUpazila;
  const unions = selectedUpaObj?.unions || [];

  const filteredUnions = unions.filter(u => 
    !unionSearchTerm || u.name.toLowerCase().includes(unionSearchTerm.toLowerCase().trim())
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
        {/* Backdrop overlay */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/65 backdrop-blur-sm"
        />

        {/* Modal content container with full mobile responsiveness and inner scroll */}
        <motion.div
          initial={{ opacity: 0, y: 35, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 35, scale: 0.98 }}
          transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          className="relative bg-white w-full sm:max-w-lg rounded-t-[28px] sm:rounded-[32px] border border-slate-100 shadow-2xl z-10 flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden"
        >
          {/* Mobile swipe/grab indicator bar */}
          <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

          {/* Sticky Header: Tabs & Close button */}
          <div className="px-5 sm:px-8 pt-2 sm:pt-6 pb-3 border-b border-slate-100 bg-white shrink-0">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                  {authMode === 'login' ? (
                    <><span>🔑</span> অ্যাকাউন্টে প্রবেশ করুন</>
                  ) : authMode === 'register' ? (
                    <><span>✨</span> নতুন অ্যাকাউন্ট তৈরি করুন</>
                  ) : (
                    <><span>🛡️</span> মডারেটর ও অ্যাডমিন লগইন</>
                  )}
                </h3>
                <p className="text-[11px] text-slate-400 font-bold">
                  {authMode === 'login' 
                    ? 'আপনার মোবাইল নম্বর বা ইমেইল দিয়ে লগইন করুন' 
                    : authMode === 'register' 
                    ? 'মোবাইলে সহজে ফর্মটি পূরণ করে অ্যাকাউন্ট তৈরি করুন' 
                    : 'প্রশাসনিক নিরাপত্তা পোর্টাল'}
                </p>
              </div>

              {/* Close button icon with comfortable touch target */}
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full cursor-pointer transition-all active:scale-90 shrink-0"
                title="বন্ধ করুন"
              >
                <X size={18} />
              </button>
            </div>

            {/* Mode Tabs */}
            <div className="grid grid-cols-2 bg-slate-100/80 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => handleTabChange('login')}
                disabled={isProcessing}
                className={`py-2.5 text-xs font-black tracking-wide rounded-xl transition-all cursor-pointer ${
                  authMode === 'login'
                    ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                লগইন করুন
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('register')}
                disabled={isProcessing}
                className={`py-2.5 text-xs font-black tracking-wide rounded-xl transition-all cursor-pointer ${
                  authMode === 'register'
                    ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                নতুন রেজিস্ট্রেশন
              </button>
            </div>
          </div>

          {/* Scrollable Modal Body: Smooth scroll on both mobile and desktop */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-8 py-4 space-y-4">
            {/* Error Banner */}
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-start gap-2.5 text-left"
              >
                <ShieldAlert size={16} className="text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className="leading-snug">{errorMessage}</p>
                  {errorMessage.includes('পাসওয়ার্ড') && (
                    <p className="text-[10px] text-rose-500 font-semibold">
                      পাসওয়ার্ডটি দেখতে ডানপাশের চোখের আইকনে (👁️) চাপ দিন।
                    </p>
                  )}
                  {errorMessage.includes('অ্যাকাউন্ট') && authMode === 'login' && (
                    <button
                      type="button"
                      onClick={() => handleTabChange('register')}
                      className="text-[11px] text-blue-600 underline font-black block mt-1"
                    >
                      👉 এখানে চাপ দিয়ে নতুন অ্যাকাউন্ট খুলুন
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* Form Container */}
            <form 
              onSubmit={onSubmit} 
              onChange={() => { if (errorMessage && onClearError) onClearError(); }} 
              className="space-y-4"
            >
              {authMode === 'register' && (
                <>
                  {/* সেকশন ১: ব্যক্তিগত তথ্য */}
                  <div className="space-y-3 p-3.5 bg-slate-50 border border-slate-150/70 rounded-2xl">
                    <div className="flex items-center gap-1.5 text-slate-700 font-black text-xs">
                      <User size={14} className="text-blue-600" />
                      <span>১. ব্যক্তিগত তথ্য</span>
                    </div>

                    {/* পূর্ণ নাম */}
                    <div className="space-y-1 text-left">
                      <label className="text-[11px] font-black text-slate-500 ml-1">পূর্ণ নাম <span className="text-rose-500">*</span></label>
                      <div className="relative">
                        <input
                          name="fullName"
                          type="text"
                          required
                          placeholder="যেমন: মোঃ সাব্বির হোসাইন"
                          className="w-full bg-white border border-slate-200 rounded-xl p-3.5 pl-10 text-[15px] sm:text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 h-[48px]"
                        />
                        <User size={16} className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>

                    {/* মোবাইল নম্বর */}
                    <div className="space-y-1 text-left">
                      <label className="text-[11px] font-black text-slate-500 ml-1">মোবাইল নম্বর <span className="text-rose-500">*</span></label>
                      <div className="relative">
                        <input
                          name="phone"
                          type="tel"
                          required
                          placeholder="যেমন: 017xxxxxxxx"
                          className="w-full bg-white border border-slate-200 rounded-xl p-3.5 pl-10 text-[15px] sm:text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 h-[48px]"
                        />
                        <Phone size={16} className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      </div>
                      <p className="text-[10px] text-slate-400 font-semibold ml-1">১১ ডিজিটের সচল মোবাইল নম্বর দিন (লগইনে প্রয়োজন হবে)</p>
                    </div>
                  </div>

                  {/* সেকশন ২: স্থায়ী/বর্তমান ঠিকানা */}
                  <div className="space-y-3 p-3.5 bg-slate-50 border border-slate-150/70 rounded-2xl">
                    <div className="flex items-center gap-1.5 text-slate-700 font-black text-xs">
                      <MapPin size={14} className="text-emerald-600" />
                      <span>২. স্থায়ী / বর্তমান ঠিকানা</span>
                    </div>

                    {/* জেলা সিলেকশন */}
                    <div className="space-y-1 text-left">
                      <label className="text-[11px] font-black text-slate-500 ml-1">জেলা (District)</label>
                      <select
                        name="district"
                        value={selectedRegDistrict}
                        onChange={(e) => {
                          setSelectedRegDistrict(e.target.value);
                          setSelectedRegUpazila('');
                          setSelectedRegUnion('');
                          setUnionSearchTerm('');
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-[15px] sm:text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 h-[48px] cursor-pointer"
                      >
                        <option value="Nilphamari">নীলফামারী (Nilphamari)</option>
                        <option value="Panchagarh">পঞ্চগড় (Panchagarh)</option>
                        <option value="Rangpur">রংপুর (Rangpur)</option>
                        <option value="Dhaka">ঢাকা (Dhaka)</option>
                        <option value="Chattogram">চট্টগ্রাম (Chattogram)</option>
                        <option value="Sylhet">সিলেট (Sylhet)</option>
                        <option value="Rajshahi">রাজশাহী (Rajshahi)</option>
                        <option value="Khulna">খুলনা (Khulna)</option>
                        <option value="Barishal">বরিশাল (Barishal)</option>
                        <option value="Mymensingh">ময়মনসিংহ (Mymensingh)</option>
                      </select>
                    </div>

                    {/* উপজেলা সিলেকশন */}
                    <div className="space-y-1 text-left">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-black text-slate-500 ml-1">উপজেলা (Upazila)</label>
                        {selectedUpazilaName && (
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-100/70 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Check size={10} /> {selectedUpazilaName}
                          </span>
                        )}
                      </div>

                      {/* Dropdown for native mobile OS picker */}
                      <select
                        value={selectedRegUpazila}
                        onChange={(e) => {
                          setSelectedRegUpazila(e.target.value);
                          setSelectedRegUnion('');
                          setUnionSearchTerm('');
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-[15px] sm:text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 h-[48px] cursor-pointer"
                      >
                        <option value="">উপজেলা নির্বাচন করুন</option>
                        {upazilas.map(u => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </select>

                      {/* Horizontal quick-tap scrollable pills on mobile */}
                      {upazilas.length > 0 && (
                        <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1 pt-1.5">
                          {upazilas.map(u => {
                            const isSelected = selectedRegUpazila === u.id || selectedRegUpazila === u.name;
                            return (
                              <button
                                key={u.id}
                                type="button"
                                onClick={() => {
                                  setSelectedRegUpazila(u.id);
                                  setSelectedRegUnion('');
                                  setUnionSearchTerm('');
                                }}
                                className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border whitespace-nowrap transition-all flex items-center gap-1 shrink-0 cursor-pointer active:scale-95 ${
                                  isSelected
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {isSelected && <Check size={12} />}
                                {u.name.replace(' উপজেলা', '')}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      <input type="hidden" name="upazila" value={selectedUpazilaName} />
                    </div>

                    {/* ইউনিয়ন সিলেকশন */}
                    <div className="space-y-1 text-left">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-black text-slate-500 ml-1">ইউনিয়ন (Union / Ward)</label>
                        {selectedRegUnion && (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100/70 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Check size={10} /> {selectedRegUnion}
                          </span>
                        )}
                      </div>

                      {/* Dropdown for union */}
                      <select
                        value={selectedRegUnion}
                        onChange={(e) => setSelectedRegUnion(e.target.value)}
                        disabled={!selectedRegUpazila}
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-[15px] sm:text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 h-[48px] cursor-pointer disabled:opacity-50"
                      >
                        <option value="">
                          {selectedRegUpazila ? 'ড্রপডাউন থেকে ইউনিয়ন বাছুন' : 'আগে উপজেলা নির্বাচন করুন'}
                        </option>
                        {unions.map(un => (
                          <option key={un.id} value={un.name}>{un.name}</option>
                        ))}
                      </select>

                      {/* Union quick-filter search and compact pills */}
                      {unions.length > 0 && selectedRegUpazila && (
                        <div className="space-y-1.5 pt-1">
                          <div className="relative">
                            <input
                              type="text"
                              value={unionSearchTerm}
                              onChange={(e) => setUnionSearchTerm(e.target.value)}
                              placeholder="ইউনিয়ন দ্রুত খুঁজুন..."
                              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 pl-8 text-xs font-medium outline-none focus:border-blue-400 text-slate-800"
                            />
                            <Search size={13} className="text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          </div>

                          <div className="max-h-28 overflow-y-auto overscroll-contain flex flex-wrap gap-1 p-1.5 bg-white border border-slate-200/80 rounded-xl no-scrollbar">
                            {filteredUnions.map(un => {
                              const isSelected = selectedRegUnion === un.name;
                              return (
                                <button
                                  key={un.id}
                                  type="button"
                                  onClick={() => setSelectedRegUnion(un.name)}
                                  className={`text-[10.5px] font-bold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
                                    isSelected
                                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                  }`}
                                >
                                  {isSelected && <Check size={11} />}
                                  {un.name.replace(' ইউনিয়ন', '')}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Fallback manual union input if needed */}
                      {selectedRegUpazila && unions.length === 0 && (
                        <input
                          type="text"
                          value={selectedRegUnion}
                          onChange={(e) => setSelectedRegUnion(e.target.value)}
                          placeholder="ইউনিয়ন বা ওয়ার্ডের নাম লিখুন"
                          className="w-full bg-white border border-slate-200 rounded-xl p-3 text-[15px] sm:text-xs font-bold outline-none text-slate-800 h-[48px]"
                        />
                      )}

                      <input type="hidden" name="union" value={selectedRegUnion} />
                    </div>

                    {/* গ্রাম / পাড়া / মহল্লা */}
                    <div className="space-y-1 text-left">
                      <label className="text-[11px] font-black text-slate-500 ml-1">গ্রাম / পাড়া / মহল্লা (Village/Area)</label>
                      <input
                        name="village"
                        type="text"
                        required
                        placeholder="যেমন: সোনারায় ডাঙ্গাপাড়া বা চৌধুরী পাড়া"
                        className="w-full bg-white border border-slate-200 rounded-xl p-3.5 text-[15px] sm:text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 h-[48px]"
                      />
                    </div>
                  </div>

                  {/* রেফার কোড (ঐচ্ছিক) */}
                  <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-2xl text-left space-y-1.5">
                    <label className="text-[11px] font-black text-blue-900 flex items-center justify-between">
                      <span>রেফার কোড (ঐচ্ছিক)</span>
                      <span className="text-[9px] text-blue-600 font-bold bg-blue-100/60 px-2 py-0.5 rounded-full">বোনাস পয়েন্ট ও ছাড়</span>
                    </label>
                    <input
                      name="referredByCode"
                      type="text"
                      defaultValue={localStorage.getItem('prefilled_referral_code') || ""}
                      placeholder="যেমন: RD001 বা REF123 (থাকলে দিন)"
                      className="w-full bg-white border border-blue-200 rounded-xl p-3 text-[15px] sm:text-xs font-bold outline-none focus:border-blue-500 text-slate-800 h-[44px] uppercase"
                    />
                    <p className="text-[10px] text-slate-500 font-medium">
                      কারও রেফারেল কোড থাকলে এখানে দিন (না থাকলে ফাঁকা রাখুন)।
                    </p>
                  </div>
                </>
              )}

              {/* সেকশন ৩: অ্যাকাউন্ট ও পাসওয়ার্ড */}
              <div className="space-y-3 p-3.5 bg-slate-50 border border-slate-150/70 rounded-2xl">
                <div className="flex items-center gap-1.5 text-slate-700 font-black text-xs">
                  <Lock size={14} className="text-blue-600" />
                  <span>{authMode === 'register' ? '৩. লগইন নিরাপত্তা' : 'অ্যাকাউন্ট ও পাসওয়ার্ড'}</span>
                </div>

                {/* ইউজারনেম বা ইমেইল */}
                <div className="space-y-1 text-left">
                  <label className="text-[11px] font-black text-slate-500 ml-1">
                    {authMode === 'moderator' 
                      ? 'মডারেটর / সুপার এডমিন ইউজারনেম' 
                      : authMode === 'register' 
                      ? 'ইউজারনেম বা ইমেইল (ঐচ্ছিক)' 
                      : 'মোবাইল নম্বর, ইউজারনেম বা ইমেইল'}
                  </label>
                  <div className="relative">
                    <input
                      name="email"
                      type="text"
                      required={authMode !== 'register'}
                      placeholder={
                        authMode === 'moderator' 
                          ? 'যেমন: moderator' 
                          : authMode === 'register' 
                          ? 'ফাঁকা রাখলেও মোবাইল নম্বর দিয়ে লগইন করতে পারবেন' 
                          : 'মোবাইল নম্বর, ইউজারনেম বা ইমেইল দিন'
                      }
                      className="w-full bg-white border border-slate-200 rounded-xl p-3.5 pl-10 text-[15px] sm:text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 h-[48px]"
                    />
                    {authMode === 'moderator' ? (
                      <ShieldAlert size={16} className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    ) : (
                      <Mail size={16} className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    )}
                  </div>
                </div>

                {/* পাসওয়ার্ড */}
                <div className="space-y-1 text-left">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black text-slate-500 ml-1">পাসওয়ার্ড <span className="text-rose-500">*</span></label>
                    <span className="text-[10px] text-slate-400 font-semibold">কমপক্ষে ৬ অক্ষর</span>
                  </div>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="পাসওয়ার্ড লিখুন (যেমন: 123456)"
                      className="w-full bg-white border border-slate-200 rounded-xl p-3.5 pl-10 pr-12 text-[15px] sm:text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 h-[48px]"
                    />
                    <Lock size={16} className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 focus:outline-none transition-all cursor-pointer"
                      title={showPassword ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখুন"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {authMode === 'login' && (
                    <p className="text-[11px] text-slate-400 font-medium ml-1 text-left">
                      💡 পাসওয়ার্ড মনে না থাকলে ডিফল্ট পাসওয়ার্ড <span className="text-blue-600 font-mono font-bold">123456</span> দিয়ে চেষ্টা করুন।
                    </p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white h-[50px] rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {isProcessing ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                ) : (
                  <>
                    {authMode === 'login' ? <LogIn size={16} /> : authMode === 'register' ? <UserPlus size={16} /> : <ShieldAlert size={16} />}
                    <span>{authMode === 'login' ? 'অ্যাকাউন্টে লগইন করুন' : authMode === 'register' ? 'অ্যাকাউন্ট তৈরি সম্পন্ন করুন' : 'মডারেটর পোর্টালে প্রবেশ'}</span>
                  </>
                )}
              </button>
            </form>

            {/* Social Sign-in & Switch Helper */}
            {authMode !== 'moderator' && (
              <div className="space-y-3 pt-2">
                <div className="relative my-2 text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200/80" />
                  </div>
                  <span className="relative bg-white px-3 text-[10px] font-black uppercase text-slate-400 tracking-wider">অথবা</span>
                </div>

                <button
                  type="button"
                  onClick={onGoogleLogin}
                  disabled={isProcessing}
                  className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 h-[46px] rounded-2xl font-bold text-xs uppercase tracking-wide active:scale-[0.98] transition-all flex items-center justify-center gap-2 border border-slate-200 cursor-pointer"
                >
                  <Chrome size={16} className="text-red-500 stroke-[2.5]" />
                  গুগল দিয়ে সরাসরি প্রবেশ করুন
                </button>

                <div className="text-center pt-1">
                  {authMode === 'register' ? (
                    <p className="text-xs font-bold text-slate-500">
                      ইতিমধ্যে অ্যাকাউন্ট আছে?{' '}
                      <button
                        type="button"
                        onClick={() => handleTabChange('login')}
                        className="text-blue-600 font-black hover:underline cursor-pointer ml-1"
                      >
                        লগইন করুন
                      </button>
                    </p>
                  ) : (
                    <p className="text-xs font-bold text-slate-500">
                      নতুন অ্যাকাউন্ট প্রয়োজন?{' '}
                      <button
                        type="button"
                        onClick={() => handleTabChange('register')}
                        className="text-blue-600 font-black hover:underline cursor-pointer ml-1"
                      >
                        রেজিস্ট্রেশন করুন
                      </button>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Secret Moderator Trigger */}
            {authMode !== 'moderator' && (
              <div className="pt-2 pb-2 text-center">
                <button
                  type="button"
                  onClick={() => setAuthMode('moderator')}
                  className="text-[10px] font-bold text-slate-400 hover:text-blue-600 tracking-wider hover:underline bg-transparent border-none cursor-pointer"
                >
                  🔒 মডারেটর / এডমিন লগইন
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

