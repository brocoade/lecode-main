import { ProgressService, UserProgress, CategoryProgress, DifficultyProgress } from './progress.service';
import { streakService } from './streakService';
import { HeartsService } from './hearts.service';
import { firebaseAuth, firebaseDB } from '@/backend/config/firebase.config';
import { doc, getDoc, setDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

// Interfaces pour les statistiques
export interface CategoryStats {
  categoryId: string;
  categoryName: string;
  totalQuizzes: number;
  completedQuizzes: number;
  averageScore: number;
  bestScore: number;
  averageTime: number; // en minutes
  progressPercentage: number;
  weakPoints: string[]; // Sujets où l'utilisateur a des difficultés
  lastActivity: Date | null;
}

export interface DifficultyStats {
  difficulty: 'facile' | 'moyen' | 'difficile';
  totalQuizzes: number;
  completedQuizzes: number;
  averageScore: number;
  progressPercentage: number;
  categories: CategoryStats[];
  unlocked: boolean;
}

export interface PerformanceStats {
  totalQuizzesCompleted: number;
  totalTimeSpent: number; // en minutes
  averageScore: number;
  averageTimePerQuiz: number; // en minutes
  bestStreak: number;
  currentStreak: number;
  totalXP: number;
  heartsCount: number;
  accuracyTrend: number[]; // Évolution de la précision sur les 30 derniers jours
  activityData: WeeklyActivity[];
}

export interface WeeklyActivity {
  date: string; // Format YYYY-MM-DD
  quizCount: number;
  totalScore: number;
  averageScore: number;
  timeSpent: number; // en minutes
}

export interface SessionHistory {
  sessionId: string;
  date: Date;
  duration: number; // en minutes
  quizzesCompleted: number;
  averageScore: number;
  categoriesStudied: string[];
  xpGained: number;
}

export interface UserGoal {
  id: string;
  type: 'streak' | 'daily_quizzes' | 'category_completion' | 'score_improvement';
  title: string;
  description: string;
  target: number;
  current: number;
  deadline?: Date;
  completed: boolean;
  createdAt: Date;
}

export interface ComparisonStats {
  userRank: number;
  totalUsers: number;
  percentile: number;
  averageUserScore: number;
  userScore: number;
  averageUserStreak: number;
  userStreak: number;
}

export interface LeaderboardEntry {
  rank: number;
  username: string; // Anonymisé
  score: number;
  streak: number;
  isCurrentUser?: boolean;
  badge?: string;
}

export interface LeaderboardData {
  topEntries: LeaderboardEntry[];
  currentUserEntry?: LeaderboardEntry;
  period: 'week' | 'month' | 'all-time';
  lastUpdated: Date;
}

export class StatisticsService {
  private static instance: StatisticsService;
  private progressService = new ProgressService();

  public static getInstance(): StatisticsService {
    if (!StatisticsService.instance) {
      StatisticsService.instance = new StatisticsService();
    }
    return StatisticsService.instance;
  }

  /**
   * Récupère les statistiques de performance globales de l'utilisateur
   */
  async getPerformanceStats(): Promise<PerformanceStats> {
    const user = firebaseAuth.currentUser;
    if (!user) throw new Error('Utilisateur non connecté');

    try {
      // Récupérer les données de progression
      const userProgress = await this.progressService.getUserProgress();
      if (!userProgress) {
        throw new Error('Impossible de récupérer les données de progression de l\'utilisateur');
      }

      // Récupérer les données de streak
      const streakData = await streakService.getStreak(user.uid);

      // Récupérer les données de cœurs
      const heartsService = new HeartsService();
      const heartInfo = await heartsService.getHeartInfo();

      // Calculer les statistiques globales
      let totalQuizzesCompleted = 0;
      let totalScore = 0;
      let totalTimeSpent = 0;

      userProgress.difficulties.forEach(difficulty => {
        difficulty.categories.forEach(category => {
          category.quizzes.forEach(quiz => {
            if (quiz.completed) {
              totalQuizzesCompleted++;
              totalScore += quiz.score;
              // Estimation du temps basée sur la difficulté (à améliorer avec de vraies données)
              totalTimeSpent += this.estimateQuizTime(difficulty.difficulty);
            }
          });
        });
      });

      const averageScore = totalQuizzesCompleted > 0 ? totalScore / totalQuizzesCompleted : 0;
      const averageTimePerQuiz = totalQuizzesCompleted > 0 ? totalTimeSpent / totalQuizzesCompleted : 0;

      // Générer les données d'activité hebdomadaire (à améliorer avec de vraies données)
      const activityData = await this.generateWeeklyActivity();

      // Générer la tendance de précision (à améliorer avec de vraies données)
      const accuracyTrend = this.generateAccuracyTrend(averageScore);

      return {
        totalQuizzesCompleted,
        totalTimeSpent,
        averageScore: Math.round(averageScore),
        averageTimePerQuiz: Math.round(averageTimePerQuiz * 10) / 10,
        bestStreak: streakData.highestStreak,
        currentStreak: streakData.currentStreak,
        totalXP: userProgress.totalXP,
        heartsCount: heartInfo?.remainingHearts || 0,
        accuracyTrend,
        activityData
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques de performance:', error);
      throw error;
    }
  }

  /**
   * Récupère les statistiques détaillées par difficulté
   */
  async getDifficultyStats(): Promise<DifficultyStats[]> {
    const userProgress = await this.progressService.getUserProgress();
    if (!userProgress) {
      return [];
    }

    return userProgress.difficulties.map(difficulty => ({
      difficulty: difficulty.difficulty,
      totalQuizzes: difficulty.totalCount,
      completedQuizzes: difficulty.completedCount,
      averageScore: this.calculateDifficultyAverageScore(difficulty),
      progressPercentage: difficulty.progress,
      categories: this.mapCategoriesToStats(difficulty.categories),
      unlocked: difficulty.unlocked
    }));
  }

  /**
   * Récupère les statistiques détaillées par catégorie
   */
  async getCategoryStats(difficulty?: string): Promise<CategoryStats[]> {
    const userProgress = await this.progressService.getUserProgress();
    if (!userProgress) {
      return [];
    }

    let allCategories: CategoryProgress[] = [];

    if (difficulty) {
      const difficultyData = userProgress.difficulties.find(d => d.difficulty === difficulty);
      if (difficultyData) {
        allCategories = difficultyData.categories;
      }
    } else {
      // Combiner toutes les catégories de toutes les difficultés
      userProgress.difficulties.forEach(diff => {
        allCategories = allCategories.concat(diff.categories);
      });
    }

    return this.mapCategoriesToStats(allCategories);
  }

  /**
   * Récupère l'historique des sessions d'apprentissage
   */
  async getSessionHistory(limit: number = 10): Promise<SessionHistory[]> {
    const user = firebaseAuth.currentUser;
    if (!user) throw new Error('Utilisateur non connecté');

    try {
      // Pour l'instant, générer des données simulées
      // À remplacer par de vraies données stockées lors des sessions
      return this.generateSessionHistory(limit);
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique des sessions:', error);
      return [];
    }
  }

  /**
   * Récupère les objectifs de l'utilisateur
   */
  async getUserGoals(): Promise<UserGoal[]> {
    const user = firebaseAuth.currentUser;
    if (!user) throw new Error('Utilisateur non connecté');

    try {
      const goalsRef = doc(firebaseDB, 'userGoals', user.uid);
      const goalsDoc = await getDoc(goalsRef);

      if (goalsDoc.exists()) {
        const data = goalsDoc.data();
        return data.goals || [];
      }

      // Créer des objectifs par défaut pour un nouvel utilisateur
      const defaultGoals = await this.createDefaultGoals();
      await setDoc(goalsRef, { goals: defaultGoals });
      return defaultGoals;
    } catch (error) {
      console.error('Erreur lors de la récupération des objectifs:', error);
      return [];
    }
  }

  /**
   * Met à jour un objectif utilisateur
   */
  async updateUserGoal(goalId: string, updates: Partial<UserGoal>): Promise<void> {
    const user = firebaseAuth.currentUser;
    if (!user) throw new Error('Utilisateur non connecté');

    try {
      const goals = await this.getUserGoals();
      const goalIndex = goals.findIndex(g => g.id === goalId);
      
      if (goalIndex !== -1) {
        goals[goalIndex] = { ...goals[goalIndex], ...updates };
        
        const goalsRef = doc(firebaseDB, 'userGoals', user.uid);
        await setDoc(goalsRef, { goals });
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'objectif:', error);
      throw error;
    }
  }

  /**
   * Récupère les statistiques de comparaison avec les autres utilisateurs
   */
  async getComparisonStats(): Promise<ComparisonStats> {
    // Pour l'instant, retourner des données simulées
    // À implémenter avec de vraies données agrégées
    const performanceStats = await this.getPerformanceStats();

    return {
      userRank: Math.floor(Math.random() * 1000) + 1,
      totalUsers: 5000,
      percentile: Math.floor(Math.random() * 100) + 1,
      averageUserScore: 75,
      userScore: performanceStats.averageScore,
      averageUserStreak: 7,
      userStreak: performanceStats.currentStreak
    };
  }

  /**
   * Récupère les points faibles globaux de l'utilisateur
   */
  async getWeakPoints(): Promise<Array<{
    categoryName: string;
    issues: string[];
    averageScore: number;
    recommendedAction: string;
  }>> {
    const categoryStats = await this.getCategoryStats();

    return categoryStats
      .filter(category => category.averageScore < 80 && category.weakPoints.length > 0)
      .map(category => ({
        categoryName: category.categoryName,
        issues: category.weakPoints,
        averageScore: category.averageScore,
        recommendedAction: this.getRecommendedAction(category.categoryId, category.averageScore)
      }))
      .sort((a, b) => a.averageScore - b.averageScore) // Trier par score croissant
      .slice(0, 5); // Limiter à 5 points faibles
  }

  /**
   * Récupère les données du leaderboard
   */
  async getLeaderboard(period: 'week' | 'month' | 'all-time' = 'week'): Promise<LeaderboardData> {
    const user = firebaseAuth.currentUser;
    if (!user) throw new Error('Utilisateur non connecté');

    try {
      // Pour l'instant, générer des données simulées
      // À remplacer par de vraies données agrégées depuis Firebase
      const performanceStats = await this.getPerformanceStats();

      const topEntries = this.generateLeaderboardEntries(performanceStats, period);
      const currentUserEntry = this.generateCurrentUserEntry(performanceStats);

      return {
        topEntries,
        currentUserEntry,
        period,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Erreur lors de la récupération du leaderboard:', error);
      throw error;
    }
  }

  /**
   * Génère des entrées de leaderboard simulées
   */
  private generateLeaderboardEntries(userStats: PerformanceStats, period: string): LeaderboardEntry[] {
    const entries: LeaderboardEntry[] = [];
    const usernames = [
      'MedStudent2024', 'FutureDoc', 'AnatomyPro', 'QuizMaster', 'StudyBuddy',
      'MedicalGenius', 'HealthHero', 'DocInTraining', 'MedExpert', 'StudyChamp'
    ];

    const badges = ['streak_master', 'quiz_champion', 'rising_star', 'consistent_learner'];

    // Générer le top 10
    for (let i = 0; i < 10; i++) {
      const baseScore = 95 - (i * 3) + Math.floor(Math.random() * 6) - 3;
      const baseStreak = 25 - (i * 2) + Math.floor(Math.random() * 4) - 2;

      entries.push({
        rank: i + 1,
        username: usernames[i] || `User${i + 1}`,
        score: Math.max(60, Math.min(100, baseScore)),
        streak: Math.max(1, baseStreak),
        badge: i < 3 ? badges[Math.floor(Math.random() * badges.length)] : undefined,
        isCurrentUser: false
      });
    }

    // Insérer l'utilisateur actuel s'il est dans le top 10
    const userRank = Math.floor(Math.random() * 15) + 1;
    if (userRank <= 10) {
      entries[userRank - 1] = {
        rank: userRank,
        username: 'Vous',
        score: userStats.averageScore,
        streak: userStats.currentStreak,
        isCurrentUser: true,
        badge: userStats.currentStreak > 10 ? 'streak_master' : undefined
      };
    }

    return entries.sort((a, b) => a.rank - b.rank);
  }

  /**
   * Génère l'entrée de l'utilisateur actuel pour le leaderboard
   */
  private generateCurrentUserEntry(userStats: PerformanceStats): LeaderboardEntry {
    const userRank = Math.floor(Math.random() * 500) + 11; // Rang entre 11 et 510

    return {
      rank: userRank,
      username: 'Vous',
      score: userStats.averageScore,
      streak: userStats.currentStreak,
      isCurrentUser: true,
      badge: userStats.currentStreak > 10 ? 'streak_master' : undefined
    };
  }

  /**
   * Génère une recommandation d'action basée sur la catégorie et le score
   */
  private getRecommendedAction(categoryId: string, averageScore: number): string {
    const recommendations: Record<string, Record<string, string>> = {
      'anatomie': {
        'low': 'Révisez les bases anatomiques avec des schémas et des quiz de révision',
        'medium': 'Pratiquez avec des cas cliniques pour consolider vos connaissances',
        'high': 'Approfondissez avec des quiz avancés sur les détails anatomiques'
      },
      'physiologie': {
        'low': 'Concentrez-vous sur les mécanismes fondamentaux avant d\'aborder les détails',
        'medium': 'Reliez les concepts physiologiques aux applications cliniques',
        'high': 'Explorez les interactions complexes entre les systèmes'
      },
      'pathologie': {
        'low': 'Étudiez les signes et symptômes de base des principales pathologies',
        'medium': 'Travaillez sur le diagnostic différentiel des maladies courantes',
        'high': 'Approfondissez les mécanismes physiopathologiques'
      }
    };

    const categoryRecs = recommendations[categoryId] || recommendations['anatomie'];

    if (averageScore < 60) return categoryRecs['low'];
    if (averageScore < 75) return categoryRecs['medium'];
    return categoryRecs['high'];
  }

  // Méthodes utilitaires privées
  private estimateQuizTime(difficulty: string): number {
    switch (difficulty) {
      case 'facile': return 2; // 2 minutes
      case 'moyen': return 3; // 3 minutes
      case 'difficile': return 4; // 4 minutes
      default: return 2.5;
    }
  }

  private calculateDifficultyAverageScore(difficulty: DifficultyProgress): number {
    let totalScore = 0;
    let completedQuizzes = 0;

    difficulty.categories.forEach(category => {
      category.quizzes.forEach(quiz => {
        if (quiz.completed) {
          totalScore += quiz.score;
          completedQuizzes++;
        }
      });
    });

    return completedQuizzes > 0 ? Math.round(totalScore / completedQuizzes) : 0;
  }

  private mapCategoriesToStats(categories: CategoryProgress[]): CategoryStats[] {
    return categories.map(category => {
      const completedQuizzes = category.quizzes.filter(q => q.completed);
      const totalScore = completedQuizzes.reduce((sum, quiz) => sum + quiz.score, 0);
      const averageScore = completedQuizzes.length > 0 ? totalScore / completedQuizzes.length : 0;
      const bestScore = completedQuizzes.length > 0 ? Math.max(...completedQuizzes.map(q => q.score)) : 0;

      // Identifier les points faibles avec des descriptions plus détaillées
      const weakPoints = this.generateWeakPoints(category.categoryId, completedQuizzes);

      // Dernière activité
      const lastActivity = completedQuizzes.length > 0
        ? completedQuizzes
            .filter(q => q.lastAttemptDate)
            .sort((a, b) => (b.lastAttemptDate?.getTime() || 0) - (a.lastAttemptDate?.getTime() || 0))[0]?.lastAttemptDate || null
        : null;

      return {
        categoryId: category.categoryId,
        categoryName: this.getCategoryName(category.categoryId),
        totalQuizzes: category.totalCount,
        completedQuizzes: category.completedCount,
        averageScore: Math.round(averageScore),
        bestScore: Math.round(bestScore),
        averageTime: this.estimateQuizTime('moyen'), // À améliorer avec de vraies données
        progressPercentage: category.progress,
        weakPoints,
        lastActivity
      };
    });
  }

  /**
   * Génère des points faibles détaillés basés sur la catégorie et les performances
   */
  private generateWeakPoints(categoryId: string, completedQuizzes: any[]): string[] {
    const weakQuizzes = completedQuizzes.filter(q => q.score < 70);

    // Points faibles spécifiques par catégorie
    const categoryWeakPoints: Record<string, string[]> = {
      'anatomie': [
        'Système cardiovasculaire',
        'Anatomie du système nerveux',
        'Muscles et articulations',
        'Système digestif',
        'Appareil respiratoire'
      ],
      'physiologie': [
        'Fonction cardiaque',
        'Régulation hormonale',
        'Métabolisme cellulaire',
        'Fonction rénale',
        'Système immunitaire'
      ],
      'pathologie': [
        'Maladies infectieuses',
        'Troubles métaboliques',
        'Pathologies cardiovasculaires',
        'Cancérologie',
        'Maladies auto-immunes'
      ],
      'pharmacologie': [
        'Interactions médicamenteuses',
        'Posologie et dosage',
        'Effets secondaires',
        'Mécanismes d\'action',
        'Contre-indications'
      ],
      'cardiologie': [
        'Électrocardiographie',
        'Insuffisance cardiaque',
        'Arythmies',
        'Hypertension artérielle',
        'Cardiopathies ischémiques'
      ]
    };

    const availableWeakPoints = categoryWeakPoints[categoryId] || [
      'Concepts fondamentaux',
      'Applications pratiques',
      'Diagnostic différentiel'
    ];

    // Sélectionner aléatoirement des points faibles basés sur le nombre de quiz échoués
    const numWeakPoints = Math.min(weakQuizzes.length, 3);
    const selectedWeakPoints: string[] = [];

    for (let i = 0; i < numWeakPoints; i++) {
      const randomIndex = Math.floor(Math.random() * availableWeakPoints.length);
      const weakPoint = availableWeakPoints[randomIndex];
      if (!selectedWeakPoints.includes(weakPoint)) {
        selectedWeakPoints.push(weakPoint);
      }
    }

    return selectedWeakPoints;
  }

  private getCategoryName(categoryId: string): string {
    // Mapping des IDs de catégories vers leurs noms
    const categoryNames: Record<string, string> = {
      'anatomie': 'Anatomie',
      'physiologie': 'Physiologie',
      'pathologie': 'Pathologie',
      'pharmacologie': 'Pharmacologie',
      'cardiologie': 'Cardiologie',
      'neurologie': 'Neurologie',
      'pediatrie': 'Pédiatrie',
      'gynecologie': 'Gynécologie',
      'urgences': 'Médecine d\'urgence',
      'chirurgie': 'Chirurgie'
    };
    
    return categoryNames[categoryId] || categoryId;
  }

  private async generateWeeklyActivity(): Promise<WeeklyActivity[]> {
    const activities: WeeklyActivity[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const quizCount = Math.floor(Math.random() * 8) + 1;
      const averageScore = Math.floor(Math.random() * 30) + 70;
      
      activities.push({
        date: date.toISOString().split('T')[0],
        quizCount,
        totalScore: averageScore * quizCount,
        averageScore,
        timeSpent: quizCount * 2.5
      });
    }
    
    return activities;
  }

  private generateAccuracyTrend(currentAverage: number): number[] {
    const trend: number[] = [];
    let baseScore = Math.max(50, currentAverage - 10);
    
    for (let i = 0; i < 30; i++) {
      const variation = (Math.random() - 0.5) * 10;
      baseScore = Math.max(40, Math.min(100, baseScore + variation));
      trend.push(Math.round(baseScore));
    }
    
    return trend;
  }

  private generateSessionHistory(limit: number): SessionHistory[] {
    const sessions: SessionHistory[] = [];
    const today = new Date();
    
    for (let i = 0; i < limit; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const quizzesCompleted = Math.floor(Math.random() * 10) + 1;
      const averageScore = Math.floor(Math.random() * 30) + 70;
      
      sessions.push({
        sessionId: `session_${Date.now()}_${i}`,
        date,
        duration: Math.floor(Math.random() * 30) + 15,
        quizzesCompleted,
        averageScore,
        categoriesStudied: ['anatomie', 'physiologie'].slice(0, Math.floor(Math.random() * 2) + 1),
        xpGained: quizzesCompleted * 10
      });
    }
    
    return sessions;
  }

  private async createDefaultGoals(): Promise<UserGoal[]> {
    const performanceStats = await this.getPerformanceStats();
    
    return [
      {
        id: 'streak_goal',
        type: 'streak',
        title: 'Maintenir un streak de 7 jours',
        description: 'Complétez au moins un quiz chaque jour pendant 7 jours consécutifs',
        target: 7,
        current: performanceStats.currentStreak,
        completed: performanceStats.currentStreak >= 7,
        createdAt: new Date()
      },
      {
        id: 'daily_quiz_goal',
        type: 'daily_quizzes',
        title: 'Compléter 5 quiz par jour',
        description: 'Terminez au moins 5 quiz aujourd\'hui',
        target: 5,
        current: 0, // À mettre à jour quotidiennement
        completed: false,
        createdAt: new Date()
      },
      {
        id: 'score_improvement_goal',
        type: 'score_improvement',
        title: 'Atteindre 85% de précision',
        description: 'Améliorez votre score moyen à 85%',
        target: 85,
        current: performanceStats.averageScore,
        completed: performanceStats.averageScore >= 85,
        createdAt: new Date()
      }
    ];
  }
}

export const statisticsService = StatisticsService.getInstance();
