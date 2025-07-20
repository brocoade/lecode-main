import React from 'react';
import { View, StyleSheet, Text, Image } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

interface QRCodeGeneratorProps {
  size?: number;
  color?: string;
  backgroundColor?: string;
  logoSize?: number;
  logoBackgroundColor?: string;
  logoMargin?: number;
  logoBorderRadius?: number;
}

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  size = 200,
  color = '#000',
  backgroundColor = '#FFF',
  logoSize = 50,
  logoBackgroundColor = '#FFF',
  logoMargin = 5,
  logoBorderRadius = 10,
}) => {
  // Données de l'application à encoder dans le QR code
  const appData = {
    name: 'MEDUCARE',
    version: '1.0.0',
    scheme: 'meducare://',
    description: 'Application éducative pour l\'apprentissage de la santé',
    features: [
      'Apprentissage par catégories',
      'Quiz interactifs',
      'Suivi de progression',
      'Navigation par drawer',
      'Interface utilisateur intuitive'
    ],
    lastUpdate: new Date().toISOString(),
  };

  // Convertir les données en chaîne JSON
  const qrValue = JSON.stringify(appData);

  // Logo pour le QR code
  const logoImage = require('../../assets/images/meducare-logo.png');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>MEDUCARE</Text>
      <View style={styles.qrContainer}>
        <QRCode
          value={qrValue}
          size={size}
          color={color}
          backgroundColor={backgroundColor}
          logo={logoImage}
          logoSize={logoSize}
          logoBackgroundColor={logoBackgroundColor}
          logoMargin={logoMargin}
          logoBorderRadius={logoBorderRadius}
        />
      </View>
      <Text style={styles.version}>Version 1.0.0</Text>
      <Text style={styles.instructions}>Scannez ce code pour accéder à l'application</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#3E8E41',
  },
  qrContainer: {
    padding: 15,
    backgroundColor: '#FFF',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  version: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  instructions: {
    marginTop: 10,
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
}); 