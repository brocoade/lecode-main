const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set } = require('firebase/database');

// Configuration Firebase
const firebaseConfig = {
  // Ajoutez votre configuration Firebase ici
  apiKey: "VOTRE_API_KEY",
  authDomain: "VOTRE_PROJET.firebaseapp.com",
  databaseURL: "https://VOTRE_PROJET.firebaseio.com",
  projectId: "VOTRE_PROJET",
  storageBucket: "VOTRE_PROJET.appspot.com",
  messagingSenderId: "VOTRE_MESSAGING_SENDER_ID",
  appId: "VOTRE_APP_ID"
};

// Chemins des fichiers
const sourcePath = path.join(__dirname, 'backend', 'firebase_import', 'quizzes.json');
const fixedPath = path.join(__dirname, 'backend', 'firebase_import', 'quizzes_fixed_final.json');

async function correctAndUpload() {
  try {
    // Lire le contenu du fichier
    console.log('Lecture du fichier JSON source...');
    let content = fs.readFileSync(sourcePath, 'utf8');
    
    // Corriger l'erreur à la ligne 747 (options manquantes)
    console.log('Application des corrections...');
    content = content.replace(/{(\s*)"quizId": "maladies_hematologiques_quiz_1"/, 
      ',"maladies_hematologiques": [\n        {\n          "quizId": "maladies_hematologiques_quiz_1"');
    
    // Fermer correctement le fichier JSON
    if (!content.endsWith('}')) {
      content = content.replace(/}(\s*)$/, '}\n      ]\n    }\n  }\n}');
    }
    
    // Écrire le contenu corrigé
    fs.writeFileSync(fixedPath, content);
    
    // Vérifier la validité du JSON
    try {
      const jsonData = JSON.parse(content);
      console.log('Le JSON corrigé est valide!');
      
      // Initialiser Firebase
      console.log('Initialisation de Firebase...');
      const app = initializeApp(firebaseConfig);
      const db = getDatabase(app);
      
      // Envoyer les données
      console.log('Envoi des données vers Firebase...');
      await set(ref(db, 'quizzes'), jsonData.quizzes);
      
      console.log('Les données ont été mises à jour avec succès dans Firebase!');
      
    } catch (parseError) {
      console.error('Erreur de parsing JSON:', parseError);
      console.error('Le fichier corrigé est sauvegardé dans', fixedPath);
    }
    
  } catch (error) {
    console.error('Erreur lors de la correction ou de l\'upload:', error);
  }
}

// Exécuter le script
correctAndUpload(); 