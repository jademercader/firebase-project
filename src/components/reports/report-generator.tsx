'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getTrendAnalysis } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import type { Cluster } from '@/lib/types';
import { Printer, LineChart } from 'lucide-react';
import { useClusters } from '@/app/page';

export function ReportGenerator() {
  const { clusters } = useClusters();
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const [generatedDate, setGeneratedDate] = useState('');
  const [trendAnalysisResult, setTrendAnalysisResult] = useState('');
  const [isTrendLoading, setIsTrendLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setGeneratedDate(new Date().toLocaleDateString());
  }, []);

  useEffect(() => {
    if (clusters.length > 0 && !selectedCluster) {
      setSelectedCluster(clusters[0]);
    } else if (clusters.length === 0) {
      setSelectedCluster(null);
    }
    setTrendAnalysisResult(''); // Reset trend analysis when clusters change
  }, [clusters, selectedCluster]);

  const handlePrint = () => {
    window.print();
  };

  const handleAnalyzeTrends = async () => {
    if (!selectedCluster) {
        toast({
            variant: 'destructive',
            title: 'No Cluster Selected',
            description: 'Please select a cluster to analyze.',
        });
        return;
    }
    setIsTrendLoading(true);
    setTrendAnalysisResult('');
    const input = {
      clusterData: JSON.stringify([selectedCluster]), // Analyze only the selected cluster
      healthIndicators: 'disease prevalence, vaccination rates',
      timePeriod: 'yearly', // Or make this selectable
    };
    const result = await getTrendAnalysis(input);
    if (result.success && result.data) {
      setTrendAnalysisResult(result.data.trends);
    } else {
      toast({
        variant: 'destructive',
        title: 'Trend Analysis Failed',
        description: result.error || 'Could not analyze trends for the report.',
      });
    }
    setIsTrendLoading(false);
  };


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between print:hidden">
          <div>
            <CardTitle className="font-headline">Report Configuration</CardTitle>
            <CardDescription>Select a cluster to generate a detailed report.</CardDescription>
          </div>
          <Button onClick={handlePrint} disabled={!selectedCluster}>
            <Printer className="mr-2 h-4 w-4" />
            Print Report
          </Button>
        </CardHeader>
        <CardContent className="print:hidden">
          {clusters.length > 0 ? (
            <div className="flex items-end gap-4">
                 <div className='flex-grow'>
                    <label className='text-sm font-medium'>Select Cluster</label>
                    <Select
                        value={selectedCluster?.id.toString() ?? ''}
                        onValueChange={(value) =>
                            setSelectedCluster(clusters.find((c) => c.id === parseInt(value)) || null)
                        }
                    >
                        <SelectTrigger className="w-full md:w-[300px] mt-2">
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
                 </div>
                 <Button onClick={handleAnalyzeTrends} disabled={isTrendLoading || !selectedCluster}>
                    <LineChart className="mr-2 h-4 w-4" />
                    {isTrendLoading ? 'Analyzing...' : 'Analyze Trends for Report'}
                </Button>
            </div>
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
                <li>
                  Gender Distribution:{' '}
                  {Object.entries(selectedCluster.demographics.genderDistribution)
                    .map(([g, c]) => `${g}: ${c}`)
                    .join(', ')}
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg font-headline">Health Indicator Analysis</h3>
              <ul className="list-disc list-inside text-muted-foreground mt-2">
                {Object.entries(selectedCluster.healthMetrics).map(([indicator, value]) => (
                  <li key={indicator}>
                    {indicator}: {value} cases/status
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg font-headline">Recent Trends & Anomalies</h3>
              <p className="text-muted-foreground mt-2 whitespace-pre-wrap">
                {isTrendLoading ? 'Generating trend analysis...' : trendAnalysisResult || 'Click "Analyze Trends for Report" to generate insights for this cluster.'}
              </p>
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
