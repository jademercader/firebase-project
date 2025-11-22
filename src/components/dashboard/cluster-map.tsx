'use client';
import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '../ui/skeleton';
import { Info } from 'lucide-react';
import type { Cluster, HealthRecord } from '@/lib/types';
import type { Map as LeafletMap, LayerGroup } from 'leaflet';

interface ClusterMapProps {
  isLoading: boolean;
  clusters: Cluster[];
}

const purokCoordinates: { [key: string]: { lat: number; lng: number } } = {
  'Purok 1': { lat: 14.5995, lng: 120.9842 },
  'Purok 2': { lat: 14.6020, lng: 120.9860 },
  'Purok 3': { lat: 14.5980, lng: 120.9880 },
  'Purok 4': { lat: 14.5965, lng: 120.9835 },
};

const mapCenter: [number, number] = [14.5995, 120.9842];

const getMostCommonPurok = (cluster: Cluster): string => {
    if (!cluster.records || cluster.records.length === 0) return 'N/A';
    
    const purokCounts = cluster.records.reduce((acc, record: HealthRecord) => {
        const match = record.address?.match(/Purok\s*\d+/i);
        const purok = match ? match[0] : 'Unknown';
        if (purok !== 'Unknown') {
            acc[purok] = (acc[purok] || 0) + 1;
        }
        return acc;
    }, {} as { [key: string]: number });

    if (Object.keys(purokCounts).length === 0) return 'Unknown';

    return Object.keys(purokCounts).reduce((a, b) => purokCounts[a] > purokCounts[b] ? a : b);
}

const getClusterLocation = (cluster: Cluster): { lat: number; lng: number } | null => {
    const mostCommonPurok = getMostCommonPurok(cluster);
    const purokKey = mostCommonPurok.charAt(0).toUpperCase() + mostCommonPurok.slice(1).toLowerCase();
    const purokNum = purokKey.replace(' ', '');
    
    for (const key in purokCoordinates) {
        if(key.replace(' ', '') === purokNum){
            return purokCoordinates[key];
        }
    }
    return null;
}

const chartColorsHSL = [
    'hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))',
    'hsl(var(--chart-4))', 'hsl(var(--chart-5))',
];

const getChartColor = (index: number) => chartColorsHSL[index % chartColorsHSL.length];

export function ClusterMap({ isLoading, clusters }: ClusterMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const clusterLayerRef = useRef<LayerGroup | null>(null);
  const initializedRef = useRef(false);

  // Effect for initializing the map
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current || initializedRef.current) return;

    const initializeMap = async () => {
      const L = await import('leaflet');
      
      // Prevent re-initialization
      if (mapContainerRef.current && (mapContainerRef.current as any)._leaflet_id) {
          return;
      }
      
      mapInstanceRef.current = L.map(mapContainerRef.current!, {
          center: mapCenter,
          zoom: 15,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapInstanceRef.current);
      
      clusterLayerRef.current = L.layerGroup().addTo(mapInstanceRef.current);
      initializedRef.current = true;
    };

    initializeMap();

    // Cleanup function
    return () => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
            initializedRef.current = false;
        }
    };
  }, []); 

  // Effect for drawing/updating clusters
  useEffect(() => {
    if (!mapInstanceRef.current || !clusterLayerRef.current || !clusters) return;

    const L = require('leaflet');
    const layerGroup = clusterLayerRef.current;
    
    // Clear previous cluster circles
    layerGroup.clearLayers();

    // Draw new circles
    clusters.forEach((cluster, index) => {
      const location = getClusterLocation(cluster);
      if (!location) return;

      const radius = 20 + Math.log(cluster.records.length + 1) * 15;
      const color = getChartColor(index);
      
      const popupContent = `
        <div class="font-bold">${cluster.name}</div>
        <div>${cluster.records.length} records</div>
        <div class="text-xs text-muted-foreground">Location: ${getMostCommonPurok(cluster)}</div>
      `;

      L.circle([location.lat, location.lng], {
          radius: radius,
          color: color,
          fillColor: color,
          fillOpacity: 0.5,
      }).addTo(layerGroup).bindPopup(popupContent);
    });
  }, [clusters]);

  const renderContent = () => {
    if (isLoading) {
      return <Skeleton className="w-full h-full" />;
    }
    
    return (
      <div style={{ position: 'relative', height: '100%', width: '100%' }}>
        <div 
          ref={mapContainerRef} 
          style={{ height: '100%', width: '100%', borderRadius: 'var(--radius)' }}
        />
        {!isLoading && clusters.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center p-4 bg-black/30 rounded-md z-[1000] pointer-events-none">
            <div className="text-center bg-background/80 backdrop-blur-sm text-foreground p-4 rounded-lg border">
              <Info className="mx-auto h-8 w-8 text-primary mb-2" />
              <h3 className="font-bold text-lg">Cluster Visualization</h3>
              <p className="text-sm text-muted-foreground">Run analysis to see cluster locations on the map.</p>
            </div>
          </div>
        )}
      </div>
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
