
import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  ogUrl?: string;
  ogType?: 'website' | 'profile' | 'article' | 'medical-clinic';
  canonical?: string;
  schemas?: any[];
  lang?: 'en' | 'bn';
}

const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords = [],
  ogImage = 'https://images.unsplash.com/photo-1505751172107-5739a007721e?auto=format&fit=crop&q=80&w=1200',
  ogUrl,
  ogType = 'website',
  canonical,
  schemas = [],
  lang = 'bn'
}) => {
  const siteUrl = 'https://nilpha.com';
  const fullCanonical = canonical ? (canonical.startsWith('http') ? canonical : `${siteUrl}${canonical}`) : siteUrl;
  const fullOgUrl = ogUrl ? (ogUrl.startsWith('http') ? ogUrl : `${siteUrl}${ogUrl}`) : fullCanonical;
  const fullOgImage = ogImage.startsWith('http') ? ogImage : `${siteUrl}${ogImage}`;
  
  // Pro-level bilingual & phonetic search keywords
  const defaultKeywords = [
    // English keywords
    'Nilpha',
    'Nilpha.com',
    'Nilphamari doctor list',
    'best doctor in Nilphamari',
    'Nilphamari specialist doctors',
    'Doctor appointment Nilphamari',
    'Nilphamari doctor serial',
    'Nilphamari hospital doctor list',
    'Doctor Kutum Nilphamari',
    'Nilphamari medical directory',
    'Nilphamari clinic list',
    'Nilphamari diagnostic center',
    'Nilphamari telemedicine',
    'Nilphamari gynecology doctor',
    'Nilphamari medicine doctor',
    'Nilphamari orthopedics doctor',
    'Nilphamari child specialist',
    'Nilphamari ENT doctor',
    'Nilphamari surgery doctor',
    'Nilphamari neurology doctor',
    'Nilphamari eye specialist',
    'Nilphamari skin VD doctor',
    'Nilphamari dental doctor',
    // Bangla keywords
    'নীলফামারী ডাক্তার',
    'নীলফামারী ডাক্তারদের তালিকা',
    'নীলফামারীর সেরা ডাক্তার',
    'ডক্টর কুটুম নীলফামারী',
    'নীলফামারী সদর হাসপাতাল ডাক্তার',
    'নীলফামারী বিশেষজ্ঞ ডাক্তার',
    'ডাক্তার সিরিয়াল নীলফামারী',
    'নীলফামারী ডাক্তার অ্যাপয়েন্টমেন্ট',
    'নীলফামারী চেম্বারের ঠিকানা',
    'নীলফামারী মেডিসিন বিশেষজ্ঞ',
    'নীলফামারী গাইনী বিশেষজ্ঞ',
    'নীলফামারী অর্থোপেডিক বিশেষজ্ঞ',
    'নীলফামারী শিশু বিশেষজ্ঞ',
    'নীলফামারী নাক কান গলা বিশেষজ্ঞ',
    'নীলফামারী চক্ষু বিশেষজ্ঞ',
    'নীলফামারী চর্ম ও যৌন রোগ বিশেষজ্ঞ',
    'নীলফামারী ডায়াবেটিস ডাক্তার',
    'নীলফামারী ডেন্টাল সার্জন',
    'নীলফামারী ক্লিনিক ও ডায়াগনস্টিক',
    'নীলফা',
    'নীলফা ডট কম',
    // Banglish / Phonetic keywords
    'nilphamari doctor der list',
    'nilphamari doctor serial number',
    'nilphamari doctor phone number',
    'nilphamari hospital doctor',
    'nilphamari sera doctor'
  ];
  const allKeywords = [...new Set([...keywords, ...defaultKeywords])].join(', ');

  return (
    <Helmet htmlAttributes={{ lang }}>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={allKeywords} />
      <link rel="canonical" href={fullCanonical} />
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />

      {/* Local SEO & Geo Targeting */}
      <meta name="geo.region" content="BD-50" />
      <meta name="geo.placename" content="Nilphamari, Bangladesh" />
      <meta name="geo.position" content="25.9318;88.8560" />
      <meta name="ICBM" content="25.9318, 88.8560" />

      {/* Open Graph / Facebook / WhatsApp */}
      <meta property="og:site_name" content="Nilpha - নীলফামারী ডক্টর ডিরেক্টরি" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullOgImage} />
      <meta property="og:image:secure_url" content={fullOgImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title} />
      <meta property="og:url" content={fullOgUrl} />
      <meta property="og:type" content={ogType === 'medical-clinic' ? 'website' : ogType} />
      <meta property="og:locale" content="bn_BD" />
      <meta property="og:locale:alternate" content="en_US" />

      {/* Twitter / X */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@nilpha_bd" />
      <meta name="twitter:creator" content="@nilpha_bd" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullOgImage} />

      {/* Structured Data (Schema.org JSON-LD) */}
      {schemas.map((schema, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEO;
