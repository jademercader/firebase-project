'use client';
import { useMemo, useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '../ui/skeleton';
import { Info } from 'lucide-react';
import type { Cluster, HealthRecord } from '@/lib/types';

// Fix for default icon not showing in Leaflet
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

const MapUpdater = ({ clusters }: { clusters: Cluster[] }) => {
  const map = useMap();
  
  const bounds = useMemo(() => {
    if (!clusters || clusters.length === 0) return null;
    
    const points: L.LatLngTuple[] = [];
    clusters.forEach(cluster => {
      cluster.records.forEach(record => {
        if (record.latitude && record.longitude) {
          points.push([record.latitude, record.longitude]);
        }
      });
    });

    return points.length > 0 ? L.latLngBounds(points) : null;
  }, [clusters]);

  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      map.setView(mapCenter, 11);
    }
  }, [map, bounds]);

  return null;
};


const CLUSTERS_STORAGE_KEY = 'health_clusters';

export function ClusterMap({ setIsLoading }: { setIsLoading: (isLoading: boolean) => void; }) {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<HealthRecord | null>(null);

  useEffect(() => {
    try {
      const savedClusters = localStorage.getItem(CLUSTERS_STORAGE_KEY);
      if (savedClusters) {
        setClusters(JSON.parse(savedClusters));
      }
    } catch (error) {
        console.error("Failed to load clusters from localStorage", error);
    }
    setIsLoading(false);

    const handleStorageChange = () => {
        const savedClusters = localStorage.getItem(CLUSTERS_STORAGE_KEY);
        setClusters(savedClusters ? JSON.parse(savedClusters) : []);
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };

  }, [setIsLoading]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="font-headline">Barangay Cluster Visualization</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <MapContainer
          center={mapCenter}
          zoom={11}
          style={{ height: '100%', width: '100%', borderRadius: 'var(--radius)' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapUpdater clusters={clusters} />

          {clusters.map((cluster, index) =>
            cluster.records.map(record =>
              record.latitude && record.longitude ? (
                <Marker
                  key={record.id}
                  position={[record.latitude, record.longitude]}
                  eventHandlers={{
                    click: () => {
                      setSelectedRecord(record);
                    },
                  }}
                  icon={createColorIcon(getChartColor(index))}
                />
              ) : null
            )
          )}
          {selectedRecord && selectedRecord.latitude && selectedRecord.longitude && (
              <Popup
                position={[selectedRecord.latitude, selectedRecord.longitude]}
                onClose={() => setSelectedRecord(null)}
              >
                <div className="p-1">
                  <p className="font-bold">{selectedRecord.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedRecord.address}</p>
                </div>
              </Popup>
          )}

          {clusters.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center p-4 bg-black/30 rounded-md z-[1000] pointer-events-none">
                <div className="text-center bg-background/80 backdrop-blur-sm text-foreground p-4 rounded-lg border">
                <Info className="mx-auto h-8 w-8 text-primary mb-2" />
                <h3 className="font-bold text-lg">Cluster Visualization</h3>
                <p className="text-sm text-muted-foreground">Run analysis to see cluster locations on the map.</p>
                </div>
            </div>
          )}
        </MapContainer>
      </CardContent>
    </Card>
  );
}
