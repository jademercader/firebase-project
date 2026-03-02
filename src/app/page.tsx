
'use client';

import { useEffect } from 'react';
import { ClusterControls } from '@/components/dashboard/cluster-controls';
import { ClusterCharts } from '@/components/dashboard/cluster-charts';
import { TrendAnalysis } from '@/components/dashboard/trend-analysis';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/components/layout/app-layout';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Activity } from 'lucide-react';
import { useMounted } from '@/hooks/use-mounted';

const DynamicClusterMap = dynamic(
  () => import('@/components/dashboard/cluster-map').then((mod) => mod.ClusterMap),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[400px] md:h-[600px] w-full rounded-xl" />,
  }
);

// Module-level variable to track if this is the first time the JS environment has loaded (i.e., a full refresh)
let isInitialLoad = true;

export default function DashboardPage() {
  const mounted = useMounted();

  /**
   * Session-Based Data Erasure logic:
   * Erases analysis results and records ONLY on a full browser refresh (isInitialLoad = true).
   * Navigation between menus in the SPA does not reset the module-level 'isInitialLoad'.
   */
  useEffect(() => {
    if (mounted && isInitialLoad) {
      const justUploaded = sessionStorage.getItem('just_uploaded');
      
      // Clear analysis results to avoid repetitions on fresh session load
      localStorage.removeItem('analysis_result');
      localStorage.removeItem('health_clusters');
      localStorage.removeItem('selected_report_cluster_id');
      
      if (!justUploaded) {
        // It's a fresh visit or manual refresh (not a redirect from upload). Wipe the raw dataset.
        localStorage.removeItem('health_records');
      }
      
      // Clear the session flag so subsequent refreshes wipe the data correctly
      sessionStorage.removeItem('just_uploaded');
      
      // Mark initial load as complete so navigation doesn't trigger a wipe
      isInitialLoad = false;
      
      // Notify components that data state has changed
      window.dispatchEvent(new Event('analysis-updated'));
    }
  }, [mounted]);

  if (!mounted) {
    return (
      <AppLayout>
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 bg-slate-50/20">
          <div className="max-w-[1400px] mx-auto space-y-6">
            <Skeleton className="h-10 w-[300px]" />
            <Skeleton className="h-48 w-full" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <Skeleton className="lg:col-span-8 h-[600px]" />
              <Skeleton className="lg:col-span-4 h-[600px]" />
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="bg-slate-50/20 min-h-screen">
        <div className="max-w-[1400px] mx-auto space-y-6 p-4 md:p-8 pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight font-headline flex items-center gap-2 md:gap-3 text-slate-900">
                  <Activity className="text-primary w-6 h-6 md:w-8 md:h-8" />
                  Barangay Health Intelligence
              </h2>
              <p className="text-sm md:text-base text-slate-500 font-medium mt-1">Spatial K-Means Analysis for Public Health Monitoring</p>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-[10px] md:text-xs py-1 px-2 md:px-3 border-primary/30 text-primary bg-primary/5 font-bold shadow-sm">
                  Analytical Engine v2.5
              </Badge>
            </div>
          </div>

          <div className="space-y-6">
            <ClusterControls />
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <div className="lg:col-span-8 flex flex-col min-h-[400px] md:min-h-[600px]">
                <DynamicClusterMap />
              </div>
              <div className="lg:col-span-4 flex flex-col h-full min-h-[400px] md:min-h-[600px]">
                <TrendAnalysis />
              </div>
            </div>
            
            <Separator className="bg-slate-200" />
            
            <div className="pb-8 overflow-hidden">
              <ClusterCharts />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
