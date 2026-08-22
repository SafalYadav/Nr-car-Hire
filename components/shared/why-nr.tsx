import { ScrollReveal } from '@/components/shared/scroll-reveal';
import { Car, DollarSign, CalendarCheck, Shield, Clock, Headphones } from 'lucide-react';

const features = [
  {
    icon: Car,
    title: 'Premium Vehicles',
    description:
      'Well-maintained, late-model vehicles across every category from economy to luxury.',
  },
  {
    icon: DollarSign,
    title: 'Transparent Pricing',
    description: 'Clear daily rates with no hidden fees. What you see is what you pay.',
  },
  {
    icon: CalendarCheck,
    title: 'Easy Booking',
    description: 'Simple online booking process with instant confirmation and flexible options.',
  },
  {
    icon: Shield,
    title: 'Reliable Service',
    description: 'Dependable vehicles, on-time availability, and professional service standards.',
  },
  {
    icon: Clock,
    title: 'Flexible Rentals',
    description: 'Daily, weekly, and monthly hire options to suit your schedule and needs.',
  },
  {
    icon: Headphones,
    title: 'Customer Support',
    description:
      'Dedicated support team ready to assist with bookings, queries, and roadside help.',
  },
];

export function WhyNR() {
  return (
    <section
      id="why-nr"
      className="bg-white py-20 sm:py-24 lg:py-32"
      aria-labelledby="why-nr-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-gold">
              Why Choose Us
            </span>
            <h2
              id="why-nr-heading"
              className="mt-3 text-3xl font-display font-bold tracking-tight text-foreground sm:text-4xl"
            >
              Why NR Car Hire
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
              We focus on what matters — quality vehicles, honest pricing, and dependable service
              across Australia.
            </p>
          </div>
        </ScrollReveal>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <ScrollReveal key={feature.title} delay={i * 0.08}>
                <div className="group relative rounded-[--radius-xl] border border-gray-100 bg-white p-8 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5">
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-[--radius-lg] bg-gold/10 text-gold transition-colors duration-300 group-hover:bg-gold group-hover:text-white">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-display font-bold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
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
