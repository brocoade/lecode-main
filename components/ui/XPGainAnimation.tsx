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
    // Animation de montée et disparition
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 1500,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.2,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.back(1.5),
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(800),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 400,
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