import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAuth } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getReactNativePersistence } from '@react-native-firebase/auth';

// Configuration Firebase
const firebaseConfig = {
  // Votre configuration Firebase ici
  apiKey: "VOTRE_API_KEY",
  authDomain: "VOTRE_AUTH_DOMAIN",
  projectId: "VOTRE_PROJECT_ID",
  storageBucket: "VOTRE_STORAGE_BUCKET",
  messagingSenderId: "VOTRE_MESSAGING_SENDER_ID",
  appId: "VOTRE_APP_ID"
};

// Initialiser Firebase
export const firebaseApp = initializeApp(firebaseConfig);

// Configurer l'authentification avec la persistance pour React Native
export const auth = initializeAuth(firebaseApp, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Obtenir une référence à Firestore
const db = getFirestore(firebaseApp);

// Exporter l'instance Firestore
export default db; 