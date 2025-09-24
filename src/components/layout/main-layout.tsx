'use client';
import { Toaster } from "@/components/ui/toaster";
import type { ReactNode } from 'react';

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <body className="font-body antialiased" suppressHydrationWarning>
        {children}
        <Toaster />
    </body>
  );
}
