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

const cityCoordinates: { [key: string]: { lat: number; lng: number } } = {
  'Manila': { lat: 14.5995, lng: 120.9842 },
  'Quezon City': { lat: 14.6760, lng: 121.0437 },
  'Caloocan': { lat: 14.656, lng: 120.9822 },
  'Makati': { lat: 14.5547, lng: 121.0244 },
  'Pasig': { lat: 14.5764, lng: 121.0851 },
  'Taguig': { lat: 14.5176, lng: 121.0509 }
};

const mapCenter: [number, number] = [14.5995, 120.9842]; // Default to Manila

const getMostCommonCity = (cluster: Cluster): string => {
    if (!cluster.records || cluster.records.length === 0) return 'N/A';
    
    const cityCounts = cluster.records.reduce((acc, record: HealthRecord) => {
        const address = record.address || '';
        const foundCity = Object.keys(cityCoordinates).find(city => 
            new RegExp(`\\b${city}\\b`, 'i').test(address)
        );

        if (foundCity) {
            acc[foundCity] = (acc[foundCity] || 0) + 1;
        }
        return acc;
    }, {} as { [key: string]: number });

    if (Object.keys(cityCounts).length === 0) return 'Unknown';

    return Object.keys(cityCounts).reduce((a, b) => cityCounts[a] > cityCounts[b] ? a : b);
}

const getClusterLocation = (cluster: Cluster): { lat: number; lng: number } | null => {
    const mostCommonCity = getMostCommonCity(cluster);
    if (cityCoordinates[mostCommonCity]) {
      return cityCoordinates[mostCommonCity];
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
  
  // Effect for initializing the map
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    const initializeMap = async () => {
      const L = await import('leaflet');
      
      // Initialize the map ONLY if it hasn't been initialized yet
      if (mapContainerRef.current && !mapInstanceRef.current) {
          mapInstanceRef.current = L.map(mapContainerRef.current, {
              center: mapCenter,
              zoom: 11,
          });

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          }).addTo(mapInstanceRef.current);
          
          // Initialize and add the cluster layer group to the map
          clusterLayerRef.current = L.layerGroup().addTo(mapInstanceRef.current);
      }
    };

    initializeMap();

    // Cleanup function to run when the component unmounts
    return () => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }
    };
  }, []); // Empty dependency array ensures this runs only once

  // Effect for drawing/updating clusters
  useEffect(() => {
    // Ensure map and layer group are ready
    if (!mapInstanceRef.current || !clusterLayerRef.current) return;

    const L = require('leaflet');
    const layerGroup = clusterLayerRef.current;
    
    // Clear previous cluster circles before drawing new ones
    layerGroup.clearLayers();

    // If there are clusters, draw them
    if (clusters && clusters.length > 0) {
        clusters.forEach((cluster, index) => {
          const location = getClusterLocation(cluster);
          if (!location) return; // Skip if no location can be determined

          const radius = 500 + Math.log(cluster.records.length + 1) * 250;
          const color = getChartColor(index);
          
          const popupContent = `
            <div class="font-bold">${cluster.name}</div>
            <div>${cluster.records.length} records</div>
            <div class="text-xs text-muted-foreground">Location: ${getMostCommonCity(cluster)}</div>
          `;

          L.circle([location.lat, location.lng], {
              radius: radius,
              color: color,
              fillColor: color,
              fillOpacity: 0.5,
          }).addTo(layerGroup).bindPopup(popupContent);
        });
    }
  }, [clusters]); // This effect re-runs whenever the 'clusters' prop changes

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
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="font-headline">Barangay Cluster Visualization</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        {renderContent()}
      </CardContent>
    </Card>
  );
}
