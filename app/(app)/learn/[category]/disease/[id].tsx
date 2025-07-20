import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, ActivityIndicator, ImageRequireSource } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useThemeMode } from '@/context/ThemeContext';
import Colors from '@/constants/Colors';
import SharedTransition from '@/components/navigation/SharedTransition';
import { Ionicons } from '@expo/vector-icons';
import { DiseaseSection } from '@/types/diseases';
import { getDiseaseDetails } from '../../../../services/diseaseService';

const { width } = Dimensions.get('window');

type SectionType = 'symptoms' | 'prevention' | 'treatment' | 'whenToConsult';

const SECTIONS: { 
  type: SectionType; 
  title: string; 
  icon: keyof typeof Ionicons.glyphMap;
  emoji: string;
  color: string;
  description: string;
}[] = [
  { 
    type: 'symptoms', 
    title: 'Comment je me sens ?', 
    icon: 'medical-outline',
    emoji: '🤒',
    color: '#FF9800',
    description: 'Découvre les signes qui montrent que tu es malade'
  },
  { 
    type: 'prevention', 
    title: 'Comment me protéger ?', 
    icon: 'shield-checkmark-outline',
    emoji: '🛡️',
    color: '#4CAF50',
    description: 'Apprends à te protéger pour rester en bonne santé'
  },
  { 
    type: 'treatment', 
    title: 'Comment me soigner ?', 
    icon: 'fitness-outline',
    emoji: '💊',
    color: '#9C27B0',
    description: 'Découvre les solutions pour aller mieux'
  },
  { 
    type: 'whenToConsult', 
    title: 'Quand voir le docteur ?', 
    icon: 'time-outline',
    emoji: '👨‍⚕️',
    color: '#F44336',
    description: 'Sache quand il faut consulter un médecin'
  },
];

// Interface pour les données brutes venant de Firebase (le type d'image est string)
interface FirebaseDiseaseData {
  id: string;
  title?: string;
  image?: string; // Nom de fichier de l'image depuis Firebase
  definition?: string;
  funFact?: string;
  sections?: any;
  [key: string]: any;
}

// Interface pour les données de maladie traitées pour le composant (avec sections correctement typées)
interface DiseaseDetailsType {
  id: string;
  title: string;
  definition?: string;
  funFact?: string;
  sections: { // Les sections pour l'affichage dans le composant
    symptoms: DiseaseSection[];
    prevention: DiseaseSection[];
    treatment: DiseaseSection[];
    whenToConsult: DiseaseSection[];
  };
  [key: string]: any;
}

