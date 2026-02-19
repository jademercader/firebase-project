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
        return { success: false, error: 'Failed to generate statistical trends.' };
    }
}

/**
 * Server action to execute the K-Means clustering algorithm locally.
 * Removed geocoding loop to prevent server action timeouts and "unexpected response" errors.
 */
export async function runClusterAnalysis(input: { healthRecordsData: string, numClusters: number }) {
    try {
        const healthRecords: HealthRecord[] = JSON.parse(input.healthRecordsData);
        
        // Execute local K-Means algorithm (Purely mathematical, no external API calls)
        const analysisResult = performLocalKMeans(healthRecords, input.numClusters);

        return { success: true, data: analysisResult };
    } catch (error: any) {
        return { success: false, error: error.message || 'Analysis failed.' };
    }
}
