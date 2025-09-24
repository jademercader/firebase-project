'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockTrendAnalysis } from '@/lib/mock-data';
import type { Cluster } from '@/lib/types';
import { Printer } from 'lucide-react';

export function ReportGenerator() {
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const [generatedDate, setGeneratedDate] = useState('');
  const [clusters, setClusters] = useState<Cluster[]>([]);

  useEffect(() => {
    setGeneratedDate(new Date().toLocaleDateString());
    // In a real app, you might fetch clusters or get them from a shared state.
    // For now, we'll leave this empty and let the user know they need to generate them.
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
        <Card>
            <CardHeader className='flex-row items-center justify-between'>
                <div>
                    <CardTitle className="font-headline">Report Configuration</CardTitle>
                    <CardDescription>Select a cluster to generate a detailed report.</CardDescription>
                </div>
                 <Button onClick={handlePrint} className='print:hidden'>
                    <Printer className="mr-2 h-4 w-4" />
                    Print Report
                </Button>
            </CardHeader>
            <CardContent>
                {clusters.length > 0 ? (
                    <Select
                        value={selectedCluster?.id.toString() ?? ""}
                        onValueChange={(value) => setSelectedCluster(clusters.find(c => c.id === parseInt(value)) || null)}
                    >
                        <SelectTrigger className="w-[300px]">
                            <SelectValue placeholder="Select a cluster" />
                        </SelectTrigger>
                        <SelectContent>
                            {clusters.map((cluster) => (
                            <SelectItem key={cluster.id} value={cluster.id.toString()}>
                                {cluster.name}
                            </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        No clusters available. Please run an analysis on the Dashboard page first.
                    </p>
                )}
            </CardContent>
        </Card>

      {selectedCluster && (
        <Card id="report-content">
          <CardHeader>
            <CardTitle className="text-2xl font-headline">{selectedCluster.name} - Health Report</CardTitle>
            <CardDescription>Generated on: {generatedDate}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg font-headline">Cluster Demographics</h3>
              <ul className="list-disc list-inside text-muted-foreground mt-2">
                <li>Number of Records: {selectedCluster.records.length}</li>
                <li>Average Age: {selectedCluster.demographics.averageAge.toFixed(1)} years</li>
                <li>Gender Distribution: {Object.entries(selectedCluster.demographics.genderDistribution).map(([g, c]) => `${g}: ${c}`).join(', ')}</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg font-headline">Health Indicator Analysis</h3>
              <ul className="list-disc list-inside text-muted-foreground mt-2">
                {Object.entries(selectedCluster.healthMetrics).map(([indicator, value]) => (
                    <li key={indicator}>{indicator}: {value} cases/status</li>
                ))}
              </ul>
            </div>
             <div>
              <h3 className="font-semibold text-lg font-headline">Recent Trends & Anomalies</h3>
              <p className="text-muted-foreground mt-2 whitespace-pre-wrap">{mockTrendAnalysis.trends}</p>
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground">This is an auto-generated report by Barangay Health Insights.</p>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
