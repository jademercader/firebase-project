'use client';
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '../ui/skeleton';
import { Info } from 'lucide-react';
import type { Cluster } from '@/lib/types';

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

const mapCenter: L.LatLngTuple = [14.5995, 120.9842]; // Default to Manila

const chartColors = ['#2563eb', '#f97316', '#16a34a', '#9333ea', '#e11d48', '#d97706', '#059669', '#7c3aed', '#be123c', '#65a30d'];
const getChartColor = (index: number) => chartColors[index % chartColors.length];

const createColorIcon = (color: string) => {
    const markerHtmlStyles = `
      background-color: ${color};
      width: 1.5rem;
      height: 1.5rem;
      display: block;
      left: -0.75rem;
      top: -0.75rem;
      position: relative;
      border-radius: 1.5rem 1.5rem 0;
      transform: rotate(45deg);
      border: 1px solid #FFFFFF;`;

    return L.divIcon({
      className: "my-custom-pin",
      iconAnchor: [0, 24],
      popupAnchor: [0, -36],
      html: `<span style="${markerHtmlStyles}" />`
    });
};

const CLUSTERS_STORAGE_KEY = 'health_clusters';

export function ClusterMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Effect to initialize the map and its cleanup
  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      const map = L.map(mapRef.current).setView(mapCenter, 11);
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      markerLayerRef.current = L.layerGroup().addTo(map);
    }

    // Cleanup function to destroy the map instance
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // Empty dependency array ensures this runs only once

  // Effect to update markers and map bounds when clusters change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markerLayer = markerLayerRef.current;
    if (!map || !markerLayer) return;

    markerLayer.clearLayers();
    const allPoints: L.LatLngTuple[] = [];

    if (clusters.length > 0) {
      clusters.forEach((cluster, index) => {
        cluster.records.forEach(record => {
          if (record.latitude && record.longitude) {
            const point: L.LatLngTuple = [record.latitude, record.longitude];
            allPoints.push(point);
            L.marker(point, { icon: createColorIcon(getChartColor(index)) })
              .addTo(markerLayer)
              .bindPopup(`<div class="p-1"><p class="font-bold">${record.name}</p><p class="text-xs text-muted-foreground">${record.address}</p></div>`);
          }
        });
      });
    }

    if (allPoints.length > 0) {
      map.fitBounds(L.latLngBounds(allPoints), { padding: [50, 50] });
    } else {
      map.setView(mapCenter, 11);
    }
  }, [clusters]);

  // Effect to fetch data from localStorage and listen for changes
  useEffect(() => {
    const fetchClusters = () => {
      setIsLoading(true);
      try {
        const savedClusters = localStorage.getItem(CLUSTERS_STORAGE_KEY);
        setClusters(savedClusters ? JSON.parse(savedClusters) : []);
      } catch (error) {
        console.error("Failed to load clusters from localStorage", error);
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
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="font-headline">Barangay Cluster Visualization</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 relative">
        <div id="map" ref={mapRef} style={{ height: '100%', width: '100%', borderRadius: 'var(--radius)' }}></div>
        {isLoading && (
          <div className="absolute inset-0 z-[1000] pointer-events-none flex items-center justify-center bg-background/80">
            <Skeleton className="h-full w-full rounded-lg" />
          </div>
        )}
        {!isLoading && clusters.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center p-4 bg-black/30 rounded-md z-[1000] pointer-events-none">
            <div className="text-center bg-background/80 backdrop-blur-sm text-foreground p-4 rounded-lg border">
              <Info className="mx-auto h-8 w-8 text-primary mb-2" />
              <h3 className="font-bold text-lg">Cluster Visualization</h3>
              <p className="text-sm text-muted-foreground">Run analysis to see cluster locations on the map.</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
