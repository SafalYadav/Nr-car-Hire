'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BookingRecord } from '@/lib/db/booking-store';
import { MapPin, Car, Plus, Loader2, ChevronRight } from 'lucide-react';

export default function CustomerAccountPage() {
  const [customerEmail, setCustomerEmail] = useState('james.harrison@example.com.au');
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'past'>('all');

  // Cancel Modal State
  const [cancellingBooking, setCancellingBooking] = useState<BookingRecord | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);
  const [cancelFeedback, setCancelFeedback] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadCustomerBookings() {
      try {
        const res = await fetch(`/api/bookings?email=${encodeURIComponent(customerEmail)}`);
        const data = await res.json();
        if (isMounted && data.success && data.data?.bookings) {
          setBookings(data.data.bookings);
        }
      } catch (err) {
        console.error('Failed to load customer bookings:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadCustomerBookings();
    return () => {
      isMounted = false;
    };
  }, [customerEmail]);

  const refreshBookings = async (email: string) => {
    try {
      const res = await fetch(`/api/bookings?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.success && data.data?.bookings) {
        setBookings(data.data.bookings);
      }
    } catch (err) {
      console.error('Failed to refresh customer bookings:', err);
    }
  };

  const handleCancelBooking = async () => {
    if (!cancellingBooking || !cancelReason.trim()) return;
    setIsSubmittingCancel(true);
    setCancelFeedback(null);

    try {
      const res = await fetch(`/api/bookings/${cancellingBooking.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason.trim() }),
      });

      const data = await res.json();
      if (data.success) {
        setCancelFeedback({ success: true, message: 'Booking successfully cancelled.' });
        await refreshBookings(customerEmail);
        setTimeout(() => {
          setCancellingBooking(null);
          setCancelReason('');
          setCancelFeedback(null);
        }, 1500);
      } else {
        setCancelFeedback({ success: false, message: data.error || 'Failed to cancel booking' });
      }
    } catch {
      setCancelFeedback({ success: false, message: 'Network error cancelling booking' });
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  const now = new Date();
  const upcomingBookings = bookings.filter(
    (b) =>
      new Date(b.dropoffDate) >= now &&
      (b.status === 'CONFIRMED' || b.status === 'PAYMENT_PENDING'),
  );
  const pastBookings = bookings.filter(
    (b) => new Date(b.dropoffDate) < now || b.status === 'COMPLETED' || b.status === 'CANCELLED',
  );

  const displayedBookings =
    activeTab === 'upcoming' ? upcomingBookings : activeTab === 'past' ? pastBookings : bookings;

  return (
    <main className="min-h-screen bg-gray-50/50 pt-28 pb-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Customer Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between rounded-3xl border border-gray-100 bg-white p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/10 text-gold font-bold text-xl">
              {customerEmail.charAt(0).toUpperCase()}
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-gold">
                Verified Customer Account
              </span>
              <h1 className="text-2xl font-display font-bold text-foreground sm:text-3xl">
                My Hire Dashboard
              </h1>
              <div className="mt-1 flex items-center gap-2">
                <Input
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="h-7 text-xs w-64 bg-gray-50"
                  placeholder="Enter email to view bookings"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => refreshBookings(customerEmail)}
                >
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-4 md:mt-0 flex gap-3">
            <Button variant="gold" size="sm" asChild>
              <Link href="/fleet">
                <Plus className="mr-1.5 h-4 w-4" /> Book Another Car
              </Link>
            </Button>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="mt-8 flex items-center justify-between border-b border-gray-200 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'all'
                  ? 'bg-midnight text-white shadow-sm'
                  : 'bg-white text-muted-foreground hover:bg-gray-100'
              }`}
            >
              All Bookings ({bookings.length})
            </button>
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'upcoming'
                  ? 'bg-midnight text-white shadow-sm'
                  : 'bg-white text-muted-foreground hover:bg-gray-100'
              }`}
            >
              Upcoming ({upcomingBookings.length})
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'past'
                  ? 'bg-midnight text-white shadow-sm'
                  : 'bg-white text-muted-foreground hover:bg-gray-100'
              }`}
            >
              Past & History ({pastBookings.length})
            </button>
          </div>
        </div>

        {/* Bookings List */}
        <div className="mt-6 space-y-4">
          {isLoading ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-gold" />
              <p className="mt-3 text-sm text-muted-foreground">Loading your reservations...</p>
            </div>
          ) : displayedBookings.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center">
              <Car className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-3 text-lg font-bold text-foreground">No bookings found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                You do not have any bookings listed under {customerEmail}.
              </p>
              <Button variant="gold" size="sm" className="mt-4" asChild>
                <Link href="/fleet">Explore Australian Fleet</Link>
              </Button>
            </div>
          ) : (
            displayedBookings.map((b) => {
              const pDate = new Date(b.pickupDate).toLocaleDateString('en-AU', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });
              const dDate = new Date(b.dropoffDate).toLocaleDateString('en-AU', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });

              return (
                <div
                  key={b.id}
                  className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:border-gray-200"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-100 pb-4 gap-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold text-foreground">
                        {b.bookingNumber}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          b.status === 'CONFIRMED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : b.status === 'CANCELLED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {b.status}
                      </span>
                      <span className="rounded-full bg-gray-100 text-gray-700 text-[10px] px-2 py-0.5 font-medium">
                        Payment: {b.paymentStatus}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-muted-foreground">Total Paid: </span>
                      <span className="text-lg font-bold font-display text-foreground">
                        ₹{b.finalAmount}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-xs">
                    <div>
                      <p className="text-muted-foreground uppercase font-semibold text-[10px]">
                        Vehicle ID
                      </p>
                      <p className="font-bold text-foreground text-sm mt-0.5">{b.vehicleId}</p>
                      <p className="text-muted-foreground">
                        {b.rentalDays} Days Rental (₹{b.dailyRate}/day)
                      </p>
                    </div>

                    <div>
                      <p className="text-muted-foreground uppercase font-semibold text-[10px]">
                        Itinerary
                      </p>
                      <p className="font-medium text-foreground mt-0.5">
                        <MapPin className="inline h-3.5 w-3.5 text-gold mr-1" />
                        {b.pickupLocation}
                      </p>
                      <p className="text-muted-foreground">
                        {pDate} ({b.pickupTime}) → {dDate} ({b.returnTime})
                      </p>
                    </div>

                    <div>
                      <p className="text-muted-foreground uppercase font-semibold text-[10px]">
                        Driver
                      </p>
                      <p className="font-medium text-foreground mt-0.5">
                        {b.customerDetails.firstName} {b.customerDetails.lastName}
                      </p>
                      <p className="text-muted-foreground font-mono">
                        Lic: {b.customerDetails.licenseNumber}
                      </p>
                    </div>
                  </div>

                  {b.cancellationReason && (
                    <div className="mt-3 rounded-lg bg-red-50 p-2.5 text-xs text-red-700">
                      <strong>Cancellation Reason:</strong> {b.cancellationReason}
                    </div>
                  )}

                  {/* Footer actions */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <Button variant="outline" size="sm" className="text-xs" asChild>
                      <Link href={`/booking/confirmation/${b.id}`}>
                        View Confirmation Voucher <ChevronRight className="ml-1 h-3.5 w-3.5" />
                      </Link>
                    </Button>

                    {b.status === 'CONFIRMED' && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          setCancellingBooking(b);
                          setCancelReason('');
                          setCancelFeedback(null);
                        }}
                      >
                        Cancel Booking
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Cancellation Dialog Modal */}
      {cancellingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-display font-bold text-foreground">
              Cancel Reservation {cancellingBooking.bookingNumber}
            </h3>
            <p className="text-xs text-muted-foreground">
              Are you sure you want to cancel this booking? Please provide a reason for our
              operations team.
            </p>

            <div>
              <Label htmlFor="cancelReason" className="text-xs font-semibold">
                Reason for Cancellation *
              </Label>
              <Input
                id="cancelReason"
                placeholder="e.g. Travel plan changed, flight cancelled"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="mt-1 text-xs"
              />
            </div>

            {cancelFeedback && (
              <p
                className={`text-xs ${
                  cancelFeedback.success ? 'text-emerald-600 font-semibold' : 'text-red-600'
                }`}
              >
                {cancelFeedback.message}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={isSubmittingCancel}
                onClick={() => setCancellingBooking(null)}
              >
                Keep Booking
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={isSubmittingCancel || !cancelReason.trim()}
                onClick={handleCancelBooking}
              >
                {isSubmittingCancel ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Confirm Cancellation'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
