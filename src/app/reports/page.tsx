'use client';
import { ReportGenerator } from '@/components/reports/report-generator';

export default function ReportsPage() {
  return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight font-headline">Custom Reports</h2>
        </div>
        <p className="text-muted-foreground">
            Generate detailed reports for selected clusters including demographics and statistical analysis.
        </p>
        <div className="mt-6">
          <ReportGenerator />
        </div>
      </div>
  );
}
