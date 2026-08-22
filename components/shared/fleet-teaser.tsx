import { ScrollReveal } from '@/components/shared/scroll-reveal';
import { Button } from '@/components/ui/button';
import { TransitionLink } from '@/components/shared/transition-link';
import { ArrowRight, Car, ShieldCheck, Sparkles, Compass } from 'lucide-react';

const fleetCategories = [
  {
    icon: Car,
    title: 'Sedans & Compacts',
    tagline: 'Fuel-efficient city runabouts & modern sedans',
    description:
      'Perfect for business trips and urban driving with exceptional economy and comfort.',
  },
  {
    icon: Compass,
    title: 'SUVs & Family',
    tagline: 'Spacious 5 & 7-seater family crossovers',
    description:
      'Generous luggage space, elevated driving view, and modern safety tech for road trips.',
  },
  {
    icon: Sparkles,
    title: 'Luxury & Executive',
    tagline: 'Premium sedans with executive comfort',
    description:
      'Refined German engineering, premium leather interiors, and unmatched driving dynamics.',
  },
  {
    icon: ShieldCheck,
    title: 'Utes & Commercial',
    tagline: 'Rugged Australian workhorses & 4x4s',
    description:
      'Built tough for regional adventures and heavy-duty utility with dependable power.',
  },
];

export function FleetTeaser() {
  return (
    <section
      id="fleet"
      className="bg-gray-50/60 py-20 sm:py-24 lg:py-32"
      aria-labelledby="fleet-teaser-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-gold">
              Australian Fleet
            </span>
            <h2
              id="fleet-teaser-heading"
              className="mt-3 text-3xl font-display font-bold tracking-tight text-foreground sm:text-4xl"
            >
              Curated Vehicles for Every Journey
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
              We maintain a late-model, immaculate vehicle fleet across major Australian airport
              hubs. Explore our full vehicle catalogue with transparent daily rates and guaranteed
              availability.
            </p>
          </div>
        </ScrollReveal>

        {/* Category Teaser Grid */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:mt-16">
          {fleetCategories.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <ScrollReveal key={cat.title} delay={i * 0.08}>
                <div className="group flex h-full flex-col justify-between rounded-[--radius-xl] border border-gray-100 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/5">
                  <div>
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-[--radius-lg] bg-gold/10 text-gold transition-colors duration-300 group-hover:bg-gold group-hover:text-white">
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <h3 className="text-lg font-display font-bold text-foreground">{cat.title}</h3>
                    <p className="mt-1 text-xs font-medium text-gold">{cat.tagline}</p>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {cat.description}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>

        {/* Action Banner */}
        <ScrollReveal>
          <div className="mt-12 rounded-[--radius-2xl] border border-gray-100 bg-midnight p-8 text-center sm:p-10 lg:mt-16">
            <h3 className="text-xl font-display font-bold text-white sm:text-2xl">
              Ready to view models, pricing, and live availability?
            </h3>
            <p className="mx-auto mt-2 max-w-xl text-sm text-gray-400">
              Browse our full catalogue on our dedicated fleet page with live search,
              specifications, and instant booking options.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button variant="gold" size="lg" asChild>
                <TransitionLink href="/fleet">
                  Explore Full Fleet
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </TransitionLink>
              </Button>
              <Button variant="outlineLight" size="lg" asChild>
                <a href="#booking">Search Rental Dates</a>
              </Button>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
