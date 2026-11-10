import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Send, CheckCircle2, ShieldCheck, Camera, FileText, Pill, Microscope, Stethoscope, AlertTriangle, Phone, User, Calendar, MapPin } from 'lucide-react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

export type ServiceType = 'medicine' | 'labtests' | 'accessories' | 'emergency';

interface ServiceWhatsAppOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialServiceType?: ServiceType;
  initialItemName?: string;
  whatsappNumber?: string;
  userProfile?: {
    full_name?: string;
    phone?: string;
    district?: string;
    address?: string;
  } | null;
  db?: any;
}

const SERVICE_CONFIGS: Record<ServiceType, {
  label: string;
  icon: string;
  itemFieldLabel: string;
  itemFieldPlaceholder: string;
  helperText: string;
  colorScheme: {
    bg: string;
    text: string;
    border: string;
    badge: string;
  };
  generateMessage: (data: {
    patientName: string;
    age: string;
    address: string;
    phone: string;
    itemName: string;
  }) => string;
}> = {
  medicine: {
    label: 'ঔষধ অর্ডার',
    icon: '💊',
    itemFieldLabel: 'ঔষধের নাম সমূহ (বা বিবরণ)',
    itemFieldPlaceholder: 'যেমন: Napa 500mg, Seclo 20mg, Montene 10mg (বা প্রেসক্রিপশনের বিবরণ)',
    helperText: 'প্রেসক্রিপশন বা প্যাকেটের ছবি থাকলে হোয়াটসঅ্যাপে সরাসরি পাঠিয়ে দিতে পারেন।',
    colorScheme: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      badge: 'bg-emerald-600 text-white'
    },
    generateMessage: ({ patientName, age, address, phone, itemName }) => {
      const itemText = itemName.trim() ? itemName.trim() : 'ঔষধের নাম';
      return `হ্যালো, Nilpha.com আমি প্রেসক্রিপশন বা  ঔষধের (${itemText}) ছবি পাঠিয়ে দিলাম। আমি ওষুধ অর্ডার করতে চাই।

📋 রোগীর তথ্য:
• রোগীর নাম: ${patientName.trim()}
• বয়স: ${age.trim() || 'উল্লেখ নেই'}
• ঠিকানা: ${address.trim()}
• মোবাইল (WhatsApp): ${phone.trim()}
• ঔষধের নাম: ${itemText}`;
    }
  },
  labtests: {
    label: 'পরীক্ষা-নিরীক্ষা',
    icon: '🧪',
    itemFieldLabel: 'পরীক্ষা-নিরীক্ষার নাম সমূহ',
    itemFieldPlaceholder: 'যেমন: CBC, Lipid Profile, Blood Sugar, USG, X-Ray ইত্যাদি',
    helperText: 'ডাক্তারের টেস্ট প্রেসক্রিপশনের ছবি হোয়াটসঅ্যাপে পাঠিয়ে দিলে টেস্ট নিশ্চিত করা সহজ হবে।',
    colorScheme: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      border: 'border-indigo-200',
      badge: 'bg-indigo-600 text-white'
    },
    generateMessage: ({ patientName, age, address, phone, itemName }) => {
      const itemText = itemName.trim() ? itemName.trim() : 'পরীক্ষার নাম';
      return `হ্যালো, Nilpha.com আমি প্যাথলজিক্যাল বা অন্যান্য পরীক্ষায় নিরীক্ষা( ${itemText}) করার ছবি পাঠিয়ে দিলাম। আমি পরীক্ষা অর্ডার করাতে চাই।

📋 রোগীর তথ্য:
• রোগীর নাম: ${patientName.trim()}
• বয়স: ${age.trim() || 'উল্লেখ নেই'}
• ঠিকানা: ${address.trim()}
• মোবাইল (WhatsApp): ${phone.trim()}
• পরীক্ষার নাম: ${itemText}`;
    }
  },
  accessories: {
    label: 'মেডিকেল এক্সেসরিজ',
    icon: '🩺',
    itemFieldLabel: 'মেডিকেল এক্সেসরিজ বা পণ্যের নাম',
    itemFieldPlaceholder: 'যেমন: ডিজিটাল বিপি মেশিন, গ্লুকোমিটার, নেবুলাইজার, হুইলচেয়ার ইত্যাদি',
    helperText: 'হোম ডেলিভারির জন্য আমাদের প্রতিনিধি আপনার দেওয়া ঠিকানায় দ্রুত পৌঁছে দেবে।',
    colorScheme: {
      bg: 'bg-sky-50',
      text: 'text-sky-700',
      border: 'border-sky-200',
      badge: 'bg-sky-600 text-white'
    },
    generateMessage: ({ patientName, age, address, phone, itemName }) => {
      const itemText = itemName.trim() ? itemName.trim() : 'মেডিকেল এক্সেসরিজ এর নাম';
      return `হ্যালো, Nilpha.com আমি মেডিকেল এক্সেসরিজ (${itemText}) অর্ডার করাতে চাই।

📋 গ্রাহক/রোগীর তথ্য:
• নাম: ${patientName.trim()}
• বয়স: ${age.trim() || 'প্রযোজ্য নয়'}
• ঠিকানা: ${address.trim()}
• মোবাইল (WhatsApp): ${phone.trim()}
• এক্সেসরিজ / পণ্যের নাম: ${itemText}`;
    }
  },
  emergency: {
    label: 'জরুরি সেবা',
    icon: '🆘',
    itemFieldLabel: 'জরুরি সেবার নাম',
    itemFieldPlaceholder: 'যেমন: এসি অ্যাম্বুলেন্স, অক্সিজেন সিলিন্ডার সাপোর্ট, হোম নার্সিং কেয়ার ইত্যাদি',
    helperText: 'জরুরি অবস্থায় তাৎক্ষণিক সাড়া দিতে আমাদের হটলাইন টিম প্রস্তুত রয়েছে।',
    colorScheme: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      badge: 'bg-rose-600 text-white'
    },
    generateMessage: ({ patientName, age, address, phone, itemName }) => {
      const itemText = itemName.trim() ? itemName.trim() : 'জরুরি সেবার নাম';
      return `হ্যালো, Nilpha.com (${itemText}) অর্ডার করাতে চাই।

📋 রোগীর তথ্য:
• রোগীর নাম: ${patientName.trim()}
• বয়স: ${age.trim() || 'উল্লেখ নেই'}
• ঠিকানা: ${address.trim()}
• মোবাইল (WhatsApp): ${phone.trim()}
• জরুরি সেবা: ${itemText}`;
    }
  }
};

