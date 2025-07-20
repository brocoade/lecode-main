import React, { ReactNode } from 'react';
import { View } from 'react-native';

interface SharedTransitionProps {
  children: ReactNode;
  transitionKey: string;
}

/**
 * Composant simplifié qui n'applique aucune animation
 * pour éviter les problèmes de performance
 */
const SharedTransition: React.FC<SharedTransitionProps> = ({ children }) => {
  return <View style={{ flex: 1 }}>{children}</View>;
};

export default SharedTransition; 