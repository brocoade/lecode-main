import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ImageSourcePropType } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import BottomTabBar from '@/components/navigation/BottomTabBar';
import SharedTransition from '@/components/navigation/SharedTransition';
import { userStatsService } from '@/app/services/userStats';
import { useXP } from '@/context/XPContext';
import { useHearts } from '@/context/HeartsContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { firebaseDB } from '../../backend/config/firebase.config';
import { useLanguage } from '../../context/LanguageContext';
import Colors from '@/constants/Colors';
import { useThemeMode } from '@/context/ThemeContext';
import { SyncService } from '@/app/services/sync.service';



interface UserStats {
  name?: string;
  email?: string;
  lives: number;
  xpPoints: number;
  memberSince?: string;
  bloodType: string;
  birthDate: string;
  createdAt?: any;
  // Nouvelles stats depuis Firebase
  totalQuizzes?: number;
  currentStreak?: number;
  totalGoodAnswers?: number;
  totalQuestionsAttempted?: number;
  lastPlayed?: any;
}

interface StatCard {
  label: string;
  value: string;
  color: string;
  image?: ImageSourcePropType;
  icon?: 'calendar-month' | 'chart-bar' | 'pencil' | 'logout';
}

export default function ProfileScreen() {
  const { user, signOut, refreshUserFromFirestore } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<UserStats | null>(null);
  const { xp } = useXP();
  const { hearts, maxHearts } = useHearts();
  const { language } = useLanguage();
  const { theme } = useThemeMode();

  useEffect(() => {
    if (user?.uid) {
      // Écouter les changements dans la collection users
      const unsubscribe = onSnapshot(doc(firebaseDB, 'users', user.uid), (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data() as UserStats;
          console.log('Profile: Données users mises à jour:', userData);
          setStats(userData);

          // Si le nom a changé, rafraîchir le contexte Auth
          if (userData.name && userData.name !== user.name) {
            console.log('Profile: Nom mis à jour, rafraîchissement du contexte Auth');
            refreshUserFromFirestore();
          }
        }
      });

      // Démarrer la synchronisation seulement si pas déjà démarrée
      let syncStarted = false;
      const timer = setTimeout(() => {
        if (!syncStarted) {
          syncStarted = true;
          try {
            const syncService = SyncService.getInstance();

            // Forcer une synchronisation initiale une seule fois
            syncService.forceSyncAll(user.uid).catch(error => {
              console.error('Profile: Erreur sync forcée:', error);
            });
          } catch (error) {
            console.error('Profile: Erreur lors du démarrage de la sync:', error);
          }
        }
      }, 2000); // Réduire à 2 secondes

      return () => {
        unsubscribe();
        clearTimeout(timer);
        // Le nettoyage du SyncService sera fait par les contextes
      };
    }
  }, [user]);





  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };



  // Utiliser les données Firebase en priorité, puis les contextes en fallback
  const displayHearts = stats?.lives !== undefined ? stats.lives : hearts;
  const displayXP = stats?.xpPoints !== undefined ? stats.xpPoints : xp;
  const displayName = stats?.name || user?.name || (language === 'fr' ? 'Utilisateur' : 'User');
  const displayEmail = user?.email || 'utilisateur@email.com';

  console.log('Profile: Affichage des stats:', {
    statsFromFirebase: stats,
    userFromAuth: user,
    heartsFromContext: hearts,
    xpFromContext: xp,
    displayHearts,
    displayXP,
    displayName,
    displayEmail
  });

  const statsCards: StatCard[] = [
    {
      label: language === 'fr' ? 'Vies disponibles' : 'Lives available',
      value: `${displayHearts}/${maxHearts}`,
      image: require('@/assets/images/coeur.png'),
      color: displayHearts > 0 ? '#FF0000' : '#808080'
    },
    {
      label: language === 'fr' ? 'Points XP' : 'XP Points',
      value: displayXP.toString(),
      image: require('@/assets/images/etoile.png'),
      color: '#4CAF50'
    },
    {
      label: language === 'fr' ? 'Membre depuis' : 'Member since',
      value: stats?.createdAt
        ? (typeof stats.createdAt.toDate === 'function'
            ? formatDate(stats.createdAt.toDate())
            : formatDate(stats.createdAt))
        : '-',
      icon: 'calendar-month',
      color: '#007AFF'
    },
    {
      label: language === 'fr' ? 'Groupe sanguin' : 'Blood type',
      value: stats?.bloodType || '-',
      image: require('@/assets/images/blood.png'),
      color: '#FF3B30'
    },
    {
      label: language === 'fr' ? 'Quiz complétés' : 'Completed quizzes',
      value: (stats?.totalQuizzes || 0).toString(),
      icon: 'chart-bar',
      color: '#34C759'
    },
    {
      label: language === 'fr' ? 'Série actuelle' : 'Current streak',
      value: `${stats?.currentStreak || 0} jour${(stats?.currentStreak || 0) > 1 ? 's' : ''}`,
      icon: 'calendar-month',
      color: '#FF9500'
    },
  ];

  return (
    <SharedTransition transitionKey="profile-screen">
      <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
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
              <View style={styles.avatarContainer}>
                <View style={styles.avatarBackground}>
                  <Image
                    source={require('@/assets/images/avatar.png')}
                    style={styles.avatar}
                  />
                </View>
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={() => router.push('/profile/edit')}
                >
                  <MaterialCommunityIcons name="pencil" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
              <Text style={[styles.name]}>{displayName}</Text>
              <Text style={[styles.email]}>{displayEmail}</Text>
              {/* Bouton de debug temporaire */}
              <TouchableOpacity
                onPress={() => {
                  console.log('Rafraîchissement manuel des données utilisateur');
                  refreshUserFromFirestore();
                }}
                style={{ marginTop: 8, padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8 }}
              >
                <Text style={{ color: 'white', fontSize: 12, textAlign: 'center' }}>🔄 Rafraîchir profil</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <View style={[styles.contentContainer, { backgroundColor: Colors[theme].background }]}>
            <View style={styles.sectionTitle}>
              <Text style={[styles.sectionTitleText, { color: Colors[theme].text }]}>{language === 'fr' ? 'Vos statistiques' : 'Your stats'}</Text>
              <MaterialCommunityIcons name="chart-bar" size={20} color={Colors[theme].icon} />
            </View>
            
            <View style={styles.statsContainer}>
              {statsCards.map((stat, index) => (
                <View key={index} style={[styles.statCard, { backgroundColor: Colors[theme].card }]}>
                  <View style={[styles.statIconGradient, { backgroundColor: `${stat.color}20` }]}>
                    {stat.image ? (
                      <Image 
                        source={stat.image}
                        style={[
                          styles.statIcon,
                          { tintColor: stat.color }
                        ]}
                        resizeMode="contain"
                      />
                    ) : (
                      <MaterialCommunityIcons 
                        name={stat.icon} 
                        size={24} 
                        color={stat.color} 
                      />
                    )}
                  </View>
                  <View style={styles.statInfo}>
                    <Text style={[
                      styles.statValue,
                      { 
                        color: stat.color,
                        textShadowColor: stat.color + '80',
                        textShadowOffset: { width: 0, height: 0 },
                        textShadowRadius: 4
                      }
                    ]}>
                      {stat.value}
                    </Text>
                    <Text style={[styles.statLabel, { color: Colors[theme].textSecondary }]}>{stat.label}</Text>
                  </View>
                </View>
              ))}

              <View style={[styles.statsCard, { backgroundColor: Colors[theme].card }]}>
                <View style={[styles.statsIconContainer, { backgroundColor: '#FF950020' }]}>
                  <MaterialCommunityIcons name="calendar" size={24} color="#FF9500" />
                </View>
                <View style={styles.statsInfo}>
                  <Text style={[styles.statsValue, { color: Colors[theme].text }]}>
                    {stats?.birthDate ? formatDate(stats.birthDate) : (language === 'fr' ? 'Non spécifié' : 'Not specified')}
                  </Text>
                  <Text style={[styles.statsLabel, { color: Colors[theme].textSecondary }]}>{language === 'fr' ? 'Date de naissance' : 'Birth date'}</Text>
                </View>
              </View>
            </View>



            <TouchableOpacity style={[styles.signOutButton, { backgroundColor: Colors[theme].card }]} onPress={handleSignOut}>
              <MaterialCommunityIcons name="logout" size={24} color="#FF3B30" />
              <Text style={[styles.signOutText]}>{language === 'fr' ? 'Se déconnecter' : 'Sign out'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        
        <BottomTabBar />
      </View>
    </SharedTransition>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 80,
  },
  headerGradient: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    padding: 25,
    paddingBottom: 35,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatarBackground: {
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
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  editButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#007AFF',
    width: 35,
    height: 35,
    borderRadius: 17.5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  email: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 10,
  },
  contentContainer: {
    flex: 1,
    margin: 15,
    marginBottom: 90,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  sectionTitleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statIcon: {
    width: 24,
    height: 24,
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  signOutText: {
    fontSize: 16,
    color: '#FF3B30',
    marginLeft: 10,
    fontWeight: '600',
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
  statsCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statsIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statsInfo: {
    flex: 1,
  },
  statsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 12,
    color: '#999',
  },

});