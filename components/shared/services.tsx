import { ScrollReveal } from '@/components/shared/scroll-reveal';
import { services } from '@/lib/data/services';
import { Car, Clock, Plane, Building2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  Car,
  Clock,
  Plane,
  Building2,
};

export function Services() {
  return (
    <section
      id="services"
      className="bg-muted/40 dark:bg-charcoal/40 py-20 sm:py-28"
      aria-labelledby="services-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-gold">
              Rental Solutions
            </span>
            <h2
              id="services-heading"
              className="mt-3 text-3xl font-display font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
            >
              Tailored Car Hire Services
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground leading-relaxed">
              Flexible rental solutions engineered for corporate executives, holiday makers, and extended interstate travel across Australia.
            </p>
          </div>
        </ScrollReveal>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">
          {services.map((service, i) => {
            const Icon = iconMap[service.icon] || Car;
            return (
              <ScrollReveal key={service.id} delay={i * 0.08}>
                <div className="flex flex-col items-center rounded-2xl border border-border/80 dark:border-white/10 bg-card text-card-foreground p-8 text-center shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:border-gold/40 hover:shadow-xl dark:hover:shadow-black/40">
                  <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-midnight dark:bg-black/80 text-gold shadow-md border border-gold/20">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="text-base font-display font-bold text-card-foreground">
                    {service.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                    {service.description}
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

