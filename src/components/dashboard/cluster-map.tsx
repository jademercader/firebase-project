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

const mapCenter: [number, number] = [14.5995, 120.9842]; // Default to Manila

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
      
      if (mapContainerRef.current && !mapInstanceRef.current) {
          mapInstanceRef.current = L.map(mapContainerRef.current, {
              center: mapCenter,
              zoom: 11,
          });

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          }).addTo(mapInstanceRef.current);
          
          clusterLayerRef.current = L.layerGroup().addTo(mapInstanceRef.current);
      }
    };

    initializeMap();

    return () => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }
    };
  }, []);

  // Effect for drawing/updating clusters
  useEffect(() => {
    if (!mapInstanceRef.current || !clusterLayerRef.current) return;

    const L = require('leaflet');
    const layerGroup = clusterLayerRef.current;
    
    layerGroup.clearLayers();
    const markers: any[] = [];

    if (clusters && clusters.length > 0) {
        clusters.forEach((cluster, index) => {
          const color = getChartColor(index);
          
          cluster.records.forEach((record) => {
            if (record.latitude && record.longitude) {
              const popupContent = `
                <div class="font-bold">${record.name}</div>
                <div>Cluster: ${cluster.name}</div>
                <div class="text-xs text-muted-foreground">${record.address}</div>
              `;

              const circleMarker = L.circleMarker([record.latitude, record.longitude], {
                  radius: 8,
                  color: color,
                  fillColor: color,
                  fillOpacity: 0.7,
              }).addTo(layerGroup).bindPopup(popupContent);
              markers.push(circleMarker);
            }
          });
        });
        
        if (markers.length > 0) {
            const featureGroup = L.featureGroup(markers);
            mapInstanceRef.current.fitBounds(featureGroup.getBounds(), { padding: [50, 50] });
        } else {
            // If no markers could be drawn (e.g., failed geocoding), reset to default view
            mapInstanceRef.current.setView(mapCenter, 11);
        }
    }
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
