import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { firebaseAuth, firebaseDB } from '@/backend/config/firebase.config';
import { ProgressService } from './progress.service';

export interface HeartRegenerationInfo {
  nextRegenerationTime: number; // Timestamp en millisecondes
  remainingHearts: number;
  maxHearts: number;
  regenStartTime: number | null; // Timestamp de début de régénération quand les cœurs sont à 0
}

export class HeartsService {
  private static readonly MAX_HEARTS = 5;
  private static readonly REGENERATION_TIME_MS = 60 * 60 * 1000; // 1 heure en millisecondes
  
  private static heartCache: HeartRegenerationInfo | null = null;
  private static lastCacheTime = 0;
  private static readonly CACHE_EXPIRATION_MS = 5 * 60 * 1000; // 5 minutes
  
  /**
   * Récupère les informations sur les cœurs de l'utilisateur
   * @param forceRefresh Force le rechargement des données depuis Firebase
   */
  async getHeartInfo(forceRefresh: boolean = false): Promise<HeartRegenerationInfo | null> {
    const user = firebaseAuth.currentUser;
    if (!user) return null;
    
    // Vérifier si le cache est valide
    const now = Date.now();
    if (
      !forceRefresh && 
      HeartsService.heartCache && 
      now - HeartsService.lastCacheTime < HeartsService.CACHE_EXPIRATION_MS
    ) {
      return this.processHeartRegeneration(HeartsService.heartCache);
    }
    
    try {
      console.log('Récupération des cœurs depuis Firebase');
      const heartRef = doc(firebaseDB, 'userHearts', user.uid);
      const heartDoc = await getDoc(heartRef);
      
      let heartInfo: HeartRegenerationInfo;
      
      if (heartDoc.exists()) {
        heartInfo = heartDoc.data() as HeartRegenerationInfo;
        // S'assurer que regenStartTime existe dans l'objet
        if (heartInfo.regenStartTime === undefined) {
          heartInfo.regenStartTime = null;
        }
      } else {
        // Initialiser les cœurs pour un nouvel utilisateur
        heartInfo = {
          nextRegenerationTime: 0, // Aucune régénération en cours
          remainingHearts: HeartsService.MAX_HEARTS,
          maxHearts: HeartsService.MAX_HEARTS,
          regenStartTime: null // Pas de régénération en cours
        };
        
        // Sauvegarder l'état initial
        await setDoc(heartRef, heartInfo);
      }
      
      // Traiter la régénération potentielle des cœurs
      const updatedHeartInfo = this.processHeartRegeneration(heartInfo);
      
      // Mettre à jour le cache
      HeartsService.heartCache = updatedHeartInfo;
      HeartsService.lastCacheTime = now;
      
      return updatedHeartInfo;
    } catch (error) {
      console.error('Erreur lors de la récupération des cœurs:', error);
      return null;
    }
  }
  
  /**
   * Vérifie si l'utilisateur a au moins un cœur disponible
   */
  async hasAvailableHeart(): Promise<boolean> {
    const heartInfo = await this.getHeartInfo();
    return heartInfo !== null && heartInfo.remainingHearts > 0;
  }
  
