import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useThemeMode } from '@/context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

interface CategoryCardProps {
  title: string;
  progress: number;
  color: string;
  image: any;
  onPress: () => void;
  isNew?: boolean;
  locked?: boolean;
  completed?: boolean;
  allCompleted?: boolean;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ 
  title, 
  progress, 
  color, 
  image, 
  onPress, 
  isNew = false,
  locked = false,
  completed = false,
  allCompleted = false
}) => {
  const { theme } = useThemeMode();
  const { language } = useLanguage();
  let statusIcon = null;
  let statusText = '';
  
  if (locked) {
    statusIcon = '��';
    statusText = language === 'fr' ? 'Verrouillé' : 'Locked';
  } else if (completed) {
    statusIcon = '✅';
    statusText = `${progress}% ${language === 'fr' ? 'complété' : 'completed'}`;
  } else {
    statusIcon = '📖';
    statusText = language === 'fr' ? 'Débloqué' : 'Unlocked';
  }
  

  
  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: Colors[theme].card }]}
      onPress={onPress}
      disabled={locked}
    >
      <View style={[styles.colorBand, { backgroundColor: color }]} />
      
      {isNew && (
        <View style={styles.newBadge}>
          <Text style={styles.newBadgeText}>{language === 'fr' ? 'NOUVEAU' : 'NEW'}</Text>
        </View>
      )}
      
      {locked && (
        <View style={styles.lockOverlay}>
          <Text style={styles.lockIcon}>{statusIcon}</Text>
        </View>
      )}
      
      {!locked && (
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{statusIcon}</Text>
        </View>
      )}
      
      {allCompleted && (
        <View style={styles.trophyBadge}>
          <Text style={styles.trophyText}>🏆</Text>
        </View>
      )}
      
      <View style={styles.contentContainer}>
        <View style={styles.iconSection}>
          <View style={[styles.iconContainer, { backgroundColor: `${color}20`, borderColor: Colors[theme].card }]}>
            <Image 
              source={image} 
              style={styles.image}
              resizeMode="contain"
            />
          </View>
        </View>
        
        <View style={styles.textSection}>
          <Text style={[styles.title, { color: Colors[theme].text }]} numberOfLines={2}>{title}</Text>
        </View>
        

      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    position: 'relative',
    padding: 15,
    height: 180,
    justifyContent: 'space-between',
  },
  colorBand: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    zIndex: 1,
  },
  contentContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'space-between',
  },
  iconSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 0,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  image: {
    width: '90%',
    height: '90%',
  },
  textSection: {
    marginVertical: 8,
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },

  newBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FFC107',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    zIndex: 10,
  },
  newBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
    borderRadius: 15,
  },
  lockIcon: {
    fontSize: 40,
  },
  statusBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },
  statusText: {
    fontSize: 16,
  },
  trophyBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 10,
  },
  trophyText: {
    fontSize: 18,
  }
});