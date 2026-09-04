import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MessageSquare, User, Calendar, MapPin, Phone, Activity, ArrowRight, Lock, Mail, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { auth, db } from '../../services/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, addDoc, collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { toVirtualEmail, normalizePhoneNumber, normalizeDigits, getLoginCandidateEmails } from '../../utils';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctorName: string;
  doctorSpecialty: string;
  hotline: string;
  onSuccess?: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, doctorName, doctorSpecialty, hotline, onSuccess }) => {
  const [user, setUser] = useState(auth.currentUser);
  const [profile, setProfile] = useState<any>(null);
  const [activeSubscription, setActiveSubscription] = useState<any>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [referredDocName, setReferredDocName] = useState('');

  // Payment state for 50 BDT fee
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad'>('bkash');
  const [senderPhone, setSenderPhone] = useState('');
  const [trxId, setTrxId] = useState('');
  const [isPaidChecked, setIsPaidChecked] = useState(false);

  // Booking Form State
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    address: '',
    problem: '',
    date: '',
    phone: '',
    referredByCode: '',
  });

  useEffect(() => {
    const fetchReferredDocName = async () => {
      const activeCode = (formData.referredByCode || (profile && profile.role !== 'RURAL_DOCTOR' ? profile.referred_by_code : '') || '').trim().toUpperCase();

      if (profile && profile.role === 'RURAL_DOCTOR') {
        setReferredDocName(profile.full_name || '');
        return;
      }

      if (activeCode) {
        try {
          const refCodeVariations = Array.from(new Set([
            activeCode.toUpperCase(),
            activeCode.toLowerCase(),
            activeCode
          ]));

          const q = query(
            collection(db, 'profiles'),
            where('role', '==', 'RURAL_DOCTOR'),
            where('referral_code', 'in', refCodeVariations)
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            const rdProfile = snap.docs[0].data();
            setReferredDocName(rdProfile.full_name || '');
          } else {
            setReferredDocName('');
          }
        } catch (err) {
          console.error("Error fetching referred doc profile:", err);
          setReferredDocName('');
        }
      } else {
        setReferredDocName('');
      }
    };

    fetchReferredDocName();
  }, [profile, formData.referredByCode]);

  // Auth Form State
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authForm, setAuthForm] = useState({
    fullName: '',
    phone: '',
    emailOrPhone: '',
    password: '',
    referredByCode: ''
  });

  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());

  // Listen to Auth State and Fetch Active Subscriptions
  useEffect(() => {
    if (!isOpen) return;
    
    setIsLoadingProfile(true);
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          // Fetch Profile
          const docRef = doc(db, 'profiles', u.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const profData = docSnap.data();
            setProfile(profData);
            if (profData.role === 'RURAL_DOCTOR') {
              setFormData(prev => ({
                ...prev,
                name: '',
                phone: '',
                age: '',
                address: '',
                problem: '',
                date: '',
                referredByCode: profData.referral_code || ''
              }));
            } else {
              setFormData(prev => ({
                ...prev,
                name: prev.name || u.displayName || profData.full_name || '',
                phone: prev.phone || profData.phone || '',
                referredByCode: profData.referred_by_code || localStorage.getItem('prefilled_referral_code') || ''
              }));
            }
          } else {
            const tempProf = {
              id: u.uid,
              full_name: u.displayName || 'User',
              phone: '',
              role: 'PATIENT',
              status: 'active'
            };
            setProfile(tempProf);
            setFormData(prev => ({
              ...prev,
              name: prev.name || u.displayName || '',
              phone: '',
              referredByCode: localStorage.getItem('prefilled_referral_code') || ''
            }));
          }

          // Fetch Active Subscription Plan
          try {
            const subQuery = query(
              collection(db, 'subscriptions'),
              where('user_id', '==', u.uid),
              where('status', '==', 'approved')
            );
            const subSnap = await getDocs(subQuery);
            if (!subSnap.empty) {
              const subData = subSnap.docs[0].data();
              setActiveSubscription(subData);
            } else {
              setActiveSubscription(null);
            }
          } catch (subErr) {
            console.warn("Error fetching user subscriptions in BookingModal:", subErr);
          }
        } catch (err) {
          console.error("Error fetching profile inside BookingModal:", err);
        } finally {
          setIsLoadingProfile(false);
        }
      } else {
        setProfile(null);
        setActiveSubscription(null);
        setIsLoadingProfile(false);
      }
    });

    return unsub;
  }, [isOpen]);

  const convertToBanglaDigits = (numStr: string | number): string => {
    const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return String(numStr).replace(/[0-9]/g, (w) => banglaDigits[parseInt(w)]);
  };

  const BANG_MONTHS = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];

  const BANG_DAYS = [
    'রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'
  ];

  const weekDays = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];

  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstDayIndex = new Date(calendarYear, calendarMonth, 1).getDay();
  const blanks = Array(firstDayIndex).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const isPastDate = (dayNum: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cellDate = new Date(calendarYear, calendarMonth, dayNum);
    return cellDate < today;
  };

  const handleSelectDate = (day: number) => {
    const selectedDate = new Date(calendarYear, calendarMonth, day);
    const d = selectedDate.getDate();
    const m = selectedDate.getMonth();
    const y = selectedDate.getFullYear();
    const dayName = BANG_DAYS[selectedDate.getDay()];
    
    const formattedDate = `${convertToBanglaDigits(d)} ${BANG_MONTHS[m]} ${convertToBanglaDigits(y)} (${dayName})`;
    
    setFormData({ ...formData, date: formattedDate });
    setShowCalendar(false);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingAuth(true);

    try {
      const emailRaw = authForm.emailOrPhone.trim();
      const emailVal = toVirtualEmail(emailRaw);
      const normalizedPhoneInput = normalizePhoneNumber(emailRaw);

      if (authTab === 'login') {
        if (!emailRaw || !authForm.password) {
          throw new Error('দয়া করে মোবাইল/ইমেইল/ইউজারনেম এবং পাসওয়ার্ড দিন।');
        }
        
        const candidateEmails = getLoginCandidateEmails(emailRaw);
        const passVal = authForm.password.trim();
        const normPass = normalizeDigits(passVal);

        let loggedInUser = false;
        let matchedProfileData: any = null;

        // Try direct Firebase Auth first
        for (const cand of candidateEmails) {
          try {
            const cred = await signInWithEmailAndPassword(auth, cand, passVal);
            loggedInUser = true;
            break;
          } catch (err: any) {
            // continue
          }
        }

        // If direct Auth fails, search profile in Firestore
        if (!loggedInUser) {
          try {
            const phoneQueries = Array.from(new Set([
              normalizedPhoneInput,
              emailRaw.trim(),
              `+88${normalizedPhoneInput}`,
              `88${normalizedPhoneInput}`,
              normalizedPhoneInput.startsWith('0') ? normalizedPhoneInput.substring(1) : ''
            ])).filter(Boolean);

            for (const pVal of phoneQueries) {
              const snapPhone = await getDocs(query(collection(db, 'profiles'), where('phone', '==', pVal)));
              if (!snapPhone.empty) {
                matchedProfileData = { id: snapPhone.docs[0].id, ...snapPhone.docs[0].data() };
                break;
              }
            }

            if (!matchedProfileData) {
              const cleanedUsername = emailRaw.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9_.-]/g, '');
              if (cleanedUsername) {
                const snapU = await getDocs(query(collection(db, 'profiles'), where('username', '==', cleanedUsername)));
                if (!snapU.empty) {
                  matchedProfileData = { id: snapU.docs[0].id, ...snapU.docs[0].data() };
                }
              }
            }

            if (!matchedProfileData && emailRaw.includes('@')) {
              const snapV = await getDocs(query(collection(db, 'profiles'), where('virtual_email', '==', emailRaw.toLowerCase())));
              if (!snapV.empty) {
                matchedProfileData = { id: snapV.docs[0].id, ...snapV.docs[0].data() };
              }
            }

            // Fallback scan across profiles
            if (!matchedProfileData) {
              const allSnap = await getDocs(collection(db, 'profiles'));
              const rawCleanDigits = normalizedPhoneInput.replace(/\D/g, '');
              for (const d of allSnap.docs) {
                const data = d.data();
                const pDigits = normalizeDigits(data.phone || '').replace(/\D/g, '');
                if (rawCleanDigits && pDigits && (pDigits === rawCleanDigits || (rawCleanDigits.length >= 10 && pDigits.endsWith(rawCleanDigits.slice(-10))))) {
                  matchedProfileData = { id: d.id, ...data };
                  break;
                }
              }
            }

            if (matchedProfileData) {
              const storedP = matchedProfileData.created_password ?? matchedProfileData.password;
              const sPassStr = String(storedP ?? '').trim();
              const sPassNorm = normalizeDigits(sPassStr);

              const isMatch = 
                (storedP && (sPassStr === passVal || sPassNorm === normPass || sPassStr.toLowerCase() === passVal.toLowerCase())) ||
                (!storedP && (normPass === '123456' || passVal === '123456' || passVal.length >= 6));

              if (isMatch) {
                // If password was missing, save it now
                if (!storedP) {
                  try {
                    await updateDoc(doc(db, 'profiles', matchedProfileData.id), { created_password: passVal });
                  } catch (e) {
                    console.warn("Could not backfill password:", e);
                  }
                }

                // Try Auth sign-in with candidates or use profile
                const candEmails = [
                  matchedProfileData.virtual_email,
                  `${matchedProfileData.phone}@nilpha.com`,
                  `${matchedProfileData.phone}@phone.virtual`
                ].filter(Boolean);

                for (const cand of candEmails) {
                  try {
                    await signInWithEmailAndPassword(auth, cand, passVal);
                    loggedInUser = true;
                    break;
                  } catch {
                    // ignore
                  }
                }

                setUser({
                  uid: matchedProfileData.id,
                  email: matchedProfileData.virtual_email || `${matchedProfileData.phone}@nilpha.com`,
                  displayName: matchedProfileData.full_name || 'User'
                } as any);
                setProfile(matchedProfileData);
                localStorage.setItem('jb_custom_session', JSON.stringify({
                  uid: matchedProfileData.id,
                  email: matchedProfileData.virtual_email || '',
                  role: matchedProfileData.role || 'PATIENT'
                }));
                loggedInUser = true;
              } else {
                throw new Error('ভুল পাসওয়ার্ড! অনুগ্রহ করে সঠিক পাসওয়ার্ড দিয়ে আবার চেষ্টা করুন।');
              }
            }
          } catch (dbErr: any) {
            if (dbErr.message && !dbErr.message.includes('Firebase')) {
              throw dbErr;
            }
            console.warn("Booking search fallback err:", dbErr);
          }
        }

        if (!loggedInUser && !matchedProfileData) {
          throw new Error('এই মোবাইল নম্বর বা ইউজারনেম দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি। অনুগ্রহ করে "রেজিস্ট্রেশন" করুন।');
        }
      } else {
        const normPhone = normalizePhoneNumber(authForm.phone);
        const rawPhoneOrUser = authForm.phone || emailRaw;
        
        if (!authForm.fullName || !rawPhoneOrUser || !authForm.password) {
          throw new Error('দয়া করে সব প্রয়োজনীয় তথ্য পূরণ করুন!');
        }

        if (authForm.password.length < 6) {
          throw new Error('পাসওয়ার্ডটি অন্তত ৬ অক্ষরের হতে হবে!');
        }

        let regVirtualEmail = '';
        if (emailRaw && emailRaw.includes('@')) {
          regVirtualEmail = emailRaw.toLowerCase();
        } else if (normPhone && normPhone.length === 11) {
          regVirtualEmail = `${normPhone}@nilpha.com`;
        } else if (emailRaw) {
          regVirtualEmail = toVirtualEmail(emailRaw);
        } else {
          regVirtualEmail = toVirtualEmail(authForm.phone);
        }

        const cleanedUsername = emailRaw && !emailRaw.includes('@')
          ? emailRaw.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9_.-]/g, '')
          : '';

        // Check if existing profile in Firestore
        const existingCandidates: string[] = [];
        try {
          if (normPhone) {
            const snapP = await getDocs(query(collection(db, 'profiles'), where('phone', '==', normPhone)));
            snapP.forEach(d => {
              const p = d.data();
              if (p.virtual_email) existingCandidates.push(p.virtual_email);
            });
          }
          if (cleanedUsername) {
            const snapU = await getDocs(query(collection(db, 'profiles'), where('username', '==', cleanedUsername)));
            snapU.forEach(d => {
              const p = d.data();
              if (p.virtual_email) existingCandidates.push(p.virtual_email);
            });
          }
        } catch (checkErr) {
          console.warn("Pre-registration check failed:", checkErr);
        }

        let u;

        if (existingCandidates.length > 0) {
          for (const cand of existingCandidates) {
            try {
              const loginCred = await signInWithEmailAndPassword(auth, cand, authForm.password);
              u = loginCred.user;
              break;
            } catch (loginErr) {
              // Wrong password
            }
          }
          if (!u) {
            setAuthTab('login');
            throw new Error('এই মোবাইল নম্বর/ইউজারনেম দিয়ে ইতোমধ্যে অ্যাকাউন্ট রয়েছে। দয়া করে পাসওয়ার্ড দিয়ে "লগইন" করুন।');
          }
        }

        if (!u) {
          try {
            const credential = await createUserWithEmailAndPassword(auth, regVirtualEmail, authForm.password);
            u = credential.user;
            await updateProfile(u, { displayName: authForm.fullName });
          } catch (createErr: any) {
            if (createErr.code === 'auth/email-already-in-use') {
              const regCandidates = getLoginCandidateEmails(emailRaw || authForm.phone);
              if (!regCandidates.includes(regVirtualEmail)) regCandidates.unshift(regVirtualEmail);

              for (const cand of regCandidates) {
                try {
                  const loginCred = await signInWithEmailAndPassword(auth, cand, authForm.password);
                  u = loginCred.user;
                  break;
                } catch (loginErr) {
                  // Keep trying
                }
              }

              if (!u) {
                setAuthTab('login');
                throw new Error('এই মোবাইল নম্বর/ইউজারনেম দিয়ে ইতোমধ্যে অ্যাকাউন্ট রয়েছে। দয়া করে পাসওয়ার্ড দিয়ে "লগইন" করুন।');
              }
            } else {
              if (createErr.code === 'auth/weak-password') {
                throw new Error('পাসওয়ার্ডটি অন্তত ৬ অক্ষরের হতে হবে!');
              }
              throw createErr;
            }
          }
        }

        const referralCodeFormatted = authForm.referredByCode.trim().toUpperCase();

        const newProf: any = {
          id: u.uid,
          full_name: authForm.fullName,
          phone: normPhone || authForm.phone,
          virtual_email: regVirtualEmail,
          role: 'PATIENT',
          status: 'active',
          created_password: authForm.password,
          referred_by_code: referralCodeFormatted || ''
        };

        if (cleanedUsername) {
          newProf.username = cleanedUsername;
        }

        await setDoc(doc(db, 'profiles', u.uid), newProf);
        setProfile(newProf as any);
      }
    } catch (err: any) {
      console.error("Booking auth error:", err);
      let errMsg = 'একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।';
      if (
        err.code === 'auth/wrong-password' || 
        err.code === 'auth/user-not-found' || 
        err.code === 'auth/invalid-credential' || 
        err.code === 'auth/invalid-email'
      ) {
        errMsg = 'ভুল মোবাইল/ইমেইল অথবা পাসওয়ার্ড!';
      } else if (err.code === 'auth/email-already-in-use') {
        errMsg = 'এই ইমেইল/মোবাইল দিয়ে ইতোমধ্যে অ্যাকাউন্ট আছে। দয়া করে লগইন করুন।';
      } else if (err.message && !err.message.includes('Firebase:') && !err.message.includes('auth/')) {
        errMsg = err.message;
      }
      alert(errMsg);
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const isFreeDoctorSubscriber = Boolean(
    activeSubscription && (
      activeSubscription.plan_type === 'test_and_doctor' || 
      activeSubscription.has_free_doctor === true
    )
  );

  const hasTestDiscountOnlySubscriber = Boolean(
    activeSubscription && activeSubscription.plan_type === 'test_discount' && !isFreeDoctorSubscriber
  );

  const feeAmount = isFreeDoctorSubscriber ? 0 : 50;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("সিরিয়াল দেয়ার পূর্বে আপনাকে লগইন বা অ্যাকাউন্ট তৈরি করতে হবে।");
      return;
    }

    if (!formData.date) {
      alert("দয়া করে কবে দেখাবেন তারিখ নির্ধারণ করুন।");
      setShowCalendar(true);
      return;
    }

    // If non-subscriber, check if they acknowledged the 50 BDT fee
    if (!isFreeDoctorSubscriber && !isPaidChecked && !trxId.trim()) {
      const confirmProceed = window.confirm(
        "অনলাইনে ডাক্তার দেখানোর জন্য ৫০ টাকা কনসালটেশন ফি প্রযোজ্য। আপনি কি বিকাশ/নগদে ৫০ টাকা ফি পরিশোধ করতে সম্মত আছেন এবং সিরিয়াল সাবমিট করতে চান?"
      );
      if (!confirmProceed) return;
    }

    try {
      let referralCode = '';
      if (profile?.role === 'RURAL_DOCTOR') {
        referralCode = (profile?.referral_code || '').trim().toUpperCase();
      } else {
        referralCode = (formData.referredByCode || profile?.referred_by_code || '').trim().toUpperCase();
      }

      const refDocNameVal = referredDocName || (profile?.role === 'RURAL_DOCTOR' ? (profile?.full_name || '') : '');

      // Update patient's profile in Firestore if they modified the code and are a Patient
      if (profile && profile.role !== 'RURAL_DOCTOR' && referralCode) {
        const currentProfileCode = (profile.referred_by_code || '').trim().toUpperCase();
        if (referralCode !== currentProfileCode) {
          try {
            const userProfileRef = doc(db, 'profiles', user.uid);
            await setDoc(userProfileRef, { referred_by_code: referralCode }, { merge: true });
            setProfile((prev: any) => ({ ...prev, referred_by_code: referralCode }));
          } catch (profileUpdateErr) {
            console.error("Error updating profile referral code during booking:", profileUpdateErr);
          }
        }
      }

      // Create appointment record in Firestore
      const appointmentRef = collection(db, 'appointments');
      const appRecord = {
        patient_id: user.uid,
        patient_name: formData.name,
        patient_age: formData.age,
        patient_address: formData.address,
        patient_phone: formData.phone,
        doctor_name: doctorName,
        doctor_specialty: doctorSpecialty,
        date: formData.date,
        problems: formData.problem || 'উল্লিখিত নেই',
        status: 'pending',
        referred_by_code: referralCode,
        referred_by_name: refDocNameVal,
        consultation_fee: feeAmount,
        payment_method: isFreeDoctorSubscriber ? 'free_subscription' : paymentMethod,
        payment_trx_id: trxId.trim(),
        payment_sender_phone: senderPhone.trim() || formData.phone,
        payment_status: isFreeDoctorSubscriber ? 'waived' : (trxId.trim() ? 'paid' : 'pending'),
        subscription_card_number: activeSubscription?.card_number || '',
        subscription_plan_name: activeSubscription?.plan_name || '',
        has_30_discount_on_tests: Boolean(activeSubscription),
        has_free_doctor: Boolean(isFreeDoctorSubscriber),
        created_at: serverTimestamp(),
      };
      await addDoc(appointmentRef, appRecord);

      // WhatsApp message structure
      let message = `*নতুন অনলাইন ডাক্তার সিরিয়াল বুকিং*\n\n`;
      message += `👨‍⚕️ ডাক্তার: *${doctorName}*\n`;
      message += `🩺 বিশেষজ্ঞ: ${doctorSpecialty}\n`;
      message += `------------------------------------\n`;
      message += `👤 *রোগীর বিবরণ:*\n`;
      message += `• নাম: ${formData.name}\n`;
      message += `• বয়স: ${formData.age}\n`;
      message += `• ঠিকানা: ${formData.address}\n`;
      message += `• মোবাইল: ${formData.phone}\n`;
      message += `• সমস্যা: ${formData.problem || 'উল্লিখিত নেই'}\n`;
      message += `• সাক্ষাতের তারিখ: *${formData.date}*\n`;
      message += `------------------------------------\n`;
      message += `💳 *সাবস্ক্রিপশন ও প্যাকেজ স্ট্যাটাস:*\n`;
      if (activeSubscription) {
        message += `⭐ প্যাকেজ: *${activeSubscription.plan_name}*\n`;
        message += `🔖 মেম্বারশিপ কার্ড: *${activeSubscription.card_number}*\n`;
        message += `✨ সকল টেস্টে ৩০% ডিসকাউন্ট: *প্রযোজ্য (সক্রিয়)*\n`;
        if (isFreeDoctorSubscriber) {
          message += `🎁 ডাক্তার ফি: *৳০ (ফ্রি সাবস্ক্রিপশন)*\n`;
        } else {
          message += `💵 ডাক্তার ফি: *৳৫০* (পেমেন্ট: ${paymentMethod}, TrxID: ${trxId || 'পেন্ডিং'})\n`;
        }
      } else {
        message += `• প্যাকেজ: কোনো সাবস্ক্রিপশন প্যাকেজ নেই\n`;
        message += `💵 ডাক্তার কনসালটেশন ফি: *৳৫০*\n`;
        message += `• পেমেন্ট মেথড: ${paymentMethod === 'bkash' ? 'বিকাশ' : 'নগদ'}\n`;
        if (senderPhone) message += `• প্রেরক নম্বর: ${senderPhone}\n`;
        if (trxId) message += `• TrxID: ${trxId}\n`;
      }

      if (referralCode) {
        message += `------------------------------------\n`;
        message += `🔑 রেফার কোড: ${referralCode}${refDocNameVal ? ' (' + refDocNameVal + ')' : ''}\n`;
      }
      message += `------------------------------------\n`;
      message += `জেবি হেলথকেয়ার (Nilpha.com) এর মাধ্যমে পাঠানো হয়েছে।`;
      
      const encodedMessage = encodeURIComponent(message);
      
      // Normalize hotline for WhatsApp API
      let formattedHotline = hotline.replace(/\D/g, '');
      if (formattedHotline.startsWith('0')) {
        formattedHotline = '88' + formattedHotline;
      } else if (!formattedHotline.startsWith('88')) {
        formattedHotline = '880' + formattedHotline;
      }
      
      window.open(`https://wa.me/${formattedHotline}?text=${encodedMessage}`, '_blank');
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (dbErr) {
      console.error("Error creating appointment in database:", dbErr);
      alert("ডাটাবেজে সিরিয়াল সেভ করতে সমস্যা হয়েছে! তবে আমরা হোয়াটসঅ্যাপে তথ্য পাঠিয়ে দিচ্ছি।");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white w-full max-w-md rounded-[40px] overflow-hidden shadow-2xl relative z-10"
          >
            <div className="p-8 bg-blue-600 text-white relative">
              <button 
                onClick={onClose} 
                className="absolute top-6 right-6 p-2 bg-white/20 hover:bg-white/30 rounded-2xl transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                  <Calendar size={28} />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight">বুকিং ইনফরমেশন</h2>
                  <p className="text-[10px] font-bold opacity-80 uppercase mt-1 tracking-widest">{doctorName}</p>
                </div>
              </div>
            </div>
            
            {isLoadingProfile ? (
              <div className="p-12 text-center text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">
                লোডিং তথ্য...
              </div>
            ) : !user ? (
              /* Inline Authentication Form! */
              <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
                <div className="text-center space-y-2">
                  <span className="inline-block bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                    রেজিস্ট্রেশন বাধ্যতামূলক
                  </span>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight leading-snug">
                    ডক্টরের সিরিয়াল নিতে অবশ্যই আপনাকে আগে অ্যাকাউন্ট তৈরি করতে হবে।
                  </h3>
                </div>

                {/* Tab switcher */}
                <div className="flex bg-slate-50 p-1 rounded-2xl">
                  <button 
                    type="button" 
                    onClick={() => setAuthTab('login')} 
                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${authTab === 'login' ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}
                  >
                    লগইন
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setAuthTab('register')} 
                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${authTab === 'register' ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}
                  >
                    রেজিস্ট্রেশন
                  </button>
                </div>

                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  {authTab === 'register' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">পূর্ণ নাম</label>
                        <div className="relative">
                          <input 
                            required
                            type="text" 
                            placeholder="যেমন: মোঃ সাব্বির হোসাইন"
                            value={authForm.fullName}
                            onChange={e => setAuthForm({...authForm, fullName: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 pl-11 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          />
                          <User size={14} className="text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">মোবাইল নাম্বার</label>
                        <div className="relative">
                          <input 
                            required
                            type="tel" 
                            placeholder="যেমন: ০১৭xxxxxxxxx"
                            value={authForm.phone}
                            onChange={e => setAuthForm({...authForm, phone: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 pl-11 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          />
                          <Phone size={14} className="text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">ইউজারনেম, মোবাইল বা ইমেইল</label>
                    <div className="relative">
                      <input 
                        required
                        type="text"
                        placeholder={authTab === 'register' ? "যেমন: sabir, ০১৭xxxxxxxxx বা email@example.com" : "ইউজারনেম, মোবাইল বা ইমেইল লিখুন"}
                        value={authForm.emailOrPhone}
                        onChange={e => setAuthForm({...authForm, emailOrPhone: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 pl-11 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                      <Mail size={14} className="text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">পাসওয়ার্ড</label>
                    <div className="relative">
                      <input 
                        required
                        type={showPassword ? "text" : "password"} 
                        placeholder="••••••••"
                        value={authForm.password}
                        onChange={e => setAuthForm({...authForm, password: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 pl-11 pr-12 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
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
                  </div>

                  {authTab === 'register' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1">রেফার কোড (ঐচ্ছিক)</label>
                      <input 
                        type="text" 
                        placeholder="যেমন: RD001 বা REF123"
                        value={authForm.referredByCode}
                        onChange={e => setAuthForm({...authForm, referredByCode: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={isSubmittingAuth}
                    className="w-full bg-blue-600 text-white p-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/10 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-3 mt-4"
                  >
                    {isSubmittingAuth ? 'প্রক্রিয়াকরণ...' : authTab === 'login' ? 'লগইন করুন ও বুক করুন' : 'নিবন্ধন করুন ও বুক করুন'}
                    <ArrowRight size={14} />
                  </button>
                </form>
              </div>
            ) : (
              /* Actual Appointment Form (Authorized Users) */
              <form onSubmit={handleSubmit} className="p-8 space-y-5 max-h-[70vh] overflow-y-auto no-scrollbar">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-400 ml-1">
                      <User size={12} className="text-blue-500" /> রোগীর নাম
                    </label>
                    <input 
                      required 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" 
                      placeholder="নাম লিখুন"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-400 ml-1">
                      <Activity size={12} className="text-blue-500" /> বয়স
                    </label>
                    <input 
                      required 
                      value={formData.age} 
                      onChange={e => setFormData({...formData, age: e.target.value})} 
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" 
                      placeholder="বয়স"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-400 ml-1">
                    <MapPin size={12} className="text-blue-500" /> বাসা কোথায়?
                  </label>
                  <input 
                    required 
                    value={formData.address} 
                    onChange={e => setFormData({...formData, address: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" 
                    placeholder="আপনার বর্তমান ঠিকানা"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-400 ml-1">
                    <MessageSquare size={12} className="text-blue-500" /> কি সমস্যা? (ঐচ্ছিক)
                  </label>
                  <textarea 
                    value={formData.problem} 
                    onChange={e => setFormData({...formData, problem: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all min-h-[100px] resize-none" 
                    placeholder="আপনার সমস্যার কথা সংক্ষেপে লিখুন (না লিখলেও চলবে)"
                  />
                </div>

                {/* Rural Doctor Referral Code Field */}
                {profile?.role === 'RURAL_DOCTOR' ? (
                  <div className="space-y-2 bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50">
                    <label className="flex items-center gap-1.5 text-[10px] font-black uppercase text-blue-600 ml-1">
                      রেফারেল কোড (আপনার নিজের)
                    </label>
                    <p className="text-xs font-black text-blue-900 bg-white border border-blue-100 px-3 py-2 rounded-xl inline-block">
                      {profile.referral_code || 'RD001'}
                    </p>
                    <p className="text-[9px] text-blue-500 font-bold">পল্লী চিকিৎসক হিসেবে রোগীকে সরাসরি সিরিয়াল দিচ্ছেন।</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-400 ml-1">
                      রেফার কোড (ঐচ্ছিক)
                    </label>
                    <input 
                      type="text"
                      placeholder="যেমন: RD001 বা REF123"
                      value={formData.referredByCode}
                      onChange={e => setFormData({...formData, referredByCode: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all uppercase"
                    />
                    {formData.referredByCode.trim() && (
                      <div className="mt-1 ml-1">
                        {referredDocName ? (
                          <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                            ✔ পল্লী চিকিৎসক: <span className="font-extrabold">{referredDocName}</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1">
                            ⚠ এই কোডধারী কোনো পল্লী চিকিৎসক পাওয়া যায়নি
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-400 ml-1">
                      <Calendar size={12} className="text-blue-500" /> কবে দেখাবেন?
                    </label>
                    <div 
                      onClick={() => setShowCalendar(!showCalendar)}
                      className={`w-full bg-slate-50 border ${showCalendar ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-slate-100'} rounded-2xl p-4 text-[10px] font-black outline-none cursor-pointer hover:border-slate-300 hover:bg-slate-100/30 transition-all flex items-center justify-between h-[48px]`}
                    >
                      <span className={formData.date ? "text-slate-800" : "text-slate-400 font-bold"}>
                        {formData.date || "তারিখ নির্বাচন করুন"}
                      </span>
                      <Calendar size={14} className="text-blue-500 flex-shrink-0 ml-1" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-400 ml-1">
                      <Phone size={12} className="text-blue-500" /> फोन নাম্বার
                    </label>
                    <input 
                      required 
                      type="tel"
                      value={formData.phone} 
                      onChange={e => setFormData({...formData, phone: e.target.value})} 
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all h-[48px]" 
                      placeholder="মোবাইল নাম্বার"
                    />
                  </div>
                </div>

                <AnimatePresence>
                  {showCalendar && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="bg-slate-100/50 border border-slate-200/50 rounded-3xl p-4 mt-2 overflow-hidden"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <button 
                          type="button"
                          onClick={() => {
                            if (calendarMonth === 0) {
                              setCalendarMonth(11);
                              setCalendarYear(v => v - 1);
                            } else {
                              setCalendarMonth(v => v - 1);
                            }
                          }}
                          className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-black hover:bg-slate-50 active:scale-95 transition-all shadow-sm"
                        >
                          ◀
                        </button>
                        <span className="text-[11px] font-black text-slate-700 bg-white px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm">
                          {BANG_MONTHS[calendarMonth]} {convertToBanglaDigits(calendarYear)}
                        </span>
                        <button 
                          type="button"
                          onClick={() => {
                            if (calendarMonth === 11) {
                              setCalendarMonth(0);
                              setCalendarYear(v => v + 1);
                            } else {
                              setCalendarMonth(v => v + 1);
                            }
                          }}
                          className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-black hover:bg-slate-50 active:scale-95 transition-all shadow-sm"
                        >
                          ▶
                        </button>
                      </div>

                      <div className="grid grid-cols-7 gap-1 text-center mb-1">
                        {weekDays.map((wd, idx) => (
                          <div key={idx} className="text-[9px] font-black uppercase text-slate-400 py-1">
                            {wd}
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 gap-1 text-center">
                        {blanks.map((_, idx) => (
                          <div key={`blank-${idx}`} className="py-2 text-[10px] text-slate-300 pointer-events-none" />
                        ))}
                        {days.map(dayNum => {
                          const isPast = isPastDate(dayNum);
                          const cellDate = new Date(calendarYear, calendarMonth, dayNum);
                          const formattedCellDate = `${convertToBanglaDigits(dayNum)} ${BANG_MONTHS[calendarMonth]} ${convertToBanglaDigits(calendarYear)}`;
                          const isSelected = formData.date.includes(formattedCellDate);
                          const isToday = new Date().toDateString() === cellDate.toDateString();

                          return (
                            <button
                              key={dayNum}
                              type="button"
                              disabled={isPast}
                              onClick={() => handleSelectDate(dayNum)}
                              className={`h-8 rounded-xl text-[10px] font-black transition-all flex items-center justify-center relative ${
                                isPast 
                                  ? 'text-slate-300 cursor-not-allowed opacity-40' 
                                  : isSelected 
                                    ? 'bg-blue-600 text-white font-black shadow-lg shadow-blue-100 scale-105' 
                                    : isToday
                                      ? 'bg-blue-50 text-blue-600 border border-blue-200 font-black'
                                      : 'bg-white hover:bg-slate-100 text-slate-700 shadow-sm border border-slate-100/55'
                              }`}
                            >
                              {convertToBanglaDigits(dayNum)}
                              {isToday && !isSelected && (
                                <span className="absolute bottom-1 w-1 h-1 bg-blue-600 rounded-full" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Subscription / Membership Status Box */}
                {activeSubscription ? (
                  <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border-2 border-emerald-500/30 rounded-3xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                        ⭐ সক্রিয় সাবস্ক্রিপশন কার্ড
                      </span>
                      <span className="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs">
                        {activeSubscription.card_number}
                      </span>
                    </div>
                    <p className="text-xs font-black text-slate-800">
                      প্যাকেজ: {activeSubscription.plan_name}
                    </p>
                    <div className="text-[10px] font-bold text-emerald-700 flex flex-col gap-0.5">
                      <span>✓ সকল ল্যাব টেস্টে ৩০% বিশেষ ছাড় সক্রিয়</span>
                      {isFreeDoctorSubscriber ? (
                        <span className="font-black text-blue-700">🎁 অনলাইন ডাক্তার ফি: সম্পূর্ণ ফ্রি (৳০)</span>
                      ) : (
                        <span className="text-slate-600">💵 অনলাইন ডাক্তার ফি: ৫০ টাকা</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                        💳 অনলাইন কনসালটেশন ফি
                      </span>
                      <span className="bg-amber-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full">
                        ফি: ৫০ টাকা
                      </span>
                    </div>
                    <p className="text-[11px] font-bold text-slate-700 leading-relaxed">
                      যাদের কোনো সাবস্ক্রিপশন প্যাকেজ নেওয়া নেই, তারা ৫০ টাকা ফি পরিশোধ করে অনলাইনে ডাক্তারের সাথে কথা বা পরামর্শ নিতে পারবেন।
                    </p>
                  </div>
                )}

                {/* 50 BDT Payment Section for Non-Free Subscribers */}
                {!isFreeDoctorSubscriber && (
                  <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase text-slate-600 tracking-wider">
                        পেমেন্ট মাধ্যম (৫০ টাকা পাঠান)
                      </label>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('bkash')}
                          className={`px-3 py-1 rounded-xl text-[10px] font-black transition-all ${
                            paymentMethod === 'bkash' 
                              ? 'bg-pink-600 text-white shadow-xs' 
                              : 'bg-white text-slate-600 border border-slate-200'
                          }`}
                        >
                          বিকাশ (01518395772)
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('nagad')}
                          className={`px-3 py-1 rounded-xl text-[10px] font-black transition-all ${
                            paymentMethod === 'nagad' 
                              ? 'bg-orange-600 text-white shadow-xs' 
                              : 'bg-white text-slate-600 border border-slate-200'
                          }`}
                        >
                          নগদ (01846800973)
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">প্রেরক মোবাইল নম্বর</label>
                        <input
                          type="tel"
                          value={senderPhone}
                          onChange={(e) => setSenderPhone(e.target.value)}
                          placeholder="যে নম্বর থেকে টাকা পাঠিয়েছেন"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">TrxID / ট্রানজেকশন আইডি</label>
                        <input
                          type="text"
                          value={trxId}
                          onChange={(e) => setTrxId(e.target.value)}
                          placeholder="যেমন: TR98XXXXX"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 uppercase"
                        />
                      </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={isPaidChecked}
                        onChange={(e) => setIsPaidChecked(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                      />
                      <span className="text-[10px] font-bold text-slate-600">
                        আমি ৫০ টাকা ফি পরিশোধ করেছি / চেম্বার বা অনলাইনে পরিশোধ করতে সম্মত।
                      </span>
                    </label>
                  </div>
                )}
                
                <button 
                  type="submit" 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-5 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-100 active:scale-95 transition-all flex items-center justify-center gap-3 mt-4 cursor-pointer"
                >
                  {isFreeDoctorSubscriber ? 'বিনামূল্যে সিরিয়াল পাঠান (৳০)' : 'সিরিয়াল ও বুকিং নিশ্চিত করুন (৳৫০)'} <ArrowRight size={16} />
                </button>
                
                <p className="text-[9px] text-slate-400 text-center font-bold uppercase tracking-tight">
                  * তথ্যগুলো পাঠানোর পর আমরা আপনার সাথে যোগাযোগ করব।
                </p>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
