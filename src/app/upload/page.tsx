'use client';
import { useState } from 'react';
import Papa from 'papaparse';
import { FileUploader } from '@/components/upload/file-uploader';
import { DataTable } from '@/components/upload/data-table';
import { CleansingSuggestions } from '@/components/upload/cleansing-suggestions';
import { HealthRecord } from '@/lib/types';
import AppLayout from '@/components/layout/app-layout';
import { useToast } from '@/hooks/use-toast';

// Function to safely get a value from a row, checking for multiple possible keys
const getRowValue = (row: any, keys: string[]): string => {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null) {
      return String(row[key]);
    }
  }
  return '';
};

// Function to check if a row is essentially empty
const isRowEmpty = (row: any): boolean => {
  return Object.values(row).every(val => val === '' || val === null);
}

export default function UploadPage() {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);

    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length) {
            console.error('Error parsing CSV:', results.errors);
            toast({
              variant: 'destructive',
              title: 'File Parsing Failed',
              description: results.errors.map(e => e.message).join(', '),
            });
            return;
          }
          
          const parsedRecords = results.data
            .filter((row: any) => !isRowEmpty(row)) // Filter out completely empty rows
            .map((row: any, index: number): HealthRecord => {
                const ageString = getRowValue(row, ['age', 'Age']);
                const age = ageString ? parseInt(ageString, 10) : 0;
                
                const name = getRowValue(row, ['name', 'Name', 'Full Name', 'Patient Name']);
                const gender = getRowValue(row, ['gender', 'Gender']) as HealthRecord['gender'] || 'Other';
                const address = getRowValue(row, ['address', 'Address']);
                const disease = getRowValue(row, ['disease', 'Disease']) || 'None';
                const vaccinationStatus = getRowValue(row, ['vaccinationStatus', 'Vaccination Status', 'vax_status']) as HealthRecord['vaccinationStatus'] || 'Not Vaccinated';
                const checkupDate = getRowValue(row, ['checkupDate', 'Checkup Date']);

                return {
                  id: getRowValue(row, ['id', 'ID']) || `rec-${Date.now()}-${index}`,
                  name,
                  age: isNaN(age) ? 0 : age,
                  gender: ['Male', 'Female', 'Other'].includes(gender) ? gender : 'Other',
                  address,
                  disease,
                  vaccinationStatus: ['Vaccinated', 'Partially Vaccinated', 'Not Vaccinated'].includes(vaccinationStatus) ? vaccinationStatus : 'Not Vaccinated',
                  checkupDate: checkupDate || new Date().toISOString().split('T')[0],
                };
          });

          // Final filter to ensure we only keep records that have at least a name or an id.
          const validRecords = parsedRecords.filter(record => record.name || record.id !== `rec-${Date.now()}-${parsedRecords.indexOf(record)}`);

          setRecords(validRecords);
          toast({
            title: 'File Parsed Successfully',
            description: `${validRecords.length} records loaded from ${file.name}.`,
          });
        },
        error: (error: any) => {
          console.error('Error parsing CSV:', error);
          setRecords([]);
          toast({
            variant: 'destructive',
            title: 'File Parsing Failed',
            description: 'Could not read the CSV file. Please check its format and try again.',
          });
        },
      });
    }
  };
  
  const handleSaveData = () => {
    if (records.length === 0) {
       toast({
        variant: 'destructive',
        title: 'No Data to Save',
        description: 'Please upload and parse a file before saving.',
      });
      return;
    }
    const RECORDS_STORAGE_KEY = 'health_records';
    localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(records));
     toast({
        title: 'Data Saved Successfully!',
        description: 'Navigate to the dashboard to run your analysis on the new data.',
      });
  }

  return (
    <AppLayout>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight font-headline">Data Upload & Cleansing</h2>
        </div>
        <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
            <FileUploader 
              onFileSelected={handleFileSelected} 
              onSaveData={handleSaveData} 
              hasRecords={records.length > 0}
            />
            <DataTable records={records} />
            </div>
            <div className="lg:col-span-1">
            <CleansingSuggestions records={records} />
            </div>
        </div>
        </div>
    </AppLayout>
  );
}
