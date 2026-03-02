
'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { PlayCircle, Info, Database, AlertCircle, Loader2 } from 'lucide-react';
import { healthIndicators } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import { runClusterAnalysis } from '@/app/actions';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import type { HealthRecord } from '@/lib/types';
import { useMounted } from '@/hooks/use-mounted';
import { Skeleton } from '@/components/ui/skeleton';

const ANALYSIS_STORAGE_KEY = 'analysis_result';
const CLUSTERS_STORAGE_KEY = 'health_clusters';
const RECORDS_STORAGE_KEY = 'health_records';

export function ClusterControls() {
  const mounted = useMounted();
  const [numClusters, setNumClusters] = useState(3);
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([
    'age', 'gender', 'vaccinationStatus', 'disease'
  ]);
  const [isAnalysisRunning, setIsAnalysisRunning] = useState(false);
  const [localRecords, setLocalRecords] = useState<HealthRecord[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (!mounted) return;
    const fetchLocalData = () => {
        const saved = localStorage.getItem(RECORDS_STORAGE_KEY);
        if (saved) {
            setLocalRecords(JSON.parse(saved));
        }
    };
    fetchLocalData();
    window.addEventListener('storage', fetchLocalData);
    return () => window.removeEventListener('storage', fetchLocalData);
  }, [mounted]);

  const hasData = localRecords.length > 0;

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
      if (!hasData) {
        toast({
            variant: "destructive",
            title: "Analysis Denied",
            description: "No uploaded dataset detected. Please upload a file in the 'Upload Data' section first."
        });
        return;
      }

      setIsAnalysisRunning(true);
      
      const result = await runClusterAnalysis({
          healthRecordsData: JSON.stringify(localRecords),
          numClusters: numClusters,
          selectedIndicators: selectedIndicators
      });

      if (result.success && result.data) {
          const storedData = {
              ...result.data,
              selectedIndicators: selectedIndicators
          };
          localStorage.setItem(ANALYSIS_STORAGE_KEY, JSON.stringify(storedData));
          localStorage.setItem(CLUSTERS_STORAGE_KEY, JSON.stringify(result.data.clusters));
          
          toast({
              title: "Analysis Complete",
              description: `Processed ${localRecords.length} records into ${result.data.clusters.length} population clusters.`
          });

          window.dispatchEvent(new Event('analysis-updated'));
          window.dispatchEvent(new StorageEvent('storage', { key: ANALYSIS_STORAGE_KEY }));
      } else {
          toast({
              variant: "destructive",
              title: "Analysis Failed",
              description: result.error || "Could not run cluster analysis.",
          });
      }

      setIsAnalysisRunning(false);
  };

  if (!mounted) return <Skeleton className="h-[400px] w-full" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">K-Means Health Clustering Engine</CardTitle>
        <CardDescription>
          Identify population segments based on specific health markers using local records.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {hasData ? (
          <Alert className="border-primary/50 text-primary bg-primary/5">
            <Database className="h-4 w-4" />
            <AlertTitle className="font-bold">Source: Local Records</AlertTitle>
            <AlertDescription>
              Ready to analyze {localRecords.length} records detected in local storage.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert variant="destructive" className="bg-destructive/5">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="font-bold">No Dataset Found</AlertTitle>
            <AlertDescription>
              Analysis is on standby. Please go to the <strong>Upload Data</strong> page to provide a dataset.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
            <Label className="flex items-center gap-2">
              Select Analysis Dimensions
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
                                className="text-sm font-medium leading-none cursor-pointer"
                            >
                                {indicator.name}
                            </label>
                        </div>
                    );
                })}
            </div>
        </div>
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <Label htmlFor="clusters">Number of Clusters: {numClusters}</Label>
                <span className="text-xs font-bold text-primary px-2 py-0.5 bg-primary/10 rounded">{numClusters} SEGMENTS</span>
            </div>
            <Slider
              id="clusters"
              min={2}
              max={15}
              step={1}
              value={[numClusters]}
              onValueChange={(value) => setNumClusters(value[0])}
            />
            <p className="text-[10px] text-muted-foreground italic">Determine exactly how many segments you want to identify in Calbayog City.</p>
        </div>
         <Button 
            onClick={handleRunAnalysis} 
            disabled={isAnalysisRunning || !hasData} 
            className="w-full md:w-auto shadow-sm hover:shadow-md transition-all"
         >
          {isAnalysisRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <PlayCircle className="mr-2 h-4 w-4" />
              Execute Clustering Analysis
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
