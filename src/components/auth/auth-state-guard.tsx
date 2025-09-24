'use client';

import { useEffect, type ReactNode } from 'react';
import { useAuth } from '@/context/auth-context';
import { usePathname, useRouter } from 'next/navigation';
import { Skeleton } from '../ui/skeleton';

const publicPaths = ['/login', '/signup'];

export function AuthStateGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      const isPublic = publicPaths.includes(pathname);
      if (!isAuthenticated && !isPublic) {
        router.replace('/login');
      }
      if (isAuthenticated && isPublic) {
        router.replace('/');
      }
    }
  }, [isAuthenticated, isLoading, router, pathname]);

  if (isLoading || (!isAuthenticated && !publicPaths.includes(pathname))) {
    return (
        <div className="flex flex-col h-screen">
            <header className="sticky top-0 z-10 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex h-14 items-center px-4 md:px-8 border-b">
                    <Skeleton className='w-32 h-8' />
                    <div className="flex flex-1 items-center justify-end space-x-4">
                        <Skeleton className='w-9 h-9 rounded-full' />
                    </div>
                </div>
            </header>
            <div className="flex flex-1">
                <aside className='hidden md:block border-r p-2'>
                    <Skeleton className='w-56 h-full' />
                </aside>
                <main className='flex-1 p-8'>
                    <Skeleton className='w-full h-full' />
                </main>
            </div>
      </div>
    );
  }

  return <>{children}</>;
}
