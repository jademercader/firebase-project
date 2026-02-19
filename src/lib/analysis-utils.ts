
import type { HealthRecord, Cluster, AnalysisResult } from '@/lib/types';

/**
 * Dynamically normalizes record data based on selected indicators.
 * Handles both numeric and categorical data found in the records.
 */
function recordToVector(record: HealthRecord, indicators: string[]): { [key: string]: number } {
  const vector: { [key: string]: number } = {};
  
  const categoryMap: Record<string, Record<string, number>> = {
    gender: { 'Male': 0, 'Female': 1, 'Other': 2 },
    vaccinationStatus: { 'Not Vaccinated': 0, 'Partially Vaccinated': 1, 'Vaccinated': 2 },
  };

  indicators.forEach(indicator => {
    const value = record[indicator];
    
    if (indicator === 'age') {
      vector['age'] = (Number(value) || 0) / 100;
    } else if (categoryMap[indicator]) {
      const map = categoryMap[indicator];
      const max = Object.keys(map).length - 1;
      vector[indicator] = (map[String(value)] ?? 0) / (max || 1);
    } else if (typeof value === 'number') {
      vector[indicator] = value / 100;
    } else {
      vector[indicator] = value && value !== 'None' ? 1 : 0;
    }
  });

  return vector;
}

/**
 * Calculates Euclidean distance between two vectors.
 */
function euclideanDistance(v1: { [key: string]: number }, v2: { [key: string]: number }): number {
  let sum = 0;
  const keys = Object.keys(v1);
  for (const key of keys) {
    sum += Math.pow((v1[key] || 0) - (v2[key] || 0), 2);
  }
  return Math.sqrt(sum);
}

/**
 * Performs K-Means clustering locally.
 * Optimized for large datasets and includes centroid location calculation for mapping.
 */
