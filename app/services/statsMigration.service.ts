import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { firebaseAuth, firebaseDB } from '@/backend/config/firebase.config';

/**
 * Service pour migrer et initialiser les données de statistiques manquantes
 */
export class StatsMigrationService {
  
  /**
   * 🔧 Initialiser les champs de statistiques manquants pour un utilisateur
   */
  static async initializeUserStatsFields(): Promise<void> {
    const user = firebaseAuth.currentUser;
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    console.log('🔧 Initialisation des champs de statistiques...');

    try {
      // Vérifier le document utilisateur
      const userRef = doc(firebaseDB, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        console.log('📝 Création du document utilisateur...');
        // Créer le document utilisateur avec les champs de base
        await setDoc(userRef, {
          email: user.email,
          displayName: user.displayName || 'Utilisateur',
          createdAt: new Date(),
          totalGoodAnswers: 0,
          totalQuestionsAttempted: 0,
          quizDurations: [],
          totalQuizzes: 0
        });
        console.log('✅ Document utilisateur créé');
      } else {
        // Vérifier et ajouter les champs manquants
        const userData = userDoc.data();
        const updates: any = {};

        if (userData.totalGoodAnswers === undefined) {
          updates.totalGoodAnswers = 0;
          console.log('📊 Ajout du champ totalGoodAnswers');
        }

        if (userData.totalQuestionsAttempted === undefined) {
          updates.totalQuestionsAttempted = 0;
          console.log('📊 Ajout du champ totalQuestionsAttempted');
        }

        if (userData.quizDurations === undefined) {
          updates.quizDurations = [];
          console.log('📊 Ajout du champ quizDurations');
        }

        if (userData.totalQuizzes === undefined) {
          updates.totalQuizzes = 0;
          console.log('📊 Ajout du champ totalQuizzes');
        }

        // Appliquer les mises à jour si nécessaire
        if (Object.keys(updates).length > 0) {
          await updateDoc(userRef, updates);
          console.log('✅ Champs de statistiques ajoutés');
        } else {
          console.log('✅ Tous les champs de statistiques sont présents');
        }
      }

    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation des statistiques:', error);
      throw error;
    }
  }

  /**
   * 🔄 Migrer les données existantes depuis userProgress vers users
   */
  static async migrateExistingData(): Promise<void> {
    const user = firebaseAuth.currentUser;
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    console.log('🔄 Migration des données existantes...');

    try {
      // Récupérer les données de progression
      const progressRef = doc(firebaseDB, 'userProgress', user.uid);
      const progressDoc = await getDoc(progressRef);

      if (!progressDoc.exists()) {
        console.log('ℹ️ Aucune donnée de progression à migrer');
        return;
      }

      const progressData = progressDoc.data();
      let totalQuizzes = 0;

      // Compter les quiz complétés
      if (progressData.difficulties) {
        progressData.difficulties.forEach((difficulty: any) => {
          difficulty.categories?.forEach((category: any) => {
            category.quizzes?.forEach((quiz: any) => {
              if (quiz.completed && quiz.score >= 60) {
                totalQuizzes++;
              }
            });
          });
        });
      }

      // Mettre à jour le document utilisateur avec les données migrées
      const userRef = doc(firebaseDB, 'users', user.uid);
      await updateDoc(userRef, {
        totalQuizzes: totalQuizzes
      });

      console.log(`✅ Migration terminée: ${totalQuizzes} quiz complétés trouvés`);

    } catch (error) {
      console.error('❌ Erreur lors de la migration:', error);
      throw error;
    }
  }

  /**
   * 🧪 Créer des données de test pour le développement
   */
  static async createTestData(): Promise<void> {
    const user = firebaseAuth.currentUser;
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    console.log('🧪 Création de données de test...');

    try {
      const userRef = doc(firebaseDB, 'users', user.uid);
      
      const testData = {
        totalGoodAnswers: 15,
        totalQuestionsAttempted: 20,
        quizDurations: [45, 38, 52, 41, 35, 48, 42],
        totalQuizzes: 7
      };

      await updateDoc(userRef, testData);
      console.log('✅ Données de test créées:', testData);

    } catch (error) {
      console.error('❌ Erreur lors de la création des données de test:', error);
      throw error;
    }
  }

  /**
   * 🔍 Diagnostiquer l'état des données utilisateur
   */
  static async diagnoseUserData(): Promise<any> {
    const user = firebaseAuth.currentUser;
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    console.log('🔍 Diagnostic des données utilisateur...');

    try {
      // Vérifier le document users
      const userRef = doc(firebaseDB, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      // Vérifier le document userProgress
      const progressRef = doc(firebaseDB, 'userProgress', user.uid);
      const progressDoc = await getDoc(progressRef);

      const diagnosis = {
        userId: user.uid,
        userEmail: user.email,
        userDocExists: userDoc.exists(),
        progressDocExists: progressDoc.exists(),
        userData: userDoc.exists() ? userDoc.data() : null,
        progressData: progressDoc.exists() ? progressDoc.data() : null,
        missingFields: [] as string[]
      };

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const requiredFields = ['totalGoodAnswers', 'totalQuestionsAttempted', 'quizDurations', 'totalQuizzes'];
        
        requiredFields.forEach(field => {
          if (userData[field] === undefined) {
            diagnosis.missingFields.push(field);
          }
        });
      }

      console.log('📊 Diagnostic terminé:', diagnosis);
      return diagnosis;

    } catch (error) {
      console.error('❌ Erreur lors du diagnostic:', error);
      throw error;
    }
  }

  /**
   * 🚀 Migration complète automatique
   */
  static async runFullMigration(): Promise<void> {
    console.log('🚀 Démarrage de la migration complète...');

    try {
      // 1. Initialiser les champs manquants
      await this.initializeUserStatsFields();

      // 2. Migrer les données existantes
      await this.migrateExistingData();

      console.log('🎉 Migration complète terminée avec succès !');

    } catch (error) {
      console.error('❌ Erreur lors de la migration complète:', error);
      throw error;
    }
  }
}

export const statsMigrationService = StatsMigrationService;
