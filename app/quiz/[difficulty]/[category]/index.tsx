import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Header } from '@/components/layout/Header';
import { Ionicons } from '@expo/vector-icons';
import BottomTabBar from '@/components/navigation/BottomTabBar';
import { collection, getDocs } from 'firebase/firestore';
import { firebaseDB } from '@/backend/config/firebase.config';
import { ProgressService } from '@/app/services/progress.service';
import { useAuth } from '@/context/AuthContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.9;

// Interface pour les questions de quiz
interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  points: number;
}

// Interface pour les données du quiz
interface QuizData {
  quizId: string;
  title: string;
  description: string;
  totalQuestions: number;
  timeLimit: number;
  pointsToEarn: number;
  heartsToEarn: number;
  questions: Question[];
  completed?: boolean;
  locked?: boolean;
}

// Fonction pour obtenir le nom complet de la catégorie à partir de l'ID
const getCategoryName = (categoryId: string) => {
  // Vérifier si la catégorie contient déjà le préfixe
  const fullCategoryId = categoryId.startsWith('maladies_') ? categoryId : `maladies_${categoryId}`;
  
  const categories = {
    'maladies_cardiovasculaires': 'Maladies Cardiovasculaires',
    'maladies_respiratoires': 'Maladies Respiratoires',
    'maladies_digestives': 'Maladies Digestives',
    'maladies_endocriniennes': 'Maladies Endocriniennes',
    'maladies_autoimmunes': 'Maladies Auto-immunes',
    'maladies_infectieuses': 'Maladies Infectieuses',
    'maladies_musculosquelettiques': 'Maladies Musculo-squelettiques',
    'maladies_neurologiques': 'Maladies Neurologiques',
    'maladies_dermatologiques': 'Maladies Dermatologiques',
    'maladies_hematologiques': 'Maladies Hématologiques',
  };
  
  return categories[fullCategoryId as keyof typeof categories] || categoryId;
};

// Fonction pour obtenir l'emoji de la catégorie
const getCategoryEmoji = (categoryId: string) => {
  // Vérifier si la catégorie contient déjà le préfixe
  const fullCategoryId = categoryId.startsWith('maladies_') ? categoryId : `maladies_${categoryId}`;
  
  const emojis = {
    'maladies_cardiovasculaires': '❤️',
    'maladies_respiratoires': '🌬️',
    'maladies_digestives': '🍽️',
    'maladies_endocriniennes': '🛑',
    'maladies_autoimmunes': '🛡️',
    'maladies_infectieuses': '🦠',
    'maladies_musculosquelettiques': '🦴',
    'maladies_neurologiques': '🧠',
    'maladies_dermatologiques': '🧴',
    'maladies_hematologiques': '🩸',
  };
  
  return emojis[fullCategoryId as keyof typeof emojis] || '📋';
};

// Fonction pour obtenir la couleur selon la difficulté
const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'facile': return '#4CAF50'; // Vert pour le niveau facile
    case 'moyen': return '#FFB300'; // Jaune/orange pour le niveau moyen
    case 'difficile': return '#29B6F6'; // Bleu pour le niveau difficile
    default: return '#808080';
  }
};

