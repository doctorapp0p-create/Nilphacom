import { Doctor, Clinic, District, Medicine, LabTest } from './types';

export const DISTRICTS: District[] = [
  {
    "id": "Nilphamari",
    "name": "নীলফামারী",
    "nameEn": "Nilphamari"
  },
  {
    "id": "Rangpur",
    "name": "রংপুর",
    "nameEn": "Rangpur"
  },
  {
    "id": "Dinajpur",
    "name": "দিনাজপুর",
    "nameEn": "Dinajpur"
  },
  {
    "id": "Dhaka",
    "name": "ঢাকা",
    "nameEn": "Dhaka"
  }
];

export const SPECIALTIES = [
  {
    "id": "medicine",
    "name": "Medicine",
    "bnName": "মেডিসিন",
    "icon": "Stethoscope"
  },
  {
    "id": "surgery",
    "name": "Surgery",
    "bnName": "সার্জারি",
    "icon": "Activity"
  },
  {
    "id": "gynecology",
    "name": "Gynecology",
    "bnName": "গাইনী ও প্রসূতী",
    "icon": "User"
  },
  {
    "id": "pediatrics",
    "name": "Pediatrics",
    "bnName": "শিশু রোগ",
    "icon": "Heart"
  },
  {
    "id": "cardiology",
    "name": "Cardiology",
    "bnName": "হৃদরোগ",
    "icon": "HeartPulse"
  },
  {
    "id": "orthopedics",
    "name": "Orthopedics",
    "bnName": "অর্থোপেডিকস",
    "icon": "Bone"
  },
  {
    "id": "dermatology",
    "name": "Dermatology",
    "bnName": "চর্ম ও যৌন",
    "icon": "Shield"
  },
  {
    "id": "ent",
    "name": "ENT",
    "bnName": "নাক, কান ও গলা",
    "icon": "Ear"
  },
  {
    "id": "ophthalmology",
    "name": "Ophthalmology",
    "bnName": "চক্ষু রোগ",
    "icon": "Eye"
  },
  {
    "id": "neuromedicine",
    "name": "Neuromedicine",
    "bnName": "নিউরোমেডিসিন",
    "icon": "Brain"
  },
  {
    "id": "psychiatry",
    "name": "Psychiatry",
    "bnName": "মানসিক রোগ",
    "icon": "Smile"
  },
  {
    "id": "nephrology",
    "name": "Nephrology",
    "bnName": "কিডনি রোগ",
    "icon": "Activity"
  },
  {
    "id": "urology",
    "name": "Urology",
    "bnName": "ইউরোলজি",
    "icon": "ShieldAlert"
  },
  {
    "id": "gastroenterology",
    "name": "Gastroenterology",
    "bnName": "গ্যাস্ট্রোএন্টারোলজি",
    "icon": "Thermometer"
  },
  {
    "id": "oncology",
    "name": "Oncology",
    "bnName": "ক্যান্সার রোগ",
    "icon": "Zap"
  },
  {
    "id": "dentistry",
    "name": "Dentistry",
    "bnName": "মুখ ও দন্তরোগ",
    "icon": "🦷"
  },
  {
    "id": "physical_medicine",
    "name": "Physical Medicine",
    "bnName": "বাত-ব্যথা ও ফিজিক্যাল মেডিসিন",
    "icon": "Activity"
  }
];

export const MEDICINES: Medicine[] = [
  {
    "id": "med-1",
    "name": "Napa Extra 500mg",
    "price": 25,
    "discount": 0,
    "image": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=200",
    "description": "Paracetamol & Caffeine for fast fever & pain relief."
  },
  {
    "id": "med-2",
    "name": "Seclo 20mg Capsule",
    "price": 60,
    "discount": 5,
    "image": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=200",
    "description": "Omeprazole for acidity and heartburn treatment."
  }
];

export const EMERGENCY_SERVICES = [
  {
    "id": "em-catheter",
    "name": "বাসায় গিয়ে ক্যাথেটার লাগানো",
    "description": "দক্ষ নার্স দ্বারা সেফ ক্যাথেটারাইজেশন (+ ট্রান্সপোর্ট বিল)",
    "icon": "🩹",
    "price": 500
  },
  {
    "id": "em-saline",
    "name": "বাসায় গিয়ে স্যালাইন লাগানো",
    "description": "বাসায় স্যালাইন পুশ ও ইনফিউশন সেটআপ (+ ট্রান্সপোর্ট বিল)",
    "icon": "💧",
    "price": 200
  },
  {
    "id": "em-blood-test",
    "name": "বাসায় গিয়ে রক্ত নেওয়া (পরীক্ষার জন্য)",
    "description": "ল্যাব টেস্টের জন্য বাসায় ব্লাড স্যাম্পল সংগ্রহ (+ ট্রান্সপোর্ট বিল)",
    "icon": "🧪",
    "price": 200
  },
  {
    "id": "em-home-doc",
    "name": "হোম ডক্টর ভিজিট",
    "description": "জরুরী স্বাস্থ্য সেবায় বাসায় ডাক্তার বুকিং",
    "icon": "🩺",
    "price": 1000
  }
];

export const CLINICS: Clinic[] = [
  {
    "id": "c-ar",
    "name": "এ.আর জেনারেল হসপিটাল",
    "district": "Nilphamari",
    "address": "সদর হাসপাতাল সড়ক (আধুনিক সদর হাসপাতালের বিপরীতে), নীলফামারী",
    "doctors": [
      "dr-ar-rupayan-das",
      "dr-ar-raisul-alam",
      "dr-ar-towhid-hasan",
      "dr-ar-abdul-awal",
      "dr-ar-ruhul-amin",
      "dr-ar-rezaul-alam",
      "dr-ar-deb-dulal-ray",
      "dr-ar-abdul-matin",
      "dr-ar-hasina-banu",
      "dr-ar-shamsur",
      "dr-ar-mahbubul",
      "dr-ar-monir",
      "dr-ar-moinul",
      "dr-ar-minhaj",
      "dr-ar-muhid",
      "dr-ar-rezaul-karim",
      "dr-ar-nihar-ray",
      "dr-ar-ashequr",
      "dr-ar-samiur"
    ],
    "image": "/ar_general_hospital.png"
  },
  {
    "id": "c-ebadot",
    "name": "ইবাদত হাসপাতাল",
    "district": "Nilphamari",
    "address": "পুরাতন স্টেশন সড়ক, নীলফামারী",
    "doctors": [
      "eb-firoz-ent",
      "eb-murad-med",
      "eb-shakera-gyn",
      "eb-resaul-med",
      "eb-rasedul-ent",
      "eb-tanvir-psych",
      "eb-pavel-surg",
      "eb-munira",
      "eb-saiful-card",
      "eb-sohel-ortho",
      "eb-roni-ortho"
    ],
    "image": "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800"
  },
  {
    "id": "c-moun",
    "name": "মৌন জেনারেল হাসপাতাল অ্যান্ড ডায়াগনস্টিক সেন্টার",
    "district": "Nilphamari",
    "address": "নীলফামারী সদর",
    "doctors": [
      "moun-nishat",
      "moun-lopa",
      "moun-wajibullah",
      "moun-shankar"
    ],
    "image": "https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?auto=format&fit=crop&q=80&w=800"
  },
  {
    "id": "c-pacific",
    "name": "প্যাসিফিক ল্যাবজোন",
    "district": "Nilphamari",
    "address": "পুরাতন বাসস্ট্যান্ড, স্টাফ কোয়ার্টার সংলগ্ন, নীলফামারী।",
    "doctors": [
      "pacific-hafiz",
      "pacific-ali",
      "pacific-shahjada",
      "pacific-alamin",
      "pacific-sabuj",
      "pacific-sarwar",
      "pacific-robiul",
      "pacific-altaf",
      "pacific-kayes",
      "pacific-ayesha",
      "pacific-selim"
    ],
    "image": "https://images.unsplash.com/photo-1512678080530-7760d81faba6?auto=format&fit=crop&q=80&w=800"
  },
  {
    "id": "c-janata",
    "name": "জনতা ক্লিনিক এন্ড ডায়াগনস্টিক সেন্টার",
    "district": "Nilphamari",
    "address": "শান্তিনগর মোড় (ব্রিজ সংলগ্ন), হাসপাতাল সড়ক, নীলফামারী।",
    "doctors": [
      "j-nihar",
      "j-tawhida",
      "j-atiur",
      "j-kamalakanta",
      "j-rikkon",
      "j-shakil",
      "j-shaheen-gyn",
      "j-parul-gyn",
      "j-masud-med",
      "j-al-amin"
    ],
    "image": "https://images.unsplash.com/photo-1512678080530-7760d81faba6?auto=format&fit=crop&q=80&w=800"
  },
  {
    "id": "c-ekota",
    "name": "একতা ক্লিনিক এন্ড ডায়াগনস্টিক সেন্টার",
    "district": "Nilphamari",
    "address": "জেনারেল হাসপাতাল সড়ক, শান্তিনগর মোড় (কানছিড়ার মোড়), নীলফামারী",
    "doctors": [
      "ek-med1",
      "ek-card1",
      "ek-pallab1",
      "ek-gyn1",
      "ek-med2",
      "ek-med3",
      "ek-kid1",
      "ek-gyn2",
      "ek-orth1",
      "ek-med4",
      "ek-gyn3",
      "ek-sur1",
      "j-nihar",
      "ek-amit-med"
    ],
    "image": "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800"
  },
  {
    "id": "c-madina",
    "name": "Madina Diagnostic Clinic & Consultation",
    "district": "Nilphamari",
    "address": "জেনারেল হাসপাতাল রোড, হাসপাতাল মোড়, নীলফামারী",
    "doctors": [
      "mad-sakib",
      "mad-card1",
      "mad-skin1",
      "mad-ent1",
      "mad-med1",
      "mad-orth1",
      "mad-monir",
      "mad-sumi",
      "mad-ped1",
      "dr-ar-monir",
      "mad-kamrul"
    ],
    "image": "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800"
  },
  {
    "id": "c-greensign",
    "name": "গ্রীন সাইন ডিজিটাল হসপিটাল এন্ড ডায়াগনস্টিক ল্যাব",
    "district": "Nilphamari",
    "address": "নীলফামারী সদর",
    "doctors": [
      "gs-obayda",
      "gs-moazzem",
      "gs-rahim",
      "gs-asad-neuro",
      "gs-asad-card",
      "gs-mehfuz",
      "gs-rumana",
      "gs-rashedul",
      "gs-sohrab",
      "gs-arif",
      "gs-fahim",
      "gs-nuruzzaman",
      "gs-kanak"
    ],
    "image": "https://images.unsplash.com/photo-1512678080530-7760d81faba6?auto=format&fit=crop&q=80&w=800"
  },
  {
    "id": "c-newlife",
    "name": "নিউ লাইফ কেয়ার ডায়াগনস্টিক",
    "district": "Nilphamari",
    "address": "চৌরঙ্গী মোড় (হাসপাতাল সড়ক), নীলফামারী",
    "doctors": [
      "nl-med1",
      "nl-uro1",
      "nl-gyn1",
      "nl-med2",
      "nl-card1",
      "nl-skin1",
      "nl-atiar",
      "j-atiur"
    ],
    "image": "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800"
  },
  {
    "id": "c-evercare-spec",
    "name": "নিউ এভারকেয়ার স্পেশালাইজড হাসপাতাল",
    "district": "Nilphamari",
    "address": "নীলফামারী সদর",
    "doctors": [
      "ev-lucky",
      "ev-asad",
      "ev-nripen",
      "ev-iqbal",
      "ev-riyasad",
      "ev-utsho"
    ],
    "image": "https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?auto=format&fit=crop&q=80&w=800"
  },
  {
    "id": "c-roots",
    "name": "রুটস হাসপাতাল এন্ড ডায়াগনস্টিক সেন্টার",
    "district": "Nilphamari",
    "address": "বড় বাজার (কাঁচা বাজারের সামনে), নীলফামারী",
    "doctors": [
      "roots-mizanur",
      "roots-kamrul",
      "roots-abdul-hamid",
      "roots-mehjabin-gyn",
      "roots-harun-ent"
    ],
    "image": "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=800"
  },
  {
    "id": "c-popular-rangpur",
    "name": "পপুলার ডায়াগনস্টিক সেন্টার (রংপুর)",
    "district": "Rangpur",
    "address": "জেল রোড, রংপুর (রিপোর্ট ডেলিভারি সময় ৩-৫ দিন)",
    "doctors": [],
    "image": "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800"
  },
  {
    "id": "c-prava-dhaka",
    "name": "ঢাকা প্রাভা হেলথ কেয়ার (ঢাকা)",
    "district": "Dhaka",
    "address": "বনানী, ঢাকা (রিপোর্ট ডেলিভারি সময় ৩-৫ দিন)",
    "doctors": [],
    "image": "https://images.unsplash.com/photo-1512678080530-7760d81faba6?auto=format&fit=crop&q=80&w=800"
  },
  {
    "id": "c-doctors-dental",
    "name": "ডক্টরস ডেন্টাল (Doctors Dental)",
    "district": "Nilphamari",
    "address": "উকিলের মোড় (সরকারি কলেজ রোড), নীলফামারী সদর।",
    "doctors": [
      "dr-habibur-rahman-dental"
    ],
    "image": "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80&w=800"
  },
  {
    "id": "c-siddhika-domar",
    "name": "সিদ্দিকা মেমোরিয়াল ক্রিটিক্যাল কেয়ার ডায়াগনস্টিক সেন্টার",
    "district": "Nilphamari",
    "address": "হাজী হোসেন আলী কমপ্লেক্স, ডি.বি. রোড, ডোমার, নীলফামারী।",
    "doctors": [
      "dr-shariful-islam-ratan",
      "dr-soheli-binte-mostafa",
      "dr-gopal-chandra-roy",
      "dr-rashed-menon-ent",
      "dr-mithun-chandra-bhowmik"
    ],
    "image": "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800"
  }
];

