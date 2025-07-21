import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { DailyObjectives } from '../../../components/layout/DailyObjectives';
import { CategoryCard } from '../../../components/game/CategoryCard';
import { useRouter } from 'expo-router';
import SharedTransition from '@/components/navigation/SharedTransition';
import { getCategories } from '../../services/diseaseService';
import { LearnPageSkeleton } from '../../../components/ui/SkeletonLoader';
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
  const [loading, setLoading] = useState(false); // Commencer par false pour affichage immédiat

  // Daily objectives definition
  const dailyObjectives = [
    { id: '1', title: 'Quiz du jour', completed: true },
    { id: '2', title: 'Lecture santé', completed: false },
  ];

  // Catégories par défaut pour affichage immédiat (skeleton)
  const defaultCategories: Category[] = [
    { id: '1', firebaseDocId: 'maladies_cardiovasculaires', title: 'Maladies Cardiovasculaires', progress: 0, color: '#FF6B6B', image: categoryImages['4'], isNew: false, locked: false },
    { id: '2', firebaseDocId: 'maladies_respiratoires', title: 'Maladies Respiratoires', progress: 0, color: '#4ECDC4', image: categoryImages['3'], isNew: false, locked: true },
    { id: '3', firebaseDocId: 'maladies_digestives', title: 'Maladies Digestives', progress: 0, color: '#45B7D1', image: categoryImages['1'], isNew: false, locked: true },
    { id: '4', firebaseDocId: 'maladies_endocriniennes', title: 'Maladies Endocriniennes', progress: 0, color: '#96CEB4', image: categoryImages['10'], isNew: false, locked: true },
    { id: '5', firebaseDocId: 'maladies_autoimmunes', title: 'Maladies Auto-immunes', progress: 0, color: '#FFEAA7', image: categoryImages['7'], isNew: false, locked: true },
    { id: '6', firebaseDocId: 'maladies_infectieuses', title: 'Maladies Infectieuses', progress: 0, color: '#DDA0DD', image: categoryImages['2'], isNew: false, locked: true },
  ];

  // Initialiser avec les catégories par défaut
  useEffect(() => {
    setCategories(defaultCategories);

    // Charger les vraies données en arrière-plan
    async function fetchCategories() {
      try {
        setLoading(true);
        const data = await getCategories();
        console.log('Categories fetched from Firebase:', data);

        // Mapper les images locales
        const categoriesWithImages = data.map((cat: any) => ({
          ...cat,
          image: categoryImages[cat.id] || null,
        }));

        setCategories(categoriesWithImages);
      } catch (error) {
        console.error('Erreur lors du chargement des catégories:', error);
        // Garder les catégories par défaut en cas d'erreur
      } finally {
        setLoading(false);
      }
    }

    // Délai minimal pour éviter le flash
    setTimeout(fetchCategories, 100);
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

  // Afficher le skeleton pendant le chargement initial
  if (loading && categories.length === 0) {
    return (
      <SharedTransition transitionKey="learn-screen">
        <LearnPageSkeleton />
      </SharedTransition>
    );
  }

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
          {loading && (
            <ActivityIndicator size="small" color="#2196F3" style={{ marginLeft: 10 }} />
          )}
        </View>
        <View style={styles.categoriesContainer}>
          {renderCategoryRows(categories)}
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