import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
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

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

if (typeof window !== 'undefined') {
  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider('6LcZp8AtAAAAALD6N0LaqF3I14DzBirx1oFVJjPR'),
    isTokenAutoRefreshEnabled: true,
  });
}

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const firestore = getFirestore(app);