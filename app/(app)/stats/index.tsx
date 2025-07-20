import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import MetricCard from '@/components/ui/MetricCard';
import WeeklyActivityChart from '@/components/ui/WeeklyActivityChart';
import BadgeCard from '@/components/ui/BadgeCard';

import SharedTransition from '@/components/navigation/SharedTransition';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc, updateDoc, increment, arrayUnion, setDoc } from 'firebase/firestore';
import { firebaseDB } from '@/backend/config/firebase.config';
import { realStatsService, RealUserStats } from '@/app/services/realStats.service';

export default function StatsScreen() {
  const { user } = useAuth();
  const [realStats, setRealStats] = useState<RealUserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);




  // 📊 NOUVELLES FONCTIONS : Utiliser les vraies statistiques
  const getAccuracyValue = (): number => {
    return realStats ? Math.round(realStats.accuracyPercentage) : 0;
  };

  const getAverageTimeValue = (): number => {
    return realStats ? Math.round(realStats.averageTimeSeconds) : 0;
  };



  // 📊 Charger les vraies statistiques depuis Firebase
  useEffect(() => {
    const loadRealStats = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const stats = await realStatsService.getRealUserStats();
        setRealStats(stats);
      } catch (error) {
        console.error('❌ Erreur lors du chargement des statistiques:', error);
        setError('Erreur lors du chargement des statistiques');
      } finally {
        setLoading(false);
      }
    };

    loadRealStats();
  }, [user]);

  // 📊 Métriques basées sur les vraies données Firebase
  const metriques = [
    {
      icon: '🔥',
      value: realStats?.currentStreak || 0,
      label: 'Jours de suite',
      color: '#FF6B35'
    },
    {
      icon: '✅',
      value: realStats?.totalQuizzes || 0,
      label: 'Quiz complétés',
      color: '#4CAF50'
    },
    {
      icon: '🎯',
      value: getAccuracyValue(),
      label: 'Précision (%)',
      color: '#2196F3'
    },
    {
      icon: '⚡',
      value: getAverageTimeValue(),
      label: 'Temps moyen (s)',
      color: '#FF9800'
    }
  ];

  // 📈 NOUVELLE ACTIVITÉ HEBDOMADAIRE : Basée sur les vraies données
  const weeklyActivity = realStats?.weeklyActivity || [];

  // 🏆 NOUVEAUX BADGES : Basés sur les vraies statistiques
  const badges = [
    { id: 'quiz_master', icon: '🏆', name: 'Quiz Master', condition: 'totalQuiz >= 100', earned: (realStats?.totalQuizzes || 0) >= 100 },
    { id: 'speed_runner', icon: '⚡', name: 'Speed Runner', condition: 'avgTime < 60s', earned: (realStats?.averageTimeSeconds || 999) < 60 },
    { id: 'perfectionist', icon: '🎯', name: 'Perfectionniste', condition: 'accuracy >= 90%', earned: (realStats?.accuracyPercentage || 0) >= 90 },
    { id: 'explorer', icon: '🌟', name: 'Explorateur', condition: 'totalQuiz >= 10', earned: (realStats?.totalQuizzes || 0) >= 10 },
    { id: 'streak_legend', icon: '🔥', name: 'Streak Legend', condition: 'maxStreak >= 7', earned: (realStats?.bestStreak || 0) >= 7 },
    { id: 'champion', icon: '👑', name: 'Champion', condition: 'totalQuiz >= 50', earned: (realStats?.totalQuizzes || 0) >= 50 }
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>📊 Chargement des statistiques...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>❌ {error}</Text>

        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setError(null);
            setLoading(true);
            realStatsService.clearCache();
            // Relancer le useEffect
            if (user) {
              realStatsService.getRealUserStats()
                .then(setRealStats)
                .catch(err => setError('Erreur lors du chargement'))
                .finally(() => setLoading(false));
            }
          }}
        >
          <Text style={styles.retryButtonText}>🔄 Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SharedTransition>
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>📊 Statistiques</Text>
            <Text style={styles.subtitle}>Vos performances en temps réel</Text>
          </View>

          {/* 📊 Métriques principales avec VRAIES données Firebase */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Mes statistiques</Text>
            {realStats && (
              <Text style={styles.lastUpdated}>
                Dernière mise à jour: {realStats.lastUpdated.toLocaleTimeString()}
              </Text>
            )}
            


            <View style={styles.metricsGrid}>
              {metriques.map((metric, index) => (
                <MetricCard
                  key={index}
                  icon={metric.icon}
                  value={metric.value}
                  label={metric.label}
                  color={metric.color}
                />
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📈 Activité hebdomadaire</Text>
            {weeklyActivity.length > 0 ? (
              <WeeklyActivityChart data={weeklyActivity} />
            ) : (
              <Text style={styles.noDataText}>Aucune activité cette semaine</Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏆 Badges</Text>
            <View style={styles.badgesGrid}>
              {badges.map((badge) => (
                <BadgeCard
                  key={badge.id}
                  icon={badge.icon}
                  name={badge.name}
                  condition={badge.condition}
                  earned={badge.earned}
                />
              ))}
            </View>
          </View>
        </ScrollView>
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
    paddingBottom: 100,
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 20,
    paddingTop: 50,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 5,
  },
  section: {
    margin: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#FF5722',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 12,
  },
  noDataText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 20,
  },
});
