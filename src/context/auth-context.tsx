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
  updateProfile: (updates: Partial<User>) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_STORAGE_KEY = 'ch_insights_users';
const CURRENT_USER_KEY = 'ch_insights_current_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 1. Initial load of auth state
    const savedUser = localStorage.getItem(CURRENT_USER_KEY);
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem(CURRENT_USER_KEY);
      }
    }
    
    // 2. Strict Session Reset: Clear all health data on full browser load/refresh
    // We only clear if it's NOT a redirect from a fresh upload
    const isJustUploaded = sessionStorage.getItem('just_uploaded');
    if (!isJustUploaded) {
      localStorage.removeItem('health_records');
      localStorage.removeItem('analysis_result');
      localStorage.removeItem('health_clusters');
      localStorage.removeItem('selected_report_cluster_id');
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

  const updateProfile = (updates: Partial<User>) => {
    if (!user) return false;

    const usersRaw = localStorage.getItem(USERS_STORAGE_KEY);
    const users: User[] = usersRaw ? JSON.parse(usersRaw) : [];
    
    const userIndex = users.findIndex(u => u.email === user.email);
    if (userIndex === -1) return false;

    const updatedUser = { ...users[userIndex], ...updates };
    users[userIndex] = updatedUser;
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

    const { password, ...userWithoutPassword } = updatedUser;
    setUser(userWithoutPassword as User);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));
    
    return true;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      isLoading, 
      login, 
      signup, 
      logout,
      updateProfile
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
