import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { AuthStateGuard } from '@/components/auth/auth-state-guard';
import AppLayout from '@/components/layout/app-layout';

// Removing metadata export to prevent favicon errors during build
// export const metadata: Metadata = {
//   title: 'Barangay Health Insights',
//   description: 'Cluster Analysis of Barangay Health Records for Improved Public Health Monitoring',
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Barangay Health Insights</title>
        <meta name="description" content="Cluster Analysis of Barangay Health Records for Improved Public Health Monitoring" />
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
