import { doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';
import { firebaseDB } from '@/backend/config/firebase.config';
import { ProgressService } from './progress.service';

/**
 * Service de synchronisation globale pour maintenir la cohérence des données
 * entre Firebase, les contextes et l'interface utilisateur
 */
export class SyncService {
  private static instance: SyncService;
  private static listeners: Map<string, () => void> = new Map();
  private static userProgressListener: (() => void) | null = null;
  private static userDataListener: (() => void) | null = null;

  private constructor() {}

  public static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  /**
   * Synchronise les XP entre userProgress et users collections
   */
  async syncXPToUserCollection(userId: string, totalXP: number): Promise<void> {
    try {
      console.log(`SyncService: Synchronisation XP vers users collection: ${totalXP}`);

      // Vérifier si le document users existe avant de le mettre à jour
      const userDoc = await getDoc(doc(firebaseDB, 'users', userId));
      if (!userDoc.exists()) {
        console.log(`SyncService: Document users n'existe pas encore pour ${userId}, skip sync XP`);
        return;
      }

      // Mettre à jour la collection users avec les nouveaux XP
      await updateDoc(doc(firebaseDB, 'users', userId), {
        xpPoints: totalXP,
        lastUpdated: new Date().toISOString()
      });

      console.log(`SyncService: XP synchronisés avec succès dans users collection`);
    } catch (error) {
      console.error('SyncService: Erreur lors de la synchronisation XP:', error);
    }
  }

  /**
   * Synchronise les vies entre userProgress et users collections
   */
  async syncHeartsToUserCollection(userId: string, hearts: number): Promise<void> {
    try {
      console.log(`SyncService: Synchronisation vies vers users collection: ${hearts}`);

      // Vérifier si le document users existe avant de le mettre à jour
      const userDoc = await getDoc(doc(firebaseDB, 'users', userId));
      if (!userDoc.exists()) {
        console.log(`SyncService: Document users n'existe pas encore pour ${userId}, skip sync vies`);
        return;
      }

      // Mettre à jour la collection users avec les nouvelles vies
      await updateDoc(doc(firebaseDB, 'users', userId), {
        lives: hearts,
        lastUpdated: new Date().toISOString()
      });

      console.log(`SyncService: Vies synchronisées avec succès dans users collection`);
    } catch (error) {
      console.error('SyncService: Erreur lors de la synchronisation vies:', error);
    }
  }

  /**
   * Écoute les changements dans userProgress et synchronise avec users
   */
  startUserProgressSync(userId: string, onUpdate: (data: any) => void): void {
    console.log(`SyncService: Démarrage de la synchronisation pour ${userId}`);
    
    // Nettoyer l'ancien listener s'il existe
    if (SyncService.userProgressListener) {
      SyncService.userProgressListener();
    }

    // Écouter les changements dans userProgress
    SyncService.userProgressListener = onSnapshot(
      doc(firebaseDB, 'userProgress', userId),
      async (docSnap) => {
        if (docSnap.exists()) {
          const progressData = docSnap.data();
          console.log('SyncService: Changement détecté dans userProgress:', {
            totalXP: progressData.totalXP,
            heartsCount: progressData.heartsCount
          });

          // Synchroniser avec la collection users
          await Promise.all([
            this.syncXPToUserCollection(userId, progressData.totalXP || 0),
            this.syncHeartsToUserCollection(userId, progressData.heartsCount || 5)
          ]);

          // Notifier les composants
          onUpdate(progressData);
        }
      },
      (error) => {
        console.error('SyncService: Erreur listener userProgress:', error);
      }
    );
  }

  /**
   * Écoute les changements dans users collection
   */
  startUserDataSync(userId: string, onUpdate: (data: any) => void): void {
    // Nettoyer l'ancien listener s'il existe
    if (SyncService.userDataListener) {
      SyncService.userDataListener();
    }

    // Écouter les changements dans users
    SyncService.userDataListener = onSnapshot(
      doc(firebaseDB, 'users', userId),
      (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          console.log('SyncService: Changement détecté dans users:', userData);
          onUpdate(userData);
        }
      },
      (error) => {
        console.error('SyncService: Erreur listener users:', error);
      }
    );
  }

  /**
   * Force une synchronisation complète
   */
  async forceSyncAll(userId: string): Promise<void> {
    try {
      console.log(`SyncService: Synchronisation forcée pour ${userId}`);
      
      // Récupérer les données de userProgress
      const progressService = new ProgressService();
      const userProgress = await progressService.getUserProgress(true);
      
      if (userProgress) {
        // Synchroniser avec users collection
        await Promise.all([
          this.syncXPToUserCollection(userId, userProgress.totalXP || 0),
          this.syncHeartsToUserCollection(userId, userProgress.heartsCount || 5)
        ]);
      }
      
      console.log(`SyncService: Synchronisation forcée terminée`);
    } catch (error) {
      console.error('SyncService: Erreur lors de la synchronisation forcée:', error);
    }
  }

  /**
   * Nettoie tous les listeners
   */
  cleanup(): void {
    console.log('SyncService: Nettoyage des listeners');
    
    if (SyncService.userProgressListener) {
      SyncService.userProgressListener();
      SyncService.userProgressListener = null;
    }
    
    if (SyncService.userDataListener) {
      SyncService.userDataListener();
      SyncService.userDataListener = null;
    }
    
    SyncService.listeners.clear();
  }

  /**
   * Ajoute un listener personnalisé
   */
  addListener(key: string, callback: () => void): void {
    SyncService.listeners.set(key, callback);
  }

  /**
   * Supprime un listener personnalisé
   */
  removeListener(key: string): void {
    SyncService.listeners.delete(key);
  }

  /**
   * Notifie tous les listeners
   */
  notifyListeners(): void {
    SyncService.listeners.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        console.error('SyncService: Erreur lors de la notification:', error);
      }
    });
  }
}
