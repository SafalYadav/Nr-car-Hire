import type {
  SuggestedVehicle,
  PriceSummaryCard,
  AvailabilityCard,
  BookingDraftCard,
} from '@/lib/services/ai-agent-service';

export interface ClientToolMessagePayload {
  id: string;
  role: 'assistant';
  content: string;
  timestamp: string;
  suggestedVehicles?: SuggestedVehicle[];
  priceCard?: PriceSummaryCard;
  availabilityCard?: AvailabilityCard;
  bookingDraft?: BookingDraftCard;
  quickActions?: string[];
}

export interface ClientToolCallbacks {
  onPostMessage?: (payload: ClientToolMessagePayload) => void;
  fetchFn?: typeof fetch;
}

export interface KnownVehicle {
  id: string;
  name: string;
  make: string;
  model: string;
  year: number;
  category: string;
  dailyRate: number;
  location: string;
  imageUrl?: string;
  transmission: string;
  seats: number;
}

export const KNOWN_FLEET: KnownVehicle[] = [
  {
    id: 'v-001-camry',
    name: 'Toyota Camry',
    make: 'Toyota',
    model: 'Camry',
    year: 2024,
    category: 'Sedan',
    dailyRate: 89,
    location: 'Sydney Airport Hub (SYD)',
    imageUrl: '/images/vehicles/toyota-camry.jpg',
    transmission: 'Automatic',
    seats: 5,
  },
  {
    id: 'v-002-cx5',
    name: 'Mazda CX-5',
    make: 'Mazda',
    model: 'CX-5',
    year: 2024,
    category: 'SUV',
    dailyRate: 109,
    location: 'Melbourne Tullamarine (MEL)',
    imageUrl: '/images/vehicles/mazda-cx5.jpg',
    transmission: 'Automatic',
    seats: 5,
  },
  {
    id: 'v-003-3series',
    name: 'BMW 3 Series',
    make: 'BMW',
    model: '3 Series',
    year: 2024,
    category: 'Premium',
    dailyRate: 179,
    location: 'Sydney Airport Hub (SYD)',
    imageUrl: '/images/vehicles/bmw-3series.jpg',
    transmission: 'Automatic',
    seats: 5,
  },
  {
    id: 'v-004-hilux',
    name: 'Toyota HiLux',
    make: 'Toyota',
    model: 'HiLux',
    year: 2024,
    category: 'Utility',
    dailyRate: 129,
    location: 'Brisbane Airport (BNE)',
    imageUrl: '/images/vehicles/toyota-hilux.jpg',
    transmission: 'Manual',
    seats: 5,
  },
  {
    id: 'v-005-cclass',
    name: 'Mercedes-Benz C-Class',
    make: 'Mercedes-Benz',
    model: 'C-Class',
    year: 2024,
    category: 'Luxury',
    dailyRate: 199,
    location: 'Perth International (PER)',
    imageUrl: '/images/vehicles/mercedes-cclass.jpg',
    transmission: 'Automatic',
    seats: 5,
  },
  {
    id: 'v-006-tucson',
    name: 'Hyundai Tucson',
    make: 'Hyundai',
    model: 'Tucson',
    year: 2024,
    category: 'SUV',
    dailyRate: 99,
    location: 'Gold Coast Airport (OOL)',
    imageUrl: '/images/vehicles/hyundai-tucson.jpg',
    transmission: 'Automatic',
    seats: 5,
  },
];

export const KNOWN_EXTRAS = [
  {
    extraId: 'ext-zero-excess',
    code: 'ZERO_EXCESS',
    name: 'Zero Excess Protection',
    pricingType: 'PER_DAY',
    price: 25,
  },
  {
    extraId: 'ext-child-seat',
    code: 'CHILD_SEAT',
    name: 'Child Safety Seat',
    pricingType: 'PER_DAY',
    price: 12,
  },
  {
    extraId: 'ext-add-driver',
    code: 'ADD_DRIVER',
    name: 'Additional Driver',
    pricingType: 'FLAT',
    price: 15,
  },
  {
    extraId: 'ext-gps',
    code: 'GPS_NAV',
    name: 'GPS Satellite Navigation',
    pricingType: 'PER_DAY',
    price: 10,
  },
  {
    extraId: 'ext-roadside-plus',
    code: 'ROADSIDE_PLUS',
    name: '24/7 Roadside Assistance Plus',
    pricingType: 'PER_DAY',
    price: 8,
  },
];

/**
 * Resolves a vehicle query to a fleet vehicle.
 */
