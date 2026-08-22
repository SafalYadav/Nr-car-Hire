import { describe, it, expect, beforeEach } from 'vitest';
import { bookingService } from '@/lib/services/booking-service';
import { bookingStore } from '@/lib/db/booking-store';
import { vehicleStore } from '@/lib/db/vehicle-store';
import { discountStore } from '@/lib/db/discount-store';
import { extraStore } from '@/lib/db/extra-store';
import { paymentStore } from '@/lib/db/payment-store';
import { auditStore } from '@/lib/db/audit-store';

describe('BookingService & Production Booking Ecosystem', () => {
  beforeEach(() => {
    bookingStore.reset();
    vehicleStore.reset();
    discountStore.reset();
    extraStore.reset();
    paymentStore.reset();
    auditStore.reset();
  });

  const vehicleId = 'v-001-camry'; // ₹89/day

  describe('1. Authoritative Quote Calculation', () => {
    it('calculates standard 3-day rental base price (3 * ₹89 = ₹267 INR)', async () => {
      const quote = await bookingService.calculateQuote({
        vehicleId,
        pickupLocation: 'Sydney Airport Hub (SYD)',
        dropoffLocation: 'Sydney Airport Hub (SYD)',
        pickupDate: new Date('2026-10-01T10:00:00Z'),
        dropoffDate: new Date('2026-10-04T10:00:00Z'),
      });

      expect(quote.rentalDays).toBe(3);
      expect(quote.dailyRate).toBe(89);
      expect(quote.baseAmount).toBe(267);
      expect(quote.extrasAmount).toBe(0);
      expect(quote.discountAmount).toBe(0);
      expect(quote.finalAmount).toBe(267);
      expect(quote.currency).toBe('INR');
    });

    it('accurately includes optional extras (Zero Excess ₹25/day * 3 = ₹75)', async () => {
      const quote = await bookingService.calculateQuote({
        vehicleId,
        pickupLocation: 'Sydney Airport Hub (SYD)',
        dropoffLocation: 'Sydney Airport Hub (SYD)',
        pickupDate: new Date('2026-10-01T10:00:00Z'),
        dropoffDate: new Date('2026-10-04T10:00:00Z'),
        selectedExtras: [
          {
            extraId: 'ext-zero-excess',
            code: 'ZERO_EXCESS',
            name: 'Zero Excess',
            pricingType: 'PER_DAY',
            price: 25,
            quantity: 1,
          },
        ],
      });

      expect(quote.baseAmount).toBe(267);
      expect(quote.extrasAmount).toBe(75);
      expect(quote.finalAmount).toBe(342); // 267 + 75
      expect(quote.selectedExtras).toHaveLength(1);
      expect(quote.selectedExtras[0].total).toBe(75);
    });

    it('accurately applies percentage discount promo SAVE10 (10% off ₹267 = ₹26.70)', async () => {
      const quote = await bookingService.calculateQuote({
        vehicleId,
        pickupLocation: 'Sydney Airport Hub (SYD)',
        dropoffLocation: 'Sydney Airport Hub (SYD)',
        pickupDate: new Date('2026-10-01T10:00:00Z'),
        dropoffDate: new Date('2026-10-04T10:00:00Z'),
        promoCode: 'SAVE10',
      });

      expect(quote.baseAmount).toBe(267);
      expect(quote.discountAmount).toBe(26.7);
      expect(quote.finalAmount).toBe(240.3);
      expect(quote.promoApplied?.code).toBe('SAVE10');
    });

    it('rejects quotes with invalid date order (dropoff before pickup)', async () => {
      await expect(
        bookingService.calculateQuote({
          vehicleId,
          pickupLocation: 'Sydney Airport Hub (SYD)',
          dropoffLocation: 'Sydney Airport Hub (SYD)',
          pickupDate: new Date('2026-10-04T10:00:00Z'),
          dropoffDate: new Date('2026-10-01T10:00:00Z'),
        }),
      ).rejects.toThrow();
    });

    it('rejects quotes when dates overlap with scheduled maintenance', async () => {
      await vehicleStore.addMaintenanceBlock(
        vehicleId,
        new Date('2026-10-05T00:00:00Z'),
        new Date('2026-10-08T23:59:59Z'),
        'MAINTENANCE',
        'Brake rotor replacement',
      );

      await expect(
        bookingService.calculateQuote({
          vehicleId,
          pickupLocation: 'Sydney Airport Hub (SYD)',
          dropoffLocation: 'Sydney Airport Hub (SYD)',
          pickupDate: new Date('2026-10-06T10:00:00Z'),
          dropoffDate: new Date('2026-10-09T10:00:00Z'),
        }),
      ).rejects.toThrow(/unavailable for the selected dates/);
    });

    it('rejects booking creation when dates overlap with scheduled maintenance', async () => {
      await vehicleStore.addMaintenanceBlock(
        vehicleId,
        new Date('2026-10-05T00:00:00Z'),
        new Date('2026-10-08T23:59:59Z'),
        'MAINTENANCE',
        'Brake rotor replacement',
      );

      await expect(
        bookingService.createBooking({
          vehicleId,
          pickupLocation: 'Sydney Airport Hub (SYD)',
          dropoffLocation: 'Sydney Airport Hub (SYD)',
          pickupDate: new Date('2026-10-06T10:00:00Z'),
          dropoffDate: new Date('2026-10-09T10:00:00Z'),
          customer: {
            firstName: 'Test',
            lastName: 'Driver',
            email: 'test@example.com',
            phone: '+61 400 000 000',
            licenseNumber: 'NSW-1234567',
          },
        }),
      ).rejects.toThrow(/unavailable for the selected dates/);
    });
  });

  describe('2. Booking Creation & Payment Integration', () => {
    it('creates a booking in PAYMENT_PENDING status and issues Razorpay order', async () => {
      const result = await bookingService.createBooking({
        vehicleId,
        pickupLocation: 'Sydney Airport Hub (SYD)',
        dropoffLocation: 'Sydney Airport Hub (SYD)',
        pickupDate: new Date('2026-10-10T10:00:00Z'),
        dropoffDate: new Date('2026-10-13T10:00:00Z'),
        customer: {
          firstName: 'Alice',
          lastName: 'Walker',
          email: 'alice.walker@example.com',
          phone: '+61 411 222 333',
          licenseNumber: 'NSW-1122334',
        },
        promoCode: 'SAVE10',
      });

      expect(result.booking).toBeDefined();
      expect(result.booking.bookingNumber).toMatch(/^NR-202\d-\d{5}$/);
      expect(result.booking.status).toBe('PAYMENT_PENDING');
      expect(result.booking.paymentStatus).toBe('PENDING');
      expect(result.booking.finalAmount).toBe(240.3);

      expect(result.paymentOrder).toBeDefined();
      expect(result.paymentOrder.orderId).toBeTruthy();
      expect(result.paymentOrder.amount).toBe(24030); // 240.3 * 100 in paise
      expect(result.paymentOrder.currency).toBe('INR');
    });

    it('confirms booking and marks payment as PAID upon verified gateway signature', async () => {
      const created = await bookingService.createBooking({
        vehicleId,
        pickupLocation: 'Sydney Airport Hub (SYD)',
        dropoffLocation: 'Sydney Airport Hub (SYD)',
        pickupDate: new Date('2026-10-15T10:00:00Z'),
        dropoffDate: new Date('2026-10-18T10:00:00Z'),
        customer: {
          firstName: 'Bob',
          lastName: 'Marley',
          email: 'bob.marley@example.com',
          phone: '+61 400 111 222',
          licenseNumber: 'QLD-9988776',
        },
      });

      const confirmed = await bookingService.confirmBookingPayment(
        created.paymentOrder.orderId,
        'pay_test_gateway_999',
      );

      expect(confirmed.status).toBe('CONFIRMED');
      expect(confirmed.paymentStatus).toBe('PAID');
      expect(confirmed.razorpayPaymentId).toBe('pay_test_gateway_999');
    });
  });

  describe('3. Booking Cancellation & Security IDOR Protection', () => {
    it('allows a customer to cancel their own booking', async () => {
      const created = await bookingService.createBooking({
        vehicleId,
        pickupLocation: 'Sydney Airport Hub (SYD)',
        dropoffLocation: 'Sydney Airport Hub (SYD)',
        pickupDate: new Date('2026-10-20T10:00:00Z'),
        dropoffDate: new Date('2026-10-23T10:00:00Z'),
        customer: {
          firstName: 'Charlie',
          lastName: 'Brown',
          email: 'charlie@example.com',
          phone: '+61 400 999 888',
          licenseNumber: 'WA-5544332',
        },
      });

      const cancelled = await bookingService.cancelBooking(
        created.booking.id,
        { reason: 'Flight got rescheduled' },
        { userId: 'charlie@example.com', role: 'CUSTOMER' },
      );

      expect(cancelled.status).toBe('CANCELLED');
      expect(cancelled.cancellationReason).toBe('Flight got rescheduled');
      expect(cancelled.cancelledAt).toBeDefined();
    });

    it('blocks Customer A from cancelling or viewing Customer B booking (IDOR Protection)', async () => {
      const created = await bookingService.createBooking({
        vehicleId,
        pickupLocation: 'Sydney Airport Hub (SYD)',
        dropoffLocation: 'Sydney Airport Hub (SYD)',
        pickupDate: new Date('2026-10-25T10:00:00Z'),
        dropoffDate: new Date('2026-10-28T10:00:00Z'),
        customer: {
          firstName: 'David',
          lastName: 'Miller',
          email: 'david.miller@example.com',
          phone: '+61 411 999 000',
          licenseNumber: 'SA-1100223',
        },
      });

      // Attacker customer tries to view
      await expect(
        bookingService.getBookingById(created.booking.id, {
          userId: 'attacker@example.com',
          role: 'CUSTOMER',
        }),
      ).rejects.toThrow('You do not have permission to view this booking');

      // Attacker customer tries to cancel
      await expect(
        bookingService.cancelBooking(
          created.booking.id,
          { reason: 'Malicious cancel' },
          { userId: 'attacker@example.com', role: 'CUSTOMER' },
        ),
      ).rejects.toThrow('You are not authorized to cancel this booking');
    });

    it('allows Admin to view and cancel any booking', async () => {
      const created = await bookingService.createBooking({
        vehicleId,
        pickupLocation: 'Sydney Airport Hub (SYD)',
        dropoffLocation: 'Sydney Airport Hub (SYD)',
        pickupDate: new Date('2026-11-01T10:00:00Z'),
        dropoffDate: new Date('2026-11-04T10:00:00Z'),
        customer: {
          firstName: 'Eva',
          lastName: 'Green',
          email: 'eva.green@example.com',
          phone: '+61 433 888 777',
          licenseNumber: 'ACT-9900112',
        },
      });

      const adminView = await bookingService.getBookingById(created.booking.id, {
        userId: 'admin-system-001',
        role: 'ADMIN',
      });
      expect(adminView.id).toBe(created.booking.id);

      const adminCancelled = await bookingService.cancelBooking(
        created.booking.id,
        { reason: 'Vehicle recall for recall safety notice' },
        { userId: 'admin-system-001', role: 'ADMIN' },
      );
      expect(adminCancelled.status).toBe('CANCELLED');
    });
  });
});
