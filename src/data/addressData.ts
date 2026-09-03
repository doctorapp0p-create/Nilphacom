export interface Union {
  id: string;
  name: string;
}

export interface Upazila {
  id: string;
  name: string;
  unions: Union[];
}

export interface District {
  id: string;
  name: string;
  upazilas: Upazila[];
}

export const NILPHAMARI_ADDRESS_DATA: District = {
  id: 'Nilphamari',
  name: 'নীলফামারী',
  upazilas: [
    {
      id: 'sadar',
      name: 'নীলফামারী সদর উপজেলা',
      unions: [
        { id: 'sadar-paurashava', name: 'নীলফামারী পৌরসভা' },
        { id: 'sadar-1', name: 'চওড়া বড়গাছা ইউনিয়ন' },
        { id: 'sadar-2', name: 'গোড়গ্রাম ইউনিয়ন' },
        { id: 'sadar-3', name: 'খোকশাবাড়ী ইউনিয়ন' },
        { id: 'sadar-4', name: 'পলাশবাড়ী ইউনিয়ন' },
        { id: 'sadar-5', name: 'টুপামারী ইউনিয়ন' },
        { id: 'sadar-6', name: 'রামনগর ইউনিয়ন' },
        { id: 'sadar-7', name: 'কচুকাটা ইউনিয়ন' },
        { id: 'sadar-8', name: 'পঞ্চপুকুর ইউনিয়ন' },
        { id: 'sadar-9', name: 'ইটাখোলা ইউনিয়ন' },
        { id: 'sadar-10', name: 'কুন্দপুকুর ইউনিয়ন' },
        { id: 'sadar-11', name: 'সোনারায় ইউনিয়ন' },
        { id: 'sadar-12', name: 'সংগলশী ইউনিয়ন' },
        { id: 'sadar-13', name: 'চড়াইখোলা ইউনিয়ন' },
        { id: 'sadar-14', name: 'চাপড়া সরঞ্জামী ইউনিয়ন' },
        { id: 'sadar-15', name: 'লক্ষ্মীচাপ ইউনিয়ন' }
      ]
    },
    {
      id: 'saidpur',
      name: 'সৈয়দপুর উপজেলা',
      unions: [
        { id: 'saidpur-paurashava', name: 'সৈয়দপুর পৌরসভা' },
        { id: 'saidpur-1', name: 'কামারপুকুর ইউনিয়ন' },
        { id: 'saidpur-2', name: 'কাশিরাম বেলপুকুর ইউনিয়ন' },
        { id: 'saidpur-3', name: 'বাঙালীপুর ইউনিয়ন' },
        { id: 'saidpur-4', name: 'বোতলাগাড়ী ইউনিয়ন' },
        { id: 'saidpur-5', name: 'খাতামধুপুর ইউনিয়ন' }
      ]
    },
    {
      id: 'jaldhaka',
      name: 'জলঢাকা উপজেলা',
      unions: [
        { id: 'jaldhaka-1', name: 'ডাউয়াবাড়ী ইউনিয়ন' },
        { id: 'jaldhaka-2', name: 'ধর্মপাল ইউনিয়ন' },
        { id: 'jaldhaka-3', name: 'গোলমুন্ডা ইউনিয়ন' },
        { id: 'jaldhaka-4', name: 'বালাগ্রাম ইউনিয়ন' },
        { id: 'jaldhaka-5', name: 'গোলনা ইউনিয়ন' },
        { id: 'jaldhaka-6', name: 'শিমুলবাড়ী ইউনিয়ন' },
        { id: 'jaldhaka-7', name: 'শৌলমারী ইউনিয়ন' },
        { id: 'jaldhaka-8', name: 'খুটামারা ইউনিয়ন' },
        { id: 'jaldhaka-9', name: 'মীরগঞ্জ ইউনিয়ন' },
        { id: 'jaldhaka-10', name: 'কাঁঠালী ইউনিয়ন' },
        { id: 'jaldhaka-11', name: 'কৈমারী ইউনিয়ন' }
      ]
    },
    {
      id: 'dimla',
      name: 'ডিমলা উপজেলা',
      unions: [
        { id: 'dimla-1', name: 'পশ্চিম ছাতনাই ইউনিয়ন' },
        { id: 'dimla-2', name: 'বালাপাড়া ইউনিয়ন' },
        { id: 'dimla-3', name: 'ডিমলা সদর ইউনিয়ন' },
        { id: 'dimla-4', name: 'খগা খড়িবাড়ী ইউনিয়ন' },
        { id: 'dimla-5', name: 'গয়াবাড়ী ইউনিয়ন' },
        { id: 'dimla-6', name: 'নাউতারা ইউনিয়ন' },
        { id: 'dimla-7', name: 'খালিশা চাপানী ইউনিয়ন' },
        { id: 'dimla-8', name: 'ঝুনাগাছ চাপানী ইউনিয়ন' },
        { id: 'dimla-9', name: 'টেপা খড়িবাড়ী ইউনিয়ন' },
        { id: 'dimla-10', name: 'পূর্ব ছাতনাই ইউনিয়ন' }
      ]
    },
    {
      id: 'domar',
      name: 'ডোমার উপজেলা',
      unions: [
        { id: 'domar-1', name: 'ভোগডাবুড়ী ইউনিয়ন' },
        { id: 'domar-2', name: 'কেতকীবাড়ী ইউনিয়ন' },
        { id: 'domar-3', name: 'গোমনাতী ইউনিয়ন' },
        { id: 'domar-4', name: 'জোড়াবাড়ী ইউনিয়ন' },
        { id: 'domar-5', name: 'বামুনীয়া ইউনিয়ন' },
        { id: 'domar-6', name: 'পাংগা মটকপুর ইউনিয়ন' },
        { id: 'domar-7', name: 'বোড়াগাড়ী ইউনিয়ন' },
        { id: 'domar-8', name: 'ডোমার সদর ইউনিয়ন' },
        { id: 'domar-9', name: 'সোনারায় ইউনিয়ন' },
        { id: 'domar-10', name: 'হরিণচরা ইউনিয়ন' }
      ]
    },
    {
      id: 'kishoreganj',
      name: 'কিশোরগঞ্জ উপজেলা',
      unions: [
        { id: 'kishoreganj-1', name: 'বড়ভিটা ইউনিয়ন' },
        { id: 'kishoreganj-2', name: 'পুটিমারী ইউনিয়ন' },
        { id: 'kishoreganj-3', name: 'নিতাই ইউনিয়ন' },
        { id: 'kishoreganj-4', name: 'বাহাগিলি ইউনিয়ন' },
        { id: 'kishoreganj-5', name: 'চাঁদখানা ইউনিয়ন' },
        { id: 'kishoreganj-6', name: 'কিশোরগঞ্জ সদর ইউনিয়ন' },
        { id: 'kishoreganj-7', name: 'রণচণ্ডী ইউনিয়ন' },
        { id: 'kishoreganj-8', name: 'গাড়াগ্রাম ইউনিয়ন' },
        { id: 'kishoreganj-9', name: 'মাগুরা ইউনিয়ন' }
      ]
    },
    {
      id: 'debiganj',
      name: 'দেবীগঞ্জ উপজেলা',
      unions: [
        { id: 'debiganj-1', name: 'চিলাহাটী ইউনিয়ন' },
        { id: 'debiganj-2', name: 'শালডাঙ্গা ইউনিয়ন' },
        { id: 'debiganj-3', name: 'দেবীগঞ্জ ইউনিয়ন' },
        { id: 'debiganj-4', name: 'পামুলী ইউনিয়ন' },
        { id: 'debiganj-5', name: 'সুন্দরদিঘী ইউনিয়ন' },
        { id: 'debiganj-6', name: 'সোনাহার মল্লিকাদহ ইউনিয়ন' },
        { id: 'debiganj-7', name: 'টেপ্রীগঞ্জ ইউনিয়ন' },
        { id: 'debiganj-8', name: 'দন্ডপাল ইউনিয়ন' },
        { id: 'debiganj-9', name: 'দেবীডুবা ইউনিয়ন' },
        { id: 'debiganj-10', name: 'চেংঠী হাজারাডাঙ্গা ইউনিয়ন' }
      ]
    }
  ]
};

