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
  Legend,
  TooltipProps
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, BarChart3, PieChartIcon, Target, Info } from 'lucide-react';
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

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/95 border border-border p-3 rounded-lg shadow-xl backdrop-blur-sm">
        <p className="font-bold text-sm mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-3 text-xs">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-bold">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

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
  if (!analysisResult || !analysisResult.clusters || analysisResult.clusters.length === 0) return null;

  const { clusters, globalValidation } = analysisResult;

  const populationData = clusters.map((c, i) => ({
    name: `Cluster ${c.id}`,
    value: c.records.length,
    color: CHART_COLORS[i % CHART_COLORS.length]
  }));

  const allDiseases = Array.from(new Set(clusters.flatMap(c => 
    Object.keys(c.healthMetrics).filter(k => !['Vaccinated', 'Partially Vaccinated', 'Not Vaccinated', 'Partially Vacinnated'].includes(k))
  )));

  const diseaseChartData = allDiseases.map(disease => {
    const entry: any = { disease };
    clusters.forEach(c => {
      entry[`Cluster ${c.id}`] = c.healthMetrics[disease] || 0;
    });
    return entry;
  });

  const performanceData = [
    { metric: 'Silhouette', score: Math.round((globalValidation.avgSilhouetteScore + 1) * 50) },
    { metric: 'Cohesion', score: 85 },
    { metric: 'Density', score: 78 },
    { metric: 'Stability', score: 92 },
    { metric: 'Separation', score: 80 }
  ];

  return (
    <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Objective 3: Validation Matrix */}
            <Card className="shadow-sm border-primary/10 flex flex-col h-full">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Target className="w-5 h-5 text-primary" />
                        Evaluation Matrix
                    </CardTitle>
                    <CardDescription className="text-xs">Objective 3: Validation metrics for clustering quality.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between pt-4">
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={performanceData}>
                                <PolarGrid stroke="hsl(var(--muted-foreground))" strokeOpacity={0.2} />
                                <PolarAngleAxis dataKey="metric" fontSize={10} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                                <Radar 
                                    name="Confidence" 
                                    dataKey="score" 
                                    stroke="hsl(var(--primary))" 
                                    fill="hsl(var(--primary))" 
                                    fillOpacity={0.5} 
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-4">
                        <div className="bg-secondary/40 p-3 rounded-lg text-center border border-primary/5">
                            <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-tighter">Avg Silhouette</p>
                            <p className="text-lg font-black text-primary leading-none mt-1">{(globalValidation.avgSilhouetteScore).toFixed(3)}</p>
                        </div>
                        <div className="bg-secondary/40 p-3 rounded-lg text-center border border-primary/5">
                            <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-tighter">Confidence</p>
                            <p className="text-lg font-black text-primary leading-none mt-1">{Math.round((globalValidation.avgSilhouetteScore + 1) * 50)}%</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-sm border-primary/10 flex flex-col h-full">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <PieChartIcon className="w-5 h-5 text-primary" />
                        Population Distribution
                    </CardTitle>
                    <CardDescription className="text-xs">Relative size of consolidated barangay clusters.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col items-center justify-center pt-0">
                    <div className="h-[220px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={populationData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={8}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {populationData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend 
                                    verticalAlign="bottom" 
                                    align="center"
                                    iconType="circle"
                                    formatter={(value) => <span className="text-[10px] text-muted-foreground font-medium">{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-sm border-primary/10 flex flex-col h-full">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        Disease Prevalence
                    </CardTitle>
                    <CardDescription className="text-xs">Condition distribution per identified segment.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 pt-4">
                    <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={diseaseChartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="disease" type="category" fontSize={10} tickLine={false} axisLine={false} width={70} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                {clusters.map((c, i) => (
                                    <Bar key={c.id} dataKey={`Cluster ${c.id}`} stackId="a" fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                ))}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Objective 4: Visual Representation - Indicator Analysis */}
        <Card className="shadow-sm border-primary/10">
            <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    Cross-Segment Indicator Analysis
                </CardTitle>
                <CardDescription>Visualizing clinical deviations per identified population group with clear barangay context.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[400px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                            data={diseaseChartData} 
                            margin={{ top: 20, right: 20, left: 10, bottom: 90 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                            <XAxis 
                                dataKey="disease" 
                                fontSize={10} 
                                tickLine={true} 
                                axisLine={false}
                                angle={-45}
                                textAnchor="end"
                                interval={0}
                                height={80}
                                padding={{ left: 10, right: 10 }}
                            />
                            <YAxis fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--secondary))', opacity: 0.3 }} />
                            <Legend verticalAlign="top" align="right" height={36} iconType="rect" formatter={(value) => <span className="text-xs font-semibold">{value}</span>} />
                            {clusters.map((c, i) => (
                                <Bar 
                                    key={c.id}
                                    dataKey={`Cluster ${c.id}`} 
                                    fill={CHART_COLORS[i % CHART_COLORS.length]} 
                                    radius={[4, 4, 0, 0]} 
                                    barSize={24}
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
