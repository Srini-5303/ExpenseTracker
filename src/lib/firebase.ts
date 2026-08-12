import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager,
} from 'firebase/firestore';

/**
 * Config comes from .env.local (see .env.example). It is not a secret — Firebase
 * keys identify the project, they do not authorise anything. What actually keeps
 * one person's ledger private is firestore.rules.
 */
const required = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

for (const key of required) {
  if (!import.meta.env[key]) {
    throw new Error(`Missing ${key}. Copy .env.example to .env.local and fill it in.`);
  }
}

export const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
});

export const auth = getAuth(app);

/**
 * Persistent cache keeps the app working with no signal and makes reads instant
 * on open — the offline-first behaviour the PWA had with IndexedDB, except the
 * writes now catch up when the connection returns.
 *
 * Single-tab manager: this app is one phone, one screen. Multi-tab coordination
 * would buy nothing and costs a lock.
 */
export const firestore = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentSingleTabManager(undefined) }),
});
