'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { getLocationOptions } from '@/lib/data/locations';
import { MapPin, Calendar, Search } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

import { usePageTransition } from '@/components/shared/page-transition';

interface BookingWidgetProps {
  className?: string;
}

export function BookingWidget({ className }: BookingWidgetProps) {
  const { navigate } = usePageTransition();
  const locationOptions = getLocationOptions();
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/fleet');
  };

  return (
    <div
      id="booking"
      className={cn(
        'w-full scroll-mt-24 rounded-[--radius-xl] border border-white/10 bg-white p-6 shadow-2xl shadow-black/10 lg:scroll-mt-28 lg:p-8',
        className,
      )}
    >
      <h2 className="mb-6 text-lg font-display font-bold text-foreground">Find Your Vehicle</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Pickup Location */}
        <div>
          <label
            htmlFor="pickup-location"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            Pickup Location
          </label>
          <div className="relative">
            <MapPin
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <select
              id="pickup-location"
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
              className="flex h-11 w-full appearance-none rounded-[--radius-md] border border-input bg-background py-2 pl-10 pr-4 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/20 focus-visible:border-gold transition-colors duration-200"
            >
              <option value="">Select pickup location</option>
              {locationOptions.map((loc) => (
                <option key={loc.value} value={loc.value}>
                  {loc.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Drop-off Location */}
        <div>
          <label
            htmlFor="dropoff-location"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            Drop-off Location
          </label>
          <div className="relative">
            <MapPin
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <select
              id="dropoff-location"
              value={dropoffLocation}
              onChange={(e) => setDropoffLocation(e.target.value)}
              className="flex h-11 w-full appearance-none rounded-[--radius-md] border border-input bg-background py-2 pl-10 pr-4 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/20 focus-visible:border-gold transition-colors duration-200"
            >
              <option value="">Same as pickup</option>
              {locationOptions.map((loc) => (
                <option key={loc.value} value={loc.value}>
                  {loc.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="pickup-date"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Pickup Date
            </label>
            <div className="relative">
              <Calendar
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="date"
                id="pickup-date"
                value={pickupDate}
                min={today}
                onChange={(e) => setPickupDate(e.target.value)}
                className="flex h-11 w-full rounded-[--radius-md] border border-input bg-background py-2 pl-10 pr-4 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/20 focus-visible:border-gold transition-colors duration-200"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="return-date"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Return Date
            </label>
            <div className="relative">
              <Calendar
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="date"
                id="return-date"
                value={returnDate}
                min={pickupDate || today}
                onChange={(e) => setReturnDate(e.target.value)}
                className="flex h-11 w-full rounded-[--radius-md] border border-input bg-background py-2 pl-10 pr-4 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/20 focus-visible:border-gold transition-colors duration-200"
              />
            </div>
          </div>
        </div>

        {/* Search Button */}
        <Button type="submit" variant="gold" size="lg" className="mt-2 w-full text-base">
          <Search className="h-4 w-4" aria-hidden="true" />
          Search Vehicles
        </Button>
      </form>
    </div>
  );
}
