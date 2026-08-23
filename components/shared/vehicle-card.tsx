'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils/cn';
import type { Vehicle } from '@/lib/data/vehicles';
import { getVehicleFeatures } from '@/lib/data/vehicles';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TransitionLink } from '@/components/shared/transition-link';
import { Users, Fuel, Briefcase, Cog, ArrowRight } from 'lucide-react';

interface VehicleCardProps {
  vehicle: Vehicle;
  className?: string;
}

export function VehicleCard({ vehicle, className }: VehicleCardProps) {
  const features = getVehicleFeatures(vehicle.features);

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border border-border/80 dark:border-white/10 bg-card text-card-foreground shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all duration-300 hover:-translate-y-1.5 hover:border-gold/50 dark:hover:border-gold/50 hover:shadow-[0_16px_35px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_16px_35px_rgba(0,0,0,0.5)]',
        className,
      )}
    >
      {/* Image container */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted/40">
        {vehicle.imageUrl ? (
          <Image
            src={vehicle.imageUrl}
            alt={`${vehicle.make} ${vehicle.model} ${vehicle.year}`}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            loading="lazy"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <div className="text-center">
              <div className="text-4xl font-display font-bold text-muted-foreground/40">
                {vehicle.make.charAt(0)}
                {vehicle.model.charAt(0)}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {vehicle.make} {vehicle.model}
              </p>
            </div>
          </div>
        )}

        {/* Ambient Top Shadow for badges */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent opacity-60 pointer-events-none" />

        {/* Category badge */}
        <span className="absolute left-3 top-3 rounded-full bg-midnight/85 dark:bg-black/80 px-3 py-1 text-[11px] font-semibold text-gold shadow-sm backdrop-blur-md border border-gold/30">
          {vehicle.category}
        </span>

        {/* Transmission badge */}
        {features?.transmission && (
          <span className="absolute right-3 top-3 rounded-full bg-white/90 dark:bg-white/10 px-2.5 py-0.5 text-[10px] font-medium text-foreground dark:text-white shadow-xs backdrop-blur-md border border-black/5 dark:border-white/10">
            {features.transmission}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-lg font-display font-bold text-card-foreground group-hover:text-gold transition-colors duration-200">
              {vehicle.make} {vehicle.model}
            </h3>
            <p className="text-xs font-medium text-muted-foreground">{vehicle.year} Luxury Model</p>
          </div>
        </div>

        {/* Specs Pill Grid */}
        {features && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1.5 rounded-lg bg-muted/50 px-2.5 py-1.5 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5 text-gold shrink-0" aria-hidden="true" />
              <span>{features.seats} Seats</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-muted/50 px-2.5 py-1.5 text-xs text-muted-foreground">
              <Cog className="h-3.5 w-3.5 text-gold shrink-0" aria-hidden="true" />
              <span className="truncate">{features.transmission}</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-muted/50 px-2.5 py-1.5 text-xs text-muted-foreground">
              <Fuel className="h-3.5 w-3.5 text-gold shrink-0" aria-hidden="true" />
              <span className="truncate">{features.fuelType}</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-muted/50 px-2.5 py-1.5 text-xs text-muted-foreground">
              <Briefcase className="h-3.5 w-3.5 text-gold shrink-0" aria-hidden="true" />
              <span>{features.luggage} Bags</span>
            </div>
          </div>
        )}

        {/* Price & View CTA */}
        <div className="mt-auto flex items-end justify-between pt-5 border-t border-border/60">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Daily Rate</p>
            <p className="text-xl font-display font-extrabold text-card-foreground">
              ₹{vehicle.dailyRate}
              <span className="text-xs font-normal text-muted-foreground"> / day</span>
            </p>
          </div>
          <Button variant="gold" size="sm" className="rounded-full shadow-md shadow-gold/20 group/btn" asChild>
            <TransitionLink href={`/fleet/${vehicle.id}`} className="flex items-center gap-1">
              <span>View</span>
              <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
            </TransitionLink>
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
        'rounded-2xl border border-border bg-card overflow-hidden shadow-xs',
        className,
      )}
    >
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/4" />
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Skeleton className="h-6 w-full rounded-lg" />
          <Skeleton className="h-6 w-full rounded-lg" />
          <Skeleton className="h-6 w-full rounded-lg" />
          <Skeleton className="h-6 w-full rounded-lg" />
        </div>
        <div className="flex justify-between items-end pt-4 border-t border-border">
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-9 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

