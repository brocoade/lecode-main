import { firestore } from '../config/firebase';
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';

interface StreakData {
  currentStreak: number;
  lastQuizDate: string;
  highestStreak: number;
}

export const streakService = {
  async getStreak(userId: string): Promise<StreakData> {
    const streakRef = doc(firestore, 'users', userId, 'stats', 'streak');
    const streakDoc = await getDoc(streakRef);

    if (!streakDoc.exists()) {
      // Initialize streak data if it doesn't exist
      const initialData: StreakData = {
        currentStreak: 0,
        lastQuizDate: '',
        highestStreak: 0
      };
      await setDoc(streakRef, initialData);
      return initialData;
    }

    return streakDoc.data() as StreakData;
  },

  async updateStreak(userId: string): Promise<StreakData> {
    const streakRef = doc(firestore, 'users', userId, 'stats', 'streak');
    const streakDoc = await getDoc(streakRef);
    const today = new Date().toISOString().split('T')[0];
    
    let currentData = streakDoc.exists() 
      ? (streakDoc.data() as StreakData)
      : { currentStreak: 0, lastQuizDate: '', highestStreak: 0 };

    if (!currentData.lastQuizDate) {
      // Premier quiz
      currentData = {
        currentStreak: 1,
        lastQuizDate: today,
        highestStreak: 1
      };
    } else {
      const lastQuizDate = new Date(currentData.lastQuizDate);
      const todayDate = new Date(today);
      const diffDays = Math.floor((todayDate.getTime() - lastQuizDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Jour consécutif
        currentData.currentStreak += 1;
        currentData.lastQuizDate = today;
        if (currentData.currentStreak > currentData.highestStreak) {
          currentData.highestStreak = currentData.currentStreak;
        }
      } else if (diffDays === 0) {
        // Même jour, ne rien faire
        return currentData;
      } else {
        // Streak cassé
        currentData.currentStreak = 1;
        currentData.lastQuizDate = today;
      }
    }

    await setDoc(streakRef, currentData);
    return currentData;
  }
}; 