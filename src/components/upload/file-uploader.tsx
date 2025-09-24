'use client';
import { useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UploadCloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FileUploaderProps {
    onFileUpload: (file: File) => void;
}

export function FileUploader({ onFileUpload }: FileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUploadClick = () => {
    const file = fileInputRef.current?.files?.[0];
    if (file) {
      onFileUpload(file);
      toast({
        title: 'File "Uploaded"',
        description: `${file.name} is ready for processing.`,
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'No File Selected',
        description: 'Please select a file to upload.',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Upload Health Records</CardTitle>
        <CardDescription>Upload health records in CSV or XLSX format to begin analysis.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex w-full items-center space-x-2">
            <Input 
                type="file" 
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                ref={fileInputRef}
             />
            <Button onClick={handleUploadClick}>
                <UploadCloud className="mr-2 h-4 w-4" />
                Upload
            </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Max file size: 10MB. This is a demo, so uploaded files are not processed.</p>
      </CardContent>
    </Card>
  );
}
