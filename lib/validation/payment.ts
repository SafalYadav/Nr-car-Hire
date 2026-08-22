import { z } from 'zod';

export const paymentStatuses = ['CREATED', 'PENDING', 'PAID', 'FAILED', 'REFUNDED'] as const;
export type PaymentStatus = (typeof paymentStatuses)[number];

// ----------------------------------------------------
// Create Order Schema (Authoritative Server-Side Pricing)
// ----------------------------------------------------
export const CreateOrderSchema = z
  .object({
    vehicleId: z.string().min(1, 'Vehicle ID is required'),
    pickupDate: z.coerce.date({ message: 'Valid pickup date required' }),
    dropoffDate: z.coerce.date({ message: 'Valid dropoff date required' }),
    bookingId: z.string().optional(),
    currency: z.string().default('INR'),
    customer: z
      .object({
        name: z.string().min(1).max(100).optional(),
        email: z.string().email().optional(),
        phone: z.string().max(20).optional(),
      })
      .optional(),
  })
  .refine((data) => data.dropoffDate > data.pickupDate, {
    message: 'Dropoff date must be after pickup date',
    path: ['dropoffDate'],
  });

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

// ----------------------------------------------------
// Verify Payment Signature Schema
// ----------------------------------------------------
export const VerifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1, 'Razorpay Order ID is required'),
  razorpay_payment_id: z.string().min(1, 'Razorpay Payment ID is required'),
  razorpay_signature: z.string().min(1, 'Razorpay Signature is required'),
});

export type VerifyPaymentInput = z.infer<typeof VerifyPaymentSchema>;

// ----------------------------------------------------
// Webhook Payload Schema
// ----------------------------------------------------
export const WebhookPayloadSchema = z.object({
  event: z.string(),
  payload: z.record(z.string(), z.unknown()),
  created_at: z.number().optional(),
});

export type WebhookPayload = z.infer<typeof WebhookPayloadSchema>;