export default function DiseaseDetailScreen() {
  const { theme } = useThemeMode();
  const { id, category, categoryImage, firebaseDocId } = useLocalSearchParams();
  const [activeSection, setActiveSection] = useState<SectionType>('symptoms');
  const [diseaseDetails, setDiseaseDetails] = useState<DiseaseDetailsType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDetails() {
      setLoading(true);
      console.log('Fetching disease details for ID:', id, 'from category:', firebaseDocId);
      const dataFromFirebaseRaw: FirebaseDiseaseData | null = await getDiseaseDetails(id as string, firebaseDocId as string);
      console.log('Raw disease data from Firebase:', dataFromFirebaseRaw);

      let diseaseDataForState: DiseaseDetailsType | null = null;

      if (dataFromFirebaseRaw) {
        // Fonction utilitaire pour transformer les données de section brutes
        const transformSectionData = (rawSection: { adults?: string; children?: string } | string | undefined, sectionTitleBase: string): DiseaseSection[] => {
          console.log(`Entering transformSectionData for: ${sectionTitleBase}, rawSection:`, rawSection);
          const transformed: DiseaseSection[] = [];

          if (typeof rawSection === 'string') {
            // Cas où rawSection est une chaîne de caractères unique
            transformed.push({
              title: sectionTitleBase,
              content: rawSection,
            });
          } else if (typeof rawSection === 'object' && rawSection !== null) {
            // Cas où rawSection est un objet avec children et/ou adults
            if (rawSection.children) {
              transformed.push({
                title: `${sectionTitleBase} chez l'enfant`,
                content: rawSection.children,
                children: true,
              });
            }
            if (rawSection.adults) {
              transformed.push({
                title: `${sectionTitleBase} chez l'adulte`,
                content: rawSection.adults,
                adults: true,
              });
            }
          }
          console.log(`Transformed ${sectionTitleBase} section:`, transformed);
          return transformed;
        };

        diseaseDataForState = {
          id: dataFromFirebaseRaw.id,
          title: dataFromFirebaseRaw.title || 'Titre inconnu',
          definition: dataFromFirebaseRaw.definition || '',
          funFact: dataFromFirebaseRaw.funFact || '',
          sections: {
            symptoms: transformSectionData(dataFromFirebaseRaw.details?.symptoms, SECTIONS.find(s => s.type === 'symptoms')?.title || 'Symptômes'),
            prevention: transformSectionData(dataFromFirebaseRaw.details?.prevention, SECTIONS.find(s => s.type === 'prevention')?.title || 'Prévention'),
            treatment: transformSectionData(dataFromFirebaseRaw.details?.treatment, SECTIONS.find(s => s.type === 'treatment')?.title || 'Traitement'),
            whenToConsult: transformSectionData(
              dataFromFirebaseRaw.whenToConsult || dataFromFirebaseRaw.details?.whenToConsult,
              SECTIONS.find(s => s.type === 'whenToConsult')?.title || 'Quand consulter'
            ),
          },
          // Ne propage pas 'image' ou 'details' bruts car ils sont traités/mappés
        };
      }
      console.log('Final disease data for state:', diseaseDataForState);
      setDiseaseDetails(diseaseDataForState);
      setLoading(false);
    }
    if (id) fetchDetails();
  }, [id, firebaseDocId]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: Colors[theme].background, justifyContent: 'center', alignItems: 'center' }] }>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (!diseaseDetails) {
    return (
      <View style={[styles.container, { backgroundColor: Colors[theme].background }] }>
        <Text style={[styles.errorText, { color: Colors[theme].text }] }>
          Maladie non trouvée 😕
        </Text>
      </View>
    );
  }

  const activeColor = SECTIONS.find(s => s.type === activeSection)?.color || Colors.primary;

  // Détermine la source d'image correcte pour le composant Image
  let imageSource: ImageRequireSource | undefined;

  if (typeof categoryImage === 'string') {
    const parsedImage = parseInt(categoryImage, 10);
    if (!isNaN(parsedImage)) {
      imageSource = parsedImage as ImageRequireSource;
    }
  } else if (Array.isArray(categoryImage) && typeof categoryImage[0] === 'string') {
    const parsedImage = parseInt(categoryImage[0], 10);
    if (!isNaN(parsedImage)) {
      imageSource = parsedImage as ImageRequireSource;
    }
  }

  return (
    <SharedTransition transitionKey={`disease-${id}`}>
      <View style={[styles.container, { backgroundColor: Colors[theme].background }] }>
        <ScrollView style={styles.scrollView}>
          {/* Header Section */}
          <View style={[styles.header, { backgroundColor: activeColor }] }>
            {/* Utilise imageSource directement ici */}
            {imageSource ? (
            <Image 
                source={imageSource}
              style={styles.diseaseImage}
              resizeMode="contain"
            />
            ) : null}
            <Text style={styles.title}>
              {diseaseDetails.title}
            </Text>
          </View>

          {/* Definition Card */}
          <View style={[styles.definitionCard, { backgroundColor: Colors[theme].card }] }>
            <View style={styles.definitionHeader}>
              <Text style={[styles.definitionTitle, { color: Colors[theme].text }] }>
                🤔 C'est quoi cette maladie ?
              </Text>
            </View>
            <Text style={[styles.definitionText, { color: Colors[theme].textSecondary }] }>
              {diseaseDetails.definition || "Une explication simple sera bientôt disponible !"}
            </Text>
            <View style={styles.definitionTips}>
              <Text style={[styles.tipsText, { color: activeColor }] }>
                💡 Le savais-tu ? {diseaseDetails.funFact || ""}
              </Text>
            </View>
          </View>

          {/* Navigation Tabs */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.tabsContainer}
          >
            {SECTIONS.map((section) => (
              <TouchableOpacity
                key={section.type}
                style={[
                  styles.tab,
                  { 
                    backgroundColor: activeSection === section.type 
                      ? section.color
                      : Colors[theme].card,
                    borderColor: section.color,
                    borderWidth: activeSection === section.type ? 0 : 1,
                  }
                ]}
                onPress={() => setActiveSection(section.type)}
              >
                <Text style={styles.tabEmoji}>{section.emoji}</Text>
                <Text
                  style={[
                    styles.tabText,
                    { 
                      color: activeSection === section.type 
                        ? '#fff' 
                        : section.color
                    }
                  ]}
                >
                  {section.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Section Description */}
          <View style={styles.sectionDescription}>
            <Text style={[styles.descriptionText, { color: activeColor }] }>
              {SECTIONS.find(s => s.type === activeSection)?.description}
            </Text>
          </View>

          {/* Content Section */}
          <View style={styles.content}>
            {/* Add defensive checks before mapping sections */}
            {diseaseDetails.sections &&
             diseaseDetails.sections[activeSection] &&
             Array.isArray(diseaseDetails.sections[activeSection]) &&
             diseaseDetails.sections[activeSection].map((section: DiseaseSection, index: number) => (
              <View 
                key={index}
                style={[
                  styles.sectionCard, 
                  { 
                    backgroundColor: Colors[theme].card,
                    borderLeftColor: activeColor,
                    borderLeftWidth: 4,
                  }
                ]}
              >
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: Colors[theme].text }] }>
                    {section.title}
                  </Text>
                  {section.children && (
                    <View style={[styles.ageBadge, { backgroundColor: '#4CAF50' }] }>
                      <Text style={styles.ageBadgeText}>👶 Enfant</Text>
                    </View>
                  )}
                  {section.adults && (
                    <View style={[styles.ageBadge, { backgroundColor: '#2196F3' }] }>
                      <Text style={styles.ageBadgeText}>🧑 Adulte</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.sectionContent, { color: Colors[theme].textSecondary }] }>
                  {section.content}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
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
  header: {
    padding: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  diseaseImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    backgroundColor: '#fff',
    padding: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    marginRight: 12,
    minWidth: width * 0.4,
  },
  tabEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionDescription: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  descriptionText: {
    fontSize: 16,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  content: {
    padding: 16,
  },
  sectionCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  ageBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 8,
  },
  ageBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  sectionContent: {
    fontSize: 16,
    lineHeight: 24,
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
  },
  definitionCard: {
    margin: 16,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  definitionHeader: {
    marginBottom: 12,
  },
  definitionTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  definitionText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  definitionTips: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 12,
  },
  tipsText: {
    fontSize: 14,
    fontWeight: '500',
  },
}); 