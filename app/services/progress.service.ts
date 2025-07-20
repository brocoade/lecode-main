import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { firebaseAuth, firebaseDB } from '@/backend/config/firebase.config';
import { HeartsService } from './hearts.service';

// Interface pour le suivi de progression d'un quiz
export interface QuizProgress {
  quizId: string;
  completed: boolean;
  score: number;
  lastAttemptDate: Date | null;
  unlocked?: boolean; // Ajout de la propriété pour éviter les erreurs de lint
}

// Interface pour le suivi de progression d'une catégorie
export interface CategoryProgress {
  categoryId: string;
  quizzes: QuizProgress[];
  completedCount: number;
  totalCount: number;
  progress: number; // 0-100
  completed: boolean; // Indique si la catégorie est complètement terminée
}

// Interface pour le suivi de progression d'un niveau
export interface DifficultyProgress {
  difficulty: 'facile' | 'moyen' | 'difficile';
  categories: CategoryProgress[];
  completedCount: number;
  totalCount: number;
  progress: number; // 0-100
  unlocked: boolean;
  completed: boolean; // Indique si le niveau est complètement terminé
}

// Interface pour le suivi global de l'utilisateur
export interface UserProgress {
  userId: string;
  difficulties: DifficultyProgress[];
  totalXP: number;
  heartsCount: number;
}

export class ProgressService {
  // Cache pour stocker la progression de l'utilisateur
  private static progressCache: UserProgress | null = null;
  private static lastCacheTime: number = 0;
  private static CACHE_EXPIRATION_MS = 5 * 60 * 1000; // 5 minutes
  
