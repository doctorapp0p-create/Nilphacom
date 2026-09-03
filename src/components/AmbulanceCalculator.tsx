import React, { useState } from 'react';
import { 
  Ambulance, 
  Phone, 
  Navigation, 
  MapPin, 
  CheckCircle2, 
  Sparkles, 
  Clock, 
  ShieldCheck, 
  AlertCircle,
  ChevronRight,
  Send,
  Zap,
  ArrowRightLeft
} from 'lucide-react';
const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className = '', onClick }) => (
  <div onClick={onClick} className={`bg-white rounded-xl shadow-sm border border-slate-100 ${className}`}>
    {children}
  </div>
);

interface AmbulanceCalculatorProps {
  hotline: string;
  onAddToCart?: (item: { id: string; name: string; price: number; type: 'emergency'; details?: string }) => void;
  onDirectCheckout?: (item: { id: string; name: string; price: number; type: 'emergency'; details?: string }) => void;
}

// Distance tiers
export const DISTANCE_TIERS = [
  { min: 0, max: 5, price: 600, label: '০ থেকে ৫ কিলোমিটার', badge: 'শহরের ভেতরে' },
  { min: 6, max: 10, price: 1000, label: '৬ থেকে ১০ কিলোমিটার', badge: 'নিকটবর্তী উপজেলা' },
  { min: 11, max: 20, price: 1600, label: '১১ থেকে ২০ কিলোমিটার', badge: 'মধ্যম দূরত্ব' },
  { min: 21, max: 30, price: 2000, label: '২১ থেকে ৩০ কিলোমিটার', badge: 'দীর্ঘ দূরত্ব' },
];

// Fixed popular routes
export interface PopularRoute {
  id: string;
  from: string;
  to: string;
  price: number;
  category: 'nilphamari' | 'rangpur';
  categoryLabel: string;
  timeEst: string;
  badgeColor: string;
}

export const POPULAR_ROUTES: PopularRoute[] = [
  // Nilphamari Hub Routes (৳ 2,000)
  {
    id: 'route-domar-nilphamari',
    from: 'ডোমার',
    to: 'নীলফামারী',
    price: 2000,
    category: 'nilphamari',
    categoryLabel: 'নীলফামারী রুট',
    timeEst: '২৫-৩৫ মিনিট',
    badgeColor: 'bg-emerald-500/10 text-emerald-700 border-emerald-300'
  },
  {
    id: 'route-jaldhaka-nilphamari',
    from: 'জলঢাকা',
    to: 'নীলফামারী',
    price: 2000,
    category: 'nilphamari',
    categoryLabel: 'নীলফামারী রুট',
    timeEst: '২০-৩০ মিনিট',
    badgeColor: 'bg-emerald-500/10 text-emerald-700 border-emerald-300'
  },
  {
    id: 'route-debiganj-nilphamari',
    from: 'দেবীগঞ্জ',
    to: 'নীলফামারী',
    price: 2000,
    category: 'nilphamari',
    categoryLabel: 'নীলফামারী রুট',
    timeEst: '৩৫-৪৫ মিনিট',
    badgeColor: 'bg-emerald-500/10 text-emerald-700 border-emerald-300'
  },

  // Rangpur Hub Routes (৳ 3,000)
  {
    id: 'route-domar-rangpur',
    from: 'ডোমার',
    to: 'রংপুর',
    price: 3000,
    category: 'rangpur',
    categoryLabel: 'রংপুর রুট',
    timeEst: '৫৫-৭০ মিনিট',
    badgeColor: 'bg-rose-500/10 text-rose-700 border-rose-300'
  },
  {
    id: 'route-nilphamari-rangpur',
    from: 'নীলফামারী',
    to: 'রংপুর',
    price: 3000,
    category: 'rangpur',
    categoryLabel: 'রংপুর রুট',
    timeEst: '৪৫-৬০ মিনিট',
    badgeColor: 'bg-rose-500/10 text-rose-700 border-rose-300'
  },
  {
    id: 'route-debiganj-rangpur',
    from: 'দেবীগঞ্জ',
    to: 'রংপুর',
    price: 3000,
    category: 'rangpur',
    categoryLabel: 'রংপুর রুট',
    timeEst: '৬০-৭৫ মিনিট',
    badgeColor: 'bg-rose-500/10 text-rose-700 border-rose-300'
  },
  {
    id: 'route-jaldhaka-rangpur',
    from: 'জলঢাকা',
    to: 'রংপুর',
    price: 3000,
    category: 'rangpur',
    categoryLabel: 'রংপুর রুট',
    timeEst: '৫০-৬৫ মিনিট',
    badgeColor: 'bg-rose-500/10 text-rose-700 border-rose-300'
  }
];

