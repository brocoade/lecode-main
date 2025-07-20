import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface PerformanceStatsCardProps {
  title: string;
  stats: {
    label: string;
    value: string | number;
    icon: string;
    color: string;
    trend?: number; // Pourcentage de changement
    subtitle?: string;
  }[];
  onPress?: () => void;
}

export default function PerformanceStatsCard({
  title,
  stats,
  onPress
}: PerformanceStatsCardProps) {
  const animatedValues = useRef(stats.map(() => new Animated.Value(0))).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    // Animation d'entrée
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Animation des valeurs
    const animations = animatedValues.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 1000,
        delay: index * 200,
        useNativeDriver: false,
      })
    );

    Animated.stagger(100, animations).start();
  }, [stats]);

  const getTrendIcon = (trend?: number) => {
    if (trend === undefined) return null;
    if (trend > 0) return 'trending-up';
    if (trend < 0) return 'trending-down';
    return 'trending-neutral';
  };

  const getTrendColor = (trend?: number) => {
    if (trend === undefined) return '#666';
    if (trend > 0) return '#4CAF50';
    if (trend < 0) return '#F44336';
    return '#FF9800';
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={styles.touchable}
        onPress={onPress}
        activeOpacity={0.95}
        disabled={!onPress}
      >
        <LinearGradient
          colors={['#fff', '#f8f9fa']}
          style={styles.card}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            {onPress && (
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color="#666"
              />
            )}
          </View>

          <View style={styles.statsGrid}>
            {stats.map((stat, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.statItem,
                  {
                    opacity: animatedValues[index],
                    transform: [{
                      translateY: animatedValues[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      })
                    }]
                  }
                ]}
              >
                <View style={styles.statHeader}>
                  <View style={[styles.iconContainer, { backgroundColor: stat.color + '20' }]}>
                    <MaterialCommunityIcons
                      name={stat.icon as any}
                      size={20}
                      color={stat.color}
                    />
                  </View>
                  {stat.trend !== undefined && (
                    <View style={styles.trendContainer}>
                      <MaterialCommunityIcons
                        name={getTrendIcon(stat.trend) as any}
                        size={16}
                        color={getTrendColor(stat.trend)}
                      />
                      <Text style={[styles.trendText, { color: getTrendColor(stat.trend) }]}>
                        {Math.abs(stat.trend)}%
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.statContent}>
                  <Text style={[styles.statValue, { color: stat.color }]}>
                    {stat.value}
                  </Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                  {stat.subtitle && (
                    <Text style={styles.statSubtitle}>{stat.subtitle}</Text>
                  )}
                </View>
              </Animated.View>
            ))}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    marginHorizontal: 16,
  },
  touchable: {
    borderRadius: 20,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    marginBottom: 16,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 2,
  },
  statContent: {
    alignItems: 'flex-start',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  statSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
});
