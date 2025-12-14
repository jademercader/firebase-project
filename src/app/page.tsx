'use client';

import { ClusterControls } from '@/components/dashboard/cluster-controls';
import { ClusterCharts } from '@/components/dashboard/cluster-charts';
import { TrendAnalysis } from '@/components/dashboard/trend-analysis';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/components/layout/app-layout';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const DynamicClusterMap = dynamic(
  () => import('@/components/dashboard/cluster-map').then((mod) => mod.ClusterMap),
  {
    ssr: false,
    loading: () => <Skeleton className="h-full w-full rounded-lg" />,
  }
);

export default function DashboardPage() {
  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight font-headline">Dashboard</h2>
        </div>
        <div className="space-y-4">
          <ClusterControls />
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
            <div className="lg:col-span-4 h-[500px]">
              <DynamicClusterMap />
            </div>
            <div className="lg:col-span-3">
              <TrendAnalysis />
            </div>
          </div>
          <Separator />
          <ClusterCharts />
        </div>
      </div>
    </AppLayout>
  );
}
