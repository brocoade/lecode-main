import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface LeaderboardEntry {
  rank: number;
  username: string; // Anonymisé
  score: number;
  streak: number;
  isCurrentUser?: boolean;
  badge?: string;
}

interface LeaderboardCardProps {
  leaderboard: LeaderboardEntry[];
  currentUserEntry?: LeaderboardEntry;
  onViewFullLeaderboard?: () => void;
  title?: string;
}

export default function LeaderboardCard({
  leaderboard,
  currentUserEntry,
  onViewFullLeaderboard,
  title = "Top 10 - Cette semaine"
}: LeaderboardCardProps) {
  const animatedValues = useRef(leaderboard.map(() => new Animated.Value(0))).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    // Animation d'entrée
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Animation des entrées du leaderboard
    const animations = animatedValues.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 600,
        delay: index * 100,
        useNativeDriver: false,
      })
    );

    Animated.stagger(50, animations).start();
  }, [leaderboard]);

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return '#FFD700'; // Or
      case 2: return '#C0C0C0'; // Argent
      case 3: return '#CD7F32'; // Bronze
      default: return '#666';
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return 'crown';
      case 2: return 'medal';
      case 3: return 'trophy-variant';
      default: return null;
    }
  };

  const getBadgeInfo = (badge?: string) => {
    switch (badge) {
      case 'streak_master':
        return { icon: 'fire', color: '#FF6B35', label: 'Maître du Streak' };
      case 'quiz_champion':
        return { icon: 'trophy', color: '#FFD700', label: 'Champion Quiz' };
      case 'rising_star':
        return { icon: 'star', color: '#9C27B0', label: 'Étoile Montante' };
      case 'consistent_learner':
        return { icon: 'check-circle', color: '#4CAF50', label: 'Apprenant Régulier' };
      default:
        return null;
    }
  };

  const renderLeaderboardItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    const rankColor = getRankColor(item.rank);
    const rankIcon = getRankIcon(item.rank);
    const badgeInfo = getBadgeInfo(item.badge);

    return (
      <Animated.View
        style={[
          styles.leaderboardItem,
          item.isCurrentUser && styles.currentUserItem,
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
        <View style={styles.itemContent}>
          {/* Rang */}
          <View style={styles.rankContainer}>
            {rankIcon ? (
              <MaterialCommunityIcons
                name={rankIcon as any}
                size={24}
                color={rankColor}
              />
            ) : (
              <Text style={[styles.rankText, { color: rankColor }]}>
                #{item.rank}
              </Text>
            )}
          </View>

          {/* Informations utilisateur */}
          <View style={styles.userInfo}>
            <View style={styles.userHeader}>
              <Text style={[
                styles.username,
                item.isCurrentUser && styles.currentUserText
              ]}>
                {item.isCurrentUser ? 'Vous' : item.username}
              </Text>
              {badgeInfo && (
                <View style={[styles.badge, { backgroundColor: badgeInfo.color + '20' }]}>
                  <MaterialCommunityIcons
                    name={badgeInfo.icon as any}
                    size={12}
                    color={badgeInfo.color}
                  />
                </View>
              )}
            </View>
            {badgeInfo && (
              <Text style={styles.badgeLabel}>{badgeInfo.label}</Text>
            )}
          </View>

          {/* Statistiques */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="target" size={16} color="#2196F3" />
              <Text style={styles.statValue}>{item.score}%</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="fire" size={16} color="#FF6B35" />
              <Text style={styles.statValue}>{item.streak}</Text>
            </View>
          </View>

          {/* Indicateur utilisateur actuel */}
          {item.isCurrentUser && (
            <View style={styles.currentUserIndicator}>
              <MaterialCommunityIcons name="account" size={16} color="#2196F3" />
            </View>
          )}
        </View>
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
            <MaterialCommunityIcons name="trophy" size={24} color="#FFD700" />
            <Text style={styles.title}>{title}</Text>
          </View>
          {onViewFullLeaderboard && (
            <TouchableOpacity onPress={onViewFullLeaderboard} style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>Voir tout</Text>
              <MaterialCommunityIcons name="chevron-right" size={16} color="#2196F3" />
            </TouchableOpacity>
          )}
        </View>

        {/* Podium pour le top 3 */}
        {leaderboard.length >= 3 && (
          <View style={styles.podiumContainer}>
            <View style={styles.podium}>
              {/* 2ème place */}
              <View style={[styles.podiumPlace, styles.secondPlace]}>
                <MaterialCommunityIcons name="medal" size={20} color="#C0C0C0" />
                <Text style={styles.podiumRank}>2</Text>
                <Text style={styles.podiumName} numberOfLines={1}>
                  {leaderboard[1]?.isCurrentUser ? 'Vous' : leaderboard[1]?.username}
                </Text>
                <Text style={styles.podiumScore}>{leaderboard[1]?.score}%</Text>
              </View>

              {/* 1ère place */}
              <View style={[styles.podiumPlace, styles.firstPlace]}>
                <MaterialCommunityIcons name="crown" size={24} color="#FFD700" />
                <Text style={styles.podiumRank}>1</Text>
                <Text style={styles.podiumName} numberOfLines={1}>
                  {leaderboard[0]?.isCurrentUser ? 'Vous' : leaderboard[0]?.username}
                </Text>
                <Text style={styles.podiumScore}>{leaderboard[0]?.score}%</Text>
              </View>

              {/* 3ème place */}
              <View style={[styles.podiumPlace, styles.thirdPlace]}>
                <MaterialCommunityIcons name="trophy-variant" size={18} color="#CD7F32" />
                <Text style={styles.podiumRank}>3</Text>
                <Text style={styles.podiumName} numberOfLines={1}>
                  {leaderboard[2]?.isCurrentUser ? 'Vous' : leaderboard[2]?.username}
                </Text>
                <Text style={styles.podiumScore}>{leaderboard[2]?.score}%</Text>
              </View>
            </View>
          </View>
        )}

        {/* Liste complète */}
        <View style={styles.listContainer}>
          <Text style={styles.listTitle}>Classement complet</Text>
          <FlatList
            data={leaderboard}
            renderItem={renderLeaderboardItem}
            keyExtractor={(item) => item.rank.toString()}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
          />
        </View>

        {/* Position de l'utilisateur actuel si pas dans le top */}
        {currentUserEntry && !leaderboard.some(entry => entry.isCurrentUser) && (
          <View style={styles.currentUserSection}>
            <View style={styles.separator}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>Votre position</Text>
              <View style={styles.separatorLine} />
            </View>
            {renderLeaderboardItem({ item: currentUserEntry, index: 0 })}
          </View>
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
  podiumContainer: {
    marginBottom: 20,
  },
  podium: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    height: 120,
  },
  podiumPlace: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 4,
    minWidth: 80,
  },
  firstPlace: {
    backgroundColor: '#FFD700' + '20',
    height: 100,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  secondPlace: {
    backgroundColor: '#C0C0C0' + '20',
    height: 80,
    borderWidth: 2,
    borderColor: '#C0C0C0',
  },
  thirdPlace: {
    backgroundColor: '#CD7F32' + '20',
    height: 70,
    borderWidth: 2,
    borderColor: '#CD7F32',
  },
  podiumRank: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  podiumName: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  podiumScore: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 2,
  },
  listContainer: {
    marginTop: 8,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  leaderboardItem: {
    marginBottom: 8,
  },
  currentUserItem: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  currentUserText: {
    color: '#2196F3',
  },
  badge: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 4,
  },
  currentUserIndicator: {
    marginLeft: 8,
  },
  currentUserSection: {
    marginTop: 16,
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  separatorText: {
    fontSize: 12,
    color: '#666',
    marginHorizontal: 12,
  },
});
