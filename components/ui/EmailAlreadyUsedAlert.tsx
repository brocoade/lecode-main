import React from 'react';
import { Alert, AlertButton } from 'react-native';
import { useRouter } from 'expo-router';

interface EmailAlreadyUsedAlertProps {
  email: string;
  onCancel?: () => void;
}

/**
 * Alerte personnalisée pour l'erreur d'email déjà utilisé
 */
export const showEmailAlreadyUsedAlert = (email: string, router: any) => {
  Alert.alert(
    '📧 Email déjà utilisé',
    `Un compte existe déjà avec l'adresse "${email}".\n\nVoulez-vous vous connecter à ce compte ?`,
    [
      {
        text: 'Annuler',
        style: 'cancel' as AlertButton['style']
      },
      {
        text: '🔑 Se connecter',
        onPress: () => {
          // Pré-remplir l'email sur la page de connexion
          router.push({
            pathname: '/(auth)/login',
            params: { email }
          });
        },
        style: 'default' as AlertButton['style']
      }
    ]
  );
};

/**
 * Alerte pour mot de passe oublié
 */
export const showForgotPasswordAlert = (email: string, onResetPassword: () => void) => {
  Alert.alert(
    '🔐 Mot de passe oublié ?',
    `Voulez-vous recevoir un lien de réinitialisation à l'adresse "${email}" ?`,
    [
      {
        text: 'Annuler',
        style: 'cancel' as AlertButton['style']
      },
      {
        text: '📧 Envoyer le lien',
        onPress: onResetPassword,
        style: 'default' as AlertButton['style']
      }
    ]
  );
};
