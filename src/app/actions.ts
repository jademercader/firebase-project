'use server';
import { performLocalKMeans, generateStatisticalTrends } from '@/lib/analysis-utils';
import type { HealthRecord } from '@/lib/types';

/**
 * Server action to generate statistical trends from cluster data locally.
 * Removed all AI dependencies.
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
 * Objective 2: Implementation of mathematical grouping.
 */
export async function runClusterAnalysis(input: { healthRecordsData: string, numClusters: number }) {
    try {
        const healthRecords: HealthRecord[] = JSON.parse(input.healthRecordsData);
        
        // Execute pure local mathematical K-Means (No AI, No external API)
        const analysisResult = performLocalKMeans(healthRecords, input.numClusters);

        return { success: true, data: analysisResult };
    } catch (error: any) {
        return { success: false, error: error.message || 'Local analysis failed.' };
    }
}
