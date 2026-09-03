import React, { useState } from 'react';
import { Wind, ShieldCheck, CheckCircle2, Phone, Plus, ShoppingCart, Clock } from 'lucide-react';

interface OxygenSupportCardProps {
  hotline: string;
  cart: { id: string; name: string; price: number; type: string }[];
  onAddToCart: (item: { id: string; name: string; price: number; type: 'emergency'; details?: string }) => void;
  onDirectCheckout?: (item: { id: string; name: string; price: number; type: 'emergency'; details?: string }) => void;
}

export const OxygenSupportCard: React.FC<OxygenSupportCardProps> = ({
  hotline,
  cart,
  onAddToCart,
  onDirectCheckout
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'3days' | '6days'>('3days');

  const oxygenPlans = [
    {
      id: 'oxygen-3-days',
      duration: '৩ দিনের জন্য',
      days: 3,
      price: 1500,
      priceText: '৳১,৫০০',
      badge: 'জনপ্রিয় প্যাক',
      description: 'জরুরি প্রাথমিক রেসপিরেটরি কেয়ার ও ৩ দিনের অক্সিজেন ব্যাকআপ।'
    },
    {
      id: 'oxygen-6-days',
      duration: '৬ দিনের জন্য',
      days: 6,
      price: 4500,
      priceText: '৳৪,৫০০',
      badge: 'লং-টার্ম কেয়ার',
      description: 'দীর্ঘমেয়াদী পেশেন্ট সাপোর্ট, প্রফেশনাল ফ্লোমিটার ও রিফিল অ্যাসিস্ট্যান্স।'
    }
  ];

  const currentPlan = oxygenPlans.find(p => p.id === `oxygen-${selectedPlan === '3days' ? '3-days' : '6-days'}`) || oxygenPlans[0];
  const isInCart = cart.some(i => i.id === currentPlan.id || i.name.includes(currentPlan.duration));

  const handleBook = (plan: typeof oxygenPlans[0]) => {
    const item = {
      id: plan.id,
      name: `জরুরি অক্সিজেন সিলিন্ডার (${plan.duration})`,
      price: plan.price,
      type: 'emergency' as const,
      details: `প্যাকেজ: ${plan.duration}, প্রাইস: ৳${plan.price}`
    };
    onAddToCart(item);
    if (onDirectCheckout) {
      onDirectCheckout(item);
    }
  };

  return (
    <div className="bg-gradient-to-br from-sky-900 via-blue-900 to-indigo-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-sky-500/30 relative overflow-hidden space-y-5">
      {/* Background Decorative Element */}
      <div className="absolute -right-10 -bottom-10 opacity-10 text-sky-300 pointer-events-none">
        <Wind size={220} />
      </div>

      {/* Header */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 bg-sky-500/20 text-sky-300 border border-sky-400/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md">
            <Wind size={13} className="animate-spin text-sky-300" style={{ animationDuration: '6s' }} />
            ২৪/৭ লাইফ সাপোর্ট
          </div>
          <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            🫁 জরুরি অক্সিজেন সিলিন্ডার সাপোর্ট
          </h3>
          <p className="text-xs text-sky-200 font-medium max-w-xl leading-relaxed">
            মেডিকেল গ্রেড অক্সিজেন সিলিন্ডার, ট্রলি, ফ্লোমিটার, নেজাল ক্যানুলা ও মাস্ক সহ সরাসরি হোম ডেলিভারি সেবা।
          </p>
        </div>

        <a
          href={`tel:${hotline}`}
          className="bg-white text-sky-900 hover:bg-sky-50 font-black px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2 shadow-lg active:scale-95 transition-all shrink-0"
        >
          <Phone size={14} className="animate-bounce text-sky-600" />
          জরুরি কল ({hotline})
        </a>
      </div>

      {/* Plan Selection Grid */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {oxygenPlans.map((plan) => {
          const isSelected = (plan.days === 3 && selectedPlan === '3days') || (plan.days === 6 && selectedPlan === '6days');
          const isThisInCart = cart.some(i => i.id === plan.id);

          return (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan.days === 3 ? '3days' : '6days')}
              className={`cursor-pointer rounded-2xl p-4 border-2 transition-all duration-200 relative flex flex-col justify-between space-y-3 ${
                isSelected
                  ? 'bg-sky-500/20 border-sky-400 shadow-lg shadow-sky-500/20 backdrop-blur-md'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                    isSelected ? 'bg-sky-400 text-slate-950' : 'bg-white/10 text-sky-200'
                  }`}>
                    {plan.badge}
                  </span>
                  <Clock size={14} className="text-sky-300" />
                </div>

                <div>
                  <h4 className="text-base font-black text-white flex items-center gap-1.5">
                    {plan.duration}
                  </h4>
                  <p className="text-[11px] text-sky-200/80 font-medium leading-relaxed mt-1">
                    {plan.description}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-end justify-between">
                <div>
                  <div className="text-[9px] font-bold text-sky-300 uppercase tracking-widest">ভাড়া মূল্যে পাবেন</div>
                  <div className="text-xl font-black text-yellow-300">{plan.priceText} <span className="text-xs text-white/70 font-normal">BDT</span></div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBook(plan);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md active:scale-95 transition-all ${
                    isThisInCart
                      ? 'bg-emerald-500 text-white'
                      : 'bg-sky-500 hover:bg-sky-400 text-slate-950 font-black'
                  }`}
                >
                  {isThisInCart ? 'যোগ হয়েছে ✓' : '+ বুক করুন'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Included Equipment Highlights */}
      <div className="relative z-10 bg-white/5 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-sky-100">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 size={14} className="text-sky-400" />
          <span>মেডিকেল সিলিন্ডার ও ট্রলি</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 size={14} className="text-sky-400" />
          <span>ফ্লোমিটার ও বোতল</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 size={14} className="text-sky-400" />
          <span>নেজাল ক্যানুলা/মাস্ক ফ্রি</span>
        </div>
        <div className="flex items-center gap-1.5 text-yellow-300">
          <ShieldCheck size={14} />
          <span>জরুরি হোম ডেলিভারি সাপোর্ট</span>
        </div>
      </div>
    </div>
  );
};
