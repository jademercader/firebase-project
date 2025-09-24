'use server';
import { identifyDataErrors, IdentifyDataErrorsInput } from '@/ai/flows/automated-data-cleansing';
import { identifyTrends, TrendIdentificationInput } from '@/ai/flows/trend-identification';
import { performClusterAnalysis, PerformClusterAnalysisInput } from '@/ai/flows/cluster-analysis';
import { z } from 'zod';

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
        const result = await performClusterAnalysis(validatedInput.data);
        // The output from the AI is a string, so we need to parse it.
        const clusters = JSON.parse(result.clusters);
        return { success: true, data: { clusters } };
    } catch (error) {
        console.error(error);
        return { success: false, error: 'Failed to run cluster analysis.' };
    }
}
