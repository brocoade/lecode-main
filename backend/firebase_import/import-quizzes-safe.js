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

async function importQuizzesSafe() {
  try {
    console.log('🔍 Lecture du fichier quizzes.json...');
    const quizzesData = JSON.parse(fs.readFileSync(path.join(__dirname, 'quizzes.json'), 'utf8'));
    
    if (!quizzesData || !quizzesData.quizzes) {
      console.error('❌ Format de données invalide');
      return;
    }
    
    console.log('🚀 Début de l\'importation...');
    
    // Compter le nombre total de quiz
    let totalQuizzes = 0;
    let importedQuizzes = 0;
    
    // Pour chaque niveau de difficulté
    for (const [difficulty, categories] of Object.entries(quizzesData.quizzes)) {
      console.log(`📚 Traitement du niveau: ${difficulty}`);
      
      // Pour chaque catégorie
      for (const [categoryId, quizzes] of Object.entries(categories)) {
        console.log(`  📂 Catégorie: ${categoryId} (${quizzes.length} quiz)`);
        totalQuizzes += quizzes.length;
        
        // Pour chaque quiz
        for (const quiz of quizzes) {
          try {
            console.log(`    📝 Import du quiz: ${quiz.quizId}`);
            
            // Créer un document pour ce quiz
            const quizRef = db.collection('quizzes')
                             .doc(difficulty)
                             .collection(categoryId)
                             .doc(quiz.quizId);
            
            await quizRef.set(quiz);
            importedQuizzes++;
            console.log(`    ✅ Quiz ${quiz.quizId} importé avec succès`);
            
          } catch (error) {
            console.error(`    ❌ Erreur pour le quiz ${quiz.quizId}:`, error.message);
          }
        }
      }
    }
    
    console.log(`\n🎉 Importation terminée!`);
    console.log(`✅ ${importedQuizzes}/${totalQuizzes} quiz importés avec succès`);
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'importation:', error);
  }
}

// Exécuter l'importation
importQuizzesSafe()
  .then(() => {
    console.log('🏁 Script terminé');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });