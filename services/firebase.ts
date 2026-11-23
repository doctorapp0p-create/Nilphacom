import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  memoryLocalCache,
  doc,
  getDocFromServer,
  setLogLevel
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Silence verbose internal connection warnings
setLogLevel('error');

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

function initDb() {
  const dbId = firebaseConfig.firestoreDatabaseId || '(default)';

  // 1. Try with persistent multi-tab cache and forced HTTP long polling (avoids WebChannel unavailable errors in iframes/proxies)
  try {
    return initializeFirestore(app, {
      experimentalForceLongPolling: true,
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    }, dbId);
  } catch (e1) {
    // 2. Try with memory cache if IndexedDB / multi-tab is restricted in iframe/private mode
    try {
      return initializeFirestore(app, {
        experimentalForceLongPolling: true,
        localCache: memoryLocalCache()
      }, dbId);
    } catch (e2) {
      // 3. Try with basic forced long polling
      try {
        return initializeFirestore(app, {
          experimentalForceLongPolling: true,
        }, dbId);
      } catch (e3) {
        // 4. Default getFirestore fallback
        return getFirestore(app, dbId);
      }
    }
  }
}

export const db = initDb();
export const auth = getAuth(app);
export const storage = getStorage(app);

export async function testConnection() {
  try {
    await getDocFromServer(doc(db, '_connection_test_', 'connection'));
  } catch (error: any) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('the client is offline') || error?.code === 'unavailable') {
      console.warn('Firestore connection check notice (operating with local fallback):', msg);
    }
  }
}

if (typeof window !== 'undefined') {
  testConnection();
}

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

/**
 * Executes a Firestore write callback using a temporary service-operator session
 * without disturbing the user's primary Firebase Auth session.
 */
export async function runWithServiceOperatorFirestore<T>(
  operation: (serviceDb: ReturnType<typeof getFirestore>) => Promise<T>
): Promise<T> {
  const { initializeApp: initTempApp, deleteApp: deleteTempApp } = await import('firebase/app');
  const { getAuth: getTempAuth, signInWithEmailAndPassword, signOut: signTempOut } = await import('firebase/auth');

  const tempAppName = `ServiceOp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const tempApp = initTempApp(firebaseConfig, tempAppName);
  const tempAuth = getTempAuth(tempApp);
  const dbId = firebaseConfig.firestoreDatabaseId || '(default)';
  let tempDb: ReturnType<typeof getFirestore>;
  try {
    tempDb = initializeFirestore(tempApp, { experimentalForceLongPolling: true }, dbId);
  } catch {
    tempDb = getFirestore(tempApp, dbId);
  }

  try {
    await signInWithEmailAndPassword(tempAuth, SERVICE_EMAIL, SERVICE_PASS);
    return await operation(tempDb);
  } finally {
    try {
      await signTempOut(tempAuth);
    } catch {
      // Ignore
    }
    try {
      await deleteTempApp(tempApp);
    } catch {
      // Ignore
    }
  }
}
