import { aiAgentService } from '@/lib/services/ai-agent-service';
import { bookingService } from '@/lib/services/booking-service';

/**
 * 1. Check Car Availability for specified travel dates
 */
export async function checkCarAvailability(params: {
  vehicleIdOrName: string;
  pickupDate: string;
  dropoffDate: string;
}) {
  return aiAgentService.checkAvailability(params);
}

/**
 * 2. Get Car Details and Specifications
 */
export async function getCarDetails(vehicleIdOrName: string) {
  return aiAgentService.getVehicleDetails(vehicleIdOrName);
}

/**
 * 3. Create Booking Draft for customer checkout handoff
 */
export async function createCarBookingDraft(params: {
  vehicleIdOrName: string;
  pickupDate: string;
  dropoffDate: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  extraIds?: string[];
  promoCode?: string;
}) {
  return aiAgentService.createBookingDraft(params);
}

/**
 * 4. Get Customer Booking Status
 */
export async function getCarBookingStatus(bookingId: string) {
  try {
    const booking = await bookingService.getBookingById(bookingId);
    return {
      success: true,
      data: {
        bookingId: booking.id,
        bookingNumber: booking.bookingNumber,
        vehicleId: booking.vehicleId,
        pickupLocation: booking.pickupLocation,
        dropoffLocation: booking.dropoffLocation,
        pickupDate: booking.pickupDate,
        dropoffDate: booking.dropoffDate,
        rentalDays: booking.rentalDays,
        finalAmount: booking.finalAmount,
        currency: booking.currency,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Booking not found';
    return { success: false, error: message };
  }
}

/**
 * 5. Calculate Rental Price with optional extras and promo discounts
 */
export async function calculateCarRentalPricing(params: {
  vehicleIdOrName: string;
  pickupDate: string;
  dropoffDate: string;
  extraIds?: string[];
  promoCode?: string;
}) {
  return aiAgentService.calculateRentalPrice(params);
}

/**
 * 6. Generate Direct Payment / Booking Checkout Link
 */
export async function generateBookingCheckoutLink(params: {
  vehicleId: string;
  pickupDate: string;
  dropoffDate: string;
  promoCode?: string;
  extraIds?: string[];
}) {
  const query = new URLSearchParams({
    pickupDate: params.pickupDate,
    dropoffDate: params.dropoffDate,
  });
  if (params.promoCode) query.set('promo', params.promoCode);
  if (params.extraIds && params.extraIds.length > 0) {
    query.set('extras', params.extraIds.join(','));
  }

  const bookingUrl = `/book/${params.vehicleId}?${query.toString()}`;
  return {
    bookingUrl,
    fullUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${bookingUrl}`,
  };
}
