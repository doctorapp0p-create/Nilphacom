import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileText,
  UploadCloud,
  Download,
  Eye,
  Trash2,
  Calendar,
  Lock,
  Unlock,
  Phone,
  User,
  Plus,
  Search,
  Filter,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Printer,
  Share2,
  RotateCw,
  ZoomIn,
  ZoomOut,
  X,
  ChevronRight,
  Image as ImageIcon,
  FilePlus,
  Clock,
  Stethoscope,
  Building2,
  ShieldCheck,
  Check,
  RefreshCw,
  LogOut,
  FolderOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, storage, ensureFirebaseAuthSession } from '../../services/firebase';
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { MedicalRecord, MedicalRecordType, MedicalRecordFile, Profile } from '../../types';

interface MedicalRecordsSectionProps {
  user: any;
  profile: Profile | null;
  onOpenAuth?: () => void;
}

// Bengali month names for date formatting
const BN_MONTHS = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

const BN_NUMERALS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

const toBnNumber = (n: number | string): string => {
  return String(n).replace(/[0-9]/g, d => BN_NUMERALS[Number(d)] || d);
};

const formatBnDate = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const monthName = BN_MONTHS[monthIdx] || parts[1];
      return `${toBnNumber(day)} ${monthName}, ${toBnNumber(year)}`;
    }
  } catch (e) {
    // fallback
  }
  return dateStr;
};

// Pending file for upload
export interface FormPendingFile {
  file: File;
  name: string;
  previewUrl: string;
  size: number;
  isPdf: boolean;
  type: string;
}

// Compress image before saving to keep payload lightweight and responsive
const compressImageFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        // Use JPEG with 0.8 quality
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

// Compress image directly to high-quality JPEG Blob for Firebase Storage
const compressImageToBlob = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 2400;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          if (width / height > MAX_WIDTH / MAX_HEIGHT) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          } else {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

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
            if (blob) {
              resolve(blob);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          0.85
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
};

// Convert Base64 data URL to Blob for safe cloud storage migration
const dataUrlToBlob = (dataUrl: string): Blob => {
  const parts = dataUrl.split(';base64,');
  const contentType = parts[0].split(':')[1] || 'image/jpeg';
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);
  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }
  return new Blob([uInt8Array], { type: contentType });
};

const RECORD_TYPES: { id: MedicalRecordType; label: string; icon: string; color: string }[] = [
  { id: 'prescription', label: 'প্রেসক্রিপশন', icon: '📝', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'lab_report', label: 'টেস্ট / ল্যাব রিপোর্ট', icon: '🧪', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'discharge_letter', label: 'ডিসচার্জ সার্টিফিকেট', icon: '🏥', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'investigation', label: 'এক্স-রে / আল্ট্রাসাউন্ড', icon: '🔬', color: 'bg-amber-50 text-amber-800 border-amber-200' },
  { id: 'other', label: 'অন্যান্য মেডিকেল ফাইল', icon: '📁', color: 'bg-slate-50 text-slate-700 border-slate-200' },
];

