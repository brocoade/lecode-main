import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface LevelProgressBarProps {
  progress: number; // 0-100
  color: string;
  height?: number;
  showPercentage?: boolean;
  showCompletionIcon?: boolean;
}

const LevelProgressBar: React.FC<LevelProgressBarProps> = ({
  progress,
  color,
  height = 10,
  showPercentage = true,
  showCompletionIcon = true,
}) => {
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress / 100,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  // Limiter la progression à 100%
  const safeProgress = Math.min(100, Math.max(0, progress));
  
  return (
    <View style={styles.container}>
      <View style={[styles.progressBarContainer, { height }]}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              backgroundColor: color,
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
              height,
            },
          ]}
        />
        
        {/* Petits marqueurs pour indiquer les étapes (catégories) */}
        <View style={styles.markers}>
          {[20, 40, 60, 80].map((value) => (
            <View 
              key={value} 
              style={[
                styles.marker, 
                { left: `${value}%`, height: height * 1.5 }
              ]} 
            />
          ))}
        </View>
      </View>
      
      {/* Pourcentage et icône de complétion */}
      <View style={styles.textContainer}>
        {showPercentage && (
          <Text style={styles.percentageText}>{safeProgress}%</Text>
        )}
        
        {showCompletionIcon && safeProgress === 100 && (
          <Text style={styles.completionIcon}>🏆</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 8,
  },
  progressBarContainer: {
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    borderRadius: 8,
  },
  markers: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  marker: {
    position: 'absolute',
    width: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  textContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
  },
  percentageText: {
    fontSize: 12,
    color: '#555',
    fontWeight: '600',
  },
  completionIcon: {
    fontSize: 16,
    marginLeft: 8,
  },
});

export default LevelProgressBar; 