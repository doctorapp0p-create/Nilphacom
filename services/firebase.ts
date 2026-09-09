import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  memoryLocalCache,
  setLogLevel
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Silence verbose internal connection warnings
setLogLevel('error');

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

function initDb() {
  const dbId = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? firebaseConfig.firestoreDatabaseId
    : undefined;

  // 1. Try with persistent multi-tab cache and auto-detect long polling
  try {
    return initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    }, dbId);
  } catch (e1) {
    // 2. Try with memory cache if IndexedDB / multi-tab is restricted in iframe/private mode
    try {
      return initializeFirestore(app, {
        experimentalAutoDetectLongPolling: true,
        localCache: memoryLocalCache()
      }, dbId);
    } catch (e2) {
      // 3. Try with basic auto-detect long polling
      try {
        return initializeFirestore(app, {
          experimentalAutoDetectLongPolling: true,
        }, dbId);
      } catch (e3) {
        // 4. Default getFirestore fallback
        return dbId ? getFirestore(app, dbId) : getFirestore(app);
      }
    }
  }
}

export const db = initDb();
export const auth = getAuth(app);

const SERVICE_EMAIL = 'service_sync_operator@nilpha.com';
const SERVICE_PASS = 'JbHealthcare#2026!Sync';

let authSessionPromise: Promise<any> | null = null;

export async function ensureFirebaseAuthSession() {
  if (auth.currentUser) {
    return auth.currentUser;
  }
  if (authSessionPromise) {
    return authSessionPromise;
  }
  authSessionPromise = (async () => {
    try {
      const { signInWithEmailAndPassword, createUserWithEmailAndPassword } = await import('firebase/auth');
      try {
        const cred = await signInWithEmailAndPassword(auth, SERVICE_EMAIL, SERVICE_PASS);
        return cred.user;
      } catch (err: any) {
        if (
          err?.code === 'auth/user-not-found' || 
          err?.code === 'auth/invalid-credential' || 
          err?.code === 'auth/invalid-login-credentials'
        ) {
          try {
            const createCred = await createUserWithEmailAndPassword(auth, SERVICE_EMAIL, SERVICE_PASS);
            return createCred.user;
          } catch (createErr) {
            console.warn("Could not create service auth session:", createErr);
          }
        }
        console.warn("ensureFirebaseAuthSession notice:", err);
        return auth.currentUser;
      }
    } finally {
      authSessionPromise = null;
    }
  })();
  return authSessionPromise;
}


