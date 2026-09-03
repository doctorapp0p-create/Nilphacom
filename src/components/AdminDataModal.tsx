import React, { useState, useEffect } from 'react';
import { Doctor, Clinic, LabTest } from '../../types';
import { SPECIALTIES } from '../../constants';
import { X, Upload, Plus, Check, MapPin, Building, Stethoscope, DollarSign, Clock, Star, Video } from 'lucide-react';

interface AdminDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'doctor' | 'hospital' | 'lab_test';
  initialItem: any;
  hospitals: Clinic[];
  onSave: (type: 'doctor' | 'hospital' | 'lab_test', item: any) => Promise<void>;
  isProcessing: boolean;
  tempImage: string | null;
  setTempImage: (img: string | null) => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const PRESET_DISTRICTS = [
  { id: 'rangpur', en: 'Rangpur', bn: 'রংপুর' },
  { id: 'nilphamari', en: 'Nilphamari', bn: 'নীলফামারী' },
  { id: 'domar', en: 'Domar', bn: 'ডোমার' },
  { id: 'dimla', en: 'Dimla', bn: 'ডিমলা' },
  { id: 'jaldhaka', en: 'Jaldhaka', bn: 'জলঢাকা' },
  { id: 'kishoreganj', en: 'Kishoreganj', bn: 'কিশোরগঞ্জ' },
  { id: 'syedpur', en: 'Syedpur', bn: 'সৈয়দপুর' },
  { id: 'dhaka', en: 'Dhaka', bn: 'ঢাকা' },
  { id: 'dinajpur', en: 'Dinajpur', bn: 'দিনাজপুর' },
  { id: 'bogura', en: 'Bogura', bn: 'বগুড়া' },
];

