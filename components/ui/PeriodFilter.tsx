import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Period {
  id: string;
  label: string;
  shortLabel: string;
  icon?: string;
}

interface PeriodFilterProps {
  periods: Period[];
  selectedPeriod: string;
  onPeriodChange: (periodId: string) => void;
  style?: any;
}

export default function PeriodFilter({
  periods,
  selectedPeriod,
  onPeriodChange,
  style
}: PeriodFilterProps) {
  const animatedValues = useRef(
    periods.reduce((acc, period) => {
      acc[period.id] = new Animated.Value(period.id === selectedPeriod ? 1 : 0);
      return acc;
    }, {} as Record<string, Animated.Value>)
  ).current;

  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    // Animation d'entrée
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Animation des périodes
    periods.forEach(period => {
      Animated.timing(animatedValues[period.id], {
        toValue: period.id === selectedPeriod ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    });
  }, [selectedPeriod, periods]);

  return (
    <Animated.View style={[styles.container, style, { transform: [{ scale: scaleAnim }] }]}>
      <View style={styles.filterContainer}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="calendar-range" size={16} color="#666" />
          <Text style={styles.headerText}>Période</Text>
        </View>
        
        <View style={styles.periodsContainer}>
          {periods.map((period, index) => {
            const isSelected = period.id === selectedPeriod;
            
            return (
              <TouchableOpacity
                key={period.id}
                style={[
                  styles.periodButton,
                  index === 0 && styles.firstButton,
                  index === periods.length - 1 && styles.lastButton,
                ]}
                onPress={() => onPeriodChange(period.id)}
                activeOpacity={0.7}
              >
                <Animated.View
                  style={[
                    styles.periodContent,
                    {
                      backgroundColor: animatedValues[period.id].interpolate({
                        inputRange: [0, 1],
                        outputRange: ['transparent', '#2196F3'],
                      }),
                      transform: [{
                        scale: animatedValues[period.id].interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.05],
                        })
                      }]
                    }
                  ]}
                >
                  {period.icon && (
                    <MaterialCommunityIcons
                      name={period.icon as any}
                      size={14}
                      color={isSelected ? '#fff' : '#666'}
                      style={styles.periodIcon}
                    />
                  )}
                  <Animated.Text
                    style={[
                      styles.periodText,
                      {
                        color: animatedValues[period.id].interpolate({
                          inputRange: [0, 1],
                          outputRange: ['#666', '#fff'],
                        }),
                        fontWeight: isSelected ? '600' : '400'
                      }
                    ]}
                  >
                    {period.shortLabel}
                  </Animated.Text>
                </Animated.View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    marginHorizontal: 16,
  },
  filterContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginLeft: 6,
  },
  periodsContainer: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 4,
  },
  periodButton: {
    flex: 1,
  },
  firstButton: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  lastButton: {
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  periodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  periodIcon: {
    marginRight: 4,
  },
  periodText: {
    fontSize: 13,
    textAlign: 'center',
  },
});
