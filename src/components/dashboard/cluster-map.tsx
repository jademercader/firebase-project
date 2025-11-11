'use client';
import { MapContainer, TileLayer, Circle, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '../ui/skeleton';
import { Info } from 'lucide-react';
import { useData } from '@/app/page';
import { Cluster, HealthRecord } from '@/lib/types';
import { useState, useEffect } from 'react';

interface ClusterMapProps {
  isLoading: boolean;
}

// Define coordinates for each Purok/Barangay.
// These are approximate coordinates for demonstration purposes around a sample area in the Philippines.
const purokCoordinates: { [key: string]: { lat: number; lng: number } } = {
  'Purok 1': { lat: 14.5995, lng: 120.9842 },
  'Purok 2': { lat: 14.6020, lng: 120.9860 },
  'Purok 3': { lat: 14.5980, lng: 120.9880 },
  'Purok 4': { lat: 14.5965, lng: 120.9835 },
};

// Default center for the map
const mapCenter: [number, number] = [14.5995, 120.9842];

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

const getClusterLocation = (cluster: Cluster): { lat: number; lng: number } | null => {
    const mostCommonPurok = getMostCommonPurok(cluster);
    return purokCoordinates[mostCommonPurok] || null;
}

const chartColorsHSL = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
];

const getChartColor = (index: number) => {
    return chartColorsHSL[index % chartColorsHSL.length];
};

export function ClusterMap({ isLoading }: ClusterMapProps) {
  const { clusters } = useData();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);


  const renderContent = () => {
    if (isLoading) {
      return <Skeleton className="w-full h-full" />;
    }
    
    // Only render the map on the client side after the component has mounted
    if (!isMounted) {
      return <Skeleton className="w-full h-full" />;
    }

    return (
      <MapContainer
        center={mapCenter}
        zoom={15}
        style={{ height: '100%', width: '100%', borderRadius: 'var(--radius)' }}
      >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            {clusters.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center p-4 bg-black/30 rounded-md z-[1000] pointer-events-none">
                <div className="text-center bg-background/80 backdrop-blur-sm text-foreground p-4 rounded-lg border">
                  <Info className="mx-auto h-8 w-8 text-primary mb-2" />
                  <h3 className="font-bold text-lg">Cluster Visualization</h3>
                  <p className="text-sm text-muted-foreground">Run analysis to see cluster locations on the map.</p>
                </div>
              </div>
            )}

            {clusters.map((cluster, index) => {
              const location = getClusterLocation(cluster);
              const mostCommonPurok = getMostCommonPurok(cluster);
              if (!location) return null;

              // Scale radius based on number of records
              const radius = 20 + Math.log(cluster.records.length + 1) * 15;
              const color = getChartColor(index);

              return (
                <Circle
                  key={cluster.id}
                  center={[location.lat, location.lng]}
                  radius={radius}
                  pathOptions={{
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.5,
                  }}
                >
                  <Popup>
                    <div className="font-bold">{cluster.name}</div>
                    <div>{cluster.records.length} records</div>
                    <div className="text-xs text-muted-foreground">Location: {mostCommonPurok}</div>
                  </Popup>
                </Circle>
              );
            })}
      </MapContainer>
    );
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="font-headline">Barangay Cluster Visualization</CardTitle>
      </CardHeader>
      <CardContent className="h-[400px] md:h-[500px] p-0">
        {renderContent()}
      </CardContent>
    </Card>
  );
}
