'use client';
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '../ui/skeleton';
import { Info, MapPin } from 'lucide-react';
import type { Cluster } from '@/lib/types';
import { useMounted } from '@/hooks/use-mounted';

// Fix for default icon issue with Webpack
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const mapCenter: L.LatLngTuple = [14.5995, 120.9842]; // Manila default

const chartColors = ['#2563eb', '#f97316', '#16a34a', '#9333ea', '#e11d48', '#d97706', '#059669', '#7c3aed', '#be123c', '#65a30d'];
const getChartColor = (index: number) => chartColors[index % chartColors.length];

const createRecordIcon = (color: string) => {
    return L.divIcon({
      className: "custom-record-dot",
      iconAnchor: [6, 6],
      html: `<div style="background-color: ${color}; width: 12px; height: 12px; border: 2px solid white; border-radius: 50%; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>`
    });
};

const createCentroidIcon = (color: string) => {
    return L.divIcon({
      className: "custom-centroid-marker",
      iconAnchor: [12, 24],
      html: `<div style="color: ${color}; filter: drop-shadow(0 0 2px black);">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="white" stroke-width="2">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                    <circle cx="12" cy="9" r="2.5" fill="white"/>
                </svg>
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
      const map = L.map(mapRef.current).setView(mapCenter, 13);
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
        
        // Render Cluster Records (Dots)
        cluster.records.forEach(record => {
          if (record.latitude && record.longitude) {
            const point: L.LatLngTuple = [record.latitude, record.longitude];
            allPoints.push(point);
            L.marker(point, { icon: createRecordIcon(color) })
              .addTo(markerLayer)
              .bindPopup(`
                <div class="p-1">
                    <p class="font-bold border-b pb-1 mb-1">${record.name}</p>
                    <p class="text-xs"><strong>Cluster:</strong> ${cluster.name.split(':')[0]}</p>
                    <p class="text-xs"><strong>Address:</strong> ${record.address}</p>
                </div>
              `);
          }
        });

        // Render Cluster Centroid (The calculated "center" of the grouping)
        if (cluster.centroid?.latitude && cluster.centroid?.longitude) {
            const center: L.LatLngTuple = [cluster.centroid.latitude, cluster.centroid.longitude];
            L.marker(center, { icon: createCentroidIcon(color), zIndexOffset: 1000 })
              .addTo(centroidLayer)
              .bindPopup(`
                <div class="p-2 text-center">
                    <p class="font-bold text-sm" style="color: ${color}">${cluster.name}</p>
                    <p class="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Cluster Center</p>
                </div>
              `);
        }
      });
    }

    if (allPoints.length > 0) {
      map.fitBounds(L.latLngBounds(allPoints), { padding: [40, 40] });
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

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === CLUSTERS_STORAGE_KEY || event.key === null) {
        fetchClusters();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [mounted]);

  if (!mounted) return <Skeleton className="h-full w-full rounded-lg" />;

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
        <CardTitle className="font-headline text-lg">Spatial Cluster Distribution</CardTitle>
        <MapPin className="w-4 h-4 text-primary" />
      </CardHeader>
      <CardContent className="flex-1 p-0 relative">
        <div ref={mapRef} style={{ height: '100%', width: '100%' }}></div>
        {isLoading && (
          <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-background/50 backdrop-blur-sm">
            <Skeleton className="h-full w-full" />
          </div>
        )}
        {!isLoading && clusters.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center p-4 bg-black/10 z-[1000]">
            <div className="text-center bg-background/90 p-6 rounded-xl border shadow-xl max-w-xs">
              <Info className="mx-auto h-10 w-10 text-primary mb-3" />
              <h3 className="font-bold text-lg">No Spatial Data</h3>
              <p className="text-sm text-muted-foreground">Run analysis to plot cluster segments and their centers on the map.</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}