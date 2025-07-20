import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  elevation?: 'none' | 'small' | 'medium' | 'large';
  padding?: 'none' | 'small' | 'medium' | 'large';
  borderRadius?: 'none' | 'small' | 'medium' | 'large';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  elevation = 'medium',
  padding = 'medium',
  borderRadius = 'medium',
}) => {
  // Déterminer les styles en fonction des props
  const getCardStyle = () => {
    let cardStyle: ViewStyle = { ...styles.card };
    
    // Appliquer le style d'élévation
    switch (elevation) {
      case 'none':
        break;
      case 'small':
        cardStyle = { ...cardStyle, ...Layout.shadow.small };
        break;
      case 'medium':
        cardStyle = { ...cardStyle, ...Layout.shadow.medium };
        break;
      case 'large':
        cardStyle = { ...cardStyle, ...Layout.shadow.large };
        break;
    }
    
    // Appliquer le style de padding
    switch (padding) {
      case 'none':
        cardStyle = { ...cardStyle, padding: 0 };
        break;
      case 'small':
        cardStyle = { ...cardStyle, padding: Layout.padding.small };
        break;
      case 'medium':
        cardStyle = { ...cardStyle, padding: Layout.padding.medium };
        break;
      case 'large':
        cardStyle = { ...cardStyle, padding: Layout.padding.large };
        break;
    }
    
    // Appliquer le style de borderRadius
    switch (borderRadius) {
      case 'none':
        cardStyle = { ...cardStyle, borderRadius: 0 };
        break;
      case 'small':
        cardStyle = { ...cardStyle, borderRadius: Layout.borderRadius.small };
        break;
      case 'medium':
        cardStyle = { ...cardStyle, borderRadius: Layout.borderRadius.medium };
        break;
      case 'large':
        cardStyle = { ...cardStyle, borderRadius: Layout.borderRadius.large };
        break;
    }
    
    return cardStyle;
  };
  
  return (
    <View style={[getCardStyle(), style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.medium,
    padding: Layout.padding.medium,
  },
}); 