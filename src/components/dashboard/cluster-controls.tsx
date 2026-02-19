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
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([
    'age', 'gender', 'vaccinationStatus'
  ]);
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
        setHealthRecords(mockHealthRecords);
        setIsUsingUploadedData(false);
    }
  }, [mounted]);

  const handleIndicatorChange = (indicatorId: string, checked: boolean) => {
    const indicatorMap: Record<string, string> = {
        'averageAge': 'age',
        'genderDistribution': 'gender',
        'vaccinationRates': 'vaccinationStatus',
        'diseasePrevalence': 'disease'
    };
    
    const propName = indicatorMap[indicatorId] || indicatorId;

    setSelectedIndicators(prev => 
      checked ? [...prev, propName] : prev.filter(id => id !== propName)
    );
  };

  const handleRunAnalysis = async () => {
      if (healthRecords.length === 0) {
        toast({
            variant: "destructive",
            title: "No Data",
            description: "Please upload a CSV file or ensure mock data is available."
        });
        return;
      }

      setIsAnalysisRunning(true);
      
      const result = await runClusterAnalysis({
          healthRecordsData: JSON.stringify(healthRecords),
          numClusters: numClusters,
          selectedIndicators: selectedIndicators
      });

      if (result.success && result.data) {
          localStorage.setItem(ANALYSIS_STORAGE_KEY, JSON.stringify(result.data));
          localStorage.setItem(CLUSTERS_STORAGE_KEY, JSON.stringify(result.data.clusters));
          
          toast({
              title: "Analysis Complete",
              description: `Processed ${healthRecords.length} records into ${result.data.clusters.length} segments.`
          });

          // Dispatch custom event for immediate UI synchronization
          window.dispatchEvent(new Event('analysis-updated'));
          // Dispatch storage event for other windows/tabs
          window.dispatchEvent(new StorageEvent('storage', { key: ANALYSIS_STORAGE_KEY }));
          window.dispatchEvent(new StorageEvent('storage', { key: CLUSTERS_STORAGE_KEY }));
      } else {
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
        <CardTitle className="font-headline">Local K-Means Clustering Engine</CardTitle>
        <CardDescription>
          Identify population segments based on uploaded dataset health markers.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert className={isUsingUploadedData ? 'border-primary/50 text-primary' : ''}>
          <Database className="h-4 w-4" />
          <AlertTitle className="font-bold">
            {isUsingUploadedData ? 'Dataset Source: Uploaded CSV' : 'Dataset Source: Mock Data'}
          </AlertTitle>
          <AlertDescription>
            {isUsingUploadedData
              ? `Ready to analyze ${healthRecords.length} records from your file.`
              : 'Using demonstration records. Upload a CSV with "latitude" and "longitude" columns to map your own data.'}
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
            <Label className="flex items-center gap-2">
              Select Analysis Dimensions (Euclidean Distance)
              <Info className="w-3 h-3 text-muted-foreground" />
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {healthIndicators.map((indicator) => {
                    const indicatorMap: Record<string, string> = {
                        'averageAge': 'age',
                        'genderDistribution': 'gender',
                        'vaccinationRates': 'vaccinationStatus',
                        'diseasePrevalence': 'disease'
                    };
                    const propName = indicatorMap[indicator.id] || indicator.id;
                    
                    return (
                        <div key={indicator.id} className="flex items-center space-x-2">
                            <Checkbox 
                                id={indicator.id} 
                                checked={selectedIndicators.includes(propName)}
                                onCheckedChange={(checked) => handleIndicatorChange(indicator.id, !!checked)}
                            />
                            <label
                                htmlFor={indicator.id}
                                className="text-sm font-medium leading-none"
                            >
                                {indicator.name}
                            </label>
                        </div>
                    );
                })}
            </div>
        </div>
        <div className="space-y-4">
            <Label htmlFor="clusters">Number of Segments (k): {numClusters}</Label>
            <Slider
              id="clusters"
              min={2}
              max={10}
              step={1}
              value={[numClusters]}
              onValueChange={(value) => setNumClusters(value[0])}
            />
            <p className="text-[10px] text-muted-foreground italic">Higher 'k' values increase segment specificity but may reduce cohesion.</p>
        </div>
         <Button onClick={handleRunAnalysis} disabled={isAnalysisRunning} className="w-full md:w-auto">
          <PlayCircle className="mr-2 h-4 w-4" />
          {isAnalysisRunning ? 'Processing Dataset...' : 'Execute Local Analysis'}
        </Button>
      </CardContent>
    </Card>
  );
}
