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
      className="bg-gray-50/50 py-20 sm:py-24 lg:py-32"
      aria-labelledby="services-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-gold">
              What We Offer
            </span>
            <h2
              id="services-heading"
              className="mt-3 text-3xl font-display font-bold tracking-tight text-foreground sm:text-4xl"
            >
              Our Services
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
              Flexible rental solutions designed to meet your travel needs across Australia.
            </p>
          </div>
        </ScrollReveal>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">
          {services.map((service, i) => {
            const Icon = iconMap[service.icon] || Car;
            return (
              <ScrollReveal key={service.id} delay={i * 0.1}>
                <div className="flex flex-col items-center rounded-[--radius-xl] border border-gray-100 bg-white p-8 text-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5">
                  <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-full bg-midnight text-gold">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="text-base font-display font-bold text-foreground">
                    {service.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
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
