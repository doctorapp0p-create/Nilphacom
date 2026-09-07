import React, { useState, useEffect, useRef } from 'react';
import { Doctor } from '../../types';
import { X, Upload, Camera, Check, RefreshCw, Link as LinkIcon, User, AlertCircle, Loader2 } from 'lucide-react';

interface DoctorPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: Doctor | null;
  onSavePhoto: (doctorId: string, newImageUrl: string) => Promise<void>;
  isProcessing: boolean;
}

// Preset professional doctor avatars
const DOCTOR_AVATAR_PRESETS = [
  {
    id: 'male-1',
    label: 'ডক্টর (পুরুষ ১)',
    url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'male-2',
    label: 'ডক্টর (পুরুষ ২)',
    url: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'male-3',
    label: 'ডক্টর (পুরুষ ৩)',
    url: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'female-1',
    label: 'ডক্টর (নারী ১)',
    url: 'https://images.unsplash.com/photo-1559839734-2b71f1536780?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'female-2',
    label: 'ডক্টর (নারী ২)',
    url: 'https://images.unsplash.com/photo-1594824813579-2423f03b68f5?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'stetho',
    label: 'মেডিকেল আইকন',
    url: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=400'
  }
];

/**
 * Resizes and compresses an image in browser canvas to prevent Firestore document 1MB limit issues.
 * Returns a lightweight data URL (typically 30KB - 70KB).
 */
export const compressDoctorImage = (
  file: File,
  maxWidth = 500,
  maxHeight = 600,
  quality = 0.82
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('ছবি লোড করা সম্ভব হয়নি'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('ফাইল রিড করা সম্ভব হয়নি'));
    reader.readAsDataURL(file);
  });
};

