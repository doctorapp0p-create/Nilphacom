import { db } from './firebase';
import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { BackupMetadata } from '../types';
import { logAdminAudit } from './auditService';

export interface CollectionMeta {
  key: string;
  nameBn: string;
  descriptionBn: string;
  icon: string;
  sensitive?: boolean;
}

export const EXPORTABLE_COLLECTIONS: CollectionMeta[] = [
  { key: 'doctors', nameBn: 'বিশেষজ্ঞ ডাক্তার তালিকা', descriptionBn: 'সকল ডাক্তারদের নাম, পদবী, ডিগ্রি, চেম্বার শিডিউল এবং প্রোফাইল ফটো ইউআরএল', icon: '👨‍⚕️' },
  { key: 'hospitals', nameBn: 'হাসপাতাল ও ক্লিনিক', descriptionBn: 'সকল হাসপাতাল, ক্লিনিক ও ডায়াগনস্টিক সেন্টারের বিস্তারিত তথ্য', icon: '🏥' },
  { key: 'lab_tests', nameBn: 'ল্যাব ও ডায়াগনস্টিক টেস্ট', descriptionBn: 'সকল প্যাথলজি টেস্টের নাম, ডিসকাউন্ট রেট ও প্রাইসিং', icon: '🧪' },
  { key: 'appointments', nameBn: 'রোগীদের সিরিয়াল ও অ্যাপয়েন্টমেন্ট', descriptionBn: 'ডাক্তার দেখানোর বুকিং, সিরিয়াল ও রোগীর তথ্য', icon: '📅', sensitive: true },
  { key: 'medical_records', nameBn: 'মেডিকেল রেকর্ডস ও প্রেসক্রিপশন মেটাডাটা', descriptionBn: 'রোগীদের আপলোডকৃত প্রেসক্রিপশন/রিপোর্টের মেটাডাটা ও Firebase Storage পাথ', icon: '📁', sensitive: true },
  { key: 'prescriptions', nameBn: 'ডিজিটাল প্রেসক্রিপশন ডেটাবেজ', descriptionBn: 'ডাক্তারদের তৈরিকৃত ডিজিটাল প্রেসক্রিপশন ও ঔষুধের তালিকা', icon: '📝', sensitive: true },
  { key: 'profiles', nameBn: 'ইউজার প্রোফাইল ও সদস্যবৃন্দ', descriptionBn: 'নিবন্ধিত সাধারণ রোগী, পল্লী চিকিৎসক ও স্টাফ প্রোফাইল (পাসওয়ার্ড ছাড়া নিরাপদ ডাটা)', icon: '👥', sensitive: true },
  { key: 'subscriptions', nameBn: 'হেলথ মেম্বারশিপ ও সাবস্ক্রিপশন', descriptionBn: 'কার্ড নম্বর, ভ্যালিডিটি ও ডিসকাউন্ট কার্ড হোল্ডারদের তালিকা', icon: '💳' },
  { key: 'orders', nameBn: 'ঔষধ ও সেবা অর্ডার', descriptionBn: 'অর্ডার আইডি, পেমেন্ট ও ডেলিভারি স্ট্যাটাস', icon: '📦' },
  { key: 'coupons', nameBn: 'কুপন ও ডিসকাউন্ট কোড', descriptionBn: 'সক্রিয় ও অতীত প্রোমোশন কুপন কোড', icon: '🎟️' },
  { key: 'blood_donors', nameBn: 'রক্তদাতাদের নেটওয়ার্ক', descriptionBn: 'ব্লাড গ্রুপ, এলাকা ও যোগাযোগের তথ্য', icon: '🩸' },
  { key: 'maternity_donations', nameBn: 'মাতৃত্বকালীন সিজার অনুদান', descriptionBn: 'গরিব মায়েদের ২০০০ টাকা অনুদান আবেদন ও স্ট্যাটাস', icon: '🤰' }
];

// Helper to trigger clean JSON file download in browser
export function triggerFileDownload(filename: string, content: string, mimeType = 'application/json') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Fetch single collection documents
export async function fetchCollectionData(collectionName: string): Promise<any[]> {
  try {
    const snap = await getDocs(collection(db, collectionName));
    const list: any[] = [];
    snap.forEach(d => {
      const data = d.data();
      // Sanitize sensitive credentials (never export passwords)
      if (collectionName === 'profiles') {
        const { created_password, password, ...safeData } = data;
        list.push({ id: d.id, ...safeData });
      } else {
        list.push({ id: d.id, ...data });
      }
    });
    return list;
  } catch (err) {
    console.warn(`Error fetching ${collectionName} for export:`, err);
    throw err;
  }
}

