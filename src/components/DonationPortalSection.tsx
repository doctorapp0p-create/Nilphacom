import React, { useState, useEffect, useMemo } from 'react';
import { 
  Heart, 
  Baby, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Phone, 
  Copy, 
  Check, 
  Sparkles, 
  Send, 
  AlertCircle, 
  Search, 
  Filter, 
  Building2, 
  CreditCard, 
  UserCheck, 
  ArrowRight, 
  Download, 
  Share2, 
  RefreshCw, 
  Gift, 
  Pill, 
  Activity, 
  Flame, 
  HelpCircle, 
  ExternalLink,
  Lock,
  ChevronDown,
  ChevronUp,
  Award,
  Calculator,
  User,
  MapPin,
  FileText,
  MessageSquare,
  BadgeCheck,
  Stethoscope,
  Scissors,
  Microscope,
  Ambulance,
  HandHeart,
  Sliders,
  DollarSign,
  Users,
  PlusCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../../services/firebase';
import { doc, getDoc, setDoc, collection, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
import { 
  DonationCause, 
  DonationRecord, 
  DonationSettings, 
  Profile, 
  UserRole,
  ZakatApplication,
  ZakatSector,
  MedicalAssistanceApplication,
  MaternityDonationApplication,
  FreeDoctorClaim
} from '../../types';
import { BeneficiaryDirectoryTab, UnifiedBeneficiaryItem } from './BeneficiaryDirectoryTab';
import { MedicalAidApplicationModal } from './MedicalAidApplicationModal';

// Default Verified Welfare Causes (General & Sadaqah)
export const DEFAULT_DONATION_CAUSES: DonationCause[] = [
  {
    id: 'maternity_csection',
    title: 'অসচ্ছল গর্ভবতী মায়েদের নিরাপদ সিজার অনুদান',
    subtitle: 'প্রতি অসচ্ছল প্রসূতি মা পাচ্ছেন এককালীন নগদ ২০০০ টাকা',
    icon: '🤰',
    unitCost: 2000,
    unitLabel: '১ জন গর্ভবতী মায়ের নিরাপদ সিজার অনুদান',
    shortDescription: 'দরিদ্র ও প্রান্তিক পরিবারের গর্ভবতী মায়েদের সিজারিয়ান ডেলিভারির আর্থিক সংকটে সরাসরি ২০০০ টাকা অনুদান প্রদান।',
    fullDetails: 'গ্রামাঞ্চলের দিনমজুর, রিকশাচালক ও প্রান্তিক অসচ্ছল পরিবারের গর্ভবতী মায়েদের সিজার ডেলিভারির সময় হঠাৎ অনেক টাকার প্রয়োজন হয়। অর্থের অভাবে যেন কোনো মা ও নবজাতকের জীবন ঝুঁকিতে না পড়ে, সেজন্য nilpha.com এর পক্ষ থেকে সরাসরি ভেরিফাইড মায়ের বিকাশ/নগদে ২০০০ টাকা নগদ আর্থিক অনুদান দেওয়া হয়। আপনার ২০০০ টাকায় একজন মা নিরাপদে নতুন সন্তানের মুখ দেখতে পারেন।',
    impactNote: 'আপনার ২০০০ টাকা অনুদান ১ জন গর্ভবতী মায়ের নিরাপদ সিজারিয়ান ডেলিভারির পুরো আর্থিক সহায়তায় ব্যয় হবে।',
    highlights: [
      'স্বামী-স্ত্রীর NID, ছবি ও বিশেষজ্ঞ গাইনী ডাক্তারের প্রেসক্রিপশন পুঙ্খানুপুঙ্খ যাচাই করা হয়',
      'কোনো মধ্যস্বত্বভোগী ছাড়া সরাসরি প্রসূতি মায়ের অ্যাকাউন্টে ২০০০ টাকা ট্রান্সফার',
      'প্রান্তিক পরিবারের আর্থিক সংকট ও মাতৃমৃত্যুর ঝুঁকি হ্রাস'
    ],
    suggestedAmounts: [2000, 4000, 6000, 10000],
    isActive: true
  },
  {
    id: 'free_doctor_consultation',
    title: 'দরিদ্র ও অসহায় রোগীদের ফ্রি ডাক্তার চিকিৎসা ফান্ড',
    subtitle: 'অসহায় রোগীদের জন্য ১০০% বিনামূল্যে বিশেষজ্ঞ ডাক্তার সেবা',
    icon: '👨‍⚕️',
    unitCost: 500,
    unitLabel: '১ জন অসহায় রোগীর বিশেষজ্ঞ ডাক্তার পরামর্শ ফি',
    shortDescription: 'অর্থের অভাবে চিকিৎসা নিতে না পারা দিনমজুর, প্রবীণ ও এতিম রোগীদের জন্য বিনামূল্যে বিশেষজ্ঞ ডাক্তারের সেবা প্রদান।',
    fullDetails: 'অনেক রোগী বিশেষজ্ঞ ডাক্তারের পরামর্শ ফি (৫০০-১০০০ টাকা) জোগাড় করতে না পেরে অপচিকিৎসার শিকার হন বা রোগ পুষে রাখেন। এই ফান্ডের মাধ্যমে আমরা নামকরা এমবিবিএস ও বিশেষজ্ঞ ডাক্তারদের চেম্বারে অসহায় রোগীদের ফ্রি টোকেন দিয়ে সম্পূর্ণ বিনামূল্যে চিকিৎসা নিশ্চিত করি।',
    impactNote: '৫০০ টাকায় ১ জন এবং ১০০০ টাকায় ২ জন দুস্থ রোগীর বিশেষজ্ঞ ডাক্তার কনসালটেশন সম্পন্ন হয়।',
    highlights: [
      'ডিজিটাল টোকেন সিস্টেমের মাধ্যমে শতভাগ স্বচ্ছ ও জবাবদিহিমূলক বণ্টন',
      'মেডিসিন, শিশু, ডায়াবেটিস, গাইনী ও দন্তরোগের মতো জটিল বিভাগের বিশেষজ্ঞ ডাক্তার',
      'চিকিৎসা গ্রহণের পর প্রেসক্রিপশন ও ফলোআপ রেকর্ড সংরক্ষণ'
    ],
    suggestedAmounts: [500, 1000, 2500, 5000],
    isActive: true
  },
  {
    id: 'major_surgery_aid',
    title: 'গরিব রোগীর বড় অপারেশন ও জটিল সার্জারি সহায়তা',
    subtitle: 'হার্নিয়া, এপেন্ডিসাইটিস, টিউমার, চক্ষু ছানি ও ট্রমা সার্জারি ব্যয়',
    icon: '🏥',
    unitCost: 5000,
    unitLabel: '১ জন জটিল রোগীর অপারেশন ব্যয়ের অংশবিশেষ বা পূর্ণ সহায়তা',
    shortDescription: 'জরুরি অপারেশন ও অস্ত্রোপচারের খরচ জোগাড় করতে না পারা দুস্থ ও সংকটাপন্ন রোগীদের সরাসরি আর্থিক সহায়তা।',
    fullDetails: 'অনেক গরিব পরিবারে আকস্মিক অপারেশন বা বড় দুর্ঘটনার সার্জারি খরচ জোগাড় করতে ভিটেমাটি বিক্রি করতে হয়। এই বিশেষ অপারেশন ফান্ডের মাধ্যমে হাসপাতাল কর্তৃপক্ষের সাথে সমন্বয় করে অসহায় রোগীদের অপারেশনের ওষুধের বিল ও ওটি ফি সরাসরি পরিশোধ করা হয়।',
    impactNote: 'আপনার অনুদানে একজন অসহায় মানুষ পুনরায় স্বাভাবিক জীবনে ফিরে আসার আলো দেখতে পায়।',
    highlights: [
      'হাসপাতালের ওটি বিল ও সার্জিক্যাল উপকরণের ভাউচার যাচাই',
      'সার্জন ও ক্লিনিক কর্তৃপক্ষের সাথে সরাসরি আর্থিক সমন্বয়',
      'অপারেশন পরবর্তী ফলোআপ ও ওষুধ প্রাপ্তি নিশ্চিতকরণ'
    ],
    suggestedAmounts: [2500, 5000, 10000, 25000],
    isActive: true
  },
  {
    id: 'essential_medicine_aid',
    title: 'জীবনরক্ষাকারী ফ্রি জরুরি ঔষধ বিতরণ সহায়তা',
    subtitle: 'অসহায় ও দীর্ঘমেয়াদী রোগীদের জীবনরক্ষাকারী ঔষধ সরবরাহ',
    icon: '💊',
    unitCost: 1000,
    unitLabel: '১ জন দুস্থ রোগীর ১ মাসের জরুরি ঔষধ সহায়তা',
    shortDescription: 'ডায়াবেটিস, উচ্চ রক্তচাপ, শ্বাসকষ্ট, হৃদরোগ বা অ্যান্টিবায়োটিক ঔষধ কিনতে অক্ষম রোগীদের প্রয়োজনীয় প্রেসক্রাইবড ঔষধ কিনে দেওয়া।',
    fullDetails: 'গরিব রোগীরা ডাক্তার দেখালেও অর্থাভাবে ডাক্তারের লিখে দেওয়া জরুরি অ্যান্টিবায়োটিক বা নিয়মিত খাওয়ার জীবনরক্ষাকারী প্রেসক্রিপশনের ঔষধ কিনতে পারেন না। এই ফান্ডের অর্থ দিয়ে ভেরিফাইড প্রেসক্রিপশন অনুযায়ী পার্টনার ফার্মেসী থেকে সরাসরি রোগীদের হাতে ঔষধ পৌঁছে দেওয়া হয়।',
    impactNote: 'আপনার ১,০০০ টাকায় ১ জন প্রবীণ বা অসহায় রোগীর পুরো এক মাসের নিত্যপ্রয়োজনীয় ঔষধের নিশ্চয়তা মেলে।',
    highlights: [
      'নিবন্ধিত গ্রামীণ ও শহরের ফার্মেসী থেকে সরাসরি জেনুইন ঔষধ সরবরাহ',
      'দীর্ঘমেয়াদী অসুস্থ অসহায় প্রবীণ ও শিশুদের ক্ষেত্রে অগ্রাধিকার',
      'ঔষধ ক্রয়ের বিলের স্বচ্ছ ডিজিটাল ভাউচার তৈরি'
    ],
    suggestedAmounts: [500, 1000, 2000, 5000],
    isActive: true
  },
  {
    id: 'lab_test_subsidy',
    title: 'দরিদ্র রোগীদের প্যাথলজি ও ল্যাব টেস্ট ভর্তুকি ফান্ড',
    subtitle: 'রক্ত, এক্স-রে, ইউএসজি ও ডায়াগনস্টিক টেস্টে ৫০%–১০০% ফ্রি সহায়তা',
    icon: '🧪',
    unitCost: 1500,
    unitLabel: '১ জন জটিল রোগীর সম্পূর্ণ ল্যাব ও ডায়াগনস্টিক টেস্ট ব্যয়',
    shortDescription: 'ব্যয়বহুল ডায়াগনস্টিক ও প্যাথলজি টেস্ট করাতে অপারগ রোগীদের টেস্ট খরচে সরাসরি আর্থিক ছাড় ও অনুদান।',
    fullDetails: 'সঠিক রোগ নির্ণয়ের জন্য রক্ত পরীক্ষা, এক্স-রে, আল্ট্রাসনোগ্রাম, ইসিজি অত্যন্ত জরুরি। অর্থাভাবে টেস্ট না করাতে পেরে রোগ জটিল আকার ধারণ করে। আমাদের পার্টনার হাসপাতাল ও ডায়াগনস্টিক ল্যাবগুলোতে দুস্থ রোগীদের এই ফান্ডের মাধ্যমে ৫০% থেকে ১০০% সম্পূর্ণ ফ্রি টেস্ট সুবিধা দেওয়া হয়।',
    impactNote: '১৫০০ টাকার অনুদানে ১ জন সংকটাপন্ন রোগীর প্রয়োজনীয় সকল টেস্টের খরচ মেটানো সম্ভব হয়।',
    highlights: [
      'পপুলার ডায়াগনস্টিক সেন্টার, রংপুর ও অন্যান্য স্বনামধন্য ল্যাবে কার্যকর',
      'সরাসরি হাসপাতাল কর্তৃপক্ষকে টেস্টের বিল পরিশোধ',
      'প্রান্তিক রোগীদের সঠিক সময়ে সঠিক রোগ নির্ণয়ে সহায়ক'
    ],
    suggestedAmounts: [1000, 1500, 3000, 6000],
    isActive: true
  },
  {
    id: 'oxygen_ambulance_emergency',
    title: 'জরুরি অক্সিজেন ও ফ্রি অ্যাম্বুলেন্স সাপোর্ট ফান্ড',
    subtitle: 'সংকটময় মুহূর্তে শ্বাসকষ্টের অক্সিজেন ও মুমূর্ষু রোগীর অ্যাম্বুলেন্স ভাড়া',
    icon: '🆘',
    unitCost: 3000,
    unitLabel: '১ জন মুমূর্ষু রোগীর দূরবর্তী হাসপাতালে জরুরি অ্যাম্বুলেন্স ট্রিপ',
    shortDescription: 'শ্বাসকষ্টের সংকটকালীন রোগীদের ফ্রি অক্সিজেন সিলিন্ডার এবং প্রত্যন্ত অঞ্চল থেকে জেলা/বিভাগীয় হাসপাতালে নিতে অ্যাম্বুলেন্স সহায়তা।',
    fullDetails: 'হৃদরোগের বা স্ট্রোকের মুমূর্ষু গরিব রোগীদের জেলা হাসপাতাল বা রংপুর/ঢাকা মেডিকেল কলেজে দ্রুত স্থানান্তরের জন্য তাৎক্ষণিক অ্যাম্বুলেন্সের ভাড়ার টাকা থাকে না। এই জরুরি ফান্ডের মাধ্যমে গরিব রোগীদের অ্যাম্বুলেন্স ভাড়া পরিশোধ ও তাৎক্ষণিক অক্সিজেন সাপোর্ট দেওয়া হয়।',
    impactNote: 'জরুরি মুহূর্তে একটি দ্রুত অ্যাম্বুলেন্স ট্রিপ বা ১টি অক্সিজেন সিলিন্ডারই নির্ধারণ করে দেয় জীবন ও মৃত্যুর ব্যবধান।',
    highlights: [
      '২৪/৭ ডেডিকেটেড জরুরি হটলাইন সমন্বয়',
      'প্রত্যন্ত চরাঞ্চল ও গ্রামের অসচ্ছল রোগীদের জন্য লাইফলাইন',
      'জরুরি অক্সিজেন সিলিন্ডার ফ্রি রিফিল ও সরবরাহ'
    ],
    suggestedAmounts: [1000, 2000, 3000, 5000],
    isActive: true
  },
  {
    id: 'general_welfare_fund',
    title: 'সাধারণ সামাজিক স্বাস্থ্য ও মানবসেবা তহবিল',
    subtitle: 'যেখানে তাৎক্ষণিক সবচেয়ে জরুরি প্রয়োজন সেখানে ব্যয় হবে',
    icon: '🤲',
    unitCost: 1000,
    unitLabel: 'সাধারণ স্বাস্থ্য ও জরুরি মানবিক সহায়তা',
    shortDescription: 'জরুরি দুর্ঘটনা, আকস্মিক অপারেশন, এতিম শিশুদের চিকিৎসা ও সামাজিক স্বাস্থ্য সচেতনতা ক্যাম্পে ব্যয় হয়।',
    fullDetails: 'অনেক সময় এমন কিছু বিশেষ মানবিক পরিস্থিতি বা জরুরি অপারেশন সামনে আসে যা নির্দিষ্ট কোনো ক্যাটাগরির মধ্যে পড়ে না। জেনারেল ওয়েলফেয়ার ফান্ডের অর্থ দিয়ে তাৎক্ষণিকভাবে সেই অসহায় মানুষের পাশে দাঁড়ানো হয়।',
    impactNote: 'যে কোনো পরিমাণের অনুদান এই ফান্ডে যুক্ত হয়ে সর্বাধিক জরুরি স্থানে কাজে লাগানো হয়।',
    highlights: [
      'সর্বোচ্চ প্রয়োজনীয়তার ভিত্তিতে তাৎক্ষণিক ছাড়',
      'স্বেচ্ছাসেবী ও চিকিৎসকদের সমন্বয়ে শতভাগ স্বচ্ছতা',
      'মাসিক ও বাৎসরিক পাবলিক অডিট রিপোর্ট'
    ],
    suggestedAmounts: [500, 1000, 2000, 5000, 10000],
    isActive: true
  }
];

// Healthcare Specific Zakat Sectors (Shariah Compliant Distribution for Poor & Needy Patients)
export const ZAKAT_HEALTH_SECTORS: ZakatSector[] = [
  {
    id: 'zakat_maternity_csection',
    title: 'অসচ্ছল গর্ভবতী মায়েদের সিজার ডেলিভারি ও নবজাতক সহায়তা যাকাত',
    shortDesc: 'দরিদ্র ও নিস্ব প্রসূতি মায়েদের সিজারিয়ান অপারেশনের পুরো বা আংশিক ব্যয় (৳২,০০০ অনুদান)।',
    icon: '🤰',
    impactNote: 'যাকাতের অর্থ দিয়ে সরাসরি ভেরিফাইড অসচ্ছল প্রসূতি মায়েদের নিরাপদ ডেলিভারি ও চিকিৎসার ব্যবস্থা করা হয়।',
    isEligibleForZakat: true,
    suggestedAmounts: [2000, 4000, 6000, 10000, 20000]
  },
  {
    id: 'zakat_free_doctor_fee',
    title: 'গরিব ও অসহায় রোগীদের বিশেষজ্ঞ ডাক্তার কনসালটেশন ফি যাকাত',
    shortDesc: 'অর্থের অভাবে চিকিৎসা নিতে না পারা দুস্থ রোগীদের নামকরা বিশেষজ্ঞ ডাক্তারের চেম্বারে ফ্রি ভিজিট।',
    icon: '👨‍⚕️',
    impactNote: 'প্রতি ৫০০-১০০০ টাকায় একজন অসহায় রোগীর বিশেষজ্ঞ চিকিৎসকের ব্যবস্থাপত্র নিশ্চিত হয়।',
    isEligibleForZakat: true,
    suggestedAmounts: [1000, 2500, 5000, 10000]
  },
  {
    id: 'zakat_surgery_operation',
    title: 'গরিব রোগীর বড় অপারেশন ও জটিল সার্জারি ফি যাকাত',
    shortDesc: 'জটিল হার্নিয়া, এপেন্ডিসাইটিস, ট্রমা, চক্ষু ছানি, টিউমার বা অর্থোপেডিক অপারেশনের হাসপাতাল ও ওটি বিল।',
    icon: '🏥',
    impactNote: 'অসহায় রোগীর জীবন রক্ষায় অপারেশনের ওষুধ ও ওটি চার্জ সরাসরি মেটানো হয়।',
    isEligibleForZakat: true,
    suggestedAmounts: [5000, 10000, 25000, 50000]
  },
  {
    id: 'zakat_essential_medicine',
    title: 'দুস্থ ও দীর্ঘমেয়াদী রোগীদের জীবনরক্ষাকারী প্রেসক্রিপশন ঔষধ যাকাত',
    shortDesc: 'ডায়াবেটিস, প্রেশার, কিডনি বা অ্যান্টিবায়োটিক ঔষধ কিনতে অপারগ গরিব রোগীদের নিয়মিত ঔষধ প্রদান।',
    icon: '💊',
    impactNote: 'ভেরিফাইড প্রেসক্রিপশনের ভিত্তিতে জেনুইন ফার্মেসী থেকে সরাসরি রোগীদের হাতে ঔষধ পৌঁছানো হয়।',
    isEligibleForZakat: true,
    suggestedAmounts: [1000, 2000, 5000, 10000]
  },
  {
    id: 'zakat_diagnostic_labtests',
    title: 'দরিদ্র রোগীদের প্যাথলজি ও ডায়াগনস্টিক ল্যাব টেস্ট ব্যয় যাকাত',
    shortDesc: 'রক্ত, এক্স-রে, ইউএসজি, ইসিজি ও ডায়াগনস্টিক টেস্টের সম্পূর্ণ ফি মওকুফ ও সহায়তা।',
    icon: '🧪',
    impactNote: 'সঠিক সময়ে সঠিক রোগ নির্ণয়ে দরিদ্র রোগীদের জন্য পূর্ণাঙ্গ টেস্ট সুবিধা নিশ্চিত করে।',
    isEligibleForZakat: true,
    suggestedAmounts: [1500, 3000, 5000, 10000]
  },
  {
    id: 'zakat_emergency_oxygen_ambulance',
    title: 'মুমূর্ষু গরিব রোগীর জরুরি অক্সিজেন সিলিন্ডার ও অ্যাম্বুলেন্স ভাড়া যাকাত',
    shortDesc: 'শ্বাসকষ্টের সংকটকালীন ফ্রি অক্সিজেন সাপোর্ট এবং মেডিকেল কলেজে স্থানান্তরের অ্যাম্বুলেন্স ব্যয়।',
    icon: '🚑',
    impactNote: 'জরুরি মুহূর্তে নিঃস্ব রোগীদের হাসপাতালে দ্রুত পৌঁছানোর খরচ মেটায়।',
    isEligibleForZakat: true,
    suggestedAmounts: [2000, 3000, 5000, 10000]
  },
  {
    id: 'zakat_general_health_fund',
    title: 'উন্মুক্ত সামাজিক স্বাস্থ্য যাকাত তহবিল (সর্বাধিক জরুরি খাতে ব্যয়)',
    shortDesc: 'আমাদের টিম যাচাই করে যেকোনো অসহায় দুস্থ রোগীর সবচেয়ে জরুরি ও সংকটময় চিকিৎসা ব্যয়ে ব্যয় করবে।',
    icon: '🤲',
    impactNote: 'আপনার যাকাতের সম্পদ শতভাগ শরিয়াহসম্মতভাবে উপযুক্ত গরিব ও মিসকিন রোগীদের কল্যাণে ব্যবহৃত হবে।',
    isEligibleForZakat: true,
    suggestedAmounts: [1000, 2000, 5000, 10000, 25000, 50000, 100000]
  }
];

const DEFAULT_SETTINGS: DonationSettings = {
  enabled: true,
  bkashNumber: '01518395772',
  nagadNumber: '01846800973',
  rocketNumber: '01518395772-8',
  bankDetails: {
    bankName: 'Islami Bank Bangladesh PLC',
    accountName: 'Nilpha Healthcare Welfare Fund',
    accountNumber: '2050392010048123',
    branch: 'Nilphamari Branch',
    routingNumber: '125263148'
  },
  totalDonationRaised: 412000,
  totalMothersFunded: 146,
  totalFreePatientsServed: 1480,
  emergencyNotice: 'বর্তমানে গরিব গর্ভবতী মায়েদের সিজার অনুদান, জরুরি অপারেশন ও ফ্রি ডাক্তার সেবায় যাকাত ও অনুদানের বিশেষ প্রয়োজন রয়েছে। আপনার সামর্থ্য অনুযায়ী পাশে থাকুন।',
  hotline: '01518395772'
};

interface DonationPortalSectionProps {
  profile: Profile | null;
  isAdmin?: boolean;
  whatsappNumber?: string;
  onNavigateToMaternity?: () => void;
  onNavigateToDoctors?: () => void;
}

export const DonationPortalSection: React.FC<DonationPortalSectionProps> = ({
  profile,
  isAdmin = false,
  whatsappNumber = '8801352669100',
  onNavigateToMaternity,
  onNavigateToDoctors
}) => {
  // Main Active Sub-Tab
  const [activePortalTab, setActivePortalTab] = useState<'general' | 'zakat' | 'beneficiaries' | 'pledge' | 'calculator'>('general');

  const [causes] = useState<DonationCause[]>(DEFAULT_DONATION_CAUSES);
  const [zakatSectors] = useState<ZakatSector[]>(ZAKAT_HEALTH_SECTORS);
  const [settings, setSettings] = useState<DonationSettings>(DEFAULT_SETTINGS);
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [zakatApplications, setZakatApplications] = useState<ZakatApplication[]>([]);
  const [medicalApps, setMedicalApps] = useState<MedicalAssistanceApplication[]>([]);
  const [maternityApps, setMaternityApps] = useState<MaternityDonationApplication[]>([]);
  const [freeDoctorClaims, setFreeDoctorClaims] = useState<FreeDoctorClaim[]>([]);
  
  const [showAidModal, setShowAidModal] = useState(false);
  const [selectedPatientToSponsor, setSelectedPatientToSponsor] = useState<UnifiedBeneficiaryItem | null>(null);
  const [loading, setLoading] = useState(true);

  // Selection & Details State (General Donation)
  const [selectedCauseId, setSelectedCauseId] = useState<string>('maternity_csection');
  const [expandedCauseId, setExpandedCauseId] = useState<string | null>('maternity_csection');

  // Selection & Details State (Zakat Specific)
  const [selectedZakatSectorId, setSelectedZakatSectorId] = useState<string>('zakat_maternity_csection');

  // General Donation Form State
  const [donorName, setDonorName] = useState(profile?.full_name || '');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [donorPhone, setDonorPhone] = useState(profile?.phone || '');
  const [donorDistrict, setDonorDistrict] = useState(profile?.district || 'নীলফামারী');
  const [amount, setAmount] = useState<number>(2000);
  const [customAmountInput, setCustomAmountInput] = useState<string>('2000');
  const [isCustomAmount, setIsCustomAmount] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad' | 'rocket' | 'bank'>('bkash');
  const [senderNumber, setSenderNumber] = useState('');
  const [trxId, setTrxId] = useState('');
  const [donorMessage, setDonorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedDonation, setSubmittedDonation] = useState<DonationRecord | null>(null);

  // Zakat Pledge / Consultation Application Form State
  const [zakatDonorName, setZakatDonorName] = useState(profile?.full_name || '');
  const [zakatPhone, setZakatPhone] = useState(profile?.phone || '');
  const [zakatAddress, setZakatAddress] = useState('');
  const [zakatDistrict, setZakatDistrict] = useState(profile?.district || 'নীলফামারী');
  const [zakatEstimatedAmount, setZakatEstimatedAmount] = useState<string>('5000');
  const [zakatPaymentPref, setZakatPaymentPref] = useState<'bkash' | 'nagad' | 'rocket' | 'bank' | 'in_person' | 'undecided'>('bkash');
  const [zakatSenderNumber, setZakatSenderNumber] = useState('');
  const [zakatTrxId, setZakatTrxId] = useState('');
  const [zakatIsDirectPaid, setZakatIsDirectPaid] = useState(false);
  const [zakatSpecialInstructions, setZakatSpecialInstructions] = useState('');
  const [zakatContactTime, setZakatContactTime] = useState('যে কোনো সময়');
  const [submittingZakat, setSubmittingZakat] = useState(false);
  const [submittedZakatApp, setSubmittedZakatApp] = useState<ZakatApplication | null>(null);

  // Zakat Calculator State
  const [calcCash, setCalcCash] = useState<string>('');
  const [calcBank, setCalcBank] = useState<string>('');
  const [calcGoldValue, setCalcGoldValue] = useState<string>('');
  const [calcBusinessAssets, setCalcBusinessAssets] = useState<string>('');
  const [calcDebts, setCalcDebts] = useState<string>('');

  // Copy Feedback State
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Admin Management State
  const [adminTab, setAdminTab] = useState<'donations' | 'zakat_apps' | 'medical_apps' | 'settings'>('donations');
  const [adminSearch, setAdminSearch] = useState('');
  const [adminFilterStatus, setAdminFilterStatus] = useState<string>('all');
  const [adminFilterCause, setAdminFilterCause] = useState<string>('all');
  const [adminSavingSettings, setAdminSavingSettings] = useState(false);
  const [editingSettings, setEditingSettings] = useState<DonationSettings>(DEFAULT_SETTINGS);

  // Active Selected Cause Object
  const selectedCause = useMemo(() => {
    return causes.find(c => c.id === selectedCauseId) || causes[0];
  }, [causes, selectedCauseId]);

  // Active Selected Zakat Sector Object
  const selectedZakatSector = useMemo(() => {
    return zakatSectors.find(s => s.id === selectedZakatSectorId) || zakatSectors[0];
  }, [zakatSectors, selectedZakatSectorId]);

  // Zakat Calculator Result
  const zakatCalculationResult = useMemo(() => {
    const cash = parseFloat(calcCash) || 0;
    const bank = parseFloat(calcBank) || 0;
    const gold = parseFloat(calcGoldValue) || 0;
    const business = parseFloat(calcBusinessAssets) || 0;
    const debts = parseFloat(calcDebts) || 0;

    const totalAssets = cash + bank + gold + business;
    const netWealth = Math.max(0, totalAssets - debts);
    const zakatPayable = Math.round(netWealth * 0.025);

    return {
      totalAssets,
      debts,
      netWealth,
      zakatPayable
    };
  }, [calcCash, calcBank, calcGoldValue, calcBusinessAssets, calcDebts]);

  // Load from Firestore
  useEffect(() => {
    fetchDonationData();
  }, []);

  useEffect(() => {
    if (profile?.full_name) {
      if (!donorName) setDonorName(profile.full_name);
      if (!zakatDonorName) setZakatDonorName(profile.full_name);
    }
    if (profile?.phone) {
      if (!donorPhone) setDonorPhone(profile.phone);
      if (!zakatPhone) setZakatPhone(profile.phone);
    }
    if (profile?.district) {
      if (!donorDistrict) setDonorDistrict(profile.district);
      if (!zakatDistrict) setZakatDistrict(profile.district);
    }
  }, [profile]);

  const fetchDonationData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Settings
      const settingsRef = doc(db, 'settings', 'donation_portal');
      const snap = await getDoc(settingsRef);
      if (snap.exists()) {
        const data = snap.data() as DonationSettings;
        setSettings(data);
        setEditingSettings(data);
      } else {
        setEditingSettings(DEFAULT_SETTINGS);
      }

      // 2. Fetch General Donations
      const donationsCol = collection(db, 'donations');
      const dSnap = await getDocs(donationsCol);
      const list: DonationRecord[] = [];
      dSnap.forEach(d => {
        list.push({ id: d.id, ...d.data() } as DonationRecord);
      });
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setDonations(list);

      // 3. Fetch Zakat Applications
      const zakatCol = collection(db, 'zakat_applications');
      const zSnap = await getDocs(zakatCol);
      const zList: ZakatApplication[] = [];
      zSnap.forEach(d => {
        zList.push({ id: d.id, ...d.data() } as ZakatApplication);
      });
      zList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setZakatApplications(zList);

      // 4. Fetch Medical Assistance Applications
      const medCol = collection(db, 'medical_assistance_applications');
      const mSnap = await getDocs(medCol);
      const mList: MedicalAssistanceApplication[] = [];
      mSnap.forEach(d => {
        mList.push({ id: d.id, ...d.data() } as MedicalAssistanceApplication);
      });
      mList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setMedicalApps(mList);

      // 5. Fetch Maternity Donation Applications
      const matCol = collection(db, 'maternity_donations');
      const matSnap = await getDocs(matCol);
      const matList: MaternityDonationApplication[] = [];
      matSnap.forEach(d => {
        matList.push({ id: d.id, ...d.data() } as MaternityDonationApplication);
      });
      setMaternityApps(matList);

      // 6. Fetch Free Doctor Claims
      const freeCol = collection(db, 'free_claims');
      const freeSnap = await getDocs(freeCol);
      const freeList: FreeDoctorClaim[] = [];
      freeSnap.forEach(d => {
        freeList.push({ id: d.id, ...d.data() } as FreeDoctorClaim);
      });
      setFreeDoctorClaims(freeList);

    } catch (err) {
      console.error('Error fetching donation data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSponsorPatient = (patient: UnifiedBeneficiaryItem) => {
    setSelectedPatientToSponsor(patient);
    setAmount(patient.requestedAmount);
    setCustomAmountInput(String(patient.requestedAmount));
    setIsCustomAmount(false);

    // Map to cause or zakat sector
    if (patient.category === 'maternity_csection') {
      setSelectedCauseId('maternity_csection');
      setSelectedZakatSectorId('zakat_maternity_csection');
    } else if (patient.category === 'major_surgery_aid') {
      setSelectedCauseId('major_surgery_aid');
      setSelectedZakatSectorId('zakat_surgery_operation');
    } else if (patient.category === 'free_doctor_consultation') {
      setSelectedCauseId('free_doctor_consultation');
      setSelectedZakatSectorId('zakat_free_doctor_fee');
    } else if (patient.category === 'essential_medicine_aid') {
      setSelectedCauseId('essential_medicine_aid');
      setSelectedZakatSectorId('zakat_essential_medicine');
    } else if (patient.category === 'lab_test_subsidy') {
      setSelectedCauseId('lab_test_subsidy');
      setSelectedZakatSectorId('zakat_lab_test_subsidy');
    } else if (patient.category === 'oxygen_ambulance_emergency') {
      setSelectedCauseId('oxygen_ambulance_emergency');
      setSelectedZakatSectorId('zakat_ambulance_support');
    }

    const sponsorNote = `রোগী স্পন্সর: ${patient.patientName} (কোড: ${patient.code}), গ্রাম: ${patient.villageOrUnion}, থানা: ${patient.upazilaOrArea}, জেলা: ${patient.district}`;
    setDonorMessage(sponsorNote);
    setZakatSpecialInstructions(sponsorNote);

    // Switch tab to general or zakat
    setActivePortalTab('general');

    // Scroll to donation form
    setTimeout(() => {
      const el = document.getElementById('donation-payment-form');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Select Preset Amount
  const handleSelectPresetAmount = (val: number) => {
    setAmount(val);
    setCustomAmountInput(String(val));
    setIsCustomAmount(false);
  };

  const handleCustomAmountChange = (valStr: string) => {
    const clean = valStr.replace(/[^0-9]/g, '');
    setCustomAmountInput(clean);
    const num = parseInt(clean, 10);
    if (!isNaN(num) && num > 0) {
      setAmount(num);
    }
    setIsCustomAmount(true);
  };

  // Submit General Donation Form
  const handleSubmitDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount < 10) {
      alert('অনুগ্রহ করে সঠিক অনুদানের পরিমাণ উল্লেখ করুন (কমপক্ষে ১০ টাকা)।');
      return;
    }
    if (!isAnonymous && !donorName.trim()) {
      alert('অনুগ্রহ করে আপনার নাম লিখুন অথবা "নাম প্রকাশে অনিচ্ছুক" অপশনটি সিলেক্ট করুন।');
      return;
    }
    if (!donorPhone.trim() || donorPhone.trim().length < 11) {
      alert('অনুগ্রহ করে সঠিক মোবাইল নম্বর প্রদান করুন।');
      return;
    }
    if (paymentMethod !== 'bank' && (!senderNumber.trim() || senderNumber.trim().length < 11)) {
      alert('অনুগ্রহ করে যে নম্বর থেকে টাকা পাঠিয়েছেন (Sender Number) সেটি লিখুন।');
      return;
    }
    if (!trxId.trim()) {
      alert('অনুগ্রহ করে পেমেন্টের ট্রানজেকশন আইডি (TrxID) অথবা ব্যাংক ডিপোজিট রেফারেন্স লিখুন।');
      return;
    }

    setSubmitting(true);
    try {
      const donationCode = `DON-${Math.floor(100000 + Math.random() * 900000)}`;
      const newDocRef = doc(collection(db, 'donations'));
      
      const newRecord: DonationRecord = {
        id: newDocRef.id,
        donationCode,
        donorName: isAnonymous ? 'মহৎপ্রাণ ডোনার (নাম প্রকাশে অনিচ্ছুক)' : donorName.trim(),
        isAnonymous,
        donorPhone: donorPhone.trim(),
        donorDistrict: donorDistrict.trim() || 'অনির্দিষ্ট',
        causeId: selectedCause.id,
        causeTitle: selectedCause.title,
        amount,
        beneficiaryUnits: selectedCause.unitCost > 0 ? Number((amount / selectedCause.unitCost).toFixed(1)) : 1,
        paymentMethod,
        senderNumber: senderNumber.trim(),
        trxId: trxId.trim().toUpperCase(),
        donorMessage: donorMessage.trim() || '',
        status: 'pending',
        createdAt: new Date().toISOString(),
        userId: profile?.id || undefined
      };

      await setDoc(newDocRef, newRecord);

      // Local State Update
      setDonations(prev => [newRecord, ...prev]);
      setSubmittedDonation(newRecord);

      // Reset form specific fields
      setSenderNumber('');
      setTrxId('');
      setDonorMessage('');

      alert(`আলহামদুলিল্লাহ! আপনার অনুদানের তথ্য সফলভাবে জমা হয়েছে।\nআপনার ডোনেশন রিসিট কোড: ${donationCode}\nঅ্যাডমিন যাচাই করার পর আপনার ডোনেশন ভেরিফাইড হিসেবে তালিকাভুক্ত হবে। মানবসেবায় আপনার এই অবদান সদকায়ে জারিয়া হিসেবে কবুল হোক!`);
    } catch (err) {
      console.error('Error saving donation:', err);
      alert('দুঃখিত! অনুদানের তথ্য জমা দিতে সমস্যা হয়েছে। অনুগ্রহ করে ইন্টারনেট সংযোগ চেক করে আবার চেষ্টা করুন।');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Zakat Application / Pledge Form
  const handleSubmitZakatApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zakatDonorName.trim()) {
      alert('অনুগ্রহ করে আপনার নাম লিখুন।');
      return;
    }
    if (!zakatPhone.trim() || zakatPhone.trim().length < 11) {
      alert('অনুগ্রহ করে সঠিক মোবাইল ও হোয়াটসঅ্যাপ নম্বর লিখুন।');
      return;
    }
    if (!zakatAddress.trim()) {
      alert('অনুগ্রহ করে আপনার পূর্ণাঙ্গ ঠিকানা ও থানা/উপজেলা লিখুন।');
      return;
    }

    const estAmountNum = parseFloat(zakatEstimatedAmount) || 0;

    if (zakatIsDirectPaid && (!zakatSenderNumber.trim() || !zakatTrxId.trim())) {
      alert('যেহেতু আপনি টাকা পাঠিয়েছেন বলে টিক দিয়েছেন, অনুগ্রহ করে সেন্ডার নম্বর ও ট্রানজেকশন আইডি (TrxID) উল্লেখ করুন।');
      return;
    }

    setSubmittingZakat(true);
    try {
      const applicationCode = `ZAKAT-${Math.floor(100000 + Math.random() * 900000)}`;
      const newDocRef = doc(collection(db, 'zakat_applications'));

      const newZakatRecord: ZakatApplication = {
        id: newDocRef.id,
        applicationCode,
        donorName: zakatDonorName.trim(),
        donorPhone: zakatPhone.trim(),
        donorAddress: zakatAddress.trim(),
        donorDistrict: zakatDistrict.trim() || 'নীলফামারী',
        zakatSectorId: selectedZakatSector.id,
        zakatSectorTitle: selectedZakatSector.title,
        estimatedAmount: estAmountNum > 0 ? estAmountNum : undefined,
        paymentMethodPreference: zakatPaymentPref,
        senderNumber: zakatSenderNumber.trim() || undefined,
        trxId: zakatTrxId.trim().toUpperCase() || undefined,
        isDirectPaid: zakatIsDirectPaid,
        specialInstructions: zakatSpecialInstructions.trim() || undefined,
        contactTimePreference: zakatContactTime,
        status: zakatIsDirectPaid ? 'approved' : 'pending',
        createdAt: new Date().toISOString(),
        userId: profile?.id || undefined
      };

      await setDoc(newDocRef, newZakatRecord);

      // If directly paid, also record in donations collection
      if (zakatIsDirectPaid && estAmountNum > 0 && zakatTrxId) {
        const donationDocRef = doc(collection(db, 'donations'));
        const donationEntry: DonationRecord = {
          id: donationDocRef.id,
          donationCode: applicationCode,
          donorName: zakatDonorName.trim(),
          isAnonymous: false,
          donorPhone: zakatPhone.trim(),
          donorDistrict: zakatDistrict.trim(),
          causeId: selectedZakatSector.id,
          causeTitle: `[যাকাত] ${selectedZakatSector.title}`,
          amount: estAmountNum,
          beneficiaryUnits: 1,
          paymentMethod: (zakatPaymentPref === 'in_person' || zakatPaymentPref === 'undecided') ? 'bkash' : (zakatPaymentPref as any),
          senderNumber: zakatSenderNumber.trim(),
          trxId: zakatTrxId.trim().toUpperCase(),
          donorMessage: `যাকাত অঙ্গীকার ফরম থেকে প্রেরিত। বিশেষ ইচ্ছা: ${zakatSpecialInstructions}`,
          status: 'pending',
          createdAt: new Date().toISOString(),
          userId: profile?.id || undefined
        };
        await setDoc(donationDocRef, donationEntry);
        setDonations(prev => [donationEntry, ...prev]);
      }

      setZakatApplications(prev => [newZakatRecord, ...prev]);
      setSubmittedZakatApp(newZakatRecord);

      alert(`আলহামদুলিল্লাহ! আপনার স্বাস্থ্যখাতে যাকাতের আবেদন/অঙ্গীকার সফলভাবে গৃহীত হয়েছে।\nট্র্যাকিং কোড: ${applicationCode}\nআমাদের যাকাত প্রতিনিধি খুব দ্রুত আপনার সাথে যোগাযোগ করবেন। আল্লাহ আপনার যাকাত ও সদকা কবুল করুন!`);
    } catch (err) {
      console.error('Error saving zakat application:', err);
      alert('যাকাতের তথ্য জমা দিতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setSubmittingZakat(false);
    }
  };

  // Admin Verification Action (General Donations)
  const handleUpdateStatus = async (donationId: string, status: 'verified' | 'acknowledged' | 'rejected') => {
    try {
      const dRef = doc(db, 'donations', donationId);
      await updateDoc(dRef, {
        status,
        verifiedAt: new Date().toISOString()
      });
      setDonations(prev => prev.map(d => d.id === donationId ? { ...d, status, verifiedAt: new Date().toISOString() } : d));
      alert(`ডোনেশন স্ট্যাটাস "${status.toUpperCase()}" হিসেবে আপডেট করা হয়েছে।`);
    } catch (err) {
      console.error('Error updating donation status:', err);
      alert('স্ট্যাটাস আপডেট ব্যর্থ হয়েছে।');
    }
  };

  // Admin Zakat Application Status Update
  const handleUpdateZakatStatus = async (appId: string, status: 'pending' | 'contacted' | 'approved' | 'collected' | 'cancelled') => {
    try {
      const zRef = doc(db, 'zakat_applications', appId);
      await updateDoc(zRef, {
        status,
        updatedAt: new Date().toISOString()
      });
      setZakatApplications(prev => prev.map(z => z.id === appId ? { ...z, status, updatedAt: new Date().toISOString() } : z));
      alert(`যাকাত আবেদনের স্ট্যাটাস "${status.toUpperCase()}" হিসেবে আপডেট করা হয়েছে।`);
    } catch (err) {
      console.error('Error updating zakat status:', err);
      alert('যাকাত স্ট্যাটাস আপডেট ব্যর্থ হয়েছে।');
    }
  };

  // Admin Medical Application Status Update
  const handleUpdateMedicalStatus = async (appId: string, status: 'pending' | 'under_review' | 'verified' | 'funded' | 'rejected' | 'completed') => {
    try {
      const mRef = doc(db, 'medical_assistance_applications', appId);
      await updateDoc(mRef, {
        status,
        updatedAt: new Date().toISOString()
      });
      setMedicalApps(prev => prev.map(m => m.id === appId ? { ...m, status, updatedAt: new Date().toISOString() } : m));
      alert(`চিকিৎসা আবেদনের স্ট্যাটাস "${status.toUpperCase()}" হিসেবে আপডেট করা হয়েছে।`);
    } catch (err) {
      console.error('Error updating medical status:', err);
      alert('স্ট্যাটাস আপডেট ব্যর্থ হয়েছে।');
    }
  };

  // Admin Delete Action
  const handleDeleteDonation = async (donationId: string) => {
    if (!window.confirm('আপনি কি নিশ্চিতভাবে এই ডোনেশন রেকর্ডটি মুছে ফেলতে চান?')) return;
    try {
      await deleteDoc(doc(db, 'donations', donationId));
      setDonations(prev => prev.filter(d => d.id !== donationId));
    } catch (err) {
      console.error('Error deleting donation:', err);
      alert('মুছতে ব্যর্থ হয়েছে।');
    }
  };

  const handleDeleteZakatApp = async (appId: string) => {
    if (!window.confirm('আপনি কি নিশ্চিতভাবে এই যাকাত আবেদনটি মুছে ফেলতে চান?')) return;
    try {
      await deleteDoc(doc(db, 'zakat_applications', appId));
      setZakatApplications(prev => prev.filter(z => z.id !== appId));
    } catch (err) {
      console.error('Error deleting zakat app:', err);
      alert('মুছতে ব্যর্থ হয়েছে।');
    }
  };

  const handleDeleteMedicalApp = async (appId: string) => {
    if (!window.confirm('আপনি কি নিশ্চিতভাবে এই চিকিৎসা আবেদনটি মুছে ফেলতে চান?')) return;
    try {
      await deleteDoc(doc(db, 'medical_assistance_applications', appId));
      setMedicalApps(prev => prev.filter(m => m.id !== appId));
    } catch (err) {
      console.error('Error deleting medical application:', err);
      alert('মুছতে ব্যর্থ হয়েছে।');
    }
  };

  // Admin Save Settings Action
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminSavingSettings(true);
    try {
      const settingsRef = doc(db, 'settings', 'donation_portal');
      await setDoc(settingsRef, editingSettings, { merge: true });
      setSettings(editingSettings);
      alert('ডোনেশন ও যাকাত পোর্টালের সেটিংস সফলভাবে সেভ হয়েছে!');
    } catch (err) {
      console.error('Error saving settings:', err);
      alert('সেটিংস সেভ করতে ব্যর্থ হয়েছে।');
    } finally {
      setAdminSavingSettings(false);
    }
  };

  // Filtered Public Verified Donations (Excluding Rejected)
  const publicDonations = useMemo(() => {
    return donations.filter(d => d.status !== 'rejected');
  }, [donations]);

  // Admin Filtered Donations
  const adminFilteredDonations = useMemo(() => {
    return donations.filter(d => {
      const matchSearch = adminSearch === '' || 
        d.donorName.toLowerCase().includes(adminSearch.toLowerCase()) ||
        d.donorPhone.includes(adminSearch) ||
        d.trxId.toLowerCase().includes(adminSearch.toLowerCase()) ||
        d.donationCode.toLowerCase().includes(adminSearch.toLowerCase());
      const matchStatus = adminFilterStatus === 'all' || d.status === adminFilterStatus;
      const matchCause = adminFilterCause === 'all' || d.causeId === adminFilterCause;
      return matchSearch && matchStatus && matchCause;
    });
  }, [donations, adminSearch, adminFilterStatus, adminFilterCause]);

  // Calculations for dynamic totals
  const totalVerifiedAmount = useMemo(() => {
    return donations.reduce((sum, d) => sum + (d.status === 'verified' || d.status === 'acknowledged' ? d.amount : 0), 0);
  }, [donations]);

  const activeBkashNumber = settings.bkashNumber || '01518395772';
  const activeNagadNumber = settings.nagadNumber || '01846800973';
  const activeRocketNumber = settings.rocketNumber || '01518395772-8';

  return (
    <div id="donation-portal-section" className="space-y-6 pb-12 animate-fadeIn select-none">
      {/* 1. Hero Banner with Purpose Statement */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-emerald-500/20">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-black tracking-wide">
            <Sparkles size={14} className="animate-spin-slow text-emerald-300" />
            <span>মানবসেবা, সদকা ও যাকাত স্বাস্থ্য তহবিল | nilpha.com</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
            আপনার ছোট্ট অনুদান ও যাকাত বাঁচাবে একটি প্রাণ, <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-300">
              স্বস্তি পাবে অসচ্ছল গর্ভবতী মা ও অসহায় রোগী
            </span>
          </h1>

          <p className="text-slate-200 text-xs sm:text-sm leading-relaxed">
            nilpha.com এর মাধ্যমে আমরা প্রান্তিক অঞ্চলের অসচ্ছল গর্ভবতী মায়েদের নিরাপদ সিজারে <b>৳২,০০০ টাকা আর্থিক অনুদান</b>, গরিব রোগীদের <b>ফ্রি ডাক্তার কনসালটেশন</b>, <b>জরুরি অপারেশন সহায়তা</b>, <b>জীবনরক্ষাকারী ঔষধ</b> এবং <b>ল্যাব টেস্টে ১০০% পর্যন্ত ফ্রি সহায়তা</b> প্রদান করছি। আপনার অনুদান ও যাকাতের প্রতিটি টাকা শতভাগ স্বচ্ছতায় সরাসরি দুস্থ রোগীর সেবায় ব্যয় হয়।
          </p>

          {/* Quick Stats Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-slate-900/60 backdrop-blur-md p-3 rounded-2xl border border-emerald-500/20">
              <span className="text-[10px] text-emerald-300 font-bold block">মোট অনুদান ও সহায়তা</span>
              <span className="text-base sm:text-lg font-black text-amber-300">৳{(settings.totalDonationRaised + totalVerifiedAmount).toLocaleString()}</span>
            </div>
            <div className="bg-slate-900/60 backdrop-blur-md p-3 rounded-2xl border border-emerald-500/20">
              <span className="text-[10px] text-emerald-300 font-bold block">গর্ভবতী মা উপকৃত</span>
              <span className="text-base sm:text-lg font-black text-emerald-300">{settings.totalMothersFunded}+ জন মা</span>
            </div>
            <div className="bg-slate-900/60 backdrop-blur-md p-3 rounded-2xl border border-emerald-500/20">
              <span className="text-[10px] text-emerald-300 font-bold block">ফ্রি চিকিৎসা সেবা</span>
              <span className="text-base sm:text-lg font-black text-cyan-300">{settings.totalFreePatientsServed}+ রোগী</span>
            </div>
            <div className="bg-slate-900/60 backdrop-blur-md p-3 rounded-2xl border border-emerald-500/20">
              <span className="text-[10px] text-emerald-300 font-bold block">যাকাত শরিয়াহ স্বচ্ছতা</span>
              <span className="text-base sm:text-lg font-black text-white">১০০% ভেরিফাইড</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Tab Switcher (General Donation vs. Zakat Health Fund vs. Beneficiaries Directory vs. Zakat Pledge Form vs. Calculator) */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActivePortalTab('general')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm transition-all cursor-pointer ${
            activePortalTab === 'general'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 scale-[1.02]'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <Heart size={16} className={activePortalTab === 'general' ? 'text-white' : 'text-emerald-500'} />
          <span>💖 সাধারণ অনুদান ও সদকা</span>
        </button>

        <button
          onClick={() => setActivePortalTab('zakat')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm transition-all cursor-pointer ${
            activePortalTab === 'zakat'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 scale-[1.02]'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <HandHeart size={16} className={activePortalTab === 'zakat' ? 'text-slate-950' : 'text-amber-500'} />
          <span>🤲 স্বাস্থ্যখাতে যাকাত ফান্ড ও ক্ষেত্রসমূহ</span>
        </button>

        <button
          onClick={() => setActivePortalTab('beneficiaries')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm transition-all cursor-pointer ${
            activePortalTab === 'beneficiaries'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 scale-[1.02]'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <Users size={16} className={activePortalTab === 'beneficiaries' ? 'text-white' : 'text-indigo-500'} />
          <span>📋 সাহায্যপ্রার্থী রোগী ও মায়েদের উন্মুক্ত তালিকা</span>
          {(medicalApps.length + maternityApps.length + freeDoctorClaims.length) > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activePortalTab === 'beneficiaries' ? 'bg-white/20 text-white' : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
            }`}>
              {medicalApps.length + maternityApps.length + freeDoctorClaims.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActivePortalTab('pledge')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm transition-all cursor-pointer ${
            activePortalTab === 'pledge'
              ? 'bg-teal-700 text-white shadow-md shadow-teal-700/20 scale-[1.02]'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <FileText size={16} className={activePortalTab === 'pledge' ? 'text-white' : 'text-teal-600'} />
          <span>📝 যাকাত অঙ্গীকার ফরম</span>
        </button>

        <button
          onClick={() => setActivePortalTab('calculator')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm transition-all cursor-pointer ${
            activePortalTab === 'calculator'
              ? 'bg-slate-800 text-white shadow-md scale-[1.02]'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <Calculator size={16} className="text-cyan-400" />
          <span>🧮 যাকাত ক্যালকুলেটর</span>
        </button>

        <button
          onClick={() => setShowAidModal(true)}
          className="ml-auto flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md transition-all hover:scale-105"
        >
          <PlusCircle size={14} />
          <span>চিকিৎসা সাহায্যের আবেদন করুন</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: GENERAL DONATION (সাধারন অনুদান ও সদকা) */}
      {/* ========================================================================= */}
      {activePortalTab === 'general' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Causes Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>🎯</span> কোন খাতে অনুদান দিতে চান তা নির্বাচন করুন
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  নির্দিষ্ট একটি প্রজেক্ট বেছে নিন অথবা যে কোনো জরুরি প্রজেক্টে অনুদান পাঠান
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {causes.map((cause) => {
                const isSelected = selectedCauseId === cause.id;
                return (
                  <div
                    key={cause.id}
                    onClick={() => {
                      setSelectedCauseId(cause.id);
                      setAmount(cause.suggestedAmounts[0] || 1000);
                      setCustomAmountInput(String(cause.suggestedAmounts[0] || 1000));
                      setIsCustomAmount(false);
                    }}
                    className={`p-4 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-lg shadow-emerald-500/10 scale-[1.01]'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-3 right-3 bg-emerald-600 text-white rounded-full p-1 shadow-sm">
                        <Check size={14} />
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl p-2 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                          {cause.icon}
                        </span>
                        <div>
                          <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                            {cause.title}
                          </h3>
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            {cause.subtitle}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                        {cause.shortDescription}
                      </p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        প্রতি ইউনিটে সহায়তা: <b>৳{cause.unitCost.toLocaleString()}</b>
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedCauseId(expandedCauseId === cause.id ? null : cause.id);
                        }}
                        className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
                      >
                        <span>{expandedCauseId === cause.id ? 'সংক্ষিপ্ত করুন' : 'বিস্তারিত বিবরণ'}</span>
                        {expandedCauseId === cause.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                    </div>

                    {/* Expandable Details */}
                    {expandedCauseId === cause.id && (
                      <div className="mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-900/50 space-y-2 text-xs text-slate-700 dark:text-slate-300 bg-white/60 dark:bg-slate-950/40 p-3 rounded-2xl">
                        <p className="leading-relaxed">{cause.fullDetails}</p>
                        <div className="space-y-1 pt-1">
                          <span className="font-black text-emerald-800 dark:text-emerald-300 block text-[11px]">মূল বৈশিষ্ট্যাবলী:</span>
                          <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                            {cause.highlights.map((h, i) => (
                              <li key={i}>{h}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick General Donation Form Box */}
          <div id="donation-payment-form" className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
            {/* Direct Patient Sponsor Notice if selected */}
            {selectedPatientToSponsor && (
              <div className="p-4 bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-amber-500/10 border-2 border-amber-500/60 dark:border-amber-400/40 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs animate-fadeIn">
                <div className="flex items-center gap-3">
                  <span className="text-2xl p-2 bg-amber-500/20 rounded-xl">🤲</span>
                  <div>
                    <div className="font-black text-slate-900 dark:text-white text-sm">
                      আপনি সরাসরি রোগী <span className="text-emerald-600 dark:text-emerald-400 font-black">{selectedPatientToSponsor.patientName}</span>-কে স্পন্সর করছেন
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                      আইডি: <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{selectedPatientToSponsor.code}</span> | 
                      ঠিকানা: <b>{selectedPatientToSponsor.villageOrUnion}, {selectedPatientToSponsor.upazilaOrArea}, {selectedPatientToSponsor.district}</b> | 
                      প্রয়োজনীয় আর্থিক সহায়তা: <b>৳{selectedPatientToSponsor.requestedAmount.toLocaleString()}</b>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPatientToSponsor(null);
                    setDonorMessage('');
                    setZakatSpecialInstructions('');
                  }}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950 text-slate-700 dark:text-slate-200 hover:text-rose-600 rounded-xl text-xs font-bold transition-all"
                >
                  ✕ রিসেট / সাধারণ খাতে দিন
                </button>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                  <CreditCard size={20} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    অনুদানের পরিমাণ ও পেমেন্ট বিবরণী
                  </h3>
                  <p className="text-xs text-slate-500">
                    নির্বাচিত খাত: <b className="text-emerald-600 dark:text-emerald-400">{selectedCause.title}</b>
                  </p>
                </div>
              </div>

              {/* Payment Highlight Pills */}
              <div className="flex flex-wrap gap-2">
                <div className="bg-pink-50 dark:bg-pink-950/50 border border-pink-200 dark:border-pink-800/40 px-3 py-1.5 rounded-2xl flex items-center gap-2">
                  <span className="text-[10px] font-black text-pink-700 dark:text-pink-300">bKash Personal:</span>
                  <span className="text-xs font-black text-pink-900 dark:text-pink-100">{activeBkashNumber}</span>
                  <button
                    onClick={() => handleCopy(activeBkashNumber, 'bkash_pill')}
                    className="p-1 bg-pink-200 dark:bg-pink-800 text-pink-800 dark:text-pink-100 rounded-lg hover:scale-105"
                    title="কপি করুন"
                  >
                    {copiedKey === 'bkash_pill' ? <Check size={11} /> : <Copy size={11} />}
                  </button>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/40 px-3 py-1.5 rounded-2xl flex items-center gap-2">
                  <span className="text-[10px] font-black text-amber-700 dark:text-amber-300">Nagad Personal:</span>
                  <span className="text-xs font-black text-amber-900 dark:text-amber-100">{activeNagadNumber}</span>
                  <button
                    onClick={() => handleCopy(activeNagadNumber, 'nagad_pill')}
                    className="p-1 bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-100 rounded-lg hover:scale-105"
                    title="কপি করুন"
                  >
                    {copiedKey === 'nagad_pill' ? <Check size={11} /> : <Copy size={11} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitDonation} className="space-y-6">
              {/* 1. Amount Selection */}
              <div className="space-y-2.5">
                <label className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                  অনুদানের টাকার পরিমাণ নির্ধারণ করুন *
                </label>

                {/* Preset Chips */}
                <div className="flex flex-wrap gap-2">
                  {selectedCause.suggestedAmounts.map((amt) => {
                    const isSelected = amount === amt && !isCustomAmount;
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleSelectPresetAmount(amt)}
                        className={`px-4 py-2 rounded-2xl font-black text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 scale-105'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        ৳{amt.toLocaleString()}
                      </button>
                    );
                  })}
                  
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomAmount(true);
                      setCustomAmountInput('');
                      setAmount(0);
                    }}
                    className={`px-4 py-2 rounded-2xl font-black text-xs transition-all cursor-pointer ${
                      isCustomAmount
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    অন্য পরিমাণ লিখুন
                  </button>
                </div>

                {/* Custom Input */}
                {isCustomAmount && (
                  <div className="relative max-w-xs animate-fadeIn">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">৳</span>
                    <input
                      type="text"
                      placeholder="টাকার পরিমাণ লিখুন (যেমন: ৫০০০)"
                      value={customAmountInput}
                      onChange={(e) => handleCustomAmountChange(e.target.value)}
                      className="w-full pl-8 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-sm font-black text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                      autoFocus
                    />
                  </div>
                )}

                {/* Impact Note */}
                <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-2xl text-xs text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-2 border border-emerald-200 dark:border-emerald-900/50">
                  <span>💡</span>
                  <span>
                    আপনার <b>৳{amount.toLocaleString()}</b> টাকা অনুদানে {selectedCause.unitCost > 0 ? (
                      `আনুমানিক ${(amount / selectedCause.unitCost).toFixed(1)} জন রোগীকে সরাসরি সহায়তা করা সম্ভব হবে।`
                    ) : 'অসহায় রোগীদের সর্বাধিক প্রয়োজনীয় জরুরি চিকিৎসা ব্যয় সম্পন্ন হবে।'}
                  </span>
                </div>
              </div>

              {/* 2. Payment Accounts Box */}
              <div className="bg-slate-50 dark:bg-slate-950/60 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                  নিচের যে কোনো নাম্বারে "Send Money" বা পেমেন্ট সম্পন্ন করে নিচের ফরমটি পূরণ করুন:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* bKash */}
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-pink-200 dark:border-pink-900/40 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-pink-600">বিকাশ (Personal)</span>
                      <span className="text-[10px] bg-pink-100 dark:bg-pink-900/40 text-pink-800 dark:text-pink-300 px-1.5 py-0.5 rounded font-bold">Send Money</span>
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">{activeBkashNumber}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(activeBkashNumber, 'bkash_box')}
                        className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-pink-100 text-slate-600 rounded-lg text-xs font-bold"
                      >
                        {copiedKey === 'bkash_box' ? <Check size={13} className="text-pink-600" /> : <Copy size={13} />}
                      </button>
                    </div>
                  </div>

                  {/* Nagad */}
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-orange-200 dark:border-orange-900/40 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-orange-600">নগদ (Personal)</span>
                      <span className="text-[10px] bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300 px-1.5 py-0.5 rounded font-bold">Send Money</span>
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">{activeNagadNumber}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(activeNagadNumber, 'nagad_box')}
                        className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-orange-100 text-slate-600 rounded-lg text-xs font-bold"
                      >
                        {copiedKey === 'nagad_box' ? <Check size={13} className="text-orange-600" /> : <Copy size={13} />}
                      </button>
                    </div>
                  </div>

                  {/* Rocket */}
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-purple-200 dark:border-purple-900/40 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-purple-600">রকেট (Personal)</span>
                      <span className="text-[10px] bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 px-1.5 py-0.5 rounded font-bold">Send Money</span>
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">{activeRocketNumber}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(activeRocketNumber, 'rocket_box')}
                        className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-purple-100 text-slate-600 rounded-lg text-xs font-bold"
                      >
                        {copiedKey === 'rocket_box' ? <Check size={13} className="text-purple-600" /> : <Copy size={13} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bank Details Accordion */}
                <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">🏦 ব্যাংক অ্যাকাউন্ট ট্রান্সফার:</span>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 grid grid-cols-1 sm:grid-cols-2 gap-1 pt-1">
                    <span>ব্যাংক: <b>{settings.bankDetails?.bankName}</b></span>
                    <span>অ্যাকাউন্ট নাম: <b>{settings.bankDetails?.accountName}</b></span>
                    <span>অ্যাকাউন্ট নং: <b>{settings.bankDetails?.accountNumber}</b></span>
                    <span>শাখা: <b>{settings.bankDetails?.branch}</b></span>
                  </div>
                </div>
              </div>

              {/* 3. Donor Personal Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    আপনার নাম *
                  </label>
                  <input
                    type="text"
                    placeholder="আপনার পূর্ণ নাম"
                    disabled={isAnonymous}
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500 disabled:opacity-50"
                  />
                  <label className="flex items-center gap-1.5 mt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-emerald-600"
                    />
                    <span className="text-[10px] text-slate-500">নাম প্রকাশে অনিচ্ছুক (Anonymous)</span>
                  </label>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    আপনার মোবাইল নম্বর *
                  </label>
                  <input
                    type="tel"
                    placeholder="০১৭xxxxxxxx"
                    value={donorPhone}
                    onChange={(e) => setDonorPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    আপনার জেলা / ঠিকানা
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: নীলফামারী / ঢাকা"
                    value={donorDistrict}
                    onChange={(e) => setDonorDistrict(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* 4. Payment Confirmation Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    পেমেন্ট মাধ্যম *
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                  >
                    <option value="bkash">বিকাশ (bKash)</option>
                    <option value="nagad">নগদ (Nagad)</option>
                    <option value="rocket">রকেট (Rocket)</option>
                    <option value="bank">ব্যাংক ডিপোজিট / ট্রান্সফার</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    যে নম্বর থেকে টাকা পাঠিয়েছেন (Sender Number) *
                  </label>
                  <input
                    type="tel"
                    placeholder="০১৫xxxxxxxx"
                    value={senderNumber}
                    onChange={(e) => setSenderNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    ট্রানজেকশন আইডি (TrxID) / রেফারেন্স *
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: 9J3K8S2P"
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-black text-slate-900 dark:text-white uppercase outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  রোগীদের জন্য কোনো বার্তা বা দোয়া (ঐচ্ছিক)
                </label>
                <textarea
                  rows={2}
                  placeholder="যেমন: আল্লাহ এই অসহায় মা ও শিশুদের শেফা ও বরকত দান করুন।"
                  value={donorMessage}
                  onChange={(e) => setDonorMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-700/20 transition-all hover:scale-[1.01] active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send size={16} />
                <span>{submitting ? 'অনুদান জমা হচ্ছে...' : `৳${amount.toLocaleString()} টাকা অনুদানের তথ্য জমা দিন`}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ZAKAT HEALTH SECTORS (স্বাস্থ্যখাতে যাকাত ফান্ড ও খাতসমূহ) */}
      {/* ========================================================================= */}
      {activePortalTab === 'zakat' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Zakat Header Card */}
          <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-slate-900/50 p-6 rounded-3xl border border-amber-400/30 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-amber-500 text-slate-950 rounded-2xl font-black shadow-md">
                <HandHeart size={22} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  স্বাস্থ্যখাতে যাকাতের শরিয়াহসম্মত ক্ষেত্রসমূহ (Zakat Health Fund)
                </h2>
                <p className="text-xs text-amber-700 dark:text-amber-300 font-bold">
                  যাকাত গ্রহণের যোগ্য (ফকির ও মিসকিন) রোগীদের চিকিৎসার যাবতীয় ব্যয়ে সরাসরি প্রদান
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              ইসলামি শরিয়াহ অনুযায়ী যাকাত প্রদানের মূল হকদার হলেন দরিদ্র, অসহায় ও চিকিৎসাবঞ্চিত মিসকিন রোগীরা। nilpha.com টিম পুঙ্খানুপুঙ্খ তথ্য (এনআইডি, প্রেসক্রিপশন ও পারিবারিক অবস্থা) যাচাই করে নিশ্চিত করে যে যাকাতের প্রতিটি পয়সা সরাসরি যোগ্য প্রসূতি মা, অপারেশনের রোগী ও ফ্রি প্রেসক্রিপশন ঔষধের পেছনে শরিয়াহসম্মতভাবে ব্যয় হচ্ছে।
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                onClick={() => setActivePortalTab('pledge')}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black px-4 py-2 rounded-xl shadow-md transition-transform hover:scale-105 flex items-center gap-1.5"
              >
                <FileText size={14} />
                <span>যাকাত প্রদানের আবেদন ফরম পূরণ করুন</span>
              </button>

              <button
                onClick={() => setActivePortalTab('calculator')}
                className="bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-black px-4 py-2 rounded-xl border border-amber-500/30 flex items-center gap-1.5"
              >
                <Calculator size={14} />
                <span>আপনার যাকাত হিসাব করুন</span>
              </button>
            </div>
          </div>

          {/* Zakat Specific Sectors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {zakatSectors.map((sector) => {
              const isSelected = selectedZakatSectorId === sector.id;
              return (
                <div
                  key={sector.id}
                  onClick={() => {
                    setSelectedZakatSectorId(sector.id);
                  }}
                  className={`p-5 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-4 relative ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 shadow-lg shadow-amber-500/10 scale-[1.01]'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-300'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl p-2.5 bg-amber-50 dark:bg-slate-800 rounded-2xl border border-amber-200 dark:border-amber-900/40">
                        {sector.icon}
                      </span>
                      <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                          {sector.title}
                        </h3>
                        <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-full inline-block mt-1">
                          ✓ শতভাগ যাকাতযোগ্য খাত
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {sector.shortDesc}
                    </p>
                  </div>

                  <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/40">
                      {sector.impactNote}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-400 font-bold">পরামর্শিত যাকাত অংক:</span>
                      <div className="flex gap-1">
                        {sector.suggestedAmounts.slice(0, 3).map((amt) => (
                          <span key={amt} className="text-[10px] font-black bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300">
                            ৳{amt >= 1000 ? `${amt / 1000}k` : amt}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedZakatSectorId(sector.id);
                        setActivePortalTab('pledge');
                      }}
                      className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black shadow transition-transform hover:scale-[1.02] flex items-center justify-center gap-1.5"
                    >
                      <span>এই খাতে যাকাত দিন</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: BENEFICIARY DIRECTORY (সাহায্যপ্রার্থী রোগী ও মায়েদের উন্মুক্ত তালিকা) */}
      {/* ========================================================================= */}
      {activePortalTab === 'beneficiaries' && (
        <div className="animate-fadeIn">
          <BeneficiaryDirectoryTab
            medicalApps={medicalApps}
            maternityApps={maternityApps}
            freeDoctorClaims={freeDoctorClaims}
            profile={profile}
            isAdmin={isAdmin}
            onOpenApplyModal={() => setShowAidModal(true)}
            onSponsorPatient={handleSponsorPatient}
            whatsappNumber={whatsappNumber}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ZAKAT PLEDGE & CONSULTATION APPLICATION FORM (আবেদন ও যোগাযোগ ফরম) */}
      {/* ========================================================================= */}
      {activePortalTab === 'pledge' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
            {/* Direct Patient Sponsor Notice if selected */}
            {selectedPatientToSponsor && (
              <div className="p-4 bg-gradient-to-r from-amber-500/10 via-teal-500/10 to-amber-500/10 border-2 border-amber-500/60 dark:border-amber-400/40 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs animate-fadeIn">
                <div className="flex items-center gap-3">
                  <span className="text-2xl p-2 bg-amber-500/20 rounded-xl">🤲</span>
                  <div>
                    <div className="font-black text-slate-900 dark:text-white text-sm">
                      আপনি নির্দিষ্ট রোগী <span className="text-amber-600 dark:text-amber-400 font-black">{selectedPatientToSponsor.patientName}</span>-এর চিকিৎসার উদ্দেশ্যে যাকাত প্রদান করছেন
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                      আইডি: <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{selectedPatientToSponsor.code}</span> | 
                      ঠিকানা: <b>{selectedPatientToSponsor.villageOrUnion}, {selectedPatientToSponsor.upazilaOrArea}, {selectedPatientToSponsor.district}</b> | 
                      প্রয়োজনীয় আর্থিক সহায়তা: <b>৳{selectedPatientToSponsor.requestedAmount.toLocaleString()}</b>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPatientToSponsor(null);
                    setZakatSpecialInstructions('');
                  }}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950 text-slate-700 dark:text-slate-200 hover:text-rose-600 rounded-xl text-xs font-bold transition-all"
                >
                  ✕ রিসেট / সাধারণ যাকাত খাত দিন
                </button>
              </div>
            )}

            {/* Header */}
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4 space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-teal-600 text-white rounded-2xl">
                  <FileText size={22} />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                    স্বাস্থ্যখাতে যাকাত প্রদানের আবেদন ও যোগাযোগ ফরম
                  </h2>
                  <p className="text-xs text-slate-500">
                    ফরমটি পূরণ করে জমা দিন, পরবর্তীতে আমাদের টিম আপনার সাথে ফোনে বা হোয়াটসঅ্যাপে যোগাযোগ করবে
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitZakatApplication} className="space-y-5">
              {/* 1. Sector Choice */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                  ১. আপনি কোন স্বাস্থ্য খাতে আপনার যাকাত ব্যয় করতে ইচ্ছুক? *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {zakatSectors.map((sector) => {
                    const isSelected = selectedZakatSectorId === sector.id;
                    return (
                      <div
                        key={sector.id}
                        onClick={() => setSelectedZakatSectorId(sector.id)}
                        className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-2.5 ${
                          isSelected
                            ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/30 text-teal-900 dark:text-teal-100 font-black'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span className="text-xl shrink-0">{sector.icon}</span>
                        <div className="text-xs">
                          <span className="block font-bold">{sector.title}</span>
                        </div>
                        {isSelected && <Check size={16} className="text-teal-600 ml-auto shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Amount & Payment Preference */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-slate-800 dark:text-slate-200 block mb-1">
                    ২. আনুমানিক যাকাত অনুদানের পরিমাণ (টাকায়)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-black">৳</span>
                    <input
                      type="number"
                      placeholder="যেমন: ৫০০০ বা ৫০০০০"
                      value={zakatEstimatedAmount}
                      onChange={(e) => setZakatEstimatedAmount(e.target.value)}
                      className="w-full pl-8 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-black text-slate-900 dark:text-white outline-none focus:border-teal-500"
                    />
                  </div>
                  {/* Quick Select */}
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {[2000, 5000, 10000, 25000, 50000, 100000].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setZakatEstimatedAmount(String(amt))}
                        className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-teal-100 dark:hover:bg-teal-900 px-2 py-1 rounded-lg"
                      >
                        ৳{amt.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-800 dark:text-slate-200 block mb-1">
                    ৩. যাকাত হস্তান্তরের পছন্দের মাধ্যম
                  </label>
                  <select
                    value={zakatPaymentPref}
                    onChange={(e) => setZakatPaymentPref(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-teal-500"
                  >
                    <option value="bkash">বিকাশ পার্সোনাল ({activeBkashNumber})</option>
                    <option value="nagad">নগদ পার্সোনাল ({activeNagadNumber})</option>
                    <option value="rocket">রকেট পার্সোনাল ({activeRocketNumber})</option>
                    <option value="bank">ব্যাংক একাউন্ট ট্রান্সফার</option>
                    <option value="in_person">সরাসরি প্রতিনিধি সাক্ষাৎ / হাসপাতালে এসে প্রদান</option>
                    <option value="undecided">ফোনে কথা বলে সিদ্ধান্ত নেব</option>
                  </select>
                </div>
              </div>

              {/* Checkbox: I already sent the money */}
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-900/40 space-y-2.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={zakatIsDirectPaid}
                    onChange={(e) => setZakatIsDirectPaid(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600"
                  />
                  <span className="text-xs font-black text-amber-900 dark:text-amber-200">
                    ✓ আমি ইতিমধ্যে বিকাশ/নগদ/ব্যাংকে যাকাতের টাকা পাঠিয়ে দিয়েছি
                  </span>
                </label>

                {zakatIsDirectPaid && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 animate-fadeIn">
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-1">যে নম্বর থেকে পাঠিয়েছেন (Sender Phone) *</label>
                      <input
                        type="tel"
                        placeholder="০১৫xxxxxxxx"
                        value={zakatSenderNumber}
                        onChange={(e) => setZakatSenderNumber(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                        required={zakatIsDirectPaid}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-1">ট্রানজেকশন আইডি (TrxID) *</label>
                      <input
                        type="text"
                        placeholder="TrxID..."
                        value={zakatTrxId}
                        onChange={(e) => setZakatTrxId(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-black uppercase text-slate-900 dark:text-white"
                        required={zakatIsDirectPaid}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Donor Personal Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    আপনার নাম *
                  </label>
                  <input
                    type="text"
                    placeholder="আপনার পূর্ণ নাম"
                    value={zakatDonorName}
                    onChange={(e) => setZakatDonorName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-teal-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    মোবাইল ও হোয়াটসঅ্যাপ নম্বর *
                  </label>
                  <input
                    type="tel"
                    placeholder="০১৭xxxxxxxx"
                    value={zakatPhone}
                    onChange={(e) => setZakatPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-teal-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    জেলা *
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: নীলফামারী, রংপুর, ঢাকা"
                    value={zakatDistrict}
                    onChange={(e) => setZakatDistrict(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-teal-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  পূর্ণাঙ্গ ঠিকানা ও থানা/উপজেলা *
                </label>
                <input
                  type="text"
                  placeholder="যেমন: গ্রাম: দুহুলী, থানা: ডিমলা, নীলফামারী"
                  value={zakatAddress}
                  onChange={(e) => setZakatAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-teal-500"
                  required
                />
              </div>

              {/* 4. Special Instructions & Contact Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    যোগাযোগের সুবিধাজনক সময়
                  </label>
                  <select
                    value={zakatContactTime}
                    onChange={(e) => setZakatContactTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  >
                    <option value="যে কোনো সময়">যে কোনো সময়</option>
                    <option value="সকাল (৯টা - ১২টা)">সকাল (৯টা - ১২টা)</option>
                    <option value="দুপুর (১২টা - ৩টা)">দুপুর (১২টা - ৩টা)</option>
                    <option value="বিকাল (৩টা - ৬টা)">বিকাল (৩টা - ৬টা)</option>
                    <option value="রাত (৮টা - ১০টা)">রাত (৮টা - ১০টা)</option>
                    <option value="শুধু হোয়াটসঅ্যাপে মেসেজ">শুধু হোয়াটসঅ্যাপে মেসেজ দিন</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    বিশেষ নির্দেশনা বা রোগীর অগ্রাধিকার (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: স্থানীয় কোনো প্রসূতি মা বা অপারেশনের রোগীর প্রেসক্রিপশন দেখে দেবেন"
                    value={zakatSpecialInstructions}
                    onChange={(e) => setZakatSpecialInstructions(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submittingZakat}
                  className="w-full py-3.5 bg-gradient-to-r from-teal-700 to-emerald-800 hover:from-teal-800 hover:to-emerald-900 text-white rounded-2xl font-black text-sm shadow-xl shadow-teal-900/30 transition-transform hover:scale-[1.01] active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send size={16} />
                  <span>{submittingZakat ? 'আবেদন জমা হচ্ছে...' : 'যাকাত প্রদানের আবেদন ও তথ্য জমা দিন'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: ZAKAT CALCULATOR (সহজ যাকাত হিসাব ক্যালকুলেটর) */}
      {/* ========================================================================= */}
      {activePortalTab === 'calculator' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="p-3 bg-slate-800 text-cyan-400 rounded-2xl shadow">
                <Calculator size={24} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  সহজ যাকাত ক্যালকুলেটর (Zakat Calculator)
                </h2>
                <p className="text-xs text-slate-500">
                  আপনার মোট নগদ অর্থ, স্বর্ণ ও ব্যবসার নিট সম্পদের উপর ২.৫% যাকাত হিসাব করুন
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Inputs */}
              <div className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    ১. ঘরে সংরক্ষিত নগদ টাকা (Cash in Hand)
                  </label>
                  <input
                    type="number"
                    placeholder="৳ ০"
                    value={calcCash}
                    onChange={(e) => setCalcCash(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    ২. ব্যাংক একাউন্ট ও ডিপিএস ব্যালেন্স (Bank Savings)
                  </label>
                  <input
                    type="number"
                    placeholder="৳ ০"
                    value={calcBank}
                    onChange={(e) => setCalcBank(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    ৩. সোনা ও রূপার বর্তমান বাজারমূল্য (Gold & Silver)
                  </label>
                  <input
                    type="number"
                    placeholder="৳ ০"
                    value={calcGoldValue}
                    onChange={(e) => setCalcGoldValue(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    ৪. ব্যবসায়ের বিক্রয়যোগ্য পণ্যের মূল্য (Business Merchandise)
                  </label>
                  <input
                    type="number"
                    placeholder="৳ ০"
                    value={calcBusinessAssets}
                    onChange={(e) => setCalcBusinessAssets(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-rose-600 dark:text-rose-400 block mb-1">
                    ৫. বাদ: তাৎক্ষণিক ঋণ বা দেনা (Immediate Debts)
                  </label>
                  <input
                    type="number"
                    placeholder="৳ ০"
                    value={calcDebts}
                    onChange={(e) => setCalcDebts(e.target.value)}
                    className="w-full px-3 py-2 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              {/* Calculation Summary Box */}
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-6 rounded-3xl border border-slate-800 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider block">
                    যাকাতের হিসাব সারসংক্ষেপ
                  </span>

                  <div className="space-y-2 text-xs text-slate-300">
                    <div className="flex justify-between">
                      <span>মোট যাকাতযোগ্য সম্পদ:</span>
                      <span className="font-bold text-white">৳{zakatCalculationResult.totalAssets.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-rose-300">
                      <span>বাদ তাৎক্ষণিক ঋণ:</span>
                      <span className="font-bold">- ৳{zakatCalculationResult.debts.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-800 text-sm font-black text-white">
                      <span>নিট যাকাতযোগ্য সম্পদ:</span>
                      <span className="text-emerald-300">৳{zakatCalculationResult.netWealth.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Payable Amount Highlight */}
                <div className="p-4 bg-amber-500/20 border border-amber-400/40 rounded-2xl space-y-1">
                  <span className="text-[11px] text-amber-300 font-bold block">আপনার প্রদেয় যাকাত (২.৫%):</span>
                  <span className="text-2xl sm:text-3xl font-black text-amber-300">
                    ৳{zakatCalculationResult.zakatPayable.toLocaleString()}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setZakatEstimatedAmount(String(zakatCalculationResult.zakatPayable));
                    setActivePortalTab('pledge');
                  }}
                  disabled={zakatCalculationResult.zakatPayable <= 0}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-slate-950 rounded-xl font-black text-xs shadow-lg transition-transform hover:scale-105 flex items-center justify-center gap-1.5"
                >
                  <span>এই পরিমাণ যাকাত দিতে আবেদন ফরম পূরণ করুন</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. PUBLIC LIVE VERIFIED DONOR RECORD FEED */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <UserCheck className="text-emerald-600 dark:text-emerald-400" size={20} />
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              সাম্প্রতিক অনুদান ও যাকাত সহায়তা তালিকা
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-bold">
            মোট ভেরিফাইড ডোনার: {publicDonations.length} জন
          </span>
        </div>

        {publicDonations.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            এখনও কোনো ডোনেশন তালিকাভুক্ত হয়নি। প্রথম ডোনার হিসেবে আপনিও শরিক হতে পারেন।
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {publicDonations.slice(0, 9).map((d) => (
              <div
                key={d.id}
                className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 dark:text-white line-clamp-1">
                    {d.donorName}
                  </span>
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                    ৳{d.amount.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span className="line-clamp-1">{d.causeTitle}</span>
                  <span>{d.donorDistrict}</span>
                </div>

                {d.donorMessage && (
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 italic line-clamp-1 border-t border-slate-200 dark:border-slate-700/40 pt-1">
                    "{d.donorMessage}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. ADMIN PANEL (Visible to Admin Role) */}
      {/* ========================================================================= */}
      {isAdmin && (
        <div className="bg-slate-950 text-white rounded-3xl p-6 border-2 border-emerald-500/50 shadow-2xl space-y-6 animate-fadeIn">
          {/* Admin Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-600 text-white rounded-2xl">
                <Sliders size={22} />
              </div>
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <span>এডমিন কন্ট্রোল: ডোনেশন ও যাকাত ফান্ড ম্যানেজার</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30">
                    Admin
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  অনুদানের ট্রানজেকশন যাচাই, যাকাত আবেদনের ফলোআপ ও পেমেন্ট নম্বর সেটিংস
                </p>
              </div>
            </div>

            {/* Admin Sub-Tabs */}
            <div className="flex flex-wrap gap-1.5 bg-slate-900 p-1 rounded-2xl border border-slate-800">
              <button
                onClick={() => setAdminTab('donations')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  adminTab === 'donations' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                অনুদানের তালিকা ({donations.length})
              </button>
              <button
                onClick={() => setAdminTab('medical_apps')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  adminTab === 'medical_apps' ? 'bg-indigo-600 text-white font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                চিকিৎসা আবেদন ({medicalApps.length})
              </button>
              <button
                onClick={() => setAdminTab('zakat_apps')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  adminTab === 'zakat_apps' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                যাকাত আবেদনসমূহ ({zakatApplications.length})
              </button>
              <button
                onClick={() => setAdminTab('settings')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  adminTab === 'settings' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                পেমেন্ট নম্বর সেটিংস
              </button>
            </div>
          </div>

          {/* Tab 1: General Donations Table */}
          {adminTab === 'donations' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  placeholder="নাম, ফোন, TrxID দিয়ে সার্চ..."
                  value={adminSearch}
                  onChange={(e) => setAdminSearch(e.target.value)}
                  className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-emerald-500 min-w-[200px]"
                />
                <select
                  value={adminFilterStatus}
                  onChange={(e) => setAdminFilterStatus(e.target.value)}
                  className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                >
                  <option value="all">সকল স্ট্যাটাস</option>
                  <option value="pending">অপেক্ষমান (Pending)</option>
                  <option value="verified">ভেরিফাইড (Verified)</option>
                  <option value="acknowledged">কৃতজ্ঞতাপত্র প্রেরিত</option>
                  <option value="rejected">বাতিল</option>
                </select>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="p-2.5">রসিদ / তারিখ</th>
                      <th className="p-2.5">ডোনার ও ফোন</th>
                      <th className="p-2.5">খাত</th>
                      <th className="p-2.5">পরিমাণ</th>
                      <th className="p-2.5">পেমেন্ট ও TrxID</th>
                      <th className="p-2.5">স্ট্যাটাস</th>
                      <th className="p-2.5 text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {adminFilteredDonations.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-900/60">
                        <td className="p-2.5">
                          <span className="font-mono text-emerald-400 block">{d.donationCode}</span>
                          <span className="text-[10px] text-slate-500">{new Date(d.createdAt).toLocaleDateString()}</span>
                        </td>
                        <td className="p-2.5">
                          <span className="font-bold text-white block">{d.donorName}</span>
                          <span className="text-[10px] text-slate-400">{d.donorPhone} ({d.donorDistrict})</span>
                        </td>
                        <td className="p-2.5 max-w-[160px] truncate text-slate-300">{d.causeTitle}</td>
                        <td className="p-2.5 font-black text-amber-300">৳{d.amount.toLocaleString()}</td>
                        <td className="p-2.5">
                          <span className="uppercase text-slate-300 font-bold block">{d.paymentMethod}</span>
                          <span className="font-mono text-cyan-300 text-[10px]">{d.trxId}</span>
                        </td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            d.status === 'verified' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                            d.status === 'acknowledged' ? 'bg-blue-950 text-blue-300 border border-blue-800' :
                            d.status === 'rejected' ? 'bg-rose-950 text-rose-300' : 'bg-amber-950 text-amber-300'
                          }`}>
                            {d.status}
                          </span>
                        </td>
                        <td className="p-2.5 text-right space-x-1">
                          {d.status !== 'verified' && (
                            <button
                              onClick={() => handleUpdateStatus(d.id, 'verified')}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold"
                            >
                              Verify
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteDonation(d.id)}
                            className="px-2 py-1 bg-rose-900/60 hover:bg-rose-800 text-rose-200 rounded-lg text-[10px]"
                          >
                            মুছুন
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 2: Zakat Applications Table */}
          {adminTab === 'zakat_apps' && (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="p-2.5">কোড / তারিখ</th>
                      <th className="p-2.5">আবেদনকারী ও ঠিকানা</th>
                      <th className="p-2.5">নির্বাচিত যাকাত খাত</th>
                      <th className="p-2.5">পরিমাণ ও মাধ্যম</th>
                      <th className="p-2.5">যোগাযোগ সময় / নোট</th>
                      <th className="p-2.5">স্ট্যাটাস</th>
                      <th className="p-2.5 text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {zakatApplications.map((z) => (
                      <tr key={z.id} className="hover:bg-slate-900/60">
                        <td className="p-2.5">
                          <span className="font-mono text-amber-400 font-bold block">{z.applicationCode}</span>
                          <span className="text-[10px] text-slate-500">{new Date(z.createdAt).toLocaleDateString()}</span>
                        </td>
                        <td className="p-2.5">
                          <span className="font-bold text-white block">{z.donorName}</span>
                          <span className="text-[10px] text-emerald-400 font-mono block">{z.donorPhone}</span>
                          <span className="text-[10px] text-slate-400">{z.donorAddress} ({z.donorDistrict})</span>
                        </td>
                        <td className="p-2.5 text-slate-300 max-w-[180px]">{z.zakatSectorTitle}</td>
                        <td className="p-2.5">
                          <span className="font-black text-amber-300 block">
                            {z.estimatedAmount ? `৳${z.estimatedAmount.toLocaleString()}` : 'অনির্দিষ্ট'}
                          </span>
                          <span className="text-[10px] text-slate-400 capitalize">{z.paymentMethodPreference}</span>
                          {z.trxId && <span className="font-mono text-[10px] text-cyan-300 block">Trx: {z.trxId}</span>}
                        </td>
                        <td className="p-2.5 text-slate-300 text-[11px]">
                          <span className="block text-slate-400">সময়: {z.contactTimePreference || 'যে কোনো সময়'}</span>
                          {z.specialInstructions && <span className="italic text-slate-400 text-[10px]">"{z.specialInstructions}"</span>}
                        </td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            z.status === 'collected' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                            z.status === 'contacted' ? 'bg-blue-950 text-blue-300' :
                            z.status === 'approved' ? 'bg-teal-950 text-teal-300' : 'bg-amber-950 text-amber-300'
                          }`}>
                            {z.status}
                          </span>
                        </td>
                        <td className="p-2.5 text-right space-x-1">
                          <a
                            href={`https://wa.me/${z.donorPhone.replace(/[^0-9]/g, '')}?text=হ্যালো ${encodeURIComponent(z.donorName)}, nilpha.com যাকাত ফান্ড থেকে যোগাযোগ করছি।`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] inline-block font-bold"
                          >
                            WhatsApp
                          </a>
                          <button
                            onClick={() => handleUpdateZakatStatus(z.id, 'contacted')}
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px]"
                          >
                            Contacted
                          </button>
                          <button
                            onClick={() => handleUpdateZakatStatus(z.id, 'collected')}
                            className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px]"
                          >
                            Collected
                          </button>
                          <button
                            onClick={() => handleDeleteZakatApp(z.id)}
                            className="px-2 py-1 bg-rose-900/50 hover:bg-rose-800 text-rose-300 rounded-lg text-[10px]"
                          >
                            মুছুন
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab: Medical Assistance Applications Table */}
          {adminTab === 'medical_apps' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs text-slate-400">
                  মোট চিকিৎসা অনুদান আবেদন: <b className="text-indigo-400">{medicalApps.length}</b> টি (সিজার, অপারেশন, ডাক্তার ফি, ওষুধ ইত্যাদি)
                </div>
                <button
                  type="button"
                  onClick={() => setShowAidModal(true)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1"
                >
                  <PlusCircle size={13} />
                  <span>নতুন রোগী আবেদন যোগ করুন</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="p-2.5">কোড / তারিখ</th>
                      <th className="p-2.5">রোগীর নাম ও পরিচয়</th>
                      <th className="p-2.5">ঠিকানা (গ্রাম/ইউনিয়ন/উপজেলা/জেলা)</th>
                      <th className="p-2.5">সাহায্যের ধরণ ও বিবরণ</th>
                      <th className="p-2.5">প্রয়োজনীয় অর্থ</th>
                      <th className="p-2.5">স্ট্যাটাস</th>
                      <th className="p-2.5 text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {medicalApps.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-400 text-xs">
                          কোনো চিকিৎসা আবেদন জমা পড়েনি।
                        </td>
                      </tr>
                    ) : (
                      medicalApps.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-900/60">
                          <td className="p-2.5">
                            <span className="font-mono text-indigo-400 font-bold block">{m.code}</span>
                            <span className="text-[10px] text-slate-500">{new Date(m.createdAt).toLocaleDateString()}</span>
                          </td>
                          <td className="p-2.5">
                            <span className="font-bold text-white block">{m.patientName}</span>
                            <span className="text-[10px] text-emerald-400 font-mono block">{m.contactPhone}</span>
                            <span className="text-[10px] text-slate-400">
                              {m.age ? `${m.age} বছর` : ''} {m.gender === 'female' ? 'নারী' : m.gender === 'male' ? 'পুরুষ' : ''} 
                              {m.guardianName ? `(অভিভাবক: ${m.guardianName})` : ''}
                            </span>
                          </td>
                          <td className="p-2.5 text-slate-300 max-w-[160px]">
                            <span className="block font-medium">{m.villageOrUnion}</span>
                            <span className="text-[10px] text-slate-400">{m.upazilaOrArea}, {m.district}</span>
                          </td>
                          <td className="p-2.5 text-slate-300 max-w-[200px]">
                            <span className="font-bold text-indigo-300 block">{m.aidCategoryTitle}</span>
                            <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{m.problemDescription}</p>
                            {m.hospitalOrClinicName && (
                              <span className="text-[10px] text-slate-500 block">হাসপাতাল: {m.hospitalOrClinicName}</span>
                            )}
                          </td>
                          <td className="p-2.5">
                            <span className="font-black text-amber-300 block">
                              ৳{m.requestedAmount.toLocaleString()}
                            </span>
                            {m.collectedAmount && m.collectedAmount > 0 && (
                              <span className="text-[10px] text-emerald-400 font-bold">
                                উত্তোলিত: ৳{m.collectedAmount.toLocaleString()}
                              </span>
                            )}
                          </td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              m.status === 'verified' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                              m.status === 'funded' ? 'bg-teal-950 text-teal-300 border border-teal-800' :
                              m.status === 'completed' ? 'bg-blue-950 text-blue-300 border border-blue-800' :
                              m.status === 'rejected' ? 'bg-rose-950 text-rose-300' :
                              m.status === 'under_review' ? 'bg-purple-950 text-purple-300' : 'bg-amber-950 text-amber-300'
                            }`}>
                              {m.status}
                            </span>
                          </td>
                          <td className="p-2.5 text-right space-x-1 whitespace-nowrap">
                            <a
                              href={`https://wa.me/${m.contactPhone.replace(/[^0-9]/g, '')}?text=হ্যালো ${encodeURIComponent(m.patientName)}, nilpha.com স্বাস্থ্য অনুদান পোর্টাল থেকে যোগাযোগ করছি।`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] inline-block font-bold"
                            >
                              WhatsApp
                            </a>
                            {m.status !== 'verified' && (
                              <button
                                onClick={() => handleUpdateMedicalStatus(m.id, 'verified')}
                                className="px-2 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-[10px]"
                                title="ভেরিফাইড করুন"
                              >
                                Verify
                              </button>
                            )}
                            {m.status !== 'funded' && (
                              <button
                                onClick={() => handleUpdateMedicalStatus(m.id, 'funded')}
                                className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px]"
                                title="অর্থায়ন নিশ্চিত"
                              >
                                Funded
                              </button>
                            )}
                            {m.status !== 'completed' && (
                              <button
                                onClick={() => handleUpdateMedicalStatus(m.id, 'completed')}
                                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px]"
                                title="চিকিৎসা সম্পন্ন"
                              >
                                Done
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteMedicalApp(m.id)}
                              className="px-2 py-1 bg-rose-900/50 hover:bg-rose-800 text-rose-300 rounded-lg text-[10px]"
                            >
                              মুছুন
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 3: Payment Settings Form */}
          {adminTab === 'settings' && (
            <form onSubmit={handleSaveSettings} className="space-y-4 max-w-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-300 block mb-1">বিকাশ পার্সোনাল নম্বর *</label>
                  <input
                    type="text"
                    value={editingSettings.bkashNumber}
                    onChange={(e) => setEditingSettings({ ...editingSettings, bkashNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-300 block mb-1">নগদ নম্বর</label>
                  <input
                    type="text"
                    value={editingSettings.nagadNumber}
                    onChange={(e) => setEditingSettings({ ...editingSettings, nagadNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-300 block mb-1">রকেট নম্বর</label>
                  <input
                    type="text"
                    value={editingSettings.rocketNumber || ''}
                    onChange={(e) => setEditingSettings({ ...editingSettings, rocketNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-300 block mb-1">হটলাইন নম্বর</label>
                  <input
                    type="text"
                    value={editingSettings.hotline}
                    onChange={(e) => setEditingSettings({ ...editingSettings, hotline: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-300 block mb-1">জরুরি নোটিশ</label>
                  <input
                    type="text"
                    value={editingSettings.emergencyNotice || ''}
                    onChange={(e) => setEditingSettings({ ...editingSettings, emergencyNotice: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={adminSavingSettings}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-lg"
              >
                {adminSavingSettings ? 'সেভ হচ্ছে...' : 'সেটিংস সংরক্ষণ করুন'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Medical Aid Application Modal */}
      <MedicalAidApplicationModal
        isOpen={showAidModal}
        onClose={() => setShowAidModal(false)}
        profile={profile}
        onSuccess={(newApp) => {
          setMedicalApps(prev => [newApp, ...prev]);
          setShowAidModal(false);
        }}
      />
    </div>
  );
};
