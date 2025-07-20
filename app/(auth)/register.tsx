import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ScrollView, Alert, AlertButton, Modal, FlatList, Platform, KeyboardAvoidingView, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { FirebaseError } from 'firebase/app';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { userStatsService } from '@/app/services/userStats';
import { UserCredential } from 'firebase/auth';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { SuccessMessage } from '../../components/ui/SuccessMessage';
import { errorService } from '../../app/services/error.service';

// Liste des groupes sanguins disponibles
const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [birthDate, setBirthDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const {
    error,
    isLoading,
    successMessage,
    setError,
    setLoading,
    handleValidationError,
    handleFirebaseError,
    clearError,
    clearSuccess
  } = useErrorHandler();
  const [showBloodTypeModal, setShowBloodTypeModal] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  
  const router = useRouter();
  const { signUp } = useAuth();
  
  const scrollViewRef = React.useRef<ScrollView>(null);
  
  const handleBloodTypeSelect = (type: string) => {
    setBloodType(type);
    setShowBloodTypeModal(false);
  };
  
  const renderBloodTypeItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.bloodTypeItem,
        bloodType === item ? styles.bloodTypeItemSelected : {}
      ]}
      onPress={() => handleBloodTypeSelect(item)}
    >
      <Text 
        style={[
          styles.bloodTypeItemText,
          bloodType === item ? styles.bloodTypeItemTextSelected : {}
        ]}
      >
        {item}
      </Text>
      {bloodType === item && (
        <View style={styles.checkIconContainer}>
          <MaterialCommunityIcons name="check" size={20} color="#fff" />
        </View>
      )}
    </TouchableOpacity>
  );

  const handleFocus = (y: number) => {
    scrollViewRef.current?.scrollTo({
      y: y,
      animated: true
    });
  };

  const handleRegister = async () => {
    try {
      // Validation du nom
      if (!name.trim()) {
        handleValidationError('validation/empty-fields');
        return;
      }

      // Validation de l'email avec le service
      const emailValidationError = errorService.validateEmail(email);
      if (emailValidationError) {
        setError(emailValidationError);
        return;
      }

      // Validation du mot de passe avec le service
      const passwordValidationError = errorService.validatePassword(password);
      if (passwordValidationError) {
        setError(passwordValidationError);
        return;
      }

      // Validation de la confirmation du mot de passe
      if (!confirmPassword.trim()) {
        handleValidationError('validation/empty-fields');
        return;
      }

      // Validation de la correspondance des mots de passe avec le service
      const passwordMatchError = errorService.validatePasswordMatch(password, confirmPassword);
      if (passwordMatchError) {
        setError(passwordMatchError);
        return;
      }

      // Validation du groupe sanguin avec le service
      const bloodTypeValidationError = errorService.validateBloodType(bloodType, BLOOD_TYPES);
      if (bloodTypeValidationError) {
        setError(bloodTypeValidationError);
        return;
      }

      // Validation de l'âge avec le service
      const ageValidationError = errorService.validateAge(birthDate);
      if (ageValidationError) {
        setError(ageValidationError);
        return;
      }

      setLoading(true);
    
      const userCredential = await signUp(email.trim(), password, name.trim()) as UserCredential;
      
      if (userCredential.user) {
        // Initialiser les statistiques de l'utilisateur
        userStatsService.initializeUserStats(
          userCredential.user.uid,  
          bloodType,
          birthDate.toISOString(),
          name.trim(),
          email.trim()
        ).catch(console.error); // Gestion d'erreur non bloquante
        
        // Afficher le modal de bienvenue
        setShowWelcomeModal(true);
        setLoading(false);
      }
    } catch (error: any) {
      setLoading(false);
      if (error instanceof FirebaseError) {
        // Gestion spéciale pour l'email déjà utilisé avec proposition d'action
        if (error.code === 'auth/email-already-in-use') {
          const errorMessage = errorService.handleFirebaseError(error, 'RegisterScreen.handleRegister');
          setError(errorMessage);
          Alert.alert(
            'Email déjà utilisé',
            'Un compte existe déjà avec cette adresse email. Voulez-vous vous connecter ?',
            [
              {
                text: 'Annuler',
                style: 'cancel' as AlertButton['style']
              },
              {
                text: 'Se connecter',
                onPress: () => router.push('/(auth)/login'),
                style: 'default' as AlertButton['style']
              }
            ]
          );
        } else {
          // Utiliser le service d'erreur pour les autres erreurs Firebase
          handleFirebaseError(error);
        }
      } else {
        // Pour les erreurs non-Firebase, utiliser le service générique
        const genericError = errorService.handleGenericError(error, 'RegisterScreen.handleRegister');
        setError(genericError);
      }
    }
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
        <Text style={styles.subtitle}>Créez votre compte pour commencer</Text>
      </LinearGradient>
      
      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>Créer un compte</Text>
        
        <ErrorMessage
          error={error}
          onActionPress={error?.actionable ? () => router.push('/(auth)/login') : undefined}
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
            source={require('../../assets/images/user.png')} 
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Nom complet"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
              onFocus={() => handleFocus(200)}
          />
        </View>
        
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
              onFocus={() => handleFocus(250)}
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
              onFocus={() => handleFocus(300)}
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
        
        <View style={styles.inputContainer}>
          <MaterialCommunityIcons 
            name="lock" 
            size={22} 
            color="#666" 
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Confirmer le mot de passe"
            placeholderTextColor="#999"
            secureTextEntry={!isConfirmPasswordVisible}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
          >
            <MaterialCommunityIcons
              name={isConfirmPasswordVisible ? 'eye-off' : 'eye'}
              size={22}
              color="#666"
            />
          </TouchableOpacity>
        </View>
        
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Groupe sanguin*</Text>
            <TouchableOpacity
              style={styles.bloodTypeButton}
              onPress={() => setShowBloodTypeModal(true)}
            >
              <Text style={[styles.bloodTypeButtonText, !bloodType && styles.placeholderText]}>
                {bloodType || "Sélectionnez votre groupe sanguin"}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date de naissance*</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => {
                Keyboard.dismiss();
                setShowDatePicker(true);
              }}
            >
              <Text style={[styles.dateButtonText, styles.inputText]}>
                {birthDate.toLocaleDateString('fr-FR')}
              </Text>
              <MaterialCommunityIcons name="calendar" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          {/* DateTimePicker bien visible selon la plateforme */}
          {showDatePicker && (
            Platform.OS === 'ios' ? (
              <View style={{
                backgroundColor: '#fff',
                borderRadius: 16,
                padding: 20,
                margin: 20,
                borderWidth: 2,
                borderColor: '#4CAF50',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 5,
                alignSelf: 'center',
                width: '90%',
              }}>
                <DateTimePicker
                  value={birthDate}
                  mode="date"
                  display="spinner"
                  onChange={(_, selectedDate) => {
                    if (selectedDate) setBirthDate(selectedDate);
                  }}
                  maximumDate={new Date()}
                  style={{ width: '100%' }}
                  textColor="#4CAF50"
                />
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={{ color: '#4CAF50', marginTop: 10, textAlign: 'center', fontWeight: 'bold', fontSize: 16 }}>Fermer</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Modal
                transparent={false}
                visible={showDatePicker}
                animationType="fade"
                onRequestClose={() => setShowDatePicker(false)}
              >
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
                  <View style={{
                    backgroundColor: '#fff',
                    borderRadius: 16,
                    padding: 20,
                    borderWidth: 2,
                    borderColor: '#4CAF50',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 5,
                    width: '90%',
                    alignSelf: 'center',
                  }}>
                    <DateTimePicker
                      value={birthDate}
                      mode="date"
                      display="calendar"
                      onChange={(_, selectedDate) => {
                        if (selectedDate) setBirthDate(selectedDate);
                        setShowDatePicker(false);
                      }}
                      maximumDate={new Date()}
                      style={{ width: '100%' }}
                    />
                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                      <Text style={{ color: '#4CAF50', marginTop: 10, textAlign: 'center', fontWeight: 'bold', fontSize: 16 }}>Fermer</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
            )
          )}
        
        <Text style={styles.termsText}>
          En vous inscrivant, vous acceptez nos{' '}
          <Text style={styles.termsLink}>Conditions d'utilisation</Text> et notre{' '}
          <Text style={styles.termsLink}>Politique de confidentialité</Text>
        </Text>
        
        <TouchableOpacity 
          style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
          onPress={handleRegister}
          disabled={isLoading}
        >
          <Text style={styles.registerButtonText}>
            {isLoading ? 'Inscription...' : 'S\'inscrire'}
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
        
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Vous avez déjà un compte ?</Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.loginLink}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal du sélecteur de groupe sanguin */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showBloodTypeModal}
        onRequestClose={() => {
          setShowBloodTypeModal(false);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choisissez votre groupe sanguin</Text>
            </View>
            
            <FlatList
              data={BLOOD_TYPES}
              renderItem={renderBloodTypeItem}
              keyExtractor={(item) => item}
              numColumns={2}
              contentContainerStyle={styles.bloodTypeList}
              columnWrapperStyle={styles.bloodTypeRow}
              ItemSeparatorComponent={() => <View style={{height: 16}} />}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.buttonClose]}
                onPress={() => setShowBloodTypeModal(false)}
              >
                <Text style={styles.textStyle}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

        {/* Modal de bienvenue */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={showWelcomeModal}
          onRequestClose={() => {
            setShowWelcomeModal(false);
            router.replace('/(app)/learn');
          }}
        >
          <View style={styles.welcomeModalContainer}>
            <View style={styles.welcomeModalContent}>
              <View style={styles.welcomeIconContainer}>
                <Text style={styles.welcomeIcon}>🎉</Text>
              </View>
              
              <Text style={styles.welcomeTitle}>
                Bienvenue dans la famille Meducare !
              </Text>
              
              <Text style={styles.welcomeMessage}>
                Félicitations {name.trim()} ! 🌟{'\n\n'}
                Vous êtes maintenant prêt(e) à commencer votre voyage dans l'apprentissage médical.{'\n\n'}
                Nous sommes ravis de vous accompagner dans cette aventure passionnante ! 🚀
              </Text>

              <TouchableOpacity
                style={styles.startButton}
                onPress={() => {
                  setShowWelcomeModal(false);
                  router.replace('/(app)/learn');
                }}
              >
                <LinearGradient
                  colors={['#4CAF50', '#388E3C']}
                  style={styles.gradientButton}
                >
                  <Text style={styles.startButtonText}>✨ Commencer l'aventure</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
    height: 250,
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
    width: 120,
    height: 120,
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
    paddingTop: 20,
    paddingBottom: 20,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  errorText: {
    color: '#FF3B30',
    marginBottom: 15,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    height: 55,
    backgroundColor: '#FAFAFA',
  },
  inputIcon: {
    width: 20,
    height: 20,
    marginRight: 15,
  },
  input: {
    flex: 1,
    height: '100%',
    color: '#333',
    fontSize: 16,
  },
  bloodTypeText: {
    flex: 1,
    color: '#333',
    fontSize: 16,
    paddingVertical: 15,
  },
  selectedValueContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bloodTypeIndicator: {
    marginLeft: 8,
    marginRight: 8,
  },
  bloodTypeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  dropdownIcon: {
    marginLeft: 'auto',
  },
  termsText: {
    fontSize: 14,
    color: '#666666',
    marginTop: 15,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
    backgroundColor: '#F8F8F8',
    padding: 10,
    borderRadius: 8,
  },
  termsLink: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  registerButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  registerButtonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  passwordlessButton: {
    backgroundColor: 'transparent',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4CAF50',
    marginBottom: 15,
  },
  passwordlessButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    marginTop: 10,
  },
  loginText: {
    color: '#666666',
    fontSize: 15,
    fontWeight: '500',
  },
  loginLink: {
    color: '#4CAF50',
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  // Styles pour les modals
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 0,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },
  modalHeader: {
    width: '100%',
    backgroundColor: '#4C66EF',
    padding: 20,
    alignItems: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalButtons: {
    marginTop: 20,
    marginBottom: 20,
    width: '90%',
  },
  button: {
    borderRadius: 10,
    padding: 12,
    elevation: 2,
    backgroundColor: '#4C66EF',
  },
  buttonClose: {
    backgroundColor: '#4C66EF',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
  // Styles pour le sélecteur de groupe sanguin
  bloodTypeList: {
    width: '100%',
    padding: 15,
  },
  bloodTypeRow: {
    justifyContent: 'space-around',
    paddingHorizontal: 5,
  },
  bloodTypeItem: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    margin: 8,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    height: 80,
    width: '40%',
    position: 'relative',
    overflow: 'visible',
  },
  bloodTypeItemSelected: {
    backgroundColor: '#4C66EF',
    borderWidth: 3,
    borderColor: '#3854D0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 6,
  },
  bloodTypeItemText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  bloodTypeItemTextSelected: {
    color: '#fff',
    fontSize: 28,
  },
  checkIconContainer: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#4C66EF',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  eyeIcon: {
    padding: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  inputText: {
    color: '#333',
  },
  welcomeModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  welcomeModalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    width: '85%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  welcomeIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0F8F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeIcon: {
    fontSize: 40,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
  },
  welcomeMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 25,
  },
  startButton: {
    width: '100%',
    marginTop: 10,
    borderRadius: 15,
    overflow: 'hidden',
  },
  gradientButton: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    alignItems: 'center',
    borderRadius: 15,
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bloodTypeButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  bloodTypeButtonText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
}); 