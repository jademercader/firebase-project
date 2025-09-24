'use client';

import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { useEffect, useState, type ReactNode } from 'react';

import { initializeFirebase, FirebaseProvider } from '@/firebase';

type FirebaseServices = {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
};

export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  const [firebase, setFirebase] = useState<FirebaseServices | null>(null);
  useEffect(() => {
    const services = initializeFirebase();
    setFirebase(services);
  }, []);

  if (!firebase) {
    return null;
  }

  return <FirebaseProvider {...firebase}>{children}</FirebaseProvider>;
}
