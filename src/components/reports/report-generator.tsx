'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getTrendAnalysis } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import type { Cluster } from '@/lib/types';
import { Printer, LineChart, FileWarning } from 'lucide-react';
import { useClusters } from '@/app/page';
import Link from 'next/link';

const SELECTED_CLUSTER_ID_KEY = 'selected_report_cluster_id';
const CLUSTERS_STORAGE_KEY = 'health_clusters';


export function ReportGenerator() {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const [generatedDate, setGeneratedDate] = useState('');
  const [trendAnalysisResult, setTrendAnalysisResult] = useState('');
  const [isTrendLoading, setIsTrendLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setGeneratedDate(new Date().toLocaleDateString());
    
    // Load clusters from localStorage
    try {
      const savedClustersRaw = localStorage.getItem(CLUSTERS_STORAGE_KEY);
      if (savedClustersRaw) {
        const savedClusters = JSON.parse(savedClustersRaw);
        if (savedClusters.length > 0) {
            setClusters(savedClusters);
            const savedClusterId = localStorage.getItem(SELECTED_CLUSTER_ID_KEY);
            const clusterToSelect =
                (savedClusterId && savedClusters.find((c: Cluster) => c.id.toString() === savedClusterId))
                || savedClusters[0];
            setSelectedCluster(clusterToSelect);
        }
      }
    } catch (error) {
        console.error("Failed to load or parse clusters from localStorage", error);
    }
  }, []);

  const handleClusterChange = (clusterId: string) => {
    const cluster = clusters.find((c) => c.id.toString() === clusterId);
    if (cluster) {
        setTrendAnalysisResult('');
        setSelectedCluster(cluster);
        localStorage.setItem(SELECTED_CLUSTER_ID_KEY, cluster.id.toString());
    }
  }

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
      healthIndicators: Object.keys(selectedCluster.healthMetrics).join(', '),
      timePeriod: 'yearly',
    };
    const result = await getTrendAnalysis(input);
    if (result.success && result.data) {
      setTrendAnalysisResult(result.data.trends);
       toast({
        title: 'Analysis Complete',
        description: 'Trends for the selected cluster have been generated.',
      });
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
                            onValueChange={handleClusterChange}
                        >
                            <SelectTrigger className="w-full md:w-[300px] mt-2">
                            <SelectValue placeholder="Select a cluster..." />
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
            ) : null}
        </CardContent>
      </Card>

      {clusters.length > 0 && selectedCluster ? (
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
      ) : (
        <Card>
            <CardContent className='p-8'>
                <div className='text-center text-muted-foreground flex flex-col items-center gap-4'>
                    <FileWarning className='w-16 h-16 text-primary/20' />
                    <div>
                        <h3 className='font-bold text-lg text-foreground'>No Analysis Data Found</h3>
                        <p className='mt-1'>To generate a new report, please go to the dashboard and run a cluster analysis first.</p>
                    </div>
                     <Button asChild>
                        <Link href="/">Go to Dashboard</Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
