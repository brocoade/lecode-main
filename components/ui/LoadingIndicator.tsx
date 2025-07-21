import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

interface LoadingIndicatorProps {
  message?: string;
  size?: 'small' | 'large';
  color?: string;
  style?: any;
}

/**
 * Indicateur de chargement réutilisable
 */
export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  message = 'Chargement...',
  size = 'large',
  color = '#2196F3',
  style
}) => {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={[styles.message, { color }]}>{message}</Text>}
    </View>
  );
};

/**
 * Indicateur de chargement pour l'initialisation
 */
export const InitializationLoader: React.FC = () => {
  return (
    <View style={styles.fullScreen}>
      <ActivityIndicator size="large" color="#2196F3" />
      <Text style={styles.initMessage}>Initialisation de votre profil...</Text>
      <Text style={styles.subMessage}>Cela ne prendra qu'un instant</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  message: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
  },
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  initMessage: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  subMessage: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