  /**
   * Récupère la progression complète d'un utilisateur
   * @param forceRefresh Si true, force le rechargement depuis Firebase même si le cache est valide
   */
  async getUserProgress(forceRefresh: boolean = false): Promise<UserProgress | null> {
    const user = firebaseAuth.currentUser;
    if (!user) return null;

    // Vérifier si le cache est valide
    const now = Date.now();
    if (!forceRefresh && 
        ProgressService.progressCache && 
        ProgressService.progressCache.userId === user.uid &&
        now - ProgressService.lastCacheTime < ProgressService.CACHE_EXPIRATION_MS) {
      console.log('Utilisation du cache de progression');
      return ProgressService.progressCache;
    }

    try {
      console.log('Récupération de la progression depuis Firebase');
      // Récupérer le document de progression de l'utilisateur
      const progressRef = doc(firebaseDB, 'userProgress', user.uid);
      const progressDoc = await getDoc(progressRef);

      if (progressDoc.exists()) {
        const data = progressDoc.data() as UserProgress;
        
        // Corriger les ID de catégories
        let needsUpdate = await this.fixCategoryIds(data);
        
        // S'assurer que l'état completed est correctement défini pour tous les quiz
        data.difficulties.forEach(difficulty => {
          difficulty.categories.forEach(category => {
            category.quizzes.forEach(quiz => {
              // Marquer comme complété si le score est ≥ 60%
              if (quiz.score >= 60 && !quiz.completed) {
                console.log(`Correction: Quiz ${quiz.quizId} avec score ${quiz.score} marqué comme complété`);
                quiz.completed = true;
                needsUpdate = true;
              }
            });
          });
        });
        
        // Sauvegarder les éventuelles corrections
        if (needsUpdate) {
          console.log("Sauvegarde des corrections de progression");
          await setDoc(progressRef, data);
        }
        
        // Mettre à jour le cache
        ProgressService.progressCache = data;
        ProgressService.lastCacheTime = now;
        
        return data;
      } else {
        // Si aucune progression n'existe, créer une nouvelle progression
        const newProgress = await this.initializeUserProgress(user.uid);
        
        // Mettre à jour le cache
        ProgressService.progressCache = newProgress;
        ProgressService.lastCacheTime = now;
        
        return newProgress;
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de la progression:', error);
      return null;
    }
  }

  /**
   * Corriger les ID de catégories dans la progression de l'utilisateur
   * Cette méthode ajoute le préfixe "maladies_" aux IDs de catégories si nécessaire
   */
  private async fixCategoryIds(userProgress: UserProgress): Promise<boolean> {
    let modified = false;
    const categoryMapping = {
      'cardiovasculaires': 'maladies_cardiovasculaires',
      'respiratoires': 'maladies_respiratoires',
      'digestives': 'maladies_digestives',
      'endocriniennes': 'maladies_endocriniennes',
      'autoimmunes': 'maladies_autoimmunes',
      'infectieuses': 'maladies_infectieuses',
      'musculosquelettiques': 'maladies_musculosquelettiques',
      'neurologiques': 'maladies_neurologiques',
      'dermatologiques': 'maladies_dermatologiques',
      'hematologiques': 'maladies_hematologiques'
    };

    for (const difficulty of userProgress.difficulties) {
      const updatedCategories: CategoryProgress[] = [];
      
      for (const category of difficulty.categories) {
        // Vérifier si l'ID de catégorie doit être mis à jour
        if (Object.keys(categoryMapping).includes(category.categoryId)) {
          // Créer une copie de la catégorie avec le nouvel ID
          const updatedCategory = { 
            ...category, 
            categoryId: categoryMapping[category.categoryId as keyof typeof categoryMapping] 
          };
          updatedCategories.push(updatedCategory);
          console.log(`Catégorie mise à jour: ${category.categoryId} -> ${updatedCategory.categoryId}`);
          modified = true;
        } else {
          updatedCategories.push(category);
        }
      }
      
      // Remplacer les catégories par la version mise à jour
      if (modified) {
        difficulty.categories = updatedCategories;
      }
    }
    
    return modified;
  }

  /**
   * Initialise la progression d'un nouvel utilisateur
   */
  async initializeUserProgress(userId: string): Promise<UserProgress> {
    try {
      // Récupérer tous les quiz disponibles pour construire la structure de progression
      const difficulties = ['facile', 'moyen', 'difficile'];
      const difficultyProgresses: DifficultyProgress[] = [];
      
      // Pour chaque niveau de difficulté
      for (const difficulty of difficulties) {
        // Créer la collection pour ce niveau de difficulté s'il n'existe pas
        const difficultyDocRef = doc(firebaseDB, 'quizzes', difficulty);
        
        // Récupérer les sous-collections (catégories) de ce document
        try {
          // Obtenir la liste des catégories à partir de notre structure de données locale
          const categoryIds = [
            'maladies_cardiovasculaires',
            'maladies_respiratoires',
            'maladies_digestives',
            'maladies_endocriniennes',
            'maladies_autoimmunes',
            'maladies_infectieuses',
            'maladies_musculosquelettiques',
            'maladies_neurologiques',
            'maladies_dermatologiques',
            'maladies_hematologiques'
          ];
          
          const categoryProgresses: CategoryProgress[] = [];
          
          // Pour chaque catégorie connue
          for (const categoryId of categoryIds) {
            // Extraire l'ID de base sans le préfixe maladies_ pour la collection
            const baseId = categoryId.replace('maladies_', '');
            console.log(`Vérification des quiz pour ${difficulty}/${categoryId}`);
            
            try {
              // Vérifier si des quiz existent pour cette catégorie/difficulté en récupérant la collection appropriée
              // Essayer d'abord avec le préfixe, puis sans
              let quizzesRef = collection(firebaseDB, 'quizzes', difficulty, categoryId);
              let quizzesSnapshot = await getDocs(quizzesRef);
              
              // Si aucun quiz n'est trouvé, essayer sans le préfixe
              if (quizzesSnapshot.empty) {
                console.log(`Aucun quiz trouvé pour ${difficulty}/${categoryId}, essai avec ${difficulty}/${baseId}`);
                quizzesRef = collection(firebaseDB, 'quizzes', difficulty, baseId);
                quizzesSnapshot = await getDocs(quizzesRef);
              }
              
              const quizProgresses: QuizProgress[] = [];
              
              // Trier les quiz par ID pour garantir l'ordre (quiz_1, quiz_2, etc.)
              const sortedQuizDocs = [...quizzesSnapshot.docs].sort((a, b) => {
                const numA = this.extractQuizIndex(a.id);
                const numB = this.extractQuizIndex(b.id);
                return numA - numB;
              });
              
              console.log(`${sortedQuizDocs.length} quiz trouvés pour ${difficulty}/${categoryId}`);
              
              // Pour chaque quiz trouvé dans cette catégorie
              sortedQuizDocs.forEach((quizDoc, index) => {
                const quizId = quizDoc.id;
                console.log(`Quiz trouvé: ${quizId}`);
                // Seul le premier quiz a un score initial de 0 et est considéré comme non complété
                // Les autres ont un score initial de 0 et sont considérés comme non complétés
                quizProgresses.push({
                  quizId,
                  completed: false,
                  score: 0,
                  lastAttemptDate: new Date()
                });
              });
              
              // Ajouter cette catégorie uniquement si elle contient des quiz
              if (quizProgresses.length > 0) {
                categoryProgresses.push({
                  categoryId,
                  quizzes: quizProgresses,
                  completedCount: 0,
                  totalCount: quizProgresses.length,
                  progress: 0,
                  completed: false // Initialement, aucune catégorie n'est complétée
                });
              } else {
                console.log(`Aucun quiz trouvé pour ${categoryId}, cette catégorie ne sera pas ajoutée à la progression`);
              }
            } catch (error) {
              console.error(`Erreur lors de la récupération des quiz pour ${categoryId}:`, error);
            }
          }
          
          // Définir si ce niveau est déverrouillé (le niveau facile est toujours déverrouillé)
          const isUnlocked = difficulty === 'facile';
          
          difficultyProgresses.push({
            difficulty: difficulty as 'facile' | 'moyen' | 'difficile',
            categories: categoryProgresses,
            completedCount: 0,
            totalCount: categoryProgresses.length,
            progress: 0,
            unlocked: isUnlocked,
            completed: false // Initialement, aucun niveau n'est complété
          });
        } catch (error) {
          console.error(`Erreur lors de la récupération des catégories pour ${difficulty}:`, error);
        }
      }
      
      // Créer l'objet de progression utilisateur
      const userProgress: UserProgress = {
        userId,
        difficulties: difficultyProgresses,
        totalXP: 0,
        heartsCount: 5 // On donne 5 cœurs au départ
      };
      
      // Sauvegarder dans Firestore
      const progressRef = doc(firebaseDB, 'userProgress', userId);
      await setDoc(progressRef, userProgress);
      
      return userProgress;
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de la progression:', error);
      
      // Retourner une progression par défaut en cas d'erreur
      return {
        userId,
        difficulties: [
          {
            difficulty: 'facile',
            categories: [],
            completedCount: 0,
            totalCount: 0,
            progress: 0,
            unlocked: true,
            completed: false
          },
          {
            difficulty: 'moyen',
            categories: [],
            completedCount: 0,
            totalCount: 0,
            progress: 0,
            unlocked: false,
            completed: false
          },
          {
            difficulty: 'difficile',
            categories: [],
            completedCount: 0,
            totalCount: 0,
            progress: 0,
            unlocked: false,
            completed: false
          }
        ],
        totalXP: 0,
        heartsCount: 5
      };
    }
  }

  /**
   * Met à jour la progression après avoir terminé un quiz
   */
  async updateQuizProgress(
    difficulty: string,
    categoryId: string,
    quizId: string,
    score: number,
    earnedXP: number,
    earnedHearts: number
  ): Promise<{success: boolean, xpGained: number, levelCompleted: boolean, nextQuizUnlocked: boolean}> {
    try {
      console.log(`=== Début updateQuizProgress ===`);
      console.log(`Paramètres: difficulty=${difficulty}, categoryId=${categoryId}, quizId=${quizId}, score=${score}, earnedXP=${earnedXP}, earnedHearts=${earnedHearts}`);
      
      const user = firebaseAuth.currentUser;
      if (!user) {
        console.log(`Aucun utilisateur connecté. Abandon.`);
        return {success: false, xpGained: 0, levelCompleted: false, nextQuizUnlocked: false};
      }
      
      // Récupérer la progression actuelle
      const userProgress = await this.getUserProgress(true);
      if (!userProgress) return {success: false, xpGained: 0, levelCompleted: false, nextQuizUnlocked: false};

      // Trouver le niveau de difficulté correspondant
      const difficultyProgress = userProgress.difficulties.find(
        d => d.difficulty === difficulty
      );
      if (!difficultyProgress) {
        console.log(`Difficulté ${difficulty} non trouvée`);
        return {success: false, xpGained: 0, levelCompleted: false, nextQuizUnlocked: false};
      }

      // Trouver la catégorie correspondante
      const possibleCategoryIds = [
        categoryId,
        categoryId.startsWith('maladies_') ? categoryId : `maladies_${categoryId}`,
        categoryId.replace('maladies_', '')
      ];
      
      let categoryProgress = null;
      for (const id of possibleCategoryIds) {
        categoryProgress = difficultyProgress.categories.find(c => c.categoryId === id);
        if (categoryProgress) {
          console.log(`Catégorie trouvée avec l'ID: ${id}`);
          break;
        }
      }
      
      if (!categoryProgress) {
        console.log(`Catégorie ${categoryId} non trouvée. Catégories disponibles:`, 
          difficultyProgress.categories.map(c => c.categoryId).join(', '));
        return {success: false, xpGained: 0, levelCompleted: false, nextQuizUnlocked: false};
      }

      // Vérifier si la catégorie contient des quiz
      if (!categoryProgress.quizzes || !Array.isArray(categoryProgress.quizzes)) {
        console.log(`La catégorie ${categoryId} n'a pas de tableau de quiz valide`);
        categoryProgress.quizzes = [];
        categoryProgress.totalCount = 0;
        categoryProgress.completedCount = 0;
        categoryProgress.progress = 0;
        categoryProgress.completed = false;
      }

      // Trouver le quiz correspondant
      const quizProgress = categoryProgress.quizzes.find(
        q => q.quizId === quizId
      );
      
      if (!quizProgress) {
        console.log(`Quiz ${quizId} non trouvé. Création d'une nouvelle entrée de progression.`);
        // Créer une nouvelle entrée pour ce quiz
        const newQuizProgress = {
          quizId,
          completed: false,
          score: 0,
          lastAttemptDate: new Date()
        };
        categoryProgress.quizzes.push(newQuizProgress);
        categoryProgress.totalCount = categoryProgress.quizzes.length;
        
        // Mettre à jour le quiz progress pour la suite du code
        const updatedQuizProgress = categoryProgress.quizzes.find(q => q.quizId === quizId);
        if (!updatedQuizProgress) {
          console.log(`Erreur critique: Impossible de créer l'entrée pour le quiz ${quizId}`);
          return {success: false, xpGained: 0, levelCompleted: false, nextQuizUnlocked: false};
        }
        
        // Continuer avec le quiz nouvellement créé
        const wasCompletedBefore = false;
        
        // Mettre à jour le score du quiz
        console.log(`Création d'un nouveau quiz ${quizId} avec score initial ${score}`);
        updatedQuizProgress.score = score;
        updatedQuizProgress.lastAttemptDate = new Date();
        
        // Marquer comme terminé si le score est suffisant (60% ou plus)
        const isPassing = score >= 60;
        if (isPassing) {
          console.log(`Quiz ${quizId} marqué comme complété avec score ${score}`);
          updatedQuizProgress.completed = true;
        } else {
          console.log(`Quiz ${quizId} non complété (score ${score} < 60%)`);
        }
        
        // Recalculer la progression de la catégorie
        const completedQuizzes = categoryProgress.quizzes.filter(q => q.completed && q.score >= 60).length;
        categoryProgress.completedCount = completedQuizzes;
        categoryProgress.progress = Math.round((completedQuizzes / categoryProgress.totalCount) * 100);
        
        // Une catégorie est considérée comme complétée uniquement si tous ses quiz sont complétés avec un score >= 60%
        const allQuizzesCompleted = categoryProgress.quizzes.every(q => q.completed && q.score >= 60);
        const wasCategoryCompletedBefore = categoryProgress.completed;
        categoryProgress.completed = allQuizzesCompleted;
        
        if (!wasCategoryCompletedBefore && categoryProgress.completed) {
          console.log(`🏆 Catégorie ${categoryId} nouvellement complétée! Tous les quiz ont un score >= 60%`);
        }
        
        // Sauvegarder les modifications
        const progressRef = doc(firebaseDB, 'userProgress', user.uid);
        await setDoc(progressRef, userProgress);
        
        // Mettre à jour le cache
        ProgressService.progressCache = userProgress;
        ProgressService.lastCacheTime = Date.now();
        
        // Pour un nouveau quiz, on attribue les XP seulement si le score est suffisant (>= 60%)
        const xpGained = isPassing ? earnedXP : 0;
        if (isPassing) {
          console.log(`Attribution de ${earnedXP} XP pour la complétion du nouveau quiz ${quizId}.`);
        } else {
          console.log(`Aucune XP accordée car le score (${score}) est insuffisant.`);
        }
        
        const result = {
          success: true, 
          xpGained: xpGained,
          levelCompleted: false,
          nextQuizUnlocked: false
        };
        
        console.log(`=== Fin updateQuizProgress ===`);
        // Message plus précis sur le résultat des XP
        if (xpGained > 0) {
          console.log(`Total de ${xpGained} XP ajoutées au profil de l'utilisateur.`);
        } else {
          console.log(`Aucune XP accordée pour cette tentative.`);
        }
        console.log(`Résultat: success=${result.success}, xpGained=${result.xpGained}, levelCompleted=${result.levelCompleted}, nextQuizUnlocked=${result.nextQuizUnlocked}`);
        
        return result;
      }

      // Vérifier si le quiz existant a été amélioré pour la comptabilisation des XP
      let xpGained = 0;
      let heartsGained = 0;
      
      // Vérifier si nous devons mettre à jour le score (uniquement si le nouveau score est meilleur que l'ancien)
      if (score > quizProgress.score) {
        console.log(`Le nouveau score (${score}) est supérieur à l'ancien (${quizProgress.score}). Mise à jour.`);
        quizProgress.score = score;
        
        // Attribuer quand même les XP complets, car maintenant chaque question correcte rapporte 20 XP
        // et cela doit être cohérent avec l'écran de résultats
        xpGained = earnedXP;
        
        // Ne pas ajouter de cœurs supplémentaires
        heartsGained = 0;
      } else {
        console.log(`Le nouveau score (${score}) n'est pas supérieur à l'ancien (${quizProgress.score}). Conservation de l'ancien score.`);
        
        // Attribuer quand même les XP complets, car maintenant chaque question correcte rapporte 20 XP
        // et cela doit être cohérent avec l'écran de résultats
        xpGained = earnedXP;
        
        // Ne pas ajouter de cœurs supplémentaires
        heartsGained = 0;
      }
      
      // Toujours mettre à jour la date de dernière tentative, quel que soit le score
      quizProgress.lastAttemptDate = new Date();
      
      // Marquer comme terminé si le score est suffisant (60% ou plus) ou s'il était déjà complété
      const wasCompletedBefore = quizProgress.completed;
      const isPassing = score >= 60 || quizProgress.score >= 60;

      // Si le quiz n'était pas complété avant mais que le score (nouveau ou conservé) est suffisant, le marquer comme complété
      if (isPassing) {
        console.log(`Quiz ${quizId} marqué comme complété avec score ${quizProgress.score}`);
        quizProgress.completed = true;
      } else {
        console.log(`Quiz ${quizId} non complété (meilleur score: ${quizProgress.score} < 60%)`);
      }
      
      // Si des XP ou des cœurs sont gagnés, les ajouter au total
      if (xpGained > 0) {
        console.log(`Attribution de ${xpGained} XP pour le quiz ${quizId}.`);
        await this.updateTotalXP(xpGained);
      } else {
        console.log(`Aucune XP accordée car le quiz a déjà un meilleur score.`);
      }
      
      if (heartsGained > 0) {
        console.log(`Attribution de ${heartsGained} cœurs pour le quiz ${quizId}.`);
        const heartsService = new HeartsService();
        await heartsService.addHearts(heartsGained);
      }

      // Vérifier si le quiz suivant doit être débloqué (uniquement si le nouveau score est suffisant)
      let nextQuizUnlocked = false;
      if (isPassing) {
        const currentQuizIndex = this.extractQuizIndex(quizId);
        const nextQuizId = this.buildNextQuizId(quizId, currentQuizIndex);
        
        console.log(`Recherche du quiz suivant: ${nextQuizId} après avoir réussi ${quizId}`);
        
        // Vérifier si le quiz suivant existe
        const nextQuizExists = categoryProgress.quizzes.some(q => q.quizId === nextQuizId);
        if (nextQuizExists) {
          nextQuizUnlocked = true;
          
          try {
            // Forcer le déblocage du quiz suivant
            await this.forceUnlockNextQuiz(userProgress, difficulty, categoryProgress.categoryId, quizId);
            
            // Trouver et débloquer le quiz suivant dans la structure de données
            const nextQuiz = categoryProgress.quizzes.find(q => q.quizId === nextQuizId);
            if (nextQuiz) {
              // Forcer l'état de déverrouillage pour le quiz suivant
              // en marquant explicitement le quiz actuel comme complété
              quizProgress.completed = true;
              
              console.log(`Quiz suivant ${nextQuizId} a été débloqué automatiquement`);
            } else {
              console.log(`Quiz suivant ${nextQuizId} non trouvé dans la structure malgré nextQuizExists=true`);
            }
          } catch (error) {
            console.error(`Erreur lors du déblocage du quiz suivant: ${error}`);
            // Continuer l'exécution même en cas d'erreur
          }
        } else {
          console.log(`Aucun quiz suivant trouvé après ${quizId}. Quiz disponibles dans cette catégorie:`, 
            categoryProgress.quizzes.map(q => q.quizId).join(', '));
        }
      }

      // Recalculer la progression de la catégorie
      const completedQuizzes = categoryProgress.quizzes.filter(q => q.completed && q.score >= 60).length;
      categoryProgress.completedCount = completedQuizzes;
      categoryProgress.progress = Math.round((completedQuizzes / categoryProgress.totalCount) * 100);
      
      // Une catégorie est considérée comme complétée uniquement si tous ses quiz sont complétés avec un score >= 60%
      const allQuizzesCompleted = categoryProgress.quizzes.every(q => q.completed && q.score >= 60);
      const wasCategoryCompletedBefore = categoryProgress.completed;
      categoryProgress.completed = allQuizzesCompleted;
      
      if (!wasCategoryCompletedBefore && categoryProgress.completed) {
        console.log(`🏆 Catégorie ${categoryId} nouvellement complétée! Tous les quiz ont un score >= 60%`);
      }

      // Recalculer la progression du niveau
      const completedCategories = difficultyProgress.categories.filter(cat => cat.completed).length;
      difficultyProgress.completedCount = completedCategories;
      difficultyProgress.progress = Math.round((completedCategories / difficultyProgress.totalCount) * 100);
      
      const wasLevelCompletedBefore = difficultyProgress.completed;
      difficultyProgress.completed = difficultyProgress.progress === 100;
      const levelJustCompleted = !wasLevelCompletedBefore && difficultyProgress.completed;
      
      // Calculer les XP totales gagnées
      let totalXPGained = 0;
      
      // NOUVELLE LOGIQUE: Utiliser les XP déjà calculées et attribuées plus haut
      // au lieu de les recalculer et potentiellement les annuler
      totalXPGained = xpGained; // Utiliser directement les XP calculées précédemment
      
      // Si le niveau vient d'être complété, ajouter un bonus
      if (!wasLevelCompletedBefore && difficultyProgress.completed) {
        const levelCompletionBonus = 1000;
        totalXPGained += levelCompletionBonus;
        console.log(`Attribution d'un bonus de ${levelCompletionBonus} XP pour la complétion du niveau ${difficulty}.`);
      }
      
      // Mettre à jour le total d'XP dans la progression utilisateur
      userProgress.totalXP += totalXPGained;
      
      // Mettre à jour le nombre de cœurs (seulement si des cœurs ont été gagnés)
      if (heartsGained > 0) {
        userProgress.heartsCount += heartsGained;
      }
      
      console.log(`Total final d'XP ajoutées: ${totalXPGained}`);
      
      // Débloquer le niveau suivant si le niveau actuel est terminé
      if (difficultyProgress.completed) {
        const nextDifficultyIndex = userProgress.difficulties.findIndex(
          d => d.difficulty === difficulty
        ) + 1;
        
        if (nextDifficultyIndex < userProgress.difficulties.length) {
          userProgress.difficulties[nextDifficultyIndex].unlocked = true;
        }
      }

      // Sauvegarder les modifications
      const progressRef = doc(firebaseDB, 'userProgress', user.uid);
      await setDoc(progressRef, userProgress);
      
      // Mettre à jour le cache
      ProgressService.progressCache = userProgress;
      ProgressService.lastCacheTime = Date.now();
      
      const result = {
        success: true, 
        xpGained: totalXPGained,
        levelCompleted: levelJustCompleted,
        nextQuizUnlocked
      };
      
      console.log(`=== Fin updateQuizProgress ===`);
      // Message plus précis sur le résultat des XP
      if (totalXPGained > 0) {
        console.log(`Total de ${totalXPGained} XP ajoutées au profil de l'utilisateur.`);
      } else if (xpGained > 0) {
        console.log(`${xpGained} XP calculées mais pas encore ajoutées au total (à confirmer).`);
      } else {
        console.log(`Aucune XP accordée pour cette tentative.`);
      }
      console.log(`Résultat: success=${result.success}, xpGained=${result.xpGained}, levelCompleted=${result.levelCompleted}, nextQuizUnlocked=${result.nextQuizUnlocked}`);
      
      return result;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la progression du quiz:', error);
      return {success: false, xpGained: 0, levelCompleted: false, nextQuizUnlocked: false};
    }
  }

  /**
   * Attribue un bonus d'XP pour avoir complété un niveau
   * @param difficulty Le niveau de difficulté complété
   * @returns Le montant de bonus XP attribué
   */
  async awardLevelCompletionBonus(difficulty: string): Promise<number> {
    try {
      const user = firebaseAuth.currentUser;
      if (!user) return 0;
      
      // Récupérer la progression actuelle
      const userProgress = await this.getUserProgress(true);
      if (!userProgress) return 0;
      
      // Bonus fixe pour la complétion d'un niveau
      const levelCompletionBonus = 1000;
      
      // Ajouter le bonus
      userProgress.totalXP += levelCompletionBonus;
      
      // Sauvegarder les modifications
      const progressRef = doc(firebaseDB, 'userProgress', user.uid);
      await setDoc(progressRef, userProgress);
      
      // Mettre à jour le cache
      ProgressService.progressCache = userProgress;
      ProgressService.lastCacheTime = Date.now();
      
      return levelCompletionBonus;
    } catch (error) {
      console.error('Erreur lors de l\'attribution du bonus de niveau:', error);
      return 0;
    }
  }

  /**
   * Vérifie si un quiz est déverrouillé pour l'utilisateur
   */
  async isQuizUnlocked(difficulty: string, categoryId: string, quizId: string): Promise<boolean> {
    try {
      // Extraire l'index du quiz courant (numéro à la fin de l'ID)
      const currentQuizIndex = this.extractQuizIndex(quizId);
      
      // Le quiz #1 est toujours déverrouillé
      if (currentQuizIndex === 1) {
        return true;
      }
      
      const user = firebaseAuth.currentUser;
      if (!user) return false;
      
      // Récupérer la progression de l'utilisateur
      const userProgress = await this.getUserProgress();
      if (!userProgress) return false;
      
      // Trouver la difficulté correspondante
      const difficultyProgress = userProgress.difficulties.find(
        d => d.difficulty === difficulty
      );
      if (!difficultyProgress) return false;
      
      // Normaliser l'ID de catégorie
      const fullCategoryId = categoryId.startsWith('maladies_') ? categoryId : `maladies_${categoryId}`;
      const simpleCategoryId = categoryId.replace('maladies_', '');
      
      // Trouver la catégorie correspondante (essayer les deux formats d'ID)
      let categoryProgress = difficultyProgress.categories.find(
        c => c.categoryId === fullCategoryId || c.categoryId === simpleCategoryId
      );
      
      if (!categoryProgress) return false;
      
      // Vérifier si la catégorie contient des quiz
      if (!categoryProgress.quizzes || !Array.isArray(categoryProgress.quizzes) || categoryProgress.quizzes.length === 0) {
        console.log(`La catégorie ${categoryId} n'a pas de quiz valides pour vérifier le déverrouillage`);
        return currentQuizIndex === 1; // Seul le premier quiz est déverrouillé par défaut
      }
      
      // Construire l'ID du quiz précédent
      const previousQuizId = this.buildPreviousQuizId(quizId, currentQuizIndex);
      
      // Trouver le quiz précédent dans la progression
      const previousQuizProgress = categoryProgress.quizzes.find(
        q => q.quizId === previousQuizId
      );
      
      // Si le quiz précédent n'existe pas, mais que l'index est 2, vérifier si le quiz_1 existe
      if (!previousQuizProgress && currentQuizIndex === 2) {
        const firstQuizId = quizId.replace(/_\d+$/, '_1');
        const firstQuiz = categoryProgress.quizzes.find(q => q.quizId === firstQuizId);
        
        if (firstQuiz) {
          console.log(`Quiz ${quizId} - vérification du premier quiz ${firstQuizId} à la place`);
          return firstQuiz.completed && firstQuiz.score >= 60;
        }
      }
      
      // Le quiz est déverrouillé si le quiz précédent est complété avec un score suffisant (≥ 60%)
      if (previousQuizProgress && previousQuizProgress.completed && previousQuizProgress.score >= 60) {
        console.log(`Quiz ${quizId} est déverrouillé car quiz précédent ${previousQuizId} a score=${previousQuizProgress.score} et completed=${previousQuizProgress.completed}`);
        return true;
      }
      
      if (previousQuizProgress) {
        console.log(`Quiz ${quizId} est verrouillé car quiz précédent ${previousQuizId} a score=${previousQuizProgress.score} et completed=${previousQuizProgress.completed}`);
      } else {
        console.log(`Quiz ${quizId} est verrouillé car le quiz précédent ${previousQuizId} n'existe pas`);
      }
      
      return false;
    } catch (error) {
      console.error('Erreur lors de la vérification du déverrouillage du quiz:', error);
      return false;
    }
  }

  /**
   * Vérifie si une catégorie est complétée
   * Une catégorie est considérée comme complétée lorsque tous ses quiz ont été validés avec un score >= 60%
   */
  async isCategoryCompleted(difficulty: string, categoryId: string): Promise<boolean> {
    try {
      const userProgress = await this.getUserProgress();
      if (!userProgress) return false;
      
      // Normaliser l'ID de catégorie pour la recherche
      const fullCategoryId = categoryId.startsWith('maladies_') ? categoryId : `maladies_${categoryId}`;
      const simpleCategoryId = categoryId.replace('maladies_', '');
      
      // Trouver la difficulté correspondante
      const difficultyProgress = userProgress.difficulties.find(
        d => d.difficulty === difficulty
      );
      if (!difficultyProgress) {
        console.log(`Difficulté ${difficulty} non trouvée pour vérifier si la catégorie est complétée`);
        return false;
      }
      
      // Trouver la catégorie correspondante (essayer les deux formats d'ID)
      const categoryProgress = difficultyProgress.categories.find(
        c => c.categoryId === fullCategoryId || c.categoryId === simpleCategoryId
      );
      if (!categoryProgress) {
        console.log(`Catégorie ${categoryId} non trouvée pour vérifier si elle est complétée`);
        return false;
      }
      
      // Vérifier si la catégorie contient des quiz
      if (!categoryProgress.quizzes || !Array.isArray(categoryProgress.quizzes)) {
        console.log(`La catégorie ${categoryId} n'a pas de tableau de quiz valide`);
        return false;
      }
      
      // Si la catégorie ne contient pas de quiz, elle n'est pas considérée comme complétée
      if (categoryProgress.quizzes.length === 0) {
        console.log(`La catégorie ${categoryId} ne contient aucun quiz, elle ne peut pas être considérée comme complétée`);
        return false;
      }
      
      // Vérifier si tous les quiz de la catégorie sont complétés avec un score >= 60%
      const allQuizzesCompleted = categoryProgress.quizzes.every(quiz => quiz.completed && quiz.score >= 60);
      
      console.log(`Catégorie ${categoryId} - ${categoryProgress.quizzes.length} quiz, complétée: ${allQuizzesCompleted}`);
      if (!allQuizzesCompleted) {
        // Afficher les quiz non complétés pour le débogage
        const incompleteQuizzes = categoryProgress.quizzes
          .filter(quiz => !quiz.completed || quiz.score < 60)
          .map(quiz => `${quiz.quizId} (score: ${quiz.score}, complété: ${quiz.completed})`);
        
        console.log(`Quiz non complétés dans la catégorie ${categoryId}: ${incompleteQuizzes.join(', ')}`);
      }
      
      return allQuizzesCompleted;
    } catch (error) {
      console.error(`Erreur lors de la vérification si la catégorie ${categoryId} est complétée:`, error);
      return false;
    }
  }

  /**
   * Vérifie si un niveau de difficulté est déverrouillé
   */
  async isDifficultyUnlocked(difficulty: string): Promise<boolean> {
    // Le niveau facile est toujours déverrouillé
    if (difficulty === 'facile') return true;
    
    const userProgress = await this.getUserProgress();
    if (!userProgress) return difficulty === 'facile';
    
    const difficultyProgress = userProgress.difficulties.find(
      d => d.difficulty === difficulty
    );
    
    if (!difficultyProgress) return difficulty === 'facile';
    
    return difficultyProgress.unlocked;
  }

  /**
   * Vérifie si une catégorie a au moins un quiz complété
   * Cette méthode est utile pour les calculs de progression du niveau
   */
  async isCategoryStarted(difficulty: string, categoryId: string): Promise<boolean> {
    const userProgress = await this.getUserProgress();
    if (!userProgress) return false;
    
    const difficultyProgress = userProgress.difficulties.find(
      d => d.difficulty === difficulty
    );
    
    if (!difficultyProgress) return false;
    
    // Normaliser l'ID de catégorie pour la recherche
    const fullCategoryId = categoryId.startsWith('maladies_') ? categoryId : `maladies_${categoryId}`;
    const simpleCategoryId = categoryId.replace('maladies_', '');
    
    // Trouver la catégorie correspondante (essayer les deux formats d'ID)
    const categoryProgress = difficultyProgress.categories.find(
      c => c.categoryId === fullCategoryId || c.categoryId === simpleCategoryId
    );
    
    if (!categoryProgress) return false;
    
    // La catégorie est considérée comme "commencée" si au moins un quiz a été complété
    const hasCompletedQuiz = categoryProgress.quizzes.some(q => q.completed);
    
    if (hasCompletedQuiz) {
      console.log(`Catégorie ${categoryId} marquée comme commencée car au moins un quiz est complété`);
    }
    
    return hasCompletedQuiz;
  }

  /**
   * Vérifie si une catégorie est débloquée pour l'utilisateur
   * Une catégorie est débloquée si c'est la première ou si la catégorie précédente est entièrement terminée
   * (tous les quiz de la catégorie précédente ont été complétés avec un score >= 60%)
   */
  async isCategoryUnlocked(difficulty: string, categoryId: string, categoryIndex: number): Promise<boolean> {
    // La première catégorie est toujours débloquée
    if (categoryIndex === 0) {
      return true;
    }
    
    const userProgress = await this.getUserProgress();
    if (!userProgress) return categoryIndex === 0;
    
    // Vérifier si le niveau est débloqué
    const difficultyProgress = userProgress.difficulties.find(
      d => d.difficulty === difficulty
    );
    
    if (!difficultyProgress || !difficultyProgress.unlocked) {
      return false;
    }
    
    // Pour les autres catégories, vérifier si la catégorie précédente est complètement terminée
    // Normaliser l'ID de catégorie
    const fullCategoryId = categoryId.startsWith('maladies_') ? categoryId : `maladies_${categoryId}`;
    const simpleCategoryId = categoryId.replace('maladies_', '');
    
    // Trouver l'ID de la catégorie précédente
    const previousCategoryId = this.getPreviousCategoryId(simpleCategoryId, categoryIndex);
    if (!previousCategoryId) return true;
    
    // Vérifier si la catégorie précédente est complètement terminée
    const previousCategoryFullId = `maladies_${previousCategoryId}`;
    const isPreviousCategoryCompleted = await this.isCategoryCompleted(difficulty, previousCategoryFullId);
    
    console.log(`Vérification du déblocage de la catégorie ${categoryId}: catégorie précédente ${previousCategoryFullId} est ${isPreviousCategoryCompleted ? 'complétée' : 'non complétée'}`);
    
    return isPreviousCategoryCompleted;
  }
  
  /**
   * Retourne l'ID de la catégorie précédente dans l'ordre de présentation
   */
  private getPreviousCategoryId(categoryId: string, currentIndex: number): string | null {
    if (currentIndex <= 0) return null;
    
    // Liste ordonnée des catégories
    const categoryOrder = [
      'cardiovasculaires',
      'respiratoires',
      'digestives',
      'endocriniennes',
      'autoimmunes',
      'infectieuses',
      'musculosquelettiques',
      'neurologiques',
      'dermatologiques',
      'hematologiques'
    ];
    
    // Si la catégorie actuelle n'est pas dans la liste, on ne peut pas déterminer la précédente
    const currentCategoryIndex = categoryOrder.indexOf(categoryId);
    if (currentCategoryIndex === -1) return null;
    
    // Si c'est la première catégorie, il n'y a pas de précédente
    if (currentCategoryIndex === 0) return null;
    
    // Sinon, retourner la catégorie précédente
    return categoryOrder[currentCategoryIndex - 1];
  }

  /**
   * Vide le cache de progression
   */
  clearProgressCache(): void {
    ProgressService.progressCache = null;
    ProgressService.lastCacheTime = 0;
  }

  /**
   * Extrait l'index d'un ID de quiz (exemple: "maladies_cardiovasculaires_quiz_2" -> 2)
   */
  private extractQuizIndex(quizId: string): number {
    // Chercher un motif "quiz_X" dans l'ID
    const matches = quizId.match(/quiz_(\d+)$/);
    if (matches && matches.length > 1) {
      return parseInt(matches[1], 10);
    }
    
    // Format avec préfixe: maladies_categoryName_quiz_X
    const prefixedMatches = quizId.match(/_quiz_(\d+)$/);
    if (prefixedMatches && prefixedMatches.length > 1) {
      return parseInt(prefixedMatches[1], 10);
    }
    
    // Si aucun numéro n'est trouvé, vérifier si le quizId contient un numéro ailleurs
    const anyNumber = quizId.match(/\d+/);
    if (anyNumber) {
      return parseInt(anyNumber[0], 10);
    }
    
    return 1; // Par défaut, considérer comme le premier quiz
  }

  /**
   * Construit l'ID du quiz précédent
   */
  private buildPreviousQuizId(quizId: string, currentIndex: number): string {
    if (currentIndex <= 1) return quizId; // Pas de quiz précédent
    
    // Remplacer l'index à la fin du quizId
    return quizId.replace(/_\d+$/, `_${currentIndex - 1}`);
  }

  /**
   * Récupère les résultats détaillés d'un quiz spécifique
   * @param difficulty Le niveau de difficulté
   * @param categoryId L'identifiant de la catégorie
   * @param quizId L'identifiant du quiz
   * @returns Les détails du quiz ou null si non trouvé
   */
  async getQuizDetails(difficulty: string, categoryId: string, quizId: string): Promise<QuizProgress | null> {
    try {
      const userProgress = await this.getUserProgress();
      if (!userProgress) return null;
      
      // Normaliser l'ID de catégorie
      const fullCategoryId = categoryId.startsWith('maladies_') ? categoryId : `maladies_${categoryId}`;
      
      // Trouver la difficulté correspondante
      const difficultyProgress = userProgress.difficulties.find(
        d => d.difficulty === difficulty
      );
      if (!difficultyProgress) return null;
      
      // Trouver la catégorie correspondante
      const categoryProgress = difficultyProgress.categories.find(
        c => c.categoryId === fullCategoryId || c.categoryId === categoryId
      );
      if (!categoryProgress) return null;
      
      // Trouver le quiz correspondant
      const quizProgress = categoryProgress.quizzes.find(
        q => q.quizId === quizId
      );
      
      return quizProgress || null;
    } catch (error) {
      console.error('Erreur lors de la récupération des détails du quiz:', error);
      return null;
    }
  }

  /**
   * Vérifie si l'utilisateur peut accéder au quiz suivant
   * @param difficulty Le niveau de difficulté
   * @param categoryId L'identifiant de la catégorie
   * @param currentQuizId L'identifiant du quiz actuel
   * @returns true si le quiz suivant est accessible, false sinon
   */
  async canAccessNextQuiz(difficulty: string, categoryId: string, currentQuizId: string): Promise<{canAccess: boolean, nextQuizId: string | null}> {
    try {
      // Extraire l'index du quiz actuel
      const currentQuizIndex = this.extractQuizIndex(currentQuizId);
      
      // Construire l'ID du quiz suivant
      const nextQuizId = this.buildNextQuizId(currentQuizId, currentQuizIndex);
      
      // Vérifier si le quiz suivant est déverrouillé
      const isUnlocked = await this.isQuizUnlocked(difficulty, categoryId, nextQuizId);
      
      return {
        canAccess: isUnlocked,
        nextQuizId: nextQuizId
      };
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'accès au quiz suivant:', error);
      return {
        canAccess: false,
        nextQuizId: null
      };
    }
  }

