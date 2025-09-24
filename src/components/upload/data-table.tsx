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
import { mockHealthRecords } from '@/lib/mock-data';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

export function DataTable() {
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
                <TableHead padding="checkbox">
                    <Checkbox />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Disease</TableHead>
                <TableHead>Vaccination Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockHealthRecords.map((record) => (
                <TableRow key={record.id}>
                   <TableCell padding="checkbox">
                        <Checkbox />
                    </TableCell>
                  <TableCell className="font-medium">{record.name}</TableCell>
                  <TableCell>{record.age}</TableCell>
                  <TableCell>{record.gender}</TableCell>
                  <TableCell>
                    <Badge variant={record.disease === 'None' ? 'secondary' : 'destructive'}>
                      {record.disease}
                    </Badge>
                  </TableCell>
                  <TableCell>{record.vaccinationStatus}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
