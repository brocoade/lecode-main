import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface BadgeItemProps {
  id: string;
  icon: string;
  name: string;
  earned: boolean;
  condition: string;
}

export default function BadgeItem({ icon, name, earned, condition }: BadgeItemProps) {
  return (
    <View style={[styles.container, earned ? styles.earnedContainer : styles.unearnedContainer]}>
      {earned ? (
        <LinearGradient
          colors={['#FFD700', '#FFA000']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconContainer}
        >
          <Text style={styles.icon}>{icon}</Text>
        </LinearGradient>
      ) : (
        <View style={[styles.iconContainer, styles.unearnedIconContainer]}>
          <Text style={[styles.icon, styles.unearnedIcon]}>{icon}</Text>
        </View>
      )}
      <Text style={[styles.name, earned ? styles.earnedName : styles.unearnedName]}>
        {name}
      </Text>
      {earned && (
        <View style={styles.checkmark}>
          <MaterialCommunityIcons name="check-circle" size={16} color="#4CAF50" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 15,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  earnedContainer: {
    transform: [{ scale: 1.05 }],
  },
  unearnedContainer: {
    opacity: 0.6,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  unearnedIconContainer: {
    backgroundColor: '#f5f5f5',
  },
  icon: {
    fontSize: 24,
  },
  unearnedIcon: {
    opacity: 0.5,
  },
  name: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  earnedName: {
    color: '#333',
  },
  unearnedName: {
    color: '#666',
  },
  checkmark: {
    position: 'absolute',
    top: 5,
    right: 5,
  },
}); 