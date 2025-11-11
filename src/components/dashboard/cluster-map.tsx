'use client';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Skeleton } from '../ui/skeleton';
import { MapPin, Info } from 'lucide-react';
import { useData } from '@/app/page';
import { Cluster, HealthRecord } from '@/lib/types';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';

interface ClusterMapProps {
  isLoading: boolean;
}

const purokCoordinates: { [key: string]: { top: string; left: string } } = {
  'Purok 1': { top: '35%', left: '25%' },
  'Purok 2': { top: '50%', left: '45%' },
  'Purok 3': { top: '30%', left: '65%' },
  'Purok 4': { top: '65%', left: '70%' },
};

const getMostCommonPurok = (cluster: Cluster): string => {
    if (!cluster.records || cluster.records.length === 0) {
        return 'N/A';
    }

    const purokCounts = cluster.records.reduce((acc, record: HealthRecord) => {
        const purok = record.address;
        if (purok) {
            acc[purok] = (acc[purok] || 0) + 1;
        }
        return acc;
    }, {} as { [key: string]: number });

    const mostCommonPurok = Object.keys(purokCounts).reduce((a, b) =>
        purokCounts[a] > purokCounts[b] ? a : b
    , 'Unknown');
    
    return mostCommonPurok;
}


const getClusterLocation = (cluster: Cluster): { top: string; left: string } | null => {
    const mostCommonPurok = getMostCommonPurok(cluster);
    return purokCoordinates[mostCommonPurok] || null;
}

export function ClusterMap({ isLoading }: ClusterMapProps) {
  const mapImage = PlaceHolderImages.find((img) => img.id === 'map');
  const { clusters } = useData();
  const chartColors = ['--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5'];

  const renderContent = () => {
    if (isLoading) {
      return <Skeleton className="w-full h-full" />;
    }

    if (!mapImage) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
          <MapPin className="w-12 h-12 mb-4" />
          <p>Map image not available.</p>
        </div>
      );
    }

    return (
      <TooltipProvider>
        <Image
          src={mapImage.imageUrl}
          alt={mapImage.description}
          data-ai-hint={mapImage.imageHint}
          fill
          className="object-cover rounded-md"
          priority
        />
        {clusters.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center p-4 bg-black/30 rounded-md">
            <div className="text-center bg-background/80 backdrop-blur-sm text-foreground p-4 rounded-lg border">
              <Info className="mx-auto h-8 w-8 text-primary mb-2" />
              <h3 className="font-bold text-lg">Cluster Visualization</h3>
              <p className="text-sm text-muted-foreground">Run analysis to see cluster locations.</p>
            </div>
          </div>
        )}
        {clusters.map((cluster, index) => {
            const location = getClusterLocation(cluster);
            const mostCommonPurok = getMostCommonPurok(cluster);
            if (!location) return null;

            const colorVar = chartColors[index % chartColors.length];

            return (
                 <Tooltip key={cluster.id}>
                    <TooltipTrigger asChild>
                        <div
                            className="absolute w-4 h-4 rounded-full animate-pulse"
                            style={{ 
                                top: location.top, 
                                left: location.left,
                                backgroundColor: `hsl(var(${colorVar}))`,
                                border: '2px solid white',
                                boxShadow: '0 0 10px hsl(var(--background)), 0 0 5px hsl(var(--background))'
                            }}
                        />
                    </TooltipTrigger>
                    <TooltipContent>
                        <p className='font-bold'>{cluster.name}</p>
                        <p className="text-sm text-muted-foreground">{cluster.records.length} records</p>
                        <Separator className="my-1" />
                        <p className="text-xs">Most common location: <span className='font-semibold'>{mostCommonPurok}</span></p>
                    </TooltipContent>
                </Tooltip>
            )
        })}
      </TooltipProvider>
    );
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="font-headline">Barangay Cluster Visualization</CardTitle>
      </CardHeader>
      <CardContent className="h-[400px] md:h-[500px] relative">
        {renderContent()}
      </CardContent>
    </Card>
  );
}
