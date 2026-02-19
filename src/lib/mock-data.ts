import type { HealthRecord, Cluster } from '@/lib/types';

// Mock data now includes static coordinates to support the Map visualization without external geocoding calls.
export const mockHealthRecords: HealthRecord[] = [
  { id: 'R001', name: 'Juan Dela Cruz', age: 45, gender: 'Male', address: '123 Rizal Ave, Purok 1, Barangay Central', disease: 'Hypertension', vaccinationStatus: 'Vaccinated', checkupDate: '2023-05-10', latitude: 14.5995, longitude: 120.9842 },
  { id: 'R002', name: 'Maria Santos', age: 32, gender: 'Female', address: '456 Bonifacio St, Purok 2, Barangay Central', disease: 'None', vaccinationStatus: 'Vaccinated', checkupDate: '2023-05-11', latitude: 14.6010, longitude: 120.9850 },
  { id: 'R003', name: 'Peter Tan', age: 68, gender: 'Male', address: '789 Mabini Blvd, Purok 1, Barangay Central', disease: 'Diabetes', vaccinationStatus: 'Partially Vaccinated', checkupDate: '2023-05-12', latitude: 14.5980, longitude: 120.9830 },
  { id: 'R004', name: 'Anna Gomez', age: 25, gender: 'Female', address: '101 Luna Rd, Purok 3, Barangay Central', disease: 'None', vaccinationStatus: 'Vaccinated', checkupDate: '2023-05-12', latitude: 14.6020, longitude: 120.9860 },
  { id: 'R005', name: 'Jose Rodriguez', age: 51, gender: 'Male', address: '212 del Pilar Ave, Purok 2, Barangay Central', disease: 'Hypertension', vaccinationStatus: 'Not Vaccinated', checkupDate: '2023-05-13', latitude: 14.5970, longitude: 120.9820 },
  { id: 'R006', name: 'Liza Soberano', age: 28, gender: 'Female', address: '333 Aguinaldo Hwy, Purok 3, Barangay Central', disease: 'Asthma', vaccinationStatus: 'Vaccinated', checkupDate: '2023-05-14', latitude: 14.6030, longitude: 120.9870 },
  { id: 'R007', name: 'Enrique Gil', age: 72, gender: 'Male', address: '444 Jacinto St, Purok 1, Barangay Central', disease: 'Diabetes', vaccinationStatus: 'Vaccinated', checkupDate: '2023-05-15', latitude: 14.5960, longitude: 120.9810 },
  { id: 'R008', name: 'Kathryn Bernardo', age: 5, gender: 'Female', address: '555 Silang Ave, Purok 4, Barangay Central', disease: 'None', vaccinationStatus: 'Partially Vaccinated', checkupDate: '2023-05-15', latitude: 14.6040, longitude: 120.9880 },
  { id: 'R009', name: 'Daniel Padilla', age: 8, gender: 'Male', address: '666 Katipunan Dr, Purok 4, Barangay Central', disease: 'None', vaccinationStatus: 'Not Vaccinated', checkupDate: '2023-05-16', latitude: 14.5950, longitude: 120.9800 },
  { id: 'R010', name: 'James Reid', age: 30, gender: 'Male', address: '777 JP Laurel St, Purok 2, Barangay Central', disease: 'None', vaccinationStatus: 'Vaccinated', checkupDate: '2023-05-17', latitude: 14.6050, longitude: 120.9890 },
];

export const healthIndicators = [
    { id: 'diseasePrevalence', name: 'Disease Prevalence' },
    { id: 'vaccinationRates', name: 'Vaccination Rates' },
    { id: 'averageAge', name: 'Average Age' },
    { id: 'genderDistribution', name: 'Gender Distribution' }
];
