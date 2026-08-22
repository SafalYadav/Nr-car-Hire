import { z } from 'zod';
import { SelectedExtraItemSchema } from './extra';

export const bookingStatuses = [
  'PENDING',
  'PAYMENT_PENDING',
  'CONFIRMED',
  'ACTIVE',
  'COMPLETED',
  'CANCELLED',
  'REFUNDED',
  'EXPIRED',
] as const;
export type BookingStatus = (typeof bookingStatuses)[number];

export const CustomerDetailsSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(8, 'Valid phone number is required').max(20),
  dateOfBirth: z.string().optional(),
  licenseNumber: z.string().min(4, 'Driver license number is required').max(50),
  licenseState: z.string().max(50).optional(),
  address: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  postalCode: z.string().max(20).optional(),
});

export type CustomerDetails = z.infer<typeof CustomerDetailsSchema>;

// ----------------------------------------------------
// Calculate Quote Request Schema
// ----------------------------------------------------
export const CalculateQuoteSchema = z
  .object({
    vehicleId: z.string().min(1, 'Vehicle ID is required'),
    pickupLocation: z.string().min(1, 'Pickup location is required'),
    dropoffLocation: z.string().min(1, 'Dropoff location is required'),
    pickupDate: z.coerce.date({ message: 'Valid pickup date required' }),
    dropoffDate: z.coerce.date({ message: 'Valid dropoff date required' }),
    pickupTime: z.string().default('10:00'),
    returnTime: z.string().default('10:00'),
    selectedExtras: z.array(SelectedExtraItemSchema).default([]),
    promoCode: z.string().optional(),
    customerId: z.string().optional(),
  })
  .refine((data) => data.dropoffDate > data.pickupDate, {
    message: 'Return date must be after pickup date.',
    path: ['dropoffDate'],
  });

export type CalculateQuoteInput = z.input<typeof CalculateQuoteSchema>;

// ----------------------------------------------------
// Create Booking Request Schema
// ----------------------------------------------------
export const CreateBookingSchema = z
  .object({
    vehicleId: z.string().min(1, 'Vehicle ID is required'),
    pickupLocation: z.string().min(1, 'Pickup location is required'),
    dropoffLocation: z.string().min(1, 'Dropoff location is required'),
    pickupDate: z.coerce.date({ message: 'Valid pickup date required' }),
    dropoffDate: z.coerce.date({ message: 'Valid dropoff date required' }),
    pickupTime: z.string().default('10:00'),
    returnTime: z.string().default('10:00'),
    customer: CustomerDetailsSchema,
    selectedExtras: z.array(SelectedExtraItemSchema).default([]),
    promoCode: z.string().optional(),
    userId: z.string().optional(),
    currency: z.string().default('INR'),
  })
  .refine((data) => data.dropoffDate > data.pickupDate, {
    message: 'Return date must be after pickup date.',
    path: ['dropoffDate'],
  });

export type CreateBookingInput = z.input<typeof CreateBookingSchema>;

// ----------------------------------------------------
// Cancel Booking Request Schema
// ----------------------------------------------------
export const CancelBookingSchema = z.object({
  reason: z.string().min(2, 'Cancellation reason is required').max(500),
});

export type CancelBookingInput = z.infer<typeof CancelBookingSchema>;

// ----------------------------------------------------
// Query Bookings Filter Schema
// ----------------------------------------------------
export const BookingQuerySchema = z.object({
  search: z.string().max(100).optional(),
  status: z.enum(bookingStatuses).or(z.literal('ALL')).optional(),
  vehicleId: z.string().optional(),
  userId: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type BookingQueryParams = z.infer<typeof BookingQuerySchema>;
