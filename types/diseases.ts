export interface Disease {
  id: string;
  title: string;
  description: string;
  image: any;
}

export interface DiseaseSection {
  title: string;
  children?: boolean;
  adults?: boolean;
  content: string;
}

export interface DiseaseDetails {
  id: string;
  title: string;
  image: any;
  definition?: string;
  funFact?: string;
  sections: {
    symptoms: DiseaseSection[];
    prevention: DiseaseSection[];
    treatment: DiseaseSection[];
    whenToConsult: DiseaseSection[];
  };
} 