'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useUser, useAuth as useFirebaseAuth, initiateAnonymousSignIn } from '@/firebase';

interface User {
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: any) => boolean;
  signup: (details: any) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user: firebaseUser, isUserLoading } = useUser();
  const auth = useFirebaseAuth();
  const [user, setUser] = useState<User | null>(null);

  // Automatically sign in anonymously if not logged in to support Firestore writes
  useEffect(() => {
    if (!isUserLoading && !firebaseUser && auth) {
      initiateAnonymousSignIn(auth);
    }
  }, [firebaseUser, isUserLoading, auth]);

  // Bridge Firebase user to the application's user context
  useEffect(() => {
    if (firebaseUser) {
      setUser({
        name: firebaseUser.displayName || 'Health Admin',
        email: firebaseUser.email || 'admin@barangay.gov'
      });
    } else {
      setUser(null);
    }
  }, [firebaseUser]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!firebaseUser, 
      isLoading: isUserLoading, 
      login: () => true, 
      signup: () => true, 
      logout: () => {} 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
