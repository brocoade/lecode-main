import React, { createContext, useState, useContext, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { HeartsService } from '@/app/services/hearts.service';
import { useAuth } from './AuthContext';

interface HeartsContextType {
  hearts: number;
  maxHearts: number;
  isRegenerating: boolean;
  consumeHeart: () => Promise<boolean>;
  addHearts: (amount: number) => Promise<boolean>;
}

const HeartsContext = createContext<HeartsContextType | undefined>(undefined);

export const HeartsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hearts, setHearts] = useState<number>(5); // Valeur par défaut
  const [maxHearts, setMaxHearts] = useState<number>(5);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const { user } = useAuth();
  const heartsService = new HeartsService();

  // Charger les cœurs initiaux
  useEffect(() => {
    const loadHearts = async () => {
      if (user) {
        try {
          const heartInfo = await heartsService.getHeartInfo();
          if (heartInfo) {
            setHearts(heartInfo.remainingHearts);
            setMaxHearts(heartInfo.maxHearts);
            setIsRegenerating(heartInfo.nextRegenerationTime > 0);
          }
        } catch (error) {
          console.error('Erreur lors du chargement des cœurs:', error);
        }
      }
    };
    
    loadHearts();
    
    // Mettre à jour les cœurs toutes les minutes pour vérifier les régénérations
    const interval = setInterval(loadHearts, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const consumeHeart = async (): Promise<boolean> => {
    if (hearts <= 0) return false;
    
    try {
      const success = await heartsService.consumeHeart();
      if (success) {
        setHearts(prevHearts => prevHearts - 1);
        // Vérifier si la régénération a commencé
        const heartInfo = await heartsService.getHeartInfo(true);
        if (heartInfo) {
          setIsRegenerating(heartInfo.nextRegenerationTime > 0);
        }
      }
      return success;
    } catch (error) {
      console.error('Erreur lors de la consommation d\'un cœur:', error);
      return false;
    }
  };

  const addHearts = async (amount: number): Promise<boolean> => {
    if (amount <= 0) return false;
    
    try {
      const success = await heartsService.addHearts(amount);
      if (success) {
        // Recharger les cœurs depuis le service pour s'assurer qu'ils sont à jour
        const heartInfo = await heartsService.getHeartInfo(true);
        if (heartInfo) {
          setHearts(heartInfo.remainingHearts);
          setIsRegenerating(heartInfo.nextRegenerationTime > 0);
        }
      }
      return success;
    } catch (error) {
      console.error('Erreur lors de l\'ajout de cœurs:', error);
      return false;
    }
  };

  return (
    <HeartsContext.Provider value={{ hearts, maxHearts, isRegenerating, consumeHeart, addHearts }}>
      {children}
    </HeartsContext.Provider>
  );
};

export const useHearts = (): HeartsContextType => {
  const context = useContext(HeartsContext);
  if (context === undefined) {
    throw new Error('useHearts doit être utilisé à l\'intérieur d\'un HeartsProvider');
  }
  return context;
}; 