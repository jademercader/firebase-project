'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { getTrendAnalysis } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { LineChart, ShieldAlert, Activity } from 'lucide-react';
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
    <Card className="h-full flex flex-col border-primary/20 shadow-lg bg-white overflow-hidden">
      <CardHeader className="bg-slate-50/50 border-b pb-4">
        <CardTitle className="font-headline text-lg flex items-center gap-2 text-slate-900">
            <LineChart className="w-5 h-5 text-primary" />
            Statistical Risk Summary
        </CardTitle>
        <CardDescription className="text-xs">Mathematical analysis of health risk levels per identified cluster.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow p-0 relative overflow-hidden">
        <div className="h-full w-full absolute inset-0 p-4">
            <Textarea
              placeholder={clusters.length === 0 ? "Execute clustering engine to compute local risk trends." : "Statistical summary will appear here..."}
              value={analysisResult}
              readOnly
              className="h-full w-full resize-none bg-slate-50/30 font-mono text-xs leading-relaxed border-none focus-visible:ring-0 custom-scrollbar p-4 rounded-lg shadow-inner"
            />
        </div>
        {isLoading && (
             <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-2">
                    <ActivityIcon className="animate-pulse w-8 h-8 text-primary" />
                    <p className="text-xs font-black animate-pulse tracking-widest text-primary">COMPUTING RISK...</p>
                </div>
            </div>
          )}
      </CardContent>
      <CardFooter className="bg-slate-50/50 border-t p-4">
        <Button onClick={handleAnalyzeTrends} disabled={isLoading || clusters.length === 0} className="w-full shadow-sm hover:shadow-md transition-all">
          <ShieldAlert className="w-4 h-4 mr-2" />
          {isLoading ? 'Processing...' : 'Generate Statistical Risks'}
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
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
    )
}
