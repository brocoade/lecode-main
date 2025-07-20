import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface CategoryDetailCardProps {
  categoryName: string;
  totalQuizzes: number;
  completedQuizzes: number;
  averageScore: number;
  bestScore: number;
  averageTime: number;
  progressPercentage: number;
  lastActivity: Date | null;
  weakPoints: string[];
  color?: string;
  onPress?: () => void;
}

export default function CategoryDetailCard({
  categoryName,
  totalQuizzes,
  completedQuizzes,
  averageScore,
  bestScore,
  averageTime,
  progressPercentage,
  lastActivity,
  weakPoints,
  color = '#4CAF50',
  onPress
}: CategoryDetailCardProps) {
  const animatedProgress = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(animatedProgress, {
        toValue: progressPercentage,
        duration: 1500,
        useNativeDriver: false,
      })
    ]).start();
  }, [progressPercentage]);

  const formatLastActivity = (date: Date | null) => {
    if (!date) return 'Jamais';
    
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.ceil(diffDays / 7)} semaines`;
    return `Il y a ${Math.ceil(diffDays / 30)} mois`;
  };

  const getPerformanceLevel = (score: number) => {
    if (score >= 90) return { level: 'Excellent', color: '#4CAF50', icon: 'star' };
    if (score >= 80) return { level: 'Très bien', color: '#8BC34A', icon: 'thumb-up' };
    if (score >= 70) return { level: 'Bien', color: '#FF9800', icon: 'check' };
    if (score >= 60) return { level: 'Passable', color: '#FF5722', icon: 'minus' };
    return { level: 'À améliorer', color: '#F44336', icon: 'alert' };
  };

  const performance = getPerformanceLevel(averageScore);

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={styles.touchable}
        onPress={onPress}
        activeOpacity={0.95}
        disabled={!onPress}
      >
        <LinearGradient
          colors={[color + '15', color + '05']}
          style={styles.card}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* En-tête */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
                <MaterialCommunityIcons
                  name="book-open-variant"
                  size={24}
                  color={color}
                />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.categoryName}>{categoryName}</Text>
                <Text style={styles.lastActivity}>
                  Dernière activité: {formatLastActivity(lastActivity)}
                </Text>
              </View>
            </View>
            {onPress && (
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color="#666"
              />
            )}
          </View>

          {/* Barre de progression */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progression</Text>
              <Text style={[styles.progressValue, { color }]}>
                {Math.round(progressPercentage)}%
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <Animated.View
                  style={[
                    styles.progressBarFill,
                    {
                      backgroundColor: color,
                      width: animatedProgress.interpolate({
                        inputRange: [0, 100],
                        outputRange: ['0%', '100%'],
                        extrapolate: 'clamp',
                      })
                    }
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {completedQuizzes}/{totalQuizzes} quiz
              </Text>
            </View>
          </View>

          {/* Statistiques */}
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons
                name="target"
                size={20}
                color={performance.color}
              />
              <Text style={styles.statValue}>{averageScore}%</Text>
              <Text style={styles.statLabel}>Score moyen</Text>
              <Text style={[styles.performanceLevel, { color: performance.color }]}>
                {performance.level}
              </Text>
            </View>

            <View style={styles.statItem}>
              <MaterialCommunityIcons
                name="trophy"
                size={20}
                color="#FFD700"
              />
              <Text style={styles.statValue}>{bestScore}%</Text>
              <Text style={styles.statLabel}>Meilleur score</Text>
            </View>

            <View style={styles.statItem}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={20}
                color="#FF9800"
              />
              <Text style={styles.statValue}>{averageTime}min</Text>
              <Text style={styles.statLabel}>Temps moyen</Text>
            </View>

            <View style={styles.statItem}>
              <MaterialCommunityIcons
                name="check-circle"
                size={20}
                color="#4CAF50"
              />
              <Text style={styles.statValue}>{completedQuizzes}</Text>
              <Text style={styles.statLabel}>Complétés</Text>
            </View>
          </View>

          {/* Points faibles */}
          {weakPoints.length > 0 && (
            <View style={styles.weakPointsSection}>
              <View style={styles.weakPointsHeader}>
                <MaterialCommunityIcons
                  name="alert-circle-outline"
                  size={16}
                  color="#FF9800"
                />
                <Text style={styles.weakPointsTitle}>Points à revoir</Text>
              </View>
              <View style={styles.weakPointsList}>
                {weakPoints.slice(0, 3).map((point, index) => (
                  <View key={index} style={styles.weakPointItem}>
                    <MaterialCommunityIcons
                      name="circle-small"
                      size={16}
                      color="#666"
                    />
                    <Text style={styles.weakPointText}>{point}</Text>
                  </View>
                ))}
                {weakPoints.length > 3 && (
                  <Text style={styles.moreWeakPoints}>
                    +{weakPoints.length - 3} autres
                  </Text>
                )}
              </View>
            </View>
          )}
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
    backgroundColor: '#fff',
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  lastActivity: {
    fontSize: 12,
    color: '#666',
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  progressValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 12,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  performanceLevel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  weakPointsSection: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 12,
  },
  weakPointsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  weakPointsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E65100',
    marginLeft: 6,
  },
  weakPointsList: {
    gap: 4,
  },
  weakPointItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weakPointText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
    marginLeft: 4,
  },
  moreWeakPoints: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
    marginLeft: 20,
    marginTop: 4,
  },
});
