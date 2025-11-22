'use server';
import { identifyDataErrors, IdentifyDataErrorsInput } from '@/ai/flows/automated-data-cleansing';
import { identifyTrends, TrendIdentificationInput } from '@/ai/flows/trend-identification';
import { performClusterAnalysis, PerformClusterAnalysisInput } from '@/ai/flows/cluster-analysis';
import { calculateClusterMetrics } from '@/lib/analysis-utils';
import { z } from 'zod';
import type { HealthRecord } from '@/lib/types';

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
        // The raw health records are needed for calculations.
        // Parse the records ONCE to ensure data consistency.
        const healthRecords: HealthRecord[] = JSON.parse(validatedInput.data.healthRecordsData);

        // The AI's job is simplified: it just returns clusters with record IDs.
        // Pass the same data to the AI that we will use for enrichment.
        const result = await performClusterAnalysis({
            ...validatedInput.data,
            healthRecordsData: JSON.stringify(healthRecords) // Ensure the AI gets the parsed data
        });
        
        if (!result || !result.clusters) {
             return { success: false, error: 'AI did not return valid cluster data.' };
        }
        
        // We perform the detailed calculations in our own code for reliability.
        // Use the SAME parsed `healthRecords` array for the calculations.
        const detailedClusters = calculateClusterMetrics(result.clusters, healthRecords);

        return { success: true, data: { clusters: detailedClusters } };
    } catch (error: any) {
        console.error('Error in runClusterAnalysis:', error);
        return { success: false, error: error.message || 'Failed to run cluster analysis.' };
    }
}
