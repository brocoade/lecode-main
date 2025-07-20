import { Colors } from './Colors';

export interface Category {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  levels: number; // Nombre de niveaux disponibles dans cette catégorie
}

export const Categories: Category[] = [
  {
    id: 'nutrition',
    title: 'Nutrition',
    description: 'Apprenez les bases d\'une alimentation saine et équilibrée.',
    icon: 'nutrition',
    color: Colors.categories.nutrition,
    levels: 5,
  },
  {
    id: 'first-aid',
    title: 'Premiers Secours',
    description: 'Maîtrisez les gestes qui sauvent en cas d\'urgence.',
    icon: 'medkit',
    color: Colors.categories.firstAid,
    levels: 5,
  },
  {
    id: 'mental-health',
    title: 'Santé Mentale',
    description: 'Découvrez comment prendre soin de votre bien-être mental.',
    icon: 'happy',
    color: Colors.categories.mentalHealth,
    levels: 5,
  },
  {
    id: 'medical-law',
    title: 'Droit Médical',
    description: 'Informez-vous sur vos droits en matière de santé.',
    icon: 'document-text',
    color: Colors.categories.medicalLaw,
    levels: 5,
  },
];

// Fonction utilitaire pour obtenir une catégorie par son ID
export const getCategoryById = (id: string): Category | undefined => {
  return Categories.find(category => category.id === id);
}; 