import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Header } from '@/components/layout/Header';
import { Ionicons } from '@expo/vector-icons';
import BottomTabBar from '@/components/navigation/BottomTabBar';
import SharedTransition from '@/components/navigation/SharedTransition';
import { ProgressService } from '@/app/services/progress.service';
import { useAuth } from '@/context/AuthContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.9;

interface Category {
  id: string;
  emoji: string;
  name: string;
  completed: boolean;
  unlocked: boolean;
  allQuizzesCompleted: boolean;
  index: number;
}

// Les catégories de base (statiques)
const defaultCategories: Category[] = [
  { id: 'cardiovasculaires', emoji: '❤️', name: 'Maladies Cardiovasculaires', completed: false, unlocked: true, allQuizzesCompleted: false, index: 0 },
  { id: 'respiratoires', emoji: '🌬️', name: 'Maladies Respiratoires', completed: false, unlocked: false, allQuizzesCompleted: false, index: 1 },
  { id: 'digestives', emoji: '🍽️', name: 'Maladies Digestives', completed: false, unlocked: false, allQuizzesCompleted: false, index: 2 },
  { id: 'endocriniennes', emoji: '🛑', name: 'Maladies Endocriniennes', completed: false, unlocked: false, allQuizzesCompleted: false, index: 3 },
  { id: 'autoimmunes', emoji: '🛡️', name: 'Maladies Auto-immunes', completed: false, unlocked: false, allQuizzesCompleted: false, index: 4 },
  { id: 'infectieuses', emoji: '🦠', name: 'Maladies Infectieuses', completed: false, unlocked: false, allQuizzesCompleted: false, index: 5 },
  { id: 'musculosquelettiques', emoji: '🦴', name: 'Maladies Musculo-squelettiques', completed: false, unlocked: false, allQuizzesCompleted: false, index: 6 },
  { id: 'neurologiques', emoji: '🧠', name: 'Maladies Neurologiques', completed: false, unlocked: false, allQuizzesCompleted: false, index: 7 },
  { id: 'dermatologiques', emoji: '🧴', name: 'Maladies Dermatologiques', completed: false, unlocked: false, allQuizzesCompleted: false, index: 8 },
  { id: 'hematologiques', emoji: '🩸', name: 'Maladies Hématologiques', completed: false, unlocked: false, allQuizzesCompleted: false, index: 9 },
];

