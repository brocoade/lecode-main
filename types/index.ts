// Types pour les catégories
export interface Category {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  progress: number;
  levels: number;
}

// Types pour les objectifs du jour
export interface DailyObjective {
  id: string;
  title: string;
  completed: boolean;
}

// Types pour les quiz
export interface Quiz {
  id: string;
  title: string;
  category: string;
  level: number;
  questions: Question[];
  completed: boolean;
  score?: number;
}

export interface Question {
  id: string;
  text: string;
  options: Option[];
  correctOptionId: string;
  explanation: string;
}

export interface Option {
  id: string;
  text: string;
}

// Types pour le profil utilisateur
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  level: number;
  xp: number;
  stars: number;
  hearts: number;
  completedCategories: string[];
  completedQuizzes: string[];
}

// Types pour les statistiques
export interface UserStats {
  totalXp: number;
  quizzesCompleted: number;
  correctAnswers: number;
  incorrectAnswers: number;
  streakDays: number;
  categoryProgress: Record<string, number>;
} 