'use server';
import { identifyDataErrors, IdentifyDataErrorsInput } from '@/ai/flows/automated-data-cleansing';
import { identifyTrends, TrendIdentificationInput } from '@/ai/flows/trend-identification';
import { performClusterAnalysis, PerformClusterAnalysisInput } from '@/ai/flows/cluster-analysis';
import { calculateClusterMetrics } from '@/lib/analysis-utils';
import { z } from 'zod';
import type { HealthRecord } from '@/lib/types';
import { geocodeAddress } from '@/services/geocoding-service';

const IdentifyDataErrorsInputSchema = z.object({
  healthRecordsData: z.string(),
});

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

export async function getCleansingSuggestions(input: IdentifyDataErrorsInput) {
    const validatedInput = IdentifyDataErrorsInputSchema.safeParse(input);
    if (!validatedInput.success) {
        return { success: false, error: 'Invalid input.' };
    }

    try {
        const result = await identifyDataErrors(validatedInput.data);
        return { success: true, data: result };
    } catch (error) {
        console.error(error);
        return { success: false, error: 'Failed to get cleansing suggestions.' };
    }
}

export async function getTrendAnalysis(input: TrendIdentificationInput) {
    const validatedInput = TrendIdentificationInputSchema.safeParse(input);
    if (!validatedInput.success) {
        return { success: false, error: 'Invalid input.' };
    }

    try {
        const result = await identifyTrends(validatedInput.data);
        return { success: true, data: result };
    } catch (error) {
        console.error(error);
        return { success: false, error: 'Failed to get trend analysis.' };
    }
}

export async function runClusterAnalysis(input: PerformClusterAnalysisInput) {
    const validatedInput = PerformClusterAnalysisInputSchema.safeParse(input);
    if (!validatedInput.success) {
        return { success: false, error: 'Invalid input.' };
    }

    try {
        const healthRecords: HealthRecord[] = JSON.parse(validatedInput.data.healthRecordsData);
        
        const aiResult = await performClusterAnalysis({
            healthRecordsData: JSON.stringify(healthRecords.map(({ id, age, gender, disease, vaccinationStatus }) => ({ id, age, gender, disease, vaccinationStatus }))),
            healthIndicators: validatedInput.data.healthIndicators,
            numClusters: validatedInput.data.numClusters
        });
        
        if (!aiResult || !aiResult.clusters) {
             return { success: false, error: 'AI did not return valid cluster data.' };
        }
        
        let detailedClusters = calculateClusterMetrics(aiResult.clusters, healthRecords);

        // --- Geocoding Step ---
        for (const cluster of detailedClusters) {
            for (const record of cluster.records) {
                if (record.address && (!record.latitude || !record.longitude)) {
                    try {
                        const coords = await geocodeAddress(record.address);
                        if (coords) {
                            record.latitude = coords.lat;
                            record.longitude = coords.lng;
                        }
                    } catch (error: any) {
                        // If geocoding fails due to a critical error (like a bad API key), stop and return the error.
                         return { success: false, error: `Geocoding failed: ${error.message}` };
                    }
                }
            }
        }

        return { success: true, data: { clusters: detailedClusters } };
    } catch (error: any) {
        console.error('Error in runClusterAnalysis:', error);
        return { success: false, error: error.message || 'Failed to run cluster analysis.' };
    }
}
