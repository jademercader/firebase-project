import type { HealthRecord, Cluster, AnalysisResult } from '@/lib/types';

/**
 * Normalizes categorical data to numeric values for distance calculation.
 */
function recordToVector(record: HealthRecord): { [key: string]: number } {
  const genderMap: Record<string, number> = { 'Male': 0, 'Female': 1, 'Other': 2 };
  const vaxMap: Record<string, number> = { 'Not Vaccinated': 0, 'Partially Vaccinated': 1, 'Vaccinated': 2 };

  return {
    age: record.age / 100, // Normalized
    gender: genderMap[record.gender] || 0,
    vaccination: vaxMap[record.vaccinationStatus] || 0,
  };
}

/**
 * Calculates Euclidean distance between two vectors.
 */
function euclideanDistance(v1: { [key: string]: number }, v2: { [key: string]: number }): number {
  let sum = 0;
  for (const key in v1) {
    sum += Math.pow((v1[key] || 0) - (v2[key] || 0), 2);
  }
  return Math.sqrt(sum);
}

/**
 * Performs K-Means clustering locally.
 */
export function performLocalKMeans(
  records: HealthRecord[],
  numClusters: number
): AnalysisResult {
  if (records.length === 0) return { clusters: [], globalValidation: { avgSilhouetteScore: 0, totalWCSS: 0 } };

  const vectors = records.map(r => ({ id: r.id, vector: recordToVector(r) }));
  const keys = Object.keys(vectors[0].vector);

  // 1. Initialize Centroids (Randomly select points)
  let centroids = vectors
    .sort(() => 0.5 - Math.random())
    .slice(0, numClusters)
    .map(v => ({ ...v.vector }));

  let assignments: number[] = new Array(vectors.length).fill(-1);
  let changed = true;
  let iterations = 0;
  const maxIterations = 20;

  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;

    // 2. Assignment Step
    vectors.forEach((v, idx) => {
      let minDist = Infinity;
      let closestCluster = 0;
      centroids.forEach((c, cIdx) => {
        const dist = euclideanDistance(v.vector, c);
        if (dist < minDist) {
          minDist = dist;
          closestCluster = cIdx;
        }
      });
      if (assignments[idx] !== closestCluster) {
        assignments[idx] = closestCluster;
        changed = true;
      }
    });

    // 3. Update Step
    const newCentroids = centroids.map(() => {
      const c: { [key: string]: number } = {};
      keys.forEach(k => c[k] = 0);
      return c;
    });
    const counts = new Array(numClusters).fill(0);

    vectors.forEach((v, idx) => {
      const cIdx = assignments[idx];
      counts[cIdx]++;
      keys.forEach(k => {
        newCentroids[cIdx][k] += v.vector[k];
      });
    });

    centroids = newCentroids.map((c, idx) => {
      if (counts[idx] === 0) return c;
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

    // Cohesion (WCSS)
    const clusterVectors = clusterRecords.map(recordToVector);
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

  // Calculate Silhouette Scores
  let totalSilhouette = 0;
  let validRecordsCount = 0;

  finalClusters.forEach((cluster, i) => {
    const clusterVectors = cluster.records.map(recordToVector);
    let clusterSilhouetteSum = 0;

    clusterVectors.forEach((v) => {
      const internalDistances = clusterVectors.map(otherV => euclideanDistance(v, otherV));
      const a = internalDistances.reduce((s, d) => s + d, 0) / (clusterVectors.length || 1);

      let b = Infinity;
      finalClusters.forEach((otherCluster, j) => {
        if (i === j) return;
        const otherVectors = otherCluster.records.map(recordToVector);
        if (otherVectors.length === 0) return;
        const avgDistToOtherCluster = otherVectors.reduce((s, otherV) => s + euclideanDistance(v, otherV), 0) / otherVectors.length;
        if (avgDistToOtherCluster < b) b = avgDistToOtherCluster;
      });

      const s = (b === Infinity) ? 0 : (b - a) / Math.max(a, b);
      clusterSilhouetteSum += s;
      totalSilhouette += s;
      validRecordsCount++;
    });

    if (cluster.validation) {
      cluster.validation.silhouetteScore = clusterSilhouetteSum / (clusterVectors.length || 1);
    }
  });

  const totalWCSS = finalClusters.reduce((sum, c) => sum + (c.validation?.cohesion || 0), 0);

  return {
    clusters: finalClusters,
    globalValidation: {
      avgSilhouetteScore: validRecordsCount > 0 ? totalSilhouette / validRecordsCount : 0,
      totalWCSS
    }
  };
}

function getClusterFocusLabel(metrics: Record<string, number>, avgAge: number): string {
  if (avgAge > 60) return "Senior High-Risk Group";
  if (avgAge < 18) return "Pediatric Priority";
  
  const diseases = Object.entries(metrics)
    .filter(([k]) => !['Vaccinated', 'Partially Vaccinated', 'Not Vaccinated'].includes(k))
    .sort((a, b) => b[1] - a[1]);

  if (diseases.length > 0) return `${diseases[0][0]} Affected Segment`;
  return "General Health Segment";
}

/**
 * Performs a rule-based statistical trend analysis.
 */
export function generateStatisticalTrends(clusters: Cluster[]): string {
  if (clusters.length === 0) return "No data available for trend analysis.";

  let report = "Statistical Trend Analysis Report:\n\n";

  clusters.forEach(cluster => {
    report += `- ${cluster.name}:\n`;
    
    // Population Size
    report += `  * Population: ${cluster.records.length} individuals.\n`;
    
    // Disease Insights
    const diseases = Object.entries(cluster.healthMetrics)
      .filter(([k]) => !['Vaccinated', 'Partially Vaccinated', 'Not Vaccinated'].includes(k))
      .sort((a, b) => b[1] - a[1]);
    
    if (diseases.length > 0) {
      const top = diseases[0];
      const percent = ((top[1] / cluster.records.length) * 100).toFixed(1);
      report += `  * Health Alert: ${top[0]} prevalence is at ${percent}% in this segment.\n`;
    }

    // Vaccination Status
    const vaccinated = cluster.healthMetrics['Vaccinated'] || 0;
    const vaxRate = ((vaccinated / cluster.records.length) * 100).toFixed(1);
    report += `  * Vaccination: Current immunization coverage is ${vaxRate}%.\n`;

    // Silhouette/Quality
    if (cluster.validation) {
      const quality = cluster.validation.silhouetteScore > 0.5 ? "High" : cluster.validation.silhouetteScore > 0.2 ? "Moderate" : "Low";
      report += `  * Statistical Quality: ${quality} (Score: ${cluster.validation.silhouetteScore.toFixed(2)})\n`;
    }
    report += "\n";
  });

  return report;
}
