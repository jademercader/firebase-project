'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/lib/types';


interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: Omit<User, 'name'>) => boolean;
  signup: (details: User) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        localStorage.removeItem('user');
    }
    setIsLoading(false);
  }, []);

  const login = (credentials: Omit<User, 'name'>): boolean => {
    try {
        const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
        const existingUser = storedUsers.find(
            (u: User) => u.email === credentials.email && u.password === credentials.password
        );

        if (existingUser) {
            setUser(existingUser);
            localStorage.setItem('user', JSON.stringify(existingUser));
            router.push('/');
            return true;
        }
        return false;
    } catch (error) {
        console.error("Login failed", error);
        return false;
    }
  };

  const signup = (details: User): boolean => {
     try {
        const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
        const userExists = storedUsers.some((u: User) => u.email === details.email);

        if (userExists) {
            return false; // User already exists
        }

        storedUsers.push(details);
        localStorage.setItem('users', JSON.stringify(storedUsers));
        
        setUser(details);
        localStorage.setItem('user', JSON.stringify(details));
        router.push('/');
        return true;
    } catch (error) {
        console.error("Signup failed", error);
        return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    router.push('/login');
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, signup, logout }}>
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
