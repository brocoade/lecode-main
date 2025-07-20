import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  ScrollView,
  Platform,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import BottomTabBar from '@/components/navigation/BottomTabBar';
import SharedTransition from '@/components/navigation/SharedTransition';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { userStatsService } from '@/app/services/userStats';
import { doc, updateDoc } from 'firebase/firestore';
import { firebaseDB } from '../../backend/config/firebase.config';

// Liste des groupes sanguins disponibles
const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function EditProfileScreen() {
  const { user, refreshUserFromFirestore } = useAuth();
  const router = useRouter();
  
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [bloodType, setBloodType] = useState(user?.bloodType || '');
  const [profileImage, setProfileImage] = useState(null);
  const [birthDate, setBirthDate] = useState(user?.birthDate ? new Date(user.birthDate) : new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showBloodTypeModal, setShowBloodTypeModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSave = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      setIsLoading(true);
      if (!bloodType) {
        setErrorMsg('Veuillez sélectionner un groupe sanguin');
        setIsLoading(false);
        return;
      }
      if (!birthDate) {
        setErrorMsg('Veuillez sélectionner une date de naissance');
        setIsLoading(false);
        return;
      }
      if (!name.trim()) {
        setErrorMsg('Veuillez entrer votre nom');
        setIsLoading(false);
        return;
      }
      const uid = user?.uid;
      if (!uid) {
        setErrorMsg('Utilisateur non connecté');
        setIsLoading(false);
        return;
      }
      // Log debug
      console.log('DEBUG UPDATE PROFILE', { uid, name, bloodType, birthDate: birthDate.toISOString() });
      await updateDoc(doc(firebaseDB, 'users', uid), {
        name: name.trim(),
        bloodType,
        birthDate: birthDate.toISOString(),
      });
      // Rafraîchir le contexte utilisateur
      await refreshUserFromFirestore();
      setSuccessMsg('Vos informations ont été mises à jour avec succès');
      Alert.alert(
        'Succès',
        'Vos informations ont été mises à jour avec succès',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      let msg = 'Une erreur est survenue lors de la mise à jour de vos informations';
      if (error instanceof Error) msg = error.message;
      setErrorMsg(msg);
      Alert.alert(
        'Erreur',
        msg
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleImagePick = () => {
    // Pour démonstration seulement
    Alert.alert('Fonctionnalité', 'La sélection d\'image sera implémentée dans une version future');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer le compte',
      'Êtes-vous sûr de vouloir supprimer votre compte? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive', 
          onPress: () => {
            // Logique de suppression du compte
            router.replace('/(auth)/login');
          }
        }
      ]
    );
  };

  const handleBloodTypeSelect = (type: string) => {
    setBloodType(type);
    setShowBloodTypeModal(false);
  };

  // Fonction simple pour formater la date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
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

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setBirthDate(selectedDate);
    }
  };

  return (
    <SharedTransition transitionKey="edit-profile-screen">
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
              colors={['#3C7A89', '#2E5D6C']}
              style={styles.headerGradient}
            >
              <View style={styles.headerActions}>
                <TouchableOpacity 
                  onPress={() => router.back()}
                  style={styles.backButton}
                >
                  <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={handleSave}
                  style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.saveButtonText}>Enregistrer</Text>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.avatarSection}>
                <View style={styles.avatarContainer}>
                  <Image
                    source={require('@/assets/images/avatar.png')}
                    style={styles.avatar}
                  />
                  <View style={styles.editAvatarButtonContainer}>
                    <TouchableOpacity 
                      style={styles.editAvatarButton}
                      onPress={handleImagePick}
                    >
                      <MaterialCommunityIcons name="camera" size={24} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
                {/* Affichage du nom et de l'email sous la photo de profil */}
                <View style={{ alignItems: 'center', marginTop: 12 }}>
                  <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#222' }}>{user?.name || 'Nom'}</Text>
                  <Text style={{ fontSize: 15, color: '#666', marginTop: 2 }}>{user?.email || 'Email'}</Text>
                  {/* Affichage de la date de création du compte */}
                  {user?.createdAt && (
                    <Text style={{ color: '#888', fontSize: 13, marginTop: 2 }}>
                      Membre depuis le {user.createdAt.toDate ? user.createdAt.toDate().toLocaleDateString('fr-FR') : new Date(user.createdAt).toLocaleDateString('fr-FR')}
                    </Text>
                  )}
                </View>
              </View>
            </LinearGradient>

            <View style={styles.formContainer}>
              {/* Affiche l'UID pour debug */}
              {user?.uid && (
                <Text style={{ color: '#888', fontSize: 12, textAlign: 'center', marginBottom: 5 }}>UID: {user.uid}</Text>
              )}
              {errorMsg ? (
                <Text style={{ color: '#FF3B30', textAlign: 'center', marginBottom: 10 }}>{errorMsg}</Text>
              ) : null}
              {successMsg ? (
                <Text style={{ color: '#4CAF50', textAlign: 'center', marginBottom: 10 }}>{successMsg}</Text>
              ) : null}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nom complet</Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="account" size={22} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Entrez votre nom"
                    placeholderTextColor="#aaa"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="email" size={22} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Entrez votre email"
                    placeholderTextColor="#aaa"
                    keyboardType="email-address"
                    editable={false}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Date de naissance</Text>
                <TouchableOpacity 
                  style={styles.inputWrapper}
                  onPress={() => setShowDatePicker(true)}
                >
                  <MaterialCommunityIcons name="calendar" size={22} color="#666" style={styles.inputIcon} />
                  <Text style={styles.dateText}>
                    {formatDate(birthDate)}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Groupe sanguin</Text>
                <TouchableOpacity 
                  style={styles.inputWrapper}
                  onPress={() => setShowBloodTypeModal(true)}
                >
                  <MaterialCommunityIcons name="water" size={22} color="#666" style={styles.inputIcon} />
                  <View style={styles.selectedValueContainer}>
                    <Text style={styles.dateText}>
                      {bloodType}
                    </Text>
                    <View style={styles.bloodTypeIndicator}>
                      <View style={[styles.bloodTypeDot, {backgroundColor: bloodType.includes('-') ? '#3333CC' : '#CC3333'}]} />
                    </View>
                  </View>
                  <MaterialCommunityIcons name="chevron-down" size={22} color="#666" style={styles.dropdownIcon} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={handleDeleteAccount}
              >
                <MaterialCommunityIcons name="delete" size={22} color="#FF3B30" />
                <Text style={styles.deleteButtonText}>SUPPRIMER LE COMPTE</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
        
        <BottomTabBar />

        {/* Modal du sélecteur de date */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showDatePicker}
          onRequestClose={() => {
            setShowDatePicker(false);
          }}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>Sélectionnez une date</Text>
              
              <View style={styles.datePickerSimple}>
                <View style={styles.dateRow}>
                  <Pressable
                    style={styles.dateButton}
                    onPress={() => {
                      const newDate = new Date(birthDate);
                      newDate.setFullYear(newDate.getFullYear() - 1);
                      setBirthDate(newDate);
                    }}
                  >
                    <Text style={styles.dateButtonText}>- Année</Text>
                  </Pressable>
                  
                  <Text style={styles.dateValue}>{birthDate.getFullYear()}</Text>
                  
                  <Pressable
                    style={styles.dateButton}
                    onPress={() => {
                      const newDate = new Date(birthDate);
                      newDate.setFullYear(newDate.getFullYear() + 1);
                      if (newDate <= new Date()) {
                        setBirthDate(newDate);
                      }
                    }}
                  >
                    <Text style={styles.dateButtonText}>+ Année</Text>
                  </Pressable>
                </View>
                
                <View style={styles.dateRow}>
                  <Pressable
                    style={styles.dateButton}
                    onPress={() => {
                      const newDate = new Date(birthDate);
                      newDate.setMonth(newDate.getMonth() - 1);
                      setBirthDate(newDate);
                    }}
                  >
                    <Text style={styles.dateButtonText}>- Mois</Text>
                  </Pressable>
                  
                  <Text style={styles.dateValue}>
                    {birthDate.toLocaleString('fr-FR', { month: 'long' })}
                  </Text>
                  
                  <Pressable
                    style={styles.dateButton}
                    onPress={() => {
                      const newDate = new Date(birthDate);
                      newDate.setMonth(newDate.getMonth() + 1);
                      if (newDate <= new Date()) {
                        setBirthDate(newDate);
                      }
                    }}
                  >
                    <Text style={styles.dateButtonText}>+ Mois</Text>
                  </Pressable>
                </View>
                
                <View style={styles.dateRow}>
                  <Pressable
                    style={styles.dateButton}
                    onPress={() => {
                      const newDate = new Date(birthDate);
                      newDate.setDate(newDate.getDate() - 1);
                      setBirthDate(newDate);
                    }}
                  >
                    <Text style={styles.dateButtonText}>- Jour</Text>
                  </Pressable>
                  
                  <Text style={styles.dateValue}>{birthDate.getDate()}</Text>
                  
                  <Pressable
                    style={styles.dateButton}
                    onPress={() => {
                      const newDate = new Date(birthDate);
                      newDate.setDate(newDate.getDate() + 1);
                      if (newDate <= new Date()) {
                        setBirthDate(newDate);
                      }
                    }}
                  >
                    <Text style={styles.dateButtonText}>+ Jour</Text>
                  </Pressable>
                </View>
              </View>
              
              <View style={styles.modalButtons}>
                <Pressable
                  style={[styles.button, styles.buttonClose]}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.textStyle}>Confirmer</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

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
                <Pressable
                  style={[styles.button, styles.buttonClose]}
                  onPress={() => setShowBloodTypeModal(false)}
                >
                  <Text style={styles.textStyle}>Confirmer</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {showDatePicker && (
          <DateTimePicker
            value={birthDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
            maximumDate={new Date()}
          />
        )}
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
    paddingBottom: 30,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  avatarSection: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'visible',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  editAvatarButtonContainer: {
    position: 'absolute',
    right: -5,
    bottom: -5,
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  editAvatarButton: {
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: '#FF9500',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 10,
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
  dropdownIcon: {
    marginLeft: 'auto',
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: '#333',
  },
  dateText: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: '#333',
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
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10,
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
    backgroundColor: '#3C7A89',
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
  datePickerSimple: {
    width: '100%',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 5,
  },
  dateButton: {
    backgroundColor: '#3C7A89',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  dateButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  dateValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    width: 100,
    textAlign: 'center',
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
    backgroundColor: '#FF9500',
  },
  buttonClose: {
    backgroundColor: '#FF9500',
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
    backgroundColor: '#3C7A89',
    borderWidth: 3,
    borderColor: '#255661',
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
    backgroundColor: '#3C7A89',
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
}); 