export function resolveVehicleClient(query: string): KnownVehicle | null {
  if (!query) return null;
  const q = query.toLowerCase().trim();

  // ID direct match
  const byId = KNOWN_FLEET.find((v) => v.id.toLowerCase() === q);
  if (byId) return byId;

  // Make + Model exact / partial match
  for (const v of KNOWN_FLEET) {
    const full = `${v.make} ${v.model}`.toLowerCase();
    const model = v.model.toLowerCase();
    if (q.includes(full) || q.includes(model) || full.includes(q)) {
      return v;
    }
  }

  // Model-specific slang / typos
  if (q.includes('hilux') || q.includes('hilx') || q.includes('ute') || q.includes('truck')) {
    return KNOWN_FLEET.find((v) => v.id === 'v-004-hilux') || null;
  }
  if (q.includes('camry') || q.includes('camri') || q.includes('toyota')) {
    return KNOWN_FLEET.find((v) => v.id === 'v-001-camry') || null;
  }
  if (q.includes('tucson') || q.includes('tuscon') || q.includes('hyundai')) {
    return KNOWN_FLEET.find((v) => v.id === 'v-006-tucson') || null;
  }
  if (q.includes('cx5') || q.includes('cx-5') || q.includes('mazda')) {
    return KNOWN_FLEET.find((v) => v.id === 'v-002-cx5') || null;
  }
  if (q.includes('3 series') || q.includes('3series') || q.includes('bmw')) {
    return KNOWN_FLEET.find((v) => v.id === 'v-003-3series') || null;
  }
  if (q.includes('c class') || q.includes('c-class') || q.includes('mercedes') || q.includes('merc')) {
    return KNOWN_FLEET.find((v) => v.id === 'v-005-cclass') || null;
  }

  return null;
}

/**
 * Parse extras input from string, array, or codes.
 */
export function parseExtrasClient(rawExtras: unknown): Array<{
  extraId: string;
  code: string;
  name: string;
  pricingType: string;
  price: number;
  quantity: number;
}> {
  if (!rawExtras) return [];

  let items: string[] = [];
  if (Array.isArray(rawExtras)) {
    items = rawExtras.map(String);
  } else if (typeof rawExtras === 'string') {
    items = rawExtras.split(',').map((s) => s.trim());
  }

  const results: Array<{
    extraId: string;
    code: string;
    name: string;
    pricingType: string;
    price: number;
    quantity: number;
  }> = [];

  for (const item of items) {
    const norm = item.toLowerCase();
    let found = KNOWN_EXTRAS.find((e) => e.extraId.toLowerCase() === norm || e.code.toLowerCase() === norm);
    if (!found) {
      if (norm.includes('excess') || norm.includes('protection') || norm.includes('zero')) {
        found = KNOWN_EXTRAS.find((e) => e.extraId === 'ext-zero-excess');
      } else if (norm.includes('child') || norm.includes('seat') || norm.includes('baby') || norm.includes('booster')) {
        found = KNOWN_EXTRAS.find((e) => e.extraId === 'ext-child-seat');
      } else if (norm.includes('driver') || norm.includes('additional')) {
        found = KNOWN_EXTRAS.find((e) => e.extraId === 'ext-add-driver');
      } else if (norm.includes('gps') || norm.includes('nav')) {
        found = KNOWN_EXTRAS.find((e) => e.extraId === 'ext-gps');
      } else if (norm.includes('roadside') || norm.includes('breakdown') || norm.includes('plus')) {
        found = KNOWN_EXTRAS.find((e) => e.extraId === 'ext-roadside-plus');
      }
    }

    if (found && !results.some((r) => r.extraId === found!.extraId)) {
      results.push({
        extraId: found.extraId,
        code: found.code,
        name: found.name,
        pricingType: found.pricingType,
        price: found.price,
        quantity: 1,
      });
    }
  }

  return results;
}

/**
 * Creates the 5 official ElevenLabs Client Tool handlers.
 */
