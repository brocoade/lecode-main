import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ComparisonStats {
  userRank: number;
  totalUsers: number;
  percentile: number;
  averageUserScore: number;
  userScore: number;
  averageUserStreak: number;
  userStreak: number;
}

interface ComparisonCardProps {
  comparisonStats: ComparisonStats;
  onViewLeaderboardPress?: () => void;
}

export default function ComparisonCard({
  comparisonStats,
  onViewLeaderboardPress
}: ComparisonCardProps) {
  const animatedValues = useRef({
    rank: new Animated.Value(0),
    percentile: new Animated.Value(0),
    scoreComparison: new Animated.Value(0),
    streakComparison: new Animated.Value(0),
    scale: new Animated.Value(0.95)
  }).current;

  const [displayValues, setDisplayValues] = useState({
    rank: 0,
    percentile: 0,
    scoreComparison: 0,
    streakComparison: 0
  });

  useEffect(() => {
    // Add listeners to update display values
    const rankListener = animatedValues.rank.addListener(({ value }) => {
      setDisplayValues(prev => ({ ...prev, rank: Math.round(value) }));
    });
    const percentileListener = animatedValues.percentile.addListener(({ value }) => {
      setDisplayValues(prev => ({ ...prev, percentile: Math.round(value) }));
    });
    const scoreListener = animatedValues.scoreComparison.addListener(({ value }) => {
      setDisplayValues(prev => ({ ...prev, scoreComparison: Math.round(value) }));
    });
    const streakListener = animatedValues.streakComparison.addListener(({ value }) => {
      setDisplayValues(prev => ({ ...prev, streakComparison: Math.round(value) }));
    });

    // Animation d'entrée
    Animated.spring(animatedValues.scale, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Animations des valeurs
    Animated.parallel([
      Animated.timing(animatedValues.rank, {
        toValue: comparisonStats.userRank,
        duration: 2000,
        useNativeDriver: false,
      }),
      Animated.timing(animatedValues.percentile, {
        toValue: comparisonStats.percentile,
        duration: 1500,
        useNativeDriver: false,
      }),
      Animated.timing(animatedValues.scoreComparison, {
        toValue: comparisonStats.userScore,
        duration: 1800,
        useNativeDriver: false,
      }),
      Animated.timing(animatedValues.streakComparison, {
        toValue: comparisonStats.userStreak,
        duration: 1600,
        useNativeDriver: false,
      })
    ]).start();

    // Cleanup listeners
    return () => {
      animatedValues.rank.removeListener(rankListener);
      animatedValues.percentile.removeListener(percentileListener);
      animatedValues.scoreComparison.removeListener(scoreListener);
      animatedValues.streakComparison.removeListener(streakListener);
    };
  }, [comparisonStats]);

  const getRankColor = (rank: number, total: number) => {
    const percentage = (rank / total) * 100;
    if (percentage <= 10) return '#FFD700'; // Or
    if (percentage <= 25) return '#C0C0C0'; // Argent
    if (percentage <= 50) return '#CD7F32'; // Bronze
    return '#4CAF50'; // Vert pour les autres
  };

  const getRankIcon = (rank: number, total: number) => {
    const percentage = (rank / total) * 100;
    if (percentage <= 10) return 'crown';
    if (percentage <= 25) return 'medal';
    if (percentage <= 50) return 'trophy-variant';
    return 'account-group';
  };

  const getPerformanceMessage = (userScore: number, avgScore: number) => {
    const diff = userScore - avgScore;
    if (diff > 15) return { message: 'Excellent ! Bien au-dessus de la moyenne', color: '#4CAF50', icon: 'trending-up' };
    if (diff > 5) return { message: 'Très bien ! Au-dessus de la moyenne', color: '#8BC34A', icon: 'thumb-up' };
    if (diff > -5) return { message: 'Dans la moyenne des utilisateurs', color: '#FF9800', icon: 'minus' };
    return { message: 'Potentiel d\'amélioration identifié', color: '#FF5722', icon: 'trending-down' };
  };

  const rankColor = getRankColor(comparisonStats.userRank, comparisonStats.totalUsers);
  const rankIcon = getRankIcon(comparisonStats.userRank, comparisonStats.totalUsers);
  const performance = getPerformanceMessage(comparisonStats.userScore, comparisonStats.averageUserScore);

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: animatedValues.scale }] }]}>
      <LinearGradient
        colors={['#fff', '#f8f9fa']}
        style={styles.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <MaterialCommunityIcons name="chart-line" size={24} color="#2196F3" />
            <Text style={styles.title}>Comparaison communautaire</Text>
          </View>
          {onViewLeaderboardPress && (
            <TouchableOpacity onPress={onViewLeaderboardPress} style={styles.leaderboardButton}>
              <MaterialCommunityIcons name="trophy" size={16} color="#FF9800" />
              <Text style={styles.leaderboardText}>Classement</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Rang et percentile */}
        <View style={styles.rankSection}>
          <LinearGradient
            colors={[rankColor + '20', rankColor + '10']}
            style={styles.rankCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.rankHeader}>
              <MaterialCommunityIcons
                name={rankIcon as any}
                size={32}
                color={rankColor}
              />
              <View style={styles.rankInfo}>
                <View style={styles.rankRow}>
                  <Text style={styles.rankLabel}>Votre rang</Text>
                  <Text style={[styles.rankValue, { color: rankColor }]}>
                    #{displayValues.rank}
                  </Text>
                </View>
                <Text style={styles.totalUsers}>
                  sur {comparisonStats.totalUsers.toLocaleString()} utilisateurs
                </Text>
              </View>
            </View>
            
            <View style={styles.percentileContainer}>
              <Text style={styles.percentileLabel}>Percentile</Text>
              <View style={styles.percentileBar}>
                <View style={styles.percentileBackground}>
                  <Animated.View
                    style={[
                      styles.percentileFill,
                      {
                        backgroundColor: rankColor,
                        width: animatedValues.percentile.interpolate({
                          inputRange: [0, 100],
                          outputRange: ['0%', '100%'],
                          extrapolate: 'clamp',
                        })
                      }
                    ]}
                  />
                </View>
                <Text style={[styles.percentileValue, { color: rankColor }]}>
                  {displayValues.percentile}%
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Message de performance */}
        <View style={[styles.performanceMessage, { backgroundColor: performance.color + '15' }]}>
          <MaterialCommunityIcons
            name={performance.icon as any}
            size={20}
            color={performance.color}
          />
          <Text style={[styles.performanceText, { color: performance.color }]}>
            {performance.message}
          </Text>
        </View>

        {/* Comparaisons détaillées */}
        <View style={styles.comparisonsGrid}>
          <View style={styles.comparisonItem}>
            <View style={styles.comparisonHeader}>
              <MaterialCommunityIcons name="target" size={20} color="#2196F3" />
              <Text style={styles.comparisonTitle}>Score moyen</Text>
            </View>
            <View style={styles.comparisonValues}>
              <View style={styles.valueItem}>
                <Text style={styles.userValue}>
                  {displayValues.scoreComparison}%
                </Text>
                <Text style={styles.valueLabel}>Vous</Text>
              </View>
              <View style={styles.vsContainer}>
                <Text style={styles.vsText}>vs</Text>
              </View>
              <View style={styles.valueItem}>
                <Text style={styles.avgValue}>{comparisonStats.averageUserScore}%</Text>
                <Text style={styles.valueLabel}>Moyenne</Text>
              </View>
            </View>
            <View style={styles.differenceContainer}>
              <Text style={[
                styles.differenceText,
                { color: comparisonStats.userScore >= comparisonStats.averageUserScore ? '#4CAF50' : '#FF5722' }
              ]}>
                {comparisonStats.userScore >= comparisonStats.averageUserScore ? '+' : ''}
                {comparisonStats.userScore - comparisonStats.averageUserScore}% par rapport à la moyenne
              </Text>
            </View>
          </View>

          <View style={styles.comparisonItem}>
            <View style={styles.comparisonHeader}>
              <MaterialCommunityIcons name="fire" size={20} color="#FF6B35" />
              <Text style={styles.comparisonTitle}>Streak</Text>
            </View>
            <View style={styles.comparisonValues}>
              <View style={styles.valueItem}>
                <Text style={styles.userValue}>
                  {displayValues.streakComparison}
                </Text>
                <Text style={styles.valueLabel}>Vous</Text>
              </View>
              <View style={styles.vsContainer}>
                <Text style={styles.vsText}>vs</Text>
              </View>
              <View style={styles.valueItem}>
                <Text style={styles.avgValue}>{comparisonStats.averageUserStreak}</Text>
                <Text style={styles.valueLabel}>Moyenne</Text>
              </View>
            </View>
            <View style={styles.differenceContainer}>
              <Text style={[
                styles.differenceText,
                { color: comparisonStats.userStreak >= comparisonStats.averageUserStreak ? '#4CAF50' : '#FF5722' }
              ]}>
                {comparisonStats.userStreak >= comparisonStats.averageUserStreak ? '+' : ''}
                {comparisonStats.userStreak - comparisonStats.averageUserStreak} jours par rapport à la moyenne
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    marginHorizontal: 16,
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  leaderboardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  leaderboardText: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: '500',
    marginLeft: 4,
  },
  rankSection: {
    marginBottom: 16,
  },
  rankCard: {
    borderRadius: 16,
    padding: 16,
  },
  rankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rankInfo: {
    marginLeft: 12,
    flex: 1,
  },
  rankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rankLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  rankValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  totalUsers: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  percentileContainer: {
    marginTop: 8,
  },
  percentileLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  percentileBar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  percentileBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 8,
  },
  percentileFill: {
    height: '100%',
    borderRadius: 4,
  },
  percentileValue: {
    fontSize: 14,
    fontWeight: 'bold',
    minWidth: 40,
    textAlign: 'right',
  },
  performanceMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  performanceText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  comparisonsGrid: {
    gap: 16,
  },
  comparisonItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  comparisonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  comparisonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  comparisonValues: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  valueItem: {
    alignItems: 'center',
    flex: 1,
  },
  userValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  avgValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  valueLabel: {
    fontSize: 12,
    color: '#666',
  },
  vsContainer: {
    paddingHorizontal: 16,
  },
  vsText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  differenceContainer: {
    alignItems: 'center',
  },
  differenceText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});
