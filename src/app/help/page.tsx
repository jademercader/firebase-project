'use client';
import AppLayout from '@/components/layout/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function HelpPage() {
  return (
      <AppLayout>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight font-headline">Scope & Limitations</h2>
            </div>
            <p className="text-muted-foreground">
                Understanding what this system can and cannot do.
            </p>
            <div className="grid gap-8 md:grid-cols-2 mt-6">
                <Card className='border-green-500/50'>
                    <CardHeader>
                        <CardTitle className='flex items-center gap-2 font-headline'>
                            <CheckCircle2 className='w-8 h-8 text-green-600' />
                            Scope: What The System Can Do
                        </CardTitle>
                        <CardDescription>
                            This application is designed to provide a complete workflow from data upload to insight generation.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-4 text-sm'>
                       <ul className='space-y-3 list-disc pl-5 text-muted-foreground'>
                            <li>
                                <span className='font-semibold text-foreground'>End-to-End Analysis Workflow:</span> Provides a process from data upload and cleansing to AI-powered analysis, visualization, and reporting.
                            </li>
                            <li>
                                <span className='font-semibold text-foreground'>AI-Powered Clustering:</span> Uses AI to automatically group raw health records into meaningful clusters based on selected health indicators.
                            </li>
                            <li>
                                <span className='font-semibold text-foreground'>Automated Data Quality Checks:</span> The AI can scan uploaded data to flag potential errors like missing values or inconsistencies.
                            </li>
                            <li>
                                <span className='font-semibold text-foreground'>Dynamic Trend Identification:</span> Analyzes cluster data over time to automatically generate a text summary of significant trends and anomalies.
                            </li>
                             <li>
                                <span className='font-semibold text-foreground'>Interactive Data Visualization:</span> Provides charts and metrics that update instantly based on the results of your cluster analysis.
                            </li>
                            <li>
                                <span className='font-semibold text-foreground'>Custom Report Generation:</span> Allows you to generate and print detailed, specific reports for any identified cluster.
                            </li>
                             <li>
                                <span className='font-semibold text-foreground'>Secure Access:</span> Includes a user login and signup system to ensure data is only accessible to authorized users.
                            </li>
                       </ul>
                    </CardContent>
                </Card>
                 <Card className='border-red-500/50'>
                    <CardHeader>
                        <CardTitle className='flex items-center gap-2 font-headline'>
                            <XCircle className='w-8 h-8 text-red-600' />
                            Limitations: What The System Cannot Do
                        </CardTitle>
                        <CardDescription>
                           These are features that are not included in the current version of the prototype.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-4 text-sm'>
                       <ul className='space-y-3 list-disc pl-5 text-muted-foreground'>
                            <li>
                                <span className='font-semibold text-foreground'>Real Data Parsing:</span> The file upload is a prototype. The system uses pre-loaded sample data and does not actually read and parse live CSV or Excel files.
                            </li>
                            <li>
                                <span className='font-semibold text-foreground'>No Choice of Algorithm:</span> You cannot manually select a specific clustering algorithm (like K-Means or DBSCAN); the AI handles the grouping implicitly.
                            </li>
                            <li>
                                <span className='font-semibold text-foreground'>No Real-time Database:</span> The app uses the browser's local storage. Data is not persistent in the cloud or shared between different users or devices.
                            </li>
                            <li>
                                <span className='font-semibold text-foreground'>Limited Map Functionality:</span> The map on the dashboard is a static placeholder image and does not dynamically display cluster locations.
                            </li>
                             <li>
                                <span className='font-semibold text-foreground'>No Administrative Panel:</span> There is no central admin interface to manage users, system-wide settings, or connect different data sources.
                            </li>
                       </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
      </AppLayout>
  );
}
