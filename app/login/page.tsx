'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/account';

  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const { error } = await signIn(email.trim(), password);

    if (error) {
      setErrorMessage(error);
      setIsLoading(false);
      return;
    }

    // Redirect to requested path
    router.push(redirectPath);
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMessage(null);
    const { url, error } = await signInWithGoogle();
    if (error) {
      setErrorMessage(error);
      setIsGoogleLoading(false);
    } else if (url) {
      window.location.href = url;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gold/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-2xl font-display font-extrabold tracking-tight text-white">
              NR<span className="text-gold"> Car Hire</span>
            </span>
          </Link>
          <h2 className="mt-4 text-2xl font-display font-bold tracking-tight text-white sm:text-3xl">
            Welcome Back
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Sign in to access your premium reservations and hire dashboard.
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-slate-900/90 backdrop-blur-md py-8 px-6 shadow-2xl rounded-3xl border border-slate-800 sm:px-10">
            {errorMessage && (
              <div className="mb-5 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400">
                {errorMessage}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <Label htmlFor="email" className="text-xs text-slate-300">
                  Email Address
                </Label>
                <div className="mt-1 relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com.au"
                    className="pl-9 bg-slate-950 border-slate-800 text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password" className="text-xs text-slate-300">
                  Password
                </Label>
                <div className="mt-1 relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-9 bg-slate-950 border-slate-800 text-white text-xs"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="gold"
                  disabled={isLoading || isGoogleLoading}
                  className="w-full h-10 text-xs font-bold"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Sign In to Account <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </>
                  )}
                </Button>
              </div>
            </form>

            {/* Social Divider */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-slate-900 px-3 text-slate-500 text-[10px] tracking-wider">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isLoading || isGoogleLoading}
                  onClick={handleGoogleSignIn}
                  className="w-full h-10 border-slate-800 bg-slate-950 text-slate-200 text-xs hover:bg-slate-800 hover:text-white"
                >
                  {isGoogleLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          fill="#EA4335"
                        />
                      </svg>
                      Sign in with Google
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="mt-6 text-center text-xs text-slate-400">
              Don’t have an account?{' '}
              <Link
                href={`/signup${redirectPath ? `?redirect=${encodeURIComponent(redirectPath)}` : ''}`}
                className="text-gold font-semibold hover:underline"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-gold" />
          <span>256-bit encrypted secure session backed by Supabase</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