export const AdminDataModal: React.FC<AdminDataModalProps> = ({
  isOpen,
  onClose,
  type,
  initialItem,
  hospitals,
  onSave,
  isProcessing,
  tempImage,
  setTempImage,
  handleImageUpload,
}) => {
  if (!isOpen) return null;

  // Doctor state fields
  const [docId, setDocId] = useState(initialItem?.id || '');
  const [docName, setDocName] = useState(initialItem?.name || '');
  const [docDegree, setDocDegree] = useState(initialItem?.degree || '');
  const [docSpecialty, setDocSpecialty] = useState(initialItem?.specialty || 'Medicine');
  const [docCustomSpecialty, setDocCustomSpecialty] = useState('');
  const [docDistricts, setDocDistricts] = useState<string[]>(
    Array.isArray(initialItem?.districts) ? initialItem.districts : ['Nilphamari']
  );
  const [customDistrictInput, setCustomDistrictInput] = useState('');
  const [docClinics, setDocClinics] = useState<string[]>(
    Array.isArray(initialItem?.clinics) ? initialItem.clinics : []
  );
  const [docSchedule, setDocSchedule] = useState(
    initialItem?.schedule || 'প্রতিদিন দুপুর ০৩টা থেকে রাত ০৯টা পর্যন্ত।'
  );
  const [docConsultationFee, setDocConsultationFee] = useState(
    initialItem?.consultationFee ?? 500
  );
  const [docAvailableToday, setDocAvailableToday] = useState<boolean>(
    initialItem?.availableToday ?? true
  );
  const [docIsVideoConsultant, setDocIsVideoConsultant] = useState<boolean>(
    initialItem?.isVideoConsultant ?? false
  );
  const [docRating, setDocRating] = useState<number>(initialItem?.rating || 4.8);
  const [docImageUrl, setDocImageUrl] = useState(
    initialItem?.image || 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200'
  );

  // Hospital state fields
  const [hospId, setHospId] = useState(initialItem?.id || '');
  const [hospName, setHospName] = useState(initialItem?.name || '');
  const [hospDistrict, setHospDistrict] = useState(initialItem?.district || 'Nilphamari');
  const [hospAddress, setHospAddress] = useState(initialItem?.address || '');
  const [hospImageUrl, setHospImageUrl] = useState(
    initialItem?.image || 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=200'
  );

  // Lab test state fields
  const [labId, setLabId] = useState(initialItem?.id || '');
  const [labName, setLabName] = useState(initialItem?.name || '');
  const [labPrice, setLabPrice] = useState(initialItem?.price || 500);
  const [labDiscountPrice, setLabDiscountPrice] = useState<number | string>(initialItem?.discountPrice || '');
  const [labCategory, setLabCategory] = useState<'Pathology' | 'X-Ray' | 'Ultrasonogram' | 'ECG & Echo' | 'Other'>(initialItem?.category || 'Pathology');
  const [labHospitalName, setLabHospitalName] = useState(initialItem?.hospital_name || 'JB Diagnostic Center');
  const [labDescription, setLabDescription] = useState(initialItem?.description || '');
  const [labIsActive, setLabIsActive] = useState<boolean>(initialItem?.isActive ?? true);

  useEffect(() => {
    if (isOpen) {
      if (type === 'doctor') {
        setDocId(initialItem?.id || '');
        setDocName(initialItem?.name || '');
        setDocDegree(initialItem?.degree || '');
        setDocSpecialty(initialItem?.specialty || 'Medicine');
        setDocCustomSpecialty('');
        setDocDistricts(Array.isArray(initialItem?.districts) ? initialItem.districts : ['Nilphamari']);
        setDocClinics(Array.isArray(initialItem?.clinics) ? initialItem.clinics : []);
        setDocSchedule(initialItem?.schedule || 'প্রতিদিন দুপুর ০৩টা থেকে রাত ০৯টা পর্যন্ত।');
        setDocConsultationFee(initialItem?.consultationFee ?? 500);
        setDocAvailableToday(initialItem?.availableToday ?? true);
        setDocIsVideoConsultant(initialItem?.isVideoConsultant ?? false);
        setDocRating(initialItem?.rating || 4.8);
        setDocImageUrl(initialItem?.image || 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200');
      } else if (type === 'hospital') {
        setHospId(initialItem?.id || '');
        setHospName(initialItem?.name || '');
        setHospDistrict(initialItem?.district || 'Nilphamari');
        setHospAddress(initialItem?.address || '');
        setHospImageUrl(initialItem?.image || 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=200');
      } else if (type === 'lab_test') {
        setLabId(initialItem?.id || '');
        setLabName(initialItem?.name || '');
        setLabPrice(initialItem?.price || 500);
        setLabDiscountPrice(initialItem?.discountPrice || '');
        setLabCategory(initialItem?.category || 'Pathology');
        setLabHospitalName(initialItem?.hospital_name || 'JB Diagnostic Center');
        setLabDescription(initialItem?.description || '');
        setLabIsActive(initialItem?.isActive ?? true);
      }
    }
  }, [isOpen, initialItem, type]);

  useEffect(() => {
    if (tempImage) {
      if (type === 'doctor') setDocImageUrl(tempImage);
      if (type === 'hospital') setHospImageUrl(tempImage);
    }
  }, [tempImage, type]);

  const toggleDistrict = (preset: { en: string; bn: string }) => {
    const hasEn = docDistricts.some(d => d.toLowerCase() === preset.en.toLowerCase());
    const hasBn = docDistricts.includes(preset.bn);

    if (hasEn || hasBn) {
      // Remove both
      setDocDistricts(prev =>
        prev.filter(
          d => d.toLowerCase() !== preset.en.toLowerCase() && d !== preset.bn
        )
      );
    } else {
      // Add both English and Bengali so search & filter work seamlessly
      setDocDistricts(prev => [...prev, preset.en, preset.bn]);
    }
  };

  const isDistrictSelected = (preset: { en: string; bn: string }) => {
    return docDistricts.some(
      d => d.toLowerCase() === preset.en.toLowerCase() || d === preset.bn
    );
  };

  const handleAddCustomDistrict = () => {
    const val = customDistrictInput.trim();
    if (val && !docDistricts.includes(val)) {
      setDocDistricts(prev => [...prev, val]);
      setCustomDistrictInput('');
    }
  };

  const handleRemoveDistrict = (distToRemove: string) => {
    setDocDistricts(prev => prev.filter(d => d !== distToRemove));
  };

  const toggleClinic = (clinicId: string) => {
    if (docClinics.includes(clinicId)) {
      setDocClinics(prev => prev.filter(c => c !== clinicId));
    } else {
      setDocClinics(prev => [...prev, clinicId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (type === 'doctor') {
      if (!docName.trim()) {
        alert('ডাক্তারের নাম লিখুন।');
        return;
      }
      const finalSpecialty = docSpecialty === 'Other' && docCustomSpecialty.trim() ? docCustomSpecialty.trim() : docSpecialty;
      const finalId = docId.trim() || `doc-${Date.now()}`;
      
      const doctorData: Doctor = {
        id: finalId,
        name: docName.trim(),
        degree: docDegree.trim(),
        specialty: finalSpecialty,
        districts: docDistricts.length > 0 ? docDistricts : ['Nilphamari'],
        clinics: docClinics,
        schedule: docSchedule.trim(),
        availableToday: docAvailableToday,
        rating: Number(docRating) || 4.8,
        image: tempImage || docImageUrl,
        isVideoConsultant: docIsVideoConsultant,
        consultationFee: Number(docConsultationFee) || 500,
      };

      await onSave('doctor', doctorData);
    } else if (type === 'hospital') {
      if (!hospName.trim()) {
        alert('হাসপাতাল/ক্লিনিকের নাম লিখুন।');
        return;
      }
      const finalId = hospId.trim() || `c-${Date.now()}`;
      const clinicData: Clinic = {
        id: finalId,
        name: hospName.trim(),
        district: hospDistrict.trim(),
        address: hospAddress.trim(),
        doctors: initialItem?.doctors || [],
        image: tempImage || hospImageUrl,
      };

      await onSave('hospital', clinicData);
    } else if (type === 'lab_test') {
      if (!labName.trim()) {
        alert('ল্যাব টেস্টের নাম লিখুন।');
        return;
      }
      const finalId = labId.trim() || `test-${Date.now()}`;
      const testData: LabTest = {
        id: finalId,
        name: labName.trim(),
        price: Number(labPrice) || 0,
        discountPrice: labDiscountPrice !== '' ? Number(labDiscountPrice) : undefined,
        category: labCategory,
        hospital_name: labHospitalName.trim(),
        description: labDescription.trim(),
        isActive: labIsActive,
      };

      await onSave('lab_test', testData);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white flex justify-between items-center">
          <div>
            <h3 className="text-lg font-black uppercase tracking-wide">
              {initialItem?.id ? 'তথ্য এডিট করুন' : 'নতুন তথ্য যুক্ত করুন'}
            </h3>
            <p className="text-[11px] font-bold text-blue-100 mt-0.5">
              {type === 'doctor' && 'ডাক্তারের প্রোফাইল, এলাকা ও চেম্বার তথ্য'}
              {type === 'hospital' && 'হাসপাতাল/ক্লিনিকের তথ্য ও ঠিকানা'}
              {type === 'lab_test' && 'ল্যাব টেস্ট এবং মূল্য নির্ধারণ'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* DOCTOR FORM */}
          {type === 'doctor' && (
            <>
              {/* Doctor Name & Degree */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-black uppercase text-slate-600 block mb-1">
                    ডাক্তারের নাম *
                  </label>
                  <input
                    type="text"
                    value={docName}
                    onChange={e => setDocName(e.target.value)}
                    placeholder="যেমন: Dr. Md. Shahzada Mia"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-blue-600 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase text-slate-600 block mb-1">
                    ডিগ্রী ও পদবী
                  </label>
                  <input
                    type="text"
                    value={docDegree}
                    onChange={e => setDocDegree(e.target.value)}
                    placeholder="যেমন: MBBS, BCS (Health), FCPS (Medicine)"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              {/* Specialty & Consultation Fee */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-black uppercase text-slate-600 block mb-1">
                    বিশেষজ্ঞতা (Specialty)
                  </label>
                  <select
                    value={docSpecialty}
                    onChange={e => setDocSpecialty(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-blue-600 focus:bg-white"
                  >
                    {SPECIALTIES.map(s => (
                      <option key={s.id} value={s.name}>
                        {s.bnName} ({s.name})
                      </option>
                    ))}
                    <option value="Other">অন্যান্য (Custom Specialty)</option>
                  </select>

                  {docSpecialty === 'Other' && (
                    <input
                      type="text"
                      value={docCustomSpecialty}
                      onChange={e => setDocCustomSpecialty(e.target.value)}
                      placeholder="যেমন: Pediatric Cardiology"
                      className="w-full mt-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-blue-600"
                    />
                  )}
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase text-slate-600 block mb-1">
                    ভিজিট ফি (BDT)
                  </label>
                  <input
                    type="number"
                    value={docConsultationFee}
                    onChange={e => setDocConsultationFee(Number(e.target.value))}
                    placeholder="600"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              {/* District & Location Selection (CRITICAL FOR ALL AREAS LIKE RANGPUR) */}
              <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black uppercase text-slate-700 flex items-center gap-1.5">
                    <MapPin size={14} className="text-emerald-600" />
                    ডাক্তারের সেবা প্রদানের এলাকা / জেলা নির্বাচন করুন (যেখানে প্রাকটিস করেন) *
                  </label>
                </div>
                <p className="text-[10px] text-slate-500 font-bold">
                  একাধিক এলাকা বা জেলা নির্বাচন করতে পারবেন। রংপুর, নীলফামারী, ডোমার সহ যেকোনো এলাকা নির্বাচন করা যাবে।
                </p>

                {/* Preset Location Buttons */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {PRESET_DISTRICTS.map(p => {
                    const selected = isDistrictSelected(p);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => toggleDistrict(p)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all border flex items-center gap-1.5 ${
                          selected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {selected ? <Check size={12} /> : <span>📍</span>}
                        <span>{p.bn} ({p.en})</span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Area Input */}
                <div className="pt-2 flex gap-2">
                  <input
                    type="text"
                    value={customDistrictInput}
                    onChange={e => setCustomDistrictInput(e.target.value)}
                    placeholder="অন্যান্য কাস্টম এলাকা (যেমন: সৈয়দপুর বা ধাপ রংপুর)"
                    className="flex-1 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-600"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomDistrict}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-black text-xs rounded-xl flex items-center gap-1"
                  >
                    <Plus size={14} /> যোগ করুন
                  </button>
                </div>

                {/* Currently selected districts list badges */}
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-200/60">
                  <span className="text-[10px] font-black uppercase text-slate-400 block w-full mb-1">
                    বর্তমান নির্বাচিত এলাকাসমূহ ({docDistricts.length}):
                  </span>
                  {docDistricts.map(d => (
                    <span
                      key={d}
                      className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg text-[10px] font-black flex items-center gap-1"
                    >
                      {d}
                      <button
                        type="button"
                        onClick={() => handleRemoveDistrict(d)}
                        className="hover:text-red-600 ml-1 font-bold"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Hospital/Clinic Affiliation Checkboxes */}
              <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <label className="text-[11px] font-black uppercase text-slate-700 flex items-center gap-1.5">
                  <Building size={14} className="text-blue-600" />
                  সংযুক্ত হাসপাতাল / ক্লিনিক নির্বাচন করুন (Chambers)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto no-scrollbar pt-1">
                  {hospitals.map(h => {
                    const isChecked = docClinics.includes(h.id);
                    return (
                      <label
                        key={h.id}
                        className={`p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all flex items-center gap-2 ${
                          isChecked
                            ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleClinic(h.id)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <div className="truncate">
                          <p className="font-black text-[11px] truncate">{h.name}</p>
                          <p className="text-[9px] text-slate-400 font-semibold truncate">{h.address}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Schedule & Image */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-black uppercase text-slate-600 block mb-1">
                    চেম্বারের সময়সূচী (Schedule)
                  </label>
                  <input
                    type="text"
                    value={docSchedule}
                    onChange={e => setDocSchedule(e.target.value)}
                    placeholder="যেমন: প্রতি শুক্রবার সকাল ১০টা থেকে রাত ৮টা"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase text-slate-600 block mb-1">
                    ছবি আপলোড বা ছবি লিংক (Image URL)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={docImageUrl}
                      onChange={e => setDocImageUrl(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-blue-600 focus:bg-white"
                    />
                    <label className="bg-slate-100 hover:bg-slate-200 px-3 py-3 rounded-2xl cursor-pointer border border-slate-200 flex items-center justify-center text-slate-600">
                      <Upload size={16} />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Checkboxes & Rating */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer font-black text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={docAvailableToday}
                    onChange={e => setDocAvailableToday(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>আজ চেম্বারে পাবেন (Available Today)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-black text-xs text-rose-700 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 shadow-2xs">
                  <input
                    type="checkbox"
                    checked={docIsVideoConsultant}
                    onChange={e => setDocIsVideoConsultant(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span>🔴 লাইভ ডক্টর (Video Call Icon & Badge)</span>
                </label>
              </div>
            </>
          )}

          {/* HOSPITAL FORM */}
          {type === 'hospital' && (
            <>
              <div>
                <label className="text-[11px] font-black uppercase text-slate-600 block mb-1">
                  হাসপাতাল / ক্লিনিকের নাম *
                </label>
                <input
                  type="text"
                  value={hospName}
                  onChange={e => setHospName(e.target.value)}
                  placeholder="যেমন: রংপুর সেন্ট্রাল হাসপাতাল & ডায়াগনস্টিক সেন্টার"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-blue-600 focus:bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-black uppercase text-slate-600 block mb-1">
                    জেলা / এলাকা (District/Area) *
                  </label>
                  <input
                    type="text"
                    value={hospDistrict}
                    onChange={e => setHospDistrict(e.target.value)}
                    placeholder="যেমন: রংপুর, নীলফামারী, ডোমার, ডিমলা"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-blue-600 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase text-slate-600 block mb-1">
                    পূর্ণাঙ্গ ঠিকানা (Address)
                  </label>
                  <input
                    type="text"
                    value={hospAddress}
                    onChange={e => setHospAddress(e.target.value)}
                    placeholder="যেমন: ধাপ, জেইল রোড, রংপুর"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-slate-600 block mb-1">
                  হাসপাতালের ছবি বা ছবি লিংক (Image URL)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={hospImageUrl}
                    onChange={e => setHospImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-blue-600 focus:bg-white"
                  />
                  <label className="bg-slate-100 hover:bg-slate-200 px-3 py-3 rounded-2xl cursor-pointer border border-slate-200 flex items-center justify-center text-slate-600">
                    <Upload size={16} />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </>
          )}

          {/* LAB TEST FORM */}
          {type === 'lab_test' && (
            <>
              <div>
                <label className="text-[11px] font-black uppercase text-slate-600 block mb-1">
                  ল্যাব টেস্টের নাম *
                </label>
                <input
                  type="text"
                  value={labName}
                  onChange={e => setLabName(e.target.value)}
                  placeholder="যেমন: USG of Whole Abdomen (সমগ্র পেটের আল্ট্রাসোনোগ্রাম)"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-blue-600 focus:bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-black uppercase text-slate-600 block mb-1">
                    ক্যাটাগরি নির্বাচন *
                  </label>
                  <select
                    value={labCategory}
                    onChange={e => setLabCategory(e.target.value as any)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-blue-600 focus:bg-white"
                  >
                    <option value="Pathology">🧪 প্যাথলজি ও রক্ত পরীক্ষা (Pathology)</option>
                    <option value="X-Ray">🩻 ডিজিটাল এক্স-রে (Digital X-Ray)</option>
                    <option value="Ultrasonogram">🖥️ আল্ট্রাসোনোগ্রাম / আল্ট্রা (USG)</option>
                    <option value="ECG & Echo">💓 ইসিজি ও ইকো (ECG & Echo)</option>
                    <option value="Other">অন্যান্য (Other)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase text-slate-600 block mb-1">
                    হাসপাতাল / ডায়াগনস্টিক সেন্টারের নাম
                  </label>
                  <input
                    type="text"
                    value={labHospitalName}
                    onChange={e => setLabHospitalName(e.target.value)}
                    placeholder="যেমন: JB Diagnostic Center"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-black uppercase text-slate-600 block mb-1">
                    রেগুলার টেস্ট মূল্য (BDT) *
                  </label>
                  <input
                    type="number"
                    value={labPrice}
                    onChange={e => setLabPrice(Number(e.target.value))}
                    placeholder="1000"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-blue-600 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase text-slate-600 block mb-1">
                    ডিসকাউন্ট বা অফার মূল্য (BDT - ঐচ্ছিক)
                  </label>
                  <input
                    type="number"
                    value={labDiscountPrice}
                    onChange={e => setLabDiscountPrice(e.target.value)}
                    placeholder="850"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-slate-600 block mb-1">
                  টেস্টের বিবরণ বা নির্দেশনা
                </label>
                <textarea
                  value={labDescription}
                  onChange={e => setLabDescription(e.target.value)}
                  placeholder="যেমন: খালি পেটে আসতে হবে অথবা ৪ গ্লাস পানি খেয়ে আসতে হবে"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-blue-600 focus:bg-white h-20 resize-none"
                />
              </div>

              {/* ON / OFF Switch */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
                <div>
                  <label className="text-xs font-black uppercase text-slate-700 block">
                    টেস্ট স্ট্যাটাস (Test Status: ON / OFF)
                  </label>
                  <p className="text-[11px] font-bold text-slate-400 mt-0.5">
                    ON থাকলে এটি ডায়াগনস্টিক তালিকায় সবার জন্য উন্মুক্ত থাকবে, OFF থাকলে লুকানো থাকবে।
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setLabIsActive(!labIsActive)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md shrink-0 active:scale-95 ${
                    labIsActive
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-rose-600 hover:bg-rose-700 text-white'
                  }`}
                >
                  {labIsActive ? '🟢 ON (চালু)' : '🔴 OFF (বন্ধ)'}
                </button>
              </div>
            </>
          )}

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-100 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-wider rounded-2xl transition-all"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-blue-200 active:scale-95 transition-all disabled:opacity-50"
            >
              {isProcessing ? 'সেভ হচ্ছে...' : '✓ সেভ করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
