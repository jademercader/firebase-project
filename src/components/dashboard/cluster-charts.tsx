'use client';
import { useEffect, useState } from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, ShieldAlert, Activity, CheckCircle2 } from 'lucide-react';
import type { AnalysisResult } from '@/lib/types';
import { useMounted } from '@/hooks/use-mounted';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const ANALYSIS_STORAGE_KEY = 'analysis_result';

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
            if (savedResult) setAnalysisResult(JSON.parse(savedResult));
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

  if (!mounted || isLoading) return <Skeleton className="w-full h-[400px]" />;
  if (!analysisResult || analysisResult.clusters.length === 0) return null;

  const clusters = analysisResult.clusters;
  const validation = analysisResult.globalValidation;

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold tracking-tight font-headline flex items-center gap-2">
                <Activity className="w-6 h-6 text-primary" />
                Objective 3: Evaluation Matrix
            </h3>
            <div className="flex gap-4">
                 <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Silhouette Coefficient</p>
                    <p className="text-lg font-mono font-bold">{(validation.avgSilhouetteScore).toFixed(3)}</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Total WCSS (Cohesion)</p>
                    <p className="text-lg font-mono font-bold">{Math.round(validation.totalWCSS)}</p>
                </div>
            </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-t-4 border-primary shadow-md">
                <CardHeader>
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        Analysis Effectiveness
                    </CardTitle>
                    <CardDescription>Evaluation of grouping quality.</CardDescription>
                </CardHeader>
                <CardContent className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={clusters.map(c => ({
                            name: `C${c.id}`,
                            silhouette: (c.validation?.silhouetteScore || 0) * 100,
                            size: (c.records.length / (clusters[0]?.records.length || 1)) * 100
                        }))}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="name" fontSize={10} />
                            <Radar name="Quality Score" dataKey="silhouette" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
                            <Tooltip />
                        </RadarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card className="lg:col-span-2 shadow-md">
                <CardHeader>
                    <CardTitle>Disease Prevalence by Segment</CardTitle>
                    <CardDescription>Comparative distribution of identified health indicators.</CardDescription>
                </CardHeader>
                <CardContent className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={clusters.map(c => {
                            const d: any = { name: `Cluster ${c.id}` };
                            Object.entries(c.healthMetrics).forEach(([k, v]) => {
                                if (!['Vaccinated', 'Partially Vaccinated', 'Not Vaccinated'].includes(k)) d[k] = v;
                            });
                            return d;
                        })}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                            <Bar dataKey={(obj) => Object.keys(obj).find(k => k !== 'name')} fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
