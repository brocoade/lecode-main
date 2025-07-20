/**
 * Script pour traiter les questions existantes et les convertir au format Firebase
 * 
 * Ce script va :
 * 1. Parcourir toutes les questions dans backend/questions_organisees
 * 2. Les convertir au format défini pour Firebase
 * 3. Générer un fichier quizzes.json prêt à être importé dans Firebase
 */

const fs = require('fs');
const path = require('path');

// Répertoire de base des questions
const BASE_DIR = path.join(__dirname, '..', 'questions_organisees');
// Répertoire de sortie
const OUTPUT_DIR = path.join(__dirname, '..', 'firebase_import');

// Assurez-vous que le répertoire de sortie existe
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
}

// Structure de données pour Firebase
const firebaseData = {
  quizzes: {}
};

// Liste des difficultés
const difficulties = ['Facile', 'Moyen', 'Difficile'];

// Nombre de questions par quiz selon la difficulté
const questionsPerQuiz = {
  'Facile': 5,
  'Moyen': 7,
  'Difficile': 10
};

// Points par question selon la difficulté
const pointsPerQuestion = {
  'Facile': 20,
  'Moyen': 25,
  'Difficile': 30
};

// Limite de temps par question selon la difficulté (en secondes)
const timePerQuestion = {
  'Facile': 30,
  'Moyen': 25,
  'Difficile': 20
};

/**
 * Traite les questions d'une catégorie et difficulté
 */
function processCategory(difficultyDir, categoryDir) {
  const difficulty = path.basename(difficultyDir).toLowerCase();
  const category = path.basename(categoryDir);
  
  // Extraire l'identifiant de la catégorie
  const categoryId = getCategoryId(category);
  
  // S'assurer que cette difficulté existe dans notre structure
  if (!firebaseData.quizzes[difficulty]) {
    firebaseData.quizzes[difficulty] = {};
  }
  
  // S'assurer que cette catégorie existe dans notre structure
  if (!firebaseData.quizzes[difficulty][categoryId]) {
    firebaseData.quizzes[difficulty][categoryId] = [];
  }
  
  // Lire les fichiers JSON de la catégorie
  const files = fs.readdirSync(categoryDir);
  
  files.forEach(file => {
    if (path.extname(file) === '.json') {
      const filePath = path.join(categoryDir, file);
      const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      // Traiter les questions
      processQuestions(fileData, difficulty, categoryId);
    }
  });
}

/**
 * Traite les questions d'un fichier et les organise en quiz
 */
function processQuestions(fileData, difficulty, categoryId) {
  const questions = fileData.questions;
  
  // Organiser les questions par quiz
  const maxQuestionsPerQuiz = questionsPerQuiz[capitalizeFirstLetter(difficulty)];
  const pointsPerQ = pointsPerQuestion[capitalizeFirstLetter(difficulty)];
  const timeLimit = timePerQuestion[capitalizeFirstLetter(difficulty)];
  
  // Calculer le nombre total de quiz nécessaires
  const totalQuizzes = Math.ceil(questions.length / maxQuestionsPerQuiz);
  
  for (let i = 0; i < totalQuizzes; i++) {
    // Prendre un sous-ensemble de questions pour ce quiz
    const startIdx = i * maxQuestionsPerQuiz;
    const endIdx = Math.min(startIdx + maxQuestionsPerQuiz, questions.length);
    const quizQuestions = questions.slice(startIdx, endIdx);
    
    // S'il n'y a pas assez de questions pour compléter le quiz, continuer avec ce qu'on a
    if (quizQuestions.length === 0) continue;
    
    // Créer l'objet quiz
    const quiz = {
      quizId: `${categoryId}_quiz_${i + 1}`,
      title: `Quiz ${i + 1} - ${fileData.categorie.replace(/^.*?\s/, '')}`,
      description: `Quiz de niveau ${capitalizeFirstLetter(difficulty)} sur les ${fileData.categorie.replace(/^.*?\s/, '')}`,
      totalQuestions: quizQuestions.length,
      timeLimit: timeLimit,
      pointsToEarn: quizQuestions.length * pointsPerQ,
      heartsToEarn: Math.floor((quizQuestions.length * pointsPerQ) / 300),
      questions: quizQuestions.map((q, idx) => ({
        id: `q_${idx + 1}`,
        question: q.question,
        options: q.options,
        correctAnswer: q.reponse_correcte,
        explanation: q.explication,
        points: pointsPerQ
      }))
    };
    
    // Ajouter le quiz à la structure
    firebaseData.quizzes[difficulty][categoryId].push(quiz);
  }
}

/**
 * Extrait un identifiant de catégorie du nom complet
 */
function getCategoryId(fullCategoryName) {
  // Enlever l'emoji et les espaces
  const cleanName = fullCategoryName.replace(/^.*?\s/, '').toLowerCase();
  // Convertir en format snake_case sans caractères spéciaux
  return cleanName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

/**
 * Capitalize la première lettre d'une chaîne
 */
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Parcourt les dossiers pour traiter toutes les questions
 */
function processAllQuestions() {
  // Parcourir les difficultés
  difficulties.forEach(difficulty => {
    const difficultyPath = path.join(BASE_DIR, difficulty);
    
    if (fs.existsSync(difficultyPath) && fs.statSync(difficultyPath).isDirectory()) {
      // Parcourir les catégories de cette difficulté
      const categories = fs.readdirSync(difficultyPath);
      
      categories.forEach(category => {
        const categoryPath = path.join(difficultyPath, category);
        
        if (fs.statSync(categoryPath).isDirectory()) {
          processCategory(difficultyPath, categoryPath);
        }
      });
    }
  });
  
  // Écrire les données transformées dans un fichier JSON
  const outputPath = path.join(OUTPUT_DIR, 'quizzes.json');
  fs.writeFileSync(outputPath, JSON.stringify(firebaseData, null, 2), 'utf8');
  
  console.log(`Traitement terminé. Le fichier a été généré à : ${outputPath}`);
}

// Exécuter le script
processAllQuestions(); 