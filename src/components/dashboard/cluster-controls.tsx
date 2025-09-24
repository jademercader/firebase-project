'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { PlayCircle } from 'lucide-react';
import { healthIndicators } from '@/lib/mock-data';

export function ClusterControls() {
  const [numClusters, setNumClusters] = useState(3);

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
                        <Checkbox id={indicator.id} defaultChecked />
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
         <Button>
          <PlayCircle className="mr-2 h-4 w-4" />
          Run Cluster Analysis
        </Button>
      </CardContent>
    </Card>
  );
}
