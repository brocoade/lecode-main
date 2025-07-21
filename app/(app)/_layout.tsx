import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack, Slot } from 'expo-router';
import { Header } from '@/components/layout/Header';
import BottomTabBar from '@/components/navigation/BottomTabBar';
import { useAuth } from '@/context/AuthContext';
import { ProgressService } from '@/app/services/progress.service';
import { useXP } from '@/context/XPContext';
import { useHearts } from '@/context/HeartsContext';

export default function MainLayout() {
  // États pour les informations utilisateur à passer au Header
  const [totalXP, setTotalXP] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { xp } = useXP(); // Obtenir les XP directement du contexte
  const { hearts, maxHearts } = useHearts();
  
  // Surveillance des changements dans xp (du contexte XP) - optimisée
  useEffect(() => {
    if (xp > 0 && xp !== totalXP) {
      setTotalXP(xp);
    }
  }, [xp]); // Supprimer totalXP des dépendances pour éviter les boucles

  // Charger les statistiques utilisateur au montage seulement
  useEffect(() => {
    const loadUserStats = async () => {
      if (!user) return;

      try {
        const progressService = new ProgressService();
        setIsLoading(true);

        // Charger depuis le cache d'abord, sans bloquer l'interface
        setTimeout(async () => {
          try {
            // Vérifier à nouveau que l'utilisateur est toujours connecté
            if (!user) {
              setIsLoading(false);
              return;
            }

            const cachedProgress = await progressService.getUserProgress(false);
            if (cachedProgress) {
              setTotalXP(cachedProgress.totalXP || 0);
            }
          } catch (error) {
            console.error('Erreur lors du chargement des statistiques utilisateur:', error);
          } finally {
            setIsLoading(false);
          }
        }, 100); // Délai minimal pour permettre l'affichage de l'interface
      } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        setIsLoading(false);
      }
    };

    // Charger seulement une fois au montage
    if (user && totalXP === 0) {
      loadUserStats();
    }
  }, [user]); // Optimisé : dépendances minimales

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          headerShown: false,
          animation: 'fade',
          animationDuration: 150,
        }} 
      />
      
      {/* Header fixe en haut */}
      <Header xp={totalXP} />
      
      {/* Zone de contenu défilable pour les écrans */}
      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingPlaceholder} />
        ) : null}
        <Slot />
      </View>
      
      {/* BottomTabBar fixe en bas */}
      <BottomTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
    // Padding pour éviter que le contenu soit caché sous le BottomTabBar
    paddingBottom: 70,
  },
  loadingPlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 1,
  }
}); 