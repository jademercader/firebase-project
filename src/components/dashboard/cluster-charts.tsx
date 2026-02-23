'use client';
import { useEffect, useState } from 'react';
import { 
  Bar, 
  BarChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, BarChart3, PieChartIcon, Target } from 'lucide-react';
import type { AnalysisResult } from '@/lib/types';
import { useMounted } from '@/hooks/use-mounted';

const ANALYSIS_STORAGE_KEY = 'analysis_result';

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

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

  if (!mounted || isLoading) return <Skeleton className="w-full h-[600px] rounded-xl" />;
  if (!analysisResult || analysisResult.clusters.length === 0) return null;

  const { clusters, globalValidation } = analysisResult;

  // Prepare data for Population Distribution
  const populationData = clusters.map((c, i) => ({
    name: `Cluster ${c.id}`,
    value: c.records.length,
    color: CHART_COLORS[i % CHART_COLORS.length]
  }));

  // Prepare data for Disease Distribution (Grouped)
  const allDiseases = Array.from(new Set(clusters.flatMap(c => 
    Object.keys(c.healthMetrics).filter(k => !['Vaccinated', 'Partially Vaccinated', 'Not Vaccinated'].includes(k))
  )));

  const diseaseChartData = allDiseases.map(disease => {
    const entry: any = { disease };
    clusters.forEach(c => {
      entry[`Cluster ${c.id}`] = c.healthMetrics[disease] || 0;
    });
    return entry;
  });

  // Performance data for Radar
  const performanceData = clusters.map(c => ({
    subject: `C${c.id}`,
    quality: Math.round((c.validation?.silhouetteScore || 0) * 100),
    cohesion: Math.round(100 - ((c.validation?.cohesion || 0) / (globalValidation.totalWCSS || 1)) * 100),
    fullMark: 100,
  }));

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Performance & Quality Metrics */}
        <Card className="lg:col-span-1 shadow-lg border-primary/10">
            <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Evaluation Matrix
                </CardTitle>
                <CardDescription>Mathematical validation of clustering cohesion and separation.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={performanceData}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="subject" fontSize={12} fontWeight="bold" />
                        <Radar 
                            name="Quality Score" 
                            dataKey="quality" 
                            stroke="hsl(var(--primary))" 
                            fill="hsl(var(--primary))" 
                            fillOpacity={0.5} 
                        />
                        <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </CardContent>
            <div className="px-6 pb-6 grid grid-cols-2 gap-4">
                <div className="bg-secondary/30 p-3 rounded-lg text-center">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Avg Silhouette</p>
                    <p className="text-xl font-black text-primary">{(globalValidation.avgSilhouetteScore).toFixed(3)}</p>
                </div>
                <div className="bg-secondary/30 p-3 rounded-lg text-center">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Total WCSS</p>
                    <p className="text-xl font-black text-primary">{Math.round(globalValidation.totalWCSS)}</p>
                </div>
            </div>
        </Card>

        {/* Disease Prevalence Distribution */}
        <Card className="lg:col-span-2 shadow-lg border-primary/10">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        Disease Prevalence Distribution
                    </CardTitle>
                    <CardDescription>Comparative analysis of health indicators across all identified segments.</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={diseaseChartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis 
                            dataKey="disease" 
                            fontSize={11} 
                            tickLine={false} 
                            axisLine={false}
                            interval={0}
                            angle={-15}
                            textAnchor="end"
                        />
                        <YAxis fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip 
                            cursor={{ fill: 'hsl(var(--secondary)/0.5)' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend verticalAlign="top" height={36}/>
                        {clusters.map((c, i) => (
                            <Bar 
                                key={c.id}
                                dataKey={`Cluster ${c.id}`} 
                                fill={CHART_COLORS[i % CHART_COLORS.length]} 
                                radius={[4, 4, 0, 0]} 
                                barSize={40}
                            />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>

        {/* Population Distribution */}
        <Card className="lg:col-span-1 shadow-lg border-primary/10">
            <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5 text-primary" />
                    Population Segment Sizes
                </CardTitle>
                <CardDescription>Weight distribution of the analyzed patient dataset.</CardDescription>
            </CardHeader>
            <CardContent className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={populationData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {populationData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
            <div className="px-6 pb-6">
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                    <div className="flex items-center gap-2 mb-1">
                        <Activity className="w-3 h-3 text-primary" />
                        <span className="text-[10px] font-bold uppercase text-primary">Key Insight</span>
                    </div>
                    <p className="text-xs text-muted-foreground italic">
                        The largest segment accounts for {Math.round((Math.max(...populationData.map(d => d.value)) / populationData.reduce((s, d) => s + d.value, 0)) * 100)}% of the total dataset.
                    </p>
                </div>
            </div>
        </Card>
    </div>
  );
}
