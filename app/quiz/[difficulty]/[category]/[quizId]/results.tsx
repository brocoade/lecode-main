import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator, ScrollView, Platform, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ProgressService } from '@/app/services/progress.service';
import { useAuth } from '@/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useXP } from '@/context/XPContext';
import { HeartsService } from '@/app/services/hearts.service';
import { useHearts } from '@/context/HeartsContext';
import ConfettiCannon from 'react-native-confetti-cannon';
import { completeQuiz } from '@/app/services/quizStats.service';

const { width } = Dimensions.get('window');

interface QuizResultsProps {
  points: number;
  correctAnswers: number;
  totalQuestions: number;
  timeSpent: number;
  earnedXP: number;
  earnedHearts: number;
  isPassing: boolean;
}

export default function QuizResultsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { showXPAnimation, refreshXP } = useXP();
  const { hearts: currentHearts, maxHearts } = useHearts();
  const { 
    difficulty, 
    category, 
    quizId, 
    points: pointsParam, 
    correctAnswers: correctAnswersParam,
    totalQuestions: totalQuestionsParam,
    timeSpent: timeSpentParam
  } = useLocalSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [savedProgress, setSavedProgress] = useState(false);
  const [levelCompleted, setLevelCompleted] = useState(false);
  const [canAccessNextQuiz, setCanAccessNextQuiz] = useState(false);
  const [nextQuizId, setNextQuizId] = useState<string | null>(null);
  const [heartsChange, setHeartsChange] = useState<number>(0);
  const [heartRegenerationTime, setHeartRegenerationTime] = useState<string>('');
  const [noHeartsLeft, setNoHeartsLeft] = useState<boolean>(false);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Convertir les paramètres d'URL en valeurs utilisables
  const points = pointsParam ? parseInt(pointsParam as string, 10) : 0;
  const correctAnswers = correctAnswersParam ? parseInt(correctAnswersParam as string, 10) : 0;
  const totalQuestions = totalQuestionsParam ? parseInt(totalQuestionsParam as string, 10) : 5;
  const timeSpent = timeSpentParam ? parseInt(timeSpentParam as string, 10) : 180;
  
  // Calculer le pourcentage de bonnes réponses
  const percentageCorrect = Math.round((correctAnswers / totalQuestions) * 100);
  const isPassing = percentageCorrect >= 60;

  // Nouvelle logique de calcul des XP selon la difficulté
  const getXpPerQuestion = () => {
    switch(difficulty as string) {
      case 'facile':
        return 2; // 2 XP par question correcte en facile
      case 'moyen':
        return 5; // 5 XP par question correcte en moyen
      case 'difficile':
        return 8; // 8 XP par question correcte en difficile
      default:
        return 2; // Par défaut, utiliser le niveau facile
    }
  };

  // Calculer les XP gagnés
  const earnedXP = correctAnswers * getXpPerQuestion();
  const speedBonus = timeSpent < 120 ? Math.round(earnedXP * 0.1) : 0; // Maintenir le bonus de vitesse de 10%
  const totalXP = earnedXP + speedBonus;
  
  // Sauvegarder la progression une seule fois au chargement
  useEffect(() => {
    let isMounted = true;
    
    const saveQuizProgress = async () => {
      if (!user || savedProgress) return;
      
      // 🚀 AFFICHER IMMÉDIATEMENT LES CONFETTIS ET ANIMATIONS
      setShowConfetti(true);
      setLoading(false); // IMMÉDIAT !
      
      // 🚀 AFFICHER IMMÉDIATEMENT L'ANIMATION XP
      const immediateXP = earnedXP + speedBonus;
      showXPAnimation(immediateXP);
      
      try {
        const progressService = new ProgressService();
        const heartsService = new HeartsService();
        
        const categoryId = category as string;
        const normalizedCategoryId = categoryId.includes('maladies_') ? categoryId : `maladies_${categoryId}`;
        
        // 🚀 SAUVEGARDE EN ARRIÈRE-PLAN SANS BLOQUER
        Promise.all([
          completeQuiz(user.uid, correctAnswers, totalQuestions, timeSpent),
          heartsService.handleQuizCompletion(percentageCorrect),
          progressService.updateQuizProgress(
            difficulty as string,
            normalizedCategoryId,
            quizId as string,
            percentageCorrect,
            totalXP,
            0
          )
        ]).then(async ([_, heartsResult, updateResult]) => {
          if (!isMounted) return;
          
          setHeartsChange(heartsResult);
          setSavedProgress(true);
          
          if (updateResult.success) {
            // Rafraîchir immédiatement les XP
            refreshXP().catch(console.error);

            if (updateResult.levelCompleted) {
              setLevelCompleted(true);
            }
            
            if (updateResult.nextQuizUnlocked) {
              const nextQuizAccessResult = await progressService.canAccessNextQuiz(
                difficulty as string,
                normalizedCategoryId,
                quizId as string
              );
              
              if (nextQuizAccessResult.canAccess && nextQuizAccessResult.nextQuizId) {
                setCanAccessNextQuiz(true);
                setNextQuizId(nextQuizAccessResult.nextQuizId);
              }
            }
          }
        }).catch(error => {
          console.error('Erreur sauvegarde:', error);
          setSavedProgress(true); // Même en cas d'erreur
        });
        
      } catch (error) {
        console.error('Erreur:', error);
        setSavedProgress(true);
      }
    };
    
    saveQuizProgress();
    
    return () => {
      isMounted = false;
    };
  }, []); // DÉPENDANCES VIDES = UNE SEULE FOIS !
  
  // Formater le temps passé en mm:ss
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };
  
  // Naviguer vers la liste des quiz de la catégorie actuelle
  const handleNavigateToQuizList = () => {
    const categoryId = category as string;
    const routeCategoryId = categoryId.replace('maladies_', '');

    console.log('Navigation vers la liste des quiz de la catégorie:', routeCategoryId);
    // Aller directement à la liste des quiz de cette catégorie
    router.replace(`/quiz/${difficulty}/${routeCategoryId}`);
  };

  // Naviguer vers la liste des catégories (bouton X)
  const handleNavigateToCategories = () => {
    console.log('Navigation vers la liste des catégories');
    // Aller à la page d'accueil avec les catégories
    router.replace('/(app)/learn');
  };
  
  // Naviguer vers le quiz suivant
  const handleNavigateToNextQuiz = async () => {
    if (!nextQuizId) return;

    console.log('Navigation vers le quiz suivant:', nextQuizId);

    // Vérification rapide des cœurs (sans attendre)
    const heartsService = new HeartsService();
    heartsService.canPlayQuiz().then(canPlay => {
      if (!canPlay) {
        Alert.alert(
          "Pas assez de cœurs",
          "Tu n'as plus de vies. Tu dois attendre 1 heure pour en récupérer une et continuer.",
          [{ text: "OK", onPress: () => handleNavigateToQuizList() }]
        );
        return;
      }
    });

    // Navigation immédiate sans attendre la vérification des cœurs
    const categoryId = category as string;
    const routeCategoryId = categoryId.replace('maladies_', '');

    // 🚀 NAVIGATION IMMÉDIATE VERS LE QUIZ SUIVANT
    router.replace(`/quiz/${difficulty}/${routeCategoryId}/question?quizId=${nextQuizId}&questionId=q1`);
  };
  
  // Message de félicitations selon le pourcentage de réussite
  const getCongratsMessage = () => {
    if (percentageCorrect >= 90) return "Excellent travail !";
    if (percentageCorrect >= 80) return "Très bon travail !";
    if (percentageCorrect >= 60) return "Bon travail !";
    return "Quiz terminé !";
  };
  
  // Déterminer les couleurs du gradient selon la réussite
  const getResultGradient = (): readonly [string, string] => {
    if (percentageCorrect >= 90) return ['#4CAF50', '#2E7D32'] as const;
    if (percentageCorrect >= 80) return ['#8BC34A', '#558B2F'] as const;
    if (percentageCorrect >= 60) return ['#FFC107', '#FF8F00'] as const;
    return ['#FF5722', '#D84315'] as const;
  };
  
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* En-tête avec bouton de fermeture */}
      <View style={[styles.header, Platform.OS === 'ios' && { marginTop: 50 }]}>
        <TouchableOpacity onPress={handleNavigateToCategories} style={styles.headerButton}>
          <Ionicons name="close" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>
      
      {/* Zone principale avec résultats */}
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentContainer}>
          <LinearGradient
            colors={getResultGradient()}
            style={styles.resultCard}
          >
            <View style={styles.resultCardContent}>
              <Text style={styles.congratsTitle}>{getCongratsMessage()}</Text>
              
              {/* Cercle de score */}
              <View style={styles.scoreCircleContainer}>
                <View style={styles.scoreCircle}>
                  <Text style={styles.scorePercentage}>{percentageCorrect}%</Text>
                  <Text style={styles.scoreLabel}>Score</Text>
                </View>
              </View>
              
              {/* Texte de réussite/échec */}
              <Text style={styles.resultText}>
                {isPassing ? 'Quiz réussi ! 🎉' : 'Quiz non validé. Réessayez pour obtenir au moins 60%.'}
              </Text>
              
              {/* Statistiques détaillées */}
              <View style={styles.statsContainer}>
                <View style={styles.statRow}>
                  <View style={styles.statItem}>
                    <Ionicons name="time-outline" size={24} color="#FFF" />
                    <Text style={styles.statLabel}>Temps</Text>
                    <Text style={styles.statValue}>{formatTime(timeSpent)}</Text>
                  </View>
                  
                  <View style={styles.statItem}>
                    <Ionicons name="checkmark-circle" size={24} color="#FFF" />
                    <Text style={styles.statLabel}>Bonnes réponses</Text>
                    <Text style={styles.statValue}>{correctAnswers}/{totalQuestions}</Text>
                  </View>
                </View>
                
                <View style={styles.statRow}>
                  <View style={styles.statItem}>
                    <Ionicons name="star" size={24} color="#FFD700" />
                    <Text style={styles.statLabel}>XP gagnés</Text>
                    <Text style={styles.statValue}>+{totalXP}</Text>
                    {speedBonus > 0 && (
                      <Text style={styles.bonusText}>+{speedBonus} bonus rapidité</Text>
                    )}
                    <Text style={[styles.bonusText, { marginTop: 4, color: '#FFF' }]}>
                      Ajoutés à votre total !
                    </Text>
                  </View>
                  
                  <View style={styles.statItem}>
                    <Ionicons name="heart" size={24} color="#FF4081" />
                    <Text style={styles.statLabel}>Cœurs</Text>
                    {heartsChange > 0 ? (
                      <Text style={[styles.statValue, {color: '#8FFF80'}]}>+{heartsChange}</Text>
                    ) : (
                      <Text style={[styles.statValue, {color: '#FF8080'}]}>{heartsChange}</Text>
                    )}
                    <Text style={[styles.bonusText, { marginTop: 4, color: '#FFF' }]}>
                      {currentHearts}/{maxHearts} restants
                    </Text>
                  </View>
                </View>
              </View>
              
              {/* Message d'alerte si plus de cœurs */}
              {noHeartsLeft && (
                <View style={styles.noHeartsContainer}>
                  <Ionicons name="alert-circle" size={24} color="#FFD700" />
                  <Text style={styles.noHeartsText}>
                    Tu n'as plus de vies. Tu dois attendre 1 heure pour en récupérer une et continuer.
                  </Text>
                  {heartRegenerationTime && (
                    <Text style={styles.regenerationText}>
                      Prochaine vie dans: {heartRegenerationTime}
                    </Text>
                  )}
                </View>
              )}
              
              {/* Texte de statut de progression */}
              {isPassing && (
                <View style={styles.statusContainer}>
                  <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                  <Text style={styles.statusText}>Ce quiz est maintenant marqué comme "Terminé" ✅</Text>
                </View>
              )}
              
              {/* Notification de déblocage du quiz suivant */}
              {canAccessNextQuiz && isPassing && (
                <View style={styles.nextQuizUnlockedContainer}>
                  <Ionicons name="lock-open" size={20} color="#FFD700" />
                  <Text style={styles.nextQuizUnlockedText}>Quiz suivant débloqué ! 🎯</Text>
                </View>
              )}
              
              {/* Badge de niveau complété */}
              {levelCompleted && (
                <View style={styles.levelCompletedContainer}>
                  <Ionicons name="trophy" size={24} color="#FFD700" />
                  <Text style={styles.levelCompletedText}>
                    Niveau {difficulty} terminé ! 🏆
                  </Text>
                  <Text style={styles.levelBonusText}>+1000 XP Bonus</Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </View>
      </ScrollView>
      
      {/* Loader pendant la sauvegarde (plus rapide) */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFD600" />
          <Text style={styles.loadingText}>Finalisation...</Text>
        </View>
      )}
      
      {/* Boutons de navigation */}
      <View style={styles.buttonContainer}>
        {canAccessNextQuiz && isPassing && !noHeartsLeft ? (
          <TouchableOpacity 
            style={[styles.continueButton, {backgroundColor: '#4CAF50'}]}
            onPress={handleNavigateToNextQuiz}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text style={styles.continueButtonText}>
              QUIZ SUIVANT
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{marginLeft: 8}} />
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[
              styles.continueButton, 
              isPassing ? {backgroundColor: '#4CAF50'} : {backgroundColor: '#FF9800'}
            ]}
            onPress={handleNavigateToQuizList}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text style={[styles.continueButtonText, !isPassing && {color: '#FFFFFF', fontWeight: 'bold'}]}>
              {isPassing ? (
                <>
                  RETOUR À LA CATÉGORIE
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{marginLeft: 8}} />
                </>
              ) : (
                <>
                  RÉESSAYER CE QUIZ
                  <Ionicons name="refresh" size={18} color="#FFFFFF" style={{marginLeft: 8}} />
                </>
              )}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {showConfetti && isPassing && (
        <ConfettiCannon count={500} origin={{ x: -10, y: 0 }} fadeOut={true} fallSpeed={1000} autoStart={true} colors={['#FFD700', '#FF4081', '#4CAF50', '#2196F3']} />
      )}
      {showConfetti && !isPassing && (
        <ConfettiCannon count={100} origin={{ x: -10, y: 0 }} fadeOut={true} fallSpeed={800} autoStart={true} colors={['#B0BEC5', '#78909C', '#546E7A']} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingBottom: Platform.OS === 'ios' ? 34 : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'transparent',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  resultCard: {
    width: '100%',
    borderRadius: 16,
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  resultCardContent: {
    padding: 20,
    alignItems: 'center',
  },
  congratsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  scoreCircleContainer: {
    marginVertical: 20,
    alignItems: 'center',
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  scorePercentage: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scoreLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  resultText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 15,
  },
  unlockText: {
    fontSize: 16,
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 10,
  },
  statsContainer: {
    width: '100%',
    marginVertical: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 15,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 2,
  },
  bonusText: {
    fontSize: 12,
    color: '#FFD700',
    marginTop: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
  },
  statusText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontWeight: '500',
  },
  nextQuizUnlockedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
  },
  nextQuizUnlockedText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontWeight: '500',
  },
  levelCompletedContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 20,
    width: '100%',
  },
  levelCompletedText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 10,
  },
  levelBonusText: {
    fontSize: 16,
    color: '#FFD700',
    marginTop: 5,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 15,
    fontSize: 16,
  },
  buttonContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    alignItems: 'center',
  },
  continueButton: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonHintText: {
    fontSize: 12,
    color: '#757575',
    marginTop: 10,
    textAlign: 'center',
  },
  noHeartsContainer: {
    backgroundColor: 'rgba(255, 64, 129, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 64, 129, 0.5)',
    borderRadius: 12,
    padding: 15,
    marginTop: 15,
    width: '100%',
    alignItems: 'center',
  },
  noHeartsText: {
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 10,
    fontSize: 16,
    fontWeight: '500',
  },
  regenerationText: {
    color: '#FFD700',
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
  }
}); 



