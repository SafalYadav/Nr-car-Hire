import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getVehicleById, allVehicles } from '@/lib/data/vehicles';
import { BookingFlow } from '@/components/booking/booking-flow';
import { Loader2 } from 'lucide-react';

interface BookVehiclePageProps {
  params: Promise<{
    vehicleId: string;
  }>;
}

export async function generateMetadata({ params }: BookVehiclePageProps): Promise<Metadata> {
  const { vehicleId } = await params;
  const vehicle = getVehicleById(vehicleId);

  if (!vehicle) {
    return { title: 'Vehicle Not Found' };
  }

  return {
    title: `Book ${vehicle.year} ${vehicle.make} ${vehicle.model} — NR Car Hire`,
    description: `Complete your online reservation for the ${vehicle.year} ${vehicle.make} ${vehicle.model}. Instant confirmation, flexible payment, and zero booking fees.`,
  };
}

export function generateStaticParams() {
  return allVehicles.map((vehicle) => ({
    vehicleId: vehicle.id,
  }));
}

export default async function BookVehiclePage({ params }: BookVehiclePageProps) {
  const { vehicleId } = await params;
  const vehicle = getVehicleById(vehicleId);

  if (!vehicle) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background text-foreground pt-24 pb-20">
      <Suspense
        fallback={
          <div className="flex h-96 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
          </div>
        }
      >
        <BookingFlow vehicle={vehicle} allVehicles={allVehicles} />
      </Suspense>
    </main>
  );
}

