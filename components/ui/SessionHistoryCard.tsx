import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface SessionHistoryItem {
  sessionId: string;
  date: Date;
  duration: number; // en minutes
  quizzesCompleted: number;
  averageScore: number;
  categoriesStudied: string[];
  xpGained: number;
}

interface SessionHistoryCardProps {
  sessions: SessionHistoryItem[];
  onSessionPress?: (sessionId: string) => void;
  onViewAllPress?: () => void;
}

export default function SessionHistoryCard({
  sessions,
  onSessionPress,
  onViewAllPress
}: SessionHistoryCardProps) {
  const animatedValues = useRef(sessions.map(() => new Animated.Value(0))).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    // Animation d'entrée
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Animation des sessions
    const animations = animatedValues.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 600,
        delay: index * 100,
        useNativeDriver: false,
      })
    );

    Animated.stagger(50, animations).start();
  }, [sessions]);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Hier';
    if (diffDays === 0) return 'Aujourd\'hui';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
    });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h${remainingMinutes}min` : `${hours}h`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#4CAF50';
    if (score >= 80) return '#8BC34A';
    if (score >= 70) return '#FF9800';
    if (score >= 60) return '#FF5722';
    return '#F44336';
  };

  const getCategoryNames = (categoryIds: string[]) => {
    const categoryNames: Record<string, string> = {
      'anatomie': 'Anatomie',
      'physiologie': 'Physiologie',
      'pathologie': 'Pathologie',
      'pharmacologie': 'Pharmacologie',
      'cardiologie': 'Cardiologie'
    };
    
    return categoryIds.map(id => categoryNames[id] || id).join(', ');
  };

  const renderSessionItem = ({ item, index }: { item: SessionHistoryItem; index: number }) => (
    <Animated.View
      style={[
        styles.sessionItem,
        {
          opacity: animatedValues[index] || new Animated.Value(1),
          transform: [{
            translateX: (animatedValues[index] || new Animated.Value(1)).interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0],
            })
          }]
        }
      ]}
    >
      <TouchableOpacity
        style={styles.sessionContent}
        onPress={() => onSessionPress?.(item.sessionId)}
        activeOpacity={0.7}
      >
        <View style={styles.sessionHeader}>
          <View style={styles.sessionDate}>
            <MaterialCommunityIcons
              name="calendar"
              size={16}
              color="#666"
            />
            <Text style={styles.dateText}>{formatDate(item.date)}</Text>
          </View>
          <View style={styles.sessionDuration}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={16}
              color="#666"
            />
            <Text style={styles.durationText}>{formatDuration(item.duration)}</Text>
          </View>
        </View>

        <View style={styles.sessionStats}>
          <View style={styles.statGroup}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons
                name="check-circle"
                size={18}
                color="#4CAF50"
              />
              <Text style={styles.statValue}>{item.quizzesCompleted}</Text>
              <Text style={styles.statLabel}>Quiz</Text>
            </View>

            <View style={styles.statItem}>
              <MaterialCommunityIcons
                name="target"
                size={18}
                color={getScoreColor(item.averageScore)}
              />
              <Text style={[styles.statValue, { color: getScoreColor(item.averageScore) }]}>
                {item.averageScore}%
              </Text>
              <Text style={styles.statLabel}>Score</Text>
            </View>

            <View style={styles.statItem}>
              <MaterialCommunityIcons
                name="star"
                size={18}
                color="#9C27B0"
              />
              <Text style={styles.statValue}>{item.xpGained}</Text>
              <Text style={styles.statLabel}>XP</Text>
            </View>
          </View>
        </View>

        <View style={styles.categoriesSection}>
          <Text style={styles.categoriesLabel}>Catégories étudiées:</Text>
          <Text style={styles.categoriesText} numberOfLines={1}>
            {getCategoryNames(item.categoriesStudied)}
          </Text>
        </View>

        <View style={styles.sessionFooter}>
          <View style={styles.performanceIndicator}>
            <View style={[
              styles.performanceBar,
              { backgroundColor: getScoreColor(item.averageScore) + '20' }
            ]}>
              <View style={[
                styles.performanceFill,
                {
                  backgroundColor: getScoreColor(item.averageScore),
                  width: `${item.averageScore}%`
                }
              ]} />
            </View>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color="#666"
          />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  if (!sessions || sessions.length === 0) {
    return (
      <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
        <LinearGradient
          colors={['#fff', '#f8f9fa']}
          style={styles.card}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.header}>
            <MaterialCommunityIcons name="history" size={24} color="#666" />
            <Text style={styles.title}>Historique des sessions</Text>
          </View>
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="book-open-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>Aucune session d'apprentissage</Text>
            <Text style={styles.emptySubtext}>
              Commencez un quiz pour voir votre historique ici
            </Text>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  }

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
            <MaterialCommunityIcons name="history" size={24} color="#2196F3" />
            <Text style={styles.title}>Historique des sessions</Text>
          </View>
          {onViewAllPress && (
            <TouchableOpacity onPress={onViewAllPress} style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>Voir tout</Text>
              <MaterialCommunityIcons name="chevron-right" size={16} color="#2196F3" />
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={sessions.slice(0, 5)} // Limiter à 5 sessions récentes
          renderItem={renderSessionItem}
          keyExtractor={(item) => item.sessionId}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
        />
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
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
    marginRight: 4,
  },
  sessionItem: {
    marginBottom: 12,
  },
  sessionContent: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionDate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    fontWeight: '500',
  },
  sessionDuration: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  sessionStats: {
    marginBottom: 12,
  },
  statGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  categoriesSection: {
    marginBottom: 12,
  },
  categoriesLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  categoriesText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  sessionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  performanceIndicator: {
    flex: 1,
    marginRight: 12,
  },
  performanceBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  performanceFill: {
    height: '100%',
    borderRadius: 3,
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
  },
});
