
'use server';
/**
 * @fileOverview Identifies significant trends or anomalies in cluster data.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const TrendIdentificationInputSchema = z.object({
  clusterData: z.string().describe('The cluster data as a JSON string.'),
  healthIndicators: z.string().describe('Health indicators to analyze.'),
  timePeriod: z.string().describe('The time period for analysis.'),
});
export type TrendIdentificationInput = z.infer<typeof TrendIdentificationInputSchema>;

const TrendIdentificationOutputSchema = z.object({
  trends: z.string().describe('A summary of identified trends.'),
});
export type TrendIdentificationOutput = z.infer<typeof TrendIdentificationOutputSchema>;

export async function identifyTrends(input: TrendIdentificationInput): Promise<TrendIdentificationOutput> {
  return identifyTrendsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'trendIdentificationPrompt',
  input: {schema: TrendIdentificationInputSchema},
  output: {schema: TrendIdentificationOutputSchema},
  model: 'googleai/gemini-1.5-flash',
  prompt: `You are an expert in public health data analysis. Analyze the following cluster data and identify trends.

Cluster Data: {{{clusterData}}}
Health Indicators: {{{healthIndicators}}}
Time Period: {{{timePeriod}}}

Provide a concise summary of findings.`,
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
