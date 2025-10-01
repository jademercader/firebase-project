'use client';
import { useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UploadCloud, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FileUploaderProps {
    onFileSelected: (file: File) => void;
    onSaveData: () => void;
    hasRecords: boolean;
}

export function FileUploader({ onFileSelected, onSaveData, hasRecords }: FileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = () => {
    const file = fileInputRef.current?.files?.[0];
    if (file) {
      onFileSelected(file);
       toast({
        title: 'File Selected',
        description: `Using mock data from ${file.name} for preview.`,
      });
    }
  };

  const handleSaveClick = () => {
      onSaveData();
      toast({
        title: 'Data Saved for Analysis',
        description: 'Navigate to the dashboard to run cluster analysis.',
      });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Upload Health Records</CardTitle>
        <CardDescription>Upload records (CSV/XLSX) to make them available for analysis on the dashboard.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex w-full items-center space-x-2">
            <Input 
                type="file" 
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                ref={fileInputRef}
                onChange={handleFileChange}
             />
             <Button onClick={handleSaveClick} disabled={!hasRecords}>
                <Save className="mr-2 h-4 w-4" />
                Use this Data
            </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Note: This is a demo. Selecting a file loads mock data for processing.</p>
      </CardContent>
    </Card>
  );
}
