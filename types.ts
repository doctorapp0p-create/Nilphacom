
export enum UserRole {
  PATIENT = 'PATIENT',
  DOCTOR = 'DOCTOR',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  RURAL_DOCTOR = 'RURAL_DOCTOR',
  EMPLOYEE = 'EMPLOYEE'
}

export interface EmployeePermissions {
  manage_lab_tests?: boolean; // all test check and order
  free_doctor_consultation?: boolean; // free doctor consultation
  create_user_with_code?: boolean; // nijer code dia user Der account create kore duia
  view_my_referred_users?: boolean; // nijer codes AR user Der list Dekha
  view_user_passwords?: boolean; // user Der password Dekha
  manage_appointments?: boolean; // ডক্টর সিরিয়াল ও অ্যাপয়েন্টমেন্ট
  manage_medicine_orders?: boolean; // ঔষধ ও সামগ্রী অর্ডার
  manage_blood_donors?: boolean; // রক্তদাতা ডিরেক্টরি
  manage_ambulance_emergency?: boolean; // অ্যাম্বুলেন্স ও জরুরি সেবা
  manage_donations?: boolean; // অনুদান ও সিজার ফান্ড
}

export interface Profile {
  id: string;
  full_name: string;
  phone?: string;
  virtual_email?: string;
  username?: string;
  role: UserRole;
  status: 'active' | 'pending' | 'suspended';
  referral_code?: string;
  referred_by_code?: string;
  created_password?: string;
  reward_points?: number;
  taka_balance?: number;
  district?: string;
  upazila?: string;
  union?: string;
  village?: string;
  referral_10_bonus_credited?: boolean;
  designation?: string;
  permissions?: EmployeePermissions;
  created_by?: string;
  created_at?: string;
}

export interface AppSetting {
  key: string;
  value: string;
}

export interface District {
  id: string;
  name: string;
  nameEn: string;
}

export interface Doctor {
  id: string;
  name: string;
  degree: string;
  specialty: string;
  districts: string[];
  clinics: string[];
  schedule: string;
  availableToday: boolean;
  rating: number;
  image: string;
  slug?: string;
  isVideoConsultant?: boolean;
  consultationFee?: number;
}

export interface Clinic {
  id: string;
  name: string;
  district: string;
  address: string;
  doctors: string[];
  image: string;
  slug?: string;
}

export type Hospital = Clinic;

export interface Medicine {
  id: string;
  name: string;
  price: number;
  discount: number;
  image: string;
  description: string;
}

export interface LabTest {
  id: string;
  name: string;
  price: number;
  discountPrice?: number;
  category?: 'Pathology' | 'X-Ray' | 'Ultrasonogram' | 'ECG & Echo' | 'Other';
  hospital_name?: string;
  description?: string;
  isActive?: boolean;
}

export interface Order {
  id?: string;
  created_at?: string;
  user_id: string;
  user_email: string;
  item_name: string;
  amount: number;
  original_amount?: number;
  shipping: number;
  delivery_distance_label?: string;
  payment_method: string;
  payment_type?: 'online' | 'offline';
  sender_name: string;
  sender_contact: string;
  patient_name?: string;
  trx_id: string;
  hospital_name?: string;
  status: 'pending' | 'verified' | 'processing' | 'completed' | 'cancelled';
  pharmacy_store_id?: string;
  pharmacy_store_name?: string;
  delivery_address?: string;
  referred_by_code?: string;
  subscription_plan_name?: string;
  coupon_code?: string;
  coupon_discount_percent?: number;
  coupon_discount_amount?: number;
}

export interface Coupon {
  id: string;
  code: string;
  discount_percent: number;
  title: string;
  description?: string;
  applicable_to?: 'all' | 'tests' | 'services';
  min_order_amount?: number;
  is_active: boolean;
  usage_count?: number;
  created_at?: string;
}

export interface SponsorHospital {
  id: string;
  name: string;
  district?: string;
  labDiscountPercent: string;
  discountType?: '50_percent' | '100_percent_free' | 'custom';
  description?: string;
  isActive: boolean;
}

export interface FreeDoctorSettings {
  enabled: boolean;
  todayDoctorName?: string;
  todayDoctorSpecialty?: string;
  todayDoctorDegree?: string;
  todayDoctorSchedule?: string;
  todayDoctorChamber?: string;
  todayDoctorImage?: string;
  sponsoringHospital: string;
  sponsorHospitals?: SponsorHospital[];
  district?: string;
  totalTokens: number;
  claimedTokens: number;
  labDiscountType: '50_percent' | '100_percent_free' | string;
  customNotice?: string;
  availableSpecialties?: string[];
}

export interface FreeDoctorClaim {
  id: string;
  patientName: string;
  patientPhone: string;
  patientAddress: string;
  illnessDetails: string;
  selectedSpecialty?: string;
  tokenCode: string;
  labDiscountGranted: string;
  sponsoringHospital: string;
  hospitalDiscountNote?: string;
  doctorAssigned?: string;
  status: 'pending' | 'approved' | 'completed' | 'cancelled';
  createdAt: string;
  referredByCode?: string;
}

