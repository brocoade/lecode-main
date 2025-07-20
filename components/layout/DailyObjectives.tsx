import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useThemeMode } from '@/context/ThemeContext';

interface Objective {
  id: string;
  title: string;
  completed: boolean;
}

interface DailyObjectivesProps {
  objectives: Objective[];
}

export const DailyObjectives: React.FC<DailyObjectivesProps> = ({ 
  objectives = [
    { id: '1', title: 'Quiz du jour', completed: true },
    { id: '2', title: 'Lecture santé', completed: true },
  ] 
}) => {
  const { theme } = useThemeMode();
  const completedCount = objectives.filter(obj => obj.completed).length;
  const totalCount = objectives.length;

  return (
    <View style={[styles.container, { backgroundColor: theme === 'dark' ? '#295C36' : Colors.light.button }]}>
      <View style={styles.titleRow}>
        <Text style={[styles.title, { color: 'white' }]}>Objectifs du jour</Text>
        <Text style={[styles.progressText, { color: '#FFD700' }]}>{completedCount}/{totalCount}</Text>
      </View>
      <View style={styles.content}>
        {objectives.map((objective) => (
          <View key={objective.id} style={styles.objectiveItem}>
            <View style={[styles.checkIconContainer, { backgroundColor: theme === 'dark' ? '#388E3C' : '#8BC34A' }]}>
              <Ionicons 
                name="checkmark" 
                size={16} 
                color="white" 
              />
            </View>
            <Text style={[styles.objectiveText, { color: 'white' }]}>{objective.title}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
    margin: 15,
    borderRadius: 10,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    gap: 10,
  },
  objectiveItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkIconContainer: {
    borderRadius: 50,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  objectiveText: {
    fontSize: 16,
  },
  progressContainer: {
    marginLeft: 'auto',
  },
  progressText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 