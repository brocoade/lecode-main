import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator, Modal } from 'react-native';
import { DailyObjectives } from '@/components/layout/DailyObjectives';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import SharedTransition from '@/components/navigation/SharedTransition';
import { ProgressService, DifficultyProgress } from '@/app/services/progress.service';
import { useAuth } from '@/context/AuthContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.9;

interface LevelCardProps {
  difficulty: 'facile' | 'moyen' | 'difficile';
  isLocked?: boolean;
  progress?: number;
  onPress: () => void;
  points: number;
  color: string;
}

const LevelCard: React.FC<LevelCardProps> = ({ difficulty, isLocked = false, progress = 0, onPress, points, color }) => {
  const getStatusIcon = () => {
    if (isLocked) return '🔒';
    if (progress === 100) return '🏆';
    if (progress > 0) return '📝';
    return '🎯';
  };

  const getDifficultyEmoji = () => {
    switch (difficulty) {
      case 'facile': return '😊';
      case 'moyen': return '😐';
      case 'difficile': return '😰';
      default: return '🎯';
    }
  };

  return (
    <TouchableOpacity 
      onPress={onPress}
      style={[styles.cardContainer, { backgroundColor: color }]}
      activeOpacity={0.9}
      disabled={isLocked}
    >
      <View style={styles.cardContent}>
        <View style={styles.levelHeader}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelEmoji}>{getDifficultyEmoji()}</Text>
          </View>
          <Text style={styles.levelText}>Niveau {difficulty}</Text>
          <Text style={styles.statusIcon}>{getStatusIcon()}</Text>
        </View>

        {isLocked ? (
          <View style={styles.lockedContainer}>
            <Text style={styles.lockedText}>Niveau verrouillé</Text>
            <Text style={styles.unlockText}>
              {difficulty === 'moyen' 
                ? 'Terminez toutes les catégories du niveau Facile' 
                : 'Terminez toutes les catégories du niveau Moyen'}
            </Text>
          </View>
        ) : (
          <View style={styles.progressContainer}>
            <View style={styles.progressInfo}>
              <Text style={styles.progressText}>{progress}% complété</Text>
              {progress === 100 && (
                <View style={styles.completedBadge}>
                  <Text style={styles.completedText}>Terminé !</Text>
                </View>
              )}
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.categoriesText}>
              {progress < 100 
                ? `${Math.round(progress/20)} catégories sur 5 terminées` 
                : 'Toutes les catégories terminées !'}
            </Text>
          </View>
        )}

        <View style={styles.cardFooter}>
          {!isLocked && (
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Ionicons name="star" size={16} color="#FFD600" />
                <Text style={styles.statText}>+{points}</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="heart" size={16} color="#FF4081" />
                <Text style={styles.statText}>+{Math.floor(points/300)}</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function QuizScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [userProgress, setUserProgress] = useState<{
    difficulties: DifficultyProgress[];
    totalXP: number;
    heartsCount: number;
  } | null>(null);
  
  // Charger la progression de l'utilisateur depuis Firebase
  useEffect(() => {
    const loadUserProgress = async () => {
      try {
        setLoading(true);
        const progressService = new ProgressService();
        const progress = await progressService.getUserProgress();
        
        if (progress) {
          setUserProgress({
            difficulties: progress.difficulties,
            totalXP: progress.totalXP,
            heartsCount: progress.heartsCount
          });
        }
      } catch (error) {
        console.error('Erreur lors du chargement de la progression:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      loadUserProgress();
    } else {
      setLoading(false);
    }
  }, [user]);
  
  // Définir les niveaux de difficulté avec la progression de l'utilisateur
  const getLevels = () => {
    // Valeurs par défaut si aucune progression n'est chargée
    const defaultLevels = [
    { 
      difficulty: 'facile',
      points: 500,
      color: '#4CAF50', // Vert
      isLocked: false,
      progress: 0
    },
    { 
      difficulty: 'moyen',
      points: 750,
      color: '#FFB300', // Jaune pour niveau moyen
        isLocked: true,
      progress: 0
    },
    { 
      difficulty: 'difficile',
      points: 1000,
      color: '#29B6F6', // Bleu pour niveau difficile
        isLocked: true,
      progress: 0
    }
  ];
    
    // Si aucune progression n'est chargée, retourner les valeurs par défaut
    if (!userProgress) return defaultLevels;
    
    // Mapper les niveaux avec la progression réelle de l'utilisateur
    return defaultLevels.map(level => {
      const difficultyProgress = userProgress.difficulties.find(
        d => d.difficulty === level.difficulty
      );
      
      if (difficultyProgress) {
        return {
          ...level,
          progress: difficultyProgress.progress,
          isLocked: !difficultyProgress.unlocked
        };
      }
      
      return level;
    });
  };

  const dailyObjectives = [
    { id: '1', title: 'Quiz du jour', completed: true },
    { id: '2', title: 'Lecture santé', completed: true },
  ];

  const handleLevelPress = (difficulty: string) => {
    router.push(`/quiz/${difficulty}`);
  };

  return (
    <SharedTransition transitionKey="quiz-screen">
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
        <DailyObjectives objectives={dailyObjectives} />
        
        <View style={styles.content}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Quiz Médical</Text>
            <View style={styles.subtitleRow}>
            <Text style={styles.subtitle}>Choisissez votre niveau</Text>
              <TouchableOpacity 
                style={styles.infoButton}
                onPress={() => setInfoModalVisible(true)}
              >
                <Ionicons name="information-circle-outline" size={24} color="#4CAF50" />
              </TouchableOpacity>
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.loadingText}>Chargement de votre progression...</Text>
            </View>
          ) : (
          <View style={styles.levelsContainer}>
              {getLevels().map((level) => (
              <LevelCard 
                key={level.difficulty}
                difficulty={level.difficulty as 'facile' | 'moyen' | 'difficile'}
                isLocked={level.isLocked}
                progress={level.progress}
                onPress={() => handleLevelPress(level.difficulty)}
                points={level.points}
                color={level.color}
              />
            ))}
          </View>
          )}
        </View>
      
        {/* Modal d'information sur les règles de progression */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={infoModalVisible}
          onRequestClose={() => setInfoModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Règles de progression</Text>
                <TouchableOpacity onPress={() => setInfoModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalContent}>
                <View style={styles.infoSection}>
                  <Text style={styles.infoTitle}>Comment progresser ?</Text>
                  <Text style={styles.infoText}>
                    Chaque niveau contient 5 catégories à compléter. Pour qu'une catégorie soit considérée comme terminée, vous devez compléter au moins un quiz de cette catégorie avec un score minimum de 60%.
                  </Text>
                </View>
                
                <View style={styles.infoSection}>
                  <Text style={styles.infoTitle}>Déblocage des niveaux</Text>
                  <Text style={styles.infoText}>
                    La barre de progression d'un niveau se remplit en fonction du nombre de catégories terminées. Lorsque toutes les catégories d'un niveau sont terminées (barre à 100%), le niveau suivant est débloqué.
                  </Text>
                </View>
                
                <View style={styles.barExample}>
                  <Text style={styles.exampleText}>Exemple: 3 catégories terminées sur 5</Text>
                  <View style={styles.exampleBar}>
                    <View style={[styles.exampleFill, { width: '60%' }]} />
                  </View>
                  <Text style={styles.exampleLabel}>60% complété</Text>
                </View>
                
                <View style={styles.difficultyInfo}>
                  <View style={[styles.difficultyDot, { backgroundColor: '#4CAF50' }]} />
                  <Text style={styles.difficultyText}>Niveau Facile: toujours débloqué</Text>
                </View>
                
                <View style={styles.difficultyInfo}>
                  <View style={[styles.difficultyDot, { backgroundColor: '#FFB300' }]} />
                  <Text style={styles.difficultyText}>Niveau Moyen: débloqué après avoir complété le niveau Facile</Text>
                </View>
                
                <View style={styles.difficultyInfo}>
                  <View style={[styles.difficultyDot, { backgroundColor: '#29B6F6' }]} />
                  <Text style={styles.difficultyText}>Niveau Difficile: débloqué après avoir complété le niveau Moyen</Text>
                </View>
              </ScrollView>
              
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setInfoModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>J'ai compris</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SharedTransition>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 20, // Réduit car le padding est géré par le layout parent
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
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
  },
  infoButton: {
    marginLeft: 8,
    padding: 4,
  },
  levelsContainer: {
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: 140,
    marginBottom: 8,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cardContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  levelEmoji: {
    fontSize: 20,
  },
  levelText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textTransform: 'capitalize',
  },
  statusIcon: {
    fontSize: 24,
    marginLeft: 8,
  },
  lockedContainer: {
    alignItems: 'flex-start',
  },
  lockedText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
    fontWeight: '600',
  },
  unlockText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  progressContainer: {
    width: '100%',
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  progressText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  completedBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  cardFooter: {
    alignItems: 'flex-end',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  progressBar: {
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 5,
  },
  categoriesText: {
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
    marginTop: 2,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    width: '100%',
    maxHeight: '80%',
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalContent: {
    marginBottom: 15,
  },
  infoSection: {
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  barExample: {
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    marginVertical: 10,
  },
  exampleText: {
    fontSize: 14,
    marginBottom: 8,
    color: '#333',
  },
  exampleBar: {
    width: '100%',
    height: 15,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 5,
  },
  exampleFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 8,
  },
  exampleLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  difficultyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  difficultyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  difficultyText: {
    fontSize: 14,
    color: '#555',
    flex: 1,
  },
  closeButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 