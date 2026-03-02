'use client';
import AppLayout from '@/components/layout/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings as SettingsIcon, Bell, Shield, Database, Layout } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function SettingsPage() {
  return (
    <AppLayout>
      <div className="max-w-[1400px] mx-auto p-4 md:p-8 pt-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-3">
              <SettingsIcon className="w-8 h-8 text-primary" />
              Application Settings
            </h2>
            <p className="text-slate-500 font-medium">Configure how the Barangay Health Intelligence platform behaves.</p>
          </div>

          <div className="space-y-6">
            <Card className="border-primary/10 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  <CardTitle>Notifications</CardTitle>
                </div>
                <CardDescription>Manage how you receive updates and alerts.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Cluster Alerts</Label>
                    <p className="text-xs text-muted-foreground">Notify when high-risk clusters are detected.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Report Completions</Label>
                    <p className="text-xs text-muted-foreground">Notify when a generated report is ready for download.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/10 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-primary" />
                  <CardTitle>Data Management</CardTitle>
                </div>
                <CardDescription>Control local data persistence and analysis behavior.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Local Persistence</Label>
                    <p className="text-xs text-muted-foreground">Keep data stored in the browser after logout.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-Redirect</Label>
                    <p className="text-xs text-muted-foreground">Automatically navigate to dashboard after data upload.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/10 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <CardTitle>Security & Privacy</CardTitle>
                </div>
                <CardDescription>Manage your data privacy settings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Anonymize Data</Label>
                    <p className="text-xs text-muted-foreground">Mask patient names in generated reports.</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
