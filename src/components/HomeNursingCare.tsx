import React, { useState } from 'react';
import { 
  HeartPulse, 
  Syringe, 
  Droplets, 
  TestTube, 
  MapPin, 
  Phone, 
  Clock, 
  CheckCircle2, 
  Truck, 
  Plus, 
  ShieldCheck,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

interface NursingService {
  id: string;
  title: string;
  price: number;
  priceText: string;
  transportText: string;
  icon: string;
  description: string;
  badge: string;
  benefits: string[];
}

export const NURSING_SERVICES: NursingService[] = [
  {
    id: 'nurse-catheter',
    title: 'বাসায় গিয়ে ক্যাথেটার লাগানো',
    price: 500,
    priceText: '৳৫০০',
    transportText: '+ ট্রান্সপোর্ট বিল (দূরত্ব অনুযায়ী)',
    icon: '🩹',
    description: 'দক্ষ ও অভিজ্ঞ ডিপ্লোমা নার্স দ্বারা বাসায় নিরাপদে ক্যাথেটার পরানো ও স্টেরিলাইজড সেটিং।',
    badge: 'হাইজেনিক ও সুরক্ষিত',
    benefits: ['১০০% জীবাণুমুক্ত ব্যবস্থা', 'অভিজ্ঞ পুরুষ/মহিলা নার্স', 'জরুরী কল সাপোর্ট']
  },
  {
    id: 'nurse-saline',
    title: 'বাসায় গিয়ে স্যালাইন লাগানো',
    price: 200,
    priceText: '৳২০০',
    transportText: '+ ট্রান্সপোর্ট বিল (দূরত্ব অনুযায়ী)',
    icon: '💧',
    description: 'ডিহাইড্রেশন, দুর্বলতা বা ডাক্তারের পরামর্শে বাসায় গিয়ে ইনফিউশন ও স্যালাইন পুশ সেবা।',
    badge: 'ইনস্ট্যান্ট নার্স',
    benefits: ['স্যালাইন ড্রপ মনিটরিং', 'ক্যানুলা পরা নিশ্চিতকরণ', 'রোগীর সার্বিক ভল্টেজ চেক']
  },
  {
    id: 'nurse-blood-sample',
    title: 'বাসায় গিয়ে রক্ত নেওয়া (পরীক্ষার জন্য)',
    price: 200,
    priceText: '৳২০০',
    transportText: '+ ট্রান্সপোর্ট বিল (দূরত্ব অনুযায়ী)',
    icon: '🧪',
    description: 'যেকোনো ল্যাব পরীক্ষার জন্য অভিজ্ঞ টেকনিশিয়ান/নার্স দ্বারা ব্যথাহীন রক্ত সংগ্রহ।',
    badge: 'ল্যাব স্যাম্পলিং',
    benefits: ['ব্যথামুক্ত ভেইন কালেকশন', 'আইস-বক্স স্টোরেজ ট্রান্সপোর্ট', 'ডিজিটাল রিপোর্ট হোম ডেলিভারি']
  }
];

interface HomeNursingCareProps {
  hotline: string;
  cart: { id: string; name: string; price: number; type: string }[];
  onAddToCart: (item: { id: string; name: string; price: number; type: 'emergency'; details?: string }) => void;
  onDirectCheckout?: (item: { id: string; name: string; price: number; type: 'emergency'; details?: string }) => void;
}

export const HomeNursingCare: React.FC<HomeNursingCareProps> = ({
  hotline,
  cart,
  onAddToCart,
  onDirectCheckout
}) => {
  const [selectedService, setSelectedService] = useState<NursingService | null>(null);
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [address, setAddress] = useState('');
  const [distanceKm, setDistanceKm] = useState<number>(3);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Calculate estimated transport cost based on distance
  const getTransportEst = (km: number) => {
    if (km <= 3) return 50;
    if (km <= 7) return 100;
    if (km <= 15) return 200;
    return 300;
  };

  const currentTransportFee = getTransportEst(distanceKm);

  const handleOpenBooking = (service: NursingService) => {
    setSelectedService(service);
    setBookingSuccess(false);
  };

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;
    if (!patientPhone.trim()) {
      alert('অনুগ্রহ করে মোবাইল নম্বর প্রদান করুন');
      return;
    }

    const totalServicePrice = selectedService.price + currentTransportFee;
    const details = `রোগী: ${patientName || 'N/A'}, ঠিকানা: ${address || 'N/A'}, দূরত্ব: ~${distanceKm} কিমি (ট্রান্সপোর্ট: ৳${currentTransportFee}), ফোন: ${patientPhone}`;

    onAddToCart({
      id: `${selectedService.id}-${Date.now()}`,
      name: `জরুরী নার্সিং: ${selectedService.title}`,
      price: totalServicePrice,
      type: 'emergency',
      details
    });

    setBookingSuccess(true);
    setTimeout(() => {
      setSelectedService(null);
      setBookingSuccess(false);
      if (onDirectCheckout) {
        onDirectCheckout({
          id: `${selectedService.id}-${Date.now()}`,
          name: `জরুরী নার্সিং: ${selectedService.title}`,
          price: totalServicePrice,
          type: 'emergency',
          details
        });
      }
    }, 1200);
  };

  return (
    <div className="space-y-5 my-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-900 text-white p-5 rounded-3xl shadow-lg border border-emerald-600/30">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 bg-white/15 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md">
            <HeartPulse size={13} className="text-emerald-300 animate-pulse" />
            হোম হেলথ সার্ভিস
          </div>
          <h3 className="text-xl sm:text-2xl font-black tracking-tight">
            জরুরী নার্সিং কেয়ার (Home Nursing Care)
          </h3>
          <p className="text-xs text-emerald-100 font-medium max-w-xl">
            অভিজ্ঞ ও প্রশিক্ষণপ্রাপ্ত নার্স সরাসরি আপনার বাসায় গিয়ে চিকিৎসা সেবা প্রদান করবে।
          </p>
        </div>

        <a
          href={`tel:${hotline}`}
          className="bg-white text-emerald-800 hover:bg-emerald-50 font-black px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2 shadow-md active:scale-95 transition-all shrink-0"
        >
          <Phone size={14} className="animate-bounce text-emerald-700" />
          নার্সিং হেল্পলাইন ({hotline})
        </a>
      </div>

      {/* 3 Services Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {NURSING_SERVICES.map((service) => {
          const isAdded = cart.some(i => i.name.includes(service.title));
          return (
            <div
              key={service.id}
              className="bg-white rounded-3xl border-2 border-slate-100 hover:border-emerald-500/50 p-5 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {service.badge}
                  </span>
                  <span className="text-2xl">{service.icon}</span>
                </div>

                <div>
                  <h4 className="text-base font-black text-slate-800 group-hover:text-emerald-700 transition-colors">
                    {service.title}
                  </h4>
                  <p className="text-xs font-bold text-slate-500 mt-1 leading-relaxed">
                    {service.description}
                  </p>
                </div>

                {/* Price Display */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-0.5">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-black text-emerald-700">{service.priceText}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">সার্ভিস ফি</span>
                  </div>
                  <div className="text-[10px] font-bold text-rose-600 flex items-center gap-1">
                    <Truck size={12} /> {service.transportText}
                  </div>
                </div>

                {/* Bullet Points */}
                <ul className="space-y-1 pt-1">
                  {service.benefits.map((b, idx) => (
                    <li key={idx} className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                <button
                  onClick={() => handleOpenBooking(service)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1 shadow-md active:scale-95 transition-all"
                >
                  <Plus size={14} /> বাসায় বুকিং করুন
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Booking Form Modal */}
      {selectedService && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-5 relative">
            <button
              onClick={() => setSelectedService(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center hover:bg-slate-200"
            >
              ✕
            </button>

            <div>
              <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-2">
                <span>{selectedService.icon}</span> হোম নার্সিং সার্ভিস রিকোয়েস্ট
              </div>
              <h3 className="text-lg font-black text-slate-800">
                {selectedService.title}
              </h3>
              <p className="text-xs font-bold text-slate-500 mt-0.5">
                সার্ভিস ফি: <span className="text-emerald-700 font-black">৳{selectedService.price} BDT</span>
              </p>
            </div>

            {bookingSuccess ? (
              <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl text-center space-y-2">
                <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto text-xl">
                  ✓
                </div>
                <h4 className="text-sm font-black text-emerald-900">নার্সিং রিকোয়েস্ট গ্রহন করা হয়েছে!</h4>
                <p className="text-xs text-emerald-700">
                  আমাদের প্রস্তুতকৃত নার্স অনতিবিলম্বে আপনার ফোনে কল দিয়ে বাসার লোকেশন কনফার্ম করবেন।
                </p>
              </div>
            ) : (
              <form onSubmit={handleConfirmBooking} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    রোগীর নাম
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: মোছাঃ সালমা বেগম"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    মোবাইল নম্বর (জরুরী যোগাযোগের জন্য) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="যেমন: 01712345678"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    বাসার সম্পূর্ণ ঠিকানা
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="যেমন: কাজীরহাট বাজার সংলগ্ন, ৩ নং ওয়ার্ড, নীলফামারী সদর..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Distance / Transport Bill Selector */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1">
                      <Truck size={14} className="text-emerald-600" /> দূরত্ব অনুযায়ী আনুমানিক ট্রান্সপোর্ট বিল:
                    </span>
                    <span className="text-emerald-700 font-black bg-white px-2.5 py-0.5 rounded-lg border border-slate-200">
                      + ৳{currentTransportFee}
                    </span>
                  </div>

                  <input
                    type="range"
                    min={1}
                    max={20}
                    value={distanceKm}
                    onChange={(e) => setDistanceKm(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />

                  <div className="flex justify-between text-[9px] font-bold text-slate-400">
                    <span>১-৩ কিমি (৳৫০)</span>
                    <span>৪-৭ কিমি (৳১০০)</span>
                    <span>৮-১৫ কিমি (৳২০০)</span>
                    <span>১৬+ কিমি (৳৩০০)</span>
                  </div>
                </div>

                {/* Total Fee breakdown */}
                <div className="bg-emerald-900 text-white p-3.5 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-emerald-200 font-bold uppercase">মোট আনুমানিক ফি</div>
                    <div className="text-lg font-black text-yellow-300">
                      ৳{(selectedService.price + currentTransportFee).toLocaleString()} BDT
                    </div>
                  </div>
                  <div className="text-[10px] text-emerald-200 text-right font-medium">
                    সার্ভিস ৳{selectedService.price} + গাড়ি ভাড়া ৳{currentTransportFee}
                  </div>
                </div>

                <div className="pt-1 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedService(null)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-xs"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-xl text-xs uppercase shadow-lg active:scale-95 transition-all"
                  >
                    কনফার্ম করুন
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
