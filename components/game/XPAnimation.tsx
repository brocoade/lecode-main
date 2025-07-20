import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface XPAnimationProps {
  amount: number;
  onAnimationComplete?: () => void;
}

/**
 * Composant d'animation pour les XP gagnés
 * Affiche une animation flottante avec le montant des XP gagnés
 */
export const XPAnimation: React.FC<XPAnimationProps> = ({ 
  amount, 
  onAnimationComplete 
}) => {
  // Valeurs d'animation
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(50)).current;
  const scale = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    if (amount <= 0) return;
    
    // Séquence d'animation
    Animated.sequence([
      // Apparition avec déplacement vers le haut
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          speed: 2,
          bounciness: 8,
          useNativeDriver: true,
        }),
      ]),
      
      // Pause pour que l'utilisateur voit bien l'animation
      Animated.delay(800),
      
      // Effet de pulsation
      Animated.timing(scale, {
        toValue: 1.5,
        duration: 300,
        easing: Easing.bounce,
        useNativeDriver: true,
      }),
      
      // Retour à la taille normale
      Animated.timing(scale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      
      // Pause encore
      Animated.delay(500),
      
      // Disparition progressive
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -100,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // Callback une fois l'animation terminée
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    });
  }, [amount, opacity, translateY, scale, onAnimationComplete]);
  
  if (amount <= 0) return null;
  
  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.animationContainer,
          {
            opacity,
            transform: [
              { translateY },
              { scale }
            ],
          },
        ]}
      >
        <Ionicons name="star" size={28} color="#FFD700" />
        <Text style={styles.xpText}>+{amount} XP</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100, // Position en haut de l'écran, sous le header
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999, // Au-dessus de tout le reste
    pointerEvents: 'none', // Permet les interactions avec les éléments en dessous
  },
  animationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 25,
  },
  xpText: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 20,
    marginLeft: 10,
  },
}); 