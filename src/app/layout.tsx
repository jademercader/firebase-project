import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { AuthStateGuard } from '@/components/auth/auth-state-guard';
import AppLayout from '@/components/layout/app-layout';

export const metadata: Metadata = {
  title: 'Barangay Health Insights',
  description: 'Cluster Analysis of Barangay Health Records for Improved Public Health Monitoring',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
        <FirebaseClientProvider>
          <AuthStateGuard>
            <AppLayout>
              {children}
            </AppLayout>
          </AuthStateGuard>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
