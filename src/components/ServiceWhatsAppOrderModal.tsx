import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  MessageSquare,
  Send,
  AlertTriangle,
  Phone,
  User,
  Calendar,
  MapPin,
  Camera,
  ImagePlus,
  Trash2,
  Loader2,
  CheckCircle2,
  Share2,
  UploadCloud
} from 'lucide-react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, ensureFirebaseAuthSession } from '../../services/firebase';

export type ServiceType = 'medicine' | 'labtests' | 'accessories' | 'emergency';

interface UploadedOrderImage {
  id: string;
  previewUrl: string;
  downloadUrl?: string;
  uploading: boolean;
  error?: string;
  file: File;
}

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
    imageUrls?: string[];
  }) => string;
}> = {
  medicine: {
    label: 'ঔষধ অর্ডার',
    icon: '💊',
    itemFieldLabel: 'ঔষধের নাম সমূহ (বা বিবরণ)',
    itemFieldPlaceholder: 'যেমন: Napa 500mg, Seclo 20mg, Montene 10mg (বা প্রেসক্রিপশনের বিবরণ)',
    helperText: 'নিচে প্রেসক্রিপশন বা ঔষধের ছবি আপলোড করলে ছবিসহ মেসেজ সরাসরি হোয়াটসঅ্যাপে চলে যাবে।',
    colorScheme: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      badge: 'bg-emerald-600 text-white'
    },
    generateMessage: ({ patientName, age, address, phone, itemName, imageUrls = [] }) => {
      const itemText = itemName.trim() ? itemName.trim() : 'ঔষধের নাম';
      const photoSection =
        imageUrls.length > 0
          ? `\n\n📸 আপলোডকৃত ছবি / প্রেসক্রিপশন (${imageUrls.length}টি):\n${imageUrls
              .map((u, i) => `• ছবি ${i + 1}: ${u}`)
              .join('\n')}`
          : '';
      return `হ্যালো, Nilpha.com আমি প্রেসক্রিপশন বা  ঔষধের (${itemText}) ছবি পাঠিয়ে দিলাম। আমি ওষুধ অর্ডার করতে চাই।

📋 রোগীর তথ্য:
• রোগীর নাম: ${patientName.trim()}
• বয়স: ${age.trim() || 'উল্লেখ নেই'}
• ঠিকানা: ${address.trim()}
• মোবাইল (WhatsApp): ${phone.trim()}
• ঔষধের নাম: ${itemText}${photoSection}`;
    }
  },
  labtests: {
    label: 'পরীক্ষা-নিরীক্ষা',
    icon: '🧪',
    itemFieldLabel: 'পরীক্ষা-নিরীক্ষার নাম সমূহ',
    itemFieldPlaceholder: 'যেমন: CBC, Lipid Profile, Blood Sugar, USG, X-Ray ইত্যাদি',
    helperText: 'ডাক্তারের টেস্ট প্রেসক্রিপশনের ছবি এখানে আপলোড করলে ছবিসহ মেসেজ সরাসরি হোয়াটসঅ্যাপে যাবে।',
    colorScheme: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      border: 'border-indigo-200',
      badge: 'bg-indigo-600 text-white'
    },
    generateMessage: ({ patientName, age, address, phone, itemName, imageUrls = [] }) => {
      const itemText = itemName.trim() ? itemName.trim() : 'পরীক্ষার নাম';
      const photoSection =
        imageUrls.length > 0
          ? `\n\n📸 আপলোডকৃত ছবি / প্রেসক্রিপশন (${imageUrls.length}টি):\n${imageUrls
              .map((u, i) => `• ছবি ${i + 1}: ${u}`)
              .join('\n')}`
          : '';
      return `হ্যালো, Nilpha.com আমি প্যাথলজিক্যাল বা অন্যান্য পরীক্ষায় নিরীক্ষা( ${itemText}) করার ছবি পাঠিয়ে দিলাম। আমি পরীক্ষা অর্ডার করাতে চাই।

📋 রোগীর তথ্য:
• রোগীর নাম: ${patientName.trim()}
• বয়স: ${age.trim() || 'উল্লেখ নেই'}
• ঠিকানা: ${address.trim()}
• মোবাইল (WhatsApp): ${phone.trim()}
• পরীক্ষার নাম: ${itemText}${photoSection}`;
    }
  },
  accessories: {
    label: 'মেডিকেল এক্সেসরিজ',
    icon: '🩺',
    itemFieldLabel: 'মেডিকেল এক্সেসরিজ বা পণ্যের নাম',
    itemFieldPlaceholder: 'যেমন: ডিজিটাল বিপি মেশিন, গ্লুকোমিটার, নেবুলাইজার, হুইলচেয়ার ইত্যাদি',
    helperText: 'প্রয়োজনীয় পণ্যের ছবি বা স্লিপ থাকলে নিচে আপলোড করে সরাসরি হোয়াটসঅ্যাপে পাঠান।',
    colorScheme: {
      bg: 'bg-sky-50',
      text: 'text-sky-700',
      border: 'border-sky-200',
      badge: 'bg-sky-600 text-white'
    },
    generateMessage: ({ patientName, age, address, phone, itemName, imageUrls = [] }) => {
      const itemText = itemName.trim() ? itemName.trim() : 'মেডিকেল এক্সেসরিজ এর নাম';
      const photoSection =
        imageUrls.length > 0
          ? `\n\n📸 আপলোডকৃত ছবি (${imageUrls.length}টি):\n${imageUrls
              .map((u, i) => `• ছবি ${i + 1}: ${u}`)
              .join('\n')}`
          : '';
      return `হ্যালো, Nilpha.com আমি মেডিকেল এক্সেসরিজ (${itemText}) অর্ডার করাতে চাই।

📋 গ্রাহক/রোগীর তথ্য:
• নাম: ${patientName.trim()}
• বয়স: ${age.trim() || 'প্রযোজ্য নয়'}
• ঠিকানা: ${address.trim()}
• মোবাইল (WhatsApp): ${phone.trim()}
• এক্সেসরিজ / পণ্যের নাম: ${itemText}${photoSection}`;
    }
  },
  emergency: {
    label: 'জরুরি সেবা',
    icon: '🆘',
    itemFieldLabel: 'জরুরি সেবার নাম',
    itemFieldPlaceholder: 'যেমন: এসি অ্যাম্বুলেন্স, অক্সিজেন সিলিন্ডার সাপোর্ট, হোম নার্সিং কেয়ার ইত্যাদি',
    helperText: 'প্রয়োজনে রোগীর কাগজপত্র বা প্রেসক্রিপশনের ছবি আপলোড করে দ্রুত হোয়াটসঅ্যাপে পাঠান।',
    colorScheme: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      badge: 'bg-rose-600 text-white'
    },
    generateMessage: ({ patientName, age, address, phone, itemName, imageUrls = [] }) => {
      const itemText = itemName.trim() ? itemName.trim() : 'জরুরি সেবার নাম';
      const photoSection =
        imageUrls.length > 0
          ? `\n\n📸 আপলোডকৃত ছবি / ডকুমেন্ট (${imageUrls.length}টি):\n${imageUrls
              .map((u, i) => `• ছবি ${i + 1}: ${u}`)
              .join('\n')}`
          : '';
      return `হ্যালো, Nilpha.com (${itemText}) অর্ডার করাতে চাই।

📋 রোগীর তথ্য:
• রোগীর নাম: ${patientName.trim()}
• বয়স: ${age.trim() || 'উল্লেখ নেই'}
• ঠিকানা: ${address.trim()}
• মোবাইল (WhatsApp): ${phone.trim()}
• জরুরি সেবা: ${itemText}${photoSection}`;
    }
  }
};

