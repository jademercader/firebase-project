
'use server';
import { identifyTrends, TrendIdentificationInput } from '@/ai/flows/trend-identification';
import { performClusterAnalysis, PerformClusterAnalysisInput } from '@/ai/flows/cluster-analysis';
import { calculateClusterMetrics } from '@/lib/analysis-utils';
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

export async function getTrendAnalysis(input: TrendIdentificationInput) {
    const validatedInput = TrendIdentificationInputSchema.safeParse(input);
    if (!validatedInput.success) return { success: false, error: 'Invalid input.' };

    try {
        const result = await identifyTrends(validatedInput.data);
        return { success: true, data: result };
    } catch (error) {
        return { success: false, error: 'Failed to get trend analysis.' };
    }
}

export async function runClusterAnalysis(input: PerformClusterAnalysisInput) {
    const validatedInput = PerformClusterAnalysisInputSchema.safeParse(input);
    if (!validatedInput.success) return { success: false, error: 'Invalid input.' };

    try {
        const healthRecords: HealthRecord[] = JSON.parse(validatedInput.data.healthRecordsData);
        
        const aiResult = await performClusterAnalysis({
            healthRecordsData: JSON.stringify(healthRecords.map(({ id, age, gender, disease, vaccinationStatus }) => ({ id, age, gender, disease, vaccinationStatus }))),
            healthIndicators: validatedInput.data.healthIndicators,
            numClusters: validatedInput.data.numClusters
        });
        
        if (!aiResult?.clusters) return { success: false, error: 'AI analysis failed.' };
        
        const analysisResult = calculateClusterMetrics(aiResult.clusters, healthRecords);

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
                        console.warn('Geocoding failed for', record.address);
                    }
                }
            }
        }

        return { success: true, data: analysisResult };
    } catch (error: any) {
        return { success: false, error: error.message || 'Analysis failed.' };
    }
}
