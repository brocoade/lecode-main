const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set } = require('firebase/database');
const fs = require('fs');
const path = require('path');

// Configuration Firebase
const firebaseConfig = {
  // Ajoutez votre configuration Firebase ici
  // apiKey, authDomain, databaseURL, projectId, storageBucket, messagingSenderId, appId
};

// Chemin vers le fichier JSON corrigé
const jsonPath = path.join(__dirname, 'backend', 'firebase_import', 'quizzes_line_747_fixed.json');

async function uploadToFirebase() {
  try {
    // Initialiser Firebase
    const app = initializeApp(firebaseConfig);
    const db = getDatabase(app);
    
    // Lire le fichier JSON
    console.log('Lecture du fichier JSON...');
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    // Télécharger les données vers Firebase
    console.log('Envoi des données vers Firebase...');
    await set(ref(db, 'quizzes'), jsonData.quizzes);
    
    console.log('Téléchargement terminé avec succès!');
    
  } catch (error) {
    console.error('Erreur lors de l\'upload vers Firebase:', error);
  }
}

// Exécuter le script
uploadToFirebase(); 