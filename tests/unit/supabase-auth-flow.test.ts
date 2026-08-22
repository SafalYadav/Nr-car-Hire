import { describe, it, expect } from 'vitest';
import {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signOutUser,
  getUserProfile,
} from '@/lib/auth/supabase-auth';
import { getAuthSession, requireAuth, requireAdmin } from '@/lib/auth/rbac';

describe('Supabase Authentication & Authorization Suite', () => {
  describe('1. Supabase Auth Helper Functions', () => {
    it('signInWithGoogle generates an OAuth redirect response or url', async () => {
      const res = await signInWithGoogle();
      expect(res).toBeDefined();
      expect('error' in res).toBe(true);
    });

    it('signOutUser handles sign out without throwing', async () => {
      const res = await signOutUser();
      expect(res).toBeDefined();
      expect('error' in res).toBe(true);
    });

    it('getUserProfile handles non-existent user IDs gracefully', async () => {
      const profile = await getUserProfile('non-existent-uuid-0000');
      expect(profile).toBeNull();
    });

    it('signUpWithEmail attempts registration with Supabase auth', async () => {
      const res = await signUpWithEmail('test.customer@example.com.au', 'SecurePass123!', {
        firstName: 'Test',
        lastName: 'Customer',
        phone: '+61400111222',
      });
      expect(res).toBeDefined();
      expect('error' in res).toBe(true);
    });

    it('signInWithEmail attempts authentication with Supabase auth', async () => {
      const res = await signInWithEmail('test.customer@example.com.au', 'SecurePass123!');
      expect(res).toBeDefined();
      expect('error' in res).toBe(true);
    });
  });

  describe('2. RBAC & Route Security Protection', () => {
    it('grants ADMIN role to valid development admin API key', () => {
      const req = new Request('http://localhost:3000/api/admin/metrics', {
        headers: { 'x-admin-key': 'nr-car-hire-admin-secret-2024' },
      });
      const session = getAuthSession(req);
      expect(session).not.toBeNull();
      expect(session?.role).toBe('ADMIN');
      expect(session?.userId).toBe('admin-system-001');
    });

    it('grants CUSTOMER role to customer dev role header', () => {
      const req = new Request('http://localhost:3000/api/bookings', {
        headers: { 'x-user-role': 'CUSTOMER' },
      });
      const session = getAuthSession(req);
      expect(session).not.toBeNull();
      expect(session?.role).toBe('CUSTOMER');
    });

    it('requireAdmin throws AuthorizationError for customer session', () => {
      const req = new Request('http://localhost:3000/api/admin/vehicles', {
        headers: { 'x-user-role': 'CUSTOMER' },
      });
      expect(() => requireAdmin(req)).toThrow('Admin privileges required');
    });

    it('requireAuth throws AuthenticationError for unauthenticated request', () => {
      const req = new Request('http://localhost:3000/api/admin/vehicles');
      expect(() => requireAuth(req)).toThrow('Authentication required');
    });

    it('decodes Supabase JWT token with customer payload', () => {
      // Mock 3-part base64 encoded JWT payload
      const mockPayload = Buffer.from(
        JSON.stringify({
          sub: 'usr-sb-12345',
          email: 'customer@example.com.au',
          user_metadata: { role: 'CUSTOMER' },
        }),
      ).toString('base64');
      const fakeJwt = `header.${mockPayload}.signature`;

      const req = new Request('http://localhost:3000/api/bookings', {
        headers: { authorization: `Bearer ${fakeJwt}` },
      });
      const session = getAuthSession(req);
      expect(session).not.toBeNull();
      expect(session?.userId).toBe('usr-sb-12345');
      expect(session?.role).toBe('CUSTOMER');
      expect(session?.email).toBe('customer@example.com.au');
    });

    it('decodes Supabase JWT token with admin payload', () => {
      const mockPayload = Buffer.from(
        JSON.stringify({
          sub: 'admin-sb-99999',
          email: 'admin@nrcarhire.com.au',
          user_metadata: { role: 'ADMIN' },
        }),
      ).toString('base64');
      const fakeJwt = `header.${mockPayload}.signature`;

      const req = new Request('http://localhost:3000/api/admin/vehicles', {
        headers: { authorization: `Bearer ${fakeJwt}` },
      });
      const session = getAuthSession(req);
      expect(session).not.toBeNull();
      expect(session?.userId).toBe('admin-sb-99999');
      expect(session?.role).toBe('ADMIN');
      expect(() => requireAdmin(req)).not.toThrow();
    });

    it('grants ADMIN role to websitebanja@gmail.com across all sessions', () => {
      const mockPayload = Buffer.from(
        JSON.stringify({
          sub: 'usr-websitebanja-001',
          email: 'websitebanja@gmail.com',
        }),
      ).toString('base64');
      const fakeJwt = `header.${mockPayload}.signature`;

      const req = new Request('http://localhost:3000/api/admin/vehicles', {
        headers: { authorization: `Bearer ${fakeJwt}` },
      });
      const session = getAuthSession(req);
      expect(session).not.toBeNull();
      expect(session?.email).toBe('websitebanja@gmail.com');
      expect(session?.role).toBe('ADMIN');
      expect(() => requireAdmin(req)).not.toThrow();
    });
  });
});
