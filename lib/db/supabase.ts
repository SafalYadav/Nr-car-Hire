import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nerswxfbytxooyxcnvnc.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lcnN3eGZieXR4b295eGNudm5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0MTc5MDksImV4cCI6MjEwMjk5MzkwOX0.xAembHmcOfGQS1HqVTnDzPI4HILaLxng6-zggxMYppY';

const globalForSupabase = globalThis as unknown as {
  supabase: SupabaseClient | undefined;
};

export const supabase =
  globalForSupabase.supabase ??
  createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: typeof window !== 'undefined',
      autoRefreshToken: true,
    },
  });

if (process.env.NODE_ENV !== 'production') {
  globalForSupabase.supabase = supabase;
}

/**
 * Test connectivity to Supabase project
 */
export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  url: string;
  error?: string;
}> {
  try {
    const { error } = await supabase.auth.getSession();
    if (error) {
      return { connected: false, url: supabaseUrl, error: error.message };
    }
    return { connected: true, url: supabaseUrl };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { connected: false, url: supabaseUrl, error: message };
  }
}
