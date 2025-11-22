'use client';
import { useState } from 'react';
import Papa from 'papaparse';
import { FileUploader } from '@/components/upload/file-uploader';
import { DataTable } from '@/components/upload/data-table';
import { CleansingSuggestions } from '@/components/upload/cleansing-suggestions';
import { HealthRecord } from '@/lib/types';
import AppLayout from '@/components/layout/app-layout';
import { useToast } from '@/hooks/use-toast';

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
          
          const parsedRecords = results.data.map((row: any, index: number) => {
            const age = parseInt(row.age, 10);
            return {
              id: row.id || `rec-${Date.now()}-${index}`,
              name: row.name || row['Name'] || '',
              age: isNaN(age) ? 0 : age,
              gender: row.gender || row['Gender'] || 'Other',
              address: row.address || row['Address'] || '',
              disease: row.disease || row['Disease'] || 'None',
              vaccinationStatus: row.vaccinationStatus || row['Vaccination Status'] || 'Not Vaccinated',
              checkupDate: row.checkupDate || row['Checkup Date'] || new Date().toISOString().split('T')[0],
            } as HealthRecord;
          }).filter(record => record.name); // Filter out any empty rows

          setRecords(parsedRecords);
          toast({
            title: 'File Parsed Successfully',
            description: `${parsedRecords.length} records loaded from ${file.name}.`,
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
