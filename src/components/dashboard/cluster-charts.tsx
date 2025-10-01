
'use client';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useData } from '@/app/page';
import { Users, Stethoscope } from 'lucide-react';
import type { Cluster } from '@/lib/types';

const diseaseIndicators = ['Hypertension', 'Diabetes', 'Asthma'];
const vaccinationIndicators = ['Vaccinated', 'Partially Vaccinated', 'Not Vaccinated'];

interface ClusterChartsProps {
    isLoading: boolean;
}

const getMostPrevalentCondition = (cluster: Cluster) => {
    let maxCount = 0;
    let mostPrevalent = 'None';
    for (const indicator of diseaseIndicators) {
        const count = cluster.healthMetrics[indicator] || 0;
        if (count > maxCount) {
            maxCount = count;
            mostPrevalent = indicator;
        }
    }
    return mostPrevalent;
};


export function ClusterCharts({ isLoading }: ClusterChartsProps) {
  const { clusters } = useData();

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
        <div className="space-y-4">
            <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-${clusters.length > 3 ? 4 : 3}`}>
                {clusters.map((cluster) => (
                    <Card key={cluster.id}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{cluster.name}</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{cluster.records.length} Records</div>
                            <p className="text-xs text-muted-foreground">
                               Avg. Age: {cluster.demographics.averageAge.toFixed(1)}
                            </p>
                             <div className="flex items-center pt-2">
                                <Stethoscope className="w-4 h-4 mr-2 text-muted-foreground"/>
                                <p className="text-xs text-muted-foreground">
                                    Top Condition: {getMostPrevalentCondition(cluster)}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
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
                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis fontSize={12} tickLine={false} axisLine={false} />
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
                        <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false}/>
                        <YAxis fontSize={12} tickLine={false} axisLine={false}/>
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
