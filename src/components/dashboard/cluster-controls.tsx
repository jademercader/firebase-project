'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { PlayCircle } from 'lucide-react';
import { healthIndicators, mockHealthRecords } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import { runClusterAnalysis } from '@/app/actions';
import { useClusters } from '@/app/page';

interface ClusterControlsProps {
    setIsLoading: (isLoading: boolean) => void;
}

export function ClusterControls({ setIsLoading }: ClusterControlsProps) {
  const { setClusters } = useClusters();
  const [numClusters, setNumClusters] = useState(3);
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>(
    healthIndicators.map(i => i.id)
  );
  const [isAnalysisRunning, setIsAnalysisRunning] = useState(false);
  const { toast } = useToast();

  const handleIndicatorChange = (indicatorId: string, checked: boolean) => {
    setSelectedIndicators(prev => 
      checked ? [...prev, indicatorId] : prev.filter(id => id !== indicatorId)
    );
  };

  const handleRunAnalysis = async () => {
      setIsAnalysisRunning(true);
      setIsLoading(true);
      if (setClusters) {
        setClusters([]);
      }
      
      const result = await runClusterAnalysis({
          healthRecordsData: JSON.stringify(mockHealthRecords),
          healthIndicators: selectedIndicators,
          numClusters: numClusters,
      });

      if (result.success && result.data && setClusters) {
          setClusters(result.data.clusters);
          toast({
              title: "Analysis Complete",
              description: `${result.data.clusters.length} clusters have been identified.`
          })
      } else {
          toast({
              variant: "destructive",
              title: "Analysis Failed",
              description: result.error || "Could not run cluster analysis.",
          });
      }

      setIsAnalysisRunning(false);
      setIsLoading(false);
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Cluster Analysis Tool</CardTitle>
        <CardDescription>
          Configure the parameters below to analyze the health data and identify distinct population clusters.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
            <Label>Select Health Indicators for Clustering</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {healthIndicators.map((indicator) => (
                    <div key={indicator.id} className="flex items-center space-x-2">
                        <Checkbox 
                            id={indicator.id} 
                            checked={selectedIndicators.includes(indicator.id)}
                            onCheckedChange={(checked) => handleIndicatorChange(indicator.id, !!checked)}
                        />
                        <label
                            htmlFor={indicator.id}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            {indicator.name}
                        </label>
                    </div>
                ))}
            </div>
        </div>
        <div className="space-y-4">
            <Label htmlFor="clusters">Number of Clusters: {numClusters}</Label>
            <Slider
              id="clusters"
              min={2}
              max={10}
              step={1}
              value={[numClusters]}
              onValueChange={(value) => setNumClusters(value[0])}
            />
            <p className="text-xs text-muted-foreground">Use the elbow method or domain knowledge to select the optimal number.</p>
        </div>
         <Button onClick={handleRunAnalysis} disabled={isAnalysisRunning}>
          <PlayCircle className="mr-2 h-4 w-4" />
          {isAnalysisRunning ? 'Analyzing...' : 'Run Cluster Analysis'}
        </Button>
      </CardContent>
    </Card>
  );
}
