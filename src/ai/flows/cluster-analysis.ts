
'use server';
/**
 * @fileOverview Performs K-Means based cluster analysis on Barangay health records.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const PerformClusterAnalysisInputSchema = z.object({
  healthRecordsData: z
    .string()
    .describe('A JSON string of simplified Barangay health records.'),
  healthIndicators: z
    .array(z.string())
    .describe('A list of health indicators to consider for clustering.'),
  numClusters: z
    .number()
    .describe('The desired number of clusters to create.'),
});
export type PerformClusterAnalysisInput = z.infer<typeof PerformClusterAnalysisInputSchema>;

const ClusterResultSchema = z.object({
    clusterName: z.string().describe("A descriptive name for the cluster."),
    recordIds: z.array(z.string()).describe("An array of the 'id' strings.")
});

const PerformClusterAnalysisOutputSchema = z.object({
  clusters: z
    .array(ClusterResultSchema)
    .describe('An array of identified clusters.'),
});
export type PerformClusterAnalysisOutput = z.infer<typeof PerformClusterAnalysisOutputSchema>;

export async function performClusterAnalysis(input: PerformClusterAnalysisInput): Promise<PerformClusterAnalysisOutput> {
  return performClusterAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'performClusterAnalysisPrompt',
  input: {schema: PerformClusterAnalysisInputSchema},
  output: {schema: PerformClusterAnalysisOutputSchema},
  model: 'googleai/gemini-1.5-flash',
  prompt: `You are a public health data scientist. Perform population grouping analysis consistent with the K-Means clustering algorithm.

Health Records Data:
{{{healthRecordsData}}}

Health Indicators:
{{#each healthIndicators}}- {{{this}}}{{/each}}

Number of Clusters:
{{{numClusters}}}`,
});

const performClusterAnalysisFlow = ai.defineFlow(
  {
    name: 'performClusterAnalysisFlow',
    inputSchema: PerformClusterAnalysisInputSchema,
    outputSchema: PerformClusterAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
