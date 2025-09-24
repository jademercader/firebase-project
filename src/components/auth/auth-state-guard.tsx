'use client';

import { useUser } from '@/firebase/auth/use-user';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const publicPaths = ['/login', '/signup', '/logout'];

export function AuthStateGuard({ children }: { children: ReactNode }) {
  const user = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (user.status === 'loading') {
      return; // Wait for the user status to be determined
    }

    const isPublicPath = publicPaths.includes(pathname);

    if (user.status === 'unauthenticated' && !isPublicPath) {
      router.push('/login');
    } else if (user.status === 'authenticated' && isPublicPath) {
      router.push('/');
    }
  }, [user.status, pathname, router]);

  if (user.status === 'loading') {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="space-y-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
            </div>
      </div>
    );
  }
  
  const isPublicPath = publicPaths.includes(pathname);
  if (user.status === 'unauthenticated' && isPublicPath) {
      return <>{children}</>;
  }

  if (user.status === 'authenticated' && !isPublicPath) {
      return <>{children}</>;
  }

  // This handles the flicker while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
        </div>
  </div>
  );
}
