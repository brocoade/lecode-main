import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { DailyObjectives } from '../../../components/layout/DailyObjectives';
import { CategoryCard } from '../../../components/game/CategoryCard';
import { useRouter } from 'expo-router';
import SharedTransition from '@/components/navigation/SharedTransition';
import { getCategories } from '../../services/diseaseService';
import Ionicons from '@expo/vector-icons/Ionicons';

const screenWidth = Dimensions.get('window').width;

interface Category {
  id: string;
  firebaseDocId: string;
  title: string;
  progress: number;
  color: string;
  image: any;
  isNew?: boolean;
  locked?: boolean;
}

// Mapping des images locales par id de catégorie
const categoryImages: Record<string, any> = {
  '1': require('../../../assets/images/nutrition.png'),
  '2': require('../../../assets/images/infections_virus.png'),
  '3': require('../../../assets/images/respiration.png'),
  '4': require('../../../assets/images/coeurs.png'),
  '5': require('../../../assets/images/peau.jpg'),
  '6': require('../../../assets/images/cerveau.png'),
  '7': require('../../../assets/images/defenses_immunitaires.png'),
  '8': require('../../../assets/images/sang.png'),
  '9': require('../../../assets/images/muscles.png'),
  '10': require('../../../assets/images/hormonaux.jpg'),
};

export default function LearnScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Daily objectives definition
  const dailyObjectives = [
    { id: '1', title: 'Quiz du jour', completed: true },
    { id: '2', title: 'Lecture santé', completed: false },
  ];

  useEffect(() => {
    async function fetchCategories() {
      setLoading(true);
      const data = await getCategories();
      console.log('Categories fetched from Firebase:', data);
      // On mappe les images locales
      const categoriesWithImages = data.map((cat: any) => ({
        ...cat,
        image: categoryImages[cat.id] || null,
      }));
      setCategories(categoriesWithImages);
      setLoading(false);
    }
    fetchCategories();
  }, []);

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
              onPress={() => router.push({
                pathname: `/learn/${leftCategory.firebaseDocId}`,
                params: { title: leftCategory.title, categoryId: leftCategory.id, firebaseDocId: leftCategory.firebaseDocId, categoryImage: leftCategory.image }
              })}
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
                onPress={() => router.push({
                  pathname: `/learn/${rightCategory.firebaseDocId}`,
                  params: { title: rightCategory.title, categoryId: rightCategory.id, firebaseDocId: rightCategory.firebaseDocId, categoryImage: rightCategory.image }
                })}
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
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
        <DailyObjectives objectives={dailyObjectives} />
        
        <View style={styles.introCard}>
          <Ionicons name="bulb-outline" size={28} color="#FFD700" style={styles.introIcon} />
          <Text style={styles.introTextBold}>Prêt à explorer ?</Text>
          <Text style={styles.introText}>Votre voyage de découverte des maladies commence ici.</Text>
        </View>
        
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Catégories</Text>
        </View>
        <View style={styles.categoriesContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#2196F3" style={{ marginTop: 40 }} />
          ) : (
            renderCategoryRows(categories)
          )}
        </View>
      </ScrollView>
    </SharedTransition>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 20, // Réduit car le padding est déjà géré par le layout parent
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 20,
    paddingBottom: 10,
  },
  introCard: {
    backgroundColor: '#F0F8FF', // Un bleu très clair
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 15,
    marginTop: 20,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  introIcon: {
    marginBottom: 10,
  },
  introTextBold: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 5,
  },
  introText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
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
}); 