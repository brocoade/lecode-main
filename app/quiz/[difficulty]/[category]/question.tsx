import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, SafeAreaView, ScrollView, Animated, Modal, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { doc, getDoc, collection } from 'firebase/firestore';
import { firebaseDB } from '@/backend/config/firebase.config';
import { HeartsService } from '@/app/services/hearts.service';
import { useHearts } from '@/context/HeartsContext';

const { width, height } = Dimensions.get('window');

// Interface pour une option de réponse
interface AnswerOption {
  id: string;
  text: string;
}

// Interface pour les données d'une question
interface QuestionData {
  id: string;
  questionText: string;
  options: AnswerOption[];
  correctAnswerId: string;
  explanation: string;
  timeLimit: number;
  points: number;
}

// Composant pour l'affichage du timer
const TimerCircle = ({ timeRemaining, totalTime }: { timeRemaining: number, totalTime: number }) => {
  return (
    <View style={styles.timerCircle}>
      <Text style={styles.timerText}>{timeRemaining}</Text>
    </View>
  );
};

// Fonction pour obtenir l'icône de la catégorie
const getCategoryIcon = (categoryId: string) => {
  // Vérifier si la catégorie contient déjà le préfixe et l'enlever
  const cleanCategoryId = categoryId.startsWith('maladies_') 
    ? categoryId.substring('maladies_'.length) 
    : categoryId;
  
  const icons = {
    'cardiovasculaires': <FontAwesome5 name="heartbeat" size={24} color="#FFFFFF" />,
    'respiratoires': <FontAwesome5 name="lungs" size={24} color="#FFFFFF" />,
    'digestives': <FontAwesome5 name="apple-alt" size={24} color="#FFFFFF" />,
    'endocriniennes': <FontAwesome5 name="brain" size={24} color="#FFFFFF" />,
    'autoimmunes': <FontAwesome5 name="shield-alt" size={24} color="#FFFFFF" />,
    'infectieuses': <FontAwesome5 name="virus" size={24} color="#FFFFFF" />,
    'musculosquelettiques': <FontAwesome5 name="bone" size={24} color="#FFFFFF" />,
    'neurologiques': <FontAwesome5 name="brain" size={24} color="#FFFFFF" />,
    'dermatologiques': <FontAwesome5 name="hand-sparkles" size={24} color="#FFFFFF" />,
    'hematologiques': <FontAwesome5 name="tint" size={24} color="#FFFFFF" />,
  };
  
  return icons[cleanCategoryId as keyof typeof icons] || <FontAwesome5 name="notes-medical" size={24} color="#FFFFFF" />;
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

// Fonction pour récupérer un quiz et ses questions depuis Firebase
const getQuizFromFirebase = async (difficultyParam: string, categoryParam: string, quizId: string) => {
  try {
    // Vérification des paramètres
    if (!difficultyParam || !categoryParam || !quizId) {
      console.error("Paramètres manquants pour récupérer le quiz:", { difficultyParam, categoryParam, quizId });
      return null;
    }

    // Vérifier si la catégorie contient déjà le préfixe
    const fullCategoryId = categoryParam.startsWith('maladies_') ? categoryParam : `maladies_${categoryParam}`;
    
    // Récupérer le document du quiz
    const quizRef = doc(firebaseDB, 'quizzes', difficultyParam, fullCategoryId, quizId);
    const quizDoc = await getDoc(quizRef);
    
    if (!quizDoc.exists()) {
      console.error(`Quiz non trouvé: ${difficultyParam}/${fullCategoryId}/${quizId}`);
      return null;
    }
    
    const quizData = quizDoc.data();
    
    // Vérifier la validité des données
    if (!quizData) {
      console.error("Données de quiz vides ou invalides");
      return null;
    }
    
    // Log pour déboguer la structure
    console.log(`Quiz chargé: ${quizId} (${difficultyParam}/${fullCategoryId})`);
    
    // Vérifier et valider les questions
    if (!quizData.questions) {
      console.error("Le quiz ne contient pas de questions");
      quizData.questions = []; // Initialiser comme tableau vide pour éviter les erreurs
    } else if (!Array.isArray(quizData.questions)) {
      console.error("Les questions ne sont pas un tableau");
      quizData.questions = []; // Initialiser comme tableau vide pour éviter les erreurs
    } else {
      // Valider chaque question et logger des informations de débogage
      quizData.questions.forEach((q: any, index: number) => {
        try {
          if (!q) {
            console.error(`Question à l'index ${index} est undefined ou null`);
            return;
          }
          
          console.log(`Question ${index + 1}:`, q.question || "Question sans texte");
          
          if (!q.options || !Array.isArray(q.options)) {
            console.error(`Question ${index + 1}: options manquantes ou invalides`);
          } else {
            console.log(`Options:`, q.options);
          }
          
          if (q.correctAnswer !== undefined) {
            console.log(`Réponse correcte:`, q.correctAnswer);
          } else {
            console.error(`Question ${index + 1}: correctAnswer est undefined`);
          }
        } catch (error) {
          console.error(`Erreur lors de la validation de la question ${index + 1}:`, error);
        }
      });
    }
    
    // Retourner l'objet quiz normalisé
    return {
      quizId: quizDoc.id,
      title: quizData.title || `Quiz ${quizDoc.id}`,
      description: quizData.description || '',
      totalQuestions: quizData.questions?.length || 0,
      timeLimit: quizData.timeLimit || 30,
      pointsToEarn: quizData.pointsToEarn || 50,
      heartsToEarn: quizData.heartsToEarn || 1,
      questions: quizData.questions || []
    };
  } catch (error) {
    console.error("Erreur lors de la récupération du quiz:", error);
    return null;
  }
};

// Cache pour les quiz
const quizCache = new Map();

export default function QuestionScreen() {
  const { difficulty, category, quizId, questionId } = useLocalSearchParams();
  const router = useRouter();
  const { hearts } = useHearts();
  
  // Animation pour la barre de progression
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  // État pour stocker le quiz complet
  const [quiz, setQuiz] = useState<any>(null);
  // État pour stocker la question actuelle
  const [question, setQuestion] = useState<QuestionData | null>(null);
  // État pour stocker la réponse sélectionnée
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  // État pour le temps restant
  const [timeRemaining, setTimeRemaining] = useState<number>(30);
  // État pour suivre si la réponse est correcte
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  // État pour indiquer si on est en train de charger
  const [loading, setLoading] = useState<boolean>(true);
  // État pour la phase de préchargement (pour éliminer le blanc)
  const [preloading, setPreloading] = useState<boolean>(true);
  // État pour suivre le numéro de la question actuelle
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState<number>(1);
  // État pour le nombre total de questions
  const [totalQuestions, setTotalQuestions] = useState<number>(5);
  // État pour les points accumulés
  const [accumulatedPoints, setAccumulatedPoints] = useState<number>(0);
  // État pour afficher ou masquer la modal d'explication
  const [showExplanationModal, setShowExplanationModal] = useState<boolean>(false);
  // État pour suivre les réponses correctes
  const [correctAnswers, setCorrectAnswers] = useState<number>(0);
  // État pour suivre le temps total passé
  const [totalTimeSpent, setTotalTimeSpent] = useState<number>(0);
  // État pour l'index de la question actuelle
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  // État pour vérifier si l'utilisateur peut jouer (a des cœurs)
  const [canPlay, setCanPlay] = useState<boolean>(true);
  // État pour le temps de régénération
  const [regenerationTime, setRegenerationTime] = useState<string>('');

  // Vérifier si l'utilisateur a des cœurs disponibles
  useEffect(() => {
    const checkHearts = async () => {
      const heartsService = new HeartsService();
      const hasHearts = await heartsService.canPlayQuiz();
      
      if (!hasHearts) {
        setCanPlay(false);
        const timeUntilNextHeart = await heartsService.getFormattedTimeUntilNextHeart();
        setRegenerationTime(timeUntilNextHeart);
        
        // Afficher une alerte et rediriger vers la liste des quiz
        Alert.alert(
          "Pas assez de cœurs",
          "Tu n'as plus de vies. Tu dois attendre 1 heure pour en récupérer une et continuer.",
          [{ 
            text: "Retour", 
            onPress: () => router.replace(`/quiz/${difficulty}`) 
          }]
        );
      } else {
        setCanPlay(true);
      }
    };
    
    checkHearts();
  }, [hearts, difficulty, router]);

  // Précharger l'interface avant de charger les données complètes
  useEffect(() => {
    // Ne pas charger le quiz si l'utilisateur n'a pas de cœurs
    if (!canPlay) return;
    
    // Réduire encore davantage le temps de préchargement
    const timer = setTimeout(() => {
      setPreloading(false);
    }, 200); // Réduire à 200ms pour une perception plus rapide
    
    return () => clearTimeout(timer);
  }, [canPlay]);

  // Charger le quiz et ses questions depuis Firebase (avec mise en cache)
  useEffect(() => {
    const loadQuiz = async () => {
      try {
        // Vérifier si le quiz est déjà en cache
        const cacheKey = `${difficulty}-${category}-${quizId}`;
        if (quizCache.has(cacheKey)) {
          const cachedQuizData = quizCache.get(cacheKey);
          processQuizData(cachedQuizData);
          return;
        }
        
        // Récupérer le quiz depuis Firebase
        const quizData = await getQuizFromFirebase(
          difficulty as string,
          category as string,
          quizId as string
        );
        
        if (!quizData || !quizData.questions || quizData.questions.length === 0) {
          console.error("Aucune question trouvée pour ce quiz");
          setLoading(false);
          return;
        }
        
        // Mettre en cache le quiz
        quizCache.set(cacheKey, quizData);
        
        // Traiter les données du quiz
        processQuizData(quizData);
      } catch (error) {
        console.error("Erreur lors du chargement du quiz:", error);
        setLoading(false);
      }
    };
    
    const processQuizData = (quizData: any) => {
      try {
        // Vérifier que le quiz et ses questions sont valides
        if (!quizData || !quizData.questions || !Array.isArray(quizData.questions)) {
          console.error("Format de quiz invalide ou questions manquantes");
          setLoading(false);
          return;
        }
        
        // Filtrer pour ne garder que les questions valides
        const validQuestions = quizData.questions.filter((q: any) => 
          q && 
          typeof q === 'object' && 
          q.question && 
          typeof q.question === 'string' &&
          q.options && 
          Array.isArray(q.options) && 
          q.options.length > 0
        );
        
        if (validQuestions.length === 0) {
          console.error("Aucune question valide trouvée pour ce quiz");
          setLoading(false);
          return;
        }
        
        console.log(`Quiz ${quizId}: ${validQuestions.length} questions valides sur ${quizData.questions.length} au total`);
        
        // Remplacer les questions par les questions valides uniquement
        const sanitizedQuizData = {
          ...quizData,
          questions: validQuestions
        };
        
        setQuiz(sanitizedQuizData);
        setTotalQuestions(validQuestions.length);
        
        // Trouver la question correspondant à l'ID, ou utiliser la première question
        let startIndex = validQuestions.findIndex((q: any) => q.id === questionId);
        if (startIndex === -1) startIndex = 0; // Si la question n'est pas trouvée, commencer par la première
        
        setCurrentQuestionIndex(startIndex);
        setCurrentQuestionNumber(startIndex + 1);
        
        // Définir la question actuelle
        const currentQuestion = validQuestions[startIndex];
        if (!currentQuestion) {
          console.error("Question introuvable après filtrage");
          setLoading(false);
          return;
        }
        
        // Construire l'objet
        try {
          const questionObj = buildQuestionObject(currentQuestion, sanitizedQuizData.timeLimit);
          setQuestion(questionObj);
          
          // Initialiser le timer
          setTimeRemaining(sanitizedQuizData.timeLimit || 30);
        } catch (error) {
          console.error("Erreur lors de la construction de l'objet question:", error);
          setLoading(false);
          return;
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Erreur lors du traitement des données du quiz:", error);
        setLoading(false);
      }
    };
    
    if (!preloading) {
      loadQuiz();
    }
  }, [difficulty, category, quizId, questionId, preloading]);

  // Fonction pour construire un objet de question correctement formaté
  const buildQuestionObject = (questionData: any, defaultTimeLimit: number) => {
    try {
      // Vérification préalable que toutes les données nécessaires sont présentes
      if (!questionData || typeof questionData !== 'object') {
        throw new Error("Les données de la question sont invalides ou manquantes");
      }
      
      if (!questionData.question || typeof questionData.question !== 'string') {
        throw new Error("Le texte de la question est manquant ou invalide");
      }
      
      if (!questionData.options || !Array.isArray(questionData.options) || questionData.options.length === 0) {
        throw new Error("Les options de réponse sont manquantes ou invalides");
      }
      
      // Vérifier et traiter les options
      const options = questionData.options.map((opt: any, index: number) => {
        if (typeof opt !== 'string') {
          console.warn(`Option non valide (${typeof opt}) à l'index ${index}, conversion forcée en chaîne`);
          return {
            id: `opt${index + 1}`,
            text: String(opt || `Option ${index + 1}`)
          };
        }
        return {
          id: `opt${index + 1}`,
          text: opt
        };
      });
      
      // Déterminer l'ID de la bonne réponse correctement
      let correctAnswerId = 'opt1'; // Valeur par défaut
      
      if (questionData.correctAnswer !== undefined) {
        if (typeof questionData.correctAnswer === 'number') {
          // Si c'est un index numérique (ex: 2)
          const index = questionData.correctAnswer;
          if (index >= 0 && index < options.length) {
            correctAnswerId = `opt${index + 1}`;
          } else {
            console.error(`Index de réponse correcte hors limites: ${index}, options.length: ${options.length}`);
          }
        } else if (typeof questionData.correctAnswer === 'string') {
          // On commence par essayer de trouver une option correspondante par le texte
          // car c'est le cas le plus courant et le plus fiable
          const matchingOption = options.find((opt: { id: string, text: string }) => opt.text === questionData.correctAnswer);
          if (matchingOption) {
            correctAnswerId = matchingOption.id;
            console.log("Option correspondante trouvée:", matchingOption.text, "->", matchingOption.id);
          }
          // Si on n'a pas trouvé par le texte, on essaie de voir si c'est un format d'ID ou un index
          else if (questionData.correctAnswer.startsWith('opt')) {
            // Si c'est déjà au format "opt1", "opt2", etc.
            const optNum = questionData.correctAnswer.replace('opt', '');
            const index = parseInt(optNum, 10) - 1;
            if (index >= 0 && index < options.length) {
              correctAnswerId = questionData.correctAnswer;
            } else {
              console.error(`ID de réponse correcte hors limites: ${questionData.correctAnswer}, options.length: ${options.length}`);
            }
          }
          // On vérifie si c'est EXACTEMENT une chaîne représentant un nombre (pas un texte avec des chiffres)
          else if (/^\d+$/.test(questionData.correctAnswer)) {
            // Si c'est une chaîne numérique (ex: "2")
            const index = parseInt(questionData.correctAnswer, 10);
            if (index >= 0 && index < options.length) {
              correctAnswerId = `opt${index + 1}`;
            } else {
              console.error(`Index de réponse correcte (chaîne) hors limites: ${index}, options.length: ${options.length}`);
            }
          } else {
            // Dernier recours: vérifier si une option contient partiellement la réponse correcte
            const partialMatch = options.find((opt: { id: string, text: string }) => 
              opt.text.includes(questionData.correctAnswer) || questionData.correctAnswer.includes(opt.text));
            
            if (partialMatch) {
              correctAnswerId = partialMatch.id;
              console.log("Option partiellement correspondante trouvée:", partialMatch.text, "->", partialMatch.id);
            } else {
              console.error("Aucune option ne correspond à la réponse:", questionData.correctAnswer);
            }
          }
        } else {
          // Fallback en cas de valeur incorrecte
          console.error("Format de correctAnswer inconnu (type):", typeof questionData.correctAnswer);
        }
      } else {
        console.error("Aucune réponse correcte définie pour cette question, utilisation de opt1 par défaut");
      }
      
      // Construire l'objet
      return {
        id: questionData.id || `q${Math.random().toString(36).substr(2, 9)}`,
        questionText: questionData.question,
        options: options,
        correctAnswerId: correctAnswerId,
        explanation: questionData.explanation || "Pas d'explication disponible pour cette question.",
        timeLimit: questionData.timeLimit || defaultTimeLimit || 30,
        points: questionData.points || 200 // Modification: 200 points par défaut pour obtenir 20 XP
      };
    } catch (error) {
      console.error("Erreur lors de la construction de l'objet question:", error);
      
      // Créer une question par défaut pour éviter le crash
      return {
        id: `q${Math.random().toString(36).substr(2, 9)}`,
        questionText: "Erreur lors du chargement de la question. Veuillez passer à la suivante.",
        options: [
          { id: 'opt1', text: 'Option 1' },
          { id: 'opt2', text: 'Option 2' }
        ],
        correctAnswerId: 'opt1',
        explanation: "Une erreur est survenue lors du chargement de cette question.",
        timeLimit: defaultTimeLimit || 30,
        points: 0
      };
    }
  };

  // Animation de la barre de progression
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: currentQuestionNumber / totalQuestions,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [currentQuestionNumber, progressAnim, totalQuestions]);

  // Timer pour le décompte
  useEffect(() => {
    if (!loading && !preloading && timeRemaining > 0 && !selectedOption) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0 && !selectedOption) {
      // Temps écoulé sans réponse sélectionnée
      handleTimeUp();
    }
  }, [timeRemaining, loading, preloading, selectedOption]);

  // Fonction pour gérer la sélection d'une option
  const handleOptionSelect = (optionId: string) => {
    if (selectedOption || isCorrect !== null) return; // Empêcher de changer de réponse
    
    setSelectedOption(optionId);
    
    // Vérifier si la réponse est correcte
    if (question && optionId === question.correctAnswerId) {
      setIsCorrect(true);
      // Calculer les points en fonction du temps restant
      const timeBonus = Math.floor(timeRemaining / question.timeLimit * 20);
      const pointsEarned = question.points + timeBonus;
      setAccumulatedPoints(prev => prev + pointsEarned);
      // Incrémenter le compteur de réponses correctes
      setCorrectAnswers(prev => prev + 1);
    } else {
      setIsCorrect(false);
    }
    
    // Calculer le temps passé pour cette question
    if (question) {
      const timeSpent = question.timeLimit - timeRemaining;
      setTotalTimeSpent(prev => prev + timeSpent);
    }
    
    // Afficher la modal d'explication
    setShowExplanationModal(true);
  };

  // Fonction pour gérer le temps écoulé
  const handleTimeUp = () => {
    setSelectedOption('timeout');
    setIsCorrect(false);
    
    // Ajouter le temps maximum pour cette question
    if (question) {
      setTotalTimeSpent(prev => prev + question.timeLimit);
    }
    
    // Afficher la modal d'explication si disponible
    if (question?.explanation) {
      setShowExplanationModal(true);
    } else {
      // Passer directement à la question suivante
      setTimeout(handleNextQuestion, 1000);
    }
  };

  // Fonction pour passer à la question suivante
  const handleNextQuestion = () => {
    if (currentQuestionNumber < totalQuestions && quiz) {
      // Réinitialiser l'état
      setSelectedOption(null);
      setIsCorrect(null);
      setShowExplanationModal(false);
      
      // Passer à la question suivante
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setCurrentQuestionNumber(prev => prev + 1);
      
      // Mettre à jour la question actuelle
      const nextQuestion = quiz.questions[nextIndex];
      const questionObj = buildQuestionObject(nextQuestion, quiz.timeLimit);
      setQuestion(questionObj);
      
      // Réinitialiser le timer
      setTimeRemaining(quiz.timeLimit || 30);
    } else {
      // Fin du quiz, afficher un message de confirmation si réussi
      const score = Math.round((correctAnswers / totalQuestions) * 100);
      const isPassing = score >= 60;
      
      if (isPassing) {
        // Afficher une alerte de confirmation pour informer l'utilisateur
        Alert.alert(
          "Quiz terminé avec succès !",
          "Ce quiz sera marqué comme 'Déjà fait' dans votre progression.",
          [{ text: "Continuer", onPress: () => navigateToResults() }]
        );
      } else {
        // Si non réussi, naviguer directement vers les résultats
        navigateToResults();
      }
    }
  };

  // Fonction auxiliaire pour naviguer vers les résultats
  const navigateToResults = () => {
    router.push(`/quiz/${difficulty}/${category}/${quizId}/results?points=${accumulatedPoints}&correctAnswers=${correctAnswers}&totalQuestions=${totalQuestions}&timeSpent=${totalTimeSpent}`);
  };

  // Fonction pour valider la réponse
  const handleValidateAnswer = () => {
    // Dans une application réelle, vous enregistreriez la réponse dans la base de données
    // Fermer la modal d'explication si elle est ouverte
    setShowExplanationModal(false);
    // Passer à la question suivante
    handleNextQuestion();
  };

  // Fonction pour gérer le clic sur "J'ai compris"
  const handleUnderstandClick = () => {
    // Fermer la modal
    setShowExplanationModal(false);
    // Si la réponse est correcte, passer à la question suivante directement
    if (isCorrect) {
      handleNextQuestion();
    }
    // Si la réponse est incorrecte, attendre que l'utilisateur clique sur VALIDER
  };

  // Interface de chargement améliorée
  if (!canPlay) {
    return (
      <View style={styles.fullScreenBackground}>
        <Ionicons name="heart-dislike" size={60} color="#FF5252" />
        <Text style={styles.loadingTitle}>Pas assez de cœurs</Text>
        <Text style={styles.loadingSubtitle}>
          Tu n'as plus de vies. Tu dois attendre 1 heure pour en récupérer une et continuer.
        </Text>
        {regenerationTime && (
          <Text style={styles.regenerationText}>Prochaine vie dans: {regenerationTime}</Text>
        )}
        <TouchableOpacity
          style={styles.backToHomeButton}
          onPress={() => router.replace(`/quiz/${difficulty}`)}
        >
          <Text style={styles.backToHomeText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (preloading) {
    return (
      <View style={styles.fullScreenBackground}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingTitle}>Meducare</Text>
        <Text style={styles.loadingSubtitle}>Préparation de votre quiz...</Text>
      </View>
    );
  }

  // Afficher un écran de chargement si nécessaire
  if (loading || !question) {
    return (
      <View style={styles.fullScreenBackground}>
        <ActivityIndicator size="large" color={getDifficultyColor(difficulty as string)} />
        <Text style={styles.loadingTitle}>Quiz Médical</Text>
        <Text style={styles.loadingText}>
          Chargement de votre question...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* En-tête avec bouton de retour, barre de progression et temps restant */}
      <View style={[styles.header, { backgroundColor: getDifficultyColor(difficulty as string) }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBackground}>
            <Animated.View 
              style={[
                styles.progressBarFill, 
                { width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
                isCorrect === true ? styles.progressBarCorrect : 
                isCorrect === false ? styles.progressBarIncorrect : 
                styles.progressBarNeutral
              ]} 
            />
          </View>
        </View>
        
        <View style={styles.timerContainer}>
          <View style={styles.timerCircle}>
            <Text style={styles.timerText}>{timeRemaining}</Text>
          </View>
        </View>
      </View>
      
      {/* Titre avec icône de catégorie */}
      <View style={[styles.categoryTitleContainer, { backgroundColor: getDifficultyColor(difficulty as string) }]}>
        <View style={styles.categoryIconContainer}>
          {getCategoryIcon(category as string)}
        </View>
        <Text style={styles.categoryTitle}>
          {getCategoryName(category as string)}
        </Text>
      </View>
      
      {/* Corps de la question avec ScrollView pour permettre de défiler si nécessaire */}
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContentContainer}>
        <View style={styles.questionContainer}>
          <Text style={styles.questionTitle}>
            Question {currentQuestionNumber}/{totalQuestions}
          </Text>
          
          {/* Texte de la question */}
          <Text style={styles.questionText}>
            {question.questionText}
          </Text>
          
          {/* Options de réponse */}
          <View style={styles.optionsContainer}>
            {question.options.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionButton,
                  selectedOption === option.id && styles.optionSelected,
                  isCorrect !== null && option.id === question.correctAnswerId && styles.optionCorrect,
                  selectedOption === option.id && isCorrect === false && styles.optionIncorrect
                ]}
                onPress={() => handleOptionSelect(option.id)}
                disabled={selectedOption !== null}
              >
                <View style={styles.optionContent}>
                  <Text style={[
                    styles.optionText,
                    selectedOption === option.id && styles.optionTextSelected,
                    isCorrect !== null && option.id === question.correctAnswerId && styles.optionTextCorrect,
                    selectedOption === option.id && isCorrect === false && styles.optionTextIncorrect
                  ]}>
                    {option.text}
                  </Text>
                  
                  {/* Icône pour la bonne réponse ou la réponse sélectionnée incorrecte */}
                  {isCorrect !== null && (
                    <View style={styles.optionIconContainer}>
                      {option.id === question.correctAnswerId ? (
                        <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                      ) : (selectedOption === option.id && isCorrect === false) ? (
                        <Ionicons name="close-circle" size={24} color="#F44336" />
                      ) : null}
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
      
      {/* Modal pour l'explication */}
      <Modal
        visible={showExplanationModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowExplanationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalHeaderText, 
                isCorrect ? styles.modalHeaderCorrect : styles.modalHeaderIncorrect]}>
                {isCorrect ? "Correct !" : "Incorrect"}
              </Text>
            </View>
            
            <View style={styles.modalContent}>
              {!isCorrect && question && (
                <View style={styles.correctAnswerContainer}>
                  <Text style={styles.correctAnswerLabel}>La bonne réponse était :</Text>
                  <Text style={styles.correctAnswerText}>
                    {question.options.find(opt => opt.id === question.correctAnswerId)?.text || 
                    "Réponse non disponible"}
                  </Text>
                </View>
              )}
              
              <Text style={styles.explanationTitle}>Explication :</Text>
              <Text style={styles.explanationText}>
                {question?.explanation || "Aucune explication disponible pour cette question."}
              </Text>
            </View>
            
            <View style={styles.modalFooter}>
              {isCorrect ? (
                <TouchableOpacity
                  style={[styles.modalButton, styles.correctButton]}
                  onPress={handleUnderstandClick}
                >
                  <Text style={styles.modalButtonText}>SUIVANT</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.modalButton, styles.understandButton]}
                  onPress={handleUnderstandClick}
                >
                  <Text style={styles.modalButtonText}>J'AI COMPRIS</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Bouton Valider en position fixe en bas - uniquement pour les réponses incorrectes après fermeture du popup */}
      {selectedOption && isCorrect === false && !showExplanationModal && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.validateButton, styles.validateButtonIncorrect]}
            onPress={handleValidateAnswer}
          >
            <Text style={styles.validateButtonText}>VALIDER</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

// Fonction pour obtenir le nom complet de la catégorie à partir de l'ID
const getCategoryName = (categoryId: string) => {
  const categories = {
    'cardiovasculaires': 'Maladies Cardiovasculaires',
    'respiratoires': 'Maladies Respiratoires',
    'digestives': 'Maladies Digestives',
    'endocriniennes': 'Maladies Endocriniennes',
    'autoimmunes': 'Maladies Auto-immunes',
    'infectieuses': 'Maladies Infectieuses',
    'musculosquelettiques': 'Maladies Musculo-squelettiques',
    'neurologiques': 'Maladies Neurologiques',
    'dermatologiques': 'Maladies Dermatologiques',
    'hematologiques': 'Maladies Hématologiques',
  };
  
  return categories[categoryId as keyof typeof categories] || categoryId;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  fullScreenBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 30,
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  loadingSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    fontSize: 18,
    color: '#333',
    marginTop: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressContainer: {
    flex: 1,
    marginHorizontal: 20,
  },
  progressBarBackground: {
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressBarNeutral: {
    backgroundColor: '#FFFFFF', // Blanc sur fond bleu
  },
  progressBarCorrect: {
    backgroundColor: '#FFD600', // Jaune pour correct
  },
  progressBarIncorrect: {
    backgroundColor: '#FF5252', // Rouge pour incorrect
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  categoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginBottom: 10,
  },
  categoryIconContainer: {
    marginRight: 10,
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 100, // Espace supplémentaire en bas pour éviter que le contenu ne soit caché par le bouton
  },
  questionContainer: {
    padding: 20,
  },
  questionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  questionText: {
    fontSize: 18,
    color: '#333',
    lineHeight: 26,
    marginBottom: 30,
  },
  optionsContainer: {
    marginTop: 10,
    gap: 16,
  },
  optionButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 16,
    padding: 20,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  optionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  optionIconContainer: {
    marginLeft: 10,
  },
  optionSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
    elevation: 4,
  },
  optionCorrect: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
    borderWidth: 2,
    elevation: 4,
  },
  optionIncorrect: {
    backgroundColor: '#FFEBEE',
    borderColor: '#F44336',
    borderWidth: 2,
    elevation: 4,
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'left',
    flex: 1,
  },
  optionTextSelected: {
    color: '#2196F3',
    fontWeight: '500',
  },
  optionTextCorrect: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  optionTextIncorrect: {
    color: '#F44336',
    fontWeight: '500',
  },
  buttonContainer: {
    padding: 20,
    paddingBottom: 30,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F8F9FA',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  validateButton: {
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  validateButtonCorrect: {
    backgroundColor: '#29B6F6', // Bleu pour bouton correct
  },
  validateButtonIncorrect: {
    backgroundColor: '#F44336', // Rouge pour bouton incorrect
  },
  validateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Styles pour la modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    alignItems: 'center',
  },
  modalHeaderText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  modalHeaderCorrect: {
    color: '#4CAF50',
  },
  modalHeaderIncorrect: {
    color: '#F44336',
  },
  modalContent: {
    padding: 20,
  },
  correctAnswerContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  correctAnswerLabel: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  correctAnswerText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
  },
  modalFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    padding: 16,
  },
  modalButton: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  understandButton: {
    backgroundColor: '#FFB300', // Jaune/orange
  },
  correctButton: {
    backgroundColor: '#29B6F6', // Bleu
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  regenerationText: {
    fontSize: 18,
    color: '#FF4081',
    fontWeight: 'bold',
    marginTop: 20,
  },
  backToHomeButton: {
    marginTop: 30,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
  },
  backToHomeText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  }
}); 