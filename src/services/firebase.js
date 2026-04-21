import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Connectivity Guard: Debug log for environment variable health
if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'undefined') {
  console.error('[Firebase] CONFIGURATION ERROR: VITE_FIREBASE_API_KEY is missing. Check your .env file and restart the dev server.');
} else {
  console.info('[Firebase] Configuration detected for project:', firebaseConfig.projectId);
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true
});

/**
 * Helper to create a secondary auth instance for admin tasks 
 * (creating users without logging out the current manager).
 * Checks for existing 'AdminApp' instance to prevent duplicate initialization errors.
 */
export const createSecondaryAuth = () => {
  const name = 'AdminApp';
  const secondaryApp = getApps().find(a => a.name === name) 
    || initializeApp(firebaseConfig, name);
  return getAuth(secondaryApp);
};

// Explicitly set persistence so sessions survive hard page refreshes.
// This persists the auth token in localStorage across browser sessions.
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.error('Auth persistence error:', err);
});