  /**
   * Consomme des cœurs lorsque l'utilisateur échoue à un quiz
   * @param amount Nombre de cœurs à consommer (par défaut 2)
   * @returns True si les cœurs ont été consommés avec succès, false sinon
   */
  async consumeHearts(amount: number = 2, updateMainProgress: boolean = true): Promise<boolean> {
    const user = firebaseAuth.currentUser;
    if (!user) return false;
    
    const heartInfo = await this.getHeartInfo(true);
    if (!heartInfo) return false;
    
    try {
      // Mise à jour des cœurs
      const newRemainingHearts = Math.max(0, heartInfo.remainingHearts - amount);
      
      // Mettre à jour le prochain temps de régénération si nécessaire
      let nextRegenerationTime = heartInfo.nextRegenerationTime;
      let regenStartTime = heartInfo.regenStartTime;
      
      // Si c'est le premier cœur perdu (passant de MAX à MAX-1), définir le temps de régénération
      if (newRemainingHearts === heartInfo.maxHearts - 1 && heartInfo.nextRegenerationTime === 0) {
        nextRegenerationTime = Date.now() + HeartsService.REGENERATION_TIME_MS;
      }
      
      // Si tous les cœurs sont perdus, définir regenStartTime
      if (newRemainingHearts === 0 && !regenStartTime) {
        regenStartTime = Date.now();
        nextRegenerationTime = Date.now() + HeartsService.REGENERATION_TIME_MS;
        console.log(`Tous les cœurs perdus. Début de régénération à ${new Date(regenStartTime).toLocaleString()}`);
      }
      
      // Mettre à jour les informations des cœurs
      const updatedHeartInfo: HeartRegenerationInfo = {
        nextRegenerationTime,
        remainingHearts: newRemainingHearts,
        maxHearts: heartInfo.maxHearts,
        regenStartTime
      };
      
      // Sauvegarder dans Firestore
      const heartRef = doc(firebaseDB, 'userHearts', user.uid);
      await setDoc(heartRef, updatedHeartInfo);
      
      // Mettre à jour le cache
      HeartsService.heartCache = updatedHeartInfo;
      HeartsService.lastCacheTime = Date.now();
      
      // Mettre à jour le service de progression si demandé
      if (updateMainProgress) {
        try {
          const progressService = new ProgressService();
          const userProgress = await progressService.getUserProgress(true);
          
          if (userProgress) {
            userProgress.heartsCount = newRemainingHearts;
            
            const progressRef = doc(firebaseDB, 'userProgress', user.uid);
            await setDoc(progressRef, userProgress);
            
            // Mettre à jour le cache du service de progression
            progressService.clearProgressCache();
          }
        } catch (progressError) {
          console.error('Erreur lors de la mise à jour de la progression principale:', progressError);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la consommation des cœurs:', error);
      return false;
    }
  }
  
  /**
   * Méthode maintenue pour compatibilité
   */
  async consumeHeart(updateMainProgress: boolean = true): Promise<boolean> {
    return this.consumeHearts(1, updateMainProgress);
  }
  
  /**
   * Ajoute des cœurs à l'utilisateur (récompense ou achat)
   * @param amount Nombre de cœurs à ajouter
   * @returns True si les cœurs ont été ajoutés avec succès, false sinon
   */
  async addHearts(amount: number): Promise<boolean> {
    if (amount <= 0) return false;
    
    const user = firebaseAuth.currentUser;
    if (!user) return false;
    
    const heartInfo = await this.getHeartInfo(true);
    if (!heartInfo) return false;
    
    try {
      // Calculer le nouveau nombre de cœurs en respectant la limite maximale
      const newRemainingHearts = Math.min(heartInfo.remainingHearts + amount, heartInfo.maxHearts);
      
      // Si tous les cœurs sont récupérés, réinitialiser le temps de régénération
      const nextRegenerationTime = newRemainingHearts === heartInfo.maxHearts ? 0 : heartInfo.nextRegenerationTime;
      
      // Si on passe de 0 à plus de 0 cœurs, réinitialiser regenStartTime
      const regenStartTime = newRemainingHearts > 0 ? null : heartInfo.regenStartTime;
      
      // Mettre à jour les informations des cœurs
      const updatedHeartInfo: HeartRegenerationInfo = {
        nextRegenerationTime,
        remainingHearts: newRemainingHearts,
        maxHearts: heartInfo.maxHearts,
        regenStartTime
      };
      
      // Sauvegarder dans Firestore
      const heartRef = doc(firebaseDB, 'userHearts', user.uid);
      await setDoc(heartRef, updatedHeartInfo);
      
      // Mettre à jour le cache
      HeartsService.heartCache = updatedHeartInfo;
      HeartsService.lastCacheTime = Date.now();
      
      // Mettre à jour également la progression principale
      try {
        const progressService = new ProgressService();
        const userProgress = await progressService.getUserProgress(true);
        
        if (userProgress) {
          userProgress.heartsCount = newRemainingHearts;
          
          const progressRef = doc(firebaseDB, 'userProgress', user.uid);
          await setDoc(progressRef, userProgress);
          
          // Mettre à jour le cache du service de progression
          progressService.clearProgressCache();
        }
      } catch (progressError) {
        console.error('Erreur lors de la mise à jour de la progression principale:', progressError);
      }
      
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'ajout de cœurs:', error);
      return false;
    }
  }
  
  /**
   * Traite la régénération automatique des cœurs
   * @param heartInfo Informations actuelles sur les cœurs
   * @returns Informations mises à jour après traitement de la régénération
   */
  private processHeartRegeneration(heartInfo: HeartRegenerationInfo): HeartRegenerationInfo {
    const now = Date.now();
    
    // Si le joueur a déjà tous ses cœurs ou qu'aucune régénération n'est en cours
    if (
      heartInfo.remainingHearts >= heartInfo.maxHearts || 
      (heartInfo.nextRegenerationTime === 0 && heartInfo.regenStartTime === null)
    ) {
      return heartInfo;
    }
    
    // Cas spécial: 0 cœurs avec regenStartTime défini
    if (heartInfo.remainingHearts === 0 && heartInfo.regenStartTime !== null) {
      // Vérifier si au moins 1 heure s'est écoulée depuis le début de la régénération
      const timeSinceRegenStart = now - heartInfo.regenStartTime;
      
      if (timeSinceRegenStart >= HeartsService.REGENERATION_TIME_MS) {
        // Régénérer un seul cœur après 1 heure
        const updatedHeartInfo: HeartRegenerationInfo = {
          nextRegenerationTime: 0, // Réinitialiser car on ne régénère qu'un seul cœur
          remainingHearts: 1,
          maxHearts: heartInfo.maxHearts,
          regenStartTime: null // Réinitialiser car on a régénéré un cœur
        };
        
        // Sauvegarder les changements de manière asynchrone
        this.saveHeartInfoAsync(updatedHeartInfo);
        
        return updatedHeartInfo;
      }
      
      // Sinon, pas encore temps de régénérer
      return heartInfo;
    }
    
    // Cas normal: régénération progressive pour les cœurs > 0
    if (now >= heartInfo.nextRegenerationTime) {
      // Calculer combien de cœurs ont été régénérés depuis la dernière vérification
      const timeSinceFirstRegeneration = now - heartInfo.nextRegenerationTime + HeartsService.REGENERATION_TIME_MS;
      const regeneratedHearts = Math.min(
        Math.floor(timeSinceFirstRegeneration / HeartsService.REGENERATION_TIME_MS) + 1,
        heartInfo.maxHearts - heartInfo.remainingHearts
      );
      
      // Mettre à jour le nombre de cœurs restants
      const newRemainingHearts = heartInfo.remainingHearts + regeneratedHearts;
      
      // Calculer le prochain temps de régénération
      let nextRegenerationTime = 0;
      if (newRemainingHearts < heartInfo.maxHearts) {
        // Calculer le temps restant pour le prochain cœur
        const timePassedSinceLastFull = timeSinceFirstRegeneration % HeartsService.REGENERATION_TIME_MS;
        nextRegenerationTime = now + (HeartsService.REGENERATION_TIME_MS - timePassedSinceLastFull);
      }
      
      // Créer les informations mises à jour
      const updatedHeartInfo: HeartRegenerationInfo = {
        nextRegenerationTime,
        remainingHearts: newRemainingHearts,
        maxHearts: heartInfo.maxHearts,
        regenStartTime: null // Réinitialiser car on a des cœurs > 0
      };
      
      // Sauvegarder les changements de manière asynchrone
      this.saveHeartInfoAsync(updatedHeartInfo);
      
      return updatedHeartInfo;
    }
    
    // Si aucune régénération n'est nécessaire, retourner les informations inchangées
    return heartInfo;
  }
  
  /**
   * Sauvegarde les informations des cœurs de manière asynchrone
   * @param heartInfo Informations sur les cœurs à sauvegarder
   */
  private async saveHeartInfoAsync(heartInfo: HeartRegenerationInfo): Promise<void> {
    const user = firebaseAuth.currentUser;
    if (!user) return;
    
    try {
      const heartRef = doc(firebaseDB, 'userHearts', user.uid);
      await setDoc(heartRef, heartInfo);
      
      // Mettre à jour également la progression principale
      const progressService = new ProgressService();
      const userProgress = await progressService.getUserProgress();
      
      if (userProgress) {
        userProgress.heartsCount = heartInfo.remainingHearts;
        
        const progressRef = doc(firebaseDB, 'userProgress', user.uid);
        await setDoc(progressRef, userProgress);
        
        // Mettre à jour le cache du service de progression
        progressService.clearProgressCache();
      }
      
      // Mettre à jour le cache
      HeartsService.heartCache = heartInfo;
      HeartsService.lastCacheTime = Date.now();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde asynchrone des cœurs:', error);
    }
  }
  
  /**
   * Récupère le temps restant avant la prochaine régénération de cœur
   * @returns Temps restant en millisecondes, ou 0 si aucune régénération n'est en cours
   */
  async getTimeUntilNextHeart(): Promise<number> {
    const heartInfo = await this.getHeartInfo();
    if (!heartInfo) return 0;
    
    // Si on est à 0 cœurs, vérifier regenStartTime
    if (heartInfo.remainingHearts === 0 && heartInfo.regenStartTime) {
      const now = Date.now();
      const timeUntilRegen = Math.max(0, heartInfo.regenStartTime + HeartsService.REGENERATION_TIME_MS - now);
      return timeUntilRegen;
    }
    
    // Cas normal: vérifier nextRegenerationTime
    if (heartInfo.nextRegenerationTime === 0) return 0;
    
    const now = Date.now();
    return Math.max(0, heartInfo.nextRegenerationTime - now);
  }
  
  /**
   * Récupère le temps restant formaté (hh:mm:ss) avant la prochaine régénération
   */
  async getFormattedTimeUntilNextHeart(): Promise<string> {
    const timeMs = await this.getTimeUntilNextHeart();
    if (timeMs === 0) return '';
    
    const hours = Math.floor(timeMs / 3600000);
    const minutes = Math.floor((timeMs % 3600000) / 60000);
    const seconds = Math.floor((timeMs % 60000) / 1000);
    
    if (hours > 0) {
      return `${hours}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  }
  
  /**
   * Vide le cache des cœurs
   */
  clearHeartCache(): void {
    HeartsService.heartCache = null;
    HeartsService.lastCacheTime = 0;
  }
  
  /**
   * Gère les cœurs à la fin d'un quiz en fonction du score
   * @param score Pourcentage de réussite (0-100)
   * @returns Nombre de cœurs gagnés ou perdus
   */
  async handleQuizCompletion(score: number): Promise<number> {
    if (score >= 60) {
      // Gain d'un cœur si score ≥ 60%
      await this.addHearts(1);
      return 1;
    } else {
      // Perte de deux cœurs si score < 60%
      await this.consumeHearts(2);
      return -2;
    }
  }
  
  /**
   * Vérifie si l'utilisateur peut jouer à un quiz (a au moins un cœur)
   * @returns {boolean} True si l'utilisateur peut jouer, false sinon
   */
  async canPlayQuiz(): Promise<boolean> {
    const heartInfo = await this.getHeartInfo(true);
    return heartInfo !== null && heartInfo.remainingHearts > 0;
  }
} 