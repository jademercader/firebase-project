'use client';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { mockClusters } from '@/lib/mock-data';

const diseaseData = mockClusters.map(cluster => ({
    name: cluster.name.split(':')[0],
    'Hypertension': cluster.healthMetrics['Hypertension'] || 0,
    'Diabetes': cluster.healthMetrics['Diabetes'] || 0,
    'Asthma': cluster.healthMetrics['Asthma'] || 0,
}));

const vaccinationData = mockClusters.map(cluster => ({
    name: cluster.name.split(':')[0],
    Vaccinated: cluster.healthMetrics['Vaccinated'] || 0,
    'Partially Vaccinated': cluster.healthMetrics['Partially Vaccinated'] || 0,
    'Not Vaccinated': cluster.healthMetrics['Not Vaccinated'] || 0,
}));


export function ClusterCharts() {
  return (
    <div className="space-y-4">
        <h3 className="text-2xl font-bold tracking-tight font-headline">Cluster-Specific Metrics</h3>
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
    </div>
  );
}
