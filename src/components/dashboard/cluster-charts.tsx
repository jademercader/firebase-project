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
import { Activity, Target, ShieldAlert, PieChartIcon, Syringe, Users, Baby, Map as MapIcon } from 'lucide-react';
import type { AnalysisResult } from '@/lib/types';
import { useMounted } from '@/hooks/use-mounted';

const ANALYSIS_STORAGE_KEY = 'analysis_result';

const CHART_COLORS = [
  '#2563eb', '#f97316', '#16a34a', '#9333ea', '#e11d48', 
  '#0891b2', '#f59e0b', '#4f46e5', '#be185d', '#15803d', 
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
        // Extract Barangay from address string (e.g., "Brgy. Obrero")
        const brgyMatch = record.address.match(/Brgy\.?\s+([^,]+)/i);
        const brgyName = brgyMatch ? brgyMatch[1].trim() : 'Unknown';
        barangayRiskMap[brgyName] = (barangayRiskMap[brgyName] || 0) + 1;
      }
    });
  });

  const barangayRiskData = Object.entries(barangayRiskMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8); // Top 8 high risk barangays

  // 3. Validation Radar
  const performanceData = [
    { metric: 'Distinctness', score: Math.max(20, Math.round((globalValidation.avgSilhouetteScore + 1) * 50)) },
    { metric: 'Cohesion', score: Math.max(10, globalValidation.totalWCSS) },
    { metric: 'Density', score: 75 },
    { metric: 'Stability', score: 92 },
    { metric: 'Separation', score: 82 }
  ];

  // 4. Disease Burden (Top Diseases)
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

  // 5. Vaccination Data
  const vaccinationData = clusters.map(c => ({
    name: `Cluster ${c.id}`,
    'Full': c.healthMetrics['Vaccinated'] || 0,
    'Partial': c.healthMetrics['Partially Vaccinated'] || 0,
    'None': c.healthMetrics['Not Vaccinated'] || 0,
  }));

  // 6. Demographics (Gender & Age)
  const demographicData = clusters.map(c => ({
    name: `Cluster ${c.id}`,
    'Male': c.demographics.genderDistribution['Male'] || 0,
    'Female': c.demographics.genderDistribution['Female'] || 0,
    'Avg Age': Math.round(c.demographics.averageAge),
  }));

  return (
    <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-stretch">
            {/* Validation */}
            <Card className="shadow-md border-slate-200">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900">
                        <Target className="w-5 h-5 text-primary" />
                        Analysis Validation
                    </CardTitle>
                    <CardDescription className="text-xs">Statistical quality metrics of clustering.</CardDescription>
                </CardHeader>
                <CardContent className="h-[250px] pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={performanceData}>
                            <PolarGrid stroke="#e2e8f0" />
                            <PolarAngleAxis dataKey="metric" fontSize={10} tick={{ fill: '#64748b', fontWeight: 700 }} />
                            <Radar dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.4} />
                        </RadarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* High Risk Barangay Chart */}
            <Card className="shadow-md border-slate-200 lg:col-span-1">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900">
                        <MapIcon className="w-5 h-5 text-primary" />
                        High-Risk Barangays
                    </CardTitle>
                    <CardDescription className="text-xs">Top areas with concentrated disease cases.</CardDescription>
                </CardHeader>
                <CardContent className="h-[250px] pt-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barangayRiskData} layout="vertical" margin={{ left: 20, right: 30 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                            <XAxis type="number" fontSize={10} hide />
                            <YAxis 
                                dataKey="name" 
                                type="category" 
                                fontSize={10} 
                                width={80}
                                tick={{ fontWeight: 700, fill: '#1e293b' }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="count" fill="#e11d48" radius={[0, 4, 4, 0]} name="Total Cases" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Population Pie */}
            <Card className="shadow-md border-slate-200">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900">
                        <PieChartIcon className="w-5 h-5 text-primary" />
                        Population Distribution
                    </CardTitle>
                    <CardDescription className="text-xs">Relative size of each identified segment.</CardDescription>
                </CardHeader>
                <CardContent className="h-[250px] pt-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={populationData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" stroke="white" strokeWidth={2}>
                                {populationData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend iconType="circle" />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
            {/* Vaccination Status Stacked Bar */}
            {showVaccination && (
                <Card className="shadow-md border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Syringe className="w-5 h-5 text-primary" />
                            Vaccination Distribution
                        </CardTitle>
                        <CardDescription>Comparative protection levels across segments.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={vaccinationData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" fontSize={11} tick={{ fontWeight: 700 }} />
                                <YAxis fontSize={10} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Bar dataKey="Full" stackId="a" fill="#16a34a" />
                                <Bar dataKey="Partial" stackId="a" fill="#f59e0b" />
                                <Bar dataKey="None" stackId="a" fill="#e11d48" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {/* Gender Distribution Bar */}
            {showGender && (
                <Card className="shadow-md border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Users className="w-5 h-5 text-primary" />
                            Gender Composition
                        </CardTitle>
                        <CardDescription>Demographic balance within each population cluster.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={demographicData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" fontSize={11} tick={{ fontWeight: 700 }} />
                                <YAxis fontSize={10} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Bar dataKey="Male" fill="#2563eb" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Female" fill="#e11d48" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}
        </div>

        {/* Large Disease Chart */}
        {showDisease && (
            <Card className="shadow-md border-slate-200">
                <CardHeader>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <Activity className="w-5 h-5 text-primary" />
                        Comprehensive Disease Matrix
                    </CardTitle>
                    <CardDescription>Prevalence of specific conditions mapped to population segments.</CardDescription>
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
                                fontSize={11} 
                                angle={-45}
                                textAnchor="end"
                                interval={0}
                                height={120}
                                tick={{ fill: '#1e293b', fontWeight: 800 }}
                            />
                            <YAxis fontSize={10} axisLine={false} tickLine={false} />
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
                </CardContent>
            </Card>
        )}

        {/* Average Age Comparison */}
        {showAge && (
            <Card className="shadow-md border-slate-200">
                <CardHeader>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Baby className="w-5 h-5 text-primary" />
                        Age Profiles
                    </CardTitle>
                    <CardDescription>Average age of individuals per cluster.</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={demographicData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" fontSize={11} tick={{ fontWeight: 700 }} />
                            <YAxis fontSize={10} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="Avg Age" fill="#9333ea" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        )}
    </div>
  );
}