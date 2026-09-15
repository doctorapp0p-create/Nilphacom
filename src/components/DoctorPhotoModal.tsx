import React, { useState, useEffect, useRef } from 'react';
import { Doctor } from '../../types';
import { X, Upload, Camera, Check, RefreshCw, Link as LinkIcon, User, AlertCircle, Loader2, CloudUpload } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, ensureFirebaseAuthSession } from '../../services/firebase';

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
 * Converts a Base64 data URL string to a Blob object for Firebase Storage uploadBytes().
 */
export const dataURLToBlob = (dataUrl: string): Blob => {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

/**
 * Resizes and compresses an image in browser canvas.
 * Returns both dataUrl for instant UI preview and Blob for Firebase Storage uploadBytes().
 */
export const compressDoctorImageFile = (
  file: File,
  maxWidth = 500,
  maxHeight = 600,
  quality = 0.82
): Promise<{ dataUrl: string; blob: Blob }> => {
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
          const dataUrl = e.target?.result as string;
          resolve({ dataUrl, blob: dataURLToBlob(dataUrl) });
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            const dataUrl = canvas.toDataURL('image/jpeg', quality);
            if (blob) {
              resolve({ dataUrl, blob });
            } else {
              resolve({ dataUrl, blob: dataURLToBlob(dataUrl) });
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('ছবি লোড করা সম্ভব হয়নি'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('ফাইল রিড করা সম্ভব হয়নি'));
    reader.readAsDataURL(file);
  });
};

/**
 * Resizes and compresses an image in browser canvas.
 * Retained for backward compatibility with components expecting a data URL string promise.
 */
