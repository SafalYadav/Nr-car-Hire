'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/db/supabase';
import {
  getUserProfile,
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signOutUser,
  type UserProfile,
} from '@/lib/auth/supabase-auth';
import { isEmailAdmin } from '@/lib/auth/rbac';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  signIn: typeof signInWithEmail;
  signUp: typeof signUpWithEmail;
  signInWithGoogle: typeof signInWithGoogle;
  signOut: () => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (currentUser: User) => {
    if (!currentUser?.id) {
      setProfile(null);
      return;
    }

    try {
      const p = await getUserProfile(currentUser.id);
      if (p) {
        setProfile({
          ...p,
          role: isEmailAdmin(currentUser.email) ? 'ADMIN' : p.role,
        });
      } else {
        // Fallback to user metadata
        setProfile({
          id: currentUser.id,
          email: currentUser.email || '',
          firstName: currentUser.user_metadata?.first_name || '',
          lastName: currentUser.user_metadata?.last_name || '',
          phone: currentUser.user_metadata?.phone || '',
          role:
            currentUser.user_metadata?.role === 'ADMIN' || isEmailAdmin(currentUser.email)
              ? 'ADMIN'
              : 'CUSTOMER',
          createdAt: currentUser.created_at,
        });
      }
    } catch {
      // Graceful fallback
      setProfile({
        id: currentUser.id,
        email: currentUser.email || '',
        firstName: '',
        lastName: '',
        role: isEmailAdmin(currentUser.email) ? 'ADMIN' : 'CUSTOMER',
        createdAt: currentUser.created_at,
      });
    }
  };

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const { data } = await supabase.auth.getSession();
        if (mounted) {
          setSession(data.session);
          setUser(data.session?.user || null);
          if (data.session?.user) {
            await fetchProfile(data.session.user);
          }
        }
      } catch (err) {
        console.warn('Supabase auth session initialisation warning:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setUser(newSession?.user || null);
      if (newSession?.user) {
        await fetchProfile(newSession.user);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    const res = await signOutUser();
    setUser(null);
    setSession(null);
    setProfile(null);
    return res;
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user);
    }
  };

  const isAdmin =
    profile?.role === 'ADMIN' ||
    user?.user_metadata?.role === 'ADMIN' ||
    isEmailAdmin(user?.email) ||
    false;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        isAuthenticated: !!user,
        isAdmin,
        signIn: signInWithEmail,
        signUp: signUpWithEmail,
        signInWithGoogle,
        signOut: handleSignOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
