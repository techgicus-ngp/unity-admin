import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { env, missingEnv } from './env';

// Don't initialise with an incomplete config - main.jsx shows a setup screen.
const app = missingEnv.length ? null : initializeApp(env.firebase);

export const db = app ? getFirestore(app) : null;

// Storage is only needed on the gallery page, so it is loaded on demand to
// keep it out of the main bundle.
let storagePromise;
export const getStorageInstance = () => {
  storagePromise ??= import('firebase/storage').then((m) => ({
    storage: m.getStorage(app),
    ...m,
  }));
  return storagePromise;
};
