'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { PlayCircle } from 'lucide-react';
import { healthIndicators } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import { runClusterAnalysis } from '@/app/actions';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Database } from 'lucide-react';
import type { HealthRecord } from '@/lib/types';
import { mockHealthRecords } from '@/lib/mock-data';

const CLUSTERS_STORAGE_KEY = 'health_clusters';
const RECORDS_STORAGE_KEY = 'health_records';

export function ClusterControls() {
  const [numClusters, setNumClusters] = useState(3);
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>(
    healthIndicators.map(i => i.id)
  );
  const [isAnalysisRunning, setIsAnalysisRunning] = useState(false);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [isUsingUploadedData, setIsUsingUploadedData] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    try {
        const savedRecords = localStorage.getItem(RECORDS_STORAGE_KEY);
        if (savedRecords) {
            const parsedRecords = JSON.parse(savedRecords);
            if (parsedRecords.length > 0) {
                setHealthRecords(parsedRecords);
                setIsUsingUploadedData(true);
            } else {
                setHealthRecords(mockHealthRecords);
                setIsUsingUploadedData(false);
            }
        } else {
            setHealthRecords(mockHealthRecords);
            setIsUsingUploadedData(false);
        }
    } catch (error) {
        console.error("Failed to load records from localStorage", error);
        setHealthRecords(mockHealthRecords);
        setIsUsingUploadedData(false);
    }
  }, []);

  const handleIndicatorChange = (indicatorId: string, checked: boolean) => {
    setSelectedIndicators(prev => 
      checked ? [...prev, indicatorId] : prev.filter(id => id !== indicatorId)
    );
  };

  const handleRunAnalysis = async () => {
      setIsAnalysisRunning(true);
      
      const result = await runClusterAnalysis({
          healthRecordsData: JSON.stringify(healthRecords),
          healthIndicators: selectedIndicators,
          numClusters: numClusters,
      });

      if (result.success && result.data?.clusters) {
          localStorage.setItem(CLUSTERS_STORAGE_KEY, JSON.stringify(result.data.clusters));
          toast({
              title: "Analysis Complete",
              description: `${result.data.clusters.length} clusters have been identified. Map and charts updating...`
          });
          // Dispatch a storage event to notify other components like the map.
          window.dispatchEvent(new Event('storage'));
      } else {
          localStorage.removeItem(CLUSTERS_STORAGE_KEY);
          // Dispatch a storage event to clear the map and charts.
          window.dispatchEvent(new Event('storage'));
          toast({
              variant: "destructive",
              title: "Analysis Failed",
              description: result.error || "Could not run cluster analysis.",
          });
      }

      setIsAnalysisRunning(false);
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
        <Alert className={isUsingUploadedData ? 'border-primary/50 text-primary' : ''}>
          <Database className="h-4 w-4" />
          <AlertTitle className="font-bold">
            {isUsingUploadedData ? 'Using Uploaded Data' : 'Using Mock Data'}
          </AlertTitle>
          <AlertDescription>
            {isUsingUploadedData
              ? `Analysis will run on the ${healthRecords.length} records you uploaded.`
              : 'Please go to the Upload Data page to use your own file. Analysis is currently running on mock data.'}
          </AlertDescription>
        </Alert>
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
