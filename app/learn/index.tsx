import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Image, Text, TouchableOpacity } from 'react-native';
import { Header } from '../../components/layout/Header';
import { DailyObjectives } from '../../components/layout/DailyObjectives';
import { CategoryCard } from '../../components/game/CategoryCard';
import { useRouter } from 'expo-router';
import BottomTabBar from '@/components/navigation/BottomTabBar';
import SharedTransition from '@/components/navigation/SharedTransition';
import Colors from '@/constants/Colors';
import { useThemeMode } from '@/context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

const screenWidth = Dimensions.get('window').width;

interface Category {
  id: string;
  title: string;
  progress: number;
  color: string;
  image: any;
  isNew?: boolean;
  locked?: boolean;
}

export default function LearnScreen() {
  const { theme } = useThemeMode();
  const router = useRouter();
  const { language } = useLanguage();
  
  // Étoiles et cœurs (à connecter à un state global plus tard)
  const totalStars = 520;
  const hearts = 5;

  // Daily objectives definition
  const dailyObjectives = [
    { id: '1', title: language === 'fr' ? 'Quiz du jour' : 'Daily quiz', completed: true },
    { id: '2', title: language === 'fr' ? 'Lecture santé' : 'Health reading', completed: false },
  ];

  const categories: Category[] = [
    { 
      id: '1', 
      title: language === 'fr' ? 'Troubles de la Digestion' : 'Digestive Disorders',
      progress: 75, 
      color: '#FF9800', 
      image: require('../../assets/images/nutrition.png')
    },
    { 
      id: '2', 
      title: language === 'fr' ? 'Infections et Virus' : 'Infections and Viruses',
      progress: 45, 
      color: '#F44336', 
      image: require('../../assets/images/infections_virus.png')
    },
    { 
      id: '3', 
      title: language === 'fr' ? 'Problèmes du Cerveau' : 'Brain Issues',
      progress: 30, 
      color: '#2196F3', 
      image: require('../../assets/images/cerveau.png')
    },
    { 
      id: '5', 
      title: language === 'fr' ? 'Problèmes de Respiration' : 'Breathing Issues',
      progress: 60, 
      color: '#9C27B0', 
      image: require('../../assets/images/respiration.png')
    },
    { 
      id: '6', 
      title: language === 'fr' ? 'Maladies du Sang' : 'Blood Diseases',
      progress: 20, 
      color: '#607D8B', 
      image: require('../../assets/images/sang.png')
    },
    { 
      id: '7', 
      title: language === 'fr' ? 'Santé du Cœur' : 'Heart Health',
      progress: 55, 
      color: '#795548', 
      image: require('../../assets/images/nutrition.png')
    },
    { 
      id: '4', 
      title: language === 'fr' ? 'Défenses Immunitaires' : 'Immune Defenses',
      progress: 0, 
      color: '#4CAF50', 
      image: require('../../assets/images/defenses_immunitaires.png'),
      isNew: true
    },
    { 
      id: '8', 
      title: language === 'fr' ? 'Os et Muscles' : 'Bones and Muscles',
      progress: 0, 
      color: '#3F51B5', 
      image: require('../../assets/images/muscles.png'),
      isNew: true
    },
    { 
      id: '9', 
      title: language === 'fr' ? 'Problèmes de Peau' : 'Skin Problems',
      progress: 0, 
      color: '#4CAF50', 
      image: require('../../assets/images/peau.jpg'),
      isNew: true
    },
    { 
      id: '10', 
      title: language === 'fr' ? 'Problèmes Hormonaux' : 'Hormonal Problems',
      progress: 0, 
      color: '#FF9800', 
      image: require('../../assets/images/hormonaux.jpg'),
      isNew: true
    },
  ];

  // Fonction pour diviser les catégories en paires pour le rendu en rangées
  const renderCategoryRows = (categories: Category[]) => {
    const rows = [];
    for (let i = 0; i < categories.length; i += 2) {
      const leftCategory = categories[i];
      const rightCategory = categories[i + 1];
      
      rows.push(
        <View key={`row-${i}`} style={styles.categoriesRow}>
          <View style={styles.categoryItem}>
            <CategoryCard
              title={leftCategory.title}
              progress={leftCategory.progress}
              color={leftCategory.color}
              image={leftCategory.image}
              onPress={() => console.log(`Catégorie ${leftCategory.title} sélectionnée`)}
              isNew={leftCategory.isNew}
              locked={leftCategory.locked}
            />
          </View>
          
          {rightCategory && (
            <View style={styles.categoryItem}>
              <CategoryCard
                title={rightCategory.title}
                progress={rightCategory.progress}
                color={rightCategory.color}
                image={rightCategory.image}
                onPress={() => console.log(`Catégorie ${rightCategory.title} sélectionnée`)}
                isNew={rightCategory.isNew}
                locked={rightCategory.locked}
              />
            </View>
          )}
        </View>
      );
    }
    
    return rows;
  };

  return (
    <SharedTransition transitionKey="learn-screen">
      <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
        <Header 
          xp={totalStars} 
          hearts={hearts} 
          title={language === 'fr' ? 'MEDUCARE' : 'MEDUCARE'}
          levelLabel={language === 'fr' ? 'Niveau' : 'Level'}
        />
        <ScrollView 
          style={[styles.scrollView, { backgroundColor: Colors[theme].background }]}
          contentContainerStyle={[styles.scrollViewContent, { backgroundColor: Colors[theme].background }]}
        >
          <View style={{ marginHorizontal: 15, marginTop: 10, marginBottom: 10 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 16, color: Colors[theme].text }}>
              {language === 'fr' ? 'Objectifs du jour' : 'Daily objectives'}
            </Text>
          </View>
          <DailyObjectives objectives={dailyObjectives} />
          <View style={[styles.sectionHeader, { backgroundColor: 'transparent' }]}>
            <Text style={[styles.sectionTitle, { color: Colors[theme].text }]}>{language === 'fr' ? 'Catégories' : 'Categories'}</Text>
          </View>
          
          <View style={[styles.categoriesContainer, { backgroundColor: Colors[theme].background }]}>
            {renderCategoryRows(categories)}
          </View>
        </ScrollView>
        <BottomTabBar />
      </View>
    </SharedTransition>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 80, // Ajoute un espace en bas pour dépasser la barre de navigation
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 20,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAllButton: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoriesContainer: {
    paddingHorizontal: 15,
    paddingTop: 5,
    paddingBottom: 30,
  },
  categoriesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  categoryItem: {
    width: (screenWidth - 40) / 2,  // Largeur identique basée sur la largeur de l'écran
  },
  navigationBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIcon: {
    width: 22,
    height: 22,
    marginBottom: 4,
    resizeMode: 'contain',
  },
  navText: {
    fontSize: 12,
    color: '#666',
  },
  activeNavItem: {
    // Styles pour l'élément actif de la navigation
  },
  activeNavText: {
    color: '#4C66EF',
    fontWeight: 'bold',
  },
}); 