export const ALL_DISTRICTS_DATA: Record<string, District> = {
  Nilphamari: NILPHAMARI_ADDRESS_DATA,
  Dhaka: {
    id: 'Dhaka',
    name: 'ঢাকা',
    upazilas: [
      {
        id: 'savar',
        name: 'সাভার উপজেলা',
        unions: [
          { id: 'savar-1', name: 'সাভার ইউনিয়ন পরিষদ' },
          { id: 'savar-2', name: 'আশুলিয়া ইউনিয়ন পরিষদ' },
          { id: 'savar-3', name: 'বিরুলিয়া ইউনিয়ন পরিষদ' },
          { id: 'savar-4', name: 'ইয়ারপুর ইউনিয়ন পরিষদ' },
          { id: 'savar-5', name: 'পাথালিয়া ইউনিয়ন পরিষদ' },
          { id: 'savar-6', name: 'আমিনবাজার ইউনিয়ন পরিষদ' },
          { id: 'savar-7', name: 'বনগাঁও ইউনিয়ন পরিষদ' }
        ]
      },
      {
        id: 'keraniganj',
        name: 'কেরানীগঞ্জ উপজেলা',
        unions: [
          { id: 'keraniganj-1', name: 'হযরতপুর ইউনিয়ন' },
          { id: 'keraniganj-2', name: 'কালতিয়া ইউনিয়ন' },
          { id: 'keraniganj-3', name: 'রোহিতপুর ইউনিয়ন' },
          { id: 'keraniganj-4', name: 'বাস্তা ইউনিয়ন' },
          { id: 'keraniganj-5', name: 'তারানগর ইউনিয়ন' },
          { id: 'keraniganj-6', name: 'শাক্তা ইউনিয়ন' }
        ]
      },
      {
        id: 'dhamrai',
        name: 'ধামরাই উপজেলা',
        unions: [
          { id: 'dhamrai-1', name: 'ধামরাই ইউনিয়ন' },
          { id: 'dhamrai-2', name: 'বালিয়া ইউনিয়ন' },
          { id: 'dhamrai-3', name: 'গাংগুটিয়া ইউনিয়ন' },
          { id: 'dhamrai-4', name: 'কুশুরা ইউনিয়ন' },
          { id: 'dhamrai-5', name: 'সোমভাগ ইউনিয়ন' }
        ]
      },
      {
        id: 'dohar',
        name: 'দোহার উপজেলা',
        unions: [
          { id: 'dohar-1', name: 'জয়পাড়া ইউনিয়ন' },
          { id: 'dohar-2', name: 'কুসুমহাটি ইউনিয়ন' },
          { id: 'dohar-3', name: 'বিলাশপুর ইউনিয়ন' },
          { id: 'dohar-4', name: 'নয়াবাড়ী ইউনিয়ন' }
        ]
      }
    ]
  },
  Chattogram: {
    id: 'Chattogram',
    name: 'চট্টগ্রাম',
    upazilas: [
      {
        id: 'hathazari',
        name: 'হাটহাজারী উপজেলা',
        unions: [
          { id: 'hathazari-1', name: 'ফতেহাবাদ ইউনিয়ন' },
          { id: 'hathazari-2', name: 'চিকনদন্ডী ইউনিয়ন' },
          { id: 'hathazari-3', name: 'গুমান মর্দন ইউনিয়ন' },
          { id: 'hathazari-4', name: 'মির্জাপুর ইউনিয়ন' },
          { id: 'hathazari-5', name: 'ধলই ইউনিয়ন' }
        ]
      },
      {
        id: 'sitakunda',
        name: 'সীতাকুণ্ড উপজেলা',
        unions: [
          { id: 'sitakunda-1', name: 'কুমিরা ইউনিয়ন' },
          { id: 'sitakunda-2', name: 'বাশঁবাড়িয়া ইউনিয়ন' },
          { id: 'sitakunda-3', name: 'বারবকুন্ড ইউনিয়ন' },
          { id: 'sitakunda-4', name: 'সলিমপুর ইউনিয়ন' },
          { id: 'sitakunda-5', name: 'ভাটিয়ারী ইউনিয়ন' }
        ]
      },
      {
        id: 'patia',
        name: 'পটিয়া উপজেলা',
        unions: [
          { id: 'patia-1', name: 'কোলাগাঁও ইউনিয়ন' },
          { id: 'patia-2', name: 'হাবিলাসদ্বীপ ইউনিয়ন' },
          { id: 'patia-3', name: 'কুসুমপুরা ইউনিয়ন' },
          { id: 'patia-4', name: 'জঙ্গলখাইন ইউনিয়ন' }
        ]
      }
    ]
  },
  Sylhet: {
    id: 'Sylhet',
    name: 'সিলেট',
    upazilas: [
      {
        id: 'sylhetsadar',
        name: 'সিলেট সদর উপজেলা',
        unions: [
          { id: 'sylhetsadar-1', name: 'খাদিমনগর ইউনিয়ন' },
          { id: 'sylhetsadar-2', name: 'খাদিমপাড়া ইউনিয়ন' },
          { id: 'sylhetsadar-3', name: 'টুকের বাজার ইউনিয়ন' },
          { id: 'sylhetsadar-4', name: 'মোগলা বাজার ইউনিয়ন' },
          { id: 'sylhetsadar-5', name: 'টুলটিকর ইউনিয়ন' }
        ]
      },
      {
        id: 'beanibazar',
        name: 'বিয়ানীবাজার উপজেলা',
        unions: [
          { id: 'beanibazar-1', name: 'আলীনগর ইউনিয়ন' },
          { id: 'beanibazar-2', name: 'চারখাই ইউনিয়ন' },
          { id: 'beanibazar-3', name: 'দুবাক ইউনিয়ন' },
          { id: 'beanibazar-4', name: 'শেওলা ইউনিয়ন' }
        ]
      },
      {
        id: 'golapganj',
        name: 'গোলাপগঞ্জ উপজেলা',
        unions: [
          { id: 'golapganj-1', name: 'বাঘা ইউনিয়ন' },
          { id: 'golapganj-2', name: 'গোলাপগঞ্জ ইউনিয়ন' },
          { id: 'golapganj-3', name: 'ফুলবাড়ী ইউনিয়ন' },
          { id: 'golapganj-4', name: 'লক্ষীপাশা ইউনিয়ন' }
        ]
      }
    ]
  },
  Rajshahi: {
    id: 'Rajshahi',
    name: 'রাজশাহী',
    upazilas: [
      {
        id: 'paba',
        name: 'পবা উপজেলা',
        unions: [
          { id: 'paba-1', name: 'হরিপুর ইউনিয়ন' },
          { id: 'paba-2', name: 'হরিয়ান ইউনিয়ন' },
          { id: 'paba-3', name: 'দামকুড় ইউনিয়ন' },
          { id: 'paba-4', name: 'দারুশা ইউনিয়ন' },
          { id: 'paba-5', name: 'বড়গাছি ইউনিয়ন' }
        ]
      },
      {
        id: 'godagari',
        name: 'গোদাগাড়ী উপজেলা',
        unions: [
          { id: 'godagari-1', name: 'গোদাগাড়ী ইউনিয়ন' },
          { id: 'godagari-2', name: 'মোহনপুর ইউনিয়ন' },
          { id: 'godagari-3', name: 'পাকড়ী ইউনিয়ন' },
          { id: 'godagari-4', name: 'গোগ্রাম ইউনিয়ন' }
        ]
      }
    ]
  },
  Khulna: {
    id: 'Khulna',
    name: 'খুলনা',
    upazilas: [
      {
        id: 'rupsha',
        name: 'রূপসা উপজেলা',
        unions: [
          { id: 'rupsha-1', name: 'রূপসা ইউনিয়ন' },
          { id: 'rupsha-2', name: 'নৈহাটী ইউনিয়ন' },
          { id: 'rupsha-3', name: 'টিএসজি ঘাট ইউনিয়ন' },
          { id: 'rupsha-4', name: 'শ্রীফলতলা ইউনিয়ন' }
        ]
      },
      {
        id: 'dumuria',
        name: 'ডুমুরিয়া উপজেলা',
        unions: [
          { id: 'dumuria-1', name: 'ডুমুরিয়া ইউনিয়ন' },
          { id: 'dumuria-2', name: 'শরাফপুর ইউনিয়ন' },
          { id: 'dumuria-3', name: 'সাহস ইউনিয়ন' },
          { id: 'dumuria-4', name: 'ভান্ডারপাড়া ইউনিয়ন' }
        ]
      }
    ]
  },
  Barishal: {
    id: 'Barishal',
    name: 'বরিশাল',
    upazilas: [
      {
        id: 'barishalsadar',
        name: 'বরিশাল সদর উপজেলা',
        unions: [
          { id: 'barishalsadar-1', name: 'কাশীপুর ইউনিয়ন' },
          { id: 'barishalsadar-2', name: 'চর করঞ্জী ইউনিয়ন' },
          { id: 'barishalsadar-3', name: 'চাঁদপুরা ইউনিয়ন' },
          { id: 'barishalsadar-4', name: 'জাগুয়া ইউনিয়ন' },
          { id: 'barishalsadar-5', name: 'চন্দ্রমোহন ইউনিয়ন' }
        ]
      },
      {
        id: 'babuganj',
        name: 'বাবুগঞ্জ উপজেলা',
        unions: [
          { id: 'babuganj-1', name: 'বীরশ্রেষ্ঠ জাহাঙ্গীরনগর ইউনিয়ন' },
          { id: 'babuganj-2', name: 'কেদারপুর ইউনিয়ন' },
          { id: 'babuganj-3', name: 'রহমতপুর ইউনিয়ন' },
          { id: 'babuganj-4', name: 'চাঁদপাশা ইউনিয়ন' }
        ]
      }
    ]
  },
  Rangpur: {
    id: 'Rangpur',
    name: 'রংপুর',
    upazilas: [
      {
        id: 'rangpursadar',
        name: 'রংপুর সদর উপজেলা',
        unions: [
          { id: 'rangpursadar-1', name: 'সদস্যপুষ্করিনী ইউনিয়ন' },
          { id: 'rangpursadar-2', name: 'হরিদেবপুর ইউনিয়ন' },
          { id: 'rangpursadar-3', name: 'চন্দনপাট ইউনিয়ন' },
          { id: 'rangpursadar-4', name: 'মমিনপুর ইউনিয়ন' }
        ]
      },
      {
        id: 'mithapukur',
        name: 'মিঠাপুকুর উপজেলা',
        unions: [
          { id: 'mithapukur-1', name: 'মিঠাপুকুর ইউনিয়ন' },
          { id: 'mithapukur-2', name: 'বালুয়া ইউনিয়ন' },
          { id: 'mithapukur-3', name: 'কাফ্রীকাল ইউনিয়ন' },
          { id: 'mithapukur-4', name: 'চংগাদহ ইউনিয়ন' }
        ]
      }
    ]
  },
  Mymensingh: {
    id: 'Mymensingh',
    name: 'ময়মনসিংহ',
    upazilas: [
      {
        id: 'mymensinghsadar',
        name: 'ময়মনসিংহ সদর উপজেলা',
        unions: [
          { id: 'mymensinghsadar-1', name: 'আকুয়া ইউনিয়ন' },
          { id: 'mymensinghsadar-2', name: 'খাগডহর ইউনিয়ন' },
          { id: 'mymensinghsadar-3', name: 'চর ঈশ্বরদিয়া ইউনিয়ন' },
          { id: 'mymensinghsadar-4', name: 'সিরতা ইউনিয়ন' },
          { id: 'mymensinghsadar-5', name: 'ভাবখালী ইউনিয়ন' }
        ]
      },
      {
        id: 'muktagachha',
        name: 'মুক্তাগাছা উপজেলা',
        unions: [
          { id: 'muktagachha-1', name: 'মুক্তাগাছা ইউনিয়ন' },
          { id: 'muktagachha-2', name: 'তারাটি ইউনিয়ন' },
          { id: 'muktagachha-3', name: 'দুল্লা ইউনিয়ন' },
          { id: 'muktagachha-4', name: 'দাউদপুর ইউনিয়ন' }
        ]
      }
    ]
  },
  Panchagarh: {
    id: 'Panchagarh',
    name: 'পঞ্চগড়',
    upazilas: [
      {
        id: 'debiganj',
        name: 'দেবীগঞ্জ উপজেলা',
        unions: [
          { id: 'debiganj-1', name: 'চিলাহাটী ইউনিয়ন' },
          { id: 'debiganj-2', name: 'শালডাঙ্গা ইউনিয়ন' },
          { id: 'debiganj-3', name: 'দেবীগঞ্জ ইউনিয়ন' },
          { id: 'debiganj-4', name: 'পামুলী ইউনিয়ন' },
          { id: 'debiganj-5', name: 'সুন্দরদিঘী ইউনিয়ন' },
          { id: 'debiganj-6', name: 'সোনাহার মল্লিকাদহ ইউনিয়ন' },
          { id: 'debiganj-7', name: 'টেপ্রীগঞ্জ ইউনিয়ন' },
          { id: 'debiganj-8', name: 'দন্ডপাল ইউনিয়ন' },
          { id: 'debiganj-9', name: 'দেবীডুবা ইউনিয়ন' },
          { id: 'debiganj-10', name: 'চেংঠী হাজারাডাঙ্গা ইউনিয়ন' }
        ]
      }
    ]
  }
};
