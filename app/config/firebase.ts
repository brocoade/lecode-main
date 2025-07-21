import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyDE8631Oby-MvXY2g_23mGaDCK-m9PyAwc",
  authDomain: "meducare01-ea9c1.firebaseapp.com",
  projectId: "meducare01-ea9c1",
  storageBucket: "meducare01-ea9c1.appspot.com",
  messagingSenderId: "584227175357",
  appId: "1:584227175357:android:809f9489d1646940aaf0d4"
};

let app;
let auth;

// Initialiser Firebase seulement s'il n'est pas déjà initialisé
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  // Initialiser Auth avec AsyncStorage pour la persistance
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} else {
  app = getApp();
  auth = getAuth(app);
}

// Obtenir le service Firestore
const firestore = getFirestore(app);

export { auth, firestore };
export default app; 