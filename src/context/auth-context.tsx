
'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

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

const defaultUser: User = { name: 'Health Admin', email: 'admin@barangay.gov' };

export function AuthProvider({ children }: { children: ReactNode }) {
  // Automatically logged in to bypass login wall completely
  const [user] = useState<User | null>(defaultUser);

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: true, 
      isLoading: false, 
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
