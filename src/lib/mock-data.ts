import type { HealthRecord } from '@/lib/types';

// Updated mock data to reflect the Calbayog City dataset format with correct Barangay mapping
export const mockHealthRecords: HealthRecord[] = [
  { id: 'HR001', name: 'Juan Dela Cruz', age: 45, gender: 'Male', address: '122 Purok 3, Brgy. Obrero', disease: 'Hypertension', vaccinationStatus: 'Vaccinated', checkupDate: '2025-01-10' },
  { id: 'HR002', name: 'Maria Santos', age: 32, gender: 'Female', address: '45 Mabini St., Brgy. San Policarpo', disease: 'Diabetes', vaccinationStatus: 'Partially Vaccinated', checkupDate: '2025-01-12' },
  { id: 'HR003', name: 'Carlos Reyes', age: 60, gender: 'Male', address: '88 Rizal Ave., Brgy. Lonoy', disease: 'Heart Disease', vaccinationStatus: 'Vaccinated', checkupDate: '2025-01-15' },
  { id: 'HR004', name: 'Ana Lopez', age: 28, gender: 'Female', address: '7 Purok 5, Brgy. Capoocan', disease: 'None', vaccinationStatus: 'Not Vaccinated', checkupDate: '2025-01-18' },
  { id: 'HR005', name: 'Mark Villanueva', age: 50, gender: 'Male', address: '23 Del Rosario St., Brgy. Kalilihan', disease: 'Hypertension', vaccinationStatus: 'Vaccinated', checkupDate: '2025-01-20' },
  { id: 'HR006', name: 'Sarah Lim', age: 35, gender: 'Female', address: '56 Purok 2, Brgy. Dagum', disease: 'Asthma', vaccinationStatus: 'Partially Vaccinated', checkupDate: '2025-01-22' },
  { id: 'HR007', name: 'John Cruz', age: 41, gender: 'Male', address: '12-B Osmeña St., Brgy. Cabidian', disease: 'Diabetes', vaccinationStatus: 'Vaccinated', checkupDate: '2025-01-25' },
  { id: 'HR008', name: 'Liza Garcia', age: 29, gender: 'Female', address: '99 Maharlika Hwy, Brgy. Cawayan', disease: 'None', vaccinationStatus: 'Vaccinated', checkupDate: '2025-01-27' },
  { id: 'HR009', name: 'Robert Tan', age: 55, gender: 'Male', address: '77 Quezon St., Brgy. Burabod', disease: 'Heart Disease', vaccinationStatus: 'Not Vaccinated', checkupDate: '2025-02-01' },
  { id: 'HR010', name: 'Emily Ramos', age: 38, gender: 'Female', address: '5 Purok 1, Brgy. Hamorawon', disease: 'Hypertension', vaccinationStatus: 'Vaccinated', checkupDate: '2025-02-05' },
];

export const healthIndicators = [
    { id: 'diseasePrevalence', name: 'Disease Prevalence' },
    { id: 'vaccinationRates', name: 'Vaccination Rates' },
    { id: 'averageAge', name: 'Average Age' },
    { id: 'genderDistribution', name: 'Gender Distribution' }
];
