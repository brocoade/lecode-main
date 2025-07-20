import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HeartsService } from '@/app/services/hearts.service';

interface HeartDisplayProps {
  remainingHearts: number;
  maxHearts: number;
  showRegenerationTimer?: boolean;
}

export const HeartDisplay: React.FC<HeartDisplayProps> = ({ 
  remainingHearts, 
  maxHearts = 5,
  showRegenerationTimer = true
}) => {
  const [timer, setTimer] = useState<string>('');
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [showBubble, setShowBubble] = useState<boolean>(false);
  const bubbleOpacity = useRef(new Animated.Value(0)).current;
  const bubbleScale = useRef(new Animated.Value(0.5)).current;
  const heartsService = new HeartsService();
  
  // Timer pour afficher automatiquement la bulle toutes les 10 minutes
  const autoBubbleTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Mettre à jour le timer de régénération
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const updateTimer = async () => {
      if (remainingHearts < maxHearts) {
        const timeUntilNextHeart = await heartsService.getTimeUntilNextHeart();
        if (timeUntilNextHeart > 0) {
          setIsRegenerating(true);
          const formattedTime = await heartsService.getFormattedTimeUntilNextHeart();
          setTimer(formattedTime);
        } else {
          setIsRegenerating(false);
          setTimer('');
        }
      } else {
        setIsRegenerating(false);
        setTimer('');
      }
    };
    
    // Appeler initialement
    updateTimer();
    
    // Mettre à jour toutes les secondes si des cœurs manquent pour un décompte en temps réel
    if (remainingHearts < maxHearts) {
      interval = setInterval(updateTimer, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [remainingHearts, maxHearts]);
  
  // Effet pour configurer le timer qui affiche automatiquement la bulle toutes les 10 minutes
  useEffect(() => {
    // Démarrer le timer uniquement si des cœurs sont en régénération
    if (isRegenerating) {
      // Nettoyer tout timer précédent
      if (autoBubbleTimerRef.current) {
        clearTimeout(autoBubbleTimerRef.current);
      }
      
      // Configurer un nouveau timer pour afficher la bulle toutes les 10 minutes (600000 ms)
      autoBubbleTimerRef.current = setInterval(() => {
        if (isRegenerating) {
          showBubbleMessage();
          
          // La bulle disparaîtra automatiquement après 5 secondes
          setTimeout(() => {
            hideBubbleMessage();
          }, 5000);
        }
      }, 600000); // 10 minutes
      
      // Afficher automatiquement la bulle lors du démarrage de la régénération
      showBubbleMessage();
      setTimeout(() => {
        hideBubbleMessage();
      }, 5000);
    }
    
    return () => {
      if (autoBubbleTimerRef.current) {
        clearInterval(autoBubbleTimerRef.current);
      }
    };
  }, [isRegenerating]);

  // Fonction pour afficher la bulle avec animation
  const showBubbleMessage = () => {
    setShowBubble(true);
    Animated.parallel([
      Animated.timing(bubbleOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(bubbleScale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Fonction pour cacher la bulle avec animation
  const hideBubbleMessage = () => {
    Animated.parallel([
      Animated.timing(bubbleOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(bubbleScale, {
        toValue: 0.5,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setShowBubble(false));
  };

  // Gérer le clic sur le compteur de cœurs
  const handleHeartPress = () => {
    if (isRegenerating && timer) {
      if (showBubble) {
        hideBubbleMessage();
      } else {
        showBubbleMessage();
      }
    }
  };
  
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.heartsContainer}
        onPress={handleHeartPress}
        activeOpacity={0.7}
        disabled={!isRegenerating || !timer}
      >
        <Ionicons 
          name="heart" 
          size={24} 
          color={remainingHearts > 0 ? "#FF6B6B" : "#ccc"}
          style={styles.heartIcon} 
        />
        <Text style={styles.heartCount}>{remainingHearts}</Text>
        
        {/* Petit indicateur de notification si régénération en cours */}
        {isRegenerating && !showBubble && (
          <View style={styles.notificationDot} />
        )}
      </TouchableOpacity>
      
      {/* Bulle de dialogue style Messenger */}
      {showBubble && isRegenerating && timer && (
        <Animated.View 
          style={[
            styles.messageBubble,
            {
              opacity: bubbleOpacity,
              transform: [{ scale: bubbleScale }]
            }
          ]}
        >
          <View style={styles.bubbleHeader}>
            <Text style={styles.bubbleTitle}>Régénération en cours</Text>
      </View>
      
          <View style={styles.bubbleContent}>
            <Ionicons name="time-outline" size={16} color="#FFF" style={styles.timerIcon} />
            <Text style={styles.bubbleText}>
              Prochaine vie dans: {timer}
          </Text>
        </View>
          <View style={styles.bubbleArrow} />
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    position: 'relative',
  },
  heartsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
    position: 'relative',
  },
  heartIcon: {
    marginRight: 5,
  },
  heartCount: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  notificationDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B6B',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  messageBubble: {
    position: 'absolute',
    top: '100%',
    right: 0,
    backgroundColor: '#333',
    borderRadius: 18,
    padding: 12,
    marginTop: 10,
    zIndex: 1000,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bubbleHeader: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    paddingBottom: 8,
    marginBottom: 8,
  },
  bubbleTitle: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  bubbleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleArrow: {
    position: 'absolute',
    top: -10,
    right: 15,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#333',
  },
  bubbleText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  timerIcon: {
    marginRight: 5,
  },
  timerContainer: {
    marginTop: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  timerText: {
    fontSize: 12,
    color: '#757575',
  }
}); 