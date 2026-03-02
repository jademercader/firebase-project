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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>({
    name: 'Health Admin',
    email: 'admin@barangay.gov'
  });
  const [isLoading, setIsLoading] = useState(false);

  const login = (credentials: any) => {
    // Simplified mock login
    setUser({ name: 'Health Admin', email: 'admin@barangay.gov' });
    return true;
  };

  const signup = (details: any) => {
    setUser({ name: details.name, email: details.email });
    return true;
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      isLoading, 
      login, 
      signup, 
      logout 
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