export const DoctorPhotoModal: React.FC<DoctorPhotoModalProps> = ({
  isOpen,
  onClose,
  doctor,
  onSavePhoto,
  isProcessing,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [urlInput, setUrlInput] = useState<string>('');
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'presets'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (doctor && isOpen) {
      setPreviewUrl(doctor.image || '');
      setUrlInput(doctor.image && !doctor.image.startsWith('data:') ? doctor.image : '');
      setUploadError(null);
      setIsCompressing(false);
    }
  }, [doctor, isOpen]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('অনুগ্রহ করে শুধুমাত্র ছবি ফাইল (JPG, PNG, WebP) নির্বাচন করুন।');
      return;
    }

    try {
      setIsCompressing(true);
      setUploadError(null);
      const compressedDataUrl = await compressDoctorImage(file, 500, 600, 0.82);
      setPreviewUrl(compressedDataUrl);
    } catch (err: any) {
      console.error('Image compression error:', err);
      setUploadError('ছবি প্রসেসিং করতে সমস্যা হয়েছে। অন্য ছবি চেষ্টা করুন।');
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleApplyUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setUploadError('একটি বৈধ ছবি লিংক (URL) লিখুন।');
      return;
    }
    setUploadError(null);
    setPreviewUrl(trimmed);
  };

  const handleSelectPreset = (url: string) => {
    setUploadError(null);
    setPreviewUrl(url);
    setUrlInput(url);
  };

  const handleSave = async () => {
    if (!previewUrl) {
      setUploadError('অনুগ্রহ করে ডাক্তারের জন্য একটি ছবি নির্বাচন বা আপলোড করুন।');
      return;
    }
    try {
      await onSavePhoto(doctor.id, previewUrl);
      onClose();
    } catch (err: any) {
      setUploadError(err?.message || 'ছবি সেভ করতে সমস্যা হয়েছে।');
    }
  };

  if (!isOpen || !doctor) return null;

  const isChanged = previewUrl !== doctor.image;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-left my-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-700 p-5 text-white flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
              <Camera size={20} />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">
                ডাক্তারের ছবি পরিবর্তন ও আপলোড
              </h3>
              <p className="text-[11px] text-blue-100 font-bold line-clamp-1">
                {doctor.name} ({doctor.specialty})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing || isCompressing}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Doctor Info Card */}
          <div className="flex items-center gap-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
            <div className="relative shrink-0">
              {(previewUrl || doctor.image) ? (
                <img
                  src={previewUrl || doctor.image}
                  alt={doctor.name}
                  referrerPolicy="no-referrer"
                  className="w-16 h-20 rounded-xl object-cover bg-white border-2 border-blue-500 shadow-sm"
                />
              ) : (
                <div className="w-16 h-20 rounded-xl bg-slate-100 border-2 border-blue-500 shadow-sm flex items-center justify-center text-slate-400">
                  <User size={24} />
                </div>
              )}
              {isChanged && (
                <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-xs flex items-center gap-0.5">
                  <Check size={10} /> নতুন
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-black text-sm text-slate-800 truncate">{doctor.name}</h4>
              <p className="text-[10px] text-slate-500 font-bold truncate">{doctor.degree || doctor.specialty}</p>
              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                <span className="text-[9px] font-bold bg-blue-100/80 text-blue-700 px-2 py-0.5 rounded-md">
                  {doctor.specialty}
                </span>
                <span className="text-[9px] font-mono text-slate-400">ID: {doctor.id}</span>
              </div>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'upload'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload size={14} /> ডিভাইস থেকে আপলোড
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`flex-1 py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'url'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LinkIcon size={14} /> ইমেজ URL লিংক
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('presets')}
              className={`flex-1 py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'presets'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User size={14} /> প্রিসেট ছবি
            </button>
          </div>

          {/* TAB 1: UPLOAD FROM DEVICE */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="doctor-photo-file-upload"
              />

              <label
                htmlFor="doctor-photo-file-upload"
                className="border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/40 hover:bg-blue-50/80 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-all">
                  {isCompressing ? (
                    <Loader2 size={24} className="animate-spin" />
                  ) : (
                    <Upload size={24} />
                  )}
                </div>
                <div className="text-center">
                  <p className="font-black text-xs text-slate-800">
                    {isCompressing
                      ? 'ছবি অপ্টিমাইজ করা হচ্ছে...'
                      : 'ছবি সিলেক্ট করতে এখানে চাপুন'}
                  </p>
                  <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                    JPG, PNG, WebP (মোবাইল ক্যামেরা বা গ্যালারি থেকে সরাসরি সাপোর্ট)
                  </p>
                </div>
                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
                  ✓ অটো-কম্প্রেসড (ফায়ারবেস ডাটাবেজের জন্য সুরক্ষিত)
                </span>
              </label>
            </div>
          )}

          {/* TAB 2: IMAGE URL */}
          {activeTab === 'url' && (
            <div className="space-y-3">
              <label className="block text-[11px] font-black uppercase text-slate-600">
                ওয়েবসাইট বা হোস্টিং থেকে ছবির সরাসরি লিংক (Image URL):
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://images.unsplash.com/... বা ImgBB / Drive লিংক"
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:border-blue-600 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-2xl shadow-sm transition-all"
                >
                  প্রিভিউ দেখুন
                </button>
              </div>
              <p className="text-[10px] text-slate-400 font-bold">
                যেকোনো পাবলিক ছবি বা ক্লাউড স্টোরেজের ডাইরেক্ট ইমেজ লিংক পেস্ট করে প্রিভিউ দেখুন।
              </p>
            </div>
          )}

          {/* TAB 3: PRESETS */}
          {activeTab === 'presets' && (
            <div className="space-y-2">
              <label className="block text-[11px] font-black uppercase text-slate-600">
                তালিকাবদ্ধ প্রফেশনাল ডক্টর প্রিসেট ছবি বেছে নিন:
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {DOCTOR_AVATAR_PRESETS.map((p) => {
                  const isSelected = previewUrl === p.url;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPreset(p.url)}
                      className={`p-2 rounded-2xl border text-left transition-all flex flex-col items-center gap-1.5 relative ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 shadow-sm'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <img
                        src={p.url}
                        alt={p.label}
                        referrerPolicy="no-referrer"
                        className="w-14 h-16 rounded-xl object-cover bg-slate-100"
                      />
                      <span className="text-[9px] font-black text-slate-700 text-center line-clamp-1">
                        {p.label}
                      </span>
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-4 h-4 bg-blue-600 text-white rounded-full flex items-center justify-center">
                          <Check size={10} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Error Message */}
          {uploadError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Live Full Preview Container */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="New Preview"
                  referrerPolicy="no-referrer"
                  className="w-14 h-16 rounded-xl object-cover bg-white border border-slate-200 shadow-xs"
                  onError={() => setUploadError('ছবি লোড করা যায়নি। সঠিক লিংক প্রদান করুন।')}
                />
              ) : (
                <div className="w-14 h-16 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-slate-300">
                  <User size={20} />
                </div>
              )}
              <div>
                <p className="text-[11px] font-black text-slate-700">নির্বাচিত ছবি প্রিভিউ</p>
                <p className="text-[10px] text-slate-400 font-bold">
                  {isChanged ? 'সংরক্ষণ করতে নিচের বাটনে চাপুন' : 'বর্তমান ছবি প্রদর্শন করা হচ্ছে'}
                </p>
              </div>
            </div>

            {isChanged && (
              <button
                type="button"
                onClick={() => {
                  setPreviewUrl(doctor.image || '');
                  setUrlInput(doctor.image && !doctor.image.startsWith('data:') ? doctor.image : '');
                  setUploadError(null);
                }}
                className="text-xs font-black text-rose-600 hover:text-rose-700 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100 flex items-center gap-1"
              >
                <RefreshCw size={12} /> রিসেট
              </button>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing || isCompressing}
            className="px-5 py-2.5 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-black text-xs transition-all disabled:opacity-50"
          >
            বাতিল
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isProcessing || isCompressing || !previewUrl}
            className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
          >
            {isProcessing ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>সেভ হচ্ছে...</span>
              </>
            ) : (
              <>
                <Check size={14} />
                <span>ছবি সেভ করুন (Save Photo)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
