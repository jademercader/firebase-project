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

const sampleCluster: Cluster = {
    id: 99,
    name: 'Sample: High-Risk Elders',
    records: [
        { id: 'S001', name: 'Elena Reyes', age: 75, gender: 'Female', address: 'Purok 5', disease: 'Hypertension', vaccinationStatus: 'Vaccinated', checkupDate: '2023-10-01' },
        { id: 'S002', name: 'Roberto Santos', age: 82, gender: 'Male', address: 'Purok 1', disease: 'Diabetes', vaccinationStatus: 'Partially Vaccinated', checkupDate: '2023-10-02' },
    ],
    demographics: {
        averageAge: 78.5,
        genderDistribution: { 'Female': 1, 'Male': 1 },
    },
    healthMetrics: {
        'Hypertension': 1,
        'Diabetes': 1,
        'Vaccinated': 1,
        'Partially Vaccinated': 1,
    },
};

const sampleTrendAnalysis = `Based on the latest data for the "High-Risk Elders" cluster, a concerning trend has emerged over the past quarter. There has been a 25% increase in hospital admissions related to complications from Diabetes. Additionally, while vaccination rates for influenza are high, booster uptake for pneumonia is lagging by 40% compared to other elderly clusters. No significant anomalies were detected in the prevalence of Hypertension. It is recommended to initiate a targeted awareness campaign for pneumonia boosters and a review of diabetes management plans for this group.`;


export function ReportGenerator() {
  const { clusters } = useClusters();
  const [allClusters, setAllClusters] = useState<Cluster[]>([sampleCluster]);
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(sampleCluster);
  const [generatedDate, setGeneratedDate] = useState('');
  const [trendAnalysisResult, setTrendAnalysisResult] = useState(sampleTrendAnalysis);
  const [isTrendLoading, setIsTrendLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setGeneratedDate(new Date().toLocaleDateString());
  }, []);

  useEffect(() => {
    const combined = [sampleCluster, ...clusters];
    setAllClusters(combined);
    
    // If there's no selected cluster or the selected one is no longer in the list, default to the sample.
    if (!selectedCluster || !combined.find(c => c.id === selectedCluster.id)) {
        setSelectedCluster(sampleCluster);
        setTrendAnalysisResult(sampleTrendAnalysis);
    }

  }, [clusters, selectedCluster]);


  const handleClusterChange = (clusterId: string) => {
    const cluster = allClusters.find((c) => c.id === parseInt(clusterId));
    setSelectedCluster(cluster || null);
    // Reset analysis if it's not the sample cluster
    if (cluster && cluster.id !== sampleCluster.id) {
        setTrendAnalysisResult('');
    } else {
        setTrendAnalysisResult(sampleTrendAnalysis);
    }
  }

  const handlePrint = () => {
    window.print();
  };

  const handleAnalyzeTrends = async () => {
    if (!selectedCluster || selectedCluster.id === sampleCluster.id) {
        toast({
            variant: 'default',
            title: 'Sample Report',
            description: 'This is a sample report with pre-generated trend analysis.',
        });
        return;
    }
    setIsTrendLoading(true);
    setTrendAnalysisResult('');
    const input = {
      clusterData: JSON.stringify([selectedCluster]), // Analyze only the selected cluster
      healthIndicators: Object.keys(selectedCluster.healthMetrics).join(', '),
      timePeriod: 'yearly',
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
            <CardDescription>Select a cluster to generate a detailed report. A sample is shown by default.</CardDescription>
          </div>
          <Button onClick={handlePrint} disabled={!selectedCluster}>
            <Printer className="mr-2 h-4 w-4" />
            Print Report
          </Button>
        </CardHeader>
        <CardContent className="print:hidden">
            <div className="flex items-end gap-4">
                 <div className='flex-grow'>
                    <label className='text-sm font-medium'>Select Cluster</label>
                    <Select
                        value={selectedCluster?.id.toString() ?? ''}
                        onValueChange={handleClusterChange}
                    >
                        <SelectTrigger className="w-full md:w-[300px] mt-2">
                        <SelectValue placeholder="Select a cluster" />
                        </SelectTrigger>
                        <SelectContent>
                        {allClusters.map((cluster) => (
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
          { clusters.length === 0 && (
             <p className="text-sm text-muted-foreground mt-4">
              To generate a new report, go to the Dashboard page and run a cluster analysis.
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
              <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                <li><span className='font-medium text-foreground'>Total Population:</span> {selectedCluster.records.length} individuals</li>
                <li><span className='font-medium text-foreground'>Average Age:</span> {selectedCluster.demographics.averageAge.toFixed(1)} years</li>
                <li>
                  <span className='font-medium text-foreground'>Gender Distribution:</span>{' '}
                  {Object.entries(selectedCluster.demographics.genderDistribution)
                    .map(([g, c]) => `${g}: ${c}`)
                    .join(', ')}
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg font-headline">Health Indicator Analysis</h3>
              <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                {Object.keys(selectedCluster.healthMetrics).length > 0 ? Object.entries(selectedCluster.healthMetrics).map(([indicator, value]) => (
                  <li key={indicator}>
                    <span className='font-medium text-foreground'>{indicator}:</span> {value} {typeof value === 'number' ? 'cases/status' : ''}
                  </li>
                )) : (
                    <li>No specific health metrics were analyzed for this cluster.</li>
                )}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg font-headline">Recent Trends & Anomalies</h3>
              <p className="text-muted-foreground mt-2 whitespace-pre-wrap leading-relaxed">
                {isTrendLoading ? 'Generating trend analysis...' : trendAnalysisResult || 'Click "Analyze Trends for Report" to generate insights for this cluster.'}
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground">This is an auto-generated report by Barangay Health Insights. For official use only.</p>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
