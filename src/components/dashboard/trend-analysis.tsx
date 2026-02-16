
'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getTrendAnalysis } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { LineChart, ThumbsUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Cluster } from '@/lib/types';
import { useMounted } from '@/hooks/use-mounted';

const CLUSTERS_STORAGE_KEY = 'health_clusters';

export function TrendAnalysis() {
  const mounted = useMounted();
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [timePeriod, setTimePeriod] = useState('monthly');
  const { toast } = useToast();

  useEffect(() => {
    if (!mounted) return;
    const fetchClusters = () => {
        try {
            const savedClusters = localStorage.getItem(CLUSTERS_STORAGE_KEY);
            setClusters(savedClusters ? JSON.parse(savedClusters) : []);
        } catch (error) {
            console.error("Failed to load clusters from localStorage", error);
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
            description: 'Please run the cluster analysis first to generate clusters.',
        });
        return;
    }
    setIsLoading(true);
    setAnalysisResult('');
    const input = {
      clusterData: JSON.stringify(clusters),
      healthIndicators: 'disease prevalence, vaccination rates',
      timePeriod: timePeriod,
    };
    const result = await getTrendAnalysis(input);
    if (result.success && result.data) {
      setAnalysisResult(result.data.trends);
    } else {
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: result.error || 'Could not analyze trends. Please try again.',
      });
    }
    setIsLoading(false);
  };

  if (!mounted) {
    return <Skeleton className="h-full w-full rounded-lg" />;
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
            <LineChart className="w-6 h-6" />
            Trend Identification
        </CardTitle>
        <CardDescription>Analyze cluster data over time to identify significant trends and anomalies.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div>
            <Select value={timePeriod} onValueChange={setTimePeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Select time period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
        </div>
        <div className='flex-grow'>
          <Textarea
            placeholder={
              clusters.length === 0 
                ? "Run cluster analysis to enable trend identification."
                : "AI-generated trend analysis will appear here..."
            }
            value={analysisResult}
            readOnly
            className="h-48 resize-none bg-secondary/50"
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
          {isLoading ? 'Analyzing...' : 'Analyze Trends'}
        </Button>
        {analysisResult && (
            <Button variant="ghost" size="sm">
                <ThumbsUp className="w-4 h-4 mr-2" />
                Helpful
            </Button>
        )}
      </CardFooter>
    </Card>
  );
}