export interface MaternityDonationSettings {
  enabled: boolean;
  monthlyGrantLimit: number;
  grantedCountThisMonth: number;
  grantAmount: number;
  rulesAndGuidelines?: string[];
  contactHotline?: string;
  customNotice?: string;
}

export interface MaternityDonationApplication {
  id: string;
  applicationCode: string;
  applicantName: string;
  husbandOrGuardianName: string;
  phone: string;
  altPhone?: string;
  district: string;
  upazilaOrArea: string;
  fullAddress: string;
  familyMonthlyIncome: string;
  occupation: string;
  expectedDeliveryDate: string;
  hospitalName: string;
  nilphaDoctorConsulted: string;
  prescriptionDetailsOrSlip?: string;
  paymentMethod: 'bkash' | 'nagad';
  payoutNumber: string;
  reasonForAssistance: string;
  grantAmount: number;
  wifeNidNumber?: string;
  husbandNidNumber?: string;
  wifePhotoUrl?: string;
  husbandPhotoUrl?: string;
  wifeNidFrontUrl?: string;
  wifeNidBackUrl?: string;
  husbandNidFrontUrl?: string;
  husbandNidBackUrl?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  adminNotes?: string;
  rejectionReason?: string;
  userId?: string;
  createdAt: string;
  updatedAt?: string;
  approvedAt?: string;
}

export interface PrescriptionMedicine {
  id: string;
  brandName: string;
  genericName?: string;
  type: 'Tab' | 'Cap' | 'Syr' | 'Inj' | 'Drop' | 'Oint' | 'Supp' | 'Inhaler' | 'Other';
  strength?: string;
  dosage: string; // e.g. '১ + ০ + ১', '১ + ১ + ১', '১ + ০ + ০', '০ + ০ + ১', 'প্রয়োজনে'
  timing: string; // e.g. 'খাবারের পরে', 'খাবারের আগে', 'খাবারের সাথে'
  duration: string; // e.g. '৫ দিন', '৭ দিন', '১০ দিন', '১ মাস', 'চলবে'
  instructions?: string;
}

export interface PrescriptionLabTestItem {
  id: string;
  name: string;
  category?: string;
  discountEligible?: boolean;
  notes?: string;
}

export interface Prescription {
  id: string;
  prescription_code?: string;
  patient_online_id?: string;
  created_at: string;
  patient_id: string;
  patient_name: string;
  patient_phone?: string;
  patient_age?: string;
  patient_gender?: 'পুরুষ' | 'মহিলা' | 'শিশু' | 'অন্যান্য' | string;
  patient_address?: string;
  patient_weight?: string;
  patient_bp?: string;
  patient_pulse?: string;
  patient_temp?: string;
  chief_complaints?: string;
  diagnosis?: string;
  clinical_notes?: string;
  doctor_id: string;
  doctor_name: string;
  doctor_specialty: string;
  doctor_degree?: string;
  doctor_bmdc_reg?: string;
  doctor_hospital?: string;
  doctor_phone?: string;
  medicines_list?: PrescriptionMedicine[];
  medicines: string;
  recommended_tests?: PrescriptionLabTestItem[] | string[];
  advice_list?: string[];
  notes: string;
  next_visit_date?: string;
  subscription_card_number?: string;
  subscription_plan_name?: string;
  has_discount_badge?: boolean;
}

export interface Quiz {
  id: string;
  video_title: string;
  upload_date: string;
  question: string;
  answer_hint?: string;
  prize_amount: number;
  created_at: string;
}

export interface QuizSubmission {
  id: string;
  quiz_id: string;
  user_id: string;
  user_full_name: string;
  user_phone: string;
  answer: string;
  upload_date_selected: string;
  status: 'pending' | 'correct' | 'incorrect';
  prize_amount: number;
  created_at: string;
}

export interface Withdrawal {
  id: string;
  user_id: string;
  user_full_name: string;
  user_phone: string;
  amount: number;
  method: 'bkash' | 'nagad';
  account_number: string;
  status: 'pending' | 'completed' | 'rejected';
  created_at: string;
}

export interface PharmacyStore {
  id: string;
  owner_id: string;
  shop_name: string;
  phone: string;
  district: string;
  address: string;
  status: 'pending' | 'approved';
  created_at: string;
}

export interface DonationCause {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  unitCost: number;
  unitLabel: string;
  shortDescription: string;
  fullDetails: string;
  impactNote: string;
  highlights: string[];
  suggestedAmounts: number[];
  isActive: boolean;
}

export interface DonationRecord {
  id: string;
  donationCode: string;
  donorName: string;
  isAnonymous: boolean;
  donorPhone: string;
  donorEmail?: string;
  donorDistrict?: string;
  causeId: string;
  causeTitle: string;
  amount: number;
  beneficiaryUnits?: number;
  paymentMethod: 'bkash' | 'nagad' | 'rocket' | 'bank';
  senderNumber: string;
  trxId: string;
  donorMessage?: string;
  status: 'pending' | 'verified' | 'acknowledged' | 'rejected';
  adminNotes?: string;
  createdAt: string;
  verifiedAt?: string;
  userId?: string;
}

