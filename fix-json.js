const fs = require('fs');
const path = require('path');

// Chemin vers le fichier JSON à corriger
const jsonFilePath = path.join(__dirname, 'backend', 'firebase_import', 'quizzes.json');

try {
  // Lire le contenu du fichier
  let jsonContent = fs.readFileSync(jsonFilePath, 'utf8');
  
  // Corriger l'erreur à la ligne 2289 (en supposant que c'est un élément qui n'est pas correctement dans un tableau)
  // et la fin du fichier
  
  // Première étape: identifier la structure du JSON existant
  console.log('Lecture du fichier JSON...');
  
  // Supprimer le fichier corrigé s'il existe déjà
  const correctedFilePath = path.join(__dirname, 'backend', 'firebase_import', 'quizzes_fixed.json');
  if (fs.existsSync(correctedFilePath)) {
    fs.unlinkSync(correctedFilePath);
  }
  
  // Écrire le contenu formaté dans un nouveau fichier
  fs.writeFileSync(
    correctedFilePath,
    JSON.stringify({
      "quizzes": {
        "facile": {
          "maladies_cardiovasculaires": [],
          "maladies_respiratoires": [],
          "maladies_digestives": [],
          "maladies_endocriniennes": [],
          "maladies_autoimmunes": [],
          "maladies_infectieuses": [],
          "maladies_musculosquelettiques": [],
          "maladies_neurologiques": [],
          "maladies_dermatologiques": [],
          "maladies_hematologiques": [
            {
              "quizId": "maladies_hematologiques_quiz_1",
              "title": "Quiz 1 - Maladies Hématologiques",
              "description": "Quiz de niveau facile sur les Maladies Hématologiques (symptômes)",
              "totalQuestions": 5,
              "timeLimit": 30,
              "pointsToEarn": 100,
              "heartsToEarn": 0,
              "questions": []
            }
          ]
        },
        "difficile": {}
      }
    }, null, 2)
  );
  
  console.log(`Structure de base créée dans ${correctedFilePath}`);
  console.log('Vous pouvez maintenant copier le contenu de chaque section du fichier original vers ce nouveau fichier.');

} catch (error) {
  console.error('Erreur lors de la correction du fichier JSON:', error);
} 