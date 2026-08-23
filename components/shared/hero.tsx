'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { BookingWidget } from '@/components/shared/booking-widget';
import { TransitionLink } from '@/components/shared/transition-link';
import { CinematicHeroVideo } from '@/components/shared/cinematic-hero-video';
import { ChevronRight, Sparkles } from 'lucide-react';

const fadeUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: [0.21, 0.47, 0.32, 0.98] },
  }),
};

const noMotionVariants = {
  hidden: {},
  visible: {},
};

export function Hero() {
  const shouldReduceMotion = useReducedMotion();
  const variants = shouldReduceMotion ? noMotionVariants : fadeUpVariants;

  return (
    <section
      id="hero"
      className="relative min-h-[100dvh] overflow-hidden bg-midnight"
      aria-label="Hero"
    >
      {/* Cinematic Background Video with Smooth Crossfade & Australian Highway Scenes */}
      {!shouldReduceMotion ? (
        <CinematicHeroVideo />
      ) : (
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          <div
            className="h-full w-full bg-cover bg-center"
            style={{ backgroundImage: 'url(/images/hero-poster.jpg)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-midnight/90 via-midnight/55 to-midnight/25" />
        </div>
      )}

      <div className="relative mx-auto flex min-h-[100dvh] max-w-7xl flex-col items-center justify-center gap-12 px-4 py-28 sm:px-6 lg:flex-row lg:gap-16 lg:px-8 lg:py-0">
        {/* Left: Copy */}

        <div className="flex-1 text-center lg:text-left">
          <motion.div variants={variants} initial="hidden" animate="visible" custom={0.1}>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-black/40 px-4 py-1.5 text-xs font-semibold text-gold shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Australia&apos;s Luxury Car Rental Experience</span>
            </span>
          </motion.div>

          <motion.h1
            variants={variants}
            initial="hidden"
            animate="visible"
            custom={0.2}
            className="mt-6 text-4xl font-display font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl drop-shadow-[0_3px_14px_rgba(0,0,0,0.85)]"
          >
            Drive Premium.
            <br />
            <span className="bg-gradient-to-r from-amber-200 via-gold to-amber-400 bg-clip-text text-transparent">
              Drive Confidence.
            </span>
          </motion.h1>

          <motion.p
            variants={variants}
            initial="hidden"
            animate="visible"
            custom={0.3}
            className="mt-6 max-w-lg text-base leading-relaxed text-white sm:text-lg lg:max-w-xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] font-medium"
          >
            Immaculate late-model vehicles, transparent daily rates, zero hidden fees, and seamless airport pickup across Australia.
          </motion.p>

          <motion.div
            variants={variants}
            initial="hidden"
            animate="visible"
            custom={0.4}
            className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:items-start"
          >
            <Button variant="gold" size="lg" className="rounded-full shadow-lg shadow-gold/25 px-8 text-sm font-bold" asChild>
              <TransitionLink href="/fleet">
                <span>Explore Full Fleet</span>
                <ChevronRight className="h-4 w-4 ml-1" aria-hidden="true" />
              </TransitionLink>
            </Button>
            <Button variant="outlineLight" size="lg" className="rounded-full border-white/40 bg-black/30 hover:bg-white/20 text-sm font-semibold text-white" asChild>
              <a href="#why-nr">Why Choose NR</a>
            </Button>
          </motion.div>
        </div>


        {/* Right: Booking Widget */}
        <motion.div
          variants={variants}
          initial="hidden"
          animate="visible"
          custom={0.3}
          className="w-full max-w-md lg:max-w-lg"
        >
          <BookingWidget />
        </motion.div>
      </div>
    </section>
  );
}