export const DOCTORS: Doctor[] = [
  {
    "id": "dr-ar-rupayan-das",
    "name": "ডাঃ রুপায়ন দাশ",
    "degree": "এমবিবিএস, বিসিএস (স্বাস্থ্য), ডি-অর্থো (অর্থোপেডিক্স) | কনসালটেন্ট - অর্থো সার্জারী, উপজেলা স্বাস্থ্য কমপ্লেক্স, কিশোরগঞ্জ, নীলফামারী | হাড়-জোড়া, বাত-ব্যথা, ট্রমা বিশেষজ্ঞ ও সার্জন",
    "specialty": "Orthopedics",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-ar"
    ],
    "schedule": "প্রতি শুক্রবার দুপুর ০২টা থেকে রাত ০৮টা পর্যন্ত",
    "availableToday": false,
    "rating": 4.9,
    "image": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 700
  },
  {
    "id": "dr-ar-raisul-alam",
    "name": "ডাঃ রাইসুল আলম শুভ",
    "degree": "এমবিবিএস (ঢাকা), বিসিএস (স্বাস্থ্য), এমডি (হেপাটলজি, বিএসএমএমইউ) | ইন্টারভেনশন হেপাটলজিস্ট ও গ্যাস্ট্রোএন্টেরোলজিস্ট, ২৫০ শয্যা জেনারেল হাসপাতাল, নীলফামারী | লিভার ও পরিপাকতন্ত্র বিশেষজ্ঞ",
    "specialty": "Gastroenterology",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-ar"
    ],
    "schedule": "প্রতি শুক্রবার বিকাল ৪টা থেকে রাত ৯টা পর্যন্ত",
    "availableToday": false,
    "rating": 4.9,
    "image": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 800
  },
  {
    "id": "dr-ar-towhid-hasan",
    "name": "ডাঃ এস.এম. তৌহিদ হাসান",
    "degree": "এমবিবিএস, বিসিএস (স্বাস্থ্য), ডিইএম (এন্ডোক্রাইনোলজী এন্ড মেটাবলিজম, বিএসএমএমইউ), এফসিপিএস (এন্ডোক্রাইনোলজী এন্ড মেটাবলিজম-এফপি), এডভান্সড কোর্স ইন এন্ডোক্রাইনোলজী (মায়ো ক্লিনিক-আমেরিকা) | ডায়াবেটিস, থাইরয়েড, হরমোন ও মেডিসিন রোগ বিশেষজ্ঞ",
    "specialty": "Medicine",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-ar"
    ],
    "schedule": "প্রতি শুক্রবার সকাল ০৯টা থেকে দুপুর ০২টা পর্যন্ত",
    "availableToday": false,
    "rating": 4.9,
    "image": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 800
  },
  {
    "id": "dr-ar-abdul-awal",
    "name": "ডা. মো. আব্দুল আউয়াল",
    "degree": "এমবিবিএস (ঢাকা), বিসিএস (স্বাস্থ্য), সিসিডি (বারডেম), ডিসিএইচ (শিশু) বিএমইউ, আইসিপিপিএন (ইউএসএ) | কনসালটেন্ট (শিশু বিভাগ), ২৫০ শয্যা জেনারেল হাসপাতাল, নীলফামারী | নবজাতক ও শিশু-কিশোর রোগ বিশেষজ্ঞ",
    "specialty": "Pediatrics",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-ar"
    ],
    "schedule": "প্রতিদিন বিকাল ৩টা থেকে রাত ৯টা পর্যন্ত, শুক্রবার দুপুর ২টা থেকে রাত ৯টা পর্যন্ত",
    "availableToday": true,
    "rating": 4.8,
    "image": "https://images.unsplash.com/photo-1559839734-2b71f1536780?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 600
  },
  {
    "id": "dr-ar-ruhul-amin",
    "name": "ডাঃ মোঃ রুহুল আমিন",
    "degree": "এমবিবিএস, বিসিএস (স্বাস্থ্য), এমডি (নিউরোলজী) | সহযোগী অধ্যাপক - নিউরোলজী, রংপুর মেডিকেল কলেজ ও হাসপাতাল, রংপুর | নিউরোলজি মেডিসিন বিশেষজ্ঞ",
    "specialty": "Neuromedicine",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-ar"
    ],
    "schedule": "প্রতি মঙ্গলবার বিকাল ০৪টা থেকে রাত ০১টা এবং শুক্রবার সকাল ১০:০০টা থেকে রাত ১১টা পর্যন্ত",
    "availableToday": false,
    "rating": 4.9,
    "image": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 800
  },
  {
    "id": "dr-ar-deb-dulal-ray",
    "name": "ডাঃ দেব দুলাল রায়",
    "degree": "এমবিবিএস, বিসিএস (স্বাস্থ্য), সিসিডি (বারডেম), এমডি (সাইকিয়াট্রি) বাংলাদেশ মেডিকেল বিশ্ববিদ্যালয় (সাবেক পিজি হাসপাতাল, ঢাকা) এবং রংপুর মেডিকেল কলেজ ও হাসপাতাল, রংপুর | মানসিক রোগ, মাথা ব্যথা, মাদকাসক্তি, যৌন স্বাস্থ্য বিশেষজ্ঞ",
    "specialty": "Psychiatry",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-ar"
    ],
    "schedule": "প্রতি বৃহস্পতিবার বিকাল ৪টা থেকে রাত ৯টা পর্যন্ত",
    "availableToday": false,
    "rating": 4.8,
    "image": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 700
  },
  {
    "id": "dr-ar-abdul-matin",
    "name": "ডাঃ মোঃ আব্দুল মতিন",
    "degree": "এমবিবিএস, বিসিএস (স্বাস্থ্য) | সহকারী অধ্যাপক - মেডিসিন বিভাগ, ২৫০ শয্যা জেনারেল হাসপাতাল, নীলফামারী | মেডিসিন বিশেষজ্ঞ",
    "specialty": "Medicine",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-ar"
    ],
    "schedule": "প্রতি শনি থেকে বৃহস্পতিবার বিকাল ০৪টা থেকে রাত ০৯টা পর্যন্ত",
    "availableToday": true,
    "rating": 4.8,
    "image": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 600
  },
  {
    "id": "dr-ar-monir",
    "name": "Dr. Md. Moniruzzaman Moni",
    "degree": "MBBS, BCS (Health), CCD (BIRDEM), MS (Gynae & Obs) | Consultant Gynecologist & Surgeon, 250 Bed General Hospital, Nilphamari.",
    "specialty": "Gynecology",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-ar",
      "c-madina"
    ],
    "schedule": "প্রতিদিন দুপুর ০৩টা থেকে রাত ০৯টা পর্যন্ত।",
    "availableToday": true,
    "rating": 4.8,
    "image": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 500
  },
  {
    "id": "dr-ar-hasina-banu",
    "name": "ডা. মোছা. হাসিনা বানু (Dr. Mst. Hasina Banu)",
    "degree": "এমবিবিএস, বিসিএস (স্বাস্থ্য), এমসিপিএস (গাইনী এন্ড অবস), এফসিপিএস (গাইনী এন্ড অবস) | সহকারী অধ্যাপক (গাইনী এন্ড অবস্), ২৫০ শয্যা জেনারেল হাসপাতাল, নীলফামারী | স্ত্রীরোগ ও প্রসূতি বিদ্যা বিশেষজ্ঞ ও সার্জন",
    "specialty": "Gynecology",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-ar"
    ],
    "schedule": "প্রতিদিন বিকাল ৪টা থেকে রাত ১০টা পর্যন্ত, প্রতি শুক্রবার দুপুর ১ টা - রাত ১০ টা পর্যন্ত।",
    "availableToday": true,
    "rating": 4.9,
    "image": "https://images.unsplash.com/photo-1559839734-2b71f1536780?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 600
  },
  {
    "id": "dr-ar-moinul",
    "name": "Dr. Md. Moynul Haque Chowdhury",
    "degree": "MBBS, BCS (Health), FCPS (Urology) | Assistant Professor - Department of Urology, National Institute of Kidney Diseases & Urology, Dhaka.",
    "specialty": "Urology",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-ar"
    ],
    "schedule": "প্রতি শুক্রবার বিকাল ৫ টা - রাত ১০ টা পর্যন্ত।",
    "availableToday": false,
    "rating": 4.9,
    "image": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 800
  },
  {
    "id": "dr-ar-minhaj",
    "name": "Dr. Md. Minhaz Uddin Razib",
    "degree": "MBBS, BCS (স্বাস্থ্য), FCPS (সার্জারী - গোল্ড মেডেলিস্ট) | কনসালটেন্ট (সার্জারী), ২৫০ শয্যা জেনারেল হাসপাতাল, নীলফামারী | জেনারেল, ব্রেষ্ট, কলোরেক্টাল রোগ বিশেষজ্ঞ, ল্যাপারস্কোপিক ও লেজার সার্জন",
    "specialty": "Surgery",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-ar"
    ],
    "schedule": "প্রতি শনিবার থেকে বৃহস্পতিবার দুপুর ২.৩০টা থেকে সন্ধ্যা ৬টা পর্যন্ত।",
    "availableToday": true,
    "rating": 4.8,
    "image": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 700
  },
  {
    "id": "dr-ar-muhid",
    "name": "Dr. Md. Abdullah Al Muhid",
    "degree": "MBBS, BCS (Health), D-Ortho (BSMMU) | ঢাকা অর্থোপেডিক্স, ট্রমা বিশেষজ্ঞ ও সার্জন, দিনাজপুর মেডিকেল কলেজ হাসপাতাল | BMDC Reg: A-71774 | হাড় জোড়া, বাত ব্যথা রোগ বিশেষজ্ঞ ও ট্রমা সার্জন",
    "specialty": "Orthopedics",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-ar"
    ],
    "schedule": "প্রতি রবিবার,মঙ্গলবার ও বুধবার বিকাল ৪ টা - রাত ৯ টা পর্যন্ত।",
    "availableToday": true,
    "rating": 4.9,
    "image": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 700
  },
  {
    "id": "dr-ar-rezaul-karim",
    "name": "Dr. Md. Rezaul Karim",
    "degree": "MBBS, DPH, CCU (Dhaka) | উপ-পরিচালক (অবঃ), স্বাস্থ্য অধিদপ্তর, ঢাকা | অধ্যক্ষ, ক্রিয়েটিভ ম্যাটস্, নীলফামারী | মেডিসিন ও জেনারেল প্রাকটিশনার",
    "specialty": "Medicine",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-ar"
    ],
    "schedule": "প্রতি শনিবার - বৃহস্পতিবার সকাল ১০টা - দুপুর ২ টা পর্যন্ত।",
    "availableToday": true,
    "rating": 4.8,
    "image": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 600
  },
  {
    "id": "dr-ar-nihar-ray",
    "name": "Dr. Nihar R Ray",
    "degree": "MBBS, MCPS (চক্ষু), Fellow Inje University (কোরিয়া), উচ্চতর ট্রেনিং চায়না ও ORBIS (USA) | সিনিয়র কনসালটেন্ট ও বিভাগীয় প্রধান, চক্ষু বিভাগ, সরকারী কর্মচারী হাসপাতাল | সাবেক সিনিয়র কনসালটেন্ট, চক্ষু বিভাগ, ঢাকা মেডিকেল কলেজ হাসপাতাল | চক্ষু বিশেষজ্ঞ, ফ্যাকো ও লেজার সার্জন",
    "specialty": "Ophthalmology",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-ar"
    ],
    "schedule": "প্রতি মাসে ১ম ও ২য় বুধবার বিকাল ৪ টা - রাত ৮ টা পর্যন্ত।",
    "availableToday": false,
    "rating": 4.8,
    "image": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 600
  },
  {
    "id": "dr-ar-rezaul-alam",
    "name": "অধ্যাপক ডা. মো. রেজাউল আলম",
    "degree": "এমবিবিএস, ডিভি (থাইল্যান্ড), এমপিএইচ (ঢাকা), সিসিএস (ইন্ডিয়া), সিসিডি (বারডেম) | অধ্যাপক ও বিভাগীয় প্রধান, চর্ম ও যৌন রোগ বিভাগ, রংপুর কমিউনিটি মেডিকেল কলেজ ও হাসপাতাল, রংপুর | চর্ম-যৌন, এলার্জি ও কুষ্ট রোগ বিশেষজ্ঞ",
    "specialty": "Dermatology",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-ar"
    ],
    "schedule": "প্রতি সোমবার ও বৃহস্পতিবার বিকাল ৫টা থেকে রাত ৯টা পর্যন্ত",
    "availableToday": false,
    "rating": 4.8,
    "image": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 700
  },
  {
    "id": "dr-ar-ashequr",
    "name": "Dr. Md. Ashequr Rahman",
    "degree": "MBBS (Dhaka), BCS (Health), FCPS (Medicine), D-Card (Cardiology), MACP (USA) | Consultant - Cardiology, Rangpur Medical College & Hospital, Rangpur.",
    "specialty": "Cardiology",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-ar"
    ],
    "schedule": "প্রতি শুক্রবার সকাল ১০টা থেকে রাত ৮টা পর্যন্ত।",
    "availableToday": false,
    "rating": 4.8,
    "image": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 600
  },
  {
    "id": "dr-ar-samiur",
    "name": "Dr. Md. Samiur Rahman Shah",
    "degree": "MBBS, BCS (Health), CCD (BIRDEM), MD (Cardiology), FCPS (Medicine-FP), MACP (USA), MACC (USA) | Clinical & Interventional Cardiologist, National Institute of Cardiovascular Diseases & Hospital, Dhaka.",
    "specialty": "Cardiology",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-ar"
    ],
    "schedule": "প্রতি শুক্রবার সকাল ১০টা থেকে রাত ৮টা পর্যন্ত।",
    "availableToday": false,
    "rating": 4.7,
    "image": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 700
  },
  {
    "id": "dr-ar-shamsur",
    "name": "ডা. মো. শামসুর রহমান (Dr. Md. Shamsur Rahman)",
    "degree": "এমবিবিএস, বিসিএস (স্বাস্থ্য), এমডি (ফিজিক্যাল মেডিসিন এন্ড রিহ্যাবিলিটেশন) | কনসালটেন্ট, ২৫০ শয্যা জেনারেল হাসপাতাল, নীলফামারী | বাত-ব্যথা, প্যারালাইসিস, স্পোর্টস, মেডিসিন এন্ড রিহ্যাবিলিটেশন বিশেষজ্ঞ",
    "specialty": "Physical Medicine",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-ar"
    ],
    "schedule": "প্রতি রবি, সোম ও বুধবার বিকাল ৪টা - রাত ৯টা পর্যন্ত।",
    "availableToday": true,
    "rating": 4.8,
    "image": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 600
  },
  {
    "id": "dr-ar-mahbubul",
    "name": "ডা. মো: মাহবুবুল আলম চৌধুরী (Dr. Md. Mahbubul Alam Chowdhury)",
    "degree": "এমবিবিএস (ঢাকা), বিসিএস (স্বাস্থ্য), এমসিপিএস, ডিএলও (ইএনটি) | সহযোগী অধ্যাপক- ইএনটি, নীলফামারী মেডিকেল কলেজ, নীলফামারী | নাক, কান, গলা রোগ বিশেষজ্ঞ ও হেড নেক সার্জন",
    "specialty": "ENT",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-ar"
    ],
    "schedule": "প্রতি মঙ্গলবার ও শুক্রবার বিকাল ০৪টা থেকে রাত ০৯ টা পর্যন্ত।",
    "availableToday": false,
    "rating": 4.9,
    "image": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 700
  },
  {
    "id": "eb-firoz-ent",
    "name": "Dr. Md. Firoz Hosen",
    "degree": "MBBS (রংপুর মেডিকেল কলেজ), DLO (BSMMU), FACS (আমেরিকা), PGT (সার্জারী) | সহযোগী অধ্যাপক ও বিভাগীয় প্রধান, নাক-কান-গলা ও হেড নেক সার্জারি বিভাগ, রংপুর কমিউনিটি মেডিকেল কলেজ ও হাসপাতাল | নাক কান গলা ও ঘাড় মাথা রোগ বিশেষজ্ঞ সার্জন",
    "specialty": "ENT",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-ebadot"
    ],
    "schedule": "প্রতি শুক্রবার সকাল ১০টা - বিকাল ৫ টা পর্যন্ত।",
    "availableToday": false,
    "rating": 4.9,
    "image": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 600
  },
  {
    "id": "eb-murad-med",
    "name": "Dr. Md. Murad Hosen",
    "degree": "MBBS (ঢাকা মেডিকেল কলেজ), BCS (স্বাস্থ্য), FCPS (মেডিসিন), FACP (আমেরিকা), FRCP (ইডিনবার্গ) | সহযোগী অধ্যাপক (মেডিসিন বিভাগ), নীলফামারী মেডিকেল কলেজ | (প্রাক্তন) সহযোগী অধ্যাপক (মেডিসিন বিভাগ), ঢাকা মেডিকেল কলেজ | মেডিসিন, গ্যাস্ট্রোলিভার, বাতজ্বর ও বাতব্যাথা ডায়াবেটিস, হরমোন, বক্ষব্যাধি, এলার্জি বিশেষজ্ঞ",
    "specialty": "Medicine",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-ebadot"
    ],
    "schedule": "প্রতি রবিবার দুপুর ২ টা - রাত ১০ টা পর্যন্ত।",
    "availableToday": false,
    "rating": 4.9,
    "image": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 800
  },
  {
    "id": "eb-shakera-gyn",
    "name": "Dr. Mst. Shakera Akter",
    "degree": "MBBS, BCS (স্বাস্থ্য), FCPS (গাইনী এন্ড অবস্) | প্রসূতি, স্ত্রী রোগ বিশেষজ্ঞ এবং সার্জন, মুগদা মেডিকেল কলেজ হাসপাতাল, ঢাকা | BMDC Reg: A-61632 | প্রসূতি, স্ত্রীরোগ ও বন্ধ্যাত্ব বিশেষজ্ঞ ও সার্জন",
    "specialty": "Gynecology",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-ebadot"
    ],
    "schedule": "প্রতি শুক্রবার দুপুর ১২টা থেকে রাত ১০টা",
    "availableToday": false,
    "rating": 4.8,
    "image": "https://images.unsplash.com/photo-1559839734-2b71f1536780?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 600
  },
  {
    "id": "eb-resaul-med",
    "name": "Dr. Md. Resaul Hoque",
    "degree": "MBBS (রংপুর মেডিকেল কলেজ) | মেডিসিন ও ডায়াবেটিস রোগ বিষয়ে অভিজ্ঞ | BMDC Reg: A-34957",
    "specialty": "Medicine",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-ebadot"
    ],
    "schedule": "প্রতি বুধবার দুপুর ১টা থেকে রাত ১০টা পর্যন্ত, বৃহস্পতিবার সকাল ১০টা থেকে রাত ১০টা পর্যন্ত, শুক্রবার সকাল ১০টা থেকে সন্ধ্যা ৭টা",
    "availableToday": false,
    "rating": 4.8,
    "image": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 600
  },
  {
    "id": "eb-rasedul-ent",
    "name": "Dr. Md. Rasedul Islam ( Rased )",
    "degree": "MBBS, DLO (BSMMU) PG হাসপাতাল, ঢাকা | নাক, কান, গলা, ঘাড়, থাইরয়েড রোগ বিশেষজ্ঞ ও হেড নেক সার্জন",
    "specialty": "ENT",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-ebadot"
    ],
    "schedule": "প্রতি শনি, রবি, বুধ ও বৃহস্পতিবার দুপুর ২টা থেকে রাত ৮টা; সোমবার সকাল ১০টা থেকে দুপুর ১টা পর্যন্ত",
    "availableToday": false,
    "rating": 4.8,
    "image": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 600
  },
  {
    "id": "eb-tanvir-psych",
    "name": "Dr. Md. Tanvir Rahman Shah ( Tamal )",
    "degree": "MBBS, BCS (স্বাস্থ্য), MD (সাইকিয়াট্রি) | সহযোগী অধ্যাপক, মনোরোগ বিদ্যা বিভাগ, রংপুর মেডিকেল কলেজ ও হাসপাতাল | ব্রেইন, সেক্স, মানসিক ও মাদকাসক্তি রোগ বিশেষজ্ঞ",
    "specialty": "Psychiatry",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-ebadot"
    ],
    "schedule": "প্রতি মাসে ২য় ও ৪র্থ রবিবার দুপুর ২ টা - রাত ৮ টা পর্যন্ত।",
    "availableToday": false,
    "rating": 4.8,
    "image": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 700
  },
  {
    "id": "eb-pavel-surg",
    "name": "Dr. Md. Abu Hanif Pavel",
    "degree": "MBBS, MS (সার্জারি) | সার্জারি বিশেষজ্ঞ (জেনারেল ও ল্যাপারোস্কপিক) | সহযোগী অধ্যাপক, সার্জারি বিভাগ (প্রাক্তন), রংপুর মেডিকেল কলেজ হাসপাতাল, রংপুর | BMDC Reg: A-31357",
    "specialty": "Surgery",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-ebadot"
    ],
    "schedule": "প্রতি রবি,মঙ্গল ও বৃহস্পতিবার দুপুর ২ টা - রাত ৮ টা পর্যন্ত।",
    "availableToday": true,
    "rating": 4.8,
    "image": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 700
  },
  {
    "id": "eb-munira",
    "name": "Dr. Munira Ferdous",
    "degree": "MBBS, DDV, CCD (BIRDEM), Fellowship in Dermatosurgery (DFB), Fellowship in Interventional & Aesthetic Dermatology (India) | চর্ম ও যৌনরোগ বিশেষজ্ঞ | BMDC Reg: A-76212",
    "specialty": "Dermatology",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-ebadot"
    ],
    "schedule": "প্রতি শুক্রবার সকাল ১০টা – বিকাল ৪টা পর্যন্ত",
    "availableToday": false,
    "rating": 4.8,
    "image": "https://images.unsplash.com/photo-1559839734-2b71f1536780?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 500
  },
  {
    "id": "eb-saiful-card",
    "name": "Dr. Md. Saiful Islam",
    "degree": "MBBS, BCS (Health), MD (Cardiology), FCPS (Medicine-FP), PGT (Neuro Medicine) | হৃদরোগ ও মেডিসিন বিশেষজ্ঞ, রংপুর মেডিকেল কলেজ ও হাসপাতাল",
    "specialty": "Cardiology",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-ebadot"
    ],
    "schedule": "প্রতি বৃহঃপতিবার বিকাল ৩ টা - রাত ৯ টা",
    "availableToday": false,
    "rating": 4.8,
    "image": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 700
  },
  {
    "id": "j-nihar",
    "name": "Dr. Nihar Ranjan Chowdhury",
    "degree": "MBBS, BCS (স্বাস্থ্য) | মেডিকেল অফিসার, ২৫০ শয্যা বিশিষ্ট জেনারেল হাসপাতাল, নীলফামারী।",
    "specialty": "Medicine",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-janata",
      "c-ekota"
    ],
    "schedule": "প্রতিদিন বিকাল ৩টা থেকে রাত ৯টা পর্যন্ত",
    "availableToday": true,
    "rating": 4.7,
    "image": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 500
  },
  {
    "id": "j-tawhida",
    "name": "Dr. Tawhida Nasrin",
    "degree": "MBBS, BCS (স্বাস্থ্য), এফসিপিএস (মেডিসিন) শেষ পর্ব, ডিএমইউ (আল্ট্রা) | মেডিকেল অফিসার (মেডিসিন বিভাগ), রংপুর মেডিকেল কলেজ ও হাসপাতাল, রংপুর।",
    "specialty": "Medicine",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-janata"
    ],
    "schedule": "প্রতি শুক্রবার সকাল ১০টা থেকে রাত ০৮টা পর্যন্ত",
    "availableToday": false,
    "rating": 4.8,
    "image": "https://images.unsplash.com/photo-1559839734-2b71f1536780?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 600
  },
  {
    "id": "j-atiur",
    "name": "Dr. Md. Atiur Rahman Sheikh",
    "degree": "MBBS, BCS (স্বাস্থ্য) | মেডিকেল অফিসার, সিভিল সার্জন অফিস, নীলফামারী।",
    "specialty": "Medicine",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-janata",
      "c-newlife"
    ],
    "schedule": "প্রতিদিন দুপুর ০১টা থেকে রাত ০৮টা পর্যন্ত (শুক্রবার বন্ধ)",
    "availableToday": true,
    "rating": 4.7,
    "image": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 500
  },
  {
    "id": "j-kamalakanta",
    "name": "Dr. Kamalakanta Roy",
    "degree": "MBBS, PGT (শিশু), DCH (শিশু), BSMMU (ঢাকা) | শিশু, পুষ্টি বৃদ্ধি ও মানসিক বিকাশে প্রশিক্ষণ প্রাপ্ত | কনসালটেন্ট, রংপুর নর্দান মেডিকেল কলেজ ও হাসপাতাল, রংপুর।",
    "specialty": "Pediatrics",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-janata"
    ],
    "schedule": "প্রতিদিন বিকাল ৫টা থেকে রাত ৯টা পর্যন্ত",
    "availableToday": true,
    "rating": 4.8,
    "image": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 500
  },
  {
    "id": "j-rikkon",
    "name": "Dr. Md. Mostafa Al Bani (Rikkon)",
    "degree": "MBBS, BCS (স্বাস্থ্য), ডি-অর্থো (পঙ্গু হাসপাতাল), এমএস (বিএসএমএমইউ), AO Spine Member (Switzerland) | অর্থোপেডিক, ট্রমা ও স্পাইন বিশেষজ্ঞ ও সার্জন | এক্স আবাসিক সার্জন, রংপুর মেডিকেল কলেজ হাসপাতাল",
    "specialty": "Orthopedics",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-janata"
    ],
    "schedule": "প্রতি শনিবার বিকাল ৪ টা - রাত ১০ টা",
    "availableToday": false,
    "rating": 4.8,
    "image": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 700
  },
  {
    "id": "pacific-hafiz",
    "name": "Dr. Md. Hafizul Islam",
    "degree": "MBBS (RU), BCS (Health), FCPS-Gastroenterology (FP), FCPS-Medicine (FP), CCD (BIRDEM) | রেজিস্ট্রার, মেডিসিন বিভাগ, রংপুর মেডিকেল কলেজ হাসপাতাল",
    "specialty": "Gastroenterology",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-pacific"
    ],
    "schedule": "প্রতি বৃহস্পতিবার বিকাল ৩টা থেকে রাত ৯টা পর্যন্ত",
    "availableToday": false,
    "rating": 4.9,
    "image": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 600
  },
  {
    "id": "pacific-ali",
    "name": "Dr. Saiyod Hasan Ali",
    "degree": "MBBS (DJMC), D-Ortho (পঙ্গু হাসপাতাল, ঢাকা) | হাড়-জোড়া, বাত-ব্যথা অর্থোপেডিক বিশেষজ্ঞ ও ট্রমা সার্জন | বাংলাদেশ স্পেশালাইজড হাসপাতাল, শ্যামলী, ঢাকা",
    "specialty": "Orthopedics",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-pacific"
    ],
    "schedule": "প্রতি বৃহস্পতিবার রাত ৯ টা - রাত ১২ টা এবং প্রতি শুক্রবার সকাল ১১ টা - সন্ধ্যা ৭ টা পর্যন্ত।",
    "availableToday": false,
    "rating": 4.8,
    "image": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 600
  },
  {
    "id": "pacific-shahjada",
    "name": "Dr. Md. Shahjada Mia",
    "degree": "MBBS, BCS (Health), MCPS (Medicine), MD ফেজ-বি (মেডিসিন) | রংপুর মেডিকেল কলেজ হাসপাতাল",
    "specialty": "Medicine",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-pacific"
    ],
    "schedule": "প্রতি শুক্রবার বিকাল ৩ টা - রাত ৯ টা",
    "availableToday": true,
    "rating": 4.8,
    "image": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 600
  },
  {
    "id": "pacific-alamin",
    "name": "Dr. Al-Amin Hossain",
    "degree": "MBBS, সিএমইউ (আল্ট্রা), FCPS (ইন্টারনাল মেডিসিন) শেষ পর্ব, এইচএমও (মেডিসিন) | রংপুর মেডিকেল কলেজ ও হাসপাতাল",
    "specialty": "Medicine",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-pacific"
    ],
    "schedule": "প্রতি সোমবার ও বৃহস্পতিবার সকাল ১০টা – বিকাল ৪টা",
    "availableToday": true,
    "rating": 4.7,
    "image": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 500
  },
  {
    "id": "pacific-sabuj",
    "name": "Dr. Md. Abu Taher Sabuj",
    "degree": "MBBS (DJMC) | মেডিসিন, ডায়াবেটিস এন্ড জেনারেল প্রাকটিশনার",
    "specialty": "Medicine",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-pacific"
    ],
    "schedule": "প্রতি শনিবার সকাল ৯:৩০ – বিকাল ৫টা এবং প্রতি মঙ্গলবার বিকাল ৫টা – রাত ৮টা",
    "availableToday": false,
    "rating": 4.8,
    "image": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 500
  },
  {
    "id": "pacific-sarwar",
    "name": "Dr. Md. Sarwar Hossain",
    "degree": "MBBS, BCS (Health) | মেডিকেল অফিসার, সদর, নীলফামারী",
    "specialty": "Orthopedics",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-pacific"
    ],
    "schedule": "প্রতিদিন দুপুর ২টা থেকে রাত ৯টা পর্যন্ত",
    "availableToday": true,
    "rating": 4.9,
    "image": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 500
  },
  {
    "id": "pacific-robiul",
    "name": "Dr. Md. Robiul Islam",
    "degree": "MBBS, MD (Medicine) | সহকারী অধ্যাপক, মেডিসিন বিভাগ, প্রাইম মেডিকেল কলেজ ও হাসপাতাল",
    "specialty": "Medicine",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-pacific"
    ],
    "schedule": "প্রতি বুধবার দুপুর ২টা থেকে রাত ৮টা পর্যন্ত",
    "availableToday": false,
    "rating": 4.7,
    "image": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 600
  },
  {
    "id": "pacific-altaf",
    "name": "Dr. Md. Altaf Hossain Sarker",
    "degree": "MBBS, MCPM, DPM | অধ্যাপক, মানসিক ব্যাধি বিভাগ, নর্দান প্রাইভেট মেডিকেল কলেজ",
    "specialty": "Psychiatry",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-pacific"
    ],
    "schedule": "বৃহস্পতিবার সকাল ১০টা থেকে বিকাল ৩টা পর্যন্ত",
    "availableToday": false,
    "rating": 4.9,
    "image": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 800
  },
  {
    "id": "pacific-kayes",
    "name": "Dr. Md. Imrul Kayes",
    "degree": "MBBS (RMU), PGT (Orthopedic & Traumatology) | মেডিকেল অফিসার, রুটস্ হাসপাতাল ও ডায়াগনস্টিক সেন্টার, নীলফামারী",
    "specialty": "Orthopedics",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-pacific"
    ],
    "schedule": "প্রতি সোমবার ও বৃহস্পতিবার সকাল ১০টা – বিকাল ৪টা",
    "availableToday": false,
    "rating": 4.6,
    "image": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 400
  },
  {
    "id": "pacific-ayesha",
    "name": "Dr. Ayesha Siddika",
    "degree": "MBBS (RMU), DMU (Ultra), প্রাক্তন এইচ এম ও (রেডিওলজি এন্ড ইমেজিং) | মেডিকেল অফিসার, আস্থা কেয়ার, নীলফামারী",
    "specialty": "Gynecology",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-pacific"
    ],
    "schedule": "শনিবার সকাল ৯:৩০ – বিকাল ৫টা এবং প্রতি বুধবার বিকাল ৫টা – রাত ৮টা",
    "availableToday": false,
    "rating": 4.5,
    "image": "https://images.unsplash.com/photo-1559839734-2b71f1536780?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 500
  },
  {
    "id": "pacific-selim",
    "name": "Dr. Md. Salimuzzaman",
    "degree": "MBBS, BCS (Health), MCPS (Medicine), FCPS Final Part (Medicine), MRCP UK (Paces), MD Resident (Cardiology) | National Institute of Cardiovascular Diseases",
    "specialty": "Cardiology",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-pacific"
    ],
    "schedule": "বৃহস্পতিবার বিকাল ৫টা – রাত ৯টা এবংশুক্রবার সকাল ৯টা – রাত ৮টা",
    "availableToday": false,
    "rating": 4.8,
    "image": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 800
  },
  {
    "id": "gs-obayda",
    "name": "Dr. Obayda Nasrin (Mukta)",
    "degree": "MBBS, BCS (Health), DGO (Dhaka Medical College) | কনসালটেন্ট (গাইনী), ২৫০ শয্যা জেনারেল হাসপাতাল, নীলফামারী",
    "specialty": "Gynecology",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-greensign"
    ],
    "schedule": "শনিবার, রবিবার, সোমবার ও বুধবার: বিকাল ৪:০০ টা - রাত ৯:০০ টা পর্যন্ত",
    "availableToday": true,
    "rating": 4.9,
    "image": "https://images.unsplash.com/photo-1623854767233-2d2c322cc4e2?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 600
  },
  {
    "id": "gs-moazzem",
    "name": "Dr. Shah Md. Moazzem Hossain",
    "degree": "MBBS (Dhaka), DCH (Child), BCS (Health) | সিনিয়র কনসালটেন্ট (শিশু), ২৫০ শয্যা জেনারেল হাসপাতাল, নীলফামারী",
    "specialty": "Pediatrics",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-greensign"
    ],
    "schedule": "প্রতিদিন বিকাল ৩টা – রাত ১০টা পর্যন্ত",
    "availableToday": true,
    "rating": 4.8,
    "image": "https://images.unsplash.com/photo-1559839734-2b71f1536780?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 500
  },
  {
    "id": "gs-rahim",
    "name": "Dr. Abdur Rahim",
    "degree": "MBBS, BCS (Health), D-Ortho (BSMMU) | অর্থোপেডিক বিশেষজ্ঞ ও ট্রমা সার্জন, ২৫০ শয্যা জেনারেল হাসপাতাল, নীলফামারী",
    "specialty": "Orthopedics",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-greensign"
    ],
    "schedule": "প্রতি শনি – বৃহস্পতিবার বিকাল ৩টা – রাত ৯টা পর্যন্ত",
    "availableToday": true,
    "rating": 4.7,
    "image": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 600
  },
  {
    "id": "gs-asad-neuro",
    "name": "Dr. Md. Asaduzzaman (Asad)",
    "degree": "MBBS, BCS (Health), FCPS (Medicine), MD (Neurology) – BSMMU | ন্যাশনাল ইনস্টিটিউট অফ নিউরোসায়েন্স এন্ড হাসপাতাল, ঢাকা",
    "specialty": "Neuromedicine",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-greensign"
    ],
    "schedule": "প্রতি শুক্রবার সকাল ১০টা – রাত ৮টা পর্যন্ত",
    "availableToday": false,
    "rating": 4.8,
    "image": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 800
  },
  {
    "id": "gs-asad-card",
    "name": "Dr. Md. Asad Alam",
    "degree": "MBBS, BCS (Health), CCD (BIRDEM), D-Card (BSMMU) | হৃদরোগ বিশেষজ্ঞ, এম আব্দুর রহিম মেডিকেল কলেজ হাসপাতাল, দিনাজপুর",
    "specialty": "Cardiology",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-greensign"
    ],
    "schedule": "প্রতি শনি, রবি, মঙ্গল ও বুধবার বিকাল ৪:০০ টা - রাত ৯:০০ টা পর্যন্ত",
    "availableToday": true,
    "rating": 4.8,
    "image": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 600
  },
  {
    "id": "gs-mehfuz",
    "name": "Dr. Md. Mehfuz Ali",
    "degree": "MBBS (RMC), BCS (Health), FCPS (Medicine-FP), D-Card (Cardiology Course) | আর.পি, ২৫০ শয্যা জেনারেল হাসপাতাল, নীলফামারী",
    "specialty": "Cardiology",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-greensign"
    ],
    "schedule": "প্রতি শনি – বৃহস্পতিবার বিকাল ৩টা – রাত ১০টা পর্যন্ত",
    "availableToday": true,
    "rating": 4.9,
    "image": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 600
  },
  {
    "id": "gs-rumana",
    "name": "Dr. Rumana Afroz",
    "degree": "MBBS, PGT, EOCT (Gynae & Obs), DMU (Ultra), CCD (BIRDEM), MPH (North South University) | মেডিকেল অফিসার, উত্তরা ইপিজেড, বেপজা হাসপাতাল",
    "specialty": "Gynecology",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-greensign"
    ],
    "schedule": "রবি ও সোমবার: সকাল ১১টা – দুপুর ২টা, শনি, মঙ্গল, বুধ ও বৃহস্পতিবার: বিকাল ৪টা – রাত ১০টা, শুক্রবার: সকাল ১০টা – রাত ৮টা",
    "availableToday": true,
    "rating": 4.7,
    "image": "https://images.unsplash.com/photo-1559839734-2b71f1536780?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 500
  },
  {
    "id": "gs-rashedul",
    "name": "Dr. Md. Rashedul Islam (Rashed)",
    "degree": "MBBS, DLO (BSMMU) | ENT & Head Neck Surgeon, বঙ্গবন্ধু শেখ মুজিব মেডিকেল বিশ্ববিদ্যালয় (সাবেক পিজি হাসপাতাল)",
    "specialty": "ENT",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-greensign"
    ],
    "schedule": "প্রতিদিন সকাল ১০টা – রাত ৯টা পর্যন্ত",
    "availableToday": true,
    "rating": 4.8,
    "image": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 500
  },
  {
    "id": "gs-sohrab",
    "name": "Dr. Md. Sohrab Hossain",
    "degree": "MBBS, FCPS (Surgery) | সহকারী অধ্যাপক, নীলফামারী মেডিকেল কলেজ ও হাসপাতাল",
    "specialty": "Surgery",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-greensign"
    ],
    "schedule": "প্রতি শনি – বৃহস্পতিবার বিকাল ৩টা – রাত ৯টা পর্যন্ত",
    "availableToday": true,
    "rating": 4.9,
    "image": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 700
  },
  {
    "id": "gs-arif",
    "name": "Dr. Khandaker Md. Arif Hasnat",
    "degree": "MBBS, BCS (Health), MD (Oncology) | বঙ্গবন্ধু শেখ মুজিব মেডিকেল বিশ্ববিদ্যালয়",
    "specialty": "Oncology",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-greensign"
    ],
    "schedule": "প্রতি সোমবার বিকাল ৩টা – রাত ৯টা পর্যন্ত",
    "availableToday": false,
    "rating": 4.8,
    "image": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 800
  },
  {
    "id": "gs-fahim",
    "name": "Dr. Fahim Kiswar",
    "degree": "MBBS, DDV, CCD, FLCS (Thailand), FCPS (Final Part) | সহকারী অধ্যাপক ও বিভাগীয় প্রধান, নর্দান মেডিকেল কলেজ ও হাসপাতাল",
    "specialty": "Dermatology",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-greensign"
    ],
    "schedule": "প্রতি শুক্রবার বিকাল ৩ টা - রাত ৯ টা",
    "availableToday": false,
    "rating": 4.8,
    "image": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 700
  },
  {
    "id": "gs-nuruzzaman",
    "name": "Dr. Md. Nuruzzaman Mia",
    "degree": "MBBS, BCS (Health), MS (Urology) | ইউরোলজিস্ট, দিনাজপুর মেডিকেল কলেজ হাসপাতাল",
    "specialty": "Urology",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-greensign"
    ],
    "schedule": "শুধু শুক্রবার: বিকাল ৩:০০ টা - রাত ৯:০০ টা পর্যন্ত",
    "availableToday": true,
    "rating": 4.8,
    "image": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 800
  },
  {
    "id": "gs-kanak",
    "name": "Dr. Kanak Chandra Roy",
    "degree": "MBBS (Dhaka Medical College), FCPS (Medicine), BCS (Health) | মেডিকেল অফিসার, DG Health, মহাখালী, ঢাকা (ডেপুটেশন: National Institute of Mental Health)",
    "specialty": "Medicine",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-greensign"
    ],
    "schedule": "প্রতি বৃহস্পতিবার বিকাল ৩টা – রাত ৯টা পর্যন্ত",
    "availableToday": false,
    "rating": 4.9,
    "image": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 800
  },
  {
    "id": "mad-sakib",
    "name": "Dr. Shahidul Islam (Sakib)",
    "degree": "MBBS, BCS (Health), MD (Nephrology - Registrar) | National Institute of Kidney Diseases and Urology, Dhaka",
    "specialty": "Nephrology",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-madina"
    ],
    "schedule": "প্রতি শুক্রবার বিকাল ৪ টা - রাত ৯ টা",
    "availableToday": true,
    "rating": 4.9,
    "image": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 800
  },
  {
    "id": "mad-card1",
    "name": "Dr. Sorifuzzaman Tuhin",
    "degree": "MBBS, BCS (Health), PGT (Medicine), MD (Cardiology), MACP (Medicine) America, MACC (Cardiology) America",
    "specialty": "Cardiology",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-madina"
    ],
    "schedule": "শুক্রবার সকাল ৯:টা – দুপুর ২:টা",
    "availableToday": false,
    "rating": 4.8,
    "image": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 700
  },
  {
    "id": "mad-skin1",
    "name": "Dr. Md. Abdul Kuddus",
    "degree": "MBBS, BCS (Health), CCD (Diabetology), MCPS (Dermatology & VD) | Assistant Professor, Dinajpur Medical College",
    "specialty": "Dermatology",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-madina"
    ],
    "schedule": "রবিবার বিকাল ৩:টা – রাত ৮:টা",
    "availableToday": true,
    "rating": 4.7,
    "image": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 600
  },
  {
    "id": "mad-ent1",
    "name": "Dr. Dhiman Pramanik",
    "degree": "MBBS (DMC), BCS (Health), FCPS (ENT) | Assistant Professor, Rangpur Medical College",
    "specialty": "ENT",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-madina"
    ],
    "schedule": "মঙ্গলবার বিকাল ৩:৩০ – রাত ৮:টা",
    "availableToday": true,
    "rating": 4.8,
    "image": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 500
  },
  {
    "id": "mad-med1",
    "name": "Dr. Md. Masud Parvez",
    "degree": "MBBS (SSMC), BCS (Health), MD (Medicine) | Nilphamari Medical College",
    "specialty": "Medicine",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-madina"
    ],
    "schedule": "শনি–বৃহস্পতিবার বিকাল ৪:টা – রাত ৮:টা",
    "availableToday": true,
    "rating": 4.8,
    "image": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 600
  },
  {
    "id": "mad-orth1",
    "name": "Dr. Md. Asaduzzaman (Sumon)",
    "degree": "MBBS (DU), BCS (Health), D-Ortho (BSMMU) | Rangpur Medical College",
    "specialty": "Orthopedics",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-madina"
    ],
    "schedule": "সোমবার বিকাল ৩:টা – রাত ৮:টা",
    "availableToday": true,
    "rating": 4.8,
    "image": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 700
  },
  {
    "id": "mad-monir",
    "name": "Dr. Md. Moniruzzaman (Moni)",
    "degree": "MBBS, BCS (Health), CCD (BIRDEM), MS (Gynae & Obs) | 250 Bed General Hospital",
    "specialty": "Gynecology",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-madina"
    ],
    "schedule": "প্রতিদিন",
    "availableToday": true,
    "rating": 4.7,
    "image": "https://images.unsplash.com/photo-1559839734-2b71f1536780?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 500
  },
  {
    "id": "mad-sumi",
    "name": "Dr. Israt Aziz (Sumi)",
    "degree": "MBBS, MS (Gynae & Obs) | Insaf Barakah Medical College, Dhaka",
    "specialty": "Gynecology",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-madina"
    ],
    "schedule": "শুক্রবার সকাল ৯:টা – রাত ৮:টা",
    "availableToday": false,
    "rating": 4.8,
    "image": "https://images.unsplash.com/photo-1623854767233-2d2c322cc4e2?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 500
  },
  {
    "id": "mad-ped1",
    "name": "Dr. Tabassum Mahjabin",
    "degree": "MBBS, BCS (Health), FCPS (Pediatrics) | 250 Bed General Hospital",
    "specialty": "Pediatrics",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-madina"
    ],
    "schedule": "প্রতিদিন বিকাল ৪:টা – রাত ৮:টা",
    "availableToday": true,
    "rating": 4.8,
    "image": "https://images.unsplash.com/photo-1623854767233-2d2c322cc4e2?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 500
  },
  {
    "id": "ev-lucky",
    "name": "Dr. Mst. Sultana Razia (Lucky)",
    "degree": "MBBS, BCS (Health), DGO (Gynae & Obs), BMU (Former PG Hospital, Dhaka) | 250 Bed General Hospital, Nilphamari",
    "specialty": "Gynecology",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-evercare-spec"
    ],
    "schedule": "প্রতিদিন: দুপুর ৩:০০ - রাত ১০:০০",
    "availableToday": true,
    "rating": 4.9,
    "image": "https://images.unsplash.com/photo-1559839734-2b71f1536780?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 500
  },
  {
    "id": "ev-asad",
    "name": "Dr. Md. Asad Alam",
    "degree": "MBBS, BCS (Health), CCD (BIRDEM), D-CARD (Cardiology), BMU | Dinajpur Medical College Hospital",
    "specialty": "Cardiology",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-evercare-spec"
    ],
    "schedule": "প্রতি শনি, রবি, মঙ্গল, বুধ ও শুক্রবার বিকাল ৪ টা - রাত ৯ টা",
    "availableToday": true,
    "rating": 4.8,
    "image": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 600
  },
  {
    "id": "ev-nripen",
    "name": "Dr. Nripendra Nath Roy",
    "degree": "MBBS (RU), MS Course (ENT), CCD (BIRDEM) | Resident Doctor, ENT Department, SSMCH, Dhaka",
    "specialty": "ENT",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-evercare-spec"
    ],
    "schedule": "প্রতি শুক্রবার ও শনিবার বিকাল ৪ টা - রাত ৯ টা",
    "availableToday": false,
    "rating": 4.8,
    "image": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 600
  },
  {
    "id": "ev-iqbal",
    "name": "Dr. Md. Allama Iqbal (Bappi)",
    "degree": "MBBS, BCS (Health), MS (Urology), FCPS Final Part (Surgery) | Dhaka Medical College Hospital, Dhaka",
    "specialty": "Urology",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-evercare-spec"
    ],
    "schedule": "প্রতি শনিবার: বিকাল ৩:০০ - রাত ৮:০০",
    "availableToday": false,
    "rating": 4.9,
    "image": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 800
  },
  {
    "id": "ev-riyasad",
    "name": "Dr. Md. Riyasad Mahbub",
    "degree": "MBBS, BCS (Health), CCD (BIRDEM), PGT (Medicine), DTCD (Chest Diseases) | Dinajpur Medical College Hospital, Dinajpur",
    "specialty": "Medicine",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-evercare-spec"
    ],
    "schedule": "বৃহস্পতি: বিকাল ৪:০০ - রাত ৯:০০, শুক্রবার: সকাল ১০:০০ - বিকাল ৫:০০",
    "availableToday": false,
    "rating": 4.8,
    "image": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 500
  },
  {
    "id": "ev-utsho",
    "name": "Dr. Utsho Chandra Roy",
    "degree": "MBBS (DMC), BCS (Health), FCPS (Internal Medicine) Part-2, MRCP-1 (London), USMLE-1 (America) | Medical Officer, General Hospital, Nilphamari",
    "specialty": "Medicine",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-evercare-spec"
    ],
    "schedule": "প্রতিদিন: বিকাল ৩:০০ - রাত ৯:০০",
    "availableToday": true,
    "rating": 4.9,
    "image": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 600
  },
  {
    "id": "nl-med1",
    "name": "Dr. Md. Masud Parvez",
    "degree": "MBBS (SSMC), BCS (Health), MD (Internal Medicine) | Rangpur & Nilphamari Medical College",
    "specialty": "Medicine",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-newlife"
    ],
    "schedule": "প্রতিদিন: বিকাল ৫:০০ - রাত ৮:০০",
    "availableToday": true,
    "rating": 4.9,
    "image": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 600
  },
  {
    "id": "nl-uro1",
    "name": "Prof. Dr. Mohammad Mobarak Hossain",
    "degree": "MBBS, MS (Urology), FCPS (Surgery) | Former Professor, Dhaka Medical College Hospital",
    "specialty": "Urology",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-newlife"
    ],
    "schedule": "শুক্রবার: সকাল ১০:০০ - রাত ৮:০০",
    "availableToday": false,
    "rating": 5,
    "image": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 1000
  },
  {
    "id": "nl-gyn1",
    "name": "Dr. Farzana Akter",
    "degree": "MBBS, BCS (Health), CMU, DMU (Ultrasonology) | Medical Officer, Nilphamari",
    "specialty": "Gynecology",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-newlife"
    ],
    "schedule": "প্রতিদিন: বিকাল ৩:০০ - রাত ৯:০০",
    "availableToday": true,
    "rating": 4.8,
    "image": "https://images.unsplash.com/photo-1559839734-2b71f1536780?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 500
  },
  {
    "id": "nl-med2",
    "name": "Dr. Md. Imran Kabir",
    "degree": "MBBS, BCS (Health), PGT (Medicine), CCD (BIRDEM), CMU | Upazila Health and Family Planning Officer",
    "specialty": "Medicine",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-newlife"
    ],
    "schedule": "প্রতিদিন: দুপুর ২:০০ - রাত ১০:০০",
    "availableToday": true,
    "rating": 4.8,
    "image": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 500
  },
  {
    "id": "nl-card1",
    "name": "Dr. Mehfuz Ali",
    "degree": "MBBS, BCS (Health), FCPS (Medicine), D-CARD (Cardiology) | Nilphamari Sadar Hospital, Nilphamari",
    "specialty": "Cardiology",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-newlife"
    ],
    "schedule": "শনি-বৃহস্পতি: দুপুর ২:০০ - রাত ৮:০০",
    "availableToday": true,
    "rating": 4.9,
    "image": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 600
  },
  {
    "id": "nl-skin1",
    "name": "Dr. Farhanul Hasan Sifat",
    "degree": "MBBS, PGT (Medicine), D & C (Skin & VD), CCD (BIRDEM) | Rangpur Medical College",
    "specialty": "Dermatology",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-newlife"
    ],
    "schedule": "প্রতি বুধবার দুপুর ২:০০ টা - রাত ৯:০০ টা পর্যন্ত",
    "availableToday": true,
    "rating": 4.8,
    "image": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 500
  },
  {
    "id": "nl-atiar",
    "name": "Dr. Md. Atiur Rahman Sheikh",
    "degree": "MBBS, BCS (Health) | Medical Officer, Civil Surgeon Office, Nilphamari",
    "specialty": "Medicine",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-newlife"
    ],
    "schedule": "প্রতিদিন: দুপুর ১:০০ - রাত ৮:০০ (শুক্রবার বন্ধ)",
    "availableToday": true,
    "rating": 4.7,
    "image": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 500
  },
  {
    "id": "ek-med1",
    "name": "Dr. Dip Joyti Sarkar",
    "degree": "MBBS (DMC), BCS (Health), FCPS (Medicine), MD (Chest Disease) | Interventional Pulmonologist",
    "specialty": "Medicine",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-ekota"
    ],
    "schedule": "প্রতি শুক্রবার সকাল ১১ টা - রাত ৮ টা পর্যন্ত।",
    "availableToday": true,
    "rating": 4.9,
    "image": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 800
  },
  {
    "id": "ek-card1",
    "name": "Dr. Md. Hasanul Islam",
    "degree": "MBBS, MD (Cardiology) | Assistant Professor, Rangpur Medical College Hospital",
    "specialty": "Cardiology",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-ekota"
    ],
    "schedule": "প্রতি শুক্রবার: সকাল ৯:০০ - বিকাল ৫:০০",
    "availableToday": false,
    "rating": 5,
    "image": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 800
  },
  {
    "id": "ek-pallab1",
    "name": "Dr. Pallab Kumar Das",
    "degree": "MBBS (SULT), M.Phil | Associate Professor, M Abdur Rahim Medical College, Dinajpur",
    "specialty": "Medicine",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-ekota"
    ],
    "schedule": "প্রতি শুক্রবার: সকাল ১০:০০ - দুপুর ২:০০",
    "availableToday": false,
    "rating": 4.8,
    "image": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 700
  },
  {
    "id": "ek-gyn1",
    "name": "Dr. Abu Hena Mostafa Kamal",
    "degree": "এম.বি.বি.এস (ঢাকা), বি.সি.এস (স্বাস্থ্য), সি.এম.ইউ (আল্ট্রাসনোগ্রাম স্পেশালিস্ট), পিজিটি (ঢাকা মেডিকেল কলেজ হাসপাতাল), সি.সি.ডি | চর্ম, যৌন ও মেডিসিন রোগে অভিজ্ঞ | মেডিকেল অফিসার, ইউ.এইচ.সি, পার্বতীপুর, দিনাজপুর।",
    "specialty": "Dermatology",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-ekota"
    ],
    "schedule": "প্রতিদিন বিকাল ৫ টা - রাত ১০ টা",
    "availableToday": false,
    "rating": 4.7,
    "image": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 600
  },
  {
    "id": "ek-med2",
    "name": "Dr. Md. Mahbub-ul-Alam",
    "degree": "MBBS, BCS (Health), PGT (Medicine), CCD (BIRDEM) | Medical Officer, 250 Bed Hospital, Nilphamari",
    "specialty": "Medicine",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-ekota"
    ],
    "schedule": "প্রতিদিন বিকাল ৩ টা - রাত ৯ টা পর্যন্ত।",
    "availableToday": true,
    "rating": 4.8,
    "image": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 500
  },
  {
    "id": "ek-med3",
    "name": "Dr. S.M. Jawadul Haque",
    "degree": "MBBS, VTCD (Chest), PGT (Medicine) | Assistant Professor, Rangpur Medical College",
    "specialty": "Medicine",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-ekota"
    ],
    "schedule": "প্রতিদিন: দুপুর ১:০০ - রাত ৮:০০ (শুক্রবন্ধ)",
    "availableToday": true,
    "rating": 4.8,
    "image": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 600
  },
  {
    "id": "ek-kid1",
    "name": "Dr. Nihar Ranjan Chowdhury",
    "degree": "MBBS, BCS (Health), PGT (Medicine), CCD (BIRDEM) | Medical Officer, 250 Bed Hospital, Nilphamari",
    "specialty": "Medicine",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-ekota"
    ],
    "schedule": "প্রতিদিন: দুপুর ৩:০০ - রাত ৯:০০",
    "availableToday": true,
    "rating": 4.7,
    "image": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 500
  },
  {
    "id": "ek-gyn2",
    "name": "Dr. Maksura Khanam Matul Chowdhury",
    "degree": "এম.বি.বি.এস (আর.ইউ), সিএমইউ-আল্ট্রা (ঢাকা) | প্রাক্তন আবাসিক মেডিকেল অফিসার, চাটখিল ইসলামিয়া হাসপাতাল, নোয়াখালী | বিএমডিসি রেজিঃ নংঃ এ-১০৬৩৫৬",
    "specialty": "Gynecology",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-ekota"
    ],
    "schedule": "শনিবার থেকে বৃহস্পতিবার সকাল ১০টা – রাত ৯টা",
    "availableToday": true,
    "rating": 4.8,
    "image": "https://images.unsplash.com/photo-1559839734-2b71f1536780?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 500
  },
  {
    "id": "ek-orth1",
    "name": "Dr. H.M. Sadi (Sunny)",
    "degree": "MBBS, BCS (Health), MS (Ortho Course), NITOR (Pangu Hospital), FCPS (FP), CMU, CCD | Trauma & Orthopedic Surgeon (BMDC: 77660)",
    "specialty": "Orthopedics",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-ekota"
    ],
    "schedule": "প্রতি শুক্রবার: সকাল ১০:০০ - রাত ৮:০০",
    "availableToday": false,
    "rating": 4.9,
    "image": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 800
  },
  {
    "id": "ek-med4",
    "name": "Dr. Md. Masud Parvez",
    "degree": "MBBS (SSMC), BCS (Health), MD (Internal Medicine) | Nilphamari Medical College",
    "specialty": "Medicine",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-ekota"
    ],
    "schedule": "প্রতিদিন: বিকাল ৩:০০ - রাত ১০:০০",
    "availableToday": true,
    "rating": 4.9,
    "image": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 600
  },
  {
    "id": "ek-gyn3",
    "name": "Dr. Farzana Akter",
    "degree": "MBBS, BCS (Health), CMU, DMU | Medical Officer, Nilphamari",
    "specialty": "Gynecology",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-ekota"
    ],
    "schedule": "প্রতিদিন: দুপুর ২:০০ - রাত ৯:০০",
    "availableToday": true,
    "rating": 4.8,
    "image": "https://images.unsplash.com/photo-1623854767233-2d2c322cc4e2?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 500
  },
  {
    "id": "ek-sur1",
    "name": "Dr. M.A. Sujon",
    "degree": "MBBS (Raj), BCS (Health), CMU, PGT (Surgery) | Medical Officer, Nilphamari Medical College",
    "specialty": "Surgery",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-ekota"
    ],
    "schedule": "প্রতিদিন: বিকাল ৩:০০ - রাত ৯:০০",
    "availableToday": true,
    "rating": 4.8,
    "image": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 600
  },
  {
    "id": "moun-nishat",
    "name": "Dr. Nishat Tasnim",
    "degree": "MBBS, BCS (Health), FCPS (Obstetrics & Gynecology) | স্ত্রীরোগ ও প্রসূতিবিদ বিশেষজ্ঞ, নীলফামারী সদর হাসপাতাল",
    "specialty": "Gynecology",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-moun"
    ],
    "schedule": "শনি - বৃহস্পতিবার বিকাল ৪:০০ - রাত ৮:০০",
    "availableToday": true,
    "rating": 4.9,
    "image": "https://images.unsplash.com/photo-1559839734-2b71f1536780?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 500
  },
  {
    "id": "moun-lopa",
    "name": "Dr. Shahnaz Parveen (Lopa)",
    "degree": "MBBS, DCH (Child Health) | নবজাতক ও শিশু রোগ বিশেষজ্ঞ, ২৫০ শয্যা বিশিষ্ট জেনারেল হাসপাতাল, নীলফামারী",
    "specialty": "Pediatrics",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-moun"
    ],
    "schedule": "প্রতিদিন বিকাল ৩:০০ - রাত ৯:০০ (শুক্রবার বন্ধ)",
    "availableToday": true,
    "rating": 4.8,
    "image": "https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 500
  },
  {
    "id": "moun-wajibullah",
    "name": "Dr. Md. Owajibulla Biplob",
    "degree": "MBBS (SSMC), BCS (Health), FCPS (Surgery), MRCS (Edinburgh), MS (Colorectal Surgery), BSMMU, ঢাকা | সহকারী অধ্যাপক (কোলোরেক্টাল সার্জারি), স্যার সলিমুল্লাহ মেডিকেল কলেজ ও হাসপাতাল (মিটফোর্ড), ঢাকা | রংপুর বিভাগের প্রথম কোলোরেক্টাল সার্জন (পাইলস, ফিস্টুলা, কোলন ক্যান্সার ও কোলোরেক্টাল সার্জারি বিশেষজ্ঞ)",
    "specialty": "Surgery",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-moun"
    ],
    "schedule": "প্রতি বৃহস্পতিবার ও শুক্রবার সকাল ১১ টা - বিকাল ৪ টা পর্যন্ত।",
    "availableToday": false,
    "rating": 4.9,
    "image": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 800
  },
  {
    "id": "moun-shankar",
    "name": "Dr. Shankar Kumar Saha",
    "degree": "MBBS, D-Card (BSMMU) | Senior Consultant (Retd.), Department of Cardiology, Rangpur Medical College Hospital | হৃদরোগ ও মেডিসিন বিশেষজ্ঞ (উচ্চ রক্তচাপ, হার্ট ফেইলিউর, বুকে ব্যথা, ডায়াবেটিস)",
    "specialty": "Cardiology",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-moun"
    ],
    "schedule": "প্রতি সোমবার: বিকাল ৩:০০ - রাত ৮:০০, প্রতি শুক্রবার: সকাল ১১:০০ - বিকাল ৫:০০",
    "availableToday": false,
    "rating": 4.8,
    "image": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 700
  },
  {
    "id": "roots-mizanur",
    "name": "Dr. Md. Mizanur Rahman",
    "degree": "MBBS, MS (চক্ষু), BCS (স্বাস্থ্য) | চক্ষু বিশেষজ্ঞ ও ফ্যাকো সার্জন | সহযোগী অধ্যাপক ও বিভাগীয় প্রধান, চক্ষু বিভাগ, নীলফামারী মেডিকেল কলেজ | উন্নত ফ্যাকো অপারেশনে বিশেষ প্রশিক্ষণপ্রাপ্ত (ভারত)",
    "specialty": "Ophthalmology",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-roots"
    ],
    "schedule": "চেম্বারের নির্দিষ্ট দিন ও সময় জানতে আমাদের হটলাইনে (01352669100) কল করুন",
    "availableToday": true,
    "rating": 4.9,
    "image": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 600
  },
  {
    "id": "roots-kamrul",
    "name": "Dr. Md. Kamrul Hasan",
    "degree": "MBBS (রাজশাহী মেডিকেল কলেজ), BCS (স্বাস্থ্য), MS (চক্ষু) | চক্ষু বিশেষজ্ঞ ও সার্জন | কনসালটেন্ট (চক্ষু বিভাগ), ১০০ শয্যা হাসপাতাল, সৈয়দপুর, নীলফামারী",
    "specialty": "Ophthalmology",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-roots"
    ],
    "schedule": "চেম্বারের নির্দিষ্ট দিন ও সময় জানতে আমাদের হটলাইনে (01352669100) কল করুন",
    "availableToday": true,
    "rating": 4.8,
    "image": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 500
  },
  {
    "id": "roots-abdul-hamid",
    "name": "Dr. Md. Abdul Hamid",
    "degree": "MBBS, BCS (স্বাস্থ্য), MS (Ophthalmology) | চক্ষু বিশেষজ্ঞ ও সার্জন | কনসালটেন্ট (চক্ষু), ২৫০ শয্যা জেনারেল হাসপাতাল, নীলফামারী",
    "specialty": "Ophthalmology",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-roots"
    ],
    "schedule": "চেম্বারের নির্দিষ্ট দিন ও সময় জানতে আমাদের হটলাইনে (01352669100) কল করুন",
    "availableToday": true,
    "rating": 4.8,
    "image": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 500
  },
  {
    "id": "j-shakil",
    "name": "Dr. Sahariar Ahmed Shakil",
    "degree": "MBBS, BCS (স্বাস্থ্য) | সাধারণ ও মেডিসিন বিশেষজ্ঞ",
    "specialty": "Medicine",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-janata"
    ],
    "schedule": "প্রতি শুক্রবার বিকাল ৩:০০ টা থেকে রাত ৯:০০ টা পর্যন্ত",
    "availableToday": true,
    "rating": 4.8,
    "image": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 500
  },
  {
    "id": "mad-kamrul",
    "name": "Dr. Md. Kamrul Hasan",
    "degree": "MBBS, BCS (স্বাস্থ্য) | মেডিসিন ও জেনারেল প্রাকটিশনার",
    "specialty": "Medicine",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-madina"
    ],
    "schedule": "প্রতি মঙ্গলবার দুপুর ২ টা থেকে রাত ৮:০০ টা পর্যন্ত",
    "availableToday": true,
    "rating": 4.8,
    "image": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 600
  },
  {
    "id": "j-shaheen-gyn",
    "name": "Dr. Shaheen Ara Begum",
    "degree": "MBBS, BCS (স্বাস্থ্য), MCPS (গাইনি এন্ড অবস), ফেলোশিপ ইন ইনফার্টিলিটি (ভারত) | সহকারী অধ্যাপক (গাইনি এন্ড অবস), রংপুর মেডিকেল কলেজ ও হাসপাতাল | স্ত্রীরোগ, প্রসূতিবিদ্যা ও বন্ধ্যাত্ব রোগ বিশেষজ্ঞ সার্জন",
    "specialty": "Gynecology",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-janata"
    ],
    "schedule": "প্রতি শুক্রবার বিকাল ৩ টা - রাত ৯ টা",
    "availableToday": false,
    "rating": 4.9,
    "image": "https://images.unsplash.com/photo-1559839734-2b71f1536780?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 700
  },
  {
    "id": "eb-sohel-ortho",
    "name": "Dr. Md. Sohelur Rahman (Sohel)",
    "degree": "MBBS (রংপুর মেডিকেল), D-Ortho Surgery, PRP Therapy & Ilizarov Fellowship, AO Trauma & APOA Member | অর্থোপেডিক ও ট্রমা সার্জন (হাড় ভাঙা, বাত ও জয়েন্টের ব্যথা, হাড়ের ডিফর্মিটি সংশোধন)",
    "specialty": "Orthopedics",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-ebadot"
    ],
    "schedule": "প্রতিদিন দুপুর ২:০০টা – রাত ৯:০০টা (শুক্রবার বন্ধ)",
    "availableToday": true,
    "rating": 4.8,
    "image": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 600
  },
  {
    "id": "eb-roni-ortho",
    "name": "Dr. Md. Zillur Hasan (Roni)",
    "degree": "MBBS, BCS (স্বাস্থ্য), MS (ORTHOPEDICS) – পঙ্গু হাসপাতাল, FACS (USA), AO (New Delhi) | জাতীয় অর্থোপেডিক্স হাসপাতাল ও পুনর্বাসন প্রতিষ্ঠান (নিটোর), ঢাকা (BMDC Reg: 344) | অর্থোপেডিক ও ট্রমা সার্জন",
    "specialty": "Orthopedics",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-ebadot"
    ],
    "schedule": "প্রতি শুক্রবার সকাল ১০:০০টা – সন্ধ্যা ৭:০০টা",
    "availableToday": false,
    "rating": 4.9,
    "image": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 700
  },
  {
    "id": "j-parul-gyn",
    "name": "Dr. Parul Rani Roy",
    "degree": "MBBS, DGO (Dhaka), FCPS (Gynae & Obs - LP), Laparoscopic Training (India) | সিনিয়র কনসালটেন্ট, জনতা ক্লিনিক | গাইনি ও প্রসূতি রোগ বিশেষজ্ঞ এবং ল্যাপারোস্কোপিক সার্জন",
    "specialty": "Gynecology",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-janata"
    ],
    "schedule": "প্রতিদিন সকাল ১০:০০টা – দুপুর ২:০০টা এবং বিকাল ৪:০০টা – রাত ৮:০০টা",
    "availableToday": true,
    "rating": 4.9,
    "image": "https://images.unsplash.com/photo-1559839734-2b71f1536780?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 600
  },
  {
    "id": "j-masud-med",
    "name": "Dr. Md. Masud Parvez",
    "degree": "MBBS (স্যার সলিমুল্লাহ মেডিকেল কলেজ), BCS (Health), MD (Internal Medicine) | সহকারী অধ্যাপক, নীলফামারী মেডিকেল কলেজ ও রংপুর মেডিকেল কলেজ হাসপাতাল | মেডিসিন ও ডায়াবেটিস বিশেষজ্ঞ (ডায়াবেটিস, প্রেসার, হাঁপানি, স্ট্রোক, প্যারালাইসিস, থাইরয়েড ও লিভার রোগ)",
    "specialty": "Medicine",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-janata"
    ],
    "schedule": "প্রতিদিন বিকাল ৪:০০টা – রাত ৮:০০টা (শুক্রবার বন্ধ)",
    "availableToday": true,
    "rating": 4.9,
    "image": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 600
  },
  {
    "id": "j-al-amin",
    "name": "ডাঃ মোঃ আল-আমিন",
    "degree": "এমবিবিএস, বিসিএস (স্বাস্থ্য), ডিইএম (বাংলাদেশ মেডিক্যাল বিশ্ববিদ্যালয়, ঢাকা), এফসিপিএস, এফপি (এন্ডোক্রাইনোলজি এন্ড মেটাবলিজম) | রংপুর মেডিকেল কলেজ ও হাসপাতাল, রংপুর | হরমোন, দীর্ঘমেয়াদি ডায়াবেটিস ও থাইরয়েডজনিত রোগের বিশেষজ্ঞ চিকিৎসক",
    "specialty": "Medicine",
    "districts": [
      "Nilphamari",
      "Rangpur"
    ],
    "clinics": [
      "c-janata"
    ],
    "schedule": "প্রতি রবিবার দুপুর ২টা থেকে রাত ৮টা পর্যন্ত",
    "availableToday": false,
    "rating": 4.9,
    "image": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400",
    "consultationFee": 700
  },
  {
    "id": "ek-amit-med",
    "name": "Dr. Amit Kumar Ghosh",
    "degree": "MBBS (ঢাকা), BCS (স্বাস্থ্য), MD (Internal Medicine - Resident, BSMMU), CCD (BIRDEM), PGT (Nephrology, RpMCH) | মেডিসিন, নিউরো মেডিসিন, ডায়াবেটিস, কিডনি ও গ্যাস্ট্রোলিভার রোগ বিশেষজ্ঞ (উচ্চ রক্তচাপ, স্ট্রোক, প্যারালাইসিস, অ্যাজমা, থাইরয়েড)",
    "specialty": "Medicine",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-ekota"
    ],
    "schedule": "প্রতি সোমবার বিকাল ৩:০০টা – রাত ৯:০০টা",
    "availableToday": false,
    "rating": 4.8,
    "image": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 600
  },
  {
    "id": "roots-mehjabin-gyn",
    "name": "Dr. Mehjabin Homaira Mishel",
    "degree": "MBBS (ঢাকা), BCS (স্বাস্থ্য), FCPS (FP - গাইনী রোগ ও প্রসূতিবিদ্যা) | মেডিকেল অফিসার, উপজেলা স্বাস্থ্য কমপ্লেক্স, ডিমলা, নীলফামারী | গাইনী, প্রসূতি ও বন্ধ্যাত্ব রোগ বিশেষজ্ঞ",
    "specialty": "Gynecology",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-roots"
    ],
    "schedule": "প্রতিদিন বিকাল ৪:০০টা – রাত ৮:০০টা",
    "availableToday": true,
    "rating": 4.9,
    "image": "https://images.unsplash.com/photo-1559839734-2b71f1536780?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 600
  },
  {
    "id": "roots-harun-ent",
    "name": "Dr. Muhammad Harun-or-Rashid",
    "degree": "MBBS, BCS (স্বাস্থ্য), MSPS, FCPS (ENT) | ইএনটি বিভাগ, রংপুর মেডিকেল কলেজ হাসপাতাল, রংপুর (BMDC Reg: A-69423) | নাক, কান ও গলা (ইএনটি) বিশেষজ্ঞ ও সার্জন",
    "specialty": "ENT",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-roots"
    ],
    "schedule": "প্রতি বৃহস্পতিবার দুপুর ১:০০টা – বিকাল ৪:০০টা",
    "availableToday": false,
    "rating": 4.9,
    "image": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200",
    "consultationFee": 700
  },
  {
    "id": "dr-shariful-islam-ratan",
    "name": "ডাঃ মোঃ শরিফুল ইসলাম রতন",
    "degree": "এমবিবিএস, বিসিএস (স্বাস্থ্য), ডি-কার্ড, এমডি (কার্ডিওলজি) - জাতীয় হৃদরোগ ইনস্টিটিউট ও হাসপাতাল, ঢাকা | পিজিটিডি, FESC (ইউরোপ-লন্ডন), FACC (আমেরিকা), FAPSIC (সিঙ্গাপুর), MACP, FSCAI (আমেরিকা) | সহযোগী অধ্যাপক, ডিপার্টমেন্ট অব কার্ডিওলজি, টি.এম.এস.এস মেডিকেল কলেজ এন্ড হাসপাতাল | মেডিসিন, হৃদরোগ, ডায়াবেটিস ও বাতব্যথা বিশেষজ্ঞ",
    "specialty": "Cardiology",
    "districts": [
      "Nilphamari",
      "Domar",
      "ডোমার"
    ],
    "clinics": [
      "c-siddhika-domar"
    ],
    "schedule": "প্রতি শুক্রবার সকাল ৯টা থেকে সন্ধ্যা ৬টা পর্যন্ত।",
    "availableToday": false,
    "rating": 4.9,
    "image": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300",
    "consultationFee": 800
  },
  {
    "id": "dr-soheli-binte-mostafa",
    "name": "ডাঃ সোহেলী বিনতে মোস্তফা (মিষ্টি)",
    "degree": "এমবিবিএস, বিসিএস (স্বাস্থ্য), এমএস (গাইনি এন্ড অবস), বিএসএমএমইউ | আবাসিক সার্জন (গাইনি এন্ড অবস), রংপুর মেডিকেল কলেজ ও হাসপাতাল, রংপুর | প্রসূতি, স্ত্রীরোগ বিশেষজ্ঞ ও সার্জন",
    "specialty": "Gynecology",
    "districts": [
      "Nilphamari",
      "Domar",
      "ডোমার",
      "Rangpur"
    ],
    "clinics": [
      "c-siddhika-domar"
    ],
    "schedule": "প্রতি শুক্রবার সকাল ৯টা থেকে সন্ধ্যা ৬টা পর্যন্ত।",
    "availableToday": false,
    "rating": 4.9,
    "image": "https://images.unsplash.com/photo-1559839734-2b71f1536780?auto=format&fit=crop&q=80&w=300",
    "consultationFee": 600
  },
  {
    "id": "dr-gopal-chandra-roy",
    "name": "ডাঃ গোপাল চন্দ্র রায়",
    "degree": "এমবিবিএস (রংপুর মেডিকেল কলেজ), ডিও (বিএসএমএমইউ, ঢাকা), ফেলো ইন এসআইসিএস মাইক্রো সার্জারি ও ফ্যাকো সার্জারি (ইসলামী ব্যাংক চক্ষু হাসপাতাল, ঢাকা) | ডাইরেক্টর ও কনসালটেন্ট, গ্রামীণ চক্ষু হাসপাতাল, ঠাকুরগাঁও | চক্ষু বিশেষজ্ঞ ও ফ্যাকো সার্জন",
    "specialty": "Ophthalmology",
    "districts": [
      "Nilphamari",
      "Domar",
      "ডোমার",
      "Thakurgaon"
    ],
    "clinics": [
      "c-siddhika-domar"
    ],
    "schedule": "প্রতি শুক্রবার বিকাল ৩টা থেকে রাত ৯টা পর্যন্ত।",
    "availableToday": false,
    "rating": 4.8,
    "image": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300",
    "consultationFee": 500
  },
  {
    "id": "dr-rashed-menon-ent",
    "name": "ডাঃ মোঃ রাশেদ মেনন",
    "degree": "এমবিবিএস, বিসিএস, ডিএলও (বিএসএমএমইউ) | বঙ্গবন্ধু শেখ মুজিব মেডিকেল বিশ্ববিদ্যালয় | বিভাগ: নাক, কান, গলা ও হেড-নেক সার্জারি বিভাগ, রংপুর মেডিকেল কলেজ ও হাসপাতাল, রংপুর | নাক, কান, গলা ও হেড-নেক সার্জারি বিশেষজ্ঞ",
    "specialty": "ENT",
    "districts": [
      "Nilphamari",
      "Domar",
      "ডোমার",
      "Rangpur"
    ],
    "clinics": [
      "c-siddhika-domar"
    ],
    "schedule": "প্রতি মঙ্গলবার বিকাল ৪টা থেকে রাত ৮টা পর্যন্ত।",
    "availableToday": false,
    "rating": 4.8,
    "image": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300",
    "consultationFee": 500
  },
  {
    "id": "dr-mithun-chandra-bhowmik",
    "name": "ডাঃ মিথুন চন্দ্র ভৌমিক",
    "degree": "এমবিবিএস, বিসিএস (স্বাস্থ্য), এমডি-ডার্মাটোলজি, সি.সি.টি. (বাংলাদেশ), পিজিটি (চর্ম ও যৌন) | সহকারী অধ্যাপক (ডার্মাটোলজি), দিনাজপুর মেডিকেল কলেজ ও হাসপাতাল, দিনাজপুর | চর্ম, যৌন ও এলার্জি রোগ বিশেষজ্ঞ",
    "specialty": "Dermatology",
    "districts": [
      "Nilphamari",
      "Domar",
      "ডোমার",
      "Dinajpur"
    ],
    "clinics": [
      "c-siddhika-domar"
    ],
    "schedule": "প্রতি বুধবার বিকাল ৪টা থেকে রাত ৮টা পর্যন্ত।",
    "availableToday": false,
    "rating": 4.8,
    "image": "https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=300",
    "consultationFee": 600
  },
  {
    "id": "dr-habibur-rahman-dental",
    "name": "Dr. Md. Habibur Rahman (Dentist) - ডা. মো. হাবিবুর রহমান (হাবীব)",
    "degree": "বি.ডি.এস. (রাজশাহী মেডিকেল কলেজ) | মুখ ও দন্তরোগ বিশেষজ্ঞ ও সার্জন (Dentist & Dental Surgeon) | বি.এম.ডি.সি. রেজি. নং– ৮৫৭৭ | ওরাল সার্জারি, ডেন্টাল ফিলিং ও রুট ক্যানেল চিকিৎসায় অ্যাডভান্স ট্রেনিং প্রাপ্ত",
    "specialty": "Dentistry",
    "districts": [
      "Nilphamari"
    ],
    "clinics": [
      "c-doctors-dental"
    ],
    "schedule": "সকাল: ১০:০০টা - দুপুর ১:০০টা, বিকাল: ৪:০০টা - রাত ৯:০০টা",
    "availableToday": true,
    "rating": 4.9,
    "image": "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=300",
    "consultationFee": 300
  }
];

