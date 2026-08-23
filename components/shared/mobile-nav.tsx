'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth/auth-context';
import { X, LogIn, UserCheck } from 'lucide-react';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { TransitionLink } from '@/components/shared/transition-link';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  links: { href: string; label: string }[];
}

export function MobileNav({ isOpen, onClose, links }: MobileNavProps) {
  const { user, profile, isAuthenticated } = useAuth();
  const shouldReduceMotion = useReducedMotion();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trap and escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            initial={shouldReduceMotion ? {} : { x: '100%' }}
            animate={{ x: 0 }}
            exit={shouldReduceMotion ? {} : { x: '100%' }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="fixed right-0 top-0 z-50 flex h-full w-[300px] flex-col bg-card text-card-foreground border-l border-border shadow-2xl lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
          >
            {/* Header */}
            <div className="flex h-16 items-center justify-between px-5 border-b border-border">
              <TransitionLink
                href="/"
                onClick={onClose}
                className="text-lg font-display font-extrabold tracking-tight text-foreground"
              >
                NR<span className="text-gold"> Car Hire</span>
              </TransitionLink>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 px-4 pt-4 overflow-y-auto" aria-label="Mobile navigation">
              <ul className="space-y-1" role="list">
                {links.map((link, i) => (
                  <motion.li
                    key={link.href}
                    initial={shouldReduceMotion ? {} : { opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + i * 0.04, duration: 0.25 }}
                  >
                    <TransitionLink
                      href={link.href}
                      onClick={onClose}
                      className="block rounded-xl px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted hover:text-gold"
                    >
                      {link.label}
                    </TransitionLink>
                  </motion.li>
                ))}
              </ul>
            </nav>

            {/* Theme switcher & CTA in Mobile Menu */}
            <div className="p-5 space-y-3 border-t border-border bg-muted/30">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-semibold text-muted-foreground">Appearance</span>
                <ThemeToggle variant="pill" />
              </div>

              {isAuthenticated ? (
                <Button
                  variant="outline"
                  size="default"
                  className="w-full text-xs font-semibold border-gold/40 bg-card text-foreground hover:bg-gold/10 shadow-xs rounded-xl"
                  onClick={onClose}
                  asChild
                >
                  <TransitionLink href="/account" className="flex items-center justify-center gap-2">
                    <UserCheck className="h-4 w-4 text-gold" />
                    <span>My Account ({profile?.firstName || user?.email?.split('@')[0]})</span>
                  </TransitionLink>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="default"
                  className="w-full text-xs font-semibold border-gold/40 bg-card text-foreground hover:bg-gold/10 shadow-xs rounded-xl"
                  onClick={onClose}
                  asChild
                >
                  <TransitionLink href="/login" className="flex items-center justify-center gap-2">
                    <LogIn className="h-4 w-4 text-gold" />
                    <span>Login / Sign Up</span>
                  </TransitionLink>
                </Button>
              )}

              <Button variant="gold" size="lg" className="w-full rounded-xl shadow-md shadow-gold/20" onClick={onClose} asChild>
                <TransitionLink href="/#booking">Book Now</TransitionLink>
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

