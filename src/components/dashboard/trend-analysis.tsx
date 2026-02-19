
'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { getTrendAnalysis } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { LineChart, BarChart } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Cluster } from '@/lib/types';
import { useMounted } from '@/hooks/use-mounted';

const CLUSTERS_STORAGE_KEY = 'health_clusters';

export function TrendAnalysis() {
  const mounted = useMounted();
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    if (!mounted) return;
    const fetchClusters = () => {
        try {
            const savedClusters = localStorage.getItem(CLUSTERS_STORAGE_KEY);
            setClusters(savedClusters ? JSON.parse(savedClusters) : []);
        } catch (error) {
            setClusters([]);
        }
    };
    fetchClusters();

    const handleStorageChange = () => fetchClusters();
    window.addEventListener('storage', handleStorageChange);

    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };

  }, [mounted]);


  const handleAnalyzeTrends = async () => {
    if (clusters.length === 0) {
        toast({
            variant: 'destructive',
            title: 'No Clusters Found',
            description: 'Please run the cluster analysis first.',
        });
        return;
    }
    setIsLoading(true);
    setAnalysisResult('');
    
    const result = await getTrendAnalysis({
      clusterData: JSON.stringify(clusters),
    });

    if (result.success && result.data) {
      setAnalysisResult(result.data.trends);
    } else {
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: result.error || 'Could not analyze trends.',
      });
    }
    setIsLoading(false);
  };

  if (!mounted) return null;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
            <LineChart className="w-6 h-6" />
            Segment Statistical Trends
        </CardTitle>
        <CardDescription>Locally computed insights based on population demographics and health metrics.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div className='flex-grow'>
          <Textarea
            placeholder={
              clusters.length === 0 
                ? "Run analysis to enable statistical insights."
                : "Computed trends will appear here..."
            }
            value={analysisResult}
            readOnly
            className="h-64 resize-none bg-secondary/50"
          />
          {isLoading && (
             <div className="space-y-2 mt-2">
                <Skeleton className="h-4 w-[80%]" />
                <Skeleton className="h-4 w-[90%]" />
                <Skeleton className="h-4 w-[75%]" />
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button onClick={handleAnalyzeTrends} disabled={isLoading || clusters.length === 0}>
          {isLoading ? 'Processing...' : 'Generate Trends'}
        </Button>
      </CardFooter>
    </Card>
  );
}
