import type { Metadata } from 'next';
import { Suspense } from 'react';
import { allVehicles } from '@/lib/data/vehicles';
import { BookingFlow } from '@/components/booking/booking-flow';
import { Loader2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Book a Car Online — NR Car Hire Australia',
  description:
    'Reserve your premium hire car across Sydney, Melbourne, Brisbane, and Perth with transparent pricing, zero hidden fees, and instant confirmation.',
};

export default function BookPage() {
  const defaultVehicle = allVehicles[0];

  return (
    <main className="min-h-screen bg-background text-foreground pt-24 pb-20">
      <Suspense
        fallback={
          <div className="flex h-96 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
          </div>
        }
      >
        <BookingFlow vehicle={defaultVehicle} allVehicles={allVehicles} />
      </Suspense>
    </main>
  );
}