  /**
   * Construit l'ID du quiz suivant à partir de l'ID actuel
   * @param quizId L'ID du quiz actuel
   * @param currentIndex L'index du quiz actuel
   * @returns L'ID du quiz suivant
   */
  private buildNextQuizId(quizId: string, currentIndex: number): string {
    // Gérer les formats comme "maladies_cardiovasculaires_quiz_1"
    if (quizId.includes('_quiz_')) {
      return quizId.replace(`_quiz_${currentIndex}`, `_quiz_${currentIndex + 1}`);
    }
    // Gestion du format simple "quiz_1"
    return quizId.replace(`quiz_${currentIndex}`, `quiz_${currentIndex + 1}`);
  }

  /**
   * Met à jour le total des points XP d'un utilisateur
   * @param amount Montant des XP à ajouter (positif) ou retrancher (négatif)
   * @returns True si la mise à jour a réussi, False sinon
   */
  async updateTotalXP(amount: number): Promise<boolean> {
    const user = firebaseAuth.currentUser;
    if (!user) {
      console.log(`updateTotalXP: Aucun utilisateur connecté, impossible de mettre à jour les XP`);
      return false;
    }
    
    try {
      console.log(`updateTotalXP: Début de la mise à jour pour ${amount} XP`);
      
      // Récupérer la progression actuelle
      const userProgress = await this.getUserProgress(true);
      if (!userProgress) {
        console.log(`updateTotalXP: Impossible de récupérer la progression de l'utilisateur`);
        return false;
      }
      
      // Calculer les nouveaux XP (jamais négatifs)
      const oldXP = userProgress.totalXP;
      const newTotalXP = Math.max(0, oldXP + amount);
      console.log(`updateTotalXP: Ancien total: ${oldXP}, Ajout: ${amount}, Nouveau total: ${newTotalXP}`);
      
      // Mettre à jour la progression
      userProgress.totalXP = newTotalXP;
      
      // Sauvegarder dans Firestore
      console.log(`updateTotalXP: Sauvegarde dans Firebase...`);
      const progressRef = doc(firebaseDB, 'userProgress', user.uid);
      await setDoc(progressRef, userProgress);
      
      // Mettre à jour le cache
      ProgressService.progressCache = userProgress;
      ProgressService.lastCacheTime = Date.now();
      
      console.log(`updateTotalXP: Mise à jour réussie, nouveau total: ${newTotalXP} XP`);
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour des XP:', error);
      return false;
    }
  }

