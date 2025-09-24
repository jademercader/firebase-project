'use client';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useClusters } from '@/app/page';

const diseaseIndicators = ['Hypertension', 'Diabetes', 'Asthma'];
const vaccinationIndicators = ['Vaccinated', 'Partially Vaccinated', 'Not Vaccinated'];

interface ClusterChartsProps {
    isLoading: boolean;
}

export function ClusterCharts({ isLoading }: ClusterChartsProps) {
  const { clusters } = useClusters();

  const diseaseData = clusters.map(cluster => {
    const data: { [key: string]: any } = { name: cluster.name.split(':')[0] };
    diseaseIndicators.forEach(indicator => {
      data[indicator] = cluster.healthMetrics[indicator] || 0;
    });
    return data;
  });

  const vaccinationData = clusters.map(cluster => {
    const data: { [key: string]: any } = { name: cluster.name.split(':')[0] };
    vaccinationIndicators.forEach(indicator => {
      data[indicator] = cluster.healthMetrics[indicator] || 0;
    });
    return data;
  });

  const renderContent = () => {
    if (isLoading) {
      return <Skeleton className="w-full h-[300px]" />;
    }
    if (clusters.length === 0) {
      return (
        <div className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">Run cluster analysis to see metrics.</p>
        </div>
      );
    }
    return (
      <div className="grid gap-4 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Disease Prevalence per Cluster</CardTitle>
                    <CardDescription>Distribution of common diseases across clusters.</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={diseaseData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Hypertension" name="Hypertension Cases" stackId="a" fill="hsl(var(--chart-1))" />
                        <Bar dataKey="Diabetes" name="Diabetes Cases" stackId="a" fill="hsl(var(--chart-2))" />
                        <Bar dataKey="Asthma" name="Asthma Cases" stackId="a" fill="hsl(var(--chart-3))" />
                    </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Vaccination Rates per Cluster</CardTitle>
                    <CardDescription>Comparison of vaccination statuses.</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={vaccinationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Vaccinated" stackId="a" fill="hsl(var(--chart-1))" />
                    <Bar dataKey="Partially Vaccinated" stackId="a" fill="hsl(var(--chart-4))" />
                    <Bar dataKey="Not Vaccinated" stackId="a" fill="hsl(var(--chart-5))" />
                    </BarChart>
                </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
  };


  return (
    <div className="space-y-4">
        <h3 className="text-2xl font-bold tracking-tight font-headline">Cluster-Specific Metrics</h3>
        {renderContent()}
    </div>
  );
}
