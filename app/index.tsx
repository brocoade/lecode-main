import React, { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../context/LanguageContext';

// Clé pour stocker l'email dans AsyncStorage
const EMAIL_FOR_SIGNIN = 'emailForSignIn';

/**
 * Page principale qui redirige vers la page appropriée selon le statut de connexion
 */
export default function App() {
  const { user, loading, checkSignInLink, completeSignInWithLink } = useAuth();
  const [handlingLink, setHandlingLink] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const { language } = useLanguage();

  // Vérifier si un lien d'authentification est présent dans l'URL au démarrage
  useEffect(() => {
    const checkIncomingLink = async () => {
      try {
        // Obtenir l'URL qui a ouvert l'application
        const url = await Linking.getInitialURL();
        console.log("URL initiale:", url || "Aucune URL initiale");
        
        if (url && checkSignInLink(url)) {
          console.log("Lien d'authentification détecté dans l'URL initiale");
          handleAuthLink(url);
        }
      } catch (err) {
        console.error('Erreur lors de la vérification du lien entrant:', err);
      }
    };

    // Configurer un écouteur pour les liens entrants
    const subscription = Linking.addEventListener('url', (event) => {
      console.log("Événement URL:", event.url);
      if (event.url && checkSignInLink(event.url)) {
        console.log("Lien d'authentification détecté dans l'événement URL");
        handleAuthLink(event.url);
      }
    });

    checkIncomingLink();

    return () => {
      subscription.remove();
    };
  }, []);

  const handleAuthLink = async (url: string) => {
    if (!url) {
      console.log("URL invalide pour l'authentification");
      return;
    }
    
    setHandlingLink(true);
    setLinkError(null);
    
    try {
      // Récupérer l'email stocké
      const email = await AsyncStorage.getItem(EMAIL_FOR_SIGNIN);
      
      if (!email) {
        console.log("Email non trouvé dans AsyncStorage");
        setLinkError("Email non trouvé. Veuillez vous connecter avec votre email et mot de passe.");
        setHandlingLink(false);
        return;
      }
      
      console.log("Tentative d'authentification avec:", email);
      await completeSignInWithLink(email, url);
      console.log("Authentification réussie");
    } catch (error: any) {
      console.error("Erreur lors de l'authentification avec le lien:", error);
      setLinkError(error.message || "Erreur d'authentification. Veuillez réessayer.");
    } finally {
      setHandlingLink(false);
    }
  };

  // Afficher une page de chargement pendant que l'état d'authentification est vérifié
  if (loading || handlingLink) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4C66EE" />
        <Text style={styles.loadingText}>
          {handlingLink
            ? language === 'fr'
              ? "Traitement du lien d'authentification..."
              : "Processing authentication link..."
            : language === 'fr'
              ? "Chargement..."
              : "Loading..."}
        </Text>
        {linkError && <Text style={styles.errorText}>{linkError}</Text>}
      </View>
    );
  }

  // Rediriger vers la nouvelle structure avec layout partagé
  if (user) {
    return <Redirect href="/(app)/learn" />;
  }
  
  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#333',
  },
  errorText: {
    marginTop: 10,
    fontSize: 14,
    color: '#FF3B30',
    textAlign: 'center',
    paddingHorizontal: 30,
  }
}); 