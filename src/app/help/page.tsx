'use client';
import AppLayout from '@/components/layout/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpCircle, BookOpen, MessageCircle, FileText } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function HelpPage() {
  return (
    <AppLayout>
      <div className="max-w-[1400px] mx-auto p-4 md:p-8 pt-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-3">
              <HelpCircle className="w-8 h-8 text-primary" />
              Help & Support Center
            </h2>
            <p className="text-slate-500 font-medium">Find answers to common questions and learn how to use the platform.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-primary/10 shadow-sm hover:bg-primary/5 transition-colors cursor-pointer">
              <CardHeader className="text-center">
                <BookOpen className="w-8 h-8 mx-auto text-primary" />
                <CardTitle className="text-sm mt-2">Documentation</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-primary/10 shadow-sm hover:bg-primary/5 transition-colors cursor-pointer">
              <CardHeader className="text-center">
                <MessageCircle className="w-8 h-8 mx-auto text-primary" />
                <CardTitle className="text-sm mt-2">Contact Support</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-primary/10 shadow-sm hover:bg-primary/5 transition-colors cursor-pointer">
              <CardHeader className="text-center">
                <FileText className="w-8 h-8 mx-auto text-primary" />
                <CardTitle className="text-sm mt-2">Release Notes</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card className="border-primary/10 shadow-sm">
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>Quick answers to common inquiries about health analysis.</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>How do I upload new health records?</AccordionTrigger>
                  <AccordionContent>
                    Navigate to the "Upload Data" menu in the sidebar. Select a CSV file containing your records and click "Save Data for Analysis". The system will automatically map the addresses and redirect you to the dashboard.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>What is K-Means Clustering?</AccordionTrigger>
                  <AccordionContent>
                    K-Means is an algorithm used to group data points based on similarity. In this app, it groups patients based on age, gender, vaccination status, and disease prevalence to identify population hotspots.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>Is my data stored securely?</AccordionTrigger>
                  <AccordionContent>
                    This application uses "Local Persistence" via your browser's LocalStorage. Data never leaves your machine unless you explicitly export a report. This ensures maximum privacy for sensitive health records.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger>How can I export reports?</AccordionTrigger>
                  <AccordionContent>
                    Go to the "Reports" section, select a specific cluster from the analysis, and click "Print Report". You can save the output as a PDF for offline distribution.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
