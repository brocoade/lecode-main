import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Switch, Alert, SafeAreaView, Modal, Pressable } from 'react-native';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/Colors';
import { useRouter, Stack } from 'expo-router';
import { MaterialIcons, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import BottomTabBar from '@/components/navigation/BottomTabBar';
import SharedTransition from '@/components/navigation/SharedTransition';
import { ProgressService } from '@/app/services/progress.service';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme as useAppColorScheme } from '@/hooks/useColorScheme';
import { useThemeMode } from '@/context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAutoTranslate } from '../../utils/useAutoTranslate';

export default function SettingsScreen() {
  const colorScheme = useAppColorScheme();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { mode, setMode, theme } = useThemeMode();
  const [notifications, setNotifications] = useState(true);
  const [sounds, setSounds] = useState(true);
  const [vibrations, setVibrations] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const { language, setLanguage } = useLanguage();
  const { autoTranslate } = useAutoTranslate();

  const toggleNotifications = () => setNotifications(previous => !previous);
  const toggleSounds = () => setSounds(previous => !previous);
  const toggleVibrations = () => setVibrations(previous => !previous);

  const handleResetProgress = async () => {
    Alert.alert(
      "Réinitialiser la progression",
      "Êtes-vous sûr de vouloir réinitialiser toute votre progression ? Cette action est irréversible.",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Réinitialiser", 
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              const progressService = new ProgressService();
              const result = await progressService.resetUserProgress();
              
              if (result) {
                Alert.alert(
                  "Progression réinitialisée",
                  "Votre progression a été réinitialisée avec succès. Veuillez redémarrer l'application.",
                  [{ text: "OK" }]
                );
              } else {
                Alert.alert(
                  "Erreur",
                  "Une erreur est survenue lors de la réinitialisation de votre progression.",
                  [{ text: "OK" }]
                );
              }
            } catch (error) {
              console.error("Erreur lors de la réinitialisation:", error);
              Alert.alert(
                "Erreur",
                "Une erreur inattendue est survenue.",
                [{ text: "OK" }]
              );
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      "Déconnexion",
      "Êtes-vous sûr de vouloir vous déconnecter?",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Déconnexion", 
          onPress: async () => {
            try {
              await logout();
              router.replace('/');
            } catch (error) {
              console.error("Erreur lors de la déconnexion:", error);
            }
          }
        }
      ]
    );
  };

  const themeOptions = [
    { label: 'Système', value: 'system' },
    { label: 'Clair', value: 'light' },
    { label: 'Sombre', value: 'dark' },
  ];

  const languageOptions = [
    { label: 'Français', value: 'fr' },
    { label: 'English', value: 'en' },
  ];

  const handleThemePress = () => setShowThemeModal(true);
  const handleThemeSelect = (value: string) => {
    setMode(value as any);
    setShowThemeModal(false);
  };

  return (
    <SharedTransition transitionKey="settings-screen">
      <SafeAreaView style={[styles.container, { backgroundColor: Colors[theme].background }]}>
        <Stack.Screen options={{ 
          title: language === 'fr' ? "Paramètres" : "Settings",
          headerStyle: { backgroundColor: '#232D3F' },
          headerTintColor: '#FFF',
        }} />
        
        <ScrollView 
          style={[styles.scrollView, { backgroundColor: Colors[theme].background }]}
          contentContainerStyle={styles.scrollViewContent}
        >
          <LinearGradient
            colors={theme === 'dark' ? ['#232D3F', '#111'] : ['#4CAF50', '#388E3C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <View style={styles.header}>
              <View style={styles.headerIconContainer}>
                <MaterialIcons name="settings" size={32} color={Colors[theme].icon} />
              </View>
              <Text style={[styles.headerTitle, { color: Colors[theme].text }]}>{language === 'fr' ? 'Paramètres' : 'Settings'}</Text>
              <Text style={[styles.headerSubtitle, { color: Colors[theme].textSecondary }]}>{language === 'fr' ? 'Personnalisez votre expérience' : 'Customize your experience'}</Text>
            </View>
          </LinearGradient>
          
          <View style={[styles.content, { backgroundColor: Colors[theme].background }]}>
            <View style={[styles.settingSection, { backgroundColor: Colors[theme].card, borderColor: Colors[theme].border }]}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="account-circle" size={22} color={Colors[theme].icon} />
                <Text style={[styles.sectionTitle, { color: Colors[theme].text }]}>{language === 'fr' ? 'Compte' : 'Account'}</Text>
              </View>
              
              <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/profile/edit')}>
                <View style={styles.settingLeft}>
                  <MaterialIcons name="person" size={20} color={Colors[theme].textSecondary} />
                  <Text style={[styles.settingLabel, { color: Colors[theme].text }]}>{language === 'fr' ? 'Modifier profil' : 'Edit profile'}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={22} color={Colors[theme].textSecondary} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.settingItem}
                onPress={() => router.push('/settings/change-password')}
              >
                <View style={styles.settingLeft}>
                  <MaterialIcons name="vpn-key" size={20} color={Colors[theme].textSecondary} />
                  <Text style={[styles.settingLabel, { color: Colors[theme].text }]}>{language === 'fr' ? 'Changer mot de passe' : 'Change password'}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={22} color={Colors[theme].textSecondary} />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <MaterialIcons name="notifications" size={20} color={Colors[theme].textSecondary} />
                  <Text style={[styles.settingLabel, { color: Colors[theme].text }]}>{language === 'fr' ? 'Notifications' : 'Notifications'}</Text>
                </View>
                <Switch
                  value={notifications}
                  onValueChange={toggleNotifications}
                  trackColor={{ false: '#e0e0e0', true: '#4C66EF50' }}
                  thumbColor={notifications ? '#4C66EF' : '#f4f3f4'}
                />
              </TouchableOpacity>
            </View>
            
            <View style={[styles.settingSection, { backgroundColor: Colors[theme].card, borderColor: Colors[theme].border }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="settings-sharp" size={22} color={Colors[theme].icon} />
                <Text style={[styles.sectionTitle, { color: Colors[theme].text }]}>{language === 'fr' ? 'Application' : 'Application'}</Text>
              </View>
              
              <TouchableOpacity style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <MaterialIcons name="brightness-4" size={20} color={Colors[theme].textSecondary} />
                  <Text style={[styles.settingLabel, { color: Colors[theme].text }]}>{language === 'fr' ? 'Thème' : 'Theme'}</Text>
                </View>
                <TouchableOpacity onPress={handleThemePress} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ color: Colors[theme].text, marginRight: 5, fontWeight: 'bold' }}>
                    {themeOptions.find(opt => opt.value === mode)?.label}
                  </Text>
                  <MaterialIcons name="chevron-right" size={22} color={Colors[theme].textSecondary} />
                </TouchableOpacity>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <MaterialIcons name="language" size={20} color={Colors[theme].textSecondary} />
                  <Text style={[styles.settingLabel, { color: Colors[theme].text }]}>{language === 'fr' ? 'Langue' : 'Language'}</Text>
                </View>
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>{languageOptions.find(opt => opt.value === language)?.label}</Text>
                </View>
              </TouchableOpacity>
              {/* Sélecteur de langue */}
              <View style={{ flexDirection: 'row', marginTop: 10, marginLeft: 40 }}>
                {languageOptions.map(opt => (
                  <TouchableOpacity
                    key={opt.value}
                    style={{
                      backgroundColor: language === opt.value ? '#4C66EF' : '#e0e0e0',
                      padding: 8,
                      borderRadius: 8,
                      marginRight: 10,
                    }}
                    onPress={() => setLanguage(opt.value)}
                  >
                    <Text style={{ color: language === opt.value ? '#fff' : '#333' }}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <TouchableOpacity style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <MaterialIcons name="volume-up" size={20} color={Colors[theme].textSecondary} />
                  <Text style={[styles.settingLabel, { color: Colors[theme].text }]}>{language === 'fr' ? 'Sons' : 'Sounds'}</Text>
                </View>
                <Switch
                  value={sounds}
                  onValueChange={toggleSounds}
                  trackColor={{ false: '#e0e0e0', true: '#4C66EF50' }}
                  thumbColor={sounds ? '#4C66EF' : '#f4f3f4'}
                />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <MaterialCommunityIcons name="vibrate" size={20} color={Colors[theme].textSecondary} />
                  <Text style={[styles.settingLabel, { color: Colors[theme].text }]}>{language === 'fr' ? 'Vibrations' : 'Vibrations'}</Text>
                </View>
                <Switch
                  value={vibrations}
                  onValueChange={toggleVibrations}
                  trackColor={{ false: '#e0e0e0', true: '#4C66EF50' }}
                  thumbColor={vibrations ? '#4C66EF' : '#f4f3f4'}
                />
              </TouchableOpacity>
            </View>
            
            <View style={[styles.settingSection, { backgroundColor: Colors[theme].card, borderColor: Colors[theme].border }]}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="info" size={22} color={Colors[theme].icon} />
                <Text style={[styles.sectionTitle, { color: Colors[theme].text }]}>{language === 'fr' ? 'À propos' : 'About'}</Text>
              </View>
              
              <TouchableOpacity style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <MaterialIcons name="description" size={20} color={Colors[theme].textSecondary} />
                  <Text style={[styles.settingLabel, { color: Colors[theme].text }]}>{language === 'fr' ? "Conditions d'utilisation" : 'Terms of use'}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={22} color={Colors[theme].textSecondary} />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <MaterialIcons name="privacy-tip" size={20} color={Colors[theme].textSecondary} />
                  <Text style={[styles.settingLabel, { color: Colors[theme].text }]}>{language === 'fr' ? 'Politique de confidentialité' : 'Privacy policy'}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={22} color={Colors[theme].textSecondary} />
              </TouchableOpacity>
              
              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <MaterialIcons name="new-releases" size={20} color={Colors[theme].textSecondary} />
                  <Text style={[styles.settingLabel, { color: Colors[theme].text }]}>{language === 'fr' ? 'Version' : 'Version'}</Text>
                </View>
                <Text style={styles.versionText}>1.0.0</Text>
              </View>
            </View>
          </View>
        </ScrollView>
        
        <BottomTabBar />
      </SafeAreaView>

      {/* Modal de sélection du thème */}
      <Modal
        visible={showThemeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowThemeModal(false)}
      >
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }} onPress={() => setShowThemeModal(false)} />
        <View style={{
          position: 'absolute',
          top: '35%',
          left: '10%',
          right: '10%',
          backgroundColor: Colors[theme].background,
          borderRadius: 18,
          padding: 24,
          alignItems: 'center',
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowRadius: 10,
          elevation: 10,
        }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 18, color: Colors[theme].text }}>{language === 'fr' ? 'Choisir le thème' : 'Choose theme'}</Text>
          {themeOptions.map(opt => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => handleThemeSelect(opt.value)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 10,
                width: 180,
                borderRadius: 8,
                backgroundColor: mode === opt.value ? '#4C66EF' : 'transparent',
                marginBottom: 4,
                paddingHorizontal: 10,
              }}
            >
              <MaterialIcons
                name={mode === opt.value ? 'radio-button-checked' : 'radio-button-unchecked'}
                size={22}
                color={mode === opt.value ? '#4C66EF' : '#888'}
                style={{ marginRight: 10 }}
              />
              <Text style={{ color: Colors[theme].text, fontSize: 16, fontWeight: mode === opt.value ? 'bold' : 'normal' }}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity onPress={() => setShowThemeModal(false)} style={{ marginTop: 16 }}>
            <Text style={{ color: '#4C66EF', fontWeight: 'bold', fontSize: 16 }}>{language === 'fr' ? 'Annuler' : 'Cancel'}</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SharedTransition>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 80,
  },
  headerGradient: {
    height: 220,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  headerIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  content: {
    padding: 20,
    paddingBottom: 120,
  },
  settingSection: {
    marginBottom: 25,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#333',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    color: '#555',
    marginLeft: 15,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 14,
    color: '#777',
    marginRight: 5,
  },
  versionText: {
    fontSize: 14,
    color: '#999',
  },
  navigationBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIcon: {
    width: 22,
    height: 22,
    marginBottom: 4,
    resizeMode: 'contain',
  },
  navText: {
    fontSize: 12,
    color: '#666',
  },
  activeNavItem: {
    // Styles pour l'élément actif de la navigation
  },
  activeNavText: {
    color: '#4C66EF',
    fontWeight: 'bold',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  dangerButton: {
    backgroundColor: '#D32F2F',
  },
  logoutButton: {
    backgroundColor: '#455A64',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#D32F2F',
    fontStyle: 'italic',
    marginTop: 8,
  },
}); 