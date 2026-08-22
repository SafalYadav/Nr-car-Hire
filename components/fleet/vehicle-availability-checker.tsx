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
    <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-5 mt-6">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="h-4 w-4 text-gold" />
        <h3 className="text-sm font-display font-bold text-foreground">
          Check Date-Range Availability
        </h3>
      </div>

      <form onSubmit={handleCheck} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="detail-pickup-date"
              className="block text-xs font-medium text-muted-foreground mb-1"
            >
              Pickup Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
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
                className="w-full h-10 rounded-[--radius-md] border border-input bg-white py-1.5 pl-9 pr-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/20 focus-visible:border-gold"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="detail-dropoff-date"
              className="block text-xs font-medium text-muted-foreground mb-1"
            >
              Return Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
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
                className="w-full h-10 rounded-[--radius-md] border border-input bg-white py-1.5 pl-9 pr-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/20 focus-visible:border-gold"
              />
            </div>
          </div>
        </div>

        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={isLoading || !pickupDate || !dropoffDate}
          className="w-full justify-center text-xs"
        >
          {isLoading ? 'Verifying Availability...' : 'Verify Dates'}
        </Button>
      </form>

      {/* Result feedback */}
      {result && (
        <div
          className={`mt-4 rounded-lg p-3 text-xs border ${
            result.isAvailable
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-red-200 bg-red-50 text-red-900'
          }`}
        >
          <div className="flex items-start gap-2">
            {result.isAvailable ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 space-y-2">
              <div>
                <p className="font-semibold">
                  {result.isAvailable ? 'Vehicle is Available!' : 'Vehicle Unavailable'}
                </p>
                {result.reason && <p className="mt-0.5 text-xs opacity-90">{result.reason}</p>}
                {result.isAvailable && result.totalDays && result.estimatedTotal && (
                  <div className="mt-2 pt-2 border-t border-emerald-200 flex justify-between font-medium">
                    <span>{result.totalDays} Days Rental:</span>
                    <span>₹{result.estimatedTotal} INR</span>
                  </div>
                )}
              </div>

              {result.isAvailable ? (
                <Button
                  variant="gold"
                  size="sm"
                  asChild
                  className="w-full justify-center text-xs mt-2"
                >
                  <TransitionLink
                    href={`/book/${vehicleId}?pickupDate=${encodeURIComponent(
                      pickupDate,
                    )}&dropoffDate=${encodeURIComponent(dropoffDate)}`}
                  >
                    <CalendarCheck className="h-3.5 w-3.5 mr-1" />
                    Book for These Verified Dates
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
                    className="flex-1 text-[11px] h-8 justify-center"
                  >
                    Choose Different Dates
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="flex-1 text-[11px] h-8 justify-center"
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
