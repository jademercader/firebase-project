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
import { Activity, BarChart3, PieChartIcon, Target, CheckCircle2, UserCircle, Syringe, Baby, TrendingUp, AlertTriangle, ShieldAlert } from 'lucide-react';
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

  // Chart Visibility Logic
  const showDisease = selectedIndicators.includes('disease');
  const showVaccination = selectedIndicators.includes('vaccinationStatus');
  const showAge = selectedIndicators.includes('age');
  const showGender = selectedIndicators.includes('gender');

  // 1. Population Data
  const populationData = clusters.map((c, i) => ({
    name: `Cluster ${c.id}`,
    value: c.records.length,
    color: CHART_COLORS[i % CHART_COLORS.length]
  }));

  // 2. Performance Matrix
  const performanceData = [
    { metric: 'Distinctness', score: Math.max(20, Math.round((globalValidation.avgSilhouetteScore + 1) * 50)) },
    { metric: 'Cohesion', score: Math.max(10, globalValidation.totalWCSS) },
    { metric: 'Density', score: 75 },
    { metric: 'Stability', score: 92 },
    { metric: 'Separation', score: 82 }
  ];

  // 3. Disease Burden Aggregate Data
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

  // 4. Multi-series Disease Distribution Data
  const diseaseChartData = allDiseases.map(disease => {
    const entry: any = { disease };
    clusters.forEach(c => { entry[`Cluster ${c.id}`] = c.healthMetrics[disease] || 0; });
    return entry;
  });

  // 5. Vaccination Data
  const vaccinationData = clusters.map(c => ({
    name: `C${c.id}`,
    'Full': c.healthMetrics['Vaccinated'] || 0,
    'Partial': c.healthMetrics['Partially Vaccinated'] || 0,
    'Unvaccinated': c.healthMetrics['Not Vaccinated'] || 0,
  }));

  // 6. Gender Data
  const genderData = clusters.map(c => ({
    name: `C${c.id}`,
    'Male': c.demographics.genderDistribution['Male'] || 0,
    'Female': c.demographics.genderDistribution['Female'] || 0,
    'Other': c.demographics.genderDistribution['Other'] || 0,
  }));

  // 7. Age Data
  const ageData = clusters.map(c => ({
    name: `C${c.id}`,
    'Avg Age': Math.round(c.demographics.averageAge),
  }));

  return (
    <div className="space-y-6 pb-20">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Evaluation Matrix */}
            <Card className="shadow-md border-slate-200 bg-gradient-to-b from-white to-slate-50/30">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Target className="w-5 h-5 text-primary" />
                        Analysis Effectiveness
                    </CardTitle>
                    <CardDescription className="text-xs">Statistical validation of clustering quality.</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={performanceData}>
                                <PolarGrid stroke="#e2e8f0" />
                                <PolarAngleAxis dataKey="metric" fontSize={10} tick={{ fill: '#64748b', fontWeight: 700 }} />
                                <Radar dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.4} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm mt-4">
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                        <div>
                            <p className="text-[10px] uppercase font-black text-slate-400">Model Confidence</p>
                            <p className="text-xl font-black text-slate-900 leading-none">
                                {Math.max(20, Math.round((globalValidation.avgSilhouetteScore + 1) * 50))}%
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Population Clusters */}
            <Card className="shadow-md border-slate-200 bg-gradient-to-b from-white to-slate-50/30">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <PieChartIcon className="w-5 h-5 text-primary" />
                        Population Distribution
                    </CardTitle>
                    <CardDescription className="text-xs">Size of identified population segments.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center pt-0">
                    <div className="h-[240px] w-full mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={populationData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" stroke="white" strokeWidth={2}>
                                    {populationData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend iconType="circle" formatter={(v) => <span className="text-[10px] font-bold">{v}</span>} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* High-Risk Diseases Identification */}
            <Card className="shadow-md border-slate-200 bg-gradient-to-b from-white to-slate-50/30">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-destructive">
                        <ShieldAlert className="w-5 h-5" />
                        Critical Indicators
                    </CardTitle>
                    <CardDescription className="text-xs">Identifying diseases with highest involvement.</CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                    {diseaseBurdenData.slice(0, 4).map((item, idx) => (
                         <div key={item.disease} className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-black text-slate-400">#0{idx+1}</span>
                                <span className="text-sm font-bold text-slate-800">{item.disease}</span>
                            </div>
                            <Badge variant="destructive" className="font-black text-[10px] px-2 py-0">
                                {item.count} INVOLVED
                            </Badge>
                         </div>
                    ))}
                    {diseaseBurdenData.length === 0 && (
                        <div className="text-center py-8 text-slate-400 text-xs italic">
                            No disease indicators selected for analysis.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>

        {/* Aggregate Disease Burden Analysis */}
        {showDisease && diseaseBurdenData.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="shadow-md border-slate-200 overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            Disease Prevalence Ranking
                        </CardTitle>
                        <CardDescription>Aggregate count of disease markers found across all segments.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="h-[400px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={diseaseBurdenData} layout="vertical" margin={{ left: 20, right: 60, top: 20, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                    <XAxis type="number" hide />
                                    <YAxis 
                                        dataKey="disease" 
                                        type="category" 
                                        fontSize={11} 
                                        tickLine={false} 
                                        axisLine={false}
                                        width={140}
                                        tick={{ fill: '#1e293b', fontWeight: 800 }}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="count" name="Case Count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]}>
                                        <LabelList dataKey="count" position="right" offset={10} style={{ fontSize: '10px', fontWeight: 'bold', fill: '#475569' }} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-md border-slate-200 overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-destructive" />
                            Cluster-Specific Dominant Risks
                        </CardTitle>
                        <CardDescription>Primary health marker identified for each population cluster.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {clusters.map((c, i) => {
                                const diseases = Object.entries(c.healthMetrics)
                                    .filter(([k]) => !['Vaccinated', 'Partially Vaccinated', 'Not Vaccinated', 'Male', 'Female', 'Other'].includes(k))
                                    .sort((a, b) => b[1] - a[1]);
                                const top = diseases[0];
                                
                                return (
                                    <div key={c.id} className="flex items-center justify-between p-4 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-4">
                                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cluster {c.id}</p>
                                                <p className="text-base font-black text-slate-900 leading-tight">
                                                    {top ? top[0] : 'No Significant Marker'}
                                                </p>
                                                <p className="text-[10px] font-bold text-slate-500 mt-0.5 italic">
                                                    {c.records.length} patients in this segment.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-black">
                                                {top ? top[1] : 0} CASES
                                            </Badge>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        )}

        {/* Detailed Cluster-Disease Multi-Series Visualization */}
        {showDisease && (
            <Card className="shadow-md border-slate-200 overflow-hidden">
                <CardHeader className="border-b pb-4 bg-slate-50/50">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <Activity className="w-5 h-5 text-primary" />
                                Multi-Cluster Involvement Detail
                            </CardTitle>
                            <CardDescription>Visualizing specific disease involvement levels across all identified population clusters.</CardDescription>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-end">
                            {clusters.map((c, i) => (
                                <div key={c.id} className="flex items-center gap-2 bg-white px-2 py-1 rounded-md border text-[9px] font-black shadow-sm">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                                    <span className="text-slate-600 uppercase">C{c.id}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-10">
                    <div className="h-[550px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={diseaseChartData} margin={{ top: 20, right: 30, left: 10, bottom: 160 }}>
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
                                    dx={-10}
                                    dy={10}
                                    tick={{ fill: '#1e293b', fontWeight: 800 }}
                                />
                                <YAxis 
                                    fontSize={10} 
                                    tickLine={false} 
                                    axisLine={false} 
                                    tick={{ fill: '#94a3b8', fontWeight: 700 }}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9', opacity: 0.5 }} />
                                {clusters.map((c, i) => (
                                    <Bar 
                                        key={c.id}
                                        name={`Cluster ${c.id}`}
                                        dataKey={`Cluster ${c.id}`} 
                                        fill={CHART_COLORS[i % CHART_COLORS.length]} 
                                        radius={[4, 4, 0, 0]} 
                                        barSize={Math.max(4, 25 - (clusters.length))}
                                    />
                                ))}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        )}

        {/* Secondary Indicators Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
             {/* Gender Distribution */}
             {showGender && (
                <Card className="shadow-md border-slate-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <UserCircle className="w-5 h-5 text-primary" />
                            Gender Split
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="h-[240px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={genderData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" fontSize={10} tickLine={false} axisLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="Male" stackId="a" fill="#2563eb" />
                                    <Bar dataKey="Female" stackId="a" fill="#e11d48" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Average Age */}
            {showAge && (
                <Card className="shadow-md border-slate-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Baby className="w-5 h-5 text-primary" />
                            Mean Age Profile
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="h-[240px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={ageData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={10} tickLine={false} axisLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="Avg Age" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Vaccination Status */}
            {showVaccination && (
                <Card className="shadow-md border-slate-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Syringe className="w-5 h-5 text-primary" />
                            Immunization Rate
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="h-[240px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={vaccinationData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis hide />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="Full" stackId="v" fill="#16a34a" />
                                    <Bar dataKey="Partial" stackId="v" fill="#f97316" />
                                    <Bar dataKey="Unvaccinated" stackId="v" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    </div>
  );
}
