import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { bookingStore } from '@/lib/db/booking-store';
import { vehicleStore } from '@/lib/db/vehicle-store';
import { paymentStore } from '@/lib/db/payment-store';
import { bookingService } from '@/lib/services/booking-service';
import { getVehicleById } from '@/lib/data/vehicles';
import { Button } from '@/components/ui/button';
import { CheckCircle2, MapPin, ArrowRight, Home } from 'lucide-react';

interface ConfirmationPageProps {
  params: Promise<{
    bookingId: string;
  }>;
  searchParams?: Promise<{
    orderId?: string;
    bookingNumber?: string;
    paymentId?: string;
  }>;
}

export const metadata: Metadata = {
  title: 'Booking Confirmed — NR Car Hire Australia',
  description: 'Your premium rental vehicle has been reserved and confirmed.',
};

export default async function BookingConfirmationPage({ params, searchParams }: ConfirmationPageProps) {
  const { bookingId } = await params;
  const sParams = searchParams ? await searchParams : {};
  const cleanId = decodeURIComponent(bookingId || '').trim();
  const fallbackOrderId = sParams.orderId ? decodeURIComponent(sParams.orderId).trim() : '';
  const fallbackBookingNumber = sParams.bookingNumber ? decodeURIComponent(sParams.bookingNumber).trim() : '';
  const fallbackPaymentId = sParams.paymentId ? decodeURIComponent(sParams.paymentId).trim() : '';

  let booking = null;

  // Multi-pass lookup across ID, bookingNumber, razorpayOrderId, and paymentStore
  for (let attempt = 0; attempt < 3 && !booking; attempt++) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, 350));
    }

    // 1. Direct ID lookup
    if (cleanId && cleanId !== 'undefined' && cleanId !== 'null') {
      booking = await bookingStore.findById(cleanId);
      if (!booking) booking = await bookingStore.findByBookingNumber(cleanId);
      if (!booking) booking = await bookingStore.findByRazorpayOrderId(cleanId);
    }

    // 2. Fallback query parameters lookup
    if (!booking && fallbackBookingNumber) {
      booking = await bookingStore.findByBookingNumber(fallbackBookingNumber);
    }
    if (!booking && fallbackOrderId) {
      booking = await bookingStore.findByRazorpayOrderId(fallbackOrderId);
    }

    // 3. Payment record lookup
    if (!booking && (cleanId || fallbackOrderId || fallbackPaymentId)) {
      const searchTarget = fallbackOrderId || cleanId;
      const payment =
        (await paymentStore.findByOrderId(searchTarget)) ||
        (fallbackPaymentId ? await paymentStore.findByPaymentId(fallbackPaymentId) : null);

      if (payment?.bookingId) {
        booking = await bookingStore.findById(payment.bookingId);
      }
    }
  }

  if (!booking) {
    notFound();
  }

  // If status is still pending, check if payment is confirmed in payment store
  if (booking.status === 'PAYMENT_PENDING' && booking.razorpayOrderId) {
    const payment = await paymentStore.findByOrderId(booking.razorpayOrderId);
    if (payment && payment.status === 'PAID') {
      try {
        const confirmed = await bookingService.confirmBookingPayment(
          booking.razorpayOrderId,
          payment.razorpayPaymentId || 'pay_verified',
        );
        booking = confirmed;
      } catch {
        // use current booking
      }
    }
  }

  const vehicleFromDb = await vehicleStore.findById(booking.vehicleId);
  const vehicle = vehicleFromDb || getVehicleById(booking.vehicleId);

  const formattedPickupDate = new Date(booking.pickupDate).toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const formattedDropoffDate = new Date(booking.dropoffDate).toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <main className="min-h-screen bg-background text-foreground pt-28 pb-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Success Banner */}
        <div className="rounded-3xl border border-border/80 dark:border-white/10 bg-card p-8 shadow-xl dark:shadow-black/40 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 shadow-xs">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <span className="mt-5 inline-block rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Payment Verified & Booking Confirmed
          </span>

          <h1 className="mt-3 text-3xl font-display font-extrabold text-card-foreground sm:text-4xl">
            You&apos;re Ready to Hit the Road!
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            A confirmation voucher has been recorded. Your reservation number is:
          </p>
          <div className="mt-3 inline-block rounded-2xl bg-muted/60 border border-border px-6 py-2.5 font-mono text-xl font-bold tracking-widest text-foreground shadow-xs">
            {booking.bookingNumber}
          </div>
        </div>

        {/* Booking Details Grid */}
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-12">
          {/* Left Column: Itinerary & Vehicle */}
          <div className="md:col-span-7 space-y-6">
            {/* Vehicle Card */}
            <div className="rounded-3xl border border-border/80 dark:border-white/10 bg-card p-6 shadow-md dark:shadow-black/40">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Reserved Vehicle
              </h2>
              <div className="mt-4 flex items-center gap-4">
                {vehicle?.imageUrl && (
                  <div className="relative h-20 w-28 flex-shrink-0 overflow-hidden rounded-2xl bg-muted/40 border border-border">
                    <Image
                      src={vehicle.imageUrl}
                      alt={vehicle.model}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div>
                  <span className="inline-block rounded-full bg-gold/15 border border-gold/30 px-2.5 py-0.5 text-[10px] font-bold text-gold">
                    {vehicle?.category || 'Premium'}
                  </span>
                  <h3 className="text-lg font-display font-bold text-card-foreground mt-1">
                    {vehicle
                      ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
                      : booking.vehicleId}
                  </h3>
                  <p className="text-xs text-muted-foreground font-medium">
                    ₹{booking.dailyRate}/day • {booking.rentalDays} Days Rental
                  </p>
                </div>
              </div>
            </div>

            {/* Itinerary Schedule */}
            <div className="rounded-3xl border border-border/80 dark:border-white/10 bg-card p-6 shadow-md dark:shadow-black/40 space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Rental Schedule & Locations
              </h2>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gold flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase">Pickup</p>
                    <p className="text-sm font-semibold text-foreground">{booking.pickupLocation}</p>
                    <p className="text-xs text-muted-foreground">
                      {formattedPickupDate} at {booking.pickupTime}
                    </p>
                  </div>
                </div>

                <div className="border-l-2 border-dashed border-border ml-2.5 h-6" />

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase">
                      Drop-off / Return
                    </p>
                    <p className="text-sm font-semibold text-foreground">{booking.dropoffLocation}</p>
                    <p className="text-xs text-muted-foreground">
                      {formattedDropoffDate} at {booking.returnTime}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Primary Driver */}
            <div className="rounded-3xl border border-border/80 dark:border-white/10 bg-card p-6 shadow-md dark:shadow-black/40">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Primary Driver Information
              </h2>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground">Full Name:</span>
                  <p className="font-semibold text-foreground">
                    {booking.customerDetails.firstName} {booking.customerDetails.lastName}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Contact Email:</span>
                  <p className="font-semibold text-foreground">{booking.customerDetails.email}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone Number:</span>
                  <p className="font-semibold text-foreground">{booking.customerDetails.phone}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Driver Licence:</span>
                  <p className="font-mono font-bold text-foreground">
                    {booking.customerDetails.licenseNumber}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Financial Summary & Next Steps */}
          <div className="md:col-span-5 space-y-6">
            {/* Price Ledger Card */}
            <div className="rounded-3xl border border-border/80 dark:border-white/10 bg-card p-6 shadow-md dark:shadow-black/40 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Payment Receipt
                </h2>
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold px-2.5 py-0.5">
                  PAID
                </span>
              </div>

              <div className="space-y-2 text-xs border-b border-border pb-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base Rental:</span>
                  <span className="font-semibold text-foreground">₹{booking.baseAmount}</span>
                </div>

                {booking.extrasAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Optional Extras:</span>
                    <span className="font-semibold text-foreground">₹{booking.extrasAmount}</span>
                  </div>
                )}

                {booking.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span>Discount Promo ({booking.promoCode}):</span>
                    <span>-₹{booking.discountAmount}</span>
                  </div>
                )}
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <span className="text-sm font-bold text-foreground">Total Paid:</span>
                <span className="text-2xl font-display font-extrabold text-foreground">
                  ₹{booking.finalAmount}
                </span>
              </div>

              <div className="space-y-1.5 pt-2 text-[10px] font-mono text-muted-foreground border-t border-border">
                <div className="flex justify-between">
                  <span>Booking Record ID:</span>
                  <span className="font-semibold text-foreground">{booking.id}</span>
                </div>
                {booking.razorpayOrderId && (
                  <div className="flex justify-between">
                    <span>Razorpay Order ID:</span>
                    <span>{booking.razorpayOrderId}</span>
                  </div>
                )}
                {booking.razorpayPaymentId && (
                  <div className="flex justify-between">
                    <span>Payment ID:</span>
                    <span>{booking.razorpayPaymentId}</span>
                  </div>
                )}
              </div>
            </div>

            {/* What to Bring on Pickup Day */}
            <div className="rounded-3xl border border-border/80 dark:border-white/10 bg-card p-6 shadow-md dark:shadow-black/40 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                What to bring to the depot
              </h3>
              <ul className="space-y-2 text-xs text-muted-foreground font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  <span>Physical valid Driver Licence</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  <span>Credit Card for pre-authorisation</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  <span>Reservation Number: {booking.bookingNumber}</span>
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="space-y-2.5">
              <Button variant="gold" className="w-full justify-center rounded-full font-bold shadow-md shadow-gold/20" asChild>
                <Link href="/account">
                  <span>Manage in Customer Dashboard</span> <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-center rounded-full font-semibold" asChild>
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" /> <span>Return to Homepage</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

