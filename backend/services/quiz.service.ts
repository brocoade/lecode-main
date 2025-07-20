import { firebaseDB } from '../config/firebase.config';

/**
 * Service pour gérer les quiz et les questions
 */
export class QuizService {
  /**
   * Récupère toutes les catégories disponibles pour une difficulté donnée
   * @param difficulty Niveau de difficulté (facile, moyen, difficile)
   * @returns Liste des catégories disponibles
   */
  async getCategories(difficulty: string): Promise<any[]> {
    try {
      const snapshot = await firebaseDB.collection('quizzes')
        .doc(difficulty)
        .get();
      
      if (!snapshot.exists) {
        return [];
      }

      const data = snapshot.data();
      if (!data) return [];

      // Convertir les catégories en tableau
      return Object.keys(data).map(categoryId => {
        return {
          id: categoryId,
          name: this.getCategoryNameFromId(categoryId),
          emoji: this.getCategoryEmojiFromId(categoryId)
        };
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des catégories", error);
      throw error;
    }
  }

  /**
   * Récupère tous les quiz disponibles pour une catégorie et difficulté données
   * @param difficulty Niveau de difficulté
   * @param categoryId Identifiant de la catégorie
   * @returns Liste des quiz disponibles
   */
  async getQuizzesByCategory(difficulty: string, categoryId: string): Promise<any[]> {
    try {
      const snapshot = await firebaseDB.collection('quizzes')
        .doc(difficulty)
        .collection(categoryId)
        .get();
      
      if (snapshot.empty) {
        return [];
      }

      return snapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error("Erreur lors de la récupération des quiz", error);
      throw error;
    }
  }

  /**
   * Récupère un quiz spécifique par son ID
   * @param difficulty Niveau de difficulté
   * @param categoryId Identifiant de la catégorie
   * @param quizId Identifiant du quiz
   * @returns Détails du quiz
   */
  async getQuizById(difficulty: string, categoryId: string, quizId: string): Promise<any | null> {
    try {
      const snapshot = await firebaseDB.collection('quizzes')
        .doc(difficulty)
        .collection(categoryId)
        .doc(quizId)
        .get();
      
      if (!snapshot.exists) {
        return null;
      }

      return snapshot.data();
    } catch (error) {
      console.error("Erreur lors de la récupération du quiz", error);
      throw error;
    }
  }

  /**
   * Calcule le score d'un quiz en fonction des réponses de l'utilisateur
   * @param quizData Données du quiz
   * @param userAnswers Réponses de l'utilisateur
   * @param timeSpent Temps passé sur chaque question
   * @returns Score et détails de la performance
   */
  calculateQuizScore(quizData: any, userAnswers: {[key: string]: string}, timeSpent: {[key: string]: number}): any {
    // Vérifier que les paramètres sont valides
    if (!quizData || !quizData.questions || !userAnswers || !timeSpent) {
      throw new Error("Données invalides pour le calcul du score");
    }

    const results = {
      totalPoints: 0,
      earnedPoints: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      timeBonus: 0,
      details: [] as any[]
    };

    // Pour chaque question du quiz
    quizData.questions.forEach((question: any) => {
      const questionId = question.id;
      const userAnswer = userAnswers[questionId];
      const questionTimeSpent = timeSpent[questionId] || 0;
      
      // Points de base pour la question
      const basePoints = question.points;
      // Est-ce que la réponse est correcte?
      const isCorrect = userAnswer === question.correctAnswer;
      
      // Calculer les points gagnés pour cette question
      let pointsEarned = 0;
      let timeBonus = 0;
      
      if (isCorrect) {
        // Base points
        pointsEarned = basePoints;
        
        // Bonus de temps (jusqu'à 30% de plus pour une réponse rapide)
        const timeLimitForQuestion = quizData.timeLimit;
        if (questionTimeSpent < timeLimitForQuestion) {
          // Plus la réponse est rapide, plus le bonus est élevé
          const timeRatio = 1 - (questionTimeSpent / timeLimitForQuestion);
          timeBonus = Math.round(basePoints * 0.3 * timeRatio);
          pointsEarned += timeBonus;
        }
        
        results.correctAnswers++;
      } else {
        results.wrongAnswers++;
      }
      
      // Ajouter les détails de cette question
      results.details.push({
        questionId,
        isCorrect,
        basePoints,
        timeBonus,
        pointsEarned,
        userAnswer,
        correctAnswer: question.correctAnswer
      });
      
      // Mettre à jour le total des points
      results.totalPoints += basePoints;
      results.earnedPoints += pointsEarned;
      results.timeBonus += timeBonus;
    });
    
    // Calculer le nombre de cœurs gagnés (1 cœur pour chaque 300 points)
    results.heartsEarned = Math.floor(results.earnedPoints / 300);
    
    return results;
  }

  /**
   * Convertit un ID de catégorie en nom lisible
   * @param categoryId ID de la catégorie
   * @returns Nom de la catégorie
   */
  private getCategoryNameFromId(categoryId: string): string {
    const categoryNames: {[key: string]: string} = {
      'maladies_cardiovasculaires': 'Maladies Cardiovasculaires',
      'maladies_respiratoires': 'Maladies Respiratoires',
      'maladies_digestives': 'Maladies Digestives',
      'maladies_endocriniennes': 'Maladies Endocriniennes',
      'maladies_auto_immunes': 'Maladies Auto-immunes',
      'maladies_infectieuses': 'Maladies Infectieuses',
      'maladies_musculo_squelettiques': 'Maladies Musculo-squelettiques',
      'maladies_neurologiques': 'Maladies Neurologiques',
      'maladies_dermatologiques': 'Maladies Dermatologiques',
      'maladies_hematologiques': 'Maladies Hématologiques'
    };
    
    return categoryNames[categoryId] || categoryId;
  }

  /**
   * Récupère l'emoji associé à une catégorie
   * @param categoryId ID de la catégorie
   * @returns Emoji associé
   */
  private getCategoryEmojiFromId(categoryId: string): string {
    const categoryEmojis: {[key: string]: string} = {
      'maladies_cardiovasculaires': '❤️',
      'maladies_respiratoires': '🌬️',
      'maladies_digestives': '🍽️',
      'maladies_endocriniennes': '🛑',
      'maladies_auto_immunes': '🛡️',
      'maladies_infectieuses': '🦠',
      'maladies_musculo_squelettiques': '🦴',
      'maladies_neurologiques': '🧠',
      'maladies_dermatologiques': '🧴',
      'maladies_hematologiques': '🩸'
    };
    
    return categoryEmojis[categoryId] || '📋';
  }
}

export default new QuizService();
