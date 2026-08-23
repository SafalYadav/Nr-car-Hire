import { bookingStore, type BookingRecord, type BookingListResult } from '@/lib/db/booking-store';
import { vehicleStore } from '@/lib/db/vehicle-store';
import { inventoryService } from '@/lib/services/inventory-service';
import { discountService } from '@/lib/services/discount-service';
import { extraService } from '@/lib/services/extra-service';
import { paymentService } from '@/lib/services/payment-service';
import { auditStore } from '@/lib/db/audit-store';
import {
  CalculateQuoteSchema,
  CreateBookingSchema,
  CancelBookingSchema,
  type CalculateQuoteInput,
  type CreateBookingInput,
  type CancelBookingInput,
  type BookingQueryParams,
} from '@/lib/validation/booking';
import { NotFoundError, AppError, ForbiddenError } from '@/lib/utils/errors';
import { logger } from '@/lib/utils/logger';

export interface BookingQuoteResult {
  vehicle: {
    id: string;
    make: string;
    model: string;
    year: number;
    category: string;
    dailyRate: number;
    imageUrl: string | null;
  };
  pickupDate: string;
  dropoffDate: string;
  pickupLocation: string;
  dropoffLocation: string;
  rentalDays: number;
  dailyRate: number;
  baseAmount: number;
  extrasAmount: number;
  discountAmount: number;
  taxAmount: number;
  finalAmount: number;
  currency: string;
  promoApplied?: {
    code: string;
    discountType: string;
    value: number;
    discountAmount: number;
  };
  selectedExtras: Array<{
    extraId: string;
    name: string;
    price: number;
    pricingType: string;
    quantity: number;
    total: number;
  }>;
}

export interface BookingCreationResult {
  booking: BookingRecord;
  paymentOrder: {
    orderId: string;
    amount: number; // in paise
    amountMajor: number; // in INR
    currency: string;
    keyId: string;
  };
}

export class BookingService {
  /**
   * Authoritatively calculate a booking quote with base price, extras, taxes, and promotional discounts.
   */
  public async calculateQuote(input: CalculateQuoteInput): Promise<BookingQuoteResult> {
    const validated = CalculateQuoteSchema.parse(input);

    const vehicle = await vehicleStore.findById(validated.vehicleId);
    if (!vehicle || !vehicle.isActive) {
      throw new NotFoundError(
        `Vehicle with ID "${validated.vehicleId}" was not found or is inactive`,
      );
    }

    // Availability Check
    const availability = await inventoryService.checkAvailability(
      validated.vehicleId,
      validated.pickupDate,
      validated.dropoffDate,
    );

    if (!availability.isAvailable) {
      throw new AppError(
        `Vehicle is unavailable for the selected dates: ${availability.reason}`,
        409,
      );
    }

    const diffMs = validated.dropoffDate.getTime() - validated.pickupDate.getTime();
    const rentalDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    const dailyRate = vehicle.dailyRate;
    const baseAmount = Math.round(rentalDays * dailyRate * 100) / 100;

    // Calculate Extras
    const extrasCalc = await extraService.calculateExtras(validated.selectedExtras, rentalDays);
    const extrasAmount = extrasCalc.totalExtrasAmount;

    // Calculate Promo Discount
    let discountAmount = 0;
    let promoApplied: BookingQuoteResult['promoApplied'];

    if (validated.promoCode) {
      const promoResult = await discountService.validatePromo({
        code: validated.promoCode,
        vehicleId: vehicle.id,
        category: vehicle.category,
        rentalDays,
        baseAmount,
        customerId: validated.customerId,
      });

      if (promoResult.isValid) {
        discountAmount = promoResult.discountAmount;
        promoApplied = {
          code: promoResult.code,
          discountType: promoResult.discountType,
          value: promoResult.value,
          discountAmount,
        };
      }
    }

    const taxAmount = 0; // GST included in dailyRate
    const finalAmount = Math.max(
      0,
      Math.round((baseAmount + extrasAmount - discountAmount + taxAmount) * 100) / 100,
    );

    const formattedExtras = extrasCalc.items.map((item) => ({
      extraId: item.extraId,
      name: item.name,
      price: item.price,
      pricingType: item.pricingType,
      quantity: item.quantity,
      total:
        item.pricingType === 'PER_DAY'
          ? item.price * item.quantity * rentalDays
          : item.price * item.quantity,
    }));

    return {
      vehicle: {
        id: vehicle.id,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        category: vehicle.category,
        dailyRate: vehicle.dailyRate,
        imageUrl: vehicle.imageUrl ?? null,
      },
      pickupDate: validated.pickupDate.toISOString(),
      dropoffDate: validated.dropoffDate.toISOString(),
      pickupLocation: validated.pickupLocation,
      dropoffLocation: validated.dropoffLocation,
      rentalDays,
      dailyRate,
      baseAmount,
      extrasAmount,
      discountAmount,
      taxAmount,
      finalAmount,
      currency: 'INR',
      promoApplied,
      selectedExtras: formattedExtras,
    };
  }

