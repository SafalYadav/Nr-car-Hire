'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TransitionLink } from '@/components/shared/transition-link';
import { Calendar, CheckCircle2, AlertCircle, Clock, CalendarCheck } from 'lucide-react';

interface VehicleAvailabilityCheckerProps {
  vehicleId: string;
}

export function VehicleAvailabilityChecker({ vehicleId }: VehicleAvailabilityCheckerProps) {
  const today = new Date().toISOString().split('T')[0];
  const [pickupDate, setPickupDate] = useState('');
  const [dropoffDate, setDropoffDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    isAvailable: boolean;
    reason?: string;
    totalDays?: number;
    estimatedTotal?: number;
  } | null>(null);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickupDate || !dropoffDate) return;

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/vehicles/${vehicleId}/availability?pickupDate=${encodeURIComponent(
          pickupDate,
        )}&dropoffDate=${encodeURIComponent(dropoffDate)}`,
      );
      const json = await res.json();
      if (json.success && json.data) {
        let displayReason = json.data.reason;
        if (!json.data.isAvailable && displayReason) {
          if (
            displayReason.toLowerCase().includes('maintenance') ||
            displayReason.toLowerCase().includes('service')
          ) {
            displayReason =
              'Vehicle is unavailable due to scheduled maintenance during these dates.';
          } else if (
            displayReason.toLowerCase().includes('confirmed') ||
            displayReason.toLowerCase().includes('reservation') ||
            displayReason.toLowerCase().includes('booked')
          ) {
            displayReason = 'Vehicle is already booked for part of your selected dates.';
          }
        }
        setResult({
          ...json.data,
          reason: displayReason,
        });
      } else {
        setResult({
          isAvailable: false,
          reason: json.error || 'Vehicle is unavailable for the selected dates.',
        });
      }
    } catch {
      setResult({
        isAvailable: false,
        reason: 'Network error checking dates. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-muted/40 p-5 mt-6">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="h-4 w-4 text-gold" />
        <h3 className="text-sm font-display font-bold text-card-foreground">
          Check Date-Range Availability
        </h3>
      </div>

      <form onSubmit={handleCheck} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="detail-pickup-date"
              className="block text-xs font-semibold text-muted-foreground mb-1"
            >
              Pickup Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gold pointer-events-none" />
              <input
                type="date"
                id="detail-pickup-date"
                min={today}
                value={pickupDate}
                onChange={(e) => {
                  setPickupDate(e.target.value);
                  setResult(null);
                }}
                required
                className="w-full h-10 rounded-xl border border-input bg-background/90 py-1.5 pl-9 pr-3 text-xs font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/30 focus-visible:border-gold shadow-xs"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="detail-dropoff-date"
              className="block text-xs font-semibold text-muted-foreground mb-1"
            >
              Return Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gold pointer-events-none" />
              <input
                type="date"
                id="detail-dropoff-date"
                min={pickupDate || today}
                value={dropoffDate}
                onChange={(e) => {
                  setDropoffDate(e.target.value);
                  setResult(null);
                }}
                required
                className="w-full h-10 rounded-xl border border-input bg-background/90 py-1.5 pl-9 pr-3 text-xs font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/30 focus-visible:border-gold shadow-xs"
              />
            </div>
          </div>
        </div>

        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={isLoading || !pickupDate || !dropoffDate}
          className="w-full justify-center text-xs rounded-xl font-bold"
        >
          {isLoading ? 'Verifying Availability...' : 'Verify Dates'}
        </Button>
      </form>

      {/* Result feedback */}
      {result && (
        <div
          className={`mt-4 rounded-xl p-3.5 text-xs border ${
            result.isAvailable
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
              : 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300'
          }`}
        >
          <div className="flex items-start gap-2">
            {result.isAvailable ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 space-y-2">
              <div>
                <p className="font-bold text-sm">
                  {result.isAvailable ? 'Vehicle is Available!' : 'Vehicle Unavailable'}
                </p>
                {result.reason && <p className="mt-0.5 text-xs opacity-90">{result.reason}</p>}
                {result.isAvailable && result.totalDays && result.estimatedTotal && (
                  <div className="mt-2 pt-2 border-t border-border flex justify-between font-bold text-foreground">
                    <span>{result.totalDays} Days Rental:</span>
                    <span className="text-gold">₹{result.estimatedTotal} INR</span>
                  </div>
                )}
              </div>

              {result.isAvailable ? (
                <Button
                  variant="gold"
                  size="sm"
                  asChild
                  className="w-full justify-center text-xs mt-2 rounded-full font-bold shadow-md shadow-gold/20"
                >
                  <TransitionLink
                    href={`/book/${vehicleId}?pickupDate=${encodeURIComponent(
                      pickupDate,
                    )}&dropoffDate=${encodeURIComponent(dropoffDate)}`}
                  >
                    <CalendarCheck className="h-3.5 w-3.5 mr-1" />
                    <span>Book for These Verified Dates</span>
                  </TransitionLink>
                </Button>
              ) : (
                <div className="pt-2 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPickupDate('');
                      setDropoffDate('');
                      setResult(null);
                    }}
                    className="flex-1 text-[11px] h-8 justify-center rounded-lg"
                  >
                    Choose Different Dates
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="flex-1 text-[11px] h-8 justify-center rounded-lg"
                  >
                    <TransitionLink href="/fleet">Browse Other Vehicles</TransitionLink>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

