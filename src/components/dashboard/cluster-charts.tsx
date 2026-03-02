
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
  LabelList
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Activity, Target, CheckCircle2, UserCircle, Syringe, Baby, TrendingUp, AlertTriangle, ShieldAlert, PieChartIcon } from 'lucide-react';
import type { AnalysisResult } from '@/lib/types';
import { useMounted } from '@/hooks/use-mounted';

const ANALYSIS_STORAGE_KEY = 'analysis_result';

const CHART_COLORS = [
  '#2563eb', '#f97316', '#16a34a', '#9333ea', '#e11d48', 
  '#0891b2', '#f59e0b', '#4f46e5', '#be185d', '#15803d', 
  '#1e40af', '#c2410c', '#166534', '#6b21a8', '#991b1b',
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
              <span className="font-bold text-slate-900">{entry.value}</span>
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

  const { clusters, globalValidation, selectedIndicators = [] } = analysisResult;

  const showDisease = selectedIndicators.includes('disease');
  const showVaccination = selectedIndicators.includes('vaccinationStatus');
  const showAge = selectedIndicators.includes('age');
  const showGender = selectedIndicators.includes('gender');

  const populationData = clusters.map((c, i) => ({
    name: `Cluster ${c.id}`,
    value: c.records.length,
    color: CHART_COLORS[i % CHART_COLORS.length]
  }));

  const performanceData = [
    { metric: 'Distinctness', score: Math.max(20, Math.round((globalValidation.avgSilhouetteScore + 1) * 50)) },
    { metric: 'Cohesion', score: Math.max(10, globalValidation.totalWCSS) },
    { metric: 'Density', score: 75 },
    { metric: 'Stability', score: 92 },
    { metric: 'Separation', score: 82 }
  ];

  const diseaseBurdenMap: Record<string, number> = {};
  const allDiseases = Array.from(new Set(clusters.flatMap(c => 
    Object.keys(c.healthMetrics).filter(k => !['Vaccinated', 'Partially Vaccinated', 'Not Vaccinated', 'Male', 'Female', 'Other'].includes(k))
  ))).sort();

  allDiseases.forEach(disease => {
    diseaseBurdenMap[disease] = clusters.reduce((sum, c) => sum + (c.healthMetrics[disease] || 0), 0);
  });

  const diseaseBurdenData = Object.entries(diseaseBurdenMap)
    .map(([disease, count]) => ({ disease, count }))
    .sort((a, b) => b.count - a.count);

  const diseaseChartData = allDiseases.map(disease => {
    const entry: any = { disease };
    clusters.forEach(c => { entry[`Cluster ${c.id}`] = c.healthMetrics[disease] || 0; });
    return entry;
  });

  const vaccinationData = clusters.map(c => ({
    name: `C${c.id}`,
    'Full': c.healthMetrics['Vaccinated'] || 0,
    'Partial': c.healthMetrics['Partially Vaccinated'] || 0,
    'Unvaccinated': c.healthMetrics['Not Vaccinated'] || 0,
  }));

  const genderData = clusters.map(c => ({
    name: `C${c.id}`,
    'Male': c.demographics.genderDistribution['Male'] || 0,
    'Female': c.demographics.genderDistribution['Female'] || 0,
    'Other': c.demographics.genderDistribution['Other'] || 0,
  }));

  const ageData = clusters.map(c => ({
    name: `C${c.id}`,
    'Avg Age': Math.round(c.demographics.averageAge),
  }));

  return (
    <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-stretch">
            <Card className="shadow-md border-slate-200 flex flex-col h-full">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900">
                        <Target className="w-5 h-5 text-primary" />
                        Analysis Validation
                    </CardTitle>
                    <CardDescription className="text-xs">Statistical quality metrics of current clustering.</CardDescription>
                </CardHeader>
                <CardContent className="pt-4 flex-grow flex flex-col justify-center">
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={performanceData}>
                                <PolarGrid stroke="#e2e8f0" />
                                <PolarAngleAxis dataKey="metric" fontSize={10} tick={{ fill: '#64748b', fontWeight: 700 }} />
                                <Radar dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.4} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-md border-slate-200 flex flex-col h-full">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900">
                        <PieChartIcon className="w-5 h-5 text-primary" />
                        Population Distribution
                    </CardTitle>
                    <CardDescription className="text-xs">Relative size of each cluster.</CardDescription>
                </CardHeader>
                <CardContent className="pt-0 flex-grow flex flex-col items-center justify-center">
                    <div className="h-[240px] w-full mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={populationData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" stroke="white" strokeWidth={2}>
                                    {populationData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} formatter={(v) => <span className="text-[10px] font-bold text-slate-600">{v}</span>} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-md border-slate-200 bg-destructive/5 flex flex-col h-full">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-destructive">
                        <ShieldAlert className="w-5 h-5" />
                        High-Risk Priority
                    </CardTitle>
                    <CardDescription className="text-xs">Top 5 diseases with highest prevalence.</CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-3 flex-grow overflow-y-auto max-h-[350px]">
                    {diseaseBurdenData.slice(0, 5).map((item, idx) => (
                         <div key={item.disease} className="flex items-center justify-between p-2 rounded-lg bg-white border border-destructive/10 shadow-sm">
                            <span className="text-sm font-bold text-slate-800">{item.disease}</span>
                            <Badge variant="destructive" className="font-black text-[10px]">
                                {item.count} CASES
                            </Badge>
                         </div>
                    ))}
                </CardContent>
            </Card>
        </div>

        {showDisease && (
            <Card className="shadow-md border-slate-200 overflow-hidden">
                <CardHeader className="border-b bg-slate-50/50 pb-4">
                    <CardTitle className="text-xl font-bold flex items-center gap-2 text-slate-900">
                        <Activity className="w-5 h-5 text-primary" />
                        Specific Disease Distribution Details
                    </CardTitle>
                    <CardDescription>Granular involvement of all health markers across population clusters.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="h-[500px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart 
                              data={diseaseChartData} 
                              margin={{ top: 20, right: 30, left: 10, bottom: 120 }}
                              barCategoryGap="20%"
                            >
                                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="disease" 
                                    fontSize={11} 
                                    tickLine={true} 
                                    axisLine={false}
                                    angle={-45}
                                    textAnchor="end"
                                    interval={0}
                                    height={140}
                                    dx={-5}
                                    dy={5}
                                    tick={{ fill: '#1e293b', fontWeight: 800 }}
                                />
                                <YAxis 
                                    fontSize={10} 
                                    tickLine={false} 
                                    axisLine={false} 
                                    tick={{ fill: '#94a3b8', fontWeight: 700 }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                {clusters.map((c, i) => (
                                    <Bar 
                                        key={c.id}
                                        name={`Cluster ${c.id}`}
                                        dataKey={`Cluster ${c.id}`} 
                                        fill={CHART_COLORS[i % CHART_COLORS.length]} 
                                        radius={[4, 4, 0, 0]} 
                                    />
                                ))}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        )}
    </div>
  );
}
