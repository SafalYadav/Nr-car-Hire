import { ScrollReveal } from '@/components/shared/scroll-reveal';
import { Star, MessageSquare } from 'lucide-react';

export function Reviews() {
  return (
    <section
      id="reviews"
      className="bg-gray-50/50 py-20 sm:py-24 lg:py-32"
      aria-labelledby="reviews-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-gold">
              Testimonials
            </span>
            <h2
              id="reviews-heading"
              className="mt-3 text-3xl font-display font-bold tracking-tight text-foreground sm:text-4xl"
            >
              What Our Customers Say
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
              Real feedback from customers who have experienced our service.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <div className="mx-auto mt-12 max-w-2xl lg:mt-16">
            <div className="flex flex-col items-center rounded-[--radius-xl] border border-gray-100 bg-white p-10 text-center">
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gold/10 text-gold">
                <MessageSquare className="h-7 w-7" aria-hidden="true" />
              </div>

              {/* Star rating placeholder */}
              <div className="flex gap-1" aria-label="5 star rating">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-gold text-gold" aria-hidden="true" />
                ))}
              </div>

              <p className="mt-6 text-lg font-medium text-foreground">
                Customer reviews coming soon
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                We&apos;re collecting feedback from our customers. Check back soon to see what they
                have to say about their experience with NR Car Hire.
              </p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
