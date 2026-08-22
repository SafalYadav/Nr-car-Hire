'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { MobileNav } from '@/components/shared/mobile-nav';
import { cn } from '@/lib/utils/cn';
import { Menu } from 'lucide-react';

import { TransitionLink } from '@/components/shared/transition-link';

import { useAuth } from '@/lib/auth/auth-context';
import { LogIn } from 'lucide-react';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/fleet', label: 'Fleet' },
  { href: '/account', label: 'My Account' },
  { href: '/#locations', label: 'Locations' },
  { href: '/#services', label: 'Services' },
  { href: '/#why-nr', label: 'About' },
];

export function Header() {
  const pathname = usePathname();
  const { user, profile, isAuthenticated } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      <header
        className={cn(
          'fixed left-0 right-0 top-0 z-50 transition-all duration-300',
          isScrolled
            ? 'border-b border-white/10 bg-white/95 shadow-sm backdrop-blur-md'
            : 'bg-transparent',
        )}
      >
        <nav
          className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:h-20 lg:px-8"
          aria-label="Main navigation"
        >
          {/* Logo */}
          <TransitionLink
            href="/"
            className="flex items-center gap-2"
            aria-label="NR Car Hire home"
          >
            <span
              className={cn(
                'text-xl font-display font-extrabold tracking-tight transition-colors duration-300 lg:text-2xl',
                isScrolled ? 'text-midnight' : 'text-white',
              )}
            >
              NR
              <span className="text-gold"> Car Hire</span>
            </span>
          </TransitionLink>

          {/* Desktop Navigation */}
          <ul className="hidden items-center gap-1 lg:flex" role="list">
            {navLinks.map((link) => (
              <li key={link.href}>
                <TransitionLink
                  href={link.href}
                  className={cn(
                    'rounded-[--radius-sm] px-4 py-2 text-sm font-medium transition-colors duration-200 hover:bg-white/10',
                    isScrolled
                      ? 'text-foreground/70 hover:text-foreground hover:bg-gray-100'
                      : 'text-white/80 hover:text-white',
                  )}
                >
                  {link.label}
                </TransitionLink>
              </li>
            ))}
          </ul>

          {/* Desktop CTA & Auth */}
          <div className="hidden lg:flex items-center gap-3">
            {isAuthenticated ? (
              <Button
                variant={isScrolled ? 'outline' : 'outlineLight'}
                size="default"
                asChild
                className={cn(
                  'font-semibold text-xs transition-all duration-200',
                  isScrolled
                    ? 'border-gray-300 bg-gray-50/80 text-midnight hover:bg-gray-100 hover:text-midnight shadow-sm'
                    : 'border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white shadow-sm',
                )}
              >
                <TransitionLink href="/account" className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full bg-gold text-midnight font-bold text-[10px] flex items-center justify-center shadow-xs">
                    {(profile?.firstName || user?.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span>My Account</span>
                </TransitionLink>
              </Button>
            ) : (
              <Button
                variant={isScrolled ? 'outline' : 'outlineLight'}
                size="default"
                asChild
                className={cn(
                  'font-semibold text-xs transition-all duration-200',
                  isScrolled
                    ? 'border-gray-300 bg-gray-50/80 text-midnight hover:bg-gray-100 hover:text-midnight shadow-sm'
                    : 'border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white shadow-sm',
                )}
              >
                <TransitionLink href="/login" className="flex items-center gap-1.5">
                  <LogIn className="h-4 w-4 text-gold" />
                  <span>Login</span>
                </TransitionLink>
              </Button>
            )}

            <Button variant="gold" size="default" asChild>
              <TransitionLink href="/#booking">Book Now</TransitionLink>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setIsMobileOpen(true)}
            className={cn(
              'inline-flex h-10 w-10 items-center justify-center rounded-[--radius-sm] transition-colors lg:hidden',
              isScrolled ? 'text-foreground hover:bg-gray-100' : 'text-white hover:bg-white/10',
            )}
            aria-label="Open menu"
            aria-expanded={isMobileOpen}
          >
            <Menu className="h-5 w-5" />
          </button>
        </nav>
      </header>

      <MobileNav isOpen={isMobileOpen} onClose={() => setIsMobileOpen(false)} links={navLinks} />
    </>
  );
}
