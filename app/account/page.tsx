'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BookingRecord } from '@/lib/db/booking-store';
import {
  MapPin,
  Car,
  Plus,
  Loader2,
  ChevronRight,
  LogOut,
  LogIn,
  UserCheck,
  ShieldCheck,
  Calendar,
} from 'lucide-react';

export default function CustomerAccountPage() {
  const { user, profile, isAuthenticated, isLoading: isAuthLoading, signOut } = useAuth();
  const [guestEmail, setGuestEmail] = useState('');
  const customerEmail = user?.email || guestEmail;
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'past'>('all');

  // Cancel Modal State
  const [cancellingBooking, setCancellingBooking] = useState<BookingRecord | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);
  const [cancelFeedback, setCancelFeedback] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const loadBookingsForEmail = useCallback(async (email: string) => {
    if (!email) {
      setBookings([]);
      return;
    }

    setIsLoadingBookings(true);
    try {
      const res = await fetch(`/api/bookings?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.success && data.data?.bookings) {
        setBookings(data.data.bookings);
      } else {
        setBookings([]);
      }
    } catch (err) {
      console.error('Failed to load customer bookings:', err);
      setBookings([]);
    } finally {
      setIsLoadingBookings(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    if (!user?.email) return;

    fetch(`/api/bookings?email=${encodeURIComponent(user.email)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!ignore && data.success && data.data?.bookings) {
          setBookings(data.data.bookings);
        }
      })
      .catch(() => {
        if (!ignore) setBookings([]);
      })
      .finally(() => {
        if (!ignore) setIsLoadingBookings(false);
      });

    return () => {
      ignore = true;
    };
  }, [user?.email]);

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
        await loadBookingsForEmail(customerEmail);
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

  if (isAuthLoading) {
    return (
      <main className="min-h-screen bg-gray-50/50 pt-28 pb-20 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-gold mx-auto" />
          <p className="text-xs text-muted-foreground">Verifying Supabase secure session...</p>
        </div>
      </main>
    );
  }

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
        {/* If user is NOT authenticated, show a login prompt banner with guest lookup option */}
        {!isAuthenticated ? (
          <div className="space-y-6">
            <div className="rounded-3xl border border-gray-100 bg-white p-8 md:p-12 shadow-sm text-center max-w-2xl mx-auto space-y-5">
              <div className="h-16 w-16 bg-gold/10 text-gold rounded-2xl flex items-center justify-center mx-auto">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold text-foreground sm:text-3xl">
                  Sign in to Access Your Hire Account
                </h1>
                <p className="mt-2 text-xs text-muted-foreground max-w-md mx-auto">
                  View upcoming vehicle reservations, download rental vouchers, modify driver
                  itineraries, or book new vehicles with 1-click checkout.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Button variant="gold" size="default" className="w-full sm:w-auto" asChild>
                  <Link href="/login?redirect=/account">
                    <LogIn className="mr-2 h-4 w-4" /> Sign In with Email or Google
                  </Link>
                </Button>
                <Button variant="outline" size="default" className="w-full sm:w-auto" asChild>
                  <Link href="/signup?redirect=/account">Create Account</Link>
                </Button>
              </div>

              {/* Guest lookup tool */}
              <div className="pt-6 border-t border-gray-100 text-left">
                <Label htmlFor="guestEmail" className="text-xs font-semibold text-foreground">
                  Have a guest reservation? Look up by email:
                </Label>
                <div className="mt-1.5 flex gap-2">
                  <Input
                    id="guestEmail"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="Enter booking email address"
                    className="text-xs h-9 bg-gray-50"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 text-xs whitespace-nowrap"
                    disabled={!guestEmail || isLoadingBookings}
                    onClick={() => loadBookingsForEmail(guestEmail)}
                  >
                    {isLoadingBookings ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      'Find Bookings'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Authenticated Customer Header */
          <div className="flex flex-col md:flex-row md:items-center md:justify-between rounded-3xl border border-gray-100 bg-white p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/10 text-gold font-bold text-xl flex-shrink-0">
                {(profile?.firstName || user?.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gold flex items-center gap-1">
                    <UserCheck className="h-3.5 w-3.5" />
                    {profile?.role === 'ADMIN' ? 'Administrator' : 'Verified Customer Account'}
                  </span>
                </div>
                <h1 className="text-2xl font-display font-bold text-foreground sm:text-3xl">
                  {profile?.firstName && profile?.lastName
                    ? `${profile.firstName} ${profile.lastName}`
                    : 'My Hire Dashboard'}
                </h1>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">{user?.email}</p>
              </div>
            </div>

            <div className="mt-4 md:mt-0 flex items-center gap-3">
              <Button variant="gold" size="sm" asChild>
                <Link href="/fleet">
                  <Plus className="mr-1.5 h-4 w-4" /> Book Another Car
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut()}
                className="text-xs text-slate-600 hover:text-red-600"
              >
                <LogOut className="mr-1.5 h-3.5 w-3.5" /> Sign Out
              </Button>
            </div>
          </div>
        )}

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

          {customerEmail && (
            <Button
              size="sm"
              variant="ghost"
              className="text-xs text-muted-foreground hover:text-foreground h-8"
              onClick={() => loadBookingsForEmail(customerEmail)}
            >
              Refresh
            </Button>
          )}
        </div>

        {/* Bookings List */}
        <div className="mt-6 space-y-4">
          {isLoadingBookings ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-gold" />
              <p className="mt-3 text-sm text-muted-foreground">Loading your reservations...</p>
            </div>
          ) : displayedBookings.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center">
              <Car className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-3 text-lg font-bold text-foreground">No bookings found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {customerEmail
                  ? `You do not have any reservations listed under ${customerEmail}.`
                  : 'Sign in or look up your email to view your booking history.'}
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
                      <span className="text-xs text-muted-foreground">Total: </span>
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
                      <p className="text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        {pDate} ({b.pickupTime}) → {dDate} ({b.returnTime})
                      </p>
                    </div>

                    <div>
                      <p className="text-muted-foreground uppercase font-semibold text-[10px]">
                        Driver
                      </p>
                      <p className="font-medium text-foreground mt-0.5">
                        {b.customerDetails?.firstName} {b.customerDetails?.lastName}
                      </p>
                      <p className="text-muted-foreground font-mono">
                        Lic: {b.customerDetails?.licenseNumber || 'Verified'}
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
