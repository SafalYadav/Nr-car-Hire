import type { Metadata } from 'next';
import { FleetCatalog } from '@/components/fleet/fleet-catalog';
import { TransitionLink } from '@/components/shared/transition-link';
import { ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Our Fleet — Premium Rental Vehicles',
  description:
    'Browse the full NR Car Hire vehicle catalogue. Explore luxury sedans, premium SUVs, and reliable commercial vehicles available across Australia with transparent INR pricing.',
  openGraph: {
    title: 'Our Fleet — NR Car Hire Australia',
    description:
      'Browse our complete range of premium rental vehicles with transparent pricing and instant online booking.',
  },
};

export default function FleetPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Fleet Hero Banner */}
      <section className="relative overflow-hidden bg-midnight pt-28 pb-16 lg:pt-36 lg:pb-20">
        {/* Background gradient & glows */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-midnight via-charcoal to-graphite"
          aria-hidden="true"
        />
        <div
          className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-gold/10 blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-gold/5 blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="mb-6 flex items-center gap-2 text-xs text-gray-400"
          >
            <TransitionLink href="/" className="hover:text-gold transition-colors">
              Home
            </TransitionLink>
            <ChevronRight className="h-3 w-3 text-gray-600" aria-hidden="true" />
            <span className="text-gold font-medium" aria-current="page">
              Fleet
            </span>
          </nav>

          <div className="max-w-3xl">
            <span className="inline-block rounded-full border border-gold/30 bg-gold/15 px-4 py-1.5 text-xs font-semibold text-gold">
              Complete Fleet Catalogue
            </span>
            <h1 className="mt-4 text-4xl font-display font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Drive Premium. <span className="text-gold">Explore Our Fleet.</span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-gray-300 sm:text-lg">
              Explore our full collection of well-maintained, late-model vehicles. Compare
              specifications, transparent INR daily rates, and find the perfect car for your
              Australian journey.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Fleet Catalog */}
      <FleetCatalog />
    </main>
  );
}

