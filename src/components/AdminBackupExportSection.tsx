import React, { useState, useEffect } from 'react';
import {
  Download,
  Database,
  FileJson,
  FileSpreadsheet,
  ShieldCheck,
  Clock,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  FileText,
  Lock,
  Layers,
  History
} from 'lucide-react';
import {
  EXPORTABLE_COLLECTIONS,
  exportCollectionJSON,
  exportCollectionCSV,
  exportFullSystemBackup,
  fetchLastBackupStatus
} from '../services/backupService';
import { fetchRecentAuditLogs } from '../services/auditService';
import { BackupMetadata, AuditLog, Profile } from '../../types';

interface AdminBackupExportSectionProps {
  currentProfile: Profile | null;
}

export const AdminBackupExportSection: React.FC<AdminBackupExportSectionProps> = ({ currentProfile }) => {
  const [backupStatus, setBackupStatus] = useState<BackupMetadata | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isExportingAll, setIsExportingAll] = useState(false);
  const [activeExportingCol, setActiveExportingCol] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<Record<string, 'json' | 'csv'>>({});
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const adminEmail = currentProfile?.phone || currentProfile?.full_name || 'Admin';

  const loadData = async () => {
    try {
      const status = await fetchLastBackupStatus();
      if (status) setBackupStatus(status);
      
      setIsLoadingLogs(true);
      const logs = await fetchRecentAuditLogs(20);
      setAuditLogs(logs);
    } catch (e) {
      console.warn('Error loading backup or audit info:', e);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExportAll = async () => {
    setIsExportingAll(true);
    setErrorMsg('');
    try {
      const result = await exportFullSystemBackup(adminEmail);
      setBackupStatus(result);
      setSuccessMsg(`সম্পূর্ণ ডেটাবেজ ব্যাকআপ সফলভাবে ডাউনলোড হয়েছে! মোট ${result.totalRecordsCount} টি রেকর্ড সংরক্ষিত হয়েছে।`);
      setTimeout(() => setSuccessMsg(''), 6000);
      const updatedLogs = await fetchRecentAuditLogs(20);
      setAuditLogs(updatedLogs);
    } catch (err: any) {
      setErrorMsg(`ব্যাকআপ ব্যর্থ হয়েছে: ${err?.message || 'সমস্যা হয়েছে'}`);
    } finally {
      setIsExportingAll(false);
    }
  };

  const handleExportSingle = async (colKey: string, format: 'json' | 'csv') => {
    setActiveExportingCol(`${colKey}_${format}`);
    setErrorMsg('');
    try {
      if (format === 'json') {
        await exportCollectionJSON(colKey, adminEmail);
      } else {
        await exportCollectionCSV(colKey, adminEmail);
      }
      setSuccessMsg(`${colKey} কালেকশনের ${format.toUpperCase()} ফাইল ডাউনলোড সম্পন্ন হয়েছে।`);
      setTimeout(() => setSuccessMsg(''), 4000);
      const updatedLogs = await fetchRecentAuditLogs(20);
      setAuditLogs(updatedLogs);
    } catch (err: any) {
      setErrorMsg(`ডাউনলোড ব্যর্থ হয়েছে: ${err?.message || 'সমস্যা হয়েছে'}`);
    } finally {
      setActiveExportingCol(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 text-left">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 p-6 md:p-8 rounded-[32px] text-white shadow-xl flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500 text-slate-950 font-black text-[10px] uppercase px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
              <ShieldCheck size={12} /> ফায়ারবেস পারমানেন্ট স্টোরেজ ভল্ট
            </span>
            <span className="bg-white/10 text-emerald-300 font-bold text-[10px] px-2.5 py-1 rounded-full border border-white/10">
              Admin Only
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight">
            ডাটা ব্যাকআপ ও এক্সপোর্ট সিস্টেম
          </h2>
          <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
            Nilpha.com এর গুরুত্বপূর্ণ ফায়ারস্টোর তথ্য এবং ফায়ারবেস স্টোরেজ ফাইল মেটাডাটা ব্যাকআপ নিন। আপনি সম্পূর্ণ সিস্টেম একসাথে কিংবা প্রতিটি কালেকশন আলাদাভাবে JSON অথবা Excel/CSV ফরম্যাটে ডাউনলোড করতে পারবেন।
          </p>
        </div>

        <div>
          <button
            onClick={handleExportAll}
            disabled={isExportingAll}
            className="px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm rounded-2xl shadow-lg hover:shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50 cursor-pointer"
          >
            {isExportingAll ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                <span>সম্পূর্ণ ব্যাকআপ প্রস্তুত হচ্ছে...</span>
              </>
            ) : (
              <>
                <Database size={18} />
                <span>ফুল ডেটাবেজ ব্যাকআপ (JSON)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 font-bold text-xs animate-in fade-in">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center gap-3 font-bold text-xs animate-in fade-in">
          <AlertCircle size={18} className="text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Backup Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Clock size={22} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">সর্বশেষ ব্যাকআপ</div>
            <div className="text-sm font-black text-slate-800 mt-0.5">
              {backupStatus?.lastBackupDate
                ? new Date(backupStatus.lastBackupDate).toLocaleDateString('bn-BD', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : 'এখনো হয়নি'}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Layers size={22} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">মোট ব্যাকআপ কালেকশন</div>
            <div className="text-sm font-black text-slate-800 mt-0.5">
              {EXPORTABLE_COLLECTIONS.length} টি কালেকশন
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <HardDrive size={22} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">শেষ ব্যাকআপ মোট তথ্য</div>
            <div className="text-sm font-black text-slate-800 mt-0.5">
              {backupStatus?.totalRecordsCount ? `${backupStatus.totalRecordsCount} টি রেকর্ড` : '—'}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Lock size={22} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">প্রাইভেসি ও সিকিউরিটি</div>
            <div className="text-sm font-black text-slate-800 mt-0.5">
              পাসওয়ার্ড সুরক্ষিত ও স্টোরেজ পাথ
            </div>
          </div>
        </div>
      </div>

      {/* Individual Collections Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Database size={18} className="text-blue-600" />
              পৃথক কালেকশন ভিত্তিক এক্সপোর্ট
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              প্রয়োজনীয় টেবিল বা ডেটা কালেকশনটি সরাসরি JSON বা CSV স্প্রেডশিটে ডাউনলোড করুন
            </p>
          </div>
          <button
            onClick={loadData}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw size={13} className={isLoadingLogs ? 'animate-spin' : ''} />
            <span>রিফ্রেশ</span>
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {EXPORTABLE_COLLECTIONS.map(col => {
            const isJsonLoading = activeExportingCol === `${col.key}_json`;
            const isCsvLoading = activeExportingCol === `${col.key}_csv`;

            return (
              <div
                key={col.key}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 text-lg flex items-center justify-center shrink-0">
                    {col.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-slate-900">{col.nameBn}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-bold">
                        {col.key}
                      </span>
                      {col.sensitive && (
                        <span className="text-[10px] bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded-full border border-rose-100 flex items-center gap-1">
                          <Lock size={10} /> সংবেদনশীল
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {col.descriptionBn}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <button
                    onClick={() => handleExportSingle(col.key, 'json')}
                    disabled={!!activeExportingCol || isExportingAll}
                    className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all border border-blue-200 disabled:opacity-40 cursor-pointer"
                    title="JSON আকারে ডাউনলোড করুন"
                  >
                    {isJsonLoading ? (
                      <RefreshCw size={13} className="animate-spin" />
                    ) : (
                      <FileJson size={14} />
                    )}
                    <span>JSON</span>
                  </button>

                  <button
                    onClick={() => handleExportSingle(col.key, 'csv')}
                    disabled={!!activeExportingCol || isExportingAll}
                    className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all border border-emerald-200 disabled:opacity-40 cursor-pointer"
                    title="Excel/CSV আকারে ডাউনলোড করুন"
                  >
                    {isCsvLoading ? (
                      <RefreshCw size={13} className="animate-spin" />
                    ) : (
                      <FileSpreadsheet size={14} />
                    )}
                    <span>CSV / Excel</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Admin Audit Logs Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <History size={18} className="text-indigo-600" />
              প্রশাসনিক অডিট ও ব্যাকআপ লগ (Admin Audit Trail)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              এডমিন দ্বারা ডাটাবেজ ব্যাকআপ, এক্সপোর্ট ও গুরুত্বপূর্ণ অ্যাকশনের স্বয়ংক্রিয় ইতিহাস
            </p>
          </div>
          <span className="text-xs font-bold text-slate-400">
            {auditLogs.length} টি সাম্প্রতিক লগ
          </span>
        </div>

        {auditLogs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 font-bold text-xs">
            এখনো কোনো অডিট লগ রেকর্ড নেই।
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-black uppercase text-[10px] tracking-wider">
                  <th className="p-3.5 pl-6">সময় ও তারিখ</th>
                  <th className="p-3.5">অ্যাকশন</th>
                  <th className="p-3.5">অপারেটর</th>
                  <th className="p-3.5">প্রভাবিত কালেকশন / রেকর্ড</th>
                  <th className="p-3.5 pr-6">বিস্তারিত</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 pl-6 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString('bn-BD', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {log.actionType}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-slate-900">
                      {log.performedBy || log.performedByEmail || 'Admin'}
                    </td>
                    <td className="p-3.5 font-mono text-slate-600">
                      {log.collectionName || log.affectedRecord}
                    </td>
                    <td className="p-3.5 pr-6 text-slate-500 font-mono text-[11px]">
                      {log.details ? JSON.stringify(log.details) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