// Export single collection as JSON
export async function exportCollectionJSON(collectionKey: string, adminEmail: string) {
  const data = await fetchCollectionData(collectionKey);
  const dateStr = new Date().toISOString().split('T')[0];
  const payload = {
    exportedAt: new Date().toISOString(),
    collection: collectionKey,
    count: data.length,
    data: data
  };
  triggerFileDownload(`Nilpha_${collectionKey}_backup_${dateStr}.json`, JSON.stringify(payload, null, 2));

  await logAdminAudit({
    actionType: 'EXPORT_COLLECTION_JSON',
    performedBy: adminEmail,
    affectedRecord: collectionKey,
    collectionName: collectionKey,
    details: { count: data.length }
  });
}

// Helper to convert array of flat objects to CSV
export function convertToCSV(items: any[]): string {
  if (!items || items.length === 0) return '';
  // Gather all unique keys
  const keys = Array.from(new Set(items.flatMap(item => Object.keys(item))));
  
  const header = keys.map(k => `"${k.replace(/"/g, '""')}"`).join(',');
  const rows = items.map(item => {
    return keys.map(k => {
      const val = item[k];
      if (val === undefined || val === null) return '""';
      if (typeof val === 'object') {
        return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
      }
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',');
  });

  return [header, ...rows].join('\r\n');
}

// Export single collection as CSV
export async function exportCollectionCSV(collectionKey: string, adminEmail: string) {
  const data = await fetchCollectionData(collectionKey);
  const dateStr = new Date().toISOString().split('T')[0];
  const csvContent = convertToCSV(data);
  triggerFileDownload(`Nilpha_${collectionKey}_backup_${dateStr}.csv`, '\uFEFF' + csvContent, 'text/csv;charset=utf-8;');

  await logAdminAudit({
    actionType: 'EXPORT_COLLECTION_CSV',
    performedBy: adminEmail,
    affectedRecord: collectionKey,
    collectionName: collectionKey,
    details: { count: data.length }
  });
}

// Export complete full-system database backup bundle
export async function exportFullSystemBackup(adminEmail: string): Promise<BackupMetadata> {
  const backupDate = new Date().toISOString();
  const dateStr = backupDate.split('T')[0];
  const fullBackup: Record<string, any> = {
    version: '2.0-permanent-storage',
    backupDate: backupDate,
    exportedBy: adminEmail,
    database: 'Firestore & Firebase Storage Metadata',
    collections: {}
  };

  let totalCount = 0;
  const exportedKeys: string[] = [];

  for (const col of EXPORTABLE_COLLECTIONS) {
    try {
      const colData = await fetchCollectionData(col.key);
      fullBackup.collections[col.key] = colData;
      totalCount += colData.length;
      exportedKeys.push(col.key);
    } catch (e) {
      console.warn(`Could not export collection ${col.key}:`, e);
    }
  }

  const filename = `Nilpha_FULL_DATABASE_BACKUP_${dateStr}.json`;
  triggerFileDownload(filename, JSON.stringify(fullBackup, null, 2));

  const metadata: BackupMetadata = {
    lastBackupDate: backupDate,
    exportedCollections: exportedKeys,
    totalRecordsCount: totalCount,
    exportedBy: adminEmail,
    status: 'success'
  };

  try {
    await setDoc(doc(db, 'settings', 'backup_status'), metadata);
  } catch (err) {
    console.warn('Could not save backup status metadata:', err);
  }

  await logAdminAudit({
    actionType: 'FULL_DATABASE_BACKUP',
    performedBy: adminEmail,
    affectedRecord: 'ALL_COLLECTIONS',
    details: { totalRecords: totalCount, collectionsCount: exportedKeys.length }
  });

  return metadata;
}

// Get last backup status
export async function fetchLastBackupStatus(): Promise<BackupMetadata | null> {
  try {
    const snap = await getDoc(doc(db, 'settings', 'backup_status'));
    if (snap.exists()) {
      return snap.data() as BackupMetadata;
    }
  } catch (err) {
    console.warn('Error reading backup status:', err);
  }
  return null;
}
