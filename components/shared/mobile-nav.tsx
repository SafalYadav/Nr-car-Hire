'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

import { TransitionLink } from '@/components/shared/transition-link';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  links: { href: string; label: string }[];
}

export function MobileNav({ isOpen, onClose, links }: MobileNavProps) {
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
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            initial={shouldReduceMotion ? {} : { x: '100%' }}
            animate={{ x: 0 }}
            exit={shouldReduceMotion ? {} : { x: '100%' }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="fixed right-0 top-0 z-50 flex h-full w-[280px] flex-col bg-white shadow-2xl lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
          >
            {/* Close button */}
            <div className="flex h-16 items-center justify-between px-4">
              <TransitionLink
                href="/"
                onClick={onClose}
                className="text-lg font-display font-extrabold tracking-tight text-midnight"
              >
                NR<span className="text-gold"> Car Hire</span>
              </TransitionLink>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-[--radius-sm] text-foreground transition-colors hover:bg-gray-100"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 px-4 pt-4" aria-label="Mobile navigation">
              <ul className="space-y-1" role="list">
                {links.map((link, i) => (
                  <motion.li
                    key={link.href}
                    initial={shouldReduceMotion ? {} : { opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.05, duration: 0.3 }}
                  >
                    <TransitionLink
                      href={link.href}
                      onClick={onClose}
                      className="block rounded-[--radius-sm] px-4 py-3 text-base font-medium text-foreground transition-colors hover:bg-gray-50"
                    >
                      {link.label}
                    </TransitionLink>
                  </motion.li>
                ))}
              </ul>
            </nav>

            {/* CTA */}
            <div className="p-4">
              <Button variant="gold" size="lg" className="w-full" onClick={onClose} asChild>
                <TransitionLink href="/#booking">Book Now</TransitionLink>
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
