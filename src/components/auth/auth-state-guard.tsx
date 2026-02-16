'use client';

import { type ReactNode } from 'react';

/**
 * Simplified AuthStateGuard that simply renders children.
 * The authentication requirement has been removed.
 */
export function AuthStateGuard({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
