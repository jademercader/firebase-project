
'use client';

import { ClusterControls } from '@/components/dashboard/cluster-controls';
import { ClusterCharts } from '@/components/dashboard/cluster-charts';
import { TrendAnalysis } from '@/components/dashboard/trend-analysis';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/components/layout/app-layout';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Activity } from 'lucide-react';

const DynamicClusterMap = dynamic(
  () => import('@/components/dashboard/cluster-map').then((mod) => mod.ClusterMap),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[600px] w-full rounded-xl" />,
  }
);

export default function DashboardPage() {
  return (
    <AppLayout>
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 bg-slate-50/20">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-3 text-slate-900">
                <Activity className="text-primary w-8 h-8" />
                Barangay Health Intelligence
            </h2>
            <p className="text-slate-500 font-medium mt-1">Spatial K-Means Analysis for Public Health Monitoring</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs py-1 px-3 border-primary/30 text-primary bg-primary/5 font-bold shadow-sm">
                Analytical Engine v2.5
            </Badge>
          </div>
        </div>

        <div className="space-y-6">
          <ClusterControls />
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-8 flex flex-col min-h-[600px]">
              <DynamicClusterMap />
            </div>
            <div className="lg:col-span-4 flex flex-col h-full min-h-[600px]">
              <TrendAnalysis />
            </div>
          </div>
          
          <Separator className="bg-slate-200" />
          
          <div className="pb-8">
            <ClusterCharts />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
