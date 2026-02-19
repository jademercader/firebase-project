
'use server';
import { performLocalKMeans, generateStatisticalTrends } from '@/lib/analysis-utils';
import { z } from 'zod';
import type { HealthRecord } from '@/lib/types';
import { geocodeAddress } from '@/services/geocoding-service';

const TrendIdentificationInputSchema = z.object({
    clusterData: z.string(),
    healthIndicators: z.string(),
    timePeriod: z.string(),
});

const PerformClusterAnalysisInputSchema = z.object({
    healthRecordsData: z.string(),
    healthIndicators: z.array(z.string()),
    numClusters: z.number(),
});

export async function getTrendAnalysis(input: { clusterData: string }) {
    try {
        const clusters = JSON.parse(input.clusterData);
        const trends = generateStatisticalTrends(clusters);
        return { success: true, data: { trends } };
    } catch (error) {
        return { success: false, error: 'Failed to generate statistical trends.' };
    }
}

export async function runClusterAnalysis(input: { healthRecordsData: string, numClusters: number }) {
    try {
        const healthRecords: HealthRecord[] = JSON.parse(input.healthRecordsData);
        
        // Execute local K-Means algorithm
        const analysisResult = performLocalKMeans(healthRecords, input.numClusters);

        // Optional: Geocode addresses for the map
        for (const cluster of analysisResult.clusters) {
            for (const record of cluster.records) {
                if (record.address && (!record.latitude || !record.longitude)) {
                    try {
                        const coords = await geocodeAddress(record.address);
                        if (coords) {
                            record.latitude = coords.lat;
                            record.longitude = coords.lng;
                        }
                    } catch (e) {
                        // Silent fail for geocoding
                    }
                }
            }
        }

        return { success: true, data: analysisResult };
    } catch (error: any) {
        return { success: false, error: error.message || 'Analysis failed.' };
    }
}
