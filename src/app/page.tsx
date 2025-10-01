'use client';

import { useState, useEffect } from 'react';
import { ClusterControls } from '@/components/dashboard/cluster-controls';
import { ClusterMap } from '@/components/dashboard/cluster-map';
import { ClusterCharts } from '@/components/dashboard/cluster-charts';
import { TrendAnalysis } from '@/components/dashboard/trend-analysis';
import { Separator } from '@/components/ui/separator';
import type { Cluster } from '@/lib/types';
import AppLayout from '@/components/layout/app-layout';

import { createContext, useContext } from 'react';

export const ClusterContext = createContext<{
  clusters: Cluster[];
  setClusters: React.Dispatch<React.SetStateAction<Cluster[]>>;
}>({
  clusters: [],
  setClusters: () => {},
});

export function useClusters() {
  return useContext(ClusterContext);
}

const CLUSTERS_STORAGE_KEY = 'health_clusters';

export default function DashboardPage() {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Load clusters from localStorage on initial render
  useEffect(() => {
    try {
      const savedClusters = localStorage.getItem(CLUSTERS_STORAGE_KEY);
      if (savedClusters) {
        setClusters(JSON.parse(savedClusters));
      }
    } catch (error) {
      console.error("Failed to load clusters from localStorage", error);
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
      <ClusterContext.Provider value={{ clusters, setClusters }}>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight font-headline">Dashboard</h2>
          </div>
          <div className="space-y-4">
            <ClusterControls setIsLoading={setIsLoading} />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <div className="col-span-4">
                <ClusterMap isLoading={isLoading} />
              </div>
              <div className="col-span-4 lg:col-span-3">
                <TrendAnalysis />
              </div>
            </div>
            <Separator />
            <ClusterCharts isLoading={isLoading} />
          </div>
        </div>
      </ClusterContext.Provider>
    </AppLayout>
  );
}
