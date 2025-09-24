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
    .describe('The uploaded Barangay health records data in CSV or XLSX format.'),
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
  prompt: `You are a data quality expert. Review the following Barangay health records data and identify any potential errors, inconsistencies, or missing values. Provide a detailed report of your findings.

Data:\n{{{healthRecordsData}}}`, 
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
