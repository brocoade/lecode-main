import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CategoryProgressChartProps {
  categoryName: string;
  progress: number; // 0-100
  completedQuizzes: number;
  totalQuizzes: number;
  averageScore: number;
  color?: string;
  size?: number;
}



export default function CategoryProgressChart({
  categoryName,
  progress,
  completedQuizzes,
  totalQuizzes,
  averageScore,
  color = '#4CAF50',
  size = 120
}: CategoryProgressChartProps) {
  const animatedProgress = useRef(new Animated.Value(0)).current;
  const animatedScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(animatedProgress, {
        toValue: progress,
        duration: 1500,
        useNativeDriver: false,
      }),
      Animated.spring(animatedScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      })
    ]).start();
  }, [progress]);

  const radius = (size - 20) / 2;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: animatedScale }] }]}>
      <LinearGradient
        colors={[color + '15', color + '05']}
        style={[styles.card, { width: size + 40, height: size + 80 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.chartContainer}>
          <Svg width={size} height={size} style={styles.svg}>
            {/* Cercle de fond */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#E0E0E0"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            
            {/* Cercle de progression */}
            <AnimatedCircle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={color}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={animatedProgress.interpolate({
                inputRange: [0, 100],
                outputRange: [circumference, 0],
                extrapolate: 'clamp',
              })}
              strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          </Svg>
          
          {/* Texte central */}
          <View style={styles.centerText}>
            <Text style={[styles.progressText, { color }]}>
              {Math.round(progress)}%
            </Text>
            <Text style={styles.completedText}>
              {completedQuizzes}/{totalQuizzes}
            </Text>
          </View>
        </View>
        
        {/* Informations de la catégorie */}
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryName} numberOfLines={2}>
            {categoryName}
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{averageScore}%</Text>
              <Text style={styles.statLabel}>Score moyen</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{completedQuizzes}</Text>
              <Text style={styles.statLabel}>Complétés</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 8,
    marginVertical: 8,
  },
  card: {
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  chartContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
  },
  centerText: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  progressText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  completedText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  categoryInfo: {
    marginTop: 16,
    alignItems: 'center',
    width: '100%',
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
    minHeight: 32,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
});