export const compressDoctorImage = async (
  file: File,
  maxWidth = 500,
  maxHeight = 600,
  quality = 0.82
): Promise<string> => {
  const result = await compressDoctorImageFile(file, maxWidth, maxHeight, quality);
  return result.dataUrl;
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
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadStatusText, setUploadStatusText] = useState<string>('');
  const [selectedBlob, setSelectedBlob] = useState<Blob | null>(null);
  const [isPendingUpload, setIsPendingUpload] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'presets'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (doctor && isOpen) {
      setPreviewUrl(doctor.image || '');
      setUrlInput(doctor.image && !doctor.image.startsWith('data:') ? doctor.image : '');
      setUploadError(null);
      setIsCompressing(false);
      setIsUploading(false);
      setUploadStatusText('');
      setSelectedBlob(null);
      setIsPendingUpload(false);
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
      const result = await compressDoctorImageFile(file, 500, 600, 0.82);
      setPreviewUrl(result.dataUrl);
      setSelectedBlob(result.blob);
      setIsPendingUpload(true);
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
    setSelectedBlob(null);
    setIsPendingUpload(false);
  };

  const handleSelectPreset = (url: string) => {
    setUploadError(null);
    setPreviewUrl(url);
    setUrlInput(url);
    setSelectedBlob(null);
    setIsPendingUpload(false);
  };

  const handleSave = async () => {
    if (!previewUrl) {
      setUploadError('অনুগ্রহ করে ডাক্তারের জন্য একটি ছবি নির্বাচন বা আপলোড করুন।');
      return;
    }
    try {
      setIsUploading(true);
      setUploadError(null);

      let finalPhotoUrl = previewUrl;

      // Upload to Firebase Storage when a local file was chosen or image is data URL
      if (isPendingUpload && (selectedBlob || previewUrl.startsWith('data:'))) {
        setUploadStatusText('ফায়ারবেস সেশন যাচাই করা হচ্ছে...');
        await ensureFirebaseAuthSession();

        const blobToUpload = selectedBlob || dataURLToBlob(previewUrl);

        // Required path: doctors/{doctorId}/profile.jpg
        const storagePath = `doctors/${doctor.id}/profile.jpg`;
        setUploadStatusText('Firebase Storage-এ ছবিটি আপলোড হচ্ছে...');
        const storageRef = ref(storage, storagePath);

        // Upload using uploadBytes()
        await uploadBytes(storageRef, blobToUpload, {
          contentType: 'image/jpeg',
          cacheControl: 'public, max-age=31536000'
        });

        // Retrieve permanent download URL via getDownloadURL()
        setUploadStatusText('ডাউনলোড লিংক তৈরি করা হচ্ছে...');
        finalPhotoUrl = await getDownloadURL(storageRef);
      }

      // Persist permanent download URL (or preset URL) to Firestore doctors collection
      setUploadStatusText('প্রোফাইলে নতুন ছবি সংরক্ষণ করা হচ্ছে...');
      await onSavePhoto(doctor.id, finalPhotoUrl);
      onClose();
    } catch (err: any) {
      console.error('Save doctor photo error:', err);
      setUploadError(err?.message || 'ছবি আপলোড বা সেভ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsUploading(false);
      setUploadStatusText('');
    }
  };

  if (!isOpen || !doctor) return null;

  const isChanged = previewUrl !== doctor.image;
  const isBusy = isProcessing || isCompressing || isUploading;

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
            disabled={isBusy}
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
              disabled={isBusy}
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 ${
                activeTab === 'upload'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload size={14} /> ডিভাইস থেকে আপলোড
            </button>
            <button
              type="button"
              disabled={isBusy}
              onClick={() => setActiveTab('url')}
              className={`flex-1 py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 ${
                activeTab === 'url'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LinkIcon size={14} /> ইমেজ URL লিংক
            </button>
            <button
              type="button"
              disabled={isBusy}
              onClick={() => setActiveTab('presets')}
              className={`flex-1 py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 ${
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
                disabled={isBusy}
                onChange={handleFileChange}
                className="hidden"
                id="doctor-photo-file-upload"
              />

              <label
                htmlFor="doctor-photo-file-upload"
                className={`border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/40 hover:bg-blue-50/80 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group ${
                  isBusy ? 'pointer-events-none opacity-60' : ''
                }`}
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
                <div className="flex flex-col sm:flex-row items-center gap-1.5">
                  <span className="text-[10px] font-black text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/60 flex items-center gap-1">
                    <CloudUpload size={12} className="text-blue-600" /> Firebase Storage ক্লাউড স্টোরেজ
                  </span>
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60 flex items-center gap-1">
                    <Check size={12} className="text-emerald-600" /> অটো-কম্প্রেসড
                  </span>
                </div>
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
                  disabled={isBusy}
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://images.unsplash.com/... বা ImgBB / ক্লাউড লিংক"
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:border-blue-600 focus:bg-white disabled:opacity-50"
                />
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={handleApplyUrl}
                  className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-2xl shadow-sm transition-all disabled:opacity-50"
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
                      disabled={isBusy}
                      onClick={() => handleSelectPreset(p.url)}
                      className={`p-2 rounded-2xl border text-left transition-all flex flex-col items-center gap-1.5 relative disabled:opacity-50 ${
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

          {/* Upload Progress Status Indicator */}
          {isUploading && (
            <div className="p-3.5 bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold rounded-2xl flex items-center gap-3 animate-in fade-in duration-200">
              <Loader2 size={20} className="animate-spin text-blue-600 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-black text-blue-800">{uploadStatusText || 'ছবি আপলোড হচ্ছে...'}</p>
                <p className="text-[10px] text-blue-600">Firebase Storage-এ doctors/{doctor.id}/profile.jpg পাথে স্থায়ীভাবে সংরক্ষিত হচ্ছে...</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {uploadError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl flex items-center gap-2 animate-in fade-in duration-200">
              <AlertCircle size={16} className="shrink-0" />
              <span className="flex-1">{uploadError}</span>
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
                  {isChanged ? (isPendingUpload ? 'Firebase Storage-এ আপলোড প্রস্তুত' : 'সংরক্ষণ করতে নিচের বাটনে চাপুন') : 'বর্তমান ছবি প্রদর্শন করা হচ্ছে'}
                </p>
              </div>
            </div>

            {isChanged && !isBusy && (
              <button
                type="button"
                onClick={() => {
                  setPreviewUrl(doctor.image || '');
                  setUrlInput(doctor.image && !doctor.image.startsWith('data:') ? doctor.image : '');
                  setSelectedBlob(null);
                  setIsPendingUpload(false);
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
            disabled={isBusy}
            className="px-5 py-2.5 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-black text-xs transition-all disabled:opacity-50"
          >
            বাতিল
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isBusy || !previewUrl}
            className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
          >
            {isBusy ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>{uploadStatusText ? 'আপলোড হচ্ছে...' : 'সেভ হচ্ছে...'}</span>
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

