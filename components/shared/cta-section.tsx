import { ScrollReveal } from '@/components/shared/scroll-reveal';
import { Button } from '@/components/ui/button';
import { TransitionLink } from '@/components/shared/transition-link';
import { ArrowRight, Sparkles } from 'lucide-react';

export function CTASection() {
  return (
    <section
      className="relative overflow-hidden bg-midnight py-20 sm:py-28"
      aria-labelledby="cta-heading"
    >
      {/* Background ambient lighting */}
      <div
        className="pointer-events-none absolute -right-40 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-gold/15 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -left-40 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-gold/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8 z-10">
        <ScrollReveal>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-xs font-semibold text-gold mb-6 shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Instant Confirmation</span>
          </span>

          <h2
            id="cta-heading"
            className="text-3xl font-display font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl"
          >
            Ready to Experience Australian Roads in Luxury?
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-gray-300 sm:text-lg">
            Browse our pristine vehicle fleet, select your pickup dates, and secure your vehicle in under 2 minutes. Transparent rates with zero hidden fees.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3.5 sm:flex-row sm:justify-center">
            <Button variant="gold" size="lg" className="rounded-full shadow-lg shadow-gold/25 px-8 text-sm font-bold" asChild>
              <TransitionLink href="/#booking">
                <span>Find Your Car</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </TransitionLink>
            </Button>
            <Button variant="outlineLight" size="lg" className="rounded-full border-white/30 text-white hover:bg-white/10 text-sm font-semibold" asChild>
              <TransitionLink href="/fleet">Browse All Fleet</TransitionLink>
            </Button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

