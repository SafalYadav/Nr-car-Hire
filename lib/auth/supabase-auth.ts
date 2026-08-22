import { supabase } from '@/lib/db/supabase';
import { logger } from '@/lib/utils/logger';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'CUSTOMER' | 'ADMIN';
  createdAt: string;
}

/**
 * Sign up a new user with Supabase Auth
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  metadata?: { firstName?: string; lastName?: string; phone?: string },
) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: metadata?.firstName || '',
          last_name: metadata?.lastName || '',
          phone: metadata?.phone || '',
          role: 'CUSTOMER',
        },
      },
    });

    if (error) {
      return { user: null, session: null, error: error.message };
    }

    // Upsert into public.profiles table if user was created
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: data.user.email,
        first_name: metadata?.firstName || '',
        last_name: metadata?.lastName || '',
        phone: metadata?.phone || '',
        role: 'CUSTOMER',
      });
    }

    return { user: data.user, session: data.session, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('Error in signUpWithEmail:', err);
    return { user: null, session: null, error: message };
  }
}

/**
 * Sign in existing user with Email & Password
 */
export async function signInWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { user: null, session: null, error: error.message };
    }

    return { user: data.user, session: data.session, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('Error in signInWithEmail:', err);
    return { user: null, session: null, error: message };
  }
}

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/account`,
      },
    });

    if (error) {
      return { url: null, error: error.message };
    }

    return { url: data.url, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { url: null, error: message };
  }
}

/**
 * Sign out current user
 */
export async function signOutUser() {
  try {
    const { error } = await supabase.auth.signOut();
    return { error: error ? error.message : null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { error: message };
  }
}

/**
 * Retrieve user profile from Supabase profiles table
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const fetchPromise = supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) =>
      setTimeout(() => resolve({ data: null, error: { message: 'Timeout' } }), 1200),
    );

    const { data, error } = (await Promise.race([fetchPromise, timeoutPromise])) as {
      data: {
        id: string;
        email: string;
        first_name?: string;
        last_name?: string;
        phone?: string;
        role?: 'CUSTOMER' | 'ADMIN';
        created_at: string;
      } | null;
      error: unknown;
    };

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      email: data.email,
      firstName: data.first_name || '',
      lastName: data.last_name || '',
      phone: data.phone || '',
      role: data.role || 'CUSTOMER',
      createdAt: data.created_at,
    };
  } catch (err: unknown) {
    logger.warn('Failed to fetch user profile from Supabase', {
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}
