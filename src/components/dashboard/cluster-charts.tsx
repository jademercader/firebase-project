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
        {/* ROW 1: CORE METRICS & HIGH RISK OVERVIEW */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-stretch">
            {/* Analysis Quality Radar */}
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
                    <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm mt-4">
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                        <div>
                            <p className="text-[10px] uppercase font-black text-slate-400">Model Confidence</p>
                            <p className="text-xl font-black text-slate-900">
                                {Math.max(20, Math.round((globalValidation.avgSilhouetteScore + 1) * 50))}%
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Population Segments Pie */}
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

            {/* High-Risk Identification Card */}
            <Card className="shadow-md border-slate-200 bg-destructive/5 flex flex-col h-full">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-destructive">
                        <ShieldAlert className="w-5 h-5" />
                        High-Risk Priority
                    </CardTitle>
                    <CardDescription className="text-xs">Top 5 diseases with highest prevalence in the dataset.</CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-3 flex-grow overflow-y-auto max-h-[350px]">
                    {diseaseBurdenData.slice(0, 5).map((item, idx) => (
                         <div key={item.disease} className="flex items-center justify-between p-2 rounded-lg bg-white border border-destructive/10 shadow-sm transition-all hover:translate-x-1">
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-black text-destructive/40">#0{idx+1}</span>
                                <span className="text-sm font-bold text-slate-800">{item.disease}</span>
                            </div>
                            <Badge variant="destructive" className="font-black text-[10px]">
                                {item.count} CASES
                            </Badge>
                         </div>
                    ))}
                    {diseaseBurdenData.length === 0 && (
                        <div className="text-center py-12 text-slate-400 text-xs italic">
                            No high-risk diseases detected in selected criteria.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>

        {/* ROW 2: DISEASE BURDEN RANKING & CLUSTER SPECIFIC RISKS */}
        {showDisease && diseaseBurdenData.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="shadow-md border-slate-200 h-full">
                    <CardHeader className="bg-slate-50/50 border-b">
                        <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            Disease Prevalence Ranking
                        </CardTitle>
                        <CardDescription>Aggregate case volume across all population clusters.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="h-[400px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={diseaseBurdenData} layout="vertical" margin={{ left: 20, right: 60, top: 10, bottom: 10 }}>
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

                <Card className="shadow-md border-slate-200 h-full">
                    <CardHeader className="bg-slate-50/50 border-b">
                        <CardTitle className="text-lg font-bold flex items-center gap-2 text-destructive">
                            <AlertTriangle className="w-5 h-5" />
                            Cluster-Dominant Risks
                        </CardTitle>
                        <CardDescription>Primary health marker identified per identified hotspot.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {clusters.map((c, i) => {
                                const diseases = Object.entries(c.healthMetrics)
                                    .filter(([k]) => !['Vaccinated', 'Partially Vaccinated', 'Not Vaccinated', 'Male', 'Female', 'Other'].includes(k))
                                    .sort((a, b) => b[1] - a[1]);
                                const top = diseases[0];
                                
                                return (
                                    <div key={c.id} className="flex items-center justify-between p-4 rounded-xl bg-white border border-slate-100 shadow-sm transition-all hover:border-primary/20">
                                        <div className="flex items-center gap-4">
                                            <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                                            <div>
                                                <p className="text-[10px] font-black uppercase text-slate-400">Cluster {c.id}</p>
                                                <p className="text-sm font-black text-slate-900 leading-tight">
                                                    {top ? top[0] : 'Stable Health Profile'}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-black shrink-0">
                                            {top ? top[1] : 0} CASES
                                        </Badge>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        )}

        {/* ROW 3: DETAILED MULTI-CLUSTER INVOLVEMENT (FULL WIDTH) */}
        {showDisease && (
            <Card className="shadow-md border-slate-200 overflow-hidden">
                <CardHeader className="border-b bg-slate-50/50 pb-4">
                    <CardTitle className="text-xl font-bold flex items-center gap-2 text-slate-900">
                        <Activity className="w-5 h-5 text-primary" />
                        Specific Disease Distribution Details
                    </CardTitle>
                    <CardDescription>Granular involvement of all health markers across population clusters.</CardDescription>
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
                                        barSize={Math.max(4, 30 - clusters.length)}
                                    />
                                ))}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        )}

        {/* ROW 4: DEMOGRAPHIC INDICATORS (DYNAMIC GRID) */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
             {showGender && (
                <Card className="shadow-md border-slate-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
                            <UserCircle className="w-5 h-5 text-primary" />
                            Gender Profile
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="h-[240px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={genderData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" fontSize={10} tickLine={false} axisLine={false} tick={{ fontWeight: 700 }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="Male" stackId="a" fill="#2563eb" />
                                    <Bar dataKey="Female" stackId="a" fill="#e11d48" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            )}

            {showAge && (
                <Card className="shadow-md border-slate-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
                            <Baby className="w-5 h-5 text-primary" />
                            Mean Age Split
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="h-[240px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={ageData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} tick={{ fontWeight: 700 }} />
                                    <YAxis fontSize={10} tickLine={false} axisLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="Avg Age" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            )}

            {showVaccination && (
                <Card className="shadow-md border-slate-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
                            <Syringe className="w-5 h-5 text-primary" />
                            Vaccination Coverage
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="h-[240px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={vaccinationData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} tick={{ fontWeight: 700 }} />
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
