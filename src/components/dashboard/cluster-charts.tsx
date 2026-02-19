'use client';
import { useEffect, useState } from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, AlertTriangle, ShieldAlert, Activity } from 'lucide-react';
import type { Cluster, AnalysisResult } from '@/lib/types';
import { useMounted } from '@/hooks/use-mounted';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const ANALYSIS_STORAGE_KEY = 'analysis_result';
const VAX_KEYS = ['Vaccinated', 'Partially Vaccinated', 'Not Vaccinated'];

export function ClusterCharts() {
  const mounted = useMounted();
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (!mounted) return;
    const fetchClusters = () => {
        setIsLoading(true);
        try {
            const savedResult = localStorage.getItem(ANALYSIS_STORAGE_KEY);
            if (savedResult) {
              setAnalysisResult(JSON.parse(savedResult));
            }
        } catch (error) {
            setAnalysisResult(null);
        } finally {
            setIsLoading(false);
        }
    };
    fetchClusters();
    window.addEventListener('analysis-updated', fetchClusters);
    return () => window.removeEventListener('analysis-updated', fetchClusters);
  }, [mounted]);

  if (!mounted) return <Skeleton className="w-full h-[400px]" />;

  const clusters = analysisResult?.clusters || [];

  // Identify high risk diseases across all data
  const riskAnalysis = () => {
    const diseaseCounts: Record<string, number> = {};
    let totalPatients = 0;
    clusters.forEach(c => {
        totalPatients += c.records.length;
        Object.entries(c.healthMetrics).forEach(([disease, count]) => {
            if (!VAX_KEYS.includes(disease)) {
                diseaseCounts[disease] = (diseaseCounts[disease] || 0) + count;
            }
        });
    });

    return Object.entries(diseaseCounts)
        .map(([name, count]) => ({
            name,
            count,
            percentage: totalPatients > 0 ? (count / totalPatients) * 100 : 0,
            riskLevel: (count / totalPatients) > 0.25 ? 'High' : (count / totalPatients) > 0.1 ? 'Moderate' : 'Low'
        }))
        .sort((a, b) => b.count - a.count);
  };

  const highRiskData = riskAnalysis();

  if (isLoading) return <Skeleton className="w-full h-[300px]" />;
  if (clusters.length === 0) return null;

  return (
    <div className="space-y-6">
        <h3 className="text-2xl font-bold tracking-tight font-headline flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            Risk Analysis & Disease Prevalence
        </h3>

        {highRiskData.some(d => d.riskLevel === 'High') && (
            <Alert variant="destructive" className="bg-destructive/10 border-destructive">
                <ShieldAlert className="h-5 w-5" />
                <AlertTitle className="font-bold">High Risk Condition Detected</AlertTitle>
                <AlertDescription>
                    Analysis indicates {highRiskData.filter(d => d.riskLevel === 'High')[0]?.name} is currently a primary high-risk factor across population clusters.
                </AlertDescription>
            </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {clusters.map((cluster) => (
                <Card key={cluster.id} className="border-l-4" style={{ borderLeftColor: `hsl(var(--chart-${(cluster.id % 5) + 1}))` }}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-bold uppercase text-muted-foreground">{cluster.name.split(':')[0]}</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold">{cluster.records.length} Patients</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {cluster.name.split(':')[1]?.trim()}
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
            <Card className="md:col-span-1">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <AlertTriangle className="w-5 h-5 text-destructive" />
                        Risk Assessment
                    </CardTitle>
                    <CardDescription>Condition severity based on cluster density.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {highRiskData.slice(0, 4).map((risk) => (
                        <div key={risk.name} className="flex flex-col gap-1 p-3 rounded-lg border bg-secondary/20">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold">{risk.name}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                    risk.riskLevel === 'High' ? 'bg-destructive text-destructive-foreground' : 
                                    risk.riskLevel === 'Moderate' ? 'bg-orange-500 text-white' : 'bg-green-600 text-white'
                                }`}>
                                    {risk.riskLevel}
                                </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {risk.count} Cases ({risk.percentage.toFixed(1)}% Coverage)
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Card className="md:col-span-2">
                <CardHeader>
                    <CardTitle>Disease distribution by Segment</CardTitle>
                    <CardDescription>Comparative analysis of health indicators across clusters.</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={clusters.map(c => {
                            const data: any = { name: c.name.split(':')[0] };
                            Object.entries(c.healthMetrics).forEach(([k, v]) => {
                                if (!VAX_KEYS.includes(k)) data[k] = v;
                            });
                            return data;
                        })}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                            <Legend />
                            {highRiskData.slice(0, 5).map((d, i) => (
                                <Bar key={d.name} dataKey={d.name} fill={`hsl(var(--chart-${(i % 5) + 1}))`} radius={[4, 4, 0, 0]} />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}