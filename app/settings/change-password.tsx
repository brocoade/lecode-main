import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import BottomTabBar from '@/components/navigation/BottomTabBar';
import SharedTransition from '@/components/navigation/SharedTransition';

export default function ChangePasswordScreen() {
  const { user, updatePassword } = useAuth();
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isCurrentPasswordVisible, setIsCurrentPasswordVisible] = useState(false);
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  const handleChangePassword = async () => {
    // Validation des champs
    if (!currentPassword.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre mot de passe actuel');
      return;
    }

    if (!newPassword.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nouveau mot de passe');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Erreur', 'Le nouveau mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    try {
      await updatePassword(currentPassword, newPassword);
      Alert.alert(
        'Succès',
        'Votre mot de passe a été mis à jour avec succès',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      let errorMessage = error.message || 'Une erreur est survenue lors du changement de mot de passe';
      if (
        errorMessage.toLowerCase().includes('mot de passe actuel est incorrect') ||
        errorMessage.toLowerCase().includes('wrong password') ||
        errorMessage.toLowerCase().includes('invalid-credential')
      ) {
        errorMessage = 'Le mot de passe actuel que vous avez saisi est incorrect.';
      }
      Alert.alert('Erreur', errorMessage);
    }
  };

  return (
    <SharedTransition transitionKey="change-password-screen">
      <View style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={false}
          >
            <LinearGradient
              colors={['#4C66EF', '#3F51B5']}
              style={styles.headerGradient}
            >
              <View style={styles.headerActions}>
                <TouchableOpacity
                  onPress={() => router.back()}
                  style={styles.backButton}
                >
                  <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Changer le mot de passe</Text>
              </View>
            </LinearGradient>

            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mot de passe actuel</Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="lock" size={22} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder="Entrez votre mot de passe actuel"
                    placeholderTextColor="#aaa"
                    secureTextEntry={!isCurrentPasswordVisible}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setIsCurrentPasswordVisible(!isCurrentPasswordVisible)}
                  >
                    <MaterialCommunityIcons
                      name={isCurrentPasswordVisible ? 'eye-off' : 'eye'}
                      size={22}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nouveau mot de passe</Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="lock-plus" size={22} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Entrez votre nouveau mot de passe"
                    placeholderTextColor="#aaa"
                    secureTextEntry={!isNewPasswordVisible}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setIsNewPasswordVisible(!isNewPasswordVisible)}
                  >
                    <MaterialCommunityIcons
                      name={isNewPasswordVisible ? 'eye-off' : 'eye'}
                      size={22}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirmer le nouveau mot de passe</Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="lock-check" size={22} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirmez votre nouveau mot de passe"
                    placeholderTextColor="#aaa"
                    secureTextEntry={!isConfirmPasswordVisible}
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
              </View>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleChangePassword}
              >
                <Text style={styles.saveButtonText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        <BottomTabBar />
      </View>
    </SharedTransition>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 80,
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 8,
  },
  saveButton: {
    backgroundColor: '#4C66EF',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 