// Script d'analyse du fichier quizzes.json
const fs = require('fs');
const path = require('path');

// Fonction pour analyser la structure d'un objet de manière récursive
function analyzeStructure(data, depth = 0, maxDepth = 3, currentPath = '') {
  const indent = '  '.repeat(depth);
  
  if (depth >= maxDepth) {
    return `${indent}[Profondeur max atteinte]`;
  }
  
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return `${indent}[] (tableau vide)`;
    }
    
    // Analyser le premier élément pour exemple
    const firstItem = data[0];
    let firstItemStr;
    
    if (typeof firstItem === 'object' && firstItem !== null) {
      firstItemStr = `\n${analyzeStructure(firstItem, depth + 1, maxDepth, `${currentPath}[0]`)}`;
    } else {
      firstItemStr = JSON.stringify(firstItem);
    }
    
    return `${indent}Array[${data.length}] Premier élément: ${firstItemStr}`;
  }
  
  if (typeof data === 'object' && data !== null) {
    const keys = Object.keys(data);
    
    if (keys.length === 0) {
      return `${indent}{} (objet vide)`;
    }
    
    let result = `${indent}{\n`;
    
    for (const key of keys) {
      const value = data[key];
      const newPath = currentPath ? `${currentPath}.${key}` : key;
      
      result += `${indent}  "${key}": `;
      
      if (typeof value === 'object' && value !== null) {
        result += `\n${analyzeStructure(value, depth + 1, maxDepth, newPath)}`;
      } else {
        result += JSON.stringify(value);
      }
      
      result += ',\n';
    }
    
    result += `${indent}}`;
    return result;
  }
  
  return `${indent}${JSON.stringify(data)}`;
}

try {
  console.log('Lecture du fichier quizzes.json...');
  const filePath = path.join(__dirname, 'quizzes.json');
  
  // Vérifier si le fichier existe
  if (!fs.existsSync(filePath)) {
    console.error(`Le fichier ${filePath} n'existe pas.`);
    process.exit(1);
  }
  
  // Afficher la taille du fichier
  const stats = fs.statSync(filePath);
  console.log(`Taille du fichier: ${(stats.size / 1024).toFixed(2)} KB`);
  
  // Lire et analyser le JSON
  const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  console.log('\nStructure du fichier:');
  console.log(analyzeStructure(jsonData));
  
  // Afficher les premières clés
  console.log('\nClés principales:');
  console.log(Object.keys(jsonData));
  
} catch (error) {
  console.error('Erreur lors de l\'analyse du fichier:', error);
} 