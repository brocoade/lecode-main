import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { FirebaseError } from 'firebase/app';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { SuccessMessage } from '../../components/ui/SuccessMessage';
import { errorService } from '../../app/services/error.service';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const scrollViewRef = React.useRef<ScrollView>(null);

  const router = useRouter();
  const { signIn, forgotPassword } = useAuth();
  const {
    error,
    isLoading,
    successMessage,
    setError,
    setLoading,
    handleFirebaseError,
    handleValidationError,
    handleSuccess,
    clearError,
    clearSuccess
  } = useErrorHandler();
  
  const handleLogin = async () => {
    // Validation des champs obligatoires
    if (!email.trim()) {
      handleValidationError('validation/empty-fields');
      return;
    }

    if (!password.trim()) {
      handleValidationError('validation/empty-fields');
      return;
    }

    // Validation de l'email avec le service
    const emailValidationError = errorService.validateEmail(email);
    if (emailValidationError) {
      setError(emailValidationError);
      return;
    }

    setLoading(true);

    try {
      await signIn(email.trim(), password);
      handleSuccess('auth/login-success');
      router.replace('/learn');
    } catch (e: any) {
      if (e instanceof FirebaseError) {
        // Utiliser le service d'erreur pour traiter l'erreur Firebase
        handleFirebaseError(e);
      } else {
        // Pour les erreurs non-Firebase, utiliser le service générique
        const genericError = errorService.handleGenericError(e, 'LoginScreen.handleLogin');
        setError(genericError);
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleForgotPassword = async () => {
    if (!email.trim()) {
      handleValidationError('validation/empty-fields');
      return;
    }

    // Validation de l'email avec le service
    const emailValidationError = errorService.validateEmail(email);
    if (emailValidationError) {
      setError(emailValidationError);
      return;
    }

    setLoading(true);

    try {
      await forgotPassword(email.trim());
      handleSuccess('auth/password-reset-sent');
      Alert.alert(
        "Email envoyé",
        "Un email de réinitialisation a été envoyé à votre adresse email. Veuillez vérifier votre boîte de réception."
      );
    } catch (e: any) {
      if (e instanceof FirebaseError) {
        handleFirebaseError(e);
      } else {
        const genericError = errorService.handleGenericError(e, 'LoginScreen.handleForgotPassword');
        setError(genericError);
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleFocus = (y: number) => {
    scrollViewRef.current?.scrollTo({
      y: y,
      animated: true
    });
  };
  
  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView 
        ref={scrollViewRef}
        style={styles.container} 
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
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
          <Text style={styles.subtitle}>Votre santé, notre priorité</Text>
        </LinearGradient>
        
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Connexion</Text>

          <ErrorMessage
            error={error}
            onActionPress={error?.actionable ? handleForgotPassword : undefined}
            onDismiss={clearError}
            dismissible={true}
          />

          <SuccessMessage
            message={successMessage || ''}
            visible={!!successMessage}
            onDismiss={clearSuccess}
            dismissible={true}
            autoHide={true}
          />
          
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
              onFocus={() => handleFocus(200)}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons 
              name="lock" 
              size={22} 
              color="#666" 
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Mot de passe"
              placeholderTextColor="#999"
              secureTextEntry={!isPasswordVisible}
              value={password}
              onChangeText={setPassword}
              onFocus={() => handleFocus(250)}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            >
              <MaterialCommunityIcons
                name={isPasswordVisible ? 'eye-off' : 'eye'}
                size={22}
                color="#666"
              />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity style={styles.forgotPassword} onPress={handleForgotPassword}>
            <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.loginButtonText}>
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.passwordlessButton}
            onPress={() => router.push('/(auth)/email-link')}
          >
            <Text style={styles.passwordlessButtonText}>
              Se connecter sans mot de passe
            </Text>
          </TouchableOpacity>
          
          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Vous n'avez pas de compte ?</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.signupLink}>Créer un compte</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    height: 280,
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
    width: 150,
    height: 150,
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
    marginTop: -15,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 25,
    paddingTop: 25,
    paddingBottom: 20,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
  },
  errorText: {
    color: '#FF3B30',
    backgroundColor: '#FFE5E5',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    borderWidth: 1,
    borderColor: '#FFD5D5',
  },
  successText: {
    color: '#34C759',
    backgroundColor: '#E8F8E8',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    borderWidth: 1,
    borderColor: '#D1EFD1',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 25,
  },
  forgotPasswordText: {
    color: '#4CAF50',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  loginButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  passwordlessButton: {
    width: '100%',
    height: 45,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  passwordlessButtonText: {
    color: '#333',
    fontSize: 14,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    marginTop: 10,
  },
  signupText: {
    color: '#666666',
    fontSize: 15,
    fontWeight: '500',
  },
  signupLink: {
    color: '#4CAF50',
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  eyeIcon: {
    padding: 8,
  },
}); 