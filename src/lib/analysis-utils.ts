import type { HealthRecord, Cluster, AnalysisResult } from '@/lib/types';

/**
 * Dynamically normalizes record data based on selected indicators.
 * Handles both numeric and categorical data found in the records.
 */
function recordToVector(record: HealthRecord, indicators: string[]): { [key: string]: number } {
  const vector: { [key: string]: number } = {};
  
  // Mapping for common categorical values
  const categoryMap: Record<string, Record<string, number>> = {
    gender: { 'Male': 0, 'Female': 1, 'Other': 2 },
    vaccinationStatus: { 'Not Vaccinated': 0, 'Partially Vaccinated': 1, 'Vaccinated': 2 },
  };

  indicators.forEach(indicator => {
    const value = record[indicator];
    
    if (indicator === 'age') {
      vector['age'] = (Number(value) || 0) / 100; // Normalized 0-1
    } else if (categoryMap[indicator]) {
      const map = categoryMap[indicator];
      const max = Object.keys(map).length - 1;
      vector[indicator] = (map[String(value)] ?? 0) / (max || 1);
    } else if (typeof value === 'number') {
      // Generic numeric normalization (assuming 0-100 range or similar)
      vector[indicator] = value / 100;
    } else {
      // Binary indicator for specific diseases or presence of strings
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
 * Optimized to handle large datasets and dynamic indicators.
 */
export function performLocalKMeans(
  records: HealthRecord[],
  numClusters: number,
  selectedIndicators: string[] = ['age', 'gender', 'vaccinationStatus']
): AnalysisResult {
  if (records.length === 0) return { clusters: [], globalValidation: { avgSilhouetteScore: 0, totalWCSS: 0 } };

  const vectors = records.map(r => ({ id: r.id, vector: recordToVector(r, selectedIndicators) }));
  const keys = selectedIndicators;

  // 1. Initialize Centroids (Forgy Method)
  // Ensure we don't pick more centroids than available unique records
  const initialCentroidsCount = Math.min(numClusters, records.length);
  let centroids = vectors
    .slice()
    .sort(() => 0.5 - Math.random())
    .slice(0, initialCentroidsCount)
    .map(v => ({ ...v.vector }));

  let assignments: number[] = new Array(vectors.length).fill(-1);
  let changed = true;
  let iterations = 0;
  const maxIterations = 50; // Increased for better convergence on large data

  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;

    // 2. Assignment Step
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

    // 3. Update Step
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

  // 4. Calculate Final Cluster Data
  const recordsMap = new Map(records.map(r => [r.id, r]));
  const finalClusters: Cluster[] = centroids.map((centroid, idx) => {
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

    const clusterVectors = clusterRecords.map(r => recordToVector(r, selectedIndicators));
    const cohesion = clusterVectors.reduce((sum, v) => sum + Math.pow(euclideanDistance(v, centroid), 2), 0);

    return {
      id: idx + 1,
      name: `Cluster ${idx + 1}: ${getClusterFocusLabel(healthMetrics, averageAge)}`,
      records: clusterRecords,
      demographics: { averageAge, genderDistribution },
      healthMetrics,
      centroid,
      validation: { cohesion, silhouetteScore: 0, separation: 0 }
    };
  });

  // 5. Evaluate Effectiveness (Optimized Silhouette Coefficient)
  // For large datasets, we use sampling to prevent O(N^2) hanging
  const maxSamples = 1000;
  const useSampling = records.length > maxSamples;
  const sampleIndices = useSampling 
    ? Array.from({ length: maxSamples }, () => Math.floor(Math.random() * records.length))
    : Array.from({ length: records.length }, (_, i) => i);

  let totalSilhouette = 0;
  let silhouetteCount = 0;

  const sampledVectors = sampleIndices.map(idx => ({
    vector: vectors[idx].vector,
    clusterIdx: assignments[idx]
  }));

  sampledVectors.forEach((vObj, i) => {
    const { vector: v, clusterIdx: iCluster } = vObj;
    
    // a(i): avg dist to same cluster
    const sameClusterIndices = sampledVectors
      .map((other, idx) => other.clusterIdx === iCluster ? idx : -1)
      .filter(idx => idx !== -1);
      
    if (sameClusterIndices.length <= 1) return;

    const a = sameClusterIndices.reduce((sum, idx) => sum + euclideanDistance(v, sampledVectors[idx].vector), 0) / (sameClusterIndices.length - 1);

    // b(i): avg dist to nearest other cluster
    let b = Infinity;
    for (let clusterIdx = 0; clusterIdx < centroids.length; clusterIdx++) {
      if (clusterIdx === iCluster) continue;
      
      const otherClusterVectors = sampledVectors.filter(other => other.clusterIdx === clusterIdx);
      if (otherClusterVectors.length === 0) continue;
      
      const avgDist = otherClusterVectors.reduce((sum, other) => sum + euclideanDistance(v, other.vector), 0) / otherClusterVectors.length;
      if (avgDist < b) b = avgDist;
    }

    const s = b === Infinity ? 0 : (b - a) / Math.max(a, b);
    totalSilhouette += s;
    silhouetteCount++;
    
    // Assign to individual cluster scores (rough estimate based on samples)
    if (finalClusters[iCluster].validation) {
        finalClusters[iCluster].validation!.silhouetteScore += s;
    }
  });

  // Finalize individual silhouette scores
  finalClusters.forEach((c, idx) => {
      const clusterSampleCount = sampledVectors.filter(v => v.clusterIdx === idx).length;
      if (c.validation && clusterSampleCount > 0) {
          c.validation.silhouetteScore /= clusterSampleCount;
      }
  });

  const totalWCSS = finalClusters.reduce((sum, c) => sum + (c.validation?.cohesion || 0), 0);

  return {
    clusters: finalClusters,
    globalValidation: {
      avgSilhouetteScore: silhouetteCount > 0 ? totalSilhouette / silhouetteCount : 0,
      totalWCSS
    }
  };
}

function getClusterFocusLabel(metrics: Record<string, number>, avgAge: number): string {
  if (avgAge > 60) return "Senior Vulnerability Group";
  if (avgAge < 18) return "Pediatric Priority";
  
  const diseases = Object.entries(metrics)
    .filter(([k]) => !['Vaccinated', 'Partially Vaccinated', 'Not Vaccinated'].includes(k))
    .sort((a, b) => b[1] - a[1]);

  if (diseases.length > 0) return `${diseases[0][0]} Alert Segment`;
  return "General Public Health";
}

/**
 * Performs a rule-based statistical trend analysis locally.
 */
export function generateStatisticalTrends(clusters: Cluster[]): string {
  if (clusters.length === 0) return "No data available for trend analysis.";

  let report = "LOCAL STATISTICAL TREND REPORT\n";
  report += "==============================\n\n";

  clusters.forEach(cluster => {
    report += `● ${cluster.name}\n`;
    report += `  - Segment Size: ${cluster.records.length} records\n`;
    
    const diseases = Object.entries(cluster.healthMetrics)
      .filter(([k]) => !['Vaccinated', 'Partially Vaccinated', 'Not Vaccinated'].includes(k))
      .sort((a, b) => b[1] - a[1]);
    
    if (diseases.length > 0) {
      const top = diseases[0];
      const prevalence = ((top[1] / cluster.records.length) * 100).toFixed(1);
      report += `  - Alert: High prevalence of ${top[0]} (${prevalence}%).\n`;
    }

    const vaccinated = cluster.healthMetrics['Vaccinated'] || 0;
    const vaxRate = ((vaccinated / cluster.records.length) * 100).toFixed(1);
    report += `  - Immunization: Coverage at ${vaxRate}%.\n`;

    if (cluster.validation) {
      const q = cluster.validation.silhouetteScore;
      const rating = q > 0.5 ? "High Cohesion" : q > 0.2 ? "Moderate" : "Weak Separation";
      report += `  - Evaluation: ${rating} (Silhouette: ${q.toFixed(3)})\n`;
    }
    report += "\n";
  });

  return report;
}
