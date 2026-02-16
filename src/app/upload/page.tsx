
'use client';
import { useState } from 'react';
import Papa from 'papaparse';
import { FileUploader } from '@/components/upload/file-uploader';
import { DataTable } from '@/components/upload/data-table';
import { HealthRecord } from '@/lib/types';
import AppLayout from '@/components/layout/app-layout';
import { useToast } from '@/hooks/use-toast';

const getRowValue = (row: any, keys: string[]): string => {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null) {
      return String(row[key]);
    }
  }
  return '';
};

const isRowEmpty = (row: any): boolean => {
  return Object.values(row).every(val => val === '' || val === null);
}

export default function UploadPage() {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const { toast } = useToast();

  const handleFileSelected = (file: File) => {
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length) {
            toast({
              variant: 'destructive',
              title: 'File Parsing Failed',
              description: results.errors.map(e => e.message).join(', '),
            });
            return;
          }
          
          const parsedRecords = results.data
            .filter((row: any) => !isRowEmpty(row))
            .map((row: any, index: number): HealthRecord => {
                const ageString = getRowValue(row, ['age', 'Age']);
                const age = ageString ? parseInt(ageString, 10) : 0;
                const gender = getRowValue(row, ['gender', 'Gender']) as HealthRecord['gender'] || 'Other';
                const vaccinationStatus = getRowValue(row, ['vaccinationStatus', 'Vaccination Status']) as HealthRecord['vaccinationStatus'] || 'Not Vaccinated';

                return {
                  id: getRowValue(row, ['id', 'ID']) || `rec-${Date.now()}-${index}`,
                  name: getRowValue(row, ['name', 'Name', 'Patient Name']),
                  age: isNaN(age) ? 0 : age,
                  gender: ['Male', 'Female', 'Other'].includes(gender) ? gender : 'Other',
                  address: getRowValue(row, ['address', 'Address']),
                  disease: getRowValue(row, ['disease', 'Disease']) || 'None',
                  vaccinationStatus: ['Vaccinated', 'Partially Vaccinated', 'Not Vaccinated'].includes(vaccinationStatus) ? vaccinationStatus : 'Not Vaccinated',
                  checkupDate: getRowValue(row, ['checkupDate', 'Checkup Date']) || new Date().toISOString().split('T')[0],
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
    localStorage.setItem('health_records', JSON.stringify(records));
     toast({
        title: 'Data Saved Successfully!',
        description: 'Navigate to the dashboard to run analysis.',
      });
  }

  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight font-headline">Consolidated Data Upload</h2>
        </div>
        <div className="space-y-6">
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
