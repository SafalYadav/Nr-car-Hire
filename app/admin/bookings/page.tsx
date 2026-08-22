'use client';

import { useState, useEffect } from 'react';
import type { BookingRecord } from '@/lib/db/booking-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Eye, Loader2, RefreshCw } from 'lucide-react';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Selected booking modal
  const [selectedBooking, setSelectedBooking] = useState<BookingRecord | null>(null);

  // Cancel action modal
  const [cancellingBooking, setCancellingBooking] = useState<BookingRecord | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadBookings() {
      try {
        const url = new URL('/api/bookings', window.location.origin);
        if (search) url.searchParams.set('search', search);
        if (statusFilter !== 'ALL') url.searchParams.set('status', statusFilter);

        const res = await fetch(url.toString(), {
          headers: { 'x-admin-key': 'nr-car-hire-admin-secret-2024' },
        });
        const data = await res.json();
        if (isMounted && data.success && data.data?.bookings) {
          setBookings(data.data.bookings);
        }
      } catch (err) {
        console.error('Failed to load admin bookings:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadBookings();
    return () => {
      isMounted = false;
    };
  }, [search, statusFilter]);

  const refreshBookings = async () => {
    try {
      const url = new URL('/api/bookings', window.location.origin);
      if (search) url.searchParams.set('search', search);
      if (statusFilter !== 'ALL') url.searchParams.set('status', statusFilter);

      const res = await fetch(url.toString(), {
        headers: { 'x-admin-key': 'nr-car-hire-admin-secret-2024' },
      });
      const data = await res.json();
      if (data.success && data.data?.bookings) {
        setBookings(data.data.bookings);
      }
    } catch (err) {
      console.error('Failed to refresh admin bookings:', err);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    refreshBookings();
  };

  const handleCancel = async () => {
    if (!cancellingBooking || !cancelReason.trim()) return;
    setIsSubmittingCancel(true);

    try {
      const res = await fetch(`/api/bookings/${cancellingBooking.id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'nr-car-hire-admin-secret-2024',
        },
        body: JSON.stringify({ reason: cancelReason.trim() }),
      });

      const data = await res.json();
      if (data.success) {
        await refreshBookings();
        setCancellingBooking(null);
        setCancelReason('');
      }
    } catch (err) {
      console.error('Failed to cancel booking:', err);
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Booking Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Authoritative ledger of customer reservations, payment signatures, and operational
            rental statuses.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={refreshBookings}
          className="border-slate-700 bg-slate-800 text-slate-200"
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search booking ref, customer name, email, or vehicle ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-slate-950 border-slate-800 text-slate-200 text-xs"
          />
        </form>

        <div className="flex items-center gap-2">
          {['ALL', 'CONFIRMED', 'PAYMENT_PENDING', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                statusFilter === st
                  ? 'bg-gold text-slate-950 shadow-md shadow-gold/10'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-gold" />
            <p className="mt-3 text-xs text-slate-400">Loading booking records...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            No bookings found matching query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-900/50 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3">Booking Reference</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Vehicle</th>
                  <th className="px-5 py-3">Rental Dates</th>
                  <th className="px-5 py-3">Amount (INR)</th>
                  <th className="px-5 py-3">Booking Status</th>
                  <th className="px-5 py-3">Payment</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {bookings.map((b) => {
                  const sDate = new Date(b.pickupDate).toLocaleDateString('en-AU', {
                    day: 'numeric',
                    month: 'short',
                  });
                  const eDate = new Date(b.dropoffDate).toLocaleDateString('en-AU', {
                    day: 'numeric',
                    month: 'short',
                  });

                  return (
                    <tr key={b.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="px-5 py-4">
                        <span className="font-mono font-bold text-white text-xs">
                          {b.bookingNumber}
                        </span>
                        <p className="text-[10px] text-slate-500 font-mono">{b.id}</p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-200">
                          {b.customerDetails.firstName} {b.customerDetails.lastName}
                        </p>
                        <p className="text-[11px] text-slate-400">{b.customerDetails.email}</p>
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-mono text-slate-300">{b.vehicleId}</span>
                        <p className="text-[10px] text-slate-500">{b.rentalDays} Days</p>
                      </td>

                      <td className="px-5 py-4 text-slate-300 font-mono">
                        {sDate} → {eDate}
                      </td>

                      <td className="px-5 py-4 font-mono font-bold text-gold">₹{b.finalAmount}</td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            b.status === 'CONFIRMED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : b.status === 'CANCELLED'
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            b.paymentStatus === 'PAID'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {b.paymentStatus}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedBooking(b)}
                          className="h-7 text-[11px] border-slate-700 bg-slate-800 text-slate-200"
                        >
                          <Eye className="h-3 w-3 mr-1" /> View
                        </Button>

                        {b.status === 'CONFIRMED' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setCancellingBooking(b);
                              setCancelReason('');
                            }}
                            className="h-7 text-[11px]"
                          >
                            Cancel
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Booking Details Drawer Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-gold">
                  {selectedBooking.bookingNumber}
                </span>
                <h3 className="text-lg font-display font-bold text-white">Booking Details</h3>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                  selectedBooking.status === 'CONFIRMED'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}
              >
                {selectedBooking.status}
              </span>
            </div>

            {/* Primary Details Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 uppercase font-semibold text-[10px]">Customer</span>
                <p className="font-bold text-white">
                  {selectedBooking.customerDetails.firstName}{' '}
                  {selectedBooking.customerDetails.lastName}
                </p>
                <p className="text-slate-300">{selectedBooking.customerDetails.email}</p>
                <p className="text-slate-400">{selectedBooking.customerDetails.phone}</p>
                <p className="text-slate-400 font-mono">
                  Lic: {selectedBooking.customerDetails.licenseNumber}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 uppercase font-semibold text-[10px]">
                  Vehicle & Itinerary
                </span>
                <p className="font-bold text-gold">{selectedBooking.vehicleId}</p>
                <p className="text-slate-300">
                  {selectedBooking.rentalDays} Days Rental (₹{selectedBooking.dailyRate}/day)
                </p>
                <p className="text-slate-400">
                  {selectedBooking.pickupLocation} → {selectedBooking.dropoffLocation}
                </p>
              </div>
            </div>

            {/* Financial Breakdown */}
            <div className="rounded-xl bg-slate-900 p-4 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Base Rate:</span>
                <span>₹{selectedBooking.baseAmount}</span>
              </div>
              {selectedBooking.extrasAmount > 0 && (
                <div className="flex justify-between text-slate-300">
                  <span>Extras Total:</span>
                  <span>₹{selectedBooking.extrasAmount}</span>
                </div>
              )}
              {selectedBooking.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Promo Discount ({selectedBooking.promoCode}):</span>
                  <span>-₹{selectedBooking.discountAmount}</span>
                </div>
              )}
              <div className="border-t border-slate-800 pt-2 flex justify-between font-bold text-white text-sm">
                <span>Total Paid:</span>
                <span className="text-gold">₹{selectedBooking.finalAmount}</span>
              </div>
            </div>

            {/* Gateway References */}
            <div className="space-y-1.5 text-[11px] font-mono text-slate-400">
              <p>Razorpay Order ID: {selectedBooking.razorpayOrderId || '—'}</p>
              <p>Razorpay Payment ID: {selectedBooking.razorpayPaymentId || '—'}</p>
            </div>

            {selectedBooking.cancellationReason && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-300">
                <strong>Cancellation Reason:</strong> {selectedBooking.cancellationReason}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedBooking(null)}
                className="border-slate-800 text-slate-300"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancellingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-display font-bold text-white">
              Admin Cancellation: {cancellingBooking.bookingNumber}
            </h3>
            <p className="text-xs text-slate-400">
              Please enter an official audit reason for cancelling this customer reservation.
            </p>

            <div>
              <Label className="text-slate-300 text-xs">Reason for Cancellation *</Label>
              <Input
                value={cancelReason}
                placeholder="e.g. Customer phone request, vehicle recall"
                onChange={(e) => setCancelReason(e.target.value)}
                className="mt-1 bg-slate-900 border-slate-800 text-white text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCancellingBooking(null)}
                className="border-slate-800 text-slate-400"
              >
                Keep
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={isSubmittingCancel || !cancelReason.trim()}
                onClick={handleCancel}
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
    </div>
  );
}