// Compress image on client before uploading so mobile uploads finish in ~1s
async function compressWhatsAppImage(file: File): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX_DIM = 1280;
      let width = img.width;
      let height = img.height;

      if (width > MAX_DIM || height > MAX_DIM) {
        if (width > height) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        } else {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          resolve(blob || file);
        },
        'image/jpeg',
        0.78
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}

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
  const [uploadedImages, setUploadedImages] = useState<UploadedOrderImage[]>([]);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const sessionFolderRef = useRef<string>(
    `wa_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  );
  const prevOpenRef = useRef<boolean>(false);

  // Sync state whenever modal opens or props change
  useEffect(() => {
    if (isOpen && !prevOpenRef.current) {
      // Fresh session folder when modal opens anew
      sessionFolderRef.current = `wa_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      ensureFirebaseAuthSession().catch(() => null);
    }
    prevOpenRef.current = isOpen;

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
    } else {
      // Cleanup object URLs when modal closes
      setUploadedImages((prev) => {
        prev.forEach((img) => {
          try {
            URL.revokeObjectURL(img.previewUrl);
          } catch {}
        });
        return [];
      });
    }
  }, [isOpen, initialServiceType, initialItemName, userProfile]);

  if (!isOpen) return null;

  const isUploadingImages = uploadedImages.some((img) => img.uploading);
  const readyImages = uploadedImages.filter((img) => !img.uploading && img.downloadUrl);
  const readyUrls = readyImages.map((img) => img.downloadUrl as string);

  const canNativeShareFiles =
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function' &&
    readyImages.length > 0 &&
    (() => {
      try {
        return navigator.canShare({ files: readyImages.map((r) => r.file) });
      } catch {
        return false;
      }
    })();

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const filesArray: File[] = Array.from<File>(fileList).filter((f) => f.type.startsWith('image/'));
    e.target.value = '';

    if (filesArray.length === 0) {
      setErrorMsg('শুধুমাত্র ছবির ফাইল (JPG, PNG, WEBP) সিলেক্ট করুন।');
      return;
    }

    const remainingSlots = Math.max(0, 5 - uploadedImages.length);
    if (remainingSlots === 0) {
      setErrorMsg('সর্বোচ্চ ৫টি ছবি একসাথে সংযুক্ত করা যাবে।');
      return;
    }

    const selected = filesArray.slice(0, remainingSlots);
    setErrorMsg('');

    const newItems: UploadedOrderImage[] = selected.map((file, idx) => ({
      id: `${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
      previewUrl: URL.createObjectURL(file),
      uploading: true,
      file
    }));

    setUploadedImages((prev) => [...prev, ...newItems]);

    let authUser: any = null;
    try {
      authUser = await ensureFirebaseAuthSession();
    } catch {}

    await Promise.all(
      newItems.map(async (item, idx) => {
        try {
          const compressedBlob = await compressWhatsAppImage(item.file);
          const fileName = `${Date.now()}_${idx}.jpg`;
          const primaryPath = `whatsapp_orders/${sessionFolderRef.current}/${fileName}`;
          const metadata = { contentType: 'image/jpeg' };

          let downloadUrl = '';
          try {
            const ref1 = storageRef(storage, primaryPath);
            const snap1 = await uploadBytes(ref1, compressedBlob, metadata);
            downloadUrl = await getDownloadURL(snap1.ref);
          } catch (primaryErr: any) {
            // Fallback to medical_records path if Storage rules for whatsapp_orders haven't been deployed yet
            const uid = authUser?.uid || 'public_guest';
            const fallbackPath = `medical_records/${uid}/wa_${sessionFolderRef.current}/${fileName}`;
            const ref2 = storageRef(storage, fallbackPath);
            const snap2 = await uploadBytes(ref2, compressedBlob, metadata);
            downloadUrl = await getDownloadURL(snap2.ref);
          }

          setUploadedImages((prev) =>
            prev.map((img) =>
              img.id === item.id ? { ...img, uploading: false, downloadUrl, error: undefined } : img
            )
          );
        } catch (err) {
          console.warn('WhatsApp order image upload failed:', err);
          setUploadedImages((prev) =>
            prev.map((img) =>
              img.id === item.id
                ? { ...img, uploading: false, error: 'আপলোড ব্যর্থ' }
                : img
            )
          );
        }
      })
    );
  };

  const handleRemoveImage = (id: string) => {
    setUploadedImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) {
        try {
          URL.revokeObjectURL(target.previewUrl);
        } catch {}
      }
      return prev.filter((img) => img.id !== id);
    });
  };

  const config = SERVICE_CONFIGS[serviceType];
  const generatedMessage = config.generateMessage({
    patientName: patientName || '...',
    age: age || '...',
    address: address || '...',
    phone: phone || '...',
    itemName: itemName || '...',
    imageUrls: readyUrls
  });

  const validateFields = (): boolean => {
    if (!patientName.trim()) {
      setErrorMsg('দয়া করে রোগীর/গ্রাহকের নাম লিখুন');
      return false;
    }
    if (!phone.trim()) {
      setErrorMsg('দয়া করে মোবাইল/WhatsApp নাম্বার দিন');
      return false;
    }
    if (!address.trim()) {
      setErrorMsg('দয়া করে সম্পূর্ণ ঠিকানা লিখুন');
      return false;
    }
    if (!itemName.trim() && readyUrls.length === 0) {
      setErrorMsg(`দয়া করে ${config.itemFieldLabel} উল্লেখ করুন অথবা প্রেসক্রিপশন/ছবি আপলোড করুন`);
      return false;
    }
    if (isUploadingImages) {
      setErrorMsg('ছবি আপলোড হচ্ছে, অনুগ্রহ করে কয়েক সেকেন্ড অপেক্ষা করুন...');
      return false;
    }
    return true;
  };

  const logInquiryToFirestore = () => {
    try {
      if (db) {
        ensureFirebaseAuthSession()
          .catch(() => null)
          .then(() =>
            addDoc(collection(db, 'service_inquiries'), {
              service_type: serviceType,
              patient_name: patientName.trim(),
              age: age.trim() || null,
              address: address.trim(),
              phone: phone.trim(),
              item_name: itemName.trim() || (readyUrls.length > 0 ? 'প্রেসক্রিপশন / ছবিসহ অর্ডার' : ''),
              attachment_urls: readyUrls,
              status: 'pending',
              channel: 'whatsapp',
              created_at: serverTimestamp()
            })
          )
          .catch((err) => {
            console.warn('Saving service inquiry error (proceeding to WhatsApp):', err);
          });
      }
    } catch (err) {
      console.warn('Logging inquiry error:', err);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!validateFields()) return;

    setIsSubmitting(true);
    logInquiryToFirestore();

    const finalMsg = config.generateMessage({
      patientName,
      age,
      address,
      phone,
      itemName: itemName.trim() || (readyUrls.length > 0 ? 'সংযুক্ত ছবির বিবরণ অনুযায়ী' : ''),
      imageUrls: readyUrls
    });

    const cleanWhatsappNum = whatsappNumber.replace(/[^0-9]/g, '');
    const whatsappUrl = `https://wa.me/${cleanWhatsappNum}?text=${encodeURIComponent(finalMsg)}`;

    // Open WhatsApp synchronously to avoid mobile popup blockers
    window.open(whatsappUrl, '_blank');
    setIsSubmitting(false);
    onClose();
  };

  const handleNativeShareWithFiles = async () => {
    setErrorMsg('');
    if (!validateFields()) return;
    logInquiryToFirestore();

    const finalMsg = config.generateMessage({
      patientName,
      age,
      address,
      phone,
      itemName: itemName.trim() || 'সংযুক্ত ছবির বিবরণ অনুযায়ী',
      imageUrls: readyUrls
    });

    try {
      await navigator.share({
        title: `Nilpha.com - ${config.label}`,
        text: finalMsg,
        files: readyImages.map((r) => r.file)
      });
      onClose();
    } catch (err) {
      // User cancelled share or browser blocked files share; fallback to regular WhatsApp link
      const cleanWhatsappNum = whatsappNumber.replace(/[^0-9]/g, '');
      window.open(`https://wa.me/${cleanWhatsappNum}?text=${encodeURIComponent(finalMsg)}`, '_blank');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[450] flex items-start sm:items-center justify-center p-2 pt-3 pb-4 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 text-left flex flex-col max-h-[86dvh] sm:max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-slate-900 text-white px-3.5 py-2.5 sm:p-4 relative shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-base sm:text-lg shrink-0">
                💬
              </div>
              <div className="min-w-0">
                <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-100 text-[9px] font-black uppercase tracking-wider border border-emerald-400/30">
                  হোয়াটসঅ্যাপ অর্ডার ফর্ম
                </div>
                <h2 className="text-xs sm:text-sm font-black text-white truncate">
                  Nilpha.com হোয়াটসঅ্যাপে সেবা অর্ডার
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                disabled={isSubmitting || isUploadingImages}
                onClick={() => {
                  const form = document.getElementById('service-whatsapp-form') as HTMLFormElement;
                  if (form) form.requestSubmit();
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-[11px] font-black transition-all active:scale-95 cursor-pointer border border-white/25 disabled:opacity-50"
                title="হোয়াটসঅ্যাপে পাঠান"
              >
                {isUploadingImages ? <Loader2 size={12} className="animate-spin" /> : <Send size={11} />}
                <span>{isUploadingImages ? 'আপলোড...' : 'পাঠান'}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="বন্ধ করুন"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Service Type Switcher (Compact) */}
        <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 shrink-0">
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
                  className={`py-1.5 px-2 rounded-xl text-[10px] sm:text-[11px] font-black flex items-center justify-center gap-1 transition-all cursor-pointer border ${
                    isSelected
                      ? `${c.colorScheme.badge} border-transparent shadow-sm`
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="text-xs sm:text-sm">{c.icon}</span>
                  <span className="truncate">{c.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Body (Scrollable, Compact Mobile View) */}
        <form id="service-whatsapp-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
          {errorMsg && (
            <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold flex items-center gap-1.5 animate-in fade-in">
              <AlertTriangle size={14} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Photo / Prescription Upload Section (Top Priority for Mobile) */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-2.5 space-y-2">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] font-black text-slate-800 flex items-center gap-1">
                <UploadCloud size={14} className="text-emerald-600 shrink-0" />
                <span>প্রেসক্রিপশন / ছবির সংযুক্তি (সরাসরি হোয়াটসঅ্যাপে যাবে)</span>
              </span>
              <span className="text-[9px] font-bold text-emerald-700 bg-white px-1.5 py-0.5 rounded-full border border-emerald-200 shrink-0">
                ঐচ্ছিক • সর্বোচ্চ ৫টি
              </span>
            </div>

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageSelect}
              className="hidden"
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
            />

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                disabled={uploadedImages.length >= 5}
                onClick={() => cameraInputRef.current?.click()}
                className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-black shadow-xs active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                <Camera size={13} />
                <span>📷 ছবি তুলুন</span>
              </button>
              <button
                type="button"
                disabled={uploadedImages.length >= 5}
                onClick={() => galleryInputRef.current?.click()}
                className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[11px] font-black shadow-xs active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                <ImagePlus size={13} />
                <span>🖼️ গ্যালারি থেকে নিন</span>
              </button>
            </div>

            {/* Uploaded Images Thumbnail Strip */}
            {uploadedImages.length > 0 && (
              <div className="space-y-1 pt-0.5">
                <div className="flex items-center justify-between text-[10px] font-bold px-0.5">
                  <span className="text-slate-700">
                    সংযুক্ত ছবি ({readyImages.length}/{uploadedImages.length})
                  </span>
                  {isUploadingImages ? (
                    <span className="text-amber-700 flex items-center gap-1">
                      <Loader2 size={10} className="animate-spin" /> আপলোড হচ্ছে...
                    </span>
                  ) : (
                    <span className="text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 size={11} /> তথ্য ও ছবি একসাথে হোয়াটসঅ্যাপে যাবে
                    </span>
                  )}
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5">
                  {uploadedImages.map((img) => (
                    <div
                      key={img.id}
                      className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 bg-white ${
                        img.error
                          ? 'border-rose-500'
                          : img.uploading
                          ? 'border-amber-400'
                          : 'border-emerald-500'
                      }`}
                    >
                      <img
                        src={img.previewUrl}
                        alt="attached"
                        className="w-full h-full object-cover"
                      />
                      {img.uploading && (
                        <div className="absolute inset-0 bg-slate-900/55 flex items-center justify-center">
                          <Loader2 size={16} className="text-white animate-spin" />
                        </div>
                      )}
                      {!img.uploading && img.downloadUrl && (
                        <div className="absolute bottom-0.5 left-0.5 bg-emerald-600 text-white rounded-full p-0.5 shadow">
                          <CheckCircle2 size={9} />
                        </div>
                      )}
                      {img.error && (
                        <div className="absolute inset-x-0 bottom-0 bg-rose-600/90 text-white text-[8px] font-bold text-center py-0.5">
                          ব্যর্থ
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(img.id)}
                        className="absolute top-0.5 right-0.5 bg-rose-600 text-white rounded-full p-0.5 shadow hover:bg-rose-700 transition-colors cursor-pointer"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 size={9} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Patient Name */}
          <div>
            <label className="block text-[11px] font-black text-slate-700 mb-0.5 flex items-center gap-1">
              <User size={12} className="text-emerald-600" />
              রোগীর / গ্রাহকের নাম <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="যেমন: মোঃ কামরুল ইসলাম"
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Age */}
            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-0.5 flex items-center gap-1">
                <Calendar size={12} className="text-emerald-600" />
                বয়স (Age)
              </label>
              <input
                type="text"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="যেমন: ২৮ বছর"
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-0.5 flex items-center gap-1">
                <Phone size={12} className="text-emerald-600" />
                মোবাইল (WhatsApp) <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="017xxxxxxxx"
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-[11px] font-black text-slate-700 mb-0.5 flex items-center gap-1">
              <MapPin size={12} className="text-emerald-600" />
              ঠিকানা (গ্রাম/মহল্লা, থানা ও জেলা) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="যেমন: শান্তিনগর, সদর হাসপাতাল সড়ক, নীলফামারী সদর"
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
            />
          </div>

          {/* Item details */}
          <div>
            <label className="block text-[11px] font-black text-slate-800 mb-0.5 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <span className="text-xs">{config.icon}</span>
                {config.itemFieldLabel} <span className="text-rose-500">*</span>
              </span>
              <span className="text-[9px] text-slate-400 font-normal">ছবি দিলে সংক্ষেপে লিখলেও হবে</span>
            </label>
            <textarea
              rows={2}
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder={config.itemFieldPlaceholder}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all resize-none"
            />
            <p className="text-[9px] text-slate-500 mt-0.5 flex items-center gap-1">
              <span>💡</span> {config.helperText}
            </p>
          </div>

          {/* Live Message Preview */}
          <div className="space-y-1 pt-0.5">
            <div className="flex items-center justify-between px-0.5">
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                <MessageSquare size={10} className="text-emerald-600" /> হোয়াটসঅ্যাপ বার্তার প্রিভিউ:
              </span>
              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                {readyUrls.length > 0 ? `তথ্য + ${readyUrls.length}টি ছবি প্রস্তুত` : 'অটোমেটিক বার্তা'}
              </span>
            </div>
            <div className="bg-emerald-950 text-emerald-100 p-2.5 rounded-xl text-[10px] font-mono leading-relaxed whitespace-pre-wrap border border-emerald-800/60 shadow-inner max-h-28 overflow-y-auto">
              {generatedMessage}
            </div>
          </div>

          <p className="text-center text-[9px] text-slate-400">
            🔒 আপনার দেওয়া তথ্য ও ছবি নিরাপদ থাকবে এবং সরাসরি আমাদের হোয়াটসঅ্যাপ সাপোর্ট টিমের কাছে পৌঁছাবে।
          </p>
        </form>

        {/* Sticky Action Footer - Always visible at z-[450] on desktop & mobile */}
        <div className="p-2.5 sm:p-3.5 bg-slate-50 border-t border-slate-200 flex items-center gap-1.5 sm:gap-2 shrink-0 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-black rounded-xl transition-all cursor-pointer shrink-0"
          >
            বাতিল
          </button>

          {canNativeShareFiles && (
            <button
              type="button"
              disabled={isSubmitting || isUploadingImages}
              onClick={handleNativeShareWithFiles}
              className="px-2.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-[10px] sm:text-[11px] flex items-center justify-center gap-1 shadow-sm transition-all cursor-pointer disabled:opacity-50 shrink-0"
              title="সরাসরি ছবির ফাইল ও তথ্য একসাথে শেয়ার করুন"
            >
              <Share2 size={13} />
              <span>ফাইলসহ শেয়ার</span>
            </button>
          )}

          <button
            type="submit"
            form="service-whatsapp-form"
            disabled={isSubmitting || isUploadingImages}
            className="flex-1 py-2 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] text-white rounded-xl font-black text-[11px] sm:text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-200 transition-all cursor-pointer disabled:opacity-50"
          >
            {isUploadingImages ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>ছবি আপলোড হচ্ছে...</span>
              </>
            ) : (
              <>
                <Send size={14} />
                <span>
                  {readyUrls.length > 0
                    ? `ছবি ও তথ্য হোয়াটসঅ্যাপে পাঠান (${readyUrls.length})`
                    : 'হোয়াটসঅ্যাপে অর্ডার পাঠান'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

