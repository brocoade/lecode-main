import { doc, getDoc, setDoc, updateDoc, increment, arrayUnion, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { firebaseAuth, firebaseDB } from '@/backend/config/firebase.config';
import { ProgressService } from './progress.service';
import { streakService } from './streakService';

// Interfaces pour les statistiques réelles
export interface RealUserStats {
  // 🔥 Jours de Suite (Streak)
  currentStreak: number;
  bestStreak: number;
  
  // ✅ Quiz Complétés
  totalQuizzes: number;
  
  // 🎯 Précision Globale
  totalQuestionsAttempted: number;
  totalGoodAnswers: number;
  accuracyPercentage: number;
  
  // ⚡ Temps Moyen
  quizDurations: number[]; // en secondes
  averageTimeSeconds: number;
  
  // 📈 Activité Hebdomadaire
  weeklyActivity: WeeklyActivityData[];
  
  // Métadonnées
  lastUpdated: Date;
}

export interface WeeklyActivityData {
  day: string; // 'Lun', 'Mar', etc.
  date: string; // YYYY-MM-DD
  quizCount: number;
  totalScore: number;
  averageScore: number;
  height: string; // Pourcentage pour l'affichage
}

export interface QuizAttemptRecord {
  quizId: string;
  categoryId: string;
  difficulty: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  duration: number; // en secondes
  completedAt: Date;
}

export class RealStatsService {
  private static instance: RealStatsService;
  private static statsCache: RealUserStats | null = null;
  private static lastCacheTime: number = 0;
  private static CACHE_EXPIRATION_MS = 2 * 60 * 1000; // 2 minutes

  public static getInstance(): RealStatsService {
    if (!RealStatsService.instance) {
      RealStatsService.instance = new RealStatsService();
    }
    return RealStatsService.instance;
  }

  /**
   * 🔥 MÉTHODE PRINCIPALE : Récupérer toutes les statistiques réelles
   */
  async getRealUserStats(): Promise<RealUserStats> {
    const user = firebaseAuth.currentUser;
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    // Vérifier le cache
    const now = Date.now();
    if (RealStatsService.statsCache && 
        (now - RealStatsService.lastCacheTime) < RealStatsService.CACHE_EXPIRATION_MS) {
      console.log('📊 Statistiques récupérées depuis le cache');
      return RealStatsService.statsCache;
    }

    console.log('📊 Calcul des statistiques réelles...');

    try {
      // 1. 🔥 Récupérer les données de streak
      const streakData = await streakService.getStreak(user.uid);

      // 2. ✅ Récupérer les données de progression pour compter les quiz
      const progressService = new ProgressService();
      const userProgress = await progressService.getUserProgress();

      // 3. 📊 Récupérer les données détaillées depuis la collection users
      const userStatsDoc = await getDoc(doc(firebaseDB, 'users', user.uid));
      const userStatsData = userStatsDoc.exists() ? userStatsDoc.data() : {};

      // 4. 📈 Calculer l'activité hebdomadaire depuis userProgress
      const weeklyActivity = await this.calculateWeeklyActivity(userProgress);

      // 5. 🧮 Calculer les métriques
      const stats = this.calculateMetrics(userProgress, userStatsData, streakData, weeklyActivity);

      // Mettre en cache
      RealStatsService.statsCache = stats;
      RealStatsService.lastCacheTime = now;

      console.log('📊 Statistiques calculées:', stats);
      return stats;

    } catch (error) {
      console.error('❌ Erreur lors du calcul des statistiques:', error);
      
      // Retourner des statistiques par défaut en cas d'erreur
      return this.getDefaultStats();
    }
  }

  /**
   * 🧮 Calculer toutes les métriques à partir des données brutes
   */
  private calculateMetrics(
    userProgress: any, 
    userStatsData: any, 
    streakData: any, 
    weeklyActivity: WeeklyActivityData[]
  ): RealUserStats {
    
    // 🔥 Streak
    const currentStreak = streakData?.currentStreak || 0;
    const bestStreak = streakData?.highestStreak || 0;

    // ✅ Quiz Complétés - Compter depuis userProgress
    let totalQuizzes = 0;
    let totalQuestionsAttempted = 0;
    let totalGoodAnswers = 0;

    if (userProgress?.difficulties) {
      userProgress.difficulties.forEach((difficulty: any) => {
        difficulty.categories?.forEach((category: any) => {
          category.quizzes?.forEach((quiz: any) => {
            if (quiz.completed && quiz.score >= 60) {
              totalQuizzes++;
            }
          });
        });
      });
    }

    // 🎯 Précision - Utiliser les données de la collection users si disponibles
    totalQuestionsAttempted = userStatsData.totalQuestionsAttempted || 0;
    totalGoodAnswers = userStatsData.totalGoodAnswers || 0;
    const accuracyPercentage = totalQuestionsAttempted > 0 
      ? (totalGoodAnswers / totalQuestionsAttempted) * 100 
      : 0;

    // ⚡ Temps Moyen
    const quizDurations = userStatsData.quizDurations || [];
    const averageTimeSeconds = quizDurations.length > 0 
      ? quizDurations.reduce((a: number, b: number) => a + b, 0) / quizDurations.length 
      : 0;

    return {
      currentStreak,
      bestStreak,
      totalQuizzes,
      totalQuestionsAttempted,
      totalGoodAnswers,
      accuracyPercentage,
      quizDurations,
      averageTimeSeconds,
      weeklyActivity,
      lastUpdated: new Date()
    };
  }

  /**
   * 📈 Calculer l'activité hebdomadaire
   */
  private async calculateWeeklyActivity(userProgress: any): Promise<WeeklyActivityData[]> {
    const daysOfWeek = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const today = new Date();
    const weeklyData: WeeklyActivityData[] = [];

    // Créer les 7 derniers jours
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      const dayName = daysOfWeek[date.getDay()];
      const dateString = date.toISOString().split('T')[0];

      // Compter les quiz complétés ce jour-là
      let quizCount = 0;
      let totalScore = 0;

      if (userProgress?.difficulties) {
        userProgress.difficulties.forEach((difficulty: any) => {
          difficulty.categories?.forEach((category: any) => {
            category.quizzes?.forEach((quiz: any) => {
              if (quiz.completed && quiz.lastAttemptDate) {
                try {
                  // Vérifier si la date est valide
                  let quizDate: Date;
                  if (quiz.lastAttemptDate.toDate && typeof quiz.lastAttemptDate.toDate === 'function') {
                    // Timestamp Firebase
                    quizDate = quiz.lastAttemptDate.toDate();
                  } else if (quiz.lastAttemptDate instanceof Date) {
                    quizDate = quiz.lastAttemptDate;
                  } else {
                    // String ou autre format
                    quizDate = new Date(quiz.lastAttemptDate);
                  }

                  // Vérifier que la date est valide
                  if (isNaN(quizDate.getTime())) {
                    console.warn('⚠️ Date invalide trouvée:', quiz.lastAttemptDate);
                    return;
                  }

                  const quizDateString = quizDate.toISOString().split('T')[0];

                  if (quizDateString === dateString) {
                    quizCount++;
                    totalScore += quiz.score || 0;
                  }
                } catch (error) {
                  console.warn('⚠️ Erreur lors du traitement de la date:', quiz.lastAttemptDate, error);
                }
              }
            });
          });
        });
      }

      const averageScore = quizCount > 0 ? totalScore / quizCount : 0;

      weeklyData.push({
        day: dayName,
        date: dateString,
        quizCount,
        totalScore,
        averageScore,
        height: this.calculateBarHeight(quizCount)
      });
    }

    return weeklyData;
  }

  /**
   * 📊 Calculer la hauteur des barres pour le graphique
   */
  private calculateBarHeight(quizCount: number): string {
    if (quizCount === 0) return '0%';
    
    // Normaliser entre 20% et 100%
    const maxQuizPerDay = 10; // Supposons un maximum de 10 quiz par jour
    const percentage = Math.min((quizCount / maxQuizPerDay) * 100, 100);
    return Math.max(percentage, 20) + '%'; // Minimum 20% pour la visibilité
  }

  /**
   * 📊 Statistiques par défaut en cas d'erreur
   */
  private getDefaultStats(): RealUserStats {
    const daysOfWeek = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const today = new Date();
    
    const weeklyActivity = daysOfWeek.map((day, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      
      return {
        day,
        date: date.toISOString().split('T')[0],
        quizCount: 0,
        totalScore: 0,
        averageScore: 0,
        height: '0%'
      };
    });

    return {
      currentStreak: 0,
      bestStreak: 0,
      totalQuizzes: 0,
      totalQuestionsAttempted: 0,
      totalGoodAnswers: 0,
      accuracyPercentage: 0,
      quizDurations: [],
      averageTimeSeconds: 0,
      weeklyActivity,
      lastUpdated: new Date()
    };
  }

  /**
   * 🔄 Vider le cache (utile après une mise à jour)
   */
  public clearCache(): void {
    RealStatsService.statsCache = null;
    RealStatsService.lastCacheTime = 0;
  }
}

export const realStatsService = RealStatsService.getInstance();