export interface DonationSettings {
  enabled: boolean;
  bkashNumber: string;
  nagadNumber: string;
  rocketNumber?: string;
  bankDetails?: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    branch: string;
    routingNumber?: string;
  };
  totalDonationRaised: number;
  totalMothersFunded: number;
  totalFreePatientsServed: number;
  emergencyNotice?: string;
  hotline: string;
}

export type DurationUnit = 'seconds' | 'minutes' | 'hours';

export interface SponsorSlide {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  image: string; // URL or Base64 data
  durationValue: number; // e.g. 5, 10, 1, 2
  durationUnit: DurationUnit; // 'seconds' | 'minutes' | 'hours'
  actionType?: 'none' | 'category' | 'hospital' | 'specialty' | 'link' | 'whatsapp';
  actionTarget?: string; // target ID, specialty, or URL
  buttonText?: string;
  isActive: boolean;
  order: number;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
}

export interface SponsorSliderSettings {
  autoPlay: boolean;
  defaultDurationValue: number;
  defaultDurationUnit: DurationUnit;
  showProgress: boolean;
  showArrows: boolean;
  showDots: boolean;
  pauseOnHover: boolean;
}

export interface ZakatSector {
  id: string;
  title: string;
  shortDesc: string;
  icon: string;
  impactNote: string;
  isEligibleForZakat: boolean;
  suggestedAmounts: number[];
}

export interface ZakatApplication {
  id: string;
  applicationCode: string;
  donorName: string;
  donorPhone: string;
  donorEmail?: string;
  donorAddress: string;
  donorDistrict: string;
  zakatSectorId: string;
  zakatSectorTitle: string;
  estimatedAmount?: number;
  paymentMethodPreference?: 'bkash' | 'nagad' | 'rocket' | 'bank' | 'in_person' | 'undecided';
  senderNumber?: string;
  trxId?: string;
  isDirectPaid?: boolean;
  specialInstructions?: string;
  contactTimePreference?: string;
  status: 'pending' | 'contacted' | 'approved' | 'collected' | 'cancelled';
  adminNotes?: string;
  createdAt: string;
  updatedAt?: string;
  userId?: string;
}

export interface MedicalAssistanceApplication {
  id: string;
  applicationCode: string;
  patientName: string;
  guardianName?: string;
  phone: string;
  district: string;
  upazilaOrArea: string;
  villageOrUnion: string;
  fullAddress: string;
  category: 'maternity_csection' | 'free_doctor_consultation' | 'major_surgery_aid' | 'essential_medicine_aid' | 'lab_test_subsidy' | 'oxygen_ambulance_emergency' | 'other';
  categoryTitle: string;
  illnessDetails: string;
  requestedAmount: number;
  fundedAmount?: number;
  paymentMethod: 'bkash' | 'nagad' | 'rocket';
  payoutNumber: string;
  prescriptionSlipUrl?: string;
  patientNid?: string;
  status: 'pending' | 'verified' | 'sponsored' | 'disbursed' | 'rejected';
  sponsorDonorName?: string;
  sponsorDonationCode?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt?: string;
  userId?: string;
}

export type SubscriptionPlanType = 'tier1_test_discount' | 'tier2_test_and_doctor';

export interface SubscriptionPlan {
  id: SubscriptionPlanType;
  title: string;
  titleEn: string;
  badge: string;
  features: string[];
  discountRate: number; // e.g. 20 for 20%
  hasFreeDoctor: boolean;
  pricing: {
    durationYears: number; // 3 or 5
    price: number; // 300, 500, 1000, 1500
    labelBn: string;
  }[];
  colorScheme: {
    from: string;
    to: string;
    border: string;
    accent: string;
  };
}

export interface Subscription {
  id: string;
  user_id: string;
  user_name: string;
  user_phone: string;
  user_email?: string;
  district?: string;
  address?: string;
  plan_type: SubscriptionPlanType;
  plan_name: string;
  duration_years: 3 | 5;
  fee: number;
  payment_method: 'bkash' | 'nagad' | 'rocket';
  payment_sender_phone: string;
  trx_id: string;
  card_number: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  valid_from?: string;
  valid_until?: string;
  created_at: string;
  approved_at?: string;
  admin_notes?: string;
}

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-';

export interface BloodDonor {
  id: string;
  name: string;
  bloodGroup: BloodGroup;
  phone: string;
  alternatePhone?: string;
  district: string;
  upazila?: string;
  address: string;
  lastDonationDate?: string;
  isAvailable: boolean;
  gender?: 'male' | 'female' | 'other';
  age?: number;
  totalDonationsCount?: number;
  userId?: string;
  registeredAt: string;
  updatedAt?: string;
  verified?: boolean;
}

