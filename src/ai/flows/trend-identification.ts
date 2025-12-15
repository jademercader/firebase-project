'use server';

/**
 * @fileOverview Identifies significant trends or anomalies in cluster data over time for each cluster.
 *
 * - identifyTrends - A function that handles the trend identification process.
 * - TrendIdentificationInput - The input type for the identifyTrends function.
 * - TrendIdentificationOutput - The return type for the identifyTrends function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const TrendIdentificationInputSchema = z.object({
  clusterData: z.string().describe('The cluster data as a JSON string, including historical data.'),
  healthIndicators: z.string().describe('A comma-separated list of health indicators to analyze.'),
  timePeriod: z.string().describe('The time period over which to analyze trends (e.g., monthly, yearly).'),
});
export type TrendIdentificationInput = z.infer<typeof TrendIdentificationInputSchema>;

const TrendIdentificationOutputSchema = z.object({
  trends: z.string().describe('A summary of the identified trends and anomalies for each cluster.'),
});
export type TrendIdentificationOutput = z.infer<typeof TrendIdentificationOutputSchema>;

export async function identifyTrends(input: TrendIdentificationInput): Promise<TrendIdentificationOutput> {
  return identifyTrendsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'trendIdentificationPrompt',
  input: {schema: TrendIdentificationInputSchema},
  output: {schema: TrendIdentificationOutputSchema},
  model: 'googleai/gemini-1.5-flash-latest',
  prompt: `You are an expert in public health data analysis. Your task is to analyze the provided cluster data over time and identify significant trends and anomalies for each cluster, focusing on the specified health indicators.

Cluster Data: {{{clusterData}}}
Health Indicators: {{{healthIndicators}}}
Time Period: {{{timePeriod}}}

Provide a concise summary of the identified trends and anomalies for each cluster. CRITICAL: Your output must be only the summary text, with no conversational text or markdown formatting.`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
       {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_NONE',
      },
       {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_NONE',
      },
       {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_NONE',
      },
    ],
  },
});

const identifyTrendsFlow = ai.defineFlow(
  {
    name: 'identifyTrendsFlow',
    inputSchema: TrendIdentificationInputSchema,
    outputSchema: TrendIdentificationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