// Fonction pour récupérer les quiz par catégorie depuis Firebase
const getQuizzesFromFirebase = async (difficultyParam: string, categoryParam: string): Promise<QuizData[]> => {
  try {
    // Vérifier si la catégorie contient déjà le préfixe
    const fullCategoryId = categoryParam.startsWith('maladies_') ? categoryParam : `maladies_${categoryParam}`;
    
    // Collection de quiz pour cette difficulté et catégorie
    const quizzesRef = collection(
      firebaseDB, 
      'quizzes', difficultyParam, fullCategoryId
    );
    
    // Récupérer tous les documents
    const quizzesSnapshot = await getDocs(quizzesRef);
    
    if (quizzesSnapshot.empty) {
      console.log(`Aucun quiz trouvé pour ${difficultyParam}/${fullCategoryId}`);
      return [];
    }
    
    // Transformer les documents en objets QuizData
    const quizzes: QuizData[] = [];
    
    quizzesSnapshot.forEach(doc => {
      const data = doc.data();
      quizzes.push({
        quizId: doc.id,
        title: data.title || `Quiz ${doc.id}`,
        description: data.description || '',
        totalQuestions: data.questions?.length || 0,
        timeLimit: data.timeLimit || 30,
        pointsToEarn: data.pointsToEarn || 50,
        heartsToEarn: data.heartsToEarn || 1,
        questions: data.questions || [],
        completed: false,
        locked: true // Par défaut, tous les quiz sont verrouillés
      });
    });
    
    console.log(`${quizzes.length} quiz trouvés pour ${difficultyParam}/${fullCategoryId}`);
    
    // Trier par ID de quiz (généralement, ils contiennent des numéros)
    return quizzes.sort((a, b) => {
      // Extraire les numéros des ID de quiz, si présents
      const numA = extractQuizNumber(a.quizId);
      const numB = extractQuizNumber(b.quizId);
      return numA - numB;
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des quiz:", error);
    return [];
  }
};

// Fonction auxiliaire pour extraire le numéro d'un ID de quiz
const extractQuizNumber = (quizId: string): number => {
  const matches = quizId.match(/_(\d+)$/);
  if (matches && matches.length > 1) {
    return parseInt(matches[1], 10);
  }
  return 0;
};

export default function QuizCategoryScreen() {
  const { difficulty, category } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<QuizData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userStats, setUserStats] = useState({ xp: 0, hearts: 0 });
  
  const loadQuizzes = useCallback(async () => {
    try {
      setLoading(true);
      console.log(`Chargement des quiz pour ${difficulty}/${category}`);
      
      // Récupérer les quiz depuis Firebase
      const loadedQuizzes = await getQuizzesFromFirebase(
        difficulty as string, 
        category as string
      );
      
      // Si aucun quiz n'est trouvé, on arrête là
      if (loadedQuizzes.length === 0) {
        setQuizzes([]);
        setLoading(false);
        return;
      }
      
      // Trier les quiz par ID pour garantir l'ordre correct
      const sortedQuizzes = loadedQuizzes.sort((a, b) => {
        const numA = extractQuizNumber(a.quizId);
        const numB = extractQuizNumber(b.quizId);
        return numA - numB;
      });
      
      // Par défaut, seul le premier quiz est déverrouillé
      sortedQuizzes[0].locked = false;
      
      if (!user) {
        // Si l'utilisateur n'est pas connecté, on garde juste le premier quiz déverrouillé
        setQuizzes(sortedQuizzes);
        setLoading(false);
        return;
      }
      
      // Récupérer la progression de l'utilisateur
      const progressService = new ProgressService();
      const userProgress = await progressService.getUserProgress(true);
      
      if (userProgress) {
        // Mettre à jour les statistiques
        setUserStats({
          xp: userProgress.totalXP,
          hearts: userProgress.heartsCount
        });
        
        // Normaliser l'ID de catégorie pour la recherche
        const fullCategoryId = (category as string).startsWith('maladies_') 
          ? category as string 
          : `maladies_${category as string}`;
        
        // Trouver la difficulté correspondante
        const difficultyProgress = userProgress.difficulties.find(
          d => d.difficulty === difficulty
        );
        
        if (difficultyProgress) {
          // Trouver la catégorie correspondante
          const categoryProgress = difficultyProgress.categories.find(
            c => c.categoryId === category || c.categoryId === fullCategoryId
          );
          
          if (categoryProgress) {
            // Parcourir tous les quiz, y compris le premier
            for (let i = 0; i < sortedQuizzes.length; i++) {
              const quiz = sortedQuizzes[i];
              
              // Vérifier si le quiz est complété
              const quizProgress = categoryProgress.quizzes.find(
                q => q.quizId === quiz.quizId
              );
              
              if (quizProgress) {
                // Appliquer l'état "completed" à tous les quiz, y compris le premier
                quiz.completed = quizProgress.completed;
                
                // Afficher dans la console pour déboguer
                if (i === 0 && quiz.completed) {
                  console.log(`Quiz 1 (${quiz.quizId}) est marqué comme complété avec score ${quizProgress.score}`);
                }
              }
              
              // Pour tous les quiz, vérifier s'ils sont déverrouillés
              // Pour le premier quiz, il est toujours déverrouillé
              if (i === 0) {
                quiz.locked = false;
              } else {
                // Pour les autres quiz, vérifier s'ils sont déverrouillés
                const isUnlocked = await progressService.isQuizUnlocked(
                  difficulty as string,
                  category as string,
                  quiz.quizId
                );

                quiz.locked = !isUnlocked;

                // Vérifier aussi la propriété unlocked directe
                const quizProgress = categoryProgress.quizzes.find(q => q.quizId === quiz.quizId);
                if (quizProgress && quizProgress.unlocked === true) {
                  quiz.locked = false;
                  console.log(`Quiz ${quiz.quizId} déverrouillé via propriété unlocked=true`);
                }

                // Afficher dans la console pour déboguer
                console.log(`Quiz ${quiz.quizId} est ${quiz.locked ? 'verrouillé' : 'déverrouillé'} - isUnlocked=${isUnlocked}, unlocked=${quizProgress?.unlocked}, quiz précédent ${i > 0 ? sortedQuizzes[i-1].quizId : 'N/A'} a score=${i > 0 && categoryProgress.quizzes.find(q => q.quizId === sortedQuizzes[i-1].quizId)?.score || 0} et completed=${i > 0 && categoryProgress.quizzes.find(q => q.quizId === sortedQuizzes[i-1].quizId)?.completed || false}`);
              }
            }
          }
        }
      }

      // Déboguer l'état des quiz
      await progressService.debugCategoryQuizzes(difficulty as string, category as string);

      setQuizzes(sortedQuizzes);
      console.log(`${sortedQuizzes.length} quiz chargés pour ${difficulty}/${category}`);
    } catch (error) {
      console.error('Erreur lors du chargement des quiz:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [difficulty, category, user]);
  
  // Au chargement initial
  useEffect(() => {
    loadQuizzes();
  }, [loadQuizzes]);
  
  // À chaque fois que l'écran est affiché (pour voir les mises à jour après avoir terminé un quiz)
  useFocusEffect(
    useCallback(() => {
      console.log('Écran de catégorie focus - rechargement des quiz');
      // Vider le cache de progression et recharger les quiz pour s'assurer d'avoir les données à jour
      const progressService = new ProgressService();
      progressService.clearProgressCache();

      // Refresh optimisé des données Firebase
      const refreshData = async () => {
        console.log('Rechargement optimisé des données Firebase');
        // Utiliser le cache d'abord, puis forcer le refresh seulement si nécessaire
        await progressService.getUserProgress(false);
        loadQuizzes();
      };

      refreshData();

      return () => {
        // Nettoyer lors du unfocus si nécessaire
        console.log('Écran de catégorie unfocus');
      };
    }, [loadQuizzes])
  );
  
  // Gérer le pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Vider le cache de progression pour être sûr d'avoir les dernières données
    const progressService = new ProgressService();
    progressService.clearProgressCache();
    loadQuizzes();
  }, [loadQuizzes]);
  
  const handleBackPress = () => {
    // Au lieu d'utiliser router.back() qui revient en arrière dans l'historique,
    // utiliser router.replace() pour naviguer directement vers la liste des catégories
    // sans ajouter d'entrée à l'historique
    router.replace(`/quiz/${difficulty}`);
  };

  const handleQuizSelect = (quiz: QuizData) => {
    // Vérifier si le quiz est verrouillé
    if (quiz.locked) {
      // Afficher une alerte ou un message
      return;
    }
    
    try {
      // S'assurer que les questions existent et sont valides
      if (!quiz.questions || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
        console.error("Ce quiz ne contient pas de questions valides");
        return;
      }
      
      // Filtrer pour ne garder que les questions valides avec des options
      const validQuestions = quiz.questions.filter(q => 
        q && 
        typeof q === 'object' && 
        q.options && 
        Array.isArray(q.options) && 
        q.options.length > 0 &&
        q.question && 
        typeof q.question === 'string'
      );
      
      if (validQuestions.length === 0) {
        console.error(`Le quiz "${quiz.title}" ne contient aucune question valide avec des options`);
        return;
      }
      
      console.log(`Quiz "${quiz.title}" a ${validQuestions.length} questions valides sur ${quiz.questions.length} au total`);
      
      // Trouver la première question valide
      const firstQuestion = validQuestions[0];
      const firstQuestionId = firstQuestion.id || 'q1';
      
      // Rediriger vers l'écran de question avec tous les paramètres nécessaires
      router.push(`/quiz/${difficulty}/${category}/question?quizId=${quiz.quizId}&questionId=${firstQuestionId}`);
    } catch (error) {
      console.error(`Erreur lors de la sélection du quiz "${quiz.title}":`, error);
    }
  };

  const color = getDifficultyColor(difficulty as string);
  const categoryName = getCategoryName(category as string);
  const emoji = getCategoryEmoji(category as string);

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          headerShown: false,
        }}
      />
      
      {/* Header fixe en haut */}
      <Header xp={userStats.xp} hearts={userStats.hearts} />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[color]}
            tintColor={color}
          />
        }
      >
        <View style={styles.content}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBackPress}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
            <Text style={styles.backText}>Retour</Text>
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryEmoji}>{emoji}</Text>
              <Text style={styles.title}>{categoryName}</Text>
              {quizzes.length > 0 && quizzes.every(quiz => quiz.completed) && (
                <Text style={styles.trophyBadge}>🏆</Text>
              )}
            </View>
            <Text style={styles.subtitle}>Niveau {difficulty}</Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={color} />
              <Text style={styles.loadingText}>Chargement des quiz...</Text>
            </View>
          ) : quizzes.length === 0 ? (
            <View style={styles.messageContainer}>
              <Text style={styles.message}>Les quiz pour cette catégorie seront bientôt disponibles.</Text>
              <Text style={styles.description}>Revenez plus tard pour accéder aux questions sur les {categoryName}.</Text>
            </View>
          ) : (
            <View style={styles.quizzesContainer}>
              {quizzes.map((quiz) => (
                <TouchableOpacity 
                  key={quiz.quizId} 
                  style={[
                    styles.quizCard, 
                    { backgroundColor: color },
                    quiz.locked && styles.quizCardLocked,
                    quiz.completed && styles.quizCardCompleted
                  ]}
                  onPress={() => handleQuizSelect(quiz)}
                  disabled={quiz.locked}
                >
                  {/* Badge de complétion visible en haut à droite */}
                  {!quiz.locked && quiz.completed && (
                    <View style={styles.completionBadgeCorner}>
                      <Ionicons name="checkmark-circle" size={28} color="#4CAF50" />
                    </View>
                  )}
                  
                  <View style={styles.quizContentContainer}>
                    <View style={styles.quizHeader}>
                      <Text style={styles.quizTitle}>{quiz.title}</Text>
                      
                      {/* Indicateur d'état du quiz */}
                      <View style={styles.statusBadge}>
                        {quiz.locked && (
                          <Text style={styles.statusText}>🔒</Text>
                        )}
                        {!quiz.locked && quiz.completed && (
                          <View style={styles.completedBadge}>
                            <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                            <Text style={styles.completedText}>Terminé</Text>
                          </View>
                        )}
                        {!quiz.locked && !quiz.completed && (
                          <Text style={styles.statusText}>📖</Text>
                        )}
                      </View>
                    </View>
                    
                    <View style={styles.quizInfo}>
                      <View style={styles.quizDetail}>
                        <Ionicons name="help-circle-outline" size={16} color="#fff" />
                        <Text style={styles.quizDetailText}>{quiz.totalQuestions} questions</Text>
                      </View>
                      <View style={styles.quizDetail}>
                        <Ionicons name="time-outline" size={16} color="#fff" />
                        <Text style={styles.quizDetailText}>{quiz.timeLimit} sec/question</Text>
                      </View>
                    </View>
                    
                    <View style={styles.quizRewards}>
                      <View style={styles.rewardItem}>
                        <Ionicons name="star" size={16} color="#FFD600" />
                        <Text style={styles.rewardText}>+{quiz.pointsToEarn}</Text>
                      </View>
                      <View style={styles.rewardItem}>
                        <Ionicons name="heart" size={16} color="#FF4081" />
                        <Text style={styles.rewardText}>+{quiz.heartsToEarn}</Text>
                      </View>
                    </View>
                  </View>
                  
                  {quiz.locked && (
                    <View style={styles.lockOverlay}>
                      <Text style={styles.lockIcon}>🔒</Text>
                      <Text style={styles.lockText}>Terminez le quiz précédent avec un score d'au moins 60%</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      <BottomTabBar />
    </View>
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  titleContainer: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textTransform: 'capitalize',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    borderRadius: 16,
    backgroundColor: '#FFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  messageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    borderRadius: 16,
    backgroundColor: '#FFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  message: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  quizzesContainer: {
    alignItems: 'center',
    gap: 16,
  },
  quizCard: {
    width: CARD_WIDTH,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    position: 'relative', // Pour positionner le badge de complétion
  },
  quizCardLocked: {
    opacity: 0.7,
  },
  quizCardCompleted: {
    borderWidth: 3,
    borderColor: '#4CAF50', // Bordure verte plus épaisse pour indiquer que le quiz est complété
  },
  completionBadgeCorner: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'white',
    borderBottomLeftRadius: 16,
    padding: 5,
    zIndex: 10,
  },
  quizContentContainer: {
    padding: 16,
  },
  quizHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingRight: 4,
  },
  quizTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  statusBadge: {
    marginLeft: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  statusText: {
    fontSize: 20,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 4,
  },
  completedText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 14,
  },
  quizInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  quizDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quizDetailText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  quizRewards: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rewardText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  lockIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  lockText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  trophyBadge: {
    fontSize: 24,
    marginLeft: 12,
    color: '#FFD700',
  },
}); 