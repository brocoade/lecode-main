import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { firestore } from '../config/firebase';

// Type minimal pour une maladie
interface DiseaseMinimal {
  id: string;
  title: string;
  order?: number;
  [key: string]: any;
}

// Cache pour les catégories
let categoriesCache: any[] | null = null;
let categoriesCacheTime = 0;
const CATEGORIES_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Récupérer toutes les catégories avec cache
export async function getCategories() {
  const now = Date.now();

  // Utiliser le cache si valide
  if (categoriesCache && (now - categoriesCacheTime) < CATEGORIES_CACHE_DURATION) {
    console.log('Utilisation du cache des catégories');
    return categoriesCache;
  }

  try {
    console.log('Récupération des catégories depuis Firebase');
    const categoriesRef = collection(firestore, 'categories');
    const snapshot = await getDocs(categoriesRef);
    const categories = snapshot.docs.map(doc => ({ firebaseDocId: doc.id, ...doc.data() }));

    // Mettre à jour le cache
    categoriesCache = categories;
    categoriesCacheTime = now;

    return categories;
  } catch (error) {
    console.error('Erreur lors de la récupération des catégories:', error);
    // Retourner le cache même expiré en cas d'erreur
    return categoriesCache || [];
  }
}

// Récupérer toutes les maladies d'une catégorie en utilisant l'ID du document Firebase (nom de la catégorie)
export async function getDiseasesByCategory(firebaseDocId: string) {
  try {
    // Cibler la sous-collection 'diseases' sous le document de la catégorie, en utilisant l'ID du document Firebase
    const diseasesRef = collection(firestore, 'categories', firebaseDocId, 'diseases');
    const snapshot = await getDocs(query(diseasesRef));

    // Mapper les documents pour inclure l'ID du document et les données
    const diseases = snapshot.docs.map(doc => ({
      id: doc.id, // L'ID du document dans la sous-collection diseases
      ...doc.data()
    }) as DiseaseMinimal);

  // On trie par un champ 'order' si présent, sinon par titre
    return diseases
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.title.localeCompare(b.title));

  } catch (error) {
    console.error('Error fetching diseases for category', firebaseDocId, ':', error);
    return [];
  }
}

// Récupérer les détails d'une maladie, avec un categoryFirebaseDocId optionnel
export async function getDiseaseDetails(diseaseId: string, categoryFirebaseDocId?: string) {
  let diseaseRef;
  if (categoryFirebaseDocId) {
    diseaseRef = doc(firestore, 'categories', categoryFirebaseDocId, 'diseases', diseaseId);
  } else {
    diseaseRef = doc(firestore, 'diseases', diseaseId);
  }
  
  const snapshot = await getDoc(diseaseRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() };
} 