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
      <main className="min-h-screen bg-background text-foreground pt-28 pb-20 flex items-center justify-center">
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
    <main className="min-h-screen bg-background text-foreground pt-28 pb-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* If user is NOT authenticated, show a login prompt banner with guest lookup option */}
        {!isAuthenticated ? (
          <div className="space-y-6">
            <div className="rounded-3xl border border-border/80 dark:border-white/10 bg-card p-8 md:p-12 shadow-xl dark:shadow-black/40 text-center max-w-2xl mx-auto space-y-5">
              <div className="h-16 w-16 bg-gold/10 text-gold rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold text-card-foreground sm:text-3xl">
                  Sign in to Access Your Hire Account
                </h1>
                <p className="mt-2 text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                  View upcoming vehicle reservations, download rental vouchers, modify driver
                  itineraries, or book new vehicles with 1-click checkout.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Button variant="gold" size="default" className="w-full sm:w-auto rounded-full font-bold shadow-md shadow-gold/20" asChild>
                  <Link href="/login?redirect=/account">
                    <LogIn className="mr-2 h-4 w-4" /> <span>Sign In with Email or Google</span>
                  </Link>
                </Button>
                <Button variant="outline" size="default" className="w-full sm:w-auto rounded-full font-semibold" asChild>
                  <Link href="/signup?redirect=/account">Create Account</Link>
                </Button>
              </div>

              {/* Guest lookup tool */}
              <div className="pt-6 border-t border-border text-left">
                <Label htmlFor="guestEmail" className="text-xs font-bold text-foreground">
                  Have a guest reservation? Look up by email:
                </Label>
                <div className="mt-2 flex gap-2">
                  <Input
                    id="guestEmail"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="Enter booking email address"
                    className="text-xs h-10 rounded-xl bg-background/80"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-10 text-xs whitespace-nowrap rounded-xl font-bold"
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between rounded-3xl border border-border/80 dark:border-white/10 bg-card p-6 md:p-8 shadow-xl dark:shadow-black/40">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/10 text-gold font-bold text-xl flex-shrink-0 shadow-xs">
                {(profile?.firstName || user?.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gold flex items-center gap-1">
                    <UserCheck className="h-3.5 w-3.5" />
                    {profile?.role === 'ADMIN' ? 'Administrator' : 'Verified Customer Account'}
                  </span>
                </div>
                <h1 className="text-2xl font-display font-bold text-card-foreground sm:text-3xl">
                  {profile?.firstName && profile?.lastName
                    ? `${profile.firstName} ${profile.lastName}`
                    : 'My Hire Dashboard'}
                </h1>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">{user?.email}</p>
              </div>
            </div>

            <div className="mt-4 md:mt-0 flex items-center gap-3">
              <Button variant="gold" size="sm" className="rounded-full font-bold shadow-md shadow-gold/20" asChild>
                <Link href="/fleet">
                  <Plus className="mr-1.5 h-4 w-4" /> <span>Book Another Car</span>
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut()}
                className="text-xs text-muted-foreground hover:text-red-500 rounded-full font-semibold"
              >
                <LogOut className="mr-1.5 h-3.5 w-3.5" /> Sign Out
              </Button>
            </div>
          </div>
        )}

        {/* Tab Filters */}
        <div className="mt-8 flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                activeTab === 'all'
                  ? 'bg-gold text-midnight shadow-md shadow-gold/20'
                  : 'bg-muted text-foreground/80 hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              All Bookings ({bookings.length})
            </button>
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                activeTab === 'upcoming'
                  ? 'bg-gold text-midnight shadow-md shadow-gold/20'
                  : 'bg-muted text-foreground/80 hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              Upcoming ({upcomingBookings.length})
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                activeTab === 'past'
                  ? 'bg-gold text-midnight shadow-md shadow-gold/20'
                  : 'bg-muted text-foreground/80 hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              Past & History ({pastBookings.length})
            </button>
          </div>

          {customerEmail && (
            <Button
              size="sm"
              variant="ghost"
              className="text-xs text-muted-foreground hover:text-foreground h-8 rounded-full"
              onClick={() => loadBookingsForEmail(customerEmail)}
            >
              Refresh
            </Button>
          )}
        </div>

        {/* Bookings List */}
        <div className="mt-6 space-y-4">
          {isLoadingBookings ? (
            <div className="rounded-3xl border border-border/80 dark:border-white/10 bg-card p-12 text-center shadow-xs">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-gold" />
              <p className="mt-3 text-sm text-muted-foreground">Loading your reservations...</p>
            </div>
          ) : displayedBookings.length === 0 ? (
            <div className="rounded-3xl border border-border/80 dark:border-white/10 bg-card p-12 text-center shadow-xs">
              <Car className="mx-auto h-12 w-12 text-gold" />
              <h3 className="mt-3 text-lg font-bold text-card-foreground">No bookings found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {customerEmail
                  ? `You do not have any reservations listed under ${customerEmail}.`
                  : 'Sign in or look up your email to view your booking history.'}
              </p>
              <Button variant="gold" size="sm" className="mt-4 rounded-full font-bold shadow-md shadow-gold/20" asChild>
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
                  className="rounded-3xl border border-border/80 dark:border-white/10 bg-card p-6 shadow-md dark:shadow-black/40 transition-all hover:border-gold/30"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-border pb-4 gap-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold text-card-foreground">
                        {b.bookingNumber}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          b.status === 'CONFIRMED'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : b.status === 'CANCELLED'
                              ? 'bg-red-500/15 text-red-600 dark:text-red-300 border border-red-500/30'
                              : 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {b.status}
                      </span>
                      <span className="rounded-full bg-muted text-muted-foreground text-[10px] px-2.5 py-0.5 font-medium border border-border">
                        Payment: {b.paymentStatus}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-muted-foreground font-medium">Total: </span>
                      <span className="text-lg font-bold font-display text-foreground">
                        ₹{b.finalAmount}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-xs">
                    <div>
                      <p className="text-muted-foreground uppercase font-bold text-[10px]">
                        Vehicle ID
                      </p>
                      <p className="font-bold text-foreground text-sm mt-0.5">{b.vehicleId}</p>
                      <p className="text-muted-foreground">
                        {b.rentalDays} Days Rental (₹{b.dailyRate}/day)
                      </p>
                    </div>

                    <div>
                      <p className="text-muted-foreground uppercase font-bold text-[10px]">
                        Itinerary
                      </p>
                      <p className="font-medium text-foreground mt-0.5">
                        <MapPin className="inline h-3.5 w-3.5 text-gold mr-1" />
                        {b.pickupLocation}
                      </p>
                      <p className="text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3 text-gold" />
                        {pDate} ({b.pickupTime}) → {dDate} ({b.returnTime})
                      </p>
                    </div>

                    <div>
                      <p className="text-muted-foreground uppercase font-bold text-[10px]">
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
                    <div className="mt-3 rounded-xl bg-red-500/10 border border-red-500/30 p-2.5 text-xs text-red-600 dark:text-red-300">
                      <strong>Cancellation Reason:</strong> {b.cancellationReason}
                    </div>
                  )}

                  {/* Footer actions */}
                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                    <Button variant="outline" size="sm" className="text-xs rounded-full" asChild>
                      <Link href={`/booking/confirmation/${b.id}`}>
                        <span>View Confirmation Voucher</span> <ChevronRight className="ml-1 h-3.5 w-3.5" />
                      </Link>
                    </Button>

                    {b.status === 'CONFIRMED' && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="text-xs rounded-full"
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
          <div className="w-full max-w-md rounded-3xl bg-card text-card-foreground border border-border p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-display font-bold text-card-foreground">
              Cancel Reservation {cancellingBooking.bookingNumber}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to cancel this booking? Please provide a reason for our operations team.
            </p>

            <div>
              <Label htmlFor="cancelReason" className="text-xs font-bold text-foreground">
                Reason for Cancellation *
              </Label>
              <Input
                id="cancelReason"
                placeholder="e.g. Travel plan changed, flight cancelled"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="mt-1.5 text-xs rounded-xl"
              />
            </div>

            {cancelFeedback && (
              <p
                className={`text-xs font-medium ${
                  cancelFeedback.success ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
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
                className="rounded-full"
              >
                Keep Booking
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={isSubmittingCancel || !cancelReason.trim()}
                onClick={handleCancelBooking}
                className="rounded-full font-bold"
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

