import { ScrollReveal } from '@/components/shared/scroll-reveal';
import { Button } from '@/components/ui/button';
import { TransitionLink } from '@/components/shared/transition-link';
import { ArrowRight, Car, ShieldCheck, Sparkles, Compass } from 'lucide-react';

const fleetCategories = [
  {
    icon: Car,
    title: 'Sedans & Compacts',
    tagline: 'Fuel-efficient city runabouts & executive sedans',
    description:
      'Perfect for business trips and urban driving with exceptional economy, agile handling, and modern infotainment.',
  },
  {
    icon: Compass,
    title: 'SUVs & Family',
    tagline: 'Spacious 5 & 7-seater crossovers & family SUVs',
    description:
      'Generous luggage space, elevated driving view, ISOFIX child anchors, and advanced ADAS safety tech for road trips.',
  },
  {
    icon: Sparkles,
    title: 'Luxury & Executive',
    tagline: 'Premium sedans with executive refinement',
    description:
      'German precision engineering, plush leather appointments, acoustic glass insulation, and commanding performance.',
  },
  {
    icon: ShieldCheck,
    title: 'Utes & Commercial',
    tagline: 'Rugged Australian workhorses & 4x4s',
    description:
      'Built tough for regional adventures and heavy-duty utility with dependable turbo-diesel power and towing capacity.',
  },
];

export function FleetTeaser() {
  return (
    <section
      id="fleet"
      className="bg-muted/40 dark:bg-charcoal/40 py-20 sm:py-28"
      aria-labelledby="fleet-teaser-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-gold">
              Australian Fleet Selection
            </span>
            <h2
              id="fleet-teaser-heading"
              className="mt-3 text-3xl font-display font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
            >
              Curated Vehicles for Every Journey
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground leading-relaxed">
              We maintain a late-model, meticulously detailed vehicle fleet across Sydney, Melbourne, and Brisbane airport hubs. Transparent daily rates, guaranteed availability, and zero hidden checkout fees.
            </p>
          </div>
        </ScrollReveal>

        {/* Category Teaser Grid */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:mt-16">
          {fleetCategories.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <ScrollReveal key={cat.title} delay={i * 0.08}>
                <div className="group flex h-full flex-col justify-between rounded-2xl border border-border/80 dark:border-white/10 bg-card text-card-foreground p-6 shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:border-gold/40 hover:shadow-xl dark:hover:shadow-black/40">
                  <div>
                    <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10 text-gold transition-all duration-300 group-hover:bg-gold group-hover:text-midnight group-hover:scale-110 shadow-xs">
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <h3 className="text-lg font-display font-bold text-card-foreground group-hover:text-gold transition-colors duration-200">
                      {cat.title}
                    </h3>
                    <p className="mt-1 text-xs font-semibold text-gold">{cat.tagline}</p>
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
          <div className="relative mt-12 overflow-hidden rounded-3xl border border-gold/30 bg-midnight p-8 text-center sm:p-12 lg:mt-16 shadow-2xl">
            {/* Ambient gold glow */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gold/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-gold/15 blur-3xl" />

            <div className="relative z-10">
              <span className="text-xs font-bold uppercase tracking-widest text-gold">Live Fleet Inventory</span>
              <h3 className="mt-2 text-2xl font-display font-bold text-white sm:text-3xl lg:text-4xl">
                Ready to view models, pricing, and live availability?
              </h3>
              <p className="mx-auto mt-3 max-w-xl text-sm sm:text-base text-gray-300 leading-relaxed">
                Browse our full catalogue on our dedicated fleet page with instant category filters, real-time specifications, and transparent instant checkout.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button variant="gold" size="lg" className="rounded-full shadow-lg shadow-gold/25 px-8 font-bold text-sm" asChild>
                  <TransitionLink href="/fleet">
                    <span>Explore Full Fleet</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </TransitionLink>
                </Button>
                <Button variant="outlineLight" size="lg" className="rounded-full border-white/25 text-white hover:bg-white/10 text-sm font-semibold" asChild>
                  <a href="#booking">Check Dates & Rates</a>
                </Button>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

