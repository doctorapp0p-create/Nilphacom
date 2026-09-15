import { db } from '../../services/firebase';
import { collection, doc, setDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { AuditLog } from '../../types';

export async function logAdminAudit(data: {
  actionType: string;
  performedBy: string;
  performedByEmail?: string;
  affectedRecord: string;
  collectionName?: string;
  details?: Record<string, any>;
}): Promise<void> {
  try {
    const logId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newLog: AuditLog = {
      id: logId,
      actionType: data.actionType,
      performedBy: data.performedBy || 'Admin',
      performedByEmail: data.performedByEmail || '',
      affectedRecord: data.affectedRecord,
      collectionName: data.collectionName || '',
      details: data.details || {},
      timestamp: new Date().toISOString()
    };

    await setDoc(doc(db, 'audit_logs', logId), newLog);
  } catch (error) {
    // Non-blocking failure for audit logs
    console.warn('Failed to record audit log:', error);
  }
}

export async function fetchRecentAuditLogs(limitCount = 30): Promise<AuditLog[]> {
  try {
    const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(limitCount));
    const snap = await getDocs(q);
    const logs: AuditLog[] = [];
    snap.forEach(d => {
      logs.push(d.data() as AuditLog);
    });
    return logs;
  } catch (err) {
    console.warn('Failed to fetch audit logs:', err);
    return [];
  }
}
