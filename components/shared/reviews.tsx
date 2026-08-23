import { ScrollReveal } from '@/components/shared/scroll-reveal';
import { Star, MessageSquareQuote } from 'lucide-react';

export function Reviews() {
  return (
    <section
      id="reviews"
      className="bg-muted/40 dark:bg-charcoal/40 py-20 sm:py-28"
      aria-labelledby="reviews-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-gold">
              Guest Feedback
            </span>
            <h2
              id="reviews-heading"
              className="mt-3 text-3xl font-display font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
            >
              What Our Travelers Say
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground leading-relaxed">
              Authentic experiences and reviews from business and leisure travelers who hire with NR across Australia.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <div className="mx-auto mt-12 max-w-2xl lg:mt-16">
            <div className="flex flex-col items-center rounded-3xl border border-border/80 dark:border-white/10 bg-card text-card-foreground p-10 text-center shadow-md dark:shadow-black/40">
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/10 text-gold shadow-xs">
                <MessageSquareQuote className="h-8 w-8" aria-hidden="true" />
              </div>

              {/* Star rating */}
              <div className="flex gap-1" aria-label="5 star rating">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-gold text-gold" aria-hidden="true" />
                ))}
              </div>

              <p className="mt-6 text-xl font-display font-bold text-card-foreground">
                &ldquo;Exceptional Service & Pristine Fleet&rdquo;
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground max-w-md">
                Seamless pickup directly at Sydney Airport, immaculate Camry Sedan, and no surprise charges. NR Car Hire is now our default choice across Australia.
              </p>
              <div className="mt-6 pt-4 border-t border-border/80 w-full max-w-xs text-center">
                <p className="text-xs font-bold text-foreground">Verified Australian Hirer</p>
                <p className="text-[11px] text-muted-foreground">Sydney Airport Hub</p>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

