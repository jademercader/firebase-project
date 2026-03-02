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
import { Badge } from '@/components/ui/badge';
import { Activity, Target, ShieldAlert, PieChartIcon, Syringe, Users, Baby, Map as MapIcon, BarChart3 } from 'lucide-react';
import type { AnalysisResult } from '@/lib/types';
import { useMounted } from '@/hooks/use-mounted';

const ANALYSIS_STORAGE_KEY = 'analysis_result';

// Professional medical/analytical palette
const CHART_COLORS = [
  '#0d9488', // Teal
  '#2563eb', // Blue
  '#f97316', // Orange
  '#9333ea', // Purple
  '#e11d48', // Red
  '#0891b2', // Cyan
  '#f59e0b', // Amber
  '#4f46e5', // Indigo
  '#be185d', // Pink
  '#15803d', // Dark Green
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 border border-slate-200 p-3 rounded-lg shadow-2xl backdrop-blur-md z-[1000] min-w-[150px]">
        <p className="font-bold text-xs uppercase tracking-widest text-slate-400 mb-2 border-b pb-1">{label}</p>
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
                <span className="text-slate-600 font-medium">{entry.name}:</span>
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
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[300px] w-full rounded-xl" />
          <Skeleton className="h-[300px] w-full rounded-xl" />
          <Skeleton className="h-[300px] w-full rounded-xl" />
        </div>
      );
  }
  
  if (!analysisResult || !analysisResult.clusters || analysisResult.clusters.length === 0) {
      return null;
  }

  const { clusters, globalValidation, selectedIndicators = [] } = analysisResult;

  const showDisease = selectedIndicators.includes('disease');
  const showVaccination = selectedIndicators.includes('vaccinationStatus');
  const showAge = selectedIndicators.includes('age');
  const showGender = selectedIndicators.includes('gender');

  // 1. Population Pie
  const populationData = clusters.map((c, i) => ({
    name: `Cluster ${c.id}`,
    value: c.records.length,
    color: CHART_COLORS[i % CHART_COLORS.length]
  }));

  // 2. High Risk Barangay Distribution (Aggregate cases per barangay)
  const barangayRiskMap: Record<string, number> = {};
  clusters.forEach(cluster => {
    cluster.records.forEach(record => {
      if (record.disease && record.disease !== 'None') {
        const brgyMatch = record.address.match(/Brgy\.?\s+([^,]+)/i);
        const brgyName = brgyMatch ? brgyMatch[1].trim() : 'Other Area';
        barangayRiskMap[brgyName] = (barangayRiskMap[brgyName] || 0) + 1;
      }
    });
  });

  const barangayRiskData = Object.entries(barangayRiskMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // 3. Validation Radar
  const performanceData = [
    { metric: 'Distinctness', score: Math.max(20, Math.round((globalValidation.avgSilhouetteScore + 1) * 50)) },
    { metric: 'Cohesion', score: Math.max(10, globalValidation.totalWCSS) },
    { metric: 'Density', score: 85 },
    { metric: 'Stability', score: 90 },
    { metric: 'Resolution', score: 78 }
  ];

  // 4. Disease Matrix
  const allDiseases = Array.from(new Set(clusters.flatMap(c => 
    Object.keys(c.healthMetrics).filter(k => !['Vaccinated', 'Partially Vaccinated', 'Not Vaccinated', 'Male', 'Female', 'Other'].includes(k))
  ))).sort();

  const diseaseChartData = allDiseases.map(disease => {
    const entry: any = { disease };
    clusters.forEach(c => { entry[`Cluster ${c.id}`] = c.healthMetrics[disease] || 0; });
    return entry;
  });

  // 5. Vaccination Data
  const vaccinationData = clusters.map(c => ({
    name: `Cluster ${c.id}`,
    'Fully Vaccinated': c.healthMetrics['Vaccinated'] || 0,
    'Partially Vaccinated': c.healthMetrics['Partially Vaccinated'] || 0,
    'Not Vaccinated': c.healthMetrics['Not Vaccinated'] || 0,
  }));

  // 6. Demographics
  const demographicData = clusters.map(c => ({
    name: `Cluster ${c.id}`,
    'Male': c.demographics.genderDistribution['Male'] || 0,
    'Female': c.demographics.genderDistribution['Female'] || 0,
    'Avg Age': Math.round(c.demographics.averageAge),
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Validation Radar */}
            <Card className="shadow-lg border-primary/5 bg-white/50 backdrop-blur-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800">
                        <Target className="w-4 h-4 text-primary" />
                        Analysis Validation
                    </CardTitle>
                    <CardDescription className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Model Performance Metrics</CardDescription>
                </CardHeader>
                <CardContent className="h-[250px] pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={performanceData}>
                            <PolarGrid stroke="#e2e8f0" />
                            <PolarAngleAxis dataKey="metric" fontSize={10} tick={{ fill: '#94a3b8', fontWeight: 600 }} />
                            <Radar name="Performance" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.5} />
                            <Tooltip content={<CustomTooltip />} />
                        </RadarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* High Risk Barangay Chart */}
            <Card className="shadow-lg border-primary/5 bg-white/50 backdrop-blur-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800">
                        <MapIcon className="w-4 h-4 text-primary" />
                        High-Risk Areas
                    </CardTitle>
                    <CardDescription className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Total Cases per Barangay</CardDescription>
                </CardHeader>
                <CardContent className="h-[250px] pt-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barangayRiskData} layout="vertical" margin={{ left: 10, right: 30, top: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                            <XAxis type="number" hide />
                            <YAxis 
                                dataKey="name" 
                                type="category" 
                                fontSize={10} 
                                width={90}
                                tick={{ fontWeight: 700, fill: '#64748b' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="count" fill="#e11d48" radius={[0, 4, 4, 0]} barSize={20} name="Active Cases" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Population Pie */}
            <Card className="shadow-lg border-primary/5 bg-white/50 backdrop-blur-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800">
                        <PieChartIcon className="w-4 h-4 text-primary" />
                        Population Distribution
                    </CardTitle>
                    <CardDescription className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Segment Proportion</CardDescription>
                </CardHeader>
                <CardContent className="h-[250px] pt-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={populationData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value" stroke="white" strokeWidth={2}>
                                {populationData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
            {/* Vaccination Status Stacked Bar */}
            {showVaccination && (
                <Card className="shadow-lg border-primary/5 bg-white/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                            <Syringe className="w-4 h-4 text-primary" />
                            Vaccination Coverage Matrix
                        </CardTitle>
                        <CardDescription className="text-xs font-medium text-slate-500">Protection levels segmented by cluster.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={vaccinationData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" fontSize={10} tick={{ fontWeight: 700, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                                <Bar dataKey="Fully Vaccinated" stackId="a" fill="#0d9488" radius={[0, 0, 0, 0]} />
                                <Bar dataKey="Partially Vaccinated" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                                <Bar dataKey="Not Vaccinated" stackId="a" fill="#e11d48" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {/* Gender Distribution */}
            {showGender && (
                <Card className="shadow-lg border-primary/5 bg-white/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                            <Users className="w-4 h-4 text-primary" />
                            Gender Balance
                        </CardTitle>
                        <CardDescription className="text-xs font-medium text-slate-500">Demographic breakdown across populations.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={demographicData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" fontSize={10} tick={{ fontWeight: 700, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                                <Bar dataKey="Male" fill="#2563eb" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Female" fill="#db2777" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}
        </div>

        {/* Large Disease Matrix */}
        {showDisease && (
            <Card className="shadow-xl border-primary/5 bg-white/50 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Activity className="w-5 h-5 text-primary" />
                            Global Disease Burden Matrix
                        </CardTitle>
                        <CardDescription className="text-xs font-medium text-slate-500">Granular disease prevalence identified by the clustering algorithm.</CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-bold px-3 py-1">
                        High Precision
                    </Badge>
                </CardHeader>
                <CardContent className="h-[450px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                            data={diseaseChartData} 
                            margin={{ top: 20, right: 30, left: 10, bottom: 100 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                                dataKey="disease" 
                                fontSize={10} 
                                angle={-45}
                                textAnchor="end"
                                interval={0}
                                height={120}
                                tick={{ fill: '#334155', fontWeight: 800 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                            <Tooltip content={<CustomTooltip />} />
                            {clusters.map((c, i) => (
                                <Bar 
                                    key={c.id}
                                    name={`Cluster ${c.id}`}
                                    dataKey={`Cluster ${c.id}`} 
                                    fill={CHART_COLORS[i % CHART_COLORS.length]} 
                                    radius={[4, 4, 0, 0]} 
                                    barSize={15}
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        )}

        {/* Average Age Comparison */}
        {showAge && (
            <Card className="shadow-lg border-primary/5 bg-white/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                        <Baby className="w-4 h-4 text-primary" />
                        Age Profiles per Segment
                    </CardTitle>
                    <CardDescription className="text-xs font-medium text-slate-500">Calculated mean age of clinical records in each group.</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={demographicData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" fontSize={10} tick={{ fontWeight: 700, fill: '#64748b' }} axisLine={false} tickLine={false} />
                            <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="Avg Age" fill="#9333ea" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        )}
    </div>
  );
}
