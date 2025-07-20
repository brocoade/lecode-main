import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

interface ScoreTrendChartProps {
  data: number[]; // Scores sur les derniers jours
  title?: string;
  color?: string;
  height?: number;
}

const { width } = Dimensions.get('window');

export default function ScoreTrendChart({
  data,
  title = "Évolution des scores",
  color = '#2196F3',
  height = 200
}: ScoreTrendChartProps) {
  const animatedProgress = useRef(new Animated.Value(0)).current;
  const chartWidth = width - 64; // Padding des côtés
  const chartHeight = height - 80; // Espace pour le titre et les labels

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: false,
    }).start();
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>Aucune donnée disponible</Text>
        </View>
      </View>
    );
  }

  // Calculer les points du graphique
  const maxScore = Math.max(...data, 100);
  const minScore = Math.min(...data, 0);
  const scoreRange = maxScore - minScore || 1;

  const points = data.map((score, index) => {
    const x = (index / (data.length - 1)) * chartWidth;
    const y = chartHeight - ((score - minScore) / scoreRange) * chartHeight;
    return { x, y, score };
  });

  // Créer le chemin SVG pour la ligne
  const pathData = points.reduce((path, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`;
    }
    return `${path} L ${point.x} ${point.y}`;
  }, '');

  // Créer le chemin pour l'aire sous la courbe
  const areaPathData = `${pathData} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`;

  // Calculer les statistiques
  const currentScore = data[data.length - 1];
  const previousScore = data[data.length - 2] || currentScore;
  const trend = currentScore - previousScore;
  const averageScore = Math.round(data.reduce((sum, score) => sum + score, 0) / data.length);

  return (
    <View style={[styles.container, { height }]}>
      <LinearGradient
        colors={[color + '10', color + '05']}
        style={styles.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color }]}>{currentScore}%</Text>
              <Text style={styles.statLabel}>Actuel</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color }]}>{averageScore}%</Text>
              <Text style={styles.statLabel}>Moyenne</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[
                styles.statValue,
                { color: trend >= 0 ? '#4CAF50' : '#F44336' }
              ]}>
                {trend >= 0 ? '+' : ''}{trend}%
              </Text>
              <Text style={styles.statLabel}>Tendance</Text>
            </View>
          </View>
        </View>

        <View style={styles.chartContainer}>
          <Svg width={chartWidth} height={chartHeight} style={styles.svg}>
            <Defs>
              <SvgLinearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor={color} stopOpacity="0.3" />
                <Stop offset="100%" stopColor={color} stopOpacity="0.05" />
              </SvgLinearGradient>
            </Defs>

            {/* Aire sous la courbe */}
            <Animated.View style={{ opacity: animatedProgress }}>
              <Path
                d={areaPathData}
                fill="url(#areaGradient)"
              />
            </Animated.View>

            {/* Ligne principale */}
            <Animated.View style={{ opacity: animatedProgress }}>
              <Path
                d={pathData}
                stroke={color}
                strokeWidth={3}
                fill="transparent"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Animated.View>

            {/* Points sur la ligne */}
            {points.map((point, index) => (
              <Animated.View key={index} style={{ opacity: animatedProgress }}>
                <Circle
                  cx={point.x}
                  cy={point.y}
                  r={4}
                  fill={color}
                />
                <Circle
                  cx={point.x}
                  cy={point.y}
                  r={2}
                  fill="#fff"
                />
              </Animated.View>
            ))}
          </Svg>

          {/* Labels des axes */}
          <View style={styles.xAxisLabels}>
            <Text style={styles.axisLabel}>-{data.length - 1}j</Text>
            <Text style={styles.axisLabel}>Aujourd'hui</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    marginHorizontal: 16,
  },
  card: {
    flex: 1,
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
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  chartContainer: {
    flex: 1,
    position: 'relative',
  },
  svg: {
    flex: 1,
  },
  xAxisLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  axisLabel: {
    fontSize: 12,
    color: '#666',
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
