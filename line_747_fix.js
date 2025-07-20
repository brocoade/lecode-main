const fs = require('fs');
const path = require('path');

// Chemins des fichiers
const sourcePath = path.join(__dirname, 'backend', 'firebase_import', 'quizzes.json');
const fixedPath = path.join(__dirname, 'backend', 'firebase_import', 'quizzes_line_747_fixed.json');

try {
  // Lire le fichier source complet ligne par ligne
  const lines = fs.readFileSync(sourcePath, 'utf8').split('\n');
  
  // Chercher et corriger la ligne problématique
  let fixedLines = [];
  let lineNumber = 0;
  
  for (const line of lines) {
    lineNumber++;
    
    // Correction spécifique de la ligne 747
    if (lineNumber === 747 && line.trim() === '{') {
      // C'est probablement le début d'un nouvel objet au lieu d'une propriété
      // Ajouter une propriété "options": [ avant
      fixedLines.push('              "options": [');
      fixedLines.push('                "Toux", "Diarrhée chronique", "Déshydratation", "Trouble auditif"');
      fixedLines.push('              ],');
      fixedLines.push('              "correctAnswer": "Diarrhée chronique",');
      fixedLines.push('              "explanation": "Une colite non traitée peut entraîner une diarrhée chronique qui provoque une déshydratation.",');
      fixedLines.push('              "points": 20');
      fixedLines.push('            }');
      fixedLines.push('          ]');
      fixedLines.push('        }');
      fixedLines.push('      ],');
    }
    // Correction pour les enregistrements maladies_hematologiques
    else if (lineNumber === 3035 && line.trim() === '{') {
      fixedLines.push('      "maladies_hematologiques": [');
      fixedLines.push('        {');
    }
    // Ajouter la fermeture du JSON
    else if (lineNumber === lines.length && !line.includes('}}')) {
      fixedLines.push(line);
      if (!line.trim().endsWith('}')) {
        fixedLines.push('      ]');
        fixedLines.push('    }');
        fixedLines.push('  }');
        fixedLines.push('}');
      }
    }
    // Ajouter les autres lignes telles quelles
    else {
      fixedLines.push(line);
    }
  }
  
  // Écrire le fichier corrigé
  fs.writeFileSync(fixedPath, fixedLines.join('\n'));
  
  console.log(`Correction terminée, résultat sauvegardé dans ${fixedPath}`);
  
  // Tenter de parser pour vérifier la validité
  try {
    JSON.parse(fs.readFileSync(fixedPath, 'utf8'));
    console.log('Le JSON est maintenant valide!');
  } catch (parseError) {
    console.error('Le JSON corrigé contient encore des erreurs:', parseError.message);
  }
  
} catch (error) {
  console.error('Erreur lors de la correction du fichier:', error);
} 