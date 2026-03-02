'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password?: string }) => boolean;
  signup: (details: User) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_STORAGE_KEY = 'bh_insights_users';
const CURRENT_USER_KEY = 'bh_insights_current_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Initial load of auth state from local storage only
    const savedUser = localStorage.getItem(CURRENT_USER_KEY);
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem(CURRENT_USER_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = (credentials: { email: string; password?: string }) => {
    const usersRaw = localStorage.getItem(USERS_STORAGE_KEY);
    const users: User[] = usersRaw ? JSON.parse(usersRaw) : [];
    
    const foundUser = users.find(u => u.email === credentials.email && u.password === credentials.password);
    
    if (foundUser) {
      const { password, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword as User);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));
      router.push('/');
      return true;
    }
    return false;
  };

  const signup = (details: User) => {
    const usersRaw = localStorage.getItem(USERS_STORAGE_KEY);
    const users: User[] = usersRaw ? JSON.parse(usersRaw) : [];
    
    if (users.some(u => u.email === details.email)) {
      return false;
    }

    users.push(details);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    
    const { password, ...userWithoutPassword } = details;
    setUser(userWithoutPassword as User);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));
    router.push('/');
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(CURRENT_USER_KEY);
    router.push('/login');
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
