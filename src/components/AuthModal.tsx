import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, User, Phone, LogIn, UserPlus, ShieldAlert, Chrome, Eye, EyeOff, Check, MapPin, Search } from 'lucide-react';
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
  const [isRuralDoctor, setIsRuralDoctor] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  
  const [selectedRegDistrict, setSelectedRegDistrict] = React.useState('Nilphamari');
  const [selectedRegUpazila, setSelectedRegUpazila] = React.useState('');
  const [selectedRegUnion, setSelectedRegUnion] = React.useState('');

  if (!isOpen) return null;

  const handleTabChange = (mode: 'login' | 'register' | 'moderator') => {
    if (isProcessing) return;
    if (onClearError) onClearError();
    setAuthMode(mode);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Modal content cardboard container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative bg-white w-full max-w-md rounded-[36px] overflow-hidden border border-slate-100 shadow-2xl z-10 flex flex-col p-6 sm:p-8"
        >
          {/* Close button icon */}
          <button
            onClick={onClose}
            className="absolute right-6 top-6 w-9 h-9 flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer transition-all active:scale-90"
          >
            <X size={16} />
          </button>

          {/* Title Area */}
          <div className="mb-6 space-y-1 pr-8">
            <h3 className="text-lg font-black text-slate-800 tracking-tight uppercase">
              {authMode === 'login' ? 'অ্যাকাউন্টে প্রবেশ করুন' : authMode === 'register' ? 'নতুন অ্যাকাউন্ট খুলুন' : 'মডারেটর লগইন'}
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              {authMode === 'login' ? 'আপনার পূর্বে তৈরি অ্যাকাউন্ট দিয়ে লগইন করুন' : authMode === 'register' ? 'সহজেই নতুন প্রোফাইল তৈরি করুন' : 'মডপারেটর ও অ্যাডমিন পোর্টাল অ্যাক্সেস'}
            </p>
          </div>

          {/* Mode Tabs */}
          <div className="grid grid-cols-2 bg-slate-50 p-1.5 rounded-2xl mb-4">
            <button
              onClick={() => handleTabChange('login')}
              disabled={isProcessing}
              className={`py-3 text-[10px] uppercase font-black tracking-widest rounded-xl transition-all cursor-pointer ${
                authMode === 'login'
                  ? 'bg-white text-blue-600 shadow-sm border border-slate-100'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              লগইন করুন
            </button>
            <button
              onClick={() => handleTabChange('register')}
              disabled={isProcessing}
              className={`py-3 text-[10px] uppercase font-black tracking-widest rounded-xl transition-all cursor-pointer ${
                authMode === 'register'
                  ? 'bg-white text-blue-600 shadow-sm border border-slate-100'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              রেজিস্ট্রেশন
            </button>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 mb-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-start gap-2.5 text-left"
            >
              <ShieldAlert size={16} className="text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="leading-snug">{errorMessage}</p>
                {errorMessage.includes('পাসওয়ার্ড') && (
                  <p className="text-[10px] text-rose-500 font-semibold">
                    পাসওয়ার্ডটি ঠিকভাবে লিখতে ডানপাশের চোখের চিহ্নে (👁️) ক্লিক করে দেখে নিন।
                  </p>
                )}
                {errorMessage.includes('অ্যাকাউন্ট') && authMode === 'login' && (
                  <button
                    type="button"
                    onClick={() => handleTabChange('register')}
                    className="text-[11px] text-blue-600 underline font-black block mt-1"
                  >
                    👉 এখানে ক্লিক করে নতুন অ্যাকাউন্ট খুলুন
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={onSubmit} onChange={() => { if (errorMessage && onClearError) onClearError(); }} className="space-y-4">
            {authMode === 'register' && (
              <>
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-2xl mb-4 text-left">
                  <input 
                    type="checkbox" 
                    id="isRuralDoctor" 
                    name="isRuralDoctor"
                    checked={isRuralDoctor}
                    onChange={(e) => setIsRuralDoctor(e.target.checked)}
                    className="accent-blue-600 rounded cursor-pointer"
                  />
                  <label htmlFor="isRuralDoctor" className="text-[10px] font-black text-blue-700 cursor-pointer select-none uppercase tracking-wider">
                    আমি একজন পল্লী চিকিৎসক (প্রতিনিধি পিন প্রয়োজন)
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">পূর্ণ নাম</label>
                  <div className="relative">
                    <input
                      name="fullName"
                      type="text"
                      required
                      placeholder={isRuralDoctor ? "যেমন: ডাঃ আব্দুর রহমান (ডাক্তার হিসেবে নাম)" : "যেমন: মোঃ সাব্বির হোসাইন"}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 pl-11 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-850 h-[48px]"
                    />
                    <User size={14} className="text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">মোবাইল নাম্বার</label>
                  <div className="relative">
                    <input
                      name="phone"
                      type="tel"
                      required
                      placeholder="যেমন: ০১xxxxxxxxx"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 pl-11 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-850 h-[48px]"
                    />
                    <Phone size={14} className="text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* জেলা সিলেকশন */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">জেলা (District)</label>
                  <select
                    name="district"
                    value={selectedRegDistrict}
                    onChange={(e) => {
                      setSelectedRegDistrict(e.target.value);
                      setSelectedRegUpazila('');
                      setSelectedRegUnion('');
                    }}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-850 h-[48px]"
                  >
                    <option value="Nilphamari">নীলফামারী (Nilphamari)</option>
                    <option value="Panchagarh">পঞ্চগড় (Panchagarh)</option>
                    <option value="Dhaka">ঢাকা (Dhaka)</option>
                    <option value="Chattogram">চট্টগ্রাম (Chattogram)</option>
                    <option value="Sylhet">সিলেট (Sylhet)</option>
                    <option value="Rajshahi">রাজশাহী (Rajshahi)</option>
                    <option value="Khulna">খুলনা (Khulna)</option>
                    <option value="Barishal">বরিশাল (Barishal)</option>
                    <option value="Rangpur">রংপুর (Rangpur)</option>
                    <option value="Mymensingh">ময়মনসিংহ (Mymensingh)</option>
                  </select>
                </div>

                {/* উপজেলা সিলেকশন */}
                {(() => {
                  const upazilas = ALL_DISTRICTS_DATA[selectedRegDistrict]?.upazilas || [];
                  const selectedUpaObj = upazilas.find(u => u.id === selectedRegUpazila || u.name === selectedRegUpazila);
                  const selectedUpazilaName = selectedUpaObj?.name || selectedRegUpazila;

                  return (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">উপজেলা (Upazila)</label>
                        {selectedUpazilaName && (
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Check size={10} /> {selectedUpazilaName}
                          </span>
                        )}
                      </div>

                      <select
                        value={selectedRegUpazila}
                        onChange={(e) => {
                          setSelectedRegUpazila(e.target.value);
                          setSelectedRegUnion('');
                        }}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-850 h-[48px]"
                      >
                        <option value="">উপজেলা নির্বাচন করুন (অথবা নিচের বাটনে ক্লিক করুন)</option>
                        {upazilas.map(u => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </select>

                      {/* Clickable Upazila Pill Badges for direct single-tap auto-selection */}
                      {upazilas.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {upazilas.map(u => {
                            const isSelected = selectedRegUpazila === u.id || selectedRegUpazila === u.name;
                            return (
                              <button
                                key={u.id}
                                type="button"
                                onClick={() => {
                                  setSelectedRegUpazila(u.id);
                                  setSelectedRegUnion('');
                                }}
                                className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
                                  isSelected
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-102'
                                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                                }`}
                              >
                                {isSelected && <Check size={12} />}
                                {u.name}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      <input type="hidden" name="upazila" value={selectedUpazilaName} />
                    </div>
                  );
                })()}

                {/* ইউনিয়ন সিলেকশন */}
                {(() => {
                  const upazilas = ALL_DISTRICTS_DATA[selectedRegDistrict]?.upazilas || [];
                  const selectedUpaObj = upazilas.find(u => u.id === selectedRegUpazila || u.name === selectedRegUpazila);
                  const unions = selectedUpaObj?.unions || [];

                  return (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">ইউনিয়ন (Union)</label>
                        {selectedRegUnion && (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Check size={10} /> {selectedRegUnion}
                          </span>
                        )}
                      </div>

                      <select
                        value={selectedRegUnion}
                        onChange={(e) => setSelectedRegUnion(e.target.value)}
                        disabled={!selectedRegUpazila}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-850 h-[48px] disabled:opacity-50"
                      >
                        <option value="">
                          {selectedRegUpazila ? 'ইউনিয়ন নির্বাচন করুন (অথবা নিচের বাটনে ক্লিক করুন)' : 'প্রথমে উপজেলা নির্বাচন করুন'}
                        </option>
                        {unions.map(un => (
                          <option key={un.id} value={un.name}>{un.name}</option>
                        ))}
                      </select>

                      {/* Clickable Union Badges for direct single-tap auto-selection */}
                      {unions.length > 0 ? (
                        <div className="max-h-36 overflow-y-auto flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-100 rounded-2xl">
                          {unions.map(un => {
                            const isSelected = selectedRegUnion === un.name;
                            return (
                              <button
                                key={un.id}
                                type="button"
                                onClick={() => setSelectedRegUnion(un.name)}
                                className={`text-[10.5px] font-bold px-2.5 py-1.5 rounded-xl border transition-all text-left flex items-center gap-1 cursor-pointer active:scale-95 ${
                                  isSelected
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {isSelected && <Check size={12} />}
                                {un.name}
                              </button>
                            );
                          })}
                        </div>
                      ) : selectedRegUpazila ? (
                        <input
                          type="text"
                          value={selectedRegUnion}
                          onChange={(e) => setSelectedRegUnion(e.target.value)}
                          placeholder="ইউনিয়ানের নাম লিখুন (যেমন: ১ নং ওয়ার্ড বা কামারপুকুর)"
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-850 h-[44px]"
                        />
                      ) : null}

                      <input type="hidden" name="union" value={selectedRegUnion} />
                    </div>
                  );
                })()}

                {/* গ্রাম / মহল্লা / পাড়া */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">গ্রাম / পাড়া / মহল্লা (Village/Area)</label>
                  <input
                    name="village"
                    type="text"
                    required
                    placeholder="যেমন: সোনারায় ডাঙ্গাপাড়া বা চৌধুরী পাড়া"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-850 h-[48px]"
                  />
                </div>

                {isRuralDoctor ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1">চিকিৎসক কোড</label>
                      <input
                        name="ruralDoctorCode"
                        type="text"
                        required
                        placeholder="যেমন: RD001"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-850 h-[48px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1">প্রতিনিধি পিন</label>
                      <input
                        name="representativePin"
                        type="password"
                        required
                        placeholder="••••"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-850 h-[48px]"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">রেফার কোড (ঐচ্ছিক)</label>
                    <input
                      name="referredByCode"
                      type="text"
                      defaultValue={localStorage.getItem('prefilled_referral_code') || ""}
                      placeholder="যেমন: RD001 বা REF123"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-850 h-[48px]"
                    />
                  </div>
                )}
              </>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
                {authMode === 'moderator' 
                  ? 'মডারেটর ইউজারনেম' 
                  : authMode === 'register' 
                  ? 'ইউজারনেম বা ইমেইল (ঐচ্ছিক)' 
                  : 'ইউজারনেম, মোবাইল নম্বর বা ইমেইল'}
              </label>
              <div className="relative">
                <input
                  name="email"
                  type="text"
                  required={authMode !== 'register'}
                  placeholder={
                    authMode === 'moderator' 
                      ? 'ইউজারনেম দিন...' 
                      : authMode === 'register' 
                      ? 'যেমন: sabir বা email@example.com (ফাঁকা রাখলেও সমস্যা নেই)' 
                      : 'মোবাইল নম্বর, ইউজারনেম বা ইমেইল দিন'
                  }
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 pl-11 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-850 h-[48px]"
                />
                {authMode === 'moderator' ? (
                  <ShieldAlert size={14} className="text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                ) : (
                  <Mail size={14} className="text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">পাসওয়ার্ড</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 pl-11 pr-12 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-850 h-[48px]"
                />
                <Lock size={14} className="text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-all cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {authMode === 'login' && (
                <p className="text-[10px] text-slate-400 font-medium ml-1 text-left">
                  💡 পাসওয়ার্ড মনে না থাকলে ডিফল্ট পাসওয়ার্ড <span className="text-blue-600 font-mono font-bold">123456</span> চেষ্টা করতে পারেন।
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-blue-500/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-6 cursor-pointer"
            >
              {isProcessing ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
              ) : (
                <>
                  {authMode === 'login' ? <LogIn size={14} /> : authMode === 'register' ? <UserPlus size={14} /> : <ShieldAlert size={14} />}
                  {authMode === 'login' ? 'লগইন করুন' : authMode === 'register' ? 'অ্যাকাউন্ট তৈরি করুন' : 'মডারেটর প্রবেশ'}
                </>
              )}
            </button>
          </form>

          {/* Social Sign-in divider except for moderator */}
          {authMode !== 'moderator' && (
            <>
              <div className="relative my-6 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100" />
                </div>
                <span className="relative bg-white px-3 text-[9px] font-black uppercase text-slate-300 tracking-wider">অথবা অন্য উপায়ে</span>
              </div>

              <button
                type="button"
                onClick={onGoogleLogin}
                disabled={isProcessing}
                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-600 py-3.5 px-4 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 border border-slate-100 shadow-sm cursor-pointer"
              >
                <Chrome size={14} className="text-red-500 stroke-[2.5]" />
                গুগল দিয়ে লগইন
              </button>
            </>
          )}

          {/* Secret Moderator Trigger */}
          {authMode !== 'moderator' && (
            <div className="mt-6 text-center">
              <button
                onClick={() => setAuthMode('moderator')}
                className="text-[9px] font-black uppercase text-slate-300 hover:text-blue-500 tracking-wider hover:underline bg-transparent border-none cursor-pointer"
              >
                🔒 মডারেটর লগইন পোর্টাল
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
