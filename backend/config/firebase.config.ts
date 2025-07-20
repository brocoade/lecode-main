import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDE8631Oby-MvXY2g_23mGaDCK-m9PyAwc",
  projectId: "meducare01-ea9c1",
  storageBucket: "meducare01-ea9c1.appspot.com",
  messagingSenderId: "584227175357",
  appId: "1:584227175357:android:809f9489d1646940aaf0d4"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Initialiser Authentication et Firestore
const auth = getAuth(app);
const db = getFirestore(app);

// Configuration de l'environnement pour le développement local
if (__DEV__) {
  console.log('Mode développement - désactivation des vérifications de sécurité strictes');
  
  // Autres configurations de développement si nécessaires
  // Par exemple, utiliser des émulateurs locaux Firebase
  // connectAuthEmulator(auth, 'http://localhost:9099');
  // connectFirestoreEmulator(db, 'localhost', 8080);
}

// Exporter les services Firebase
export const firebaseAuth = auth;
export const firebaseDB = db;

export default app;