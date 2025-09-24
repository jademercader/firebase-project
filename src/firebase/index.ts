import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

export * from './provider';

let firebaseApp: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

// Initialize Firebase
// The check for getApps prevents re-initializing the app on hot reloads.
if (getApps().length === 0) {
  firebaseApp = initializeApp(firebaseConfig);
} else {
  firebaseApp = getApps()[0];
}

auth = getAuth(firebaseApp);
firestore = getFirestore(firebaseApp);

export function initializeFirebase() {
  return {
    firebaseApp,
    auth,
    firestore,
  };
}
