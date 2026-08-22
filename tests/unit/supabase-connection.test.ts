import { describe, it, expect } from 'vitest';
import { supabase, testSupabaseConnection } from '@/lib/db/supabase';

describe('Supabase Connection & Client Integration', () => {
  it('initializes the Supabase client with the configured project settings', () => {
    expect(supabase).toBeDefined();
    expect(supabase.auth).toBeDefined();
    expect(typeof supabase.from).toBe('function');
  });

  it('connects to Supabase successfully and verifies session endpoint', async () => {
    const res = await testSupabaseConnection();
    expect(res.connected).toBe(true);
    expect(res.url).toBe('https://nerswxfbytxooyxcnvnc.supabase.co');
    expect(res.error).toBeUndefined();
  });
});
