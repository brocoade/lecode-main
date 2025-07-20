import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LevelProgressBarProps {
  progress: number; // 0-100
  difficulty: 'facile' | 'moyen' | 'difficile';
  unlocked: boolean;
  completed?: boolean;
  totalCategories?: number;
  completedCategories?: number;
}

export const LevelProgressBar: React.FC<LevelProgressBarProps> = ({
  progress,
  difficulty,
  unlocked,
  completed = false,
  totalCategories = 5,
  completedCategories = 0
}) => {
  // Déterminer la couleur en fonction de la difficulté
  const getColorByDifficulty = (): string => {
    switch (difficulty) {
      case 'facile':
        return '#4CAF50'; // Vert
      case 'moyen':
        return '#FFC107'; // Jaune/Orange
      case 'difficile':
        return '#2196F3'; // Bleu
      default:
        return '#4CAF50'; // Vert par défaut
    }
  };
  
  // Déterminer le texte du statut
  const getStatusText = (): string => {
    if (!unlocked) return 'Verrouillé 🔒';
    if (completed) return 'Terminé 🏆';
    return `${completedCategories}/${totalCategories} catégories`;
  };
  
  const color = getColorByDifficulty();
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Niveau {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</Text>
        <View style={[styles.statusBadge, {
          backgroundColor: !unlocked ? '#757575' : completed ? '#4CAF50' : color
        }]}>
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>
      </View>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${progress}%`,
                backgroundColor: color
              }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>{progress}%</Text>
      </View>
      
      <Text style={styles.subtext}>
        {unlocked 
          ? (completed 
            ? 'Niveau complété !' 
            : `Progression: ${progress}% (1 catégorie = 20%)`) 
          : difficulty === 'moyen' 
            ? 'Terminez le niveau Facile pour débloquer' 
            : 'Terminez le niveau Moyen pour débloquer'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBar: {
    flex: 1,
    height: 10,
    backgroundColor: '#EEEEEE',
    borderRadius: 5,
    marginRight: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    width: 40,
    textAlign: 'right',
  },
  subtext: {
    fontSize: 12,
    color: '#757575',
  }
}); 