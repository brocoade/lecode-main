/**
 * Types pour les quiz et questions
 */

// Interface pour une question de quiz
export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  points: number;
}

// Interface pour un quiz complet
export interface Quiz {
  quizId: string;
  title: string;
  description: string;
  totalQuestions: number;
  timeLimit: number;
  pointsToEarn: number;
  heartsToEarn: number;
  questions: Question[];
}

// Interface pour une catégorie
export interface Category {
  id: string;
  name: string;
  emoji: string;
}

// Interface pour les données de progression d'un quiz
export interface QuizAttempt {
  quizId: string;
  categoryId: string;
  difficulty: string;
  score: number;
  earnedPoints: number;
  earnedHearts: number;
  completedAt: Date | number;
  answers: {
    questionId: string;
    selectedAnswer: string;
    correct: boolean;
    timeSpent: number;
  }[];
}

// Interface pour les résultats d'un quiz
export interface QuizResult {
  totalPoints: number;
  earnedPoints: number;
  correctAnswers: number;
  wrongAnswers: number;
  timeBonus: number;
  heartsEarned: number;
  details: {
    questionId: string;
    isCorrect: boolean;
    basePoints: number;
    timeBonus: number;
    pointsEarned: number;
    userAnswer: string;
    correctAnswer: string;
  }[];
}

// Interface pour la progression d'une catégorie
export interface CategoryProgress {
  completed: boolean;
  progress: number;
  bestScore: number;
  attemptsCount: number;
}

// Interface pour les réponses utilisateur à un quiz
export interface UserAnswers {
  [questionId: string]: string;
}

// Interface pour le temps passé sur chaque question
export interface TimeSpent {
  [questionId: string]: number;
}