export const MedicalRecordsSection: React.FC<MedicalRecordsSectionProps> = ({
  user,
  profile,
  onOpenAuth
}) => {
  // Mobile unlock state
  const [unlockedPhone, setUnlockedPhone] = useState<string>(() => {
    return localStorage.getItem('nilpha_medical_records_phone') || '';
  });
  const [phoneInput, setPhoneInput] = useState<string>('');
  const [unlockError, setUnlockError] = useState<string>('');

  // Records state
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string>('');

  // Form inputs
  const [formDoctorName, setFormDoctorName] = useState<string>('');
  const [formDoctorSpecialty, setFormDoctorSpecialty] = useState<string>('');
  const [formHospitalName, setFormHospitalName] = useState<string>('');
  const [formVisitDate, setFormVisitDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [formRecordType, setFormRecordType] = useState<MedicalRecordType>('prescription');
  const [formPatientName, setFormPatientName] = useState<string>('');
  const [formDiagnosis, setFormDiagnosis] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formFiles, setFormFiles] = useState<FormPendingFile[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState<boolean>(false);
  const [uploadProgressText, setUploadProgressText] = useState<string>('');
  const [migratingRecordId, setMigratingRecordId] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');

  // Preview / View modal
  const [previewRecord, setPreviewRecord] = useState<MedicalRecord | null>(null);
  const [activeFileIndex, setActiveFileIndex] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);

  // Auto-fill phone if profile has phone
  useEffect(() => {
    if (!unlockedPhone && profile?.phone) {
      // Keep available for easy 1-click
      setPhoneInput(profile.phone);
    }
  }, [profile, unlockedPhone]);

  // Sync / Load records from Firestore when unlockedPhone changes
  useEffect(() => {
    if (!unlockedPhone) {
      setRecords([]);
      return;
    }

    setIsLoading(true);
    const cleanPhone = unlockedPhone.trim().replace(/\D/g, '');

    // 1. First load from local storage cache for instant rendering
    try {
      const localCache = localStorage.getItem(`nilpha_medical_records_${cleanPhone}`);
      if (localCache) {
        setRecords(JSON.parse(localCache));
      }
    } catch (e) {
      console.warn('Error reading local medical records cache:', e);
    }

    // 2. Real-time Firestore query by patientPhone
    try {
      const q = query(
        collection(db, 'medical_records'),
        where('patientPhone', '==', cleanPhone)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const fetched: MedicalRecord[] = [];
          snapshot.forEach((d) => {
            const data = d.data();
            fetched.push({
              id: d.id,
              patientPhone: data.patientPhone || cleanPhone,
              patientName: data.patientName || '',
              doctorName: data.doctorName || '',
              doctorSpecialty: data.doctorSpecialty || '',
              hospitalName: data.hospitalName || '',
              visitDate: data.visitDate || '',
              recordType: data.recordType || 'prescription',
              diagnosis: data.diagnosis || '',
              notes: data.notes || '',
              files: data.files || [],
              createdAt: data.createdAt || '',
              userId: data.userId || '',
              followUpDate: data.followUpDate || ''
            });
          });

          // Sort date-wise descending (newest visit date first)
          fetched.sort((a, b) => {
            const dateA = new Date(a.visitDate || a.createdAt).getTime();
            const dateB = new Date(b.visitDate || b.createdAt).getTime();
            return dateB - dateA;
          });

          setRecords(fetched);
          setIsLoading(false);

          // Update local cache
          try {
            localStorage.setItem(
              `nilpha_medical_records_${cleanPhone}`,
              JSON.stringify(fetched)
            );
          } catch (storageErr) {
            console.warn('Local storage write warning:', storageErr);
          }
        },
        (error) => {
          console.warn('Firestore snapshot error on medical_records:', error);
          setIsLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.warn('Failed to listen to medical_records:', err);
      setIsLoading(false);
    }
  }, [unlockedPhone]);

  // Handle phone unlock
  const handleUnlock = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = phoneInput.trim().replace(/\D/g, '');
    if (clean.length < 11) {
      setUnlockError('অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নাম্বার লিখুন (যেমন: 017XXXXXXXX)');
      return;
    }
    setUnlockError('');
    setUnlockedPhone(clean);
    localStorage.setItem('nilpha_medical_records_phone', clean);
  };

  const handleSwitchPhone = () => {
    setUnlockedPhone('');
    setPhoneInput('');
    localStorage.removeItem('nilpha_medical_records_phone');
    setRecords([]);
  };

  // Handle file uploads in form with type & size validation
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingFiles(true);
    const newFiles: FormPendingFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // 15MB limit check
      if (file.size > 15 * 1024 * 1024) {
        alert(`"${file.name}" ফাইলের সাইজ ১৫ মেগাবাইটের বেশি। অনুগ্রহ করে ১৫MB এর নিচের ফাইল নির্বাচন করুন।`);
        continue;
      }

      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const isImg = file.type.startsWith('image/');

      if (!isPdf && !isImg) {
        alert(`"${file.name}" অনুমোদিত ফাইল ফরম্যাট নয়। শুধুমাত্র ছবি (JPG, PNG, WEBP) অথবা PDF প্রেসক্রিপশন আপলোড করা যাবে।`);
        continue;
      }

      try {
        let previewUrl = '';
        if (isImg) {
          previewUrl = URL.createObjectURL(file);
        }

        newFiles.push({
          file,
          name: file.name,
          previewUrl,
          size: file.size,
          isPdf,
          type: isPdf ? 'application/pdf' : (file.type || 'image/jpeg')
        });
      } catch (err) {
        console.error('Error processing file preview:', err);
      }
    }

    setFormFiles(prev => [...prev, ...newFiles]);
    setIsProcessingFiles(false);
  };

  const handleRemoveFile = (index: number) => {
    setFormFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Submit new medical record to Firebase Storage & Firestore
  const handleSubmitRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockedPhone) return;

    if (!formVisitDate) {
      alert('অনুগ্রহ করে ডাক্তার দেখানোর তারিখ নির্বাচন করুন');
      return;
    }

    if (formFiles.length === 0) {
      alert('অনুগ্রহ করে প্রেসক্রিপশন বা রিপোর্টের অন্তত একটি ছবি বা PDF ফাইল যুক্ত করুন');
      return;
    }

    setIsSubmitting(true);
    setUploadProgressText('ফায়ারবেস অথেনটিকেশন যাচাই করা হচ্ছে...');
    try {
      await ensureFirebaseAuthSession();
      const cleanPhone = unlockedPhone.trim().replace(/\D/g, '');
      const recordId = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const userId = user?.uid || profile?.id || ('patient_' + cleanPhone);

      const uploadedFiles: MedicalRecordFile[] = [];

      for (let i = 0; i < formFiles.length; i++) {
        const item = formFiles[i];
        setUploadProgressText(`ফায়ারবেস ক্লাউড স্টোরেজে ফাইল আপলোড হচ্ছে (${i + 1}/${formFiles.length})...`);

        let uploadBlob: Blob;
        let contentType = item.type;

        if (item.isPdf) {
          uploadBlob = item.file;
          contentType = 'application/pdf';
        } else {
          uploadBlob = await compressImageToBlob(item.file);
          contentType = 'image/jpeg';
        }

        const safeFileName = item.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storagePath = `medical_records/${userId}/${recordId}/${Date.now()}_${safeFileName}`;
        const fileRef = storageRef(storage, storagePath);

        const uploadResult = await uploadBytes(fileRef, uploadBlob, {
          contentType,
          customMetadata: {
            userId,
            recordId,
            patientPhone: cleanPhone,
            originalName: item.name
          }
        });

        const downloadURL = await getDownloadURL(uploadResult.ref);

        uploadedFiles.push({
          name: item.name,
          fileName: safeFileName,
          url: downloadURL,
          downloadURL: downloadURL,
          storagePath: storagePath,
          size: uploadBlob.size,
          fileSize: uploadBlob.size,
          type: contentType,
          fileType: contentType,
          uploadedAt: new Date().toISOString()
        });
      }

      setUploadProgressText('মেটাডাটা সংরক্ষণ করা হচ্ছে...');

      const primaryFile = uploadedFiles[0];
      const newRecord: MedicalRecord = {
        id: recordId,
        recordId: recordId,
        userId: userId,
        patientPhone: cleanPhone,
        patientName: formPatientName.trim() || profile?.full_name || 'রোগী',
        doctorName: formDoctorName.trim() || 'অনুল্লেখিত ডাক্তার',
        doctorSpecialty: formDoctorSpecialty.trim(),
        hospitalName: formHospitalName.trim(),
        visitDate: formVisitDate,
        recordType: formRecordType,
        documentType: formRecordType,
        diagnosis: formDiagnosis.trim(),
        notes: formNotes.trim(),
        files: uploadedFiles,
        storagePath: primaryFile?.storagePath || '',
        downloadURL: primaryFile?.downloadURL || primaryFile?.url || '',
        fileName: primaryFile?.fileName || primaryFile?.name || '',
        fileType: primaryFile?.fileType || primaryFile?.type || '',
        fileSize: primaryFile?.fileSize || primaryFile?.size || 0,
        doctorRef: formDoctorName.trim() || '',
        appointmentRef: '',
        createdAt: new Date().toISOString(),
        uploadedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 1. Save metadata to Firestore (No large Base64!)
      await setDoc(doc(db, 'medical_records', recordId), newRecord);

      // 2. Optimistic local update
      setRecords(prev => {
        const updated = [newRecord, ...prev];
        updated.sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime());
        try {
          localStorage.setItem(`nilpha_medical_records_${cleanPhone}`, JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      // Reset form
      setFormDoctorName('');
      setFormDoctorSpecialty('');
      setFormHospitalName('');
      setFormPatientName('');
      setFormDiagnosis('');
      setFormNotes('');
      setFormFiles([]);
      setShowUploadModal(false);
      setUploadSuccessMsg('চিকিৎসা পত্র ক্লাউড স্টোরেজে সফলভাবে সংরক্ষণ করা হয়েছে!');
      setTimeout(() => setUploadSuccessMsg(''), 5000);
    } catch (error: any) {
      console.error('Failed to save medical record to Firebase Storage:', error);
      alert(`সংরক্ষণে সমস্যা হয়েছে: ${error?.message || 'অনুগ্রহ করে পুনরায় চেষ্টা করুন'}`);
    } finally {
      setIsSubmitting(false);
      setUploadProgressText('');
    }
  };

  // Delete a record and clean up storage
  const handleDeleteRecord = async (recordId: string) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে এই চিকিৎসা পত্রটি মুছে ফেলতে চান?')) {
      return;
    }

    try {
      const recToDelete = records.find(r => r.id === recordId);
      if (recToDelete?.files) {
        for (const f of recToDelete.files) {
          if (f.storagePath) {
            try {
              await deleteObject(storageRef(storage, f.storagePath));
            } catch (err) {
              console.warn('Storage delete warning:', err);
            }
          }
        }
      }

      await deleteDoc(doc(db, 'medical_records', recordId));
      setRecords(prev => {
        const updated = prev.filter(r => r.id !== recordId);
        if (unlockedPhone) {
          localStorage.setItem(`nilpha_medical_records_${unlockedPhone}`, JSON.stringify(updated));
        }
        return updated;
      });
      if (previewRecord?.id === recordId) {
        setPreviewRecord(null);
      }
    } catch (err) {
      console.error('Failed to delete medical record:', err);
      alert('মুছে ফেলতে সমস্যা হয়েছে।');
    }
  };

  // 1-Click safe migration of legacy Base64 record to Firebase Storage
  const handleMigrateLegacyRecord = async (rec: MedicalRecord) => {
    if (!rec.files || rec.files.length === 0) return;
    setMigratingRecordId(rec.id);
    try {
      await ensureFirebaseAuthSession();
      const userId = rec.userId || user?.uid || profile?.id || ('patient_' + unlockedPhone);
      const updatedFiles: MedicalRecordFile[] = [];

      for (let i = 0; i < rec.files.length; i++) {
        const file = rec.files[i];
        if (file.url && file.url.startsWith('data:')) {
          // Convert Base64 dataUrl to Blob
          const blob = dataUrlToBlob(file.url);
          const isPdf = file.url.startsWith('data:application/pdf') || (file.name && file.name.endsWith('.pdf'));
          const ext = isPdf ? 'pdf' : 'jpg';
          const mime = isPdf ? 'application/pdf' : 'image/jpeg';
          const safeName = `migrated_${i + 1}_${Date.now()}.${ext}`;
          const storagePath = `medical_records/${userId}/${rec.id}/${safeName}`;

          const fileRef = storageRef(storage, storagePath);
          const uploadRes = await uploadBytes(fileRef, blob, { contentType: mime });
          const downloadUrl = await getDownloadURL(uploadRes.ref);

          updatedFiles.push({
            ...file,
            url: downloadUrl,
            downloadURL: downloadUrl,
            storagePath: storagePath,
            size: blob.size,
            fileSize: blob.size,
            type: mime,
            fileType: mime,
            fileName: safeName
          });
        } else {
          updatedFiles.push(file);
        }
      }

      const primary = updatedFiles[0];
      const updatedRecord: Partial<MedicalRecord> = {
        files: updatedFiles,
        storagePath: primary?.storagePath || '',
        downloadURL: primary?.downloadURL || primary?.url || '',
        fileName: primary?.fileName || primary?.name || '',
        fileType: primary?.fileType || primary?.type || '',
        fileSize: primary?.fileSize || primary?.size || 0,
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'medical_records', rec.id), updatedRecord, { merge: true });

      setRecords(prev => prev.map(r => r.id === rec.id ? { ...r, ...updatedRecord } : r));
      alert('চিকিৎসা পত্রটি সফলভাবে ফায়ারবেস ক্লাউড স্টোরেজে স্থানান্তরিত হয়েছে!');
    } catch (e: any) {
      console.error('Migration failed:', e);
      alert(`মাইগ্রেশন ব্যর্থ হয়েছে: ${e?.message || 'আবার চেষ্টা করুন'}`);
    } finally {
      setMigratingRecordId(null);
    }
  };

  // Direct Download function
  const handleDownloadFile = (file: MedicalRecordFile, rec: MedicalRecord) => {
    try {
      const cleanDoctor = (rec.doctorName || 'Doctor').replace(/[^a-zA-Z0-9_\u0980-\u09FF]/g, '_');
      const filename = `Prescription_${rec.visitDate || 'date'}_${cleanDoctor}.jpg`;

      const link = document.createElement('a');
      link.href = file.url;
      link.download = file.name || filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('Download error:', e);
      window.open(file.url, '_blank');
    }
  };

  // Direct Print function
  const handlePrintFile = (file: MedicalRecordFile, rec: MedicalRecord) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>চিকিৎসা পত্র - ${rec.doctorName || ''} (${rec.visitDate})</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 20px; }
            img { max-width: 100%; height: auto; }
            .header { margin-bottom: 20px; border-bottom: 2px solid #ddd; padding-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>ডিজিটাল চিকিৎসা পত্র ও প্রেসক্রিপশন</h2>
            <p><strong>রোগী:</strong> ${rec.patientName || 'রোগী'} | <strong>ডাক্তার:</strong> ${rec.doctorName || ''} | <strong>তারিখ:</strong> ${formatBnDate(rec.visitDate)}</p>
            ${rec.hospitalName ? `<p><strong>হাসপাতাল/চেম্বার:</strong> ${rec.hospitalName}</p>` : ''}
          </div>
          <img src="${file.url}" onload="window.print();window.close();" />
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter(rec => {
      // Type filter
      if (filterType !== 'all' && rec.recordType !== filterType) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchDoctor = (rec.doctorName || '').toLowerCase().includes(q);
        const matchHospital = (rec.hospitalName || '').toLowerCase().includes(q);
        const matchDiagnosis = (rec.diagnosis || '').toLowerCase().includes(q);
        const matchNotes = (rec.notes || '').toLowerCase().includes(q);
        const matchDate = (rec.visitDate || '').includes(q);
        const matchSpecialty = (rec.doctorSpecialty || '').toLowerCase().includes(q);
        return matchDoctor || matchHospital || matchDiagnosis || matchNotes || matchDate || matchSpecialty;
      }
      return true;
    });
  }, [records, filterType, searchQuery]);

  // Group records date-wise by Year or Month for beautiful visual presentation
  const groupedRecords = useMemo(() => {
    const groups: { [key: string]: MedicalRecord[] } = {};
    filteredRecords.forEach(rec => {
      const d = rec.visitDate || 'অজানা তারিখ';
      if (!groups[d]) {
        groups[d] = [];
      }
      groups[d].push(rec);
    });
    return groups;
  }, [filteredRecords]);

  // ----------------------------------------------------
  // VIEW 1: LOCKED STATE (Unlock with mobile number)
  // ----------------------------------------------------
  if (!unlockedPhone) {
    return (
      <div className="max-w-2xl mx-auto py-6 px-4">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100 text-center space-y-6">
          {/* Header Icon */}
          <div className="relative inline-block">
            <div className="w-20 h-20 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-emerald-200 mx-auto">
              <FolderOpen size={40} />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-900 p-1.5 rounded-xl shadow">
              <Lock size={16} />
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-black px-3 py-1 rounded-full border border-emerald-200">
              <Sparkles size={13} /> ডিজিটাল মেডিকেল রেকর্ডস ও প্রেসক্রিপশন ভল্ট
            </span>
            <h1 className="text-2xl font-black text-slate-800">
              চিকিৎসা পত্র জমা করুন
            </h1>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              আপনার ও আপনার পরিবারের সকল প্রেসক্রিপশন এবং টেস্ট রিপোর্ট মোবাইল নাম্বারের মাধ্যমে সুরক্ষিত রাখুন। যেকোনো সময় সরাসরি দেখুন ও ডাউনলোড করুন।
            </p>
          </div>

          {/* Unlock Box */}
          <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80 max-w-md mx-auto text-left space-y-4">
            <label className="block text-xs font-black text-slate-700 flex items-center gap-1.5">
              <Phone size={14} className="text-emerald-600" />
              আপনার মোবাইল নাম্বার দিয়ে আনলক করুন:
            </label>

            <form onSubmit={handleUnlock} className="space-y-3">
              <div className="relative">
                <input
                  type="tel"
                  placeholder="017XXXXXXXX"
                  value={phoneInput}
                  onChange={(e) => {
                    setPhoneInput(e.target.value);
                    setUnlockError('');
                  }}
                  className="w-full pl-11 pr-4 py-3 bg-white rounded-xl border border-slate-200 text-sm font-bold focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                  maxLength={11}
                  required
                />
                <span className="absolute left-3.5 top-3.5 text-slate-400 text-sm font-bold">
                  🇧🇩
                </span>
              </div>

              {unlockError && (
                <div className="flex items-center gap-1.5 text-rose-600 text-xs font-bold bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{unlockError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white py-3 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 transition-all cursor-pointer"
              >
                <Unlock size={16} />
                <span>মেডিকেল রেকর্ডস আনলক করুন</span>
              </button>
            </form>

            {/* Quick Profile Fill Button if logged in */}
            {profile?.phone && profile.phone !== phoneInput && (
              <button
                type="button"
                onClick={() => {
                  setPhoneInput(profile.phone || '');
                  setUnlockedPhone(profile.phone || '');
                  localStorage.setItem('nilpha_medical_records_phone', profile.phone || '');
                }}
                className="w-full text-center text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 p-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                <span>👤 আপনার প্রোফাইল নাম্বার ({profile.phone}) দিয়ে প্রবেশ করুন</span>
              </button>
            )}
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-left">
            <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100 flex items-start gap-2.5">
              <span className="text-xl">📅</span>
              <div>
                <h4 className="text-xs font-black text-slate-800">তারিখ অনুযায়ী সাজানো</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">কোন দিন কোন ডাক্তার দেখিয়েছেন ক্রমানুসারে পাওয়া যাবে।</p>
              </div>
            </div>
            <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-100 flex items-start gap-2.5">
              <span className="text-xl">⬇️</span>
              <div>
                <h4 className="text-xs font-black text-slate-800">সহজেই ডাউনলোড</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">ক্লিনিক বা চেম্বারে মোবাইল থেকে যে কোনো সময় ডাউনলোড করুন।</p>
              </div>
            </div>
            <div className="p-3.5 bg-purple-50/60 rounded-2xl border border-purple-100 flex items-start gap-2.5">
              <span className="text-xl">🔒</span>
              <div>
                <h4 className="text-xs font-black text-slate-800">১০০% সুরক্ষিত ভল্ট</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">হারিয়ে যাওয়ার ভয় নেই, নিরাপদ ক্লাউড স্টোরেজে জমা থাকবে।</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // VIEW 2: UNLOCKED STATE (View, Download, Upload)
  // ----------------------------------------------------
  return (
    <div className="space-y-5 max-w-4xl mx-auto pb-12">
      {/* Top Banner / Phone Bar */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800 text-white p-4 sm:p-5 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-4 -translate-y-4">
          <FolderOpen size={180} />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-emerald-100 inline-flex items-center gap-1">
                <ShieldCheck size={12} /> ডিজিটাল প্রেসক্রিপশন ভল্ট
              </span>
              <span className="bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                আনলকড
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-black flex items-center gap-2">
              চিকিৎসা পত্র ও প্রেসক্রিপশন রেকর্ডস
            </h1>
            <p className="text-xs text-emerald-100 flex items-center gap-1.5">
              <Phone size={12} />
              সংরক্ষিত মোবাইল নাম্বার: <span className="font-mono font-bold text-white bg-black/20 px-2 py-0.5 rounded-md">{unlockedPhone}</span>
              <span className="text-emerald-200">({records.length} টি রেকর্ড সংরক্ষিত)</span>
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setShowUploadModal(true)}
              className="flex-1 sm:flex-initial bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus size={16} />
              <span>চিকিৎসা পত্র জমা দিন</span>
            </button>

            <button
              type="button"
              onClick={handleSwitchPhone}
              className="bg-white/15 hover:bg-white/25 text-white text-xs font-bold px-3 py-2.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
              title="অন্য মোবাইল নাম্বারে পরিবর্তন করুন"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">নাম্বার পরিবর্তন</span>
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {uploadSuccessMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-2xl flex items-center gap-2 text-xs font-bold shadow-sm"
        >
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{uploadSuccessMsg}</span>
        </motion.div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="ডাক্তার, রোগ বা হাসপাতাল খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:border-emerald-500 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Type Filter Chips */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-black whitespace-nowrap transition-all border ${
              filterType === 'all'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            সকল রেকর্ড ({records.length})
          </button>
          {RECORD_TYPES.map(t => {
            const count = records.filter(r => r.recordType === t.id).length;
            return (
              <button
                key={t.id}
                onClick={() => setFilterType(t.id)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-black whitespace-nowrap transition-all border flex items-center gap-1 ${
                  filterType === t.id
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
                {count > 0 && <span className="text-[9px] opacity-80">({count})</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content List: Date-wise grouping */}
      {isLoading ? (
        <div className="bg-white rounded-3xl p-12 text-center text-slate-400 space-y-3 border border-slate-100">
          <RefreshCw size={28} className="animate-spin mx-auto text-emerald-500" />
          <p className="text-xs font-bold">চিকিৎসা পত্র লোড হচ্ছে...</p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center space-y-4 border border-slate-100 shadow-sm">
          <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center text-3xl mx-auto border border-slate-100">
            📂
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-black text-slate-700">
              {searchQuery || filterType !== 'all'
                ? 'কোনো চিকিৎসা পত্র খুঁজে পাওয়া যায়নি'
                : 'এখনো কোনো চিকিৎসা পত্র জমা রাখা হয়নি'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery || filterType !== 'all'
                ? 'অন্য কোনো নাম বা ফিল্টার দিয়ে চেষ্টা করুন।'
                : 'আপনার প্রেসক্রিপশন বা টেস্ট রিপোর্টের ছবি তুলে বা ফাইল সিলেক্ট করে নিরাপদে রেখে দিন।'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-5 py-2.5 rounded-xl shadow-md transition-all active:scale-95"
          >
            <Plus size={16} />
            <span>নতুন প্রেসক্রিপশন জমা দিন</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {(Object.entries(groupedRecords) as [string, MedicalRecord[]][]).map(([dateStr, dateRecords]) => (
            <div key={dateStr} className="space-y-3">
              {/* Date Header Badge */}
              <div className="flex items-center gap-2">
                <div className="bg-slate-800 text-white text-xs font-black px-3 py-1 rounded-xl shadow-sm flex items-center gap-1.5">
                  <Calendar size={13} className="text-amber-400" />
                  <span>{formatBnDate(dateStr)}</span>
                </div>
                <div className="h-px bg-slate-200 flex-1" />
                <span className="text-[10px] font-bold text-slate-400">
                  {dateRecords.length} টি ডকুমেন্ট
                </span>
              </div>

              {/* Records for this date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dateRecords.map((rec) => {
                  const typeObj = RECORD_TYPES.find(t => t.id === rec.recordType) || RECORD_TYPES[0];
                  return (
                    <div
                      key={rec.id}
                      className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-4.5 space-y-3.5 relative flex flex-col justify-between"
                    >
                      {/* Top Header info */}
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${typeObj.color} flex items-center gap-1`}>
                            <span>{typeObj.icon}</span>
                            <span>{typeObj.label}</span>
                          </span>

                          <button
                            type="button"
                            onClick={() => handleDeleteRecord(rec.id)}
                            className="text-slate-300 hover:text-rose-600 p-1 transition-colors"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        {/* Doctor & Hospital info */}
                        <div>
                          <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                            <Stethoscope size={15} className="text-emerald-600 shrink-0" />
                            <span>{rec.doctorName || 'ডাক্তার'}</span>
                          </h3>
                          {rec.doctorSpecialty && (
                            <p className="text-[11px] text-emerald-700 font-bold ml-5">
                              {rec.doctorSpecialty}
                            </p>
                          )}
                          {rec.hospitalName && (
                            <p className="text-[10px] text-slate-500 font-medium ml-5 flex items-center gap-1 mt-0.5">
                              <Building2 size={11} className="text-slate-400" />
                              <span>{rec.hospitalName}</span>
                            </p>
                          )}
                        </div>

                        {/* Patient & Diagnosis */}
                        {(rec.patientName || rec.diagnosis) && (
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] space-y-1">
                            {rec.patientName && (
                              <div className="text-slate-600 font-bold flex items-center gap-1">
                                <User size={12} className="text-slate-400" />
                                <span>রোগী: {rec.patientName}</span>
                              </div>
                            )}
                            {rec.diagnosis && (
                              <div className="text-slate-700">
                                <span className="font-bold text-slate-500">লক্ষণ / সমস্যা:</span> {rec.diagnosis}
                              </div>
                            )}
                            {rec.notes && (
                              <div className="text-slate-500 text-[10px] line-clamp-2">
                                <span className="font-bold text-slate-400">পরামর্শ:</span> {rec.notes}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* File Thumbnails */}
                      <div className="space-y-2">
                        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                          {rec.files.map((file, idx) => {
                            const isImage = file.url.startsWith('data:image/') || file.url.match(/\.(jpeg|jpg|gif|png|webp)/i);
                            return (
                              <div
                                key={idx}
                                onClick={() => {
                                  setPreviewRecord(rec);
                                  setActiveFileIndex(idx);
                                  setZoomLevel(1);
                                  setRotation(0);
                                }}
                                className="relative group cursor-pointer w-20 h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center hover:border-emerald-500 transition-all shadow-2xs"
                              >
                                {isImage ? (
                                  <img
                                    src={file.url}
                                    alt={file.name || 'document'}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                ) : (
                                  <div className="flex flex-col items-center justify-center text-slate-500 p-1">
                                    <FileText size={22} className="text-rose-500" />
                                    <span className="text-[8px] font-black truncate max-w-[70px] mt-0.5">
                                      {file.name || 'PDF'}
                                    </span>
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                  <Eye size={16} />
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-1 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewRecord(rec);
                              setActiveFileIndex(0);
                              setZoomLevel(1);
                              setRotation(0);
                            }}
                            className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-black py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Eye size={14} />
                            <span>ডকুমেন্ট দেখুন ({rec.files.length})</span>
                          </button>

                          {rec.files[0] && (
                            <button
                              type="button"
                              onClick={() => handleDownloadFile(rec.files[0], rec)}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-black px-3 py-2 rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer"
                              title="সরাসরি ডাউনলোড করুন"
                            >
                              <Download size={14} />
                              <span className="hidden sm:inline">ডাউনলোড</span>
                            </button>
                          )}
                        </div>

                        {/* Backward Compatibility 1-click cloud storage migration */}
                        {rec.files.some(f => f.url && f.url.startsWith('data:')) && (
                          <button
                            type="button"
                            onClick={() => handleMigrateLegacyRecord(rec)}
                            disabled={migratingRecordId === rec.id}
                            className="w-full mt-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-black py-1.5 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            title="পুরনো Base64 প্রেসক্রিপশনকে ফায়ারবেস ক্লাউড স্টোরেজে ব্যাকআপ করুন"
                          >
                            {migratingRecordId === rec.id ? (
                              <>
                                <RefreshCw size={12} className="animate-spin text-amber-700" />
                                <span>ক্লাউডে ট্রান্সফার হচ্ছে...</span>
                              </>
                            ) : (
                              <>
                                <UploadCloud size={12} className="text-amber-700" />
                                <span>ফায়ারবেস স্টোরেজে ব্যাকআপ করুন</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 1: UPLOAD / ADD MEDICAL RECORD                 */}
      {/* ---------------------------------------------------- */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 p-5 sm:p-6 space-y-4"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                    <FilePlus size={22} />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-800">চিকিৎসা পত্র জমা করুন</h2>
                    <p className="text-[10px] text-slate-400">মোবাইল নাম্বারে সুরক্ষিত রাখা হবে</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmitRecord} className="space-y-3.5">
                {/* Visit Date */}
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1 flex items-center gap-1">
                    <Calendar size={13} className="text-emerald-600" />
                    ডাক্তার দেখানোর তারিখ: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formVisitDate}
                    onChange={(e) => setFormVisitDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:bg-white focus:border-emerald-500 outline-none"
                    required
                  />
                </div>

                {/* Document Type */}
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    ডকুমেন্টের ধরণ:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {RECORD_TYPES.map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setFormRecordType(t.id)}
                        className={`p-2 rounded-xl text-[11px] font-black border flex items-center gap-1.5 transition-all text-left ${
                          formRecordType === t.id
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-2xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span>{t.icon}</span>
                        <span className="truncate">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Doctor Name & Specialty */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">
                      ডাক্তারের নাম:
                    </label>
                    <input
                      type="text"
                      placeholder="যেমন: ডাঃ এম. এ. রহিম"
                      value={formDoctorName}
                      onChange={(e) => setFormDoctorName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:bg-white focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">
                      বিশেষজ্ঞ ধরণ:
                    </label>
                    <input
                      type="text"
                      placeholder="যেমন: মেডিসিন / হৃদরোগ"
                      value={formDoctorSpecialty}
                      onChange={(e) => setFormDoctorSpecialty(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:bg-white focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                {/* Hospital / Clinic */}
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    হাসপাতাল / চেম্বার / ক্লিনিক:
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: নীলফামারী আধুনিক ডায়াগনস্টিক সেন্টার"
                    value={formHospitalName}
                    onChange={(e) => setFormHospitalName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:bg-white focus:border-emerald-500 outline-none"
                  />
                </div>

                {/* Patient Name & Diagnosis */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">
                      রোগীর নাম:
                    </label>
                    <input
                      type="text"
                      placeholder="রোগীর নাম"
                      value={formPatientName}
                      onChange={(e) => setFormPatientName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:bg-white focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">
                      রোগের লক্ষণ / সমস্যা:
                    </label>
                    <input
                      type="text"
                      placeholder="যেমন: জ্বর ও শ্বাসকষ্ট"
                      value={formDiagnosis}
                      onChange={(e) => setFormDiagnosis(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:bg-white focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                {/* Advice / Notes */}
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    অতিরিক্ত নোট বা পরামর্শ (ঐচ্ছিক):
                  </label>
                  <textarea
                    rows={2}
                    placeholder="ঔষধের নিয়ম বা টেস্টের নির্দেশাবলী..."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:bg-white focus:border-emerald-500 outline-none resize-none"
                  />
                </div>

                {/* File Upload Area */}
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <UploadCloud size={13} className="text-emerald-600" />
                      প্রেসক্রিপশন বা রিপোর্টের ছবি/ফাইল: <span className="text-rose-500">*</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">একাধিক ছবি যোগ করা যাবে</span>
                  </label>

                  <div className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl p-4 text-center bg-slate-50/60 transition-all relative">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      multiple
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      disabled={isProcessingFiles}
                    />
                    <div className="space-y-1">
                      <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center mx-auto">
                        <UploadCloud size={20} />
                      </div>
                      <p className="text-xs font-black text-slate-700">
                        {isProcessingFiles ? 'ফাইল প্রসেস হচ্ছে...' : 'ছবি তুলুন বা ফাইল সিলেক্ট করুন'}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        JPG, PNG বা PDF ফরম্যাট
                      </p>
                    </div>
                  </div>

                  {/* Attached Files Preview */}
                  {formFiles.length > 0 && (
                    <div className="mt-2.5 flex gap-2 overflow-x-auto no-scrollbar py-1">
                      {formFiles.map((file, idx) => (
                        <div
                          key={idx}
                          className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 bg-white shrink-0 group flex items-center justify-center"
                        >
                          {file.isPdf ? (
                            <div className="flex flex-col items-center justify-center p-1 text-center">
                              <FileText size={20} className="text-rose-500" />
                              <span className="text-[8px] font-bold text-slate-500 truncate max-w-[50px] mt-0.5">PDF</span>
                            </div>
                          ) : (
                            <img
                              src={file.previewUrl}
                              alt="thumb"
                              className="w-full h-full object-cover"
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(idx)}
                            className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-0.5 shadow hover:bg-rose-700 transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Progress message if uploading */}
                {uploadProgressText && (
                  <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold flex items-center gap-2 border border-blue-100">
                    <RefreshCw size={14} className="animate-spin shrink-0" />
                    <span>{uploadProgressText}</span>
                  </div>
                )}

                {/* Submit button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || isProcessingFiles}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white py-3 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>{uploadProgressText || 'সংরক্ষণ করা হচ্ছে...'}</span>
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        <span>চিকিৎসা পত্র ক্লাউডে সংরক্ষণ করুন</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------------------------------------------- */}
      {/* MODAL 2: FULL DOCUMENT PREVIEW & DOWNLOAD MODAL      */}
      {/* ---------------------------------------------------- */}
      <AnimatePresence>
        {previewRecord && previewRecord.files[activeFileIndex] && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-800 text-white"
            >
              {/* Preview Header */}
              <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                    <span>{previewRecord.doctorName}</span>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800">
                      {formatBnDate(previewRecord.visitDate)}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {previewRecord.hospitalName || previewRecord.diagnosis || 'প্রেসক্রিপশন রেকর্ড'}
                    {previewRecord.files.length > 1 && (
                      <span className="ml-2 text-slate-500">
                        (পাতা {activeFileIndex + 1} / {previewRecord.files.length})
                      </span>
                    )}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 3))}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
                    title="জুম ইন"
                  >
                    <ZoomIn size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.5))}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
                    title="জুম আউট"
                  >
                    <ZoomOut size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setRotation(prev => (prev + 90) % 360)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
                    title="ঘোরান"
                  >
                    <RotateCw size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePrintFile(previewRecord.files[activeFileIndex], previewRecord)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
                    title="প্রিন্ট করুন"
                  >
                    <Printer size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadFile(previewRecord.files[activeFileIndex], previewRecord)}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1 transition-all shadow"
                    title="ডাউনলোড করুন"
                  >
                    <Download size={15} />
                    <span className="hidden sm:inline">ডাউনলোড</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewRecord(null)}
                    className="p-2 bg-slate-800 hover:bg-rose-600 text-white rounded-xl transition-colors ml-1"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Preview Body (Zoomable Image Canvas) */}
              <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950/50 min-h-[300px]">
                {previewRecord.files[activeFileIndex].url.startsWith('data:image/') ||
                 previewRecord.files[activeFileIndex].url.match(/\.(jpeg|jpg|gif|png|webp)/i) ? (
                  <div
                    style={{
                      transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                      transition: 'transform 0.2s ease-out'
                    }}
                    className="origin-center max-w-full"
                  >
                    <img
                      src={previewRecord.files[activeFileIndex].url}
                      alt="Full Medical Record"
                      className="max-h-[68vh] w-auto object-contain rounded-lg shadow-2xl"
                    />
                  </div>
                ) : (
                  <div className="text-center space-y-3 p-8">
                    <FileText size={64} className="text-rose-500 mx-auto" />
                    <p className="text-sm font-bold text-slate-300">
                      {previewRecord.files[activeFileIndex].name || 'PDF ডকুমেন্ট'}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleDownloadFile(previewRecord.files[activeFileIndex], previewRecord)}
                      className="inline-flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-black px-4 py-2 rounded-xl"
                    >
                      <Download size={14} />
                      <span>ডাউনলোড করে দেখুন</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Multi-page Thumbnail selector if multiple files */}
              {previewRecord.files.length > 1 && (
                <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
                  <span className="text-[10px] text-slate-400 font-bold shrink-0">সকল পাতা:</span>
                  {previewRecord.files.map((f, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setActiveFileIndex(i);
                        setZoomLevel(1);
                        setRotation(0);
                      }}
                      className={`w-12 h-12 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                        activeFileIndex === i ? 'border-emerald-500 scale-105' : 'border-slate-700 opacity-60'
                      }`}
                    >
                      <img src={f.url} alt="page" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