export const LAB_TESTS: LabTest[] = [
  {
    "id": "ar-path-01",
    "name": "Hb%",
    "price": 200,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "হিমোগ্লোবিন পরীক্ষা"
  },
  {
    "id": "ar-path-02",
    "name": "CBC & ESR",
    "price": 600,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "সম্পূর্ণ রক্ত কণিকা ও ইএসআর পরীক্ষা"
  },
  {
    "id": "ar-path-03",
    "name": "Peripheral Blood Film (PBF)",
    "price": 800,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "পেরিফেরাল ব্লাড ফিল্ম"
  },
  {
    "id": "ar-path-04",
    "name": "Blood Grouping & Rh Factor",
    "price": 100,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "রক্তের গ্রুপ ও আরএইচ ফ্যাক্টর"
  },
  {
    "id": "ar-path-05",
    "name": "Fasting Blood Sugar (FBS)",
    "price": 200,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "খালি পেটে রক্তের শর্করা/ডায়াবেটিস"
  },
  {
    "id": "ar-path-06",
    "name": "FBS / 2Hrs AFB / RBS",
    "price": 200,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "খাবার ২ ঘণ্টা পর ডায়াবেটিস পরীক্ষা"
  },
  {
    "id": "ar-path-07",
    "name": "RBS & CUS",
    "price": 200,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "র্যান্ডম ব্লাড সুগার"
  },
  {
    "id": "ar-path-08",
    "name": "Blood Urea",
    "price": 600,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "ব্লাড ইউরিয়া (কিডনি পরীক্ষা)"
  },
  {
    "id": "ar-path-09",
    "name": "OGTT (including 75gm glucose)",
    "price": 600,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "গ্লুকোজ টলারেন্স টেস্ট"
  },
  {
    "id": "ar-path-10",
    "name": "Serum Creatinine",
    "price": 500,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "সিরাম ক্রিয়েটিনিন (কিডনি ফাকশন)"
  },
  {
    "id": "ar-path-11",
    "name": "Serum Uric Acid",
    "price": 500,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "সিরাম ইউরিক এসিড (বাত ব্যথা)"
  },
  {
    "id": "ar-path-12",
    "name": "Lipid Profile / F.Lipid Profile",
    "price": 1200,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "রক্তের চর্বি/লিপিড প্রোফাইল"
  },
  {
    "id": "ar-path-13",
    "name": "S. Bilirubin Total / Direct / Indirect",
    "price": 500,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "সিরাম বিলিরুবিন (জন্ডিস পরীক্ষা)"
  },
  {
    "id": "ar-path-14",
    "name": "SGOT (AST)",
    "price": 500,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "এসজিওটি (লিভার এনজাইম)"
  },
  {
    "id": "ar-path-15",
    "name": "SGPT (ALT)",
    "price": 500,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "এসজিপিটি (লিভার ফাংশন)"
  },
  {
    "id": "ar-path-16",
    "name": "Serum Albumin",
    "price": 600,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "সিরাম অ্যালবুমিন"
  },
  {
    "id": "ar-path-17",
    "name": "Serum Amylase",
    "price": 1400,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "সিরাম অ্যামাইলেজ (অগ্ন্যাশয়)"
  },
  {
    "id": "ar-path-18",
    "name": "Serum Calcium",
    "price": 800,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "সিরাম ক্যালসিয়াম"
  },
  {
    "id": "ar-path-19",
    "name": "Serum Electrolytes",
    "price": 1200,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "ইলেক্ট্রোলাইটস (সোডিয়াম, পটাশিয়াম)"
  },
  {
    "id": "ar-path-20",
    "name": "HbA1c",
    "price": 1200,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "৩ মাসের গড় ডায়াবেটিস"
  },
  {
    "id": "ar-path-21",
    "name": "RA Test (Quantitative)",
    "price": 800,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "আরএ টেস্ট (বাতের পরীক্ষা)"
  },
  {
    "id": "ar-path-22",
    "name": "VDRL",
    "price": 500,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "ভিডিআরএল স্ক্রিনিং"
  },
  {
    "id": "ar-path-23",
    "name": "Widal Test",
    "price": 500,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "টাইফয়েড জরের উইডাল টেস্ট"
  },
  {
    "id": "ar-path-24",
    "name": "ANA / ANF",
    "price": 1600,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "এএনএ / এএনএফ"
  },
  {
    "id": "ar-path-25",
    "name": "Urine Pregnancy Test",
    "price": 100,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "প্রস্রাবে গর্ভধারণ পরীক্ষা"
  },
  {
    "id": "ar-path-26",
    "name": "HIV (ICT)",
    "price": 500,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "এইচআইভি টেস্ট"
  },
  {
    "id": "ar-path-27",
    "name": "S.IgE",
    "price": 1500,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "এলার্জি পরীক্ষা (Serum IgE)"
  },
  {
    "id": "ar-path-28",
    "name": "Semen Analysis",
    "price": 800,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "বীর্য বিশ্লেষণ পরীক্ষা"
  },
  {
    "id": "ar-path-29",
    "name": "T3, T4, TSH Profile",
    "price": 3000,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "থাইরয়েড প্রোফাইল"
  },
  {
    "id": "ar-path-30",
    "name": "FT3",
    "price": 1200,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "ফ্রি টি-৩ (থাইরয়েড)"
  },
  {
    "id": "ar-path-31",
    "name": "FT4",
    "price": 1200,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "ফ্রি টি-৪ (থাইরয়েড)"
  },
  {
    "id": "ar-path-32",
    "name": "Prolactin",
    "price": 1200,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "সিরাম প্রোল্যাকটিন হরমোন"
  },
  {
    "id": "ar-path-33",
    "name": "Testosterone",
    "price": 1200,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "টেস্টোস্টেরন হরমোন"
  },
  {
    "id": "ar-path-34",
    "name": "Serum Beta HCG",
    "price": 1200,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "বিটা এইচসিজি"
  },
  {
    "id": "ar-path-35",
    "name": "ASO Titre",
    "price": 500,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "এএসও টাইটার (বাতের সংক্রমণ)"
  },
  {
    "id": "ar-path-36",
    "name": "Urine For R/M/E",
    "price": 200,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "ইউরিন সাধারণ পরীক্ষা"
  },
  {
    "id": "ar-path-37",
    "name": "Stool R/S",
    "price": 400,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "মল পরীক্ষা"
  },
  {
    "id": "ar-path-38",
    "name": "Stool OBT",
    "price": 400,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "স্টুল ওবিটি"
  },
  {
    "id": "ar-path-39",
    "name": "HCV (ICT)",
    "price": 500,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "হেপাটাইটিস সি ভাইরাস স্ক্রিনিং"
  },
  {
    "id": "ar-path-40",
    "name": "Malaria ICT (MP)",
    "price": 800,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "ম্যালেরিয়া আইসিটি"
  },
  {
    "id": "ar-path-41",
    "name": "T3",
    "price": 1000,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "থাইরয়েড টি-৩"
  },
  {
    "id": "ar-path-42",
    "name": "T4",
    "price": 1000,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "থাইরয়েড টি-৪"
  },
  {
    "id": "ar-path-43",
    "name": "TSH",
    "price": 1000,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "থাইরয়েড টিএসএইচ"
  },
  {
    "id": "ar-path-44",
    "name": "CRP ICT / Latex",
    "price": 800,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "সি-রিয়েক্টিভ প্রোটিন"
  },
  {
    "id": "ar-path-45",
    "name": "HBsAg (ICT)",
    "price": 500,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "হেপাটাইটিস বি স্ক্রিনিং"
  },
  {
    "id": "ar-path-46",
    "name": "Troponin-I",
    "price": 1200,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "ট্রোপোনিন-আই (হার্ট অ্যাটাক)"
  },
  {
    "id": "ar-path-47",
    "name": "BT, CT",
    "price": 400,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "ব্লিডিং টাইম ও ক্লটিং টাইম"
  },
  {
    "id": "ar-path-48",
    "name": "HB% Electrophoresis",
    "price": 2000,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "থ্যালাসেমিয়া ও হিমোগ্লোবিন ইলেক্ট্রোফোরসিস"
  },
  {
    "id": "ar-path-49",
    "name": "S. Iron",
    "price": 1200,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "সিরাম আয়রন"
  },
  {
    "id": "ar-path-50",
    "name": "Vitamin D",
    "price": 3000,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "ভিটামিন ডি পরীক্ষা"
  },
  {
    "id": "ar-path-51",
    "name": "Vitamin B-12",
    "price": 3000,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "ভিটামিন বি-১২ পরীক্ষা"
  },
  {
    "id": "ar-path-52",
    "name": "Vitamin D-3 Level",
    "price": 3000,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "ভিটামিন ডি-৩ লেভেল"
  },
  {
    "id": "ar-path-53",
    "name": "Hematocrit",
    "price": 500,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "হেমাটোক্রিট"
  },
  {
    "id": "ar-path-54",
    "name": "TB Test",
    "price": 600,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "যক্ষ্মা/টিবি পরীক্ষা"
  },
  {
    "id": "ar-path-55",
    "name": "Iron Profile",
    "price": 3000,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "আয়রন প্রোফাইল"
  },
  {
    "id": "ar-path-56",
    "name": "Urine Albumin",
    "price": 200,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "ইউরিন অ্যালবুমিন"
  },
  {
    "id": "ar-path-57",
    "name": "Filaria ICT",
    "price": 800,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "ফাইলেরিয়া পরীক্ষা"
  },
  {
    "id": "ar-path-58",
    "name": "Dengue-NS1",
    "price": 500,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "ডেঙ্গু এনএস১ এন্টিজেন"
  },
  {
    "id": "ar-path-59",
    "name": "Dengue-IgG, IgM",
    "price": 500,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "ডেঙ্গু আইজিজি ও আইজিএম"
  },
  {
    "id": "ar-path-60",
    "name": "S. Cholesterol",
    "price": 300,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "সিরাম কোলেস্টেরল"
  },
  {
    "id": "ar-path-61",
    "name": "Serum TG",
    "price": 300,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "সিরাম ট্রাইগ্লিসারাইড"
  },
  {
    "id": "ar-path-62",
    "name": "Serum HDL",
    "price": 300,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "সিরাম এইচডিএল"
  },
  {
    "id": "ar-path-63",
    "name": "Urine for C/S",
    "price": 1400,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "ইউরিন কালচার ও সেনসিটিভিটি"
  },
  {
    "id": "ar-path-64",
    "name": "Pus for C/S",
    "price": 1400,
    "category": "Pathology",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "পুঁজ কালচার ও সেনসিটিভিটি"
  },
  {
    "id": "ar-usg-01",
    "name": "USG of Whole Abdomen",
    "price": 750,
    "category": "Ultrasonogram",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "পেটের আলট্রাসনোগ্রাম (হোল অ্যাবডোমেন)"
  },
  {
    "id": "ar-usg-02",
    "name": "USG of Upper Abdomen",
    "price": 750,
    "category": "Ultrasonogram",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "উচ্চ পেটের আলট্রাসনোগ্রাম"
  },
  {
    "id": "ar-usg-03",
    "name": "USG of Lower Abdomen",
    "price": 750,
    "category": "Ultrasonogram",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "নিম্ন পেটের আলট্রাসনোগ্রাম"
  },
  {
    "id": "ar-usg-04",
    "name": "USG of KUB / HBS",
    "price": 750,
    "category": "Ultrasonogram",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "কেইউবি / এইচবিএস আলট্রাসনোগ্রাম"
  },
  {
    "id": "ar-usg-05",
    "name": "USG of Pregnancy Profile",
    "price": 750,
    "category": "Ultrasonogram",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "গর্ভবতী মায়েদের আলট্রাসনোগ্রাম"
  },
  {
    "id": "ar-usg-06",
    "name": "USG of Pelvic Organ",
    "price": 750,
    "category": "Ultrasonogram",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "পেলভিক অর্গান আলট্রাসনোগ্রাম"
  },
  {
    "id": "ar-usg-07",
    "name": "USG of Both Breast",
    "price": 1500,
    "category": "Ultrasonogram",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "উভয় স্তনের আলট্রাসনোগ্রাম"
  },
  {
    "id": "ar-usg-08",
    "name": "USG of Both Testis",
    "price": 1500,
    "category": "Ultrasonogram",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "উভয় অণ্ডকোষের আলট্রাসনোগ্রাম"
  },
  {
    "id": "ar-usg-09",
    "name": "USG of TVS",
    "price": 1500,
    "category": "Ultrasonogram",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "ট্রান্সভ্যাজাইনাল সোনোগ্রাফি (TVS)"
  },
  {
    "id": "ar-usg-10",
    "name": "USG of Whole Abdomen With MCC + PVR",
    "price": 1500,
    "category": "Ultrasonogram",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "এমসিসি ও পিভিআর সহ পেটের আলট্রাসনোগ্রাম"
  },
  {
    "id": "ar-usg-11",
    "name": "USG Neck",
    "price": 1500,
    "category": "Ultrasonogram",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "গলার/নেকের আলট্রাসনোগ্রাম"
  },
  {
    "id": "ar-usg-12",
    "name": "USG of Whole Abdomen with PVR",
    "price": 1500,
    "category": "Ultrasonogram",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "পিভিআর সহ সম্পূর্ণ পেটের আলট্রাসনোগ্রাম"
  },
  {
    "id": "ar-xray-01",
    "name": "Digital X-Ray PNS O/M View",
    "price": 600,
    "category": "X-Ray",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "ডিজিটাল এক্স-রে পিএনএস"
  },
  {
    "id": "ar-xray-02",
    "name": "Digital X-Ray Skull B/V",
    "price": 900,
    "category": "X-Ray",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "মাথার খুলির ডিজিটাল এক্স-রে"
  },
  {
    "id": "ar-xray-03",
    "name": "Digital X-Ray Chest Left/Right View",
    "price": 600,
    "category": "X-Ray",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "বুকের ডিজিটাল এক্স-রে"
  },
  {
    "id": "ar-xray-04",
    "name": "Digital X-Ray Chest P/A View With Oblique",
    "price": 600,
    "category": "X-Ray",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "বুকের ডিজিটাল এক্স-রে (অব্লিক ভিউ সহ)"
  },
  {
    "id": "ar-xray-05",
    "name": "Digital X-Ray KUB",
    "price": 600,
    "category": "X-Ray",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "কেইউবি ডিজিটাল এক্স-রে"
  },
  {
    "id": "ar-xray-06",
    "name": "Digital X-Ray Cervical Spine (B/V)",
    "price": 900,
    "category": "X-Ray",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "গলার মেরুদণ্ডের ডিজিটাল এক্স-রে"
  },
  {
    "id": "ar-xray-07",
    "name": "Digital X-Ray Dorso Lumbar Spine (B/V)",
    "price": 900,
    "category": "X-Ray",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "পিঠের মেরুদণ্ডের ডিজিটাল এক্স-রে"
  },
  {
    "id": "ar-xray-08",
    "name": "Digital X-Ray L/S Spine (B/V)",
    "price": 900,
    "category": "X-Ray",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "কোমরের মেরুদণ্ডের ডিজিটাল এক্স-রে (L/S Spine)"
  },
  {
    "id": "ar-xray-09",
    "name": "Digital X-Ray Pelvis with Both Hip Joint (V/P)",
    "price": 600,
    "category": "X-Ray",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "পেলভিস ও নিতম্বের জয়েন্টের এক্স-রে"
  },
  {
    "id": "ar-xray-10",
    "name": "Digital X-Ray Pelvis (A/P) view",
    "price": 600,
    "category": "X-Ray",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "পেলভিস এ/পি ভিউ এক্স-রে"
  },
  {
    "id": "ar-xray-11",
    "name": "Digital X-Ray Leg B/V",
    "price": 600,
    "category": "X-Ray",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "পায়ের ডিজিটাল এক্স-রে"
  },
  {
    "id": "ar-xray-12",
    "name": "Digital X-Ray Thigh Hip B/V",
    "price": 900,
    "category": "X-Ray",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "ঊরু ও হিপ জয়েন্টের ডিজিটাল এক্স-রে"
  },
  {
    "id": "ar-xray-13",
    "name": "Digital X-Ray Ankle Joint B/V",
    "price": 600,
    "category": "X-Ray",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "গোড়ালির জয়েন্টের ডিজিটাল এক্স-রে"
  },
  {
    "id": "ar-xray-14",
    "name": "Digital X-Ray Wrist (B/V)",
    "price": 600,
    "category": "X-Ray",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "কব্জির ডিজিটাল এক্স-রে"
  },
  {
    "id": "ar-xray-15",
    "name": "Digital X-Ray Elbow Joint (B/V)",
    "price": 600,
    "category": "X-Ray",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "কনুইয়ের জয়েন্টের ডিজিটাল এক্স-রে"
  },
  {
    "id": "ar-xray-16",
    "name": "Digital X-Ray Shoulder Joint Right (B/V)",
    "price": 900,
    "category": "X-Ray",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "কাঁধের জয়েন্টের ডিজিটাল এক্স-রে"
  },
  {
    "id": "ar-xray-17",
    "name": "Digital X-Ray Hand (B/V)",
    "price": 600,
    "category": "X-Ray",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "হাতের তালু/আঙুলের এক্স-রে"
  },
  {
    "id": "ar-xray-18",
    "name": "Digital X-Ray HIP Joint (B/V)",
    "price": 900,
    "category": "X-Ray",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "হিপ জয়েন্টের এক্স-রে"
  },
  {
    "id": "ar-xray-19",
    "name": "Digital X-Ray Foot (B/V)",
    "price": 600,
    "category": "X-Ray",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "পায়ের পাতার এক্স-রে"
  },
  {
    "id": "ar-xray-20",
    "name": "Digital X-Ray Arm (B/V)",
    "price": 600,
    "category": "X-Ray",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "বাহুর এক্স-রে"
  },
  {
    "id": "ar-xray-21",
    "name": "Digital X-Ray Neck (B/V)",
    "price": 600,
    "category": "X-Ray",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "গলার এক্স-রে"
  },
  {
    "id": "ar-xray-22",
    "name": "Digital X-Ray Neck Lateral View",
    "price": 900,
    "category": "X-Ray",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "গলার ল্যাটারাল ভিউ এক্স-রে"
  },
  {
    "id": "ar-xray-23",
    "name": "Digital X-Ray Ba-meal Stomach",
    "price": 1800,
    "category": "X-Ray",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "বেরিয়াম মিল পাকস্থলী এক্স-রে"
  },
  {
    "id": "ar-xray-24",
    "name": "Digital X-Ray Knee Joint (B/V)",
    "price": 600,
    "category": "X-Ray",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "হাঁটুর জয়েন্টের ডিজিটাল এক্স-রে"
  },
  {
    "id": "ar-xray-25",
    "name": "Digital X-Ray Both Knee joint (B/V)",
    "price": 1200,
    "category": "X-Ray",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "উভয় হাঁটুর ডিজিটাল এক্স-রে"
  },
  {
    "id": "ar-xray-26",
    "name": "Digital X-Ray Mastoid / T.V",
    "price": 600,
    "category": "X-Ray",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "ম্যাস্টয়েড এক্স-রে"
  },
  {
    "id": "ar-xray-27",
    "name": "Digital X-Ray Dental (Each Film)",
    "price": 150,
    "category": "X-Ray",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "দাঁতের ডিজিটাল এক্স-রে"
  },
  {
    "id": "ar-ecg-01",
    "name": "ECG (12 Channel)",
    "price": 400,
    "category": "ECG & Echo",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "১২ চ্যানেল ডিজিটাল ইসিজি"
  },
  {
    "id": "ar-ecg-02",
    "name": "ECG (6 Channel)",
    "price": 300,
    "category": "ECG & Echo",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "৬ চ্যানেল ইসিজি"
  },
  {
    "id": "ar-echo-01",
    "name": "Echocardiogram (2D) Colour Doppler",
    "price": 1800,
    "category": "ECG & Echo",
    "hospital_name": "এ.আর জেনারেল হসপিটাল",
    "description": "টু-ডি কালার ডপলার ইকোকার্ডিওগ্রাম"
  }
];
