"use client";

import { getApp, getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// NOTE:
// This module must not initialize Firebase during Next.js prerender/build.
// Vercel build can fail if env vars are missing/invalid at build time.
// We therefore lazily initialize only in the browser and only if config exists.

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

function hasFirebaseConfig(): boolean {
  const cfg = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  };

  // If apiKey is empty/undefined, Firebase Auth init will throw.
  return Boolean(cfg.apiKey && cfg.authDomain && cfg.projectId && cfg.appId);
}

function initFirebase() {
  if (app) return;

  if (typeof window === "undefined") return;
  if (!hasFirebaseConfig()) return;

  const firebaseConfig: FirebaseOptions = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  };

  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
}

initFirebase();

export { app, auth, db };
export function ensureFirebaseInitialized() {
  initFirebase();
}

