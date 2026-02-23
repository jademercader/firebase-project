'use client';

import { ClusterControls } from '@/components/dashboard/cluster-controls';
import { ClusterCharts } from '@/components/dashboard/cluster-charts';
import { TrendAnalysis } from '@/components/dashboard/trend-analysis';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/components/layout/app-layout';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Activity, LayoutDashboard, Target, BarChart3, Map as MapIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const DynamicClusterMap = dynamic(
  () => import('@/components/dashboard/cluster-map').then((mod) => mod.ClusterMap),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[500px] w-full rounded-lg" />,
  }
);

export default function DashboardPage() {
  return (
    <AppLayout>
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-3">
                <Activity className="text-primary w-8 h-8" />
                Barangay Health Intelligence
            </h2>
            <p className="text-muted-foreground mt-1">Spatial K-Means Analysis for Public Health Monitoring</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs py-1 px-3 border-primary/30 text-primary bg-primary/5">
                Analytical Engine v2.5
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
                { label: "Objective 1", title: "Consolidation", icon: Target, color: "text-blue-500" },
                { label: "Objective 2", title: "K-Means Engine", icon: LayoutDashboard, color: "text-purple-500" },
                { label: "Objective 3", title: "Evaluation Matrix", icon: BarChart3, color: "text-green-500" },
                { label: "Objective 4", title: "Visualization", icon: MapIcon, color: "text-orange-500" }
            ].map((obj, i) => (
                <Card key={i} className="bg-background/50 backdrop-blur border-primary/10 shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className={`p-2 rounded-full bg-secondary/50 ${obj.color}`}>
                            <obj.icon className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase text-muted-foreground">{obj.label}</p>
                            <p className="text-sm font-bold">{obj.title}</p>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
        
        <div className="space-y-6">
          <ClusterControls />
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-8 flex flex-col">
              <DynamicClusterMap />
            </div>
            <div className="lg:col-span-4 flex flex-col">
              <TrendAnalysis />
            </div>
          </div>
          
          <Separator />
          
          <div className="pb-8">
            <ClusterCharts />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