interface CategoryCardProps {
  emoji: string;
  name: string;
  onPress: () => void;
  difficulty: string;
  completed: boolean;
  unlocked: boolean;
  allQuizzesCompleted: boolean;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ 
  emoji, 
  name, 
  onPress, 
  difficulty, 
  completed,
  unlocked,
  allQuizzesCompleted
}) => {
  const getBackgroundColor = () => {
    switch (difficulty) {
      case 'facile': return '#4CAF50';
      case 'moyen': return '#FFB300';
      case 'difficile': return '#29B6F6';
      default: return '#808080';
    }
  };

  const getStatusIcon = () => {
    console.log(`Rendu de l'icône pour ${name}: unlocked=${unlocked}, allQuizzesCompleted=${allQuizzesCompleted}`);
    if (!unlocked) return '🔒';
    if (allQuizzesCompleted) return '🏆';
    return '📖';
  };

  return (
    <TouchableOpacity 
      onPress={onPress}
      style={[
        styles.cardContainer, 
        { backgroundColor: getBackgroundColor() },
        !unlocked && styles.cardContainerLocked
      ]}
      activeOpacity={0.9}
      disabled={!unlocked}
    >
      <View style={styles.cardContent}>
        <Text style={styles.categoryEmoji}>{emoji}</Text>
        <View style={styles.textContainer}>
          <Text style={styles.categoryName}>{name}</Text>
          <Text style={styles.statusIcon}>{getStatusIcon()}</Text>
        </View>
      </View>
      
      {!unlocked && (
        <View style={styles.lockOverlay}>
          <Text style={styles.lockText}>Terminez la catégorie précédente</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function CategoryScreen() {
  const { difficulty } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [userStats, setUserStats] = useState({ xp: 0, hearts: 0 });

  // Charger la progression des catégories
  useEffect(() => {
    const loadCategoryProgress = async () => {
      try {
        setLoading(true);
        // Vérifier si l'utilisateur est connecté
        if (!user) {
          setLoading(false);
          return;
        }

        const progressService = new ProgressService();
        // Vider le cache pour s'assurer d'obtenir les données les plus récentes
        progressService.clearProgressCache();
        const userProgress = await progressService.getUserProgress(true); // forceRefresh=true pour ignorer le cache
        
        if (userProgress) {
          // Trouver le niveau de difficulté correspondant
          const difficultyProgress = userProgress.difficulties.find(
            d => d.difficulty === difficulty
          );
          
          if (difficultyProgress) {
            // Mettre à jour les catégories avec l'état de complétion
            const updatedCategories = await Promise.all(defaultCategories.map(async (category) => {
              // Trouver la progression de cette catégorie
              const categoryProgress = difficultyProgress.categories.find(
                c => c.categoryId === category.id
              );
              
              // Vérifier si la catégorie est débloquée
              const isUnlocked = await progressService.isCategoryUnlocked(
                difficulty as string, 
                category.id, 
                category.index
              );
              
              // Vérifier si au moins un quiz de la catégorie est complété
              const isStarted = await progressService.isCategoryStarted(
                difficulty as string,
                category.id
              );
              
              // Vérifier directement si tous les quiz de la catégorie sont complétés avec succès
              const allQuizzesCompleted = await progressService.isCategoryCompleted(
                difficulty as string,
                category.id
              );
              
              console.log(`Catégorie ${category.id}: débloquée=${isUnlocked}, commencée=${isStarted}, tous quiz terminés=${allQuizzesCompleted}`);
              
              return {
                ...category,
                // Une catégorie est "complétée" si au moins un quiz est terminé
                completed: isStarted,
                // Une catégorie est débloquée selon les règles définies
                unlocked: isUnlocked,
                // Marquer comme "tous les quiz complétés" via la vérification directe
                allQuizzesCompleted: allQuizzesCompleted
              };
            }));
            
            setCategories(updatedCategories);
          }
          
          // Mettre à jour les statistiques de l'utilisateur
          setUserStats({
            xp: userProgress.totalXP,
            hearts: userProgress.heartsCount
          });
        }
      } catch (error) {
        console.error('Erreur lors du chargement de la progression des catégories:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadCategoryProgress();
  }, [difficulty, user]);

  const handleCategoryPress = (categoryId: string, unlocked: boolean) => {
    if (unlocked) {
    router.push(`/quiz/${difficulty}/${categoryId}`);
    }
  };

  const getDifficultyTitle = () => {
    switch (difficulty) {
      case 'facile': return 'Niveau Facile';
      case 'moyen': return 'Niveau Moyen';
      case 'difficile': return 'Niveau Difficile';
      default: return 'Quiz';
    }
  };

  return (
    <SharedTransition transitionKey="category-screen">
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        
        {/* Header fixe en haut */}
        <Header xp={userStats.xp} hearts={userStats.hearts} />
        
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
        >
          <View style={styles.content}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{getDifficultyTitle()}</Text>
              <Text style={styles.subtitle}>Choisissez une catégorie</Text>
            </View>

            <View style={styles.infoPanel}>
              <Text style={styles.infoPanelTitle}>Information</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>🔒</Text>
                <Text style={styles.infoText}>Verrouillé: Terminez la catégorie précédente pour débloquer</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>📖</Text>
                <Text style={styles.infoText}>Débloqué: Prêt à commencer les quiz</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>🏆</Text>
                <Text style={styles.infoText}>Tous les quiz de la catégorie terminés</Text>
              </View>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.loadingText}>Chargement des catégories...</Text>
              </View>
            ) : (
            <View style={styles.categoriesContainer}>
              {categories.map((category) => (
                <CategoryCard 
                  key={category.id}
                  emoji={category.emoji}
                  name={category.name}
                  onPress={() => handleCategoryPress(category.id, category.unlocked)}
                  difficulty={difficulty as string}
                  completed={category.completed}
                  unlocked={category.unlocked}
                  allQuizzesCompleted={category.allQuizzesCompleted}
                />
              ))}
            </View>
            )}
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
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 80,
  },
  content: {
    padding: 20,
    paddingBottom: 30,
  },
  titleContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
  },
  categoriesContainer: {
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: 100,
    marginBottom: 8,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    position: 'relative',
  },
  cardContainerLocked: {
    opacity: 0.7,
  },
  cardContent: {
    flex: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  categoryEmoji: {
    fontSize: 32,
  },
  textContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  statusIcon: {
    fontSize: 22,
    marginLeft: 10,
    color: '#FFF',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  completedBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trophyBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trophyText: {
    fontSize: 16,
  },
  lockOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 4,
    alignItems: 'center',
  },
  lockText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    height: 200,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  infoPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  infoPanelTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 10,
    width: 24,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    flex: 1,
  },
}); 