
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
  
  const handleFileChange = () => {
    const file = fileInputRef.current?.files?.[0];
    if (file) {
      onFileSelected(file);
    }
  };

  const handleSaveClick = () => {
      onSaveData();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Upload Health Records</CardTitle>
        <CardDescription>Upload records (CSV format supported) to make them available for analysis on the dashboard.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row w-full items-start md:items-center space-y-4 md:space-y-0 md:space-x-2">
            <Input 
                type="file" 
                accept=".csv"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="flex-grow"
             />
             <Button 
                onClick={handleSaveClick} 
                disabled={!hasRecords}
                className="min-w-[200px]"
             >
                <Save className="mr-2 h-4 w-4" />
                Save Data for Analysis
            </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Note: Please ensure your CSV file has a header row.
        </p>
      </CardContent>
    </Card>
  );
}