  /**
   * Force le déblocage du quiz suivant lorsqu'un quiz est complété avec succès
   */
  private async forceUnlockNextQuiz(
    userProgress: UserProgress,
    difficulty: string,
    categoryId: string,
    currentQuizId: string
  ): Promise<void> {
    try {
      // Extraire l'index du quiz actuel
      const currentQuizIndex = this.extractQuizIndex(currentQuizId);
      
      // Construire l'ID du quiz suivant
      const nextQuizId = this.buildNextQuizId(currentQuizId, currentQuizIndex);
      
      console.log(`Force unlock: Essai de déblocage du quiz ${nextQuizId}`);
      
      // Trouver la difficulté correspondante
      const difficultyProgress = userProgress.difficulties.find(d => d.difficulty === difficulty);
      if (!difficultyProgress) {
        console.log(`Force unlock: Difficulté ${difficulty} non trouvée`);
        return;
      }
      
      // Essayer de trouver la catégorie avec plusieurs formats d'ID possibles
      const possibleCategoryIds = [
        categoryId,
        categoryId.startsWith('maladies_') ? categoryId : `maladies_${categoryId}`,
        categoryId.replace('maladies_', '')
      ];
      
      let categoryProgress = null;
      for (const id of possibleCategoryIds) {
        categoryProgress = difficultyProgress.categories.find(c => c.categoryId === id);
        if (categoryProgress) {
          console.log(`Force unlock: Catégorie trouvée avec l'ID: ${id}`);
          break;
        }
      }
      
      if (!categoryProgress) {
        console.log(`Force unlock: Catégorie ${categoryId} non trouvée`);
        return;
      }
      
      // Vérifier si la catégorie contient des quiz
      if (!categoryProgress.quizzes || !Array.isArray(categoryProgress.quizzes)) {
        console.log(`Force unlock: La catégorie ${categoryId} n'a pas de tableau de quiz valide`);
        categoryProgress.quizzes = [];
        return;
      }
      
      // Trouver le quiz actuel
      const currentQuiz = categoryProgress.quizzes.find(q => q.quizId === currentQuizId);
      if (!currentQuiz) {
        console.log(`Force unlock: Quiz actuel ${currentQuizId} non trouvé`);
        // Créer le quiz actuel s'il n'existe pas
        const newCurrentQuiz = {
          quizId: currentQuizId,
          completed: true,
          score: 60, // Score minimum pour être considéré comme complété
          lastAttemptDate: new Date()
        };
        categoryProgress.quizzes.push(newCurrentQuiz);
        console.log(`Force unlock: Quiz actuel ${currentQuizId} créé automatiquement`);
      } else {
        // Marquer le quiz actuel comme complété (s'il ne l'est pas déjà)
        if (!currentQuiz.completed) {
          console.log(`Force unlock: Marquer le quiz ${currentQuizId} comme complété`);
          currentQuiz.completed = true;
          // Ne pas écraser un score potentiellement meilleur que 60%
          if (currentQuiz.score < 60) {
            console.log(`Force unlock: Augmenter le score de ${currentQuiz.score} à 60%`);
            currentQuiz.score = 60;
          } else {
            console.log(`Force unlock: Conservation du score existant de ${currentQuiz.score}%`);
          }
        }
      }
      
      // Trouver le quiz suivant
      let nextQuiz = categoryProgress.quizzes.find(q => q.quizId === nextQuizId);
      if (!nextQuiz) {
        // Si le quiz suivant n'existe pas, le créer
        console.log(`Force unlock: Création du quiz suivant ${nextQuizId}`);
        nextQuiz = {
          quizId: nextQuizId,
          completed: false,
          score: 0,
          lastAttemptDate: null
        };
        categoryProgress.quizzes.push(nextQuiz);
      }
      
      // Déverrouiller le quiz suivant
      console.log(`Force unlock: Déverrouillage du quiz suivant ${nextQuizId}`);
      nextQuiz.unlocked = true;
    } catch (error) {
      console.error('Erreur lors du déblocage du quiz suivant:', error);
    }
  }
}