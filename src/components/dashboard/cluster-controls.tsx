
'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { PlayCircle, Info, Database } from 'lucide-react';
import { healthIndicators } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import { runClusterAnalysis } from '@/app/actions';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import type { HealthRecord } from '@/lib/types';
import { mockHealthRecords } from '@/lib/mock-data';
import { useMounted } from '@/hooks/use-mounted';

const ANALYSIS_STORAGE_KEY = 'analysis_result';
const RECORDS_STORAGE_KEY = 'health_records';
const CLUSTERS_STORAGE_KEY = 'health_clusters';

export function ClusterControls() {
  const mounted = useMounted();
  const [numClusters, setNumClusters] = useState(3);
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>(
    healthIndicators.map(i => i.id)
  );
  const [isAnalysisRunning, setIsAnalysisRunning] = useState(false);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [isUsingUploadedData, setIsUsingUploadedData] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!mounted) return;
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
  }, [mounted]);

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

      if (result.success && result.data) {
          localStorage.setItem(ANALYSIS_STORAGE_KEY, JSON.stringify(result.data));
          localStorage.setItem(CLUSTERS_STORAGE_KEY, JSON.stringify(result.data.clusters));
          toast({
              title: "K-Means Analysis Complete",
              description: `Successfully identified ${result.data.clusters.length} population segments.`
          });
          window.dispatchEvent(new StorageEvent('storage', { key: ANALYSIS_STORAGE_KEY }));
      } else {
          localStorage.removeItem(ANALYSIS_STORAGE_KEY);
          window.dispatchEvent(new StorageEvent('storage', { key: ANALYSIS_STORAGE_KEY }));
          toast({
              variant: "destructive",
              title: "Analysis Failed",
              description: result.error || "Could not run cluster analysis.",
          });
      }

      setIsAnalysisRunning(false);
  };

  if (!mounted) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Objective-Based Clustering Tool</CardTitle>
        <CardDescription>
          Apply the K-Means algorithm to identify distinct Barangay segments based on health similarities.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert className={isUsingUploadedData ? 'border-primary/50 text-primary' : ''}>
          <Database className="h-4 w-4" />
          <AlertTitle className="font-bold">
            {isUsingUploadedData ? 'Consolidated Data Source Active' : 'Mock Data in Use'}
          </AlertTitle>
          <AlertDescription>
            {isUsingUploadedData
              ? `Currently processing ${healthRecords.length} consolidated records.`
              : 'Using mock records. Upload a CSV to fulfill Objective 1.'}
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
            <Label className="flex items-center gap-2">
              Select Health Indicator Parameters
              <Info className="w-3 h-3 text-muted-foreground" />
            </Label>
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
            <Label htmlFor="clusters">Number of Clusters (k): {numClusters}</Label>
            <Slider
              id="clusters"
              min={2}
              max={8}
              step={1}
              value={[numClusters]}
              onValueChange={(value) => setNumClusters(value[0])}
            />
            <p className="text-[10px] text-muted-foreground italic">Optimizing cluster count maximizes validation accuracy.</p>
        </div>
         <Button onClick={handleRunAnalysis} disabled={isAnalysisRunning} className="w-full md:w-auto" suppressHydrationWarning>
          <PlayCircle className="mr-2 h-4 w-4" />
          {isAnalysisRunning ? 'Processing Algorithm...' : 'Execute Clustering Analysis'}
        </Button>
      </CardContent>
    </Card>
  );
}
