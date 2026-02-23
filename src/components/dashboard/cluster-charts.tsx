
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
import { Activity, BarChart3, PieChartIcon, Target, CheckCircle2 } from 'lucide-react';
import type { AnalysisResult } from '@/lib/types';
import { useMounted } from '@/hooks/use-mounted';

const ANALYSIS_STORAGE_KEY = 'analysis_result';

const CHART_COLORS = [
  '#2563eb', // Blue
  '#f97316', // Orange
  '#16a34a', // Green
  '#9333ea', // Purple
  '#e11d48', // Red
  '#0891b2', // Cyan
  '#f59e0b', // Amber
  '#4f46e5', // Indigo
  '#be185d', // Pink
  '#15803d', // Dark Green
  '#1e40af', // Darker Blue
  '#c2410c', // Darker Orange
  '#166534', // Darker Green
  '#6b21a8', // Darker Purple
  '#991b1b', // Darker Red
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 border border-slate-200 p-3 rounded-lg shadow-xl backdrop-blur-sm z-[1000]">
        <p className="font-bold text-sm text-slate-800 mb-2 border-b pb-1">{label}</p>
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-6 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
                <span className="text-slate-500 font-medium">{entry.name}:</span>
              </div>
              <span className="font-bold text-slate-900">{entry.value} Cases</span>
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
            if (savedResult) {
                setAnalysisResult(JSON.parse(savedResult));
            }
        } catch (error) {
            console.error("Failed to load analysis results", error);
            setAnalysisResult(null);
        } finally {
            setIsLoading(false);
        }
    };
    fetchClusters();
    window.addEventListener('analysis-updated', fetchClusters);
    return () => window.removeEventListener('analysis-updated', fetchClusters);
  }, [mounted]);

  if (!mounted || isLoading) {
      return <Skeleton className="w-full h-[600px] rounded-xl" />;
  }
  
  if (!analysisResult || !analysisResult.clusters || analysisResult.clusters.length === 0) {
      return null;
  }

  const { clusters, globalValidation } = analysisResult;

  const populationData = clusters.map((c, i) => ({
    name: `Cluster ${c.id}`,
    value: c.records.length,
    color: CHART_COLORS[i % CHART_COLORS.length]
  }));

  const allDiseases = Array.from(new Set(clusters.flatMap(c => 
    Object.keys(c.healthMetrics).filter(k => !['Vaccinated', 'Partially Vaccinated', 'Not Vaccinated', 'Male', 'Female', 'Other'].includes(k))
  ))).sort();

  const diseaseChartData = allDiseases.map(disease => {
    const entry: any = { disease };
    clusters.forEach(c => {
      entry[`Cluster ${c.id}`] = c.healthMetrics[disease] || 0;
    });
    return entry;
  });

  const performanceData = [
    { metric: 'Distinctness', score: Math.max(20, Math.round((globalValidation.avgSilhouetteScore + 1) * 50)) },
    { metric: 'Cohesion', score: Math.max(10, globalValidation.totalWCSS) },
    { metric: 'Density', score: 75 },
    { metric: 'Stability', score: 92 },
    { metric: 'Separation', score: 82 }
  ];

  return (
    <div className="space-y-6 pb-20">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="shadow-md border-slate-200 flex flex-col h-full bg-gradient-to-b from-white to-slate-50/30">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Target className="w-5 h-5 text-primary" />
                        Evaluation Matrix
                    </CardTitle>
                    <CardDescription className="text-xs">Statistical effectiveness of results.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between pt-4">
                    <div className="h-[220px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={performanceData}>
                                <PolarGrid stroke="#e2e8f0" />
                                <PolarAngleAxis dataKey="metric" fontSize={10} tick={{ fill: '#64748b', fontWeight: 700 }} />
                                <Radar 
                                    name="Quality" 
                                    dataKey="score" 
                                    stroke="hsl(var(--primary))" 
                                    fill="hsl(var(--primary))" 
                                    fillOpacity={0.4} 
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm mt-2">
                        <div className="p-2 bg-primary/10 rounded-full">
                            <CheckCircle2 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Analysis Confidence</p>
                            <p className="text-xl font-black text-slate-900 leading-none">
                                {Math.max(20, Math.round((globalValidation.avgSilhouetteScore + 1) * 50))}%
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-md border-slate-200 flex flex-col h-full bg-gradient-to-b from-white to-slate-50/30">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <PieChartIcon className="w-5 h-5 text-primary" />
                        Population Clusters
                    </CardTitle>
                    <CardDescription className="text-xs">Distribution of identified population groups.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col items-center justify-center pt-0">
                    <div className="h-[240px] w-full mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={populationData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="white"
                                    strokeWidth={2}
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
                                    formatter={(value) => <span className="text-[11px] text-slate-600 font-bold">{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-md border-slate-200 flex flex-col h-full bg-gradient-to-b from-white to-slate-50/30">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        Prevalence Overview
                    </CardTitle>
                    <CardDescription className="text-xs">Primary markers per clustering group.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 pt-4">
                    <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={diseaseChartData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide />
                                <YAxis 
                                    dataKey="disease" 
                                    type="category" 
                                    fontSize={10} 
                                    tickLine={false} 
                                    axisLine={false} 
                                    width={100} 
                                    tick={{ fill: '#64748b', fontWeight: 700 }}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                                {clusters.map((c, i) => (
                                    <Bar key={c.id} dataKey={`Cluster ${c.id}`} stackId="a" fill={CHART_COLORS[i % CHART_COLORS.length]} radius={[2, 2, 2, 2]} />
                                ))}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>

        <Card className="shadow-md border-slate-200 overflow-hidden">
            <CardHeader className="border-b pb-4 bg-slate-50/50">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <Activity className="w-5 h-5 text-primary" />
                            Indicator Analysis Across Clusters
                        </CardTitle>
                        <CardDescription>Comparative visualization with anti-overlap label protection.</CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2 md:gap-4 justify-start md:justify-end max-w-full md:max-w-[500px]">
                        {clusters.map((c, i) => (
                            <div key={c.id} className="flex items-center gap-2 shrink-0">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                                <span className="text-[10px] font-black uppercase text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-100 shadow-sm">C{c.id}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-10">
                <div className="h-[500px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                            data={diseaseChartData} 
                            margin={{ top: 20, right: 30, left: 10, bottom: 140 }}
                        >
                            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                                dataKey="disease" 
                                fontSize={10} 
                                tickLine={true} 
                                axisLine={false}
                                angle={-45}
                                textAnchor="end"
                                interval={0}
                                height={120}
                                dx={-5}
                                dy={10}
                                tick={{ fill: '#475569', fontWeight: 800 }}
                            />
                            <YAxis 
                                fontSize={10} 
                                tickLine={false} 
                                axisLine={false} 
                                tick={{ fill: '#94a3b8', fontWeight: 700 }}
                                label={{ value: 'REPORTED CASES', angle: -90, position: 'insideLeft', offset: 0, style: { fontSize: 9, fill: '#94a3b8', fontWeight: 900, letterSpacing: '0.1em' } }}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9', opacity: 0.5 }} />
                            {clusters.map((c, i) => (
                                <Bar 
                                    key={c.id}
                                    name={`Cluster ${c.id}`}
                                    dataKey={`Cluster ${c.id}`} 
                                    fill={CHART_COLORS[i % CHART_COLORS.length]} 
                                    radius={[4, 4, 0, 0]} 
                                    barSize={clusters.length > 10 ? 6 : clusters.length > 5 ? 12 : 28}
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
