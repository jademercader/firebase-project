'use server';
/**
 * @fileOverview Performs cluster analysis on Barangay health records.
 *
 * - performClusterAnalysis - A function that handles the cluster analysis process.
 * - PerformClusterAnalysisInput - The input type for the performClusterAnalysis function.
 * - PerformClusterAnalysisOutput - The return type for the performClusterAnalysis function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const PerformClusterAnalysisInputSchema = z.object({
  healthRecordsData: z
    .string()
    .describe('A JSON string of Barangay health records.'),
  healthIndicators: z
    .array(z.string())
    .describe('A list of health indicators to consider for clustering.'),
  numClusters: z
    .number()
    .describe('The desired number of clusters to create.'),
});
export type PerformClusterAnalysisInput = z.infer<typeof PerformClusterAnalysisInputSchema>;


const ClusterSchema = z.object({
    id: z.number(),
    name: z.string(),
    records: z.array(z.any()), // Keeping records flexible for the AI
    demographics: z.object({
        averageAge: z.number(),
        genderDistribution: z.record(z.string(), z.number()),
    }),
    healthMetrics: z.record(z.string(), z.number()),
});

const PerformClusterAnalysisOutputSchema = z.object({
  clusters: z
    .string()
    .describe(
      `A JSON string representing an array of identified clusters. Each cluster object should conform to this structure: ${JSON.stringify(ClusterSchema.shape, null, 2)}`
    ),
});
export type PerformClusterAnalysisOutput = z.infer<typeof PerformClusterAnalysisOutputSchema>;

export async function performClusterAnalysis(input: PerformClusterAnalysisInput): Promise<PerformClusterAnalysisOutput> {
  return performClusterAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'performClusterAnalysisPrompt',
  input: {schema: PerformClusterAnalysisInputSchema},
  output: {schema: PerformClusterAnalysisOutputSchema},
  prompt: `You are a public health data scientist. Your task is to perform a cluster analysis on the provided health records.

Instructions:
1.  Analyze the health records provided in the \`healthRecordsData\` JSON string.
2.  Use the specified \`healthIndicators\` to form distinct clusters.
3.  Create exactly \`numClusters\` clusters.
4.  For each cluster, provide a descriptive name (e.g., 'Elderly with Chronic Illness', 'Young & Healthy').
5.  Calculate the demographics for each cluster: average age and gender distribution.
6.  Calculate the key health metrics for each cluster: count of prevalent diseases and vaccination statuses based on the provided indicators.
7.  The final output must be a single JSON string containing an array of cluster objects. Do not include any other text or explanations.

Health Records Data:
{{{healthRecordsData}}}

Health Indicators for Clustering:
{{#each healthIndicators}}- {{{this}}}{{/each}}

Number of Clusters:
{{{numClusters}}}
`,
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
