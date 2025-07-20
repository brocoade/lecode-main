const fs = require('fs');
const path = require('path');

// Chemin vers le fichier JSON à corriger
const jsonFilePath = path.join(__dirname, 'backend', 'firebase_import', 'quizzes.json');
const outputPath = path.join(__dirname, 'backend', 'firebase_import', 'quizzes_corrected.json');

try {
  // Lire le contenu du fichier
  let jsonContent = fs.readFileSync(jsonFilePath, 'utf8');
  
  // Trouver et corriger l'erreur autour de la ligne 2289
  // Rechercher le motif problématique "],\n\n  {" qui indique un élément qui devrait être dans un tableau
  let corrected = jsonContent.replace(/],\s*\n\s*{(?=\s*"quizId": "maladies_hematologiques_quiz_1")/, '],\n      "maladies_hematologiques": [\n  {');
  
  // Ajouter la fermeture du tableau à la fin
  corrected = corrected.replace(/}(?=\s*\n\s*$)/, '}\n      ]\n    }\n  }\n}');
  
  // Écrire le contenu corrigé dans un nouveau fichier
  fs.writeFileSync(outputPath, corrected);
  
  console.log(`Correction terminée. Fichier sauvegardé sous ${outputPath}`);
  
} catch (error) {
  console.error('Erreur lors de la correction du fichier JSON:', error);
} 