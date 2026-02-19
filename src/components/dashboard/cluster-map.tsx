'use client';
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '../ui/skeleton';
import { MapPin, Layers } from 'lucide-react';
import type { Cluster } from '@/lib/types';
import { useMounted } from '@/hooks/use-mounted';

const mapCenter: L.LatLngTuple = [12.0674, 124.5950]; // Calbayog City Default

const chartColors = [
  '#2563eb', '#f97316', '#16a34a', '#9333ea', '#e11d48',
  '#0891b2', '#ea580c', '#4f46e5', '#be185d', '#15803d',
];

const getChartColor = (index: number) => chartColors[index % chartColors.length];

const createRecordIcon = (color: string) => {
    return L.divIcon({
      className: "custom-record-dot",
      iconAnchor: [6, 6],
      html: `<div style="background-color: ${color}; width: 12px; height: 12px; border: 2px solid white; border-radius: 50%; box-shadow: 0 1px 4px rgba(0,0,0,0.4);"></div>`
    });
};

const createCentroidIcon = (color: string, clusterId: number) => {
    return L.divIcon({
      className: "custom-centroid-marker",
      iconAnchor: [15, 30],
      html: `<div style="color: ${color}; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5)); position: relative;">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" stroke="white" stroke-width="2">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                    <circle cx="12" cy="9" r="3" fill="white"/>
                </svg>
                <span style="position: absolute; top: 5px; left: 50%; transform: translateX(-50%); font-size: 10px; font-weight: bold; color: white;">${clusterId}</span>
             </div>`
    });
};

const CLUSTERS_STORAGE_KEY = 'health_clusters';

export function ClusterMap() {
  const mounted = useMounted();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);
  const centroidLayerRef = useRef<L.LayerGroup | null>(null);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current && mounted) {
      const map = L.map(mapRef.current, {
        zoomControl: true,
        scrollWheelZoom: true
      }).setView(mapCenter, 13);
      
      mapInstanceRef.current = map;
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      markerLayerRef.current = L.layerGroup().addTo(map);
      centroidLayerRef.current = L.layerGroup().addTo(map);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mounted]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const markerLayer = markerLayerRef.current;
    const centroidLayer = centroidLayerRef.current;
    if (!map || !markerLayer || !centroidLayer) return;

    markerLayer.clearLayers();
    centroidLayer.clearLayers();
    const allPoints: L.LatLngTuple[] = [];

    if (clusters.length > 0) {
      clusters.forEach((cluster, index) => {
        const color = getChartColor(index);
        
        cluster.records.forEach(record => {
          if (record.latitude !== undefined && record.longitude !== undefined) {
            const point: L.LatLngTuple = [record.latitude, record.longitude];
            allPoints.push(point);
            L.marker(point, { icon: createRecordIcon(color) })
              .addTo(markerLayer)
              .bindPopup(`
                <div class="p-2 min-w-[150px]">
                    <p class="font-bold border-b pb-1 mb-2 text-primary">${record.name}</p>
                    <div class="space-y-1 text-xs">
                        <p><strong>Cluster:</strong> <span style="color: ${color}">${cluster.name.split(':')[0]}</span></p>
                        <p><strong>Health:</strong> ${record.disease}</p>
                        <p class="text-[10px] text-muted-foreground mt-1 italic">${record.address}</p>
                    </div>
                </div>
              `);
          }
        });

        if (cluster.centroid?.latitude !== undefined && cluster.centroid?.longitude !== undefined) {
            const center: L.LatLngTuple = [cluster.centroid.latitude as number, cluster.centroid.longitude as number];
            allPoints.push(center);
            L.marker(center, { 
              icon: createCentroidIcon(color, cluster.id), 
              zIndexOffset: 1000 
            })
              .addTo(centroidLayer)
              .bindPopup(`
                <div class="p-2 text-center bg-secondary/10 rounded-lg border border-primary/20">
                    <p class="font-bold text-sm" style="color: ${color}">${cluster.name}</p>
                    <div class="mt-2 text-[10px]">
                        <p>Population Center</p>
                        <p>${cluster.records.length} records</p>
                    </div>
                </div>
              `);
        }
      });
    }

    if (allPoints.length > 0) {
      try {
        const bounds = L.latLngBounds(allPoints);
        map.fitBounds(bounds, { padding: [60, 60], animate: true });
      } catch (e) {
        console.error("Failed to fit map bounds", e);
      }
    }
  }, [clusters]);

  useEffect(() => {
    if (!mounted) return;
    const fetchClusters = () => {
      setIsLoading(true);
      try {
        const savedClusters = localStorage.getItem(CLUSTERS_STORAGE_KEY);
        setClusters(savedClusters ? JSON.parse(savedClusters) : []);
      } catch (error) {
        setClusters([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchClusters();
    window.addEventListener('storage', (e) => {
      if (e.key === CLUSTERS_STORAGE_KEY) fetchClusters();
    });
    window.addEventListener('analysis-updated', fetchClusters);
    return () => {
        window.removeEventListener('analysis-updated', fetchClusters);
    };
  }, [mounted]);

  if (!mounted) return <Skeleton className="h-full w-full rounded-lg" />;

  return (
    <Card className="h-full flex flex-col overflow-hidden relative">
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between shrink-0 bg-background/95 backdrop-blur z-[1001] border-b">
        <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <CardTitle className="font-headline text-lg">Calbayog Spatial Analysis</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 relative min-h-0">
        <div ref={mapRef} style={{ height: '100%', width: '100%' }}></div>
        {clusters.length > 0 && (
            <div className="absolute bottom-4 right-4 z-[1000] bg-background/90 backdrop-blur-md p-3 rounded-lg border shadow-lg max-w-[200px]">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 border-b pb-1">Cluster Legend</h4>
                <div className="space-y-2">
                    {clusters.map((c, i) => (
                        <div key={c.id} className="flex items-start gap-2">
                            <div className="w-3 h-3 rounded-full mt-0.5 shrink-0" style={{ backgroundColor: getChartColor(i) }} />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold leading-none">{c.name.split(':')[0]}</span>
                                <span className="text-[9px] text-muted-foreground">{c.records.length} patients</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </CardContent>
    </Card>
  );
}