'use client';

import { onAuthStateChanged, type User } from 'firebase/auth';
import { useEffect, useState } from 'react';

import { useAuth } from '@/firebase';

export type UserState =
  | { status: 'loading' }
  | { status: 'authenticated'; user: User }
  | { status: 'unauthenticated'; user: null };

export function useUser(): UserState {
  const [userState, setUserState] = useState<UserState>({ status: 'loading' });
  const auth = useAuth();

  useEffect(() => {
    if (!auth) {
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserState({ status: 'authenticated', user });
      } else {
        setUserState({ status: 'unauthenticated', user: null });
      }
    });

    return () => unsubscribe();
  }, [auth]);

  return userState;
}
