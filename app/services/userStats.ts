import { getDatabase, ref, onValue, set, increment, update } from 'firebase/database';
import { getAuth } from 'firebase/auth';

interface UserProfile {
  name: string;
  email: string;
}

interface UserStats {
  lives: number;
  xpPoints: number;
  memberSince: string;
  bloodType: string;
  birthDate: string;
}

class UserStatsService {
  private db = getDatabase();
  private auth = getAuth();

  // Initialiser les stats d'un nouvel utilisateur (ne pas écraser les données Firestore)
  async initializeUserStats(uid: string, bloodType: string, birthDate: string, name: string, email: string) {
    try {
      console.log('userStatsService: Initialisation des stats pour:', { uid, bloodType, birthDate, name, email });

      const userRef = ref(this.db, `users/${uid}`);
      const now = new Date().toISOString();

      // Données pour Realtime Database (stats de jeu)
      const realtimeData = {
        profile: {
          name,
          email,
        },
        stats: {
          lives: 5, // Nombre initial de vies
          xpPoints: 0,
          memberSince: now,
          bloodType,
          birthDate
        }
      };

      await set(userRef, realtimeData);
      console.log('userStatsService: Stats sauvegardées dans Realtime Database');
    } catch (error) {
      console.error('userStatsService: Erreur lors de l\'initialisation:', error);
    }
  }

  // Mettre à jour le profil utilisateur
  async updateUserProfile(updates: Partial<UserStats & UserProfile>) {
    const uid = this.auth.currentUser?.uid;
    if (!uid) throw new Error('Utilisateur non connecté');
    
    const statsUpdates: Partial<UserStats> = {};
    const profileUpdates: Partial<UserProfile> = {};

    // Séparer les mises à jour entre stats et profile
    if ('bloodType' in updates) statsUpdates.bloodType = updates.bloodType;
    if ('birthDate' in updates) statsUpdates.birthDate = updates.birthDate;
    if ('name' in updates) profileUpdates.name = updates.name;

    const promises = [];
    
    // Mettre à jour les stats si nécessaire
    if (Object.keys(statsUpdates).length > 0) {
      const statsRef = ref(this.db, `users/${uid}/stats`);
      promises.push(update(statsRef, statsUpdates));
    }

    // Mettre à jour le profil si nécessaire
    if (Object.keys(profileUpdates).length > 0) {
      const profileRef = ref(this.db, `users/${uid}/profile`);
      promises.push(update(profileRef, profileUpdates));
    }

    await Promise.all(promises);
  }

  // Mettre à jour le nom
  async updateName(name: string) {
    return this.updateUserProfile({ name });
  }

  // Mettre à jour le groupe sanguin
  async updateBloodType(bloodType: string) {
    return this.updateUserProfile({ bloodType });
  }

  // Mettre à jour la date de naissance
  async updateBirthDate(birthDate: string) {
    return this.updateUserProfile({ birthDate });
  }

  // Décrémenter le nombre de vies
  async decrementLives() {
    const uid = this.auth.currentUser?.uid;
    if (!uid) return;
    
    const userRef = ref(this.db, `users/${uid}/stats/lives`);
    await set(userRef, increment(-1));
  }

  // Ajouter des vies
  async addLives(amount: number) {
    const uid = this.auth.currentUser?.uid;
    if (!uid) return;
    
    const userRef = ref(this.db, `users/${uid}/stats/lives`);
    await set(userRef, increment(amount));
  }

  // Ajouter des points XP
  async addXP(amount: number) {
    const uid = this.auth.currentUser?.uid;
    if (!uid) return;
    
    const userRef = ref(this.db, `users/${uid}/stats/xpPoints`);
    await set(userRef, increment(amount));
  }

  // Obtenir les stats en temps réel
  onUserStatsChange(uid: string, callback: (stats: UserStats & UserProfile) => void) {
    const userRef = ref(this.db, `users/${uid}`);
    return onValue(userRef, (snapshot) => {
      const userData = snapshot.val();
      if (!userData) return;
      
      // Combiner les données du profil et des stats
      const combinedData = {
        ...userData.stats,
        ...userData.profile
      };
      
      callback(combinedData);
    });
  }
}

export const userStatsService = new UserStatsService(); 