export type HealthRecord = {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  address: string;
  disease: string;
  vaccinationStatus: 'Vaccinated' | 'Partially Vaccinated' | 'Not Vaccinated';
  checkupDate: string;
  latitude?: number;
  longitude?: number;
  [key: string]: any; 
};

export type DataError = {
  rowIndex: number;
  column: string;
  errorType: 'Missing Value' | 'Outlier' | 'Inconsistent Format';
  suggestedFix?: string | number;
};

export type ValidationMetrics = {
  silhouetteScore: number;
  cohesion: number; // Within-cluster sum of squares
  separation: number; // Between-cluster sum of squares
};

export type Cluster = {
  id: number;
  name: string;
  records: HealthRecord[];
  demographics: {
    averageAge: number;
    genderDistribution: { [key: string]: number };
  };
  healthMetrics: {
    [indicator: string]: number;
  };
  validation?: ValidationMetrics;
  centroid?: { [key: string]: number };
};

export type AnalysisResult = {
  clusters: Cluster[];
  globalValidation: {
    avgSilhouetteScore: number;
    totalWCSS: number;
  };
  selectedIndicators?: string[];
};

export type User = {
    name: string;
    email: string;
    password?: string;
};
