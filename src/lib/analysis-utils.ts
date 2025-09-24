import type { HealthRecord, Cluster } from '@/lib/types';

// This is the simplified structure returned by the AI
type AiClusterResult = {
  clusterName: string;
  recordIds: string[];
};

/**
 * Calculates detailed metrics for clusters based on AI's grouping of record IDs.
 * @param aiClusters - The simplified cluster data from the AI.
 * @param allRecords - The complete list of health records.
 * @returns An array of fully-formed Cluster objects with calculated metrics.
 */
export function calculateClusterMetrics(
  aiClusters: AiClusterResult[],
  allRecords: HealthRecord[]
): Cluster[] {
  const recordsMap = new Map(allRecords.map(record => [record.id, record]));

  const detailedClusters: Cluster[] = aiClusters.map((aiCluster, index) => {
    const clusterRecords: HealthRecord[] = [];
    aiCluster.recordIds.forEach(id => {
      const record = recordsMap.get(id);
      if (record) {
        clusterRecords.push(record);
      }
    });

    // --- Demographics Calculation ---
    const totalAge = clusterRecords.reduce((sum, record) => sum + record.age, 0);
    const averageAge = clusterRecords.length > 0 ? totalAge / clusterRecords.length : 0;

    const genderDistribution = clusterRecords.reduce((acc, record) => {
      acc[record.gender] = (acc[record.gender] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    // --- Health Metrics Calculation ---
    const healthMetrics = clusterRecords.reduce((acc, record) => {
      // Count diseases
      if (record.disease && record.disease !== 'None') {
        acc[record.disease] = (acc[record.disease] || 0) + 1;
      }
      // Count vaccination statuses
      if (record.vaccinationStatus) {
        acc[record.vaccinationStatus] = (acc[record.vaccinationStatus] || 0) + 1;
      }
      return acc;
    }, {} as { [indicator: string]: number });

    return {
      id: index + 1,
      name: aiCluster.clusterName,
      records: clusterRecords,
      demographics: {
        averageAge,
        genderDistribution,
      },
      healthMetrics,
    };
  });

  return detailedClusters;
}
