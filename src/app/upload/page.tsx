
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import { FileUploader } from '@/components/upload/file-uploader';
import { DataTable } from '@/components/upload/data-table';
import { HealthRecord } from '@/lib/types';
import AppLayout from '@/components/layout/app-layout';
import { useToast } from '@/hooks/use-toast';

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
  const router = useRouter();

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
                
                // Combine Street and Barangay for accurate spatial logic
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
            description: `${parsedRecords.length} records loaded.`,
          });
        },
      });
    }
  };
  
  const handleSaveData = () => {
    if (records.length === 0) return;
    
    // Save to local storage
    localStorage.setItem('health_records', JSON.stringify(records));
    
    // Trigger update event
    window.dispatchEvent(new Event('records-updated'));
    
    toast({
      title: 'Data Saved Locally',
      description: `${records.length} records are now ready for analysis.`,
    });

    // Automatically navigate to the dashboard menu
    router.push('/');
  }

  return (
    <AppLayout>
      <div className="max-w-[1400px] mx-auto space-y-6 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-slate-900">Barangay Data Consolidation</h2>
        </div>
        <div className="grid grid-cols-1 gap-6">
            <FileUploader 
                onFileSelected={handleFileSelected} 
                onSaveData={handleSaveData} 
                hasRecords={records.length > 0}
            />
            <DataTable records={records} />
        </div>
      </div>
    </AppLayout>
  );
}
