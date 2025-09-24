'use client';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getTrendAnalysis } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { LineChart, ThumbsUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { mockClusters } from '@/lib/mock-data';

export function TrendAnalysis() {
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const { toast } = useToast();

  const handleAnalyzeTrends = async () => {
    setIsLoading(true);
    setAnalysisResult('');
    const input = {
      clusterData: JSON.stringify(mockClusters),
      healthIndicators: 'disease prevalence, vaccination rates',
      timePeriod: 'monthly',
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
            <Select defaultValue="monthly">
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
            placeholder="AI-generated trend analysis will appear here..."
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
        <Button onClick={handleAnalyzeTrends} disabled={isLoading}>
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
