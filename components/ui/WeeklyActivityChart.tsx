import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ActivityDay {
  day: string;
  quizCount: number;
  height: string | number;
  date?: string;
  totalScore?: number;
  averageScore?: number;
}

interface WeeklyActivityChartProps {
  data?: ActivityDay[];
}

export default function WeeklyActivityChart({ data = [] }: WeeklyActivityChartProps) {
  console.log('WeeklyActivityChart received data:', data);

  // NOUVEAU : Définir 10 quiz comme maximum pour une barre pleine
  const MAX_QUIZ_FOR_FULL_BAR = 10;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📈 Activité hebdomadaire</Text>
      <View style={styles.chart}>
        {data.map((day, index) => {
          const hasActivity = day.quizCount > 0;
          
          // NOUVEAU CALCUL : Basé sur 10 quiz max, avec minimum 15% si activité
          let barHeight = 0;
          if (hasActivity) {
            // Calculer le pourcentage basé sur 10 quiz max
            const percentage = (day.quizCount / MAX_QUIZ_FOR_FULL_BAR) * 100;
            // Minimum 15% si activité, maximum 100%
            barHeight = Math.min(Math.max(percentage, 15), 100);
          }
          
          return (
            <View key={index} style={styles.barContainer}>
              <View style={styles.barWrapper}>
                <View style={styles.barBackground}>
                  {hasActivity && (
                    <View 
                      style={[
                        styles.barFill, 
                        { height: `${barHeight}%` }
                      ]} 
                    />
                  )}
                </View>
              </View>
              <Text style={styles.dayLabel}>{day.day}</Text>
              <Text style={[
                styles.quizCount,
                { color: hasActivity ? '#4CAF50' : '#999' }
              ]}>
                {day.quizCount}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    paddingHorizontal: 4,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  barWrapper: {
    height: 80,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 8,
  },
  barBackground: {
    width: 16,
    height: '100%',
    backgroundColor: '#F0F8F0',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8F5E8',
  },
  barFill: {
    width: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 7,
    position: 'absolute',
    bottom: 0,
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  dayLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
  },
  quizCount: {
    fontSize: 12,
    fontWeight: 'bold',
  },
}); 







