import { Disease, DiseaseDetails } from '@/types/diseases';

export const CATEGORIES = {
  DIGESTION: '1',
  INFECTIONS: '2',
  BRAIN: '3',
  RESPIRATORY: '4',
  BLOOD: '5',
  HEART: '6',
  IMMUNE: '7',
  MUSCLES: '8',
} as const;

export const DISEASES_BY_CATEGORY: { [key: string]: Disease[] } = {
  [CATEGORIES.DIGESTION]: [
    {
      id: '1',
      title: 'Gastro-entérite',
      description: 'Inflammation de l\'estomac et des intestins',
      image: require('@/assets/images/nutrition.png'),
    },
    {
      id: '2',
      title: 'Ulcère gastrique',
      description: 'Lésion de la paroi de l\'estomac',
      image: require('@/assets/images/nutrition.png'),
    },
    {
      id: '3',
      title: 'Constipation chronique',
      description: 'Difficulté à évacuer les selles',
      image: require('@/assets/images/nutrition.png'),
    }
  ],
  [CATEGORIES.INFECTIONS]: [
    {
      id: '1',
      title: 'Paludisme',
      description: 'Maladie infectieuse transmise par les moustiques',
      image: require('@/assets/images/infections_virus.png'),
    },
    {
      id: '2',
      title: 'Grippe',
      description: 'Infection virale respiratoire contagieuse',
      image: require('@/assets/images/infections_virus.png'),
    },
    {
      id: '3',
      title: 'COVID-19',
      description: 'Maladie infectieuse causée par le coronavirus SARS-CoV-2',
      image: require('@/assets/images/infections_virus.png'),
    }
  ],
  [CATEGORIES.RESPIRATORY]: [
    {
      id: '1',
      title: 'Asthme',
      description: 'Maladie inflammatoire des bronches',
      image: require('@/assets/images/respiration.png'),
    },
    {
      id: '2',
      title: 'Bronchite',
      description: 'Inflammation des bronches',
      image: require('@/assets/images/respiration.png'),
    },
    {
      id: '3',
      title: 'Pneumonie',
      description: 'Infection des poumons',
      image: require('@/assets/images/respiration.png'),
    }
  ],
  [CATEGORIES.HEART]: [
    {
      id: '1',
      title: 'Hypertension',
      description: 'Pression artérielle élevée',
      image: require('@/assets/images/coeurs.png'),
    },
    {
      id: '2',
      title: 'Insuffisance cardiaque',
      description: 'Cœur ne pompant pas assez de sang',
      image: require('@/assets/images/coeurs.png'),
    },
    {
      id: '3',
      title: 'Arythmie cardiaque',
      description: 'Trouble du rythme cardiaque',
      image: require('@/assets/images/coeurs.png'),
    }
  ],
  [CATEGORIES.MUSCLES]: [
    {
      id: '1',
      title: 'Arthrose',
      description: 'Usure des articulations',
      image: require('@/assets/images/muscles.png'),
    },
    {
      id: '2',
      title: 'Ostéoporose',
      description: 'Fragilité osseuse',
      image: require('@/assets/images/muscles.png'),
    },
    {
      id: '3',
      title: 'Tendinite',
      description: 'Inflammation des tendons',
      image: require('@/assets/images/muscles.png'),
    }
  ]
};

export const DISEASE_DETAILS: { [key: string]: DiseaseDetails } = {
  '1': {
    id: '1',
    title: 'Paludisme',
    image: require('@/assets/images/infections_virus.png'),
    definition: "Le paludisme est une maladie qui nous rend malade à cause d'un tout petit parasite qui entre dans notre corps quand un moustique spécial nous pique. C'est comme si un minuscule envahisseur se cachait dans notre sang !",
    funFact: "Les moustiques qui transmettent le paludisme ne piquent que la nuit. C'est pour ça qu'on dort sous des moustiquaires !",
    sections: {
      symptoms: [
        {
          title: 'Symptômes chez l\'enfant',
          children: true,
          content: '- Fièvre élevée\n- Frissons\n- Maux de tête\n- Fatigue intense\n- Sueurs\n- Douleurs musculaires',
        },
        {
          title: 'Symptômes chez l\'adulte',
          adults: true,
          content: '- Fièvre brutale > 38,5°C\n- Frissons intenses\n- Maux de tête sévères\n- Courbatures\n- Fatigue importante',
        },
      ],
      prevention: [
        {
          title: 'Prévention pour les enfants',
          children: true,
          content: '- Moustiquaire imprégnée\n- Vêtements longs\n- Répulsifs adaptés\n- Traitement préventif si nécessaire',
        },
        {
          title: 'Prévention pour les adultes',
          adults: true,
          content: '- Utilisation de répulsifs\n- Port de vêtements longs\n- Moustiquaires\n- Consultation avant voyage',
        },
      ],
      treatment: [
        {
          title: 'Traitement pour les enfants',
          children: true,
          content: '- Antipaludéens adaptés au poids\n- Repos\n- Hydratation importante\n- Suivi médical régulier',
        },
        {
          title: 'Traitement pour les adultes',
          adults: true,
          content: '- Antipaludéens prescrits\n- Repos strict\n- Hydratation\n- Surveillance médicale',
        },
      ],
      whenToConsult: [
        {
          title: 'Quand consulter ?',
          content: '- Dès les premiers symptômes\n- Fièvre > 38,5°C\n- Retour de zone endémique\n- Urgence si vomissements/confusion',
        },
      ],
    },
  },
  // Ajoutez d'autres maladies ici...
}; 