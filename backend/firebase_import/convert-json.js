// Script de conversion pour le fichier quizzes.json
const fs = require('fs');
const path = require('path');

try {
  console.log('Lecture du fichier quizzes.json...');
  const filePath = path.join(__dirname, 'quizzes.json');
  
  // Vérifier si le fichier existe
  if (!fs.existsSync(filePath)) {
    console.error(`Le fichier ${filePath} n'existe pas.`);
    process.exit(1);
  }
  
  // Lire et analyser le JSON
  const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  // Structure de destination
  let convertedData = {};
  
  console.log('Conversion du fichier...');
  
  // Si la structure est { quizzes: { ... } }
  if (jsonData.quizzes) {
    const quizzesData = jsonData.quizzes;
    
    // Parcourir les niveaux de difficulté
    for (const difficulty in quizzesData) {
      convertedData[difficulty] = {};
      
      // Si c'est un tableau, transformer en objet avec catégories
      if (Array.isArray(quizzesData[difficulty])) {
        const categoryId = `maladies_${difficulty}`;
        convertedData[difficulty][categoryId] = quizzesData[difficulty].map((quiz, index) => {
          return {
            ...quiz,
            id: `${categoryId}_quiz_${index + 1}`,
            index: index + 1
          };
        });
      } 
      // Si c'est un objet avec des catégories
      else {
        for (const categoryId in quizzesData[difficulty]) {
          // Vérifier si cette catégorie contient un tableau de quiz
          const categoryData = quizzesData[difficulty][categoryId];
          
          if (Array.isArray(categoryData)) {
            // Normaliser l'ID de catégorie
            const normalizedCategoryId = categoryId.startsWith('maladies_') 
              ? categoryId 
              : `maladies_${categoryId}`;
            
            convertedData[difficulty][normalizedCategoryId] = categoryData.map((quiz, index) => {
              return {
                ...quiz,
                id: `${normalizedCategoryId}_quiz_${index + 1}`,
                index: index + 1
              };
            });
          }
        }
      }
    }
  } 
  // Si la structure est directe
  else {
    convertedData = jsonData;
  }
  
  // Écrire le fichier converti
  const outputPath = path.join(__dirname, 'quizzes-converted.json');
  fs.writeFileSync(outputPath, JSON.stringify(convertedData, null, 2), 'utf8');
  
  console.log(`Conversion terminée. Fichier sauvegardé sous ${outputPath}`);
} catch (error) {
  console.error('Erreur lors de la conversion du fichier:', error);
} 