import { ScrollReveal } from '@/components/shared/scroll-reveal';
import { locations } from '@/lib/data/locations';
import { MapPin } from 'lucide-react';

export function Locations() {
  return (
    <section
      id="locations"
      className="bg-background py-20 sm:py-28"
      aria-labelledby="locations-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-gold">
              Australian Hubs
            </span>
            <h2
              id="locations-heading"
              className="mt-3 text-3xl font-display font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
            >
              Major Airport & City Locations
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground leading-relaxed">
              Seamless contactless pickup and drop-off at premier airport terminals and central business districts across Australia.
            </p>
          </div>
        </ScrollReveal>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3">
          {locations.map((location, i) => (
            <ScrollReveal key={location.id} delay={i * 0.06}>
              <div className="group flex items-start gap-4 rounded-2xl border border-border/80 dark:border-white/10 bg-card text-card-foreground p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-gold/40 hover:shadow-xl dark:hover:shadow-black/40">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold transition-all duration-300 group-hover:bg-gold group-hover:text-midnight shadow-xs">
                  <MapPin className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-card-foreground group-hover:text-gold transition-colors">{location.city}</h3>
                  <p className="mt-0.5 text-sm font-medium text-muted-foreground">{location.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground/80">{location.address}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

