import React, { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  where,
  orderBy,
  doc,
  deleteDoc
} from 'firebase/firestore';
import { 
  ShoppingBag, 
  Store, 
  Plus, 
  Minus, 
  Trash2, 
  MapPin, 
  Phone, 
  ShieldCheck, 
  CheckCircle2, 
  Check,
  Search, 
  CreditCard, 
  ChevronRight, 
  Info, 
  PlusCircle,
  FileText,
  ThumbsUp,
  ThumbsDown,
  Star,
  MessageSquare
} from 'lucide-react';
import { DISTRICTS } from '../../constants';
import { ALL_DISTRICTS_DATA } from '../data/addressData';
import { 
  ALL_MEDICINES_DATA, 
  TOP_PHARMA_COMPANIES, 
  MEDICINE_TYPES, 
  DetailedMedicine 
} from '../data/medicineData';

// Local helper to generate a virtual email for users without one
function toVirtualEmail(phone: string) {
  const cleanPhone = phone.replace(/\D/g, '');
  return `${cleanPhone || 'user'}@phone.virtual`;
}

// Maps for English keys/IDs to Bengali names for address proximity sorting
const DISTRICT_MAP: Record<string, string> = {
  'Nilphamari': 'নীলফামারী',
  'Dhaka': 'ঢাকা',
  'Chattogram': 'চট্টগ্রাম',
  'Sylhet': 'সিলেট',
  'Rajshahi': 'রাজশাহী',
  'Khulna': 'খুলনা',
  'Barishal': 'বরিশাল',
  'Rangpur': 'রংপুর',
  'Mymensingh': 'ময়মনসিংহ'
};

const UPAZILA_MAP: Record<string, string> = {
  'sadar': 'নীলফামারী সদর উপজেলা',
  'saidpur': 'সৈয়দপুর উপজেলা',
  'dimla': 'ডিমলা উপজেলা',
  'domar': 'ডোমার উপজেলা',
  'jaldhaka': 'জলঢাকা উপজেলা',
  'kishoreganj': 'কিশোরগঞ্জ উপজেলা'
};

interface BuyMedicineSectionProps {
  user: any;
  profile: any;
  db: any;
  onOpenAuth: () => void;
  initialCategory?: 'all' | 'medicine' | 'equipment';
}

export type ProductItem = DetailedMedicine;

interface CartItem {
  product: ProductItem;
  quantity: number;
}

