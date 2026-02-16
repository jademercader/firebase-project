import type { HealthRecord, Cluster, ValidationMetrics, AnalysisResult } from '@/lib/types';

// Simplified structure returned by the AI
type AiClusterResult = {
  clusterName: string;
  recordIds: string[];
};

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
    // Note: Disease could be one-hot encoded but kept simple for this MVP
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
 * Calculates detailed metrics and validation for clusters.
 */
export function calculateClusterMetrics(
  aiClusters: AiClusterResult[],
  allRecords: HealthRecord[]
): AnalysisResult {
  const recordsMap = new Map(allRecords.map(record => [record.id, record]));

  const detailedClusters: Cluster[] = aiClusters.map((aiCluster, index) => {
    const clusterRecords: HealthRecord[] = [];
    aiCluster.recordIds.forEach(id => {
      const record = recordsMap.get(id);
      if (record) clusterRecords.push(record);
    });

    // --- Demographics ---
    const totalAge = clusterRecords.reduce((sum, record) => sum + record.age, 0);
    const averageAge = clusterRecords.length > 0 ? totalAge / clusterRecords.length : 0;

    const genderDistribution = clusterRecords.reduce((acc, record) => {
      acc[record.gender] = (acc[record.gender] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    // --- Health Metrics ---
    const healthMetrics = clusterRecords.reduce((acc, record) => {
      if (record.disease && record.disease !== 'None') {
        acc[record.disease] = (acc[record.disease] || 0) + 1;
      }
      if (record.vaccinationStatus) {
        acc[record.vaccinationStatus] = (acc[record.vaccinationStatus] || 0) + 1;
      }
      return acc;
    }, {} as { [indicator: string]: number });

    // --- Centroid Calculation ---
    const vectors = clusterRecords.map(recordToVector);
    const centroid: { [key: string]: number } = {};
    if (vectors.length > 0) {
      const keys = Object.keys(vectors[0]);
      keys.forEach(key => {
        centroid[key] = vectors.reduce((sum, v) => sum + v[key], 0) / vectors.length;
      });
    }

    // --- Cohesion (WCSS) ---
    const cohesion = vectors.reduce((sum, v) => sum + Math.pow(euclideanDistance(v, centroid), 2), 0);

    return {
      id: index + 1,
      name: aiCluster.clusterName,
      records: clusterRecords,
      demographics: { averageAge, genderDistribution },
      healthMetrics,
      centroid,
      validation: { cohesion, silhouetteScore: 0, separation: 0 }
    };
  });

  // --- Silhouette Score Calculation ---
  let totalSilhouette = 0;
  let validRecordsCount = 0;

  detailedClusters.forEach((cluster, i) => {
    const vectors = cluster.records.map(recordToVector);
    let clusterSilhouetteSum = 0;

    vectors.forEach((v) => {
      // a(i): average distance to points in same cluster
      const internalDistances = vectors.map(otherV => euclideanDistance(v, otherV));
      const a = internalDistances.reduce((s, d) => s + d, 0) / (vectors.length || 1);

      // b(i): min average distance to points in any other cluster
      let b = Infinity;
      detailedClusters.forEach((otherCluster, j) => {
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
      cluster.validation.silhouetteScore = clusterSilhouetteSum / (vectors.length || 1);
    }
  });

  const totalWCSS = detailedClusters.reduce((sum, c) => sum + (c.validation?.cohesion || 0), 0);

  return {
    clusters: detailedClusters,
    globalValidation: {
      avgSilhouetteScore: validRecordsCount > 0 ? totalSilhouette / validRecordsCount : 0,
      totalWCSS
    }
  };
}