export function performLocalKMeans(
  records: HealthRecord[],
  numClusters: number,
  selectedIndicators: string[] = ['age', 'gender', 'vaccinationStatus']
): AnalysisResult {
  if (records.length === 0) return { clusters: [], globalValidation: { avgSilhouetteScore: 0, totalWCSS: 0 } };

  const vectors = records.map(r => ({ id: r.id, vector: recordToVector(r, selectedIndicators) }));
  const keys = selectedIndicators;

  const initialCentroidsCount = Math.min(numClusters, records.length);
  let centroids = vectors
    .slice()
    .sort(() => 0.5 - Math.random())
    .slice(0, initialCentroidsCount)
    .map(v => ({ ...v.vector }));

  let assignments: number[] = new Array(vectors.length).fill(-1);
  let changed = true;
  let iterations = 0;
  const maxIterations = 100;

  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;

    for (let i = 0; i < vectors.length; i++) {
      let minDist = Infinity;
      let closestCluster = 0;
      for (let j = 0; j < centroids.length; j++) {
        const dist = euclideanDistance(vectors[i].vector, centroids[j]);
        if (dist < minDist) {
          minDist = dist;
          closestCluster = j;
        }
      }
      if (assignments[i] !== closestCluster) {
        assignments[i] = closestCluster;
        changed = true;
      }
    }

    const newCentroids = centroids.map(() => {
      const c: { [key: string]: number } = {};
      keys.forEach(k => c[k] = 0);
      return c;
    });
    const counts = new Array(centroids.length).fill(0);

    for (let i = 0; i < vectors.length; i++) {
      const cIdx = assignments[i];
      counts[cIdx]++;
      keys.forEach(k => {
        newCentroids[cIdx][k] += vectors[i].vector[k];
      });
    }

    centroids = newCentroids.map((c, idx) => {
      if (counts[idx] === 0) return centroids[idx];
      const updated: { [key: string]: number } = {};
      keys.forEach(k => updated[k] = c[k] / counts[idx]);
      return updated;
    });
  }

  const recordsMap = new Map(records.map(r => [r.id, r]));
  const finalClusters: Cluster[] = centroids.map((centroidVector, idx) => {
    const clusterRecords = vectors
      .filter((_, vIdx) => assignments[vIdx] === idx)
      .map(v => recordsMap.get(v.id)!);

    const totalAge = clusterRecords.reduce((sum, r) => sum + r.age, 0);
    const averageAge = clusterRecords.length > 0 ? totalAge / clusterRecords.length : 0;

    const genderDistribution = clusterRecords.reduce((acc, r) => {
      acc[r.gender] = (acc[r.gender] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const healthMetrics = clusterRecords.reduce((acc, r) => {
      if (r.disease && r.disease !== 'None') {
        acc[r.disease] = (acc[r.disease] || 0) + 1;
      }
      if (r.vaccinationStatus) {
        acc[r.vaccinationStatus] = (acc[r.vaccinationStatus] || 0) + 1;
      }
      return acc;
    }, {} as { [indicator: string]: number });

    // Calculate Average Lat/Long for the Cluster Centroid visualization
    const validCoords = clusterRecords.filter(r => r.latitude !== undefined && r.longitude !== undefined);
    const centroidLat = validCoords.length > 0 ? validCoords.reduce((sum, r) => sum + (r.latitude || 0), 0) / validCoords.length : 14.5995;
    const centroidLng = validCoords.length > 0 ? validCoords.reduce((sum, r) => sum + (r.longitude || 0), 0) / validCoords.length : 120.9842;

    const clusterVectors = clusterRecords.map(r => recordToVector(r, selectedIndicators));
    const cohesion = clusterVectors.reduce((sum, v) => sum + Math.pow(euclideanDistance(v, centroidVector), 2), 0);

    return {
      id: idx + 1,
      name: `Cluster ${idx + 1}: ${getClusterFocusLabel(healthMetrics, averageAge)}`,
      records: clusterRecords,
      demographics: { averageAge, genderDistribution },
      healthMetrics,
      centroid: { ...centroidVector, latitude: centroidLat, longitude: centroidLng },
      validation: { cohesion, silhouetteScore: 0, separation: 0 }
    };
  });

  // Simplified Evaluation (Silhouette)
  let totalSilhouette = 0;
  let silhouetteCount = 0;
  const maxSamples = 500;
  const sampleIndices = records.length > maxSamples 
    ? Array.from({ length: maxSamples }, () => Math.floor(Math.random() * records.length))
    : Array.from({ length: records.length }, (_, i) => i);

  const sampledVectors = sampleIndices.map(idx => ({
    vector: vectors[idx].vector,
    clusterIdx: assignments[idx]
  }));

  sampledVectors.forEach((vObj, i) => {
    const { vector: v, clusterIdx: iCluster } = vObj;
    const sameCluster = sampledVectors.filter((other, idx) => other.clusterIdx === iCluster && idx !== i);
    if (sameCluster.length === 0) return;

    const a = sameCluster.reduce((sum, other) => sum + euclideanDistance(v, other.vector), 0) / sameCluster.length;
    let b = Infinity;
    for (let cIdx = 0; cIdx < centroids.length; cIdx++) {
      if (cIdx === iCluster) continue;
      const others = sampledVectors.filter(other => other.clusterIdx === cIdx);
      if (others.length === 0) continue;
      const avgDist = others.reduce((sum, other) => sum + euclideanDistance(v, other.vector), 0) / others.length;
      if (avgDist < b) b = avgDist;
    }

    const s = b === Infinity ? 0 : (b - a) / Math.max(a, b);
    totalSilhouette += s;
    silhouetteCount++;
    if (finalClusters[iCluster].validation) finalClusters[iCluster].validation!.silhouetteScore += s;
  });

  finalClusters.forEach((c, idx) => {
      const count = sampledVectors.filter(v => v.clusterIdx === idx).length;
      if (c.validation && count > 0) c.validation.silhouetteScore /= count;
  });

  return {
    clusters: finalClusters,
    globalValidation: {
      avgSilhouetteScore: silhouetteCount > 0 ? totalSilhouette / silhouetteCount : 0,
      totalWCSS: finalClusters.reduce((sum, c) => sum + (c.validation?.cohesion || 0), 0)
    }
  };
}

function getClusterFocusLabel(metrics: Record<string, number>, avgAge: number): string {
  if (avgAge > 60) return "Senior Priority";
  if (avgAge < 18) return "Pediatric Segment";
  const diseases = Object.entries(metrics)
    .filter(([k]) => !['Vaccinated', 'Partially Vaccinated', 'Not Vaccinated'].includes(k))
    .sort((a, b) => b[1] - a[1]);
  if (diseases.length > 0) return `${diseases[0][0]} Risk`;
  return "General Wellness";
}

export function generateStatisticalTrends(clusters: Cluster[]): string {
  if (clusters.length === 0) return "No data available for trend analysis.";
  let report = "LOCAL STATISTICAL TREND REPORT\n==============================\n\n";
  clusters.forEach(cluster => {
    report += `● ${cluster.name} (${cluster.records.length} records)\n`;
    const diseases = Object.entries(cluster.healthMetrics)
      .filter(([k]) => !['Vaccinated', 'Partially Vaccinated', 'Not Vaccinated'].includes(k))
      .sort((a, b) => b[1] - a[1]);
    if (diseases.length > 0) report += `  - Alert: High prevalence of ${diseases[0][0]}.\n`;
    const totalRecords = cluster.records.length || 1;
    const vaccinated = cluster.healthMetrics['Vaccinated'] || 0;
    report += `  - Immunization: ${((vaccinated / totalRecords) * 100).toFixed(1)}% coverage.\n`;
    report += "\n";
  });
  return report;
}
