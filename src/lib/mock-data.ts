import type { HealthRecord, Cluster } from '@/lib/types';

export const mockHealthRecords: HealthRecord[] = [
  { id: 'R001', name: 'Juan Dela Cruz', age: 45, gender: 'Male', address: '123 Rizal Ave, Purok 1, Barangay Central', disease: 'Hypertension', vaccinationStatus: 'Vaccinated', checkupDate: '2023-05-10' },
  { id: 'R002', name: 'Maria Santos', age: 32, gender: 'Female', address: '456 Bonifacio St, Purok 2, Barangay Central', disease: 'None', vaccinationStatus: 'Vaccinated', checkupDate: '2023-05-11' },
  { id: 'R003', name: 'Peter Tan', age: 68, gender: 'Male', address: '789 Mabini Blvd, Purok 1, Barangay Central', disease: 'Diabetes', vaccinationStatus: 'Partially Vaccinated', checkupDate: '2023-05-12' },
  { id: 'R004', name: 'Anna Gomez', age: 25, gender: 'Female', address: '101 Luna Rd, Purok 3, Barangay Central', disease: 'None', vaccinationStatus: 'Vaccinated', checkupDate: '2023-05-12' },
  { id: 'R005', name: 'Jose Rodriguez', age: 51, gender: 'Male', address: '212 del Pilar Ave, Purok 2, Barangay Central', disease: 'Hypertension', vaccinationStatus: 'Not Vaccinated', checkupDate: '2023-05-13' },
  { id: 'R006', name: 'Liza Soberano', age: 28, gender: 'Female', address: '333 Aguinaldo Hwy, Purok 3, Barangay Central', disease: 'Asthma', vaccinationStatus: 'Vaccinated', checkupDate: '2023-05-14' },
  { id: 'R007', name: 'Enrique Gil', age: 72, gender: 'Male', address: '444 Jacinto St, Purok 1, Barangay Central', disease: 'Diabetes', vaccinationStatus: 'Vaccinated', checkupDate: '2023-05-15' },
  { id: 'R008', name: 'Kathryn Bernardo', age: 5, gender: 'Female', address: '555 Silang Ave, Purok 4, Barangay Central', disease: 'None', vaccinationStatus: 'Partially Vaccinated', checkupDate: '2023-05-15' },
  { id: 'R009', name: 'Daniel Padilla', age: 8, gender: 'Male', address: '666 Katipunan Dr, Purok 4, Barangay Central', disease: 'None', vaccinationStatus: 'Not Vaccinated', checkupDate: '2023-05-16' },
  { id: 'R010', name: 'James Reid', age: 30, gender: 'Male', address: '777 JP Laurel St, Purok 2, Barangay Central', disease: 'None', vaccinationStatus: 'Vaccinated', checkupDate: '2023-05-17' },
];

export const mockCleansingSuggestions = {
  dataErrors: "Report of Findings:\n1. Row 5, Column 'vaccinationStatus': Value is 'Not Vaccinated'. Flagged for follow-up.\n2. Row 3, Column 'age': Value 68 is a potential outlier for this dataset's age distribution.\n3. Row 9, Column 'checkupDate': Missing value detected."
};

export const healthIndicators = [
    { id: 'diseasePrevalence', name: 'Disease Prevalence' },
    { id: 'vaccinationRates', name: 'Vaccination Rates' },
    { id: 'averageAge', name: 'Average Age' },
    { id: 'genderDistribution', name: 'Gender Distribution' }
];

export const mockClusters: Cluster[] = [
    {
      id: 1,
      name: 'Cluster 1: Elderly & Chronic Illness',
      records: mockHealthRecords.filter(r => r.age > 60),
      demographics: { averageAge: 70, genderDistribution: { 'Male': 2, 'Female': 0 } },
      healthMetrics: { 'Diabetes': 2, 'Hypertension': 0, 'Asthma': 0, 'Vaccinated': 1, 'Partially Vaccinated': 1, 'Not Vaccinated': 0 }
    },
    {
      id: 2,
      name: 'Cluster 2: Middle-Aged Adults',
      records: mockHealthRecords.filter(r => r.age >= 30 && r.age <= 60),
      demographics: { averageAge: 42, genderDistribution: { 'Male': 3, 'Female': 1 } },
      healthMetrics: { 'Diabetes': 0, 'Hypertension': 2, 'Asthma': 0, 'Vaccinated': 2, 'Partially Vaccinated': 0, 'Not Vaccinated': 1 }
    },
    {
      id: 3,
      name: 'Cluster 3: Young Population & Children',
      records: mockHealthRecords.filter(r => r.age < 30),
      demographics: { averageAge: 16.5, genderDistribution: { 'Male': 1, 'Female': 3 } },
      healthMetrics: { 'Diabetes': 0, 'Hypertension': 0, 'Asthma': 1, 'Vaccinated': 1, 'Partially Vaccinated': 1, 'Not Vaccinated': 1 }
    }
];

export const mockTrendAnalysis = {
    trends: "Trend Analysis Report:\n- Cluster 1 (Elderly & Chronic Illness) shows a 15% increase in Diabetes cases over the last quarter.\n- Cluster 3 (Young Population & Children) vaccination rates have improved by 20% since the start of the year.\n- Anomaly Detected: A sudden spike in Hypertension cases in Cluster 2 was observed last month, which has since normalized."
};
