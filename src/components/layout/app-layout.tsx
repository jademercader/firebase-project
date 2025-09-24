'use client';
import type { ReactNode } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Header } from '@/components/layout/header';
import dynamic from 'next/dynamic';
import { AuthStateGuard } from '../auth/auth-state-guard';

const AppSidebar = dynamic(() => import('@/components/layout/app-sidebar').then(mod => mod.AppSidebar), {
  ssr: false,
});

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthStateGuard>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <Header />
          <main>{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </AuthStateGuard>
  );
}
