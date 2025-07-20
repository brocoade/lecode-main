import React, { createContext, useState, useContext, useEffect } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { useAuth } from './AuthContext';
import { ProgressService } from '@/app/services/progress.service';

interface XPContextType {
  xp: number;
  level: number;
  addXP: (amount: number) => void;
  showXPAnimation: (amount: number) => void;
  refreshXP: () => Promise<void>;
}

const XPContext = createContext<XPContextType | undefined>(undefined);

// Fonction pour calculer le niveau en fonction des XP
const calculateLevel = (totalXP: number): number => {
  // Formule simple : chaque niveau nécessite (niveau * 1000) XP
  // Par exemple, niveau 2 = 1000 XP, niveau 3 = 3000 XP totaux, etc.
  if (totalXP < 1000) return 1;
  
  // Calculer le niveau basé sur le total d'XP
  const level = Math.floor(Math.sqrt(totalXP / 1000)) + 1;
  return level;
};

export const XPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [xp, setXP] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const { user } = useAuth();
  const [animationValue] = useState(new Animated.Value(0));
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationAmount, setAnimationAmount] = useState(0);

  // Mettre à jour le niveau lorsque les XP changent
  useEffect(() => {
    const newLevel = calculateLevel(xp);
    if (newLevel !== level) {
      console.log(`XPContext: Passage au niveau ${newLevel}`);
      setLevel(newLevel);
    }
  }, [xp]);

  // Fonction pour rafraîchir les XP depuis Firebase
  const refreshXP = async () => {
    if (!user) return;
    
    try {
      console.log("XPContext: Rafraîchissement des XP depuis Firebase...");
      const progressService = new ProgressService();
      // Créer une promesse pour la mise à jour Firebase
      const updatePromise = progressService.getUserProgress(true);
      
      // Mettre à jour l'UI immédiatement avec les données du cache si disponibles
      // pour une perception de rapidité
      const cachedProgress = await progressService.getUserProgress(false);
      if (cachedProgress && cachedProgress.totalXP) {
        console.log(`XPContext: Utilisation des XP en cache: ${cachedProgress.totalXP}`);
        setXP(cachedProgress.totalXP);
      }
      
      // Attendre la réponse Firebase et mettre à jour si nécessaire
      const userProgress = await updatePromise;
      if (userProgress) {
        const newXP = userProgress.totalXP;
        console.log(`XPContext: XP rechargés, nouvelle valeur: ${newXP}`);
        setXP(newXP);
      }
    } catch (error) {
      console.error('XPContext: Erreur lors du rafraîchissement des XP:', error);
    }
  };

  // Charger les XP initiaux et configurer le rafraîchissement périodique
  useEffect(() => {
    const loadXP = async () => {
      await refreshXP();
    };
    
    if (user) {
      loadXP();
      
      // Rafraîchir les XP toutes les 10 secondes au lieu de 30 pour une meilleure réactivité
      const interval = setInterval(loadXP, 10000);
      
      return () => {
        clearInterval(interval);
      };
    }
  }, [user]);

  const addXP = async (amount: number) => {
    if (amount <= 0 || !user) return;
    
    console.log(`XPContext: Ajout de ${amount} XP au total actuel de ${xp}`);
    
    // Mettre à jour le state local immédiatement pour une meilleure réactivité de l'UI
    const newXP = xp + amount;
    console.log(`XPContext: Nouveau total XP calculé: ${newXP}`);
    setXP(newXP);
    
    try {
      // Mettre à jour dans Firebase via ProgressService
      const progressService = new ProgressService();
      console.log(`XPContext: Envoi de la mise à jour des XP à Firebase...`);
      const success = await progressService.updateTotalXP(amount);
      console.log(`XPContext: Mise à jour Firebase ${success ? 'réussie' : 'échouée'}`);
      
      if (success) {
        // Afficher l'animation uniquement si la mise à jour a réussi
        console.log(`XPContext: Lancement de l'animation XP pour ${amount} points`);
        showXPAnimation(amount);
        
        // Rafraîchir les XP depuis Firebase pour s'assurer que tout est synchronisé
        setTimeout(refreshXP, 1000);
      } else {
        console.error(`XPContext: Échec de la mise à jour des XP dans Firebase`);
        // En cas d'échec, revenir au total précédent
        setXP(xp);
      }
    } catch (error) {
      console.error('XPContext: Erreur lors de la mise à jour des XP:', error);
      // En cas d'erreur, revenir au total précédent
      setXP(xp);
    }
  };

  const showXPAnimation = (amount: number) => {
    setAnimationAmount(amount);
    setShowAnimation(true);
    animationValue.setValue(0);
    
    Animated.sequence([
      Animated.timing(animationValue, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(animationValue, {
        toValue: 0,
        duration: 400,
        delay: 1000,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowAnimation(false);
    });
  };

  return (
    <XPContext.Provider value={{ xp, level, addXP, showXPAnimation, refreshXP }}>
      {children}
      
      {showAnimation && (
        <Animated.View
          style={[
            styles.animationContainer,
            {
              opacity: animationValue,
              transform: [
                {
                  translateY: animationValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.animationText}>+{animationAmount} XP</Text>
        </Animated.View>
      )}
    </XPContext.Provider>
  );
};

const styles = StyleSheet.create({
  animationContainer: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 1000,
  },
  animationText: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export const useXP = (): XPContextType => {
  const context = useContext(XPContext);
  if (context === undefined) {
    throw new Error('useXP doit être utilisé à l\'intérieur d\'un XPProvider');
  }
  return context;
}; 