'use client';
import { useEffect, useState } from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Stethoscope, ShieldCheck } from 'lucide-react';
import type { Cluster, AnalysisResult } from '@/lib/types';
import { useMounted } from '@/hooks/use-mounted';

const ANALYSIS_STORAGE_KEY = 'analysis_result';
const CLUSTERS_STORAGE_KEY = 'health_clusters';
const VAX_KEYS = ['Vaccinated', 'Partially Vaccinated', 'Not Vaccinated'];

const getMostPrevalentCondition = (cluster: Cluster) => {
    let maxCount = 0;
    let mostPrevalent = 'None';
    Object.entries(cluster.healthMetrics).forEach(([key, count]) => {
        if (!VAX_KEYS.includes(key) && count > maxCount) {
            maxCount = count;
            mostPrevalent = key;
        }
    });
    return mostPrevalent;
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
            } else {
              const savedClusters = localStorage.getItem(CLUSTERS_STORAGE_KEY);
              if (savedClusters) {
                setAnalysisResult({
                  clusters: JSON.parse(savedClusters),
                  globalValidation: { avgSilhouetteScore: 0, totalWCSS: 0 }
                });
              }
            }
        } catch (error) {
            console.error("Failed to load analysis from localStorage", error);
            setAnalysisResult(null);
        } finally {
            setIsLoading(false);
        }
    };
    fetchClusters();

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === ANALYSIS_STORAGE_KEY || event.key === CLUSTERS_STORAGE_KEY || event.key === null) {
        fetchClusters();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('analysis-updated', fetchClusters);

    return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('analysis-updated', fetchClusters);
    };

  }, [mounted]);

  if (!mounted) {
    return <Skeleton className="w-full h-[400px] rounded-lg" />;
  }

  const clusters = analysisResult?.clusters || [];
  const globalValidation = analysisResult?.globalValidation;

  // Dynamically extract all diseases found in the analysis metrics
  const allDiseasesSet = new Set<string>();
  clusters.forEach(c => {
    Object.keys(c.healthMetrics).forEach(k => {
      if (!VAX_KEYS.includes(k) && k !== 'None') {
        allDiseasesSet.add(k);
      }
    });
  });
  const detectedDiseases = Array.from(allDiseasesSet);

  const diseaseData = clusters.map(cluster => {
    const data: { [key: string]: any } = { name: cluster.name.split(':')[0] };
    detectedDiseases.forEach(d => {
      data[d] = cluster.healthMetrics[d] || 0;
    });
    return data;
  });

  const validationData = clusters.map(cluster => ({
    name: cluster.name.split(':')[0],
    'Silhouette Score': (cluster.validation?.silhouetteScore || 0).toFixed(3),
  }));

  const renderContent = () => {
    if (isLoading) {
      return <Skeleton className="w-full h-[300px]" />;
    }
    if (clusters.length === 0) {
      return (
        <div className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">Run cluster analysis to see metrics.</p>
        </div>
      );
    }
    return (
        <div className="space-y-6">
            <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-${clusters.length > 3 ? 4 : 3}`}>
                {clusters.map((cluster) => (
                    <Card key={cluster.id} className="border-l-4" style={{ borderLeftColor: `hsl(var(--chart-${(cluster.id % 5) + 1}))` }}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{cluster.name}</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{cluster.records.length} Records</div>
                            <div className="flex flex-col gap-1 mt-2">
                              <p className="text-xs text-muted-foreground">Avg. Age: {cluster.demographics.averageAge.toFixed(1)}</p>
                              <p className="text-xs text-muted-foreground font-semibold">Silhouette: {(cluster.validation?.silhouetteScore || 0).toFixed(3)}</p>
                            </div>
                             <div className="flex items-center pt-2">
                                <Stethoscope className="w-4 h-4 mr-2 text-muted-foreground"/>
                                <p className="text-xs text-muted-foreground">
                                    Top Condition: {getMostPrevalentCondition(cluster)}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <ShieldCheck className="w-5 h-5 text-primary" />
                          Validation Matrix
                        </CardTitle>
                        <CardDescription>Evaluation of clustering effectiveness using K-Means metrics.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-3 bg-secondary/30 rounded-lg border">
                          <p className="text-sm font-medium">Avg. Silhouette Score</p>
                          <p className="text-3xl font-bold text-primary">{(globalValidation?.avgSilhouetteScore || 0).toFixed(4)}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">Range: -1 to 1 (higher is better).</p>
                        </div>
                        <div className="p-3 bg-secondary/30 rounded-lg border">
                          <p className="text-sm font-medium">Total WCSS (Cohesion)</p>
                          <p className="text-3xl font-bold">{(globalValidation?.totalWCSS || 0).toFixed(2)}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">Measures compactness within clusters.</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Cluster Quality Comparison</CardTitle>
                        <CardDescription>Comparative validation results for each identified cluster.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={validationData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="Silhouette Score" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Disease Prevalence Distribution</CardTitle>
                        <CardDescription>Breakdown of health indicators across clusters.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={diseaseData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip />
                            <Legend />
                            {detectedDiseases.map((disease, idx) => (
                              <Bar 
                                key={disease} 
                                dataKey={disease} 
                                stackId="a" 
                                fill={`hsl(var(--chart-${(idx % 5) + 1}))`} 
                              />
                            ))}
                        </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Cluster Profile Analysis</CardTitle>
                        <CardDescription>Radar view of cluster characteristics.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={clusters.map(c => ({
                          name: c.name.split(':')[0],
                          Age: c.demographics.averageAge / 10,
                          Silhouette: (c.validation?.silhouetteScore || 0) * 10,
                          Size: Math.log10(c.records.length || 1) * 2
                        }))}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="name" />
                          <PolarRadiusAxis angle={30} domain={[0, 10]} />
                          <Radar name="Cluster Strength" dataKey="Silhouette" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
                          <Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
  };

  return (
    <div className="space-y-4">
        <h3 className="text-2xl font-bold tracking-tight font-headline">Statistical Results & Evaluation</h3>
        {renderContent()}
    </div>
  );
}
