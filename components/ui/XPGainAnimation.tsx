import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface XPGainAnimationProps {
  amount: number;
  onAnimationComplete: () => void;
}

const XPGainAnimation: React.FC<XPGainAnimationProps> = ({ amount, onAnimationComplete }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.5)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animation plus rapide et moins gourmande
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -80,
        duration: 1000, // Réduit de 1500 à 1000ms
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.1, // Réduit de 1.2 à 1.1
          duration: 200, // Réduit de 300 à 200ms
          useNativeDriver: true,
          easing: Easing.back(1.2), // Réduit l'effet de rebond
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 150, // Réduit de 200 à 150ms
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200, // Réduit de 300 à 200ms
          useNativeDriver: true,
        }),
        Animated.delay(500), // Réduit de 800 à 500ms
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300, // Réduit de 400 à 300ms
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      onAnimationComplete();
    });
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }, { scale }],
          opacity,
        },
      ]}
    >
      <Ionicons name="star" size={24} color="#FFD700" />
      <Text style={styles.text}>+{amount} XP</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '50%',
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 999,
  },
  text: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 8,
  },
});

export default XPGainAnimation; 