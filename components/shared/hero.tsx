'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { BookingWidget } from '@/components/shared/booking-widget';
import { TransitionLink } from '@/components/shared/transition-link';
import { ChevronRight } from 'lucide-react';

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
      {/* Cinematic Background Video with Poster Fallback */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        {!shouldReduceMotion ? (
          <video
            autoPlay
            loop
            muted
            playsInline
            poster="/images/hero-poster.jpg"
            className="h-full w-full object-cover object-center"
          >
            <source src="/videos/hero-drive.webm" type="video/webm" />
            <source src="/videos/hero-drive.mp4" type="video/mp4" />
          </video>
        ) : (
          <div
            className="h-full w-full bg-cover bg-center"
            style={{ backgroundImage: 'url(/images/hero-poster.jpg)' }}
          />
        )}

        {/* Cinematic Light Gradient Overlays: Crystal clear video with high text legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-midnight/85 via-midnight/50 to-midnight/25 lg:from-midnight/80 lg:via-midnight/40 lg:to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-midnight/70 via-transparent to-midnight/40" />
      </div>

      {/* Subtle accent ambient light */}
      <div
        className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-gold/5 blur-2xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-gold/5 blur-2xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto flex min-h-[100dvh] max-w-7xl flex-col items-center justify-center gap-12 px-4 py-24 sm:px-6 lg:flex-row lg:gap-16 lg:px-8 lg:py-0">
        {/* Left: Copy */}
        <div className="flex-1 text-center lg:text-left">
          <motion.div variants={variants} initial="hidden" animate="visible" custom={0.1}>
            <span className="inline-block rounded-[--radius-full] border border-gold/30 bg-gold/10 px-4 py-1.5 text-xs font-medium text-gold">
              Premium Car Hire — Australia
            </span>
          </motion.div>

          <motion.h1
            variants={variants}
            initial="hidden"
            animate="visible"
            custom={0.2}
            className="mt-6 text-4xl font-display font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl"
          >
            Drive Premium.
            <br />
            <span className="text-gold">Drive Confidence.</span>
          </motion.h1>

          <motion.p
            variants={variants}
            initial="hidden"
            animate="visible"
            custom={0.3}
            className="mt-6 max-w-lg text-base leading-relaxed text-gray-400 sm:text-lg lg:max-w-xl"
          >
            Quality vehicles, transparent pricing, and reliable service across Australia. From city
            sedans to luxury SUVs — find the perfect vehicle for your journey.
          </motion.p>

          <motion.div
            variants={variants}
            initial="hidden"
            animate="visible"
            custom={0.4}
            className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:items-start"
          >
            <Button variant="gold" size="lg" asChild>
              <TransitionLink href="/fleet">
                Explore Fleet
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </TransitionLink>
            </Button>
            <Button variant="outlineLight" size="lg" asChild>
              <a href="#why-nr">Why NR Car Hire</a>
            </Button>
          </motion.div>
        </div>

        {/* Right: Booking Widget */}
        <motion.div
          variants={variants}
          initial="hidden"
          animate="visible"
          custom={0.5}
          className="w-full max-w-md flex-shrink-0 lg:max-w-sm xl:max-w-md"
        >
          <BookingWidget />
        </motion.div>
      </div>
    </section>
  );
}
