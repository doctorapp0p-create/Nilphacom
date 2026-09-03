import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, FileText, Plus, Trash2, Send, Printer, 
  Download, Stethoscope, CheckCircle2, User, 
  Calendar, Phone, MapPin, Activity, ShieldCheck,
  AlertCircle, Sparkles, HeartPulse, Pill, Copy,
  Award, Eye, FileDown, Share2, Check, RefreshCw
} from 'lucide-react';
import { 
  Prescription, PrescriptionMedicine, 
  PrescriptionLabTestItem, Profile, Doctor, LabTest, UserRole 
} from '../../types';
import { db } from '../../services/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

interface DigitalPrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctorProfile?: Partial<Doctor> | Partial<Profile> | null;
  doctorInfo?: Partial<Doctor> | Partial<Profile> | null; // Alias support
  patientInfo?: {
    id?: string;
    onlineId?: string;
    patient_online_id?: string;
    name: string;
    phone?: string;
    age?: string;
    gender?: string;
    address?: string;
    appointmentId?: string;
    problems?: string;
    subscriptionCard?: string;
    subscriptionPlan?: string;
    has30Discount?: boolean;
  } | null;
  patientData?: any; // Alias support
  existingPrescription?: Prescription | null;
  labTestsList?: LabTest[];
  whatsappNumber?: string;
  onSuccess?: (pres: Prescription) => void;
  onPrescriptionSaved?: (pres: Prescription) => void; // Alias support
  readOnly?: boolean;
}

const COMMON_FREQUENCIES = [
  '১ + ০ + ১ (সকাল - রাত)',
  '১ + ১ + ১ (সকাল - দুপুর - রাত)',
  '১ + ০ + ০ (সকাল)',
  '০ + ০ + ১ (রাত)',
  '০ + ১ + ০ (দুপুর)',
  '১ + ১ + ০ (সকাল - দুপুর)',
  'প্রয়োজনে (SOS)',
  '১ চামচ করে দিনে ৩ বার',
  '২ ফোটা করে দিনে ৩ বার'
];

const COMMON_TIMINGS = [
  'খাবারের পরে',
  'খাবারের ৩০ মিনিট আগে',
  'খাবারের সাথে ভরা পেটে',
  'খাবারের ১ ঘণ্টা আগে',
  'ঘুমানোর আগে'
];

const COMMON_DURATIONS = [
  '৩ দিন',
  '৫ দিন',
  '৭ দিন',
  '১০ দিন',
  '১৪ দিন',
  '১ মাস',
  '২ মাস',
  'চলবে (পরবর্তী নির্দেশ না দেওয়া পর্যন্ত)'
];

const COMMON_ADVICES = [
  'পর্যাপ্ত পরিমাণে বিশুদ্ধ পানি ও তরল খাবার পান করুন।',
  'অতিরিক্ত তৈলাক্ত, ভাজাপোড়া ও মসলাযুক্ত খাবার পরিহার করুন।',
  'ধূমপান ও যেকোনো ধরনের তামাকজাত দ্রব্য বর্জন করুন।',
  'প্রতিদিন অন্তত ৩০ মিনিট হালকা হাঁটাচলা বা হালকা ব্যায়াম করুন।',
  'চিকিৎসকের পরামর্শ ছাড়া কোনো ওষুধ সেবন বন্ধ বা পরিবর্তন করবেন না।',
  'লবণ কম খাবেন এবং রক্তচাপ নিয়মিত পরিমাপ করুন।',
  'মিষ্টি ও অতিরিক্ত চিনিযুক্ত খাবার এড়িয়ে চলুন এবং রক্তের সুগার নিয়ন্ত্রণে রাখুন।',
  'পর্যাপ্ত বিশ্রাম ও ৭-৮ ঘণ্টা নিয়মিত ঘুম নিশ্চিত করুন।',
  'কোনো ধরনের তীব্র অস্বস্তি দেখা দিলে অবিলম্বে যোগাযোগ করুন।'
];

