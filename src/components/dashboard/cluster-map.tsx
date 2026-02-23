'use client';
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '../ui/skeleton';
import { Layers, Crosshair, HelpCircle } from 'lucide-react';
import type { Cluster } from '@/lib/types';
import { useMounted } from '@/hooks/use-mounted';

const mapCenter: L.LatLngTuple = [12.0674, 124.5950];

const chartColors = [
  '#2563eb', '#f97316', '#16a34a', '#9333ea', '#e11d48',
  '#0891b2', '#ea580c', '#4f46e5', '#be185d', '#15803d',
];

const getChartColor = (index: number) => chartColors[index % chartColors.length];

const createRecordIcon = (color: string) => {
    return L.divIcon({
      className: "custom-record-dot",
      iconAnchor: [5, 5],
      html: `<div style="background-color: ${color}; width: 10px; height: 10px; border: 1.5px solid white; border-radius: 50%; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>`
    });
};

const createCentroidIcon = (color: string, clusterId: number) => {
    return L.divIcon({
      className: "custom-centroid-marker",
      iconAnchor: [15, 30],
      html: `<div style="color: ${color}; filter: drop-shadow(0 2px 5px rgba(0,0,0,0.4)); position: relative;">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" stroke="white" stroke-width="2">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                    <circle cx="12" cy="9" r="3" fill="white"/>
                </svg>
                <span style="position: absolute; top: 5px; left: 50%; transform: translateX(-50%); font-size: 9px; font-weight: 800; color: white;">${clusterId}</span>
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
    if (!mounted || !mapRef.current || mapInstanceRef.current) return;

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
              .bindPopup(`<strong>${record.name}</strong><br/>${cluster.name}`);
          }
        });

        if (cluster.centroid?.latitude !== undefined && cluster.centroid?.longitude !== undefined) {
            const center: L.LatLngTuple = [cluster.centroid.latitude as number, cluster.centroid.longitude as number];
            allPoints.push(center);
            L.marker(center, { icon: createCentroidIcon(color, cluster.id), zIndexOffset: 1000 })
              .addTo(centroidLayer)
              .bindPopup(`<div class="text-xs font-bold">${cluster.name}</div>`);
        }
      });
    }

    if (allPoints.length > 0) {
      try { 
        const bounds = L.latLngBounds(allPoints);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 }); 
      } catch (e) {
        console.warn("Map bounds calculation failed", e);
      }
    }
  }, [clusters]);

  useEffect(() => {
    if (!mounted) return;
    
    const fetchClusters = () => {
      setIsLoading(true);
      try {
        const saved = localStorage.getItem(CLUSTERS_STORAGE_KEY);
        if (saved) {
          setClusters(JSON.parse(saved));
        }
      } catch (err) {
        console.error("Error fetching clusters from storage:", err);
      } finally { 
        setIsLoading(false); 
      }
    };

    fetchClusters();
    
    window.addEventListener('analysis-updated', fetchClusters);
    window.addEventListener('storage', (e) => {
      if (e.key === CLUSTERS_STORAGE_KEY) fetchClusters();
    });

    return () => {
      window.removeEventListener('analysis-updated', fetchClusters);
    };
  }, [mounted]);

  if (!mounted) return <Skeleton className="h-[500px] w-full rounded-lg" />;

  return (
    <Card className="h-full border-primary/20 shadow-lg overflow-hidden flex flex-col min-h-[500px]">
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between shrink-0 bg-background/95 backdrop-blur z-[1001] border-b">
        <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <CardTitle className="font-headline text-lg">Spatial Distribution</CardTitle>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-black">
            <Crosshair className="w-3 h-3" />
            <span>Regional Hotspots</span>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 relative">
        <div ref={mapRef} className="absolute inset-0 z-0"></div>
        
        {clusters.length > 0 && (
            <div className="absolute bottom-4 left-4 z-[1000] bg-background/90 backdrop-blur-md p-3 rounded-lg border shadow-xl max-w-[220px]">
                <h4 className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground mb-2 flex items-center gap-1">
                    <HelpCircle className="w-3 h-3" />
                    Population Segments
                </h4>
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                    {clusters.map((c, i) => (
                        <div key={c.id} className="flex items-start gap-2">
                            <div className="w-2.5 h-2.5 rounded-full mt-1 shrink-0" style={{ backgroundColor: getChartColor(i) }} />
                            <div className="flex flex-col">
                                <span className="text-[11px] font-bold leading-tight">{c.name.split(':')[0]}</span>
                                <span className="text-[9px] text-muted-foreground leading-tight">{c.name.split(':')[1]?.trim() || 'General Segment'}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {isLoading && clusters.length === 0 && (
          <div className="absolute inset-0 z-[1001] flex items-center justify-center bg-background/20 backdrop-blur-[2px]">
            <Skeleton className="h-full w-full opacity-50" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
