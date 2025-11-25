'use client';
import { useCallback, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from '@react-google-maps/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '../ui/skeleton';
import { Info } from 'lucide-react';
import type { Cluster, HealthRecord } from '@/lib/types';
import React from 'react';

interface ClusterMapProps {
  isLoading: boolean;
  clusters: Cluster[];
}

const mapCenter = { lat: 14.5995, lng: 120.9842 }; // Default to Manila

const chartColors = ['#2563eb', '#f97316', '#16a34a', '#9333ea', '#e11d48', '#d97706', '#059669', '#7c3aed', '#be123c', '#65a30d'];

const getChartColor = (index: number) => chartColors[index % chartColors.length];

export function ClusterMap({ isLoading, clusters }: ClusterMapProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: ['maps'],
  });

  const [map, setMap] = React.useState<google.maps.Map | null>(null);
  const [selectedRecord, setSelectedRecord] = React.useState<HealthRecord | null>(null);

  const bounds = useMemo(() => {
    if (!isLoaded || !clusters || clusters.length === 0) return null;
    const newBounds = new window.google.maps.LatLngBounds();
    let hasValidCoords = false;
    clusters.forEach(cluster => {
      cluster.records.forEach(record => {
        if (record.latitude && record.longitude) {
          newBounds.extend(new window.google.maps.LatLng(record.latitude, record.longitude));
          hasValidCoords = true;
        }
      });
    });
    return hasValidCoords ? newBounds : null;
  }, [clusters, isLoaded]);

  const onLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  React.useEffect(() => {
    if (map && bounds) {
      map.fitBounds(bounds, 100); // 100px padding
    } else if (map) {
      map.setCenter(mapCenter);
      map.setZoom(11);
    }
  }, [map, bounds]);

  const renderContent = () => {
    if (loadError) {
      return (
        <div className="flex items-center justify-center h-full p-4">
          <p className="text-destructive text-center">
            Error loading Google Maps. Please ensure your API key is correct and has the Maps JavaScript API enabled.
          </p>
        </div>
      );
    }

    if (isLoading || !isLoaded) {
      return <Skeleton className="w-full h-full" />;
    }

    return (
      <div style={{ position: 'relative', height: '100%', width: '100%' }}>
        <GoogleMap
          mapContainerStyle={{ height: '100%', width: '100%', borderRadius: 'var(--radius)' }}
          center={mapCenter}
          zoom={11}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={{
            disableDefaultUI: true,
            zoomControl: true,
          }}
        >
          {clusters.map((cluster, index) =>
            cluster.records.map(record =>
              record.latitude && record.longitude ? (
                <MarkerF
                  key={record.id}
                  position={{ lat: record.latitude, lng: record.longitude }}
                  onClick={() => setSelectedRecord(record)}
                  icon={{
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: getChartColor(index),
                    fillOpacity: 0.8,
                    strokeColor: 'white',
                    strokeWeight: 1,
                  }}
                />
              ) : null
            )
          )}
          {selectedRecord && selectedRecord.latitude && selectedRecord.longitude && (
             <InfoWindowF
                position={{ lat: selectedRecord.latitude, lng: selectedRecord.longitude }}
                onCloseClick={() => setSelectedRecord(null)}
              >
                <div className="p-1">
                  <p className="font-bold">{selectedRecord.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedRecord.address}</p>
                </div>
              </InfoWindowF>
          )}
        </GoogleMap>
        {!isLoading && clusters.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center p-4 bg-black/30 rounded-md z-10 pointer-events-none">
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