export const DigitalPrescriptionModal: React.FC<DigitalPrescriptionModalProps> = ({
  isOpen,
  onClose,
  doctorProfile,
  doctorInfo,
  patientInfo,
  patientData,
  existingPrescription,
  labTestsList = [],
  whatsappNumber = '8801352669100',
  onSuccess,
  onPrescriptionSaved,
  readOnly = false
}) => {
  // Resolve props aliasing
  const activeDoctor = doctorProfile || doctorInfo;
  const activePatient = patientInfo || patientData;
  const notifySaved = onSuccess || onPrescriptionSaved;

  // Doctor information
  const [docName, setDocName] = useState(
    existingPrescription?.doctor_name || 
    activeDoctor?.name || 
    (activeDoctor as Profile)?.full_name || 
    'ডা. বিশেষজ্ঞ চিকিৎসক'
  );
  const [docDegree, setDocDegree] = useState(
    existingPrescription?.doctor_degree || 
    activeDoctor?.degree || 
    'MBBS, BCS (Health), FCPS / MD'
  );
  const [docSpecialty, setDocSpecialty] = useState(
    existingPrescription?.doctor_specialty || 
    activeDoctor?.specialty || 
    'মেডিসিন ও স্বাস্থ্য বিশেষজ্ঞ'
  );
  const [docBmdc, setDocBmdc] = useState(
    existingPrescription?.doctor_bmdc_reg || 
    activeDoctor?.bmdcReg || 
    'A-10824 (BMDC)'
  );
  const [docHospital, setDocHospital] = useState(
    existingPrescription?.doctor_hospital || 
    activeDoctor?.chamber || 
    'জেবি হেলথকেয়ার ও নীলফামারী ডিজিটাল কনসালটেশন সেন্টার'
  );

  // Patient Online ID generator / retriever
  const generatePatientOnlineId = (patientObj: any, presObj: any) => {
    if (presObj?.patient_online_id) return presObj.patient_online_id;
    if (patientObj?.patient_online_id) return patientObj.patient_online_id;
    if (patientObj?.onlineId) return patientObj.onlineId;
    if (patientObj?.id && patientObj.id !== 'guest' && patientObj.id.length < 15) {
      return `PID-${patientObj.id.toUpperCase()}`;
    }
    if (patientObj?.phone) {
      const lastDigits = patientObj.phone.replace(/\D/g, '').slice(-5);
      return `PID-${lastDigits || '10824'}`;
    }
    return `PID-${Math.floor(10000 + Math.random() * 90000)}`;
  };

  const [patientOnlineId, setPatientOnlineId] = useState<string>(
    generatePatientOnlineId(activePatient, existingPrescription)
  );

  // Patient information
  const [pName, setPName] = useState(existingPrescription?.patient_name || activePatient?.name || '');
  const [pPhone, setPPhone] = useState(existingPrescription?.patient_phone || activePatient?.phone || '');
  const [pAge, setPAge] = useState(existingPrescription?.patient_age || activePatient?.age || '');
  const [pGender, setPGender] = useState<string>(existingPrescription?.patient_gender || activePatient?.gender || 'পুরুষ');
  const [pAddress, setPAddress] = useState(existingPrescription?.patient_address || activePatient?.address || '');
  const [pWeight, setPWeight] = useState(existingPrescription?.patient_weight || '৬৫ কেজি');
  const [pBp, setPBp] = useState(existingPrescription?.patient_bp || '১২০/৮০ mmHg');
  const [pPulse, setPPulse] = useState(existingPrescription?.patient_pulse || '৭৬ bpm');
  const [pTemp, setPTemp] = useState(existingPrescription?.patient_temp || '৯৮.৬°F');

  // Clinical data
  const [chiefComplaints, setChiefComplaints] = useState(
    existingPrescription?.chief_complaints || activePatient?.problems || 'জ্বর, মাথাব্যথা ও শারীরিক দুর্বলতা'
  );
  const [diagnosis, setDiagnosis] = useState(existingPrescription?.diagnosis || 'Acute Febrile Illness / Viral Syndrome');
  const [clinicalNotes, setClinicalNotes] = useState(existingPrescription?.clinical_notes || '');

  // Prescription list state
  const [medicines, setMedicines] = useState<PrescriptionMedicine[]>(
    existingPrescription?.medicines_list || [
      {
        id: '1',
        type: 'Tab',
        brandName: 'Napa Extra',
        genericName: 'Paracetamol + Caffeine',
        strength: '500mg+65mg',
        dosage: '১ + ০ + ১ (সকাল - রাত)',
        timing: 'খাবারের পরে',
        duration: '৫ দিন',
        instructions: 'জ্বর বা তীব্র ব্যথার জন্য ভরা পেটে খাবেন'
      },
      {
        id: '2',
        type: 'Cap',
        brandName: 'Sergel / Seclo',
        genericName: 'Esomeprazole / Omeprazole',
        strength: '20mg',
        dosage: '১ + ০ + ১ (সকাল - রাত)',
        timing: 'খাবারের ৩০ মিনিট আগে',
        duration: '১৪ দিন',
        instructions: 'খালি পেটে নিয়মিত খাবেন'
      },
      {
        id: '3',
        type: 'Tab',
        brandName: 'Fexo',
        genericName: 'Fexofenadine Hydrochloride',
        strength: '120mg',
        dosage: '০ + ০ + ১ (রাত)',
        timing: 'খাবারের পরে',
        duration: '৭ দিন',
        instructions: 'সর্দি ও এলার্জির জন্য রাতে খাবেন'
      }
    ]
  );

  // New single medicine input form
  const [newMed, setNewMed] = useState<Partial<PrescriptionMedicine>>({
    type: 'Tab',
    brandName: '',
    genericName: '',
    strength: '',
    dosage: '১ + ০ + ১ (সকাল - রাত)',
    timing: 'খাবারের পরে',
    duration: '৭ দিন',
    instructions: ''
  });

  // Recommended Tests
  const [selectedTests, setSelectedTests] = useState<PrescriptionLabTestItem[]>(
    (existingPrescription?.recommended_tests as PrescriptionLabTestItem[]) || [
      { id: '1', name: 'CBC with ESR', category: 'Hematology', discountEligible: true },
      { id: '2', name: 'RBS (Blood Sugar)', category: 'Biochemistry', discountEligible: true },
      { id: '3', name: 'Serum Creatinine', category: 'Renal', discountEligible: true }
    ]
  );
  const [customTestInput, setCustomTestInput] = useState('');

  // Advices
  const [advices, setAdvices] = useState<string[]>(
    existingPrescription?.advice_list || [
      'পর্যাপ্ত পরিমাণে বিশুদ্ধ পানি ও তরল খাবার পান করুন।',
      'অতিরিক্ত তৈলাক্ত, ভাজাপোড়া ও মসলাযুক্ত খাবার পরিহার করুন।',
      'চিকিৎসকের পরামর্শ ছাড়া কোনো ওষুধ সেবন বন্ধ বা পরিবর্তন করবেন না।',
      '৭ দিন পর টেস্ট রিপোর্টসহ পুনরায় চিকিৎসকের সাথে যোগাযোগ করুন।'
    ]
  );
  const [customAdvice, setCustomAdvice] = useState('');

  // Follow-up date
  const [nextVisit, setNextVisit] = useState(
    existingPrescription?.next_visit_date || '৭ দিন পর রিপোর্টসহ পুনরায় দেখাবেন'
  );

  // UI state
  const [previewMode, setPreviewMode] = useState(Boolean(existingPrescription || readOnly));
  const [isSaving, setIsSaving] = useState(false);
  const [savedPrescriptionCode, setSavedPrescriptionCode] = useState(
    existingPrescription?.prescription_code || `RX-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`
  );
  const [isCopied, setIsCopied] = useState(false);

  // Synchronize when existingPrescription or activePatient changes
  useEffect(() => {
    if (existingPrescription) {
      setDocName(existingPrescription.doctor_name || 'ডা. বিশেষজ্ঞ চিকিৎসক');
      setDocDegree(existingPrescription.doctor_degree || 'MBBS, BCS (Health), FCPS / MD');
      setDocSpecialty(existingPrescription.doctor_specialty || 'মেডিসিন ও স্বাস্থ্য বিশেষজ্ঞ');
      setDocBmdc(existingPrescription.doctor_bmdc_reg || 'A-10824 (BMDC)');
      setDocHospital(existingPrescription.doctor_hospital || 'জেবি হেলথকেয়ার ডিজিটাল কনসালটেশন');
      setPName(existingPrescription.patient_name || '');
      setPPhone(existingPrescription.patient_phone || '');
      setPAge(existingPrescription.patient_age || '');
      setPGender(existingPrescription.patient_gender || 'পুরুষ');
      setPAddress(existingPrescription.patient_address || '');
      setPWeight(existingPrescription.patient_weight || '৬৫ কেজি');
      setPBp(existingPrescription.patient_bp || '১২০/৮০ mmHg');
      setPPulse(existingPrescription.patient_pulse || '৭৬ bpm');
      setPTemp(existingPrescription.patient_temp || '৯৮.৬°F');
      setChiefComplaints(existingPrescription.chief_complaints || '');
      setDiagnosis(existingPrescription.diagnosis || '');
      setClinicalNotes(existingPrescription.clinical_notes || '');
      if (existingPrescription.medicines_list) setMedicines(existingPrescription.medicines_list);
      if (existingPrescription.recommended_tests) setSelectedTests(existingPrescription.recommended_tests as PrescriptionLabTestItem[]);
      if (existingPrescription.advice_list) setAdvices(existingPrescription.advice_list);
      if (existingPrescription.next_visit_date) setNextVisit(existingPrescription.next_visit_date);
      if (existingPrescription.prescription_code) setSavedPrescriptionCode(existingPrescription.prescription_code);
      if (existingPrescription.patient_online_id) setPatientOnlineId(existingPrescription.patient_online_id);
      setPreviewMode(true);
    } else if (activePatient) {
      setPName(activePatient.name || '');
      setPPhone(activePatient.phone || '');
      setPAge(activePatient.age || '');
      setPGender(activePatient.gender || 'পুরুষ');
      setPAddress(activePatient.address || '');
      if (activePatient.problems) setChiefComplaints(activePatient.problems);
      setPatientOnlineId(generatePatientOnlineId(activePatient, null));
      setSavedPrescriptionCode(`RX-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`);
      setPreviewMode(Boolean(readOnly));
    }
  }, [existingPrescription, activePatient, readOnly]);

  // Check subscription status
  const hasSubscription = Boolean(
    activePatient?.subscriptionCard || 
    activePatient?.has30Discount || 
    existingPrescription?.subscription_card_number ||
    existingPrescription?.has_discount_badge
  );
  const subscriptionCard = activePatient?.subscriptionCard || existingPrescription?.subscription_card_number;
  const subscriptionPlan = activePatient?.subscriptionPlan || existingPrescription?.subscription_plan_name || 'জেবি হেলথকেয়ার ৩০% টেস্ট ডিসকাউন্ট কার্ড';

  // Add Medicine
  const handleAddMedicine = () => {
    if (!newMed.brandName?.trim()) {
      alert('দয়া করে ওষুধের নাম লিখুন!');
      return;
    }
    const item: PrescriptionMedicine = {
      id: Date.now().toString(),
      type: newMed.type || 'Tab',
      brandName: newMed.brandName.trim(),
      genericName: newMed.genericName?.trim() || '',
      strength: newMed.strength?.trim() || '',
      dosage: newMed.dosage || '১ + ০ + ১ (সকাল - রাত)',
      timing: newMed.timing || 'খাবারের পরে',
      duration: newMed.duration || '৭ দিন',
      instructions: newMed.instructions?.trim() || ''
    };
    setMedicines([...medicines, item]);
    setNewMed({
      type: 'Tab',
      brandName: '',
      genericName: '',
      strength: '',
      dosage: '১ + ০ + ১ (সকাল - রাত)',
      timing: 'খাবারের পরে',
      duration: '৭ দিন',
      instructions: ''
    });
  };

  const handleRemoveMedicine = (id: string) => {
    setMedicines(medicines.filter(m => m.id !== id));
  };

  // Add Test
  const handleAddLabTest = (testName: string, category?: string) => {
    if (!testName.trim()) return;
    if (selectedTests.some(t => t.name.toLowerCase() === testName.trim().toLowerCase())) return;

    setSelectedTests([
      ...selectedTests,
      {
        id: Date.now().toString(),
        name: testName.trim(),
        category: category || 'Diagnostic Lab',
        discountEligible: true
      }
    ]);
    setCustomTestInput('');
  };

  const handleRemoveTest = (id: string) => {
    setSelectedTests(selectedTests.filter(t => t.id !== id));
  };

  // Toggle Advice
  const handleToggleAdvice = (adv: string) => {
    if (advices.includes(adv)) {
      setAdvices(advices.filter(a => a !== adv));
    } else {
      setAdvices([...advices, adv]);
    }
  };

  const handleAddCustomAdvice = () => {
    if (!customAdvice.trim()) return;
    if (!advices.includes(customAdvice.trim())) {
      setAdvices([...advices, customAdvice.trim()]);
    }
    setCustomAdvice('');
  };

  // Generate plain formatted text for WhatsApp
  const generatePrescriptionText = () => {
    const code = savedPrescriptionCode || `RX-${Date.now().toString().slice(-6)}`;
    let text = `🩺 *জেবি হেলথকেয়ার - অনলাইন ডিজিটাল প্রেসক্রিপশন*\n`;
    text += `📄 প্রেসক্রিপশন কোড: *${code}*\n`;
    text += `🆔 রোগীর অনলাইন আইডি: *${patientOnlineId}*\n`;
    text += `📅 তারিখ: ${new Date().toLocaleDateString('bn-BD')}\n`;
    text += `👨‍⚕️ চিকিৎসক: *${docName}* (${docSpecialty})\n`;
    text += `🏛️ প্রতিষ্ঠান/চেম্বার: ${docHospital} | Reg: ${docBmdc}\n`;
    text += `------------------------------------\n`;
    text += `👤 *রোগীর বিবরণ:*\n`;
    text += `• নাম: *${pName}*\n`;
    text += `• বয়স: ${pAge || 'N/A'} | লিঙ্গ: ${pGender}\n`;
    if (pPhone) text += `• মোবাইল: ${pPhone}\n`;
    if (pAddress) text += `• ঠিকানা: ${pAddress}\n`;
    if (pBp || pWeight) text += `• ভাইটালস: রক্তচাপ: ${pBp || 'N/A'}, ওজন: ${pWeight || 'N/A'}, নাড়ির স্পন্দন: ${pPulse || 'N/A'}\n`;
    if (chiefComplaints) text += `• প্রধান লক্ষণ/সমস্যা: ${chiefComplaints}\n`;
    if (diagnosis) text += `• ডায়াগনসিস (রোগের নাম): *${diagnosis}*\n`;
    
    if (hasSubscription) {
      text += `💳 *মেম্বারশিপ সুবিধা:* ${subscriptionPlan} (কার্ড: ${subscriptionCard || 'Active'})\n`;
      text += `✨ সকল ল্যাব টেস্টে ৩০% বিশেষ ছাড় প্রযোজ্য\n`;
    }
    
    text += `------------------------------------\n`;
    text += `💊 *ওষুধের তালিকা (Rx - Medicines):*\n`;
    medicines.forEach((m, idx) => {
      text += `${idx + 1}. *${m.type}. ${m.brandName}* ${m.strength ? '(' + m.strength + ')' : ''}\n`;
      text += `   👉 সেবনমাত্রা: *${m.dosage}*\n`;
      text += `   ⏰ সময়: ${m.timing} | মেয়াদ: ${m.duration}\n`;
      if (m.instructions) text += `   📝 বিশেষ নির্দেশ: ${m.instructions}\n`;
    });

    if (selectedTests.length > 0) {
      text += `------------------------------------\n`;
      text += `🔬 *প্রয়োজনীয় পরীক্ষা-নিরীক্ষা (Tests):*\n`;
      selectedTests.forEach((t, idx) => {
        text += `${idx + 1}. ${t.name}${hasSubscription ? ' (৩০% ডিসকাউন্ট প্রযোজ্য)' : ''}\n`;
      });
    }

    if (advices.length > 0) {
      text += `------------------------------------\n`;
      text += `📌 *পরামর্শ ও উপদেশ (Advice):*\n`;
      advices.forEach((adv, idx) => {
        text += `• ${adv}\n`;
      });
    }

    if (nextVisit) {
      text += `------------------------------------\n`;
      text += `🗓️ *পরবর্তী সাক্ষাত / ফলো-আপ:* ${nextVisit}\n`;
    }

    text += `------------------------------------\n`;
    text += `📞 অফিসিয়াল সেবা ও টেস্ট বুকিং হটলাইন: +8801352669100\n`;
    text += `🌐 জেবি হেলথকেয়ার (Nilpha.com) ডিজিটাল হেলথ পোর্টাল।`;

    return text;
  };

  // Generate and Download Authentic MS Word (.doc) Document
  const handleDownloadWord = () => {
    const code = savedPrescriptionCode || `RX-${Date.now().toString().slice(-6)}`;
    const dateStr = new Date().toLocaleDateString('bn-BD');

    const wordHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Prescription_${code}_${pName}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 20mm 15mm 20mm 15mm;
          }
          body {
            font-family: 'SolaimanLipi', 'Kalpurush', 'Nikosh', 'Arial Unicode MS', 'Segoe UI', Tahoma, sans-serif;
            color: #1e293b;
            background-color: #ffffff;
            margin: 0;
            padding: 10px;
          }
          .pres-container {
            border: 2px solid #2563eb;
            border-radius: 8px;
            padding: 24px;
            background: #ffffff;
            position: relative;
          }
          .header-table {
            width: 100%;
            border-collapse: collapse;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 12px;
            margin-bottom: 16px;
          }
          .header-doc-name {
            font-size: 20pt;
            font-weight: bold;
            color: #0f172a;
            margin: 0;
          }
          .header-doc-sub {
            font-size: 11pt;
            font-weight: bold;
            color: #2563eb;
            margin: 2px 0;
          }
          .header-doc-meta {
            font-size: 9pt;
            color: #64748b;
            margin: 0;
          }
          .brand-box {
            text-align: right;
            font-size: 9pt;
            color: #334155;
          }
          .patient-bar {
            width: 100%;
            border-collapse: collapse;
            background-color: #f1f5f9;
            border: 1px solid #cbd5e1;
            margin-bottom: 16px;
          }
          .patient-bar td {
            padding: 8px 12px;
            font-size: 10pt;
            vertical-align: top;
          }
          .label {
            font-size: 8pt;
            font-weight: bold;
            color: #64748b;
            text-transform: uppercase;
            display: block;
          }
          .val {
            font-size: 10pt;
            font-weight: bold;
            color: #0f172a;
          }
          .layout-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          .col-left {
            width: 32%;
            vertical-align: top;
            padding-right: 16px;
            border-right: 1px solid #cbd5e1;
          }
          .col-right {
            width: 68%;
            vertical-align: top;
            padding-left: 20px;
          }
          .section-title {
            font-size: 11pt;
            font-weight: bold;
            color: #1e3a8a;
            border-bottom: 1px solid #93c5fd;
            padding-bottom: 4px;
            margin-top: 12px;
            margin-bottom: 6px;
          }
          .rx-symbol {
            font-size: 26pt;
            font-style: italic;
            font-weight: bold;
            color: #059669;
            display: inline-block;
            margin-right: 8px;
          }
          .med-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
            margin-bottom: 16px;
          }
          .med-table th {
            background-color: #f8fafc;
            border-bottom: 2px solid #e2e8f0;
            padding: 6px;
            font-size: 9pt;
            text-align: left;
            color: #475569;
          }
          .med-table td {
            border-bottom: 1px solid #f1f5f9;
            padding: 8px 6px;
            font-size: 10pt;
            vertical-align: top;
          }
          .med-brand {
            font-weight: bold;
            color: #0f172a;
            font-size: 11pt;
          }
          .med-dosage {
            font-weight: bold;
            color: #047857;
            font-size: 10pt;
          }
          .advice-box {
            background-color: #fffbeb;
            border: 1px solid #fde68a;
            border-radius: 6px;
            padding: 10px;
            margin-top: 14px;
          }
          .advice-list {
            margin: 4px 0 0 16px;
            padding: 0;
            font-size: 9.5pt;
            color: #334155;
          }
          .footer-sign-table {
            width: 100%;
            margin-top: 30px;
            border-collapse: collapse;
          }
          .signature-box {
            text-align: right;
            width: 220px;
            float: right;
            border-top: 1px solid #64748b;
            padding-top: 6px;
            font-size: 9pt;
          }
          .watermark-text {
            color: #cbd5e1;
            font-size: 38pt;
            font-weight: bold;
            text-align: center;
            letter-spacing: 4px;
            margin: 20px 0;
            text-transform: uppercase;
          }
        </style>
      </head>
      <body>
        <div class="pres-container">
          <!-- Top Header Table -->
          <table class="header-table">
            <tr>
              <td style="vertical-align: middle;">
                <p class="header-doc-name">${docName}</p>
                <p class="header-doc-sub">${docDegree} • ${docSpecialty}</p>
                <p class="header-doc-meta">🏛️ ${docHospital} | BMDC Reg: <strong>${docBmdc}</strong></p>
              </td>
              <td class="brand-box" style="vertical-align: middle;">
                <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 8px 12px; border-radius: 6px; display: inline-block;">
                  <strong style="color: #1d4ed8; font-size: 11pt;">জেবি হেলথকেয়ার ডিজিটাল প্রেসক্রিপশন</strong><br/>
                  <span>কোড: <strong>${code}</strong></span><br/>
                  <span>রোগীর অনলাইন আইডি: <strong>${patientOnlineId}</strong></span><br/>
                  <span>তারিখ: ${dateStr}</span><br/>
                  <span style="color: #059669; font-weight: bold;">হটলাইন: +8801352669100</span>
                </div>
              </td>
            </tr>
          </table>

          <!-- Patient Information Bar -->
          <table class="patient-bar">
            <tr>
              <td width="30%">
                <span class="label">রোগীর নাম (Patient Name):</span>
                <span class="val">${pName || 'নাম উল্লেখ নেই'}</span>
              </td>
              <td width="20%">
                <span class="label">বয়স ও লিঙ্গ (Age & Gender):</span>
                <span class="val">${pAge || 'N/A'} • ${pGender}</span>
              </td>
              <td width="25%">
                <span class="label">অনলাইন আইডি / মোবাইল:</span>
                <span class="val">${patientOnlineId} | ${pPhone || 'N/A'}</span>
              </td>
              <td width="25%">
                <span class="label">ভাইটালস (Vitals):</span>
                <span class="val">BP: ${pBp} | Wt: ${pWeight}</span>
              </td>
            </tr>
          </table>

          ${hasSubscription ? `
            <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 6px 12px; margin-bottom: 12px; border-radius: 4px; font-size: 9.5pt; color: #065f46; font-weight: bold;">
              ⭐ ${subscriptionPlan} (কার্ড: ${subscriptionCard || 'Active'}) — সকল টেস্টে ৩০% বিশেষ ছাড় প্রযোজ্য।
            </div>
          ` : ''}

          <!-- Main 2-Column Clinical Layout -->
          <table class="layout-table">
            <tr>
              <!-- Left Column: Complaints, Diagnosis, Tests -->
              <td class="col-left">
                ${chiefComplaints ? `
                  <div class="section-title">CHIEF COMPLAINTS</div>
                  <p style="font-size: 9.5pt; font-weight: bold; color: #334155; margin: 4px 0 12px 0;">${chiefComplaints}</p>
                ` : ''}

                ${diagnosis ? `
                  <div class="section-title">DIAGNOSIS (C/D)</div>
                  <p style="font-size: 10pt; font-weight: bold; color: #1e3a8a; background-color: #eff6ff; padding: 6px; border-radius: 4px; margin: 4px 0 12px 0;">${diagnosis}</p>
                ` : ''}

                ${selectedTests.length > 0 ? `
                  <div class="section-title">INVESTIGATIONS (ল্যাব টেস্ট)</div>
                  <ol style="margin: 4px 0 12px 18px; padding: 0; font-size: 9.5pt; font-weight: bold; color: #334155;">
                    ${selectedTests.map(t => `<li>${t.name} ${hasSubscription ? '<span style="color:#059669; font-size:8pt;">(৩০% ছাড়)</span>' : ''}</li>`).join('')}
                  </ol>
                ` : ''}

                <div class="section-title">VITALS & EXAM</div>
                <p style="font-size: 9pt; color: #475569; margin: 4px 0;">
                  • রক্তচাপ (BP): <strong>${pBp}</strong><br/>
                  • ওজন (Weight): <strong>${pWeight}</strong><br/>
                  • নাড়ির গতি (Pulse): <strong>${pPulse}</strong><br/>
                  • তাপমাত্রা (Temp): <strong>${pTemp}</strong>
                </p>
                ${pAddress ? `<p style="font-size: 8.5pt; color: #64748b; margin-top: 8px;">📍 ঠিকানা: ${pAddress}</p>` : ''}
              </td>

              <!-- Right Column: Rx Medicines & Advice -->
              <td class="col-right">
                <div style="border-bottom: 2px solid #059669; padding-bottom: 4px; margin-bottom: 8px;">
                  <span class="rx-symbol">℞</span>
                  <span style="font-size: 11pt; font-weight: bold; color: #0f172a; text-transform: uppercase;">Medications (ওষুধের তালিকা)</span>
                </div>

                <table class="med-table">
                  <thead>
                    <tr>
                      <th width="8%">#</th>
                      <th width="42%">ওষুধের নাম ও উপাদান</th>
                      <th width="28%">সেবনমাত্রা (Dosage)</th>
                      <th width="22%">সময় ও স্থায়িত্ব</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${medicines.map((m, idx) => `
                      <tr>
                        <td><strong>${idx + 1}.</strong></td>
                        <td>
                          <span class="med-brand">${m.type}. ${m.brandName}</span> ${m.strength ? `(${m.strength})` : ''}
                          ${m.genericName ? `<br/><span style="font-size: 8pt; color: #64748b;">${m.genericName}</span>` : ''}
                          ${m.instructions ? `<br/><span style="font-size: 8.5pt; color: #b45309; font-style: italic;">📝 ${m.instructions}</span>` : ''}
                        </td>
                        <td>
                          <span class="med-dosage">${m.dosage}</span>
                        </td>
                        <td style="font-size: 9pt;">
                          <span>${m.timing}</span><br/>
                          <strong style="color: #1e293b;">(${m.duration})</strong>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>

                ${advices.length > 0 ? `
                  <div class="advice-box">
                    <strong style="color: #92400e; font-size: 10pt;">📌 পরামর্শ ও নিয়মাবলী (Advice):</strong>
                    <ul class="advice-list">
                      ${advices.map(a => `<li>${a}</li>`).join('')}
                    </ul>
                  </div>
                ` : ''}

                ${nextVisit ? `
                  <div style="margin-top: 12px; background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 6px 10px; border-radius: 4px; font-size: 9.5pt;">
                    <strong>🗓️ পরবর্তী সাক্ষাত (Follow-up):</strong> ${nextVisit}
                  </div>
                ` : ''}

                <!-- Signature Table -->
                <table class="footer-sign-table">
                  <tr>
                    <td width="50%">
                      <span style="font-size: 8pt; color: #94a3b8;">JB Healthcare Digital Signature Verified • System Authenticated</span>
                    </td>
                    <td width="50%" align="right">
                      <div class="signature-box">
                        <strong style="font-size: 10pt; color: #0f172a;">${docName}</strong><br/>
                        <span style="font-size: 8pt; color: #475569;">${docSpecialty}</span><br/>
                        <span style="font-size: 7.5pt; color: #059669; font-weight: bold;">Digital Prescription Validated</span>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <div class="watermark-text">JB HEALTHCARE • NILPHA</div>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', wordHtml], {
      type: 'application/msword;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `Prescription_${patientOnlineId}_${pName || 'Patient'}_${code}.doc`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
  };

  // Save to database
  const handleSavePrescription = async () => {
    if (!pName.trim()) {
      alert('রোগীর নাম আবশ্যক!');
      return;
    }
    if (medicines.length === 0) {
      alert('অন্তত একটি ওষুধ যোগ করুন!');
      return;
    }

    setIsSaving(true);
    const code = savedPrescriptionCode || `RX-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;

    const presData: any = {
      prescription_code: code,
      patient_online_id: patientOnlineId,
      patient_id: activePatient?.id || 'guest',
      patient_name: pName.trim(),
      patient_phone: pPhone.trim(),
      patient_age: pAge.trim(),
      patient_gender: pGender,
      patient_address: pAddress.trim(),
      patient_weight: pWeight,
      patient_bp: pBp,
      patient_pulse: pPulse,
      patient_temp: pTemp,
      chief_complaints: chiefComplaints.trim(),
      diagnosis: diagnosis.trim(),
      clinical_notes: clinicalNotes.trim(),
      doctor_id: (activeDoctor as any)?.id || 'online_doc',
      doctor_name: docName,
      doctor_degree: docDegree,
      doctor_specialty: docSpecialty,
      doctor_bmdc_reg: docBmdc,
      doctor_hospital: docHospital,
      doctor_phone: whatsappNumber,
      medicines_list: medicines,
      medicines: medicines.map(m => `${m.type}. ${m.brandName} (${m.dosage}, ${m.timing}, ${m.duration})`).join(', '),
      recommended_tests: selectedTests,
      advice_list: advices,
      notes: clinicalNotes || 'ডিজিটাল প্রেসক্রিপশন সংরক্ষিত',
      next_visit_date: nextVisit,
      subscription_card_number: subscriptionCard || '',
      subscription_plan_name: subscriptionPlan || '',
      has_discount_badge: hasSubscription,
      created_at: existingPrescription?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      if (existingPrescription?.id) {
        await updateDoc(doc(db, 'prescriptions', existingPrescription.id), presData);
        setSavedPrescriptionCode(code);
      } else {
        const ref = await addDoc(collection(db, 'prescriptions'), {
          ...presData,
          created_at_server: serverTimestamp()
        });
        presData.id = ref.id;
        setSavedPrescriptionCode(code);

        // If linked to an appointment, mark appointment as visited / prescription linked
        if (activePatient?.appointmentId) {
          try {
            await updateDoc(doc(db, 'appointments', activePatient.appointmentId), {
              prescription_id: ref.id,
              status: 'visited',
              has_prescription: true
            });
          } catch (e) {
            console.warn('Appointment update notice:', e);
          }
        }
      }

      setIsSaving(false);
      alert(`✓ প্রেসক্রিপশন সফলভাবে সংরক্ষণ করা হয়েছে! (অনলাইন আইডি: ${patientOnlineId} | কোড: ${code})`);
      if (notifySaved) {
        notifySaved({ id: existingPrescription?.id || 'saved', ...presData });
      }
      setPreviewMode(true);
    } catch (err: any) {
      console.error('Error saving prescription:', err);
      setIsSaving(false);
      alert('প্রেসক্রিপশন সেভ করতে সমস্যা হয়েছে: ' + err.message);
    }
  };

  // WhatsApp send handler
  const handleSendToPatientWhatsApp = () => {
    const rawTargetPhone = pPhone || activePatient?.phone || '';
    const cleanPhone = rawTargetPhone.replace(/\D/g, '');
    let dest = cleanPhone;
    if (dest.startsWith('0')) {
      dest = '88' + dest;
    } else if (dest && !dest.startsWith('88')) {
      dest = '880' + dest;
    }

    const text = generatePrescriptionText();
    const encoded = encodeURIComponent(text);

    // If patient phone is valid, send to patient; else send to official WhatsApp
    const targetUrl = dest.length >= 10
      ? `https://wa.me/${dest}?text=${encoded}`
      : `https://wa.me/${whatsappNumber}?text=${encoded}`;

    window.open(targetUrl, '_blank');
  };

  // Copy text handler
  const handleCopyText = () => {
    const text = generatePrescriptionText();
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  // Print handler
  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* Global Print Stylesheet to guarantee pristine print output */}
        <style dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body * {
                visibility: hidden;
              }
              #printable-prescription, #printable-prescription * {
                visibility: visible;
              }
              #printable-prescription {
                position: absolute;
                left: 0;
                top: 0;
                width: 100% !important;
                margin: 0 !important;
                padding: 15mm !important;
                border: 2px solid #2563eb !important;
                box-shadow: none !important;
                background: #ffffff !important;
                color: #0f172a !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `
        }} />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] z-10 text-left my-auto"
        >
          {/* Top Modal Header Bar */}
          <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md">
                <Stethoscope size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                    {previewMode ? '🩺 অফিসিয়াল ডিজিটাল প্রেসক্রিপশন ভিউ' : '📝 ডিজিটাল প্রেসক্রিপশন এডিটর (Doctor Pad)'}
                  </h2>
                  <span className="bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-black px-2.5 py-0.5 rounded-full font-mono">
                    ID: {patientOnlineId}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-bold">
                  {docName} • {docSpecialty}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => setPreviewMode(!previewMode)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border ${
                    previewMode
                      ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <Eye size={14} />
                  {previewMode ? 'এডিট করুন' : 'প্রেসক্রিপশন প্রিভিউ'}
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50">
            {!previewMode && !readOnly ? (
              /* DOCTOR WRITING & EDITING FORM */
              <div className="space-y-6">
                {/* 1. Patient & Vitals Information Box */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <User size={16} className="text-blue-600" /> ১. রোগীর তথ্য ও প্রাথমিক ভাইটালস
                    </h3>
                    <span className="text-[10px] font-black bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-mono">
                      অনলাইন আইডি: {patientOnlineId}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase">রোগীর পূর্ণ নাম *</label>
                      <input
                        type="text"
                        value={pName}
                        onChange={(e) => setPName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                        placeholder="রোগীর নাম লিখুন"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase">মোবাইল নম্বর</label>
                      <input
                        type="tel"
                        value={pPhone}
                        onChange={(e) => setPPhone(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 font-mono"
                        placeholder="০১XXXXXXXXX"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase">বয়স</label>
                      <input
                        type="text"
                        value={pAge}
                        onChange={(e) => setPAge(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                        placeholder="যেমন: ৩২ বছর"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase">লিঙ্গ</label>
                      <select
                        value={pGender}
                        onChange={(e) => setPGender(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                      >
                        <option value="পুরুষ">পুরুষ</option>
                        <option value="মহিলা">মহিলা</option>
                        <option value="শিশু">শিশু</option>
                        <option value="অন্যান্য">অন্যান্য</option>
                      </select>
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase">ঠিকানা</label>
                      <input
                        type="text"
                        value={pAddress}
                        onChange={(e) => setPAddress(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                        placeholder="গ্রাম/মহল্লা, উপজেলা, জেলা"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase">রক্তচাপ (BP)</label>
                      <input
                        type="text"
                        value={pBp}
                        onChange={(e) => setPBp(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                        placeholder="120/80 mmHg"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase">ওজন (Weight)</label>
                      <input
                        type="text"
                        value={pWeight}
                        onChange={(e) => setPWeight(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                        placeholder="৬৫ কেজি"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Clinical Diagnosis & Chief Complaints */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Activity size={16} className="text-indigo-600" /> ২. লক্ষণ ও ডায়াগনসিস (Symptoms & Diagnosis)
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase">Chief Complaints (রোগীর প্রধান সমস্যা)</label>
                      <textarea
                        rows={2}
                        value={chiefComplaints}
                        onChange={(e) => setChiefComplaints(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                        placeholder="যেমন: ৩ দিন ধরে তীব্র জ্বর, শুকনো কাশি ও শরীর ব্যথা..."
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase">Clinical Diagnosis (রোগের বিবরণ / Diagnosis) *</label>
                      <textarea
                        rows={2}
                        value={diagnosis}
                        onChange={(e) => setDiagnosis(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-indigo-900 font-black outline-none focus:border-indigo-500"
                        placeholder="যেমন: Acute Upper Respiratory Tract Infection (URTI)"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Rx Medications Form */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <Pill size={16} className="text-emerald-600" /> ৩. ওষুধের তালিকা (Rx Medications - {medicines.length})
                    </h3>
                  </div>

                  {/* Add New Medicine Form Grid */}
                  <div className="bg-emerald-50/50 border border-emerald-200/70 rounded-2xl p-4 space-y-3">
                    <p className="text-[11px] font-black text-emerald-900 uppercase">নতুন ওষুধ যোগ করুন:</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-xs">
                      <div>
                        <label className="text-[9px] font-black text-slate-500 uppercase">টাইপ</label>
                        <select
                          value={newMed.type}
                          onChange={(e) => setNewMed({ ...newMed, type: e.target.value as any })}
                          className="w-full bg-white border border-emerald-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800"
                        >
                          <option value="Tab">Tab (ট্যাবলেট)</option>
                          <option value="Cap">Cap (ক্যাপসুল)</option>
                          <option value="Syr">Syr (সিরাপ)</option>
                          <option value="Inj">Inj (ইনজেকশন)</option>
                          <option value="Drop">Drop (ড্রপ)</option>
                          <option value="Oint">Oint (মলম)</option>
                          <option value="Inhaler">Inhaler</option>
                          <option value="Supp">Suppository</option>
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className="text-[9px] font-black text-slate-500 uppercase">ওষুধের নাম (Brand Name) *</label>
                        <input
                          type="text"
                          value={newMed.brandName}
                          onChange={(e) => setNewMed({ ...newMed, brandName: e.target.value })}
                          className="w-full bg-white border border-emerald-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                          placeholder="যেমন: Napa Extra, Seclo, Monas"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] font-black text-slate-500 uppercase">পাওয়ার (Strength)</label>
                        <input
                          type="text"
                          value={newMed.strength}
                          onChange={(e) => setNewMed({ ...newMed, strength: e.target.value })}
                          className="w-full bg-white border border-emerald-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800"
                          placeholder="500mg / 20mg"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] font-black text-slate-500 uppercase">ডোজ (Dosage)</label>
                        <select
                          value={newMed.dosage}
                          onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                          className="w-full bg-white border border-emerald-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800"
                        >
                          {COMMON_FREQUENCIES.map(f => (
                            <option key={f} value={f}>{f}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[9px] font-black text-slate-500 uppercase">কখন খাবেন</label>
                        <select
                          value={newMed.timing}
                          onChange={(e) => setNewMed({ ...newMed, timing: e.target.value })}
                          className="w-full bg-white border border-emerald-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800"
                        >
                          {COMMON_TIMINGS.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[9px] font-black text-slate-500 uppercase">স্থায়িত্ব (Duration)</label>
                        <select
                          value={newMed.duration}
                          onChange={(e) => setNewMed({ ...newMed, duration: e.target.value })}
                          className="w-full bg-white border border-emerald-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800"
                        >
                          {COMMON_DURATIONS.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className="text-[9px] font-black text-slate-500 uppercase">বিশেষ নির্দেশ (ঐচ্ছিক)</label>
                        <input
                          type="text"
                          value={newMed.instructions}
                          onChange={(e) => setNewMed({ ...newMed, instructions: e.target.value })}
                          className="w-full bg-white border border-emerald-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                          placeholder="যেমন: জ্বর আসলে খাবেন / ভরা পেটে খাবেন"
                        />
                      </div>

                      <div className="col-span-2 sm:col-span-1 flex items-end">
                        <button
                          type="button"
                          onClick={handleAddMedicine}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-2.5 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1"
                        >
                          <Plus size={16} /> যোগ করুন
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Added Medicines List */}
                  <div className="space-y-2 pt-2">
                    {medicines.map((m, idx) => (
                      <div
                        key={m.id}
                        className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-[10px]">
                              {idx + 1}
                            </span>
                            <span className="font-black text-emerald-800 uppercase">{m.type}.</span>
                            <span className="font-black text-slate-900 text-sm">{m.brandName}</span>
                            {m.strength && <span className="text-slate-500 font-bold">({m.strength})</span>}
                          </div>
                          <p className="text-slate-600 font-bold pl-7 text-[11px]">
                            👉 <span className="text-emerald-700 font-black">{m.dosage}</span> • {m.timing} • <span className="text-blue-700">({m.duration})</span>
                            {m.instructions && <span className="text-amber-700 font-semibold ml-2">[{m.instructions}]</span>}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveMedicine(m.id)}
                          className="text-rose-500 hover:text-rose-700 p-2 rounded-xl hover:bg-rose-50 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Investigations / Lab Tests */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <HeartPulse size={16} className="text-purple-600" /> ৪. প্রয়োজনীয় টেস্ট ও পরীক্ষা (Investigations)
                    </h3>
                  </div>

                  {/* Quick Select Popular Tests */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase">জনপ্রিয় পরীক্ষা থেকে ক্লিক করে যোগ করুন:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'CBC with ESR', 'RBS (Blood Sugar)', 'Serum Creatinine', 
                        'Lipid Profile', 'SGPT (ALT)', 'Urine R/M/E', 
                        'Serum Bilirubin', 'USG of Whole Abdomen', 
                        'Chest X-Ray P/A View', 'ECG (12 Lead)', 'HbA1c', 'Thyroid (TSH)'
                      ].map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => handleAddLabTest(t)}
                          className="text-[10px] font-bold bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 px-2.5 py-1 rounded-lg transition-all"
                        >
                          + {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Selected Tests List */}
                  {selectedTests.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                      {selectedTests.map(t => (
                        <div
                          key={t.id}
                          className="bg-purple-50/40 border border-purple-200 rounded-xl p-2.5 flex items-center justify-between text-xs font-bold text-purple-950"
                        >
                          <div className="flex items-center gap-2">
                            <CheckCircle2 size={14} className="text-purple-600" />
                            <span>{t.name}</span>
                            {hasSubscription && (
                              <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-1.5 py-0.5 rounded">
                                ৩০% ছাড়
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveTest(t.id)}
                            className="text-rose-500 hover:text-rose-700 p-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 5. Advice & Next Visit */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <AlertCircle size={16} className="text-amber-600" /> ৫. সাধারণ উপদেশ ও নিয়মাবলী (Advice)
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {COMMON_ADVICES.map(adv => {
                      const isSelected = advices.includes(adv);
                      return (
                        <button
                          key={adv}
                          type="button"
                          onClick={() => handleToggleAdvice(adv)}
                          className={`text-left p-2.5 rounded-xl text-xs font-bold border transition-all flex items-start gap-2 ${
                            isSelected 
                              ? 'bg-amber-500 text-white border-amber-600 shadow-sm' 
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-amber-300'
                          }`}
                        >
                          <CheckCircle2 size={16} className={`shrink-0 mt-0.5 ${isSelected ? 'text-white' : 'text-slate-300'}`} />
                          <span className="leading-snug">{adv}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase">পরবর্তী সাক্ষাত (Next Visit / Follow-up)</label>
                    <input
                      type="text"
                      value={nextVisit}
                      onChange={(e) => setNextVisit(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 mt-1"
                      placeholder="যেমন: ৭ দিন পর রিপোর্টসহ পুনরায় দেখাবেন"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* AUTHENTIC DOCTOR PRESCRIPTION VIEW WITH OFFICIAL WATERMARK */
              <div 
                id="printable-prescription" 
                className="relative bg-white border-2 border-blue-600 rounded-3xl p-6 sm:p-10 shadow-xl space-y-6 text-slate-800 overflow-hidden"
              >
                {/* Official Background Watermark */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04] select-none z-0">
                  <div className="text-center space-y-4">
                    <div className="w-80 h-80 rounded-full border-[18px] border-blue-900 mx-auto flex items-center justify-center">
                      <span className="text-9xl font-black text-blue-950 italic">Rx</span>
                    </div>
                    <p className="text-4xl font-black tracking-widest text-slate-900 uppercase">
                      JB HEALTHCARE • NILPHA
                    </p>
                  </div>
                </div>

                {/* Top Doctor Pad Letterhead Banner */}
                <div className="relative z-10 border-b-2 border-blue-600 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-2xl shadow-md">
                        Rx
                      </div>
                      <div>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                          {docName}
                        </h2>
                        <p className="text-xs sm:text-sm font-black text-blue-600">
                          {docDegree} • {docSpecialty}
                        </p>
                      </div>
                    </div>
                    <div className="text-[11px] font-bold text-slate-500 mt-2 space-y-0.5">
                      <p>🏛️ {docHospital}</p>
                      <p>🔖 BMDC Reg Number: <strong className="text-slate-800">{docBmdc}</strong></p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right space-y-1 bg-blue-50/70 p-3.5 rounded-2xl border border-blue-200">
                    <p className="text-[10px] font-black text-blue-800 uppercase tracking-wider">
                      জেবি হেলথকেয়ার ডিজিটাল প্রেসক্রিপশন
                    </p>
                    <p className="text-xs font-black text-slate-900 font-mono">
                      প্রেসক্রিপশন কোড: {savedPrescriptionCode}
                    </p>
                    <p className="text-xs font-black text-indigo-900 font-mono">
                      রোগীর অনলাইন আইডি: {patientOnlineId}
                    </p>
                    <p className="text-[10px] font-bold text-slate-600">
                      তারিখ: {new Date().toLocaleDateString('bn-BD')}
                    </p>
                    <p className="text-[10px] font-black text-emerald-700">
                      জরুরি হেল্পলাইন: +8801352669100
                    </p>
                  </div>
                </div>

                {/* Patient Information Bar */}
                <div className="relative z-10 bg-slate-50 border border-slate-200 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-black uppercase block">রোগীর নাম:</span>
                    <span className="font-black text-slate-900 text-sm">{pName || 'নাম উল্লেখ নেই'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-black uppercase block">অনলাইন আইডি ও ফোন:</span>
                    <span className="font-bold text-slate-900 font-mono">{patientOnlineId} | {pPhone || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-black uppercase block">বয়স ও লিঙ্গ:</span>
                    <span className="font-bold text-slate-800">{pAge || 'N/A'} • {pGender}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-black uppercase block">ভাইটালস (Vitals):</span>
                    <span className="font-bold text-slate-800">BP: {pBp} | Wt: {pWeight}</span>
                  </div>
                </div>

                {hasSubscription && (
                  <div className="relative z-10 bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex items-center justify-between text-xs">
                    <span className="font-black text-emerald-800 flex items-center gap-1.5">
                      ⭐ ৩০% ল্যাব টেস্ট ডিসকাউন্ট সাবস্ক্রিপশন কার্ডধারী
                    </span>
                    <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-mono">
                      কার্ড: {subscriptionCard || 'Active Membership'}
                    </span>
                  </div>
                )}

                {/* 2-Column Clinical Layout */}
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                  {/* Left Column: Complaints, Diagnosis, Tests, Vitals */}
                  <div className="md:col-span-1 space-y-5 border-b md:border-b-0 md:border-r border-slate-200 pb-5 md:pb-0 md:pr-4">
                    {chiefComplaints && (
                      <div className="space-y-1">
                        <h4 className="text-[11px] font-black text-blue-900 uppercase tracking-wider">
                          Chief Complaints:
                        </h4>
                        <p className="text-xs font-bold text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          {chiefComplaints}
                        </p>
                      </div>
                    )}

                    {diagnosis && (
                      <div className="space-y-1">
                        <h4 className="text-[11px] font-black text-indigo-900 uppercase tracking-wider">
                          Diagnosis (C/D):
                        </h4>
                        <p className="text-xs font-black text-indigo-950 bg-indigo-50 p-2.5 rounded-xl border border-indigo-100">
                          {diagnosis}
                        </p>
                      </div>
                    )}

                    {selectedTests.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-[11px] font-black text-purple-900 uppercase tracking-wider flex items-center justify-between">
                          <span>Investigations:</span>
                          {hasSubscription && <span className="text-[9px] text-emerald-600 font-bold">৩০% ছাড়</span>}
                        </h4>
                        <ul className="space-y-1.5 text-xs font-bold text-slate-700">
                          {selectedTests.map((t, idx) => (
                            <li key={t.id} className="flex items-start gap-1.5 bg-purple-50/50 p-2 rounded-lg border border-purple-100">
                              <span className="text-purple-600 font-black">{idx + 1}.</span>
                              <span>{t.name}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 font-bold">
                      <p className="text-[10px] font-black uppercase text-slate-400 mb-1">শারীরিক পরীক্ষা (On Exam)</p>
                      <p>• রক্তচাপ: <strong className="text-slate-800">{pBp}</strong></p>
                      <p>• ওজন: <strong className="text-slate-800">{pWeight}</strong></p>
                      <p>• নাড়ির গতি: <strong className="text-slate-800">{pPulse}</strong></p>
                      <p>• শরীরের তাপমাত্রা: <strong className="text-slate-800">{pTemp}</strong></p>
                      {pAddress && <p className="pt-1 text-[10px] text-slate-400">📍 {pAddress}</p>}
                    </div>
                  </div>

                  {/* Right Column: Rx Medications & Advices */}
                  <div className="md:col-span-2 space-y-6 md:pl-2">
                    <div className="flex items-center gap-2 border-b-2 border-emerald-500 pb-2">
                      <span className="text-3xl font-black text-emerald-600 italic">℞</span>
                      <span className="text-xs font-black text-slate-800 uppercase tracking-widest">
                        Medications / ওষুধের তালিকা
                      </span>
                    </div>

                    <div className="space-y-4">
                      {medicines.map((m, idx) => (
                        <div key={m.id} className="space-y-1 border-b border-slate-100 pb-3">
                          <div className="flex items-baseline gap-2">
                            <span className="font-black text-sm text-slate-900">{idx + 1}.</span>
                            <span className="font-black text-xs text-emerald-700 uppercase">{m.type}.</span>
                            <span className="font-black text-base text-slate-900">{m.brandName}</span>
                            {m.strength && <span className="text-xs font-bold text-slate-500">({m.strength})</span>}
                          </div>
                          <div className="pl-6 text-xs font-bold text-slate-600 space-y-0.5">
                            <p className="text-emerald-800 font-black text-sm">
                              👉 {m.dosage} ---------------- ({m.duration})
                            </p>
                            <p className="text-slate-500 text-xs">
                              ⏰ {m.timing} {m.instructions && `| 📝 ${m.instructions}`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {advices.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider">
                          পরামর্শ ও নিয়মাবলী (Advice):
                        </h4>
                        <ul className="space-y-1 text-xs font-bold text-slate-700 bg-amber-50/50 p-3.5 rounded-2xl border border-amber-100">
                          {advices.map((adv, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-amber-600 font-black">•</span>
                              <span>{adv}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {nextVisit && (
                      <div className="bg-blue-50/60 p-3 rounded-xl text-xs font-bold text-slate-700 border border-blue-200">
                        <span className="text-blue-700 font-black">🗓️ পরবর্তী সাক্ষাত (Follow-up):</span> {nextVisit}
                      </div>
                    )}

                    {/* Verified Digital Signature Stamp Area */}
                    <div className="pt-8 flex justify-between items-end border-t border-slate-200">
                      <div className="text-[9px] font-bold text-slate-400 space-y-0.5">
                        <p>✓ JB Healthcare Verified Digital Pad</p>
                        <p>অনলাইন যাচাই কোড: {savedPrescriptionCode}</p>
                      </div>

                      <div className="text-center space-y-1 min-w-[200px] border-t-2 border-slate-600 pt-2">
                        <p className="font-black text-xs text-slate-900">{docName}</p>
                        <p className="text-[10px] font-bold text-blue-600">{docSpecialty}</p>
                        <p className="text-[9px] font-black text-emerald-700 uppercase tracking-wider">Digital Signature Verified ✓</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Action Controls */}
          <div className="bg-slate-100 border-t border-slate-200 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handlePrint}
                className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-black text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-2xs active:scale-95"
              >
                <Printer size={15} /> প্রিন্ট / PDF
              </button>

              <button
                type="button"
                onClick={handleDownloadWord}
                className="bg-blue-700 hover:bg-blue-800 text-white font-black text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95"
              >
                <FileDown size={15} /> Word (.doc) ফাইল ডাউনলোড
              </button>

              <button
                type="button"
                onClick={handleCopyText}
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-black text-xs px-3 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-2xs"
              >
                <Copy size={15} /> {isCopied ? 'কপি হয়েছে ✓' : 'টেক্সট কপি'}
              </button>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {!readOnly && (
                <button
                  type="button"
                  onClick={handleSavePrescription}
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md active:scale-95 transition-all disabled:opacity-50"
                >
                  <CheckCircle2 size={16} /> {isSaving ? 'সেভ হচ্ছে...' : 'প্রেসক্রিপশন সেভ করুন'}
                </button>
              )}

              <button
                type="button"
                onClick={handleSendToPatientWhatsApp}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
              >
                <Send size={16} /> রোগীর হোয়াটসঅ্যাপে পাঠান
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
