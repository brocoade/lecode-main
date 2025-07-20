import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated, Easing, TouchableOpacity } from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useXP } from '@/context/XPContext';
import { useHearts } from '@/context/HeartsContext';
import { HeartDisplay } from '@/components/game/HeartDisplay';

interface HeaderProps {
  level?: number; // Optionnel car on va utiliser le niveau du contexte
  xp?: number; // Points d'expérience (étoiles)
  hearts?: number; // Optionnel maintenant car on utilise le contexte
  newXP?: number; // Points XP gagnés récemment (optionnel)
  showHearts?: boolean; // Permet de cacher les cœurs si nécessaire
  onHeartsPress?: () => void; // Callback lorsqu'on appuie sur les cœurs
  title?: string; // Titre custom (pour la traduction)
  levelLabel?: string; // Label custom pour le niveau (pour la traduction)
}

export const Header: React.FC<HeaderProps> = ({ 
  level: propLevel, 
  xp = 520, 
  hearts, 
  newXP = 0,
  showHearts = true,
  onHeartsPress,
  title = 'MEDUCARE',
  levelLabel = 'Niveau',
}) => {
  // Animation pour les XP gagnés
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [showXPGain, setShowXPGain] = useState(false);
  const [currentXP, setCurrentXP] = useState(xp);
  
  // Récupérer les XP et le niveau du contexte global
  const xpContext = useXP();
  
  // Utiliser le niveau du contexte comme source de vérité principale
  const effectiveLevel = xpContext.level || propLevel || 1;
  
  // Utiliser le XP du contexte comme source de vérité principale
  // Cela garantit que le Header affiche toujours la valeur correcte
  const effectiveXP = xpContext.xp > 0 ? xpContext.xp : xp;
  const xpToShow = newXP > 0 ? newXP : 0;
  
  // Récupérer les cœurs du contexte global
  const heartsContext = useHearts();
  const actualHearts = hearts !== undefined ? hearts : heartsContext.hearts;
  const maxHearts = heartsContext.maxHearts;
  
  // Effet qui déclenche l'animation lorsque newXP change
  useEffect(() => {
    if (xpToShow > 0) {
      // Réinitialiser l'animation
      fadeAnim.setValue(0);
      translateY.setValue(20);
      scaleAnim.setValue(1);
      setShowXPGain(true);
      
      // Démarrer l'animation
      Animated.sequence([
        // Apparition avec rebond
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.spring(translateY, {
            toValue: 0,
            friction: 6,
            useNativeDriver: true,
          }),
        ]),
        
        // Petite pause pour que l'utilisateur voie clairement le gain
        Animated.delay(500),
        
        // Pulse d'échelle pour effet visuel
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 200,
          easing: Easing.bounce,
          useNativeDriver: true,
        }),
        
        // Retour à la normale
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        
        // Disparition progressive
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          delay: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowXPGain(false);
      });
      
      // Mettre à jour le compteur d'XP actualisé
      setCurrentXP(effectiveXP);
    }
  }, [xpToShow, effectiveXP, fadeAnim, translateY, scaleAnim]);

  useEffect(() => {
    // Mettre à jour le XP local quand le XP du contexte change
    setCurrentXP(effectiveXP);
  }, [effectiveXP]);

  return (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.statsContainer}>
        <View style={styles.levelContainer}>
          <View style={styles.levelIconContainer}>
            <Image 
              source={require('../../assets/images/couches.png')} 
              style={styles.levelIcon} 
              resizeMode="contain"
            />
          </View>
          <Text style={styles.levelText}>{levelLabel} {effectiveLevel}</Text>
        </View>
        <View style={styles.rightStats}>
          <View style={styles.statItem}>
            <FontAwesome name="star" size={16} color="#FFD700" />
            <Text style={styles.statText}>{currentXP}</Text>
            
            {/* Notification de gain d'XP */}
            {showXPGain && (
              <Animated.View 
                style={[
                  styles.xpGainContainer,
                  {
                    opacity: fadeAnim,
                    transform: [
                      { translateY: translateY },
                      { scale: scaleAnim }
                    ]
                  }
                ]}
              >
                <Text style={styles.xpGainText}>+{xpToShow}</Text>
              </Animated.View>
            )}
          </View>
          
          {showHearts && (
            <View style={styles.statItem}>
              <HeartDisplay 
                remainingHearts={actualHearts} 
                maxHearts={maxHearts} 
              />
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#3E8E41',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  levelIconContainer: {
    marginRight: 5,
  },
  levelIcon: {
    width: 18,
    height: 18,
  },
  levelText: {
    color: 'white',
    fontWeight: '600',
  },
  rightStats: {
    flexDirection: 'row',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
    position: 'relative', // Pour le positionnement de l'animation
  },
  statText: {
    color: 'white',
    marginLeft: 5,
    fontWeight: '600',
  },
  xpGainContainer: {
    position: 'absolute',
    top: -25,
    right: 0,
    backgroundColor: '#FFD700',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    zIndex: 10,
  },
  xpGainText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 14,
  },
}); 