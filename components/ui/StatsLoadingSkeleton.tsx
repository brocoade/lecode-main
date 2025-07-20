import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

interface StatsLoadingSkeletonProps {
  showTabs?: boolean;
  showMetrics?: boolean;
  showCharts?: boolean;
  showCards?: boolean;
}

export default function StatsLoadingSkeleton({
  showTabs = true,
  showMetrics = true,
  showCharts = true,
  showCards = true
}: StatsLoadingSkeletonProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    shimmerAnimation.start();

    return () => shimmerAnimation.stop();
  }, []);

  const ShimmerView = ({ style }: { style: any }) => (
    <Animated.View
      style={[
        style,
        {
          opacity: shimmerAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 0.7],
          }),
        },
      ]}
    />
  );

  return (
    <View style={styles.container}>
      {/* Skeleton des onglets */}
      {showTabs && (
        <View style={styles.tabsSkeleton}>
          <View style={styles.tabsContainer}>
            {[1, 2, 3, 4].map((_, index) => (
              <View key={index} style={styles.tabSkeleton}>
                <ShimmerView style={styles.tabIcon} />
                <ShimmerView style={styles.tabText} />
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Skeleton des métriques */}
      {showMetrics && (
        <View style={styles.metricsContainer}>
          <View style={styles.metricsGrid}>
            {[1, 2, 3, 4].map((_, index) => (
              <View key={index} style={styles.metricCard}>
                <ShimmerView style={styles.metricIcon} />
                <ShimmerView style={styles.metricValue} />
                <ShimmerView style={styles.metricLabel} />
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Skeleton des graphiques */}
      {showCharts && (
        <View style={styles.chartsContainer}>
          {/* Graphique principal */}
          <View style={styles.chartCard}>
            <ShimmerView style={styles.chartTitle} />
            <View style={styles.chartContent}>
              <ShimmerView style={styles.chartArea} />
              <View style={styles.chartLegend}>
                {[1, 2, 3].map((_, index) => (
                  <ShimmerView key={index} style={styles.legendItem} />
                ))}
              </View>
            </View>
          </View>

          {/* Graphiques secondaires */}
          <View style={styles.secondaryCharts}>
            {[1, 2].map((_, index) => (
              <View key={index} style={styles.smallChartCard}>
                <ShimmerView style={styles.smallChartTitle} />
                <ShimmerView style={styles.smallChartContent} />
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Skeleton des cartes */}
      {showCards && (
        <View style={styles.cardsContainer}>
          {[1, 2, 3].map((_, index) => (
            <View key={index} style={styles.card}>
              <View style={styles.cardHeader}>
                <ShimmerView style={styles.cardIcon} />
                <ShimmerView style={styles.cardTitle} />
              </View>
              <View style={styles.cardContent}>
                {[1, 2, 3].map((_, lineIndex) => (
                  <ShimmerView
                    key={lineIndex}
                    style={[
                      styles.cardLine,
                      { width: `${100 - lineIndex * 15}%` }
                    ]}
                  />
                ))}
              </View>
              <View style={styles.cardFooter}>
                <ShimmerView style={styles.cardButton} />
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  
  // Skeleton des onglets
  tabsSkeleton: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingVertical: 12,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  tabSkeleton: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  tabIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E0E0E0',
    marginBottom: 4,
  },
  tabText: {
    width: 40,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E0E0E0',
  },

  // Skeleton des métriques
  metricsContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    width: (width - 52) / 2, // 2 colonnes avec gaps
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  metricIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
    marginBottom: 8,
  },
  metricValue: {
    width: 40,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E0E0E0',
    marginBottom: 4,
  },
  metricLabel: {
    width: 60,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E0E0E0',
  },

  // Skeleton des graphiques
  chartsContainer: {
    marginBottom: 8,
  },
  chartCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    padding: 20,
  },
  chartTitle: {
    width: 120,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
    marginBottom: 16,
  },
  chartContent: {
    height: 200,
  },
  chartArea: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
    marginBottom: 12,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    width: 60,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E0E0E0',
  },
  secondaryCharts: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  smallChartCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  smallChartTitle: {
    width: 80,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#E0E0E0',
    marginBottom: 12,
  },
  smallChartContent: {
    height: 100,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
  },

  // Skeleton des cartes
  cardsContainer: {
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
    marginRight: 12,
  },
  cardTitle: {
    width: 120,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
  },
  cardContent: {
    marginBottom: 16,
  },
  cardLine: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E0E0E0',
    marginBottom: 8,
  },
  cardFooter: {
    alignItems: 'flex-end',
  },
  cardButton: {
    width: 80,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
  },
});
