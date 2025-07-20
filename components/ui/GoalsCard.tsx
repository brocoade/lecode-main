import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface UserGoal {
  id: string;
  type: 'streak' | 'daily_quizzes' | 'category_completion' | 'score_improvement';
  title: string;
  description: string;
  target: number;
  current: number;
  deadline?: Date;
  completed: boolean;
  createdAt: Date;
}

interface GoalsCardProps {
  goals: UserGoal[];
  onGoalPress?: (goalId: string) => void;
  onAddGoalPress?: () => void;
}

export default function GoalsCard({
  goals,
  onGoalPress,
  onAddGoalPress
}: GoalsCardProps) {
  const animatedValues = useRef(goals.map(() => new Animated.Value(0))).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    // Animation d'entrée
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Animation des objectifs
    const animations = animatedValues.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 800,
        delay: index * 150,
        useNativeDriver: false,
      })
    );

    Animated.stagger(100, animations).start();
  }, [goals]);

  const getGoalIcon = (type: string) => {
    switch (type) {
      case 'streak': return 'fire';
      case 'daily_quizzes': return 'check-circle';
      case 'category_completion': return 'book-open-variant';
      case 'score_improvement': return 'trending-up';
      default: return 'target';
    }
  };

  const getGoalColor = (type: string, completed: boolean) => {
    if (completed) return '#4CAF50';
    
    switch (type) {
      case 'streak': return '#FF6B35';
      case 'daily_quizzes': return '#2196F3';
      case 'category_completion': return '#9C27B0';
      case 'score_improvement': return '#FF9800';
      default: return '#666';
    }
  };

  const formatDeadline = (deadline?: Date) => {
    if (!deadline) return null;
    
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Expiré';
    if (diffDays === 0) return 'Aujourd\'hui';
    if (diffDays === 1) return 'Demain';
    if (diffDays < 7) return `${diffDays} jours`;
    return `${Math.ceil(diffDays / 7)} semaines`;
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const renderGoalItem = ({ item, index }: { item: UserGoal; index: number }) => {
    const progressPercentage = getProgressPercentage(item.current, item.target);
    const color = getGoalColor(item.type, item.completed);
    const deadline = formatDeadline(item.deadline);

    return (
      <Animated.View
        style={[
          styles.goalItem,
          {
            opacity: animatedValues[index] || new Animated.Value(1),
            transform: [{
              translateY: (animatedValues[index] || new Animated.Value(1)).interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0],
              })
            }]
          }
        ]}
      >
        <TouchableOpacity
          style={[
            styles.goalContent,
            item.completed && styles.completedGoal
          ]}
          onPress={() => onGoalPress?.(item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.goalHeader}>
            <View style={styles.goalInfo}>
              <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
                <MaterialCommunityIcons
                  name={getGoalIcon(item.type) as any}
                  size={20}
                  color={color}
                />
              </View>
              <View style={styles.goalText}>
                <Text style={[styles.goalTitle, item.completed && styles.completedText]}>
                  {item.title}
                </Text>
                <Text style={styles.goalDescription} numberOfLines={2}>
                  {item.description}
                </Text>
              </View>
            </View>
            {item.completed && (
              <MaterialCommunityIcons
                name="check-circle"
                size={24}
                color="#4CAF50"
              />
            )}
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressText}>
                {item.current} / {item.target}
              </Text>
              <Text style={[styles.progressPercentage, { color }]}>
                {Math.round(progressPercentage)}%
              </Text>
            </View>
            
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <Animated.View
                  style={[
                    styles.progressBarFill,
                    {
                      backgroundColor: color,
                      width: `${progressPercentage}%`
                    }
                  ]}
                />
              </View>
            </View>
          </View>

          {deadline && (
            <View style={styles.deadlineContainer}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={14}
                color="#666"
              />
              <Text style={styles.deadlineText}>
                {deadline === 'Expiré' ? 'Objectif expiré' : `Échéance: ${deadline}`}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
      <LinearGradient
        colors={['#fff', '#f8f9fa']}
        style={styles.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <MaterialCommunityIcons name="target" size={24} color="#FF9800" />
            <Text style={styles.title}>Mes objectifs</Text>
          </View>
          {onAddGoalPress && (
            <TouchableOpacity onPress={onAddGoalPress} style={styles.addButton}>
              <MaterialCommunityIcons name="plus" size={20} color="#2196F3" />
              <Text style={styles.addButtonText}>Ajouter</Text>
            </TouchableOpacity>
          )}
        </View>

        {goals.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="target" size={48} color="#ccc" />
            <Text style={styles.emptyText}>Aucun objectif défini</Text>
            <Text style={styles.emptySubtext}>
              Créez des objectifs pour suivre vos progrès
            </Text>
            {onAddGoalPress && (
              <TouchableOpacity onPress={onAddGoalPress} style={styles.createGoalButton}>
                <Text style={styles.createGoalText}>Créer un objectif</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            <View style={styles.summaryStats}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>
                  {goals.filter(g => g.completed).length}
                </Text>
                <Text style={styles.summaryLabel}>Complétés</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>
                  {goals.filter(g => !g.completed).length}
                </Text>
                <Text style={styles.summaryLabel}>En cours</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>
                  {Math.round(
                    goals.reduce((sum, goal) => sum + getProgressPercentage(goal.current, goal.target), 0) / goals.length
                  )}%
                </Text>
                <Text style={styles.summaryLabel}>Progression</Text>
              </View>
            </View>

            <FlatList
              data={goals}
              renderItem={renderGoalItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
            />
          </>
        )}
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    marginHorizontal: 16,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addButtonText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
    marginLeft: 4,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
  },
  goalItem: {
    marginBottom: 12,
  },
  goalContent: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  completedGoal: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  goalInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  goalText: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#666',
  },
  goalDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  progressSection: {
    marginBottom: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarBackground: {
    flex: 1,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  deadlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  deadlineText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 16,
  },
  createGoalButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  createGoalText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
});
