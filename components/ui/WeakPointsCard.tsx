import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface WeakPoint {
  categoryName: string;
  issues: string[];
  averageScore: number;
  recommendedAction: string;
}

interface WeakPointsCardProps {
  weakPoints: WeakPoint[];
  onCategoryPress?: (categoryId: string) => void;
}

export default function WeakPointsCard({
  weakPoints,
  onCategoryPress
}: WeakPointsCardProps) {
  const animatedValues = useRef(weakPoints.map(() => new Animated.Value(0))).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    // Animation d'entrée
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Animation des éléments
    const animations = animatedValues.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 800,
        delay: index * 150,
        useNativeDriver: false,
      })
    );

    Animated.stagger(100, animations).start();
  }, [weakPoints]);

  if (!weakPoints || weakPoints.length === 0) {
    return (
      <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
        <LinearGradient
          colors={['#4CAF50', '#66BB6A']}
          style={styles.successCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <MaterialCommunityIcons name="check-circle" size={48} color="#fff" />
          <Text style={styles.successTitle}>Excellent travail !</Text>
          <Text style={styles.successText}>
            Vous maîtrisez bien toutes les catégories. Continuez ainsi !
          </Text>
        </LinearGradient>
      </Animated.View>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FF9800';
    return '#F44336';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return 'trending-up';
    if (score >= 60) return 'trending-neutral';
    return 'trending-down';
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
      <LinearGradient
        colors={['#fff', '#f8f9fa']}
        style={styles.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <MaterialCommunityIcons name="target" size={24} color="#FF9800" />
            <Text style={styles.title}>Points à améliorer</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{weakPoints.length}</Text>
          </View>
        </View>

        <Text style={styles.subtitle}>
          Concentrez-vous sur ces domaines pour progresser plus rapidement
        </Text>

        <View style={styles.weakPointsList}>
          {weakPoints.map((weakPoint, index) => (
            <Animated.View
              key={index}
              style={[
                styles.weakPointItem,
                {
                  opacity: animatedValues[index] || new Animated.Value(1),
                  transform: [{
                    translateX: (animatedValues[index] || new Animated.Value(1)).interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    })
                  }]
                }
              ]}
            >
              <TouchableOpacity
                style={styles.weakPointContent}
                onPress={() => onCategoryPress?.(weakPoint.categoryName)}
                activeOpacity={0.7}
              >
                <View style={styles.weakPointHeader}>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryName}>{weakPoint.categoryName}</Text>
                    <View style={styles.scoreContainer}>
                      <MaterialCommunityIcons
                        name={getScoreIcon(weakPoint.averageScore) as any}
                        size={16}
                        color={getScoreColor(weakPoint.averageScore)}
                      />
                      <Text style={[
                        styles.scoreText,
                        { color: getScoreColor(weakPoint.averageScore) }
                      ]}>
                        {weakPoint.averageScore}%
                      </Text>
                    </View>
                  </View>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={20}
                    color="#666"
                  />
                </View>

                <View style={styles.issuesContainer}>
                  {weakPoint.issues.slice(0, 2).map((issue, issueIndex) => (
                    <View key={issueIndex} style={styles.issueItem}>
                      <MaterialCommunityIcons
                        name="circle-small"
                        size={16}
                        color="#666"
                      />
                      <Text style={styles.issueText}>{issue}</Text>
                    </View>
                  ))}
                  {weakPoint.issues.length > 2 && (
                    <Text style={styles.moreIssues}>
                      +{weakPoint.issues.length - 2} autres points
                    </Text>
                  )}
                </View>

                <View style={styles.recommendationContainer}>
                  <MaterialCommunityIcons
                    name="lightbulb-outline"
                    size={16}
                    color="#FF9800"
                  />
                  <Text style={styles.recommendationText}>
                    {weakPoint.recommendedAction}
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
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
  successCard: {
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
    marginBottom: 8,
  },
  successText: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.9,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  badge: {
    backgroundColor: '#FF9800',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  weakPointsList: {
    gap: 12,
  },
  weakPointItem: {
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    overflow: 'hidden',
  },
  weakPointContent: {
    padding: 16,
  },
  weakPointHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  issuesContainer: {
    marginBottom: 12,
  },
  issueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  issueText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
    marginLeft: 4,
  },
  moreIssues: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginLeft: 20,
  },
  recommendationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
  },
  recommendationText: {
    fontSize: 13,
    color: '#E65100',
    flex: 1,
    marginLeft: 8,
    lineHeight: 18,
  },
});
