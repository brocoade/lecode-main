import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useThemeMode } from '@/context/ThemeContext';
import Colors from '@/constants/Colors';
import SharedTransition from '@/components/navigation/SharedTransition';
import { getDiseasesByCategory } from '../../../services/diseaseService';

// Type minimal pour une maladie (compatible Firestore)
type DiseaseMinimal = {
  id: string;
  title: string;
  description?: string;
  image?: string;
  [key: string]: any;
};

export default function DiseasesListScreen() {
  const { theme } = useThemeMode();
  const router = useRouter();
  const { category, title, firebaseDocId, categoryImage } = useLocalSearchParams();
  const [diseases, setDiseases] = useState<DiseaseMinimal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDiseases() {
      setLoading(true);
      const data = await getDiseasesByCategory(firebaseDocId as string);
      console.log('Diseases fetched from Firebase for category', firebaseDocId, ':', data);
      setDiseases(data);
      setLoading(false);
    }
    if (firebaseDocId) fetchDiseases();
  }, [firebaseDocId]);

  const navigateToDisease = (diseaseId: string, diseaseTitle: string) => {
    router.push({
      pathname: `/learn/${category}/disease/${diseaseId}`,
      params: { title: diseaseTitle, categoryId: category, firebaseDocId: firebaseDocId, categoryImage: categoryImage }
    });
  };

  return (
    <SharedTransition transitionKey={`category-${category}`}>
      <ScrollView 
        style={[styles.container, { backgroundColor: Colors[theme].background }]}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={[styles.categoryTitle, { color: Colors[theme].text }]}>
          {title}
        </Text>
        {loading ? (
          <ActivityIndicator size="large" color="#2196F3" style={{ marginTop: 40 }} />
        ) : (
          diseases.map((disease, idx) => (
          <TouchableOpacity
            key={disease.id}
            style={[styles.diseaseCard, { backgroundColor: Colors[theme].card }]}
            onPress={() => navigateToDisease(disease.id, disease.title)}
          >
            <View style={styles.diseaseContent}>
              <Image 
                    source={categoryImage as any}
                style={styles.diseaseImage}
                resizeMode="contain"
              />
              <View style={styles.diseaseInfo}>
                <Text style={[styles.diseaseTitle, { color: Colors[theme].text }]}>
                    {`${idx + 1}. ${disease.title}`}
                </Text>
                <Text style={[styles.diseaseDescription, { color: Colors[theme].textSecondary }]}>
                  {disease.description}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SharedTransition>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  categoryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  diseaseCard: {
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  diseaseContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  diseaseImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  diseaseInfo: {
    flex: 1,
  },
  diseaseTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  diseaseDescription: {
    fontSize: 14,
    opacity: 0.8,
  },
}); 