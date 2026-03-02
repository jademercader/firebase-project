
'use client';
import { useState } from 'react';
import Papa from 'papaparse';
import { FileUploader } from '@/components/upload/file-uploader';
import { DataTable } from '@/components/upload/data-table';
import { HealthRecord } from '@/lib/types';
import AppLayout from '@/components/layout/app-layout';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, setDocumentNonBlocking } from '@/firebase';
import { doc, collection } from 'firebase/firestore';

/**
 * Robust helper to extract values from a row by trying multiple possible header variations.
 */
const getRowValue = (row: any, keys: string[]): string => {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null) {
      return String(row[key]).trim();
    }
  }
  return '';
};

const isRowEmpty = (row: any): boolean => {
  return Object.values(row).every(val => val === '' || val === null || val === undefined);
}

export default function UploadPage() {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const { toast } = useToast();
  const { firestore } = useFirestore();
  const { user, isUserLoading } = useUser();

  const handleFileSelected = (file: File) => {
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: 'greedy',
        transformHeader: (header) => header.trim(),
        complete: (results) => {
          const parsedRecords = results.data
            .filter((row: any) => !isRowEmpty(row))
            .map((row: any, index: number): HealthRecord => {
                const ageString = getRowValue(row, ['age', 'Age', 'Years', 'Patient Age']);
                const age = ageString ? parseInt(ageString, 10) : 0;
                
                const genderRaw = getRowValue(row, ['gender', 'Gender', 'Sex']);
                const gender = (genderRaw.charAt(0).toUpperCase() + genderRaw.slice(1).toLowerCase()) as any;
                
                const vaccinationStatus = getRowValue(row, ['vaccinationStatus', 'Vaccination Status', 'Vaccinated', 'Status']) as HealthRecord['vaccinationStatus'] || 'Not Vaccinated';
                
                const street = getRowValue(row, ['address', 'Address', 'Street', 'Location', 'Purok', 'Street Address']);
                const brgy = getRowValue(row, ['barangay', 'Barangay', 'Brgy', 'Area']);
                
                // Combine Street and Barangay into Address
                const fullAddress = brgy 
                  ? `${street}${street ? ', ' : ''}Brgy. ${brgy.replace(/^Brgy\.?\s+/i, '')}` 
                  : (street || 'Calbayog City');

                const latStr = getRowValue(row, ['latitude', 'lat', 'Latitude', 'Lat', 'GPS Lat']);
                const lngStr = getRowValue(row, ['longitude', 'long', 'lng', 'Longitude', 'Lng', 'Long', 'GPS Lng']);
                const diseaseValue = getRowValue(row, ['disease', 'Disease', 'Condition', 'Diagnosis', 'Medical Condition']);

                return {
                  id: getRowValue(row, ['id', 'ID', 'No.', 'Patient ID']) || `rec-${Date.now()}-${index}`,
                  name: getRowValue(row, ['name', 'Name', 'Patient Name', 'Full Name']),
                  age: isNaN(age) ? 0 : age,
                  gender: ['Male', 'Female', 'Other'].includes(gender) ? gender : 'Other',
                  address: fullAddress,
                  disease: diseaseValue || 'None',
                  vaccinationStatus: ['Vaccinated', 'Partially Vaccinated', 'Not Vaccinated'].includes(vaccinationStatus) ? vaccinationStatus : 'Not Vaccinated',
                  checkupDate: getRowValue(row, ['checkupDate', 'Checkup Date', 'Date']) || new Date().toISOString().split('T')[0],
                  latitude: latStr ? parseFloat(latStr) : undefined,
                  longitude: lngStr ? parseFloat(lngStr) : undefined,
                };
          });

          setRecords(parsedRecords);
          toast({
            title: 'File Parsed Successfully',
            description: `${parsedRecords.length} records loaded and ready for database synchronization.`,
          });
        },
      });
    }
  };
  
  const handleSaveData = () => {
    if (records.length === 0) return;
    
    // Check for both availability and loading state to match the requested error toast
    if (isUserLoading || !user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Cloud Connection Pending',
        description: 'Establishing a secure session. Please wait a moment and try again.',
      });
      return;
    }

    records.forEach(record => {
      const recordRef = doc(collection(firestore, 'users', user.uid, 'health_records'), record.id);
      setDocumentNonBlocking(recordRef, {
        ...record,
        ownerId: user.uid,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    });
    
    toast({
      title: 'Cloud Database Synchronized!',
      description: `${records.length} records recorded in your secure database.`,
    });
  }

  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight font-headline">Barangay Data Consolidation</h2>
        </div>
        <div className="space-y-6">
            <FileUploader 
              onFileSelected={handleFileSelected} 
              onSaveData={handleSaveData} 
              hasRecords={records.length > 0}
              isLoading={isUserLoading}
            />
            <DataTable records={records} />
        </div>
      </div>
    </AppLayout>
  );
}
