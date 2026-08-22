'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

interface PageTransitionContextType {
  navigate: (href: string) => void;
  isTransitioning: boolean;
}

const PageTransitionContext = createContext<PageTransitionContextType>({
  navigate: () => {},
  isTransitioning: false,
});

export function usePageTransition() {
  return useContext(PageTransitionContext);
}

export function PageTransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [targetPath, setTargetPath] = useState<string | null>(null);
  const pendingHrefRef = useRef<string | null>(null);

  const navigate = useCallback(
    (href: string) => {
      const url = new URL(href, 'http://localhost');
      const isExternal =
        href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:');
      const isSamePathHash = url.pathname === pathname && href.includes('#');

      // If reduced motion is requested or hash on current page, navigate immediately
      if (isExternal || isSamePathHash || shouldReduceMotion) {
        if (isSamePathHash) {
          const hash = href.substring(href.indexOf('#'));
          const targetEl = document.querySelector(hash);
          if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'smooth' });
            return;
          }
        }
        router.push(href);
        return;
      }

      // If navigating to a different page, trigger visible ~1.75s cinematic highway animation
      if (url.pathname !== pathname) {
        setTargetPath(url.pathname);
        pendingHrefRef.current = href;
        setIsTransitioning(true);

        // Prefetch target page immediately in background
        router.prefetch(href);

        // Execute router push after the main cinematic driving phase (~1200ms)
        setTimeout(() => {
          if (pendingHrefRef.current) {
            router.push(pendingHrefRef.current);
          }
        }, 1100);
      } else {
        router.push(href);
      }
    },
    [pathname, router, shouldReduceMotion],
  );

  // When pathname changes (or after full ~1750ms total sequence), finish the transition smoothly
  useEffect(() => {
    if (isTransitioning) {
      const timer = setTimeout(() => {
        setIsTransitioning(false);
        setTargetPath(null);
        pendingHrefRef.current = null;
      }, 1750);
      return () => clearTimeout(timer);
    }
  }, [pathname, isTransitioning]);

  return (
    <PageTransitionContext.Provider value={{ navigate, isTransitioning }}>
      {children}

      <AnimatePresence mode="wait">
        {isTransitioning && !shouldReduceMotion && (
          <motion.div
            key="highway-transition"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-midnight/95 backdrop-blur-2xl"
            role="status"
            aria-live="polite"
            aria-label="Loading page transition"
          >
            {/* Atmospheric Highway Lighting & Glows */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-midnight to-black/95 pointer-events-none" />
            <div className="absolute -top-32 left-1/2 h-80 w-[700px] -translate-x-1/2 rounded-full bg-gold/15 blur-[120px] pointer-events-none" />
            <div className="absolute -bottom-24 left-1/2 h-64 w-[500px] -translate-x-1/2 rounded-full bg-gold/10 blur-[100px] pointer-events-none" />

            {/* High-speed motion streaks */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50">
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '250%' }}
                transition={{ duration: 0.85, repeat: Infinity, ease: 'linear' }}
                className="absolute top-[28%] h-[1px] w-[450px] bg-gradient-to-r from-transparent via-gold/60 to-transparent"
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '250%' }}
                transition={{ duration: 0.65, repeat: Infinity, ease: 'linear', delay: 0.2 }}
                className="absolute top-[68%] h-[1px] w-[350px] bg-gradient-to-r from-transparent via-white/50 to-transparent"
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '250%' }}
                transition={{ duration: 1.1, repeat: Infinity, ease: 'linear', delay: 0.4 }}
                className="absolute top-[48%] h-[1px] w-[500px] bg-gradient-to-r from-transparent via-gold/40 to-transparent"
              />
            </div>

            {/* Cinematic Centerpiece: Car & Road */}
            <div className="relative z-10 flex flex-col items-center justify-center">
              {/* Luxury Car Silhouette Profile with dynamic cruising suspension animation */}
              <motion.div
                initial={{ x: -120, opacity: 0 }}
                animate={{
                  x: [-120, 0, 8, -4, 0, 140],
                  opacity: [0, 1, 1, 1, 1, 0],
                  y: [0, -1, 1, -1, 0, 0],
                }}
                transition={{
                  duration: 1.7,
                  times: [0, 0.25, 0.5, 0.75, 0.85, 1],
                  ease: 'easeInOut',
                }}
                className="relative z-10 mb-3 flex items-center justify-center"
              >
                {/* Taillight glow streak */}
                <div className="absolute -left-28 top-[60%] h-1.5 w-36 bg-gradient-to-l from-red-500 via-red-600/60 to-transparent blur-[3px]" />
                {/* Headlight beam trail */}
                <div className="absolute -right-36 top-[55%] h-10 w-44 bg-gradient-to-r from-gold/80 via-gold/30 to-transparent blur-md" />

                {/* Sleek Vector Car Profile */}
                <svg
                  className="h-20 w-52 text-white drop-shadow-[0_6px_25px_rgba(201,164,92,0.4)] sm:h-24 sm:w-64"
                  viewBox="0 0 240 80"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  {/* Aerodynamic Body */}
                  <path
                    d="M18 55 C 24 55, 30 52, 38 48 C 50 42, 75 35, 100 24 C 120 15, 150 14, 172 20 C 190 25, 206 38, 222 46 C 230 50, 236 53, 238 56 C 235 58, 228 59, 215 59 C 205 59, 198 52, 185 52 C 172 52, 165 59, 115 59 C 105 59, 98 52, 85 52 C 72 52, 65 59, 18 59 Z"
                    fill="currentColor"
                  />
                  {/* Roofline / Cabin Tint Glass */}
                  <path
                    d="M96 26 C 114 18, 142 17, 162 22 C 176 26, 186 35, 194 40 L 90 40 Z"
                    fill="#101317"
                  />
                  {/* Gold Body Accent Streak */}
                  <path
                    d="M32 49 C 60 44, 130 36, 218 48"
                    stroke="#C9A45C"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  {/* Alloy Wheels with Gold Rim */}
                  <circle
                    cx="65"
                    cy="58"
                    r="14"
                    fill="#0B0D10"
                    stroke="#C9A45C"
                    strokeWidth="2.5"
                  />
                  <circle cx="65" cy="58" r="6" fill="#C9A45C" />
                  <circle
                    cx="185"
                    cy="58"
                    r="14"
                    fill="#0B0D10"
                    stroke="#C9A45C"
                    strokeWidth="2.5"
                  />
                  <circle cx="185" cy="58" r="6" fill="#C9A45C" />
                  {/* Headlight */}
                  <polygon points="224,47 236,53 226,54" fill="#FFEAA7" />
                  {/* Taillight */}
                  <polygon points="20,52 16,56 22,56" fill="#FF4757" />
                </svg>
              </motion.div>

              {/* Highway Asphalt Road with Moving Dashed Gold & White Markings */}
              <div className="relative h-2 w-80 overflow-hidden rounded-full bg-white/10 sm:w-[420px]">
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: '-100%' }}
                  transition={{
                    duration: 0.65,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                  className="absolute inset-0 flex gap-6"
                >
                  <div className="h-full w-10 bg-gold" />
                  <div className="h-full w-10 bg-white/90" />
                  <div className="h-full w-10 bg-gold" />
                  <div className="h-full w-10 bg-white/90" />
                  <div className="h-full w-10 bg-gold" />
                  <div className="h-full w-10 bg-white/90" />
                  <div className="h-full w-10 bg-gold" />
                  <div className="h-full w-10 bg-white/90" />
                </motion.div>
              </div>

              {/* Status Indicator & Luxury Branding */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.4 }}
                className="mt-8 flex flex-col items-center"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base font-display font-bold tracking-wider text-white">
                    NR <span className="text-gold">Car Hire</span>
                  </span>
                  <span className="h-1.5 w-1.5 rounded-full bg-gold animate-ping" />
                </div>
                <p className="mt-2 text-xs tracking-widest uppercase text-gray-300 font-medium">
                  {targetPath?.startsWith('/fleet/')
                    ? 'Loading Vehicle Details · Australian Fleet'
                    : targetPath === '/fleet'
                      ? 'Opening Fleet Catalogue · Australia'
                      : 'Returning to Home · NR Car Hire'}
                </p>
                <div className="mt-3 flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-gold/80" />
                  <span className="h-1 w-1 rounded-full bg-gold/50" />
                  <span className="h-1 w-1 rounded-full bg-gold/30" />
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransitionContext.Provider>
  );
}
