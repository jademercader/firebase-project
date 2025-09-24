'use client';
import { useState } from 'react';
import { FileUploader } from '@/components/upload/file-uploader';
import { DataTable } from '@/components/upload/data-table';
import { CleansingSuggestions } from '@/components/upload/cleansing-suggestions';
import { HealthRecord } from '@/lib/types';
import { mockHealthRecords } from '@/lib/mock-data';

export default function UploadPage() {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileUpload = (file: File) => {
    // In a real app, you'd parse the file here.
    // For now, we just use the mock data when a file is selected.
    setSelectedFile(file);
    setRecords(mockHealthRecords);
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight font-headline">Data Upload & Cleansing</h2>
      </div>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <FileUploader onFileUpload={handleFileUpload} />
          <DataTable records={records} />
        </div>
        <div className="lg:col-span-1">
          <CleansingSuggestions records={records} />
        </div>
      </div>
    </div>
  );
}
