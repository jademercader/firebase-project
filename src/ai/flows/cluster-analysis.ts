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
    .describe('A JSON string of simplified Barangay health records, each containing at least an `id` and the health indicators to be used for clustering.'),
  healthIndicators: z
    .array(z.string())
    .describe('A list of health indicators to consider for clustering.'),
  numClusters: z
    .number()
    .describe('The desired number of clusters to create.'),
});
export type PerformClusterAnalysisInput = z.infer<typeof PerformClusterAnalysisInputSchema>;

const ClusterResultSchema = z.object({
    clusterName: z.string().describe("A descriptive name for the cluster (e.g., 'Elderly with Chronic Illness', 'Young & Healthy')."),
    recordIds: z.array(z.string()).describe("An array of the 'id' strings from the original records that belong to this cluster.")
});

const PerformClusterAnalysisOutputSchema = z.object({
  clusters: z
    .array(ClusterResultSchema)
    .describe('An array of identified clusters, each containing a name and the IDs of the records within it.'),
});
export type PerformClusterAnalysisOutput = z.infer<typeof PerformClusterAnalysisOutputSchema>;

export async function performClusterAnalysis(input: PerformClusterAnalysisInput): Promise<PerformClusterAnalysisOutput> {
  return performClusterAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'performClusterAnalysisPrompt',
  input: {schema: PerformClusterAnalysisInputSchema},
  output: {schema: PerformClusterAnalysisOutputSchema},
  model: 'googleai/gemini-2.5-pro',
  prompt: `You are a public health data scientist. Your task is to perform a cluster analysis on the provided health records.

Instructions:
1.  Analyze the health records provided in the \`healthRecordsData\` JSON string. Each record in this data has a unique 'id' field.
2.  Use the specified \`healthIndicators\` to group the records into distinct clusters.
3.  Create exactly \`numClusters\` clusters.
4.  For each cluster, provide a descriptive name based on the shared characteristics of its members.
5.  For each cluster, you MUST provide an array of the 'id' strings from the original records that belong to that cluster.
6.  CRITICAL: Your output MUST be a valid JSON object that conforms to the specified output schema. Do not include any other text, explanations, or markdown.

Health Records Data:
{{{healthRecordsData}}}

Health Indicators for Clustering:
{{#each healthIndicators}}- {{{this}}}{{/each}}

Number of Clusters:
{{{numClusters}}}
`,
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