export const AmbulanceCalculator: React.FC<AmbulanceCalculatorProps> = ({
  hotline,
  onAddToCart,
  onDirectCheckout
}) => {
  const [activeTab, setActiveTab] = useState<'fixed' | 'calculator'>('fixed');
  const [routeFilter, setRouteFilter] = useState<'all' | 'nilphamari' | 'rangpur'>('all');
  
  // Custom calculator state
  const [pickupLocation, setPickupLocation] = useState<string>('ডোমার');
  const [destinationLocation, setDestinationLocation] = useState<string>('নীলফামারী');
  const [distanceKm, setDistanceKm] = useState<number>(12);
  const [vehicleType, setVehicleType] = useState<'standard' | 'ac' | 'icu'>('standard');
  const [patientNote, setPatientNote] = useState<string>('');
  
  // Booking Modal State
  const [showBookingModal, setShowBookingModal] = useState<boolean>(false);
  const [selectedRouteTitle, setSelectedRouteTitle] = useState<string>('');
  const [selectedRoutePrice, setSelectedRoutePrice] = useState<number>(0);
  const [patientName, setPatientName] = useState<string>('');
  const [patientPhone, setPatientPhone] = useState<string>('');
  const [exactAddress, setExactAddress] = useState<string>('');
  const [bookingSuccess, setBookingSuccess] = useState<boolean>(false);

  // Check if current pickup & destination match any fixed popular route
  const matchedFixedRoute = POPULAR_ROUTES.find(
    r => (r.from === pickupLocation && r.to === destinationLocation) ||
         (r.from === destinationLocation && r.to === pickupLocation)
  );

  // Calculate price dynamically
  const calculateFare = () => {
    let basePrice = 600;
    
    if (matchedFixedRoute) {
      basePrice = matchedFixedRoute.price;
    } else {
      if (distanceKm <= 5) basePrice = 600;
      else if (distanceKm <= 10) basePrice = 1000;
      else if (distanceKm <= 20) basePrice = 1600;
      else basePrice = 2000;
    }

    // Additional charge for vehicle type
    let extraCharge = 0;
    if (vehicleType === 'ac') extraCharge = 300;
    if (vehicleType === 'icu') extraCharge = 1500;

    return basePrice + extraCharge;
  };

  const currentCalculatedFare = calculateFare();

  const handleOpenBooking = (title: string, price: number) => {
    setSelectedRouteTitle(title);
    setSelectedRoutePrice(price);
    setBookingSuccess(false);
    setShowBookingModal(true);
  };

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientPhone.trim()) {
      alert('অনুগ্রহ করে মোবাইল নম্বর প্রদান করুন');
      return;
    }

    const itemDetails = `রোগী: ${patientName || 'N/A'}, রুট: ${selectedRouteTitle}, ঠিকানা: ${exactAddress || 'N/A'}, মোবাইল: ${patientPhone}`;
    
    if (onAddToCart) {
      onAddToCart({
        id: `amb-${Date.now()}`,
        name: `অ্যাম্বুলেন্স - ${selectedRouteTitle}`,
        price: selectedRoutePrice,
        type: 'emergency',
        details: itemDetails
      });
    }

    setBookingSuccess(true);
    setTimeout(() => {
      setShowBookingModal(false);
      setBookingSuccess(false);
      if (onDirectCheckout) {
        onDirectCheckout({
          id: `amb-${Date.now()}`,
          name: `অ্যাম্বুলেন্স - ${selectedRouteTitle}`,
          price: selectedRoutePrice,
          type: 'emergency',
          details: itemDetails
        });
      }
    }, 1200);
  };

  const filteredRoutes = POPULAR_ROUTES.filter(r => {
    if (routeFilter === 'all') return true;
    return r.category === routeFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Hotline Bar */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-600 via-rose-600 to-red-800 text-white p-6 shadow-2xl border border-red-500/30">
        <div className="absolute -right-8 -bottom-8 text-white/10 pointer-events-none">
          <Ambulance size={180} />
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20">
              <span className="w-2.5 h-2.5 rounded-full bg-red-300 animate-ping" />
              ২৪/৭ জরুরী অ্যাম্বুলেন্স সেবা
            </div>
            <span className="text-[11px] font-bold bg-black/20 backdrop-blur-sm px-3 py-1 rounded-full text-red-100 flex items-center gap-1">
              <Zap size={12} className="text-yellow-300" /> দ্রুততম সময়ে পৌঁছানোর নিশ্চয়তা
            </span>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              জরুরী অ্যাম্বুলেন্স সার্ভিস ও ভাড়া নির্দেশিকা
            </h2>
            <p className="text-xs sm:text-sm font-medium text-red-100 mt-1 max-w-xl leading-relaxed">
              দূরত্ব অনুযায়ী অথবা নির্দিষ্ট রুটের জন্য পানির মতো সহজ ভাড়ার হিসাব। যেকোনো জরুরী অবস্থায় সরাসরি কল করুন অথবা অনলাইন বুকিং করুন।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a 
              href={`tel:${hotline}`}
              className="bg-white text-red-600 hover:bg-red-50 font-black px-6 py-3 rounded-2xl text-xs uppercase tracking-wider flex items-center gap-2.5 shadow-xl active:scale-95 transition-all"
            >
              <Phone size={16} className="animate-bounce text-red-600" />
              জরুরী হটলাইন ({hotline})
            </a>

            <button
              onClick={() => setActiveTab('calculator')}
              className="bg-red-900/50 hover:bg-red-950/70 border border-white/30 text-white font-bold px-5 py-3 rounded-2xl text-xs flex items-center gap-2 backdrop-blur-md active:scale-95 transition-all"
            >
              <Navigation size={16} className="text-yellow-300" />
              ভাড়া ক্যালকুলেটর ব্যবহার করুন
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200">
        <button
          onClick={() => setActiveTab('fixed')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
            activeTab === 'fixed'
              ? 'bg-white text-red-600 shadow-md'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <MapPin size={15} />
          জনপ্রিয় নির্দিষ্ট রুটসমূহ (Fixed Rates)
        </button>

        <button
          onClick={() => setActiveTab('calculator')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
            activeTab === 'calculator'
              ? 'bg-white text-red-600 shadow-md'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles size={15} className="text-amber-500" />
          ডাইনামিক ভাড়া ক্যালকুলেটর (Dynamic Calculator)
        </button>
      </div>

      {/* TAB 1: FIXED POPULAR ROUTES */}
      {activeTab === 'fixed' && (
        <div className="space-y-5">
          {/* Category Filter Chips */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="text-xs font-bold text-slate-700">রুট ফিল্টার করুন:</div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setRouteFilter('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                  routeFilter === 'all'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                সব রুট (৭টি)
              </button>
              <button
                onClick={() => setRouteFilter('nilphamari')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                  routeFilter === 'nilphamari'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                নীলফামারী রুটসমূহ (৳২,০০০)
              </button>
              <button
                onClick={() => setRouteFilter('rangpur')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                  routeFilter === 'rangpur'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                }`}
              >
                রংপুর রুটসমূহ (৳৩,০০০)
              </button>
            </div>
          </div>

          {/* Popular Routes Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRoutes.map((route) => (
              <div
                key={route.id}
                className="group relative bg-white rounded-2xl border-2 border-slate-100 hover:border-red-500/50 p-5 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Category Header */}
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border ${route.badgeColor}`}>
                      {route.categoryLabel}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                      <Clock size={12} /> সময়: ~{route.timeEst}
                    </span>
                  </div>

                  {/* Route Visualizer */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                        <MapPin size={16} />
                      </div>
                      <div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase">পিকআপ</div>
                        <div className="text-sm font-black text-slate-800">{route.from}</div>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col items-center px-2">
                      <div className="w-full flex items-center gap-1 text-slate-300">
                        <div className="h-0.5 flex-1 bg-slate-200"></div>
                        <Ambulance size={16} className="text-red-500 animate-pulse" />
                        <div className="h-0.5 flex-1 bg-slate-200"></div>
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 mt-0.5">ডাইরেক্ট রুট</span>
                    </div>

                    <div className="flex items-center gap-2 text-right">
                      <div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase">গন্তব্য</div>
                        <div className="text-sm font-black text-slate-800">{route.to}</div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={16} />
                      </div>
                    </div>
                  </div>

                  {/* Features checklist */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 font-medium pt-1">
                    <span className="flex items-center gap-1 text-emerald-600 font-bold">
                      <CheckCircle2 size={12} /> ২৪/৭ অক্সিজেন সাপোর্ট
                    </span>
                    <span className="flex items-center gap-1 text-slate-600">
                      <ShieldCheck size={12} /> দ্রুততম অ্যাম্বুলেন্স টিম
                    </span>
                  </div>
                </div>

                {/* Price and Action Bar */}
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">নির্ধারিত ভাড়া</div>
                    <div className="text-xl font-black text-red-600">
                      ৳{route.price.toLocaleString()} <span className="text-xs font-bold text-slate-500">BDT</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${hotline}`}
                      className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl active:scale-95 transition-all"
                      title="সরাসরি কল করুন"
                    >
                      <Phone size={16} />
                    </a>
                    <button
                      onClick={() => handleOpenBooking(`${route.from} টু ${route.to}`, route.price)}
                      className="bg-red-600 hover:bg-red-700 text-white font-black px-4 py-2.5 rounded-xl text-xs uppercase tracking-tight shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center gap-1.5"
                    >
                      বুকিং করুন <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Distance Rates Chart Box */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-6 rounded-3xl space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                <h3 className="text-sm font-black tracking-wide">
                  দূরত্ব ভিত্তিক স্ট্যান্ডার্ড ভাড়া তালিকা (Distance Based Rate Chart)
                </h3>
              </div>
              <span className="text-[10px] font-bold bg-white/10 px-2.5 py-1 rounded-full text-slate-300">
                স্বচ্ছ রেট পলিসি
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {DISTANCE_TIERS.map((tier, idx) => (
                <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2 backdrop-blur-sm hover:bg-white/10 transition-all">
                  <div className="text-[10px] font-black text-red-400 uppercase tracking-widest">{tier.badge}</div>
                  <div className="text-xs font-bold text-slate-200">{tier.label}</div>
                  <div className="text-2xl font-black text-yellow-400">
                    ৳{tier.price} <span className="text-xs font-normal text-slate-300">টাকা</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DYNAMIC CALCULATOR */}
      {activeTab === 'calculator' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-500" />
                  ডাইনামিক অ্যাম্বুলেন্স ভাড়া ক্যালকুলেটর
                </h3>
                <p className="text-xs font-bold text-slate-400 mt-0.5">
                  পিকআপ ও গন্তব্য বেছে নিন অথবা দূরত্ব স্লাইড করে সঠিক ভাড়া জানুন
                </p>
              </div>
              <span className="hidden sm:inline-flex bg-red-50 text-red-600 px-3 py-1 rounded-full text-[10px] font-black">
                লাইভ ফেয়ার ক্যালকুলেশন
              </span>
            </div>

            {/* Location Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                  <MapPin size={14} className="text-red-500" /> পিকআপ স্থান (Pickup Location)
                </label>
                <select
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                >
                  <option value="ডোমার">ডোমার</option>
                  <option value="নীলফামারী">নীলফামারী (সদর)</option>
                  <option value="জলঢাকা">জলঢাকা</option>
                  <option value="দেবীগঞ্জ">দেবীগঞ্জ</option>
                  <option value="সৈয়দপুর">সৈয়দপুর</option>
                  <option value="কিশোরগঞ্জ">কিশোরগঞ্জ (নীলফামারী)</option>
                  <option value="অন্যান্য">অন্যান্য স্থানীয় জায়গা</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-500" /> গন্তব্য স্থান (Destination)
                </label>
                <select
                  value={destinationLocation}
                  onChange={(e) => setDestinationLocation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                >
                  <option value="নীলফামারী">নীলফামারী (সদর/হাসপাতাল)</option>
                  <option value="রংপুর">রংপুর (মেডিকেল/শহর)</option>
                  <option value="ডোমার">ডোমার</option>
                  <option value="জলঢাকা">জলঢাকা</option>
                  <option value="দেবীগঞ্জ">দেবীগঞ্জ</option>
                  <option value="সৈয়দপুর">সৈয়দপুর</option>
                  <option value="দিনাজপুর">দিনাজপুর</option>
                  <option value="ঢাকা">ঢাকা (লং ডিস্ট্যান্স)</option>
                </select>
              </div>
            </div>

            {/* Special Match Alert */}
            {matchedFixedRoute ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
                <Sparkles size={24} className="text-emerald-600 shrink-0" />
                <div>
                  <div className="text-xs font-black text-emerald-800">
                    🎉 বিশেষ জনপ্রিয় রুট অফার অ্যাক্টিভ!
                  </div>
                  <div className="text-[11px] font-bold text-emerald-700 mt-0.5">
                    {pickupLocation} ↔ {destinationLocation} রুটের জন্য নির্দিষ্ট ফ্ল্যাট ভাড়া: ৳{matchedFixedRoute.price.toLocaleString()} BDT
                  </div>
                </div>
              </div>
            ) : (
              /* Distance Slider */
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-700">
                    আনুমানিক দূরত্ব (কিলোমিটার):
                  </span>
                  <span className="text-sm font-black text-red-600 bg-white px-3 py-1 rounded-xl border border-red-200">
                    {distanceKm} কিমি (KM)
                  </span>
                </div>

                <input
                  type="range"
                  min={1}
                  max={30}
                  step={1}
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(Number(e.target.value))}
                  className="w-full accent-red-600 cursor-pointer"
                />

                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                  <span>১ কিমি</span>
                  <span>১০ কিমি</span>
                  <span>২০ কিমি</span>
                  <span>৩০ কিমি</span>
                </div>
              </div>
            )}

            {/* Vehicle Type Options */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-700 block">
                অ্যাম্বুলেন্সের ধরন ও সুবিধা বেছে নিন:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setVehicleType('standard')}
                  className={`p-3.5 rounded-2xl border-2 text-left transition-all ${
                    vehicleType === 'standard'
                      ? 'border-red-600 bg-red-50/50 text-red-900 shadow-sm'
                      : 'border-slate-100 bg-white hover:border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="text-xs font-black">🚑 স্ট্যান্ডার্ড (Non-AC)</div>
                  <div className="text-[10px] font-bold text-slate-500 mt-1">জরুরী রোগীর সাধারণ পরিবহন</div>
                  <div className="text-xs font-black text-red-600 mt-1.5">বেসিক ভাড়া</div>
                </button>

                <button
                  type="button"
                  onClick={() => setVehicleType('ac')}
                  className={`p-3.5 rounded-2xl border-2 text-left transition-all ${
                    vehicleType === 'ac'
                      ? 'border-red-600 bg-red-50/50 text-red-900 shadow-sm'
                      : 'border-slate-100 bg-white hover:border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="text-xs font-black">❄️ হাই-এসি (AC)</div>
                  <div className="text-[10px] font-bold text-slate-500 mt-1">সম্পূর্ণ শীতাতপ নিয়ন্ত্রিত</div>
                  <div className="text-xs font-black text-red-600 mt-1.5">+ ৳৩০০ অতিরিক্ত</div>
                </button>

                <button
                  type="button"
                  onClick={() => setVehicleType('icu')}
                  className={`p-3.5 rounded-2xl border-2 text-left transition-all ${
                    vehicleType === 'icu'
                      ? 'border-red-600 bg-red-50/50 text-red-900 shadow-sm'
                      : 'border-slate-100 bg-white hover:border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="text-xs font-black">🏥 লাইফ সাপোর্ট / ICU</div>
                  <div className="text-[10px] font-bold text-slate-500 mt-1">অক্সিজেন ও ভেন্টিলেটর যুক্ত</div>
                  <div className="text-xs font-black text-red-600 mt-1.5">+ ৳১,৫০০ অতিরিক্ত</div>
                </button>
              </div>
            </div>

            {/* Estimated Total Calculation Display Card */}
            <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">হিসাবকৃত সর্বমোট ভাড়া</div>
                  <div className="text-2xl sm:text-3xl font-black text-yellow-400">
                    ৳{currentCalculatedFare.toLocaleString()} <span className="text-xs font-normal text-slate-300">BDT</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-bold text-emerald-400">✓ কোনো গোপন চার্জ নেই</div>
                  <div className="text-[10px] font-bold text-slate-400">২৪/৭ কাস্টমার ও ড্রাইভার সাপোর্ট</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleOpenBooking(`${pickupLocation} টু ${destinationLocation}`, currentCalculatedFare)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black py-3 px-4 rounded-xl text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all text-center"
                >
                  🚑 এই ভাড়ায় বুকিং করুন
                </button>

                <a
                  href={`tel:${hotline}`}
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                >
                  <Phone size={14} /> কল দিয়ে কনফার্ম করুন
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BOOKING MODAL */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-5 relative">
            <button
              onClick={() => setShowBookingModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center hover:bg-slate-200"
            >
              ✕
            </button>

            <div>
              <div className="inline-flex items-center gap-1.5 bg-red-100 text-red-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2">
                <Ambulance size={12} /> ইনস্ট্যান্ট অ্যাম্বুলেন্স রিকোয়েস্ট
              </div>
              <h3 className="text-lg font-black text-slate-800">
                {selectedRouteTitle}
              </h3>
              <p className="text-xs font-bold text-slate-500 mt-0.5">
                নির্ধারিত ভাড়া: <span className="text-red-600 font-black">৳{selectedRoutePrice.toLocaleString()} BDT</span>
              </p>
            </div>

            {bookingSuccess ? (
              <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl text-center space-y-2">
                <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto text-xl">
                  ✓
                </div>
                <h4 className="text-sm font-black text-emerald-900">বুকিং রিকোয়েস্ট পাঠানো হয়েছে!</h4>
                <p className="text-xs text-emerald-700">
                  আমাদের সার্ভিস টিম অনতিবিলম্বে আপনার দেয়া নম্বরে যোগাযোগ করবে।
                </p>
              </div>
            ) : (
              <form onSubmit={handleConfirmBooking} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    রোগী অথবা অভিভাবকের নাম
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: মোহাম্মদ আলী"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    মোবাইল নম্বর (জরুরী যোগাযোগের জন্য) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="যেমন: 01700000000"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    সঠিক পিকআপ ঠিকানা (বাড়ি/রোড/বাজার)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="যেমন: ডোমার বাসস্ট্যান্ড সংলগ্ন, বাড়ি নং-৪৫..."
                    value={exactAddress}
                    onChange={(e) => setExactAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBookingModal(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-xs"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black py-3 rounded-xl text-xs uppercase shadow-lg active:scale-95 transition-all"
                  >
                    বুকিং কনফার্ম করুন
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