export const ServiceWhatsAppOrderModal: React.FC<ServiceWhatsAppOrderModalProps> = ({
  isOpen,
  onClose,
  initialServiceType = 'medicine',
  initialItemName = '',
  whatsappNumber = '8801352669100',
  userProfile = null,
  db = null
}) => {
  const [serviceType, setServiceType] = useState<ServiceType>(initialServiceType);
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [itemName, setItemName] = useState(initialItemName);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state whenever modal opens or props change
  useEffect(() => {
    if (isOpen) {
      setServiceType(initialServiceType);
      setItemName(initialItemName || '');
      setErrorMsg('');

      // Auto-populate from userProfile if available
      if (userProfile) {
        if (!patientName && userProfile.full_name) {
          setPatientName(userProfile.full_name);
        }
        if (!phone && userProfile.phone) {
          setPhone(userProfile.phone);
        }
        if (!address) {
          const addrParts = [userProfile.address, userProfile.district].filter(Boolean);
          if (addrParts.length > 0) {
            setAddress(addrParts.join(', '));
          }
        }
      }
    }
  }, [isOpen, initialServiceType, initialItemName, userProfile]);

  if (!isOpen) return null;

  const config = SERVICE_CONFIGS[serviceType];
  const generatedMessage = config.generateMessage({
    patientName: patientName || '...',
    age: age || '...',
    address: address || '...',
    phone: phone || '...',
    itemName: itemName || '...'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!patientName.trim()) {
      setErrorMsg('দয়া করে রোগীর/গ্রাহকের নাম লিখুন');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('দয়া করে মোবাইল/WhatsApp নাম্বার দিন');
      return;
    }
    if (!address.trim()) {
      setErrorMsg('দয়া করে সম্পূর্ণ ঠিকানা লিখুন');
      return;
    }
    if (!itemName.trim()) {
      setErrorMsg(`দয়া করে ${config.itemFieldLabel} উল্লেখ করুন`);
      return;
    }

    setIsSubmitting(true);

    try {
      // Record inquiry in Firestore for tracking if db is provided
      if (db) {
        addDoc(collection(db, 'service_inquiries'), {
          service_type: serviceType,
          patient_name: patientName.trim(),
          age: age.trim() || null,
          address: address.trim(),
          phone: phone.trim(),
          item_name: itemName.trim(),
          status: 'pending',
          channel: 'whatsapp',
          created_at: serverTimestamp()
        }).catch(err => {
          console.warn('Saving service inquiry error (proceeding to WhatsApp):', err);
        });
      }
    } catch (err) {
      console.warn('Logging inquiry error:', err);
    }

    // Generate final WhatsApp message
    const finalMsg = config.generateMessage({
      patientName,
      age,
      address,
      phone,
      itemName
    });

    const cleanWhatsappNum = whatsappNumber.replace(/[^0-9]/g, '');
    const whatsappUrl = `https://wa.me/${cleanWhatsappNum}?text=${encodeURIComponent(finalMsg)}`;

    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 text-left flex flex-col max-h-[92dvh] sm:max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-slate-900 text-white p-4 sm:p-5 relative shrink-0">
          <div className="absolute right-3.5 top-3.5 flex items-center gap-1.5">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                const form = document.getElementById('service-whatsapp-form') as HTMLFormElement;
                if (form) form.requestSubmit();
              }}
              className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer border border-white/20"
              title="হোয়াটসঅ্যাপে পাঠান"
            >
              <Send size={12} />
              <span>পাঠান</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              title="বন্ধ করুন"
            >
              <X size={18} />
            </button>
          </div>
          
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shrink-0">
              💬
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-100 text-[10px] font-black uppercase tracking-wider mb-0.5 border border-emerald-400/30">
                হোয়াটসঅ্যাপ সার্ভিস অর্ডার ফর্ম
              </div>
              <h2 className="text-base sm:text-lg font-black text-white">
                Nilpha.com হোয়াটসঅ্যাপে সেবা অর্ডার
              </h2>
            </div>
          </div>
          <p className="text-[11px] text-emerald-100/90 font-medium mt-2 leading-relaxed">
            ফর্মটি পূরণ করে বাটনে ক্লিক করলেই স্বয়ংক্রিয়ভাবে হোয়াটসঅ্যাপে আপনার নির্দিষ্ট বার্তাটি তৈরি হয়ে যাবে।
          </p>
        </div>

        {/* Service Type Switcher */}
        <div className="p-3 bg-slate-50 border-b border-slate-100">
          <div className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-2 px-1 flex items-center gap-1">
            <span>✨ সার্ভিস নির্বাচন করুন:</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {(Object.keys(SERVICE_CONFIGS) as ServiceType[]).map((type) => {
              const c = SERVICE_CONFIGS[type];
              const isSelected = serviceType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setServiceType(type);
                    setErrorMsg('');
                  }}
                  className={`py-2 px-2 rounded-xl text-[11px] font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                    isSelected
                      ? `${c.colorScheme.badge} border-transparent shadow-md scale-[1.02]`
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="text-sm">{c.icon}</span>
                  <span className="truncate">{c.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Body (Scrollable) */}
        <form id="service-whatsapp-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <AlertTriangle size={15} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Patient Name */}
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1 flex items-center gap-1.5">
              <User size={13} className="text-emerald-600" />
              রোগীর / গ্রাহকের নাম <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="যেমন: মোঃ কামরুল ইসলাম"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Age */}
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar size={13} className="text-emerald-600" />
                বয়স (Age)
              </label>
              <input
                type="text"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="যেমন: ২৮ বছর"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1 flex items-center gap-1.5">
                <Phone size={13} className="text-emerald-600" />
                মোবাইল / WhatsApp নাম্বার <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="যেমন: 017xxxxxxxx"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1 flex items-center gap-1.5">
              <MapPin size={13} className="text-emerald-600" />
              ঠিকানা (গ্রাম/মহল্লা, থানা ও জেলা) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="যেমন: শান্তিনগর, সদর হাসপাতাল সড়ক, নীলফামারী সদর"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
            />
          </div>

          {/* Item details */}
          <div>
            <label className="block text-xs font-black text-slate-800 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="text-sm">{config.icon}</span>
                {config.itemFieldLabel} <span className="text-rose-500">*</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">বিস্তারিত লিখুন</span>
            </label>
            <textarea
              required
              rows={2}
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder={config.itemFieldPlaceholder}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all resize-none"
            />
            <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
              <span>💡</span> {config.helperText}
            </p>
          </div>

          {/* Live Message Preview */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                <MessageSquare size={11} className="text-emerald-600" /> হোয়াটসঅ্যাপ বার্তার প্রিভিউ:
              </span>
              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                অটোমেটিক বার্তা তৈরি হবে
              </span>
            </div>
            <div className="bg-emerald-950 text-emerald-100 p-3 rounded-2xl text-[11px] font-mono leading-relaxed whitespace-pre-wrap border border-emerald-800/60 shadow-inner max-h-32 overflow-y-auto">
              {generatedMessage}
            </div>
          </div>

          <p className="text-center text-[10px] text-slate-400 pt-1">
            🔒 আপনার দেওয়া তথ্য নিরাপদ থাকবে এবং সরাসরি আমাদের কাস্টমার সাপোর্ট টিমের কাছে পৌঁছাবে।
          </p>
        </form>

        {/* Sticky Action Footer - Always visible on desktop & mobile viewports */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2 shrink-0 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-black rounded-xl transition-all cursor-pointer"
          >
            বাতিল
          </button>
          <button
            type="submit"
            form="service-whatsapp-form"
            disabled={isSubmitting}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-98 text-white rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 transition-all cursor-pointer disabled:opacity-50"
          >
            <Send size={15} />
            <span>হোয়াটসঅ্যাপে অর্ডার পাঠান</span>
          </button>
        </div>
      </div>
    </div>
  );
};
