import { ScrollReveal } from '@/components/shared/scroll-reveal';
import { locations } from '@/lib/data/locations';
import { MapPin } from 'lucide-react';

export function Locations() {
  return (
    <section
      id="locations"
      className="bg-white py-20 sm:py-24 lg:py-32"
      aria-labelledby="locations-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-gold">
              Australia-Wide
            </span>
            <h2
              id="locations-heading"
              className="mt-3 text-3xl font-display font-bold tracking-tight text-foreground sm:text-4xl"
            >
              Our Locations
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
              Convenient pickup and drop-off at major airports and city locations across Australia.
            </p>
          </div>
        </ScrollReveal>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3">
          {locations.map((location, i) => (
            <ScrollReveal key={location.id} delay={i * 0.08}>
              <div className="group flex items-start gap-4 rounded-[--radius-xl] border border-gray-100 bg-white p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[--radius-lg] bg-gold/10 text-gold transition-colors duration-300 group-hover:bg-gold group-hover:text-white">
                  <MapPin className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-foreground">{location.city}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">{location.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground/70">{location.address}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
