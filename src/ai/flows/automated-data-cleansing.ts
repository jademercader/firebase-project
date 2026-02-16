
'use server';
/**
 * @fileOverview An AI agent that identifies and flags potential errors in uploaded Barangay health records.
 *
 * - identifyDataErrors - A function that handles the identification of data errors.
 * - IdentifyDataErrorsInput - The input type for the identifyDataErrors function.
 * - IdentifyDataErrorsOutput - The return type for the identifyDataErrors function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const IdentifyDataErrorsInputSchema = z.object({
  healthRecordsData: z
    .string()
    .describe('The uploaded Barangay health records data in JSON format.'),
});
export type IdentifyDataErrorsInput = z.infer<typeof IdentifyDataErrorsInputSchema>;

const IdentifyDataErrorsOutputSchema = z.object({
  dataErrors: z
    .string()
    .describe(
      'A report identifying potential errors in the uploaded data, such as missing values, format inconsistencies, and outliers.'
    ),
});
export type IdentifyDataErrorsOutput = z.infer<typeof IdentifyDataErrorsOutputSchema>;

export async function identifyDataErrors(input: IdentifyDataErrorsInput): Promise<IdentifyDataErrorsOutput> {
  return identifyDataErrorsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'identifyDataErrorsPrompt',
  input: {schema: IdentifyDataErrorsInputSchema},
  output: {schema: IdentifyDataErrorsOutputSchema},
  model: 'googleai/gemini-1.5-flash',
  prompt: `You are a data quality expert. Review the following Barangay health records data and identify any potential errors, inconsistencies, or missing values. 
  
Your output should be a detailed report of your findings. CRITICAL: Your output must be only the report text, with no conversational text or markdown formatting.

Data:\n{{{healthRecordsData}}}`,
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

const identifyDataErrorsFlow = ai.defineFlow(
  {
    name: 'identifyDataErrorsFlow',
    inputSchema: IdentifyDataErrorsInputSchema,
    outputSchema: IdentifyDataErrorsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
