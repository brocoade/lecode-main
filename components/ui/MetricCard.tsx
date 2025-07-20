import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface MetricCardProps {
  icon: string;
  value: number;
  label: string;
  color: string;
  animate?: boolean;
}

export default function MetricCard({ icon, value, label, color, animate = true }: MetricCardProps) {
  const displayValue = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // S'assurer que la valeur est un nombre valide
  const numericValue = typeof value === 'number' && !isNaN(value) ? value : 0;

  useEffect(() => {
    if (animate) {
      Animated.timing(displayValue, {
        toValue: numericValue,
        duration: 1000,
        useNativeDriver: true,
      }).start();

      const pulse = Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]);

      pulse.start();
    } else {
      displayValue.setValue(numericValue);
    }
  }, [numericValue, animate]);

  const animatedValue = displayValue.interpolate({
    inputRange: [0, numericValue],
    outputRange: ['0', numericValue.toString()],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: pulseAnim }] }]}>
      <LinearGradient
        colors={[color + '20', color + '10']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.icon}>{icon}</Text>
        <Animated.Text style={[styles.value, { color }]}>
          {animatedValue}
        </Animated.Text>
        <Text style={styles.label}>{label}</Text>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  gradient: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  icon: {
    fontSize: 24,
    marginBottom: 8,
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
}); 