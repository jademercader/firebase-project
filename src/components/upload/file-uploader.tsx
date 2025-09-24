'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UploadCloud } from 'lucide-react';

export function FileUploader() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Upload Health Records</CardTitle>
        <CardDescription>Upload health records in CSV or XLSX format to begin analysis.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex w-full items-center space-x-2">
            <Input type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" />
            <Button>
                <UploadCloud className="mr-2 h-4 w-4" />
                Upload
            </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Max file size: 10MB.</p>
      </CardContent>
    </Card>
  );
}
