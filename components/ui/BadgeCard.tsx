import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface BadgeCardProps {
  id: string;
  icon: string;
  name: string;
  condition: string;
  earned: boolean;
}

export default function BadgeCard({ icon, name, condition, earned }: BadgeCardProps) {
  return (
    <View style={[styles.container, earned ? styles.earned : styles.notEarned]}>
      <View style={[styles.iconContainer, earned ? styles.earnedIcon : styles.notEarnedIcon]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <View style={styles.content}>
        <Text style={[styles.name, earned ? styles.earnedText : styles.notEarnedText]}>
          {name}
        </Text>
        <Text style={styles.condition}>{condition}</Text>
      </View>
      {earned && (
        <View style={styles.checkmark}>
          <Text style={styles.checkmarkText}>✓</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 2,
  },
  earned: {
    borderColor: '#4CAF50',
    backgroundColor: '#F8FFF8',
  },
  notEarned: {
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  earnedIcon: {
    backgroundColor: '#4CAF5020',
  },
  notEarnedIcon: {
    backgroundColor: '#E0E0E020',
  },
  icon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  earnedText: {
    color: '#2E7D32',
  },
  notEarnedText: {
    color: '#757575',
  },
  condition: {
    fontSize: 10,
    color: '#999',
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
