'use client';
import { useState } from 'react';
import { FileUploader } from '@/components/upload/file-uploader';
import { DataTable } from '@/components/upload/data-table';
import { CleansingSuggestions } from '@/components/upload/cleansing-suggestions';
import { HealthRecord } from '@/lib/types';
import { mockHealthRecords } from '@/lib/mock-data';
import AppLayout from '@/components/layout/app-layout';
import { useToast } from '@/hooks/use-toast';

export default function UploadPage() {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileSelected = (file: File) => {
    // In a real app, you'd parse the file here.
    // For now, we just use the mock data when a file is selected.
    setSelectedFile(file);
    setRecords(mockHealthRecords);
     toast({
        title: 'File Ready for Preview',
        description: `Showing sample data. Press "Save Data for Analysis" to use it.`,
      });
  };
  
  const handleSaveData = () => {
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
