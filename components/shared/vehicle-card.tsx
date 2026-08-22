'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils/cn';
import type { Vehicle } from '@/lib/data/vehicles';
import { getVehicleFeatures } from '@/lib/data/vehicles';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TransitionLink } from '@/components/shared/transition-link';
import { Users, Fuel, Briefcase, Cog } from 'lucide-react';

interface VehicleCardProps {
  vehicle: Vehicle;
  className?: string;
}

export function VehicleCard({ vehicle, className }: VehicleCardProps) {
  const features = getVehicleFeatures(vehicle.features);

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-[--radius-xl] border border-gray-100 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/5',
        className,
      )}
    >
      {/* Image area */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-50">
        {vehicle.imageUrl ? (
          <Image
            src={vehicle.imageUrl}
            alt={`${vehicle.make} ${vehicle.model} ${vehicle.year}`}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-50">
            <div className="text-center">
              <div className="text-4xl font-display font-bold text-gray-300">
                {vehicle.make.charAt(0)}
                {vehicle.model.charAt(0)}
              </div>
              <p className="mt-1 text-xs text-gray-400">
                {vehicle.make} {vehicle.model}
              </p>
            </div>
          </div>
        )}

        {/* Category badge */}
        <span className="absolute left-3 top-3 rounded-[--radius-full] bg-midnight/80 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
          {vehicle.category}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-display font-bold text-foreground">
          {vehicle.make} {vehicle.model}
        </h3>
        <p className="mt-0.5 text-sm text-muted-foreground">{vehicle.year}</p>

        {/* Specs */}
        {features && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{features.seats} seats</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Cog className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{features.transmission}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Fuel className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{features.fuelType}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Briefcase className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{features.luggage} bags</span>
            </div>
          </div>
        )}

        {/* Price + CTA */}
        <div className="mt-auto flex items-end justify-between pt-5">
          <div>
            <p className="text-xs text-muted-foreground">From</p>
            <p className="text-xl font-display font-bold text-foreground">
              ₹{vehicle.dailyRate}
              <span className="text-sm font-normal text-muted-foreground">/day</span>
            </p>
          </div>
          <Button variant="gold" size="sm" asChild>
            <TransitionLink href={`/fleet/${vehicle.id}`}>View Details</TransitionLink>
          </Button>
        </div>
      </div>
    </article>
  );
}

export function VehicleCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-[--radius-xl] border border-gray-100 bg-white overflow-hidden',
        className,
      )}
    >
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/4" />
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex justify-between items-end pt-3">
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
    </div>
  );
}
