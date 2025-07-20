import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBZrwCbEz5aYpW-6SDHtmxEG5s_kEZ6mLk",
  authDomain: "meducare-b3e95.firebaseapp.com",
  projectId: "meducare-b3e95",
  storageBucket: "meducare-b3e95.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef0123456789"
};

let app;
// Initialiser Firebase seulement s'il n'est pas déjà initialisé
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Obtenir les services Auth et Firestore
const auth = getAuth(app);
const firestore = getFirestore(app);

export { auth, firestore };
export default app; 