export function BuyMedicineSection({ user, profile, db, onOpenAuth, initialCategory = 'all' }: BuyMedicineSectionProps) {
  // Navigation tabs within Section
  const [subTab, setSubTab] = useState<'browse' | 'shops' | 'register'>('browse');
  
  // Filtering states
  const [productFilter, setProductFilter] = useState<'all' | 'medicine' | 'equipment'>(initialCategory);
  const [selectedCompany, setSelectedCompany] = useState<string>('square'); // Default to Square Pharmaceuticals
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Nilphamari');

  // Update productFilter when initialCategory changes from parent
  useEffect(() => {
    if (initialCategory) {
      setProductFilter(initialCategory);
    }
  }, [initialCategory]);

  // Cart & Orders
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState<string | null>(null);

  // Registered Shops
  const [shops, setShops] = useState<any[]>([]);
  const [loadingShops, setLoadingShops] = useState(false);

  // Shop registration state
  const [registering, setRegistering] = useState(false);
  const [shopName, setShopName] = useState('');
  const [shopPhone, setShopPhone] = useState('');
  const [shopDistrict, setShopDistrict] = useState('Nilphamari');
  const [shopAddress, setShopAddress] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);

  // Custom structured address states for Shop Registration
  const [shopUpazila, setShopUpazila] = useState('');
  const [shopUnion, setShopUnion] = useState('');
  const [shopVillage, setShopVillage] = useState('');

  // Checkout info state
  const [buyerName, setBuyerName] = useState(profile?.full_name || '');
  const [buyerPhone, setBuyerPhone] = useState(profile?.phone || '');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [selectedShopId, setSelectedShopId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad'>('bkash');
  const [senderNumber, setSenderNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);

  // Custom structured address states for Delivery Checkout
  const [deliveryDistrict, setDeliveryDistrict] = useState('Nilphamari');
  const [deliveryUpazila, setDeliveryUpazila] = useState('');
  const [deliveryUnion, setDeliveryUnion] = useState('');
  const [deliveryVillage, setDeliveryVillage] = useState('');

  // Review System states
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [expandedShopReviewsId, setExpandedShopReviewsId] = useState<string | null>(null);
  
  // Submit Review Form states
  const [submittingReview, setSubmittingReview] = useState(false);
  const [newReviewIsGood, setNewReviewIsGood] = useState<boolean>(true); // true = Good, false = Bad
  const [newReviewRating, setNewReviewRating] = useState<number>(5);
  const [newReviewComment, setNewReviewComment] = useState<string>('');

  // Sync profile address when loaded
  useEffect(() => {
    if (profile) {
      if (profile.district) {
        const mapBnToId: Record<string, string> = {
          'নীলফামারী': 'Nilphamari',
          'ঢাকা': 'Dhaka',
          'চট্টগ্রাম': 'Chattogram',
          'সিলেট': 'Sylhet',
          'রাজশাহী': 'Rajshahi',
          'খুলনা': 'Khulna',
          'বরিশাল': 'Barishal',
          'রংপুর': 'Rangpur',
          'ময়মনসিংহ': 'Mymensingh',
          'ময়মনসিংহ': 'Mymensingh'
        };
        const districtId = mapBnToId[profile.district] || profile.district;
        setDeliveryDistrict(districtId);
        setSelectedDistrict(districtId);
      }
      if (profile.upazila) {
        const mapBnToId: Record<string, string> = {
          'নীলফামারী সদর উপজেলা': 'sadar',
          'সৈয়দপুর উপজেলা': 'saidpur',
          'ডিমলা উপজেলা': 'dimla',
          'ডোমার উপজেলা': 'domar',
          'জলঢাকা উপজেলা': 'jaldhaka',
          'কিশোরগঞ্জ উপজেলা': 'kishoreganj'
        };
        const upazilaId = mapBnToId[profile.upazila] || profile.upazila;
        setDeliveryUpazila(upazilaId);
      }
      if (profile.union) {
        setDeliveryUnion(profile.union);
      }
      if (profile.village) {
        setDeliveryVillage(profile.village);
      }
    }
  }, [profile]);

  // Fetch registered shops on load & tab change
  const fetchShops = async () => {
    setLoadingShops(true);
    try {
      const q = query(collection(db, 'pharmacy_stores'), orderBy('created_at', 'desc'));
      const snap = await getDocs(q);
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setShops(list);
      // Auto-select first store if none selected
      if (list.length > 0 && !selectedShopId) {
        setSelectedShopId(list[0].id);
      }
    } catch (e) {
      console.error("Error fetching pharmacy stores:", e);
    } finally {
      setLoadingShops(false);
    }
  };

  const fetchReviews = async () => {
    setLoadingReviews(true);
    try {
      const q = query(collection(db, 'shop_reviews'), orderBy('created_at', 'desc'));
      const snap = await getDocs(q);
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReviews(list);
    } catch (e) {
      console.error("Error fetching reviews:", e);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleSubmitReview = async (shopId: string) => {
    if (!user) {
      onOpenAuth();
      return;
    }
    if (!newReviewComment.trim()) {
      alert("দয়া করে আপনার মতামত লিখুন!");
      return;
    }
    setSubmittingReview(true);
    try {
      const reviewData = {
        shop_id: shopId,
        user_id: user.uid,
        user_name: profile?.full_name || 'Anonymous User',
        is_good: newReviewIsGood,
        rating: Number(newReviewRating),
        comment: newReviewComment.trim(),
        created_at: new Date().toISOString()
      };
      
      const docRef = await addDoc(collection(db, 'shop_reviews'), reviewData);
      
      // Update local state
      setReviews(prev => [{ id: docRef.id, ...reviewData }, ...prev]);
      
      // Clear form
      setNewReviewComment('');
      setNewReviewRating(5);
      setNewReviewIsGood(true);
      alert("রিভিউটি সফলভাবে সাবমিট হয়েছে!");
    } catch (e) {
      console.error("Error submitting review:", e);
      alert("রিভিউ সাবমিট করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm("আপনি কি নিশ্চিতভাবে এই রিভিউটি ডিলিট করতে চান?")) return;
    try {
      await deleteDoc(doc(db, 'shop_reviews', reviewId));
      setReviews(prev => prev.filter(r => r.id !== reviewId));
      alert("রিভিউটি সফলভাবে ডিলিট করা হয়েছে।");
    } catch (e) {
      console.error("Error deleting review:", e);
      alert("রিভিউ ডিলিট করতে সমস্যা হয়েছে।");
    }
  };

  useEffect(() => {
    fetchShops();
    fetchReviews();
  }, [db]);

  // Sync profile data when loaded
  useEffect(() => {
    if (profile) {
      setBuyerName(profile.full_name || '');
      setBuyerPhone(profile.phone || '');
    }
  }, [profile]);

  // Filter products based on category, company, type, and bilingual search query
  const filteredProducts = useMemo(() => {
    return ALL_MEDICINES_DATA.filter(p => {
      // Category match
      const matchesCategory = productFilter === 'all' || p.category === productFilter;

      // Company match (Only apply company filter to medicines)
      let matchesCompany = true;
      if (p.category === 'medicine' && selectedCompany !== 'all') {
        if (selectedCompany === 'square') {
          matchesCompany = p.company.includes('Square') || (p.companyBn && p.companyBn.includes('স্কয়ার'));
        } else if (selectedCompany === 'incepta') {
          matchesCompany = p.company.includes('Incepta') || (p.companyBn && p.companyBn.includes('ইনসেপ্টা'));
        } else if (selectedCompany === 'beximco') {
          matchesCompany = p.company.includes('Beximco') || (p.companyBn && p.companyBn.includes('বেক্সিমকো'));
        } else if (selectedCompany === 'opsonin') {
          matchesCompany = p.company.includes('Opsonin') || (p.companyBn && p.companyBn.includes('অপসোনিন'));
        } else if (selectedCompany === 'renata') {
          matchesCompany = p.company.includes('Renata') || (p.companyBn && p.companyBn.includes('রেনাটা'));
        } else if (selectedCompany === 'healthcare') {
          matchesCompany = p.company.includes('Healthcare') || (p.companyBn && p.companyBn.includes('হেলথকেয়ার'));
        } else if (selectedCompany === 'aci') {
          matchesCompany = p.company.includes('ACI') || (p.companyBn && p.companyBn.includes('এসিআই'));
        } else if (selectedCompany === 'aristopharma') {
          matchesCompany = p.company.includes('Aristopharma') || (p.companyBn && p.companyBn.includes('অ্যারিস্টোফার্মা'));
        } else if (selectedCompany === 'drug_intl') {
          matchesCompany = p.company.includes('Drug International') || (p.companyBn && p.companyBn.includes('ড্রাগ'));
        } else if (selectedCompany === 'skf') {
          matchesCompany = p.company.includes('Eskayef') || (p.companyBn && (p.companyBn.includes('এসকে+এফ') || p.companyBn.includes('এসকেএফ')));
        }
      }

      // Type / Form match
      const matchesType = selectedType === 'all' || p.type === selectedType;

      // Bilingual Search (English & Bangla)
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = q === '' || 
        p.name.toLowerCase().includes(q) ||
        p.bnName.toLowerCase().includes(q) ||
        (p.generic && p.generic.toLowerCase().includes(q)) ||
        (p.company && p.company.toLowerCase().includes(q)) ||
        (p.companyBn && p.companyBn.toLowerCase().includes(q)) ||
        p.description.toLowerCase().includes(q) ||
        p.bnDescription.toLowerCase().includes(q) ||
        (p.type && p.type.toLowerCase().includes(q)) ||
        (p.typeBn && p.typeBn.toLowerCase().includes(q)) ||
        (p.unit && p.unit.toLowerCase().includes(q));

      return matchesCategory && matchesCompany && matchesType && matchesSearch;
    });
  }, [productFilter, selectedCompany, selectedType, searchQuery]);

  // Filter registered shops by district
  const filteredShopsByDistrict = useMemo(() => {
    return shops.filter(s => s.district === selectedDistrict);
  }, [shops, selectedDistrict]);

  // Sort shops by proximity to delivery address
  const sortedShopsByProximity = useMemo(() => {
    if (!shops || shops.length === 0) return [];
    
    return [...shops].map(shop => {
      let score = 0;
      
      const delDistrictBn = DISTRICT_MAP[deliveryDistrict] || deliveryDistrict;
      const shopDistrictBn = DISTRICT_MAP[shop.district] || shop.district;
      
      if (delDistrictBn && shopDistrictBn && delDistrictBn.trim().toLowerCase() === shopDistrictBn.trim().toLowerCase()) {
        score += 10; // District Match
        
        const delUpazilaBn = UPAZILA_MAP[deliveryUpazila] || deliveryUpazila;
        const shopUpazilaBn = UPAZILA_MAP[shop.upazila] || shop.upazila;
        
        if (delUpazilaBn && shopUpazilaBn && (
          delUpazilaBn.trim().toLowerCase() === shopUpazilaBn.trim().toLowerCase() ||
          deliveryUpazila.trim().toLowerCase() === shop.upazila?.trim().toLowerCase()
        )) {
          score += 50; // Upazila Match
          
          if (deliveryUnion && shop.union && deliveryUnion.trim().toLowerCase() === shop.union.trim().toLowerCase()) {
            score += 200; // Union Match
          }
        }
      }
      return { ...shop, proximityScore: score };
    }).sort((a, b) => b.proximityScore - a.proximityScore);
  }, [shops, deliveryDistrict, deliveryUpazila, deliveryUnion]);

  // Sort registered shops in the directory tab based on user's address matching
  const sortedShopsByDirectoryProximity = useMemo(() => {
    const list = shops.filter(s => s.district === selectedDistrict || s.district === DISTRICT_MAP[selectedDistrict]);
    
    return list.map(shop => {
      let score = 0;
      
      const delDistrictBn = DISTRICT_MAP[deliveryDistrict] || deliveryDistrict;
      const shopDistrictBn = DISTRICT_MAP[shop.district] || shop.district;
      
      if (delDistrictBn && shopDistrictBn && delDistrictBn.trim().toLowerCase() === shopDistrictBn.trim().toLowerCase()) {
        score += 10;
        
        const delUpazilaBn = UPAZILA_MAP[deliveryUpazila] || deliveryUpazila;
        const shopUpazilaBn = UPAZILA_MAP[shop.upazila] || shop.upazila;
        
        if (delUpazilaBn && shopUpazilaBn && (
          delUpazilaBn.trim().toLowerCase() === shopUpazilaBn.trim().toLowerCase() ||
          deliveryUpazila.trim().toLowerCase() === shop.upazila?.trim().toLowerCase()
        )) {
          score += 50;
          
          if (deliveryUnion && shop.union && deliveryUnion.trim().toLowerCase() === shop.union.trim().toLowerCase()) {
            score += 200;
          }
        }
      }
      return { ...shop, proximityScore: score };
    }).sort((a, b) => b.proximityScore - a.proximityScore);
  }, [shops, selectedDistrict, deliveryDistrict, deliveryUpazila, deliveryUnion]);

  // Auto-select closest shop when address or shops list changes
  useEffect(() => {
    if (sortedShopsByProximity.length > 0) {
      setSelectedShopId(sortedShopsByProximity[0].id);
    } else {
      setSelectedShopId('');
    }
  }, [deliveryDistrict, deliveryUpazila, deliveryUnion, shops]);

  // Cart actions
  const addToCart = (product: ProductItem) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  }, [cart]);

  // Handle Shop Registration Submit
  const handleRegisterShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth();
      return;
    }

    let fullShopAddress = '';
    const districtMap: Record<string, string> = {
      'Nilphamari': 'নীলফামারী',
      'Dhaka': 'ঢাকা',
      'Chattogram': 'চট্টগ্রাম',
      'Sylhet': 'সিলেট',
      'Rajshahi': 'রাজশাহী',
      'Khulna': 'খুলনা',
      'Barishal': 'বরিশাল',
      'Rangpur': 'রংপুর',
      'Mymensingh': 'ময়মনসিংহ'
    };
    const mappedDistrictBn = districtMap[shopDistrict] || shopDistrict;

    if (!shopName || !shopPhone || !shopUpazila || !shopUnion || !shopVillage) {
      alert("দয়া করে সকল তথ্য সঠিকভাবে পূরণ করুন।");
      return;
    }
    const upazilaNameBn = ALL_DISTRICTS_DATA[shopDistrict]?.upazilas.find(u => u.id === shopUpazila)?.name || shopUpazila;
    fullShopAddress = `${shopVillage}, ইউনিয়ন: ${shopUnion}, উপজেলা: ${upazilaNameBn}, জেলা: ${mappedDistrictBn}`;

    setRegistering(true);
    try {
      const newShop = {
        owner_id: user.uid,
        shop_name: shopName,
        phone: shopPhone,
        district: mappedDistrictBn,
        address: fullShopAddress,
        upazila: shopUpazila,
        union: shopUnion,
        village: shopVillage,
        status: 'approved', // Auto-approved for instant display
        created_at: new Date().toISOString()
      };
      await addDoc(collection(db, 'pharmacy_stores'), newShop);
      setRegisterSuccess(true);
      setShopName('');
      setShopPhone('');
      setShopUpazila('');
      setShopUnion('');
      setShopVillage('');
      fetchShops(); // Refresh shops list
    } catch (e) {
      console.error("Error registering shop:", e);
      alert("রেজিস্ট্রেশন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setRegistering(false);
    }
  };

  // Handle Order Submit
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth();
      return;
    }

    if (!buyerName || !buyerPhone || !selectedShopId) {
      alert("ক্রেতা ও নিকটবর্তী দোকানের তথ্য সম্পূর্ণ পূরণ করুন।");
      return;
    }
    if (!senderNumber || !transactionId) {
      alert("পেমেন্ট সম্পন্ন করে সেন্ডার নাম্বার ও ট্রানজেকশন আইডি প্রদান করুন।");
      return;
    }

    let finalDeliveryAddress = '';
    const districtMap: Record<string, string> = {
      'Nilphamari': 'নীলফামারী',
      'Dhaka': 'ঢাকা',
      'Chattogram': 'চট্টগ্রাম',
      'Sylhet': 'সিলেট',
      'Rajshahi': 'রাজশাহী',
      'Khulna': 'খুলনা',
      'Barishal': 'বরিশাল',
      'Rangpur': 'রংপুর',
      'Mymensingh': 'ময়মনসিংহ'
    };
    const mappedDeliveryDistrictBn = districtMap[deliveryDistrict] || deliveryDistrict;

    if (!deliveryUpazila || !deliveryUnion || !deliveryVillage) {
      alert("ডেলিভারি ঠিকানা ও তথ্য সম্পূর্ণ পূরণ করুন।");
      return;
    }
    const upazilaNameBn = ALL_DISTRICTS_DATA[deliveryDistrict]?.upazilas.find(u => u.id === deliveryUpazila)?.name || deliveryUpazila;
    finalDeliveryAddress = `${deliveryVillage}, ইউনিয়ন: ${deliveryUnion}, উপজেলা: ${upazilaNameBn}, জেলা: ${mappedDeliveryDistrictBn}`;

    setPlacingOrder(true);
    try {
      // Find selected shop name
      const shopObj = shops.find(s => s.id === selectedShopId);
      const storeName = shopObj ? shopObj.shop_name : "General Pharmacy Store";

      // Items text compilation
      const itemsDescription = cart.map(item => `${item.product.name} x ${item.quantity}`).join(', ');

      const orderData = {
        user_id: user.uid,
        user_email: user.email || toVirtualEmail(buyerPhone),
        item_name: `ঔষধ ও মেডিকেল পণ্য: ${itemsDescription} (${storeName})`,
        amount: cartTotal + 50, // Price + Shipping
        shipping: 50,
        payment_method: paymentMethod,
        payment_type: 'online',
        sender_name: buyerName,
        sender_contact: buyerPhone,
        trx_id: transactionId,
        status: 'pending',
        pharmacy_store_id: selectedShopId,
        pharmacy_store_name: storeName,
        delivery_address: finalDeliveryAddress,
        created_at: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'orders'), orderData);
      setOrderConfirmed(docRef.id);
      setCart([]);
      setIsCheckingOut(false);
      setSenderNumber('');
      setTransactionId('');
      setDeliveryAddress('');
    } catch (e) {
      console.error("Error creating order:", e);
      alert("অর্ডার সম্পন্ন করতে সমস্যা হয়েছে। দয়া করে পুনরায় চেষ্টা করুন।");
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Sub tabs inside Buy Medicine category */}
      <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
        <button
          onClick={() => { setSubTab('browse'); setOrderConfirmed(null); }}
          className={`flex-1 py-3 text-center text-[11px] font-black uppercase tracking-tight rounded-xl transition-all ${subTab === 'browse' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
        >
          💊 ঔষধ ও পণ্য
        </button>
        <button
          onClick={() => { setSubTab('shops'); setOrderConfirmed(null); }}
          className={`flex-1 py-3 text-center text-[11px] font-black uppercase tracking-tight rounded-xl transition-all ${subTab === 'shops' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
        >
          🏪 ওষুধের দোকানসমূহ
        </button>
        <button
          onClick={() => { setSubTab('register'); setOrderConfirmed(null); setRegisterSuccess(false); }}
          className={`flex-1 py-3 text-center text-[11px] font-black uppercase tracking-tight rounded-xl transition-all ${subTab === 'register' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
        >
          ➕ দোকান নিবন্ধন
        </button>
      </div>

      {/* 1. BROWSE & SHOPPING TAB */}
      {subTab === 'browse' && !isCheckingOut && !orderConfirmed && (
        <div className="space-y-6 animate-in fade-in-50 duration-300">

          {/* WhatsApp Prescription Order Banner */}
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-5 rounded-3xl shadow-lg relative overflow-hidden space-y-3 border border-emerald-500/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-xl">
                <div className="inline-flex items-center gap-1.5 bg-emerald-500/30 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-emerald-100 border border-emerald-400/30">
                  <span>📸</span> প্রেসক্রিপশন বা প্রয়োজনীয় ঔষধ অর্ডার
                </div>
                <h4 className="text-sm sm:text-base font-black text-white tracking-wide">
                  ওয়েবসাইটে কাঙ্ক্ষিত ঔষধ বা মেডিকেল পণ্য পাচ্ছেন না?
                </h4>
                <p className="text-[11px] text-emerald-100 font-medium leading-relaxed">
                  আমাদের তালিকায় আপনার প্রয়োজনীয় ঔষধ না থাকলে চিন্তার কিছু নেই! আপনার প্রেসক্রিপশন বা পণ্যের ছবি তুলে হোয়াটসঅ্যাপে পাঠিয়ে দিন। আমরা আপনার সুবিধার্থে দ্রুত হোম ডেলিভারির ব্যবস্থা করব।
                </p>
              </div>
              
              <a
                href="https://wa.me/8801352669100?text=%E0%A6%B9%E0%A7%8D%E0%A6%AF%E0%A6%BE%E0%A6%B2%E0%A7%8B%20%E0%A6%A8%E0%A6%BF%E0%A6%B2%E0%A6%AB%E0%A6%BE%20%E0%A6%B9%E0%A7%87%E0%A6%B2%E0%A7%8D%E0%A6%A5%E0%A6%95%E0%A7%87%E0%A6%AF%E0%A6%BC%E0%A6%BE%E0%A6%B0%2C%20%E0%A6%86%E0%A6%AE%E0%A6%BF%20%E0%A6%AA%E0%A7%8D%E0%A6%B0%E0%A7%87%E0%A6%B8%E0%A6%95%E0%A7%8D%E0%A6%B0%E0%A6%BF%E0%A6%AA%E0%A6%B6%E0%A6%A8%2F%E0%A6%99%E0%A6%B7%E0%A6%A0%E0%A7%87%E0%A6%B0%20%E0%A6%9B%E0%A6%AB%E0%A6%BF%20%E0%A6%AA%E0%A6%BE%E0%A6%A0%E0%A6%BF%E0%A6%AF%E0%A6%BC%E0%A7%87%20%E0%A6%93%E0%A6%B7%E0%A6%A0%20%E0%A6%85%E0%A6%B0%E0%A7%8D%E0%A6%A1%E0%A6%BE%E0%A6%B0%20%E0%A6%95%E0%A6%B0%E0%A6%A4%E0%A7%87%20%E0%A6%9A%E0%A6%BE%E0%A6%88%E0%A7%8B"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-emerald-50 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wide shadow-md hover:scale-[1.02] active:scale-95 transition-all shrink-0 border border-emerald-100"
              >
                <span className="text-base">💬</span>
                <span>প্রেসক্রিপশনের ছবি পাঠান (01352669100)</span>
              </a>
            </div>
          </div>
          
          {/* Shop Owner Prominent Callout */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-4 rounded-3xl flex items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-[12px] font-black text-slate-800 uppercase tracking-wide">ওষুধের দোকান অ্যাড করতে চান?</h4>
              <p className="text-[10px] text-slate-500 font-bold">আপনার এলাকার ফার্মেসি নিবন্ধিত করে ওষুধ অর্ডার সংগ্রহ শুরু করুন সহজে!</p>
            </div>
            <button 
              onClick={() => setSubTab('register')}
              className="bg-blue-600 text-white px-3.5 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider shadow-md hover:bg-blue-700 transition-all shrink-0"
            >
              নিবন্ধন করুন
            </button>
          </div>

          {/* Search Bar with Dual Language Support */}
          <div className="space-y-3">
            <div className="relative">
              <input
                type="text"
                placeholder="ঔষধের নাম, জেনেরিক বা কোম্পানির নাম দিয়ে খুঁজুন (বাংলা বা English)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl py-3.5 pl-11 pr-4 text-xs font-bold outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all text-slate-800 shadow-sm"
              />
              <Search size={18} className="absolute left-4 top-3.5 text-slate-400" />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-3 text-[10px] bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-full w-5 h-5 flex items-center justify-center font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Toggle Bar (সব / ওষুধ / মেডিকেল পণ্য) */}
            <div className="flex items-center justify-between gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-black text-slate-500 px-2 uppercase tracking-wider">ক্যাটাগরি:</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setProductFilter('all')}
                  className={`px-3 py-1.5 text-[10px] font-black rounded-xl transition-all ${productFilter === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200/60'}`}
                >
                  সব
                </button>
                <button
                  onClick={() => setProductFilter('medicine')}
                  className={`px-3 py-1.5 text-[10px] font-black rounded-xl transition-all ${productFilter === 'medicine' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200/60'}`}
                >
                  💊 ওষুধ
                </button>
                <button
                  onClick={() => setProductFilter('equipment')}
                  className={`px-3 py-1.5 text-[10px] font-black rounded-xl transition-all ${productFilter === 'equipment' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200/60'}`}
                >
                  🩺 মেডিকেল পণ্য
                </button>
              </div>
            </div>

            {/* Top 10 Bangladeshi Pharma Companies Horizontal Filter */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">ঔষধ কোম্পানি নির্বাচন করুন (Top Companies):</p>
                {selectedCompany !== 'all' && (
                  <button 
                    onClick={() => setSelectedCompany('all')}
                    className="text-[9px] font-bold text-blue-600 hover:underline"
                  >
                    সকল কোম্পানি দেখান
                  </button>
                )}
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                {TOP_PHARMA_COMPANIES.map(company => (
                  <button
                    key={company.id}
                    onClick={() => setSelectedCompany(company.id)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black whitespace-nowrap transition-all flex items-center gap-1 shrink-0 ${
                      selectedCompany === company.id 
                        ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-300' 
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>🏢</span>
                    <span>{company.bnName}</span>
                    {company.id === 'square' && (
                      <span className="ml-1 bg-amber-400 text-slate-900 text-[8px] px-1.5 py-0.2 rounded-full font-black">১ম ব্যাচ</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Medicine Form / Type Filter (Tablets, Capsules, Injections, Eye Drops, Syrups, etc.) */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">ঔষধের ধরন (Form/Type):</p>
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                {MEDICINE_TYPES.map(typeItem => (
                  <button
                    key={typeItem.id}
                    onClick={() => setSelectedType(typeItem.id)}
                    className={`px-3 py-1 rounded-xl text-[10px] font-black whitespace-nowrap transition-all shrink-0 ${
                      selectedType === typeItem.id
                        ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {typeItem.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Active Filters Summary Indicator */}
          {(selectedCompany !== 'all' || selectedType !== 'all' || searchQuery !== '') && (
            <div className="flex items-center justify-between bg-blue-50/80 border border-blue-100 px-3 py-2 rounded-2xl text-[10px] font-bold text-blue-800">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span>ফিল্টার চালু:</span>
                {selectedCompany !== 'all' && (
                  <span className="bg-blue-200/80 text-blue-900 px-2 py-0.5 rounded-lg">
                    {TOP_PHARMA_COMPANIES.find(c => c.id === selectedCompany)?.bnName}
                  </span>
                )}
                {selectedType !== 'all' && (
                  <span className="bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-lg">
                    {MEDICINE_TYPES.find(t => t.id === selectedType)?.label}
                  </span>
                )}
                {searchQuery && (
                  <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded-lg">
                    সার্চ: "{searchQuery}"
                  </span>
                )}
              </div>
              <button 
                onClick={() => { setSelectedCompany('all'); setSelectedType('all'); setSearchQuery(''); }}
                className="text-[9px] font-black text-rose-600 underline hover:text-rose-700 shrink-0"
              >
                সব রিসেট করুন
              </button>
            </div>
          )}

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-10 px-4 bg-slate-50 rounded-3xl border border-dashed border-slate-300 space-y-3">
              <div className="text-3xl">🔍</div>
              <p className="text-sm font-black text-slate-700">কাঙ্ক্ষিত ঔষধ বা মেডিকেল এক্সেসরিজ তালিকায় পাওয়া যায়নি!</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                ওয়েবসাইটে সব ওষুধের তালিকা না থাকলেও কোনো সমস্যা নেই! আপনার প্রয়োজনীয় ওষুধের বিবরণ বা প্রেসক্রিপশনের ছবি সরাসরি আমাদের হোয়াটসঅ্যাপে পাঠিয়ে দিন।
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <a
                  href="https://wa.me/8801352669100?text=%E0%A6%B9%E0%A7%8D%E0%A6%AF%E0%A6%BE%E0%A6%B2%E0%A7%8B%20%E0%A6%A8%E0%A6%BF%E0%A6%B2%E0%A6%AB%E0%A6%BE%20%E0%A6%B9%E0%A7%87%E0%A6%B2%E0%A7%8D%E0%A6%A5%E0%A6%95%E0%A7%87%E0%A6%AF%E0%A6%BC%E0%A6%BE%E0%A6%B0%2C%20%E0%A6%86%E0%A6%AE%E0%A6%BF%20%E0%A6%AA%E0%A7%8D%E0%A6%B0%E0%A7%87%E0%A6%B8%E0%A6%95%E0%A7%8D%E0%A6%B0%E0%A6%BF%E0%A6%AA%E0%A6%B6%E0%A6%A8%E0%A7%87%E0%A6%B0%20%E0%A6%9B%E0%A6%AB%E0%A6%BF%20%E0%A6%AA%E0%A6%BE%E0%A6%A0%E0%A6%BF%E0%A6%AF%E0%A6%BC%E0%A7%87%20%E0%A6%93%E0%A6%B7%E0%A6%A0%20%E0%A6%85%E0%A6%B0%E0%A7%8D%E0%A6%A1%E0%A6%BE%E0%A6%B0%20%E0%A6%95%E0%A6%B0%E0%A6%A4%E0%A7%87%20%E0%A6%9A%E0%A6%BE%E0%A6%88%E0%A7%8B"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-all"
                >
                  <span>💬</span>
                  <span>হোয়াটসঅ্যাপে ছবি পাঠান (01352669100)</span>
                </a>
                <button 
                  onClick={() => { setSelectedCompany('all'); setSelectedType('all'); setSearchQuery(''); }}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
                >
                  সকল ওষুধ দেখুন
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProducts.map(prod => (
                <div key={prod.id} className="bg-white p-4 border border-slate-100 rounded-3xl hover:shadow-xl transition-all space-y-2.5 flex flex-col justify-between">
                  <div className="flex gap-3 items-start">
                    <img 
                      src={prod.image} 
                      alt={prod.name} 
                      className="w-20 h-20 rounded-2xl object-cover bg-slate-50 border shadow-inner shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      {/* Badges: Company & Type */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {prod.companyBn && (
                          <span className="text-[8px] font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100/80">
                            🏢 {prod.companyBn}
                          </span>
                        )}
                        {prod.typeBn && (
                          <span className="text-[8px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100/80">
                            {prod.typeBn}
                          </span>
                        )}
                      </div>

                      {/* Medicine Name (Bangla & English) */}
                      <h4 className="text-xs font-black text-slate-800 tracking-tight leading-tight">{prod.bnName}</h4>
                      <p className="text-[10px] text-slate-500 font-semibold">{prod.name}</p>

                      {/* Generic Name */}
                      {prod.generic && (
                        <p className="text-[9px] font-bold text-amber-700 bg-amber-50/80 px-2 py-0.5 rounded-md inline-block">
                          🧬 {prod.generic}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-[10px] text-slate-600 font-medium leading-relaxed bg-slate-50 p-2 rounded-xl border border-slate-100">
                    {prod.bnDescription}
                  </p>

                  {/* Unit & Price & Add to Cart */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <div>
                      {prod.unit && (
                        <span className="text-[9px] font-bold text-slate-400 block leading-none">{prod.unit}</span>
                      )}
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-sm font-black text-slate-900">৳{prod.price}</span>
                        {prod.originalPrice && (
                          <span className="text-[9px] line-through text-slate-400 font-bold">৳{prod.originalPrice}</span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => addToCart(prod)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                    >
                      <Plus size={12} /> কার্টে যোগ করুন
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Cart Section Floating / Inline */}
          {cart.length > 0 && (
            <div className="bg-slate-900 text-white p-6 rounded-[32px] shadow-2xl space-y-4 animate-in slide-in-from-bottom-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={18} className="text-blue-400" />
                  <h4 className="text-[12px] font-black uppercase tracking-wider">আপনার শপিং কার্ট ({cart.reduce((a, b) => a + b.quantity, 0)})</h4>
                </div>
                <button 
                  onClick={() => setCart([])} 
                  className="text-[9px] font-black uppercase tracking-wider text-rose-400 hover:text-rose-500 transition-colors"
                >
                  সব মুছুন
                </button>
              </div>

              <div className="max-h-48 overflow-y-auto divide-y divide-white/5 space-y-2.5 pr-1">
                {cart.map(item => (
                  <div key={item.product.id} className="flex items-center justify-between pt-2.5 first:pt-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black tracking-tight truncate leading-none">{item.product.bnName}</p>
                      <p className="text-[9px] text-slate-400 mt-1">৳{item.product.price} × {item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center bg-white/10 rounded-xl px-1">
                        <button 
                          onClick={() => updateQuantity(item.product.id, -1)} 
                          className="p-1.5 text-slate-300 hover:text-white transition-colors"
                        >
                          <Minus size={11} />
                        </button>
                        <span className="px-2 text-xs font-black">{item.quantity}</span>
                        <button 
                          onClick={() => addToCart(item.product)} 
                          className="p-1.5 text-slate-300 hover:text-white transition-colors"
                        >
                          <Plus size={11} />
                        </button>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.product.id)} 
                        className="text-rose-400 hover:text-rose-500 p-1 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/10 pt-4 flex items-center justify-between">
                <div>
                  <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider leading-none">সর্বমোট মূল্য</p>
                  <p className="text-lg font-black text-blue-400 mt-1">৳{cartTotal}</p>
                </div>
                <button
                  onClick={() => {
                    if (!user) {
                      onOpenAuth();
                    } else {
                      setIsCheckingOut(true);
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2"
                >
                  অর্ডার করুন <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. CHECKOUT STEP */}
      {subTab === 'browse' && isCheckingOut && (
        <div className="bg-white border border-slate-100 p-6 rounded-[32px] shadow-xl space-y-6 animate-in slide-in-from-bottom-6">
          <div className="flex justify-between items-center border-b pb-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <ShoppingBag size={16} className="text-blue-600" />
              অর্ডার চেকআউট (Delivery Info)
            </h3>
            <button 
              onClick={() => setIsCheckingOut(false)}
              className="text-[9px] font-black uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-xl transition-all"
            >
              ফিরে যান
            </button>
          </div>

          <form onSubmit={handlePlaceOrder} className="space-y-5">
            
            {/* Itemized Cart Items Summary (Medicines & Medical Accessories combined) */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <span>📦</span> অর্ডারকৃত ঔষধ ও মেডিকেল এক্সেসরিজ তালিকা ({cart.reduce((sum, item) => sum + item.quantity, 0)} টি)
                </h4>
                <span className="text-[9px] bg-blue-100 text-blue-800 font-extrabold px-2 py-0.5 rounded-md">একত্রিত তালিকা</span>
              </div>

              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {cart.map(item => (
                  <div key={item.product.id} className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-100 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <img src={item.product.image} alt={item.product.name} className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0 border" referrerPolicy="no-referrer" />
                      <div className="min-w-0">
                        <p className="font-black text-slate-800 truncate leading-tight">{item.product.bnName}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[8px] font-black px-1.5 py-0.2 rounded ${item.product.category === 'equipment' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {item.product.category === 'equipment' ? '🩺 এক্সেসরিজ' : '💊 ঔষধ'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-bold">৳{item.product.price} × {item.quantity}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right pl-2">
                      <span className="font-black text-slate-900 text-xs">৳{item.product.price * item.quantity}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center text-xs font-black text-slate-700 pt-2 border-t">
                <span>পণ্যসমূহের মোট মূল্য:</span>
                <span className="text-blue-600 font-mono">৳{cartTotal}</span>
              </div>
            </div>

            {/* Buyer Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">ক্রেতার নাম</label>
                <input
                  type="text"
                  required
                  value={buyerName}
                  onChange={e => setBuyerName(e.target.value)}
                  placeholder="আপনার সম্পূর্ণ নাম"
                  className="w-full bg-slate-50 border border-slate-200/60 rounded-xl py-2.5 px-3.5 text-xs font-bold outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-800"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">মোবাইল নাম্বার</label>
                <input
                  type="tel"
                  required
                  value={buyerPhone}
                  onChange={e => setBuyerPhone(e.target.value)}
                  placeholder="আপনার সচল মোবাইল নাম্বার"
                  className="w-full bg-slate-50 border border-slate-200/60 rounded-xl py-2.5 px-3.5 text-xs font-bold outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-800"
                />
              </div>
            </div>

            {/* Delivery Address (Structured) */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* District */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">জেলা (District)</label>
                  <select
                    required
                    value={deliveryDistrict}
                    onChange={e => {
                      setDeliveryDistrict(e.target.value);
                      setDeliveryUpazila('');
                      setDeliveryUnion('');
                    }}
                    className="w-full bg-slate-50 border border-slate-200/60 rounded-xl py-2.5 px-3.5 text-xs font-bold outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-800"
                  >
                    <option value="Nilphamari">নীলফামারী (Nilphamari)</option>
                    <option value="Panchagarh">পঞ্চগড় (Panchagarh)</option>
                    <option value="Dhaka">ঢাকা (Dhaka)</option>
                    <option value="Chattogram">চট্টগ্রাম (Chattogram)</option>
                    <option value="Sylhet">সিলেট (Sylhet)</option>
                    <option value="Rajshahi">রাজশাহী (Rajshahi)</option>
                    <option value="Khulna">খুলনা (Khulna)</option>
                    <option value="Barishal">বরিশাল (Barishal)</option>
                    <option value="Rangpur">রংপুর (Rangpur)</option>
                    <option value="Mymensingh">ময়মনসিংহ (Mymensingh)</option>
                  </select>
                </div>

                {/* Upazila */}
                {(() => {
                  const upazilas = ALL_DISTRICTS_DATA[deliveryDistrict]?.upazilas || [];
                  const selectedUpaObj = upazilas.find(u => u.id === deliveryUpazila || u.name === deliveryUpazila);
                  const selectedUpazilaName = selectedUpaObj?.name || deliveryUpazila;

                  return (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">উপজেলা (Upazila)</label>
                        {selectedUpazilaName && (
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Check size={10} /> {selectedUpazilaName}
                          </span>
                        )}
                      </div>

                      <select
                        required
                        value={deliveryUpazila}
                        onChange={e => {
                          setDeliveryUpazila(e.target.value);
                          setDeliveryUnion('');
                        }}
                        className="w-full bg-slate-50 border border-slate-200/60 rounded-xl py-2.5 px-3.5 text-xs font-bold outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-800"
                      >
                        <option value="">উপজেলা নির্বাচন করুন (অথবা নিচের ফিল্টারে ক্লিক করুন)</option>
                        {upazilas.map(u => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </select>

                      {/* Clickable Upazila Pill Badges */}
                      {upazilas.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {upazilas.map(u => {
                            const isSelected = deliveryUpazila === u.id || deliveryUpazila === u.name;
                            return (
                              <button
                                key={u.id}
                                type="button"
                                onClick={() => {
                                  setDeliveryUpazila(u.id);
                                  setDeliveryUnion('');
                                }}
                                className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
                                  isSelected
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {isSelected && <Check size={11} />}
                                {u.name}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Union */}
                {(() => {
                  const upazilas = ALL_DISTRICTS_DATA[deliveryDistrict]?.upazilas || [];
                  const selectedUpaObj = upazilas.find(u => u.id === deliveryUpazila || u.name === deliveryUpazila);
                  const unions = selectedUpaObj?.unions || [];

                  return (
                    <div className="space-y-1.5 col-span-1 sm:col-span-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">ইউনিয়ন / পৌরসভা (Union/Municipality)</label>
                        {deliveryUnion && (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Check size={10} /> {deliveryUnion}
                          </span>
                        )}
                      </div>

                      <select
                        required
                        value={deliveryUnion}
                        onChange={e => setDeliveryUnion(e.target.value)}
                        disabled={!deliveryUpazila}
                        className="w-full bg-slate-50 border border-slate-200/60 rounded-xl py-2.5 px-3.5 text-xs font-bold outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-800 disabled:opacity-50"
                      >
                        <option value="">
                          {deliveryUpazila ? 'ইউনিয়ন/পৌরসভা নির্বাচন করুন (অথবা ফিল্টার বাটন চাপুন)' : 'প্রথমে উপজেলা নির্বাচন করুন'}
                        </option>
                        {unions.map(un => (
                          <option key={un.id} value={un.name}>{un.name}</option>
                        ))}
                      </select>

                      {/* Clickable Union Pills */}
                      {unions.length > 0 && (
                        <div className="max-h-36 overflow-y-auto flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-100 rounded-xl">
                          {unions.map(un => {
                            const isSelected = deliveryUnion === un.name;
                            return (
                              <button
                                key={un.id}
                                type="button"
                                onClick={() => setDeliveryUnion(un.name)}
                                className={`text-[10.5px] font-bold px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
                                  isSelected
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {isSelected && <Check size={11} />}
                                {un.name}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Village / Area / House */}
                <div className="space-y-1.5 col-span-1 sm:col-span-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">গ্রাম / পাড়া / বাড়ি নং (Village/Area/Road)</label>
                  <input
                    type="text"
                    required
                    value={deliveryVillage}
                    onChange={e => setDeliveryVillage(e.target.value)}
                    placeholder="যেমন: কলেজ পাড়া বা চৌধুরী বাড়ি"
                    className="w-full bg-slate-50 border border-slate-200/60 rounded-xl py-2.5 px-3.5 text-xs font-bold outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Shop Selection (Fulfillment) */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">যে দোকান থেকে ঔষধ সরবরাহ করতে চান (নিকটবর্তী দোকান)</label>
              <select
                required
                value={selectedShopId}
                onChange={e => setSelectedShopId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/60 rounded-xl py-2.5 px-3.5 text-xs font-bold outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-800"
              >
                <option value="">দোকান নির্বাচন করুন</option>
                {sortedShopsByProximity.map(shop => {
                  let proximityLabel = '';
                  if (shop.proximityScore >= 200) proximityLabel = ' - আপনার ইউনিয়নে অবস্থিত 📍';
                  else if (shop.proximityScore >= 50) proximityLabel = ' - আপনার উপজেলায় অবস্থিত 🏢';
                  else if (shop.proximityScore >= 10) proximityLabel = ' - আপনার জেলায় অবস্থিত 🗺️';
                  
                  return (
                    <option key={shop.id} value={shop.id}>
                      {shop.shop_name} ({shop.district} - {shop.address}){proximityLabel} - {shop.phone}
                    </option>
                  );
                })}
              </select>
              <p className="text-[9px] text-slate-400 font-bold leading-none mt-1">
                * কোনো দোকান পাওয়া না গেলে প্রথমে 'দোকান নিবন্ধন' ট্যাব থেকে আপনার আশেপাশের ওষুধের দোকান যোগ করুন।
              </p>
            </div>

            {/* Payment options */}
            <div className="bg-slate-50 border p-5 rounded-2xl space-y-4">
              <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard size={14} className="text-blue-600" />
                পেমেন্ট গেটওয়ে (বিকাশ / নগদ)
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('bkash')}
                  className={`py-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${paymentMethod === 'bkash' ? 'border-pink-500 bg-pink-50/80 text-pink-700 font-black shadow-sm' : 'border-slate-200 bg-white text-slate-600 font-bold'}`}
                >
                  <span className="text-lg">🌸</span> bKash (বিকাশ)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('nagad')}
                  className={`py-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${paymentMethod === 'nagad' ? 'border-orange-500 bg-orange-50/80 text-orange-700 font-black shadow-sm' : 'border-slate-200 bg-white text-slate-600 font-bold'}`}
                >
                  <span className="text-lg">🍊</span> Nagad (নগদ)
                </button>
              </div>

              {/* Payment Instructions */}
              <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-3">
                <p className="text-[11px] text-slate-800 font-bold">
                  ১. নিচে প্রদর্শিত আমাদের অফিশিয়াল সেন্ড মানি নম্বরে সর্বমোট ৳{cartTotal + 50} টাকা Send Money করুন:
                </p>

                {/* Both Payment Numbers Displayed */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className={`p-2.5 rounded-xl border transition-all ${paymentMethod === 'bkash' ? 'bg-pink-50 border-pink-300 ring-2 ring-pink-300/50' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="text-[10px] font-black text-pink-700 flex items-center justify-between">
                      <span>🌸 বিকাশ (bKash) সেন্ড মানি:</span>
                      <span className="text-[8px] bg-pink-600 text-white px-1.5 py-0.2 rounded font-black">Personal</span>
                    </div>
                    <div className="text-xs font-mono font-black text-slate-900 mt-1 select-all tracking-wider">
                      01518395772
                    </div>
                  </div>

                  <div className={`p-2.5 rounded-xl border transition-all ${paymentMethod === 'nagad' ? 'bg-orange-50 border-orange-300 ring-2 ring-orange-300/50' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="text-[10px] font-black text-orange-700 flex items-center justify-between">
                      <span>🍊 নগদ (Nagad) সেন্ড মানি:</span>
                      <span className="text-[8px] bg-orange-600 text-white px-1.5 py-0.2 rounded font-black">Personal</span>
                    </div>
                    <div className="text-xs font-mono font-black text-slate-900 mt-1 select-all tracking-wider">
                      01846800973
                    </div>
                  </div>
                </div>

                <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-xl space-y-1">
                  <p className="text-[10px] text-blue-900 font-extrabold">
                    নির্বাচিত মাধ্যম: <span className="underline font-black">{paymentMethod === 'bkash' ? 'বিকাশ (01518395772)' : 'নগদ (01846800973)'}</span>
                  </p>
                  <p className="text-[10px] text-slate-600 font-bold">
                    ২. টাকা সেন্ড মানি করার পর যে নাম্বার থেকে টাকা পাঠিয়েছেন এবং ট্রানজেকশন আইডি (TrxID) নিচে লিখে অর্ডার সম্পূর্ণ করুন।
                  </p>
                </div>

                <div className="flex justify-between items-center text-[10px] sm:text-xs text-slate-600 font-bold pt-2 border-t">
                  <span>ওষুধ ও পণ্য মূল্য: ৳{cartTotal}</span>
                  <span>ডেলিভারি চার্জ: ৳৫০</span>
                  <span className="text-slate-900 font-black">মোট বিল: ৳{cartTotal + 50}</span>
                </div>
              </div>

              {/* Transaction ID inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-wide">যে নাম্বার থেকে টাকা পাঠিয়েছেন</label>
                  <input
                    type="tel"
                    required
                    value={senderNumber}
                    onChange={e => setSenderNumber(e.target.value)}
                    placeholder="০১৭XXXXXXXX"
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold outline-none focus:border-blue-500 text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-wide">ট্রানজেকশন আইডি (TrxID)</label>
                  <input
                    type="text"
                    required
                    value={transactionId}
                    onChange={e => setTransactionId(e.target.value)}
                    placeholder="E.g. XM98KSD13"
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold outline-none focus:border-blue-500 text-slate-800"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={placingOrder}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/10 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {placingOrder ? "অর্ডার সাবমিট হচ্ছে..." : `৳${cartTotal + 50} পেমেন্ট করে অর্ডার সম্পূর্ণ করুন`}
            </button>
          </form>
        </div>
      )}

      {/* 3. ORDER CONFIRMATION SCREEN */}
      {orderConfirmed && (
        <div className="bg-white border border-slate-100 p-8 rounded-[32px] shadow-xl text-center space-y-6 animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mx-auto border-2 border-emerald-100">
            <CheckCircle2 size={36} />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-wide">অর্ডারটি সফলভাবে সাবমিট হয়েছে!</h3>
            <p className="text-[11px] text-slate-500 font-bold max-w-sm mx-auto leading-relaxed">
              পেমেন্ট যাচাইয়ের পর আপনার অর্ডারটি প্রসেস করা হবে এবং দ্রুততম সময়ে আপনার ঠিকানায় ডেলিভারি করা হবে।
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl inline-block max-w-md w-full border text-left space-y-2">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wide border-b pb-2">
              <span>অর্ডার আইডি (Order ID):</span>
              <span className="font-black text-blue-600 tracking-wider font-mono">{orderConfirmed}</span>
            </div>
            <p className="text-[10px] text-slate-500 font-bold leading-normal pt-1">
              যেকোনো প্রয়োজনে আমাদের হটলাইন নাম্বারে অর্ডার আইডিটি উল্লেখ করে যোগাযোগ করতে পারেন। হটলাইন: ০১৩৫২৬৬৯১০০
            </p>
          </div>

          <button
            onClick={() => { setOrderConfirmed(null); setSubTab('browse'); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/10 active:scale-95 transition-all"
          >
            নতুন ঔষধ কিনুন
          </button>
        </div>
      )}

      {/* 4. SHOPS LIST TAB */}
      {subTab === 'shops' && (
        <div className="space-y-6 animate-in fade-in-50 duration-300">
          <div className="bg-gradient-to-br from-indigo-50/50 to-blue-50/50 border border-blue-100 p-5 rounded-3xl space-y-3">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin size={14} className="text-blue-600" />
              আপনার নিকটবর্তী এলাকার দোকান নির্বাচন করুন
            </h4>
            
            <div className="relative">
              <select
                value={selectedDistrict}
                onChange={e => setSelectedDistrict(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-bold outline-none text-slate-800 focus:border-blue-500"
              >
                {DISTRICTS.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.nameEn})</option>
                ))}
              </select>
            </div>
          </div>

          {loadingShops ? (
            <div className="text-center py-12">
              <p className="text-xs font-bold text-slate-400">দোকান লোড হচ্ছে...</p>
            </div>
          ) : sortedShopsByDirectoryProximity.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed">
              <p className="text-xs font-bold text-slate-400">এই জেলায় এখনো কোনো ওষুধের দোকান নিবন্ধিত হয়নি।</p>
              <button 
                onClick={() => setSubTab('register')}
                className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider shadow-md hover:bg-blue-700 transition-all"
              >
                আপনার দোকান যোগ করুন
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortedShopsByDirectoryProximity.map(shop => (
                <div key={shop.id} className="bg-white p-5 border border-slate-100/80 rounded-3xl hover:shadow-lg transition-all space-y-3 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 rounded-full -mr-6 -mt-6 -z-10 flex items-center justify-center opacity-40">
                    <Store size={24} className="text-blue-600 mr-2 mt-2" />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight leading-snug">{shop.shop_name}</h4>
                      {shop.proximityScore >= 200 ? (
                        <span className="text-[8px] bg-emerald-500 text-white font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-0.5 shadow-sm">
                          📍 ইউনিয়ন (কাছেই অবস্থিত)
                        </span>
                      ) : shop.proximityScore >= 50 ? (
                        <span className="text-[8px] bg-blue-500 text-white font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-0.5 shadow-sm">
                          🏢 আপনার উপজেলা
                        </span>
                      ) : shop.proximityScore >= 10 ? (
                        <span className="text-[8px] bg-indigo-500 text-white font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-0.5 shadow-sm">
                          🗺️ আপনার জেলা
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[9px] font-black text-blue-600 uppercase tracking-wider">{shop.district} বিভাগ/এলাকা</p>
                  </div>

                  <div className="pt-2 border-t border-slate-50 space-y-2">
                    <p className="text-[10px] text-slate-500 font-bold flex items-start gap-1.5">
                      <MapPin size={12} className="text-slate-400 mt-0.5 shrink-0" />
                      <span>{shop.address}</span>
                    </p>
                    <a 
                      href={`tel:${shop.phone}`}
                      className="text-[10px] text-blue-600 font-black flex items-center gap-1.5 hover:underline"
                    >
                      <Phone size={12} className="text-blue-500 shrink-0" />
                      <span>{shop.phone}</span>
                    </a>
                  </div>

                  {/* Review Summaries */}
                  {(() => {
                    const shopReviews = reviews.filter(r => r.shop_id === shop.id);
                    const goodCount = shopReviews.filter(r => r.is_good).length;
                    const badCount = shopReviews.filter(r => !r.is_good).length;
                    const totalRating = shopReviews.reduce((sum, r) => sum + (r.rating || 0), 0);
                    const avgRating = shopReviews.length > 0 ? (totalRating / shopReviews.length).toFixed(1) : '0.0';

                    return (
                      <div className="space-y-3 pt-2.5 border-t border-slate-50">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                          <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg">
                            <Star size={11} className="text-amber-500 fill-amber-500" />
                            <span className="text-slate-800 font-extrabold">{avgRating}</span> ({shopReviews.length} রিভিউ)
                          </span>
                          <span className="flex items-center gap-2">
                            <span className="text-emerald-600 flex items-center gap-0.5 font-extrabold"><ThumbsUp size={10} /> {goodCount}</span>
                            <span className="text-rose-500 flex items-center gap-0.5 font-extrabold"><ThumbsDown size={10} /> {badCount}</span>
                          </span>
                        </div>

                        <button
                          onClick={() => {
                            if (expandedShopReviewsId === shop.id) {
                              setExpandedShopReviewsId(null);
                            } else {
                              setExpandedShopReviewsId(shop.id);
                              setNewReviewComment('');
                              setNewReviewRating(5);
                              setNewReviewIsGood(true);
                            }
                          }}
                          className="w-full py-2.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl text-[9px] font-black uppercase tracking-wider text-slate-600 transition-colors flex items-center justify-center gap-1 border border-slate-100"
                        >
                          <MessageSquare size={11} />
                          {expandedShopReviewsId === shop.id ? 'রিভিউ বন্ধ করুন' : 'রিভিউসমূহ ও মতামত দিন'}
                        </button>

                        {expandedShopReviewsId === shop.id && (
                          <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100 space-y-4 text-left animate-in fade-in-30 duration-200">
                            {/* New Review Form */}
                            <div className="space-y-3 border-b border-dashed border-slate-200 pb-4">
                              <h5 className="text-[10px] font-black uppercase text-slate-700 tracking-wider">✍️ আপনার মতামত ও রিভিউ দিন</h5>
                              
                              {user ? (
                                <div className="space-y-2.5">
                                  {/* Good/Bad Selectors */}
                                  <div className="grid grid-cols-2 gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setNewReviewIsGood(true)}
                                      className={`py-1.5 px-3 rounded-lg text-[9px] font-black uppercase flex items-center justify-center gap-1 transition-all border ${
                                        newReviewIsGood 
                                          ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                                          : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-100'
                                      }`}
                                    >
                                      <ThumbsUp size={10} /> ভালো (Good)
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setNewReviewIsGood(false)}
                                      className={`py-1.5 px-3 rounded-lg text-[9px] font-black uppercase flex items-center justify-center gap-1 transition-all border ${
                                        !newReviewIsGood 
                                          ? 'bg-rose-50 border-rose-500 text-rose-700' 
                                          : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-100'
                                      }`}
                                    >
                                      <ThumbsDown size={10} /> মন্দ (Bad)
                                    </button>
                                  </div>

                                  {/* Star Rating Selector */}
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] font-black uppercase text-slate-400">রেটিং:</span>
                                    <div className="flex gap-0.5">
                                      {[1, 2, 3, 4, 5].map(star => (
                                        <button
                                          type="button"
                                          key={star}
                                          onClick={() => setNewReviewRating(star)}
                                          className="p-0.5 transition-all active:scale-125"
                                        >
                                          <Star 
                                            size={13} 
                                            className={`${star <= newReviewRating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} 
                                          />
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Comment input */}
                                  <textarea
                                    rows={2}
                                    value={newReviewComment}
                                    onChange={e => setNewReviewComment(e.target.value)}
                                    placeholder="দোকানের সেবা, ঔষধের গুণগত মান ও আচরণ কেমন ছিল? এখানে লিখুন..."
                                    className="w-full bg-white p-2.5 rounded-xl border border-slate-200 text-[11px] font-bold outline-none focus:border-blue-500 text-slate-800"
                                  />

                                  <button
                                    type="button"
                                    disabled={submittingReview}
                                    onClick={() => handleSubmitReview(shop.id)}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all disabled:opacity-55 shadow-md flex items-center justify-center gap-1"
                                  >
                                    {submittingReview ? 'সাবমিট হচ্ছে...' : 'রিভিউ সাবমিট করুন'}
                                  </button>
                                </div>
                              ) : (
                                <div className="text-center py-2.5 bg-slate-100/50 rounded-xl border border-slate-200 border-dashed">
                                  <p className="text-[9px] font-bold text-slate-500">মতামত দিতে দয়া করে প্রথমে লগইন করুন।</p>
                                  <button
                                    type="button"
                                    onClick={onOpenAuth}
                                    className="mt-1 bg-blue-50 hover:bg-blue-100 text-blue-600 font-black text-[8px] uppercase tracking-wider px-2.5 py-1 rounded"
                                  >
                                    লগইন করুন
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Reviews List */}
                            <div className="space-y-2.5">
                              <h5 className="text-[10px] font-black uppercase text-slate-700 tracking-wider">💬 গ্রাহকদের মন্তব্যসমূহ ({shopReviews.length})</h5>
                              
                              {shopReviews.length === 0 ? (
                                <p className="text-[10px] text-slate-400 font-bold italic text-center py-2">এখনো কোনো রিভিউ দেওয়া হয়নি।</p>
                              ) : (
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-0.5">
                                  {shopReviews.map(rev => (
                                    <div key={rev.id} className="bg-white p-2.5 rounded-xl border border-slate-100 text-[10px] space-y-1.5 relative">
                                      <div className="flex justify-between items-start gap-1">
                                        <div>
                                          <p className="font-extrabold text-slate-800 leading-none">{rev.user_name}</p>
                                          <p className="text-[8px] text-slate-400 font-bold mt-1">
                                            {(() => {
                                              try {
                                                const d = new Date(rev.created_at);
                                                return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
                                              } catch(e) {
                                                return rev.created_at;
                                              }
                                            })()}
                                          </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 shrink-0">
                                          <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-black ${
                                            rev.is_good 
                                              ? 'bg-emerald-50 text-emerald-700' 
                                              : 'bg-rose-50 text-rose-700'
                                          }`}>
                                            {rev.is_good ? '👍 ভালো' : '👎 মন্দ'}
                                          </span>
                                          <span className="flex gap-0.5">
                                            {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                                              <Star key={i} size={8} className="text-amber-400 fill-amber-400" />
                                            ))}
                                          </span>
                                        </div>
                                      </div>
                                      
                                      <p className="text-slate-600 font-medium leading-normal bg-slate-50/50 p-2 rounded-lg mt-1 italic">
                                        "{rev.comment}"
                                      </p>

                                      {user && user.uid === rev.user_id && (
                                        <button
                                          onClick={() => handleDeleteReview(rev.id)}
                                          className="absolute bottom-1 right-1 text-slate-400 hover:text-rose-500 p-1 transition-colors"
                                          title="মুছে ফেলুন"
                                        >
                                          <Trash2 size={11} />
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. SHOP REGISTER TAB */}
      {subTab === 'register' && (
        <div className="bg-white border border-slate-100 p-6 rounded-[32px] shadow-xl space-y-6 animate-in slide-in-from-bottom-6">
          <div className="space-y-1.5 border-b pb-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <PlusCircle size={16} className="text-blue-600" />
              ওষুধের দোকান/ফার্মেসি নিবন্ধন করুন
            </h3>
            <p className="text-[10px] text-slate-400 font-bold leading-normal">
              আপনার ফার্মেসি/মেডিকেল স্টোরটি অ্যাপের ডিরেক্টরিতে যোগ করুন যেন সাধারণ রোগীরা সহজে আপনার ভান্ডার থেকে ঔষধ অর্ডার করতে পারে।
            </p>
          </div>

          {registerSuccess ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mx-auto">
                <CheckCircle2 size={24} />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-black text-slate-800">দোকানটি সফলভাবে নিবন্ধিত হয়েছে!</p>
                <p className="text-[10px] text-slate-500 font-bold">এখন সকল ব্যবহারকারী 'ওষুধের দোকানসমূহ' ট্যাবে আপনার দোকানটি দেখতে পাবেন।</p>
              </div>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => setRegisterSuccess(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all"
                >
                  অন্য দোকান যোগ করুন
                </button>
                <button
                  onClick={() => setSubTab('shops')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all"
                >
                  দোকান লিস্ট দেখুন
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleRegisterShop} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-wide">দোকানের নাম (Shop Name)</label>
                <input
                  type="text"
                  required
                  value={shopName}
                  onChange={e => setShopName(e.target.value)}
                  placeholder="যেমন: মা ফার্মেসি, সেবা ড্রাগ হাউস"
                  className="w-full bg-slate-50 border border-slate-200/60 rounded-xl py-2.5 px-3.5 text-xs font-bold outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-wide">মোবাইল নাম্বার (যোগাযোগের জন্য)</label>
                  <input
                    type="tel"
                    required
                    value={shopPhone}
                    onChange={e => setShopPhone(e.target.value)}
                    placeholder="০১XXXXXXXXX"
                    className="w-full bg-slate-50 border border-slate-200/60 rounded-xl py-2.5 px-3.5 text-xs font-bold outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-wide">জেলা নির্বাচন করুন (District)</label>
                  <select
                    required
                    value={shopDistrict}
                    onChange={e => {
                      setShopDistrict(e.target.value);
                      setShopUpazila('');
                      setShopUnion('');
                    }}
                    className="w-full bg-slate-50 border border-slate-200/60 rounded-xl py-2.5 px-3.5 text-xs font-bold outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-800"
                  >
                    <option value="Nilphamari">নীলফামারী (Nilphamari)</option>
                    <option value="Panchagarh">পঞ্চগড় (Panchagarh)</option>
                    <option value="Dhaka">ঢাকা (Dhaka)</option>
                    <option value="Chattogram">চট্টগ্রাম (Chattogram)</option>
                    <option value="Sylhet">সিলেট (Sylhet)</option>
                    <option value="Rajshahi">রাজশাহী (Rajshahi)</option>
                    <option value="Khulna">খুলনা (Khulna)</option>
                    <option value="Barishal">বরিশাল (Barishal)</option>
                    <option value="Rangpur">রংপুর (Rangpur)</option>
                    <option value="Mymensingh">ময়মনসিংহ (Mymensingh)</option>
                  </select>
                </div>
              </div>

              {/* Upazila Selection */}
              {(() => {
                const upazilas = ALL_DISTRICTS_DATA[shopDistrict]?.upazilas || [];
                const selectedUpaObj = upazilas.find(u => u.id === shopUpazila || u.name === shopUpazila);
                const unions = selectedUpaObj?.unions || [];

                return (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-wide">উপজেলা (Upazila)</label>
                        {selectedUpaObj?.name && (
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Check size={10} /> {selectedUpaObj.name}
                          </span>
                        )}
                      </div>
                      <select
                        required
                        value={shopUpazila}
                        onChange={e => {
                          setShopUpazila(e.target.value);
                          setShopUnion('');
                        }}
                        className="w-full bg-slate-50 border border-slate-200/60 rounded-xl py-2.5 px-3.5 text-xs font-bold outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-800"
                      >
                        <option value="">উপজেলা নির্বাচন করুন (অথবা ফিল্টার বাটন চাপুন)</option>
                        {upazilas.map(u => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </select>

                      {/* Clickable Upazila Pills */}
                      {upazilas.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {upazilas.map(u => {
                            const isSelected = shopUpazila === u.id || shopUpazila === u.name;
                            return (
                              <button
                                key={u.id}
                                type="button"
                                onClick={() => {
                                  setShopUpazila(u.id);
                                  setShopUnion('');
                                }}
                                className={`text-[10.5px] font-bold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
                                  isSelected
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {isSelected && <Check size={10} />}
                                {u.name}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Union Selection */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-wide">ইউনিয়ন / পৌরসভা (Union/Municipality)</label>
                        {shopUnion && (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Check size={10} /> {shopUnion}
                          </span>
                        )}
                      </div>
                      <select
                        required
                        value={shopUnion}
                        onChange={e => setShopUnion(e.target.value)}
                        disabled={!shopUpazila}
                        className="w-full bg-slate-50 border border-slate-200/60 rounded-xl py-2.5 px-3.5 text-xs font-bold outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-800 disabled:opacity-50"
                      >
                        <option value="">
                          {shopUpazila ? 'ইউনিয়ন/পৌরসভা নির্বাচন করুন (অথবা নিচে ফিল্টার বোতামে চাপুন)' : 'প্রথমে উপজেলা নির্বাচন করুন'}
                        </option>
                        {unions.map(un => (
                          <option key={un.id} value={un.name}>{un.name}</option>
                        ))}
                      </select>

                      {/* Clickable Union Pills */}
                      {unions.length > 0 && (
                        <div className="max-h-36 overflow-y-auto flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-100 rounded-xl">
                          {unions.map(un => {
                            const isSelected = shopUnion === un.name;
                            return (
                              <button
                                key={un.id}
                                type="button"
                                onClick={() => setShopUnion(un.name)}
                                className={`text-[10.5px] font-bold px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
                                  isSelected
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {isSelected && <Check size={10} />}
                                {un.name}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Village/Road/Para/Mahalla text input */}
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-wide">গ্রাম, পাড়া বা বাজার এলাকা (Village/Para/Market Area)</label>
                <input
                  type="text"
                  required
                  value={shopVillage}
                  onChange={e => setShopVillage(e.target.value)}
                  placeholder="যেমন: চৌরঙ্গী মোড় (হাসপাতাল সড়ক সংলগ্ন) বা সোনারায় বাজার"
                  className="w-full bg-slate-50 border border-slate-200/60 rounded-xl py-2.5 px-3.5 text-xs font-bold outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-800"
                />
              </div>

              <button
                type="submit"
                disabled={registering}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/10 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {registering ? "নিবন্ধন হচ্ছে..." : "ফার্মেসি নিবন্ধন সম্পন্ন করুন"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
