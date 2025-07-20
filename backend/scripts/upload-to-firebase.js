/**
 * Script pour importer les données transformées dans Firebase
 * 
 * Ce script va :
 * 1. Lire le fichier quizzes.json généré
 * 2. Uploader les données vers Firebase
 */

const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getFirestore, setDoc, doc, collection } = require('firebase/firestore');

// Chemin du fichier JSON
const JSON_FILE_PATH = path.join(__dirname, '..', 'firebase_import', 'quizzes.json');

// Configuration Firebase (à remplacer par vos propres valeurs)
const firebaseConfig = {
  apiKey: "AIzaSyDE8631Oby-MvXY2g_23mGaDCK-m9PyAwc",
  projectId: "meducare01-ea9c1",
  storageBucket: "meducare01-ea9c1.firebasestorage.app",
  messagingSenderId: "584227175357",
  appId: "1:584227175357:android:809f9489d1646940aaf0d4"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Upload les données vers Firebase
 */
async function uploadToFirebase() {
  try {
    // Lire le fichier JSON
    const jsonData = require(JSON_FILE_PATH);
    
    if (!jsonData || !jsonData.quizzes) {
      console.error("Format de données invalide");
      return;
    }
    
    // Pour chaque niveau de difficulté
    for (const [difficulty, categories] of Object.entries(jsonData.quizzes)) {
      console.log(`Traitement du niveau: ${difficulty}`);
      
      // Pour chaque catégorie
      for (const [categoryId, quizzes] of Object.entries(categories)) {
        console.log(`  Catégorie: ${categoryId}`);
        
        // Pour chaque quiz
        for (const quiz of quizzes) {
          console.log(`    Quiz: ${quiz.quizId}`);
          
          // Créer un document pour ce quiz
          const quizRef = doc(collection(db, `quizzes/${difficulty}/${categoryId}`), quiz.quizId);
          await setDoc(quizRef, quiz);
          console.log(`    ✅ Quiz ${quiz.quizId} importé avec succès`);
        }
      }
    }
    
    console.log("✨ Importation terminée avec succès");
  } catch (error) {
    console.error("Erreur lors de l'importation dans Firebase", error);
  }
}

// Exécuter l'upload
uploadToFirebase(); 