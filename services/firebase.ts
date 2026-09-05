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


