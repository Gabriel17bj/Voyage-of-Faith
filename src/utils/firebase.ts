import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const appId = import.meta.env.VITE_FIREBASE_APP_ID;

export const isFirebaseConfigured = (): boolean => {
  return Boolean(apiKey && authDomain && projectId && appId);
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured()) {
  try {
    app = !getApps().length
      ? initializeApp({
          apiKey,
          authDomain,
          projectId,
          appId,
        })
      : getApp();

    auth = getAuth(app);
    db = getFirestore(app);
  } catch (err) {
    console.warn('[Firebase] Initialization failed:', err);
  }
} else {
  // Graceful offline message
  console.info('[Firebase] Environment variables not set. Running in local standalone mode.');
}

export { app, auth, db };
