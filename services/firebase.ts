import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Graceful connectivity verification
async function testConnection() {
  try {
    // Attempt local/server read without hard throwing on initial boot
    await getDoc(doc(db, '_connection_test_', 'check'));
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    // Ignore transient offline/unavailable messages during boot
    if (
      errorMsg.includes('permission-denied') || 
      errorMsg.includes('insufficient permissions') ||
      errorMsg.includes('unavailable') ||
      errorMsg.includes('Could not reach Cloud Firestore') ||
      errorMsg.includes('client is offline')
    ) {
      return;
    }
    console.warn("Firebase status notice:", error);
  }
}

testConnection();

