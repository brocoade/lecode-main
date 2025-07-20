import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';

// Clé pour stocker l'email dans AsyncStorage
const EMAIL_FOR_SIGNIN = 'emailForSignIn';

export default function EmailLinkScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [verifyingLink, setVerifyingLink] = useState(false);
  const [manualVerification, setManualVerification] = useState(false);
  
  const router = useRouter();
  const params = useLocalSearchParams();
  const { sendSignInLink, completeSignInWithLink, checkSignInLink } = useAuth();
  
  // Vérifier si un lien d'authentification est présent dans l'URL
  useEffect(() => {
    const checkIncomingLink = async () => {
      try {
        // Obtenir l'URL qui a ouvert l'application
        const url = await Linking.getInitialURL();
        if (url) {
          console.log("URL de démarrage reçue:", url);
          handleIncomingLink(url);
        }
      } catch (err) {
        console.error('Erreur lors de la vérification du lien entrant:', err);
      }
    };

    // Configurer un écouteur d'événements pour les liens entrants
    const subscription = Linking.addEventListener('url', (event) => {
      console.log("URL reçue via listener:", event.url);
      handleIncomingLink(event.url);
    });

    // Vérifier si un lien est déjà présent
    checkIncomingLink();

    // Récupérer l'email depuis AsyncStorage
    const getEmailFromStorage = async () => {
      try {
        const storedEmail = await AsyncStorage.getItem(EMAIL_FOR_SIGNIN);
        if (storedEmail) {
          setEmail(storedEmail);
          console.log("Email récupéré depuis le stockage:", storedEmail);
        }
      } catch (err) {
        console.error('Erreur lors de la récupération de l\'email:', err);
      }
    };

    getEmailFromStorage();

    return () => {
      subscription.remove();
    };
  }, []);

  const handleIncomingLink = async (url: string) => {
    console.log("Vérification du lien:", url);
    if (!url) {
      console.log("URL invalide ou vide");
      return;
    }
    
    if (checkSignInLink(url)) {
      console.log("Lien d'authentification valide détecté");
      setVerifyingLink(true);
      try {
        // Récupérer l'email depuis AsyncStorage
        const storedEmail = await AsyncStorage.getItem(EMAIL_FOR_SIGNIN);
        
        if (storedEmail) {
          console.log("Tentative de connexion avec email:", storedEmail);
          // Terminer l'authentification
          await completeSignInWithLink(storedEmail, url);
          // Rediriger vers la page learn
          router.replace('/learn');
        } else {
          // Si l'email n'est pas disponible, demander à l'utilisateur
          console.log("Email non trouvé dans le stockage local");
          setManualVerification(true);
          setError('Veuillez entrer l\'email avec lequel vous avez demandé le lien de connexion');
        }
      } catch (err: any) {
        console.error("Erreur lors de la vérification:", err);
        setError(`Erreur lors de la vérification du lien: ${err.message || 'Problème d\'authentification'}`);
      } finally {
        setVerifyingLink(false);
      }
    } else {
      console.log("Le lien n'est pas un lien d'authentification valide");
    }
  };
  
  const handleManualLinkVerification = async () => {
    if (!email) {
      setError('Veuillez entrer votre adresse email');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Veuillez entrer une adresse email valide');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Tenter de terminer l'authentification avec l'email saisi manuellement
      const url = await Linking.getInitialURL() || '';
      console.log("URL pour vérification manuelle:", url);
      
      if (!url) {
        setError("Aucun lien d'authentification trouvé. Veuillez cliquer à nouveau sur le lien dans votre email.");
        return;
      }
      
      if (url && checkSignInLink(url)) {
        // Sauvegarder l'email pour les futures connexions
        await AsyncStorage.setItem(EMAIL_FOR_SIGNIN, email);
        
        // Compléter l'authentification
        await completeSignInWithLink(email, url);
        
        // Rediriger vers la page learn
        router.replace('/learn');
      } else {
        setError("Lien d'authentification invalide ou expiré. Veuillez demander un nouveau lien.");
      }
    } catch (e: any) {
      console.error("Erreur lors de la vérification manuelle:", e);
      setError(`Erreur: ${e.message || "Problème d'authentification"}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSendLink = async () => {
    if (!email) {
      setError('Veuillez entrer votre adresse email');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Veuillez entrer une adresse email valide');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccess(false);
    
    try {
      await sendSignInLink(email);
      setSuccess(true);
      Alert.alert(
        "Email envoyé",
        "Un lien de connexion a été envoyé à votre adresse email. Veuillez vérifier votre boîte de réception et cliquer sur le lien pour vous connecter."
      );
    } catch (e: any) {
      console.error("Erreur d'envoi de lien:", e);
      setError(`Une erreur s'est produite: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (verifyingLink) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Vérification du lien de connexion...</Text>
      </View>
    );
  }
  
  if (manualVerification) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1 }}>
        <LinearGradient
          colors={['#4C66EE', '#60AEFB']}
          style={styles.header}
        >
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>M</Text>
          </View>
          <Text style={styles.title}>MEDUCARE</Text>
          <Text style={styles.subtitle}>Confirmation d'identité</Text>
        </LinearGradient>
        
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Confirmez votre email</Text>
          
          <Text style={styles.description}>
            Entrez l'adresse email avec laquelle vous avez demandé votre lien de connexion.
          </Text>
          
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          
          <View style={styles.inputContainer}>
            <Image 
              source={require('../../assets/images/mail.png')} 
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>
          
          <TouchableOpacity 
            style={[styles.sendLinkButton, isLoading && styles.sendLinkButtonDisabled]}
            onPress={handleManualLinkVerification}
            disabled={isLoading}
          >
            <Text style={styles.sendLinkButtonText}>
              {isLoading ? 'Vérification...' : 'Confirmer'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1 }}>
      <LinearGradient
        colors={['#4CAF50', '#388E3C']}
        style={styles.header}
      >
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/images/meducare-logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.title}>MEDUCARE</Text>
        <Text style={styles.subtitle}>Connexion sans mot de passe</Text>
      </LinearGradient>
      
      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>Connexion par email</Text>
        
        <Text style={styles.description}>
          Recevez un lien de connexion magique par email. Plus besoin de mot de passe !
        </Text>
        
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {success && <Text style={styles.successText}>Lien envoyé ! Vérifiez votre boîte email.</Text>}
        
        <View style={styles.inputContainer}>
          <Image 
            source={require('../../assets/images/mail.png')} 
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>
        
        <TouchableOpacity 
          style={[styles.sendLinkButton, isLoading && styles.sendLinkButtonDisabled]}
          onPress={handleSendLink}
          disabled={isLoading}
        >
          <Text style={styles.sendLinkButtonText}>
            {isLoading ? 'Envoi en cours...' : 'Recevoir un lien de connexion'}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.otherOptionsContainer}>
          <Text style={styles.optionsSeparator}>ou</Text>
          
          <TouchableOpacity 
            style={styles.passwordLoginButton}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.passwordLoginText}>
              Se connecter avec un mot de passe
            </Text>
          </TouchableOpacity>
          
          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Vous n'avez pas de compte ?</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.signupLink}>Créer un compte</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    fontSize: 16,
    color: '#333',
    marginTop: 20,
  },
  header: {
    height: 320,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 5,
  },
  logo: {
    width: 200,
    height: 200,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  logoText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginTop: -30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 25,
    paddingTop: 30,
    paddingBottom: 40,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 25,
    lineHeight: 20,
  },
  errorText: {
    color: '#FF3B30',
    marginBottom: 10,
    fontSize: 14,
  },
  successText: {
    color: '#34C759',
    marginBottom: 10,
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 25,
  },
  inputIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
    opacity: 0.7,
  },
  input: {
    flex: 1,
    height: 50,
    color: '#333',
    fontSize: 16,
  },
  sendLinkButton: {
    backgroundColor: '#4C66EE',
    borderRadius: 10,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#4C66EE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  sendLinkButtonDisabled: {
    backgroundColor: '#A5B4FC',
  },
  sendLinkButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  otherOptionsContainer: {
    alignItems: 'center',
  },
  optionsSeparator: {
    color: '#999',
    fontSize: 14,
    marginBottom: 20,
    position: 'relative',
    width: '100%',
    textAlign: 'center',
  },
  passwordLoginButton: {
    width: '100%',
    height: 55,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  passwordLoginText: {
    color: '#333',
    fontSize: 16,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  signupText: {
    color: '#999',
    fontSize: 14,
    marginRight: 5,
  },
  signupLink: {
    color: '#4C66EE',
    fontSize: 14,
    fontWeight: 'bold',
  }
}); 