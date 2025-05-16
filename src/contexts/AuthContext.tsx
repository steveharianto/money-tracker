'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Session } from '@supabase/supabase-js';
import { getSession, signIn, signOut } from '@/lib/auth';

interface AuthError {
  message: string;
}

type AuthContextType = {
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ 
  children 
}: { 
  children: React.ReactNode;
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkSession = async () => {
      setIsLoading(true);
      try {
        const { session, error } = await getSession();
        
        if (error) {
          console.error('Error checking session:', error);
        }
        
        setSession(session);
        
        // Redirect to login if not authenticated and not already on login page
        if (!session && pathname !== '/login' && pathname !== '/setup') {
          router.push('/login');
        }
        
        // Redirect to dashboard if authenticated and on login page
        if (session && pathname === '/login') {
          router.push('/');
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, [pathname, router]);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await signIn(email, password);
      
      if (error) {
        return { error: { message: error.message || 'Authentication failed' } };
      }
      
      setSession(data.session);
      router.push('/');
      return { error: null };
    } catch (error) {
      console.error('Error signing in:', error);
      return { error: { message: 'An unexpected error occurred' } };
    }
  };

  const logout = async () => {
    try {
      const { error } = await signOut();
      
      if (error) {
        console.error('Error signing out:', error);
        return;
      }
      
      setSession(null);
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    session,
    isLoading,
    isAuthenticated: !!session,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 