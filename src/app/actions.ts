
'use server';
import { performLocalKMeans, generateStatisticalTrends } from '@/lib/analysis-utils';
import type { HealthRecord } from '@/lib/types';

/**
 * Server action to generate statistical trends from cluster data locally.
 */
export async function getTrendAnalysis(input: { clusterData: string }) {
    try {
        const clusters = JSON.parse(input.clusterData);
        const trends = generateStatisticalTrends(clusters);
        return { success: true, data: { trends } };
    } catch (error) {
        return { success: false, error: 'Failed to generate local statistical trends.' };
    }
}

/**
 * Server action to execute the K-Means clustering algorithm locally.
 */
export async function runClusterAnalysis(input: { 
    healthRecordsData: string, 
    numClusters: number,
    selectedIndicators?: string[]
}) {
    try {
        const healthRecords: HealthRecord[] = JSON.parse(input.healthRecordsData);
        
        // Execute pure local mathematical K-Means
        const analysisResult = performLocalKMeans(
            healthRecords, 
            input.numClusters, 
            input.selectedIndicators
        );

        return { success: true, data: analysisResult };
    } catch (error: any) {
        return { success: false, error: error.message || 'Local analysis failed.' };
    }
}
