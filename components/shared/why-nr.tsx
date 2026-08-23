import { ScrollReveal } from '@/components/shared/scroll-reveal';
import { Car, DollarSign, CalendarCheck, Shield, Clock, Headphones } from 'lucide-react';

const features = [
  {
    icon: Car,
    title: 'Immaculate Fleet',
    description:
      'Meticulously serviced, late-model vehicles across every category from luxury German sedans to spacious 7-seater SUVs.',
  },
  {
    icon: DollarSign,
    title: 'Honest Transparent Pricing',
    description: 'Guaranteed upfront pricing with zero hidden counter fees, credit card surcharges, or surprise administrative costs.',
  },
  {
    icon: CalendarCheck,
    title: 'Instant Online Reservation',
    description: 'Seamless booking flow with instant digital confirmation, vehicle lock-in, and flexible cancellation options.',
  },
  {
    icon: Shield,
    title: 'Comprehensive Zero-Excess Options',
    description: 'Drive with total peace of mind with premium roadside protection and optional zero-excess damage coverage.',
  },
  {
    icon: Clock,
    title: 'Flexible Hire Durations',
    description: 'Short-term weekend getaways, weekly corporate hires, and long-term extended rentals tailored to your itinerary.',
  },
  {
    icon: Headphones,
    title: '24/7 Dedicated Concierge',
    description:
      'Dedicated Australian support team and conversational ElevenLabs AI concierge ready to assist you day and night.',
  },
];

export function WhyNR() {
  return (
    <section
      id="why-nr"
      className="bg-background py-20 sm:py-28"
      aria-labelledby="why-nr-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-gold">
              The NR Standard
            </span>
            <h2
              id="why-nr-heading"
              className="mt-3 text-3xl font-display font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
            >
              Why Drive With NR Car Hire
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground leading-relaxed">
              We engineer our entire rental experience around elegance, speed, and reliability across Australian airport hubs.
            </p>
          </div>
        </ScrollReveal>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <ScrollReveal key={feature.title} delay={i * 0.06}>
                <div className="group relative rounded-2xl border border-border/80 dark:border-white/10 bg-card text-card-foreground p-8 shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:border-gold/40 hover:shadow-xl dark:hover:shadow-black/40">
                  <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10 text-gold transition-all duration-300 group-hover:bg-gold group-hover:text-midnight group-hover:scale-110 shadow-xs">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-display font-bold text-card-foreground group-hover:text-gold transition-colors duration-200">
                    {feature.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

