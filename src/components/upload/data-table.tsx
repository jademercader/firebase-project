'use client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import type { HealthRecord } from '@/lib/types';

interface DataTableProps {
    records: HealthRecord[];
}

export function DataTable({ records }: DataTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Uploaded Data Preview</CardTitle>
        <CardDescription>Review and verify the uploaded health records below.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                    <Checkbox />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Disease</TableHead>
                <TableHead>Vaccination Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length > 0 ? records.map((record) => (
                <TableRow key={record.id}>
                   <TableCell>
                        <Checkbox />
                    </TableCell>
                  <TableCell className="font-medium">{record.name}</TableCell>
                  <TableCell>{record.age}</TableCell>
                  <TableCell>{record.gender}</TableCell>
                  <TableCell>{record.address}</TableCell>
                  <TableCell>
                    <Badge variant={record.disease === 'None' ? 'secondary' : 'destructive'}>
                      {record.disease}
                    </Badge>
                  </TableCell>
                  <TableCell>{record.vaccinationStatus}</TableCell>
                </TableRow>
              )) : (
                <TableRow>
                    <TableCell colSpan={7} className="text-center h-24">
                        No data to display. Please upload a file.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