  /**
   * Create an authoritative booking record in PAYMENT_PENDING status and initialize Razorpay Order
   */
  public async createBooking(input: CreateBookingInput): Promise<BookingCreationResult> {
    const validated = CreateBookingSchema.parse(input);

    // Calculate authoritative quote
    const quote = await this.calculateQuote({
      vehicleId: validated.vehicleId,
      pickupLocation: validated.pickupLocation,
      dropoffLocation: validated.dropoffLocation,
      pickupDate: validated.pickupDate,
      dropoffDate: validated.dropoffDate,
      pickupTime: validated.pickupTime,
      returnTime: validated.returnTime,
      selectedExtras: validated.selectedExtras,
      promoCode: validated.promoCode,
      customerId: validated.userId || validated.customer.email,
    });

    const userId =
      validated.userId ||
      `guest-${validated.customer.email.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

    // Create server-side Razorpay Order via PaymentService
    const paymentOrder = await paymentService.createOrder({
      vehicleId: validated.vehicleId,
      pickupDate: validated.pickupDate,
      dropoffDate: validated.dropoffDate,
      amount: quote.finalAmount,
      currency: validated.currency || 'INR',
      customer: {
        name: `${validated.customer.firstName} ${validated.customer.lastName}`,
        email: validated.customer.email,
        phone: validated.customer.phone,
      },
    });

    // Save booking with PAYMENT_PENDING status
    const booking = await bookingStore.create({
      userId,
      vehicleId: validated.vehicleId,
      pickupLocation: validated.pickupLocation,
      dropoffLocation: validated.dropoffLocation,
      pickupDate: validated.pickupDate,
      dropoffDate: validated.dropoffDate,
      pickupTime: validated.pickupTime,
      returnTime: validated.returnTime,
      rentalDays: quote.rentalDays,
      dailyRate: quote.dailyRate,
      baseAmount: quote.baseAmount,
      extrasAmount: quote.extrasAmount,
      discountAmount: quote.discountAmount,
      taxAmount: quote.taxAmount,
      finalAmount: quote.finalAmount,
      currency: quote.currency,
      promoCode: validated.promoCode?.toUpperCase(),
      customerDetails: validated.customer,
      extras: validated.selectedExtras,
      status: 'PAYMENT_PENDING',
      paymentStatus: 'PENDING',
      razorpayOrderId: paymentOrder.orderId,
    });

    logger.info(
      `Booking created: ${booking.bookingNumber} (${booking.id}) in PAYMENT_PENDING status`,
    );

    return {
      booking,
      paymentOrder: {
        orderId: paymentOrder.orderId,
        amount: Math.round(quote.finalAmount * 100), // authoritative minor units (paise)
        amountMajor: quote.finalAmount,
        currency: quote.currency,
        keyId: paymentOrder.keyId,
      },
    };
  }

  /**
   * Confirm booking upon verified Razorpay payment
   */
  public async confirmBookingPayment(
    razorpayOrderId: string,
    razorpayPaymentId: string,
  ): Promise<BookingRecord> {
    const booking = await bookingStore.findByRazorpayOrderId(razorpayOrderId);
    if (!booking) {
      throw new NotFoundError(`No booking associated with Razorpay Order ID "${razorpayOrderId}"`);
    }

    // Atomic double-booking concurrency check before final confirmation
    try {
      await inventoryService.reserveWithConcurrencyCheck({
        id: booking.id,
        vehicleId: booking.vehicleId,
        pickupDate: new Date(booking.pickupDate),
        dropoffDate: new Date(booking.dropoffDate),
      });
    } catch (err: unknown) {
      logger.error(`Double-booking prevented for booking ${booking.bookingNumber}`);
      await bookingStore.updateStatus(booking.id, 'CANCELLED', 'FAILED');
      const msg = err instanceof Error ? err.message : 'Vehicle is no longer available';
      throw new AppError(`Vehicle is no longer available: ${msg}`, 409);
    }

    // Update status to CONFIRMED and payment to PAID
    const confirmed = await bookingStore.updateStatus(
      booking.id,
      'CONFIRMED',
      'PAID',
      razorpayPaymentId,
    );

    if (!confirmed) {
      throw new AppError('Failed to confirm booking record', 500);
    }

    // If promo code was used, increment its usage count
    if (booking.promoCode) {
      await discountService.applyPromoUsage(booking.promoCode);
    }

    // Audit log
    await auditStore.create({
      adminId: 'system-payment-gateway',
      action: 'BOOKING_CONFIRMED',
      entity: 'Booking',
      entityId: confirmed.id,
      details: {
        bookingNumber: confirmed.bookingNumber,
        vehicleId: confirmed.vehicleId,
        finalAmount: confirmed.finalAmount,
        razorpayPaymentId,
      },
    });

    logger.info(
      `Booking confirmed successfully: ${confirmed.bookingNumber} for vehicle ${confirmed.vehicleId}`,
    );

    return confirmed;
  }

  /**
   * Cancel booking (customer or admin)
   */
  public async cancelBooking(
    bookingId: string,
    input: CancelBookingInput,
    userContext?: { userId: string; role: string },
  ): Promise<BookingRecord> {
    const validated = CancelBookingSchema.parse(input);
    const booking = await bookingStore.findById(bookingId);

    if (!booking) {
      throw new NotFoundError(`Booking with ID "${bookingId}" was not found`);
    }

    // IDOR Protection: Customers can only cancel their own bookings
    if (userContext && userContext.role !== 'ADMIN') {
      if (
        booking.userId !== userContext.userId &&
        booking.customerDetails.email.toLowerCase() !== userContext.userId.toLowerCase()
      ) {
        throw new ForbiddenError('You are not authorized to cancel this booking');
      }
    }

    if (booking.status === 'CANCELLED') {
      throw new AppError('Booking is already cancelled', 400);
    }

    const cancelled = await bookingStore.cancel(booking.id, validated.reason);
    if (!cancelled) throw new AppError('Failed to cancel booking', 500);

    // Audit log
    await auditStore.create({
      adminId: userContext?.userId || 'customer-action',
      action: 'BOOKING_CANCELLED',
      entity: 'Booking',
      entityId: booking.id,
      details: {
        bookingNumber: booking.bookingNumber,
        reason: validated.reason,
      },
    });

    logger.info(`Booking cancelled: ${booking.bookingNumber}. Reason: ${validated.reason}`);

    return cancelled;
  }

  /**
   * Get single booking with strict IDOR access control
   */
  public async getBookingById(
    bookingId: string,
    userContext?: { userId: string; role: string },
  ): Promise<BookingRecord> {
    let booking = await bookingStore.findById(bookingId);
    if (!booking) {
      booking = await bookingStore.findByBookingNumber(bookingId);
    }

    if (!booking) {
      throw new NotFoundError(`Booking with ID or Number "${bookingId}" was not found`);
    }

    // IDOR Protection: customer can only read their own booking
    if (userContext && userContext.role !== 'ADMIN') {
      const isOwner =
        booking.userId === userContext.userId ||
        booking.customerDetails.email.toLowerCase() === userContext.userId.toLowerCase();
      if (!isOwner) {
        throw new ForbiddenError('You do not have permission to view this booking');
      }
    }

    return booking;
  }

  /**
   * List customer bookings
   */
  public async listUserBookings(userId: string): Promise<BookingRecord[]> {
    return bookingStore.listByUser(userId);
  }

  /**
   * List bookings for Admin
   */
  public async listAdminBookings(params: BookingQueryParams): Promise<BookingListResult> {
    return bookingStore.listAdmin(params);
  }
}

export const bookingService = new BookingService();
