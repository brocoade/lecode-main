// Script d'importation du fichier quizzes-converted.json
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Chemin vers le fichier de configuration Firebase
const serviceAccount = require('../config/serviceAccountKey.json');

// Initialiser l'application Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function importQuizzes() {
  try {
    console.log('Lecture du fichier quizzes-converted.json...');
    const quizzesData = JSON.parse(fs.readFileSync(path.join(__dirname, 'quizzes-converted.json'), 'utf8'));
    
    // Compter le nombre total de quiz
    let totalQuizzes = 0;
    let importedQuizzes = 0;
    
    // Vérifier la structure des données
    console.log('Structure des données:');
    for (const difficulty in quizzesData) {
      console.log(`- Difficulté: ${difficulty}`);
      for (const categoryId in quizzesData[difficulty]) {
        const quizzes = quizzesData[difficulty][categoryId];
        console.log(`  - Catégorie: ${categoryId} (${quizzes.length} quiz)`);
        totalQuizzes += quizzes.length;
      }
    }
    
    // Confirmation avant import
    console.log(`\nDébut de l'importation de ${totalQuizzes} quiz...`);
    
    // Importer chaque quiz dans la bonne collection
    for (const difficulty in quizzesData) {
      for (const categoryId in quizzesData[difficulty]) {
        const quizzes = quizzesData[difficulty][categoryId];
        console.log(`Import de ${quizzes.length} quiz pour ${difficulty}/${categoryId}...`);
        
        // Créer ou mettre à jour chaque quiz
        for (const quiz of quizzes) {
          const quizId = quiz.id || `${categoryId}_quiz_${quiz.index || 1}`;
          console.log(`  - Import du quiz: ${quizId}`);
          
          // Créer la référence à la collection et au document
          const quizRef = db.collection('quizzes')
                           .doc(difficulty)
                           .collection(categoryId)
                           .doc(quizId);
          
          // Enregistrer le quiz
          await quizRef.set(quiz);
          importedQuizzes++;
        }
      }
    }
    
    console.log(`\nImportation terminée avec succès! ${importedQuizzes}/${totalQuizzes} quiz importés.`);
  } catch (error) {
    console.error('Erreur lors de l\'importation:', error);
  }
}

// Exécuter l'importation
importQuizzes()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  }); 