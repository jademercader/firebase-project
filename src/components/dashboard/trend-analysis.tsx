'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { getTrendAnalysis } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { LineChart, ShieldAlert } from 'lucide-react';
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
    window.addEventListener('analysis-updated', fetchClusters);
    return () => window.removeEventListener('analysis-updated', fetchClusters);
  }, [mounted]);


  const handleAnalyzeTrends = async () => {
    if (clusters.length === 0) {
        toast({ variant: 'destructive', title: 'Analysis Standby', description: 'Run the clustering engine first.' });
        return;
    }
    setIsLoading(true);
    setAnalysisResult('');
    const result = await getTrendAnalysis({ clusterData: JSON.stringify(clusters) });
    if (result.success && result.data) {
      setAnalysisResult(result.data.trends);
    }
    setIsLoading(false);
  };

  if (!mounted) return null;

  return (
    <Card className="h-full flex flex-col border-primary/20 shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
            <LineChart className="w-5 h-5 text-primary" />
            Statistical Risk Summary
        </CardTitle>
        <CardDescription>Mathematical analysis of health risk levels per segment.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div className='flex-grow relative'>
          <Textarea
            placeholder={clusters.length === 0 ? "Execute analysis to compute risk trends." : "Statistical summary will appear here..."}
            value={analysisResult}
            readOnly
            className="h-[320px] resize-none bg-secondary/30 font-mono text-xs leading-relaxed border-none focus-visible:ring-0"
          />
          {isLoading && (
             <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-md">
                <div className="flex flex-col items-center gap-2">
                    <ActivityIcon className="animate-pulse w-8 h-8 text-primary" />
                    <p className="text-xs font-bold animate-pulse">COMPUTING RISK...</p>
                </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleAnalyzeTrends} disabled={isLoading || clusters.length === 0} className="w-full">
          {isLoading ? 'Processing...' : 'Identify High-Risk Diseases'}
        </Button>
      </CardFooter>
    </Card>
  );
}

function ActivityIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
    )
}