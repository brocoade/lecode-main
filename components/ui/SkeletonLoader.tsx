import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;

interface SkeletonLoaderProps {
  width?: number;
  height?: number;
  borderRadius?: number;
  style?: any;
}

/**
 * Composant de skeleton loader pour un chargement fluide
 */
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = 100,
  height = 20,
  borderRadius = 4,
  style
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

/**
 * Skeleton pour les cartes de catégories
 */
export const CategoryCardSkeleton: React.FC = () => {
  return (
    <View style={styles.categoryCardSkeleton}>
      <SkeletonLoader width={60} height={60} borderRadius={30} style={styles.iconSkeleton} />
      <SkeletonLoader width={120} height={16} style={styles.titleSkeleton} />
      <SkeletonLoader width={80} height={12} style={styles.progressSkeleton} />
      <SkeletonLoader width="100%" height={4} borderRadius={2} style={styles.progressBarSkeleton} />
    </View>
  );
};

/**
 * Skeleton pour la page d'accueil complète
 */
export const LearnPageSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Skeleton pour les objectifs quotidiens */}
      <View style={styles.objectivesSkeleton}>
        <SkeletonLoader width={150} height={20} style={styles.objectivesTitle} />
        <SkeletonLoader width="100%" height={60} borderRadius={8} style={styles.objectivesCard} />
      </View>

      {/* Skeleton pour les catégories */}
      <View style={styles.categoriesContainer}>
        <SkeletonLoader width={120} height={24} style={styles.categoriesTitle} />
        
        <View style={styles.categoriesGrid}>
          {[1, 2, 3, 4, 5, 6].map((index) => (
            <View key={index} style={styles.categoryRow}>
              <CategoryCardSkeleton />
              {index % 2 === 1 && <CategoryCardSkeleton />}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E1E9EE',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  objectivesSkeleton: {
    marginBottom: 24,
  },
  objectivesTitle: {
    marginBottom: 12,
  },
  objectivesCard: {
    marginBottom: 8,
  },
  categoriesContainer: {
    flex: 1,
  },
  categoriesTitle: {
    marginBottom: 16,
  },
  categoriesGrid: {
    flex: 1,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  categoryCardSkeleton: {
    width: (screenWidth - 48) / 2,
    height: 160,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconSkeleton: {
    marginBottom: 8,
  },
  titleSkeleton: {
    marginBottom: 8,
  },
  progressSkeleton: {
    marginBottom: 8,
  },
  progressBarSkeleton: {
    marginTop: 'auto',
  },
});
