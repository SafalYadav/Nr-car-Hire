import { ScrollReveal } from '@/components/shared/scroll-reveal';
import { Button } from '@/components/ui/button';
import { TransitionLink } from '@/components/shared/transition-link';
import { ArrowRight } from 'lucide-react';

export function CTASection() {
  return (
    <section
      className="relative overflow-hidden bg-midnight py-20 sm:py-24 lg:py-32"
      aria-labelledby="cta-heading"
    >
      {/* Background accent */}
      <div
        className="absolute -right-40 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-gold/5 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute -left-40 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-gold/3 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <ScrollReveal>
          <h2
            id="cta-heading"
            className="text-3xl font-display font-bold tracking-tight text-white sm:text-4xl lg:text-5xl"
          >
            Ready to Hit the Road?
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-gray-400 sm:text-lg">
            Browse our premium fleet, pick your dates, and book your vehicle in minutes. Premium car
            hire, made simple.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button variant="gold" size="lg" asChild>
              <TransitionLink href="/#booking">
                Search Vehicles
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </TransitionLink>
            </Button>
            <Button variant="outlineLight" size="lg" asChild>
              <TransitionLink href="/fleet">Browse Fleet</TransitionLink>
            </Button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
