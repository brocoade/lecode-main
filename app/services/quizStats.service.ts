import { doc, getDoc, updateDoc, increment, arrayUnion, setDoc } from 'firebase/firestore';
import { firebaseDB } from '@/backend/config/firebase.config';

// Helper pour vérifier si une date est hier
const isYesterday = (date: Date) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.toDateString() === yesterday.toDateString();
};

// A. Mettre à jour le streak (jours consécutifs)
export const updateStreak = async (userId: string) => {
  try {
    const userRef = doc(firebaseDB, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      // Créer le document s'il n'existe pas
      await setDoc(userRef, {
        currentStreak: 1,
        lastPlayed: new Date(),
        totalQuizzes: 0,
        totalGoodAnswers: 0,
        totalQuestionsAttempted: 0,
        quizDurations: []
      });
      return;
    }

    const userData = userDoc.data();
    const lastPlayed = userData?.lastPlayed?.toDate() || null;
    const today = new Date();

    if (!lastPlayed || !isYesterday(lastPlayed)) {
      // Nouveau streak ou streak cassé
      await updateDoc(userRef, {
        currentStreak: 1,
        lastPlayed: today
      });
    } else if (isYesterday(lastPlayed)) {
      // Continuer le streak
      await updateDoc(userRef, {
        currentStreak: increment(1),
        lastPlayed: today
      });
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour du streak:', error);
  }
};

// B. Incrémenter le nombre de quiz complétés
export const handleQuizCompleted = async (userId: string) => {
  try {
    const userRef = doc(firebaseDB, 'users', userId);
    await updateDoc(userRef, {
      totalQuizzes: increment(1)
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des quiz complétés:', error);
  }
};

// C. Mettre à jour les bonnes réponses et la précision
export const handleAnswers = async (userId: string, correctAnswers: number, totalQuestions: number) => {
  try {
    const userRef = doc(firebaseDB, 'users', userId);
    await updateDoc(userRef, {
      totalGoodAnswers: increment(correctAnswers),
      totalQuestionsAttempted: increment(totalQuestions)
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des réponses:', error);
  }
};

// D. Enregistrer le temps d'un quiz
export const recordQuizTime = async (userId: string, duration: number) => {
  try {
    const userRef = doc(firebaseDB, 'users', userId);
    await updateDoc(userRef, {
      quizDurations: arrayUnion(duration) // durée en secondes
    });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du temps:', error);
  }
};

// Fonction complète pour terminer un quiz (selon votre plan)
export const completeQuiz = async (
  userId: string, 
  correctAnswers: number, 
  totalQuestions: number, 
  duration: number
) => {
  try {
    console.log('Mise à jour des statistiques du quiz...');
    
    // Mettre à jour le streak
    await updateStreak(userId);
    
    // Incrémenter les quiz complétés
    await handleQuizCompleted(userId);
    
    // Enregistrer les réponses
    await handleAnswers(userId, correctAnswers, totalQuestions);
    
    // Enregistrer le temps
    await recordQuizTime(userId, duration);
    
    console.log('Statistiques mises à jour avec succès');
  } catch (error) {
    console.error('Erreur lors de la finalisation du quiz:', error);
  }
};

// Récupérer les statistiques utilisateur
export const getUserQuizStats = async (userId: string) => {
  try {
    const userRef = doc(firebaseDB, 'users', userId);
    const docSnap = await getDoc(userRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      // Initialiser les données si elles n'existent pas
      const initialData = {
        currentStreak: 0,
        lastPlayed: new Date(),
        totalQuizzes: 0,
        totalGoodAnswers: 0,
        totalQuestionsAttempted: 0,
        quizDurations: []
      };
      await setDoc(userRef, initialData);
      return initialData;
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des stats:', error);
    return null;
  }
};

// Calculer la précision
export const calculateAccuracy = (userData: any) => {
  if (!userData || !userData.totalQuestionsAttempted || userData.totalQuestionsAttempted === 0) {
    return '0%';
  }
  return ((userData.totalGoodAnswers / userData.totalQuestionsAttempted) * 100).toFixed(1) + '%';
};

// Calculer le temps moyen
export const calculateAverageTime = (userData: any) => {
  if (!userData || !userData.quizDurations || userData.quizDurations.length === 0) {
    return '0s';
  }
  const total = userData.quizDurations.reduce((a: number, b: number) => a + b, 0);
  return Math.round(total / userData.quizDurations.length) + 's';
};
