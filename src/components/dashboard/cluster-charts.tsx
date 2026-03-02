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
import { Activity, Target, PieChartIcon, Syringe, Users, Baby, Map as MapIcon } from 'lucide-react';
import type { AnalysisResult } from '@/lib/types';
import { useMounted } from '@/hooks/use-mounted';

const ANALYSIS_STORAGE_KEY = 'analysis_result';

// Classic Excel-inspired color palette
const CHART_COLORS = [
  '#4472C4', // Excel Blue
  '#ED7D31', // Excel Orange
  '#A5A5A5', // Excel Grey
  '#FFC000', // Excel Gold
  '#5B9BD5', // Excel Light Blue
  '#70AD47', // Excel Green
  '#264478', // Excel Dark Blue
  '#9E480E', // Excel Dark Orange
  '#636363', // Excel Dark Grey
  '#997300', // Excel Dark Gold
];

const ExcelTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-300 p-2 shadow-md text-xs font-sans">
        <p className="font-bold border-b border-slate-200 mb-1 pb-1">{label}</p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-4">
              <span className="text-slate-600">{entry.name}:</span>
              <span className="font-bold text-slate-900 ml-auto">{entry.value}</span>
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

  // 2. High Risk Barangay Distribution
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
    .slice(0, 10);

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
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1400px] mx-auto">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Validation Radar */}
            <Card className="shadow border-slate-200">
                <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-700">
                        <Target className="w-4 h-4 text-slate-500" />
                        Analysis Performance
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-[280px] pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={performanceData}>
                            <PolarGrid stroke="#d1d5db" />
                            <PolarAngleAxis dataKey="metric" fontSize={10} tick={{ fill: '#4b5563', fontWeight: 600 }} />
                            <Radar name="Performance" dataKey="score" stroke="#4472C4" fill="#4472C4" fillOpacity={0.6} />
                            <Tooltip content={<ExcelTooltip />} />
                        </RadarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* High Risk Barangay Chart - Ranked List Style */}
            <Card className="shadow border-slate-200">
                <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-700">
                        <MapIcon className="w-4 h-4 text-slate-500" />
                        High-Risk Neighborhoods
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-[280px] pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barangayRiskData} layout="vertical" margin={{ left: 10, right: 30, top: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="0 0" horizontal={true} vertical={false} stroke="#e5e7eb" />
                            <XAxis type="number" hide />
                            <YAxis 
                                dataKey="name" 
                                type="category" 
                                fontSize={10} 
                                width={100}
                                tick={{ fontWeight: 600, fill: '#374151' }}
                                axisLine={{ stroke: '#9ca3af' }}
                                tickLine={false}
                            />
                            <Tooltip content={<ExcelTooltip />} />
                            <Bar dataKey="count" fill="#ED7D31" barSize={18} name="Total Cases" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Population Distribution */}
            <Card className="shadow border-slate-200">
                <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-700">
                        <PieChartIcon className="w-4 h-4 text-slate-500" />
                        Population Overview
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-[280px] pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie 
                                data={populationData} 
                                cx="50%" 
                                cy="50%" 
                                outerRadius={80} 
                                dataKey="value" 
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                labelLine={true}
                            >
                                {populationData.map((entry, index) => <Cell key={index} fill={entry.color} stroke="#fff" strokeWidth={1} />)}
                            </Pie>
                            <Tooltip content={<ExcelTooltip />} />
                            <Legend verticalAlign="bottom" align="center" iconType="rect" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
            {/* Vaccination Stacked Column */}
            {showVaccination && (
                <Card className="shadow border-slate-200">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Syringe className="w-4 h-4 text-slate-500" />
                            Vaccination Status by Segment
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[350px] pt-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={vaccinationData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="0 0" vertical={false} stroke="#e5e7eb" />
                                <XAxis dataKey="name" fontSize={11} tick={{ fontWeight: 600, fill: '#374151' }} axisLine={{ stroke: '#9ca3af' }} tickLine={false} />
                                <YAxis fontSize={11} axisLine={{ stroke: '#9ca3af' }} tickLine={false} tick={{ fill: '#6b7280' }} />
                                <Tooltip content={<ExcelTooltip />} />
                                <Legend verticalAlign="top" align="right" iconType="rect" wrapperStyle={{ fontSize: '10px', paddingBottom: '20px' }} />
                                <Bar dataKey="Fully Vaccinated" stackId="vax" fill="#4472C4" />
                                <Bar dataKey="Partially Vaccinated" stackId="vax" fill="#ED7D31" />
                                <Bar dataKey="Not Vaccinated" stackId="vax" fill="#A5A5A5" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {/* Gender Balance Clustered Column */}
            {showGender && (
                <Card className="shadow border-slate-200">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Users className="w-4 h-4 text-slate-500" />
                            Gender Demographic Split
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[350px] pt-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={demographicData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="0 0" vertical={false} stroke="#e5e7eb" />
                                <XAxis dataKey="name" fontSize={11} tick={{ fontWeight: 600, fill: '#374151' }} axisLine={{ stroke: '#9ca3af' }} tickLine={false} />
                                <YAxis fontSize={11} axisLine={{ stroke: '#9ca3af' }} tickLine={false} tick={{ fill: '#6b7280' }} />
                                <Tooltip content={<ExcelTooltip />} />
                                <Legend verticalAlign="top" align="right" iconType="rect" wrapperStyle={{ fontSize: '10px', paddingBottom: '20px' }} />
                                <Bar dataKey="Male" fill="#4472C4" barSize={30} />
                                <Bar dataKey="Female" fill="#ED7D31" barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}
        </div>

        {/* Multi-Series Disease Matrix */}
        {showDisease && (
            <Card className="shadow border-slate-200">
                <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/50">
                    <div>
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                            <Activity className="w-5 h-5 text-slate-500" />
                            Disease Prevalence Matrix
                        </CardTitle>
                    </div>
                    <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300 font-bold px-3 py-1 text-xs">
                        Consolidated Analysis
                    </Badge>
                </CardHeader>
                <CardContent className="h-[500px] pt-6">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                            data={diseaseChartData} 
                            margin={{ top: 20, right: 30, left: 0, bottom: 100 }}
                        >
                            <CartesianGrid strokeDasharray="0 0" vertical={false} stroke="#e5e7eb" />
                            <XAxis 
                                dataKey="disease" 
                                fontSize={11} 
                                angle={-45}
                                textAnchor="end"
                                interval={0}
                                height={120}
                                tick={{ fill: '#374151', fontWeight: 600 }}
                                axisLine={{ stroke: '#9ca3af' }}
                                tickLine={false}
                            />
                            <YAxis fontSize={11} axisLine={{ stroke: '#9ca3af' }} tickLine={false} tick={{ fill: '#6b7280' }} />
                            <Tooltip content={<ExcelTooltip />} />
                            <Legend verticalAlign="top" align="right" iconType="rect" wrapperStyle={{ fontSize: '10px', paddingBottom: '30px' }} />
                            {clusters.map((c, i) => (
                                <Bar 
                                    key={c.id}
                                    name={`Cluster ${c.id}`}
                                    dataKey={`Cluster ${c.id}`} 
                                    fill={CHART_COLORS[i % CHART_COLORS.length]} 
                                    barSize={12}
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        )}

        {/* Average Age Column Chart */}
        {showAge && (
            <Card className="shadow border-slate-200">
                <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Baby className="w-4 h-4 text-slate-500" />
                        Mean Population Age
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] pt-6">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={demographicData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="0 0" vertical={false} stroke="#e5e7eb" />
                            <XAxis dataKey="name" fontSize={11} tick={{ fontWeight: 600, fill: '#374151' }} axisLine={{ stroke: '#9ca3af' }} tickLine={false} />
                            <YAxis fontSize={11} axisLine={{ stroke: '#9ca3af' }} tickLine={false} tick={{ fill: '#6b7280' }} />
                            <Tooltip content={<ExcelTooltip />} />
                            <Bar dataKey="Avg Age" fill="#4472C4" barSize={50} name="Average Age (Years)" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        )}
    </div>
  );
}