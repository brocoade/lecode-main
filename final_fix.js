const fs = require('fs');
const path = require('path');

// Chemins des fichiers
const sourcePath = path.join(__dirname, 'backend', 'firebase_import', 'quizzes.json');
const fixedPath = path.join(__dirname, 'backend', 'firebase_import', 'quizzes_final_fixed.json');

try {
  // Lire le fichier source complet
  const data = fs.readFileSync(sourcePath, 'utf8');
  
  // 1. Ajouter "maladies_hematologiques": [ avant le premier quiz d'hématologie
  let fixed = data.replace(
    /\],\s*\n\s*{(?=\s*"quizId":\s*"maladies_hematologiques_quiz_1")/,
    '],\n      "maladies_hematologiques": [\n  {'
  );
  
  // 2. Fermer la structure JSON correctement à la fin du fichier
  fixed = fixed.replace(
    /}(?=\s*\n\s*$)/,
    '}\n      ]\n    }\n  }\n}'
  );
  
  // Écrire le résultat dans un nouveau fichier
  fs.writeFileSync(fixedPath, fixed);
  
  console.log(`Correction terminée, résultat sauvegardé dans ${fixedPath}`);
  
  // Tenter de parser pour vérifier la validité
  try {
    JSON.parse(fixed);
    console.log('Le JSON est maintenant valide!');
  } catch (parseError) {
    console.error('Le JSON corrigé contient encore des erreurs:', parseError.message);
  }
  
} catch (error) {
  console.error('Erreur lors de la correction du fichier:', error);
} 