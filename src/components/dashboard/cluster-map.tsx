'use client';
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '../ui/skeleton';
import { Layers, MapPin, ChevronRight, ChevronLeft, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Cluster } from '@/lib/types';
import { useMounted } from '@/hooks/use-mounted';

const mapCenter: L.LatLngTuple = [12.0674, 124.5950];

const CHART_COLORS = [
  '#2563eb', // Blue
  '#f97316', // Orange
  '#16a34a', // Green
  '#9333ea', // Purple
  '#e11d48', // Red
  '#0891b2', // Cyan
  '#f59e0b', // Amber
  '#4f46e5', // Indigo
  '#be185d', // Pink
  '#15803d', // Dark Green
  '#1e40af', // Darker Blue
  '#c2410c', // Darker Orange
  '#166534', // Darker Green
  '#6b21a8', // Darker Purple
  '#991b1b', // Darker Red
];

const getChartColor = (index: number) => CHART_COLORS[index % CHART_COLORS.length];

const createRecordIcon = (color: string) => {
    return L.divIcon({
      className: "custom-record-dot",
      iconAnchor: [5, 5],
      html: `<div style="background-color: ${color}; width: 12px; height: 12px; border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3); transition: transform 0.2s;"></div>`
    });
};

const createCentroidIcon = (color: string, clusterId: number) => {
    return L.divIcon({
      className: "custom-centroid-marker",
      iconAnchor: [15, 30],
      html: `<div style="color: ${color}; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" stroke="white" stroke-width="2">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                    <circle cx="12" cy="9" r="3" fill="white"/>
                </svg>
                <span style="position: absolute; top: 6px; left: 50%; transform: translateX(-50%); font-size: 10px; font-weight: 900; color: white;">${clusterId}</span>
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
  const [isLegendOpen, setIsLegendOpen] = useState(false);

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
              .bindPopup(`
                <div class="p-2">
                  <strong class="text-sm font-bold">${record.name}</strong><br/>
                  <span class="text-xs text-muted-foreground font-medium">${cluster.name}</span><br/>
                  <div class="mt-2 flex flex-wrap gap-1">
                    <span class="px-2 py-0.5 bg-destructive/10 text-destructive text-[10px] font-bold rounded">${record.disease}</span>
                    <span class="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded">${record.age}y</span>
                  </div>
                </div>
              `);
          }
        });

        if (cluster.centroid?.latitude !== undefined && cluster.centroid?.longitude !== undefined) {
            const center: L.LatLngTuple = [cluster.centroid.latitude as number, cluster.centroid.longitude as number];
            allPoints.push(center);
            L.marker(center, { icon: createCentroidIcon(color, cluster.id), zIndexOffset: 1000 })
              .addTo(centroidLayer)
              .bindPopup(`<div class="text-xs font-bold p-1">${cluster.name}<br/><span class="font-normal">Calculated Hotspot Center</span></div>`);
        }
      });
    }

    if (allPoints.length > 0) {
      try { 
        const bounds = L.latLngBounds(allPoints);
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 }); 
      } catch (e) {
        console.warn("Map fitBounds failed", e);
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
          const parsed = JSON.parse(saved);
          setClusters(parsed);
          if (parsed.length > 0) setIsLegendOpen(true);
        }
      } catch (err) {
        console.error("Storage fetch failed", err);
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

  if (!mounted) return <Skeleton className="h-[600px] w-full rounded-xl" />;

  return (
    <Card className="h-full border-primary/10 shadow-xl overflow-hidden flex flex-col min-h-[600px] rounded-xl relative">
      <CardHeader className="py-4 px-6 flex flex-row items-center justify-between shrink-0 bg-background/95 backdrop-blur z-[1001] border-b">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
                <Layers className="w-5 h-5 text-primary" />
            </div>
            <div>
                <CardTitle className="font-headline text-lg">Spatial Health Distribution</CardTitle>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Consolidated Barangay Indicators</p>
            </div>
        </div>
        <div className="hidden md:flex items-center gap-4 text-[11px] font-bold text-muted-foreground">
            <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                <span>Patient Records</span>
            </div>
             <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span>Cluster Centroids</span>
            </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 relative">
        <div ref={mapRef} className="absolute inset-0 z-0"></div>
        
        {/* Collapsible Legend Panel - Positioned below the Zoom Controls (top-left) */}
        {clusters.length > 0 && (
          <div className={cn(
            "absolute top-[100px] left-3 z-[1000] transition-all duration-300 ease-in-out",
            isLegendOpen ? "w-[280px]" : "w-10 overflow-hidden"
          )}>
            <div className="bg-white/95 backdrop-blur-xl rounded-xl border border-slate-200 shadow-2xl flex flex-col h-full max-h-[450px]">
              <div className="flex items-center justify-between p-2 border-b shrink-0 bg-slate-50/50">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 hover:bg-slate-200 shrink-0"
                  onClick={() => setIsLegendOpen(!isLegendOpen)}
                >
                  {isLegendOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
                {isLegendOpen && (
                  <div className="flex items-center gap-2 pr-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Cluster Analysis</span>
                    <List className="w-3 h-3 text-primary" />
                  </div>
                )}
              </div>
              
              {isLegendOpen && (
                <div className="p-3 space-y-2 overflow-y-auto custom-scrollbar">
                  {clusters.map((c, i) => (
                    <div key={c.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200 group">
                      <div className="w-3 h-3 rounded-full mt-1 shrink-0 shadow-sm" style={{ backgroundColor: getChartColor(i) }} />
                      <div className="flex flex-col min-w-0">
                        <span className="text-[11px] font-bold text-slate-900 truncate leading-tight group-hover:text-primary transition-colors">
                          {c.name.includes(':') ? c.name.split(':')[1].trim() : c.name}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                           <span className="text-[9px] text-slate-500 font-black uppercase bg-white px-1 py-0.5 rounded border border-slate-100">
                             C{c.id}
                           </span>
                           <span className="text-[9px] text-slate-400 font-semibold italic">
                             {c.records.length} patients
                           </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {isLoading && clusters.length === 0 && (
          <div className="absolute inset-0 z-[1001] flex items-center justify-center bg-background/40 backdrop-blur-sm">
            <Skeleton className="h-full w-full opacity-60" />
            <div className="absolute flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-bold animate-pulse text-primary tracking-widest uppercase">Syncing Clustering Results...</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
