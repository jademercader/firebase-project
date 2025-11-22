'use client';

import { useState, useEffect } from 'react';
import { ClusterControls } from '@/components/dashboard/cluster-controls';
import { ClusterCharts } from '@/components/dashboard/cluster-charts';
import { TrendAnalysis } from '@/components/dashboard/trend-analysis';
import { Separator } from '@/components/ui/separator';
import type { Cluster, HealthRecord } from '@/lib/types';
import AppLayout from '@/components/layout/app-layout';

import { createContext, useContext } from 'react';
import { mockHealthRecords } from '@/lib/mock-data';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const DynamicClusterMap = dynamic(
  () => import('@/components/dashboard/cluster-map').then((mod) => mod.ClusterMap),
  { 
    ssr: false,
    loading: () => <Skeleton className="w-full h-[582px]" />
  }
);


export const DataContext = createContext<{
  clusters: Cluster[];
  setClusters: React.Dispatch<React.SetStateAction<Cluster[]>>;
  healthRecords: HealthRecord[];
  isUsingUploadedData: boolean;
}>({
  clusters: [],
  setClusters: () => {},
  healthRecords: [],
  isUsingUploadedData: false,
});

export function useData() {
  return useContext(DataContext);
}

const CLUSTERS_STORAGE_KEY = 'health_clusters';
const RECORDS_STORAGE_KEY = 'health_records';

export default function DashboardPage() {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [isUsingUploadedData, setIsUsingUploadedData] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Load data from localStorage on initial render
  useEffect(() => {
    try {
      const savedClusters = localStorage.getItem(CLUSTERS_STORAGE_KEY);
      if (savedClusters) {
        setClusters(JSON.parse(savedClusters));
      }

      const savedRecords = localStorage.getItem(RECORDS_STORAGE_KEY);
      if (savedRecords) {
        const parsedRecords = JSON.parse(savedRecords);
        if (parsedRecords.length > 0) {
          setHealthRecords(parsedRecords);
          setIsUsingUploadedData(true);
        } else {
          setHealthRecords(mockHealthRecords);
          setIsUsingUploadedData(false);
        }
      } else {
         setHealthRecords(mockHealthRecords);
         setIsUsingUploadedData(false);
      }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
       setHealthRecords(mockHealthRecords);
       setIsUsingUploadedData(false);
    }
    setIsInitialLoad(false);
  }, []);

  // Save clusters to localStorage whenever they change
  useEffect(() => {
    if (!isInitialLoad) {
      try {
        localStorage.setItem(CLUSTERS_STORAGE_KEY, JSON.stringify(clusters));
      } catch (error) {
        console.error("Failed to save clusters to localStorage", error);
      }
    }
  }, [clusters, isInitialLoad]);

  return (
    <AppLayout>
      <DataContext.Provider value={{ clusters, setClusters, healthRecords, isUsingUploadedData }}>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight font-headline">Dashboard</h2>
          </div>
          <div className="space-y-4">
            <ClusterControls setIsLoading={setIsLoading} />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <div className="col-span-4">
                <DynamicClusterMap isLoading={isLoading} clusters={clusters} />
              </div>
              <div className="col-span-4 lg:col-span-3">
                <TrendAnalysis />
              </div>
            </div>
            <Separator />
            <ClusterCharts isLoading={isLoading} />
          </div>
        </div>
      </DataContext.Provider>
    </AppLayout>
  );
}
