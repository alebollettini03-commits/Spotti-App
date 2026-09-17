import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';

const firebaseConfig = {
  apiKey: 'AIzaSyA8KUSZtbCNObXbvptC5jv476U_-VV2zSc',
  authDomain: 'spotly-6ae5c.firebaseapp.com',
  projectId: 'spotly-6ae5c',
  storageBucket: 'spotly-6ae5c.firebasestorage.app',
  messagingSenderId: '207269639614',
  appId: '1:207269639614:web:d28a05a80db8de40c675ef',
};

// Inizializzazione sicura dell'App
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Inizializzazione Auth e Firestore
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const firestore = getFirestore(app);

// Configurazione Google Auth Provider
googleProvider.setCustomParameters({
  prompt: 'select_account' // Forza la selezione dell'account a ogni login
});

// Impostazione della persistenza della sessione
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error("Errore nell'impostazione della persistenza:", error);
  });

  // App Check con gestione degli errori
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider('6LcZp8AtAAAAALD6N0LaqF3I14DzBirx1oFVJjPR'),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (error) {
    console.warn("Inizializzazione App Check fallita o già attiva:", error);
  }
}