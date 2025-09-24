'use client';

import { useState } from 'react';
import { ClusterControls } from '@/components/dashboard/cluster-controls';
import { ClusterMap } from '@/components/dashboard/cluster-map';
import { ClusterCharts } from '@/components/dashboard/cluster-charts';
import { TrendAnalysis } from '@/components/dashboard/trend-analysis';
import { Separator } from '@/components/ui/separator';
import type { Cluster } from '@/lib/types';
import AppLayout from '@/components/layout/app-layout';

// Create a context to share clusters between components
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

export default function DashboardPage() {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