export function createElevenLabsClientTools(callbacks: ClientToolCallbacks = {}) {
  const activeFetch = callbacks.fetchFn || (typeof window !== 'undefined' ? window.fetch.bind(window) : fetch);

  return {
    /**
     * 1. check_car_availability
     */
    check_car_availability: async (params: Record<string, unknown> = {}): Promise<string> => {
      try {
        const rawVehicle = String(
          params.vehicle_name || params.vehicleIdOrName || params.vehicle || params.vehicle_id || ''
        ).trim();
        const rawPickup = String(params.pickup_date || params.pickupDate || params.pickup || '').trim();
        const rawDropoff = String(params.dropoff_date || params.dropoffDate || params.dropoff || '').trim();

        if (!rawVehicle) {
          return 'Please specify which vehicle in the NR Car Hire fleet you would like to check.';
        }

        const vehicle = resolveVehicleClient(rawVehicle);
        if (!vehicle) {
          return `Vehicle "${rawVehicle}" was not found in our fleet. We offer the Toyota Camry, Mazda CX-5, BMW 3 Series, Toyota HiLux, Mercedes-Benz C-Class, and Hyundai Tucson.`;
        }

        const pickupDate = rawPickup || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];
        const dropoffDate = rawDropoff || new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0];

        const res = await activeFetch(
          `/api/vehicles/${vehicle.id}/availability?pickupDate=${encodeURIComponent(pickupDate)}&dropoffDate=${encodeURIComponent(dropoffDate)}`
        );

        const data = await res.json();
        const vehicleFullName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

        if (!data.success) {
          const reason = data.error || 'Vehicle is unavailable for selected dates';
          callbacks.onPostMessage?.({
            id: `avail-${Date.now()}`,
            role: 'assistant',
            content: `Live Availability: ${vehicleFullName} is unavailable for selected dates.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            availabilityCard: {
              vehicleId: vehicle.id,
              vehicleName: vehicleFullName,
              pickupDate,
              dropoffDate,
              isAvailable: false,
              reason,
            },
          });
          return `The ${vehicleFullName} is unavailable from ${pickupDate} to ${dropoffDate} because: ${reason}. Please offer the customer different travel dates or similar vehicles in our fleet.`;
        }

        const avail = data.data;
        const bookingUrl = `/book/${vehicle.id}?pickupDate=${pickupDate}&dropoffDate=${dropoffDate}`;

        callbacks.onPostMessage?.({
          id: `avail-${Date.now()}`,
          role: 'assistant',
          content: `Live Availability: ${vehicleFullName} is available for hire.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          availabilityCard: {
            vehicleId: vehicle.id,
            vehicleName: vehicleFullName,
            pickupDate,
            dropoffDate,
            isAvailable: avail.isAvailable,
            reason: avail.reason,
            dailyRate: avail.dailyRate || vehicle.dailyRate,
            rentalDays: avail.totalDays || 3,
            estimatedTotal: avail.estimatedTotal || vehicle.dailyRate * 3,
            bookingUrl: avail.isAvailable ? bookingUrl : undefined,
          },
        });

        if (avail.isAvailable) {
          return `Yes, the ${vehicleFullName} is available from ${pickupDate} to ${dropoffDate} at ${avail.dailyRate || vehicle.dailyRate} rupees per day. Estimated total for ${avail.totalDays || 3} days is ${avail.estimatedTotal || vehicle.dailyRate * 3} rupees. An availability card with a direct booking button has been displayed on the customer's screen.`;
        } else {
          return `The ${vehicleFullName} is unavailable from ${pickupDate} to ${dropoffDate} because: ${avail.reason || 'scheduled maintenance or existing booking'}. Please offer the customer different dates or similar vehicles.`;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Availability service error';
        return `Unable to verify availability right now: ${msg}. Please ask the customer to retry in a moment.`;
      }
    },

    /**
     * 2. calculate_rental_price
     */
    calculate_rental_price: async (params: Record<string, unknown> = {}): Promise<string> => {
      try {
        const rawVehicle = String(
          params.vehicle_name || params.vehicleIdOrName || params.vehicle || params.vehicle_id || ''
        ).trim();
        const rawPickup = String(params.pickup_date || params.pickupDate || '').trim();
        const rawDropoff = String(params.dropoff_date || params.dropoffDate || '').trim();
        const promoCode =
          String(params.promo_code || params.promoCode || params.promo || '').trim().toUpperCase() || undefined;
        const rawExtras = params.extras || params.extra_ids || params.extraIds;

        const vehicle = resolveVehicleClient(rawVehicle) || KNOWN_FLEET[0];
        const pickupDate = rawPickup || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];
        const dropoffDate = rawDropoff || new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0];

        const selectedExtras = parseExtrasClient(rawExtras);

        const res = await activeFetch('/api/bookings/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vehicleId: vehicle.id,
            pickupLocation: vehicle.location,
            dropoffLocation: vehicle.location,
            pickupDate,
            dropoffDate,
            selectedExtras,
            promoCode,
          }),
        });

        const data = await res.json();
        if (!data.success || !data.data) {
          return `Could not calculate price quote: ${data.error || 'Invalid calculation parameters'}.`;
        }

        const quote = data.data;
        const vehicleFullName = `${quote.vehicle.year} ${quote.vehicle.make} ${quote.vehicle.model}`;

        callbacks.onPostMessage?.({
          id: `price-${Date.now()}`,
          role: 'assistant',
          content: `Authoritative Price Quote: ${vehicleFullName} — ₹${quote.finalAmount} INR.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          priceCard: {
            vehicleId: vehicle.id,
            vehicleName: vehicleFullName,
            pickupDate: String(quote.pickupDate).split('T')[0],
            dropoffDate: String(quote.dropoffDate).split('T')[0],
            rentalDays: quote.rentalDays,
            dailyRate: quote.dailyRate,
            baseAmount: quote.baseAmount,
            extrasAmount: quote.extrasAmount,
            discountAmount: quote.discountAmount,
            taxAmount: quote.taxAmount,
            finalAmount: quote.finalAmount,
            currency: 'INR',
            promoCode: quote.promoApplied?.code,
          },
        });

        return `Authoritative Price Quote: Base rate for ${quote.rentalDays} days is ${quote.baseAmount} rupees (${quote.dailyRate} rupees per day). Extras total ${quote.extrasAmount} rupees. ${quote.discountAmount > 0 ? `Promo discount: -${quote.discountAmount} rupees (${quote.promoApplied?.code}). ` : ''}Total payable is ${quote.finalAmount} rupees. A price quote breakdown is displayed on the customer's screen.`;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Pricing service error';
        return `Unable to calculate rental quote: ${msg}.`;
      }
    },

    /**
     * 3. create_booking_draft
     */
    create_booking_draft: async (params: Record<string, unknown> = {}): Promise<string> => {
      try {
        const rawVehicle = String(
          params.vehicle_name || params.vehicleIdOrName || params.vehicle || params.vehicle_id || ''
        ).trim();
        const rawPickup = String(params.pickup_date || params.pickupDate || '').trim();
        const rawDropoff = String(params.dropoff_date || params.dropoffDate || '').trim();
        const pickupLocation = String(params.pickup_location || params.pickupLocation || '').trim();
        const dropoffLocation = String(params.dropoff_location || params.dropoffLocation || '').trim();
        const promoCode =
          String(params.promo_code || params.promoCode || params.promo || '').trim().toUpperCase() || undefined;
        const rawExtras = params.extras || params.extra_ids || params.extraIds;

        const vehicle = resolveVehicleClient(rawVehicle) || KNOWN_FLEET[0];
        const pickupDate = rawPickup || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];
        const dropoffDate = rawDropoff || new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0];
        const pLoc = pickupLocation || vehicle.location || 'Sydney Airport Hub (SYD)';
        const dLoc = dropoffLocation || pLoc;

        const selectedExtras = parseExtrasClient(rawExtras);

        const res = await activeFetch('/api/bookings/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vehicleId: vehicle.id,
            pickupLocation: pLoc,
            dropoffLocation: dLoc,
            pickupDate,
            dropoffDate,
            selectedExtras,
            promoCode,
          }),
        });

        const data = await res.json();
        if (!data.success || !data.data) {
          return `Cannot create booking draft: ${data.error || 'Vehicle is not available for these dates'}.`;
        }

        const quote = data.data;
        const vehicleFullName = `${quote.vehicle.year} ${quote.vehicle.make} ${quote.vehicle.model}`;

        const queryParams = new URLSearchParams({
          pickupDate,
          dropoffDate,
          pickupLocation: pLoc,
          dropoffLocation: dLoc,
        });
        if (promoCode) queryParams.set('promo', promoCode);
        if (selectedExtras.length > 0) {
          queryParams.set('extras', selectedExtras.map((e) => e.extraId).join(','));
        }

        const bookingUrl = `/book/${vehicle.id}?${queryParams.toString()}`;

        callbacks.onPostMessage?.({
          id: `draft-${Date.now()}`,
          role: 'assistant',
          content: `Booking draft created for ${vehicleFullName}. Total: ₹${quote.finalAmount} INR. Click "Proceed to Secure Payment" to finalize.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          bookingDraft: {
            vehicleId: vehicle.id,
            vehicleName: vehicleFullName,
            pickupDate,
            dropoffDate,
            pickupLocation: pLoc,
            dropoffLocation: dLoc,
            estimatedTotal: quote.finalAmount,
            currency: 'INR',
            bookingUrl,
          },
          priceCard: {
            vehicleId: vehicle.id,
            vehicleName: vehicleFullName,
            pickupDate,
            dropoffDate,
            rentalDays: quote.rentalDays,
            dailyRate: quote.dailyRate,
            baseAmount: quote.baseAmount,
            extrasAmount: quote.extrasAmount,
            discountAmount: quote.discountAmount,
            taxAmount: quote.taxAmount,
            finalAmount: quote.finalAmount,
            currency: 'INR',
            promoCode: quote.promoApplied?.code,
          },
        });

        return `Booking draft prepared for ${vehicleFullName} from ${pickupDate} to ${dropoffDate}. Total amount is ${quote.finalAmount} rupees. A 'Proceed to Secure Payment' button has been presented on the customer's screen for them to finalize checkout with Razorpay.`;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Booking draft error';
        return `Error creating booking draft: ${msg}.`;
      }
    },

    /**
     * 4. generate_checkout_action
     */
    generate_checkout_action: async (params: Record<string, unknown> = {}): Promise<string> => {
      try {
        const rawVehicle = String(
          params.vehicle_name || params.vehicleIdOrName || params.vehicle || params.vehicle_id || ''
        ).trim();
        const rawPickup = String(params.pickup_date || params.pickupDate || '').trim();
        const rawDropoff = String(params.dropoff_date || params.dropoffDate || '').trim();
        const promoCode =
          String(params.promo_code || params.promoCode || params.promo || '').trim().toUpperCase() || undefined;
        const rawExtras = params.extras || params.extra_ids || params.extraIds;

        const vehicle = resolveVehicleClient(rawVehicle) || KNOWN_FLEET[0];
        const pickupDate = rawPickup || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];
        const dropoffDate = rawDropoff || new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0];
        const selectedExtras = parseExtrasClient(rawExtras);

        const queryParams = new URLSearchParams({
          pickupDate,
          dropoffDate,
        });
        if (promoCode) queryParams.set('promo', promoCode);
        if (selectedExtras.length > 0) {
          queryParams.set('extras', selectedExtras.map((e) => e.extraId).join(','));
        }

        const bookingUrl = `/book/${vehicle.id}?${queryParams.toString()}`;
        const vehicleFullName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

        const diffMs = new Date(dropoffDate).getTime() - new Date(pickupDate).getTime();
        const rentalDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        const estimatedTotal = rentalDays * vehicle.dailyRate;

        callbacks.onPostMessage?.({
          id: `checkout-${Date.now()}`,
          role: 'assistant',
          content: `Checkout action ready for ${vehicleFullName}. Click "Proceed to Secure Payment" below.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          bookingDraft: {
            vehicleId: vehicle.id,
            vehicleName: vehicleFullName,
            pickupDate,
            dropoffDate,
            pickupLocation: vehicle.location,
            dropoffLocation: vehicle.location,
            estimatedTotal,
            currency: 'INR',
            bookingUrl,
          },
        });

        return `A direct checkout action for the ${vehicle.make} ${vehicle.model} has been presented on screen with a 'Proceed to Secure Payment' button. Please invite the customer to click the button to complete payment with Razorpay.`;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Checkout generation error';
        return `Error generating checkout action: ${msg}.`;
      }
    },

    /**
     * 5. lookup_booking_status
     */
    lookup_booking_status: async (params: Record<string, unknown> = {}): Promise<string> => {
      try {
        const rawBookingId = String(
          params.booking_number || params.bookingNumber || params.booking_id || params.bookingId || ''
        ).trim();

        if (!rawBookingId) {
          return 'Please provide the booking reference number (for example, NR-2026-XXXXX or your booking ID).';
        }

        const res = await activeFetch(`/api/bookings/${encodeURIComponent(rawBookingId)}`);
        const data = await res.json();

        if (!data.success || !data.data) {
          return `No booking found for reference "${rawBookingId}". Please verify the booking reference number with the customer.`;
        }

        const booking = data.data;
        const pickupFormatted = String(booking.pickupDate || '').split('T')[0];
        const dropoffFormatted = String(booking.dropoffDate || '').split('T')[0];

        callbacks.onPostMessage?.({
          id: `bkstatus-${Date.now()}`,
          role: 'assistant',
          content: `Booking Reference: ${booking.bookingNumber}\n• Status: ${booking.status}\n• Payment: ${booking.paymentStatus}\n• Dates: ${pickupFormatted} to ${dropoffFormatted}\n• Amount: ₹${booking.finalAmount} INR`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });

        return `Booking reference ${booking.bookingNumber} is currently ${booking.status} with payment status ${booking.paymentStatus}. Rental vehicle is ${booking.vehicleId} from ${pickupFormatted} to ${dropoffFormatted}, total amount ${booking.finalAmount} rupees.`;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Lookup error';
        return `Error looking up booking reference: ${msg}.`;
      }
    },
  };
}
