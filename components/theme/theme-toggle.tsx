'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/theme/theme-provider';
import { cn } from '@/lib/utils/cn';

interface ThemeToggleProps {
  className?: string;
  variant?: 'navbar' | 'icon' | 'pill';
}

export function ThemeToggle({ className, variant = 'navbar' }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={cn(
          'h-9 w-9 rounded-full bg-black/5 dark:bg-white/10 opacity-0 pointer-events-none',
          className
        )}
      />
    );
  }

  const isDark = resolvedTheme === 'dark';

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        className={cn(
          'flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-300',
          isDark
            ? 'border-gold/30 bg-midnight/80 text-gold hover:bg-white/5'
            : 'border-gold/40 bg-white/90 text-midnight hover:bg-gray-50 shadow-xs',
          className
        )}
      >
        {isDark ? (
          <>
            <Moon className="h-3.5 w-3.5 text-gold animate-in spin-in-180 duration-300" />
            <span>Dark Mode</span>
          </>
        ) : (
          <>
            <Sun className="h-3.5 w-3.5 text-amber-500 animate-in spin-in-180 duration-300" />
            <span>Light Mode</span>
          </>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className={cn(
        'group relative flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gold/40',
        isDark
          ? 'border-white/15 bg-white/5 text-gold hover:bg-white/10 hover:border-gold/50 shadow-inner'
          : 'border-black/10 bg-black/5 text-midnight hover:bg-black/10 hover:border-gold/60 shadow-xs',
        className
      )}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-gold transition-transform duration-300 group-hover:rotate-45" />
      ) : (
        <Moon className="h-4 w-4 text-midnight transition-transform duration-300 group-hover:-rotate-12" />
      )}
    </button>
  );
}
