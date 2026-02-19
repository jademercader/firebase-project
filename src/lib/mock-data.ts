import type { HealthRecord } from '@/lib/types';

// Updated mock data to reflect the Calbayog City dataset format
export const mockHealthRecords: HealthRecord[] = [
  { id: 'HR001', name: 'Juan Dela Cruz', age: 45, gender: 'Male', address: 'Brgy. Obrero, Calbayog City', disease: 'Hypertension', vaccinationStatus: 'Vaccinated', checkupDate: '2025-01-10' },
  { id: 'HR002', name: 'Maria Santos', age: 32, gender: 'Female', address: 'Brgy. San Policarpo, Calbayog City', disease: 'Diabetes', vaccinationStatus: 'Partially Vaccinated', checkupDate: '2025-01-12' },
  { id: 'HR003', name: 'Carlos Reyes', age: 60, gender: 'Male', address: 'Brgy. Lonoy, Calbayog City', disease: 'Heart Disease', vaccinationStatus: 'Vaccinated', checkupDate: '2025-01-15' },
  { id: 'HR004', name: 'Ana Lopez', age: 28, gender: 'Female', address: 'Brgy. Capoocan, Calbayog City', disease: 'None', vaccinationStatus: 'Not Vaccinated', checkupDate: '2025-01-18' },
  { id: 'HR005', name: 'Mark Villanueva', age: 50, gender: 'Male', address: 'Brgy. Kalilihan, Calbayog City', disease: 'Hypertension', vaccinationStatus: 'Vaccinated', checkupDate: '2025-01-20' },
  { id: 'HR006', name: 'Sarah Lim', age: 35, gender: 'Female', address: 'Brgy. Dagum, Calbayog City', disease: 'Asthma', vaccinationStatus: 'Partially Vaccinated', checkupDate: '2025-01-22' },
  { id: 'HR007', name: 'John Cruz', age: 41, gender: 'Male', address: 'Brgy. Cabidian, Calbayog City', disease: 'Diabetes', vaccinationStatus: 'Vaccinated', checkupDate: '2025-01-25' },
  { id: 'HR008', name: 'Liza Garcia', age: 29, gender: 'Female', address: 'Brgy. Cawayan, Calbayog City', disease: 'None', vaccinationStatus: 'Vaccinated', checkupDate: '2025-01-27' },
  { id: 'HR009', name: 'Robert Tan', age: 55, gender: 'Male', address: 'Brgy. Burabod, Calbayog City', disease: 'Heart Disease', vaccinationStatus: 'Not Vaccinated', checkupDate: '2025-02-01' },
  { id: 'HR010', name: 'Emily Ramos', age: 38, gender: 'Female', address: 'Brgy. Hamorawon, Calbayog City', disease: 'Hypertension', vaccinationStatus: 'Vaccinated', checkupDate: '2025-02-05' },
];

export const healthIndicators = [
    { id: 'diseasePrevalence', name: 'Disease Prevalence' },
    { id: 'vaccinationRates', name: 'Vaccination Rates' },
    { id: 'averageAge', name: 'Average Age' },
    { id: 'genderDistribution', name: 'Gender Distribution' }
];