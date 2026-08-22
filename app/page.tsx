import { Hero } from '@/components/shared/hero';
import { FleetTeaser } from '@/components/shared/fleet-teaser';
import { WhyNR } from '@/components/shared/why-nr';
import { Services } from '@/components/shared/services';
import { Locations } from '@/components/shared/locations';
import { Reviews } from '@/components/shared/reviews';
import { CTASection } from '@/components/shared/cta-section';

export default function Home() {
  return (
    <main>
      <Hero />
      <FleetTeaser />
      <WhyNR />
      <Services />
      <Locations />
      <Reviews />
      <CTASection />
    </main>
  );
}
