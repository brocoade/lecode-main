import React from 'react';
import { View, StyleSheet } from 'react-native';

interface ProgressBarProps {
  progress: number; // 0 to 100
  color: string;
  height?: number;
  backgroundColor?: string;
  borderRadius?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  color, 
  height = 8, 
  backgroundColor = '#E0E0E0',
  borderRadius = 4
}) => {
  // Ensure progress is between 0 and 100
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  
  return (
    <View style={[styles.container, { height, backgroundColor, borderRadius }]}>
      <View 
        style={[
          styles.progressFill, 
          { 
            width: `${clampedProgress}%`, 
            backgroundColor: color,
            height,
            borderRadius
          }
        ]} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
}); 